# Checklist — Déploiement sûr (FASE 10)

Runbook : `docs/qa/RUNBOOK_FASE10.md`. Magasin = **RTDB**. Compte CLI = `pino.spacesverts@gmail.com`.

> Dernière exécution partielle : 2026-10-02 (Antigravity/Gemini — reprise après limite Grok).

- [x] F10-01 Branche `fix/connect-pinoespacesverts-online` active (HEAD)
- [x] F10-02 Backup `pnpm backup:config` → `backups/20261002T155757Z` ✅
- [x] F10-03 `pnpm test:rules` → **62/62 PASS** ✅
- [x] F10-04 firebase.json / .firebaserc / sw.js / wrangler.toml dans le snapshot ✅
- [x] F10-05 `pnpm test:unit` (36/36) + `pnpm audit:static` (24/24) ✅
- [x] F10-06 `pnpm test:e2e` → 102/104 PASS, 1 skip (Google mobile redirect), 1 SIGKILL externo en QA-05 ✅
- [x] F10-07 Functions **SKIP Spark** (pas d'erreur bloquante ; Hosting sans `/api`) ✅
- [x] F10-08 **Pas** de `deploy --only firestore` ; `pnpm deploy:rules` = database ✅
- [x] F10-09 Hosting `pnpm deploy:production` → **78 archivos**, `pino-ev-v47-admin` ✅ `pinoespacesverts.online` **LIVE**
- [x] F10-10 Secrets Worker hors git ; `PINO_FLAGS` false/false ; 0 `SERVICE_ROLE` client (audit:static CHK-10/SEC PASS) ✅
- [ ] F10-11 Authorized domains : `.online`, `www`, `.web.app`, `firebaseapp.com` (Andrés / Console)
- [ ] F10-12 OAuth branding (Andrés / Cloud Console) nom + privacy + terms + logo 120
- [ ] F10-13 `GET /health` Worker `{status:"ok"}` ; aucun POST devis de test
- [ ] F10-14 `verify-production.sh` `.online` + `.web.app` ; 404 FR ; `/admin` SPA
- [ ] F10-15 Plan rollback lu (`docs/RECUPERACION_Y_ROLLBACK.md`)
- [x] SW bump seulement si JS client livré a changé (pas de bump cette session) ✅
- [x] Wrangler jamais lancé à la racine du repo ✅
- [x] `preflight` + `backup:config` añadidos a `package.json` ✅
