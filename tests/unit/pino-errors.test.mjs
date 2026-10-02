import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  CATEGORIES,
  classify,
  normalize,
  sanitizePii,
  newCorrelationId,
  fetchWithTimeout,
} = require('../../assets/js/pino-errors.js');

const REQUIRED = ['code', 'technical', 'userMessage', 'action', 'retryable', 'severity'];
const NAMES = [
  'AUTH_ERROR',
  'VALIDATION_ERROR',
  'NETWORK_ERROR',
  'PERMISSION_DENIED',
  'NOT_FOUND',
  'RATE_LIMITED',
  'EMAIL_DELIVERY_ERROR',
  'FIRESTORE_ERROR',
  'RTDB_ERROR',
  'UNKNOWN_ERROR',
];

describe('PinoErrors — catalogue', () => {
  it('expose chaque catégorie avec code, messages FR, action, retry, sévérité', () => {
    for (const name of NAMES) {
      const spec = CATEGORIES[name];
      assert.ok(spec, name);
      for (const key of REQUIRED) {
        assert.notEqual(spec[key], undefined, name + '.' + key);
        assert.notEqual(spec[key], null, name + '.' + key);
      }
      assert.match(spec.userMessage, /[éèêàùçîôÉÈÀ]|identité|réessay|introuvable|e-mail|données|erreur|autoris|tentatives|connexion|élément|saisies/i);
      assert.equal(typeof spec.retryable, 'boolean');
    }
  });
});

describe('PinoErrors — classify / normalize', () => {
  it('classe auth, réseau, 403, 404, 429, mail, RTDB', () => {
    assert.equal(classify({ code: 'auth/network-request-failed' }), 'AUTH_ERROR');
    assert.equal(classify({ message: 'Failed to fetch' }), 'NETWORK_ERROR');
    assert.equal(classify({ status: 403 }), 'PERMISSION_DENIED');
    assert.equal(classify({ status: 404 }), 'NOT_FOUND');
    assert.equal(classify({ status: 429 }), 'RATE_LIMITED');
    assert.equal(classify({ message: 'worker_failed', kind: 'email' }), 'EMAIL_DELIVERY_ERROR');
    assert.equal(classify({ message: 'lead_not_saved' }), 'RTDB_ERROR');
    assert.equal(classify({ category: 'FIRESTORE_ERROR' }), 'FIRESTORE_ERROR');
    assert.equal(classify({ code: 'mystery' }), 'UNKNOWN_ERROR');
  });

  it('normalize porte un identifiant de corrélation et un message utilisateur', () => {
    const n = normalize({ message: 'Failed to fetch' }, 'devis');
    assert.equal(n.category, 'NETWORK_ERROR');
    assert.equal(n.retryable, true);
    assert.match(n.userMessage, /réseau|connexion/i);
    assert.match(n.correlationId, /^pino-[a-z0-9]+-[a-z0-9]+$/);
    assert.equal(n.context, 'devis');
  });
});

describe('PinoErrors — PII et timeout', () => {
  it('masque e-mail et téléphone dans les journaux', () => {
    const out = sanitizePii('Contact andres@test.fr au 0612345678 merci');
    assert.equal(out.includes('andres@test.fr'), false);
    assert.equal(out.includes('0612345678'), false);
    assert.match(out, /\[email\]/);
    assert.match(out, /\[tel\]/);
  });

  it('newCorrelationId est unique sur deux appels', () => {
    const a = newCorrelationId();
    const b = newCorrelationId();
    assert.notEqual(a, b);
    assert.match(a, /^pino-/);
  });

  it('fetchWithTimeout abort après le délai', async () => {
    const fakeFetch = () => new Promise(() => {});
    const prev = global.fetch;
    global.fetch = fakeFetch;
    try {
      await assert.rejects(
        () => fetchWithTimeout('https://example.invalid', {}, 20),
        (err) => err.category === 'NETWORK_ERROR'
      );
    } finally {
      global.fetch = prev;
    }
  });
});
