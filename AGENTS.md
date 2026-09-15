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

## Package Manager
When the Next.js app exists, use **pnpm**: `pnpm install`, `pnpm dev`, `pnpm test`.

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
- Role lives in `app_metadata.role`, never `user_metadata`.
- Supabase region: **`eu-west-3`**. Pin Edge Functions to Paris.
- Two payment rails: `unipros` (deep-link only) vs `direct`. No card forms.
- Promo: keep campaign `PELABOLA`; unique `PINO-XXXX` on signup. Chatbot never prints PELABOLA in chat.
- Chatbot routing: garden/devis → Andrés; Unipros/URSSAF/7DB → Unipros support.
- RLS: `(select auth.uid())`, `TO authenticated`, UPDATE `WITH CHECK`.
- Never put `SERVICE_ROLE` in client code. Never invent SIRET/capital social.
- Right to erasure: anonymize PII; keep invoices 10 years.
- Do not load analytics before CNIL consent.
