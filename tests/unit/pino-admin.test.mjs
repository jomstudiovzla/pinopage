import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  ADMIN_EMAILS,
  isAllowlistEmail,
  hasAdminClaim,
  isAdmin,
  isAdminPath,
  decideAdminRoute,
} = require('../../assets/js/pino-admin.js');

describe('PinoAdmin — liste et claims', () => {
  it('expose les trois e-mails admin', () => {
    assert.deepEqual(ADMIN_EMAILS, [
      'pino.espacesverts@gmail.com',
      'pino.spacesverts@gmail.com',
      'jomstudiovzla@gmail.com',
    ]);
    assert.equal(isAllowlistEmail('Pino.EspacesVerts@gmail.com'), true);
    assert.equal(isAllowlistEmail('alice@example.com'), false);
    assert.equal(isAllowlistEmail(''), false);
  });

  it('détecte admin:true et role:"admin"', () => {
    assert.equal(hasAdminClaim({ admin: true }), true);
    assert.equal(hasAdminClaim({ role: 'admin' }), true);
    assert.equal(hasAdminClaim({ role: 'Admin' }), true);
    assert.equal(hasAdminClaim({ admin: false, role: 'client' }), false);
    assert.equal(hasAdminClaim({}), false);
    assert.equal(hasAdminClaim(null), false);
  });

  it('refuse un e-mail liste non vérifié, accepte claim vérifié hors liste', () => {
    assert.equal(isAdmin({
      email: 'pino.espacesverts@gmail.com',
      emailVerified: false,
      claims: {},
    }), false);
    assert.equal(isAdmin({
      email: 'pino.espacesverts@gmail.com',
      emailVerified: true,
      claims: {},
    }), true);
    assert.equal(isAdmin({
      email: 'staff@example.com',
      emailVerified: true,
      claims: { admin: true, role: 'admin' },
    }), true);
    assert.equal(isAdmin({
      email: 'alice@example.com',
      emailVerified: true,
      claims: { role: 'client' },
    }), false);
    assert.equal(isAdmin({
      email: 'staff@example.com',
      emailVerified: false,
      claims: { admin: true },
    }), false);
  });
});

describe('PinoAdmin — route /admin', () => {
  it('reconnaît /admin et /admin.html', () => {
    assert.equal(isAdminPath('/admin'), true);
    assert.equal(isAdminPath('/admin/'), true);
    assert.equal(isAdminPath('/admin.html'), true);
    assert.equal(isAdminPath('https://pinoespacesverts.online/admin?x=1'), true);
    assert.equal(isAdminPath('/'), false);
    assert.equal(isAdminPath('/403.html'), false);
    assert.equal(isAdminPath('/administration'), false);
  });

  it('décide login / forbidden / open / ignore', () => {
    assert.equal(decideAdminRoute({ pathname: '/', firebaseUser: null, isAdmin: false }), 'ignore');
    assert.equal(decideAdminRoute({ pathname: '/admin', firebaseUser: null, isAdmin: false }), 'login');
    assert.equal(decideAdminRoute({ pathname: '/admin', firebaseUser: { uid: 'c' }, isAdmin: false }), 'forbidden');
    assert.equal(decideAdminRoute({ pathname: '/admin', firebaseUser: { uid: 'a' }, isAdmin: true }), 'open');
    assert.equal(decideAdminRoute({ pathname: '/admin.html', firebaseUser: { uid: 'a' }, isAdmin: true }), 'open');
  });
});
