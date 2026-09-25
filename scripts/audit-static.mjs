#!/usr/bin/env node
// Audit statique du code livré (pnpm audit:static). Code de sortie ≠ 0 si un contrôle échoue.
import { readFileSync, existsSync } from 'node:fs';

const SHIPPED = ['index.html', 'assets/js/firebase-config.js', 'assets/js/pino-db.js', 'sw.js', 'manifest.json'];
const code = SHIPPED.map((f) => [f, readFileSync(f, 'utf8')]);
const rules = JSON.parse(readFileSync('database.rules.json', 'utf8'));
const results = [];
const check = (id, label, ok, detail = '') => results.push({ id, label, ok, detail });
const grep = (re) => code.flatMap(([f, s]) => (s.match(re) || []).map((m) => `${f}: ${m}`));

// CHK-08 : portes dérobées
const backdoors = grep(/Pino2026|admin_direct|password_local|email_activated|confirmAppleQuickSignIn|confirmGoogleQuickSignIn|confirmApplePrivateRelaySignIn|privaterelay\.appleid\.com/g);
check('CHK-08', '0 porte dérobée (mot de passe de secours, Apple/Google simulés, comptes locaux)', backdoors.length === 0, backdoors.join('\n'));

// CHK-09 : email_verified imposé dans les règles et le front
const rulesText = JSON.stringify(rules);
check('CHK-09', 'email_verified exigé (règles + front)',
  rulesText.includes('email_verified === true') && grep(/emailVerified/g).length > 0);

// CHK-01 (statique) : refus par défaut + aucune branche publique en lecture
const publicReads = [];
(function walk(node, path) {
  for (const [k, v] of Object.entries(node)) {
    if (k === '.read' && v !== false && !String(v).includes('auth != null')) publicReads.push(path || '/');
    if (v && typeof v === 'object') walk(v, `${path}/${k}`);
  }
})(rules.rules, '');
check('CHK-01', 'Règles : lecture refusée par défaut, aucune lecture sans auth', rules.rules['.read'] === false && publicReads.length === 0, publicReads.join(', '));

// CHK-10 : localhost
const lh = grep(/localhost:(5500|8080)|127\.0\.0\.1:8080/g);
check('CHK-10', '0 localhost:5500 / :8080 dans le code livré', lh.length === 0, lh.join('\n'));

// CHK-11 : Tailwind CDN
const tw = grep(/cdn\.tailwindcss\.com/g);
check('CHK-11', '0 Tailwind CDN', tw.length === 0 && existsSync('assets/css/tailwind.min.css'), tw.join('\n'));

// CHK-16 : CSP
const csp = (readFileSync('index.html', 'utf8').match(/http-equiv="Content-Security-Policy" content="([^"]*)"/) || [])[1] || '';
check('CHK-16', 'CSP : pas de unsafe-eval, Maps autorisé, pas de localhost',
  !csp.includes('unsafe-eval') && csp.includes('https://maps.google.com') && !/localhost|127\.0\.0\.1/.test(csp));

// Appels à des API inexistantes en production (405 sur hébergement statique)
const apis = grep(/fetch\(\s*['"`]\/api\//g);
check('CHK-04/05', '0 appel à /api/* (inexistant sur hébergement statique)', apis.length === 0, apis.join('\n'));

// Données de démonstration
const demo = grep(/Jean-Christophe|jc\.bernard|Valérie Mercier|plt_seed_\d['"]/g);
check('P1-06', '0 donnée de démonstration codée en dur', demo.length === 0, demo.join('\n'));

// CHK-13 : manifeste
const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
check('CHK-13', 'Manifeste PWA (name, icons, display)', !!(manifest.name && manifest.icons?.length && manifest.display));

// Secrets
const secrets = grep(/service_role|SERVICE_ROLE|-----BEGIN (RSA )?PRIVATE KEY|GOCSPX-[A-Za-z0-9_-]+/g);
check('SEC', '0 secret serveur dans le code client', secrets.length === 0, secrets.join('\n'));

// Liste admin identique front / règles
const frontAdmins = (readFileSync('index.html', 'utf8').match(/const ADMIN_EMAILS = \[([^\]]*)\]/) || [])[1] || '';
const ruleAdmins = [...new Set(rulesText.match(/auth\.token\.email === '([^']+)'/g).map((m) => m.split("'")[1]))].sort();
const front = frontAdmins.split(',').map((s) => s.trim().replace(/'/g, '')).filter(Boolean).sort();
check('ADM', 'Liste admin identique (front = règles)', JSON.stringify(front) === JSON.stringify(ruleAdmins), `front=${front} règles=${ruleAdmins}`);

let failed = 0;
for (const r of results) {
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.id.padEnd(9)} ${r.label}`);
  if (!r.ok) { failed++; if (r.detail) console.log('      ' + r.detail.split('\n').join('\n      ')); }
}
console.log(`\n${results.length - failed}/${results.length} contrôles statiques OK`);
process.exit(failed ? 1 : 0);
