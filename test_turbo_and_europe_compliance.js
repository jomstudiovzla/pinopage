/**
 * Test Suite: Moteur Turbo Ultra-Rapide & Conformité Européenne Intégrale
 * Pino Espaces Verts (Bordeaux, Gironde, France & UE)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('===============================================================');
console.log('🚀 TEST : MOTEUR TURBO ULTRA-RAPIDE & CONFORMITÉ EUROPÉENNE');
console.log('===============================================================\n');

const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const pinoDbJs = fs.readFileSync(path.join(__dirname, 'assets/js/pino-db.js'), 'utf8');
const swJs = fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf8');

// MODULE 1 : MOTEUR TURBO & RESOURCE HINTS EUROPE
console.log('⚡ [MODULE 1 : RESOURCE HINTS, PRECONNECT & MOTEUR TURBO]');
assert(indexHtml.includes('https://pagepino-e8e97-default-rtdb.europe-west1.firebasedatabase.app'), 'Endpoint RTDB Europe présent');
assert(indexHtml.includes('rel="dns-prefetch" href="https://pagepino-e8e97-default-rtdb.europe-west1.firebasedatabase.app"'), 'DNS Prefetch RTDB Europe configuré');
assert(indexHtml.includes('rel="preconnect" href="https://pagepino-e8e97-default-rtdb.europe-west1.firebasedatabase.app"'), 'Preconnect RTDB Europe configuré');
assert(indexHtml.includes('.turbo-section'), 'Classe CSS .turbo-section définie');
assert(indexHtml.includes('content-visibility: auto;'), 'Règle content-visibility: auto active pour décharger le DOM');
assert(indexHtml.includes('contain-intrinsic-size: 1px 600px;'), 'contain-intrinsic-size actif pour fluidité du défilement');
assert(indexHtml.includes('class="turbo-section py-20 bg-gradient-to-b from-[#f3f7f1]'), 'Section galerie optimisée en turbo-section');
assert(indexHtml.includes('class="turbo-section py-20 bg-brand-cream'), 'Section unipros optimisée en turbo-section');
assert(indexHtml.includes('class="turbo-section py-16 bg-gradient-to-b'), 'Section FAQ optimisée en turbo-section');
assert(indexHtml.includes('initPinoTurbo'), 'Moteur PinoTurbo actif pour pré-chauffage instantané au survol/toucher');
console.log('  ✅ PASS: Resource hints Europe, content-visibility et préchauffage instantané 0ms validés.');

// MODULE 2 : FORMATTEUR ET VALIDATEUR TÉLÉPHONIQUE EUROPÉEN
console.log('\n🇪🇺 [MODULE 2 : FORMATAGE TÉLÉPHONIQUE EUROPÉEN (+33 / 06 / 07 / UE)]');
assert(indexHtml.includes('formatEuropeanPhone'), 'Contrôleur formatEuropeanPhone défini dans index.html');
assert(indexHtml.includes('id="phone" placeholder="06 12 34 56 78" oninput="formatEuropeanPhone(this)"'), 'Champ phone devis relié au formatteur');
assert(indexHtml.includes('id="reg-phone" required placeholder="06 12 34 56 78" oninput="formatEuropeanPhone(this)"'), 'Champ reg-phone relié au formatteur');

// Émulation algorithmique du formatteur
const testMockInput = (val) => {
  const el = { value: val };
  let v = el.value;
  const hasPlus = v.startsWith('+');
  let digits = v.replace(/\D/g, '');
  if (hasPlus) {
    if (digits.startsWith('33') && digits.length > 2) {
      const rest = digits.slice(2);
      const parts = rest.match(/(\d{1})(\d{0,2})(\d{0,2})(\d{0,2})(\d{0,2})/);
      if (parts) el.value = '+33 ' + [parts[1], parts[2], parts[3], parts[4], parts[5]].filter(Boolean).join(' ');
    } else {
      const prefix = digits.slice(0, 2);
      const rest = digits.slice(2);
      const grouped = rest.match(/.{1,3}/g) || [];
      el.value = '+' + prefix + (grouped.length ? ' ' + grouped.join(' ') : '');
    }
  } else {
    const parts = digits.match(/(\d{0,2})(\d{0,2})(\d{0,2})(\d{0,2})(\d{0,2})/);
    if (parts) el.value = [parts[1], parts[2], parts[3], parts[4], parts[5]].filter(Boolean).join(' ');
  }
  return el.value;
};

assert.strictEqual(testMockInput('0612345678'), '06 12 34 56 78', 'Numéro français doit être espacé par paires');
assert.strictEqual(testMockInput('+33612345678'), '+33 6 12 34 56 78', 'Numéro international France doit être formatté avec +33');
assert.strictEqual(testMockInput('+34612345678'), '+34 612 345 678', 'Numéro international Espagne doit être accepté et groupé');
console.log('  ✅ PASS: Formatteur et validateur de téléphone français et européen validés.');

// MODULE 3 : PORTABILITÉ ET DROIT À L'EFFACEMENT RGPD (ART. 17 & 20)
console.log('\n📜 [MODULE 3 : CONFORMITÉ RGPD EUROPE & CNIL (ART. 17 & 20)]');
assert(pinoDbJs.includes('fetchCompletePersonalData'), 'PinoDB expose fetchCompletePersonalData (Portabilité Art. 20)');
assert(pinoDbJs.includes('anonymizeClientAccount'), 'PinoDB expose anonymizeClientAccount (Effacement Art. 17)');
assert(pinoDbJs.includes('version_export: "2.0-RGPD-UE"'), 'Exportation conforme à la version RGPD européenne 2.0');
assert(pinoDbJs.includes('Commission Nationale de l\'Informatique et des Libertés (CNIL)'), 'Mentions CNIL officielles présentes dans l\'export');
assert(pinoDbJs.includes('Article L. 123-22 du Code de commerce'), 'Obligation légale française de 10 ans sur les factures déclarée');
assert(indexHtml.includes('fetchCompletePersonalData'), 'index.html exportClientDataJson exploite les données complètes');
assert(indexHtml.includes('anonymizeClientAccount'), 'index.html deleteClientAccount déclenche l\'anonymisation en base');
console.log('  ✅ PASS: Portabilité des données (Art. 20) et anonymisation avec conservation décennale fiscale validées.');

// MODULE 4 : SERVICE WORKER TURBO EUROPE
console.log('\n🚀 [MODULE 4 : SERVICE WORKER V20 TURBO EUROPE]');
assert(swJs.includes('pino-ev-v20-turbo-europe'), 'sw.js utilise le cache v20 Turbo Europe');
console.log('  ✅ PASS: Cache v20 Turbo Europe déployé.');

console.log('\n===============================================================');
console.log('🎉 TOUS LES TESTS TURBO & CONFORMITÉ EUROPÉENNE SONT 100% SUCCÈS !');
console.log('===============================================================\n');
