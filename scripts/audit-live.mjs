#!/usr/bin/env node
// Audit en production (pnpm audit:live) : ce que voit réellement un visiteur anonyme. Lecture seule (GET).
// Usage : node scripts/audit-live.mjs [URL_DU_SITE]
const SITE = process.argv[2] || process.env.PINO_SITE_URL || 'https://pagepino-e8e97.web.app/';
const DB = 'https://pagepino-e8e97-default-rtdb.europe-west1.firebasedatabase.app';
const API_KEY = 'AIzaSyCOrSsb3dMl-tYr9y23zCPaDu63cRn7l-k';

const results = [];
const check = (id, label, ok, detail = '') => results.push({ id, label, ok, detail });

// CHK-02 / CHK-03 : aucune donnée lisible sans session
for (const path of ['', 'users', 'leads', 'jobs', 'coupons', 'clients_records', 'audit_logs', 'mail_outbox', 'admin_notifications', 'client_notifications', 'platform_leads', 'quotes_responses']) {
  const res = await fetch(`${DB}/${path}.json?shallow=true`);
  const body = await res.text();
  const denied = res.status === 401 || /Permission denied/i.test(body);
  check('CHK-02', `Anonyme ne lit pas /${path}`, denied, denied ? '' : `HTTP ${res.status} — ${body.slice(0, 80)}…`);
}

// LECTURE SEULE : ce script n'écrit JAMAIS en production. Les refus d'écriture sont
// prouvés contre l'émulateur (pnpm test:rules), jamais par une sonde sur la vraie base.

// CHK-19 : site en ligne
{
  const t = Date.now();
  const res = await fetch(SITE).catch(() => null);
  const ms = Date.now() - t;
  const html = res ? await res.text() : '';
  check('CHK-19', `Site en ligne (${SITE})`, !!res && res.status === 200 && ms < 3000, res ? `HTTP ${res.status} en ${ms} ms` : 'injoignable');
  check('CHK-11', 'Production : 0 Tailwind CDN', !html.includes('cdn.tailwindcss.com'));
  check('CHK-08', 'Production : 0 porte dérobée dans le HTML servi', !/Pino2026|confirmAppleQuickSignIn|admin_direct/.test(html));
  check('CHK-14', 'Production : bandeau cookies présent', html.includes('id="cookie-banner"'));
}

// CHK-13 : manifeste
{
  const res = await fetch(new URL('manifest.json', SITE)).catch(() => null);
  const m = res && res.ok ? await res.json().catch(() => null) : null;
  check('CHK-13', 'Manifeste PWA servi', !!(m && m.name && m.icons?.length && m.display));
}

// État des fournisseurs d'identité (informatif pour Apple)
for (const providerId of ['google.com', 'apple.com']) {
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ providerId, continueUri: SITE }),
  });
  const body = await res.json();
  const enabled = !!body.authUri;
  if (providerId === 'google.com') check('CHK-06', 'Fournisseur Google activé', enabled, body.error?.message || '');
  else console.log(`INFO  Apple Sign-In ${enabled ? 'activé' : 'NON activé (bouton masqué : PINO_FLAGS.appleLogin=false)'}`);
}

let failed = 0;
for (const r of results) {
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.id.padEnd(7)} ${r.label}${!r.ok && r.detail ? '  → ' + r.detail : ''}`);
  if (!r.ok) failed++;
}
console.log(`\n${results.length - failed}/${results.length} contrôles en production OK`);
process.exit(failed ? 1 : 0);
