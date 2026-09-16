-- ============================================================================
-- 003_leads_enrichment.sql
-- Agrega campos de negocio a public.leads para el formulario de devis v1
-- ============================================================================
-- Ejecutar en: SQL Editor de Supabase → Run
-- Proyecto: ziccgwonregaatujyyzb (Pino Espaces Verts)
-- Idempotente: usa IF NOT EXISTS / DO NOTHING
-- ============================================================================

-- Campos adicionales de la demande de devis
alter table public.leads
  add column if not exists service_type   text,
  add column if not exists surface_m2     integer,
  add column if not exists budget_eur     numeric(10,2),
  add column if not exists frequency      text,
  add column if not exists details        text,
  add column if not exists ref_code       text unique,
  add column if not exists is_b2b         boolean not null default false,
  add column if not exists garden_surface text;   -- alias texto libre si no es numérico

-- Índice para buscar por ref_code desde el admin
create index if not exists leads_ref_code_idx on public.leads (ref_code);

-- Ajustar columna status para aceptar los estados del CRM francés
-- (Los enum de lead_status pueden variar; usamos DO $$ para no romper si ya existen)
do $$
begin
  -- Agregar valores al enum lead_status si existen
  if exists (select 1 from pg_type where typname = 'lead_status') then
    begin alter type public.lead_status add value if not exists 'Nouveau';    exception when others then null; end;
    begin alter type public.lead_status add value if not exists 'Contacté';   exception when others then null; end;
    begin alter type public.lead_status add value if not exists 'Devis envoyé'; exception when others then null; end;
    begin alter type public.lead_status add value if not exists 'Gagné';      exception when others then null; end;
    begin alter type public.lead_status add value if not exists 'Perdu';      exception when others then null; end;
  end if;
end $$;

-- Agregar campos faltantes a profiles
alter table public.profiles
  add column if not exists auth_provider  text,
  add column if not exists avatar_url     text;

-- ============================================================================
-- AUTORIZAR REDIRECT URLS (instrucción manual — no se puede hacer por SQL)
-- ============================================================================
-- En el dashboard de Supabase:
--   Authentication → URL Configuration → Redirect URLs
--   Agregar: https://jomstudiovzla.github.io/pinopage/
--   Agregar: http://127.0.0.1:8080/
--   Site URL: https://jomstudiovzla.github.io/pinopage/
--
-- Authentication → Providers → Google → ON
--   Client ID:     [el de Google Cloud Console]
--   Client Secret: [el de Google Cloud Console]
-- ============================================================================
