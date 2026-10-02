# ADR 0006 — v1 permanece en Realtime Database (no migrar a Firestore)

- Statut : accepté (FASE 8, 2026-10-02)
- Décideurs : JOM Studio / Pino Espaces Verts
- Relacionado : ADR 0004 (v2 deja Firebase — **no supersedido**), ADR 0005 (`mail_outbox` admin-only)

## Contexto

La instrucción FASE 8 describía colecciones Firestore (`/users`, `/devis`, `/discountCodes`, `/emailLogs`, `/adminAuditLogs`, `/siteSettings`, `/gardenCalendar`). El almacén **vivo** de v1 es Firebase Realtime Database del proyecto `pagepino-e8e97` (`europe-west1`). El cliente no carga el SDK Firestore. `firestore.rules` es un archivo inerte.

Migrar a Firestore en esta fase implicaría SDK nuevo, reglas nuevas, índices compuestos, dual-run y riesgo de perder el aislamiento ya probado (`pnpm test:rules`).

## Decisión

1. **No habilitar Firestore** en v1. No desplegar `firestore.rules`. No añadir `firebase.firestore` al bundle.
2. Mapear las siete colecciones de la spec sobre nodos RTDB existentes. Documentación canónica: [`docs/data/MODELO_RTDB_V1.md`](../data/MODELO_RTDB_V1.md).
3. **No inventar** `/siteSettings` ni `/gardenCalendar` en RTDB. Flags = `PINO_FLAGS`. Calendrier = UI estática.
4. Cerrar huecos reales en `database.rules.json`:
   - self-write de `/users/{uid}` no puede poner `admin: true` (además de `isAdmin` / `role`).
   - el dueño de un lead no cambia `status` ni `source`.
   - un no-admin solo append-ea `/audit_logs` si `sessionUser === auth.token.email`.
   - `.indexOn` `status`, `created_at` en `mail_outbox`.
5. Admin gate híbrido (FASE 7): claims `admin`/`role` **o** allowlist, siempre `email_verified`.
6. v2 sigue ADR 0004 (Supabase `eu-west-3` + RLS). Este ADR gobierna **v1**.

## Consecuencias

- Fuente de verdad devis = `/leads`. `clients_records/.../quotes` es partición dual-write.
- Agentes posteriores no deben «corregir» v1 creando colecciones Firestore.
- `docs/FIREBASE_AUTH_ET_DATABASE.md` (proyecto `crm-jom` + Firestore) queda histórico; el modelo vivo es `MODELO_RTDB_V1.md`.
