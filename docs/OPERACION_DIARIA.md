# Operación diaria — Pino Espaces Verts

Guía práctica para el propietario. Arquitectura real: **sitio estático + PWA**, alojado en
**Firebase Hosting** (`pagepino-e8e97`), con **Firebase Auth + Realtime Database + Cloud
Functions**. Dominio `pinoespacesverts.online` gestionado en **Cloudflare DNS**. Repli permanente:
`https://pagepino-e8e97.web.app`.

> Regla de oro: nunca subas contraseñas, claves ni `.env` a Git. Ya están protegidos en
> `.gitignore`; no los quites de ahí.

---

## 1. Editar textos e imágenes

- **Contenido de la web:** vive en `index.html` (página principal) y en `public/legal/*.html`
  (mentions légales, CGV, RGPD, médiation, cookies).
- **Imágenes:** `assets/images/…` y `assets/logo/…`. Para reemplazar una foto, sustituye el
  archivo conservando el mismo nombre, o cambia la referencia en el HTML.
- **Número de WhatsApp / contacto:** busca el número o el email actual en `index.html` y
  reemplázalo. El email oficial mostrado es `pino.espacesverts@gmail.com`.
- Tras editar clases de Tailwind: `pnpm build:css`.

## 2. Ver los cambios en local

```bash
pnpm dev        # http://localhost:5500
```

## 3. Publicar (deploy a producción)

```bash
pnpm build              # genera dist/ con la URL canónica pinoespacesverts.online
pnpm deploy:production  # publica dist/ en Firebase Hosting
```

- El deploy **necesita** que la Firebase CLI esté con la cuenta correcta (ver punto 6).
- El build ya reescribe canonical, sitemap, robots, manifest y Open Graph al dominio `.online`.

## 4. Verificar producción (solo lectura)

```bash
pnpm verify:production   # comprueba dominio, HTTPS y rutas clave
pnpm audit:live          # lo que ve un visitante anónimo (GET, no escribe nada)
```

Antes de que el dominio esté conectado, audita el repli:

```bash
DOMAIN=https://pagepino-e8e97.web.app pnpm verify:production
node scripts/audit-live.mjs https://pagepino-e8e97.web.app/
```

> ⚠️ Nunca hagas escrituras de prueba contra la base de datos de producción. Las auditorías
> son de solo lectura por diseño.

## 5. Ejecutar tests

```bash
pnpm test        # reglas RTDB + API + E2E (usa el emulador Firebase, proyecto demo-pino)
pnpm test:rules  # solo reglas de seguridad de la base de datos
```

## 6. Saber / cambiar la cuenta de Firebase CLI

```bash
firebase login:list                               # qué cuentas hay
firebase login:add                                # añadir la cuenta propietaria
firebase login:use pino.espacesverts@gmail.com    # usarla por defecto
firebase projects:list                            # debe aparecer pagepino-e8e97
```

Si `firebase projects:list` **no** muestra `pagepino-e8e97`, esa cuenta no tiene acceso y el
deploy fallará con `403`. Solución: usar la cuenta propietaria del proyecto.

## 7. Cambiar de dominio en el futuro

Una sola palanca: `SITE_URL` en `scripts/build.mjs` (o la variable `PINO_SITE_URL` por despliegue).

```bash
PINO_SITE_URL=https://nuevo-dominio.tld pnpm deploy:production
```

El repli `pagepino-e8e97.web.app` sigue funcionando siempre.

## 8. Mantener GitHub privado y controlado

- El repositorio debe ser **privado** en GitHub (Settings → General → Danger Zone → Change
  visibility).
- Revisa colaboradores en Settings → Collaborators (que solo esté quien debe).
- Protege `main`: Settings → Branches → Add rule → requerir Pull Request, bloquear force-push y
  borrado de rama.
- Activa Secret scanning y Push protection (Settings → Code security).

## 9. Pausar funcionalidades sin romper producción

- **Apple Sign-In:** ya está oculto tras `PINO_FLAGS.appleLogin` (en `assets/js/firebase-config.js`).
- Para pausar cualquier flujo, prefiere una bandera en el código + redeploy, nunca editar
  producción a mano.

---

Ver también: `docs/dns/CONECTAR_DOMINIO.md` (conectar el dominio) y
`docs/RECUPERACION_Y_ROLLBACK.md` (volver atrás si algo falla).
