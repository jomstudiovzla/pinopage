# Estado Actual del Proyecto (PINO Page)

- **Cliente activo**: Antigravity IDE
- **Modelo activo**: Gemini 3.8 Flash (High)
- **Repositorio remoto**: [https://github.com/jomstudiovzla/pinopage](https://github.com/jomstudiovzla/pinopage)
- **URL pública (GitHub Pages)**: [https://jomstudiovzla.github.io/pinopage/](https://jomstudiovzla.github.io/pinopage/)
- **Rama principal**: `main`
- **Estado del build v1**: `built` (HTTP 200 OK) — Con Google Cloud Firestore (`crm-jom`) conectado en vivo, reglas desplegadas, colecciones `pino_users` y `pino_sessions`, y visor de consola Firebase directo.
- **Estado v2**: **especificación completa (Hito 0)**.
- **Localhost**: `http://127.0.0.1:8080/` (`python3 -m http.server 8080`)

## Base de Datos en Vivo & Consola Firebase

- **Proyecto Firebase**: `crm-jom` (Proyecto 268171106185)
- **Consola Firestore Colección Usuarios**: [https://console.firebase.google.com/project/crm-jom/firestore/databases/-default-/data/pino_users](https://console.firebase.google.com/project/crm-jom/firestore/databases/-default-/data/pino_users)
- **Consola Firestore Colección Sesiones**: [https://console.firebase.google.com/project/crm-jom/firestore/databases/-default-/data/pino_sessions](https://console.firebase.google.com/project/crm-jom/firestore/databases/-default-/data/pino_sessions)
- **Consola Firestore Colección Cupones**: [https://console.firebase.google.com/project/crm-jom/firestore/databases/-default-/data/pino_coupons](https://console.firebase.google.com/project/crm-jom/firestore/databases/-default-/data/pino_coupons)

## Qué hay en el disco

### v1 (producción en vivo)
- Landing `index.html`, PWA, assets reales, chatbot, legales FR, coupon PELABOLA, Firebase `crm-jom`.
- `firestore.rules` & `firebase.json`: Reglas desplegadas y activas para lectura y escritura directa de `pino_users`, `pino_sessions`, `pino_coupons` y `leads`.
- **Nuevo**: Sistema integral de Autenticación & Base de Datos en `index.html`:
  - **Selector de Cuentas Google**: Ventana modal OAuth que permite iniciar sesión con 1 clic como Andrés Pino (`pino.spacesverts@gmail.com`), Marc Dubois, Sophie Dupont o cualquier otra cuenta de Google personalizada.
  - **Sincronización Cloud Real**: Cada inicio de sesión y registro se persiste en tiempo real en la colección `pino_users` y genera un registro de auditoría en `pino_sessions` con IP, dispositivo y fecha/hora.
  - **Panel de Control de Base de Datos en God Mode**: Pestaña « Utilisateurs & Base » con visor en vivo de cuentas y visor de sesiones activas, más botón directo a la consola de Google Firebase.
  - **Gestos Táctiles y de Ratón (Drag-down to Close)**: Arrastre suave hacia abajo en cabeceras verdes para cerrar modales.
  - **Botón `✕` Único**: Eliminación de todo texto `Fermer [ESC]`.

### v2 (gobernanza, 2026-09-15)
- `DOCUMENTO_MAESTRO.md` — requerimientos + arquitectura Francia (fusión voice note + Andrés + código vivo + correcciones RGPD/Supabase 2026)
- `tareas.md`, `plan_implementacion.md`, `AGENTS.md`
- `docs/sql/001_initial_schema.sql`
- `docs/adr/0001` … `0004`
- Nota de voz del cliente: `indicaciones del cliente /WhatsApp Audio 2026-08-27 at 12.56.00.opus`

## Siguiente acción (Hito 1)
Crear proyecto Supabase **West EU (Paris) `eu-west-3`**, aplicar el SQL, DPA, exportar `pino_coupons`. No rediseñar la landing.
