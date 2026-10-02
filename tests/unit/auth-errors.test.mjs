import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  explainFirebaseAuthError,
  authErrorCode,
  isValidClientEmail,
  passwordPolicyError,
} = require('../../assets/js/pino-auth-errors.js');

describe('pino-auth-errors', () => {
  it('extrait le code Firebase', () => {
    assert.equal(authErrorCode({ code: 'auth/email-already-in-use' }), 'auth/email-already-in-use');
    assert.equal(authErrorCode('auth/weak-password'), 'auth/weak-password');
    assert.equal(authErrorCode({ message: 'Firebase: Error (auth/unauthorized-domain).' }), 'auth/unauthorized-domain');
  });

  it('mappe les codes d\'inscription en français (jamais le message générique pour un code connu)', () => {
    const generic = 'Nous n\'avons pas pu créer votre compte. Vérifiez votre adresse e-mail et réessayez.';
    const cases = {
      'auth/email-already-in-use': /déjà un compte/,
      'auth/invalid-email': /invalide/,
      'auth/weak-password': /8 caractères/,
      'auth/operation-not-allowed': /pas disponible/,
      'auth/unauthorized-domain': /pinoespacesverts\.online/,
      'auth/network-request-failed': /réseau/,
      'auth/too-many-requests': /Trop de tentatives/,
      'auth/operation-not-supported-in-this-environment': /cookies/,
    };
    for (const [code, re] of Object.entries(cases)) {
      const msg = explainFirebaseAuthError({ code }, 'register');
      assert.match(msg, re, code);
      assert.notEqual(msg, generic, code);
    }
  });

  it('garde le message générique seulement sans code connu', () => {
    const msg = explainFirebaseAuthError({ code: 'auth/mystery-xyz' }, 'register');
    assert.match(msg, /n'avons pas pu créer votre compte/);
  });

  it('ne divulgue pas si un compte existe lors d\'une réinitialisation', () => {
    const msg = explainFirebaseAuthError({ code: 'auth/user-not-found' }, 'reset');
    assert.equal(msg, '');
  });

  it('valide e-mail et mot de passe côté client', () => {
    assert.equal(isValidClientEmail('claire@example.com'), true);
    assert.equal(isValidClientEmail('pas-un-email'), false);
    assert.equal(isValidClientEmail('a@b'), false);
    assert.equal(passwordPolicyError('1234567'), 'Le mot de passe doit comporter au moins 8 caractères.');
    assert.equal(passwordPolicyError('Jardin-2026!'), '');
  });

  it('login : identifiants incorrects regroupés, sans fuite technique', () => {
    for (const code of ['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential']) {
      assert.match(explainFirebaseAuthError({ code }, 'login'), /incorrect/);
    }
  });

  it('google : popup fermé / annulé reste silencieux', () => {
    for (const code of ['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/redirect-cancelled-by-user']) {
      assert.equal(explainFirebaseAuthError({ code }, 'google'), '');
    }
  });

  it('google : codes OAuth traduits, jamais le générique e-mail', () => {
    assert.match(explainFirebaseAuthError({ code: 'auth/operation-not-allowed' }, 'google'), /connexion Google/i);
    assert.match(explainFirebaseAuthError({ code: 'auth/unauthorized-domain' }, 'google'), /pinoespacesverts\.online/);
    assert.match(explainFirebaseAuthError({ code: 'auth/account-exists-with-different-credential' }, 'google'), /autre mode/);
    assert.match(explainFirebaseAuthError({ code: 'auth/network-request-failed' }, 'google'), /réseau/);
    assert.match(explainFirebaseAuthError({ code: 'auth/popup-blocked' }, 'google'), /pop-up/i);
  });

  it('apple : operation-not-allowed nomme Apple', () => {
    assert.match(explainFirebaseAuthError({ code: 'auth/operation-not-allowed' }, 'apple'), /Apple/);
  });
});
