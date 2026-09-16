# Setup proyecto Supabase « Page » (Andres Pino)

URL ya cableada en `assets/js/supabase-config.js`:

`https://ziccgwonregaatujyyzb.supabase.co`

Región actual del proyecto: **West EU (Ireland) `eu-west-1`**. No es París; no se cambia a menos que se cree otro proyecto.

## 1. Clave publicable (ya en el cliente)

`assets/js/supabase-config.js` usa `sb_publishable_…` del proyecto **Page**. No pongas `service_role` ni la contraseña de Postgres en el front.

CLI (cuando tengas un access token de Account → Access Tokens):

```bash
npx supabase login --token <ACCESS_TOKEN>
npx supabase link --project-ref ziccgwonregaatujyyzb --yes
npx supabase db push
```

Mientras tanto: SQL Editor → pegar `docs/sql/001` + `002` (ya copiados al portapapeles).

## 2. URLs de Auth

Authentication → URL Configuration:

- Site URL: `https://jomstudiovzla.github.io/pinopage/`
- Redirect URLs:
  - `https://jomstudiovzla.github.io/pinopage/`
  - `https://jomstudiovzla.github.io/pinopage/index.html`
  - `http://127.0.0.1:8080/`
  - `http://localhost:8080/`

Authentication → Providers → Google: ON, pegar Client ID + Secret.

En Google Cloud → APIs y servicios → Credenciales → ID de cliente OAuth:

- Orígenes JavaScript: `https://jomstudiovzla.github.io` y `http://127.0.0.1:8080`
- URI de redirección: `https://ziccgwonregaatujyyzb.supabase.co/auth/v1/callback`

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
