# ADR-0003: Autorización por `app_metadata` + RLS

## Status

Accepted

## Context

El brief original ponía `rol` en `perfiles` y una política `EXISTS (SELECT 1 FROM perfiles WHERE rol = 'admin')`. En Supabase, `raw_user_meta_data` es **editable por el usuario** y puede colarse en el JWT. `auth.role()` está deprecado. `TO authenticated` sin predicado es IDOR.

## Decision

- Fuente de verdad del rol: `auth.users.raw_app_meta_data.role` (`client` | `admin`).
- Espejo en `profiles.role` con trigger que impide self-escalation.
- `private.is_admin()` SECURITY DEFINER lee `auth.jwt() -> app_metadata`.
- Políticas: `TO authenticated` + `(select auth.uid())` + `WITH CHECK`.
- Service role solo en Edge Functions.

## Consequences

- El primer admin se provisiona por SQL/dashboard, no por signup público.
- Hay que rotar JWT tras cambiar `app_metadata` (claims no son live).
- `supabase db advisors` es gate de CI.
