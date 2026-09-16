# Estado Actual del Proyecto (PINO Page)

- **Cliente activo**: Antigravity IDE (Gemini 3.8 Flash)
- **Repositorio remoto**: [https://github.com/jomstudiovzla/pinopage](https://github.com/jomstudiovzla/pinopage)
- **URL pública (GitHub Pages)**: [https://jomstudiovzla.github.io/pinopage/](https://jomstudiovzla.github.io/pinopage/)
- **Rama principal**: `main`
- **Localhost**: `http://127.0.0.1:8080/`

## ✅ Completado (15-Sep-2026)

### Remediación V2.0 + CRM de Trabajos + Roles OAuth — 100% COMPLETA
- [x] Supabase JS + `signInWithOAuth({ google })` + redirect dinámico
- [x] `supabase-config.js` con url + anonKey reales + soporte `file:` y `http://127.0.0.1:8080/`
- [x] Logo Unipros en header, chat `fa-comments`
- [x] Modal auth responsive
- [x] Cupón: sin email público; código solo con `user_id`
- [x] SQL maestro consolidado: `docs/sql/FULL_MIGRATION_MASTER.sql` (contiene 001 + 002 + 003 + 004)
- [x] `pino-db.js` — capa de datos completa (leads, profiles, cupones, audit, KPIs y Jobs CRM)
- [x] Devis form → `PinoDB.saveLead()` → Supabase + localStorage fallback
- [x] Login → `PinoDB.upsertProfile()` + `fetchUserCoupon()` desde DB
- [x] Auto-asignación de roles: `pino.spacesverts@gmail.com` y `pino.espacesverts@gmail.com` como `admin`, otros correos como `client`
- [x] **Panel CRM de Trabajos en Admin**:
  - Formulario completo para registrar trabajos cliente a cliente:
    - Datos de cliente (nombre, email, teléfono, comuna).
    - Detalles de trabajo (servicio, fechas inicio/fin, horas trabajadas, descripción).
    - Aspectos financieros (monto facturado, monto pagado, estado de pago, método de pago, notas internas).
  - Tabla dinámica interactiva con filtros rápidos (Tous, En attente, Partiel, Payés) y acción rápida "Marquer comme payé".
  - Tarjetas de resumen financiero en tiempo real (Total travaux, Total facturé €, Encaissé €, Heures totales).
  - **Exportación en 1 clic**:
    - **Exportar PDF**: Generación cliente con `jsPDF` con tabla profesional de estilo Pino Espaces Verts y resumen.
    - **Exportar Excel / CSV**: Descarga inmediata con formato UTF-8 compatible con hojas de cálculo.
- [x] `docs/sql/004_admin_roles_and_jobs.sql`: Tabla `public.jobs`, vista `public.jobs_summary`, RLS estricto y triggers de auto-asignación de admin.
- [x] Google Cloud Console: Client ID + Secret creados para `pino.spacesverts@gmail.com`.
- [x] SQL Maestro copiado automáticamente al portapapeles del sistema (macOS `pbcopy`).

### Credenciales Google OAuth (almacenadas en .env.local)
- Client ID: Disponible en `.env.local` y consola Google Cloud
- Callback registrado: `https://ziccgwonregaatujyyzb.supabase.co/auth/v1/callback`

## ⏳ Acciones manuales inmediatas (Solo faltan 2 minutos en Supabase)

1. **Authentication → Providers → Google → ON**
   - Client ID: Copiar desde `.env.local`
   - Client Secret: Copiar desde `.env.local`
   - → Clic en **Save**

2. **Authentication → URL Configuration**
   - Site URL: `https://jomstudiovzla.github.io/pinopage/`
   - Redirect URLs: `https://jomstudiovzla.github.io/pinopage/` y `http://127.0.0.1:8080/`
   - → Clic en **Save**

3. **SQL Editor → Pegar (Cmd+V) → Run**
   - El script completo `FULL_MIGRATION_MASTER.sql` ya está en tu portapapeles. Solo pega y presiona **Run**.

## Siguiente acción (Hito 1)
Entrar a `http://127.0.0.1:8080/` con Google (Andrés Pino para admin, o cualquier otra cuenta para cliente) y comprobar el panel de CRM y descargas.
