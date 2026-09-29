/**
 * Pino Espaces Verts — Worker de correo transaccional (Cloudflare + Resend)
 * ------------------------------------------------------------------------
 * Envía 3 tipos de correo personalizados cuando un cliente interactúa con la web:
 *   - al CLIENTE: "Bonjour {prénom}, ..." (login, devis, etc.)
 *   - a ANDRÉS (pino.espacesverts@gmail.com) con copia (cc) a JOM (tu correo)
 *
 * Seguridad (anti-spam / anti-abuso):
 *   - mode "auth"   → exige un ID token de Firebase válido (usuario logueado real).
 *   - mode "public" → exige un token de Cloudflare Turnstile válido (formularios anónimos).
 *   - CORS restringido a los orígenes propios.
 *
 * Secretos (wrangler secret put ...), NUNCA en el repo:
 *   - RESEND_API_KEY     (obligatorio; empieza por re_...)
 *   - TURNSTILE_SECRET   (recomendado; si falta, el modo public queda deshabilitado)
 * Variables (wrangler.toml [vars]):
 *   - FIREBASE_PROJECT_ID, ADMIN_EMAIL, JOM_EMAIL, SENDER_EMAIL, SENDER_NAME, ALLOWED_ORIGINS
 */

const JWK_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
let JWK_CACHE = { keys: null, exp: 0 };

// ---------- utilidades base64url / JWT ----------
function b64urlToBytes(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function b64urlToJson(s) {
  return JSON.parse(new TextDecoder().decode(b64urlToBytes(s)));
}

async function getJwks() {
  const now = Date.now();
  if (JWK_CACHE.keys && now < JWK_CACHE.exp) return JWK_CACHE.keys;
  const res = await fetch(JWK_URL);
  const data = await res.json();
  // cache según Cache-Control max-age (por defecto 1h)
  const cc = res.headers.get("cache-control") || "";
  const m = /max-age=(\d+)/.exec(cc);
  const ttl = m ? parseInt(m[1], 10) * 1000 : 3600000;
  JWK_CACHE = { keys: data.keys || [], exp: now + Math.min(ttl, 3600000) };
  return JWK_CACHE.keys;
}

/** Verifica un ID token de Firebase (RS256) y devuelve el payload, o null si es inválido. */
async function verifyFirebaseToken(token, projectId) {
  try {
    const [h, p, s] = token.split(".");
    if (!h || !p || !s) return null;
    const header = b64urlToJson(h);
    const payload = b64urlToJson(p);
    const now = Math.floor(Date.now() / 1000);

    if (header.alg !== "RS256") return null;
    if (payload.aud !== projectId) return null;
    if (payload.iss !== `https://securetoken.google.com/${projectId}`) return null;
    if (!payload.sub) return null;
    if (typeof payload.exp !== "number" || payload.exp < now) return null;
    if (typeof payload.iat !== "number" || payload.iat > now + 300) return null;

    const jwks = await getJwks();
    const jwk = jwks.find((k) => k.kid === header.kid);
    if (!jwk) return null;

    const key = await crypto.subtle.importKey(
      "jwk",
      { kty: jwk.n ? "RSA" : jwk.kty, n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const data = new TextEncoder().encode(`${h}.${p}`);
    const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64urlToBytes(s), data);
    return ok ? payload : null;
  } catch (e) {
    return null;
  }
}

/** Verifica un token de Cloudflare Turnstile. */
async function verifyTurnstile(token, secret, ip) {
  if (!secret) return false;
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set("remoteip", ip);
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body
    });
    const j = await r.json();
    return j.success === true;
  } catch (e) {
    return false;
  }
}

// ---------- personalización ----------
function firstNameOf(name, email) {
  const n = (name || "").trim();
  if (n) return n.split(/\s+/)[0];
  const local = (email || "").split("@")[0] || "";
  const guess = local.split(/[._-]+/)[0] || "";
  return guess ? guess.charAt(0).toUpperCase() + guess.slice(1) : "";
}
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}

const EVENT_LABELS = {
  login: "connexion à votre espace",
  signup: "création de votre compte",
  devis: "demande de devis",
  interaction: "interaction sur le site"
};

function clientEmailBody(event, first, data, env) {
  const label = EVENT_LABELS[event] || "interaction sur le site";
  const salut = first ? `Bonjour ${esc(first)},` : "Bonjour,";
  const recap =
    event === "devis"
      ? `<p>Récapitulatif de votre demande :</p>
         <ul>
           <li><strong>Prestation :</strong> ${esc(data.service || "—")}</li>
           <li><strong>Commune :</strong> ${esc(data.commune || "—")}</li>
           ${data.details ? `<li><strong>Détails :</strong> ${esc(data.details)}</li>` : ""}
         </ul>`
      : "";
  return `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a;line-height:1.6;font-size:14px">
      <p style="font-size:18px;font-weight:700;color:#047857">🌲 Pino Espaces Verts</p>
      <p>${salut}</p>
      <p>Nous confirmons votre <strong>${esc(label)}</strong> sur le site de Pino Espaces Verts.</p>
      ${recap}
      <p>Andrés vous recontactera rapidement. Si vous n'êtes pas à l'origine de cette action, ignorez ce message ou écrivez-nous à ${esc(env.ADMIN_EMAIL)}.</p>
      <p style="color:#64748b;font-size:12px">Pino Espaces Verts · Vaucluse (84) · ${esc(env.ADMIN_EMAIL)}</p>
    </div>`;
}

function adminEmailBody(event, data, ident, env) {
  const label = EVENT_LABELS[event] || event;
  const nomComplet = [data.prenom, data.nom].filter(Boolean).join(" ") || data.name || ident.name || "—";
  const rows = [
    ["Événement", label],
    ["Client", nomComplet],
    ["Prénom", data.prenom || "—"],
    ["Nom", data.nom || "—"],
    ["Email", data.email || ident.email || "—"],
    ["Téléphone", data.phone || "—"],
    ["Prestation", data.service || "—"],
    ["Commune", data.commune || "—"],
    ["Code postal", data.postal_code || "—"],
    ["Budget", data.budget || "—"],
    ["Détails", data.details || "—"],
    ["Identité vérifiée", ident.verified ? "oui (Firebase)" : "non (formulaire public)"],
    ["Horodatage", new Date().toISOString()]
  ];
  return `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a;line-height:1.5;font-size:14px">
      <p style="font-size:16px;font-weight:700;color:#047857">🌲 Pino — nouvelle activité client</p>
      <table style="border-collapse:collapse">
        ${rows.map(([k, v]) => `<tr><td style="padding:4px 10px 4px 0;color:#64748b">${esc(k)}</td><td style="padding:4px 0"><strong>${esc(v)}</strong></td></tr>`).join("")}
      </table>
      <p style="color:#64748b;font-size:12px">Notification automatique — copie envoyée à JOM Studio pour suivi.</p>
    </div>`;
}

function fmtAddr(a) { return a && a.name ? `${a.name} <${a.email}>` : (a && a.email) || ""; }

/** Envía un correo por Resend (https://resend.com). Secreto: RESEND_API_KEY. */
async function sendEmail(env, { to, cc, subject, html }) {
  const payload = {
    from: `${env.SENDER_NAME || "Pino Espaces Verts"} <${env.SENDER_EMAIL}>`,
    to: (to || []).map(fmtAddr).filter(Boolean),
    subject,
    html
  };
  if (cc && cc.length) payload.cc = cc.map(fmtAddr).filter(Boolean);
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  return r.ok;
}

function corsHeaders(origin, allowed) {
  const ok = origin && allowed.includes(origin);
  return {
    "Access-Control-Allow-Origin": ok ? origin : allowed[0] || "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin"
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
    const cors = corsHeaders(origin, allowed);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (url.pathname === "/health") return new Response(JSON.stringify({ status: "ok" }), { headers: { "content-type": "application/json", ...cors } });
    if (url.pathname !== "/notify" || request.method !== "POST") {
      return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers: { "content-type": "application/json", ...cors } });
    }
    if (origin && allowed.length && !allowed.includes(origin)) {
      return new Response(JSON.stringify({ error: "forbidden_origin" }), { status: 403, headers: { "content-type": "application/json", ...cors } });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "bad_json" }), { status: 400, headers: { "content-type": "application/json", ...cors } });
    }

    const event = String(body.event || "interaction").slice(0, 40);
    const mode = body.mode === "auth" ? "auth" : "public";
    const data = body.data || {};
    const ip = request.headers.get("CF-Connecting-IP") || "";

    // --- Verificación de identidad / anti-abuso ---
    let ident = { email: "", name: "", verified: false };
    if (mode === "auth") {
      const payload = await verifyFirebaseToken(String(body.token || ""), env.FIREBASE_PROJECT_ID);
      if (!payload) return new Response(JSON.stringify({ error: "invalid_token" }), { status: 401, headers: { "content-type": "application/json", ...cors } });
      ident = { email: payload.email || "", name: payload.name || "", verified: payload.email_verified === true };
    } else {
      // Público (formularios anónimos): exige Turnstile si hay secreto configurado.
      if (env.TURNSTILE_SECRET) {
        const ok = await verifyTurnstile(String(body.turnstile || ""), env.TURNSTILE_SECRET, ip);
        if (!ok) return new Response(JSON.stringify({ error: "turnstile_failed" }), { status: 403, headers: { "content-type": "application/json", ...cors } });
      }
      ident = { email: data.email || "", name: data.name || "", verified: false };
    }

    const clientEmail = (data.email || ident.email || "").trim().toLowerCase();
    const first = (data.prenom && String(data.prenom).trim())
      ? String(data.prenom).trim()
      : firstNameOf(data.name || ident.name, clientEmail);

    // --- Envío ---
    const results = { client: false, admin: false };
    try {
      // 1) Correo al cliente (si tenemos su email)
      if (clientEmail) {
        results.client = await sendEmail(env, {
          to: [{ email: clientEmail, name: data.name || ident.name || first || "Client" }],
          subject: first ? `Bonjour ${first} — Pino Espaces Verts` : "Pino Espaces Verts",
          html: clientEmailBody(event, first, data, env)
        });
      }
      // 2) Correo a Andrés + copia a JOM
      results.admin = await sendEmail(env, {
        to: (env.ADMIN_EMAIL || "").split(",").map(function (e) { return { email: e.trim(), name: "Andrés — Pino Espaces Verts" }; }).filter(function (a) { return a.email; }),
        cc: env.JOM_EMAIL ? [{ email: env.JOM_EMAIL, name: "JOM Studio" }] : [],
        subject: `[Pino] ${EVENT_LABELS[event] || event} — ${data.name || ident.name || clientEmail || "client"}`,
        html: adminEmailBody(event, data, ident, env)
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: "send_failed" }), { status: 502, headers: { "content-type": "application/json", ...cors } });
    }

    return new Response(JSON.stringify({ ok: true, sent: results }), { headers: { "content-type": "application/json", ...cors } });
  }
};
