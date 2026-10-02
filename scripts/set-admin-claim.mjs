#!/usr/bin/env node
/**
 * Assigne (ou retire) le Custom Claim admin Firebase Auth.
 * Exécution locale / CI uniquement — jamais depuis le navigateur.
 *
 *   node scripts/set-admin-claim.mjs pino.espacesverts@gmail.com
 *   node scripts/set-admin-claim.mjs client@example.com --revoke --force
 *
 * Auth : GOOGLE_APPLICATION_CREDENTIALS (JSON service account) ou
 * `gcloud auth application-default login` / ADC du SDK Admin.
 * Functions restent hors Spark : ce script est le chemin v1.
 */
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const require = createRequire(import.meta.url);

const ALLOWLIST = [
  'pino.espacesverts@gmail.com',
  'pino.spacesverts@gmail.com',
  'jomstudiovzla@gmail.com',
];
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || 'pagepino-e8e97';

function loadAdmin() {
  const candidates = [
    join(root, 'functions', 'node_modules', 'firebase-admin'),
    join(root, 'node_modules', 'firebase-admin'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return require(p);
  }
  throw new Error('firebase-admin introuvable. Exécutez : pnpm --prefix functions install');
}

function parseArgs(argv) {
  const flags = new Set(argv.filter((a) => a.startsWith('--')));
  const emails = argv.filter((a) => !a.startsWith('--') && a.includes('@')).map((e) => e.trim().toLowerCase());
  return {
    emails,
    revoke: flags.has('--revoke'),
    force: flags.has('--force'),
    help: flags.has('--help') || flags.has('-h') || emails.length === 0,
  };
}

function usage() {
  console.log(`Usage:
  node scripts/set-admin-claim.mjs <email> [--revoke] [--force]

  Pose { admin: true, role: "admin" } sur le compte Firebase Auth.
  --revoke  retire le claim (role: client, admin: false)
  --force   autorise un e-mail hors liste (pino.espacesverts / pino.spacesverts / jomstudiovzla)

Prérequis: GOOGLE_APPLICATION_CREDENTIALS ou Application Default Credentials.
Voir docs/admin/PREMIER_ADMIN.md.`);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    usage();
    process.exit(opts.emails.length === 0 ? 1 : 0);
  }

  for (const email of opts.emails) {
    if (!ALLOWLIST.includes(email) && !opts.force) {
      console.error('Refusé: ' + email + ' n\'est pas dans la liste admin. Passez --force seulement si vous savez pourquoi.');
      process.exit(1);
    }
  }

  const admin = loadAdmin();
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: PROJECT_ID,
      credential: admin.credential.applicationDefault(),
    });
  }
  const auth = admin.auth();
  const claims = opts.revoke
    ? { admin: false, role: 'client' }
    : { admin: true, role: 'admin' };

  for (const email of opts.emails) {
    const user = await auth.getUserByEmail(email);
    await auth.setCustomUserClaims(user.uid, claims);
    const check = await auth.getUser(user.uid);
    const got = check.customClaims || {};
    console.log(JSON.stringify({
      ok: true,
      email: user.email,
      uid: user.uid,
      emailVerified: user.emailVerified === true,
      claims: { admin: got.admin === true, role: got.role || null },
    }));
    if (!opts.revoke && user.emailVerified !== true) {
      console.warn('Attention: e-mail non vérifié. Les règles RTDB exigent email_verified === true.');
    }
  }
  console.warn('Le jeton du navigateur ne porte le claim qu\'après getIdToken(true) ou nouvelle connexion.');
}

main().catch((err) => {
  const code = err && err.code;
  if (code === 'auth/user-not-found') {
    console.error('Aucun compte Firebase Auth pour cet e-mail. L\'utilisateur doit d\'abord s\'inscrire.');
  } else if (/Could not load the default credentials|unable to detect a Project Id/i.test(String(err))) {
    console.error('Pas de credentials Admin SDK. Exportez GOOGLE_APPLICATION_CREDENTIALS vers un JSON service account, ou lancez gcloud auth application-default login.');
    console.error('Détail: docs/admin/PREMIER_ADMIN.md');
  } else {
    console.error(err && err.message ? err.message : err);
  }
  process.exit(1);
});
