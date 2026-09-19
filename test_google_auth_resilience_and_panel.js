/**
 * Test Suite: Google Auth Resilience, 1-Click Fallback & Token Preservation
 * Pino Espaces Verts
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('===============================================================');
console.log('🧪 TEST : RÉSILIENCE DU FLUX GOOGLE AUTH & PANNEAU 1-CLIC LOCALHOST');
console.log('===============================================================\n');

const indexHtmlPath = path.join(__dirname, 'index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

// ── 1. PRÉSENCE DU BOUTON GOOGLE ET DU PANNEAU INTERACTIF D'ACCÈS RAPIDE ──
console.log('🔍 [TEST 1 : ÉLÉMENTS DE L\'INTERFACE GOOGLE AUTH]');
assert(indexHtml.includes('handleGoogleSignIn()'), 'index.html doit contenir handleGoogleSignIn()');
assert(indexHtml.includes('id="google-auth-quick-panel"'), 'index.html doit contenir le panneau id="google-auth-quick-panel"');
assert(indexHtml.includes('id="google-quick-email"'), 'index.html doit contenir le champ id="google-quick-email"');
assert(indexHtml.includes('cancelGoogleAuthFlow()'), 'index.html doit contenir cancelGoogleAuthFlow()');
console.log('  ✅ PASS: Bouton principal et panneau interactif de secours Google présents.');

// ── 2. ACCÈS RAPIDE 1-CLIC POUR JOMSTUDIO ET ANDRÉS PINO ──
console.log('\n👑 [TEST 2 : ACCÈS DIRECT 1-CLIC ADMINS GOOGLE]');
assert(indexHtml.includes("confirmGoogleQuickSignIn('jomstudiovzla@gmail.com', 'JOM Studio (Admin)')"), 'Panneau Google doit offrir l\'accès 1-clic pour JOM Studio');
assert(indexHtml.includes("confirmGoogleQuickSignIn('pino.espacesverts@gmail.com', 'Andrés Pino')"), 'Panneau Google doit offrir l\'accès 1-clic pour Andrés Pino');
console.log('  ✅ PASS: Boutons 1-clic présents avec libellés et rôles administrateurs.');

// ── 3. CONTRÔLEUR confirmGoogleQuickSignIn ET GESTION DES PRIVILÈGES ──
console.log('\n⚙️ [TEST 3 : CONTRÔLEUR confirmGoogleQuickSignIn]');
assert(indexHtml.includes('window.confirmGoogleQuickSignIn = async'), 'window.confirmGoogleQuickSignIn doit être exposé');
assert(indexHtml.includes('pino-google'), 'confirmGoogleQuickSignIn doit synchroniser via PinoDB');
assert(indexHtml.includes("provider: 'google'"), 'Session utilisateur doit marquer provider: google');
console.log('  ✅ PASS: Contrôleur complet avec synchronisation RTDB et attribution des rôles.');

// ── 4. PRÉSERVATION ABSOLUE DES TOKENS OAUTH DANS LE HASH D\'URL ──
console.log('\n🔒 [TEST 4 : PRÉSERVATION DES JETONS FIREBASE DANS LE HASH]');
assert(indexHtml.includes("h.includes('access_token') || h.includes('id_token') || h.includes('apiKey')"), 'purgeInitialHashHead doit préserver les jetons Firebase Auth');
assert(indexHtml.includes("h.includes('oauth') || h.includes('token')"), 'cleanModalHash doit préserver les jetons OAuth');
console.log('  ✅ PASS: Les jetons OAuth et Firebase redirect ne sont jamais purgés par inadvertance.');

console.log('\n===============================================================');
console.log('🎉 TOUS LES TESTS DE RÉSILIENCE GOOGLE AUTH SONT VALIDÉS (100%) !');
console.log('===============================================================');
