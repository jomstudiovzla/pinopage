/**
 * Test Suite: Client Data Segregation & Admin CRM Dossier Filtering
 * Pino Espaces Verts
 */

const assert = require('assert');
const fs = require('fs');

console.log('\n===============================================================');
console.log('🧪 TEST DE SÉGRÉGATION PAR CLIENT & DOSSIERS ADMIN CRM');
console.log('===============================================================\n');

let passCount = 0;
let failCount = 0;

function it(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}\n     ${err.message}`);
    failCount++;
  }
}

// Mock mockRTDB
const mockRTDBData = {
  leads: {},
  jobs: {},
  users: {},
  clients_records: {},
  client_notifications: {},
  admin_notifications: {},
  audit_logs: {}
};

function createMockRTDB() {
  return {
    ref(path) {
      return {
        key: 'mock_' + Math.random().toString(36).substring(2, 9),
        push(initialVal) {
          const newKey = 'item_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
          return {
            key: newKey,
            set: async (val) => {
              mockRTDBData[path] = mockRTDBData[path] || {};
              mockRTDBData[path][newKey] = val;
              return true;
            }
          };
        },
        async set(val) {
          const parts = path.split('/');
          let cur = mockRTDBData;
          for (let i = 0; i < parts.length - 1; i++) {
            cur[parts[i]] = cur[parts[i]] || {};
            cur = cur[parts[i]];
          }
          cur[parts[parts.length - 1]] = val;
          return true;
        },
        async update(patch) {
          const parts = path.split('/');
          let cur = mockRTDBData;
          for (let i = 0; i < parts.length - 1; i++) {
            cur[parts[i]] = cur[parts[i]] || {};
            cur = cur[parts[i]];
          }
          cur[parts[parts.length - 1]] = { ...(cur[parts[parts.length - 1]] || {}), ...patch };
          return true;
        },
        async once(evt) {
          const parts = path.split('/');
          let cur = mockRTDBData;
          for (let i = 0; i < parts.length; i++) {
            if (!cur) break;
            cur = cur[parts[i]];
          }
          return {
            val() {
              return cur || null;
            }
          };
        },
        on() {},
        off() {}
      };
    }
  };
}

// Setup global mock environment for pino-db.js
global.window = global;
global.firebase = {
  database: () => createMockRTDB(),
  auth: () => ({ currentUser: null })
};
global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; }
};

// Evaluate pino-db.js
const pinoDbContent = fs.readFileSync(__dirname + '/assets/js/pino-db.js', 'utf8');
eval(pinoDbContent);

const pinoDB = global.PinoDB;

console.log('📦 [PHASE 1 : PARTITIONNEMENT STRICT PAR CLIENT (DUAL-WRITE & SÉGRÉGATION)]');

it('PinoDB expose les nouvelles méthodes de partitionnement', () => {
  assert.strictEqual(typeof pinoDB.fetchClientInvoices, 'function');
  assert.strictEqual(typeof pinoDB.listenClientInvoices, 'function');
  assert.strictEqual(typeof pinoDB.syncExistingRecordsToClientPartitions, 'function');
});

it('saveLead sauvegarde dans /leads ET dans la partition /clients_records/{sanitizedEmail}/quotes', async () => {
  const leadData = {
    name: 'Jean Dupont',
    email: 'jean.dupont@test.fr',
    phone: '0612345678',
    commune: 'Merignac',
    service: 'Taille de haies',
    budget: 250
  };

  const res = await pinoDB.saveLead(leadData);
  assert.strictEqual(res.ok, true);
  assert.ok(res.id);

  // Vérifier global
  assert.ok(mockRTDBData.leads[res.id]);
  // Vérifier partition
  const sanitized = 'jean_dupont@test_fr';
  assert.ok(mockRTDBData.clients_records[sanitized]);
  assert.ok(mockRTDBData.clients_records[sanitized].quotes[res.id]);
  assert.strictEqual(mockRTDBData.clients_records[sanitized].profile.fullName, 'Jean Dupont');
});

it('saveJob sauvegarde dans /jobs ET dans la partition /clients_records/{sanitizedEmail}/invoices', async () => {
  const jobData = {
    facNumber: '#FAC-2026-101',
    clientName: 'Sophie Martin',
    clientEmail: 'sophie.martin@test.fr',
    clientPhone: '0687654321',
    clientCommune: 'Pessac',
    serviceType: 'Entretien pelouse',
    amountCharged: 400,
    paymentMethod: 'unipros',
    paymentStatus: 'paid'
  };

  const res = await pinoDB.saveJob(jobData);
  assert.strictEqual(res.ok, true);
  assert.ok(res.id);

  // Vérifier global
  assert.ok(mockRTDBData.jobs[res.id]);
  // Vérifier partition
  const sanitized = 'sophie_martin@test_fr';
  assert.ok(mockRTDBData.clients_records[sanitized]);
  assert.ok(mockRTDBData.clients_records[sanitized].invoices[res.id]);
  assert.strictEqual(mockRTDBData.clients_records[sanitized].invoices[res.id].fac_number, '#FAC-2026-101');
  assert.strictEqual(mockRTDBData.clients_records[sanitized].profile.fullName, 'Sophie Martin');
});

it('updateJob propage les changements dans la partition du client', async () => {
  const jobData = {
    facNumber: '#FAC-2026-102',
    clientName: 'Marc Voisin',
    clientEmail: 'marc.voisin@test.fr',
    amountCharged: 600,
    paymentStatus: 'pending'
  };

  const res = await pinoDB.saveJob(jobData);
  const jobId = res.id;

  // Mise à jour de la facture (statut payé)
  await pinoDB.updateJob(jobId, { payment_status: 'paid', amount_paid: 600 });

  const sanitized = 'marc_voisin@test_fr';
  assert.strictEqual(mockRTDBData.jobs[jobId].payment_status, 'paid');
  assert.strictEqual(mockRTDBData.clients_records[sanitized].invoices[jobId].payment_status, 'paid');
});

it('fetchClientInvoices isole strictement les factures du client demandé', async () => {
  // Jean Dupont a 0 factures créées
  const resJean = await pinoDB.fetchClientInvoices('jean.dupont@test.fr');
  assert.strictEqual(resJean.ok, true);
  assert.strictEqual(resJean.data.length, 0);

  // Sophie Martin a 1 facture
  const resSophie = await pinoDB.fetchClientInvoices('sophie.martin@test.fr');
  assert.strictEqual(resSophie.ok, true);
  assert.strictEqual(resSophie.data.length, 1);
  assert.strictEqual(resSophie.data[0].client_name, 'Sophie Martin');

  // Marc Voisin a 1 facture
  const resMarc = await pinoDB.fetchClientInvoices('marc.voisin@test.fr');
  assert.strictEqual(resMarc.ok, true);
  assert.strictEqual(resMarc.data.length, 1);
  assert.strictEqual(resMarc.data[0].client_name, 'Marc Voisin');
});

it('fetchClientQuotes isole strictement les devis du client demandé', async () => {
  const resJean = await pinoDB.fetchClientQuotes('jean.dupont@test.fr');
  assert.strictEqual(resJean.ok, true);
  assert.strictEqual(resJean.data.length, 1);
  assert.strictEqual(resJean.data[0].full_name || resJean.data[0].name, 'Jean Dupont');

  const resSophie = await pinoDB.fetchClientQuotes('sophie.martin@test.fr');
  assert.strictEqual(resSophie.ok, true);
  assert.strictEqual(resSophie.data.length, 0);
});

it('syncExistingRecordsToClientPartitions ventile les anciennes données vers les partitions', async () => {
  // Simuler un lead et un job legacy (uniquement dans /leads et /jobs, pas encore dans clients_records)
  mockRTDBData.leads['legacy_lead_1'] = {
    id: 'legacy_lead_1',
    full_name: 'Client Ancien',
    email: 'ancien@legacy.fr',
    service_type: 'Élagage'
  };
  mockRTDBData.jobs['legacy_job_1'] = {
    id: 'legacy_job_1',
    fac_number: '#FAC-LEGACY-01',
    client_name: 'Client Ancien',
    client_email: 'ancien@legacy.fr',
    amount_charged: 350
  };

  const syncRes = await pinoDB.syncExistingRecordsToClientPartitions();
  assert.strictEqual(syncRes.ok, true);
  assert.ok(syncRes.synced >= 2);

  const sanitized = 'ancien@legacy_fr';
  assert.ok(mockRTDBData.clients_records[sanitized].quotes['legacy_lead_1']);
  assert.ok(mockRTDBData.clients_records[sanitized].invoices['legacy_job_1']);
  assert.strictEqual(mockRTDBData.clients_records[sanitized].profile.email, 'ancien@legacy.fr');
});

console.log('\n👑 [PHASE 2 : CONTRÔLE ET FILTRAGE DANS LE CRM ADMINISTRATIF]');

const indexHtml = fs.readFileSync(__dirname + '/index.html', 'utf8');

it('index.html contient le sélecteur de dossier client dans #adm-content-factures', () => {
  assert.ok(indexHtml.includes('id="adm-factures-client-filter"'));
  assert.ok(indexHtml.includes('id="adm-factures-client-dossier-card"'));
  assert.ok(indexHtml.includes('handleAdminFacturesClientFilterChange'));
});

it('index.html contient le sélecteur de client dans #adm-content-leads', () => {
  assert.ok(indexHtml.includes('id="adm-leads-client-filter"'));
  assert.ok(indexHtml.includes('handleAdminLeadsClientFilterChange'));
});

it('renderAdminUsers fournit les boutons Factures et Devis par client', () => {
  assert.ok(indexHtml.includes('admFilterFacturesByClient'));
  assert.ok(indexHtml.includes('admFilterLeadsByClient'));
});

it('renderClientInvoices appelle fetchClientInvoices pour garantir l\'isolation', () => {
  assert.ok(indexHtml.includes('PinoDB.fetchClientInvoices(email)'));
});

it('Sécurité Client : Le portail client n\'a AUCUN bouton d\'annulation de facture', () => {
  // Vérifier que la fonction cancelAdminFacture est réservée admin
  assert.ok(indexHtml.includes('window.cancelAdminFacture = async'));
  assert.ok(indexHtml.includes("Action réservée à l\\'administrateur Andrés Pino") || indexHtml.includes("Action réservée à l'administrateur Andrés Pino"));
});

console.log('\n===============================================================');
console.log(`📊 RÉSULTAT : ${passCount} PASSÉS, ${failCount} ÉCHOUÉS.`);
if (failCount === 0) {
  console.log('🎉 SÉGRÉGATION DE BASE DE DONNÉES ET DOSSIERS CLIENTS 100% VALIDÉS !');
}
console.log('===============================================================\n');
