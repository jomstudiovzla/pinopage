# Estado actual — Pino Espaces Verts v1 (Production Ready - Firebase Hosting)

> Solo se marca ✅ lo verificado con un test ejecutable o una comprobación técnica.
> Última actualización: 2026-09-25.

---

## 🌐 Orquestación de Dominio: `pinoespacesverts.fr` en Firebase Hosting

| Parámetro | Configuración Oficial | Estado |
|---|---|---|
| **Dominio Principal** | `https://pinoespacesverts.fr` | ⏳ Registros DNS pendientes en el registrador (ver `docs/ORQUESTACION_FIREBASE_DOMINIO.md`) |
| **Subdominio Redirección** | `https://www.pinoespacesverts.fr` | ⏳ CNAME configurado para apuntar a `pinoespacesverts.fr` |
| **Hosting Definitivo** | Firebase Hosting (`pagepino-e8e97`, sirve `dist/`) | ✅ Preparado, hermético, rewrites `/api/**` a Cloud Functions |
| **Auth Domain Dinámico** | `authDomain: window.location.hostname` (`pinoespacesverts.fr`) | ✅ Configurado para evitar bloqueo de cookies 3rd-party en Safari / Chrome |
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

1. **Resolver `ERR_NAME_NOT_RESOLVED` en el Registrador de Dominio**:
   - En la Zona DNS del registrador donde compró `pinoespacesverts.fr`:
     - Agregar registro **A**: `@` apuntando a `199.36.158.100`
     - Agregar registro **CNAME**: `www` apuntando a `pinoespacesverts.fr.`
     - Agregar registro **TXT**: El token que proporcione Firebase Console en Hosting.
2. **Conectar el Dominio en Firebase Console**:
   - Firebase Console → Proyecto `pagepino-e8e97` → Hosting → "Agregar dominio personalizado".
   - Añadir `pinoespacesverts.fr` con redirección de `www`.
3. **Autorizar Dominios en Firebase Auth**:
   - Firebase Console → Authentication → Settings → Authorized domains → Añadir `pinoespacesverts.fr` y `www.pinoespacesverts.fr`.
4. **Habilitar Permiso de Despliegue en CLI**:
   - En Firebase Console → Project settings → Users and permissions:
   - Añadir `jomstudiovzla@gmail.com` con rol **Editor** (o iniciar sesión con `pino.espacesverts@gmail.com` con `npx firebase login`).
