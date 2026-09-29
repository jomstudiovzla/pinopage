# Estado actual — Pino Espaces Verts v1 (Production Ready - Firebase Hosting)

> Solo se marca ✅ lo verificado con un test ejecutable o una comprobación técnica.
> Última actualización: 2026-09-25.

---

## 🌐 Orquestación de Dominio: `pinoespacesverts.online` (Cloudflare) en Firebase Hosting

| Parámetro | Configuración Oficial | Estado |
|---|---|---|
| **Dominio Principal** | `https://pinoespacesverts.online` | ⏳ Registrado en Cloudflare (2026-09-28); pendiente conectar en Firebase Hosting + registros A/TXT en Cloudflare DNS **en modo "DNS only" (gris)**. Guía: `docs/dns/CONECTAR_DOMINIO.md` |
| **Subdominio Redirección** | `https://www.pinoespacesverts.online` | ⏳ Redirección a ápex `pinoespacesverts.online` (se configura al añadir el custom domain en Firebase) |
| **Hosting Definitivo** | Firebase Hosting (`pagepino-e8e97`, sirve `dist/`) | ✅ Preparado, hermético, rewrites `/api/**` a Cloud Functions |
| **URL canónica en build** | `SITE_URL` por defecto = `https://pinoespacesverts.online` (`scripts/build.mjs`) | ✅ El build reescribe todo el bundle; `web.app` queda como repli |
| **Auth Domain** | `authDomain: pagepino-e8e97.firebaseapp.com` (gestiona OAuth) | ✅ Solo falta añadir `.online` + `www` a Firebase Auth → Authorized domains |
| **Backend & Cloud Functions** | `functions/` (Node.js 22, `europe-west1`) | ✅ 7/7 tests de integración PASS (Quotes, Coupons, Tax SAP, Auth, Admin) |
| **Base de Datos** | Firebase Realtime Database `europe-west1` (`pagepino-e8e97-default-rtdb`) | ✅ Reglas en `database.rules.json` (43/43 tests PASS) |
| **CI/CD Pipeline** | GitHub Actions (`.github/workflows/pagepino-pipeline.yml`) | ✅ Tests de reglas, API, E2E y despliegue automatizado |
| **Documentación Guía** | `docs/ORQUESTACION_FIREBASE_DOMINIO.md` | ✅ Diagnóstico DNS `ERR_NAME_NOT_RESOLVED` y guía paso a paso |

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

## 📋 Pasos Inmediatos para el Cliente / Propietario del Proyecto

> Guía detallada con la tabla exacta de registros: **`docs/dns/CONECTAR_DOMINIO.md`**.

1. **Conectar el Dominio en Firebase Console**:
   - Firebase Console → Proyecto `pagepino-e8e97` → Hosting → "Add custom domain".
   - Añadir `pinoespacesverts.online` (+ `www` con redirección al ápex). Copiar los registros **TXT + A** que muestre Firebase.
2. **Pegar los registros en Cloudflare DNS** (el dominio ya está en Cloudflare):
   - Cloudflare → `pinoespacesverts.online` → DNS → Records: pegar el **TXT** y los **A** de Firebase.
   - ⚠️ **Proxy status = "DNS only" (nube gris)**, no "Proxied" (naranja): el proxy rompe el certificado gestionado de Firebase.
   - Borrar los registros de parking (`@`/`www`) que Cloudflare creó por defecto.
3. **Autorizar Dominios en Firebase Auth**:
   - Firebase Console → Authentication → Settings → Authorized domains → Añadir `pinoespacesverts.online` y `www.pinoespacesverts.online`.
4. **Habilitar Permiso de Despliegue en CLI** (bloqueante actual, `403`):
   - Iniciar sesión en la CLI con la cuenta propietaria: `firebase login:add` y `firebase login:use pino.espacesverts@gmail.com`.
5. **Publicar con el dominio** (cuando Firebase marque *Connected* con candado):
   - `pnpm domain:connect pinoespacesverts.online` (verifica DNS + HTTPS y republica con la URL canónica).
