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
        await ref.set({ ...payload, id: ref.key });
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
   *  LEADS — Obtener solicitudes de un cliente específico (con merge y listener)
   * ───────────────────────────────────────────────────────── */
  async function fetchClientQuotes(clientEmail) {
    if (!clientEmail) return { ok: false, data: [] };
    const normEmail = clientEmail.trim().toLowerCase();

    let fbMatches = [];
    const db = rtdb();
    if (db) {
      try {
        const snap = await db.ref('leads').once('value');
        const val = snap.val() || {};
        fbMatches = Object.keys(val)
          .map(k => ({ id: k, ...val[k] }))
          .filter(lead => (lead.email || '').trim().toLowerCase() === normEmail)
          .reverse();
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
    const db = rtdb();
    if (!db) return () => {};

    const leadsRef = db.ref('leads');
    const listener = (snap) => {
      const val = snap.val() || {};
      const matches = Object.keys(val)
        .map(k => ({ id: k, ...val[k] }))
        .filter(lead => (lead.email || '').trim().toLowerCase() === normEmail)
        .reverse();
      callback(matches);
    };
    leadsRef.on('value', listener);
    return () => leadsRef.off('value', listener);
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
        await ref.set({ ...payload, id: ref.key });

        // Si le client a un email, créer une notification in-app dans son espace
        const rawEmail = data.clientEmail || '';
        const sanitizedEmail = rawEmail.trim().toLowerCase().replace(/[.#$\[\]]/g, '_');
        if (sanitizedEmail) {
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
   *  JOBS CRM — Actualizar trabajo
   * ───────────────────────────────────────────────────────── */
  async function updateJob(jobId, patch) {
    const db = rtdb();
    if (db) {
      try {
        await db.ref('jobs/' + jobId).update({ ...patch, updated_at: new Date().toISOString() });
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
   *  EXPORT — Generar CSV de trabajos
   * ───────────────────────────────────────────────────────── */
  function exportJobsCSV(jobs) {
    const headers = [
      'Cliente','Email','Commune','Servicio','Descripción',
      'Fecha inicio','Fecha fin','Horas','Monto (€)',
      'Pagado (€)','Pendiente (€)','Estado pago','Método pago','Notas'
    ];

    const rows = jobs.map(j => {
      const charged = parseFloat(j.amount_charged) || 0;
      const paid = parseFloat(j.amount_paid) || 0;
      const pending = charged - paid;

      return [
        j.client_name    || '',
        j.client_email   || '',
        j.client_commune || '',
        j.service_type   || '',
        (j.description   || '').replace(/"/g, '""'),
        j.date_start     || '',
        j.date_end       || '',
        j.hours_spent    || '',
        charged.toFixed(2),
        paid.toFixed(2),
        pending.toFixed(2),
        j.payment_status || '',
        j.payment_method || '',
        (j.notes         || '').replace(/"/g, '""'),
      ].map(v => `"${v}"`).join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `pino_travaux_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ─────────────────────────────────────────────────────────
   *  EXPORT — Generar PDF de trabajos con jsPDF
   * ───────────────────────────────────────────────────────── */
  function exportJobsPDF(jobs) {
    if (typeof window.jspdf !== 'undefined' || typeof window.jsPDF !== 'undefined') {
      const { jsPDF } = window.jspdf || window;
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const now  = new Date().toLocaleDateString('fr-FR');
      const GREEN = [76, 153, 0];

      // Cabecera
      doc.setFillColor(...GREEN);
      doc.rect(0, 0, 297, 18, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Pino Espaces Verts — Rapport des Travaux', 10, 12);
      doc.setFontSize(9);
      doc.text(`Généré le ${now}`, 240, 12);

      // Resumen financiero
      const totalCharged = jobs.reduce((s, j) => s + (parseFloat(j.amount_charged) || 0), 0);
      const totalPaid    = jobs.reduce((s, j) => s + (parseFloat(j.amount_paid)    || 0), 0);
      const totalHours   = jobs.reduce((s, j) => s + (parseFloat(j.hours_spent)    || 0), 0);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total travaux: ${jobs.length}   |   Facturé: ${totalCharged.toFixed(2)} €   |   Encaissé: ${totalPaid.toFixed(2)} €   |   Heures totales: ${totalHours.toFixed(1)} h`, 10, 25);

      // Tabla
      const cols = ['Client','Service','Période','H.','Facturé €','Payé €','Statut','Mode','Notes'];
      const colW = [38, 32, 30, 12, 22, 18, 20, 22, 42];
      let y = 32;

      // Encabezado tabla
      doc.setFillColor(230, 245, 218);
      doc.rect(10, y, 277, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      let x = 10;
      cols.forEach((c, i) => { doc.text(c, x + 1, y + 5); x += colW[i]; });
      y += 8;

      const statusLabel = { pending:'En attente', partial:'Partiel', paid:'Payé', cancelled:'Annulé' };
      const methodLabel = { unipros:'Unipros', virement:'Virement', cheque:'Chèque', cesu:'CESU', especes:'Espèces', autre:'Autre' };

      doc.setFont('helvetica', 'normal');
      jobs.forEach((j, idx) => {
        if (y > 190) { doc.addPage(); y = 15; }
        if (idx % 2 === 0) { doc.setFillColor(248, 252, 243); doc.rect(10, y, 277, 7, 'F'); }
        const period = [j.date_start, j.date_end].filter(Boolean).join(' → ');
        const row = [
          j.client_name   || '',
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

      doc.save(`pino_travaux_${new Date().toISOString().slice(0,10)}.pdf`);
      return;
    }

    exportJobsCSV(jobs);
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
    exportJobsCSV,
    exportJobsPDF,
    listenClientNotifications,
    listenClientQuotes,
    fetchClientNotifications,
    markNotificationRead,
  };

})(window);
