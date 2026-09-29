// Tests des règles Realtime Database contre l'émulateur (pnpm test:rules).
// Chaque test exécute de vraies lectures / écritures : aucune recherche de texte dans un fichier.
import { test, before, after, beforeEach } from 'node:test';
import { readFileSync } from 'node:fs';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import { ref, get, set, update, push, query, orderByChild, equalTo } from 'firebase/database';

const [host, port] = (process.env.FIREBASE_DATABASE_EMULATOR_HOST || '127.0.0.1:9000').split(':');
let env;

const ADMIN = { email: 'pino.espacesverts@gmail.com', email_verified: true };
const CLIENT_A = { email: 'alice@example.com', email_verified: true };
const CLIENT_B = { email: 'bob@example.com', email_verified: true };

const db = (who) => {
  if (!who) return env.unauthenticatedContext().database();
  const [uid, token] = who;
  return env.authenticatedContext(uid, token).database();
};

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-pino',
    database: { host, port: Number(port), rules: readFileSync('database.rules.json', 'utf8') },
  });
});

after(async () => { await env.cleanup(); });

beforeEach(async () => {
  await env.clearDatabase();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const d = ctx.database();
    await set(ref(d, 'users/uidA'), { uid: 'uidA', email: 'alice@example.com', role: 'client', isAdmin: false });
    await set(ref(d, 'users/uidB'), { uid: 'uidB', email: 'bob@example.com', role: 'client', isAdmin: false });
    await set(ref(d, 'leads/L1'), { id: 'L1', email: 'alice@example.com', status: 'new', source: 'web_devis', created_at: '2026-09-25' });
    await set(ref(d, 'leads/L2'), { id: 'L2', email: 'bob@example.com', status: 'new', source: 'web_devis', created_at: '2026-09-25' });
    await set(ref(d, 'jobs/J1'), { client_email: 'alice@example.com', amount_charged: 100, payment_status: 'pending' });
    await set(ref(d, 'clients_records/alice@example_com/profile'), { email: 'alice@example.com', role: 'client' });
    await set(ref(d, 'clients_records/alice@example_com/invoices/J1'), { amount_charged: 100 });
    await set(ref(d, 'coupons/uidB'), { user_id: 'uidB', email: 'bob@example.com', codigo_cupon: 'PINO-BBBB', descuento_pct: 20, estado: 'valid' });
    await set(ref(d, 'audit_logs/a1'), { action: 'connexion' });
    await set(ref(d, 'admin_notifications/n1'), { type: 'new_lead', read: false });
    await set(ref(d, 'mail_outbox/m1'), { to: 'alice@example.com', status: 'queued' });
  });
});

// ── Anonyme : zéro donnée lisible ─────────────────────────────────────────
for (const path of ['/', 'users', 'users/uidA', 'leads', 'leads/L1', 'jobs', 'coupons', 'clients_records',
  'clients_records/alice@example_com', 'audit_logs', 'admin_notifications', 'mail_outbox', 'platform_leads', 'quotes_responses']) {
  test(`anonyme ne peut pas lire /${path}`, async () => {
    await assertFails(get(ref(db(null), path)));
  });
}

test('anonyme peut déposer une demande de devis (création seule, format imposé)', async () => {
  await assertSucceeds(set(push(ref(db(null), 'leads')), {
    email: 'nouveau@example.com', status: 'new', source: 'web_devis', created_at: '2026-09-25', details: 'Haie',
  }));
});

test('anonyme ne peut pas écraser une demande existante', async () => {
  await assertFails(set(ref(db(null), 'leads/L1'), { email: 'x@example.com', status: 'new', source: 'web_devis', created_at: 'x' }));
});

test('anonyme ne peut pas créer une demande avec un statut forgé', async () => {
  await assertFails(set(push(ref(db(null), 'leads')), { email: 'a@example.com', status: 'Gagné', source: 'web_devis', created_at: 'x' }));
});

test('anonyme ne peut pas écrire dans le dossier client d\'autrui', async () => {
  await assertFails(set(ref(db(null), 'clients_records/alice@example_com/quotes/X'), { hack: true }));
});

test('anonyme ne peut pas vider les journaux d\'audit', async () => {
  await assertFails(set(ref(db(null), 'audit_logs'), null));
});

// ── Admin : e-mail vérifié obligatoire ────────────────────────────────────
test('admin vérifié lit tous les utilisateurs', async () => {
  await assertSucceeds(get(ref(db(['adminUid', ADMIN]), 'users')));
});

test('admin NON vérifié est refusé', async () => {
  await assertFails(get(ref(db(['adminUid', { ...ADMIN, email_verified: false }]), 'users')));
});

test('deuxième adresse admin (pino.spacesverts) a bien accès admin', async () => {
  await assertSucceeds(get(ref(db(['x', { email: 'pino.spacesverts@gmail.com', email_verified: true }]), 'users')));
});

test('admin vérifié modifie une facture', async () => {
  await assertSucceeds(update(ref(db(['adminUid', ADMIN]), 'jobs/J1'), { payment_status: 'paid' }));
});

// ── Clients : cloisonnement strict ─────────────────────────────────────────
test('client lit son propre profil', async () => {
  await assertSucceeds(get(ref(db(['uidA', CLIENT_A]), 'users/uidA')));
});

test('client ne lit pas le profil d\'un autre client', async () => {
  await assertFails(get(ref(db(['uidA', CLIENT_A]), 'users/uidB')));
});

test('client ne lit pas la liste complète des utilisateurs', async () => {
  await assertFails(get(ref(db(['uidA', CLIENT_A]), 'users')));
});

test('client ne peut pas s\'auto-promouvoir admin', async () => {
  await assertFails(update(ref(db(['uidA', CLIENT_A]), 'users/uidA'), { role: 'admin', isAdmin: true }));
});

test('client lit ses devis via la requête filtrée sur son e-mail', async () => {
  const snap = await assertSucceeds(get(query(ref(db(['uidA', CLIENT_A]), 'leads'), orderByChild('email'), equalTo('alice@example.com'))));
  const keys = Object.keys(snap.val() || {});
  if (keys.length !== 1 || keys[0] !== 'L1') throw new Error('résultat inattendu: ' + keys.join(','));
});

test('client ne peut pas interroger les devis d\'un autre e-mail', async () => {
  await assertFails(get(query(ref(db(['uidA', CLIENT_A]), 'leads'), orderByChild('email'), equalTo('bob@example.com'))));
});

test('client ne lit pas le devis d\'un autre client', async () => {
  await assertFails(get(ref(db(['uidA', CLIENT_A]), 'leads/L2')));
});

test('client lit son dossier clients_records', async () => {
  await assertSucceeds(get(ref(db(['uidA', CLIENT_A]), 'clients_records/alice@example_com')));
});

test('client ne lit pas le dossier d\'un autre client', async () => {
  await assertFails(get(ref(db(['uidB', CLIENT_B]), 'clients_records/alice@example_com')));
});

test('client ne peut pas modifier ses propres factures', async () => {
  await assertFails(update(ref(db(['uidA', CLIENT_A]), 'clients_records/alice@example_com/invoices/J1'), { amount_charged: 0 }));
  await assertFails(update(ref(db(['uidA', CLIENT_A]), 'jobs/J1'), { payment_status: 'paid' }));
});

test('client non vérifié ne lit pas son dossier', async () => {
  await assertFails(get(ref(db(['uidA', { ...CLIENT_A, email_verified: false }]), 'clients_records/alice@example_com')));
});

// ── Coupons : validés côté serveur par les règles ──────────────────────────
const validCoupon = { user_id: 'uidA', email: 'alice@example.com', codigo_cupon: 'PINO-AAAA', descuento_pct: 20, estado: 'valid', created_at: 'x' };

test('client vérifié crée son coupon -20 % une seule fois', async () => {
  await assertSucceeds(set(ref(db(['uidA', CLIENT_A]), 'coupons/uidA'), validCoupon));
  await assertFails(set(ref(db(['uidA', CLIENT_A]), 'coupons/uidA'), validCoupon));
});

test('client ne peut pas gonfler la remise', async () => {
  await assertFails(set(ref(db(['uidA', CLIENT_A]), 'coupons/uidA'), { ...validCoupon, descuento_pct: 90 }));
});

test('client ne peut pas réactiver un coupon utilisé', async () => {
  await assertFails(update(ref(db(['uidB', CLIENT_B]), 'coupons/uidB'), { estado: 'valid', descuento_pct: 50 }));
});

test('client ne peut pas créer un coupon pour un autre compte', async () => {
  await assertFails(set(ref(db(['uidA', CLIENT_A]), 'coupons/uidB2'), { ...validCoupon, user_id: 'uidB2' }));
});

test('client non vérifié ne peut pas obtenir de coupon', async () => {
  await assertFails(set(ref(db(['uidA', { ...CLIENT_A, email_verified: false }]), 'coupons/uidA'), validCoupon));
});

test('client ne lit pas le coupon d\'un autre', async () => {
  await assertFails(get(ref(db(['uidA', CLIENT_A]), 'coupons/uidB')));
});

test('coupon single-use : canje valid->used une seule fois, anti-rejeu et anti-manipulation', async () => {
  const dbB = db(['uidB', CLIENT_B]);
  // On ne peut pas gonfler la remise au moment du canje
  await assertFails(update(ref(dbB, 'coupons/uidB'), { estado: 'used', descuento_pct: 90 }));
  // Canje légitime valid -> used (une fois)
  await assertSucceeds(update(ref(dbB, 'coupons/uidB'), { estado: 'used', redeemed_at: '2026-09-29' }));
  // Rejeu / ré-application bloqués (déjà used) — protège des scripts externes qui répètent l'action
  await assertFails(update(ref(dbB, 'coupons/uidB'), { estado: 'used' }));
  // Impossible de le réactiver
  await assertFails(update(ref(dbB, 'coupons/uidB'), { estado: 'valid' }));
});

// ── Notifications / file d'e-mails ─────────────────────────────────────────
test('client ne lit pas les notifications admin ni la file d\'e-mails', async () => {
  await assertFails(get(ref(db(['uidA', CLIENT_A]), 'admin_notifications')));
  await assertFails(get(ref(db(['uidA', CLIENT_A]), 'mail_outbox')));
});

test('client ne peut pas effacer les notifications admin', async () => {
  await assertFails(set(ref(db(['uidA', CLIENT_A]), 'admin_notifications'), null));
  await assertFails(set(ref(db(['uidA', CLIENT_A]), 'admin_notifications/n1'), null));
});

test('client lit uniquement ses propres notifications', async () => {
  await assertSucceeds(get(ref(db(['uidA', CLIENT_A]), 'client_notifications/alice@example_com')));
  await assertFails(get(ref(db(['uidA', CLIENT_A]), 'client_notifications/bob@example_com')));
});
