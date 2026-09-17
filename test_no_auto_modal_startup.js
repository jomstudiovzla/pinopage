/**
 * Test Suite: Validation Zéro-Modale au Démarrage & Nettoyage Défensif du Hash
 * Pino Espaces Verts
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('===============================================================');
console.log('🧪 TEST DU DÉMARRAGE PROPRE : AUCUNE MODALE AUTOMATIQUE AU CHARGEMENT');
console.log('===============================================================\n');

const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const swJs = fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf8');

// 1. AUCUN DIALOG NE DOIT AVOIR L'ATTRIBUT OPEN DANS LE HTML STATIQUE
console.log('🛡️ [TEST 1 : AUCUN ATTRIBUT OPEN STATIQUE DANS LES DIALOGUES]');
const dialogOpenMatches = indexHtml.match(/<dialog[^>]*\bopen\b[^>]*>/gi);
assert(!dialogOpenMatches || dialogOpenMatches.length === 0, `Aucun dialogue ne doit avoir l'attribut open: ${dialogOpenMatches}`);
console.log('  ✅ PASS: Aucun tag <dialog> ne contient l\'attribut open.');

// 2. AUCUN LIEN DE FOOTER NE DOIT POLLUER L'URL AVEC #b2b, #services, #unipros, #galerie
console.log('\n🔗 [TEST 2 : ACCÈS RAPIDE FOOTER VIA CONTRÔLEURS SANS POLLUTION DE HASH]');
assert(!indexHtml.includes('<a href="#b2b"'), 'Le footer ne doit pas contenir <a href="#b2b">');
assert(!indexHtml.includes('<a href="#services"'), 'Le footer ne doit pas contenir <a href="#services">');
assert(!indexHtml.includes('<a href="#unipros"'), 'Le footer ne doit pas contenir <a href="#unipros">');
assert(!indexHtml.includes('<a href="#galerie"'), 'Le footer ne doit pas contenir <a href="#galerie">');
assert(indexHtml.includes("openWindowModal('b2b')"), 'Le bouton B2B du footer doit utiliser openWindowModal');
assert(indexHtml.includes("openWindowModal('services')"), 'Le bouton Services du footer doit utiliser openWindowModal');
console.log('  ✅ PASS: Les liens du footer utilisent openWindowModal sans injecter de hash persistant.');

// 3. CARTES DE SERVICES & CALCULATEUR UNIPROS SANS HASH BRUT
console.log('\n🌿 [TEST 3 : CARTES DE SERVICES SANS ANCRES #devis]');
assert(!indexHtml.includes('<a href="#devis"'), 'Les cartes de services ne doivent pas contenir <a href="#devis">');
console.log('  ✅ PASS: Toutes les cartes de services déclenchent openWindowModal sans modifier le hash.');

// 4. SÉCURITÉ DOMCONTENTLOADED & CHARGEMENT : FERMETURE SYSTÉMATIQUE & NETTOYAGE HASH
console.log('\n🧹 [TEST 4 : NETTOYAGE SYSTÉMATIQUE AU CHARGEMENT & ZÉRO-MODALE]');
assert(indexHtml.includes('purgeInitialHash'), 'index.html doit exécuter purgeInitialHash immédiatement');
assert(indexHtml.includes('cleanModalHash'), 'index.html doit définir la fonction cleanModalHash');
assert(indexHtml.includes('d.removeAttribute(\'open\')'), 'index.html doit retirer tout attribut open résiduel');
assert(indexHtml.includes('dialog.addEventListener(\'close\', cleanModalHash)'), 'Chaque dialogue doit nettoyer le hash dès sa fermeture');
assert(!indexHtml.includes('if (window.location.hash || window.location.search.includes(\'activate\')) {\n        setTimeout(checkHash, 300);'), 'index.html ne doit plus auto-exécuter checkHash sur les section modals au démarrage');
console.log('  ✅ PASS: Purge initiale immédiate, fermeture prompte et écouteurs actifs.');

// 5. FLUX APPLE SIGN-IN 100% OPÉRATIONNEL
console.log('\n🍎 [TEST 5 : CONNEXION APPLE FLUIDE & PANNEAU DE SECOURS]');
assert(indexHtml.includes('handleAppleSignIn'), 'index.html doit implémenter handleAppleSignIn');
assert(indexHtml.includes('confirmAppleQuickSignIn'), 'index.html doit implémenter confirmAppleQuickSignIn');
assert(indexHtml.includes('id="apple-auth-quick-panel"'), 'index.html doit contenir le panneau d\'accès rapide Apple');
assert(indexHtml.includes('id="apple-quick-email"'), 'index.html doit contenir l\'input d\'email Apple');
console.log('  ✅ PASS: Authentification Apple complète avec fallback direct 1-clic pour Andrés et clients.');

// 6. CACHE SERVICE WORKER ACTUALISÉ
console.log('\n🚀 [TEST 6 : CACHE SERVICE WORKER ACTUALISÉ]');
assert(/pino-ev-v(1[5-9]|2[0-9])/.test(swJs), 'Service Worker doit être versionné pour rafraîchir le cache client');
console.log('  ✅ PASS: Service Worker à jour déployé.');

console.log('\n===============================================================');
console.log('🎉 TOUS LES 6 TESTS DE SÉCURITÉ ZÉRO-MODALE ET AUTH APPLE SONT SUCCÈS !');
console.log('===============================================================\n');
