# Plan de implementación — Pino Espaces Verts v2

Estándar de diamante. No se escribe aplicación hasta que el Hito 0 esté en git (ya lo está).

## Principios

1. **Strangler fig:** `index.html` sigue en producción hasta el Hito 6.
2. **Paridad visual, no rediseño.** Paleta clara. Prohibido tema oscuro.
3. **Unipros no se reimplementa.** Se explica y se enlaza.
4. **RLS primero.** Ninguna tabla public sin policy.
5. **Datos reales de v1 se migran** (cupones Firebase), no se tiran.
6. **Francés en UI.** Español solo en docs internas.

## Orden (dependencias)

```
Hito 0 (docs)
   └─ Hito 1 (Supabase EU, SQL, Auth, export Firebase)
         └─ Hito 2 (Next landing + CMP + leads)
               ├─ Hito 3 (espace client) ─┐
               └─ Hito 5a (calculadora, /pro) puede paralelizarse
                      └─ Hito 4 (admin) ─┴─ Hito 6 (DNS, apagado Firebase)
```

Hitos 3 y 4 son secuenciales (admin necesita las mismas tablas que el cliente). El formulario B2B del Hito 5 puede empezar en paralelo al 3.

## Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| SIRET no entregado | Mentions incompletas | Bloqueo de go-live legal, no de desarrollo |
| OAuth Google verification | Delay signup | Empezar consent screen en Hito 1 |
| Vercel vs OVH | Texto LCEN | Decidir en Hito 1, no en 6 |
| Edge Functions “global” | Residencia | `forceFunctionRegion=eu-west-3` |
| Chatbot + futuro LLM US | RGPD | Knowledge base local hasta decisión explícita |
| Impersonación mal hecha | Elevación | Cookie server, nunca swap de JWT |

## Verificación por hito

- Hito 1: `supabase db advisors` + test SQL cruzado de clientes.
- Hito 2: Lighthouse mobile sobre landing portada + Network sin Firebase.
- Hito 3: Playwright login + IDOR negativo.
- Hito 4: Playwright admin 403 para client.
- Hito 6: §10 del documento maestro, todos los checkboxes.

## Fuera de alcance v2

- App nativa iOS/Android (PWA basta).
- Stripe / PayPal.
- WhatsApp Cloud API / SMS masivo.
- Marketplace de jardineros.
- LLM externo sobre fichas de cliente.
- Multi-empresa / white-label.
