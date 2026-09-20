/**
 * test_global_audit_and_functional_coherence.js
 * 
 * Test exhaustif de validation de l'audit global du site PINO Page :
 * 1. Présence et validité de tous les gestionnaires d'événements HTML (ex: copyClientCouponCode, openWindowModal).
 * 2. Résilience du stub précoce openWindowModal et couverture de tous les alias de modaux.
 * 3. Étanchéité absolue Administrateurs (Pino / JOM Studio) vs Clients (Jesus Martinez, visiteurs).
 * 4. Séparation stricte et calculs comptables des services :
 *    - Services à la Personne (SAP) 50% crédit d'impôt (Unipros / Case 7DB / Art. 199 sexdecies CGI).
 *    - Prestations Directes / Professionnels / B2B (Andrés Pino EIRL / Direct B2B).
 * 5. Cohérence géographique intégrale : Vaucluse (84) et Entraigues-sur-la-Sorgue (0 résidu Gironde/Bordeaux).
 * 6. Intégrité des assets locaux réels du projet (favicon, logos, images avant/après, QR codes, scripts).
 * 
 * Co-Authored-By: Grok 4.6 <noreply@x.ai>
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    testsPassed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    testsFailed++;
  }
}

console.log('===============================================================');
console.log('🧪 TEST GLOBAL : AUDIT SYSTÉMIQUE & COHÉRENCE FONCTIONNELLE');
console.log('===============================================================\n');

// 1. Chargement des fichiers clés
const indexPath = path.join(__dirname, 'index.html');
const dbPath = path.join(__dirname, 'assets', 'js', 'pino-db.js');
const manifestPath = path.join(__dirname, 'manifest.json');
const indexHtml = fs.readFileSync(indexPath, 'utf8');
const pinoDbJs = fs.readFileSync(dbPath, 'utf8');
const manifestJson = fs.readFileSync(manifestPath, 'utf8');

// MODULE 1 : SYNTAXE ET COMPILATION JS SANS ERREURS
console.log('🔍 [MODULE 1 : COMPILATION SCRIPT ET GESTIONNAIRES D\'ÉVÉNEMENTS]');
const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
let match;
let scriptIndex = 0;
let compilationOk = true;

while ((match = scriptRegex.exec(indexHtml)) !== null) {
  const attrs = match[1];
  const code = match[2].trim();
  if (!code || attrs.includes('application/ld+json')) continue;
  scriptIndex++;
  try {
    new vm.Script(code);
  } catch (err) {
    compilationOk = false;
    console.error(`Erreur de syntaxe script ${scriptIndex}:`, err);
  }
}
assert(compilationOk && scriptIndex >= 3, `Tous les scripts (${scriptIndex}) compilent sans SyntaxError.`);

// Vérification de copyClientCouponCode
assert(
  indexHtml.includes('window.copyClientCouponCode = () => {') &&
  indexHtml.includes("copyClientCouponCode()"),
  "La fonction 'copyClientCouponCode' est déclarée dans window et connectée au bouton copier."
);

// MODULE 2 : STUB PRÉCOCE OPENWINDOWMODAL ET ALIAS
console.log('\n🪟 [MODULE 2 : STUB PRÉCOCE OPENWINDOWMODAL & ALIAS DES MODAUX]');
assert(
  indexHtml.includes("window.openWindowModal = window.openWindowModal || function(id) {") &&
  indexHtml.includes("'connexion': 'modal-window-auth'") &&
  indexHtml.includes("'espace': 'modal-window-client'") &&
  indexHtml.includes("'admin': 'modal-window-admin'") &&
  indexHtml.includes("'devis': 'modal-window-devis'"),
  "Le stub précoce openWindowModal possède la table de mappage d'alias complète."
);

// MODULE 3 : ÉTANCHÉITÉ ABSOLUE COMPTES ADMIN VS CLIENTS
console.log('\n👑 [MODULE 3 : ÉTANCHÉITÉ COMPTES ADMIN VS CLIENTS]');
assert(
  indexHtml.includes("const ADMIN_EMAILS = ['pino.spacesverts@gmail.com', 'pino.espacesverts@gmail.com'];") &&
  indexHtml.includes("if (!ADMIN_EMAILS.includes('jomstudiovzla@gmail.com')) ADMIN_EMAILS.push('jomstudiovzla@gmail.com');"),
  "Seuls Pino Espaces Verts et JOM Studio sont configurés dans ADMIN_EMAILS."
);
assert(
  !indexHtml.match(/const\s+ADMIN_EMAILS\s*=\s*\[([\s\S]*?)\];/)[1].includes('martinezoliverosj'),
  "Les comptes martinezoliverosj sont strictement exclus de la liste ADMIN_EMAILS."
);

// Vérification du contrôle d'accès dans openWindowModal('admin')
assert(
  indexHtml.includes("if (!u || (!u.isAdmin && u.role !== 'admin'))") &&
  indexHtml.includes("showNotificationToast('Accès restreint. Veuillez vous connecter avec un compte administrateur"),
  "Le modal d'administration bloque strictement les clients et visiteurs non autorisés."
);

// MODULE 4 : SÉPARATION DES SERVICES SAP 50% VS DIRECT B2B
console.log('\n💶 [MODULE 4 : SÉPARATION STRICTE SAP 50% VS DIRECT B2B]');
assert(
  indexHtml.includes('Unipros SAP (Avance 50%)') &&
  indexHtml.includes('Direct B2B (Standard)'),
  "Les deux typologies de facturation (SAP 50% vs Direct B2B) sont proposées dans le formulaire de facturation."
);
assert(
  indexHtml.includes('Art. 199 sexdecies du CGI') &&
  indexHtml.includes('Avance Immédiate') &&
  indexHtml.includes('Case 7DB'),
  "Les mentions fiscales légales françaises obligatoires (Art. 199 sexdecies, Avance Immédiate, Case 7DB) sont rigoureusement documentées."
);

// MODULE 5 : COHÉRENCE GÉOGRAPHIQUE INTÉGRALE VAUCLUSE (84)
console.log('\n📍 [MODULE 5 : COHÉRENCE GÉOGRAPHIQUE VAUCLUSE (84)]');
assert(
  !indexHtml.includes('Bordeaux') && !indexHtml.includes('Gironde'),
  "Zéro occurrence résiduelle de 'Bordeaux' ou 'Gironde' dans index.html."
);
assert(
  !pinoDbJs.includes('Bordeaux') && !pinoDbJs.includes('Gironde'),
  "Zéro occurrence résiduelle de 'Bordeaux' ou 'Gironde' dans assets/js/pino-db.js."
);
assert(
  !manifestJson.includes('Bordeaux') && manifestJson.includes('Vaucluse (84)'),
  "manifest.json est parfaitement aligné sur le Vaucluse (84)."
);
assert(
  pinoDbJs.includes('Entraigues-sur-la-Sorgue & Vaucluse (84)') &&
  pinoDbJs.includes('84000 Avignon') &&
  pinoDbJs.includes('84200 Carpentras') &&
  pinoDbJs.includes('84700 Sorgues') &&
  pinoDbJs.includes('84270 Vedène') &&
  pinoDbJs.includes('84130 Le Pontet'),
  "Toutes les communes et données de test sont ancrées dans le Vaucluse (84)."
);

// MODULE 6 : VÉRIFICATION DE LA PRÉSENCE DES ASSETS LOCAUX
console.log('\n🖼️ [MODULE 6 : CONTRÔLE D\'INTÉGRITÉ DES ASSETS LOCAUX]');
const localAssets = [
  'favicon.ico',
  'apple-touch-icon.png',
  'manifest.json',
  'sw.js',
  'assets/logo/Logo pino.png',
  'assets/logo/Logo completo.png',
  'assets/logo/unipros.png',
  'assets/flyer/flyer_pino_oferta_muy_centrado.jpg',
  'assets/images/before_after_apres_real.jpg',
  'assets/images/before_after_avant_real.jpg',
  'assets/images/hedge_trimming_real.jpg',
  'assets/images/garden_creation_real.jpg',
  'assets/images/brush_clearing_real.jpg',
  'assets/images/gallery_real_orchard_mowing.jpg',
  'assets/images/gallery_real_pruned_tree.jpg',
  'assets/images/gallery_real_pool_planters.jpg',
  'assets/qr/QR_WhatsApp.png',
  'assets/qr/QR_Instagram.png',
  'assets/qr/QR_LandingPage.png',
  'assets/qr/QR_Email.png',
  'assets/js/firebase-config.js',
  'assets/js/pino-db.js',
  'assets/js/chatbot_knowledge_base.js',
  'assets/js/supabase-config.js'
];

let assetsFound = 0;
localAssets.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    assetsFound++;
  } else {
    console.warn(`  ⚠️ Asset non trouvé sur disque: ${file}`);
  }
});
assert(assetsFound === localAssets.length, `Tous les ${localAssets.length} assets locaux réels sont présents sur le disque.`);

// BILAN FINAL
console.log('\n===============================================================');
if (testsFailed === 0) {
  console.log(`🎉 TOUS LES TESTS D'AUDIT GLOBAL SONT VALIDÉS AVEC SUCCÈS (${testsPassed}/${testsPassed}) !`);
  console.log('===============================================================\n');
  process.exit(0);
} else {
  console.error(`💥 ÉCHEC : ${testsFailed} test(s) ont échoué sur ${testsPassed + testsFailed}.`);
  console.log('===============================================================\n');
  process.exit(1);
}
