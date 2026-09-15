# Estado Actual del Proyecto (PINO Page)

- **Cliente activo**: Grok CLI / Antigravity
- **Modelo activo**: Grok 4.6
- **Repositorio remoto**: [https://github.com/jomstudiovzla/pinopage](https://github.com/jomstudiovzla/pinopage)
- **URL pública (GitHub Pages)**: [https://jomstudiovzla.github.io/pinopage/](https://jomstudiovzla.github.io/pinopage/)
- **Rama principal**: `main`
- **Estado del build v1**: `built` (HTTP 200 OK)
- **Estado v2**: **especificación completa (Hito 0)**. Código de aplicación Next.js aún no scaffold.
- **Localhost**: `http://127.0.0.1:8080/` (`python3 -m http.server 8080`)

## Qué hay en el disco

### v1 (producción)
- Landing `index.html`, PWA, assets reales, chatbot, legales FR, coupon PELABOLA, Firebase `crm-jom`.

### v2 (gobernanza, 2026-09-15)
- `DOCUMENTO_MAESTRO.md` — requerimientos + arquitectura Francia (fusión voice note + Andrés + código vivo + correcciones RGPD/Supabase 2026)
- `tareas.md`, `plan_implementacion.md`, `AGENTS.md`
- `docs/sql/001_initial_schema.sql`
- `docs/adr/0001` … `0004`
- Nota de voz del cliente: `indicaciones del cliente /WhatsApp Audio 2026-08-27 at 12.56.00.opus`

## Acciones históricas v1
1. `.gitignore` (`.DS_Store`)
2. Git `main` + `origin`
3. Commit inicial (~104 archivos) y push
4. GitHub Pages raíz `/` verificado HTTP 200

## Siguiente acción (Hito 1)
Crear proyecto Supabase **West EU (Paris) `eu-west-3`**, aplicar el SQL, DPA, exportar `pino_coupons`. No rediseñar la landing.
