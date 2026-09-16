/**
 * pino-db.js — Capa de datos Supabase para Pino Espaces Verts v1
 * ---------------------------------------------------------------
 * Todas las operaciones de base de datos se centralizan aquí.
 * El cliente (window.pinoSupabase) es inicializado en supabase-config.js
 * y luego consumido desde index.html.
 *
 * Tablas usadas:
 *   public.leads            — formularios de devis B2C/B2B
 *   public.profiles         — perfiles de clientes autenticados
 *   public.promotions       — campaña PELABOLA y cupones 1:1
 *   public.promo_redemptions — registro de canjes
 *   public.cupones          — cupón 1:1 por cliente (tabla legacy)
 *   public.audit_logs       — sesiones y eventos (solo admin)
 *
 * Nunca exponer service_role en el cliente.
 */

(function (global) {
  'use strict';

  /* ─────────────────────────────────────────────────────────
   *  Helpers
   * ───────────────────────────────────────────────────────── */
  function sb() {
    return global.pinoSupabase || null;
  }

  function log(tag, err) {
    if (err) console.warn('[pino-db]', tag, err.message || err);
  }

  /* ─────────────────────────────────────────────────────────
   *  LEADS — Guardar demande de devis en Supabase
   * ───────────────────────────────────────────────────────── */
  async function saveLead(data) {
    /**
     * data: {
     *   name, email, phone, commune, service_type,
     *   surface_m2, budget_eur, frequency, details,
     *   ref_code, source, user_id (optional)
     * }
     * Retorna { ok: true, id } o { ok: false, error }
     */
    const client = sb();
    if (!client) return { ok: false, error: 'Supabase no disponible' };

    const payload = {
      full_name:    data.name     || null,
      email:        data.email    || null,
      phone:        data.phone    || null,
      commune:      data.commune  || null,
      // Campos enriquecidos (agregarínse en 003_leads_enrichment.sql)
      service_type: data.service  || 'Entretien',
      surface_m2:   data.surface  ? (parseInt(data.surface, 10) || null) : null,
      budget_eur:   data.budget   ? (parseFloat(data.budget)   || null) : null,
      frequency:    data.frequency || null,
      details:      data.details  || null,
      ref_code:     data.refCode  || null,
      source:       'web_devis',   // enum lead_source
      status:       'new',          // enum lead_status (Supabase)
      is_b2b:       data.isB2B    || false,
      lead_type:    data.isB2B ? 'b2b' : 'b2c',
      user_id:      data.userId   || null,
      garden_description: data.details || null,
    };

    try {
      const { data: row, error } = await client
        .from('leads')
        .insert(payload)
        .select('id')
        .single();

      if (error) throw error;
      return { ok: true, id: row?.id };
    } catch (err) {
      log('saveLead', err);
      return { ok: false, error: err.message };
    }
  }

  /* ─────────────────────────────────────────────────────────
   *  LEADS — Cargar todos los leads (solo admin)
   * ───────────────────────────────────────────────────────── */
  async function fetchLeads({ limit = 100, status = null } = {}) {
    const client = sb();
    if (!client) return { ok: false, data: [] };

    try {
      let query = client
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (status) query = query.eq('status', status);

      const { data, error } = await query;
      if (error) throw error;
      return { ok: true, data: data || [] };
    } catch (err) {
      log('fetchLeads', err);
      return { ok: false, data: [] };
    }
  }

  /* ─────────────────────────────────────────────────────────
   *  LEADS — Actualizar estado (solo admin)
   * ───────────────────────────────────────────────────────── */
  async function updateLeadStatus(leadId, newStatus) {
    /**
     * Mapea el estado en franés del CRM al enum de Supabase.
     * Si el enum está extendido con los valores FR (003_leads_enrichment.sql),
     * pasa el valor directamente; si no, mapea al inglés.
     */
    const client = sb();
    if (!client) return { ok: false };

    // Intentar primero con el estado FR (funciona si se ejecutó la migración)
    // Si falla, mapear al enum en inglés original
    const frToEn = {
      'Nouveau':      'new',
      'Contacté':    'contacted',
      'Devis envoyé': 'quoted',
      'Gagné':       'won',
      'Perdu':        'lost',
    };

    const statusToSend = newStatus;

    try {
      const { error } = await client
        .from('leads')
        .update({ status: statusToSend })
        .eq('id', leadId);

      if (error) {
        // Si hay error de enum, intentar con el valor en inglés
        const enStatus = frToEn[newStatus] || 'new';
        const { error: error2 } = await client
          .from('leads')
          .update({ status: enStatus })
          .eq('id', leadId);
        if (error2) throw error2;
      }

      return { ok: true };
    } catch (err) {
      log('updateLeadStatus', err);
      return { ok: false };
    }
  }

  /* ─────────────────────────────────────────────────────────
   *  PROFILES — Upsert perfil al login
   * ───────────────────────────────────────────────────────── */
  async function upsertProfile(sbUser, extra = {}) {
    const client = sb();
    if (!client || !sbUser?.id) return { ok: false };

    const meta = sbUser.user_metadata || {};
    const isAdmin = sbUser.email?.toLowerCase() === 'pino.spacesverts@gmail.com';

    const payload = {
      id:           sbUser.id,
      email:        sbUser.email,
      full_name:    extra.fullName || meta.full_name || meta.name || null,
      phone:        extra.phone    || meta.phone || null,
      commune:      extra.commune  || null,
      role:         isAdmin ? 'admin' : 'client',
      auth_provider: extra.provider || 'google',
      avatar_url:   meta.avatar_url || meta.picture || null,
      updated_at:   new Date().toISOString(),
    };

    try {
      const { error } = await client
        .from('profiles')
        .upsert(payload, { onConflict: 'id' });

      if (error) throw error;
      return { ok: true };
    } catch (err) {
      log('upsertProfile', err);
      return { ok: false };
    }
  }

  /* ─────────────────────────────────────────────────────────
   *  PROFILES — Fetch todos (solo admin)
   * ───────────────────────────────────────────────────────── */
  async function fetchProfiles({ limit = 200 } = {}) {
    const client = sb();
    if (!client) return { ok: false, data: [] };

    try {
      const { data, error } = await client
        .from('profiles')
        .select('id, email, full_name, role, phone, commune, welcome_promo_code, auth_provider, avatar_url, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { ok: true, data: data || [] };
    } catch (err) {
      log('fetchProfiles', err);
      return { ok: false, data: [] };
    }
  }

  /* ─────────────────────────────────────────────────────────
   *  CUPONES — Leer cupón del usuario autenticado
   * ───────────────────────────────────────────────────────── */
  async function fetchUserCoupon(userId) {
    const client = sb();
    if (!client || !userId) return null;

    try {
      // Intentar primero en tabla cupones (legacy 1:1)
      const { data: couponRow } = await client
        .from('cupones')
        .select('codigo_cupon, estado')
        .eq('cliente_id', userId)
        .maybeSingle();

      if (couponRow?.codigo_cupon) return couponRow;

      // Fallback: tabla profiles.welcome_promo_code
      const { data: profile } = await client
        .from('profiles')
        .select('welcome_promo_code')
        .eq('id', userId)
        .maybeSingle();

      if (profile?.welcome_promo_code) {
        return { codigo_cupon: profile.welcome_promo_code, estado: 'valido' };
      }

      return null;
    } catch (err) {
      log('fetchUserCoupon', err);
      return null;
    }
  }

  /* ─────────────────────────────────────────────────────────
   *  PROMO — Registrar canje de PELABOLA
   * ───────────────────────────────────────────────────────── */
  async function redeemPelabola(userData) {
    /**
     * userData: { userId, email, name, commune }
     * Registra el canje en promo_redemptions y devuelve el código.
     */
    const client = sb();
    if (!client) return { ok: false, code: 'PELABOLA' };

    try {
      // Verificar que la promo PELABOLA existe y está activa
      const { data: promo } = await client
        .from('promotions')
        .select('id, code, percent_off, active')
        .eq('code', 'PELABOLA')
        .eq('active', true)
        .maybeSingle();

      if (!promo) {
        // Si no hay tabla aún, devolvemos el código igual (funciona offline)
        return { ok: true, code: 'PELABOLA', offline: true };
      }

      // Verificar que este usuario/email no lo haya canjeado ya
      const { data: existing } = await client
        .from('promo_redemptions')
        .select('id')
        .eq('promotion_id', promo.id)
        .eq('email', userData.email)
        .maybeSingle();

      if (existing) {
        return { ok: true, code: 'PELABOLA', alreadyRedeemed: true };
      }

      // Insertar canje
      await client.from('promo_redemptions').insert({
        promotion_id: promo.id,
        user_id:      userData.userId || null,
        email:        userData.email  || null,
        commune:      userData.commune || null,
      });

      return { ok: true, code: 'PELABOLA' };
    } catch (err) {
      log('redeemPelabola', err);
      return { ok: true, code: 'PELABOLA', offline: true }; // graceful degradation
    }
  }

  /* ─────────────────────────────────────────────────────────
   *  AUDIT — Registrar sesión (solo admin puede leer)
   * ───────────────────────────────────────────────────────── */
  async function recordAuditSession(userProfile) {
    const client = sb();
    // Sin Supabase o sin user, usar solo localStorage (ya hecho en index.html)
    if (!client || !userProfile?.uid) return;

    try {
      await client.from('audit_logs').insert({
        user_id:     userProfile.uid,
        event_type:  'login',
        description: `Login via ${userProfile.authProvider || 'unknown'}`,
        metadata: {
          email:      userProfile.email,
          role:       userProfile.role,
          device:     navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop',
          commune:    userProfile.commune || null,
        }
      });
    } catch (err) {
      // audit_logs puede no estar disponible para clientes (RLS) — silencioso
      log('recordAuditSession', err);
    }
  }

  /* ─────────────────────────────────────────────────────────
   *  ADMIN — KPIs agregados desde Supabase
   * ───────────────────────────────────────────────────────── */
  async function fetchAdminKPIs() {
    const client = sb();
    if (!client) return null;

    try {
      const [
        { count: totalLeads },
        { count: newLeads },
        { count: totalClients },
        { data: promoRow }
      ] = await Promise.all([
        client.from('leads').select('*', { count: 'exact', head: true }),
        client.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'Nouveau'),
        client.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client'),
        client.from('promo_redemptions').select('id', { count: 'exact', head: false }).limit(1),
      ]);

      return {
        totalLeads:   totalLeads  || 0,
        newLeads:     newLeads    || 0,
        totalClients: totalClients|| 0,
      };
    } catch (err) {
      log('fetchAdminKPIs', err);
      return null;
    }
  }

  /* ─────────────────────────────────────────────────────────
   *  Exportar al objeto global window.PinoDB
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
  };

})(window);
