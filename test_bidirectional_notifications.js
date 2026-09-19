/**
 * test_bidirectional_notifications.js
 * ---------------------------------------------------------------------------
 * Suite de tests unitaires et d'intégration pour le moteur de notifications
 * bidirectionnelles (Admin Andrés Pino ↔ Client Particulier).
 */

const assert = require('assert');

// 1. Mock de l'environnement navigateur & Firebase Realtime Database
const mockDB = {
  leads: {},
  jobs: {},
  users: {},
  audit_logs: [],
  quotes_responses: {},
  client_notifications: {},
  admin_notifications: {},
  clients_records: {}
};

function createMockRef(path) {
  return {
    push: (val) => {
      const key = 'mock_key_' + Math.random().toString(36).substring(2, 9);
      if (val) {
        if (path === 'audit_logs') mockDB.audit_logs.push({ id: key, ...val });
      }
      return {
        key,
        set: async (v) => {
          if (path === 'leads') mockDB.leads[key] = v;
          return true;
        }
      };
    },
    set: async (val) => {
      const parts = path.split('/');
      if (parts[0] === 'admin_notifications') {
        mockDB.admin_notifications[parts[1]] = val;
      } else if (parts[0] === 'client_notifications') {
        mockDB.client_notifications[parts[1]] = mockDB.client_notifications[parts[1]] || {};
        mockDB.client_notifications[parts[1]][parts[2]] = val;
      } else if (parts[0] === 'clients_records') {
        // clients_records/{email}/{sub}/{id}
        const email = parts[1];
        const sub = parts[2];
        const id = parts[3];
        mockDB.clients_records[email] = mockDB.clients_records[email] || {};
        mockDB.clients_records[email][sub] = mockDB.clients_records[email][sub] || {};
        mockDB.clients_records[email][sub][id] = val;
      } else if (parts[0] === 'leads') {
        mockDB.leads[parts[1]] = val;
      } else if (parts[0] === 'jobs') {
        mockDB.jobs[parts[1]] = val;
      }
      return true;
    },
    update: async (val) => {
      const parts = path.split('/');
      if (parts[0] === 'leads' && mockDB.leads[parts[1]]) {
        Object.assign(mockDB.leads[parts[1]], val);
      } else if (parts[0] === 'clients_records') {
        const email = parts[1];
        const sub = parts[2];
        const id = parts[3];
        mockDB.clients_records[email] = mockDB.clients_records[email] || {};
        if (id) {
          mockDB.clients_records[email][sub] = mockDB.clients_records[email][sub] || {};
          mockDB.clients_records[email][sub][id] = Object.assign(mockDB.clients_records[email][sub][id] || {}, val);
        } else {
          mockDB.clients_records[email][sub] = Object.assign(mockDB.clients_records[email][sub] || {}, val);
        }
      }
      return true;
    },
    once: async (event) => {
      const parts = path.split('/');
      let res = null;
      if (parts[0] === 'client_notifications') {
        res = mockDB.client_notifications[parts[1]] || {};
      } else if (parts[0] === 'clients_records') {
        const email = parts[1];
        const sub = parts[2];
        res = (mockDB.clients_records[email] && mockDB.clients_records[email][sub]) || {};
      }
      return {
        val: () => res
      };
    },
    on: (event, cb) => {
      const parts = path.split('/');
      const email = parts[1];
      const sub = parts[2];
      const res = (mockDB.clients_records[email] && mockDB.clients_records[email][sub]) || {};
      cb({ val: () => res });
    },
    off: () => {}
  };
}

global.window = global;
global.localStorage = {
  _store: {},
  getItem: function(k) { return this._store[k] || null; },
  setItem: function(k, v) { this._store[k] = String(v); },
  removeItem: function(k) { delete this._store[k]; }
};

global.firebase = {
  database: () => ({
    ref: (p) => createMockRef(p)
  })
};

// Mock fetch pour enregistrer les appels HTTP
const sentMails = [];
global.fetch = async (url, opts) => {
  const body = JSON.parse(opts.body || '{}');
  sentMails.push({ url, body, method: opts.method });
  return {
    ok: true,
    json: async () => ({ success: true, ok: true })
  };
};

// Charger pino-db.js
require('./assets/js/pino-db.js');
const PinoDB = global.PinoDB;

async function runTests() {
  console.log('🧪 Lancement des tests de notifications bidirectionnelles...\n');
  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  ✅ Test ${total}: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ Test ${total} ÉCHEC: ${name}`);
      console.error(err);
    }
  }

  async function testAsync(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✅ Test ${total}: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ Test ${total} ÉCHEC: ${name}`);
      console.error(err);
    }
  }

  // TEST 1: Méthodes exposées sur PinoDB
  test('PinoDB expose les méthodes de notification bidirectionnelle', () => {
    assert.strictEqual(typeof PinoDB.notifyAdminByEmail, 'function', 'notifyAdminByEmail doit être une fonction');
    assert.strictEqual(typeof PinoDB.notifyClientByEmail, 'function', 'notifyClientByEmail doit être une fonction');
    assert.strictEqual(typeof PinoDB.sendClientDirectMessage, 'function', 'sendClientDirectMessage doit être une fonction');
    assert.strictEqual(typeof PinoDB.fetchClientMessages, 'function', 'fetchClientMessages doit être une fonction');
    assert.strictEqual(typeof PinoDB.listenClientMessages, 'function', 'listenClientMessages doit être une fonction');
  });

  // TEST 2: notifyAdminByEmail transmet un e-mail à pino.spacesverts@gmail.com
  await testAsync('notifyAdminByEmail transmet e-mail et enregistre dans admin_notifications', async () => {
    sentMails.length = 0;
    const res = await PinoDB.notifyAdminByEmail({
      subject: '🌿 [NOUVEAU DEVIS] Demande de Michel Durant (Taille de haies)',
      type: 'new_lead',
      clientName: 'Michel Durant',
      clientEmail: 'michel.durant@gmail.com',
      clientPhone: '06 11 22 33 44',
      leadId: 'lead_test_001',
      amount: '350.00',
      message: 'Demande de taille de cyprès sur 30 mètres.'
    });

    assert.strictEqual(res.ok, true, 'Résultat doit être ok');
    assert.strictEqual(sentMails.length, 1, 'Un appel fetch Web3Forms doit avoir été émis');
    assert.strictEqual(sentMails[0].url, 'https://api.web3forms.com/submit', 'URL Web3Forms correcte');
    assert.strictEqual(sentMails[0].body.to, 'pino.espacesverts@gmail.com', 'Destinataire doit être pino.espacesverts@gmail.com');
    assert.ok(sentMails[0].body.message.includes('Michel Durant'), 'Message doit mentionner le nom du client');

    // Vérifier admin_notifications dans RTDB
    const notifs = Object.values(mockDB.admin_notifications);
    assert.ok(notifs.length > 0, 'admin_notifications doit contenir une entrée');
    const lastNotif = notifs[notifs.length - 1];
    assert.strictEqual(lastNotif.client_email, 'michel.durant@gmail.com');
    assert.strictEqual(lastNotif.type, 'new_lead');
  });

  // TEST 3: notifyClientByEmail transmet FormSubmit au client et copie audit à Andrés
  await testAsync('notifyClientByEmail transmet e-mail direct au client et copie à Andrés', async () => {
    sentMails.length = 0;
    const res = await PinoDB.notifyClientByEmail({
      clientEmail: 'sophie.martin@wanadoo.fr',
      clientName: 'Sophie Martin',
      subject: '🧾 [FACTURE DISPONIBLE] Facture #FAC-2026-099 & Attestation SAP 50%',
      type: 'invoice_issued',
      facNumber: '#FAC-2026-099',
      amountCharged: '400.00',
      netClient: '200.00',
      message: 'Votre facture d\'élagage et entretien est téléchargeable.'
    });

    assert.strictEqual(res.ok, true, 'Résultat doit être ok');
    // FormSubmit + Copie Web3Forms
    assert.strictEqual(sentMails.length, 2, 'Deux appels doivent avoir été émis (FormSubmit + Copie audit)');
    assert.ok(sentMails[0].url.includes('formsubmit.co/ajax/sophie.martin%40wanadoo.fr'), 'URL FormSubmit vers le client');
    assert.strictEqual(sentMails[0].body._replyto, 'pino.espacesverts@gmail.com', 'ReplyTo vers Andrés');
    assert.strictEqual(sentMails[1].url, 'https://api.web3forms.com/submit', 'Copie audit via Web3Forms');
    assert.strictEqual(sentMails[1].body.to, 'pino.espacesverts@gmail.com');

    // Vérifier stockage dans client_notifications et clients_records/messages
    const sanitizedEmail = 'sophie_martin@wanadoo_fr';
    assert.ok(mockDB.client_notifications[sanitizedEmail], 'client_notifications doit être peuplé');
    assert.ok(mockDB.clients_records[sanitizedEmail].messages, 'clients_records/{email}/messages doit archiver le message');
  });

  // TEST 4: sendClientDirectMessage
  await testAsync('sendClientDirectMessage archive le message et notifie par email', async () => {
    sentMails.length = 0;
    const res = await PinoDB.sendClientDirectMessage({
      clientEmail: 'pierre.dubois@orange.fr',
      clientName: 'Pierre Dubois',
      subject: '📅 [CONFIRMATION] Passage d\'intervention demain 9h',
      message: 'Bonjour Pierre, nous venons demain matin pour votre tonte.',
      templateType: 'intervention_confirm',
      notifyEmail: true
    });

    assert.strictEqual(res.ok, true);
    assert.ok(sentMails.length >= 1, 'Email envoyé');
    const sanitizedEmail = 'pierre_dubois@orange_fr';
    const msgs = await PinoDB.fetchClientMessages('pierre.dubois@orange.fr');
    assert.strictEqual(msgs.ok, true);
    assert.ok(msgs.data.length > 0, 'Les messages doivent être récupérables pour ce client');
    assert.strictEqual(msgs.data[0].subject, '📅 [CONFIRMATION] Passage d\'intervention demain 9h');
  });

  // TEST 5: acceptQuote déclenche les notifications bidirectionnelles
  await testAsync('acceptQuote déclenche notification admin + confirmation client', async () => {
    sentMails.length = 0;
    const leadId = 'lead_auto_accept_99';
    mockDB.leads[leadId] = {
      id: leadId,
      full_name: 'Claire Leroy',
      email: 'claire.leroy@free.fr',
      status: 'Devis envoyé'
    };

    const res = await PinoDB.acceptQuote(leadId, {
      name: 'Claire Leroy',
      email: 'claire.leroy@free.fr',
      phone: '06 99 88 77 66',
      notes: 'Accord validé en direct'
    });

    assert.strictEqual(res.ok, true);
    assert.strictEqual(mockDB.leads[leadId].status, 'Devis accepté');

    // Vérifier que les e-mails d'alerte ont été transmis
    assert.ok(sentMails.length >= 2, 'Au moins 2 emails transmis (Admin alert + Client confirm)');
    const adminAlert = sentMails.find(m => m.body.to === 'pino.espacesverts@gmail.com' && m.body.subject.includes('[DEVIS ACCEPTÉ]'));
    assert.ok(adminAlert, 'Andrés Pino doit recevoir l\'alerte d\'acceptation de devis');
    assert.ok(adminAlert.body.message.includes('Claire Leroy'));
  });

  // TEST 6: Isolation stricte des messages entre clients
  await testAsync('Isolation stricte des messages entre clients différents', async () => {
    const msgsClaire = await PinoDB.fetchClientMessages('claire.leroy@free.fr');
    const msgsSophie = await PinoDB.fetchClientMessages('sophie.martin@wanadoo.fr');

    assert.strictEqual(msgsClaire.data.length, 0, 'Claire n\'a pas de message direct archivé');
    assert.strictEqual(msgsSophie.data.length, 1, 'Sophie a bien 1 message direct archivé');
    assert.ok(msgsSophie.data[0].subject.includes('#FAC-2026-099'));
  });

  console.log(`\n========================================`);
  console.log(`RESULTATS : ${passed} / ${total} tests réussis.`);
  console.log(`========================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
