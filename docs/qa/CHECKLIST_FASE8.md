# Checklist QA fonctionnelle — FASE 8

Le magasin vivant est **Realtime Database** (`pagepino-e8e97`). Pas de Firestore.

À cocher après `firebase deploy --only database` (pas de nouveau bundle Hosting).

- [ ] Un visiteur anonyme peut déposer un devis `status=new` / `source=web_devis`
- [ ] Un visiteur ne lit aucun nœud (`users`, `leads`, `mail_outbox`, `audit_logs`)
- [ ] Un client vérifié lit **ses** devis (`email` = son compte) et pas ceux des autres
- [ ] Un client ne peut pas passer un devis à « Gagné » (status figé)
- [ ] Un client ne peut pas poser `admin: true` / `role: admin` / `isAdmin: true` sur son profil
- [ ] Header : session **admin** et session **client** toujours visibles après login (inchangé FASE 3/7)
- [ ] Un client ne lit pas `audit_logs` ni `mail_outbox` ni `admin_notifications`
- [ ] Connexion client : une ligne d’audit avec `sessionUser` = son e-mail (pas l’e-mail d’Andrés)
- [ ] Andrés (liste + e-mail vérifié) lit tous les devis dans God Mode
- [ ] File mail : seul l’admin écrit `mail_outbox` ; le devis public passe par le Worker Resend
- [ ] Calendrier réalisations toujours statique (pas de nœud `/gardenCalendar`)
- [ ] `PINO_FLAGS.appleLogin` et `maintenance` restent `false` en prod (pas de nœud `/siteSettings`)
- [ ] URL inconnue toujours 404 ; `/admin` inchangé (FASE 6/7)
- [ ] SW `pino-ev-v47-admin` (FASE 8 ne bump pas le cache)
- [ ] `pnpm test:rules` vert (émulateur, y compris FASE 8)
