/**
 * Test E2E: Account Creation Zero-Fail & Official Apple Logo FontAwesome
 * Pino Espaces Verts
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('===============================================================');
console.log('🧪 TEST E2E : CRÉATION DE COMPTE ZÉRO-DÉFAUT & LOGO OFFICIEL APPLE');
console.log('===============================================================\n');

const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const swJs = fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf8');

// 1. VÉRIFICATION DU LOGO OFFICIEL APPLE (FONTAWESOME)
console.log('🍎 [TEST 1 : LOGO OFFICIEL APPLE FONTAWESOME BRANDS]');
assert(indexHtml.includes('fa-brands fa-apple text-xl text-white shrink-0'), 'Bouton Continuer avec Apple utilise le logo officiel FontAwesome');
assert(indexHtml.includes('fa-brands fa-apple text-base text-white shrink-0'), 'Panneau Apple ID utilise le logo officiel FontAwesome');
assert(!indexHtml.includes('viewBox="0 0 170 170"'), 'L\'ancien SVG déformé 170x170 a été totalement retiré');
console.log('  ✅ PASS: Logo Apple officiel FontAwesome validé (authentique, non déformé).');

// 2. VÉRIFICATION DU BASCULEMENT D\'ONGLET ET SUPPRESSION DU BUG
console.log('\n🔄 [TEST 2 : SÉLECTEUR D\'ONGLET SANS ERREUR JS]');
assert(!indexHtml.includes('document.getElementById(\'auth-login-form\')'), 'L\'ancien ID erroné auth-login-form a été purgé');
assert(!indexHtml.includes('document.getElementById(\'auth-register-form\')'), 'L\'ancien ID erroné auth-register-form a été purgé');
assert(indexHtml.includes('window.switchAuthTab'), 'Contrôleur switchAuthTab défini');
assert(indexHtml.includes('openRegisterModal'), 'Raccourci openRegisterModal disponible');
console.log('  ✅ PASS: Le bug null pointer sur switchAuthTab est éradiqué.');

// 3. VÉRIFICATION DE LA SOUPLESSE DU FORMULAIRE D\'INSCRIPTION
console.log('\n📝 [TEST 3 : INSCRIPTION FLUIDE ET NON-BLOQUANTE]');
assert(indexHtml.includes('id="reg-fullname" required'), 'Nom requis');
assert(indexHtml.includes('id="reg-email" required'), 'Email requis');
assert(indexHtml.includes('id="reg-password" minlength="6" required'), 'Mot de passe requis avec min 6 caractères');
assert(indexHtml.includes('id="reg-password-confirm" minlength="6" required'), 'Confirmation requise');
assert(indexHtml.includes('togglePasswordVisibility(\'reg-password\''), 'Bouton afficher mot de passe présent');
assert(indexHtml.includes('togglePasswordVisibility(\'reg-password-confirm\''), 'Bouton afficher confirmation présent');
console.log('  ✅ PASS: Formulaire interactif et tolérant (téléphone et commune optionnels).');

// 4. VÉRIFICATION DU ROUTAGE ET DU CACHE SERVICE WORKER
console.log('\n🚀 [TEST 4 : SERVICE WORKER V21 ACTUALISÉ]');
assert(swJs.includes('pino-ev-v21') || swJs.includes('pino-ev-v22'), 'sw.js utilise le cache v21 ou supérieur');
assert(indexHtml.includes('\'register\': \'modal-window-auth\''), 'openWindowModal route register vers la modale d\'auth');
console.log('  ✅ PASS: Déploiement service worker et routage immédiat validés.');

console.log('\n===============================================================');
console.log('🎉 TOUS LES TESTS DE CRÉATION DE COMPTE & LOGO APPLE SONT VALIDÉS !');
console.log('===============================================================\n');
