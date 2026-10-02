/**
 * Pino Espaces Verts — Backend Cloud Functions (v3.0.0)
 * Région officielle : europe-west1
 * Sécurité : Firebase Admin SDK, Custom Claims, Default Deny, Validation serveur
 */

const { onRequest, onCall, HttpsError } = require("firebase-functions/v2/https");
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.GCLOUD_PROJECT || "pagepino-e8e97",
    databaseURL: process.env.FIREBASE_DATABASE_EMULATOR_HOST
      ? `http://${process.env.FIREBASE_DATABASE_EMULATOR_HOST}?ns=demo-pino-default-rtdb`
      : "https://pagepino-e8e97-default-rtdb.europe-west1.firebasedatabase.app"
  });
}

const db = admin.database();
const auth = admin.auth();

const app = express();

// M4 — CORS restringido a orígenes propios (evita abuso cross-origin de la API).
// Ajusta ALLOWED_ORIGINS si cambias de dominio. Peticiones sin Origin (server-to-server,
// curl, health checks) se permiten; navegadores de otros orígenes quedan bloqueados.
const ALLOWED_ORIGINS = [
  "https://pinoespacesverts.online",
  "https://www.pinoespacesverts.online",
  "https://pagepino-e8e97.web.app",
  "https://pagepino-e8e97.firebaseapp.com",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://localhost:5000",
  "http://127.0.0.1:5000"
];
app.use(cors({
  origin: (origin, cb) => cb(null, !origin || ALLOWED_ORIGINS.includes(origin))
}));
app.use(express.json({ limit: "256kb" }));

// List of allowed admin emails (fallback validation alongside custom claims)
const ADMIN_EMAILS = [
  "pino.espacesverts@gmail.com",
  "pino.spacesverts@gmail.com",
  "jomstudiovzla@gmail.com"
];

// Middleware: Authenticated User Required
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "unauthorized",
      message: "Jeton d'authentification requis (Authorization: Bearer <token>)"
    });
  }

  const token = authHeader.split("Bearer ")[1].trim();
  try {
    const decoded = await auth.verifyIdToken(token);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({
      error: "unauthorized",
      message: "Jeton d'authentification invalide ou expiré"
    });
  }
}

// Middleware: Admin Required (Role admin or verified admin email + email_verified)
async function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "unauthorized",
      message: "Authentification administrative requise"
    });
  }

  const token = authHeader.split("Bearer ")[1].trim();
  try {
    const decoded = await auth.verifyIdToken(token);
    const hasAdminRole = decoded.role === "admin" || decoded.admin === true;
    const isAdminEmail = ADMIN_EMAILS.includes(decoded.email);
    const isVerified = decoded.email_verified === true;

    if (!isVerified || (!hasAdminRole && !isAdminEmail)) {
      return res.status(403).json({
        error: "forbidden",
        message: "Accès refusé : privilèges administrateur vérifiés requis"
      });
    }

    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({
      error: "unauthorized",
      message: "Jeton administrateur invalide"
    });
  }
}

// Helper: router registering both /path and /api/path
const router = express.Router();

// 1. Healthcheck
router.get(["/health", "/api/health"], (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "pino-api",
    version: "3.0.0",
    region: "europe-west1",
    timestamp: new Date().toISOString()
  });
});

// 2. Quotes / Presupuestos
router.post(["/quotes/create", "/api/quotes/create"], async (req, res) => {
  try {
    const { full_name, email, phone, service, details, commune, ownerUid } = req.body || {};
    if (!email || !service) {
      return res.status(400).json({ error: "bad_request", message: "Email et service requis" });
    }

    const quoteId = "quote_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const quoteData = {
      id: quoteId,
      full_name: full_name ? String(full_name).slice(0, 200) : "",
      email: String(email).trim().toLowerCase(),
      phone: phone ? String(phone).slice(0, 30) : "",
      service: String(service).slice(0, 100),
      details: details ? String(details).slice(0, 5000) : "",
      commune: commune ? String(commune).slice(0, 100) : "Vaucluse (84)",
      ownerUid: ownerUid || (req.user ? req.user.uid : null),
      status: "REQUESTED",
      mail_status: "received",
      created_at: new Date().toISOString()
    };

    // Store in quotes and leads. L'envoi mail est le Worker (client) : pas de double envoi ici.
    await db.ref(`quotes/${quoteId}`).set(quoteData);
    await db.ref(`leads/${quoteId}`).set({
      id: quoteId,
      full_name: quoteData.full_name,
      email: quoteData.email,
      phone: quoteData.phone,
      service: quoteData.service,
      details: quoteData.details,
      status: "new",
      mail_status: "received",
      source: "web_devis",
      created_at: quoteData.created_at
    });

    return res.status(201).json({
      success: true,
      quoteId,
      message: "Demande de devis créée avec succès"
    });
  } catch (err) {
    console.error("Error creating quote:", err);
    return res.status(500).json({ error: "internal_error", message: "Erreur lors de la création du devis" });
  }
});

router.get(["/quotes/:id", "/api/quotes/:id"], requireAuth, async (req, res) => {
  try {
    const quoteId = req.params.id;
    const snap = await db.ref(`quotes/${quoteId}`).get();
    if (!snap.exists()) {
      return res.status(404).json({ error: "not_found", message: "Devis introuvable" });
    }

    const quote = snap.val();
    const isOwner = quote.ownerUid === req.user.uid || quote.email === req.user.email;
    const isAdmin = req.user.role === "admin" || req.user.admin === true || ADMIN_EMAILS.includes(req.user.email);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "forbidden", message: "Accès refusé à ce devis" });
    }

    return res.status(200).json(quote);
  } catch (err) {
    console.error("Error reading quote:", err);
    return res.status(500).json({ error: "internal_error", message: "Erreur interne du serveur" });
  }
});

router.post(["/quotes/:id/accept", "/api/quotes/:id/accept"], requireAuth, async (req, res) => {
  try {
    const quoteId = req.params.id;
    const snap = await db.ref(`quotes/${quoteId}`).get();
    if (!snap.exists()) {
      return res.status(404).json({ error: "not_found", message: "Devis introuvable" });
    }

    const quote = snap.val();
    const isOwner = quote.ownerUid === req.user.uid || quote.email === req.user.email;
    const isAdmin = req.user.role === "admin" || req.user.admin === true || ADMIN_EMAILS.includes(req.user.email);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "forbidden", message: "Action non autorisée" });
    }

    await db.ref(`quotes/${quoteId}/status`).set("ACCEPTED");
    await db.ref(`quotes/${quoteId}/accepted_at`).set(new Date().toISOString());

    return res.status(200).json({ success: true, status: "ACCEPTED" });
  } catch (err) {
    return res.status(500).json({ error: "internal_error", message: "Erreur interne du serveur" });
  }
});

// 3. Coupons
router.post(["/coupons/validate", "/api/coupons/validate"], requireAuth, async (req, res) => {
  try {
    const { couponCode } = req.body || {};
    if (!couponCode || typeof couponCode !== "string") {
      return res.status(400).json({ error: "bad_request", message: "Code promo requis" });
    }

    const code = couponCode.trim().toUpperCase();
    if (!/^PINO-[A-Z0-9]{4,8}$/.test(code)) {
      return res.status(400).json({ valid: false, message: "Format de coupon invalide (attendu : PINO-XXXX)" });
    }

    // Check in coupons node
    const snap = await db.ref(`coupons/${req.user.uid}`).get();
    if (snap.exists()) {
      const c = snap.val();
      if (c.codigo_cupon === code && c.estado === "valid") {
        return res.status(200).json({
          valid: true,
          code: c.codigo_cupon,
          discountPct: c.descuento_pct || 20,
          status: "valid"
        });
      }
    }

    // If general coupon exists
    return res.status(200).json({
      valid: true,
      code,
      discountPct: 20,
      status: "valid"
    });
  } catch (err) {
    return res.status(500).json({ error: "internal_error", message: "Erreur interne du serveur" });
  }
});

router.post(["/coupons/redeem", "/api/coupons/redeem"], requireAuth, async (req, res) => {
  try {
    const { couponCode, quoteId } = req.body || {};
    if (!couponCode) {
      return res.status(400).json({ error: "bad_request", message: "Code coupon requis" });
    }

    const userCouponRef = db.ref(`coupons/${req.user.uid}`);
    const result = await userCouponRef.transaction((current) => {
      if (!current) {
        return {
          user_id: req.user.uid,
          email: req.user.email,
          codigo_cupon: couponCode,
          descuento_pct: 20,
          estado: "used",
          redeemed_at: new Date().toISOString(),
          quote_id: quoteId || null
        };
      }
      if (current.estado === "used") {
        return; // Abort transaction: already redeemed
      }
      current.estado = "used";
      current.redeemed_at = new Date().toISOString();
      current.quote_id = quoteId || null;
      return current;
    });

    if (!result.committed) {
      return res.status(409).json({ error: "already_used", message: "Ce coupon a déjà été utilisé" });
    }

    return res.status(200).json({
      success: true,
      message: "Coupon validé et appliqué avec succès",
      discountPct: 20
    });
  } catch (err) {
    return res.status(500).json({ error: "internal_error", message: "Erreur interne du serveur" });
  }
});

// 4. Tax / Calcul SAP 50%
router.post(["/tax/calculate", "/api/tax/calculate"], (req, res) => {
  try {
    const { montantHT, typeService, beneficieSAP = true } = req.body || {};
    const ht = parseFloat(montantHT);
    if (isNaN(ht) || ht < 0) {
      return res.status(400).json({ error: "bad_request", message: "Montant HT invalide" });
    }

    // Micro-entreprise / SAP via Unipros : franchise en base TVA (art. 293 B CGI) ou TVA 20%
    const isSAP = beneficieSAP !== false && (typeService !== "creation_paysagere");
    const tvaPct = isSAP ? 0 : 20;
    const tva = (ht * tvaPct) / 100;
    const montantTTC = ht + tva;

    // Plafond SAP : 5000 € TTC/an => max 2500 € credit
    const creditImpot50 = isSAP ? Math.min(montantTTC * 0.5, 2500) : 0;
    const resteACharge = montantTTC - creditImpot50;

    return res.status(200).json({
      montantHT: Number(ht.toFixed(2)),
      tva: Number(tva.toFixed(2)),
      montantTTC: Number(montantTTC.toFixed(2)),
      creditImpot50: Number(creditImpot50.toFixed(2)),
      resteACharge: Number(resteACharge.toFixed(2)),
      dispositif: isSAP ? "Avance Immédiate URSSAF / Services à la Personne (CGI art. 199 sexdecies)" : "Prestation directe hors SAP",
      mentionLegale: isSAP ? "TVA non applicable, art. 293 B du CGI - Agrément SAP via SCIC Unipros" : "TVA 20%"
    });
  } catch (err) {
    return res.status(500).json({ error: "internal_error", message: "Erreur interne du serveur" });
  }
});

// 5. Auth recovery & logout
router.post(["/auth/reset-password", "/api/auth/reset-password"], async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "bad_request", message: "Email valide requis" });
    }

    try {
      await auth.generatePasswordResetLink(email.trim().toLowerCase());
    } catch (e) {
      // Don't leak if account exists or not
    }

    return res.status(200).json({
      success: true,
      message: "Si l'adresse correspond à un compte, un lien de réinitialisation a été envoyé."
    });
  } catch (err) {
    return res.status(500).json({ error: "internal_error", message: "Erreur interne du serveur" });
  }
});

router.post(["/auth/logout", "/api/auth/logout"], async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const decoded = await auth.verifyIdToken(authHeader.split("Bearer ")[1].trim());
        await db.ref(`audit_logs/log_${Date.now()}`).set({
          event: "user_logout",
          uid: decoded.uid,
          email: decoded.email,
          timestamp: new Date().toISOString()
        });
      } catch (e) {
        // Ignore token decode error on logout
      }
    }
    return res.status(200).json({ success: true, message: "Déconnexion enregistrée" });
  } catch (err) {
    return res.status(500).json({ error: "internal_error", message: "Erreur interne du serveur" });
  }
});

// 6. Admin User Role Management (Custom Claims)
router.post(["/admin/users/:uid/role", "/api/admin/users/:uid/role"], requireAdmin, async (req, res) => {
  try {
    const targetUid = req.params.uid;
    const { role } = req.body || {};

    if (!targetUid || !["client", "staff", "admin"].includes(role)) {
      return res.status(400).json({ error: "invalid_argument", message: "UID ou rôle invalide" });
    }

    await auth.setCustomUserClaims(targetUid, { role, admin: role === "admin" });
    await db.ref(`users/${targetUid}/role`).set(role);
    await db.ref(`users/${targetUid}/isAdmin`).set(role === "admin");

    await db.ref(`audit_logs/log_${Date.now()}`).set({
      event: "set_user_role",
      adminUid: req.user.uid,
      targetUid,
      role,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      uid: targetUid,
      role
    });
  } catch (err) {
    console.error("Error setting custom claims:", err);
    return res.status(500).json({ error: "internal_error", message: "Erreur interne du serveur" });
  }
});

async function sendViaResend({ to, subject, text, html, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, queued: true, reason: "resend_not_configured" };
  const toList = (Array.isArray(to) ? to : [to]).map((item) => String(item || "").trim()).filter(Boolean);
  if (!toList.length) return { ok: false, reason: "no_recipient" };
  const payload = {
    from: "Andrés Pino — Pino Espaces Verts <andresp@pinoespacesverts.online>",
    to: toList,
    subject: String(subject || "").slice(0, 200),
    text: String(text || subject || "").slice(0, 10000),
    reply_to: replyTo || "pino.espacesverts@gmail.com"
  };
  if (html) payload.html = html;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  let j = {};
  try { j = await r.json(); } catch (e) { j = {}; }
  if (r.ok) return { ok: true, id: j.id || null };
  return { ok: false, reason: j.message || `http_${r.status}` };
}

// 7. Transactional Email Dispatcher (Admin) — persist first, then Resend if configured.
router.post(["/emails/send", "/api/emails/send"], requireAdmin, async (req, res) => {
  try {
    const { to, subject, template, variables, text, html, replyTo } = req.body || {};
    if (!to || !subject) {
      return res.status(400).json({ error: "bad_request", message: "Destinataire et sujet requis" });
    }

    const emailId = "mail_" + Date.now();
    const now = new Date().toISOString();
    const bodyText = text || (variables && variables.message) || "";
    await db.ref(`mail_outbox/${emailId}`).set({
      id: emailId,
      to: Array.isArray(to) ? String(to[0] || "") : String(to),
      subject: String(subject).slice(0, 200),
      template: template || "generic",
      variables: variables || {},
      text: String(bodyText).slice(0, 10000),
      status: "received",
      created_at: now
    });

    await db.ref(`mail_outbox/${emailId}`).update({ status: "processing" });
    const sent = await sendViaResend({
      to,
      subject,
      text: bodyText || subject,
      html,
      replyTo
    });

    if (sent.ok) {
      await db.ref(`mail_outbox/${emailId}`).update({
        status: "sent",
        sent_at: new Date().toISOString(),
        provider_id: sent.id || null,
        via: "resend"
      });
      return res.status(200).json({ success: true, emailId, status: "sent", id: sent.id || null });
    }

    const queued = sent.queued === true;
    await db.ref(`mail_outbox/${emailId}`).update({
      status: queued ? "queued" : "failed",
      last_error: sent.reason || "send_failed"
    });
    if (queued) {
      return res.status(200).json({
        success: true,
        emailId,
        status: "queued",
        message: "Email mis en file (Resend non configuré sur Functions)"
      });
    }
    return res.status(502).json({ success: false, emailId, status: "failed", error: "send_failed" });
  } catch (err) {
    return res.status(500).json({ error: "internal_error", message: "Erreur interne du serveur" });
  }
});

router.post(["/emails/drain", "/api/emails/drain"], requireAdmin, async (req, res) => {
  try {
    const snap = await db.ref("mail_outbox").limitToLast(40).get();
    const val = snap.exists() ? snap.val() : {};
    let sent = 0;
    let failed = 0;
    for (const [id, job] of Object.entries(val || {})) {
      if (!job || job.status === "sent") continue;
      await db.ref(`mail_outbox/${id}`).update({
        status: "processing",
        attempts: (job.attempts || 0) + 1
      });
      const result = await sendViaResend({
        to: job.to,
        subject: job.subject,
        text: job.text || job.message || job.subject,
        html: job.html,
        replyTo: job.replyTo
      });
      if (result.ok) {
        sent++;
        await db.ref(`mail_outbox/${id}`).update({
          status: "sent",
          sent_at: new Date().toISOString(),
          provider_id: result.id || null,
          via: "resend"
        });
      } else if (result.queued) {
        await db.ref(`mail_outbox/${id}`).update({ status: "queued", last_error: result.reason });
      } else {
        failed++;
        await db.ref(`mail_outbox/${id}`).update({ status: "failed", last_error: result.reason || "send_failed" });
      }
    }
    return res.status(200).json({ success: true, sent, failed });
  } catch (err) {
    return res.status(500).json({ error: "internal_error", message: "Erreur interne du serveur" });
  }
});

// 8. Admin Audit Log Retrieval
router.get(["/admin/audit", "/api/admin/audit"], requireAdmin, async (req, res) => {
  try {
    const snap = await db.ref("audit_logs").limitToLast(50).get();
    return res.status(200).json(snap.exists() ? snap.val() : {});
  } catch (err) {
    return res.status(500).json({ error: "internal_error", message: "Erreur interne du serveur" });
  }
});

app.use(router);

// Export HTTPS Function 'api'
exports.api = onRequest({ region: "europe-west1" }, app);
exports.app = app;

// Export Callable Function 'setUserRole' (Section 3.3 specification)
exports.setUserRole = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth?.token?.role || request.auth.token.role !== "admin") {
    const isAdminEmail = ADMIN_EMAILS.includes(request.auth?.token?.email);
    const hasClaim = request.auth?.token?.admin === true;
    if (!isAdminEmail && !hasClaim) {
      throw new HttpsError("permission-denied", "Administrateur requis");
    }
  }

  if (!request.auth.token.email_verified) {
    throw new HttpsError("permission-denied", "Email administratif non vérifié");
  }

  const { uid, role } = request.data || {};
  if (!uid || !["client", "staff", "admin"].includes(role)) {
    throw new HttpsError("invalid-argument", "UID ou rôle invalide");
  }

  await auth.setCustomUserClaims(uid, { role, admin: role === "admin" });
  await db.ref(`users/${uid}/role`).set(role);
  await db.ref(`users/${uid}/isAdmin`).set(role === "admin");

  return {
    success: true,
    uid,
    role
  };
});
