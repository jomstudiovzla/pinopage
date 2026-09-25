# Estado actual — Pino Espaces Verts v1 (Production Ready)

> Solo se marca ✅ lo verificado con un test ejecutable o una comprobación técnica.
> Última actualización: 2026-09-25.

---

## 🏗️ Stack de Producción & Entrega

| Componente | Configuración Real |
|---|---|
| **Frontend de Producción** | Hermético en `dist/` (`index.html`, PWA `sw.js`/`manifest.json`, CSS local, SEO, legales) |
| **Backend & Cloud Functions** | `functions/` (Node.js 22, `europe-west1`) — Endpoints `/api/**` (Health, Quotes, Coupons, Tax SAP, Auth, Admin) |
| **Auth** | Firebase Auth `pagepino-e8e97` (Google + Email/Password verificados, sin cuentas demo ni bypass) |
| **Base de Datos** | Firebase Realtime Database `europe-west1` (`pagepino-e8e97-default-rtdb`) — Reglas en `database.rules.json` |
| **Empaquetado Hostinger** | `pino-espaces-verts-production.zip` (1-click upload con `.htaccess` preconfigurado) |
| **Hosting Definitivo** | Firebase Hosting (`pagepino-e8e97.web.app`) o Hostinger Web Hosting (`dist/` + `.htaccess`) |
| **Documentación** | `docs/DEPLOIEMENT_HOSTINGER_ET_FIREBASE.md` con paso a paso para el cliente |

---

## 🧪 Batería de Verificación Automatizada

| Suite | Comando | Estado | Detalle |
|---|---|---|---|
| **Reglas RTDB** (43 casos) | `pnpm test:rules` | ✅ **43/43 PASS** | Emulador Firebase: 0 lecturas/escrituras anónimas, aislamiento total por usuario |
| **API Backend Functions** (7 casos) | `pnpm test:api` | ✅ **7/7 PASS** | Health, bloqueo de cupones anónimos (401), bloqueo admin (401), cálculo SAP 50% |
| **E2E Playwright** (46 flujos) | `pnpm test:e2e` | ✅ **45 PASS, 1 skip** | Chromium escritorio + WebKit iPhone 13 + CSP real en navegador |
| **Auditoría Estática** (11 checks) | `pnpm audit:static` | ✅ **11/11 PASS** | 0 contraseñas, 0 CDN, 0 localhost en entregable, CSP estricto |
| **Limpieza de Build** (8 filtros) | `pnpm cleanup:preprod` | ✅ **8/8 PASS** | 0 localhost, 0 github.io, 0 console.log, 0 datos demo, 0 mapas en `dist/` |

---

## 📦 Artefactos de Despliegue Generados

1. **`dist/`** : Carpeta lista para Firebase Hosting (`"public": "dist"` en `firebase.json`).
2. **`pino-espaces-verts-production.zip`** : Paquete comprimido autónomo listo para extraer en `public_html` de Hostinger.
3. **`public/.htaccess`** : Archivo de servidor Apache/Hostinger con redirección HTTPS forzada, headers de seguridad OWASP y ruteo SPA.
4. **`functions/`** : Código backend Firebase Cloud Functions con Express, CORS y Firebase Admin SDK.
5. **`docs/DEPLOIEMENT_HOSTINGER_ET_FIREBASE.md`** : Guía detallada en francés para el cliente sobre cómo desplegar en Hostinger y conectar Firebase.

---

## 🚀 Pasos Inmediatos para el Cliente en Hostinger

1. **Subir y extraer `pino-espaces-verts-production.zip`** en la carpeta `public_html` del File Manager de Hostinger.
2. **Autorizar el dominio en Firebase Console** :
   - Firebase Console → Proyecto `pagepino-e8e97` → Authentication → Settings → Authorized domains.
   - Añadir el dominio de Hostinger (ejemplo : `pinoespacesverts.fr` y `www.pinoespacesverts.fr`).
3. **Desplegar las reglas de base de datos** :
   - Con la cuenta propietaria de `pagepino-e8e97` (`pino.espacesverts@gmail.com`), ejecutar `pnpm deploy:rules`.
