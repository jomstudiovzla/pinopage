# Correo transaccional — Brevo + Cloudflare Worker

Cómo activar los correos automáticos y **personalizados por cliente** de Pino Espaces Verts.

## Qué hace

Cuando un cliente **inicia sesión** o **envía un devis**, se envían correos personalizados con
los datos reales de esa persona (prénom en el saludo; nom, téléphone, email, prestación, commune…):

- **Al cliente:** `Bonjour {prénom}, …` confirmando su acción.
- **A Andrés** (`pino.espacesverts@gmail.com`) **con copia a JOM** (`martinezoliverosj@gmail.com`)
  con toda la información del cliente, para hacer seguimiento.

Arquitectura: el navegador llama al **Cloudflare Worker `pino-mail`**, que verifica la identidad
(token de Firebase en login; Turnstile en formularios anónimos) y envía por **Brevo**. La clave de
Brevo vive **solo en el Worker** (secreto), nunca en el sitio ni en Git.

```
Cliente (web)  ──►  Worker pino-mail (Cloudflare)  ──►  Brevo API  ──►  correos
                     ▲ verifica Firebase ID token / Turnstile
```

Código: `infra/cloudflare/mail-worker/` (Worker) y `assets/js/pino-mail.js` (cliente).

---

## Puesta en marcha (una vez)

### 1. Crear la cuenta de Brevo y la API key
1. Crea una cuenta en https://www.brevo.com (plan gratuito: 300 emails/día).
2. **Autentica tu dominio** para poder enviar desde `@pinoespacesverts.online`:
   Brevo → *Senders, Domains & Dedicated IPs* → *Domains* → añade `pinoespacesverts.online`.
   Brevo te dará **registros DKIM/SPF/DMARC** (tipo TXT/CNAME) → añádelos en **Cloudflare DNS**
   (en modo *DNS only* / nube gris está bien; los TXT/CNAME no se proxean).
   ⚠️ **No borres** los registros A/TXT de Firebase ni ningún registro de correo existente.
3. Crea la **API key**: Brevo → *SMTP & API* → *API Keys* → *Generate a new API key*. Cópiala
   (empieza por `xkeysib-…`). **No la pegues en ningún archivo del repo.**

### 2. (Recomendado) Crear un sitio de Cloudflare Turnstile — anti-spam del formulario
1. Cloudflare Dashboard → *Turnstile* → *Add site* → dominio `pinoespacesverts.online`.
2. Copia la **Site key** (pública) y la **Secret key** (secreta).
3. La Site key se pone en el widget del formulario de devis (ver §5); la Secret key va al Worker.

### 3. Desplegar el Worker
Desde `infra/cloudflare/mail-worker/`:
```bash
npm install
npx wrangler login                 # abre el navegador para autorizar (tú inicias sesión)
npx wrangler secret put RESEND_API_KEY       # pega la API key de Resend (re_...)
npx wrangler secret put TURNSTILE_SECRET     # pega la Secret key de Turnstile (recomendado)
npx wrangler deploy
```
Revisa/ajusta las variables no secretas en `wrangler.toml` (`ADMIN_EMAIL`, `JOM_EMAIL`,
`SENDER_EMAIL`, `ALLOWED_ORIGINS`).

### 4. Conectar el dominio del Worker
Cloudflare → *Workers & Pages* → `pino-mail` → *Settings* → *Domains & Routes* → **Add Custom Domain**
→ `pino-mail.pinoespacesverts.online`.
(Ese origen **ya está permitido en la CSP** del sitio, en `firebase.json` y en el `<meta>` de `index.html`.)

> Si prefieres otra URL (p. ej. `*.workers.dev`), define `window.PINO_MAIL_ENDPOINT` en el sitio
> y añade ese origen a `connect-src` en la CSP.

### 5. (Recomendado) Añadir Turnstile al formulario de devis
Para que el envío anónimo del devis esté protegido, añade el widget de Turnstile al formulario y
expón su token en `window.PINO_TURNSTILE_TOKEN` antes de enviar. Sin Turnstile, el Worker envía en
modo público sin verificación (aceptable para pruebas, **no recomendado en producción**).

---

## Probar
```bash
# En infra/cloudflare/mail-worker/, con un archivo .dev.vars (ver .dev.vars.example):
npx wrangler dev
curl http://127.0.0.1:8787/health           # -> {"status":"ok"}
```
En producción, inicia sesión en el sitio: debe llegarte 1 correo al cliente y 1 a Andrés+JOM.

## Notas de seguridad y RGPD
- La API key de Brevo y la Secret de Turnstile **solo** en secretos del Worker (`wrangler secret`).
- Los correos van por **Brevo (UE)**; añade la mención a la política de privacidad (`/confidentialite`).
- El Worker **no** guarda los datos; solo los reenvía por correo.
- El aviso de login se **deduplica por sesión** (1 correo por login, no por cada refresco).

## Migrar el correo del devis de Web3Forms a Brevo
Hoy el devis usa **Web3Forms** además del Worker (doble vía, para no romper nada). Cuando confirmes
que Brevo llega bien, puedes **quitar el bloque de Web3Forms** en `index.html` (búsqueda:
`api.web3forms.com`) para dejar Brevo como único canal (mejor para RGPD).
