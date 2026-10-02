/**
 * Autorisation admin v1 (FASE 7).
 * Claims Firebase (admin:true / role:"admin") + liste e-mail vérifiée.
 * L'accès réel aux données reste imposé par database.rules.json.
 */
(function (global) {
  'use strict';

  var ADMIN_EMAILS = [
    'pino.espacesverts@gmail.com',
    'pino.spacesverts@gmail.com',
    'jomstudiovzla@gmail.com'
  ];

  function normEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  function isAllowlistEmail(email) {
    return ADMIN_EMAILS.indexOf(normEmail(email)) !== -1;
  }

  function hasAdminClaim(claims) {
    if (!claims || typeof claims !== 'object') return false;
    if (claims.admin === true || claims.admin === 'true') return true;
    return String(claims.role || '').toLowerCase() === 'admin';
  }

  function isAdmin(input) {
    var src = input || {};
    if (src.emailVerified === false) return false;
    if (hasAdminClaim(src.claims)) return true;
    if (!isAllowlistEmail(src.email)) return false;
    return src.emailVerified !== false;
  }

  function isAdminPath(pathname) {
    var p = String(pathname || '');
    try {
      if (typeof URL !== 'undefined' && /^https?:/i.test(p)) {
        p = new URL(p).pathname;
      }
    } catch (e) { /* pathname déjà relatif */ }
    p = p.split('?')[0].split('#')[0].replace(/\/+$/, '');
    if (p === '') p = '/';
    return p === '/admin' || p === '/admin.html';
  }

  /**
   * ignore | login | forbidden | open
   * firebaseUser : objet Auth (ou null). isAdmin : bool déjà calculé.
   */
  function decideAdminRoute(opts) {
    var o = opts || {};
    if (!isAdminPath(o.pathname)) return 'ignore';
    if (!o.firebaseUser) return 'login';
    if (!o.isAdmin) return 'forbidden';
    return 'open';
  }

  var api = {
    ADMIN_EMAILS: ADMIN_EMAILS.slice(),
    isAllowlistEmail: isAllowlistEmail,
    hasAdminClaim: hasAdminClaim,
    isAdmin: isAdmin,
    isAdminPath: isAdminPath,
    decideAdminRoute: decideAdminRoute
  };

  global.PinoAdmin = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
