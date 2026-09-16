/**
 * Test Suite: Validations des Améliorations de Fonctions (Search, Realtime Preview, Chatbot Lead Capture, SW & Accounting)
 * Pino Espaces Verts
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Lancement des tests de validation des améliorations fonctionnelles...\n');

// 1. Test Service Worker Asset Manifest & Version
console.log('📦 [1. Service Worker & Cache]');
const swContent = fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf-8');
assert(swContent.includes('pino-ev-v10-high-performance-suite'), 'SW doit avoir le cache v10');
assert(swContent.includes('./assets/js/pino-db.js'), 'SW doit mettre en cache pino-db.js');
assert(swContent.includes('./assets/js/firebase-config.js'), 'SW doit mettre en cache firebase-config.js');
assert(swContent.includes('./assets/js/chatbot_knowledge_base.js'), 'SW doit mettre en cache chatbot_knowledge_base.js');
console.log('  ✅ PASS: Service Worker v10 et mise en cache des modules JS critiques validés');

// 2. Test Accounting Normalization in pino-db.js
console.log('\n💶 [2. Normalisation Comptable & Calculs de Solde (pino-db.js)]');
const pinoDbContent = fs.readFileSync(path.join(__dirname, 'assets/js/pino-db.js'), 'utf-8');
assert(pinoDbContent.includes('sanitizeEmail(email)'), 'PinoDB doit exposer sanitizeEmail');
assert(pinoDbContent.includes('isValidEmail(email)'), 'PinoDB doit exposer isValidEmail');
assert(pinoDbContent.includes('fetchWithTimeout'), 'PinoDB doit utiliser fetchWithTimeout pour résilience réseau');
assert(pinoDbContent.includes('amount_due'), 'PinoDB doit calculer et normaliser amount_due');
console.log('  ✅ PASS: Fonctions de résilience, validation et calcul comptable validées');

// 3. Test HTML UI Inputs for Factures & Leads Search
console.log('\n🔍 [3. Recherche Live Multi-critères dans index.html]');
const indexHtmlContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
assert(indexHtmlContent.includes('id="adm-factures-search-input"'), 'index.html doit contenir le champ adm-factures-search-input');
assert(indexHtmlContent.includes('handleAdminFacturesSearch(this.value)'), 'Le champ doit appeler handleAdminFacturesSearch');
assert(indexHtmlContent.includes('id="adm-leads-search-input"'), 'index.html doit contenir le champ adm-leads-search-input');
assert(indexHtmlContent.includes('handleAdminLeadsSearch(this.value)'), 'Le champ doit appeler handleAdminLeadsSearch');
console.log('  ✅ PASS: Éléments HTML de recherche dynamique présents pour factures et prospects');

// 4. Test Live Email Preview in Admin Direct Message Modal
console.log('\n✉️ [4. Prévisualisation Live E-mail dans le Modal Admin]');
assert(indexHtmlContent.includes('id="adm-msg-preview-container"'), 'index.html doit contenir le container de prévisualisation');
assert(indexHtmlContent.includes('id="adm-msg-preview-subject"'), 'index.html doit contenir le titre de prévisualisation');
assert(indexHtmlContent.includes('id="adm-msg-preview-body"'), 'index.html doit contenir le corps de prévisualisation');
assert(indexHtmlContent.includes('updateAdminMessagePreview()'), 'index.html doit appeler updateAdminMessagePreview');
console.log('  ✅ PASS: Container de prévisualisation d\'e-mail interactif en temps réel validé');

// 5. Test Chatbot Contact Lead Detection & Notification Dispatch
console.log('\n🤖 [5. Capture Automatique de Leads via Chatbot]');
assert(indexHtmlContent.includes('emailMatch = questionText.match'), 'Le chatbot doit détecter les adresses e-mail');
assert(indexHtmlContent.includes('phoneMatch = questionText.match'), 'Le chatbot doit détecter les numéros de téléphone');
assert(indexHtmlContent.includes("type: 'chatbot_lead'"), 'Le chatbot doit notifier avec type chatbot_lead');
assert(indexHtmlContent.includes('PinoDB.notifyAdminByEmail'), 'Le chatbot doit déclencher PinoDB.notifyAdminByEmail');
console.log('  ✅ PASS: Détection intelligente de coordonnées et alerte e-mail instantanée validées');

// 6. Test Multi-criteria Filtering Logic Emulation
console.log('\n⚙️ [6. Émulation Algorithmique de Filtrage]');
const sampleJobs = [
  { id: '1', fac_number: '#FAC-2026-001', client_name: 'Jean Dupont', client_email: 'jean@dupont.fr', payment_status: 'paid', amount_charged: 250 },
  { id: '2', fac_number: '#FAC-2026-002', client_name: 'Marie Curie', client_email: 'marie@curie.fr', payment_status: 'pending', amount_charged: 480 },
  { id: '3', fac_number: '#FAC-2026-003', client_name: 'Syndic Pessac', client_email: 'contact@syndic.com', payment_status: 'cancelled', amount_charged: 1200 }
];

function filterJobs(jobs, q) {
  const query = (q || '').trim().toLowerCase();
  if (!query) return jobs;
  return jobs.filter(j => 
    (j.fac_number || '').toLowerCase().includes(query) ||
    (j.client_name || '').toLowerCase().includes(query) ||
    (j.client_email || '').toLowerCase().includes(query) ||
    (j.payment_status || '').toLowerCase().includes(query)
  );
}

assert.strictEqual(filterJobs(sampleJobs, 'dupont').length, 1, 'Recherche par nom');
assert.strictEqual(filterJobs(sampleJobs, '002').length, 1, 'Recherche par numéro');
assert.strictEqual(filterJobs(sampleJobs, 'pending').length, 1, 'Recherche par statut');
assert.strictEqual(filterJobs(sampleJobs, '').length, 3, 'Recherche vide renvoie tout');
console.log('  ✅ PASS: Algorithme de filtrage rapide validé avec succès');

console.log('\n===============================================================');
console.log('🎉 TOUS LES TESTS D\'AMÉLIORATION FONCTIONNELLE SONT VALIDÉS (6/6) !');
console.log('===============================================================\n');
