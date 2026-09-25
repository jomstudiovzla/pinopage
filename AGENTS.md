# Agent Instructions — Pino Espaces Verts

## Source of truth
- Product + architecture: `DOCUMENTO_MAESTRO.md`
- Tasks: `tareas.md`
- Plan: `plan_implementacion.md`
- SQL/RLS: `docs/sql/001_initial_schema.sql`
- Legal FR: `docs/LEGAL_ET_FISCAL_FRANCE.md`
- Unipros / chatbot: `docs/UNIPROS_KNOWLEDGE_BASE.md`, `docs/CHATBOT_KNOWLEDGE_BASE.md`
- ADRs: `docs/adr/`

## Current tree
v1 live = static `index.html` + PWA. Do not delete it until Hito 6. v2 app will live in a Next.js tree once Hito 2 starts.

## v1 stack (real, verified)
- Auth + data: **Firebase Auth + Realtime Database** (`pagepino-e8e97`, `europe-west1`). Config: `assets/js/firebase-config.js`.
- Access control lives in `database.rules.json` (deny by default, admin = verified email in the rules list, clients isolated by verified email). Any change → `pnpm test:rules` then `pnpm deploy:rules`.
- Firebase Auth is the only session source. `localStorage.pino_current_user` is a UI cache, cleared when Firebase has no user. No local/fallback accounts, ever.
- Email + password accounts must have `emailVerified` before any session (Google/Apple are verified by the provider).
- Apple Sign-In is hidden behind `PINO_FLAGS.appleLogin` until the `apple.com` provider is enabled in Firebase.
- Supabase is **not loaded in v1**; it is reserved for v2 (Next.js + Postgres RLS, `eu-west-3`).
- No server API in v1 (static hosting): never call `/api/*` from the client.
- Public URL used in emails: `PINO_PUBLIC_URL` in `firebase-config.js` (one line to change when the domain arrives).

## Package Manager
Use **pnpm**: `pnpm install`, `pnpm dev` (http://localhost:5500), `pnpm test`.

## v1 commands
| Task | Command |
|------|---------|
| Dev server | `pnpm dev` |
| Rebuild Tailwind after editing classes | `pnpm build:css` |
| Rules tests (emulator) | `pnpm test:rules` |
| E2E flows (Chromium + WebKit iPhone + CSP) | `pnpm test:e2e` |
| Static audit | `pnpm audit:static` |
| Production audit (read-only) | `pnpm audit:live` |
| Deploy DB rules | `pnpm deploy:rules` |

Never send write requests to the production database to "test" rules: prove denials on the emulator.

## File-Scoped Commands
| Task | Command |
|------|---------|
| Typecheck | `pnpm tsc --noEmit path/to/file.ts` |
| Lint | `pnpm eslint path/to/file.ts` |
| SQL advisors | `supabase db advisors` |
| Unit calculadora | `pnpm vitest run path/to/file.test.ts` |

## Commit Attribution
AI commits MUST include:
```
Co-Authored-By: Grok 4.6 <noreply@x.ai>
```

## Key conventions
- UI language: **French**. Internal docs: Spanish.
- Light green/cream palette only. No dark theme.
- v2: role lives in `app_metadata.role`, never `user_metadata`. v1: admin = verified email listed in `database.rules.json` (same list as `ADMIN_EMAILS` in `index.html`).
- v2 Supabase region: **`eu-west-3`**. Pin Edge Functions to Paris.
- Two payment rails: `unipros` (deep-link only) vs `direct`. No card forms.
- Auth v1: **Firebase only** (see "v1 stack"). Auth v2: Supabase only.
- Promo: unique coupon after verified `user_id`. No public email field. Chatbot never prints a raw code.
- Header must keep Unipros logo → `https://unipros.coop` (`target=_blank`).
- Chat toggle uses `fa-comments`, not the pine logo.
- Chatbot routing: garden/devis → Andrés; Unipros/URSSAF/7DB → Unipros support.
- v2 RLS: `(select auth.uid())`, `TO authenticated`, UPDATE `WITH CHECK`.
- Never put `SERVICE_ROLE` in client code. Never invent SIRET/capital social.
- Right to erasure: anonymize PII; keep invoices 10 years.
- Do not load analytics before CNIL consent.
