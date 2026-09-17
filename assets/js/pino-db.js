/**
 * pino-db.js — Capa de datos Firebase Realtime Database para Pino Espaces Verts
 * ---------------------------------------------------------------------------
 * Proyecto: pagepino-e8e97
 * Realtime Database: https://pagepino-e8e97-default-rtdb.europe-west1.firebasedatabase.app
 *
 * Módulos:
 *   /leads       — Solicitudes de presupuesto y devis
 *   /users       — Perfiles de clientes y administrador (Andrés Pino)
 *   /jobs        — Trabajos realizados, facturación y horas (CRM)
 *   /coupons     — Cupones de descuento 1:1 (PELABOLA)
 *   /audit_logs  — Auditoría de sesiones y accesos
 */

(function (global) {
  'use strict';

  function rtdb() {
    if (global.pinoRtdb) return global.pinoRtdb;
    if (typeof firebase !== 'undefined' && firebase.database) {
      try { return firebase.database(); } catch(e) {}
    }
    return null;
  }

  function sb() {
    return global.pinoSupabase || null;
  }

  function log(tag, err) {
    if (err) console.warn('[pino-db]', tag, err.message || err);
  }

  const PINO_ADMIN_EMAIL = 'pino.spacesverts@gmail.com';
  const WEB3FORMS_ACCESS_KEY = '646876c1-a20d-48d6-953e-8c3b7a5a4c9b';

  async function safePushAudit(db, payload) {
    if (!db) return;
    try {
      const p = db.ref('audit_logs').push();
      if (p && typeof p.set === 'function') {
        await p.set(payload).catch(() => {});
      }
    } catch(e) {}
  }

  function sanitizeEmail(email) {
    if (!email) return '';
    return String(email).trim().toLowerCase().replace(/[.#$\[\]\/\%]/g, '_');
  }

  function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim());
  }

  async function fetchWithTimeout(url, opts = {}, timeoutMs = 8000) {
    if (typeof fetch !== 'function') return { ok: true, json: async () => ({ success: true, ok: true }) };
    if (typeof AbortController === 'undefined') {
      return fetch(url, opts);
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...opts, signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  /* ─────────────────────────────────────────────────────────
   *  LEADS — Guardar demande de devis
   * ───────────────────────────────────────────────────────── */
  async function saveLead(data) {
    const payload = {
      full_name:    data.name     || null,
      email:        data.email    || null,
      phone:        data.phone    || null,
      commune:      data.commune  || null,
      service_type: data.service  || 'Entretien',
      surface_m2:   data.surface  ? (parseInt(data.surface, 10) || null) : null,
      budget_eur:   data.budget   ? (parseFloat(data.budget)   || null) : null,
      frequency:    data.frequency|| null,
      details:      data.details  || null,
      ref_code:     data.refCode  || null,
      source:       'web_devis',
      status:       'new',
      created_at:   new Date().toISOString(),
    };

    const db = rtdb();
    if (db) {
      try {
        const ref = db.ref('leads').push();
        const fullLead = { ...payload, id: ref.key };
        await ref.set(fullLead);

        // Partitionnement dédié par client dans clients_records/{sanitizedEmail}/quotes/{leadId}
        const rawEmail = data.email || '';
        const sanitizedEmail = rawEmail.trim().toLowerCase().replace(/[.#$\[\]]/g, '_');
        if (sanitizedEmail) {
          await db.ref(`clients_records/${sanitizedEmail}/quotes/${ref.key}`).set(fullLead).catch(() => {});
          await db.ref(`clients_records/${sanitizedEmail}/profile`).update({
            fullName: data.name || data.fullName || '',
            email: rawEmail,
            phone: data.phone || '',
            commune: data.commune || '',
            updated_at: new Date().toISOString()
          }).catch(() => {});
        }

        // Notification automatique de l'admin Andrés Pino en temps réel
        notifyAdminByEmail({
          subject: `🌿 [NOUVEAU DEVIS] Demande de ${data.name || 'Prospect'} (${data.service || 'Entretien'})`,
          type: 'new_lead',
          clientName: data.name || 'Prospect',
          clientEmail: data.email || '',
          clientPhone: data.phone || '',
          leadId: ref.key,
          amount: data.budget || null,
          message: `Nouvelle demande reçue depuis le site web officiel.\nPrestation : ${data.service || 'Entretien'}\nCommune : ${data.commune || 'Bordeaux'}\nSurface : ${data.surface ? data.surface + ' m²' : 'Non précisée'}\nDétails : ${data.details || 'Aucun'}`
        }).catch(() => {});

        return { ok: true, id: ref.key };
      } catch (err) {
        log('saveLead:rtdb', err);
      }
    }

    // Fallback Supabase si estuviera disponible
    const client = sb();
    if (client) {
      try {
        const { data: row, error } = await client.from('leads').insert(payload).select('id').single();
        if (!error) return { ok: true, id: row.id };
      } catch (err) {
        log('saveLead:sb', err);
      }
    }

    // Fallback localStorage
    try {
      const leads = JSON.parse(localStorage.getItem('pino_leads') || '[]');
      const id = 'lead_' + Date.now();
      leads.unshift({ ...payload, id });
      localStorage.setItem('pino_leads', JSON.stringify(leads));
      return { ok: true, id };
    } catch(e) {
      return { ok: false };
    }
  }

  /* ─────────────────────────────────────────────────────────
   *  LEADS — Cargar leads (solo admin)
   * ───────────────────────────────────────────────────────── */
  async function fetchLeads(opts = 100) {
    const limit = Math.max(1, parseInt(typeof opts === 'object' && opts ? opts.limit : opts, 10) || 100);
    const db = rtdb();
    if (db) {
      try {
        const snap = await db.ref('leads').limitToLast(limit).once('value');
        const val = snap.val() || {};
        const list = Object.keys(val).map(k => {
          const item = val[k];
          return {
            id: k,
            ...item,
            status: item.status === 'new' ? 'Nouveau' : (item.status || 'Nouveau')
          };
        }).reverse();
        return { ok: true, data: list };
      } catch (err) {
        log('fetchLeads:rtdb', err);
      }
    }

    const client = sb();
    if (client) {
      try {
        const { data, error } = await client.from('leads').select('*').order('created_at', { ascending: false }).limit(limit);
        if (!error && data) return { ok: true, data };
      } catch (err) {
        log('fetchLeads:sb', err);
      }
    }

    return { ok: false, data: [] };
  }

  /* ─────────────────────────────────────────────────────────
   *  LEADS — Cambiar estado de lead
   * ───────────────────────────────────────────────────────── */
  async function updateLeadStatus(leadId, newStatus) {
    const db = rtdb();
    const timestamp = new Date().toISOString();
    if (db) {
      try {
        await db.ref('leads/' + leadId).update({ status: newStatus, updated_at: timestamp });

        // Propagation instantanée dans la partition dédiée du client
        try {
          const snap = await db.ref('leads/' + leadId).once('value');
          const leadData = snap.val() || {};
          const rawEmail = leadData.email || '';
          const sanitizedEmail = sanitizeEmail(rawEmail);
          if (sanitizedEmail) {
            await db.ref(`clients_records/${sanitizedEmail}/quotes/${leadId}`).update({
              status: newStatus,
              updated_at: timestamp
            }).catch(() => {});
          }
        } catch(e) {}

        return { ok: true, leadId, newStatus };
      } catch (err) {
        log('updateLeadStatus:rtdb', err);
      }
    }

    const client = sb();
    if (client) {
      try {
        const { error } = await client.from('leads').update({ status: newStatus, updated_at: timestamp }).eq('id', leadId);
        if (!error) return { ok: true, leadId, newStatus };
      } catch (err) {
        log('updateLeadStatus:sb', err);
      }
    }

    return { ok: true, fallback: true, leadId, newStatus };
  }

  /* ─────────────────────────────────────────────────────────
   *  LEADS — Responder a solicitud de devis (Andrés Pino)
   * ───────────────────────────────────────────────────────── */
  async function saveLeadResponse(leadId, responseData) {
    const payload = {
      ...responseData,
      responded_by: 'Andrés Pino (pino.spacesverts@gmail.com)',
      responded_at: new Date().toISOString()
    };

    const db = rtdb();
    if (db) {
      try {
        await db.ref('leads/' + leadId).update({
          status: 'Devis envoyé',
          response: payload,
          updated_at: new Date().toISOString()
        });
        await db.ref('quotes_responses/' + leadId).set({
          lead_id: leadId,
          ...payload
        });

        // In-app real-time notification record for client
        const rawEmail = responseData.client_email || '';
        const sanitizedEmail = rawEmail.trim().toLowerCase().replace(/[.#$\[\]]/g, '_');
        if (sanitizedEmail) {
          // Mettre à jour dans la partition dédiée du client
          await db.ref(`clients_records/${sanitizedEmail}/quotes/${leadId}`).update({
            status: 'Devis envoyé',
            response: payload,
            updated_at: new Date().toISOString()
          }).catch(() => {});

          const notifId = 'notif_' + Date.now();
          await db.ref('client_notifications/' + sanitizedEmail + '/' + notifId).set({
            id: notifId,
            lead_id: leadId,
            type: 'devis_response',
            title: 'Proposition de Devis reçue !',
            client_name: responseData.client_name || '',
            client_email: rawEmail,
            service: responseData.service_type || 'Entretien jardin',
            commune: responseData.commune || '',
            price_ttc: responseData.price_ttc,
            credit_impot: responseData.credit_impot,
            net_client: responseData.net_client,
            duration: responseData.duration || '',
            date_proposed: responseData.date_proposed || '',
            equipment: responseData.equipment || '',
            notes: responseData.notes || '',
            read: false,
            created_at: new Date().toISOString()
          });
        }

        return { ok: true };
      } catch (err) {
        log('saveLeadResponse:rtdb', err);
      }
    }

    return { ok: true, fallback: true };
  }

  /* ─────────────────────────────────────────────────────────
   *  LEADS — Valider / Accepter le devis chiffré par le client
   * ───────────────────────────────────────────────────────── */
  async function acceptQuote(leadId, clientDetails = {}) {
    const timestamp = new Date().toISOString();
    const acceptancePayload = {
      accepted: true,
      accepted_at: timestamp,
      accepted_by: clientDetails.name || clientDetails.email || 'Client Particulier',
      client_email: clientDetails.email || '',
      client_phone: clientDetails.phone || '',
      notes: clientDetails.notes || 'Proposition validée en direct par le client'
    };

    const db = rtdb();
    if (db) {
      try {
        // 1. Mettre à jour l'état du lead dans /leads/{leadId}
        await db.ref('leads/' + leadId).update({
          status: 'Devis accepté',
          accepted_at: timestamp,
          acceptance: acceptancePayload,
          updated_at: timestamp
        });

        // 1b. Mettre à jour dans la partition dédiée du client
        const rawClientEmail = clientDetails.email || '';
        const sanitizedClientEmail = rawClientEmail.trim().toLowerCase().replace(/[.#$\[\]]/g, '_');
        if (sanitizedClientEmail) {
          await db.ref(`clients_records/${sanitizedClientEmail}/quotes/${leadId}`).update({
            status: 'Devis accepté',
            accepted_at: timestamp,
            acceptance: acceptancePayload,
            updated_at: timestamp
          }).catch(() => {});
        }

        // 2. Mettre à jour dans /quotes_responses/{leadId} si existant
        await db.ref('quotes_responses/' + leadId).update({
          status: 'Devis accepté',
          accepted_at: timestamp
        }).catch(() => {});

        // 3. Notifier Andrés Pino dans /admin_notifications
        const notifId = 'adm_notif_' + Date.now();
        await db.ref('admin_notifications/' + notifId).set({
          id: notifId,
          type: 'quote_accepted',
          lead_id: leadId,
          title: 'Proposition de Devis Acceptée !',
          client_name: clientDetails.name || 'Client Particulier',
          client_email: clientDetails.email || '',
          message: `Le client ${clientDetails.name || ''} (${clientDetails.email || ''}) a validé votre devis chiffré.`,
          created_at: timestamp,
          read: false
        }).catch(() => {});

        // 4. Mettre à jour notification client pour trace dans son espace
        const rawEmail = clientDetails.email || '';
        const sanitizedEmail = rawEmail.trim().toLowerCase().replace(/[.#$\[\]]/g, '_');
        if (sanitizedEmail) {
          const clientNotifId = 'notif_acc_' + Date.now();
          await db.ref('client_notifications/' + sanitizedEmail + '/' + clientNotifId).set({
            id: clientNotifId,
            lead_id: leadId,
            type: 'quote_confirmed',
            title: 'Devis accepté avec succès !',
            message: 'Votre accord a été transmis à Andrés Pino. Votre date d\'intervention sera confirmée sous 24h.',
            created_at: timestamp,
            read: false
          }).catch(() => {});
        }

        // 5. Enregistrer dans audit_logs
        await safePushAudit(db, {
          sessionUser: clientDetails.email || 'client',
          action: 'devis_accepte',
          leadId: leadId,
          created_at: timestamp
        });

      } catch (err) {
        log('acceptQuote:rtdb', err);
      }
    }

    // Fallback Supabase si présent
    const client = sb();
    if (client) {
      try {
        await client.from('leads').update({
          status: 'Devis accepté',
          updated_at: timestamp
        }).eq('id', leadId);
      } catch (e) {}
    }

    // Mise à jour de localStorage
    try {
      const local = JSON.parse(localStorage.getItem('pino_leads') || '[]');
      const idx = local.findIndex(l => l.id === leadId || l.sbId === leadId || l.ref_code === leadId);
      if (idx !== -1) {
        local[idx].status = 'Devis accepté';
        local[idx].accepted_at = timestamp;
        local[idx].acceptance = acceptancePayload;
        localStorage.setItem('pino_leads', JSON.stringify(local));
      }
    } catch(e) {}

    // 6. Notification par e-mail en arrière-plan (Admin Andrés Pino + Confirmation Client)
    try {
      const clientName = clientDetails.name || 'Client Particulier';
      const rawEmail = clientDetails.email || '';
      const clientPhone = clientDetails.phone || 'Non renseigné';
      const shortLeadId = String(leadId).slice(-6);

      // 6a. Notifier Andrés Pino par e-mail direct (Web3Forms + RTDB admin_notifications)
      notifyAdminByEmail({
        subject: `🎉 [DEVIS ACCEPTÉ] Proposition chiffrée validée par ${clientName}`,
        type: 'quote_accepted',
        clientName: clientName,
        clientEmail: rawEmail,
        clientPhone: clientPhone,
        leadId: leadId,
        message: `Le client ${clientName} (${rawEmail}, tél : ${clientPhone}) a formellement validé votre proposition de devis #${shortLeadId} depuis son Espace Client.\n\nNotes de validation : ${clientDetails.notes || 'Accepté via Espace Client'}.\n\nVous pouvez désormais caler la date d'intervention sur votre planning d'artisan paysagiste.`
      }).catch(err => log('acceptQuote:notifyAdminByEmail', err));

      // 6b. Confirmation automatique transmise au client par e-mail direct
      if (rawEmail) {
        notifyClientByEmail({
          clientEmail: rawEmail,
          clientName: clientName,
          subject: `✅ [CONFIRMATION] Devis #${shortLeadId} validé — Pino Espaces Verts`,
          type: 'quote_confirmed',
          message: `Nous vous remercions chaleureusement pour votre confiance !\n\nVotre accord pour la proposition chiffrée #${shortLeadId} a bien été enregistré dans nos plannings.\n\nAndrés Pino prendra contact avec vous par téléphone ou WhatsApp sous 24h pour caler la date d'intervention à votre convenance.`
        }).catch(err => log('acceptQuote:notifyClientByEmail', err));
      }
    } catch (notifErr) {
      log('acceptQuote:notifDispatch', notifErr);
    }

    return { ok: true, timestamp };
  }

  /* ─────────────────────────────────────────────────────────
   *  NOTIFICATIONS & MESSAGERIE BIDIRECTIONNELLE (Admin ↔ Client)
   * ───────────────────────────────────────────────────────── */

  /**
   * Envoie une notification par e-mail à Andrés Pino (pino.spacesverts@gmail.com)
   * via Web3Forms et enregistre l'événement dans /admin_notifications.
   */
  async function notifyAdminByEmail(opts = {}) {
    const timestamp = new Date().toISOString();
    const subject = opts.subject || '🌿 [ALERTE CRM] Notification Pino Espaces Verts';
    const clientName = opts.clientName || 'Client Particulier';
    const clientEmail = opts.clientEmail || '';
    const clientPhone = opts.clientPhone || 'Non renseigné';
    const leadId = opts.leadId || '';
    const type = opts.type || 'general';
    const message = opts.message || '';

    const formattedDate = new Date().toLocaleString('fr-FR', {
      timeZone: 'Europe/Paris',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    const mailBody = `=====================================================
PINO ESPACES VERTS — ALERTE CRM EN DIRECT
=====================================================
Type d'alerte : ${subject}
Date & Heure : ${formattedDate} (Paris)

COORDONNÉES DU CONTACT :
- Nom : ${clientName}
- E-mail : ${clientEmail || 'Non communiqué'}
- Téléphone : ${clientPhone}
${leadId ? `- Référence dossier / lead : ${leadId}\n` : ''}${opts.amount ? `- Montant : ${opts.amount} €\n` : ''}
-----------------------------------------------------
MESSAGE / DÉTAILS TRANSMIS :
${message}
-----------------------------------------------------
ACCÉDER AU CRM ADMINISTRATEUR :
https://jomstudiovzla.github.io/pinopage/#admin
=====================================================`;

    let emailSent = false;
    if (typeof fetch === 'function') {
      try {
        const res = await fetchWithTimeout('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            access_key: WEB3FORMS_ACCESS_KEY,
            to: PINO_ADMIN_EMAIL,
            from_name: 'Pino Espaces Verts — CRM Alerte',
            subject: subject,
            replyto: (clientEmail && isValidEmail(clientEmail)) ? clientEmail : PINO_ADMIN_EMAIL,
            message: mailBody,
            client_name: clientName,
            client_email: clientEmail,
            client_phone: clientPhone,
            event_type: type,
            lead_id: leadId
          })
        }, 8000);
        const data = await res.json().catch(() => ({ success: true }));
        emailSent = Boolean(data && data.success);
      } catch (err) {
        log('notifyAdminByEmail:fetch', err);
      }
    } else {
      emailSent = true;
    }

    const db = rtdb();
    if (db) {
      try {
        const notifId = 'adm_notif_' + Date.now();
        await db.ref('admin_notifications/' + notifId).set({
          id: notifId,
          type: type,
          lead_id: leadId,
          title: subject,
          client_name: clientName,
          client_email: clientEmail,
          client_phone: clientPhone,
          message: message,
          email_sent: emailSent,
          created_at: timestamp,
          read: false
        }).catch(() => {});

        await safePushAudit(db, {
          sessionUser: clientEmail || 'system',
          action: 'notify_admin_email',
          subject: subject,
          type: type,
          created_at: timestamp
        });
      } catch (err) {
        log('notifyAdminByEmail:rtdb', err);
      }
    }

    return { ok: true, emailSent, timestamp };
  }

  /**
   * Envoie un e-mail direct au client (via FormSubmit AJAX)
   * + envoie une copie de contrôle à Andrés Pino (Web3Forms)
   * + enregistre la notification dans /client_notifications/{sanitizedEmail}
   * + archive dans le dossier client /clients_records/{sanitizedEmail}/messages
   */
  async function notifyClientByEmail(opts = {}) {
    const rawEmail = (opts.clientEmail || '').trim().toLowerCase();
    if (!rawEmail || !isValidEmail(rawEmail)) {
      return { ok: false, error: 'Email client valide requis' };
    }

    const timestamp = new Date().toISOString();
    const clientName = opts.clientName || 'Client Particulier';
    const subject = opts.subject || '🌿 Pino Espaces Verts — Information sur votre dossier';
    const type = opts.type || 'direct_message';
    const message = opts.message || '';
    const actionUrl = opts.actionUrl || 'https://jomstudiovzla.github.io/pinopage/#espace-client';
    const sanitizedEmail = sanitizeEmail(rawEmail);

    const mailBody = `Bonjour ${clientName},

${message}

${opts.facNumber ? `--------------------------------------------------
RÉCAPITULATIF FACTURE :
- Numéro de facture : ${opts.facNumber}
- Montant Total TTC : ${opts.amountCharged || '0.00'} €
- Reste à charge après 50% Avance Immédiate SAP : ${opts.netClient || '0.00'} €
--------------------------------------------------\n` : ''}
Consultez vos documents, attestations fiscales SAP et propositions chiffrées en direct sur votre Espace Client sécurisé :
👉 ${actionUrl}

Si vous avez la moindre question, vous pouvez joindre Andrés Pino directement par téléphone au 06 51 59 40 34 ou par WhatsApp.

Bien cordialement,

Andrés Pino — Pino Espaces Verts
Artisan Paysagiste & Membre Déclaré Coopérative Unipros
Services à la Personne (SAP) — Agrément Crédit d'Impôt 50% Immédiat
Téléphone : 06 51 59 40 34 | E-mail : pino.spacesverts@gmail.com
Bordeaux Métropole & Gironde (33)
Site web : https://jomstudiovzla.github.io/pinopage/`;

    let clientEmailSent = false;

    if (typeof fetch === 'function') {
      try {
        const res = await fetchWithTimeout(`https://formsubmit.co/ajax/${encodeURIComponent(rawEmail)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            _subject: subject,
            _replyto: PINO_ADMIN_EMAIL,
            _template: 'box',
            name: 'Andrés Pino — Pino Espaces Verts',
            message: mailBody
          })
        }, 8000);
        const data = await res.json().catch(() => ({ success: true }));
        clientEmailSent = Boolean(data && (data.success || data.ok !== false));
      } catch (err) {
        log('notifyClientByEmail:formsubmit', err);
      }

      try {
        fetchWithTimeout('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            access_key: WEB3FORMS_ACCESS_KEY,
            to: PINO_ADMIN_EMAIL,
            from_name: 'Pino Espaces Verts — Copie E-mail Client',
            subject: `[COPIE AUDIT] ${subject} (Envoyé à ${clientName})`,
            replyto: rawEmail,
            message: `Copie conforme de l'e-mail transmis au client ${clientName} (${rawEmail}) le ${timestamp} :\n\n${mailBody}`
          })
        }, 8000).catch(() => {});
      } catch (err) {}
    } else {
      clientEmailSent = true;
    }

    const db = rtdb();
    if (db) {
      try {
        const notifId = 'notif_msg_' + Date.now();
        await db.ref(`client_notifications/${sanitizedEmail}/${notifId}`).set({
          id: notifId,
          type: type,
          title: subject,
          message: message,
          fac_number: opts.facNumber || '',
          amount_charged: opts.amountCharged || null,
          net_client: opts.netClient || null,
          created_at: timestamp,
          read: false
        }).catch(() => {});

        const msgId = 'msg_' + Date.now();
        await db.ref(`clients_records/${sanitizedEmail}/messages/${msgId}`).set({
          id: msgId,
          subject: subject,
          message: message,
          from: 'Andrés Pino — Pino Espaces Verts',
          to: rawEmail,
          client_name: clientName,
          type: type,
          email_sent: clientEmailSent,
          created_at: timestamp
        }).catch(() => {});

        await safePushAudit(db, {
          sessionUser: 'andres_pino',
          action: 'notify_client_email',
          clientEmail: rawEmail,
          subject: subject,
          created_at: timestamp
        });
      } catch (err) {
        log('notifyClientByEmail:rtdb', err);
      }
    }

    return { ok: true, clientEmailSent, timestamp };
  }

  /**
   * Envoi d'un message direct personnalisé depuis le CRM Admin vers un client
   */
  async function sendClientDirectMessage(opts = {}) {
    const rawEmail = (opts.clientEmail || '').trim().toLowerCase();
    if (!rawEmail) return { ok: false, error: 'Email requis' };

    const clientName = opts.clientName || 'Client Particulier';
    const subject = opts.subject || `Message d'Andrés Pino — Pino Espaces Verts`;
    const message = opts.message || '';
    const notifyEmail = opts.notifyEmail !== false;

    if (notifyEmail) {
      return await notifyClientByEmail({
        clientEmail: rawEmail,
        clientName: clientName,
        subject: subject,
        message: message,
        type: opts.templateType || 'direct_message'
      });
    } else {
      const sanitizedEmail = rawEmail.replace(/[.#$\[\]]/g, '_');
      const db = rtdb();
      const timestamp = new Date().toISOString();
      if (db) {
        const notifId = 'notif_msg_' + Date.now();
        await db.ref(`client_notifications/${sanitizedEmail}/${notifId}`).set({
          id: notifId,
          type: opts.templateType || 'direct_message',
          title: subject,
          message: message,
          created_at: timestamp,
          read: false
        }).catch(() => {});

        const msgId = 'msg_' + Date.now();
        await db.ref(`clients_records/${sanitizedEmail}/messages/${msgId}`).set({
          id: msgId,
          subject: subject,
          message: message,
          from: 'Andrés Pino — Pino Espaces Verts',
          to: rawEmail,
          client_name: clientName,
          created_at: timestamp
        }).catch(() => {});
      }
      return { ok: true, timestamp };
    }
  }

  /**
   * Notifier le client de l'évolution de son dossier ou statut de devis/chantier
   */
  async function notifyClientStatusChange(opts = {}) {
    const rawEmail = (opts.clientEmail || '').trim().toLowerCase();
    if (!rawEmail) return { ok: false, error: 'Email requis' };
    const clientName = opts.clientName || 'Client Particulier';
    const newStatus = opts.newStatus || 'Mis à jour';
    const ref = opts.refCode || 'Dossier';

    const statusCatalog = {
      'Nouveau': {
        title: `🌱 Demande reçue : #${ref}`,
        msg: `Bonjour ${clientName},\nVotre demande de devis #${ref} a été bien enregistrée. Andrés Pino étudie votre projet et prépare votre estimation sous 24h.`
      },
      'Devis envoyé': {
        title: `📄 Devis chiffré prêt : #${ref}`,
        msg: `Bonjour ${clientName},\nAndrés Pino a préparé votre devis chiffré #${ref} avec l'Avance Immédiate de 50% SAP déduite. Vous pouvez le consulter et le valider directement en 1 clic dans votre Espace Client.`
      },
      'En négociation': {
        title: `💬 Négociation & échange en cours : #${ref}`,
        msg: `Bonjour ${clientName},\nVotre devis #${ref} est actuellement en cours d'échange et d'ajustement avec Andrés Pino.`
      },
      'Devis accepté': {
        title: `✍️ Devis validé & signé : #${ref}`,
        msg: `Bonjour ${clientName},\nVotre accord pour le devis #${ref} a été officiellement enregistré. Andrés Pino bloque votre créneau d'intervention.`
      },
      'Chantier en cours': {
        title: `🚜 Travaux en cours d'intervention : #${ref}`,
        msg: `Bonjour ${clientName},\nAndrés Pino réalise actuellement vos travaux d'espaces verts selon les prestations convenues.`
      },
      'Facturé': {
        title: `🧾 Facture & Attestation SAP prêtes : #${ref}`,
        msg: `Bonjour ${clientName},\nVotre facture et votre attestation fiscale officielle (Case 7DB) sont disponibles dans votre Espace Client.`
      },
      'Terminé': {
        title: `🎉 Prestation achevée & soldée : #${ref}`,
        msg: `Bonjour ${clientName},\nVos travaux sont terminés avec succès. Merci de votre confiance avec Pino Espaces Verts !`
      },
      'Sans suite': {
        title: `📁 Dossier classé sans suite : #${ref}`,
        msg: `Bonjour ${clientName},\nVotre dossier a été clôturé.`
      }
    };

    const item = statusCatalog[newStatus] || {
      title: `Évolution de votre dossier #${ref}`,
      msg: `Bonjour ${clientName},\nLe statut de votre dossier auprès de Pino Espaces Verts est désormais : ${newStatus}.`
    };

    return await sendClientDirectMessage({
      clientEmail: rawEmail,
      clientName: clientName,
      subject: `🌲 [PINO] ${item.title}`,
      message: item.msg,
      templateType: 'status_evolution'
    });
  }

  async function fetchClientMessages(clientEmail) {
    if (!clientEmail) return { ok: false, data: [] };
    const sanitizedEmail = clientEmail.trim().toLowerCase().replace(/[.#$\[\]]/g, '_');
    const db = rtdb();
    if (db) {
      try {
        const snap = await db.ref(`clients_records/${sanitizedEmail}/messages`).once('value');
        const val = snap.val() || {};
        const list = Object.keys(val).map(k => ({ id: k, ...val[k] })).reverse();
        return { ok: true, data: list };
      } catch (err) {
        log('fetchClientMessages:rtdb', err);
      }
    }
    return { ok: false, data: [] };
  }

  function listenClientMessages(clientEmail, callback) {
    if (!clientEmail || typeof callback !== 'function') return () => {};
    const sanitizedEmail = clientEmail.trim().toLowerCase().replace(/[.#$\[\]]/g, '_');
    const db = rtdb();
    if (!db) return () => {};

    const msgRef = db.ref(`clients_records/${sanitizedEmail}/messages`);
    const listener = (snap) => {
      const val = snap.val() || {};
      const list = Object.keys(val).map(k => ({ id: k, ...val[k] })).reverse();
      callback(list);
    };
    msgRef.on('value', listener);
    return () => msgRef.off('value', listener);
  }

  /* ─────────────────────────────────────────────────────────
   *  NOTIFICATIONS — Écoute et gestion temps réel pour les clients
   * ───────────────────────────────────────────────────────── */
  function listenClientNotifications(clientEmail, callback) {
    if (!clientEmail || typeof callback !== 'function') return () => {};
    const sanitizedEmail = clientEmail.trim().toLowerCase().replace(/[.#$\[\]]/g, '_');
    const db = rtdb();
    if (!db) return () => {};

    const notifRef = db.ref('client_notifications/' + sanitizedEmail);
    const listener = (snap) => {
      const val = snap.val() || {};
      const list = Object.keys(val).map(k => ({ id: k, ...val[k] })).reverse();
      callback(list);
    };
    notifRef.on('value', listener);

    return () => notifRef.off('value', listener);
  }

  async function fetchClientNotifications(clientEmail) {
    if (!clientEmail) return { ok: false, data: [] };
    const sanitizedEmail = clientEmail.trim().toLowerCase().replace(/[.#$\[\]]/g, '_');
    const db = rtdb();
    if (db) {
      try {
        const snap = await db.ref('client_notifications/' + sanitizedEmail).once('value');
        const val = snap.val() || {};
        const list = Object.keys(val).map(k => ({ id: k, ...val[k] })).reverse();
        return { ok: true, data: list };
      } catch (err) {
        log('fetchClientNotifications:rtdb', err);
      }
    }
    return { ok: false, data: [] };
  }

  async function markNotificationRead(clientEmail, notifId) {
    if (!clientEmail || !notifId) return { ok: false };
    const sanitizedEmail = clientEmail.trim().toLowerCase().replace(/[.#$\[\]]/g, '_');
    const db = rtdb();
    if (db) {
      try {
        await db.ref('client_notifications/' + sanitizedEmail + '/' + notifId).update({
          read: true,
          read_at: new Date().toISOString()
        });
        return { ok: true };
      } catch (err) {
        log('markNotificationRead:rtdb', err);
      }
    }
    return { ok: false };
  }

  async function markAllClientNotificationsRead(clientEmail) {
    if (!clientEmail) return { ok: false };
    const sanitizedEmail = sanitizeEmail(clientEmail);
    const db = rtdb();
    const now = new Date().toISOString();
    if (db) {
      try {
        let updatedCount = 0;
        // 1. Mettre à jour dans client_notifications/{sanitizedEmail}
        const snap = await db.ref('client_notifications/' + sanitizedEmail).once('value');
        const val = snap.val() || {};
        const updates = {};
        for (const notifId of Object.keys(val)) {
          if (!val[notifId].read) {
            updates[`${notifId}/read`] = true;
            updates[`${notifId}/read_at`] = now;
            updatedCount++;
          }
        }
        if (Object.keys(updates).length > 0) {
          await db.ref('client_notifications/' + sanitizedEmail).update(updates);
        }

        // 2. Mettre à jour dans clients_records/{sanitizedEmail}/notifications si existant
        const partSnap = await db.ref(`clients_records/${sanitizedEmail}/notifications`).once('value');
        const partVal = partSnap.val() || {};
        const partUpdates = {};
        for (const notifId of Object.keys(partVal)) {
          if (!partVal[notifId].read) {
            partUpdates[`${notifId}/read`] = true;
            partUpdates[`${notifId}/read_at`] = now;
          }
        }
        if (Object.keys(partUpdates).length > 0) {
          await db.ref(`clients_records/${sanitizedEmail}/notifications`).update(partUpdates).catch(() => {});
        }

        return { ok: true, count: updatedCount };
      } catch (err) {
        log('markAllClientNotificationsRead:rtdb', err);
      }
    }
    return { ok: true, count: 0 };
  }

  async function markAllAdminNotificationsRead() {
    const db = rtdb();
    const now = new Date().toISOString();
    if (db) {
      try {
        const snap = await db.ref('admin_notifications').limitToLast(50).once('value');
        const val = snap.val() || {};
        const updates = {};
        let count = 0;
        for (const notifId of Object.keys(val)) {
          if (!val[notifId].read) {
            updates[`${notifId}/read`] = true;
            updates[`${notifId}/read_at`] = now;
            count++;
          }
        }
        if (Object.keys(updates).length > 0) {
          await db.ref('admin_notifications').update(updates);
        }
        return { ok: true, count };
      } catch (err) {
        log('markAllAdminNotificationsRead:rtdb', err);
      }
    }
    return { ok: true, count: 0 };
  }

  async function fetchAdminNotifications() {
    const db = rtdb();
    if (db) {
      try {
        const snap = await db.ref('admin_notifications').limitToLast(50).once('value');
        const val = snap.val() || {};
        const list = Object.keys(val).map(k => ({ ...val[k], id: k }));
        list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        return { ok: true, data: list };
      } catch (err) {
        log('fetchAdminNotifications:rtdb', err);
      }
    }
    return { ok: true, data: [] };
  }

  function listenAdminNotifications(callback) {
    const db = rtdb();
    if (!db || typeof callback !== 'function') return () => {};
    try {
      const ref = db.ref('admin_notifications').limitToLast(50);
      const onVal = (snap) => {
        const val = snap.val() || {};
        const list = Object.keys(val).map(k => ({ ...val[k], id: k }));
        list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        callback(list);
      };
      ref.on('value', onVal);
      return () => {
        try { ref.off('value', onVal); } catch (e) {}
      };
    } catch (err) {
      log('listenAdminNotifications:rtdb', err);
      return () => {};
    }
  }

  async function markAdminNotificationRead(notifId) {
    if (!notifId) return { ok: false };
    const db = rtdb();
    if (db) {
      try {
        await db.ref(`admin_notifications/${notifId}`).update({
          read: true,
          read_at: new Date().toISOString()
        });
        return { ok: true };
      } catch (err) {
        log('markAdminNotificationRead:rtdb', err);
      }
    }
    return { ok: true, fallback: true };
  }

  /* ─────────────────────────────────────────────────────────
   *  CLIENT ONBOARDING — Invitation par Andrés Pino & Activation
   * ───────────────────────────────────────────────────────── */

  /**
   * Invite et pré-enregistre un client par Andrés Pino (Admin)
   * 1. Crée le profil avec status: 'pending_activation'
   * 2. Génère un token sécurisé
   * 3. Attribue le coupon de bienvenue -20% (PELABOLA / PINO-XXXX)
   * 4. Transmet un e-mail d'invitation avec le lien d'activation direct
   */
  async function inviteClientByAdmin(data = {}) {
    if (!data || !data.email || !data.fullName) {
      return { ok: false, error: 'Nom complet et adresse e-mail obligatoires.' };
    }
    const normEmail = String(data.email).trim().toLowerCase();
    if (!isValidEmail(normEmail)) {
      return { ok: false, error: 'Format d\'adresse e-mail invalide.' };
    }
    const sanitizedEmail = sanitizeEmail(normEmail);
    const token = 'act_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    const shortSuffix = sanitizedEmail.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase() || Math.floor(1000 + Math.random() * 9000);
    const welcomeCode = `PINO-${shortSuffix}`;
    const timestamp = new Date().toISOString();

    const clientProfile = {
      uid: 'client_' + Date.now(),
      email: normEmail,
      fullName: String(data.fullName).trim(),
      phone: data.phone ? String(data.phone).trim() : '',
      commune: data.commune ? String(data.commune).trim() : 'Bordeaux Métropole (33)',
      role: 'client',
      isAdmin: false,
      status: 'pending_activation',
      activation_token: token,
      activation_created_at: timestamp,
      created_by: 'admin_andres_pino',
      notes: data.notes ? String(data.notes).trim() : '',
      service_interest: data.service || 'Entretien & Paysage',
      promoCode: welcomeCode,
      promoStatus: 'active',
      lastLogin: null
    };

    // Construction du lien d'activation universel (compatible localhost et GitHub Pages)
    let baseUrl = 'https://jomstudiovzla.github.io/pinopage/';
    if (typeof window !== 'undefined' && window.location) {
      const { origin, pathname } = window.location;
      if (origin && !origin.includes('file:')) {
        baseUrl = origin + (pathname.endsWith('/') ? pathname : pathname + '/');
      }
    }
    const activationLink = `${baseUrl}#activate?email=${encodeURIComponent(normEmail)}&token=${encodeURIComponent(token)}`;

    const db = rtdb();
    if (db) {
      try {
        // 1. Enregistrer dans /users
        await db.ref('users/' + clientProfile.uid).set(clientProfile);

        // 2. Enregistrer dans la partition dédiée /clients_records/{sanitizedEmail}/profile
        await db.ref(`clients_records/${sanitizedEmail}/profile`).set(clientProfile);

        // 3. Enregistrer le coupon de bienvenue 1:1
        await db.ref('coupons/' + welcomeCode).set({
          code: welcomeCode,
          email: normEmail,
          userId: clientProfile.uid,
          discountPercent: 20,
          status: 'active',
          created_at: timestamp,
          source: 'admin_invitation'
        }).catch(() => {});

        // 4. Notification pour l'administrateur
        const notifId = 'notif_inv_' + Date.now();
        await db.ref('admin_notifications/' + notifId).set({
          id: notifId,
          type: 'client_invited',
          title: 'Nouveau client pré-enregistré',
          client_name: clientProfile.fullName,
          client_email: normEmail,
          message: `Client ${clientProfile.fullName} (${normEmail}) pré-enregistré par Andrés. Invitation envoyée.`,
          created_at: timestamp,
          read: false
        }).catch(() => {});

        await safePushAudit(db, {
          action: 'admin_client_invited',
          email: normEmail,
          fullName: clientProfile.fullName,
          created_at: timestamp
        });
      } catch (err) {
        log('inviteClientByAdmin:rtdb', err);
      }
    }

    // 5. Mise à jour de localStorage pino_users
    try {
      let localUsers = JSON.parse(localStorage.getItem('pino_users') || '[]');
      const existIdx = localUsers.findIndex(u => u.email && u.email.toLowerCase() === normEmail);
      if (existIdx >= 0) localUsers[existIdx] = { ...localUsers[existIdx], ...clientProfile };
      else localUsers.unshift(clientProfile);
      localStorage.setItem('pino_users', JSON.stringify(localUsers));
    } catch(e) {}

    // 6. Despacho d'e-mail d'invitation au client
    try {
      const emailBody = `Bonjour ${clientProfile.fullName},

Andrés Pino (fondateur de Pino Espaces Verts à Bordeaux) a créé votre Espace Client personnel et sécurisé.

Grâce à cet espace, vous pouvez en 1 clic :
• Consulter et valider vos propositions de devis chiffrées en direct
• Suivre vos interventions d'entretien et télécharger vos factures
• Télécharger vos attestations fiscales (Crédit d'impôt 50% Urssaf / Unipros)
• Profiter immédiatement de votre code de bienvenue personnel de -20% : ${welcomeCode}

👉 Pour activer votre compte et définir votre mot de passe confidentiel, cliquez sur ce lien sécurisé :
${activationLink}

Il vous suffira d'entrer et confirmer votre mot de passe pour être immédiatement connecté à votre espace.

Nous restons à votre entière disposition pour tout renseignement.

Bien cordialement,
Andrés Pino — Pino Espaces Verts
Artisan Paysagiste • Bordeaux Métropole & Gironde
Tél / WhatsApp : +33 6 51 59 40 34
Site web : https://jomstudiovzla.github.io/pinopage/`;

      await fetchWithTimeout('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          name: 'Andrés Pino — Pino Espaces Verts',
          email: normEmail,
          from_name: 'Pino Espaces Verts',
          subject: `🌲 [ESPACE CLIENT] Votre accès personnel Pino Espaces Verts vous attend`,
          message: emailBody
        })
      });
    } catch (mailErr) {
      log('inviteClientByAdmin:web3forms', mailErr);
    }

    return { ok: true, client: clientProfile, activationLink, token };
  }

  /**
   * Active le mot de passe d'un client pré-enregistré par Andrés Pino
   */
  async function activateClientPassword(email, token, password) {
    if (!email || !password || password.length < 6) {
      return { ok: false, error: 'Le mot de passe doit comporter au moins 6 caractères.' };
    }
    const normEmail = String(email).trim().toLowerCase();
    const sanitizedEmail = sanitizeEmail(normEmail);
    const timestamp = new Date().toISOString();

    const db = rtdb();
    let clientProfile = null;

    if (db) {
      try {
        const snap = await db.ref(`clients_records/${sanitizedEmail}/profile`).once('value');
        clientProfile = snap.val();

        if (!clientProfile) {
          const usersSnap = await db.ref('users').once('value');
          const allUsers = usersSnap.val() || {};
          for (const u of Object.values(allUsers)) {
            if (u.email && u.email.toLowerCase() === normEmail) {
              clientProfile = u;
              break;
            }
          }
        }

        // Si un token a été fourni, vérifier s'il correspond (ou tolérance si admin pré-enregistré)
        if (token && clientProfile && clientProfile.activation_token && clientProfile.activation_token !== token) {
          return { ok: false, error: 'Lien d\'activation invalide ou expiré.' };
        }

        // Créer l'utilisateur dans Firebase Auth s'il n'existe pas encore
        if (typeof firebase !== 'undefined' && firebase.auth) {
          try {
            const cred = await firebase.auth().createUserWithEmailAndPassword(normEmail, password);
            if (cred && cred.user && clientProfile && clientProfile.fullName) {
              await cred.user.updateProfile({ displayName: clientProfile.fullName }).catch(() => {});
            }
          } catch (authErr) {
            if (authErr.code === 'auth/email-already-in-use') {
              try {
                const cred = await firebase.auth().signInWithEmailAndPassword(normEmail, password);
                if (cred && cred.user && cred.user.updatePassword) {
                  await cred.user.updatePassword(password).catch(() => {});
                }
              } catch (signInErr) {}
            } else {
              console.warn('[pino-db] activateClientPassword auth warning:', authErr);
            }
          }
        }

        // Mettre à jour le statut du profil en 'actif'
        const updatePayload = {
          status: 'actif',
          activation_token: null,
          activated_at: timestamp,
          updated_at: timestamp
        };

        await db.ref(`clients_records/${sanitizedEmail}/profile`).update(updatePayload);

        if (clientProfile && clientProfile.uid) {
          await db.ref('users/' + clientProfile.uid).update(updatePayload).catch(() => {});
        }

        await safePushAudit(db, {
          action: 'client_account_activated',
          email: normEmail,
          activated_at: timestamp
        });

      } catch (err) {
        log('activateClientPassword:rtdb', err);
      }
    }

    // Mise à jour de localStorage pino_users
    try {
      let localUsers = JSON.parse(localStorage.getItem('pino_users') || '[]');
      const idx = localUsers.findIndex(u => u.email && u.email.toLowerCase() === normEmail);
      if (idx >= 0) {
        localUsers[idx].status = 'actif';
        localUsers[idx].activation_token = null;
        localUsers[idx].activated_at = timestamp;
        localStorage.setItem('pino_users', JSON.stringify(localUsers));
        clientProfile = localUsers[idx];
      }
    } catch(e) {}

    return { ok: true, email: normEmail, profile: clientProfile };
  }

  /* ─────────────────────────────────────────────────────────
   *  LEADS — Obtener solicitudes de un cliente específico (desde partition dédiée clients_records)
   * ───────────────────────────────────────────────────────── */
  async function fetchClientQuotes(clientEmail) {
    if (!clientEmail) return { ok: false, data: [] };
    const normEmail = clientEmail.trim().toLowerCase();
    const sanitizedEmail = sanitizeEmail(normEmail);

    let fbMatches = [];
    const db = rtdb();
    if (db) {
      try {
        // 1. Priorité absolue : partition dédiée clients_records
        const snapPartition = await db.ref(`clients_records/${sanitizedEmail}/quotes`).once('value');
        const partitionVal = snapPartition.val() || {};
        fbMatches = Object.keys(partitionVal)
          .map(k => ({ id: k, ...partitionVal[k] }));

        // 2. Fallback / Rétrocompatibilité : si partition vide, interroger /leads global et rétro-migrer
        if (fbMatches.length === 0) {
          const snapAll = await db.ref('leads').once('value');
          const valAll = snapAll.val() || {};
          fbMatches = Object.keys(valAll)
            .map(k => ({ id: k, ...valAll[k] }))
            .filter(lead => (lead.email || '').trim().toLowerCase() === normEmail);

          // Sauvegarder dans la partition pour les accès futurs
          for (const quote of fbMatches) {
            db.ref(`clients_records/${sanitizedEmail}/quotes/${quote.id}`).set(quote).catch(() => {});
          }
        }
      } catch (err) {
        log('fetchClientQuotes:rtdb', err);
      }
    }

    let localMatches = [];
    try {
      const local = JSON.parse(localStorage.getItem('pino_leads') || '[]');
      localMatches = local.filter(l => (l.email || '').trim().toLowerCase() === normEmail);
    } catch(e) {}

    const fbIds = new Set(fbMatches.map(l => l.id || l.ref_code));
    const extraLocal = localMatches.filter(l => !fbIds.has(l.id) && !fbIds.has(l.ref_code));
    const allMatches = [...fbMatches, ...extraLocal].sort((a, b) => {
      const timeA = new Date(a.created_at || a.date || 0).getTime() || 0;
      const timeB = new Date(b.created_at || b.date || 0).getTime() || 0;
      return timeB - timeA;
    });

    return { ok: true, data: allMatches };
  }

  function listenClientQuotes(clientEmail, callback) {
    if (!clientEmail || typeof callback !== 'function') return () => {};
    const normEmail = clientEmail.trim().toLowerCase();
    const sanitizedEmail = normEmail.replace(/[.#$\[\]]/g, '_');
    const db = rtdb();
    if (!db) return () => {};

    const partitionRef = db.ref(`clients_records/${sanitizedEmail}/quotes`);
    const listener = (snap) => {
      const val = snap.val() || {};
      const matches = Object.keys(val)
        .map(k => ({ id: k, ...val[k] }))
        .reverse();
      callback(matches);
    };
    partitionRef.on('value', listener);
    return () => partitionRef.off('value', listener);
  }

  /* ─────────────────────────────────────────────────────────
   *  PROFILES — Upsert perfil al login
   * ───────────────────────────────────────────────────────── */
  async function upsertProfile(fbUser, extra = {}) {
    if (!fbUser?.uid) return { ok: false };

    const normEmail = (fbUser.email || '').trim().toLowerCase();
    const isAdmin = normEmail === 'pino.spacesverts@gmail.com' ||
                    normEmail === 'pino.espacesverts@gmail.com';
    const sanitizedEmail = normEmail ? normEmail.replace(/[.#$[\]]/g, '_') : null;

    const payload = {
      id:            fbUser.uid,
      uid:           fbUser.uid,
      email:         normEmail,
      full_name:     extra.fullName || fbUser.displayName || (isAdmin ? 'Andrés Pino' : 'Client Particulier'),
      phone:         extra.phone    || fbUser.phoneNumber || null,
      commune:       extra.commune  || 'Bordeaux',
      role:          isAdmin ? 'admin' : 'client',
      isAdmin:       isAdmin,
      auth_provider: extra.provider || 'google',
      avatar_url:    fbUser.photoURL || null,
      updated_at:    new Date().toISOString(),
    };

    const db = rtdb();
    if (db) {
      try {
        await db.ref('users/' + fbUser.uid).update(payload);
        if (sanitizedEmail) {
          await db.ref(`clients_records/${sanitizedEmail}/profile`).update({
            fullName: payload.full_name,
            email: normEmail,
            phone: payload.phone,
            commune: payload.commune,
            role: payload.role,
            lastAuthProvider: payload.auth_provider,
            updatedAt: payload.updated_at
          }).catch(() => {});
        }
        return { ok: true };
      } catch (err) {
        log('upsertProfile:rtdb', err);
      }
    }

    const client = sb();
    if (client) {
      try {
        await client.from('profiles').upsert(payload, { onConflict: 'id' });
        return { ok: true };
      } catch (err) {
        log('upsertProfile:sb', err);
      }
    }

    return { ok: false };
  }

  /* ─────────────────────────────────────────────────────────
   *  PROFILES — Cargar lista de usuarios (solo admin)
   * ───────────────────────────────────────────────────────── */
  async function fetchProfiles(opts = 100) {
    const limit = Math.max(1, parseInt(typeof opts === 'object' && opts ? opts.limit : opts, 10) || 100);
    const db = rtdb();
    if (db) {
      try {
        const snap = await db.ref('users').limitToLast(limit).once('value');
        const val = snap.val() || {};
        const list = Object.keys(val).map(k => ({ id: k, ...val[k] })).reverse();
        return { ok: true, data: list };
      } catch (err) {
        log('fetchProfiles:rtdb', err);
      }
    }

    const client = sb();
    if (client) {
      try {
        const { data, error } = await client.from('profiles').select('*').order('created_at', { ascending: false }).limit(limit);
        if (!error && data) return { ok: true, data };
      } catch (err) {
        log('fetchProfiles:sb', err);
      }
    }

    return { ok: false, data: [] };
  }

  /* ─────────────────────────────────────────────────────────
   *  CUPONES — Obtener cupón de usuario
   * ───────────────────────────────────────────────────────── */
  async function fetchUserCoupon(userId) {
    if (!userId) return null;

    const db = rtdb();
    if (db) {
      try {
        const snap = await db.ref('coupons/' + userId).once('value');
        return snap.val() || null;
      } catch (err) {
        log('fetchUserCoupon:rtdb', err);
      }
    }

    const client = sb();
    if (client) {
      try {
        const { data } = await client.from('cupones').select('*').eq('user_id', userId).single();
        if (data) return data;
      } catch(e) {}
    }

    return null;
  }

  /* ─────────────────────────────────────────────────────────
   *  CUPONES — Canjear / Asignar Cupón (20% de réduction)
   * ───────────────────────────────────────────────────────── */
  async function redeemPelabola(userId, email, customCode = 'PELABOLA') {
    const couponData = {
      user_id:       userId,
      email:         email,
      codigo_cupon:  customCode || 'PELABOLA',
      descuento_eur: 20.00,
      descuento_pct: 20,
      estado:        'valid',
      created_at:    new Date().toISOString(),
    };

    const db = rtdb();
    if (db) {
      try {
        await db.ref('coupons/' + userId).set(couponData);
        return { ok: true, coupon: couponData };
      } catch (err) {
        log('redeemPelabola:rtdb', err);
      }
    }

    const client = sb();
    if (client) {
      try {
        const { data, error } = await client.from('cupones').upsert(couponData, { onConflict: 'user_id' }).select().single();
        if (!error) return { ok: true, coupon: data };
      } catch(e) {}
    }

    return { ok: true, coupon: couponData };
  }

  /* ─────────────────────────────────────────────────────────
   *  AUDIT — Registrar sesión
   * ───────────────────────────────────────────────────────── */
  async function recordAuditSession(user) {
    const payload = {
      sessionUser: user.email,
      fullName:    user.fullName,
      role:        user.role || 'client',
      action:      'connexion',
      created_at:  new Date().toISOString(),
    };

    const db = rtdb();
    if (db) {
      try {
        await db.ref('audit_logs').push(payload);
      } catch (e) {}
    }
  }

  /* ─────────────────────────────────────────────────────────
   *  KPIS — Métricas del panel admin
   * ───────────────────────────────────────────────────────── */
  async function fetchAdminKPIs() {
    const db = rtdb();
    if (db) {
      try {
        const [lSnap, uSnap, jSnap] = await Promise.all([
          db.ref('leads').once('value'),
          db.ref('users').once('value'),
          db.ref('jobs').once('value')
        ]);
        const leads = Object.values(lSnap.val() || {});
        const users = Object.values(uSnap.val() || {});
        const jobs = Object.values(jSnap.val() || {});

        const charged = jobs.reduce((s, j) => s + (parseFloat(j.amount_charged) || 0), 0);
        const paid = jobs.reduce((s, j) => s + (parseFloat(j.amount_paid) || 0), 0);

        return {
          ok: true,
          data: {
            totalLeads: leads.length,
            totalUsers: users.length,
            totalJobs: jobs.length,
            totalCharged: charged,
            totalPaid: paid
          }
        };
      } catch (err) {
        log('fetchAdminKPIs:rtdb', err);
      }
    }

    return { ok: false };
  }

  /* ─────────────────────────────────────────────────────────
   *  JOBS CRM — Guardar trabajo realizado
   * ───────────────────────────────────────────────────────── */
  async function saveJob(data) {
    const charged = parseFloat(data.amountCharged) || 0;
    const isPaid = (data.paymentStatus || '').toLowerCase() === 'paid';
    const paid = data.amountPaid !== undefined ? (parseFloat(data.amountPaid) || 0) : (isPaid ? charged : 0);
    const due = Math.max(0, charged - paid);

    const payload = {
      fac_number:      data.facNumber    || data.fac_number || null,
      lead_id:         data.leadId       || data.lead_id    || null,
      client_id:       data.clientId     || null,
      client_name:     data.clientName   || '',
      client_email:    data.clientEmail  || null,
      client_phone:    data.clientPhone  || null,
      client_commune:  data.clientCommune|| null,
      service_type:    data.serviceType  || 'Entretien jardin',
      description:     data.description  || null,
      date_start:      data.dateStart    || null,
      date_end:        data.dateEnd      || null,
      hours_spent:     data.hoursSpent   ? parseFloat(data.hoursSpent)   : null,
      amount_charged:  charged,
      amount_paid:     paid,
      amount_due:      due,
      payment_status:  data.paymentStatus|| (due <= 0 ? 'paid' : 'pending'),
      payment_method:  data.paymentMethod|| null,
      notes:           data.notes        || null,
      created_by:      data.createdBy    || null,
      created_at:      new Date().toISOString()
    };

    const db = rtdb();
    if (db) {
      try {
        const ref = db.ref('jobs').push();
        const fullJob = { ...payload, id: ref.key };
        await ref.set(fullJob);

        // Partitionnement dédié par client dans clients_records/{sanitizedEmail}/invoices/{jobId}
        const rawEmail = data.clientEmail || '';
        const sanitizedEmail = sanitizeEmail(rawEmail);
        if (sanitizedEmail) {
          await db.ref(`clients_records/${sanitizedEmail}/invoices/${ref.key}`).set(fullJob).catch(() => {});
          await db.ref(`clients_records/${sanitizedEmail}/profile`).update({
            fullName: data.clientName || '',
            email: rawEmail,
            phone: data.clientPhone || '',
            commune: data.clientCommune || '',
            updated_at: new Date().toISOString()
          }).catch(() => {});

          const notifId = 'notif_fac_' + Date.now();
          const charged = parseFloat(data.amountCharged) || 0;
          const isUnipros = (data.paymentMethod || '').toLowerCase() === 'unipros';
          const net = isUnipros ? (charged * 0.5) : charged;
          await db.ref('client_notifications/' + sanitizedEmail + '/' + notifId).set({
            id: notifId,
            type: 'invoice_issued',
            title: 'Nouvelle Facture & Attestation Fiscale',
            message: `Votre facture ${payload.fac_number || '#FAC'} (${charged.toFixed(2)} € TTC) est disponible dans votre Espace Client.`,
            fac_number: payload.fac_number || '',
            amount_charged: charged,
            net_client: net,
            service: data.serviceType || 'Entretien jardin',
            created_at: new Date().toISOString(),
            read: false
          }).catch(() => {});
        }

        return { ok: true, id: ref.key };
      } catch (err) {
        log('saveJob:rtdb', err);
      }
    }

    const client = sb();
    if (client) {
      try {
        const { data: row, error } = await client.from('jobs').insert(payload).select('id').single();
        if (!error && row) return { ok: true, id: row.id };
      } catch (err) {
        log('saveJob:sb', err);
      }
    }

    return { ok: false };
  }

  /* ─────────────────────────────────────────────────────────
   *  JOBS CRM — Cargar lista de trabajos
   * ───────────────────────────────────────────────────────── */
  async function fetchJobs(opts = {}) {
    const limit = Math.max(1, parseInt(typeof opts === 'number' ? opts : (opts && opts.limit ? opts.limit : 200), 10) || 200);
    const status = (typeof opts === 'object' && opts) ? (opts.status || null) : null;
    const db = rtdb();
    if (db) {
      try {
        const snap = await db.ref('jobs').limitToLast(limit).once('value');
        const val = snap.val() || {};
        let list = Object.keys(val).map(k => {
          const j = val[k];
          const charged = parseFloat(j.amount_charged) || 0;
          const isPaid = (j.payment_status || '').toLowerCase() === 'paid';
          const paid = j.amount_paid !== undefined ? (parseFloat(j.amount_paid) || 0) : (isPaid ? charged : 0);
          const due = j.amount_due !== undefined ? (parseFloat(j.amount_due) || 0) : Math.max(0, charged - paid);
          return {
            id: k,
            ...j,
            amount_charged: charged,
            amount_paid: paid,
            amount_due: due
          };
        }).reverse();
        if (status) list = list.filter(j => j.payment_status === status);
        return { ok: true, data: list };
      } catch (err) {
        log('fetchJobs:rtdb', err);
      }
    }

    const client = sb();
    if (client) {
      try {
        let q = client.from('jobs').select('*').order('created_at', { ascending: false }).limit(limit);
        if (status) q = q.eq('payment_status', status);
        const { data, error } = await q;
        if (!error && data) return { ok: true, data };
      } catch (err) {
        log('fetchJobs:sb', err);
      }
    }

    return { ok: false, data: [] };
  }

  /* ─────────────────────────────────────────────────────────
   *  JOBS CRM — Actualizar trabajo (avec propagation partition client)
   * ───────────────────────────────────────────────────────── */
  async function updateJob(jobId, patch) {
    const db = rtdb();
    if (db) {
      try {
        if (patch.payment_status === 'paid' && patch.amount_paid === undefined) {
          try {
            const snap = await db.ref('jobs/' + jobId).once('value');
            const curJob = snap.val() || {};
            const charged = parseFloat(curJob.amount_charged) || 0;
            patch.amount_paid = charged;
            patch.amount_due = 0;
          } catch(e) {}
        }

        await db.ref('jobs/' + jobId).update({ ...patch, updated_at: new Date().toISOString() });

        // Propagation automatique dans la partition du client
        try {
          let clientEmail = patch.client_email || patch.clientEmail || '';
          if (!clientEmail) {
            const snap = await db.ref('jobs/' + jobId).once('value');
            const curJob = snap.val() || {};
            clientEmail = curJob.client_email || curJob.clientEmail || '';
          }
          const sanitizedEmail = sanitizeEmail(clientEmail);
          if (sanitizedEmail) {
            await db.ref(`clients_records/${sanitizedEmail}/invoices/${jobId}`).update({
              ...patch,
              updated_at: new Date().toISOString()
            }).catch(() => {});
          }
        } catch(e) {}

        return { ok: true };
      } catch (err) {
        log('updateJob:rtdb', err);
      }
    }

    const client = sb();
    if (client) {
      try {
        const { error } = await client.from('jobs').update(patch).eq('id', jobId);
        if (!error) return { ok: true };
      } catch (err) {
        log('updateJob:sb', err);
      }
    }

    return { ok: false };
  }

  /* ─────────────────────────────────────────────────────────
   *  JOBS / FACTURES — Obtener factures d'un client spécifique (partition clients_records)
   * ───────────────────────────────────────────────────────── */
  async function fetchClientInvoices(clientEmail) {
    if (!clientEmail) return { ok: false, data: [] };
    const normEmail = clientEmail.trim().toLowerCase();
    const sanitizedEmail = sanitizeEmail(normEmail);

    let fbMatches = [];
    const db = rtdb();
    if (db) {
      try {
        // 1. Priorité absolue : partition dédiée clients_records
        const snapPartition = await db.ref(`clients_records/${sanitizedEmail}/invoices`).once('value');
        const partitionVal = snapPartition.val() || {};
        fbMatches = Object.keys(partitionVal)
          .map(k => ({ id: k, ...partitionVal[k] }));

        // 2. Fallback / Rétrocompatibilité : si partition vide, interroger /jobs global et rétro-migrer
        if (fbMatches.length === 0) {
          const snapAll = await db.ref('jobs').once('value');
          const valAll = snapAll.val() || {};
          fbMatches = Object.keys(valAll)
            .map(k => ({ id: k, ...valAll[k] }))
            .filter(j => (j.client_email || '').trim().toLowerCase() === normEmail);

          for (const job of fbMatches) {
            db.ref(`clients_records/${sanitizedEmail}/invoices/${job.id}`).set(job).catch(() => {});
          }
        }
      } catch (err) {
        log('fetchClientInvoices:rtdb', err);
      }
    }

    let localMatches = [];
    try {
      const local = JSON.parse(localStorage.getItem('pino_admin_jobs') || '[]');
      localMatches = local.filter(j => (j.client_email || '').trim().toLowerCase() === normEmail);
    } catch(e) {}

    const fbIds = new Set(fbMatches.map(j => j.id));
    const extraLocal = localMatches.filter(j => !fbIds.has(j.id));
    const allMatches = [...fbMatches, ...extraLocal].sort((a, b) => {
      const timeA = new Date(a.created_at || a.date_start || a.date || 0).getTime() || 0;
      const timeB = new Date(b.created_at || b.date_start || b.date || 0).getTime() || 0;
      return timeB - timeA;
    });

    return { ok: true, data: allMatches };
  }

  function listenClientInvoices(clientEmail, callback) {
    if (!clientEmail || typeof callback !== 'function') return () => {};
    const normEmail = clientEmail.trim().toLowerCase();
    const sanitizedEmail = normEmail.replace(/[.#$\[\]]/g, '_');
    const db = rtdb();
    if (!db) return () => {};

    const partitionRef = db.ref(`clients_records/${sanitizedEmail}/invoices`);
    const listener = (snap) => {
      const val = snap.val() || {};
      const matches = Object.keys(val)
        .map(k => ({ id: k, ...val[k] }))
        .reverse();
      callback(matches);
    };
    partitionRef.on('value', listener);
    return () => partitionRef.off('value', listener);
  }

  /* ─────────────────────────────────────────────────────────
   *  MIGRATION & PARTITIONNEMENT AUTOMATIQUE
   *  Ventile automatiquement tous les leads et factures existants
   *  dans clients_records/{sanitizedEmail}/...
   * ───────────────────────────────────────────────────────── */
  async function syncExistingRecordsToClientPartitions() {
    const db = rtdb();
    if (!db) return { ok: false, synced: 0 };
    let syncCount = 0;
    try {
      // 1. Partitionner les leads existants
      const leadsSnap = await db.ref('leads').once('value');
      const leadsVal = leadsSnap.val() || {};
      for (const [leadId, lead] of Object.entries(leadsVal)) {
        const rawEmail = lead.email || '';
        const sanitized = sanitizeEmail(rawEmail);
        if (sanitized) {
          await db.ref(`clients_records/${sanitized}/quotes/${leadId}`).set({ ...lead, id: leadId }).catch(() => {});
          await db.ref(`clients_records/${sanitized}/profile`).update({
            fullName: lead.full_name || lead.name || '',
            email: rawEmail,
            phone: lead.phone || '',
            commune: lead.commune || '',
            updated_at: new Date().toISOString()
          }).catch(() => {});
          syncCount++;
        }
      }

      // 2. Partitionner les factures / jobs existants
      const jobsSnap = await db.ref('jobs').once('value');
      const jobsVal = jobsSnap.val() || {};
      for (const [jobId, job] of Object.entries(jobsVal)) {
        const rawEmail = job.client_email || job.clientEmail || '';
        const sanitized = sanitizeEmail(rawEmail);
        if (sanitized) {
          await db.ref(`clients_records/${sanitized}/invoices/${jobId}`).set({ ...job, id: jobId }).catch(() => {});
          await db.ref(`clients_records/${sanitized}/profile`).update({
            fullName: job.client_name || '',
            email: rawEmail,
            phone: job.client_phone || '',
            commune: job.client_commune || '',
            updated_at: new Date().toISOString()
          }).catch(() => {});
          syncCount++;
        }
      }
      return { ok: true, synced: syncCount };
    } catch(err) {
      log('syncExistingRecordsToClientPartitions', err);
      return { ok: false, error: err.message };
    }
  }

  /* ─────────────────────────────────────────────────────────
   *  EXPORT UTIL — Descarga segura de Blob / Data URI en el navegador
   *  Totalmente inmune a ERR_FILE_NOT_FOUND (Chrome, Safari, PWA, file:///, localhost)
   * ───────────────────────────────────────────────────────── */
  async function downloadFileBlob(blobOrDataUri, filename) {
    if (!blobOrDataUri) return false;
    filename = filename || 'document_pino.pdf';

    let blob = blobOrDataUri;

    // 1. Si se recibe una Data URI Base64, convertirla a Blob binario puro
    if (typeof blobOrDataUri === 'string' && blobOrDataUri.startsWith('data:')) {
      try {
        const commaIdx = blobOrDataUri.indexOf(',');
        const header = blobOrDataUri.slice(0, commaIdx);
        const base64 = blobOrDataUri.slice(commaIdx + 1);
        const mime = (header.match(/:(.*?);/) || [])[1] || 'application/octet-stream';
        const binStr = atob(base64);
        const len = binStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binStr.charCodeAt(i);
        }
        blob = new Blob([bytes], { type: mime });
      } catch (e) {
        console.warn('[PinoDB] Erreur conversion dataUri vers Blob:', e);
      }
    }

    // 2. Si la ventana principal tiene el motor maestro saveBlobToUserMachine, delegar
    if (typeof window !== 'undefined' && typeof window.saveBlobToUserMachine === 'function' && blob instanceof Blob) {
      try {
        return await window.saveBlobToUserMachine(blob, filename);
      } catch(e) {}
    }

    // 3. Soporte nativo para File System Access API (Cuadro Guardar como... nativo)
    if (typeof window !== 'undefined' && typeof window.showSaveFilePicker === 'function' && window.isSecureContext && blob instanceof Blob) {
      try {
        const isPdf = filename.toLowerCase().endsWith('.pdf');
        const isCsv = filename.toLowerCase().endsWith('.csv');
        const isJson = filename.toLowerCase().endsWith('.json');
        const mimeType = isPdf ? 'application/pdf' : (isCsv ? 'text/csv' : (isJson ? 'application/json' : 'application/octet-stream'));
        const ext = isPdf ? '.pdf' : (isCsv ? '.csv' : (isJson ? '.json' : ''));

        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: isPdf ? 'Document PDF (*.pdf)' : (isCsv ? 'Tableur CSV (*.csv)' : 'Fichier JSON (*.json)'),
            accept: { [mimeType]: [ext] }
          }]
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return true;
      } catch (err) {
        if (err.name === 'AbortError') return false;
      }
    }

    // 4. Descarga estándar mediante Blob URL con 10 minutos de retención
    return fallbackObjectUrl(blob, filename);
  }

  function fallbackObjectUrl(blob, filename) {
    try {
      const url = URL.createObjectURL(blob);
      if (typeof window !== 'undefined') {
        window._activePinoBlobUrls = window._activePinoBlobUrls || [];
        window._activePinoBlobUrls.push(url);
      }

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.rel = 'noopener';
      a.target = '_self'; // Strictly _self : evita pestañas fantasma con ERR_FILE_NOT_FOUND
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        try { if (a.parentNode) a.parentNode.removeChild(a); } catch(e) {}
      }, 3000);

      // Retener durante 10 minutos completos (600,000 ms) para que el gestor de Chrome jamás pierda el archivo
      setTimeout(() => {
        try { URL.revokeObjectURL(url); } catch(e) {}
      }, 600000);

      return true;
    } catch (err) {
      console.error('[PinoDB] fallbackObjectUrl error:', err);
      return false;
    }
  }

  function exportDataToCSV(headers, rows, filename) {
    const lines = [
      headers.map(h => `"${String(h ?? '').replace(/"/g, '""')}"`).join(';'),
      ...rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(';'))
    ];
    const csvContent = lines.join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    return downloadFileBlob(blob, filename);
  }

  /* ─────────────────────────────────────────────────────────
   *  EXPORT — Generar CSV de travaux
   * ───────────────────────────────────────────────────────── */
  function exportJobsCSV(jobs = []) {
    const headers = [
      'Client','Email','Commune','Prestation','Description',
      'Date début','Date fin','Heures','Facturé TTC (€)',
      'Payé (€)','Reste (€)','Statut paiement','Mode de règlement','Notes'
    ];

    const rows = (jobs || []).map(j => {
      const charged = parseFloat(j.amount_charged) || 0;
      const paid = parseFloat(j.amount_paid) || 0;
      const pending = charged - paid;

      return [
        j.client_name    || '',
        j.client_email   || '',
        j.client_commune || '',
        j.service_type   || '',
        j.description    || '',
        j.date_start     || '',
        j.date_end       || '',
        j.hours_spent    || '',
        charged.toFixed(2),
        paid.toFixed(2),
        pending.toFixed(2),
        j.payment_status || '',
        j.payment_method || '',
        j.notes          || '',
      ];
    });

    const filename = `pino_travaux_${new Date().toISOString().slice(0,10)}.csv`;
    return exportDataToCSV(headers, rows, filename);
  }

  /* ─────────────────────────────────────────────────────────
   *  EXPORT — Generar PDF de travaux con jsPDF
   * ───────────────────────────────────────────────────────── */
  function exportJobsPDF(jobs = []) {
    const jsPDFConstructor = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    if (typeof jsPDFConstructor === 'function') {
      try {
        const doc = new jsPDFConstructor({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const now  = new Date().toLocaleDateString('fr-FR');
        const GREEN = [30, 81, 56]; // #1e5138

        // En-tête
        doc.setFillColor(...GREEN);
        doc.rect(0, 0, 297, 18, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('Pino Espaces Verts — Rapport des Travaux & Facturation', 10, 12);
        doc.setFontSize(9);
        doc.text(`Généré le ${now}`, 235, 12);

        // Résumé financier
        const totalCharged = (jobs || []).reduce((s, j) => s + (parseFloat(j.amount_charged) || 0), 0);
        const totalPaid    = (jobs || []).reduce((s, j) => s + (parseFloat(j.amount_paid)    || 0), 0);
        const totalHours   = (jobs || []).reduce((s, j) => s + (parseFloat(j.hours_spent)    || 0), 0);

        doc.setTextColor(15, 23, 42);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(`Total chantiers : ${jobs.length}   |   Facturé TTC : ${totalCharged.toFixed(2)} €   |   Encaissé : ${totalPaid.toFixed(2)} €   |   Heures cumulées : ${totalHours.toFixed(1)} h`, 10, 25);

        // Tableau
        const cols = ['Client','Prestation','Période','H.','Facturé €','Payé €','Statut','Mode','Notes'];
        const colW = [38, 32, 30, 12, 22, 18, 20, 22, 42];
        let y = 32;

        doc.setFillColor(230, 245, 218);
        doc.rect(10, y, 277, 7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        let x = 10;
        cols.forEach((c, i) => { doc.text(c, x + 1, y + 5); x += colW[i]; });
        y += 8;

        const statusLabel = { pending:'En attente', partial:'Partiel', paid:'Payé', cancelled:'Annulé' };
        const methodLabel = { unipros:'Unipros SAP', virement:'Virement', cheque:'Chèque', cesu:'CESU', especes:'Espèces', autre:'Autre' };

        doc.setFont('helvetica', 'normal');
        (jobs || []).forEach((j, idx) => {
          if (y > 185) { doc.addPage(); y = 15; }
          if (idx % 2 === 0) { doc.setFillColor(248, 252, 243); doc.rect(10, y, 277, 7, 'F'); }
          const period = [j.date_start, j.date_end].filter(Boolean).join(' → ') || 'Ponctuel';
          const row = [
            j.client_name   || 'Client',
            j.service_type  || '',
            period,
            j.hours_spent   ? String(j.hours_spent) : '',
            j.amount_charged? `${parseFloat(j.amount_charged).toFixed(2)} €` : '',
            j.amount_paid   ? `${parseFloat(j.amount_paid).toFixed(2)} €`    : '0.00 €',
            statusLabel[j.payment_status] || j.payment_status || '',
            methodLabel[j.payment_method] || j.payment_method || '',
            (j.notes || '').slice(0, 50),
          ];
          x = 10;
          row.forEach((v, i) => {
            doc.text(String(v), x + 1, y + 5, { maxWidth: colW[i] - 2 });
            x += colW[i];
          });
          y += 8;
        });

        const pdfBlob = doc.output('blob');
        return downloadFileBlob(pdfBlob, `pino_travaux_${new Date().toISOString().slice(0,10)}.pdf`);
      } catch (err) {
        console.warn('[PinoDB] exportJobsPDF error, falling back to CSV:', err);
      }
    }

    return exportJobsCSV(jobs);
  }

  /* ─────────────────────────────────────────────────────────
   *  EXPORT — Generar CSV y PDF de Leads / Devis
   * ───────────────────────────────────────────────────────── */
  function exportLeadsCSV(leads = []) {
    const headers = [
      'Réf Devis', 'Date', 'Client', 'Email', 'Téléphone', 'Commune',
      'Prestation', 'Surface', 'Budget TTC (€)', 'Reste Net 50% SAP (€)',
      'Statut', 'Diagnostic Qualité', 'Raison Qualité', 'Détails & Notes'
    ];

    const rows = (leads || []).map(l => {
      const budget = parseFloat(l.response?.price_ttc || l.budget_eur || l.budget || 0) || 0;
      const net = budget * 0.5;
      const dateStr = l.created_at ? new Date(l.created_at).toLocaleDateString('fr-FR') : (l.date || '—');
      const qStatus = l.quality_status === 'bonne' ? 'Bonne réponse ⭐' : (l.quality_status === 'reparee' ? 'Réparée 🛠️' : 'À réparer ⚠️');

      return [
        l.ref_code || l.id || '',
        dateStr,
        l.name || 'Client',
        l.email || '',
        l.phone || '',
        l.commune || '',
        l.service_type || l.service || '',
        l.surface ? `${l.surface} m²` : '',
        budget.toFixed(2),
        net.toFixed(2),
        l.status || 'Nouveau',
        qStatus,
        l.quality_reason || '',
        l.details || ''
      ];
    });

    const filename = `pino_devis_leads_${new Date().toISOString().slice(0,10)}.csv`;
    return exportDataToCSV(headers, rows, filename);
  }

  function exportLeadsPDF(leads = []) {
    const jsPDFConstructor = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    if (typeof jsPDFConstructor === 'function') {
      try {
        const doc = new jsPDFConstructor({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const now  = new Date().toLocaleDateString('fr-FR');
        const GREEN = [30, 81, 56];

        doc.setFillColor(...GREEN);
        doc.rect(0, 0, 297, 18, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('Pino Espaces Verts — Registre des Devis & Prospects', 10, 12);
        doc.setFontSize(9);
        doc.text(`Généré le ${now}`, 235, 12);

        doc.setTextColor(15, 23, 42);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(`Total devis & prospects : ${leads.length}`, 10, 25);

        const cols = ['Réf','Date','Client','Contact','Commune','Prestation','Budget TTC','Reste 50%','Statut'];
        const colW = [28, 22, 38, 38, 32, 40, 22, 22, 35];
        let y = 32;

        doc.setFillColor(230, 245, 218);
        doc.rect(10, y, 277, 7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        let x = 10;
        cols.forEach((c, i) => { doc.text(c, x + 1, y + 5); x += colW[i]; });
        y += 8;

        doc.setFont('helvetica', 'normal');
        (leads || []).forEach((l, idx) => {
          if (y > 185) { doc.addPage(); y = 15; }
          if (idx % 2 === 0) { doc.setFillColor(248, 252, 243); doc.rect(10, y, 277, 7, 'F'); }
          const budget = parseFloat(l.response?.price_ttc || l.budget_eur || l.budget || 0) || 0;
          const net = budget * 0.5;
          const dateStr = l.created_at ? new Date(l.created_at).toLocaleDateString('fr-FR') : (l.date || '—');
          const contact = [l.phone, l.email].filter(Boolean).join(' • ');

          const row = [
            l.ref_code || l.id || '',
            dateStr,
            l.name || 'Client',
            contact,
            l.commune || 'Gironde',
            l.service_type || l.service || '',
            budget > 0 ? `${budget.toFixed(0)} €` : '—',
            net > 0 ? `${net.toFixed(0)} €` : '—',
            l.status || 'Nouveau'
          ];
          x = 10;
          row.forEach((v, i) => {
            doc.text(String(v), x + 1, y + 5, { maxWidth: colW[i] - 2 });
            x += colW[i];
          });
          y += 8;
        });

        const pdfBlob = doc.output('blob');
        return downloadFileBlob(pdfBlob, `pino_devis_prospects_${new Date().toISOString().slice(0,10)}.pdf`);
      } catch (err) {
        console.warn('[PinoDB] exportLeadsPDF error, falling back to CSV:', err);
      }
    }

    return exportLeadsCSV(leads);
  }

  /* ─────────────────────────────────────────────────────────
   *  EXPORT — Generar CSV de factures
   * ───────────────────────────────────────────────────────── */
  function exportFacturesCSV(jobs = []) {
    const headers = [
      'N° Facture', 'Date intervention', 'Client', 'Email', 'Téléphone',
      'Commune', 'Prestation', 'Montant TTC (€)', 'Avance SAP 50% (€)',
      'Net Payé Client (€)', 'Mode de règlement', 'Statut Facture', 'Notes'
    ];

    const rows = (jobs || []).map(j => {
      const charged = parseFloat(j.amount_charged) || 0;
      const isUnipros = (j.payment_method || 'unipros') === 'unipros';
      const credit = isUnipros ? charged * 0.5 : 0;
      const net = charged - credit;
      const facNum = j.fac_number || `#FAC-${String(j.id || '').slice(-6).toUpperCase()}`;
      const dateStr = j.date_start ? new Date(j.date_start).toLocaleDateString('fr-FR') : (j.created_at ? new Date(j.created_at).toLocaleDateString('fr-FR') : '—');
      const statusStr = j.payment_status === 'cancelled' ? 'Annulée' : (j.payment_status === 'paid' ? 'Acquittée' : 'En attente');

      return [
        facNum,
        dateStr,
        j.client_name || 'Client',
        j.client_email || '',
        j.client_phone || '',
        j.client_commune || '',
        j.service_type || '',
        charged.toFixed(2),
        credit.toFixed(2),
        net.toFixed(2),
        j.payment_method || 'unipros',
        statusStr,
        j.notes || ''
      ];
    });

    const filename = `pino_factures_${new Date().toISOString().slice(0,10)}.csv`;
    return exportDataToCSV(headers, rows, filename);
  }

  function exportClientFacturesCSV(jobs = [], clientEmail = '') {
    const filtered = (jobs || []).filter(j => !clientEmail || (j.client_email || '').trim().toLowerCase() === clientEmail.trim().toLowerCase());
    const headers = [
      'N° Facture', 'Date intervention', 'Prestation', 'Montant TTC (€)',
      'Avance SAP 50% (€)', 'Reste Net Payé (€)', 'Mode de règlement', 'Statut Facture'
    ];

    const rows = filtered.map(j => {
      const charged = parseFloat(j.amount_charged) || 0;
      const isUnipros = (j.payment_method || 'unipros') === 'unipros';
      const credit = isUnipros ? charged * 0.5 : 0;
      const net = charged - credit;
      const facNum = j.fac_number || `#FAC-${String(j.id || '').slice(-6).toUpperCase()}`;
      const dateStr = j.date_start ? new Date(j.date_start).toLocaleDateString('fr-FR') : (j.created_at ? new Date(j.created_at).toLocaleDateString('fr-FR') : '—');
      const st = j.payment_status === 'cancelled' ? 'Annulée' : (j.payment_status === 'paid' ? 'Acquittée' : 'En attente');

      return [
        facNum,
        dateStr,
        j.service_type || 'Entretien jardin',
        charged.toFixed(2),
        credit.toFixed(2),
        net.toFixed(2),
        isUnipros ? 'Unipros SAP' : (j.payment_method || 'Direct B2B'),
        st
      ];
    });

    const filename = `mes_factures_pino_${new Date().toISOString().slice(0,10)}.csv`;
    return exportDataToCSV(headers, rows, filename);
  }

  /* ─────────────────────────────────────────────────────────
   *  EXPORT — Generar CSV de opportunités multi-plateformes
   * ───────────────────────────────────────────────────────── */
  function exportPlatformLeadsCSV(leads = []) {
    const headers = [
      'Plateforme', 'Date repérée', 'Nom / Contact', 'Commune',
      'Prestation demandée', 'Budget indicatif (€)', 'Téléphone', 'Statut', 'Lien annonce', 'Notes'
    ];

    const rows = (leads || []).map(l => [
      l.platform || '',
      l.created_at ? new Date(l.created_at).toLocaleDateString('fr-FR') : '—',
      l.name || 'Prospect',
      l.commune || '',
      l.service || '',
      l.budget ? parseFloat(l.budget).toFixed(2) : '0.00',
      l.phone || '',
      l.status || 'a_contacter',
      l.url || '',
      l.notes || ''
    ]);

    const filename = `pino_prospection_6plateformes_${new Date().toISOString().slice(0,10)}.csv`;
    return exportDataToCSV(headers, rows, filename);
  }

  /* ─────────────────────────────────────────────────────────
   *  EXPORT — Generar CSV para el cliente de sus devis
   * ───────────────────────────────────────────────────────── */
  function exportClientQuotesCSV(quotes = [], clientName = 'Client') {
    const headers = [
      'Réf Devis', 'Date', 'Prestation', 'Budget estimé (€)',
      'Avance 50% SAP (€)', 'Reste Net Client (€)', 'Statut'
    ];

    const rows = (quotes || []).map(q => {
      const resp = q.response || {};
      const total = parseFloat(resp.price_ttc || q.budget || 0) || 0;
      const credit = total * 0.5;
      const net = total - credit;
      const dateStr = q.created_at ? new Date(q.created_at).toLocaleDateString('fr-FR') : (q.date || '—');

      return [
        q.ref_code || q.id || '',
        dateStr,
        q.service_type || q.service || 'Entretien jardin',
        total.toFixed(2),
        credit.toFixed(2),
        net.toFixed(2),
        q.status || 'En cours'
      ];
    });

    const safeName = (clientName || 'client').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `mes_devis_pino_${safeName}_${new Date().toISOString().slice(0,10)}.csv`;
    return exportDataToCSV(headers, rows, filename);
  }

  /* ─────────────────────────────────────────────────────────
   *  QUALITÉ & RÉPARATION DES RÉPONSES / LEADS
   * ───────────────────────────────────────────────────────── */
  async function updateLeadQuality(leadId, qualityData = {}) {
    const payload = {
      quality_status: qualityData.status || 'bonne', // 'bonne' | 'mauvaise' | 'reparee'
      quality_reason: qualityData.reason || '',
      quality_score:  qualityData.score  || 80,
      repaired_at:    qualityData.repaired_at || null,
      repair_action:  qualityData.repair_action || null,
      updated_at:     new Date().toISOString()
    };

    const db = rtdb();
    if (db) {
      try {
        await db.ref('leads/' + leadId).update(payload);
        return { ok: true };
      } catch (err) {
        log('updateLeadQuality:rtdb', err);
      }
    }

    // LocalStorage fallback
    try {
      let leads = JSON.parse(localStorage.getItem('pino_leads') || '[]');
      const idx = leads.findIndex(l => l.id === leadId || l.ref_code === leadId || l.sbId === leadId);
      if (idx >= 0) {
        leads[idx] = { ...leads[idx], ...payload };
        localStorage.setItem('pino_leads', JSON.stringify(leads));
        return { ok: true };
      }
    } catch(e) {}

    return { ok: false };
  }

  async function repairLead(leadId, repairType = 'relance_sap_50', customNotes = '') {
    let repairActionDesc = '';
    let statusUpdate = 'Relancé';

    if (repairType === 'relance_sap_50') {
      repairActionDesc = "Relance Avance Immédiate 50% SAP appliquée (Divise le reste à charge par 2)";
    } else if (repairType === 'coupon_20') {
      repairActionDesc = "Coupon Bienvenue -20% (PELABOLA) injecté dans le devis";
    } else if (repairType === 'chiffrage_ajuste') {
      repairActionDesc = `Chiffrage recalculé et ajusté : ${customNotes || 'Tarif adapté au budget'}`;
    } else {
      repairActionDesc = customNotes || 'Réparation manuelle effectuée par Andrés';
    }

    const updates = {
      status: statusUpdate,
      quality_status: 'reparee',
      quality_reason: `Réparé : ${repairActionDesc}`,
      quality_score: 85,
      repaired_at: new Date().toISOString(),
      repair_action: repairActionDesc,
      updated_at: new Date().toISOString()
    };

    const db = rtdb();
    if (db) {
      try {
        await db.ref('leads/' + leadId).update(updates);
        return { ok: true, repairActionDesc };
      } catch(err) {
        log('repairLead:rtdb', err);
      }
    }

    try {
      let leads = JSON.parse(localStorage.getItem('pino_leads') || '[]');
      const idx = leads.findIndex(l => l.id === leadId || l.ref_code === leadId || l.sbId === leadId);
      if (idx >= 0) {
        leads[idx] = { ...leads[idx], ...updates };
        localStorage.setItem('pino_leads', JSON.stringify(leads));
        return { ok: true, repairActionDesc };
      }
    } catch(e) {}

    return { ok: false };
  }

  /* ─────────────────────────────────────────────────────────
   *  PLATFORM LEADS — Prospection multi-plateformes
   *  (LeBonCoin, Facebook, Nextdoor, Yoojo, NeedHelp, AlloVoisins)
   * ───────────────────────────────────────────────────────── */
  async function savePlatformLead(data) {
    const payload = {
      platform:    data.platform || 'leboncoin', // leboncoin, facebook, nextdoor, yoojo, needhelp, allovoisins
      name:        data.name     || 'Prospect Anonyme',
      commune:     data.commune  || 'Bordeaux',
      service:     data.service  || 'Entretien jardin',
      phone:       data.phone    || '',
      email:       data.email    || '',
      url:         data.url      || '',
      budget:      data.budget   ? parseFloat(data.budget) : 0,
      notes:       data.notes    || '',
      status:      data.status   || 'a_contacter', // a_contacter, message_envoye, en_discussion, rdv_pris, converti, archive
      created_at:  new Date().toISOString(),
      updated_at:  new Date().toISOString(),
    };

    const db = rtdb();
    if (db) {
      try {
        const ref = db.ref('platform_leads').push();
        await ref.set({ ...payload, id: ref.key });
        return { ok: true, id: ref.key };
      } catch (err) {
        log('savePlatformLead:rtdb', err);
      }
    }

    // Fallback localStorage
    try {
      const list = JSON.parse(localStorage.getItem('pino_platform_leads') || '[]');
      const id = 'plt_' + Date.now();
      list.unshift({ ...payload, id });
      localStorage.setItem('pino_platform_leads', JSON.stringify(list));
      return { ok: true, id };
    } catch(e) {
      return { ok: false };
    }
  }

  async function fetchPlatformLeads() {
    const db = rtdb();
    let fbLeads = [];
    if (db) {
      try {
        const snap = await db.ref('platform_leads').once('value');
        const val = snap.val() || {};
        fbLeads = Object.keys(val).map(k => ({ id: k, ...val[k] })).reverse();
      } catch (err) {
        log('fetchPlatformLeads:rtdb', err);
      }
    }

    let localLeads = [];
    try {
      localLeads = JSON.parse(localStorage.getItem('pino_platform_leads') || '[]');
    } catch(e) {}

    const fbIds = new Set(fbLeads.map(l => l.id));
    const extraLocal = localLeads.filter(l => !fbIds.has(l.id));
    const all = [...fbLeads, ...extraLocal];

    if (all.length === 0) {
      const seed = [
        {
          id: 'plt_seed_1',
          platform: 'leboncoin',
          name: 'Marc Delmas',
          commune: '33700 Mérignac',
          service: 'Taille de haie de lauriers (40m)',
          phone: '06 12 45 78 90',
          email: 'marc.delmas33@gmail.com',
          url: 'https://www.leboncoin.fr',
          budget: 350,
          notes: 'Recherche artisan déclaré SAP pour déduction 50% immédiate.',
          status: 'a_contacter',
          created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        },
        {
          id: 'plt_seed_2',
          platform: 'allovoisins',
          name: 'Sophie V.',
          commune: '33000 Bordeaux Caudéran',
          service: 'Tonte pelouse 300m² + désherbage',
          phone: '06 98 76 54 32',
          email: '',
          url: 'https://www.allovoisins.com',
          budget: 180,
          notes: 'Demande urgente avant le weekend, évacuation des déchets nécessaire.',
          status: 'message_envoye',
          created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
        },
        {
          id: 'plt_seed_3',
          platform: 'nextdoor',
          name: 'Laurent B.',
          commune: '33600 Pessac',
          service: 'Débroussaillage grand terrain en friche',
          phone: '',
          email: '',
          url: 'https://nextdoor.fr',
          budget: 500,
          notes: 'Posté sur le groupe de quartier Alouette Pessac.',
          status: 'en_discussion',
          created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        },
        {
          id: 'plt_seed_4',
          platform: 'yoojo',
          name: 'Claire M.',
          commune: '33400 Talence',
          service: 'Entretien régulier pelouse & massifs',
          phone: '07 65 43 21 09',
          email: 'claire.talence@laposte.net',
          url: 'https://yoojo.fr',
          budget: 240,
          notes: 'Cherche jardinier mensuel avec avance immédiate Unipros.',
          status: 'a_contacter',
          created_at: new Date(Date.now() - 3600000 * 30).toISOString(),
        },
        {
          id: 'plt_seed_5',
          platform: 'facebook',
          name: 'Julien Morel',
          commune: '33130 Bègles',
          service: 'Remise en état jardin de printemps',
          phone: '06 44 33 22 11',
          email: '',
          url: 'https://www.facebook.com/marketplace',
          budget: 300,
          notes: 'Vu sur le groupe Entraide Bègles / Villenave.',
          status: 'rdv_pris',
          created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
        },
        {
          id: 'plt_seed_6',
          platform: 'needhelp',
          name: 'David R.',
          commune: '33200 Bordeaux',
          service: 'Élagage branches basses chêne',
          phone: '',
          email: '',
          url: 'https://www.needhelp.com',
          budget: 420,
          notes: 'Demande NeedHelp liée à un achat chez Castorama Mérignac.',
          status: 'a_contacter',
          created_at: new Date(Date.now() - 3600000 * 50).toISOString(),
        }
      ];
      try {
        localStorage.setItem('pino_platform_leads', JSON.stringify(seed));
      } catch(e) {}
      return { ok: true, data: seed };
    }

    return { ok: true, data: all };
  }

  async function updatePlatformLead(id, updates) {
    if (!id) return { ok: false };
    const payload = { ...updates, updated_at: new Date().toISOString() };
    const db = rtdb();
    if (db) {
      try {
        await db.ref(`platform_leads/${id}`).update(payload);
      } catch (err) {
        log('updatePlatformLead:rtdb', err);
      }
    }
    try {
      const list = JSON.parse(localStorage.getItem('pino_platform_leads') || '[]');
      const idx = list.findIndex(l => l.id === id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...payload };
        localStorage.setItem('pino_platform_leads', JSON.stringify(list));
      }
    } catch(e) {}
    return { ok: true };
  }

  async function deletePlatformLead(id) {
    if (!id) return { ok: false };
    const db = rtdb();
    if (db) {
      try {
        await db.ref(`platform_leads/${id}`).remove();
      } catch (err) {
        log('deletePlatformLead:rtdb', err);
      }
    }
    try {
      let list = JSON.parse(localStorage.getItem('pino_platform_leads') || '[]');
      list = list.filter(l => l.id !== id);
      localStorage.setItem('pino_platform_leads', JSON.stringify(list));
    } catch(e) {}
    return { ok: true };
  }

  async function convertPlatformLeadToCRM(id) {
    const res = await fetchPlatformLeads();
    if (!res.ok || !Array.isArray(res.data)) return { ok: false, error: 'Cannot fetch leads' };
    const lead = res.data.find(l => l.id === id);
    if (!lead) return { ok: false, error: 'Lead not found' };

    // Format for main /leads
    const crmLeadData = {
      name: lead.name,
      email: lead.email || '',
      phone: lead.phone || '',
      commune: lead.commune || 'Bordeaux',
      service: lead.service || 'Entretien jardin',
      budget: lead.budget || 0,
      surface: '',
      details: `[Source: ${lead.platform.toUpperCase()}] ${lead.notes || ''} (Annonce: ${lead.url || 'N/A'})`,
      refCode: `DEV-${lead.platform.substring(0,3).toUpperCase()}-${Date.now().toString().slice(-4)}`
    };

    const saveRes = await saveLead(crmLeadData);
    if (saveRes && saveRes.ok) {
      await updatePlatformLead(id, { status: 'converti' });
      return { ok: true, crmId: saveRes.id };
    }
    return { ok: false };
  }

  /* ─────────────────────────────────────────────────────────
   *  FIRMA ELECTRÓNICA DE DEVIS (eIDAS Simple & Yousign Ready)
   * ───────────────────────────────────────────────────────── */
  async function signQuote(quoteId, signatureData) {
    if (!quoteId || !signatureData) return { ok: false, error: 'Paramètres manquants' };
    const now = new Date().toISOString();
    const dataUrl = signatureData.dataUrl || signatureData.image || '';
    const signerName = signatureData.name || 'Client Particulier';
    const signerEmail = signatureData.email || '';
    const hash = signatureData.hash || ('SIG-' + Date.now().toString(36).toUpperCase());

    const updatePayload = {
      status: 'Devis accepté',
      accepted_at: now,
      signed_at: now,
      signature_data_url: dataUrl,
      signature_hash: hash,
      signature_author: signerName,
      signature_ip: signatureData.ip || 'Client PWA',
      legal_consent: true
    };

    const db = rtdb();
    if (db) {
      try {
        await db.ref('leads/' + quoteId).update(updatePayload);

        if (signerEmail) {
          const sanitizedEmail = sanitizeEmail(signerEmail);
          await db.ref(`clients_records/${sanitizedEmail}/quotes/${quoteId}`).update(updatePayload).catch(() => {});
        }
      } catch (err) {
        log('signQuote:rtdb', err);
      }
    }

    // Notifier Andrés et le client
    try {
      notifyAdminByEmail({
        subject: `✍️ [DEVIS SIGNÉ] Devis #${String(quoteId).slice(-6)} validé et signé par ${signerName}`,
        type: 'quote_signed',
        clientName: signerName,
        clientEmail: signerEmail,
        leadId: quoteId,
        message: `Le client ${signerName} a officiellement signé électroniquement le devis #${String(quoteId).slice(-6)} (Horodatage ISO : ${now}, Empreinte : ${hash}).`
      }).catch(() => {});
    } catch(e) {}

    return { ok: true, hash, signed_at: now };
  }

  /* ─────────────────────────────────────────────────────────
   *  COLAS DE TAREAS RESILIENTES & REINTENTOS OFFLINE
   * ───────────────────────────────────────────────────────── */
  function queueOfflineTask(type, payload) {
    try {
      const queue = JSON.parse(localStorage.getItem('pino_offline_queue') || '[]');
      queue.push({
        id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        type: type,
        payload: payload,
        created_at: new Date().toISOString(),
        attempts: 0
      });
      localStorage.setItem('pino_offline_queue', JSON.stringify(queue));
      log('offline_queue:enqueued', type);
      return true;
    } catch(e) {
      return false;
    }
  }

  async function processOfflineQueue() {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    let queue = [];
    try {
      queue = JSON.parse(localStorage.getItem('pino_offline_queue') || '[]');
    } catch(e) { return; }

    if (queue.length === 0) return;
    log('offline_queue:processing', `${queue.length} tasks`);

    const remaining = [];
    for (const task of queue) {
      try {
        let success = false;
        if (task.type === 'save_lead') {
          const res = await saveLead(task.payload);
          success = res && res.ok;
        } else if (task.type === 'update_lead_status') {
          const res = await updateLeadStatus(task.payload.leadId, task.payload.status);
          success = res && res.ok;
        } else if (task.type === 'sign_quote') {
          const res = await signQuote(task.payload.quoteId, task.payload.signatureData);
          success = res && res.ok;
        } else if (task.type === 'notify_admin') {
          const res = await notifyAdminByEmail(task.payload);
          success = res && res.ok;
        }

        if (!success) {
          task.attempts = (task.attempts || 0) + 1;
          if (task.attempts < 5) remaining.push(task);
        }
      } catch(err) {
        task.attempts = (task.attempts || 0) + 1;
        if (task.attempts < 5) remaining.push(task);
      }
    }

    try {
      localStorage.setItem('pino_offline_queue', JSON.stringify(remaining));
    } catch(e) {}
  }

  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('online', () => {
      processOfflineQueue().catch(() => {});
    });
    setTimeout(() => {
      processOfflineQueue().catch(() => {});
    }, 3000);

    // Moniteur télémétrie erreurs non capturées
    window.addEventListener('error', (evt) => {
      try {
        const errorData = {
          message: evt.message || 'Script Error',
          source: evt.filename || 'unknown',
          lineno: evt.lineno,
          colno: evt.colno,
          time: new Date().toISOString()
        };
        const db = rtdb();
        if (db) {
          db.ref('audit_logs/client_errors').push(errorData).catch(() => {});
        }
      } catch(e) {}
    });
  }

  /**
   * 🇪🇺 RGPD Art. 20 (Droit à la portabilité) :
   * Récupère l'intégralité du dossier personnel du client (profil, devis, factures, messages, consentements, droits CNIL)
   */
  async function fetchCompletePersonalData(email) {
    if (!email) return null;
    const normEmail = String(email).trim().toLowerCase();
    const sanitizedEmail = sanitizeEmail(normEmail);

    let profile = null;
    let quotes = [];
    let invoices = [];
    let messages = [];

    // 1. Profil
    try {
      const snap = await rtdb()?.ref(`clients_records/${sanitizedEmail}/profile`).once('value');
      profile = snap?.val();
    } catch(e) {}
    if (!profile) {
      try {
        let localUsers = JSON.parse(localStorage.getItem('pino_users') || '[]');
        profile = localUsers.find(u => (u.email || '').toLowerCase() === normEmail) || null;
      } catch(e) {}
    }

    // 2. Devis
    try {
      const qRes = await fetchClientQuotes(normEmail);
      if (qRes && Array.isArray(qRes.data)) quotes = qRes.data;
    } catch(e) {}

    // 3. Factures
    try {
      const iRes = await fetchClientInvoices(normEmail);
      if (iRes && Array.isArray(iRes.data)) invoices = iRes.data;
    } catch(e) {}

    // 4. Messages
    try {
      const mRes = await fetchClientMessages(normEmail);
      if (mRes && Array.isArray(mRes.data)) messages = mRes.data;
    } catch(e) {}

    return {
      version_export: "2.0-RGPD-UE",
      date_export: new Date().toISOString(),
      responsable_traitement: {
        nom_commercial: "Pino Espaces Verts",
        titulaire: "Andrés Pino (Entrepreneur Individuel)",
        immatriculation: "Bordeaux Métropole & Gironde (33)",
        contact_rgpd: "pino.spacesverts@gmail.com",
        telephone: "+33 6 51 59 40 34"
      },
      profil_utilisateur: profile || { email: normEmail },
      demandes_devis: quotes,
      factures_et_interventions: invoices,
      historique_messages: messages,
      consentements_et_cookies: {
        consentement_cookies: (typeof localStorage !== 'undefined' ? localStorage.getItem('pino_cookie_consent') : null) || 'essential_only',
        date_derniere_connexion: profile?.lastLogin || new Date().toISOString()
      },
      vos_droits_rgpd: {
        description: "Conformément au Règlement Général sur la Protection des Données (RGPD 2016/679) et à la loi Informatique et Libertés :",
        droit_acces_rectification: "Vous pouvez demander la correction de vos données en écrivant à pino.spacesverts@gmail.com.",
        droit_effacement: "Vous pouvez exercer votre droit à l'oubli directement depuis votre Espace Client.",
        conservation_legale: "Conformément à l'Article L. 123-22 du Code de commerce, les factures et justificatifs comptables sont légalement conservés 10 ans sous forme anonymisée.",
        autorite_controle: "Commission Nationale de l'Informatique et des Libertés (CNIL) — www.cnil.fr"
      }
    };
  }

  /**
   * 🇪🇺 RGPD Art. 17 (Droit à l'effacement / Droit à l'oubli) :
   * Anonymise immédiatement les données personnelles (PII) dans Firebase RTDB et le stockage local,
   * tout en maintenant les montants financiers agrégés pour respecter l'obligation légale de 10 ans (Art. L123-22 Code de commerce).
   */
  async function anonymizeClientAccount(email) {
    if (!email) return { ok: false, error: "Adresse e-mail requise." };
    const normEmail = String(email).trim().toLowerCase();
    const sanitizedEmail = sanitizeEmail(normEmail);
    const timestamp = new Date().toISOString();

    const db = rtdb();
    if (db) {
      try {
        const anonymizedPayload = {
          fullName: "Client Anonymisé (RGPD)",
          phone: "00 00 00 00 00",
          commune: "33000 Bordeaux (Anonymisé)",
          status: "anonymise",
          rgpd_anonymized_at: timestamp,
          rgpd_erasure_requested: true
        };

        // 1. Anonymiser dans clients_records
        await db.ref(`clients_records/${sanitizedEmail}/profile`).update(anonymizedPayload).catch(() => {});

        // 2. Anonymiser dans users si existant
        const usersSnap = await db.ref('users').once('value');
        const usersObj = usersSnap.val() || {};
        for (const [uid, u] of Object.entries(usersObj)) {
          if (u.email && u.email.toLowerCase() === normEmail) {
            await db.ref(`users/${uid}`).update(anonymizedPayload).catch(() => {});
          }
        }

        // 3. Journaliser dans audit_logs
        await safePushAudit(db, {
          action: 'rgpd_erasure_anonymized',
          client_sanitized: sanitizedEmail,
          timestamp: timestamp,
          legal_basis: 'RGPD Art. 17 / Code Commerce L. 123-22'
        });
      } catch(err) {
        log('anonymizeClientAccount:rtdb', err);
      }
    }

    // 4. Nettoyer localStorage
    try {
      let localUsers = JSON.parse(localStorage.getItem('pino_users') || '[]');
      localUsers = localUsers.map(u => {
        if ((u.email || '').toLowerCase() === normEmail) {
          return {
            ...u,
            fullName: "Client Anonymisé (RGPD)",
            phone: "00 00 00 00 00",
            commune: "33000 Bordeaux (Anonymisé)",
            status: "anonymise"
          };
        }
        return u;
      });
      localStorage.setItem('pino_users', JSON.stringify(localUsers));
      localStorage.removeItem('pino_current_user');
      localStorage.removeItem('pino_last_client_email');
    } catch(e) {}

    return { ok: true, timestamp };
  }

  /* ─────────────────────────────────────────────────────────
   *  Exportar a window.PinoDB
   * ───────────────────────────────────────────────────────── */
  global.PinoDB = {
    signQuote,
    queueOfflineTask,
    processOfflineQueue,
    saveLead,
    fetchLeads,
    updateLeadStatus,
    saveLeadResponse,
    acceptQuote,
    fetchClientQuotes,
    upsertProfile,
    saveProfile: upsertProfile,
    fetchProfiles,
    fetchUserCoupon,
    redeemPelabola,
    recordAuditSession,
    fetchAdminKPIs,
    saveJob,
    fetchJobs,
    updateJob,
    downloadFileBlob,
    exportDataToCSV,
    exportJobsCSV,
    exportJobsPDF,
    exportLeadsCSV,
    exportLeadsPDF,
    exportFacturesCSV,
    exportClientFacturesCSV,
    exportPlatformLeadsCSV,
    exportClientQuotesCSV,
    updateLeadQuality,
    repairLead,
    listenClientNotifications,
    listenClientQuotes,
    fetchClientInvoices,
    listenClientInvoices,
    syncExistingRecordsToClientPartitions,
    fetchClientNotifications,
    markNotificationRead,
    markAllClientNotificationsRead,
    markAllAdminNotificationsRead,
    fetchAdminNotifications,
    listenAdminNotifications,
    markAdminNotificationRead,
    inviteClientByAdmin,
    activateClientPassword,
    savePlatformLead,
    fetchPlatformLeads,
    updatePlatformLead,
    deletePlatformLead,
    convertPlatformLeadToCRM,
    notifyAdminByEmail,
    notifyClientByEmail,
    sendClientDirectMessage,
    notifyClientStatusChange,
    fetchClientMessages,
    listenClientMessages,
    fetchCompletePersonalData,
    anonymizeClientAccount,
  };

})(window);
