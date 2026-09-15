# ADR-0001: Next.js 15 + Supabase región París (`eu-west-3`)

## Status

Accepted

## Context

La v1 es un `index.html` estático con Tailwind CDN, PWA y Firestore (`crm-jom`). El brief exige cuentas, paneles, RLS y residencia UE (RGPD / CNIL). El producto debe conservar SEO local y la identidad visual luminosa.

## Decision Drivers

- Residencia de Postgres, Auth y Storage **dentro de un Estado miembro de la UE**.
- Un solo equipo (JOM Studio + Andrés), sin microservicios.
- SEO de la landing no puede degradarse.
- Continuidad con el código React-like ya mentalizado (no Vue/Svelte).

## Considered Options

### 1. Next.js 15 App Router + Supabase `eu-west-3` (París)
- Pros: SSR, paneles, DPA, latencia Gironde, Auth Google nativo.
- Cons: hay que portar el HTML actual.

### 2. Quedar en estático + Firebase
- Pros: ya está desplegado.
- Cons: datos fuera de UE, sin RLS real, admin falso (Alt+A).

### 3. Agrupado Supabase “Europe”
- Pros: capacidad automática.
- Cons: puede caer en Londres o Zúrich (no UE). Inaceptable para el brief.

## Decision

Next.js 15 + TypeScript + Tailwind (tokens Pino) + Supabase **`eu-west-3`**. Edge Functions con invocación regional París.

## Consequences

- Hito 2 = paridad visual de la landing, no un rediseño.
- Coste: proyecto Supabase Pro si Storage/Auth lo requieren; DPA a firmar.
- Mentions Légales deberán citar el hébergeur front real (Vercel FRA u OVH), no un OVH ficticio si se usa GitHub Pages.
