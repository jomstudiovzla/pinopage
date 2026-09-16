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
    if (db) {
      try {
        await db.ref('leads/' + leadId).update({ status: newStatus, updated_at: new Date().toISOString() });
        return { ok: true };
      } catch (err) {
        log('updateLeadStatus:rtdb', err);
      }
    }

    const client = sb();
    if (client) {
      try {
        const { error } = await client.from('leads').update({ status: newStatus }).eq('id', leadId);
        if (!error) return { ok: true };
      } catch (err) {
        log('updateLeadStatus:sb', err);
      }
    }

    return { ok: false };
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
        await db.ref('audit_logs').push({
          sessionUser: clientDetails.email || 'client',
          action: 'devis_accepte',
          leadId: leadId,
          created_at: timestamp
        }).catch(() => {});

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

    return { ok: true, timestamp };
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

  /* ─────────────────────────────────────────────────────────
   *  LEADS — Obtener solicitudes de un cliente específico (desde partition dédiée clients_records)
   * ───────────────────────────────────────────────────────── */
  async function fetchClientQuotes(clientEmail) {
    if (!clientEmail) return { ok: false, data: [] };
    const normEmail = clientEmail.trim().toLowerCase();
    const sanitizedEmail = normEmail.replace(/[.#$\[\]]/g, '_');

    let fbMatches = [];
    const db = rtdb();
    if (db) {
      try {
        // 1. Priorité absolue : partition dédiée clients_records
        const snapPartition = await db.ref(`clients_records/${sanitizedEmail}/quotes`).once('value');
        const partitionVal = snapPartition.val() || {};
        fbMatches = Object.keys(partitionVal)
          .map(k => ({ id: k, ...partitionVal[k] }))
          .reverse();

        // 2. Fallback / Rétrocompatibilité : si partition vide, interroger /leads global et rétro-migrer
        if (fbMatches.length === 0) {
          const snapAll = await db.ref('leads').once('value');
          const valAll = snapAll.val() || {};
          fbMatches = Object.keys(valAll)
            .map(k => ({ id: k, ...valAll[k] }))
            .filter(lead => (lead.email || '').trim().toLowerCase() === normEmail)
            .reverse();

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
    const allMatches = [...fbMatches, ...extraLocal];

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

    const normEmail = (fbUser.email || '').toLowerCase();
    const isAdmin = normEmail === 'pino.spacesverts@gmail.com' ||
                    normEmail === 'pino.espacesverts@gmail.com';

    const payload = {
      id:            fbUser.uid,
      uid:           fbUser.uid,
      email:         fbUser.email,
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
      amount_charged:  data.amountCharged? parseFloat(data.amountCharged): null,
      amount_paid:     data.amountPaid   ? parseFloat(data.amountPaid)   : 0,
      payment_status:  data.paymentStatus|| 'pending',
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
        const sanitizedEmail = rawEmail.trim().toLowerCase().replace(/[.#$\[\]]/g, '_');
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
        let list = Object.keys(val).map(k => ({ id: k, ...val[k] })).reverse();
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
        await db.ref('jobs/' + jobId).update({ ...patch, updated_at: new Date().toISOString() });

        // Propagation automatique dans la partition du client
        try {
          let clientEmail = patch.client_email || patch.clientEmail || '';
          if (!clientEmail) {
            const snap = await db.ref('jobs/' + jobId).once('value');
            const curJob = snap.val() || {};
            clientEmail = curJob.client_email || curJob.clientEmail || '';
          }
          const sanitizedEmail = (clientEmail || '').trim().toLowerCase().replace(/[.#$\[\]]/g, '_');
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
    const sanitizedEmail = normEmail.replace(/[.#$\[\]]/g, '_');

    let fbMatches = [];
    const db = rtdb();
    if (db) {
      try {
        // 1. Priorité absolue : partition dédiée clients_records
        const snapPartition = await db.ref(`clients_records/${sanitizedEmail}/invoices`).once('value');
        const partitionVal = snapPartition.val() || {};
        fbMatches = Object.keys(partitionVal)
          .map(k => ({ id: k, ...partitionVal[k] }))
          .reverse();

        // 2. Fallback / Rétrocompatibilité : si partition vide, interroger /jobs global et rétro-migrer
        if (fbMatches.length === 0) {
          const snapAll = await db.ref('jobs').once('value');
          const valAll = snapAll.val() || {};
          fbMatches = Object.keys(valAll)
            .map(k => ({ id: k, ...valAll[k] }))
            .filter(j => (j.client_email || '').trim().toLowerCase() === normEmail)
            .reverse();

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
    const allMatches = [...fbMatches, ...extraLocal];

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
        const sanitized = rawEmail.trim().toLowerCase().replace(/[.#$\[\]]/g, '_');
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
        const sanitized = rawEmail.trim().toLowerCase().replace(/[.#$\[\]]/g, '_');
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
   *  Exportar a window.PinoDB
   * ───────────────────────────────────────────────────────── */
  global.PinoDB = {
    saveLead,
    fetchLeads,
    updateLeadStatus,
    saveLeadResponse,
    acceptQuote,
    fetchClientQuotes,
    upsertProfile,
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
    savePlatformLead,
    fetchPlatformLeads,
    updatePlatformLead,
    deletePlatformLead,
    convertPlatformLeadToCRM,
  };

})(window);
