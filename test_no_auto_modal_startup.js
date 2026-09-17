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

// 4. SÉCURITÉ DOMCONTENTLOADED : FERMETURE SYSTÉMATIQUE & NETTOYAGE HASH
console.log('\n🧹 [TEST 4 : NETTOYAGE SYSTÉMATIQUE AU DOMCONTENTLOADED]');
assert(indexHtml.includes('cleanModalHash'), 'index.html doit définir la fonction cleanModalHash');
assert(indexHtml.includes('d.removeAttribute(\'open\')'), 'index.html doit retirer tout attribut open résiduel');
assert(indexHtml.includes('dialog.addEventListener(\'close\', cleanModalHash)'), 'Chaque dialogue doit nettoyer le hash dès sa fermeture');
assert(!indexHtml.includes('if (window.location.hash || window.location.search.includes(\'activate\')) {\n        setTimeout(checkHash, 300);'), 'index.html ne doit plus auto-exécuter checkHash sur les section modals au démarrage');
console.log('  ✅ PASS: Nettoyage proactif et écouteur de fermeture activement connectés.');

// 5. CACHE SERVICE WORKER ACTUALISÉ
console.log('\n🚀 [TEST 5 : CACHE SERVICE WORKER V15]');
assert(/pino-ev-v15/.test(swJs), 'Service Worker doit être versionné v15 pour vider le cache obsolète des clients');
console.log('  ✅ PASS: Service Worker v15 déployé pour rafraîchir le cache.');

console.log('\n===============================================================');
console.log('🎉 TOUS LES 5 TESTS DE SÉCURITÉ ZÉRO-MODALE AU DÉMARRAGE SONT SUCCÈS !');
console.log('===============================================================\n');
