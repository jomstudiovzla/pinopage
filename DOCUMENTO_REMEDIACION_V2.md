# DOCUMENTO MAESTRO DE ARQUITECTURA Y REMEDIACIÓN V2.0 (FRANCIA)

**Plataforma:** Pino Espaces Verts — gestión de clientes  
**Fecha:** 15 septiembre 2026  
**Estado:** Remediación inmediata de auditoría visual/audio + migración Firebase → Supabase  
**Complementa:** [`DOCUMENTO_MAESTRO.md`](./DOCUMENTO_MAESTRO.md)

---

## 1. Diagnóstico y remediación inmediata

| Evidencia | Fallo | Remediación en código |
|---|---|---|
| Img/Audio 1 y 3 | `auth/unauthorized-domain` de Firebase en GitHub Pages. Modal de registro sin scroll en móvil. | **Firebase Auth/Firestore eliminados.** Auth vía `@supabase/supabase-js`. Modal `#modal-window-auth` con `max-h-[80vh] overflow-y-auto`. |
| Img/Audio 2 | Unipros poco visible en navegación. | Logo oficial en el **header** (desktop + móvil) con `target="_blank"` a `https://unipros.coop`. |
| Img/Audio 4 | Ícono del chatbot = pino → no se entiende. | Botón flotante: `fa-comments` (burbujas). El logo pino se conserva **solo** en la cabecera del chat. |
| Img/Audio 5 | Cualquier email obtiene PELABOLA. | Input email **eliminado**. CTA: « Connectez-vous avec Google pour générer votre code unique ». El código se muestra solo si hay `user_id` de sesión. |

### 1.1 Dominios a autorizar (Supabase Dashboard)

Authentication → URL Configuration:

- **Site URL:** `https://jomstudiovzla.github.io/pinopage/`
- **Redirect URLs:**
  - `https://jomstudiovzla.github.io/pinopage/`
  - `https://jomstudiovzla.github.io/pinopage/index.html`
  - `http://127.0.0.1:8080/`
  - `http://localhost:8080/`

Providers → Google: Client ID + Secret de Google Cloud.  
Authorized JavaScript origins de Google Cloud deben incluir `https://jomstudiovzla.github.io`.

Claves del proyecto: pegar URL y `anon` key en [`assets/js/supabase-config.js`](./assets/js/supabase-config.js). **Nunca** `service_role` en el cliente.

---

## 2. Roles (Zero Trust)

| Rol | Auth | RLS | Capacidades |
|---|---|---|---|
| **Admin** (Andrés, `pino.spacesverts@gmail.com`) | Email/password o Google | `private.is_admin()` | Todos los perfiles, cupones, facturas, dossiers, sesiones. Emite dossiers. |
| **Cliente autenticado** | Google OAuth o email | `user_id == auth.uid()` | Un cupón 1:1. Dashboard: facturas, dossiers, estado del cupón. |
| **Visitante** | Ninguna | Solo tablas públicas | Landing, Unipros, chat general. **No genera cupón.** |

El rol de negocio vive en `app_metadata.role`, no en `user_metadata`. Ver ADR-0003.

---

## 3. Hoja de ruta

### Fase 1 — Infra y ciberseguridad (esta entrega: cliente listo)

- [x] Quitar SDKs y llamadas Firebase del `index.html`
- [x] Cliente Supabase + `signInWithOAuth({ provider: 'google' })` con `redirectTo` del origen actual
- [x] SQL cupones 1:1 + RLS en `docs/sql/002_cupones_rls.sql`
- [ ] Crear proyecto Supabase `eu-west-3`, pegar keys, activar Google, aplicar SQL

### Fase 2 — UI/UX (esta entrega)

- [x] Header Unipros + « Espace Membres / Connexion »
- [x] Modal auth con scroll nativo y Google primero
- [x] Cupón gated por sesión
- [x] Botón chat = burbujas

### Fase 3 — Paneles y legal (parcialmente ya en modales)

- [x] Espace client con contadores (modal existente)
- [x] God Mode modal (ruta secreta pendiente `/admin-dashboard` en Next.js)
- [x] Texto CGV/RGPD bajo el botón Google

---

## 4. Lógica de cupón

1. Visitante ve CTA Google. Ningún campo email público.
2. Primer login → trigger SQL inserta `cupones` (`PINO20-` + 6 chars del uuid). Unique en `cliente_id`.
3. Front lee `cupones` por `auth.uid()`. Si no hay fila, no se muestra código.
4. Admin puede marcar `estado = 'usado'`.

PELABOLA deja de ser un código auto-entregado a anónimos. Puede quedar como campaña interna del gérant.

---

## 5. Paso a paso login Google (desarrollador)

1. Crear proyecto Supabase región **West EU (Paris) `eu-west-3`**.
2. Authentication → Providers → Google ON.
3. URL Configuration con las URLs de §1.1.
4. Pegar `url` y `anonKey` en `assets/js/supabase-config.js`.
5. SQL Editor: ejecutar `docs/sql/001_initial_schema.sql` y `docs/sql/002_cupones_rls.sql`.
6. Primer admin: en SQL, `update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}' where email = 'pino.spacesverts@gmail.com';`

Código del botón (ya en `index.html`):

```js
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: window.PINO_SITE_URL }
})
```
