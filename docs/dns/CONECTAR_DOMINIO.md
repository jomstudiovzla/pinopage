# Conectar `pinoespacesverts.online` a Firebase Hosting

**Estado 2026-09-28:** `pinoespacesverts.online` está **registrado en Cloudflare** (Cloudflare Registrar).
La web se sigue publicando en `https://pagepino-e8e97.web.app` (repli permanente) hasta que el
dominio propio quede *Connected* en Firebase.

> El código ya usa `https://pinoespacesverts.online` como URL canónica por defecto
> (`SITE_URL` en `scripts/build.mjs`). No hay que tocar código para conectar el dominio:
> solo los pasos manuales de abajo + un despliegue.

---

## Punto clave (Cloudflare + Firebase Hosting)

El dominio está en Cloudflare, así que **la zona DNS ya vive en Cloudflare** (no hay que cambiar
nameservers). Pero hay una trampa habitual:

- Los registros A/CNAME que apunten a Firebase deben estar en **modo «DNS only» (nube GRIS)**,
  **no «Proxied» (nube naranja)**.
- Si dejas la nube naranja, el proxy de Cloudflare se pone delante de Firebase y **rompe la emisión
  del certificado gestionado por Firebase** (validación ACME) y provoca bucles de redirección
  HTTPS. Firebase necesita servir su propio certificado y sus propias redirecciones.

Regla simple: **para conectar el dominio, todos los registros de Firebase van en gris.**

---

## Paso 1 — Añadir el dominio en Firebase (cuenta `pino.espacesverts@gmail.com`)

1. https://console.firebase.google.com/project/pagepino-e8e97/hosting → **Add custom domain**.
2. Escribir `pinoespacesverts.online` → continuar.
3. Firebase muestra los registros exactos: normalmente un **TXT** de verificación y luego uno o
   dos **A**. Copiarlos **tal cual** (no usar IPs de otros tutoriales).
4. Repetir con `www.pinoespacesverts.online` y elegir **Redirect to `pinoespacesverts.online`**
   (una sola versión canónica: el ápex sin `www`).

## Paso 2 — Pegar los registros en Cloudflare DNS

Cloudflare Dashboard → cuenta `Pino.spacesverts@gmail.com` → **`pinoespacesverts.online`** →
**DNS → Records → Add record**:

| Tipo | Nombre (Name) | Valor (Content) | Proxy status |
|------|---------------|-----------------|--------------|
| TXT  | `@`           | el token que muestra Firebase | — (los TXT no se proxean) |
| A    | `@`           | la(s) IP(s) que muestra Firebase | **DNS only (gris)** |
| A o CNAME | `www`    | lo que muestra Firebase para `www` | **DNS only (gris)** |

- **Borrar** cualquier registro A/AAAA/CNAME de `@` o `www` que Cloudflare haya creado por
  defecto (parking / «Your domain is on its way») y que no sea de Firebase.
- **No tocar** registros MX/SPF/DKIM/TXT de correo si algún día configuras email en el dominio.
- Deja el TTL en **Auto**.

## Paso 3 — Autorizar el dominio en Firebase Auth

Firebase Console → **Authentication → Settings → Authorized domains** → añadir:

- `pinoespacesverts.online`
- `www.pinoespacesverts.online`

Sin esto, **el login con Google falla** en el dominio nuevo. (No hace falta tocar `authDomain`:
sigue siendo `pagepino-e8e97.firebaseapp.com`, que gestiona el redirect de OAuth.)

## Paso 4 — Esperar a «Connected»

Firebase valida el DNS y **emite el certificado HTTPS** automáticamente (de minutos hasta 24 h).
El panel de Hosting pasará el dominio a **Connected** con el candado activo.

## Paso 5 — Publicar con el dominio como canónico

Cuando Firebase marque **Connected** y `https://pinoespacesverts.online` cargue con candado:

```bash
pnpm domain:connect pinoespacesverts.online
```

El script comprueba DNS + certificado HTTPS y **republica** con canonical, sitemap, Open Graph y
enlaces de e-mails apuntando a `https://pinoespacesverts.online`.

> **Requiere acceso de despliegue:** la cuenta activa de Firebase CLI debe tener acceso a
> `pagepino-e8e97`. Si sale `403` / «no tiene acceso», inicia sesión con la cuenta propietaria:
> `firebase login:add` → `firebase login:use pino.espacesverts@gmail.com`, y reintenta.
> (El default de `SITE_URL` ya es `.online`, así que un `pnpm deploy:production` normal también
> lo usa; `domain:connect` añade la verificación previa de DNS/HTTPS.)

---

## Rollback (volver al dominio gratuito)

El dominio gratuito `pagepino-e8e97.web.app` **nunca deja de funcionar**. Para revertir:

1. En Cloudflare DNS, borra (o repunta) los registros A/`www` de Firebase para
   `pinoespacesverts.online`.
2. Vuelve a publicar en el dominio gratuito:
   ```bash
   PINO_SITE_URL=https://pagepino-e8e97.web.app pnpm deploy:production
   ```

---

## Avanzado (opcional, más adelante)

Si algún día quieres poner Cloudflare **delante** de Firebase (CDN/WAF/analytics de Cloudflare),
tendrás que: activar la nube naranja **solo entonces**, poner **SSL/TLS → Full (strict)** en
Cloudflare, y validar que las redirecciones `www → ápex` no entren en bucle. No es necesario para
publicar y añade complejidad; por defecto, deja todo en **DNS only**.
