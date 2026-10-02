/**
 * Couche globale d'erreurs (FASE 6).
 * Catalogue FR, toast non XSS, capture onerror / unhandledrejection,
 * timeout + retry, anti double-envoi, identifiant de corrélation.
 * Journal local uniquement (pas de Sentry sans consentement CNIL).
 */
(function (global) {
  'use strict';

  var RING_KEY = 'pino_error_ring';
  var RING_MAX = 20;
  var TOAST_ID = 'app-notification-toast';
  var DEFAULT_TIMEOUT_MS = 8000;
  var UNCAUGHT_TOASTED = false;

  var CATEGORIES = {
    AUTH_ERROR: {
      code: 'AUTH_ERROR',
      technical: 'Authentication failure',
      userMessage: 'Nous n\'avons pas pu vérifier votre identité. Réessayez.',
      action: 'Réessayez, ou utilisez un autre mode de connexion.',
      retryable: true,
      severity: 'warning'
    },
    VALIDATION_ERROR: {
      code: 'VALIDATION_ERROR',
      technical: 'Client-side validation failed',
      userMessage: 'Vérifiez les informations saisies, puis réessayez.',
      action: 'Corrigez les champs indiqués.',
      retryable: false,
      severity: 'info'
    },
    NETWORK_ERROR: {
      code: 'NETWORK_ERROR',
      technical: 'Network or timeout failure',
      userMessage: 'Connexion réseau impossible. Vérifiez votre connexion, puis réessayez.',
      action: 'Vérifiez le réseau, puis réessayez.',
      retryable: true,
      severity: 'warning'
    },
    PERMISSION_DENIED: {
      code: 'PERMISSION_DENIED',
      technical: 'Permission denied',
      userMessage: 'Vous n\'avez pas l\'autorisation d\'effectuer cette action.',
      action: 'Reconnectez-vous, ou contactez Pino Espaces Verts.',
      retryable: false,
      severity: 'error'
    },
    NOT_FOUND: {
      code: 'NOT_FOUND',
      technical: 'Resource not found',
      userMessage: 'Élément introuvable. Il a peut-être été déplacé ou supprimé.',
      action: 'Revenez à l\'accueil, ou contactez Andrés.',
      retryable: false,
      severity: 'info'
    },
    RATE_LIMITED: {
      code: 'RATE_LIMITED',
      technical: 'Too many requests',
      userMessage: 'Trop de tentatives. Réessayez dans quelques minutes.',
      action: 'Patientez, puis réessayez.',
      retryable: true,
      severity: 'warning'
    },
    EMAIL_DELIVERY_ERROR: {
      code: 'EMAIL_DELIVERY_ERROR',
      technical: 'Transactional email delivery failed',
      userMessage: 'L\'e-mail n\'a pas pu partir tout de suite. Il sera renvoyé dès que possible.',
      action: 'Gardez la page ouverte, ou contactez Andrés au 06 51 59 40 34.',
      retryable: true,
      severity: 'warning'
    },
    RTDB_ERROR: {
      code: 'RTDB_ERROR',
      technical: 'Realtime Database write/read failed',
      userMessage: 'Les données n\'ont pas pu être enregistrées. Réessayez dans un instant.',
      action: 'Réessayez. Si le problème continue, contactez Andrés.',
      retryable: true,
      severity: 'error'
    },
    FIRESTORE_ERROR: {
      code: 'FIRESTORE_ERROR',
      technical: 'Document store failure (alias RTDB en v1)',
      userMessage: 'Les données n\'ont pas pu être enregistrées. Réessayez dans un instant.',
      action: 'Réessayez. Si le problème continue, contactez Andrés.',
      retryable: true,
      severity: 'error'
    },
    UNKNOWN_ERROR: {
      code: 'UNKNOWN_ERROR',
      technical: 'Unclassified error',
      userMessage: 'Une erreur inattendue s\'est produite. Rechargez la page, puis réessayez.',
      action: 'Rechargez la page. Si le problème continue, contactez Andrés.',
      retryable: true,
      severity: 'error'
    }
  };

  function sanitizePii(str) {
    return String(str || '')
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
      .replace(/(?:\+33|0)[1-9](?:[\s.-]?\d{2}){4}/g, '[tel]')
      .replace(/\s+/g, ' ')
      .slice(0, 300);
  }

  function newCorrelationId() {
    return 'pino-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  function classify(err) {
    if (!err && err !== 0) return 'UNKNOWN_ERROR';
    if (typeof err === 'string') {
      if (err.indexOf('auth/') === 0) return 'AUTH_ERROR';
      return classify({ message: err, code: err });
    }
    var code = String((err && (err.category || err.code)) || '');
    if (Object.prototype.hasOwnProperty.call(CATEGORIES, code)) return code;
    if (code.indexOf('auth/') === 0) return 'AUTH_ERROR';
    var status = Number(err && (err.status || err.statusCode || err.httpStatus));
    var blob = (code + ' ' + String((err && err.message) || '') + ' ' + String((err && err.reason) || '')).toLowerCase();
    if (status === 401 || status === 403 || /permission_denied|permission denied/.test(blob)) return 'PERMISSION_DENIED';
    if (status === 404 || /\bnot[_ ]found\b/.test(blob)) return 'NOT_FOUND';
    if (status === 429 || /too-many-requests|rate.?limit/.test(blob)) return 'RATE_LIMITED';
    if (status === 408 || (err && err.name === 'AbortError') || /timeout|network-request-failed|failed to fetch|networkerror|offline|load failed/.test(blob)) {
      return 'NETWORK_ERROR';
    }
    if (err && err.validation) return 'VALIDATION_ERROR';
    if (/email.?deliver|resend|smtp|mail_status|gmail_http|worker_failed/.test(blob) || (err && err.kind === 'email')) {
      return 'EMAIL_DELIVERY_ERROR';
    }
    if (/lead_not_saved|firebase.*database|rtdb|firestore/.test(blob)) return 'RTDB_ERROR';
    return 'UNKNOWN_ERROR';
  }

  function normalize(err, context) {
    var category = classify(err);
    var spec = CATEGORIES[category] || CATEGORIES.UNKNOWN_ERROR;
    var userMessage = spec.userMessage;
    if (category === 'AUTH_ERROR' && typeof global.explainFirebaseAuthError === 'function') {
      var mapped = global.explainFirebaseAuthError(err, context || 'default');
      if (mapped || mapped === '') userMessage = mapped;
    }
    if (err && err.userMessage) userMessage = String(err.userMessage);
    return {
      category: spec.code,
      code: spec.code,
      technical: spec.technical + (err && err.message ? ': ' + sanitizePii(err.message) : ''),
      userMessage: userMessage,
      action: spec.action,
      retryable: spec.retryable,
      severity: spec.severity,
      correlationId: (err && err.correlationId) || newCorrelationId(),
      context: context || ''
    };
  }

  function readRing() {
    try {
      if (typeof sessionStorage === 'undefined') return [];
      var raw = sessionStorage.getItem(RING_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function writeRing(arr) {
    try {
      if (typeof sessionStorage === 'undefined') return;
      sessionStorage.setItem(RING_KEY, JSON.stringify(arr.slice(-RING_MAX)));
    } catch (e) { /* quota / mode privé */ }
  }

  function logError(entry) {
    var row = {
      ts: new Date().toISOString(),
      category: entry && entry.category,
      technical: sanitizePii(entry && entry.technical),
      context: entry && entry.context,
      correlationId: entry && entry.correlationId,
      severity: entry && entry.severity
    };
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[pino-errors]', row.category, row.correlationId, row.technical);
    }
    var ring = readRing();
    ring.push(row);
    writeRing(ring);
    try {
      if (global.PINO_FLAGS && global.PINO_FLAGS.sentryDsn && global.PINO_SENTRY && typeof global.PINO_SENTRY.captureMessage === 'function') {
        var consent = '';
        try { consent = localStorage.getItem('pino_cookie_consent') || ''; } catch (e2) { consent = ''; }
        if (consent === 'all' || consent === 'analytics') {
          global.PINO_SENTRY.captureMessage(row.technical, { level: row.severity, extra: row });
        }
      }
    } catch (e3) { /* sink optionnel */ }
    return row;
  }

  function toastKind(type) {
    if (type === 'success' || type === 'error' || type === 'warning' || type === 'info') return type;
    return 'info';
  }

  function dismissToast() {
    if (typeof document === 'undefined') return;
    var existing = document.getElementById(TOAST_ID);
    if (!existing) return;
    existing.classList.add('pino-toast-out');
    setTimeout(function () {
      try { if (existing.parentElement) existing.remove(); } catch (e) { /* déjà retiré */ }
    }, 250);
  }

  function showToast(message, type, duration, opts) {
    opts = opts || {};
    if (typeof document === 'undefined' || !document.body) return null;
    var text = String(message == null ? '' : message);
    if (!text) return null;
    dismissToast();
    var toast = document.createElement('div');
    toast.id = TOAST_ID;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
    toast.setAttribute('data-kind', toastKind(type));
    toast.className = 'pino-toast';
    if (opts.correlationId) toast.setAttribute('data-corr', opts.correlationId);

    var body = document.createElement('div');
    body.className = 'pino-toast-body';
    var span = document.createElement('span');
    span.className = 'pino-toast-msg';
    span.textContent = text;
    body.appendChild(span);
    if (opts.action && type === 'error') {
      var hint = document.createElement('span');
      hint.className = 'pino-toast-action';
      hint.textContent = String(opts.action);
      body.appendChild(hint);
    }
    toast.appendChild(body);

    if (typeof opts.onRetry === 'function') {
      var retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'pino-toast-retry';
      retry.textContent = 'Réessayer';
      retry.addEventListener('click', function () {
        dismissToast();
        try { opts.onRetry(); } catch (e) { report(e, { context: 'toast-retry' }); }
      });
      toast.appendChild(retry);
    }

    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'pino-toast-close';
    close.setAttribute('aria-label', 'Fermer la notification');
    close.textContent = '×';
    close.addEventListener('click', dismissToast);
    toast.appendChild(close);

    document.body.appendChild(toast);
    var ms = duration == null ? 4000 : Number(duration);
    if (ms > 0) {
      setTimeout(function () {
        if (toast.parentElement) dismissToast();
      }, ms);
    }
    return toast;
  }

  function report(err, opts) {
    opts = opts || {};
    var entry = normalize(err, opts.context);
    if (entry.category === 'AUTH_ERROR' && entry.userMessage === '') return entry;
    logError(entry);
    if (opts.silent) return entry;
    var type = entry.severity === 'error' ? 'error' : (entry.severity === 'warning' ? 'warning' : 'info');
    var dur = opts.duration != null ? opts.duration : (entry.retryable && opts.onRetry ? 0 : 6000);
    showToast(entry.userMessage, type, dur, {
      onRetry: entry.retryable ? opts.onRetry : null,
      correlationId: entry.correlationId,
      action: entry.action
    });
    return entry;
  }

  function fetchWithTimeout(url, init, timeoutMs) {
    init = init || {};
    var ms = timeoutMs == null ? DEFAULT_TIMEOUT_MS : timeoutMs;
    var fetchFn = (typeof fetch === 'function') ? fetch : (global.fetch);
    if (typeof fetchFn !== 'function') {
      return Promise.reject(Object.assign(new Error('fetch unavailable'), { category: 'NETWORK_ERROR' }));
    }
    if (typeof AbortController === 'undefined') {
      return fetchFn(url, init);
    }
    var controller = new AbortController();
    var outer = init.signal;
    if (outer) {
      if (outer.aborted) controller.abort();
      else outer.addEventListener('abort', function () { controller.abort(); });
    }
    var next = {};
    var key;
    for (key in init) {
      if (Object.prototype.hasOwnProperty.call(init, key) && key !== 'signal') next[key] = init[key];
    }
    next.signal = controller.signal;
    var timeoutErr = Object.assign(new Error('timeout'), { category: 'NETWORK_ERROR', name: 'AbortError' });
    return new Promise(function (resolve, reject) {
      var done = false;
      var timer = setTimeout(function () {
        try { controller.abort(); } catch (e) { /* */ }
        if (!done) { done = true; reject(timeoutErr); }
      }, ms);
      Promise.resolve(fetchFn(url, next)).then(function (res) {
        clearTimeout(timer);
        if (!done) { done = true; resolve(res); }
      }, function (err) {
        clearTimeout(timer);
        if (done) return;
        done = true;
        if (err && err.name === 'AbortError') reject(timeoutErr);
        else reject(Object.assign(err || new Error('network'), { category: 'NETWORK_ERROR' }));
      });
    });
  }

  function sleep(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function fetchWithRetry(url, init, opts) {
    opts = opts || {};
    var attempts = opts.attempts || 3;
    var timeoutMs = opts.timeoutMs || DEFAULT_TIMEOUT_MS;
    var correlationId = opts.correlationId || newCorrelationId();
    init = init || {};
    var headers = {};
    var src = init.headers || {};
    if (typeof Headers !== 'undefined' && src instanceof Headers) {
      src.forEach(function (v, k) { headers[k] = v; });
    } else {
      var hk;
      for (hk in src) {
        if (Object.prototype.hasOwnProperty.call(src, hk)) headers[hk] = src[hk];
      }
    }
    headers['X-Pino-Correlation-Id'] = correlationId;
    var nextInit = {};
    var ik;
    for (ik in init) {
      if (Object.prototype.hasOwnProperty.call(init, ik)) nextInit[ik] = init[ik];
    }
    nextInit.headers = headers;

    function once(i) {
      return fetchWithTimeout(url, nextInit, timeoutMs).then(function (res) {
        if (res && res.ok) return res;
        var status = res ? res.status : 0;
        var cat = classify({ status: status, message: 'HTTP ' + status });
        var err = Object.assign(new Error('HTTP ' + status), { status: status, category: cat, correlationId: correlationId });
        if (i + 1 >= attempts || (status && status < 500 && status !== 408 && status !== 429)) throw err;
        return sleep(400 * (i + 1)).then(function () { return once(i + 1); });
      }, function (err) {
        err = err || new Error('network');
        err.correlationId = correlationId;
        err.category = err.category || 'NETWORK_ERROR';
        if (i + 1 >= attempts) throw err;
        return sleep(400 * (i + 1)).then(function () { return once(i + 1); });
      });
    }
    return once(0);
  }

  function guardSubmit(el, fn) {
    if (!el) return Promise.resolve();
    if (el.getAttribute('data-pino-busy') === '1' || el.disabled) return Promise.resolve();
    el.setAttribute('data-pino-busy', '1');
    el.disabled = true;
    el.setAttribute('aria-busy', 'true');
    var restore = function () {
      el.removeAttribute('data-pino-busy');
      el.disabled = false;
      el.removeAttribute('aria-busy');
    };
    var run;
    try { run = fn(); } catch (err) {
      restore();
      report(err, { context: 'guardSubmit' });
      return Promise.reject(err);
    }
    return Promise.resolve(run).then(function (value) {
      restore();
      return value;
    }, function (err) {
      restore();
      throw err;
    });
  }

  function setLoading(on, label) {
    if (typeof document === 'undefined') return;
    var veil = document.getElementById('pino-loading-veil');
    if (on) {
      if (!veil) {
        veil = document.createElement('div');
        veil.id = 'pino-loading-veil';
        veil.setAttribute('role', 'status');
        veil.setAttribute('aria-live', 'polite');
        var spin = document.createElement('div');
        spin.className = 'pino-loading-card';
        var txt = document.createElement('p');
        txt.id = 'pino-loading-label';
        txt.textContent = label || 'Chargement…';
        spin.appendChild(txt);
        veil.appendChild(spin);
        document.body.appendChild(veil);
      } else {
        var p = document.getElementById('pino-loading-label');
        if (p) p.textContent = label || 'Chargement…';
        veil.hidden = false;
      }
      veil.setAttribute('aria-busy', 'true');
    } else if (veil) {
      veil.hidden = true;
      veil.setAttribute('aria-busy', 'false');
    }
  }

  function withLoading(fn, label) {
    setLoading(true, label);
    var run;
    try { run = fn(); } catch (err) {
      setLoading(false);
      throw err;
    }
    return Promise.resolve(run).then(function (v) {
      setLoading(false);
      return v;
    }, function (err) {
      setLoading(false);
      throw err;
    });
  }

  function renderEmpty(container, opts) {
    opts = opts || {};
    if (!container) return null;
    container.textContent = '';
    var wrap = document.createElement('div');
    wrap.className = 'pino-empty';
    var title = document.createElement('p');
    title.className = 'pino-empty-title';
    title.textContent = opts.title || 'Aucun élément pour le moment.';
    wrap.appendChild(title);
    if (opts.hint) {
      var hint = document.createElement('p');
      hint.className = 'pino-empty-hint';
      hint.textContent = opts.hint;
      wrap.appendChild(hint);
    }
    if (opts.actionLabel && typeof opts.onAction === 'function') {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pino-empty-action';
      btn.textContent = opts.actionLabel;
      btn.addEventListener('click', opts.onAction);
      wrap.appendChild(btn);
    }
    container.appendChild(wrap);
    return wrap;
  }

  function isIgnorableUncaught(msg, source) {
    var blob = String(msg || '') + ' ' + String(source || '');
    if (!String(msg || '').trim()) return true;
    if (/^script error\.?$/i.test(String(msg || '').trim())) return true;
    if (/chrome-extension:|moz-extension:|safari-extension:/.test(blob)) return true;
    if (/ResizeObserver loop/.test(blob)) return true;
    if (/popup-closed-by-user|cancelled-popup|redirect-cancelled/.test(blob)) return true;
    return false;
  }

  function installGlobalHandlers() {
    if (!global || typeof global.addEventListener !== 'function') return;
    if (global.__pinoErrorsHandlers) return;
    global.__pinoErrorsHandlers = true;
    global.addEventListener('error', function (ev) {
      var msg = ev && (ev.message || (ev.error && ev.error.message));
      var src = ev && ev.filename;
      if (isIgnorableUncaught(msg, src)) return;
      var entry = normalize(ev && ev.error ? ev.error : { message: msg }, 'onerror');
      logError(entry);
      if (!UNCAUGHT_TOASTED) {
        UNCAUGHT_TOASTED = true;
        showToast(CATEGORIES.UNKNOWN_ERROR.userMessage, 'error', 8000, {
          onRetry: function () { try { global.location.reload(); } catch (e) { /* */ } },
          correlationId: entry.correlationId,
          action: CATEGORIES.UNKNOWN_ERROR.action
        });
      }
    });
    global.addEventListener('unhandledrejection', function (ev) {
      var reason = ev && ev.reason;
      var msg = reason && (reason.message || reason);
      if (isIgnorableUncaught(msg, '')) return;
      var entry = normalize(reason, 'unhandledrejection');
      logError(entry);
      if (entry.category === 'AUTH_ERROR' && !entry.userMessage) return;
      if (entry.retryable && entry.category === 'NETWORK_ERROR') {
        showToast(entry.userMessage, 'warning', 0, {
          onRetry: function () { try { global.location.reload(); } catch (e) { /* */ } },
          correlationId: entry.correlationId,
          action: entry.action
        });
      }
    });
  }

  function applyMaintenanceFlag() {
    try {
      if (!global.PINO_FLAGS || global.PINO_FLAGS.maintenance !== true) return;
      if (!global.location || !global.location.replace) return;
      var path = String(global.location.pathname || '');
      if (/maintenance\.html?$/.test(path) || path === '/maintenance') return;
      global.location.replace('/maintenance.html');
    } catch (e) { /* */ }
  }

  var api = {
    CATEGORIES: CATEGORIES,
    sanitizePii: sanitizePii,
    newCorrelationId: newCorrelationId,
    classify: classify,
    normalize: normalize,
    logError: logError,
    readRing: readRing,
    showToast: showToast,
    dismissToast: dismissToast,
    report: report,
    fetchWithTimeout: fetchWithTimeout,
    fetchWithRetry: fetchWithRetry,
    guardSubmit: guardSubmit,
    setLoading: setLoading,
    withLoading: withLoading,
    renderEmpty: renderEmpty,
    installGlobalHandlers: installGlobalHandlers,
    DEFAULT_TIMEOUT_MS: DEFAULT_TIMEOUT_MS
  };

  global.PinoErrors = api;
  global.showNotificationToast = function (message, type, duration, opts) {
    return showToast(message, type, duration, opts);
  };
  global.dismissNotificationToast = dismissToast;

  if (typeof window !== 'undefined' && window.addEventListener) {
    installGlobalHandlers();
    applyMaintenanceFlag();
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
