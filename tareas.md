# Backlog — Pino Espaces Verts v2

Fuente: `DOCUMENTO_MAESTRO.md` §9. Cada tarea: una sesión, criterios, verificación.

## Hito 0 — Gobernanza

- [x] Documento maestro v2.0
- [x] ADRs 0001–0004
- [x] SQL + RLS `docs/sql/001_initial_schema.sql`
- [x] AGENTS.md / plan de implementación

## Remediación V2.0 (auditoría 2026-09-15)

- [x] Quitar Firebase Auth/SDK del cliente (error dominio GitHub Pages)
- [x] Cablear Supabase JS + `signInWithOAuth({ google })` + redirect del origen
- [x] Logo Unipros en header (enlace `unipros.coop`)
- [x] Chat flotante = `fa-comments`
- [x] Modal auth `max-h-[80vh] overflow-y-auto` + CGV bajo Google
- [x] Cupón: sin email público; CTA Google; código solo con `user_id`
- [x] SQL `docs/sql/002_cupones_rls.sql`
- [x] Pegar `url` + `anonKey` en `assets/js/supabase-config.js` y autorizar `jomstudiovzla.github.io`

## Hito 1 — Infra UE

- [x] Tarea: Crear proyecto Supabase región `eu-west-3` y firmar DPA
  - Acceptance: Dashboard muestra West EU (Paris). DPA en archivo interno (no git).
  - Verify: captura de región + `supabase status`
- [x] Tarea: Aplicar `docs/sql/FULL_MIGRATION_MASTER.sql` (001, 002, 003, 004) y triggers
  - Acceptance: tablas + RLS + semilla PELABOLA + tabla jobs + vista jobs_summary.
  - Verify: usuario A no selecciona datos de B, admin gestiona trabajos.
- [ ] Tarea: Buckets Storage `portfolio`, `invoices`, `dossiers`
  - Acceptance: policies alineadas al SQL. Upsert admin funciona.
  - Verify: URL firmada 60 s; anónimo no lista invoices.
- [x] Tarea: Auth Google OAuth + email confirm (FR)
  - Acceptance: pantalla de consentimiento con nombre Pino Espaces Verts.
  - Verify: signup test + Google OAuth.
- [x] Tarea: Provisionar admin Andrés (`app_metadata.role=admin`) y CRM de Trabajos
  - Acceptance: auto-asignación admin para `pino.spacesverts@gmail.com` y `pino.espacesverts@gmail.com`.
  - Verify: exportes PDF/Excel y gestión cliente por cliente.
- [ ] Tarea: Exportar Firestore `pino_coupons` → CSV y mapear a `leads`
  - Acceptance: 0 pérdida de emails. Firebase queda read-only.
  - Verify: recuento filas origen = destino.

## Hito 2 — Landing Next.js (paridad)

- [ ] Tarea: Scaffold Next.js 15 + TS + Tailwind con tokens Pino
  - Acceptance: mismos colores `#f2f6f0` / `#1e5138`. Sin dark mode.
  - Verify: screenshot hero vs v1.
- [ ] Tarea: Portar secciones (hero, services, unipros, coupon, devis, galerie, FAQ, footer)
  - Acceptance: mismos CTAs WhatsApp/tel. Chatbot knowledge base portada.
  - Verify: click-path devis + coupon.
- [ ] Tarea: Rutas `/mentions-legales` `/cgv` `/confidentialite` `/aides-fiscales`
  - Acceptance: ya no solo modales. Hébergeur real (placeholder interno hasta confirmar).
  - Verify: enlace footer en todas las páginas.
- [ ] Tarea: CMP cookies CNIL (Refuser / Accepter / Personnaliser)
  - Acceptance: analytics no carga si reject. Fila en `consents`.
  - Verify: red tab Network.
- [ ] Tarea: Formularios → `leads` (retirar Firebase SDK y Web3Forms del cliente)
  - Acceptance: devis B2C + coupon PELABOLA + email Andrés vía Edge Function UE.
  - Verify: fila en tabla + correo de prueba.
- [ ] Tarea: JSON-LD + sitemap + GBP `sameAs` + canonical dominio
  - Acceptance: rich results test OK.
  - Verify: Google Rich Results / schema validator.

## Hito 3 — Espacio cliente

- [ ] Tarea: `/connexion` (Google + email) y middleware
  - Acceptance: no autenticado → login. Admin también puede usar `/espace`.
  - Verify: e2e Playwright login.
- [ ] Tarea: Dashboard 3 contadores (factures, dossiers, avantage 20 %)
  - Acceptance: números reales desde Postgres.
  - Verify: seed 3 invoices / 1 dossier / promo welcome.
- [ ] Tarea: Lista factures + download signed URL
  - Acceptance: rail Unipros vs Directo visible. Especes nunca ofrecido.
  - Verify: cliente B 404/empty.
- [ ] Tarea: Dossiers + `viewed_at`
  - Acceptance: badge non lu desaparece al abrir.
  - Verify: update RLS.
- [ ] Tarea: Trigger bienvenida código `PINO-XXXX` + email
  - Acceptance: 1 código, max_redemptions=1, no se imprime PELABOLA en el mail de cuenta.
  - Verify: dos signups = dos códigos.
- [ ] Tarea: Export JSON + supprimer compte (anonimiza, conserva factures 10 años)
  - Acceptance: copy legal visible. `deleted_at` set. PII fuera.
  - Verify: profile email null; invoice `client_display` anon.

## Hito 4 — God Mode

- [ ] Tarea: `/admin` layout + guard `is_admin`
  - Acceptance: client → 403. Sin leak de UI.
  - Verify: e2e.
- [ ] Tarea: Tablas clientes / leads / invoices / dossiers / promotions
  - Acceptance: CRUD. Upload PDF Storage.
  - Verify: audit_log escribe.
- [ ] Tarea: CMS portfolio (real_work vs marketing)
  - Acceptance: published aparece en landing.
  - Verify: anon ve solo published.
- [ ] Tarea: Impersonación 15 min + audit
  - Acceptance: banner “vous voyez comme X”. No cambia JWT admin.
  - Verify: log `action=impersonate`.
- [ ] Tarea: Analíticas Unipros vs Directo + redenciones promo + conversión registro
  - Acceptance: números = queries, no localStorage.
  - Verify: seed conocido.

## Hito 5 — Omnicanal y legal

- [ ] Tarea: Formulario `/pro` B2B (SIRET, syndic, fréquence)
  - Acceptance: `lead_type=b2b`, disclaimer “pas de crédit d'impôt SAP”.
  - Verify: fila.
- [ ] Tarea: Bloque contactos WhatsApp / tel / mailto / Instagram / Facebook
  - Acceptance: tracking solo si consent analytics.
  - Verify: reject all → no event third-party.
- [ ] Tarea: Calculadora aides (plafond 5000, promo, 50 %)
  - Acceptance: 300 € → 150 €; 300 € −20 % → 120 €. Disclaimer simulation.
  - Verify: unit test función pura.
- [ ] Tarea: Completar SIRET / RC Pro / hébergeur cuando Andrés responda
  - Acceptance: cero placeholders en prod.
  - Verify: review mentions.

## Hito 6 — Corte

- [ ] Tarea: DNS `pinoespacesverts.fr` → host UE
- [ ] Tarea: 301 desde GitHub Pages
- [ ] Tarea: Apagar Firebase y rotar keys Web3Forms
- [ ] Tarea: Checklist 007 + prueba DSAR + Lighthouse
  - Acceptance: ver `DOCUMENTO_MAESTRO.md` §10.
  - Verify: evidencia en `docs/qa/` (crear al ejecutar).
