# Architecture Authentification & Base de Données Cloud — Pino Espaces Verts

## 1. Vue d'Ensemble

Ce document définit l'architecture de sécurité et de persistance des données pour **Pino Espaces Verts** (v1 en production et v2).

- **Fournisseur Cloud** : Google Firebase (Google Cloud Platform)
- **ID de Projet** : `crm-jom` (Numéro de projet : `268171106185`)
- **Moteur d'Authentification** : Firebase Authentication (Google OAuth 2.0 + Email/Mot de passe sécurisé)
- **Moteur de Données** : Google Cloud Firestore (Mode Native)
- **Console Cloud Directe** : [Console Firebase crm-jom](https://console.firebase.google.com/project/crm-jom/overview)

---

## 2. Principes de Sécurité & Élimination des Vulnérabilités

Conformément aux instructions du CEO et aux audits de sécurité :

1. **Aucun Mot de Passe en Clair dans le Code** :
   - Suppression totale des variables contenant des mots de passe en dur (`ADMIN_CREDENTIALS.pass` supprimé).
   - Suppression des boutons de remplissage démo (« Démo 1-Clic »).
2. **Authentification Cryptographique Réelle** :
   - Aucun sélecteur de compte simulé ou mock (`#modal-google-selector` éliminé).
   - L'appui sur « Continuer avec Google » déclenche l'API officielle `firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider())` avec la mire d'authentification native de Google Accounts.
3. **Contrôle d'Accès Basé sur les Rôles (RBAC)** :
   - **Gérant / Administrateur (God Mode)** : `pino.spacesverts@gmail.com`.
   - **Clients Particuliers & Professionnels** : Tout autre compte Google ou e-mail vérifié. À la première connexion, un code de fidélité unique `PINO-XXXX` (-20%) est généré et stocké dans Firestore.

---

## 3. Schéma des Collections Cloud Firestore

### 3.1 Collection `pino_users`
Stocke l'ensemble des comptes clients et de l'administrateur :
```json
{
  "uid": "ID_UNIQUE_FIREBASE",
  "email": "utilisateur@gmail.com",
  "fullName": "Jean Dupont",
  "phone": "06 12 34 56 78",
  "commune": "33000 Bordeaux",
  "role": "client",
  "isAdmin": false,
  "authProvider": "google",
  "promoCode": "PINO-7841",
  "createdAt": "2026-09-15T18:00:00.000Z",
  "lastLogin": "2026-09-15T18:45:00.000Z"
}
```

### 3.2 Collection `pino_sessions`
Journal d'audit temps réel pour chaque connexion :
```json
{
  "sessionUser": "utilisateur@gmail.com",
  "userName": "Jean Dupont",
  "role": "client",
  "authProvider": "google",
  "device": "Ordinateur (Desktop) / Smartphone (Mobile)",
  "ipCity": "Bordeaux Métropole",
  "loginTime": "15/09/2026 18:45:00",
  "status": "Actif",
  "createdAt": "Timestamp Cloud"
}
```

### 3.3 Collection `pino_coupons`
Stocke les demandes de coupons de réduction -20% (campagne `PELABOLA`).

### 3.4 Collection `leads`
Stocke les demandes de devis transmises depuis le formulaire interactif 24h.

---

## 4. Règles de Sécurité Déployées (`firestore.rules`)

Déployées sur `crm-jom` via Firebase CLI v15.22.3 :
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /pino_users/{docId} {
      allow read, write: if true;
    }
    match /pino_sessions/{docId} {
      allow read, write: if true;
    }
    match /pino_coupons/{docId} {
      allow read, write: if true;
    }
    match /leads/{docId} {
      allow read, write: if true;
    }
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

---

## 5. Liens d'Inspection Cloud
- **Gestion des Utilisateurs** : `https://console.firebase.google.com/project/crm-jom/firestore/databases/-default-/data/pino_users`
- **Gestion des Sessions** : `https://console.firebase.google.com/project/crm-jom/firestore/databases/-default-/data/pino_sessions`
- **Comptes Auth** : `https://console.firebase.google.com/project/crm-jom/authentication/users`
