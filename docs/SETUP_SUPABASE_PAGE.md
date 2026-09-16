# Setup proyecto Supabase « Page » (Andres Pino)

URL ya cableada en `assets/js/supabase-config.js`:

`https://ziccgwonregaatuijyzb.supabase.co`

Región actual del proyecto: **West EU (Ireland) `eu-west-1`**. No es París; no se cambia a menos que se cree otro proyecto.

## 1. Clave `anon` (obligatoria para el login Google)

1. Dashboard → Project Settings → API.
2. Copiar **anon / public** (JWT que empieza por `eyJ`).
3. Pegar en `assets/js/supabase-config.js` → `anonKey`.
4. **Nunca** pegar `service_role` en el front.

Sin este paso el botón Google muestra el aviso de configuración (ahora abajo a la derecha, no encima del menú).

## 2. URLs de Auth

Authentication → URL Configuration:

- Site URL: `https://jomstudiovzla.github.io/pinopage/`
- Redirect URLs:
  - `https://jomstudiovzla.github.io/pinopage/`
  - `https://jomstudiovzla.github.io/pinopage/index.html`
  - `http://127.0.0.1:8080/`
  - `http://localhost:8080/`

Authentication → Providers → Google: Client ID + Secret de Google Cloud.  
Google Cloud → Authorized JavaScript origins: `https://jomstudiovzla.github.io`

## 3. SQL

SQL Editor, en este orden:

1. `docs/sql/001_initial_schema.sql`
2. `docs/sql/002_cupones_rls.sql`

Admin: el email `pino.spacesverts@gmail.com` se trata como gérant en el cliente. En SQL, además:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'pino.spacesverts@gmail.com';
```

## 4. Lo que no va a git

La carpeta `error/` (capturas, audios, PII) está en `.gitignore`.
