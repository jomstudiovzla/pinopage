/**
 * Pino Espaces Verts — Cliente de notificaciones por correo (Brevo vía Cloudflare Worker).
 * ---------------------------------------------------------------------------------------
 * Envía eventos ("login", "signup", "devis", "interaction") al Worker `pino-mail`,
 * que manda correos PERSONALIZADOS por persona (prénom para el saludo; nom, téléphone,
 * email, prestation… en el cuerpo). Destinatarios: el propio cliente + Andrés con copia a JOM.
 *
 * MODO SEGURO: si el Worker no está desplegado, las llamadas fallan en silencio (try/catch)
 * y NO rompen la web. Endpoint configurable en `window.PINO_MAIL_ENDPOINT`.
 *
 * Identidad: en eventos "auth" se envía el ID token de Firebase (el Worker lo verifica).
 * En eventos públicos (devis anónimo) se envía el token de Turnstile si existe.
 */
(function () {
  "use strict";

  var ENDPOINT = (typeof window !== "undefined" && window.PINO_MAIL_ENDPOINT) ||
    "https://pino-mail.pinoespacesverts.online";

  function turnstileToken() {
    try { return window.PINO_TURNSTILE_TOKEN || null; } catch (e) { return null; }
  }

  var MAX_ATTEMPTS = 3;          // 1 intento + 2 reintentos ante fallo transitorio
  var QUEUE_KEY = "pino_mail_queue";

  function loadQueue() { try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]"); } catch (e) { return []; } }
  function saveQueue(q) { try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-50))); } catch (e) {} }
  function enqueue(payload) { var q = loadQueue(); q.push({ payload: payload, ts: Date.now() }); saveQueue(q); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  // Un intento: lanza si la red falla O si el Worker responde != 2xx (para poder reintentar).
  async function sendOnce(payload) {
    var res = await fetch(ENDPOINT.replace(/\/$/, "") + "/notify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true
    });
    if (!res || !res.ok) throw new Error("HTTP " + (res ? res.status : "no-response"));
    return true;
  }

  /**
   * Envío fiable: reintenta ante fallos transitorios (cold start del Worker, 5xx, red).
   * Si tras los reintentos sigue fallando, ENCOLA el correo en localStorage para reenviarlo
   * al recuperar la conexión o al recargar la página → "los correos siempre acaban llegando".
   */
  async function post(payload, opts) {
    opts = opts || {};
    if (!ENDPOINT) return false; // sin endpoint → no-op
    var attempts = opts.attempts || MAX_ATTEMPTS;
    for (var i = 0; i < attempts; i++) {
      try { await sendOnce(payload); return true; }
      catch (e) {
        if (i === attempts - 1) {
          if (opts.queueOnFail !== false) enqueue(payload);
          if (window.console) console.warn("[pino-mail] notify falló tras reintentos" + (opts.queueOnFail !== false ? " (encolado)" : "") + ":", e && e.message);
          return false;
        }
        await sleep(400 * (i + 1));
      }
    }
    return false;
  }

  // Reenvía los correos encolados. Refresca el token en los eventos autenticados.
  var _flushing = false;
  async function flushQueue() {
    if (_flushing) return;
    _flushing = true;
    try {
      var q = loadQueue();
      if (!q.length) return;
      var remaining = [];
      for (var k = 0; k < q.length; k++) {
        var item = q[k];
        try {
          if (item.payload && item.payload.mode === "auth") {
            var u = currentUser();
            if (u && typeof u.getIdToken === "function") { try { item.payload.token = await u.getIdToken(); } catch (e) {} }
          }
          var ok = await post(item.payload, { attempts: 1, queueOnFail: false });
          if (!ok) remaining.push(item);
        } catch (e) { remaining.push(item); }
      }
      saveQueue(remaining);
    } finally { _flushing = false; }
  }

  function currentUser() {
    try { return (window.firebase && firebase.auth && firebase.auth().currentUser) || null; }
    catch (e) { return null; }
  }

  /**
   * Reúne el perfil real de la persona para personalizar el correo.
   * Prioridad: datos explícitos pasados por el llamador (perfil del cliente en la BD)
   * y, como respaldo, lo que trae la cuenta de Firebase (displayName + email).
   */
  function buildProfile(user, extra) {
    extra = extra || {};
    var name = extra.name || (user && user.displayName) || "";
    var email = (extra.email || (user && user.email) || "").trim();
    return {
      name: name,
      prenom: extra.prenom || extra.first_name || "",
      nom: extra.nom || extra.last_name || "",
      email: email,
      phone: extra.phone || extra.telephone || "",
      service: extra.service || "",
      commune: extra.commune || "",
      postal_code: extra.postal_code || "",
      budget: extra.budget || "",
      details: extra.details || ""
    };
  }

  /** Evento autenticado: adjunta el ID token de Firebase. `extra` = perfil del cliente. */
  async function notify(event, extra) {
    var user = currentUser();
    var token = null;
    if (user && typeof user.getIdToken === "function") {
      // Si falla la 1.ª obtención de token, fuerza un refresco antes de rendirse:
      // así los eventos que exigen identidad (admin_reply, client_message) no se
      // degradan a "public" y no los rechaza el Worker.
      try { token = await user.getIdToken(); }
      catch (e) { try { token = await user.getIdToken(true); } catch (e2) { token = null; } }
    }
    return post({
      event: event,
      mode: token ? "auth" : "public",
      token: token,
      turnstile: turnstileToken(),
      data: buildProfile(user, extra)
    });
  }

  /**
   * Aviso de inicio de sesión, deduplicado por sesión de pestaña (1 vez por login,
   * no en cada refresco). `extra` puede traer téléphone/apellido del perfil guardado.
   */
  function notifyLogin(user, extra) {
    user = user || currentUser();
    if (!user) return;
    try {
      var key = "pino_login_notified_" + user.uid;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch (e) { /* modo privado: seguimos */ }
    return notify("login", extra);
  }

  /** Evento público de solicitud de devis (visitante anónimo): datos del formulario. */
  function notifyDevis(data) {
    return post({ event: "devis", mode: "public", turnstile: turnstileToken(), data: buildProfile(null, data) });
  }

  // Reenvío de la cola: al recuperar red, y poco después de cargar la página.
  try { window.addEventListener("online", function () { flushQueue(); }); } catch (e) {}
  try {
    var kick = function () { setTimeout(function () { flushQueue(); }, 1500); };
    if (document.readyState !== "loading") kick();
    else window.addEventListener("DOMContentLoaded", kick);
  } catch (e) {}

  window.PinoMail = { notify: notify, notifyLogin: notifyLogin, notifyDevis: notifyDevis, flushQueue: flushQueue, endpoint: ENDPOINT };
})();
