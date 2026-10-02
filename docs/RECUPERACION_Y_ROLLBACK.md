# Recuperación y rollback — Pino Espaces Verts

Qué hacer cuando algo va mal. El principio general: **el dominio gratuito
`https://pagepino-e8e97.web.app` nunca deja de funcionar**, así que siempre hay una vía de
recuperación.

---

## 1. Volver al dominio fallback

Si `pinoespacesverts.online` falla (DNS, certificado, redirección), el sitio sigue vivo en:

```
https://pagepino-e8e97.web.app
```

Para republicar con ese dominio como canónico mientras diagnosticas:

```bash
PINO_SITE_URL=https://pagepino-e8e97.web.app pnpm deploy:production
```

## 2. Restaurar un despliegue anterior de Firebase Hosting

Firebase guarda el historial de releases:

1. Firebase Console → Hosting → pestaña **Release history**.
2. Localiza la versión buena anterior → menú **⋮** → **Rollback**.
3. Firebase vuelve a servir esa versión al instante, sin tocar el código.

## 3. Revertir un cambio en el código (Git)

```bash
git log --oneline -10          # localizar el commit
git revert <hash>              # crea un commit que deshace ese cambio
# luego: pnpm build && pnpm deploy:production
```

No uses `git reset --hard` sobre ramas ya empujadas.

## 4. Deshacer un cambio de DNS en Cloudflare

1. Cloudflare → `pinoespacesverts.online` → DNS → Records.
2. Elimina o corrige los registros A/TXT/`www` de Firebase que causaron el problema.
3. Vuelve a pegar exactamente los que muestra Firebase Console (Hosting → dominio → **View DNS
   records**).

## 5. Certificado SSL no se emite / "Needs setup" persistente

Causas más comunes, en orden:

1. **Nube naranja (Proxied) en Cloudflare.** Es la causa #1. Pon los registros de Firebase en
   **"DNS only" (nube gris)**. El proxy de Cloudflare rompe la validación ACME y la emisión del
   certificado de Firebase.
2. Registros A/TXT que **no coinciden** con los que pide Firebase. Compáralos carácter a carácter.
3. Propagación DNS: puede tardar hasta 24 h. Comprueba con `dig +short A pinoespacesverts.online`.

No hagas cambios aleatorios: corrige el registro y espera. Reintenta:

```bash
pnpm domain:connect pinoespacesverts.online
```

## 6. Bucle de redirección (ERR_TOO_MANY_REDIRECTS)

Casi siempre es Cloudflare en modo **Proxied** con SSL/TLS en "Flexible" delante de Firebase
(que fuerza HTTPS). Solución: **DNS only (gris)**. Si algún día quieres proxy, usa SSL/TLS
**Full (strict)**.

## 7. Google Sign-In deja de funcionar tras conectar el dominio

Síntoma: error `auth/unauthorized-domain` en la consola del navegador.

1. Firebase Console → Authentication → Settings → **Authorized domains**.
2. Verifica que estén `pinoespacesverts.online` y `www.pinoespacesverts.online`.
3. No cambies `authDomain` en el código; sigue siendo `pagepino-e8e97.firebaseapp.com`.

## 8. Deploy falla con `403` / sin acceso al proyecto

La cuenta de Firebase CLI activa no tiene acceso a `pagepino-e8e97`:

```bash
firebase login:list
firebase login:use pino.espacesverts@gmail.com
firebase projects:list        # debe listar pagepino-e8e97
```

Si aun con la cuenta propietaria falla, revisa en Firebase Console → Project settings → Users and
permissions que esa cuenta tenga rol de despliegue.

---

## Qué NO borrar nunca en Cloudflare

Al tocar el DNS, **no elimines** registros de correo ni verificaciones de terceros aunque solo
estés conectando la web:

- `MX`
- `TXT` de `SPF`, `DKIM`, `DMARC`
- Registros de **Exchange** / correo (la captura del panel mostraba un aviso de Exchange)
- Verificaciones de otros servicios (Google, Microsoft, etc.)

Borra únicamente los registros de **parking** (`@`/`www`) que Cloudflare crea por defecto y que
choquen con los que pide Firebase.
