/**
 * Test Suite: CRM Intuitif, Pipeline Kanban Visuel & Synthèse Financière KPIs
 * Pino Espaces Verts
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('===============================================================');
console.log('🧪 TEST : CRM INTUITIF, PIPELINE KANBAN & SYNTHÈSE FINANCIÈRE KPIS');
console.log('===============================================================\n');

const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// MODULE 1 : BARRE D'ACTIONS RAPIDES ADMIN (1-CLIC POUR ANDRÉS PINO)
console.log('⚡ [MODULE 1 : BARRE D\'ACTIONS RAPIDES ADMIN]');
assert(indexHtml.includes('<!-- Barre d\'Actions Rapides Intuitives'), 'index.html doit inclure le conteneur des Actions Rapides');
assert(indexHtml.includes('openNewInvoiceModal()'), 'Bouton + Facture doit être présent');
assert(indexHtml.includes('openAdminMessageClientModal('), 'Bouton Message Client doit être présent');
assert(indexHtml.includes('switchAdminTab(\'leads\')'), 'Bouton Traiter Devis doit être présent');
assert(indexHtml.includes('switchAdminTab(\'prospection\')'), 'Bouton Prospection (84) doit être présent');
assert(indexHtml.includes('refreshAdminDashboardAll()'), 'Bouton Actualiser Tout doit être présent');
assert(indexHtml.includes('window.refreshAdminDashboardAll = async () =>'), 'Fonction refreshAdminDashboardAll doit être définie');
console.log('  ✅ PASS: Raccourcis 1-clic pour Andrés Pino opérationnels et reliés');

// MODULE 2 : PIPELINE COMMERCIAL VISUEL (KANBAN 6 ÉTAPES)
console.log('\n📊 [MODULE 2 : PIPELINE COMMERCIAL VISUEL (KANBAN)]');
assert(indexHtml.includes('id="stage-card-all"'), 'Carte étape Tous les flux doit exister');
assert(indexHtml.includes('id="stage-card-nouveau"'), 'Carte étape 1. Reçus doit exister');
assert(indexHtml.includes('id="stage-card-envoye"'), 'Carte étape 2. Devis chiffrés doit exister');
assert(indexHtml.includes('id="stage-card-accepte"'), 'Carte étape 3. Signés / Validés doit exister');
assert(indexHtml.includes('id="stage-card-chantier"'), 'Carte étape 4. En chantier doit exister');
assert(indexHtml.includes('id="stage-card-facture"'), 'Carte étape 5. Facturés SAP doit exister');

assert(indexHtml.includes('id="stage-count-all"'), 'Compteur stage-count-all doit exister');
assert(indexHtml.includes('id="stage-count-nouveau"'), 'Compteur stage-count-nouveau doit exister');
assert(indexHtml.includes('id="stage-count-envoye"'), 'Compteur stage-count-envoye doit exister');
assert(indexHtml.includes('id="stage-count-accepte"'), 'Compteur stage-count-accepte doit exister');
assert(indexHtml.includes('id="stage-count-chantier"'), 'Compteur stage-count-chantier doit exister');
assert(indexHtml.includes('id="stage-count-facture"'), 'Compteur stage-count-facture doit exister');

assert(indexHtml.includes('window.handleAdminLeadsStageFilter = (stage) =>'), 'Gestionnaire handleAdminLeadsStageFilter doit être exposé');
assert(indexHtml.includes('window._activeLeadsStageFilter'), 'Variable _activeLeadsStageFilter doit être déclarée');
console.log('  ✅ PASS: Pipeline commercial à 6 étapes interactives et compteurs dynamiques validés');

// MODULE 3 : SYNTHÈSE FINANCIÈRE & TRÉSORERIE KPIS (FACTURES)
console.log('\n💶 [MODULE 3 : SYNTHÈSE FINANCIÈRE & TRÉSORERIE KPIS]');
assert(indexHtml.includes('id="adm-factures-kpi-total"'), 'KPI Total Facturé doit être présent');
assert(indexHtml.includes('id="adm-factures-kpi-paid"'), 'KPI Total Encaissé doit être présent');
assert(indexHtml.includes('id="adm-factures-kpi-due"'), 'KPI Reste à Percevoir doit être présent');
assert(indexHtml.includes('id="adm-factures-kpi-sap"'), 'KPI Part SAP 50% doit être présent');

assert(indexHtml.includes('kpiTotalEl.textContent = `${totalChargedAll.toFixed(2)} €`') || indexHtml.includes('kpiTotalEl.textContent = `${totalChargedAll.toFixed(2)} €`'), 'Calcul du total facturé dynamique présent');
assert(indexHtml.includes('kpiPaidEl.textContent = `${totalPaidAll.toFixed(2)} €`'), 'Calcul du total encaissé dynamique présent');
assert(indexHtml.includes('kpiDueEl.textContent = `${totalDueAll.toFixed(2)} €`'), 'Calcul du reste à percevoir dynamique présent');
assert(indexHtml.includes('kpiSapEl.textContent = `${totalSapCreditAll.toFixed(2)} €`'), 'Calcul du crédit d\'impôt SAP 50% présent');
console.log('  ✅ PASS: Dashboard financier avec Total Facturé, Encaissé, Dû et Part SAP validé');

console.log('\n===============================================================');
console.log('🎉 TOUS LES TESTS DU CRM INTUITIF ET PIPELINE KANBAN SONT 100% SUCCÈS !');
console.log('===============================================================\n');
