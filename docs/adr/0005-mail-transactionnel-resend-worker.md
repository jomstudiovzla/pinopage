# ADR 0005 — Courrier transactionnel Resend + Cloudflare Worker

- Statut : accepté (FASE 1, 2026-10-02)
- Décideurs : JOM Studio / Pino Espaces Verts

## Contexte

Le devis et les messages CRM passaient par FormSubmit et Web3Forms (clés publiques, succès
faux, pas d'identité Andrés Pino). Gmail API n'est disponible que dans une session admin.
`mail_outbox` acceptait des écritures anonymes (relais spam).

## Décision

1. Persister le devis / le message dans Realtime Database **avant** l'envoi. Succès utilisateur = persisté.
2. Canal principal : Cloudflare Worker `https://pino-mail.pinoespacesverts.online` → Resend.
3. From : `Andrés Pino — Pino Espaces Verts <andresp@pinoespacesverts.online>`.
   Reply-To : `pino.espacesverts@gmail.com` tant que la boîte @domaine n'est pas provisionnée.
4. États `mail_outbox` : `received` → `processing` → `sent` | `failed` | `queued`.
5. Écriture `mail_outbox` : admin vérifié uniquement. Visiteur : file `localStorage`.
6. Functions `/emails/send` envoie via Resend si `RESEND_API_KEY` est présent (sinon `queued`).
   Le navigateur n'appelle jamais `/api/*`.
7. Gmail API : pont de dernier recours dans une session admin, pas la production.

## Conséquences

- FormSubmit et Web3Forms hors du chemin critique et de la CSP (`form-action 'self'`).
- Un devis sans e-mail (téléphone seul) alerte l'admin ; avec e-mail, Worker envoie client + Andrés + JOM.
- Déploiement Worker : `npx wrangler deploy` dans `infra/cloudflare/mail-worker/` (secret `RESEND_API_KEY`).
