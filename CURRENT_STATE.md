# Estado Actual del Proyecto (PINO Page)

- **Cliente activo**: Antigravity IDE (Gemini 3.8 Flash)
- **Repositorio remoto**: [https://github.com/jomstudiovzla/pinopage](https://github.com/jomstudiovzla/pinopage)
- **URL pública (GitHub Pages)**: [https://jomstudiovzla.github.io/pinopage/](https://jomstudiovzla.github.io/pinopage/)
- **Rama principal**: `main`
- **Localhost**: `http://127.0.0.1:8080/`
- **Backend activo**: **Firebase (pagepino-e8e97)**
  - Realtime Database: `https://pagepino-e8e97-default-rtdb.europe-west1.firebasedatabase.app`
  - Autenticación: Google Auth (Popup/Redirect) + Email/Password

## ✅ Completado (15-Sep-2026)

### Transición a Firebase Realtime Database
- [x] Creado `assets/js/firebase-config.js` con el proyecto `pagepino-e8e97` y endpoint `europe-west1`.
- [x] Inyectados SDKs de Firebase Compat v10 (App, Auth, Database) en `index.html`.
- [x] Adaptado `pino-db.js` para persistencia en Firebase Realtime Database:
  - `/leads`: Guardado y lectura en tiempo real de presupuestos.
  - `/users`: Perfiles de usuarios con detección de admin (`pino.spacesverts@gmail.com`).
  - `/jobs`: CRM de trabajos realizados con cálculo de montos y horas.
  - `/coupons`: Cupones de descuento 1:1 (`PELABOLA`).
  - `/audit_logs`: Registro de sesiones y accesos.
- [x] Autenticación con Google vía `signInWithPopup` (evita los problemas de redirección).
- [x] Panel de Travaux CRM completo con exportes PDF (`jsPDF`) y Excel/CSV.

## ⏳ Pendiente inmediato
- [ ] Pegar la **Clave de API web (apiKey)** de Firebase Console en `assets/js/firebase-config.js`.
