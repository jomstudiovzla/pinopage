# Pino Espaces Verts – Maison digitale

Site et plateforme de **Pino Espaces Verts** (Andrés Pino, SIRET 105 075 006 00012) — entretien et aménagement de jardins à Entraigues-sur-la-Sorgue et dans un rayon de 40-45 km en Vaucluse (84), partenaire **Unipros** (crédit d’impôt SAP 50 %).

## Deux états du projet

| | v1 (en ligne) | v2 (spécifiée) |
|---|---|---|
| Code | `index.html` + PWA | Next.js 15 + Supabase `eu-west-3` (Paris) |
| URL actuelle | [GitHub Pages](https://jomstudiovzla.github.io/pinopage/) | Domaine cible `www.pinoespacesverts.fr` |
| Données | Firebase Auth + Realtime Database `pagepino-e8e97` (europe-west1) | Postgres RLS + Storage UE |
| Spec | — | **[`DOCUMENTO_MAESTRO.md`](./DOCUMENTO_MAESTRO.md)** |

La v1 **reste en production** jusqu’au hito 6 (coupure DNS). Ne pas la démanteler.

## Gouvernance (à lire avant de coder)

- [`DOCUMENTO_MAESTRO.md`](./DOCUMENTO_MAESTRO.md) — exigences, UX, Unipros vs paiement direct, RGPD, rôles, schéma, menaces
- [`tareas.md`](./tareas.md) — backlog exécutable
- [`plan_implementacion.md`](./plan_implementacion.md) — ordre des hitos
- [`AGENTS.md`](./AGENTS.md) — règles pour agents
- [`docs/sql/001_initial_schema.sql`](./docs/sql/001_initial_schema.sql)
- [`docs/adr/`](./docs/adr/)
- [`docs/LEGAL_ET_FISCAL_FRANCE.md`](./docs/LEGAL_ET_FISCAL_FRANCE.md)
- [`docs/UNIPROS_KNOWLEDGE_BASE.md`](./docs/UNIPROS_KNOWLEDGE_BASE.md)

## v1 — fonctionnalités déjà livrées

1. SEO local JSON-LD (Entraigues-sur-la-Sorgue / Vaucluse 84)
2. Galerie avant/après et chantiers réels
3. Coupon de bienvenue −20 % (cumulable avec Unipros)
4. Chatbot (services, Unipros, devis)
5. Mentions, CGV officielles, RGPD, médiation CM2C, Tribunal d’Avignon
6. PWA, CTA téléphone / WhatsApp, devis sans compte, signature tactile, prise de RDV

## Interdits produit

- Thème sombre
- Encaisser une CB « 50 % » à la place d’Unipros
- Région Supabase générique « Europe » (Londres / Zurich possibles)
- Inventer un SIRET ou un capital social (EI)

## Développement local (localhost)

```bash
pnpm install          # une fois
pnpm dev              # http://localhost:5500/
pnpm test             # règles (émulateur) + E2E Chromium / WebKit iPhone
pnpm audit:static     # contrôles du code livré
```

Prérequis : Node 20+, pnpm, Python 3, Java 21 (émulateurs Firebase), `firebase-tools`.
Utiliser `localhost` (autorisé par Firebase Auth) plutôt que `127.0.0.1`.

## Déploiement v1

Hébergeur actuel : GitHub Pages (`main` / racine) — [pinopage](https://jomstudiovzla.github.io/pinopage/). Le texte Mentions Légales devra citer l’hébergeur **réel** dès la v2 (voir ADR-0004).

Règles de la base : `pnpm deploy:rules` (compte Google propriétaire du projet `pagepino-e8e97`).
Mise en ligne sur le domaine définitif : voir la checklist de `CURRENT_STATE.md`.
