# Agent Instructions — Pino Espaces Verts

> Single source for every coding agent (Claude Code, Grok, Antigravity/Gemini, Codex, Cursor…).
> `CLAUDE.md` and `GEMINI.md` are symlinks to this file: edit rules HERE only.
> Handoff between agents: at the end of each session update `.context_sync.json` (agent, what changed, next step).

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
- Canonical URL: **`https://pinoespacesverts.online`** — registered on **Cloudflare** (2026-09-28), being connected to Firebase Hosting → Custom domains (see `docs/dns/CONECTAR_DOMINIO.md`). It is the default of `SITE_URL` (`scripts/build.mjs`), which the build injects into `PINO_PUBLIC_URL` and rewrites across the bundle; override per-deploy with `PINO_SITE_URL`.
- Free fallback (always works, used for rollback): **`https://pagepino-e8e97.web.app`**. Source files keep this origin as a placeholder; `build.mjs` step 5b swaps it for `SITE_URL`. Connect `.online` via `pnpm domain:connect pinoespacesverts.online`. Cloudflare DNS records for Firebase must be **"DNS only" (grey cloud)**, never Proxied — the proxy breaks Firebase's managed SSL.
- `authDomain` stays `pagepino-e8e97.firebaseapp.com` (handles Google OAuth redirect); just add `pinoespacesverts.online` + `www` to Firebase Auth → Authorized domains.
- `pinoespacesverts.fr` is **not registered** (AFNIC: not found, 2026-09-25). Do not reference it; `.online` is the live domain.
- Contact e-mail shown on the site: `pino.espacesverts@gmail.com`.
- Deploy: `pnpm deploy:production` (needs a CLI account with access to `pagepino-e8e97`; works on the free Spark plan, Functions optional).

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
| Full deploy (Hosting + rules, Functions if Blaze) | `pnpm deploy:production` |

Never send write requests to the production database to "test" rules: prove denials on the emulator.

## File-Scoped Commands
| Task | Command |
|------|---------|
| Typecheck | `pnpm tsc --noEmit path/to/file.ts` |
| Lint | `pnpm eslint path/to/file.ts` |
| SQL advisors | `supabase db advisors` |
| Unit calculadora | `pnpm vitest run path/to/file.test.ts` |

## Commit Attribution
AI commits MUST end with a `Co-Authored-By` line naming the agent that actually wrote the change, e.g.:
```
Co-Authored-By: Claude <noreply@anthropic.com>
Co-Authored-By: Grok <noreply@x.ai>
Co-Authored-By: Gemini (Antigravity) <noreply@google.com>
```
Never attribute work to an agent that did not do it.

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
