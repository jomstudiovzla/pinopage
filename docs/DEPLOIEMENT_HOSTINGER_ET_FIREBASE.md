# 🚀 GUIDE DE DÉPLOIEMENT HOSTINGER & FIREBASE — PINO ESPACES VERTS

> **Version :** 3.0.0 (Production)  
> **Date :** 25 septembre 2026  
> **Projet Firebase :** `pagepino-e8e97` (Région `europe-west1`)  
> **Archive prête à l'emploi :** `pino-espaces-verts-production.zip`  
> **Répertoire source compilé :** `dist/`

---

## 📋 1. Synthèse de l'Architecture Livrée

Le projet a été entièrement nettoyé, durci et packagé en conformité avec les règles de production :
- **0 donnée privée exposée :** Règles de Realtime Database avec refus par défaut (`.read: false`, `.write: false`) et isolation stricte par compte utilisateur.
- **0 faille d'authentification :** Aucun mot de passe en dur, aucun compte simulé, authentification 100 % gérée par Firebase Auth.
- **0 CDN externe bloquant :** Feuille de style Tailwind CSS compilée et minifiée en local (`assets/css/tailwind.min.css`).
- **PWA & Offline Ready :** `manifest.json`, `sw.js` et icônes d'application configurés pour installation mobile (iOS et Android).
- **Conformité juridique et fiscale France :** Pages légales complètes (`/legal/mentions-legales.html`, `/legal/cgv.html`, `/legal/rgpd.html`, `/legal/mediation.html`, `/legal/cookies.html`) intégrant le cadre SAP (Crédit d'impôt 50 % CGI art. 199 sexdecies via SCIC Unipros, sans carte bancaire).

---

## 🌐 2. MÉTHODE 1 — Hébergement direct sur Hostinger (Le plus simple et rapide)

Votre client possède un hébergement Web chez Hostinger et souhaite y déposer le site.

### Étape 1 : Téléverser l'archive sur Hostinger
1. Connectez-vous au panneau de contrôle **Hostinger hPanel** ([hpanel.hostinger.com](https://hpanel.hostinger.com)).
2. Cliquez sur **Sites web** puis sur **Gérer** en face du site concerné.
3. Dans la colonne de gauche, ouvrez **Fichiers** → **Gestionnaire de fichiers** (File Manager).
4. Naviguez dans le répertoire racine du site web : **`public_html`**.
5. *(Recommandé)* Si d'anciens fichiers temporaires s'y trouvent (par exemple un fichier `default.php`), supprimez-les.
6. Cliquez sur le bouton **Téléverser** (flèche vers le haut en haut à droite) → **Fichier**.
7. Sélectionnez le fichier **`pino-espaces-verts-production.zip`** situé à la racine du projet.

### Étape 2 : Extraire le site
1. Dans le gestionnaire de fichiers Hostinger, faites un **clic droit** sur `pino-espaces-verts-production.zip` → sélectionnez **Extraire** (Extract).
2. Choisissez le dossier courant (`public_html` ou `.`).
3. Vérifiez la présence des fichiers clés directement à la racine de `public_html` :
   - `index.html`
   - `.htaccess` *(assure la réécriture d'URL, la redirection HTTPS et la sécurité)*
   - `assets/`
   - `legal/`
   - `manifest.json`
   - `sw.js`
   - `robots.txt`
   - `sitemap.xml`
   - `404.html`
4. Vous pouvez ensuite supprimer le fichier `.zip` pour libérer de l'espace.

### Étape 3 : Autoriser le domaine dans Firebase (CRUCIAL)
Pour que la connexion Google, l'espace client et l'envoi de devis fonctionnent depuis le domaine Hostinger :
1. Rendez-vous sur la [Console Firebase](https://console.firebase.google.com/).
2. Ouvrez le projet **`pagepino-e8e97`**.
3. Dans le menu de gauche, cliquez sur **Authentication** → onglet **Settings** (Paramètres).
4. Cliquez sur **Authorized domains** (Domaines autorisés) → **Add domain** (Ajouter un domaine).
5. Saisissez votre nom de domaine Hostinger (exemple : `pinoespacesverts.fr` ainsi que `www.pinoespacesverts.fr` ou le domaine temporaire fourni par Hostinger).
6. Cliquez sur **Enregistrer**.

*Dès cet instant, le site est 100 % opérationnel sur Hostinger avec le backend Firebase connecté.*

---

## ⚡ 3. MÉTHODE 2 — Nom de Domaine Hostinger pointé vers Firebase Hosting (Option CDN Google)

Si le domaine a été acheté chez Hostinger mais que vous souhaitez héberger le site directement sur Firebase Hosting :

### Étape 1 : Ajouter le domaine dans Firebase
1. Firebase Console → Projet `pagepino-e8e97` → **Hosting**.
2. Cliquez sur **Ajouter un domaine personnalisé** :
   - Entrez `pinoespacesverts.fr`.
   - Entrez `www.pinoespacesverts.fr` (recommandé en domaine principal).
3. Firebase vous affichera les enregistrements DNS exacts à renseigner.

### Étape 2 : Configurer les DNS dans Hostinger
1. Connectez-vous sur Hostinger hPanel → **Domaines** → Cliquez sur votre domaine.
2. Ouvrez l'onglet **DNS / Serveurs de noms** (DNS Zone Management).
3. Modifiez ou ajoutez les enregistrements demandés par Firebase :
   - Type **A** : hôte `@` pointant vers l'adresse IP indiquée par Firebase.
   - Type **CNAME** : hôte `www` pointant vers `pagepino-e8e97.web.app`.
4. Firebase validera automatiquement le domaine et générera le certificat SSL HTTPS sous quelques minutes à 24h.

---

## 🧪 4. Protocole de Test pour le Client

Une fois le site en ligne, le client peut valider l'intégralité des flux métier :

| Fonctionnalité | Action à tester | Résultat attendu |
|---|---|---|
| **Affichage & Branding** | Ouvrir l'URL du site sur mobile et ordinateur | Design vert forêt & crème fluide, coordonnées d'Andrés Pino, logo complet |
| **Demande de devis** | Remplir le formulaire « Demander mon Devis Gratuit » | Message de confirmation immédiat, devis enregistré dans Firebase RTDB |
| **Connexion Client** | Cliquer sur « Espace Membres » → Connexion Google ou Email | Connexion sécurisée, ouverture immédiate de l'Espace Client |
| **Crédit d'impôt SAP** | Cliquer sur « Calculer le prix » Unipros | Calculateur interactif 50% de réduction d'impôt immédiate (CGI 199 sexdecies) |
| **Installation PWA** | Ouvrir sur Safari iPhone (Partager → Sur l'écran d'accueil) ou Chrome Android | Icône application installable avec icônes haute résolution |
| **Pages Légales** | Cliquer sur Mentions Légales, CGV ou RGPD en pied de page | Pages complètes affichées avec SIRET 105 075 006 00012 et mentions obligatoires |
| **Sécurité & Hors ligne** | Couper la connexion internet sur la page | Bandeau réseau élégant avertissant de l'état hors ligne |

---

## 🔒 5. Déploiement des Règles Firebase

Pour clôturer la sécurité de la base de données en production :
1. Le propriétaire du compte Google Firebase (`pino.espacesverts@gmail.com`) ou le développeur authentifié exécute :
```bash
pnpm deploy:rules
```
2. Cela applique immédiatement les règles strictes de `database.rules.json` sur le projet `pagepino-e8e97`.
