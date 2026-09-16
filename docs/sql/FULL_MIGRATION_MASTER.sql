-- Pino Espaces Verts — schema inicial (Supabase Postgres, región eu-west-3)
-- Fuente de verdad: DOCUMENTO_MAESTRO.md §6
-- Reglas: RLS en todo public; rol de negocio en app_metadata; (select auth.uid());
--         UPDATE con USING + WITH CHECK; SECURITY DEFINER solo en schema private.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.app_role as enum ('client', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_rail as enum ('unipros', 'direct');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_method as enum (
    'unipros_avance_immediate',
    'unipros_cb',
    'unipros_virement',
    'unipros_cheque',
    'unipros_cesu',
    'direct_virement',
    'direct_cheque',
    'other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.invoice_status as enum (
    'draft', 'issued', 'pending', 'paid', 'cancelled', 'anonymized'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.lead_source as enum (
    'web_devis', 'web_coupon', 'web_b2b', 'whatsapp', 'phone', 'instagram', 'facebook', 'other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.lead_status as enum (
    'new', 'contacted', 'quoted', 'won', 'lost'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.portfolio_kind as enum ('real_work', 'marketing');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.dsar_type as enum ('access', 'erasure', 'rectification', 'portability');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.dsar_status as enum (
    'pending_verification', 'processing', 'completed', 'rejected'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Schema privado (funciones definer, no expuestas al Data API)
-- ---------------------------------------------------------------------------
create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- profiles (1:1 auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null default 'client',
  full_name text,
  email text,
  phone text,
  commune text,
  address_line text,
  welcome_promo_code text unique,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_email_len check (email is null or char_length(email) <= 320)
);

comment on table public.profiles is
  'Espejo de auth.users. role es de solo lectura para el cliente; la fuente de autorización es raw_app_meta_data.role.';

create index if not exists profiles_role_idx on public.profiles (role) where deleted_at is null;

-- ---------------------------------------------------------------------------
-- leads
-- ---------------------------------------------------------------------------
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  lead_type text not null default 'b2c' check (lead_type in ('b2c', 'b2b')),
  source public.lead_source not null default 'web_devis',
  status public.lead_status not null default 'new',
  full_name text,
  email text,
  phone text,
  commune text,
  company_name text,
  siret text,
  garden_description text,
  promo_code text,
  created_at timestamptz not null default now()
);

create index if not exists leads_user_id_idx on public.leads (user_id);
create index if not exists leads_status_idx on public.leads (status, created_at desc);
create index if not exists leads_email_idx on public.leads (lower(email));

-- ---------------------------------------------------------------------------
-- promotions + redemptions
-- ---------------------------------------------------------------------------
create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  percent_off numeric(5,2) not null check (percent_off > 0 and percent_off <= 100),
  kind text not null check (kind in ('campaign', 'welcome_unique')),
  owner_user_id uuid references public.profiles (id) on delete cascade,
  max_redemptions integer,
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint promotions_welcome_has_owner check (
    (kind = 'welcome_unique' and owner_user_id is not null)
    or (kind = 'campaign')
  )
);

create index if not exists promotions_code_idx on public.promotions (code);
create index if not exists promotions_owner_idx on public.promotions (owner_user_id);

create table if not exists public.promo_redemptions (
  id uuid primary key default gen_random_uuid(),
  promotion_id uuid not null references public.promotions (id) on delete restrict,
  user_id uuid references public.profiles (id) on delete set null,
  email text,
  ip_hash text,
  lead_id uuid references public.leads (id) on delete set null,
  redeemed_at timestamptz not null default now()
);

create unique index if not exists promo_redemptions_user_promo_uidx
  on public.promo_redemptions (promotion_id, user_id)
  where user_id is not null;

create unique index if not exists promo_redemptions_email_promo_uidx
  on public.promo_redemptions (promotion_id, lower(email))
  where email is not null;

-- ---------------------------------------------------------------------------
-- invoices
-- ---------------------------------------------------------------------------
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.profiles (id) on delete set null,
  client_display text,
  amount_ttc numeric(10,2) not null check (amount_ttc >= 0),
  promo_percent numeric(5,2) not null default 0,
  rail public.payment_rail not null,
  payment_method public.payment_method,
  status public.invoice_status not null default 'draft',
  unipros_invoice_number text,
  document_path text,
  issued_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invoices_client_idx on public.invoices (client_id, created_at desc);
create index if not exists invoices_rail_idx on public.invoices (rail, status);

-- ---------------------------------------------------------------------------
-- dossiers
-- ---------------------------------------------------------------------------
create table if not exists public.dossiers (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  document_path text,
  viewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists dossiers_client_idx on public.dossiers (client_id, created_at desc);

-- ---------------------------------------------------------------------------
-- portfolio (público)
-- ---------------------------------------------------------------------------
create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  kind public.portfolio_kind not null default 'real_work',
  title text not null,
  commune text,
  work_details text,
  legend text,
  image_path text not null,
  amount_ttc numeric(10,2),
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists portfolio_published_idx
  on public.portfolio_items (published, sort_order)
  where published = true;

-- ---------------------------------------------------------------------------
-- consents, communications, audit, DSAR
-- ---------------------------------------------------------------------------
create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade,
  visitor_id text,
  purpose text not null check (purpose in ('necessary', 'analytics', 'marketing', 'privacy_policy')),
  granted boolean not null,
  policy_version text not null,
  source text not null default 'web_banner',
  created_at timestamptz not null default now()
);

create index if not exists consents_user_idx on public.consents (user_id, purpose, created_at desc);

create table if not exists public.communications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  channel text not null check (channel in ('whatsapp', 'phone', 'email', 'form')),
  direction text not null check (direction in ('inbound', 'outbound')),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  entity text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_actor_idx on public.audit_logs (actor_id, created_at desc);

create table if not exists public.dsar_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  request_type public.dsar_type not null,
  status public.dsar_status not null default 'processing',
  deadline date not null default (current_date + 30),
  result_path text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function private.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch
  before update on public.profiles
  for each row execute function private.touch_updated_at();

drop trigger if exists invoices_touch on public.invoices;
create trigger invoices_touch
  before update on public.invoices
  for each row execute function private.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Autorización: is_admin() lee app_metadata, NO user_metadata
-- ---------------------------------------------------------------------------
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

revoke all on function private.is_admin() from public, anon, authenticated;
grant execute on function private.is_admin() to authenticated;

-- Impide que un cliente se auto-asigne admin
create or replace function private.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and not private.is_admin() then
    raise exception 'role cannot be changed by non-admin';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_no_self_admin on public.profiles;
create trigger profiles_no_self_admin
  before update on public.profiles
  for each row execute function private.prevent_role_self_escalation();

-- ---------------------------------------------------------------------------
-- Alta de usuario: profile + código unique PINO-XXXX + campaña no se toca
-- Llamado desde trigger en auth.users (requiere permiso en auth schema:
-- configurar como Database Webhook o trigger con supabase_auth_admin)
-- ---------------------------------------------------------------------------
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text;
  v_role public.app_role := 'client';
begin
  if coalesce(new.raw_app_meta_data ->> 'role', '') = 'admin' then
    v_role := 'admin';
  end if;

  v_code := 'PINO-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.profiles (id, email, full_name, role, welcome_promo_code)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    v_role,
    v_code
  );

  insert into public.promotions (code, label, percent_off, kind, owner_user_id, max_redemptions)
  values (
    v_code,
    'Bienvenue premier client -20%',
    20,
    'welcome_unique',
    new.id,
    1
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Semilla campaña PELABOLA (idempotente)
insert into public.promotions (code, label, percent_off, kind, max_redemptions, active)
values ('PELABOLA', 'Offre digitale premiers clients -20%', 20, 'campaign', null, true)
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.promotions enable row level security;
alter table public.promo_redemptions enable row level security;
alter table public.invoices enable row level security;
alter table public.dossiers enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.consents enable row level security;
alter table public.communications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.dsar_requests enable row level security;

-- profiles
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  to authenticated
  using ( (select auth.uid()) = id or private.is_admin() );

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ( (select auth.uid()) = id or private.is_admin() )
  with check ( (select auth.uid()) = id or private.is_admin() );

drop policy if exists "profiles_admin_insert" on public.profiles;
create policy "profiles_admin_insert"
  on public.profiles for insert
  to authenticated
  with check ( private.is_admin() );

-- leads: el anónimo inserta (formulario público); el cliente ve los suyos
drop policy if exists "leads_insert_public" on public.leads;
create policy "leads_insert_public"
  on public.leads for insert
  to anon, authenticated
  with check ( true );

drop policy if exists "leads_select_own_or_admin" on public.leads;
create policy "leads_select_own_or_admin"
  on public.leads for select
  to authenticated
  using ( (select auth.uid()) = user_id or private.is_admin() );

drop policy if exists "leads_admin_update" on public.leads;
create policy "leads_admin_update"
  on public.leads for update
  to authenticated
  using ( private.is_admin() )
  with check ( private.is_admin() );

-- promotions: lectura de las propias + campañas activas
drop policy if exists "promotions_select" on public.promotions;
create policy "promotions_select"
  on public.promotions for select
  to anon, authenticated
  using (
    (kind = 'campaign' and active = true)
    or owner_user_id = (select auth.uid())
    or private.is_admin()
  );

drop policy if exists "promotions_admin_write" on public.promotions;
create policy "promotions_admin_write"
  on public.promotions for all
  to authenticated
  using ( private.is_admin() )
  with check ( private.is_admin() );

-- redemptions
drop policy if exists "redemptions_insert_self" on public.promo_redemptions;
create policy "redemptions_insert_self"
  on public.promo_redemptions for insert
  to anon, authenticated
  with check (
    user_id is null or user_id = (select auth.uid()) or private.is_admin()
  );

drop policy if exists "redemptions_select" on public.promo_redemptions;
create policy "redemptions_select"
  on public.promo_redemptions for select
  to authenticated
  using ( user_id = (select auth.uid()) or private.is_admin() );

-- invoices
drop policy if exists "invoices_select" on public.invoices;
create policy "invoices_select"
  on public.invoices for select
  to authenticated
  using ( client_id = (select auth.uid()) or private.is_admin() );

drop policy if exists "invoices_admin_write" on public.invoices;
create policy "invoices_admin_write"
  on public.invoices for all
  to authenticated
  using ( private.is_admin() )
  with check ( private.is_admin() );

-- dossiers
drop policy if exists "dossiers_select" on public.dossiers;
create policy "dossiers_select"
  on public.dossiers for select
  to authenticated
  using ( client_id = (select auth.uid()) or private.is_admin() );

drop policy if exists "dossiers_update_viewed" on public.dossiers;
create policy "dossiers_update_viewed"
  on public.dossiers for update
  to authenticated
  using ( client_id = (select auth.uid()) or private.is_admin() )
  with check ( client_id = (select auth.uid()) or private.is_admin() );

drop policy if exists "dossiers_admin_insert_delete" on public.dossiers;
create policy "dossiers_admin_insert_delete"
  on public.dossiers for insert
  to authenticated
  with check ( private.is_admin() );

drop policy if exists "dossiers_admin_delete" on public.dossiers;
create policy "dossiers_admin_delete"
  on public.dossiers for delete
  to authenticated
  using ( private.is_admin() );

-- portfolio público
drop policy if exists "portfolio_public_read" on public.portfolio_items;
create policy "portfolio_public_read"
  on public.portfolio_items for select
  to anon, authenticated
  using ( published = true or private.is_admin() );

drop policy if exists "portfolio_admin_write" on public.portfolio_items;
create policy "portfolio_admin_write"
  on public.portfolio_items for all
  to authenticated
  using ( private.is_admin() )
  with check ( private.is_admin() );

-- consents
drop policy if exists "consents_insert" on public.consents;
create policy "consents_insert"
  on public.consents for insert
  to anon, authenticated
  with check (
    user_id is null or user_id = (select auth.uid())
  );

drop policy if exists "consents_select" on public.consents;
create policy "consents_select"
  on public.consents for select
  to authenticated
  using ( user_id = (select auth.uid()) or private.is_admin() );

-- communications
drop policy if exists "comms_select" on public.communications;
create policy "comms_select"
  on public.communications for select
  to authenticated
  using ( user_id = (select auth.uid()) or private.is_admin() );

drop policy if exists "comms_admin_write" on public.communications;
create policy "comms_admin_write"
  on public.communications for all
  to authenticated
  using ( private.is_admin() )
  with check ( private.is_admin() );

-- audit: insertable por admin (vía server); readable por admin
drop policy if exists "audit_admin_read" on public.audit_logs;
create policy "audit_admin_read"
  on public.audit_logs for select
  to authenticated
  using ( private.is_admin() );

drop policy if exists "audit_admin_insert" on public.audit_logs;
create policy "audit_admin_insert"
  on public.audit_logs for insert
  to authenticated
  with check ( private.is_admin() );

-- DSAR
drop policy if exists "dsar_own" on public.dsar_requests;
create policy "dsar_own"
  on public.dsar_requests for select
  to authenticated
  using ( user_id = (select auth.uid()) or private.is_admin() );

drop policy if exists "dsar_insert_own" on public.dsar_requests;
create policy "dsar_insert_own"
  on public.dsar_requests for insert
  to authenticated
  with check ( user_id = (select auth.uid()) or private.is_admin() );

drop policy if exists "dsar_admin_update" on public.dsar_requests;
create policy "dsar_admin_update"
  on public.dsar_requests for update
  to authenticated
  using ( private.is_admin() )
  with check ( private.is_admin() );

-- Grants Data API
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select, insert on public.leads to anon;
grant select on public.promotions to anon;
grant select on public.portfolio_items to anon;
grant insert on public.consents to anon;
grant insert on public.promo_redemptions to anon;

-- Storage (ejecutar también en Storage policies del dashboard):
-- buckets: portfolio (public read published paths), invoices, dossiers (private)
-- invoices/dossiers: authenticated read if path starts with auth.uid() or is_admin()
-- Cupones 1:1 por cliente (remediación Img 5).
-- Depende de public.profiles y private.is_admin() (001_initial_schema.sql).

create table if not exists public.cupones (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null unique references public.profiles (id) on delete cascade,
  codigo_cupon varchar(20) not null unique,
  porcentaje integer not null default 20 check (porcentaje > 0 and porcentaje <= 100),
  estado varchar(20) not null default 'valido' check (estado in ('valido', 'usado', 'expire')),
  creado_en timestamptz not null default timezone('utc'::text, now())
);

create index if not exists cupones_estado_idx on public.cupones (estado);

alter table public.cupones enable row level security;

drop policy if exists "cupones_select_own_or_admin" on public.cupones;
create policy "cupones_select_own_or_admin"
  on public.cupones for select
  to authenticated
  using ( cliente_id = (select auth.uid()) or private.is_admin() );

drop policy if exists "cupones_admin_write" on public.cupones;
create policy "cupones_admin_write"
  on public.cupones for all
  to authenticated
  using ( private.is_admin() )
  with check ( private.is_admin() );

grant select on public.cupones to authenticated;

-- Extiende el alta de usuario: un cupón único PINO20-xxxxxx
create or replace function private.ensure_welcome_coupon()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.cupones (cliente_id, codigo_cupon)
  values (new.id, 'PINO20-' || upper(substr(replace(new.id::text, '-', ''), 1, 6)))
  on conflict (cliente_id) do nothing;
  return new;
end;
$$;

drop trigger if exists perfiles_welcome_coupon on public.profiles;
create trigger perfiles_welcome_coupon
  after insert on public.profiles
  for each row execute function private.ensure_welcome_coupon();
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
-- ============================================================================
-- 004_admin_roles_and_jobs.sql
-- Auto-asignación de roles Google OAuth + tabla CRM de trabajos
-- ============================================================================
-- Ejecutar en: Supabase → SQL Editor → Run
-- Idempotente: usa IF NOT EXISTS / ON CONFLICT / CREATE OR REPLACE
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. FUNCIÓN: Asignar rol automáticamente al crear usuario Google
-- ---------------------------------------------------------------------------
-- REGLA: pino.spacesverts@gmail.com → admin | cualquier otro → client
CREATE OR REPLACE FUNCTION private.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public, auth
AS $$
DECLARE
  v_role public.app_role;
  v_full_name text;
BEGIN
  -- Determinar rol según email (Andrés Pino admin, resto client)
  v_role := CASE
    WHEN lower(NEW.email) IN ('pino.spacesverts@gmail.com', 'pino.espacesverts@gmail.com') THEN 'admin'::public.app_role
    ELSE 'client'::public.app_role
  END;

  -- Obtener nombre desde metadatos de Google OAuth
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- Crear/actualizar perfil
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, v_full_name, v_role)
  ON CONFLICT (id) DO UPDATE SET
    email     = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    role      = CASE
                  WHEN lower(EXCLUDED.email) IN ('pino.spacesverts@gmail.com', 'pino.espacesverts@gmail.com') THEN 'admin'::public.app_role
                  ELSE profiles.role  -- no degradar un admin existente
                END,
    updated_at = now();

  -- Escribir rol en app_metadata del JWT (fuente de autorización del cliente)
  UPDATE auth.users
  SET raw_app_meta_data = jsonb_set(
    COALESCE(raw_app_meta_data, '{}'::jsonb),
    '{role}',
    to_jsonb(v_role::text)
  )
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- Activar el trigger en auth.users (on INSERT y UPDATE de email)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION private.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION private.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2. Reparar usuarios EXISTENTES (retroactivo, idempotente)
-- ---------------------------------------------------------------------------
-- Asignar admin al correo de Pino si ya existe en auth.users
UPDATE public.profiles
SET role = 'admin'
WHERE lower(email) IN ('pino.spacesverts@gmail.com', 'pino.espacesverts@gmail.com')
  AND role != 'admin';

UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}', '"admin"'
)
WHERE lower(email) IN ('pino.spacesverts@gmail.com', 'pino.espacesverts@gmail.com');

-- ---------------------------------------------------------------------------
-- 3. TABLA: public.jobs — CRM de trabajos realizados
-- ---------------------------------------------------------------------------
create table if not exists public.jobs (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid references public.profiles(id) on delete set null,
  client_name     text not null,
  client_email    text,
  client_phone    text,
  client_commune  text,

  -- Detalles del trabajo
  service_type    text not null,                  -- Jardín, Poda, Entretien, etc.
  description     text,
  date_start      date,
  date_end        date,
  hours_spent     numeric(6,2),

  -- Financiero
  amount_charged  numeric(10,2),                  -- €
  amount_paid     numeric(10,2) default 0,
  payment_status  text not null default 'pending'
                  check (payment_status in ('pending','partial','paid','cancelled')),
  payment_method  text
                  check (payment_method in ('unipros','virement','cheque','cesu','especes','autre')),

  -- Metadatos
  notes           text,
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Índices para búsqueda rápida
create index if not exists jobs_client_id_idx    on public.jobs (client_id);
create index if not exists jobs_date_idx         on public.jobs (date_start desc);
create index if not exists jobs_payment_idx      on public.jobs (payment_status);
create index if not exists jobs_service_idx      on public.jobs (service_type);

-- ---------------------------------------------------------------------------
-- 4. RLS en public.jobs — solo admin puede leer/escribir
-- ---------------------------------------------------------------------------
alter table public.jobs enable row level security;

-- Admin: acceso total
create policy if not exists "admin_all_jobs"
  on public.jobs
  for all
  to authenticated
  using (
    (select raw_app_meta_data->>'role' from auth.users where id = (select auth.uid())) = 'admin'
  )
  with check (
    (select raw_app_meta_data->>'role' from auth.users where id = (select auth.uid())) = 'admin'
  );

-- Cliente: solo puede ver sus propios trabajos
create policy if not exists "client_own_jobs"
  on public.jobs
  for select
  to authenticated
  using (
    client_id = (select auth.uid())
  );

-- ---------------------------------------------------------------------------
-- 5. Trigger updated_at en jobs
-- ---------------------------------------------------------------------------
create or replace function private.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists jobs_updated_at on public.jobs;
create trigger jobs_updated_at
  before update on public.jobs
  for each row execute function private.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 6. Vista de resumen para exportación (usada por admin)
-- ---------------------------------------------------------------------------
create or replace view public.jobs_summary as
select
  j.id,
  j.client_name,
  j.client_email,
  j.client_commune,
  j.service_type,
  j.description,
  j.date_start,
  j.date_end,
  j.hours_spent,
  j.amount_charged,
  j.amount_paid,
  j.payment_status,
  j.payment_method,
  j.notes,
  j.created_at,
  -- Campos calculados
  (j.amount_charged - j.amount_paid) as amount_pending,
  extract(day from (j.date_end - j.date_start)) + 1 as days_worked
from public.jobs j
order by j.date_start desc;

-- ---------------------------------------------------------------------------
-- 7. STORAGE BUCKETS Y POLÍTICAS RLS (portfolio, invoices, dossiers)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('portfolio', 'portfolio', true),
  ('invoices', 'invoices', false),
  ('dossiers', 'dossiers', false)
on conflict (id) do update set public = excluded.public;

-- Política portfolio: lectura pública para todos
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'portfolio_public_read' and tablename = 'objects') then
    create policy "portfolio_public_read" on storage.objects for select using (bucket_id = 'portfolio');
  end if;
  if not exists (select 1 from pg_policies where policyname = 'portfolio_admin_all' and tablename = 'objects') then
    create policy "portfolio_admin_all" on storage.objects for all to authenticated
      using (bucket_id = 'portfolio' and (select raw_app_meta_data->>'role' from auth.users where id = (select auth.uid())) = 'admin')
      with check (bucket_id = 'portfolio' and (select raw_app_meta_data->>'role' from auth.users where id = (select auth.uid())) = 'admin');
  end if;
  if not exists (select 1 from pg_policies where policyname = 'invoices_admin_all' and tablename = 'objects') then
    create policy "invoices_admin_all" on storage.objects for all to authenticated
      using (bucket_id = 'invoices' and (select raw_app_meta_data->>'role' from auth.users where id = (select auth.uid())) = 'admin')
      with check (bucket_id = 'invoices' and (select raw_app_meta_data->>'role' from auth.users where id = (select auth.uid())) = 'admin');
  end if;
  if not exists (select 1 from pg_policies where policyname = 'invoices_client_read' and tablename = 'objects') then
    create policy "invoices_client_read" on storage.objects for select to authenticated
      using (bucket_id = 'invoices' and (storage.foldername(name))[1] = (select auth.uid())::text);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'dossiers_admin_all' and tablename = 'objects') then
    create policy "dossiers_admin_all" on storage.objects for all to authenticated
      using (bucket_id = 'dossiers' and (select raw_app_meta_data->>'role' from auth.users where id = (select auth.uid())) = 'admin')
      with check (bucket_id = 'dossiers' and (select raw_app_meta_data->>'role' from auth.users where id = (select auth.uid())) = 'admin');
  end if;
  if not exists (select 1 from pg_policies where policyname = 'dossiers_client_read' and tablename = 'objects') then
    create policy "dossiers_client_read" on storage.objects for select to authenticated
      using (bucket_id = 'dossiers' and (storage.foldername(name))[1] = (select auth.uid())::text);
  end if;
end $$;

-- ============================================================================
-- FIN — Para aplicar: SQL Editor → pegar → Run
-- ============================================================================
