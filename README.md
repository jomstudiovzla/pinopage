# Pino Espaces Verts – Maison digitale

Site et future plateforme de **Pino Espaces Verts** (Andrés Pino) — entretien et aménagement de jardins à Bordeaux et en Gironde, partenaire **Unipros** (50 % de crédit d’impôt SAP).

## Deux états du projet

| | v1 (en ligne) | v2 (spécifiée) |
|---|---|---|
| Code | `index.html` + PWA | Next.js 15 + Supabase `eu-west-3` (Paris) |
| URL actuelle | [GitHub Pages](https://jomstudiovzla.github.io/pinopage/) | Domaine cible `www.pinoespacesverts.fr` |
| Données | Firebase `crm-jom` + Web3Forms | Postgres RLS + Storage UE |
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

1. SEO local JSON-LD (Bordeaux / Gironde)
2. Galerie avant/après et chantiers réels
3. Coupon **PELABOLA** −20 % (cumulable avec Unipros)
4. Chatbot (services, Unipros, devis) — n’affiche jamais le code en clair
5. Mentions, CGV, RGPD, médiation CNPM
6. PWA, CTA téléphone / WhatsApp

## Interdits produit

- Thème sombre
- Encaisser une CB « 50 % » à la place d’Unipros
- Région Supabase générique « Europe » (Londres / Zurich possibles)
- Inventer un SIRET ou un capital social (EI)

## Développement local (localhost)

À la racine du dépôt :

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

- Site v1 : [http://127.0.0.1:8080/](http://127.0.0.1:8080/)
- Document maître : [http://127.0.0.1:8080/DOCUMENTO_MAESTRO.md](http://127.0.0.1:8080/DOCUMENTO_MAESTRO.md)

## Déploiement v1

Hébergeur actuel : GitHub Pages (`main` / racine) — [pinopage](https://jomstudiovzla.github.io/pinopage/). Le texte Mentions Légales devra citer l’hébergeur **réel** dès la v2 (voir ADR-0004).
