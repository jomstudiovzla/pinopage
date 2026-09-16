# Orquestación — remediación V2.0

Orden de agentes / tareas. No paralelizar lo que comparte `index.html`.

| Orden | Agente | Encargo | Estado |
|---|---|---|---|
| 1 | UI / baseline | Header: wordmark 2 líneas, Unipros como sello al lado de la marca, nav sin iconos de enlace externo, Connexion corto, hamburger hasta `lg` | Hecho |
| 2 | Auth | Quitar Firebase; Supabase JS; URL del proyecto Page | Hecho (falta `anonKey`) |
| 3 | UX chat | `fa-comments` en el botón flotante | Hecho |
| 4 | Cupones | Sin email público; CTA Google; código solo con `user_id` | Hecho |
| 5 | Modal | `max-h-[80vh] overflow-y-auto` + CGV bajo Google | Hecho |
| 6 | DBA | SQL perfiles/profiles + cupones 1:1 + RLS | Archivos listos; ejecutar en el SQL Editor |
| 7 | Andrés (humano) | Pegar anon key + Google provider + redirect URLs | Pendiente |
| 8 | Legal | Texto RGPD/CGV en login | Hecho |
| 9 | Release | Push `main` → GitHub Pages | Tras verificar localhost |

Bloqueo: el login Google no cierra el flujo hasta el paso 7.
