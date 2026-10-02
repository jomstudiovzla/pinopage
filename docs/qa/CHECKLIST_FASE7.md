# Checklist QA fonctionnelle — FASE 7

À cocher sur `https://pinoespacesverts.online` (desktop + iPhone Safari).

- [ ] `/admin` sans session : le site se charge (pas « Page introuvable »), formulaire de connexion
- [ ] `/admin` avec un compte **client** vérifié : page **Accès refusé** (403), téléphone 06 51 59 40 34
- [ ] `/admin` avec Andrés (e-mail liste + vérifié) : panneau God Mode, couronne header « Session administrateur active »
- [ ] Client connecté : header « Session client active », pas de couronne, clic header → espace client
- [ ] URL inventée (`/cette-page-nexiste-pas-pino-fase6`) : toujours 404 française
- [ ] `/403.html` et `/500.html` : crème/vert, `noindex` sur 403
- [ ] Un client ne voit pas les devis des autres (règles RTDB, inchangé)
- [ ] Après `node scripts/set-admin-claim.mjs …` : nouvelle connexion, `getIdTokenResult().claims.admin === true`
- [ ] SW `pino-ev-v47-admin` après hard refresh
- [ ] Legal OAuth et curseur Avant/Après inchangés
