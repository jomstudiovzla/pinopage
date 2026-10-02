# Checklist QA fonctionnelle — FASE 9

Matrice complète : `docs/qa/MATRIZ_FASE9.md` (25 flux). Magasin = **RTDB**, pas Firestore.

À cocher après le run auto + `verify-production.sh` (lecture seule). **Ne pas** envoyer un devis live (Worker → Gmail Andrés).

- [x] QA-01/02 devis visiteur desktop + iPhone → lead `new` / `web_devis` (`business.spec` 14/14)
- [ ] QA-03/04 canal mail : `GET https://pino-mail.pinoespacesverts.online/health` → `{status:"ok"}` (inbox = Andrés) — **BLOCKED** inbox, health 200
- [x] QA-05 Worker 503 → devis sauvé + file `pino_mail_queue` / `pino_mail_outbox`
- [x] QA-06 flush après 200 → files vides (Chromium + WebKit)
- [x] QA-07…11 inscription, doublon, login, reset, vérification e-mail (`auth.spec`)
- [x] QA-12 Google popup bureau ; QA-14 redirect iPhone
- [x] QA-15 `/admin` sans session → login SPA ; QA-16 client → 403 ; QA-17 admin → God Mode
- [x] QA-18 client ne mute pas `leads.status` ni `mail_outbox` (RTDB, pas Firestore)
- [x] QA-19/20 slider boutons + swipe ; QA-21 Tab / flèches
- [x] QA-22 devis sans contact + mot de passe &lt; 8 (Chromium + iPhone)
- [x] QA-23 bandeau hors ligne + Worker lent (delay Chromium ; hors ligne `business.spec`)
- [x] QA-24 contexte vide = invité
- [x] QA-25 `pinoespacesverts.online` et `pagepino-e8e97.web.app` (`verify-production.sh` 61/61)
- [x] Header : chip **client** et **admin** visibles après login
- [x] SW toujours `pino-ev-v47-admin` (FASE 9 ne bump pas)
- [x] `pnpm audit:static` vert (F9-01 inclus) 24/24
- [x] Aucun P0 ouvert
