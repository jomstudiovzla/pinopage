/**
 * Pino Espaces Verts — Cloudflare Turnstile en el formulario de devis (anti-spam).
 * ------------------------------------------------------------------------------
 * Inyecta el widget de Turnstile dentro de #devis-form y expone el token verificado
 * en window.PINO_TURNSTILE_TOKEN (lo usa pino-mail.js al enviar el devis).
 *
 * INERTE hasta configurar la SITE KEY (pública). Pon tu site key en
 * window.PINO_TURNSTILE_SITEKEY (o edita la constante de abajo). Sin site key, el
 * formulario sigue funcionando; solo queda sin la protección extra de Turnstile.
 */
(function () {
  "use strict";

  // TODO_PRODUCTION: pega aquí (o en window.PINO_TURNSTILE_SITEKEY) la Site Key pública
  // de Turnstile (empieza por "0x..."). La Secret Key va en el Worker (wrangler secret).
  var SITEKEY = ((typeof window !== "undefined" && window.PINO_TURNSTILE_SITEKEY) || "").trim();
  if (!SITEKEY) return; // sin site key → no hacemos nada

  function render() {
    var form = document.getElementById("devis-form");
    if (!form || !window.turnstile) return;
    if (form.querySelector(".cf-turnstile")) return; // ya inyectado

    var box = document.createElement("div");
    box.className = "cf-turnstile";
    box.style.margin = "12px 0";

    var submit = form.querySelector('button[type="submit"], [type="submit"]');
    if (submit && submit.parentNode) submit.parentNode.insertBefore(box, submit);
    else form.appendChild(box);

    try {
      window.turnstile.render(box, {
        sitekey: SITEKEY,
        action: "devis",
        callback: function (token) { window.PINO_TURNSTILE_TOKEN = token; },
        "expired-callback": function () { window.PINO_TURNSTILE_TOKEN = null; },
        "error-callback": function () { window.PINO_TURNSTILE_TOKEN = null; }
      });
    } catch (e) { if (window.console) console.warn("[pino-turnstile] render:", e && e.message); }
  }

  window.onloadTurnstileCallback = render;

  document.addEventListener("DOMContentLoaded", function () {
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      if (window.turnstile) { clearInterval(iv); render(); }
      else if (tries > 40) clearInterval(iv); // ~10 s máx
    }, 250);
  });
})();
