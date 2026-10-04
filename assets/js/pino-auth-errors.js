/**
 * Messages Firebase Auth en français (FASE 2).
 * Le code technique est journalisé ; l'interface n'affiche jamais de secret ni de stack.
 */
(function (global) {
  'use strict';

  var AUTH_FR = {
    'auth/email-already-in-use': 'Cette adresse e-mail possède déjà un compte. Connectez-vous ou utilisez « Mot de passe oublié ».',
    'auth/invalid-email': 'Format d\'adresse e-mail invalide.',
    'auth/weak-password': 'Mot de passe trop faible : 8 caractères minimum.',
    'auth/missing-password': 'Saisissez un mot de passe (8 caractères minimum).',
    'auth/missing-email': 'Saisissez une adresse e-mail valide.',
    'auth/operation-not-allowed': 'L\'inscription par e-mail est momentanément indisponible. Créez votre compte en 1 clic avec le bouton « Continuer avec Google » ci-dessus — votre remise -20 % sera activée de la même façon.',
    'auth/admin-restricted-operation': 'Cette opération est temporairement restreinte. Réessayez dans quelques minutes.',
    'auth/unauthorized-domain': 'Ce domaine n\'est pas encore autorisé pour la création de compte. Ouvrez le site sur https://pinoespacesverts.online',
    'auth/operation-not-supported-in-this-environment': 'Activez le stockage web ou les cookies dans les réglages de votre navigateur, puis réessayez.',
    'auth/web-storage-unsupported': 'Ce navigateur bloque le stockage nécessaire à la connexion. Autorisez les cookies pour ce site.',
    'auth/network-request-failed': 'Connexion réseau impossible. Vérifiez votre connexion puis réessayez.',
    'auth/too-many-requests': 'Trop de tentatives. Réessayez dans quelques minutes.',
    'auth/user-disabled': 'Ce compte a été désactivé. Contactez Pino Espaces Verts.',
    'auth/user-not-found': 'Adresse e-mail ou mot de passe incorrect.',
    'auth/wrong-password': 'Adresse e-mail ou mot de passe incorrect.',
    'auth/invalid-credential': 'Adresse e-mail ou mot de passe incorrect.',
    'auth/invalid-login-credentials': 'Adresse e-mail ou mot de passe incorrect.',
    'auth/invalid-api-key': 'Configuration d\'authentification incomplète. Rechargez la page.',
    'auth/app-not-authorized': 'Cette application n\'est pas autorisée à s\'authentifier. Rechargez la page.',
    'auth/app-deleted': 'Service d\'authentification indisponible. Rechargez la page.',
    'auth/quota-exceeded': 'Le service est saturé pour le moment. Réessayez dans quelques minutes.',
    'auth/internal-error': 'Le service d\'authentification a rencontré une erreur. Réessayez dans un instant.',
    'auth/timeout': 'La demande a expiré. Vérifiez votre connexion puis réessayez.',
    'auth/user-token-expired': 'Votre session a expiré. Reconnectez-vous.',
    'auth/requires-recent-login': 'Pour des raisons de sécurité, reconnectez-vous puis réessayez.',
    'auth/invalid-action-code': 'Ce lien n\'est plus valide. Demandez un nouvel e-mail.',
    'auth/expired-action-code': 'Ce lien a expiré. Demandez un nouvel e-mail.',
    'auth/argument-error': 'Vérifiez votre adresse e-mail et votre mot de passe, puis réessayez.',
    'auth/invalid-password': 'Mot de passe trop faible : 8 caractères minimum.',
    'auth/email-already-exists': 'Cette adresse e-mail possède déjà un compte. Connectez-vous ou utilisez « Mot de passe oublié ».',
    'auth/popup-blocked': 'Le navigateur a bloqué la fenêtre de connexion. Autorisez les pop-ups pour ce site, ou réessayez : une redirection va s\'ouvrir.',
    'auth/popup-closed-by-user': '',
    'auth/cancelled-popup-request': '',
    'auth/redirect-cancelled-by-user': '',
    'auth/redirect-operation-pending': 'Une connexion est déjà en cours. Attendez la fin de la redirection, puis réessayez.',
    'auth/account-exists-with-different-credential': 'Un compte existe déjà avec cet e-mail via un autre mode de connexion. Connectez-vous avec e-mail / mot de passe, puis liez Google dans votre espace.'
  };

  var FALLBACK = {
    register: 'Nous n\'avons pas pu créer votre compte. Vérifiez votre adresse e-mail et réessayez.',
    login: 'Nous n\'avons pas pu vérifier votre identité. Réessayez.',
    reset: 'Impossible d\'envoyer l\'e-mail de réinitialisation pour le moment. Réessayez.',
    verify: 'Envoi impossible pour le moment. Réessayez dans quelques minutes.',
    google: 'Connexion Google indisponible pour le moment. Utilisez e-mail / mot de passe ci-dessous.',
    apple: 'Connexion Apple indisponible pour le moment. Utilisez e-mail / mot de passe ci-dessous.',
    default: 'Authentification impossible pour le moment. Réessayez.'
  };

  function authErrorCode(err) {
    if (!err) return '';
    if (typeof err === 'string') {
      if (err.indexOf('auth/') === 0) return err;
      return '';
    }
    var code = err.code || '';
    if (code) return String(code);
    var msg = String(err.message || '');
    var m = msg.match(/auth\/[a-z0-9-]+/i);
    return m ? m[0].toLowerCase() : '';
  }

  function isValidClientEmail(email) {
    var s = String(email || '').trim().toLowerCase();
    if (!s || s.length > 254) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  }

  function passwordPolicyError(pass) {
    if (!pass || String(pass).length < 8) {
      return 'Le mot de passe doit comporter au moins 8 caractères.';
    }
    return '';
  }

  function explainFirebaseAuthError(err, context) {
    var ctx = context || 'default';
    var code = authErrorCode(err);
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[pino-auth]', ctx, code || '(sans code)', err && err.message ? String(err.message).slice(0, 180) : '');
    }
    if (ctx === 'reset' && (code === 'auth/user-not-found' || code === 'auth/invalid-email')) {
      if (code === 'auth/invalid-email') return AUTH_FR['auth/invalid-email'];
      return '';
    }
    if (ctx === 'google' || ctx === 'apple') {
      var who = ctx === 'apple' ? 'Apple' : 'Google';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request' || code === 'auth/redirect-cancelled-by-user') {
        return '';
      }
      if (code === 'auth/operation-not-allowed') {
        return 'La connexion ' + who + ' n\'est pas disponible pour le moment. Utilisez e-mail / mot de passe ci-dessous.';
      }
      if (code === 'auth/unauthorized-domain') {
        return 'Ce domaine n\'est pas encore autorisé pour ' + who + '. Ouvrez le site sur https://pinoespacesverts.online';
      }
      if (code === 'auth/account-exists-with-different-credential') {
        return 'Un compte existe déjà avec cet e-mail via un autre mode de connexion. Utilisez le mode d\'origine, puis liez ' + who + ' dans votre espace.';
      }
    }
    if (Object.prototype.hasOwnProperty.call(AUTH_FR, code) && AUTH_FR[code]) return AUTH_FR[code];
    if (Object.prototype.hasOwnProperty.call(AUTH_FR, code) && AUTH_FR[code] === '') return '';
    return FALLBACK[ctx] || FALLBACK.default;
  }

  var api = {
    AUTH_FR: AUTH_FR,
    authErrorCode: authErrorCode,
    isValidClientEmail: isValidClientEmail,
    passwordPolicyError: passwordPolicyError,
    explainFirebaseAuthError: explainFirebaseAuthError
  };

  global.explainFirebaseAuthError = explainFirebaseAuthError;
  global.pinoAuthErrorCode = authErrorCode;
  global.pinoIsValidClientEmail = isValidClientEmail;
  global.pinoPasswordPolicyError = passwordPolicyError;
  global.PinoAuthErrors = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
