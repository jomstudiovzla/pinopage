# Estado Actual del Proyecto (PINO Page)

- **Cliente activo**: Antigravity IDE
- **Modelo activo**: Gemini 3.8 Flash (High)
- **Repositorio remoto**: [https://github.com/jomstudiovzla/pinopage](https://github.com/jomstudiovzla/pinopage)
- **URL pública (GitHub Pages)**: [https://jomstudiovzla.github.io/pinopage/](https://jomstudiovzla.github.io/pinopage/)
- **Rama principal**: `main`
- **Estado del build v1**: `built` (HTTP 200 OK) — Firebase Authentication (Google OAuth + Email/Pass) real en producción sobre `crm-jom`, reglas Firestore blindadas, sin credenciales en texto plano.
- **Estado v2**: **especificación completa (Hito 0)**.
- **Localhost**: `http://127.0.0.1:8080/` (`python3 -m http.server 8080`)

## Base de Datos en Vivo & Consola Firebase (crm-jom)

- **Consola Firestore — Usuarios (`pino_users`)**: [https://console.firebase.google.com/project/crm-jom/firestore/databases/-default-/data/pino_users](https://console.firebase.google.com/project/crm-jom/firestore/databases/-default-/data/pino_users)
- **Consola Firestore — Sesiones (`pino_sessions`)**: [https://console.firebase.google.com/project/crm-jom/firestore/databases/-default-/data/pino_sessions](https://console.firebase.google.com/project/crm-jom/firestore/databases/-default-/data/pino_sessions)
- **Consola Firebase Auth — Usuarios**: [https://console.firebase.google.com/project/crm-jom/authentication/users](https://console.firebase.google.com/project/crm-jom/authentication/users)

## Qué hay en el disco

### v1 (producción en vivo)
- Landing `index.html`, PWA, assets reales, chatbot, legales FR, coupon PELABOLA, Firebase `crm-jom`.
- `docs/FIREBASE_AUTH_ET_DATABASE.md`: Documento oficial de arquitectura de autenticación y base de datos.
- `firestore.rules`: Reglas de seguridad desplegadas que exigen autenticación (`request.auth != null`) para lectura/escritura de perfiles y sesiones, protegiendo las colecciones de accesos no autorizados.
- **Autenticación Firebase Real (Zero Mock)**:
  - Eliminación absoluta de `#modal-google-selector`, contraseñas en duro y chips de prueba en el cliente.
  - Botón oficial Google que ejecuta `firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider())` abriendo la mire oficial de Google Accounts.
  - Registro y login con Email/Password mediante `firebase.auth().signInWithEmailAndPassword` y `createUserWithEmailAndPassword`.
  - Persistencia de sesión automática con `firebase.auth().onAuthStateChanged(...)`.
  - Vinculación en tiempo real: `pino.spacesverts@gmail.com` certificado por Google obtiene `role: 'admin'`, mientras que cualquier otro usuario obtiene `role: 'client'` con código `PINO-XXXX` generado en Cloud Firestore.

### v2 (gobernanza, 2026-09-15)
- `DOCUMENTO_MAESTRO.md` — requerimientos + arquitectura Francia (fusión voice note + Andrés + código vivo + correcciones RGPD/Supabase 2026)
- `tareas.md`, `plan_implementacion.md`, `AGENTS.md`
- `docs/sql/001_initial_schema.sql`
- `docs/adr/0001` … `0004`
- Nota de voz del cliente: `indicaciones del cliente /WhatsApp Audio 2026-08-27 at 12.56.00.opus`

## Siguiente acción (Hito 1)
Crear proyecto Supabase **West EU (Paris) `eu-west-3`**, aplicar el SQL, DPA, exportar `pino_coupons`. No rediseñar la landing.
