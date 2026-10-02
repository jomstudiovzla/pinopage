# Runbook — Déploiement sûr (FASE 10)

Date : **2026-10-02**. Stack vivant : **Firebase Auth + Realtime Database** (`pagepino-e8e97`, `europe-west1`). Hosting Spark. Worker mail Cloudflare. **Pas de Firestore live** (ADR 0006). **Pas d’appel client `/api/*`**.

Commande unique après ce runbook : `pnpm preflight` (local, 0 écriture prod) puis `pnpm deploy:production`.

Compte CLI : **`pino.spacesverts@gmail.com`**. Override : `FIREBASE_ACCOUNT=…`.  
Canónico : **`https://pinoespacesverts.online`**. Repli : **`https://pagepino-e8e97.web.app`**.

---

## Interdits (à chaque étape)

- `firebase deploy --only firestore` (magasin v1 = RTDB).
- Restaurer le catch-all Hosting `"source": "**"` (casse les 404 FASE 6).
- `cd` + `wrangler` à la racine du repo → uniquement `infra/cloudflare/mail-worker/`.
- POST de devis de test vers `https://pino-mail.pinoespacesverts.online/notify` (vrai mail à Andrés).
- `firebase database:get /` en production (dump PII).
- `SERVICE_ROLE` / secrets dans le client.
- Inventer un SIRET. Domaine `.fr` non enregistré.

---

## F10-01 — Créer une branche de réparation

```bash
git status
git checkout -b fix/descripcion-$(date +%Y%m%d)
```

Ne pas committer tant que le propriétaire ne le demande pas. Branche actuelle du cycle : `fix/connect-pinoespacesverts-online`.

---

## F10-02 — Backup avant changements

```bash
pnpm backup:config
# → backups/<UTC>/  (gitignored)
#    database.rules.json, firebase.json, .firebaserc, firestore.rules,
#    wrangler.toml, firebase-config.js, sw.js, MANIFEST.txt
```

`pnpm deploy:production` fait ce snapshot tout seul (étape 0b). **Pas de dump RTDB.**

Rollback Hosting (historique Firebase, sans retoucher Git) : consola Hosting → Release history → Rollback. Détail : `docs/RECUPERACION_Y_ROLLBACK.md`.

---

## F10-03 — Exporter les règles actuelles

Source de vérité du repo : `database.rules.json`. Le backup F10-02 en est la copie datée **avant** modification.

```bash
# Après un changement de règles, prouver sur l'émulateur (jamais en écrivant la prod pour « tester ») :
pnpm test:rules
```

Export live optionnel (ADC / service account, lecture seule) :

```bash
# Ne pas utiliser database:get /  (données clients).
cp database.rules.json backups/$(date -u +%Y%m%dT%H%M%SZ)-rules.json
```

`firestore.rules` existe dans le repo mais **n’est pas le magasin v1** : on le copie, on ne le déploie pas.

---

## F10-04 — Sauvegarder la configuration Firebase actuelle

Fichiers à conserver ensemble (déjà dans `pnpm backup:config`) :

| Fichier | Rôle |
|---------|------|
| `firebase.json` | Hosting `dist/`, rewrites `/admin` + légales, **pas** de `**` |
| `.firebaserc` | projet `pagepino-e8e97` |
| `database.rules.json` | RTDB deny-by-default |
| `sw.js` | cache `pino-ev-v47-admin` |
| `assets/js/firebase-config.js` | `authDomain=pagepino-e8e97.firebaseapp.com`, `PINO_FLAGS` |
| `infra/cloudflare/mail-worker/wrangler.toml` | Worker (secrets **hors** fichier) |

`firebase.static.json` est **éphémère** (Spark) : créé pendant le deploy, toujours `rm -f` ensuite. Déjà dans `.gitignore`.

---

## F10-05 — Exécuter les tests locaux

```bash
pnpm test:unit          # 36
pnpm audit:static       # 25 (F10-01 inclus)
pnpm test:rules         # 62, émulateur database
```

Ou d’un coup, sans Playwright : `pnpm preflight`.

---

## F10-06 — Probar en émulateurs Firebase

```bash
pnpm test:e2e
# = firebase emulators:exec --only auth,database --project demo-pino "playwright test"
```

Auth `127.0.0.1:9099`, RTDB `127.0.0.1:9000`, projet **`demo-pino`**. Les e2e stubbent le Worker (`stubMailWorker` + `window.fetch`) : **aucun POST live**.

Preflight long : `PINO_PREFLIGHT_E2E=1 pnpm preflight`.

---

## F10-07 — Desplegar Functions

**SKIP sur Spark** (plan actuel). `pnpm deploy:production` tente Functions, échoue, publie Hosting sans rewrite `/api`.

v1 n’appelle jamais `/api/*` depuis le client. Ne pas « réparer » en déployant Functions sans plan Blaze.

Si un jour Blaze est activé (même compte, même projet) :

```bash
firebase deploy --only functions \
  --project pagepino-e8e97 \
  --account pino.spacesverts@gmail.com \
  --non-interactive
```

Puis Hosting **avec** `firebase.json` complet (rewrite `api` conservée). Le client v1 reste sans `fetch('/api/…')`.

---

## F10-08 — Desplegar reglas (Firestore → RTDB)

**SKIP Firestore.** Commande interdite : `firebase deploy --only firestore`.

Règles vivantes = **Realtime Database** :

```bash
pnpm test:rules
firebase deploy --only database \
  --project pagepino-e8e97 \
  --account pino.spacesverts@gmail.com \
  --non-interactive
```

Équivalent packagé : `pnpm deploy:rules` (même compte, `--non-interactive`).

---

## F10-09 — Desplegar Hosting

Chemin sûr (Spark), déjà dans `scripts/deploy-production.sh` :

```bash
PINO_SITE_URL=https://pinoespacesverts.online pnpm build
bash scripts/cleanup-preprod.sh

# Si Functions absentes : retirer la rewrite function, déployer, détruire le json temporaire
node -e '
  const c = require("./firebase.json");
  c.hosting.rewrites = c.hosting.rewrites.filter((r) => !r.function);
  require("fs").writeFileSync("firebase.static.json", JSON.stringify(c, null, 2));
'
firebase deploy --only hosting \
  --project pagepino-e8e97 \
  --config firebase.static.json \
  --account pino.spacesverts@gmail.com \
  --non-interactive
rm -f firebase.static.json
```

Repli canónico temporaire :

```bash
PINO_SITE_URL=https://pagepino-e8e97.web.app pnpm deploy:production
```

Canal preview (optionnel, n’atteint pas `live`) :

```bash
firebase hosting:channel:deploy preview \
  --project pagepino-e8e97 \
  --account pino.spacesverts@gmail.com \
  --config firebase.static.json \
  --non-interactive
```

Bump SW (`CACHE_NAME` dans `sw.js`) **uniquement** si le JS client livré change. FASE 10 ne bump pas.

---

## F10-10 — Valider variables d’environnement et secrets

| Secret / var | Où | Jamais dans |
|--------------|----|-------------|
| `PINO_SITE_URL` | env du build (`scripts/build.mjs`) | — |
| `PINO_FLAGS.appleLogin` / `maintenance` | `firebase-config.js` **et** template `build.mjs` → `false` | nœud RTDB `siteSettings` |
| `RESEND_API_KEY` | `cd infra/cloudflare/mail-worker && npx wrangler secret put RESEND_API_KEY` | git, client, `wrangler.toml` |
| `TURNSTILE_SECRET` | idem, optionnel | client |
| JSON service account (claims) | `GOOGLE_APPLICATION_CREDENTIALS` local | git, Hosting |
| Google OAuth **Client Secret** | Cloud Console (rotatable) | repo |

Vérifs :

```bash
pnpm audit:static          # 0 secret serveur dans le client
grep -R "SERVICE_ROLE" assets index.html && echo FAIL
```

Worker : toujours depuis le sous-dossier.

```bash
cd infra/cloudflare/mail-worker
npx wrangler secret list    # noms seulement
# npx wrangler deploy       # seulement si le Worker a changé
cd -
```

---

## F10-11 — Valider dominios autorizados

Firebase Console → Authentication → Settings → **Authorized domains** :

- `localhost`
- `pagepino-e8e97.firebaseapp.com`  ← `authDomain` (OAuth redirect `/__/auth/handler`)
- `pagepino-e8e97.web.app`
- `pinoespacesverts.online`
- `www.pinoespacesverts.online`

Ne **pas** changer `authDomain` dans le code.

Cloudflare DNS des A/CNAME Firebase : **DNS only (nuage gris)**, jamais Proxied.

---

## F10-12 — Valider OAuth branding

Console Google Auth Platform → [Branding](https://console.cloud.google.com/auth/branding) (compte du projet) :

| Champ | Valeur |
|-------|--------|
| Nom | Pino Espaces Verts |
| Support | `pino.espacesverts@gmail.com` |
| Accueil | `https://pinoespacesverts.online` |
| Privacy | `https://pinoespacesverts.online/politique-de-confidentialite` |
| Terms | `https://pinoespacesverts.online/conditions-generales` |
| Logo | `assets/logo/oauth-consent-120.png` |

Leftover Andrés (FASE 4) : appliquer ces champs dans la console. Le site sert déjà privacy/CGV.

---

## F10-13 — Valider correos reales

```bash
curl -sS https://pino-mail.pinoespacesverts.online/health
# attendu : {"status":"ok"} HTTP 200
```

Un devis **réel** d’Andrés confirme Gmail (admin + confirmation client). **Ne pas** POST `/notify` depuis un script.

File locale si le Worker est down : `pino_mail_queue` / `pino_mail_outbox` (QA-05/06). Admin : `PinoDB.drainMailOutbox()` + Gmail API popup séparée (`pinoObtainGmailToken`) — ne pas mélanger avec le login Google client.

---

## F10-14 — Monitorear errores después del despliegue

```bash
DOMAIN=https://pinoespacesverts.online pnpm verify:production
DOMAIN=https://pagepino-e8e97.web.app  pnpm verify:production
pnpm audit:live
curl -sS https://pino-mail.pinoespacesverts.online/health
```

Dans le navigateur (session réelle, pas e2e) :

1. Accueil 200, CSP, pas de Tailwind CDN.
2. `/cette-page-nexiste-pas` → 404 FR (pas le SPA).
3. `/admin` sans session → login ; client → `/403.html`.
4. Devis visiteur → lead RTDB ; Andrés reçoit le mail.
5. Console : 0 `auth/unauthorized-domain`.
6. PWA : SW `pino-ev-v47-admin` (ou la version bumpée si le JS a changé). Hard refresh si l’ancien cache sert encore.
7. Journal local : `localStorage.pino_error_ring` (pas de Sentry avant consentement CNIL).

---

## F10-15 — Rollback si une correction échoue

| Surface | Action |
|---------|--------|
| Hosting | Console → Hosting → Release history → **Rollback**. Repli immédiat : `https://pagepino-e8e97.web.app` |
| Canónico cassé | `PINO_SITE_URL=https://pagepino-e8e97.web.app pnpm deploy:production` |
| Règles RTDB | restaurer `backups/<stamp>/database.rules.json` puis `pnpm test:rules` + `pnpm deploy:rules` |
| Worker mail | `cd infra/cloudflare/mail-worker && npx wrangler rollback` (ou redéployer le commit précédent **dans ce dossier**) |
| Git | `git revert <hash>` puis rebuild + deploy (pas de `reset --hard` poussé) |
| DNS | Cloudflare → DNS only gris ; ne pas toucher MX/SPF/DKIM |

Ne **jamais** `firebase hosting:disable` en production (coupe aussi le repli `.web.app` du même site).

Détail incidents DNS/SSL/Google : `docs/RECUPERACION_Y_ROLLBACK.md`.

---

## Ordre recommandé (une correction Hosting + règles)

```bash
pnpm preflight
pnpm deploy:production
DOMAIN=https://pinoespacesverts.online pnpm verify:production
DOMAIN=https://pagepino-e8e97.web.app  pnpm verify:production
```

Règles seules (pas de bundle) :

```bash
pnpm test:rules
pnpm deploy:rules
```

Worker seul :

```bash
cd infra/cloudflare/mail-worker
npx wrangler deploy
cd -
curl -sS https://pino-mail.pinoespacesverts.online/health
```
