# Premier administrateur — Custom Claims (FASE 7)

v1 reste **Firebase Auth + Realtime Database**. Les Cloud Functions ne sont pas déployées (plan Spark). L’attribution du rôle admin se fait **uniquement** avec le SDK Admin, hors navigateur.

## Qui est admin

Un utilisateur est admin si **et seulement si** son e-mail est vérifié **et** :

1. le jeton porte `admin: true` **ou** `role: "admin"` (Custom Claims), **ou**
2. l’e-mail est dans la liste de secours (identique front / règles / Functions) :
   - `pino.espacesverts@gmail.com`
   - `pino.spacesverts@gmail.com`
   - `jomstudiovzla@gmail.com`

La liste (2) évite de bloquer Andrés avant que le claim soit posé. Un client ne peut pas s’auto-promouvoir : `users/$uid` refuse `isAdmin: true` / `role: "admin"` depuis le navigateur.

## Poser le claim

1. Compte Firebase Auth déjà créé (Andrés s’est connecté au moins une fois).
2. Clé **service account** du projet `pagepino-e8e97` (Console Google Cloud → IAM → Comptes de service → `firebase-adminsdk-…` → JSON), **jamais** commitée.

```bash
export GOOGLE_APPLICATION_CREDENTIALS="$HOME/secrets/pagepino-adminsdk.json"
pnpm --prefix functions install
node scripts/set-admin-claim.mjs pino.espacesverts@gmail.com
```

Optionnel, les deux autres adresses déjà dans la liste :

```bash
node scripts/set-admin-claim.mjs pino.spacesverts@gmail.com
node scripts/set-admin-claim.mjs jomstudiovzla@gmail.com
```

Retirer le claim :

```bash
node scripts/set-admin-claim.mjs autre@example.com --revoke --force
```

Un e-mail hors liste est refusé, sauf `--force`.

## Après le script

1. Andrés se déconnecte puis se reconnecte, **ou** le site appelle `getIdToken(true)` (rafraîchissement forcé).
2. Ouvrir `https://pinoespacesverts.online/admin` : le panneau God Mode s’ouvre.
3. Un client sur `/admin` arrive sur `/403.html` (Accès refusé).
4. Sans session, `/admin` sert le site et ouvre la connexion (pas une 404).

## Vérifier le jeton

Dans la console du navigateur, compte admin connecté :

```js
firebase.auth().currentUser.getIdTokenResult(true).then((t) => console.warn(t.claims));
```

Attendu : `admin: true` et `role: "admin"` (après le script). Tant que le claim n’est pas là, la liste e-mail vérifiée suffit.

## Couches

| Couche | Où | Effet |
|---|---|---|
| Front | `assets/js/pino-admin.js` + garde `/admin` | menu admin caché, login si anonyme, `/403.html` si client |
| Claims | Firebase Auth Custom Claims | `auth.token.admin` / `auth.token.role` dans les règles |
| RTDB | `database.rules.json` | lecture/écriture admin = claim **ou** liste vérifiée |
| CLI | `scripts/set-admin-claim.mjs` | seul moyen v1 de poser le claim (Functions hors Spark) |

Ne jamais écrire `isAdmin: true` depuis le client. Ne jamais déployer `SERVICE_ROLE` / clé Admin dans `assets/`.
