# ADR-0004: Hosting front en UE y retiro de Firebase / GitHub Pages

## Status

Accepted

## Context

Producción actual: GitHub Pages (EE. UU.). Mentions Légales declaran OVHcloud Roubaix. Leads van a Firestore `crm-jom` y a Web3Forms. Incoherencia LCEN + transferencia RGPD.

## Decision

- Cortar GitHub Pages como origen canónico en el Hito 6.
- Front en **Vercel `fra1`** o **OVHcloud FR**. El texto legal citará el elegido, no el otro.
- Migrar `pino_coupons` y devis a `public.leads` / `promotions`.
- Retirar SDKs Firebase y la access key de Web3Forms del cliente.
- Email transaccional: Resend EU o Brevo.

## Consequences

- Redirect 301 desde `jomstudiovzla.github.io/pinopage/` hacia `www.pinoespacesverts.fr`.
- Export CSV de Firestore antes del apagado (Hito 1).
- Analytics solo tras consentimiento CNIL.
