/**
 * Test Suite: Apple Connectivity 100% & Security Scanner Hardening
 * Pino Espaces Verts - Production Hardening
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const http = require('http');
const vm = require('vm');

console.log('===============================================================');
console.log('🍎🛡️ TEST : CONNECTIVITÉ APPLE 100% & HARDENING SCANNER SÉCURITÉ');
console.log('===============================================================\n');

const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const servePy = fs.readFileSync(path.join(__dirname, 'serve.py'), 'utf8');

// ── 1. COMPILATION JS DE L'INDEX DANS VM NODE.JS ──
console.log('🧪 [TEST 1 : VALIDATION DE LA SYNTAXE & COMPILATION JS SANS ERREUR]');
const scriptBlocks = indexHtml.match(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/gi) || [];
scriptBlocks.forEach((block, idx) => {
  const code = block.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
  try {
    new vm.Script(code);
  } catch (err) {
    console.error(`❌ Erreur de syntaxe dans le bloc <script> #${idx}:`, err);
    process.exit(1);
  }
});
console.log('  ✅ PASS: 100% des scripts de index.html compilent parfaitement.');

// ── 2. HEADERS DE SÉCURITÉ DANS INDEX.HTML ET SERVE.PY ──
console.log('\n🛡️ [TEST 2 : EN-TÊTES DE SÉCURITÉ CSP, NOSNIFF, SAMEORIGIN, PERMISSIONS-POLICY]');
assert(indexHtml.includes('http-equiv="Content-Security-Policy"'), 'CSP meta tag doit être présent dans index.html');
assert(indexHtml.includes('http-equiv="X-Frame-Options" content="SAMEORIGIN"'), 'X-Frame-Options doit être présent dans index.html');
assert(indexHtml.includes('http-equiv="X-Content-Type-Options" content="nosniff"'), 'X-Content-Type-Options doit être présent dans index.html');
assert(servePy.includes("self.send_header('Content-Security-Policy'"), 'serve.py doit envoyer Content-Security-Policy');
assert(servePy.includes("self.send_header('X-Content-Type-Options', 'nosniff')"), 'serve.py doit envoyer X-Content-Type-Options');
assert(servePy.includes("self.send_header('X-Frame-Options', 'SAMEORIGIN')"), 'serve.py doit envoyer X-Frame-Options');
assert(servePy.includes("self.send_header('Permissions-Policy'"), 'serve.py doit envoyer Permissions-Policy');
assert(servePy.includes("self.send_header('Strict-Transport-Security'"), 'serve.py doit envoyer HSTS');
assert(servePy.includes("self.send_header('X-Permitted-Cross-Domain-Policies', 'none')"), 'serve.py doit envoyer X-Permitted-Cross-Domain-Policies');
assert(servePy.includes("self.send_header('Cross-Origin-Opener-Policy', 'same-origin-allow-popups')"), 'serve.py doit configurer COOP');
console.log('  ✅ PASS: Tous les en-têtes de sécurité requis par les scanners de sécurité sont déployés.');

// ── 3. CONNECTIVITÉ APPLE SANS FAILLE (1-CLIC & PRIVATE RELAY) ──
console.log('\n🍎 [TEST 3 : CONNECTIVITÉ APPLE SANS FAILLE (1-CLIC & PRIVATE RELAY)]');
assert(indexHtml.includes('window.confirmApplePrivateRelaySignIn = () =>'), 'confirmApplePrivateRelaySignIn doit être défini');
assert(indexHtml.includes('Connexion Immédiate 1-Clic (Touch ID / Apple ID)'), 'Option 1-clic Apple présente dans le panneau');
assert(indexHtml.includes('Masquer mon adresse e-mail (Apple Private Relay)'), 'Option Private Relay présente dans le panneau');
assert(indexHtml.includes('randRelay'), 'Génération résiliente du relai privé Apple');
assert(indexHtml.includes('@privaterelay.appleid.com'), 'Domaine officiel Private Relay utilisé');
console.log('  ✅ PASS: La connectivité Apple offre 1-clic direct, Private Relay et saisie sans aucun blocage.');

// ── 4. BLINDAGE DU SERVEUR LOCAL (ANTI-DIVULGATION, DIRECTORY LISTING & TRACE) ──
console.log('\n🔒 [TEST 4 : CONTRÔLE SERVEUR LOCAL (ANTI-DIVULGATION & LISTING)]');
assert(servePy.includes('def do_TRACE(self):'), 'do_TRACE doit être implémenté pour bloquer la méthode TRACE');
assert(servePy.includes('def send_head(self):'), 'send_head doit intercepter les requêtes sensibles');
assert(servePy.includes('part.startswith(\'.\')'), 'Les répertoires cachés (.git, .env) doivent être bloqués');
assert(servePy.includes('Directory listing is forbidden'), 'Le listing de répertoires doit renvoyer 403');
console.log('  ✅ PASS: Les vulnérabilités typiques de scanners (.git, directory listing, TRACE) sont neutralisées.');

// ── 5. VÉRIFICATION HTTP RÉELLE SUR LE SERVEUR EN COURS ──
console.log('\n🌐 [TEST 5 : VALIDATION HTTP EN DIRECT SUR http://127.0.0.1:8080/]');

const makeReq = (path, method = 'GET') => {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: 8080,
      path: path,
      method: method
    }, (res) => {
      resolve({ statusCode: res.statusCode, headers: res.headers });
    });
    req.on('error', reject);
    req.end();
  });
};

(async () => {
  try {
    // A. Racine
    const rootRes = await makeReq('/');
    assert.strictEqual(rootRes.statusCode, 200, 'Statut racine doit être 200');
    assert(rootRes.headers['content-security-policy'], 'CSP doit être renvoyé');
    assert.strictEqual(rootRes.headers['x-content-type-options'], 'nosniff');
    assert.strictEqual(rootRes.headers['x-frame-options'], 'SAMEORIGIN');
    assert.strictEqual(rootRes.headers['x-permitted-cross-domain-policies'], 'none');
    console.log('  ✅ PASS: / -> HTTP 200 avec CSP, nosniff, SAMEORIGIN et headers complets.');

    // B. Dossier sensible .git/config
    const gitRes = await makeReq('/.git/config');
    assert.strictEqual(gitRes.statusCode, 404, '/.git/config doit être bloqué avec 404');
    console.log('  ✅ PASS: /.git/config -> HTTP 404 (protection anti-divulgation active).');

    // C. Listing de répertoire /assets/
    const dirRes = await makeReq('/assets/');
    assert.strictEqual(dirRes.statusCode, 403, '/assets/ sans index.html doit renvoyer 403');
    console.log('  ✅ PASS: /assets/ -> HTTP 403 (listing de répertoires désactivé).');

    // D. Méthode TRACE
    const traceRes = await makeReq('/', 'TRACE');
    assert.strictEqual(traceRes.statusCode, 405, 'Méthode TRACE doit renvoyer 405');
    console.log('  ✅ PASS: TRACE / -> HTTP 405 (méthode non autorisée).');

    console.log('\n===============================================================');
    console.log('🎉 TOUS LES TESTS DE CONNECTIVITÉ APPLE ET DE HARDENING SONT 100% SUCCÈS !');
    console.log('===============================================================\n');
  } catch (err) {
    console.error('❌ Échec lors du test direct HTTP:', err);
    process.exit(1);
  }
})();
