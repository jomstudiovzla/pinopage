-- 006_rgpd_erasure.sql — Droit à l'effacement en self-service (Art. 17 RGPD)
-- --------------------------------------------------------------------------
-- Función SECURITY DEFINER que anonimiza ÚNICAMENTE los datos del llamante
-- (filtrando siempre por auth.uid()), por lo que un cliente jamás puede tocar
-- los datos de otro. Conserva las facturas 10 años (obligación legal
-- L.123-22 Code de commerce) desvinculándolas del cliente y anonimizándolas.
--
-- Aplicar en Supabase DESPUÉS de docs/sql/FULL_MIGRATION_MASTER.sql.

create or replace function public.anonymize_own_account()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid := auth.uid();
  tag text;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;
  tag := substr(md5(uid::text), 1, 10);

  -- Factures : conservées 10 ans, désindexées du client + anonymisées.
  update public.invoices
     set client_id = null,
         client_display = 'Client supprimé ' || tag
   where client_id = uid;

  -- Leads en cours (new/contacted) : supprimés ; le reste anonymisé.
  delete from public.leads
   where user_id = uid and status in ('new', 'contacted');
  update public.leads
     set full_name = null, email = null, phone = null, commune = null,
         garden_description = null, company_name = null, siret = null
   where user_id = uid;

  -- Dossiers (client_id NOT NULL) : supprimés.
  delete from public.dossiers where client_id = uid;

  -- Coupon : supprimé.
  delete from public.cupones where cliente_id = uid;

  -- Trace légale de la demande d'effacement.
  insert into public.dsar_requests (user_id, request_type, status, completed_at)
  values (uid, 'erasure', 'completed', now());

  -- Profil anonymisé + marqué supprimé (la ligne est conservée pour l'intégrité
  -- référentielle des factures/DSAR ; les PII sont effacées).
  update public.profiles
     set full_name = null, email = null, phone = null, commune = null,
         address_line = null, welcome_promo_code = null, deleted_at = now()
   where id = uid;
end;
$$;

revoke all on function public.anonymize_own_account() from public, anon;
grant execute on function public.anonymize_own_account() to authenticated;
