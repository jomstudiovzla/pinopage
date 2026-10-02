# Google login multi-dispositivo (FASE 3)

**Estado 2026-10-02:** popup en escritorio, redirect en móvil/tablet/PWA/in-app.
`getRedirectResult` se consume una sola vez (singleton) **antes** de pintar la sesión.

El fallo que corrige esta fase: el cliente llamaba siempre a `signInWithPopup` en el mismo clic.
Safari iOS cierra esa ventana como `auth/popup-closed-by-user` (no `popup-blocked`), así que
nunca se pasaba a redirect y el usuario solo veía un toast.

## Comportamiento

| Entorno | Camino |
|---------|--------|
| Escritorio (ratón / trackpad, viewport ancho) | `signInWithPopup` |
| Popup bloqueado o no soportado | repli `signInWithRedirect` |
| Teléfono, tablet, iPadOS, PWA táctil, in-app (Instagram, Facebook, TikTok…) | `signInWithRedirect` de entrada |

Detección por capacidades (`pointer: coarse`, `maxTouchPoints`, lado corto ≤ 900, `display-mode: standalone`)
más UA móvil / `userAgentData.mobile`. Persistencia Firebase: `LOCAL` (ya en `firebase-config.js`).

Al volver del redirect:

1. Se lee `sessionStorage.pino_auth_redirect_pending` **antes** de borrarlo.
2. `pinoConsumeRedirectResult()` (promesa única) llama a `getRedirectResult`.
3. `processAuthenticatedUser(..., { openModal: true })` abre el espacio cliente/admin.
4. `onAuthStateChanged` espera esa promesa para no duplicar perfil ni e-mail de login.
5. El chip de sesión del header (`#nav-session-chip` / `#mobile-session-chip`) se pinta con `updateAuthUI`.

Gmail API (`pinoObtainGmailToken`, scope `gmail.send`) es **otro** popup, solo para el drenaje admin de correo. No mezclarlo con el login cliente.

## Consola Firebase

Authentication → Settings → Authorized domains (comprobado 2026-10-02 vía `accounts:createAuthUri`):

- `pinoespacesverts.online`
- `www.pinoespacesverts.online`
- `pagepino-e8e97.web.app`
- `pagepino-e8e97.firebaseapp.com`
- `localhost`

`authDomain` del SDK permanece `pagepino-e8e97.firebaseapp.com`.

Redirect URI de Firebase Auth:

```
https://pagepino-e8e97.firebaseapp.com/__/auth/handler
```

Authentication → Sign-in method → Google: habilitado. El Client ID web vive en Google Cloud
(el secreto **no** va en el cliente; si se pegó en un chat, rotarlo).

## Google Cloud Console

APIs y servicios → Credenciales → cliente OAuth 2.0 web:

**Orígenes JavaScript autorizados**

- `https://pinoespacesverts.online`
- `https://www.pinoespacesverts.online`
- `https://pagepino-e8e97.web.app`
- `https://pagepino-e8e97.firebaseapp.com`
- `http://localhost:5500`

**URI de redirección autorizados**

- `https://pagepino-e8e97.firebaseapp.com/__/auth/handler`
- `https://pinoespacesverts.online/__/auth/handler` (opcional, por si se cambia `authDomain` más adelante)

COOP de Hosting: `same-origin-allow-popups` (necesario para el popup de escritorio). No pasar a `same-origin`.

## Matriz de pruebas

| Dispositivo | Navegador | Esperado |
|-------------|-----------|----------|
| Escritorio | Chrome | popup Google → sesión + chip header |
| Escritorio | Firefox | popup, o redirect si el popup está bloqueado |
| Android | Chrome | redirect → vuelta al sitio → espacio cliente |
| iPhone | Safari | redirect (nunca popup) |
| iPad | Safari | redirect |
| PWA instalada | standalone | redirect |
| In-app (Instagram / Facebook) | WebView | toast «ouvrez dans Safari ou Chrome» + redirect |

Errores FR (mapper `pino-auth-errors.js`, contexto `google` / `apple`):

- `auth/popup-closed-by-user`, `cancelled-popup-request`, `redirect-cancelled-by-user` → silencio
- `auth/popup-blocked` → pop-ups + redirect
- `auth/unauthorized-domain` → abrir `https://pinoespacesverts.online`
- `auth/operation-not-allowed` → Google/Apple no disponible, usar e-mail
- `auth/account-exists-with-different-credential` → usar el modo de origen y vincular
- `auth/network-request-failed` → red

## Deploy y verificación

```bash
PINO_SITE_URL=https://pinoespacesverts.online pnpm build
bash scripts/cleanup-preprod.sh
# Hosting only (Spark): firebase.static.json sin rewrite /api
firebase deploy --only hosting --project pagepino-e8e97 \
  --account pino.spacesverts@gmail.com --config firebase.static.json
DOMAIN=https://pinoespacesverts.online bash scripts/verify-production.sh
```

Comprobar en vivo (sin crear cuentas de prueba):

- HTML incluye `pino-auth-google.js` y `pinoConsumeRedirectResult`
- SW `pino-ev-v46-errors` (bump FASE 6 couche erreurs ; Google OAuth inchangé)
- En DevTools escritorio: `pinoShouldUseRedirectAuth()` → `false`
- En DevTools iPhone: `pinoShouldUseRedirectAuth()` → `true`

FASE 4 (branding OAuth): URLs públicas y guía de consola en
`docs/auth/OAUTH_CONSENT_SCREEN.md`. Privacy:
`https://pinoespacesverts.online/politique-de-confidentialite`. CGV:
`https://pinoespacesverts.online/conditions-generales`. El App name / logo se
pegan en Google Auth Platform → Branding (cuenta del proyecto).
