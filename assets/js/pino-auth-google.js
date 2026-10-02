/**
 * Google / Apple OAuth : popup bureau, redirect mobile (FASE 3).
 * Détection par capacités (touch, viewport, in-app), pas seulement par user-agent.
 */
(function (global) {
  'use strict';

  var PENDING_KEY = 'pino_auth_redirect_pending';
  var IN_APP_RE = /FBAN|FBAV|FB_IAB|Instagram|Line\/|Twitter|TikTok|GSA\/|Snapchat|WhatsApp|Messenger|Pinterest|LinkedInApp|WeChat|MicroMessenger|YaApp/i;

  function navOf(env) {
    return (env && env.navigator) || {};
  }

  function isInAppBrowser(env) {
    env = env || global;
    var ua = navOf(env).userAgent || '';
    return IN_APP_RE.test(ua);
  }

  function mediaMatches(env, query) {
    try {
      if (env && typeof env.matchMedia === 'function') {
        var mq = env.matchMedia(query);
        return !!(mq && mq.matches);
      }
    } catch (e) {}
    return false;
  }

  function shortestSide(env) {
    env = env || global;
    var scr = env.screen || {};
    var w = Number(scr.width || env.innerWidth || 0);
    var h = Number(scr.height || env.innerHeight || 0);
    if (!w && !h) return 0;
    return Math.min(w || h, h || w);
  }

  /**
   * Redirect si le popup est peu fiable : téléphone, tablette, PWA iOS, in-app.
   * Bureau souris / trackpad → popup.
   */
  function isMobileUa(env) {
    var nav = navOf(env);
    if (nav.userAgentData && nav.userAgentData.mobile) return true;
    var ua = nav.userAgent || '';
    if (/iPhone|iPod|Android.+Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return true;
    if (/iPad/i.test(ua) || /Android/i.test(ua)) return true;
    return false;
  }

  function shouldUseRedirectAuth(env) {
    env = env || global;
    var nav = navOf(env);
    var touchPoints = Number(nav.maxTouchPoints || 0);
    var iPadOs = nav.platform === 'MacIntel' && touchPoints > 1;
    var coarse = mediaMatches(env, '(pointer: coarse)');
    var standalone = mediaMatches(env, '(display-mode: standalone)');
    var compact = shortestSide(env) > 0 && shortestSide(env) <= 900;
    var touchy = coarse || iPadOs || touchPoints > 0;
    if (isInAppBrowser(env)) return true;
    if (isMobileUa(env)) return true;
    if (iPadOs) return true;
    if (standalone && touchy) return true;
    if (compact && touchy) return true;
    return false;
  }

  function makeGoogleProvider() {
    if (typeof firebase === 'undefined' || !firebase.auth || !firebase.auth.GoogleAuthProvider) {
      throw new Error('auth/operation-not-supported-in-this-environment');
    }
    var provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({ prompt: 'select_account' });
    return provider;
  }

  function setPending(kind) {
    try { global.sessionStorage.setItem(PENDING_KEY, kind || 'google'); } catch (e) {}
  }

  function peekPending() {
    try { return global.sessionStorage.getItem(PENDING_KEY) || ''; } catch (e) { return ''; }
  }

  function clearPending() {
    try { global.sessionStorage.removeItem(PENDING_KEY); } catch (e) {}
  }

  var api = {
    PENDING_KEY: PENDING_KEY,
    isInAppBrowser: isInAppBrowser,
    isMobileUa: isMobileUa,
    shouldUseRedirectAuth: shouldUseRedirectAuth,
    makeGoogleProvider: makeGoogleProvider,
    setPending: setPending,
    peekPending: peekPending,
    clearPending: clearPending
  };

  global.pinoShouldUseRedirectAuth = shouldUseRedirectAuth;
  global.pinoIsInAppBrowser = isInAppBrowser;
  global.pinoMakeGoogleProvider = makeGoogleProvider;
  global.PinoAuthGoogle = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
