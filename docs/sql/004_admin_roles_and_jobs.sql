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
