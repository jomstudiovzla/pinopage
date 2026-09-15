# Pino Espaces Verts – Site Web Officiel

Bienvenue dans le code source de la maison digitale de **Pino Espaces Verts** (Andrés Pino). Ce projet a été développé en respectant le **Plan de Développement JOM Studio**.

## 📁 Structure du Projet

```txt
new/
├── index.html          # Page d'accueil unique, interactive et optimisée SEO
├── manifest.json       # Configuration PWA pour l'installation sur mobile
├── sw.js               # Service Worker pour la mise en cache et le support hors-ligne
└── assets/             # Fichiers médias du site
    ├── logo/
    │   ├── Logo pino.png
    │   └── Logo completo.png
    ├── qr/
    │   ├── QR_WhatsApp.png
    │   ├── QR_Instagram.png
    │   ├── QR_Email.png
    │   └── QR_LandingPage.png
    └── images/
        ├── tiro.png     # Image avant travaux (Before)
        └── retiro.png   # Image après travaux (After)
```

## 🚀 Fonctionnalités Clés

1. **Ciment & SEO :** Données structurées JSON-LD intégrées pour optimiser le classement Google local (Bordeaux et Gironde).
2. **Galerie Avant/Après :** Slider interactif permettant de comparer visuellement la transformation d'un chantier.
3. **Le Cerveau (Automatisation) :**
   - Formulaire de coupon de réduction de 20% avec génération automatique de code promotionnel.
   - Assistant Chatbot intelligent en bas à droite simulant les réponses hors-horaires (sur Unipros, les devis et les services).
4. **Prêt pour Mobile (PWA) :** Installable sur smartphone, fonctionne instantanément et gère le cache hors-ligne.

## 🛠️ Déploiement

Pour publier ce site en production :
1. Choisissez un hébergeur statique (ex: Hostinger, GitHub Pages, Firebase Hosting ou Vercel).
2. Uploadez tout le contenu du dossier `new/` à la racine de votre hébergement.
3. Achetez le nom de domaine officiel (ex: `www.pinoespacesverts.fr`) et configurez les DNS pour pointer vers votre hébergement.
