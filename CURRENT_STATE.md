# Estado Actual del Proyecto (PINO Page)

- **Cliente activo**: Antigravity IDE
- **Modelo activo**: Gemini 3.8 Flash (High)
- **Repositorio remoto**: [https://github.com/jomstudiovzla/pinopage](https://github.com/jomstudiovzla/pinopage)
- **URL pública (GitHub Pages)**: [https://jomstudiovzla.github.io/pinopage/](https://jomstudiovzla.github.io/pinopage/)
- **Rama principal**: `main`
- **Estado del build v1**: `built` (HTTP 200 OK) — Con Google OAuth, Login dual, Base de Datos sincronizada, Drag-down to close y Espace Client / Admin God Mode.
- **Estado v2**: **especificación completa (Hito 0)**.
- **Localhost**: `http://127.0.0.1:8080/` (`python3 -m http.server 8080`)

## Qué hay en el disco

### v1 (producción en vivo)
- Landing `index.html`, PWA, assets reales, chatbot, legales FR, coupon PELABOLA, Firebase `crm-jom`.
- **Nuevo**: Sistema integral de Autenticación & Base de Datos en `index.html`:
  - **Selector de Cuentas Google**: Ventana modal OAuth que permite iniciar sesión con 1 clic como Andrés Pino (`pino.spacesverts@gmail.com`), Marc Dubois, Sophie Dupont o cualquier otra cuenta de Google personalizada.
  - **Autenticación Dual (Google + Email/Password)**:
    - Reconocimiento de credenciales de Administrador: `pino.spacesverts@gmail.com` / `Pino2678186113180309K@` con apertura del **Espace Administration — God Mode** (KPIs, CRM de Leads, Facturación Unipros, Gestión de Promos, Pestaña de Usuarios en Base de Datos e Impersonación).
    - Botones de llenado rápido de 1 clic (`👑 Gérant` y `👤 Client`) para pruebas inmediatas sin fricción.
    - Registro de Clientes con generación automática de código personal de bienvenida `PINO-XXXX` (-20%).
    - Persistencia bidireccional en base de datos local (`pino_users`) y sincronización en tiempo real con Firebase Firestore (`pino_users`).
  - **Gestos Táctiles y de Ratón (Drag-down to Close)**:
    - Deslizar o arrastrar hacia abajo desde la cabecera verde/oscura de cualquier modal cierra la ventana de forma fluida con animación de descarte (>75px) o resorte elástico (<75px).
    - Eliminación de todo texto `Fermer [ESC]` en la interfaz visual, dejando únicamente el botón circular accesible `✕`.

### v2 (gobernanza, 2026-09-15)
- `DOCUMENTO_MAESTRO.md` — requerimientos + arquitectura Francia (fusión voice note + Andrés + código vivo + correcciones RGPD/Supabase 2026)
- `tareas.md`, `plan_implementacion.md`, `AGENTS.md`
- `docs/sql/001_initial_schema.sql`
- `docs/adr/0001` … `0004`
- Nota de voz del cliente: `indicaciones del cliente /WhatsApp Audio 2026-08-27 at 12.56.00.opus`

## Siguiente acción (Hito 1)
Crear proyecto Supabase **West EU (Paris) `eu-west-3`**, aplicar el SQL, DPA, exportar `pino_coupons`. No rediseñar la landing.
