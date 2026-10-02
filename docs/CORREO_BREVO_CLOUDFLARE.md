# Correo transaccional — Resend + Cloudflare Worker

Cómo llegan los correos de Pino Espaces Verts (FASE 1). El nombre histórico del archivo
conserva «Brevo»; el proveedor real es **Resend**.

## Qué hace

Cuando un cliente **inicia sesión**, **envía un devis** o Andrés **responde desde el CRM**,
se envían correos personalizados:

- **Al cliente:** `Bonjour {prénom}, …` confirmando la acción.
- **A Andrés** (`pino.espacesverts@gmail.com`, más la cuenta con typo conocida) **con copia a JOM**
  (`jomstudiovzla@gmail.com`).

Identidad visible:

```
From: Andrés Pino — Pino Espaces Verts <andresp@pinoespacesverts.online>
Reply-To: pino.espacesverts@gmail.com
```

## Arquitectura (save-first)

```
1. El navegador persiste el devis / mensaje en Firebase RTDB
   (éxito de usuario = registro guardado, mail_status = received)
2. PinoMail → Worker pino-mail.pinoespacesverts.online → Resend
3. Si el Worker falla:
     a. Gmail API (solo sesión admin con token)
     b. mail_outbox RTDB (solo admin verificado)
     c. cola localStorage (mismo dispositivo)
```

El cliente **nunca** llama a `/api/*`. Functions `/emails/send` es un canal servidor opcional
(admin JWT): persiste en `mail_outbox` y envía por Resend si `RESEND_API_KEY` está definida.

Código: `infra/cloudflare/mail-worker/` (Worker), `assets/js/pino-mail.js` (cliente),
`assets/js/pino-db.js` (`saveLead` / `enqueueMailJob`).

Estados de cola: `received` → `processing` → `sent` | `failed` | `queued`.

## Puesta en marcha (una vez)

### 1. Resend + dominio

1. Cuenta en https://resend.com.
2. Autentica `pinoespacesverts.online` (SPF / DKIM / DMARC en Cloudflare DNS, **DNS only** / nube gris).
3. Crea la API key (`re_…`). **No la pegues en el repo.**

### 2. Turnstile (recomendado para devis anónimo)

Cloudflare → Turnstile → dominio `pinoespacesverts.online`. Site key en el widget;
Secret en el Worker.

### 3. Desplegar el Worker

Desde `infra/cloudflare/mail-worker/`:

```bash
npm install
npx wrangler login
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put TURNSTILE_SECRET
npx wrangler deploy
```

Variables en `wrangler.toml`: `SENDER_EMAIL=andresp@pinoespacesverts.online`,
`REPLY_TO_EMAIL=pino.espacesverts@gmail.com`, `ALLOWED_ORIGINS` (incluye localhost:5500).

Dominio del Worker: `pino-mail.pinoespacesverts.online` (ya en la CSP).

### 4. Functions (opcional, plan Blaze)

```bash
firebase functions:secrets:set RESEND_API_KEY
pnpm deploy:production
```

Sin clave, `/emails/send` deja el mensaje en `queued`. El navegador no usa esta ruta.

## Probar

```bash
# Worker local
npx wrangler dev   # en infra/cloudflare/mail-worker/
curl http://127.0.0.1:8787/health

# Reglas + API
pnpm test:rules
pnpm test:api
pnpm audit:static
```

En producción: enviar un devis de prueba. Debe quedar el lead en RTDB **aunque** el correo
falle; el correo llega From Andrés Pino si el Worker tiene `RESEND_API_KEY`.

## Seguridad y RGPD

- `RESEND_API_KEY` y Turnstile Secret **solo** en secretos del Worker / Functions.
- FormSubmit y Web3Forms están fuera del camino crítico y de la CSP (`form-action 'self'`).
- `mail_outbox` escribible **solo** por admin verificado (mismas tres direcciones que `ADMIN_EMAILS`).
- Gmail API es un puente de sesión admin, no el canal de producción.
- Rotar el Google OAuth Client Secret si estuvo en `.env.local`.
