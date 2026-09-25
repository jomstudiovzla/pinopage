# Estado actual — Pino Espaces Verts v1

> Solo se marca ✅ lo verificado con un test ejecutable o una comprobación en vivo.
> Histórico anterior (con afirmaciones no verificadas): `git show 9d9ee75:CURRENT_STATE.md`.
> Última actualización: 2026-09-25.

## Stack real

| Pieza | Valor |
|---|---|
| Frontend | `index.html` estático + PWA (`sw.js`, `manifest.json`) |
| Auth | Firebase Auth `pagepino-e8e97` — Google (activo), e-mail/contraseña (activo), Apple (**no activado** en Firebase → botón oculto) |
| Datos | Firebase Realtime Database `europe-west1` — reglas en `database.rules.json` |
| Supabase | No se carga en v1. Reservado para v2 |
| Hosting | GitHub Pages `jomstudiovzla.github.io/pinopage` (dominio definitivo pendiente) |
| Correos | Verificación y reseteo de contraseña: Firebase Auth. Transaccionales (devis, avisos): Gmail API (token de Andrés) + Web3Forms + FormSubmit |

## Verificación automatizada

| Suite | Comando | Resultado 2026-09-25 |
|---|---|---|
| Reglas RTDB contra emulador (43 casos) | `pnpm test:rules` | ✅ 43/43 |
| E2E navegador real (Chromium escritorio + WebKit iPhone 13 + CSP real) | `pnpm test:e2e` | ✅ 45 pasados, 1 omitido (popup IdP del emulador en WebKit headless) |
| Auditoría estática (11 checks) | `pnpm audit:static` | ✅ 11/11 |
| Auditoría producción, solo lectura | `pnpm audit:live` | ❌ hasta desplegar las reglas (ver abajo) |

## Estado por punto (PNO-MASTER-1.0)

| ID | Estado | Detalle |
|---|---|---|
| P0-01 Reglas desplegadas | ⛔ **Bloqueado: despliegue** | Reglas nuevas escritas y probadas (43/43). **Producción sigue abierta en lectura y escritura** hasta `pnpm deploy:rules` con la cuenta propietaria del proyecto |
| P0-02 Contraseña admin de respaldo | ✅ | Eliminada. E2E: e-mail admin + cualquier contraseña → error, sin sesión |
| P0-03 Panel Apple simulado | ✅ | Eliminado. Solo `signInWithPopup('apple.com')` tras flag |
| P0-04 Registro falso local | ✅ | Eliminado. E2E: Firebase caído → error, 0 usuario local |
| P0-05 `email_verified` obligatorio | ✅ | Reglas + front. E2E: registro → sin sesión hasta clic en el enlace |
| P0-06 Cupones validados en servidor | ✅ (reglas) | Sin Cloud Functions: las reglas RTDB imponen titular, −20 % fijo, una sola vez, formato `PINO-XXXX`; solo admin marca «used». E2E: `−90 %` desde consola → rechazado. El cálculo SAP es una estimación de pantalla; el importe facturado solo lo escribe el admin |
| P0-07 Correo de verificación fiable | ✅ parcial | Verificación y reseteo por Firebase Auth. Migrar transaccionales a Brevo/Resend requiere backend + cuenta (pendiente de decisión) |
| P1-01 Google en iPhone | ✅ código / ⏳ dispositivo real | Popup abierto en el mismo tick del clic (antes se hacía un PKCE inútil y Safari bloqueaba el popup). CSP ahora permite el iframe de `pagepino-e8e97.firebaseapp.com`. Prueba en iPhone real pendiente. Arreglo definitivo del redirect: dominio propio en Firebase Hosting + `authDomain` = ese dominio |
| P1-02 Apple | ✅ oculto | `PINO_FLAGS.appleLogin=false`. Activar requiere Apple Developer (99 $/año) + Service ID + clave `.p8` |
| P1-03 Contraseña olvidada | ✅ | E2E: e-mail de reseteo emitido; dirección desconocida → aviso |
| P1-04 Sesión = Firebase | ✅ | E2E: borrar localStorage → sesión sigue; sesión admin falsificada en localStorage → borrada, 0 datos |
| P1-05 APIs server-side | ✅ n/a | El cliente ya no llama a `/api/*` (no existe en hosting estático). `serve.py` = servidor estático de desarrollo |
| P1-06 Datos demo | ✅ | Eliminados (4 leads, 2 trabajos, 6 leads de plataforma) + purga de cachés locales |
| P1-07 Transaccionales Brevo/Resend | ⏳ decisión | Ver «Pendiente» |
| P1-08 localhost | ✅ | 0 redirecciones `:5500/:8080`, CSP sin localhost. Emulador solo con `?emulator=1` en localhost |
| P1-09 E2E reales | ✅ | 21 flujos × 2 navegadores + 4 checks CSP/PWA |
| P1-10 CSP + Maps | ✅ | Mapa cargado, 0 violaciones, sin `unsafe-eval`. `unsafe-inline` se mantiene (toda la app es JS inline: se elimina en v2) |
| P1-11 PWA | ✅ | Iconos 192/512/maskable con tamaño real, SW solo mismo origen (nunca cachea Firebase), banner sin conexión |
| P2-01 Tailwind local | ✅ | `pnpm build:css`, 12 KB gzip, render idéntico al CDN (diff de captura) |
| P2-03 Docs | ✅ | Este archivo, `AGENTS.md`, `README.md` |
| P2-04 Supabase | ✅ | Archivado para v2, no cargado en v1 |
| P2-05/06/07/09/10 | ⏳ | Rate-limit/Turnstile, 2FA admin, GA4, backups, feature flags remotos: no iniciados |

## Incidencias

- **2026-09-25 — Base de producción abierta**: `/users`, `/leads`, `/clients_records`, `/coupons`, etc. legibles **y modificables** sin sesión (las reglas del repo nunca se desplegaron). Contiene datos personales reales → evaluar notificación a la CNIL (RGPD art. 33, 72 h) una vez cerradas las reglas.
- **2026-09-25 — `/audit_logs` borrado en producción** por una sonda de escritura del script de auditoría (error del agente; el script ya es solo lectura). Solo contenía registros de conexión. Sin backup disponible.

## Checklist de puesta en producción (dominio definitivo)

1. `firebase login:add` con la cuenta propietaria de `pagepino-e8e97` → `pnpm deploy:rules` → `pnpm audit:live` en verde.
2. Firebase → Authentication → Settings → Authorized domains: añadir el dominio (y `www.`).
3. `assets/js/firebase-config.js`: `PINO_PUBLIC_URL` = nuevo dominio. Idealmente Firebase Hosting con el dominio y `authDomain` = dominio propio (login Google fiable en iPhone).
4. `index.html` (`<link rel="canonical">`, JSON-LD) y la CSP `frame-src` si cambia el `authDomain`.
5. Probar en iPhone real: Google, registro + verificación, contraseña olvidada.

## Pendiente de decisión (Andrés / JOM Studio)

- Correos transaccionales: Brevo o Resend + backend (Cloud Functions requiere plan Blaze, o Edge Function de Supabase v2). Hoy el envío depende del token Gmail de Andrés (expira ~45 min) y de FormSubmit.
- Apple Sign-In: activar (cuenta Apple Developer) o mantener oculto.
- `pino.spacesverts@gmail.com` retirado de la lista admin (errata según el documento maestro). Si es una cuenta legítima de Andrés, volver a añadirla en `database.rules.json` **y** `ADMIN_EMAILS`.
