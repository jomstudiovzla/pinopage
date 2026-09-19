/**
 * Test Suite: Validation Admin jomstudiovzla@gmail.com & Zéro Prévisualisation au Démarrage
 * Pino Espaces Verts
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('===============================================================');
console.log('🧪 TEST : ACCÈS ADMIN JOMSTUDIO & DÉMARRAGE PROPRE SANS FLASH');
console.log('===============================================================\n');

const indexHtmlPath = path.join(__dirname, 'index.html');
const pinoDbPath = path.join(__dirname, 'assets', 'js', 'pino-db.js');
const firestoreRulesPath = path.join(__dirname, 'firestore.rules');
const databaseRulesPath = path.join(__dirname, 'database.rules.json');

const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
const pinoDb = fs.readFileSync(pinoDbPath, 'utf8');
const firestoreRules = fs.readFileSync(firestoreRulesPath, 'utf8');
const databaseRules = fs.readFileSync(databaseRulesPath, 'utf8');

// ── 1. ACCÈS TOTAL ADMINISTRATEUR POUR jomstudiovzla@gmail.com DANS index.html ──
console.log('👑 [TEST 1 : PRIVILÈGES ADMINISTRATEURS JOMSTUDIO DANS index.html]');
assert(indexHtml.includes("if (!ADMIN_EMAILS.includes('jomstudiovzla@gmail.com')) ADMIN_EMAILS.push('jomstudiovzla@gmail.com');"), 'ADMIN_EMAILS doit inclure jomstudiovzla@gmail.com');
assert(indexHtml.includes("const isPinoEmail = (email) => ADMIN_EMAILS.includes((email || '').trim().toLowerCase()) || (email || '').trim().toLowerCase() === 'jomstudiovzla@gmail.com';"), 'isPinoEmail doit valider jomstudiovzla@gmail.com');
assert(indexHtml.includes("normEmail === 'jomstudiovzla@gmail.com' ? 'JOM Studio (Admin)'"), 'processAuthenticatedUser doit assigner le nom JOM Studio (Admin)');
assert(indexHtml.includes("isJom ? \"👑 JOM Studio (Admin)\" : \"👑 Andrés (Admin)\""), 'updateAuthUI doit afficher la couronne et le nom JOM Studio (Admin)');
assert(indexHtml.includes("cancelAdminFacture"), 'cancelAdminFacture doit exister');
assert(indexHtml.includes("user.email === 'jomstudiovzla@gmail.com'"), 'cancelAdminFacture doit autoriser jomstudiovzla@gmail.com');
console.log('  ✅ PASS: Privilèges administrateur complets pour jomstudiovzla@gmail.com dans index.html.');

// ── 2. PROFILES FIREBASE RTDB DANS assets/js/pino-db.js ──
console.log('\n🌿 [TEST 2 : GESTION DU PROFIL DANS pino-db.js]');
assert(pinoDb.includes("normEmail === 'jomstudiovzla@gmail.com'"), 'upsertProfile dans pino-db.js doit détecter jomstudiovzla@gmail.com comme admin');
assert(pinoDb.includes("normEmail === 'jomstudiovzla@gmail.com' ? 'JOM Studio (Admin)'"), 'upsertProfile doit assigner JOM Studio (Admin) par défaut');
console.log('  ✅ PASS: Auto-détection rôle admin et libellé JOM Studio dans pino-db.js.');

// ── 3. RÈGLES DE SÉCURITÉ FIRESTORE ──
console.log('\n🔒 [TEST 3 : RÈGLES CLOUD FIRESTORE]');
assert(firestoreRules.includes("request.auth.token.email == 'jomstudiovzla@gmail.com'"), 'firestore.rules doit accorder isAdmin() à jomstudiovzla@gmail.com');
console.log('  ✅ PASS: Règle isAdmin() Firestore validée pour jomstudiovzla@gmail.com.');

// ── 4. RÈGLES DE SÉCURITÉ FIREBASE REALTIME DATABASE ──
console.log('\n🗄️ [TEST 4 : RÈGLES FIREBASE REALTIME DATABASE]');
assert(databaseRules.includes("auth.token.email === 'jomstudiovzla@gmail.com'"), 'database.rules.json doit accorder les droits admin à jomstudiovzla@gmail.com');
const countInDbRules = (databaseRules.match(/auth\.token\.email === 'jomstudiovzla@gmail\.com'/g) || []).length;
assert(countInDbRules >= 10, `database.rules.json doit contenir au moins 10 occurrences de jomstudiovzla@gmail.com (trouvé: ${countInDbRules})`);
console.log(`  ✅ PASS: ${countInDbRules} autorisations admin configurées dans database.rules.json.`);

// ── 5. GARANTIE ZÉRO FLASH & ZÉRO PRÉVISUALISATION AU DÉMARRAGE ──
console.log('\n🚀 [TEST 5 : SÉCURITÉ ANTI-FLASH DANS LE <HEAD> & AUCUNE MODALE OUVERTE]');
assert(indexHtml.includes('/* ── GARANTIE ABSOLUE ZÉRO FLASH & ZÉRO PRÉVISUALISATION AU DÉMARRAGE ── */'), 'index.html doit contenir les styles de blocage précoce dans le <head>');
assert(indexHtml.includes('dialog:not([open])'), 'Le sélecteur dialog:not([open]) doit être présent');
assert(indexHtml.includes('#modal-window-services:not([open])'), 'Le sélecteur modal-window-services:not([open]) doit être masqué');
assert(indexHtml.includes('#modal-window-admin:not([open])'), 'Le sélecteur modal-window-admin:not([open]) doit être masqué');
assert(indexHtml.includes('purgeInitialHashHead'), 'Le script de purge immédiate du hash dans le <head> doit être présent');

// Aucun dialogue ne doit avoir d'attribut open
const openDialogs = indexHtml.match(/<dialog[^>]*\bopen\b[^>]*>/gi);
assert(!openDialogs || openDialogs.length === 0, 'Aucun dialogue statique ne doit être ouvert au démarrage');
console.log('  ✅ PASS: Zéro flash garanti, purge précoce du hash et démarrage 100% propre.');

console.log('\n===============================================================');
console.log('🎉 TOUS LES TESTS ADMIN JOMSTUDIO & ANTI-FLASH SONT VALIDÉS (100%) !');
console.log('===============================================================');
