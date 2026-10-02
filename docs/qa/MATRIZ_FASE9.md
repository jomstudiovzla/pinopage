# Matrice QA — FASE 9

Date : **2026-10-02**. Magasin vivant : **Realtime Database** (`pagepino-e8e97`). Firestore n’est pas le magasin v1 (ADR 0006).

Les e2e **n’envoient jamais** de devis au Worker Resend de production (`stubMailWorker` dans `tests/e2e/helpers.mjs`). Aucun compte Identity Toolkit live supplémentaire n’est créé.

Légende état : **PASS** / **FAIL** / **BLOCKED**.  
Type : **auto** (Playwright / rules / unit / `verify-production.sh`) ou **manuel**.

Priorité bugs : **P0** bloquant production · **P1** flux critique dégradé · **P2** cosmétique / manuel restant.

---

## Synthèse

| ID | Flux (spec) | Type | État | Preuve |
|----|-------------|------|------|--------|
| QA-01 | Devis desktop | auto | PASS | `business.spec` + `qa-fase9` Chromium |
| QA-02 | Devis mobile | auto | PASS | même spec, projet `webkit-mobile` (iPhone 13) |
| QA-03 | Courriel interne devis | auto+manuel | BLOCKED | `GET /health` ok ; pas de POST live (Andrés doit confirmer Gmail) |
| QA-04 | Courriel confirmation client | auto+manuel | BLOCKED | même contrainte que QA-03 |
| QA-05 | Échec fournisseur e-mail | auto | PASS | `qa-fase9` Worker 503 → file locale |
| QA-06 | Réessai envoi échoué | auto | PASS | `qa-fase9` flush après 200 (Chromium + WebKit) |
| QA-07 | Créer utilisateur e-mail/mdp | auto | PASS | `auth.spec` inscription |
| QA-08 | E-mail déjà utilisé | auto | PASS | `auth.spec` « déjà un compte » |
| QA-09 | Login e-mail/mdp | auto | PASS | `auth.spec` + chip header FASE 9 |
| QA-10 | Mot de passe oublié | auto | PASS | `auth.spec` oob `PASSWORD_RESET` |
| QA-11 | Vérifier e-mail | auto | PASS | `auth.spec` VERIFY_EMAIL → Espace Client |
| QA-12 | Google desktop (popup) | auto | PASS | `auth.spec` Chromium ; skip WebKit |
| QA-13 | Google Android | auto | PASS* | même chemin `pinoShouldUseRedirectAuth` que mobile |
| QA-14 | Google iPhone/iPad | auto | PASS | `auth.spec` webkit-mobile : redirect, pas popup |
| QA-15 | `/admin` sans session | auto | PASS | `ui-errors.spec` SPA 200 + login |
| QA-16 | `/admin` client normal | auto | PASS | `qa-fase9` → `/403.html` |
| QA-17 | `/admin` administrateur | auto | PASS | `auth.spec` `#modal-window-admin` |
| QA-18 | Mutation RTDB DevTools non-admin | auto | PASS | coupon −90 % + lead status + `mail_outbox` |
| QA-19 | Slider desktop | auto | PASS | `ui-slider.spec` boutons Avant/Après |
| QA-20 | Slider swipe mobile | auto | PASS | `qa-fase9` swipe iPhone 13 |
| QA-21 | Clavier (Tab / flèches) | auto | PASS | slider Home/End + Tab devis |
| QA-22 | Formulaires invalides | auto | PASS | devis sans contact + mdp &lt; 8 (Chromium + iPhone) |
| QA-23 | Réseau lent / hors ligne | auto | PASS | Worker 2,5 s + bandeau hors ligne |
| QA-24 | Mode incognito | auto | PASS | nouveau contexte Playwright |
| QA-25 | Domaines prod / fallback | auto | PASS | `verify-production.sh` `.online` + `.web.app` |

\*QA-13 : pas d’émulateur Android physique. Le client utilise le même test `isMobile` / UA tactile que iOS. Confirmation appareil réel = manuel Andrés.

Bugs ouverts **P0** : aucun.  
Bugs **P1** : QA-03 / QA-04 BLOCKED (preuve boîte Gmail, pas un défaut code).  
Bugs **P2** : branding OAuth Cloud Console (FASE 4 leftover) ; claim admin CLI sans ADC.

---

## Cas détaillés

### QA-01 — Envoyer un devis depuis le desktop

| | |
|---|---|
| **Scénario** | Visiteur desktop dépose une demande de devis. |
| **Précondition** | Émulateurs Auth+RTDB ; Worker mail stubbé 200. |
| **Étapes** | 1. Ouvrir l’accueil `?emulator=1`. 2. Modal devis. 3. Code postal, budget, e-mail, nom, détails, CGU. 4. Envoyer. |
| **Attendu** | Lead `status=new` `source=web_devis` ; pas d’écriture `clients_records` visiteur. |
| **Obtenu** | Lead unique pour `visiteur@example.com` / `qa.fase9@example.com`. |
| **État** | PASS |
| **Type** | auto — `tests/e2e/business.spec.mjs` + Chromium `qa-fase9` |
| **Preuve** | log Playwright ; nœud RTDB `leads/{id}` |

### QA-02 — Envoyer un devis depuis le mobile

Même scénario sur projet Playwright `webkit-mobile` (device iPhone 13). **PASS**.

### QA-03 — Recevoir le courriel interne de devis

| | |
|---|---|
| **Scénario** | Andrés reçoit l’alerte interne (Resend Worker). |
| **Précondition** | Worker live `https://pino-mail.pinoespacesverts.online`. |
| **Étapes** | 1. `GET /health`. 2. **Ne pas** POST `/notify` (un POST sans Turnstile a déjà envoyé un vrai mail en FASE 1). 3. Andrés confirme un devis réel dans Gmail. |
| **Attendu** | Health `{status:"ok"}` ; inbox Andrés `pino.espacesverts@gmail.com`. |
| **Obtenu** | Health 200 JSON `status=ok`. Inbox : non relue dans cette session (pas de POST test). |
| **État** | BLOCKED (preuve inbox) |
| **Type** | auto (health) + manuel (Gmail) |
| **Preuve** | `curl -sI` / body `/health` ; FASE 1 envoi accidentel déjà survenu |

### QA-04 — Recevoir le courriel de confirmation client

Même canal Worker (`notifyDevis` public). Stub e2e prouve la file + retry (QA-05/06). Réception Gmail client = **BLOCKED** manuel.

### QA-05 — Simuler un échec du fournisseur d’e-mail

| | |
|---|---|
| **Scénario** | Worker répond 503 pendant l’envoi du devis. |
| **Précondition** | `openSite(page, { mail: 'fail' })`. |
| **Étapes** | Déposer un devis visiteur. |
| **Attendu** | Lead quand même en base ; `pino_mail_queue` et/ou `pino_mail_outbox` non vides. |
| **Obtenu** | Lead `qa05@example.com` `new`/`web_devis` ; file locale &gt; 0. |
| **État** | PASS |
| **Type** | auto — `tests/e2e/qa-fase9.spec.mjs` |
| **Preuve** | log Playwright ; localStorage |

### QA-06 — Réessayer un envoi échoué

| | |
|---|---|
| **Scénario** | Après QA-05, le Worker redevient 200. |
| **Étapes** | `stubMailWorker(200)` puis `PinoMail.flushQueue()` + `PinoDB.drainMailOutbox()`. |
| **Attendu** | Files locales vides. |
| **Obtenu** | `pino_mail_queue` + `pino_mail_outbox` = 0 sur Chromium et WebKit. |
| **État** | PASS |
| **Type** | auto |
| **Preuve** | `qa-fase9.spec.mjs` ; stub `window.fetch` (WebKit `keepalive` hors `page.route`) |

### QA-07 — Créer un utilisateur e-mail / mot de passe

Inscription Claire → oob VERIFY_EMAIL, pas de session avant clic. **PASS** `auth.spec`.

### QA-08 — E-mail déjà utilisé

`deja@example.com` existant → message « déjà un compte », onglet connexion. **PASS** `auth.spec`.

### QA-09 — Connexion e-mail / mot de passe

Login vérifié → `#modal-window-client`. Chip header « Session client active » (desktop) / `#mobile-session-chip.pino-on` (mobile). Mauvais mot de passe → erreur, pas de session. **PASS**.

### QA-10 — Restablecer contraseña / mot de passe oublié

oob `PASSWORD_RESET` émis ; e-mail inconnu sans fuite. **PASS** `auth.spec`.

### QA-11 — Vérifier l’e-mail

Clic lien émulateur → `emailVerified` + Espace Client + coupon 20 %. **PASS** `auth.spec`.

### QA-12 — Google desktop (popup)

Popup IdP émulateur `gardener@gmail.com` → Espace Client, `auth_provider=google`. Skip WebKit. **PASS** Chromium.

### QA-13 — Google Android

`pinoShouldUseRedirectAuth() === isMobile`. Pas de device Android dans la grille Playwright. Même code que iPhone (UA tactile / PWA). **PASS** (chemin code) ; manuel appareil Android restant.

### QA-14 — Google iPhone / iPad

webkit-mobile : `signInWithRedirect`, pas de popup, `pino_auth_redirect_pending=google`. **PASS**.

### QA-15 — `/admin` sans session

HTTP 200 SPA (pas 404) ; `#modal-window-auth` ouvert ; `decideAdminRoute` = `login`. **PASS** `ui-errors.spec` + `verify-production.sh`.

### QA-16 — `/admin` utilisateur normal

Client vérifié `alice@example.com` → `location.replace('/403.html')` titre « refus ». **PASS** `qa-fase9` + `decideAdminRoute` unit.

### QA-17 — `/admin` administrateur

`pino.espacesverts@gmail.com` vérifié (allowlist) → `#modal-window-admin` + lecture `users`. Claim custom optionnel (ADC absent). **PASS** émulateur.

### QA-18 — Mutation magasin depuis DevTools (RTDB, pas Firestore)

| | |
|---|---|
| **Scénario** | Client tente `ref.update` depuis la console. |
| **Étapes** | `coupons/{uid}.descuento_pct=90` ; `leads/QA18.status=won` ; `mail_outbox.push`. |
| **Attendu** | PERMISSION_DENIED ; valeurs inchangées. |
| **Obtenu** | `denied` sur les trois ; status reste `new`. |
| **État** | PASS |
| **Type** | auto — `business.spec` + `qa-fase9` + `pnpm test:rules` (62) |
| **Preuve** | nœud RTDB `leads/QA18` |

### QA-19 — Slider desktop

Boutons Avant/Après, 0 % / 100 %, désactivation aux extrémités. **PASS** `ui-slider.spec`.

### QA-20 — Slider swipe mobile

Glisser souris/pointeur 15 % → 80 % sur iPhone 13 ; curseur &gt; 50 %. **PASS** `qa-fase9`.

### QA-21 — Accessibilité clavier

Tab `#phone` → `#email`. Slider `ArrowRight` / Home / End. **PASS** `ui-slider` + `qa-fase9`.

### QA-22 — Formulaires invalides

Devis sans tél. ni e-mail → `#contact-validation-msg`, 0 lead. Inscription mot de passe `court` → « 8 caractères » (modal devis fermée, onglet register visible, valeurs via DOM). **PASS** Chromium + WebKit.

### QA-23 — Lentitud de red

Worker delay 2,5 s (sous le timeout 8 s) : lead `qa23@example.com` sauvé. Hors ligne : `#offline-banner` puis masqué. **PASS** Chromium delay + `business.spec` hors ligne. WebKit delay skip (timeout projet 45 s).

### QA-24 — Mode incognito

`browser.newContext()` vide : pas de `pino_current_user`, Firebase null, bouton « Connexion ». **PASS**.

### QA-25 — Domaines production et fallback

| Origine | Outil | Attendu |
|---------|-------|---------|
| `https://pinoespacesverts.online` | `DOMAIN=... bash scripts/verify-production.sh` | home 200, CSP, PWA, 404 FR, `/admin` SPA, 403/500, SW `pino-ev-v47-admin` |
| `https://pagepino-e8e97.web.app` | même script | fallback Spark vivant |

**PASS** lecture seule (détail dans le log du run).

---

## Cartographie spec → magasin

La spec parlait de « Firestore ». En v1 :

| Spec | Nœud RTDB |
|------|-----------|
| devis / leads | `/leads` |
| profil | `/users/{uid}` |
| coupons | `/coupons/{uid}` |
| file mail admin | `/mail_outbox` (écriture admin) ; visiteur → Worker |
| audit | `/audit_logs` |
| devis client | `/leads` filtrés `email` + dual-write `clients_records` si session |

---

## Bugs classés

| ID | Sévérité | Titre | État |
|----|----------|-------|------|
| F9-B1 | P1 | Preuve inbox Gmail devis (QA-03/04) non relue ici | ouvert — Andrés |
| F9-B2 | P2 | Branding OAuth Cloud Console (nom, logo 120, URLs) | ouvert — FASE 4 |
| F9-B3 | P2 | `pnpm admin:claim` sans `GOOGLE_APPLICATION_CREDENTIALS` | ouvert — allowlist tient Andrés |
| F9-B4 | P2 | QA-13 Android physique non exercé | ouvert — même code iOS |

Aucun P0. La FASE 9 est close côté code (inbox Gmail = manuel Andrés).

---

## Commandes du run

```
pnpm audit:static                                          # 24/24 (F9-01)
firebase emulators:exec --only auth,database --project demo-pino \
  "pnpm exec playwright test tests/e2e/qa-fase9.spec.mjs"  # 18 passed, 2 skipped
firebase emulators:exec --only auth,database --project demo-pino \
  "pnpm exec playwright test tests/e2e/business.spec.mjs"  # 14/14
curl -sS https://pino-mail.pinoespacesverts.online/health  # {"status":"ok"} HTTP 200
```

`verify-production.sh` `.online` + `.web.app` : 61/61 (lecture seule, cycle FASE 8–9, pas de hosting cette fase).  
`pnpm test:unit` 36/36 · `pnpm test:rules` 62/62 (inchangés).

Hosting / SW **non bumpés** (`pino-ev-v47-admin`). Tests + docs uniquement.
