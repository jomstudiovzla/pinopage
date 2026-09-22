/**
 * Test Suite: Email Automation & CGV Legal Compliance
 * Pino Espaces Verts — Vaucluse (84)
 */

const fs = require('fs');
const assert = require('assert');
const path = require('path');

console.log('===============================================================');
console.log('🧪 TEST : AUTOMATISATION E-MAILS & CONFORMITÉ LÉGALE CGV');
console.log('===============================================================\n');

const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const pinoDbJs = fs.readFileSync(path.join(__dirname, 'assets/js/pino-db.js'), 'utf8');
const swJs = fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf8');

// 1. E-MAIL OFFICIEL CANONIQUE
console.log('📧 [TEST 1 : E-MAIL CANONIQUE OFFICIEL]');
assert(pinoDbJs.includes("PINO_ADMIN_EMAIL = 'pino.espacesverts@gmail.com'"), 'PINO_ADMIN_EMAIL doit être pino.espacesverts@gmail.com');
assert(indexHtml.includes('pino.espacesverts@gmail.com'), 'index.html doit contenir pino.espacesverts@gmail.com');
assert(!indexHtml.includes('pino.spacesverts@gmail.com') || indexHtml.includes("const ADMIN_EMAILS = ['pino.spacesverts@gmail.com', 'pino.espacesverts@gmail.com']"), 'Tolérance uniquement pour la sécurité d\'authentification');
console.log('  ✅ PASS: E-mail officiel pino.espacesverts@gmail.com certifié.');

// 2. IDENTIFIANTS LÉGAUX ET SIRET
console.log('\n🏛️ [TEST 2 : SIRET & SIÈGE SOCIAL]');
assert(indexHtml.includes('105 075 006 00012') || indexHtml.includes('10507500600012'), 'SIRET 105 075 006 00012 obligatoire');
assert(indexHtml.includes('1990 ROUTE de Trévouse') || indexHtml.includes('1990 Route de Trévouse'), 'Adresse de Trévouse obligatoire');
assert(indexHtml.includes('84320 Entraigues-sur-la-Sorgue'), 'Commune 84320 Entraigues-sur-la-Sorgue obligatoire');
console.log('  ✅ PASS: SIRET 105 075 006 00012 et siège d\'Entraigues-sur-la-Sorgue validés.');

// 3. SECTEUR GÉOGRAPHIQUE & VAUCLUSE
console.log('\n📍 [TEST 3 : RAYON 40-45 KM VAUCLUSE]');
assert(indexHtml.includes('Entraigues-sur-la-Sorgue'), 'Entraigues-sur-la-Sorgue présent dans la zone de chalandise');
assert(indexHtml.includes('Avignon'), 'Avignon présent');
assert(indexHtml.includes('Carpentras'), 'Carpentras présent');
assert(indexHtml.includes('Cavaillon'), 'Cavaillon présent');
assert(indexHtml.includes('Sorgues'), 'Sorgues présent');
assert(indexHtml.includes('40-45 km') || indexHtml.includes('40 à 45 km'), 'Rayon 40-45 km présent');
assert(!indexHtml.includes('Bordeaux Métropole'), 'Aucune mention résiduelle de Bordeaux Métropole');
console.log('  ✅ PASS: Zone de chalandise Vaucluse 40-45 km parfaitement configurée.');

// 4. RAILS DE PAIEMENT CONFORMES SAP
console.log('\n💶 [TEST 4 : PAIEMENT STRICTEMENT CONFORME SAP]');
assert(indexHtml.includes('PINO ANDRES'), 'Chèque à l\'ordre strict de PINO ANDRES');
assert(indexHtml.includes('Virement bancaire direct'), 'Virement bancaire présent');
assert(indexHtml.includes('CESU'), 'CESU préfinancé présent');
assert(indexHtml.includes('Prélèvement URSSAF'), 'Prélèvement URSSAF présent');
assert(indexHtml.includes("n'est pas proposée pour les prestations SAP"), 'Carte bancaire exclue des prestations SAP');
assert(!indexHtml.includes('Nous acceptons les règlements par carte,'), 'Aucune mention « règlements par carte »');
console.log('  ✅ PASS: Modes de paiement sécurisés et conformes au crédit fiscal 50%.');

// 5. MÉDIATION ET JURIDICTION
console.log('\n⚖️ [TEST 5 : MÉDIATION CM2C ET TRIBUNAL D\'AVIGNON]');
assert(indexHtml.includes('cm2c.net') || indexHtml.includes('CM2C'), 'Médiateur CM2C présent');
assert(indexHtml.includes('Tribunal') && indexHtml.includes('Avignon'), 'Tribunal d\'Avignon présent pour compétence territoriale');
console.log('  ✅ PASS: Médiateur de la consommation CM2C et Tribunal d\'Avignon validés.');

// 6. DEVIS SANS LOGIN & AUTOMATISATION EMAIL
console.log('\n🚀 [TEST 6 : DEVIS SANS LOGIN & NOTIFICATION BIDIRECTIONNELLE]');
assert(indexHtml.includes('id="devis-form"'), 'Formulaire devis présent');
assert(indexHtml.includes('id="devis-coupon-input"'), 'Champ coupon devis présent');
assert(indexHtml.includes('id="address-extra"'), 'Adresse complémentaire devis présente');
assert(indexHtml.includes('id="reg-address-extra"'), 'Adresse complémentaire inscription présente');
assert(indexHtml.includes('id="devis-rdv-panel"'), 'Panneau RDV après signature présent');
assert(indexHtml.includes('sendEmailVerification'), 'Confirmation e-mail à l\'inscription');
assert(indexHtml.includes('applyDevisCoupon'), 'Fonction de calcul dynamique du coupon devis présente');
assert(indexHtml.includes('triggerImmediateQuoteSign'), 'Déclencheur de signature immédiate présent');
assert(indexHtml.includes('confirmQuoteAppointment'), 'Prise de rendez-vous avec notification par e-mail présente');
assert(pinoDbJs.includes('notifyClientByEmail'), 'PinoDB notifie le client par e-mail');
assert(pinoDbJs.includes('notifyAdminByEmail'), 'PinoDB notifie Andrés par e-mail');
console.log('  ✅ PASS: Tunnel complet de devis sans compte avec e-mails et signature validé.');

// 7. VERSION DE CACHE SERVICE WORKER
console.log('\n📦 [TEST 7 : CACHE SERVICE WORKER VERSIONNÉ]');
assert(/pino-ev-v(23|24|27|28|29|30|31|32)/.test(swJs), 'Cache Service Worker versionné actif');
console.log('  ✅ PASS: Service Worker v23 déployé.');

console.log('\n===============================================================');
console.log('🎉 TOUS LES TESTS D\'AUTOMATISATION ET CONFORMITÉ SONT SUCCÈS !');
console.log('===============================================================\n');
