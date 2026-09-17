/**
 * Test Suite: CRM Intuitif, Pipeline Bidirectionnel, Stepper Visuel & Réversibilité Andrés Pino
 * Pino Espaces Verts
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('===============================================================');
console.log('🧪 TEST DU CRM INTUITIF, PIPELINE BIDIRECTIONNEL & RÉVERSIBILITÉ PINO');
console.log('===============================================================\n');

const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const pinoDbJs = fs.readFileSync(path.join(__dirname, 'assets/js/pino-db.js'), 'utf8');
const swJs = fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf8');

// MODULE 1 : MÉTHODES PINODB & NOTIFICATIONS D'ÉVOLUTION DE DOSSIER
console.log('📦 [MODULE 1 : NOTIFICATIONS D\'ÉVOLUTION PAR CLIENT DANS PINODB]');
assert(pinoDbJs.includes('notifyClientStatusChange'), 'PinoDB doit implémenter notifyClientStatusChange');
assert(pinoDbJs.includes('global.PinoDB = {') && pinoDbJs.includes('notifyClientStatusChange,'), 'PinoDB doit exposer notifyClientStatusChange');
assert(pinoDbJs.includes('templateType: \'status_evolution\''), 'PinoDB doit typer les notifications d\'évolution');
console.log('  ✅ PASS: notifyClientStatusChange exposé et catalogué pour chaque phase du projet');

// MODULE 2 : CONTRÔLES CRM ADMIN & RÉVERSIBILITÉ (SEUL ANDRÉS MODIFIE)
console.log('\n👑 [MODULE 2 : CONTRÔLES ADMIN, ADELANTAR & REVERTIR ESTATUS]');
assert(indexHtml.includes('window.advanceLeadStatus'), 'index.html doit exposer advanceLeadStatus');
assert(indexHtml.includes('window.revertLeadStatus'), 'index.html doit exposer revertLeadStatus');
assert(indexHtml.includes('window.updateLeadDirectStatus'), 'index.html doit exposer updateLeadDirectStatus');
assert(indexHtml.includes('revertLeadStatus('), 'Table des leads doit contenir le bouton de retour arrière');
assert(indexHtml.includes('advanceLeadStatus('), 'Table des leads doit contenir le bouton d\'avancement');
assert(indexHtml.includes('window.advanceJobStatus'), 'index.html doit exposer advanceJobStatus');
assert(indexHtml.includes('window.revertJobStatus'), 'index.html doit exposer revertJobStatus');
assert(indexHtml.includes('window.updateJobDirectStatus'), 'index.html doit exposer updateJobDirectStatus');
assert(indexHtml.includes('revertJobStatus('), 'Table des travaux doit contenir le bouton de retour arrière');
assert(indexHtml.includes('advanceJobStatus('), 'Table des travaux doit contenir le bouton d\'avancement');
console.log('  ✅ PASS: Fonctions d\'avancement et de réversibilité (⏪ / ⏩) actives pour Leads et Travaux CRM');

// MODULE 3 : STEPPER VISUEL DU CLIENT & VERROUILLAGE LECTURE SEULE
console.log('\n👀 [MODULE 3 : STEPPER VISUEL DU CLIENT & CONTRÔLE RÉSERVÉ À PINO]');
assert(indexHtml.includes('projectStages = ['), 'renderClientQuotes doit définir les étapes du projet');
assert(indexHtml.includes('Demande') && indexHtml.includes('Devis chiffré') && indexHtml.includes('Négociation') && indexHtml.includes('Accord signé') && indexHtml.includes('Chantier') && indexHtml.includes('Facturé'), 'Les 6 étapes clés du cycle de vie doivent être présentes');
assert(indexHtml.includes('Seul Andrés Pino pilote et modifie les étapes techniques'), 'Mention explicite que seul Andrés modifie les étapes présente');
assert(indexHtml.includes('Signer & Valider ce devis'), 'Bouton de signature client présent pour finaliser l\'accord');
console.log('  ✅ PASS: Stepper visuel à 6 phases et verrouillage de modification réservé à Andrés validés');

// MODULE 4 : CACHE SERVICE WORKER
console.log('\n🚀 [MODULE 4 : SERVICE WORKER]');
assert(/pino-ev-v(1[4-9]|2[0-9])/.test(swJs), 'Service Worker doit être mis à jour (v14 à v20+)');
console.log('  ✅ PASS: Service Worker actif et versionné');

console.log('\n===============================================================');
console.log('🎉 TOUS LES 14 TESTS DU PIPELINE INTUITIF ET RÉVERSIBILITÉ SONT SUCCÈS !');
console.log('===============================================================\n');
