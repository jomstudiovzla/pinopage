#!/usr/bin/env node
// Audit statique du code livré (pnpm audit:static). Code de sortie ≠ 0 si un contrôle échoue.
import { readFileSync, existsSync } from 'node:fs';

const SHIPPED = ['index.html', 'assets/js/firebase-config.js', 'assets/js/pino-auth-errors.js', 'assets/js/pino-errors.js', 'assets/js/pino-admin.js', 'assets/js/pino-auth-google.js', 'assets/js/pino-ba-slider.js', 'assets/js/pino-db.js', 'sw.js', 'manifest.json'];
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

const thirdPartyMail = grep(/formsubmit\.co|api\.web3forms\.com/gi);
check('MAIL-01', '0 FormSubmit / Web3Forms dans le client livré', thirdPartyMail.length === 0, thirdPartyMail.join('\n'));
check('MAIL-02', 'CSP form-action self, Worker mail autorisé',
  csp.includes("form-action 'self'") && !csp.includes('formsubmit') && !csp.includes('web3forms') && csp.includes('pino-mail.pinoespacesverts.online'));

const authErr = existsSync('assets/js/pino-auth-errors.js') ? readFileSync('assets/js/pino-auth-errors.js', 'utf8') : '';
const indexHtml = readFileSync('index.html', 'utf8');
check('AUTH-01', 'Messages Auth FR par code + téléphone optionnel à l\'inscription',
  authErr.includes('auth/email-already-in-use') &&
  authErr.includes('auth/operation-not-allowed') &&
  authErr.includes('auth/unauthorized-domain') &&
  indexHtml.includes('pino-auth-errors.js') &&
  indexHtml.includes('_pinoRegisterBusy') &&
  !/!email \|\| !phone \|\| !pass/.test(indexHtml),
  'mapper + script + lock anti double-envoi');

const googleJs = existsSync('assets/js/pino-auth-google.js') ? readFileSync('assets/js/pino-auth-google.js', 'utf8') : '';
const swJs = readFileSync('sw.js', 'utf8');
check('AUTH-02', 'Google : redirect mobile + getRedirectResult singleton',
  googleJs.includes('shouldUseRedirectAuth') &&
  googleJs.includes('pino_auth_redirect_pending') &&
  indexHtml.includes('pino-auth-google.js') &&
  indexHtml.includes('pinoConsumeRedirectResult') &&
  indexHtml.includes('pinoBeginFederatedSignIn') &&
  indexHtml.includes('_pinoGoogleBusy') &&
  swJs.includes('pino-auth-google.js') &&
  swJs.includes('pino-ev-v47-admin'),
  'helper + wiring index + SW v47');

const baJs = existsSync('assets/js/pino-ba-slider.js') ? readFileSync('assets/js/pino-ba-slider.js', 'utf8') : '';
check('UI-01', 'Slider avant/après : instance par curseur + boutons prev/next',
  baJs.includes('initBaSlider') &&
  baJs.includes('initBaSliderWithNav') &&
  indexHtml.includes('pino-ba-slider.js') &&
  indexHtml.includes('galerie-ba-prev') &&
  indexHtml.includes('lightbox-prev') &&
  indexHtml.includes('switchSeason') &&
  swJs.includes('pino-ba-slider.js') &&
  swJs.includes('pino-ev-v47-admin'),
  'helper + nav galerie/lightbox + SW v47');

// Données de démonstration
const demo = grep(/Jean-Christophe|jc\.bernard|Valérie Mercier|plt_seed_\d['"]/g);
check('P1-06', '0 donnée de démonstration codée en dur', demo.length === 0, demo.join('\n'));

// CHK-13 : manifeste
const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
check('CHK-13', 'Manifeste PWA (name, icons, display)', !!(manifest.name && manifest.icons?.length && manifest.display));

// Secrets
const secrets = grep(/service_role|SERVICE_ROLE|-----BEGIN (RSA )?PRIVATE KEY|GOCSPX-[A-Za-z0-9_-]+/g);
check('SEC', '0 secret serveur dans le code client', secrets.length === 0, secrets.join('\n'));

// Liste admin identique helper / règles
const adminJs = existsSync('assets/js/pino-admin.js') ? readFileSync('assets/js/pino-admin.js', 'utf8') : '';
const frontAdmins = (adminJs.match(/ADMIN_EMAILS\s*=\s*\[([^\]]*)\]/) || [])[1] || '';
const ruleAdmins = [...new Set((rulesText.match(/auth\.token\.email === '([^']+)'/g) || []).map((m) => m.split("'")[1]))].sort();
const front = frontAdmins.split(',').map((s) => s.trim().replace(/'/g, '')).filter(Boolean).sort();
check('ADM', 'Liste admin identique (helper = règles)', JSON.stringify(front) === JSON.stringify(ruleAdmins), `front=${front} règles=${ruleAdmins}`);

// FASE 4 — URLs OAuth Consent Screen (privacy / CGV) hors SPA
const hosting = JSON.parse(readFileSync('firebase.json', 'utf8')).hosting;
const rewriteSources = (hosting.rewrites || []).map((r) => r.source);
const catchIdx = rewriteSources.indexOf('**');
const privacyIdx = rewriteSources.indexOf('/politique-de-confidentialite');
const termsIdx = rewriteSources.indexOf('/conditions-generales');
check('OAUTH-01', 'Rewrites privacy/CGV (sans catch-all SPA, ou avant **)',
  privacyIdx >= 0 && termsIdx >= 0 && (catchIdx === -1 || (catchIdx > privacyIdx && catchIdx > termsIdx)),
  `sources=${rewriteSources.join(' | ')}`);

const errJs = existsSync('assets/js/pino-errors.js') ? readFileSync('assets/js/pino-errors.js', 'utf8') : '';
const flagsSrc = readFileSync('assets/js/firebase-config.js', 'utf8');
check('ERR-01', 'Couche erreurs globale FR (toast textContent, 404/500, maintenance off)',
  errJs.includes("addEventListener('error'") &&
  errJs.includes('unhandledrejection') &&
  errJs.includes('textContent') &&
  !/innerHTML\s*=/.test(errJs) &&
  indexHtml.includes('pino-errors.js') &&
  swJs.includes('pino-errors.js') &&
  flagsSrc.includes('maintenance: false') &&
  existsSync('public/404.html') &&
  existsSync('public/500.html') &&
  existsSync('public/maintenance.html'),
  'handlers + pages + flag');

const rgpdHtml = readFileSync('public/legal/rgpd.html', 'utf8');
const cgvHtml = readFileSync('public/legal/cgv.html', 'utf8');
check('OAUTH-02', 'Canonicales privacy/CGV sur pinoespacesverts.online',
  rgpdHtml.includes('https://pinoespacesverts.online/politique-de-confidentialite')
  && cgvHtml.includes('https://pinoespacesverts.online/conditions-generales'));

const sitemap = readFileSync('public/sitemap.xml', 'utf8');
const homeHtml = readFileSync('index.html', 'utf8');
check('OAUTH-03', 'Sitemap + footer pointent vers les URLs OAuth',
  sitemap.includes('pinoespacesverts.online/politique-de-confidentialite')
  && sitemap.includes('pinoespacesverts.online/conditions-generales')
  && homeHtml.includes('href="/politique-de-confidentialite"')
  && homeHtml.includes('href="/conditions-generales"'));

check('OAUTH-04', 'Guide Google Auth Platform + logo 120×120',
  existsSync('docs/auth/OAUTH_CONSENT_SCREEN.md') && existsSync('assets/logo/oauth-consent-120.png'));

const adminRewrite = (hosting.rewrites || []).some((r) => r.source === '/admin' && r.destination === '/index.html');
check('ADM-01', 'Route /admin SPA + 403 + claims RTDB + CLI (sans catch-all)',
  adminRewrite &&
  catchIdx === -1 &&
  existsSync('public/403.html') &&
  existsSync('scripts/set-admin-claim.mjs') &&
  existsSync('docs/admin/PREMIER_ADMIN.md') &&
  adminJs.includes('hasAdminClaim') &&
  adminJs.includes('decideAdminRoute') &&
  indexHtml.includes('pino-admin.js') &&
  indexHtml.includes('pinoApplyAdminRouteGuard') &&
  swJs.includes('pino-admin.js') &&
  swJs.includes('pino-ev-v47-admin') &&
  rulesText.includes("auth.token.admin === true") &&
  rulesText.includes("auth.token.role === 'admin'") &&
  !/setCustomUserClaims/.test(indexHtml),
  'rewrite /admin, 403.html, claims, CLI, pas d\'auto-promotion client');

const firestoreSdk = grep(/firebase\.firestore|initializeFirestore|getFirestore/g);
const modelo = existsSync('docs/data/MODELO_RTDB_V1.md');
const adr0006 = existsSync('docs/adr/0006-rtdb-pas-firestore-v1.md');
const noOpenWrite = !rulesText.includes('if true');
const usersBlockAdminField = rulesText.includes("newData.child('admin').val() !== true");
const leadFreeze = rulesText.includes("data.child('status').val() === newData.child('status').val()")
  && rulesText.includes("data.child('source').val() === newData.child('source').val()");
const auditSession = rulesText.includes("newData.child('sessionUser').val() === auth.token.email");
const mailIndex = Array.isArray(rules.rules.mail_outbox && rules.rules.mail_outbox['.indexOn'])
  && rules.rules.mail_outbox['.indexOn'].includes('status')
  && rules.rules.mail_outbox['.indexOn'].includes('created_at');
const noInventedTrees = !rulesText.includes('siteSettings') && !rulesText.includes('gardenCalendar');
check('DATA-01', 'Modèle RTDB v1 (pas Firestore live, deny default, gaps FASE 8)',
  modelo && adr0006 && firestoreSdk.length === 0 && noOpenWrite
  && rules.rules['.read'] === false && rules.rules['.write'] === false
  && usersBlockAdminField && leadFreeze && auditSession && mailIndex && noInventedTrees,
  firestoreSdk.join('\n') || 'MODELO + ADR 0006 + users.admin + lead freeze + audit sessionUser + mail indexOn');

const matriz = existsSync('docs/qa/MATRIZ_FASE9.md') ? readFileSync('docs/qa/MATRIZ_FASE9.md', 'utf8') : '';
const qaIds = Array.from({ length: 25 }, (_, i) => `QA-${String(i + 1).padStart(2, '0')}`);
const helpersSrc = existsSync('tests/e2e/helpers.mjs') ? readFileSync('tests/e2e/helpers.mjs', 'utf8') : '';
check('F9-01', 'Matrice QA FASE 9 (25 flux + spec e2e + stub mail)',
  existsSync('docs/qa/MATRIZ_FASE9.md')
  && existsSync('docs/qa/CHECKLIST_FASE9.md')
  && existsSync('tests/e2e/qa-fase9.spec.mjs')
  && qaIds.every((id) => matriz.includes(id))
  && helpersSrc.includes('stubMailWorker')
  && helpersSrc.includes('pino-mail'),
  'MATRIZ + CHECKLIST + qa-fase9.spec + stub Worker (pas de POST live)');

let failed = 0;
for (const r of results) {
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.id.padEnd(9)} ${r.label}`);
  if (!r.ok) { failed++; if (r.detail) console.log('      ' + r.detail.split('\n').join('\n      ')); }
}
console.log(`\n${results.length - failed}/${results.length} contrôles statiques OK`);
process.exit(failed ? 1 : 0);
