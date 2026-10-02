# Checklist QA fonctionnelle — FASE 6

À cocher sur `https://pinoespacesverts.online` (desktop + iPhone Safari).

- [ ] Accueil 200, palette crème/vert, pas de bandeau d’erreur au chargement
- [ ] URL inventée (`/cette-page-nexiste-pas`) → page **Page introuvable**, lien accueil
- [ ] `/500` affiche « Service indisponible » + téléphone
- [ ] `/maintenance.html` affiche le texte de maintenance (drapeau `PINO_FLAGS.maintenance` reste `false` en prod)
- [ ] Toast devis si l’enregistrement échoue : français, bouton fermer, pas de HTML brut exécuté
- [ ] Auth : mot de passe court → message 8 caractères (FASE 2, inchangé)
- [ ] Hors ligne puis devis : toast réseau ou file d’attente mail, pas de page blanche
- [ ] Double clic Envoyer devis : un seul envoi (bouton disabled / `data-pino-busy`)
- [ ] Chip session header admin **et** client toujours visibles après login (FASE 3)
- [ ] Curseur Avant/Après (FASE 5) toujours cliquable
- [ ] Aucun `console.log` dans le bundle ; erreurs via `console.warn('[pino-errors]', …)`
- [ ] SW `pino-ev-v46-errors` après hard refresh
- [ ] Legal `/politique-de-confidentialite` et `/conditions-generales` toujours hors SPA
