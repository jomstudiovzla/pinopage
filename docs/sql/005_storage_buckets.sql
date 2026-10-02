-- ════════════════════════════════════════════════════════════════════════════
-- 005_storage_buckets.sql
-- Hito 1 — Buckets Supabase Storage + policies RLS
-- Proyecto: Pino Espaces Verts | Región: eu-west-3 (Paris)
-- Ejecutar en: Supabase Dashboard → SQL Editor (como superuser)
-- ════════════════════════════════════════════════════════════════════════════

-- ─── 1. Crear buckets ────────────────────────────────────────────────────────

-- portfolio: imágenes de trabajos (públicas en lectura, admin en escritura)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio',
  'portfolio',
  true,                          -- GET público (sin token)
  10485760,                      -- 10 MB por archivo
  array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm']
)
on conflict (id) do update set
  public            = excluded.public,
  file_size_limit   = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- invoices: facturas PDF por cliente (privadas, solo el cliente dueño y admin)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'invoices',
  'invoices',
  false,                         -- requiere token firmado
  5242880,                       -- 5 MB por archivo
  array['application/pdf']
)
on conflict (id) do update set
  public            = excluded.public,
  file_size_limit   = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- dossiers: documentos de proyecto por cliente (privados)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dossiers',
  'dossiers',
  false,                         -- requiere token firmado
  20971520,                      -- 20 MB por archivo
  array['application/pdf','image/jpeg','image/png','image/webp',
        'application/zip','application/x-zip-compressed']
)
on conflict (id) do update set
  public            = excluded.public,
  file_size_limit   = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;


-- ─── 2. Policies — portfolio (público) ───────────────────────────────────────

-- Lectura pública sin autenticación
drop policy if exists "portfolio_select_public" on storage.objects;
create policy "portfolio_select_public"
  on storage.objects for select
  using (bucket_id = 'portfolio');

-- Solo admin puede subir / actualizar / borrar
drop policy if exists "portfolio_insert_admin" on storage.objects;
create policy "portfolio_insert_admin"
  on storage.objects for insert
  with check (
    bucket_id = 'portfolio'
    and (select auth.jwt() ->> 'role') = 'admin'
  );

drop policy if exists "portfolio_update_admin" on storage.objects;
create policy "portfolio_update_admin"
  on storage.objects for update
  using (
    bucket_id = 'portfolio'
    and (select auth.jwt() ->> 'role') = 'admin'
  );

drop policy if exists "portfolio_delete_admin" on storage.objects;
create policy "portfolio_delete_admin"
  on storage.objects for delete
  using (
    bucket_id = 'portfolio'
    and (select auth.jwt() ->> 'role') = 'admin'
  );


-- ─── 3. Policies — invoices (privado por cliente) ────────────────────────────
-- Convención de path: invoices/{user_id}/{filename}.pdf

-- Cliente solo ve sus propias facturas
drop policy if exists "invoices_select_own" on storage.objects;
create policy "invoices_select_own"
  on storage.objects for select
  using (
    bucket_id = 'invoices'
    and (
      -- Admin lee todo
      (select auth.jwt() ->> 'role') = 'admin'
      -- Cliente: el primer segmento del path = su user_id
      or (select auth.uid())::text = (string_to_array(name, '/'))[1]
    )
  );

-- Solo admin sube / actualiza / borra facturas
drop policy if exists "invoices_insert_admin" on storage.objects;
create policy "invoices_insert_admin"
  on storage.objects for insert
  with check (
    bucket_id = 'invoices'
    and (select auth.jwt() ->> 'role') = 'admin'
  );

drop policy if exists "invoices_update_admin" on storage.objects;
create policy "invoices_update_admin"
  on storage.objects for update
  using (
    bucket_id = 'invoices'
    and (select auth.jwt() ->> 'role') = 'admin'
  );

drop policy if exists "invoices_delete_admin" on storage.objects;
create policy "invoices_delete_admin"
  on storage.objects for delete
  using (
    bucket_id = 'invoices'
    and (select auth.jwt() ->> 'role') = 'admin'
  );


-- ─── 4. Policies — dossiers (privado por cliente) ───────────────────────────
-- Convención de path: dossiers/{user_id}/{filename}

drop policy if exists "dossiers_select_own" on storage.objects;
create policy "dossiers_select_own"
  on storage.objects for select
  using (
    bucket_id = 'dossiers'
    and (
      (select auth.jwt() ->> 'role') = 'admin'
      or (select auth.uid())::text = (string_to_array(name, '/'))[1]
    )
  );

drop policy if exists "dossiers_insert_admin" on storage.objects;
create policy "dossiers_insert_admin"
  on storage.objects for insert
  with check (
    bucket_id = 'dossiers'
    and (select auth.jwt() ->> 'role') = 'admin'
  );

drop policy if exists "dossiers_update_admin" on storage.objects;
create policy "dossiers_update_admin"
  on storage.objects for update
  using (
    bucket_id = 'dossiers'
    and (select auth.jwt() ->> 'role') = 'admin'
  );

drop policy if exists "dossiers_delete_admin" on storage.objects;
create policy "dossiers_delete_admin"
  on storage.objects for delete
  using (
    bucket_id = 'dossiers'
    and (select auth.jwt() ->> 'role') = 'admin'
  );


-- ─── 5. Función helper: URL firmada 60 s ─────────────────────────────────────
-- Usar desde Edge Function o server component:
-- const { data } = await supabase.storage.from('invoices').createSignedUrl(path, 60)


-- ─── 6. Verificación ─────────────────────────────────────────────────────────
-- Ejecutar tras aplicar este SQL:
/*
  select id, name, public, file_size_limit
  from storage.buckets
  where id in ('portfolio', 'invoices', 'dossiers');

  select bucket_id, name, definition
  from pg_policies p
  join storage.objects o on true
  where schemaname = 'storage' and tablename = 'objects'
  group by bucket_id, name, definition;
*/
