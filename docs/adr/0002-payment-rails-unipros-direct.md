# ADR-0002: Dos raíles de pago — Unipros vs directo (sin PSP propio)

## Status

Accepted

## Context

El cliente exige “claridad absoluta” entre pagos Unipros (SAP, 50 % crédito de impuesto) y pagos externos. En Francia, el crédito art. 199 sexdecies exige factura de un organismo agréé y **prohíbe especies**. Unipros ya opera CB, Avance Immédiate URSSAF y CESU.

## Decision Drivers

- No romper la éligibilité fiscale.
- No entrar en PCI-DSS en v2.
- B2B / création no son SAP.

## Considered Options

### 1. Deep-link Unipros + devis directo (elegido)
- Pros: legal, simple, reutiliza `paiement.unipros.coop` y `app.unipros.coop`.
- Cons: Andrés sigue conciliando a mano las factures Unipros (puede cargar PDF al dossier).

### 2. Stripe Checkout “50 %”
- Pros: UX de pago en sitio.
- Cons: **rompe el crédito de impuesto** si Pino cobra. Rechazado.

### 3. Recibir CB Unipros vía API
- Unipros no es un PSP embebible en v2. Rechazado.

## Decision

Campo `invoices.rail` ∈ {`unipros`, `direct`}. La UI separa los flujos. Ningún formulario de tarjeta en Pino.

## Consequences

- Calculadora de reste à charge es informativa, no un cargo.
- El God Mode registra método (`unipros_cb`, `unipros_cesu`, `direct_virement`, …) para analíticas pedidas por Andrés.
