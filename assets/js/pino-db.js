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
  async function fetchLeads(limit = 100) {
    const db = rtdb();
    if (db) {
      try {
        const snap = await db.ref('leads').limitToLast(limit).once('value');
        const val = snap.val() || {};
        const list = Object.keys(val).map(k => ({ id: k, ...val[k] })).reverse();
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
  async function fetchProfiles(limit = 100) {
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
   *  CUPONES — Canjear PELABOLA
   * ───────────────────────────────────────────────────────── */
  async function redeemPelabola(userId, email) {
    const couponData = {
      user_id:       userId,
      email:         email,
      codigo_cupon:  'PELABOLA',
      descuento_eur: 20.00,
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
  async function fetchJobs({ limit = 200, status = null } = {}) {
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
  };

})(window);
