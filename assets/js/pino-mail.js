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

  async function post(payload) {
    if (!ENDPOINT) return; // sin endpoint → no-op
    try {
      await fetch(ENDPOINT.replace(/\/$/, "") + "/notify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true
      });
    } catch (e) {
      if (window.console) console.warn("[pino-mail] notify falló (ignorado):", e && e.message);
    }
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
      try { token = await user.getIdToken(); } catch (e) { token = null; }
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

  window.PinoMail = { notify: notify, notifyLogin: notifyLogin, notifyDevis: notifyDevis, endpoint: ENDPOINT };
})();
