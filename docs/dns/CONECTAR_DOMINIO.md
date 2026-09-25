# Conectar `pinoespacesverts.fr` a Firebase Hosting

Estado 2026-09-25: el dominio **no está registrado** (AFNIC: not found) → está libre para comprar.
Mientras tanto la web se publica en `https://pagepino-e8e97.web.app`.

## Paso 1 — Comprar el dominio (Andrés, ~7–12 €/año)

- Registrador: OVHcloud, Gandi o IONOS (cualquiera que venda `.fr`).
- Titular: **Andrés Pino / Pino Espaces Verts**, correo `pino.espacesverts@gmail.com` (dirección en la UE, obligatorio para `.fr`).
- No contratar hosting ni web del registrador: solo el dominio.
- Activar renovación automática.

## Paso 2 — Añadirlo en Firebase (cuenta `pino.espacesverts@gmail.com`)

1. https://console.firebase.google.com/project/pagepino-e8e97/hosting → **Add custom domain**.
2. Escribir `pinoespacesverts.fr` → continuar.
3. Firebase muestra los registros exactos (normalmente un **TXT** de verificación y uno o dos **A**).
   Copiarlos tal cual; no usar IPs de otros tutoriales.
4. Repetir con `www.pinoespacesverts.fr` y elegir **Redirect to `pinoespacesverts.fr`**.

## Paso 3 — Pegar los registros en el registrador

Panel DNS del registrador → zona `pinoespacesverts.fr`:

| Tipo | Nombre | Valor |
|------|--------|-------|
| TXT | `@` | el que muestra Firebase |
| A | `@` | la(s) IP(s) que muestra Firebase |
| A / CNAME | `www` | lo que muestra Firebase para `www` |

- Borrar solo los registros **A/AAAA/CNAME de `@` y `www`** que el registrador crea por defecto (página de aparcamiento).
- **No tocar MX, SPF, DKIM** si se contrata correo en ese dominio.

## Paso 4 — Firebase Auth

Firebase Console → Authentication → Settings → **Authorized domains** → añadir
`pinoespacesverts.fr` y `www.pinoespacesverts.fr` (sin esto falla el login con Google).

## Paso 5 — Publicar con el dominio (automático)

Cuando Firebase marque el dominio como **Connected** (minutos a 24 h):

```bash
pnpm domain:connect pinoespacesverts.fr
```

Comprueba DNS y certificado HTTPS y republica con canonical, sitemap, Open Graph y
enlaces de e-mails apuntando a `https://pinoespacesverts.fr`.
Después, cambiar el valor por defecto de `SITE_URL` en `scripts/build.mjs` para que
los siguientes despliegues lo mantengan.

## Rollback

Borrar los registros A/TXT en el registrador y `pnpm deploy:production`
(vuelve a `pagepino-e8e97.web.app`, que nunca deja de funcionar).
