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
