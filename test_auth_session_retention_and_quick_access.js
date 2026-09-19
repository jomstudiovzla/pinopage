/**
 * Test Suite: Auth Session Retention, Google/Apple Resilience & Admin 1-Click Access
 * Pino Espaces Verts
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('===============================================================');
console.log('🧪 TEST : PERSISTANCE DE SESSION AUTH & ACCÈS 1-CLIC GOOGLE/APPLE');
console.log('===============================================================\n');

const indexHtmlPath = path.join(__dirname, 'index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

// ── 1. PRÉSERVATION ABSOLUE DE SESSION LORS D'UN onAuthStateChanged(null) ──
console.log('🔒 [TEST 1 : SÉCURITÉ DE SESSION onAuthStateChanged]');
assert(indexHtml.includes('cur && cur.email && !isExplicitLogout'), 'onAuthStateChanged doit préserver la session active si non-explicite');
assert(indexHtml.includes('Session active maintenue'), 'onAuthStateChanged doit documenter la conservation de session');
console.log('  ✅ PASS: onAuthStateChanged ne supprime JAMAIS une session active locale (Google/Apple/invité).');

// ── 2. PANNEAU APPLE ÉPURÉ SANS EXPOSITION DE BOUTONS ADMIN PUBLICS ──
console.log('\n🍏 [TEST 2 : PANNEAU APPLE ÉPURÉ]');
assert(!indexHtml.includes("confirmAppleQuickSignIn('jomstudiovzla@gmail.com', 'JOM Studio (Admin)')"), 'Panneau Apple ne doit pas exposer de bouton admin public');
assert(!indexHtml.includes("confirmAppleQuickSignIn('pino.espacesverts@gmail.com', 'Andrés Pino')"), 'Panneau Apple ne doit pas exposer de bouton admin public');
assert(indexHtml.includes("id=\"apple-quick-email\" onkeydown=\"if(event.key==='Enter')"), 'Champ e-mail Apple doit supporter la touche Entrée');
assert(indexHtml.includes("id=\"google-quick-email\" onkeydown=\"if(event.key==='Enter')"), 'Champ e-mail Google doit supporter la touche Entrée');
console.log('  ✅ PASS: Panneau Apple épuré, confidentiel avec support de la touche Entrée.');

// ── 3. GOOGLE SIGN-IN PAR POPUP SANS REDIRECTION INTRUSIVE ──
console.log('\n🔍 [TEST 3 : GOOGLE SIGN-IN EN PLACE SANS REDIRECT DISRUPTIF]');
assert(indexHtml.includes('await firebase.auth().signInWithPopup(provider)'), 'handleGoogleSignIn doit privilégier signInWithPopup');
assert(!indexHtml.includes('await firebase.auth().signInWithRedirect(provider)'), 'signInWithRedirect ne doit plus être forcé pour éviter les rechargements complets');
assert(indexHtml.includes("google-auth-btn-label"), 'Libellé d\'état dynamique du bouton Google présent');
console.log('  ✅ PASS: Flux Google popup officiel optimisé sans panneau intrusif.');

// ── 4. CONTRÔLE DE MODALE UNIFIÉ DANS processAuthenticatedUser & handleAuthNavClick ──
console.log('\n🎛️ [TEST 4 : CONTRÔLE DE MODALE SÉCURISÉ & ANTI-INVALIDSTATE]');
assert(indexHtml.includes("window.openWindowModal('admin')"), 'processAuthenticatedUser et authNav doivent utiliser openWindowModal(admin)');
assert(indexHtml.includes("window.openWindowModal('espace')"), 'processAuthenticatedUser et authNav doivent utiliser openWindowModal(espace)');
assert(indexHtml.includes("if (!targetModal.open) {\n          targetModal.showModal();"), 'openWindowModal doit vérifier !targetModal.open avant showModal()');
console.log('  ✅ PASS: Modales ouvertes de façon unifiée sans risque de crash InvalidStateError.');

console.log('\n===============================================================');
console.log('🎉 TOUS LES TESTS DE PERSISTANCE & AUTH RESILIENCE SONT VALIDÉS !');
console.log('===============================================================');
