# Estado Actual del Proyecto (PINO Page)

- **Cliente activo**: Antigravity IDE
- **Modelo activo**: Gemini 3.8 Flash (High)
- **Repositorio remoto**: [https://github.com/jomstudiovzla/pinopage](https://github.com/jomstudiovzla/pinopage)
- **URL pública (GitHub Pages)**: [https://jomstudiovzla.github.io/pinopage/](https://jomstudiovzla.github.io/pinopage/)
- **Rama principal**: `main`
- **Estado del build v1**: `built` (HTTP 200 OK) — Con sistema de Login, Espace Client y Admin God Mode
- **Estado v2**: **especificación completa (Hito 0)**.
- **Localhost**: `http://127.0.0.1:8080/` (`python3 -m http.server 8080`)

## Qué hay en el disco

### v1 (producción en vivo)
- Landing `index.html`, PWA, assets reales, chatbot, legales FR, coupon PELABOLA, Firebase `crm-jom`.
- **Nuevo**: Sistema completo de Autenticación & Espacios en `index.html`:
  - Botón « Connexion » en barra de navegación y drawer móvil.
  - Modal de autenticación con pestañas « Connexion » e « Inscription Client ».
  - Reconocimiento de credenciales de Administrador (Andrés Pino): `pino.spacesverts@gmail.com` / `Pino2678186113180309K@` abriendo el **Espace Administration — God Mode** (KPIs, CRM de Leads en vivo con llamadas y WhatsApp 1-clic, facturación Unipros vs Directo, gestión de cupones y herramienta de impersonación de cliente).
  - Reconocimiento y registro de Clientes Particulares / Pros abriendo el **Espace Client** (los 3 contadores de DOCUMENTO_MAESTRO: facturas con desglose 50% Unipros, dossiers de obras, código de bienvenida de -20%, más exportación RGPD y derecho al olvido).

### v2 (gobernanza, 2026-09-15)
- `DOCUMENTO_MAESTRO.md` — requerimientos + arquitectura Francia (fusión voice note + Andrés + código vivo + correcciones RGPD/Supabase 2026)
- `tareas.md`, `plan_implementacion.md`, `AGENTS.md`
- `docs/sql/001_initial_schema.sql`
- `docs/adr/0001` … `0004`
- Nota de voz del cliente: `indicaciones del cliente /WhatsApp Audio 2026-08-27 at 12.56.00.opus`

## Siguiente acción (Hito 1)
Crear proyecto Supabase **West EU (Paris) `eu-west-3`**, aplicar el SQL, DPA, exportar `pino_coupons`. No rediseñar la landing.
