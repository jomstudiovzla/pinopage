#!/usr/bin/env node
/**
 * scripts/export-rtdb-to-supabase.mjs
 * Hito 1 — Exportar datos RTDB (leads + coupons) a Supabase Postgres.
 *
 * Pasos:
 *  1. Lee /leads y /coupons de Firebase RTDB con el SDK Admin.
 *  2. Genera un CSV de verificación en exports/ (gitignored).
 *  3. Inserta en Supabase via REST (service_role). Idempotente (upsert).
 *
 * Requisitos locales:
 *   GOOGLE_APPLICATION_CREDENTIALS=/ruta/service-account.json
 *   SUPABASE_URL=https://xxxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
 *   RTDB_URL=https://pagepino-e8e97-default-rtdb.europe-west1.firebasedatabase.app
 *
 * Uso:
 *   node scripts/export-rtdb-to-supabase.mjs --dry-run   # solo CSV, no inserta
 *   node scripts/export-rtdb-to-supabase.mjs             # CSV + upsert Supabase
 */

import { initializeApp, cert, getApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { createWriteStream, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const EXPORTS_DIR = join(ROOT, 'exports');

// ─── Config ──────────────────────────────────────────────────────────────────
const DRY_RUN = process.argv.includes('--dry-run');
const RTDB_URL = process.env.RTDB_URL ||
  'https://pagepino-e8e97-default-rtdb.europe-west1.firebasedatabase.app';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!DRY_RUN && (!SUPABASE_URL || !SUPABASE_KEY)) {
  console.error('❌ SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY requeridos (o usa --dry-run)');
  process.exit(1);
}

// ─── Firebase Admin ───────────────────────────────────────────────────────────
let app;
try { app = getApp(); } catch { app = initializeApp({ credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS), databaseURL: RTDB_URL }); }
const db = getDatabase(app);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function rtdbSnapshot(path) {
  return db.ref(path).once('value').then(s => s.val() || {});
}

function toCsvLine(fields) {
  return fields.map(f => `"${String(f ?? '').replace(/"/g, '""')}"`).join(',');
}

function writeCsv(filename, headers, rows) {
  mkdirSync(EXPORTS_DIR, { recursive: true });
  const stream = createWriteStream(join(EXPORTS_DIR, filename));
  stream.write(headers.join(',') + '\n');
  for (const row of rows) stream.write(toCsvLine(row) + '\n');
  stream.end();
  console.log(`📄 CSV: exports/${filename} (${rows.length} filas)`);
}

async function supabaseUpsert(table, rows, onConflict) {
  if (!rows.length) return;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=${onConflict}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'apikey': SUPABASE_KEY,
      'Prefer': 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase ${table} upsert failed (${res.status}): ${err}`);
  }
  const data = await res.json();
  console.log(`✅ Supabase ${table}: ${data.length} filas insertadas/actualizadas`);
  return data;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('════════════════════════════════════════');
  console.log(' PINO — Exportación RTDB → Supabase');
  console.log(` Modo: ${DRY_RUN ? 'DRY RUN (solo CSV)' : 'PRODUCCIÓN (CSV + upsert)'}`);
  console.log('════════════════════════════════════════');

  // ── 1. Leads (/leads) ──────────────────────────────────────────────────────
  console.log('\n1/3 — Leyendo /leads de RTDB...');
  const rtdbLeads = await rtdbSnapshot('/leads');
  const leadKeys = Object.keys(rtdbLeads);
  console.log(`   ${leadKeys.length} leads encontrados`);

  const leadRows = leadKeys.map(key => {
    const l = rtdbLeads[key];
    return {
      // Mapeo RTDB → Supabase leads
      rtdb_key:          key,
      lead_type:         'b2c',
      source:            l.source || 'web_devis',
      status:            l.status || 'new',
      full_name:         l.name || l.full_name || null,
      email:             l.email || null,
      phone:             l.phone || l.tel || null,
      commune:           l.commune || l.ville || null,
      garden_description: l.message || l.description || null,
      promo_code:        l.promo_code || null,
      created_at:        l.created_at || l.timestamp
                           ? new Date(l.created_at || l.timestamp).toISOString()
                           : new Date().toISOString(),
    };
  });

  writeCsv('leads_export.csv',
    ['rtdb_key','lead_type','source','status','full_name','email','phone','commune','garden_description','promo_code','created_at'],
    leadRows.map(r => [r.rtdb_key,r.lead_type,r.source,r.status,r.full_name,r.email,r.phone,r.commune,r.garden_description,r.promo_code,r.created_at])
  );

  // ── 2. Coupons (/coupons) → promotions ────────────────────────────────────
  console.log('\n2/3 — Leyendo /coupons de RTDB...');
  const rtdbCoupons = await rtdbSnapshot('/coupons');
  const couponKeys = Object.keys(rtdbCoupons);
  console.log(`   ${couponKeys.length} cupones encontrados`);

  const couponRows = couponKeys.map(uid => {
    const c = rtdbCoupons[uid];
    return {
      rtdb_uid:        uid,
      code:            c.code || `PINO-${uid.slice(-6).toUpperCase()}`,
      discount_pct:    c.discount || c.discount_pct || 20,
      status:          c.status === 'used' ? 'redeemed' : 'active',
      max_redemptions: 1,
      redeemed_at:     c.redeemed_at ? new Date(c.redeemed_at).toISOString() : null,
      created_at:      c.created_at ? new Date(c.created_at).toISOString() : new Date().toISOString(),
    };
  });

  writeCsv('coupons_export.csv',
    ['rtdb_uid','code','discount_pct','status','max_redemptions','redeemed_at','created_at'],
    couponRows.map(r => [r.rtdb_uid,r.code,r.discount_pct,r.status,r.max_redemptions,r.redeemed_at,r.created_at])
  );

  // ── 3. Verificación ────────────────────────────────────────────────────────
  console.log('\n3/3 — Verificación de integridad:');
  const leadsWithEmail = leadRows.filter(r => r.email).length;
  const leadsWithoutEmail = leadRows.length - leadsWithEmail;
  console.log(`   Leads con email: ${leadsWithEmail}`);
  console.log(`   Leads sin email: ${leadsWithoutEmail} (se importan igualmente)`);
  console.log(`   Cupones activos: ${couponRows.filter(r => r.status === 'active').length}`);
  console.log(`   Cupones usados: ${couponRows.filter(r => r.status === 'redeemed').length}`);

  if (DRY_RUN) {
    console.log('\n⏭️  DRY RUN — No se insertó nada en Supabase.');
    console.log('   Revisa exports/leads_export.csv y exports/coupons_export.csv.');
    console.log('   Cuando estés listo: node scripts/export-rtdb-to-supabase.mjs');
    process.exit(0);
  }

  // ── 4. Upsert en Supabase ──────────────────────────────────────────────────
  console.log('\n🚀 Insertando en Supabase...');

  // Leads → tabla leads (sin rtdb_key en el schema, usamos email+created_at como deduplicación)
  // Añadimos rtdb_key como campo extra si la tabla tiene columna extra_data jsonb
  const supabaseLeads = leadRows.map(({ rtdb_key, ...rest }) => ({
    ...rest,
    // Guardamos la clave RTDB en garden_description como sufijo para trazabilidad
    garden_description: rest.garden_description
      ? `${rest.garden_description} [rtdb:${rtdb_key}]`
      : `[rtdb:${rtdb_key}]`,
  }));

  await supabaseUpsert('leads', supabaseLeads, 'email');

  // Cupones → tabla promotions (debe existir; si no, solo CSV)
  // La tabla promotions tiene: id, code, discount_pct, max_redemptions, status, created_at
  const supabaseCoupons = couponRows.map(({ rtdb_uid, ...rest }) => rest);
  await supabaseUpsert('promotions', supabaseCoupons, 'code');

  console.log('\n════════════════════════════════════════');
  console.log(' ✅ Exportación completada.');
  console.log(' RTDB queda en modo read-only (reglas sin cambiar).');
  console.log(' Verificar: recuento filas origen = destino.');
  console.log('════════════════════════════════════════');

  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
