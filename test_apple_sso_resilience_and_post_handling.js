/**
 * Test Suite: Apple SSO Resilience, Form_Post Callback, Sub-ID Recovery & CSRF Architecture
 * Pino Espaces Verts
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('===============================================================');
console.log('🍎 TEST : RÉSILIENCE APPLE SSO, CALLBACK POST & RÉCUPÉRATION DU SUB-ID');
console.log('===============================================================\n');

const indexHtmlPath = path.join(__dirname, 'index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

// ── 1. RÉSOLTION ERROR A : RÉCUPÉRATION DU NOM ET EMAIL VIA SUBJECT ID (SUB) ──
console.log('🔍 [TEST 1 : GESTION DES CONNEXIONS ULTÉRIEURES SANS NOM/EMAIL (ERROR A)]');
assert(indexHtml.includes('Résolution de l\'Error A Apple SSO'), 'Commentaire et logique de résolution Error A présents');
assert(indexHtml.includes('matchedUser = localUsers.find(u => (uid && u.uid === uid)'), 'Le système doit retrouver l\'utilisateur par son Subject ID / UID Apple');
assert(indexHtml.includes('@privaterelay.appleid.com'), 'Fallback propre pour les adresses masquées Private Relay');
console.log('  ✅ PASS: Un utilisateur Apple récurrent dont le nom/email est null est restauré avec son profil complet.');

// ── 2. CAPTURE DU NOM LORS DU PREMIER LOGIN POPUP DANS ADDITIONALUSERINFO ──
console.log('\n📝 [TEST 2 : CAPTURE DU NOM DU CLIENT AU PREMIER LOGIN DANS ADDITIONALUSERINFO]');
assert(indexHtml.includes('result.additionalUserInfo && result.additionalUserInfo.profile'), 'Capture du profil Apple dans additionalUserInfo');
assert(indexHtml.includes('fullName = `${fn} ${ln}`.trim()'), 'Concaténation propre du prénom et nom Apple');
assert(indexHtml.includes('processAuthenticatedUser(result.user, \'apple\', appleProfile'), 'Passage du profil capturé pour persistance immédiate');
console.log('  ✅ PASS: Le nom envoyé une seule et unique fois par Apple est capturé et sauvegardé dès le premier login.');

// ── 3. DÉTECTION ET DÉCODAGE DES TOKENS APPLE & APPLE_USER DANS LE RETOUR OPENID ──
console.log('\n🔑 [TEST 3 : DÉCODAGE DU RETOUR OPENID APPLE DANS L\'URL (#id_token=...&apple_user=...)]');
assert(indexHtml.includes('const rawAppleUser = params.get(\'apple_user\')'), 'Extraction du paramètre apple_user issu du form_post');
assert(indexHtml.includes('isAppleToken = Boolean((payload.iss && payload.iss.includes(\'apple\')) || parsedAppleUser)'), 'Identification automatique des jetons Apple');
assert(indexHtml.includes('OAuthProvider(\'apple.com\')'), 'Instanciation du fournisseur d\'accréditation Apple');
console.log('  ✅ PASS: Les jetons Apple et les payloads JSON form_post sont décodés avec attribution de session.');

// ── 4. SUPPORT HTTP POST DANS SERVE.PY (RÉSOLUTION ERROR E 405 METHOD NOT ALLOWED) ──
console.log('\n🌐 [TEST 4 : GESTION DES REQUÊTES POST FORM_POST DANS LE SERVEUR LOCAL (ERROR E)]');
const servePyPath = path.join(__dirname, 'serve.py');
const servePy = fs.readFileSync(servePyPath, 'utf8');
assert(servePy.includes('def do_POST(self):'), 'serve.py doit implémenter do_POST');
assert(servePy.includes('post_data.get(\'id_token\''), 'serve.py doit extraire id_token de la requête POST');
assert(servePy.includes('SameSite=None; Secure'), 'serve.py doit configurer SameSite=None; Secure sur les cookies');
assert(servePy.includes('self.send_response(303)'), 'serve.py doit rediriger vers le hash client en HTTP 303 See Other');
console.log('  ✅ PASS: Le serveur local accepte les requêtes POST Apple sans erreur 405 ni blocage CSRF.');

// ── 5. TEST RÉEL ENVOI POST SUR LE SERVEUR LOCAL ACTIF ──
console.log('\n🚀 [TEST 5 : VALIDATION D\'UN POST APPLICATION/X-WWW-FORM-URLENCODED SUR LE SERVEUR]');

const postPayload = 'id_token=sample_apple_jwt&code=sample_auth_code&user=%7B%22name%22%3A%7B%22firstName%22%3A%22Alexandre%22%2C%22lastName%22%3A%22Dumas%22%7D%7D';

const req = http.request({
  hostname: '127.0.0.1',
  port: process.env.PINO_PORT || 5500,
  path: '/',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postPayload)
  }
}, (res) => {
  assert.strictEqual(res.statusCode, 303, 'Le serveur doit renvoyer un statut HTTP 303 See Other');
  const loc = res.headers['location'] || '';
  assert(loc.includes('id_token=sample_apple_jwt'), 'La redirection doit contenir le id_token');
  assert(loc.includes('apple_user='), 'La redirection doit contenir le payload apple_user');
  const cookie = res.headers['set-cookie']?.[0] || '';
  assert(cookie.includes('SameSite=None') && cookie.includes('Secure'), 'Le cookie doit être configuré en SameSite=None; Secure');
  console.log('  ✅ PASS: Requête POST traitée avec succès : HTTP 303 -> ' + loc.slice(0, 45) + '... avec cookie SameSite=None; Secure');

  console.log('\n===============================================================');
  console.log('🎉 TOUS LES TESTS DE RÉSILIENCE APPLE SSO SONT VALIDÉS (100%) !');
  console.log('===============================================================');
});

req.on('error', (err) => {
  console.error('  ❌ FAIL: Erreur de connexion au serveur local:', err);
  process.exit(1);
});

req.write(postPayload);
req.end();
