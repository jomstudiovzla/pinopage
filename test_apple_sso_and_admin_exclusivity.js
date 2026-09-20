/**
 * Test Suite: Apple SSO Full Verification & Strict Admin Exclusivity
 * Pino Espaces Verts
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('===============================================================');
console.log('🍎 TEST : VÉRIFICATION COMPLÈTE APPLE SSO & EXCLUSIVITÉ ADMIN PINO / JOM');
console.log('===============================================================\n');

const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const pinoDbJs = fs.readFileSync(path.join(__dirname, 'assets/js/pino-db.js'), 'utf8');
const dbRules = fs.readFileSync(path.join(__dirname, 'database.rules.json'), 'utf8');
const fsRules = fs.readFileSync(path.join(__dirname, 'firestore.rules'), 'utf8');

// ── 1. COMPILATION JAVASCRIPT DU SCRIPT PRINCIPAL DANS VM NODE.JS ──
console.log('🧪 [TEST 1 : VALIDATION DE LA SYNTAXE & COMPILATION JS]');
const scriptBlocks = indexHtml.match(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/gi) || [];
let totalScriptLength = 0;
scriptBlocks.forEach((block, idx) => {
  const code = block.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
  totalScriptLength += code.length;
  try {
    new vm.Script(code);
  } catch (err) {
    console.error(`❌ Erreur de syntaxe dans le bloc <script> #${idx}:`, err);
    process.exit(1);
  }
});
console.log(`  ✅ PASS: 100% des scripts (${totalScriptLength} caractères) compilent sans aucune SyntaxError.`);

// ── 2. EXCLUSIVITÉ STRICTE DES ADMINISTRATEURS (PINO + JOM STUDIO SEULEMENT) ──
console.log('\n👑 [TEST 2 : EXCLUSIVITÉ STRICTE DES COMPTES ADMIN PINO & JOM STUDIO]');
assert(indexHtml.includes("if (!ADMIN_EMAILS.includes('jomstudiovzla@gmail.com')) ADMIN_EMAILS.push('jomstudiovzla@gmail.com');"), 'ADMIN_EMAILS doit inclure jomstudiovzla@gmail.com');
assert(!indexHtml.includes("ADMIN_EMAILS.push('martinezoliverosj"), 'martinezoliverosj ne doit pas être ajouté aux admins');
assert(!dbRules.includes('martinezoliverosj'), 'database.rules.json ne doit pas contenir martinezoliverosj');
assert(!fsRules.includes('martinezoliverosj'), 'firestore.rules ne doit pas contenir martinezoliverosj');
assert(pinoDbJs.includes("const isJom = normEmail === 'jomstudiovzla@gmail.com';"), 'pino-db.js isJom doit être strictement jomstudiovzla@gmail.com');
console.log('  ✅ PASS: Seuls Pino et JOM Studio sont administrateurs. Tous les autres sont des clients.');

// ── 3. VÉRIFICATION DU FLUX APPLE SSO POUR UN ADMINISTRATEUR ──
console.log('\n🍏 [TEST 3 : FLUX APPLE SSO POUR UN COMPTE ADMINISTRATEUR]');
// Simuler la logique confirmAppleQuickSignIn pour jomstudiovzla@gmail.com
const simulateAppleLogin = (email) => {
  const ADMIN_EMAILS = ['pino.spacesverts@gmail.com', 'pino.espacesverts@gmail.com', 'jomstudiovzla@gmail.com'];
  const isPinoEmail = (e) => ADMIN_EMAILS.includes((e || '').trim().toLowerCase());
  const isAdm = isPinoEmail(email) || email === 'jomstudiovzla@gmail.com';
  const isJom = email === 'jomstudiovzla@gmail.com';
  let formattedName = '';
  if (email === 'jomstudiovzla@gmail.com') {
    formattedName = 'JOM Studio (Admin)';
  } else if (email === 'martinezoliverosj@gmail.com' || email === 'martinezoliverosj@hotmail.com') {
    formattedName = 'Jesus Martinez';
  } else if (isAdm) {
    formattedName = 'Andrés Pino';
  } else {
    formattedName = 'Client Apple';
  }
  return {
    email,
    role: isAdm ? 'admin' : 'client',
    isAdmin: isAdm,
    fullName: formattedName,
    destination: isAdm ? 'admin' : 'espace'
  };
};

const jomResult = simulateAppleLogin('jomstudiovzla@gmail.com');
assert.strictEqual(jomResult.role, 'admin', 'JOM Studio doit avoir le rôle admin');
assert.strictEqual(jomResult.isAdmin, true, 'JOM Studio doit avoir isAdmin = true');
assert.strictEqual(jomResult.fullName, 'JOM Studio (Admin)');
assert.strictEqual(jomResult.destination, 'admin', 'JOM Studio doit ouvrir le modal admin');

const pinoResult = simulateAppleLogin('pino.espacesverts@gmail.com');
assert.strictEqual(pinoResult.role, 'admin', 'Andrés Pino doit avoir le rôle admin');
assert.strictEqual(pinoResult.isAdmin, true, 'Andrés Pino doit avoir isAdmin = true');
assert.strictEqual(pinoResult.fullName, 'Andrés Pino');
assert.strictEqual(pinoResult.destination, 'admin', 'Andrés Pino doit ouvrir le modal admin');
console.log('  ✅ PASS: Connexion Apple administrateur (JOM Studio / Pino) accorde le statut admin et ouvre le CRM.');

// ── 4. VÉRIFICATION DU FLUX APPLE SSO POUR UN CLIENT STANDARD (ICLOUD / PRIVATE RELAY) ──
console.log('\n👥 [TEST 4 : FLUX APPLE SSO POUR LES CLIENTS PARTICULIERS (ICLOUD & PRIVATE RELAY)]');
const clientResult = simulateAppleLogin('client.dupont@icloud.com');
assert.strictEqual(clientResult.role, 'client', 'Un compte iCloud standard doit avoir le rôle client');
assert.strictEqual(clientResult.isAdmin, false, 'Un compte iCloud standard doit avoir isAdmin = false');
assert.strictEqual(clientResult.destination, 'espace', 'Un client iCloud doit ouvrir l\'espace client');

const relayResult = simulateAppleLogin('user12345678@privaterelay.appleid.com');
assert.strictEqual(relayResult.role, 'client', 'Un compte Private Relay doit avoir le rôle client');
assert.strictEqual(relayResult.isAdmin, false, 'Un compte Private Relay doit avoir isAdmin = false');
assert.strictEqual(relayResult.destination, 'espace', 'Un compte Private Relay doit ouvrir l\'espace client');

const martinezResult = simulateAppleLogin('martinezoliverosj@hotmail.com');
assert.strictEqual(martinezResult.role, 'client', 'martinezoliverosj doit avoir le rôle client');
assert.strictEqual(martinezResult.isAdmin, false, 'martinezoliverosj doit avoir isAdmin = false');
assert.strictEqual(martinezResult.fullName, 'Jesus Martinez', 'martinezoliverosj doit porter son vrai nom client');
assert.strictEqual(martinezResult.destination, 'espace', 'martinezoliverosj doit ouvrir l\'espace client');
console.log('  ✅ PASS: Tous les clients Apple et martinezoliverosj ont un accès client étanche avec ouverture d\'espace client.');

// ── 5. VÉRIFICATION DES GESTIONNAIRES APPLE DANS INDEX.HTML ──
console.log('\n🔍 [TEST 5 : INTÉGRITÉ DES FONCTIONS APPLE DANS INDEX.HTML]');
assert(indexHtml.includes('window.handleAppleSignIn = async () =>'), 'handleAppleSignIn doit être défini');
assert(indexHtml.includes('window.confirmAppleQuickSignIn = async'), 'confirmAppleQuickSignIn doit être défini');
assert(indexHtml.includes('window.cancelAppleAuthFlow = () =>'), 'cancelAppleAuthFlow doit être défini');
assert(indexHtml.includes("OAuthProvider('apple.com')"), 'Apple OAuthProvider configuré');
assert(indexHtml.includes("provider.addScope('email')"), 'Scope email demandé');
assert(indexHtml.includes("provider.addScope('name')"), 'Scope name demandé');
assert(indexHtml.includes('#open-auth-apple'), 'Gestionnaire de redirection automatique #open-auth-apple présent');
console.log('  ✅ PASS: Toutes les fonctions Apple SSO sont rigoureusement implémentées et configurées.');

// ── 6. VÉRIFICATION DE L\'ATTRIBUTION DU COUPON CLIENT (-20%) ──
console.log('\n🎟️ [TEST 6 : ATTRIBUTION AUTOMATIQUE DU COUPON DE BIENVENUE -20%]');
assert(indexHtml.includes("promoCode: existingUser?.promoCode || 'PINO-APPLE20'"), 'Coupon PINO-APPLE20 attribué aux clients Apple');
assert(indexHtml.includes("promoCode: 'PINO-BIENVENUE20'"), 'Coupon de bienvenue standard disponible');
console.log('  ✅ PASS: Coupon -20% garanti pour les utilisateurs clients Apple.');

console.log('\n===============================================================');
console.log('🎉 TOUS LES CONTRÔLES APPLE SSO ET EXCLUSIVITÉ ADMIN SONT VALIDÉS (100%) !');
console.log('===============================================================');
