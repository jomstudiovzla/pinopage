# Couche globale d’erreurs — FASE 6

v1 statique (PWA). Pas de Error Boundary React : capture `window.onerror` + `unhandledrejection`, catalogue FR, toast non XSS.

## Catalogue

| Code | Utilisateur (FR) | Retry | Sévérité |
|---|---|---|---|
| AUTH_ERROR | Messages `pino-auth-errors.js` si code Firebase, sinon repli identité | oui | warning |
| VALIDATION_ERROR | Vérifiez les informations saisies | non | info |
| NETWORK_ERROR | Connexion réseau impossible | oui | warning |
| PERMISSION_DENIED | Pas l’autorisation | non | error |
| NOT_FOUND | Élément introuvable | non | info |
| RATE_LIMITED | Trop de tentatives | oui | warning |
| EMAIL_DELIVERY_ERROR | L’e-mail partira dès que possible | oui | warning |
| RTDB_ERROR | Données non enregistrées | oui | error |
| FIRESTORE_ERROR | Alias v1 de RTDB_ERROR (store live = Realtime Database) | oui | error |
| UNKNOWN_ERROR | Erreur inattendue, recharger | oui | error |

Chaque entrée : code interne, message technique (logs), message FR, action, `retryable`, sévérité.

## Surfaces

- `assets/js/pino-errors.js` — `PinoErrors.report` / `showToast` / `fetchWithTimeout` / `fetchWithRetry` / `guardSubmit` / `withLoading` / `renderEmpty`
- Toast `#app-notification-toast` : `textContent` (plus d’`innerHTML`), `role="alert"`, bouton **Réessayer** si retryable
- Journal : `sessionStorage.pino_error_ring` (20 max, e-mail/téléphone masqués). `console.warn` uniquement
- Corrélation : `pino-{time36}-{rand}` dans `X-Pino-Correlation-Id` et `data-corr` du toast
- 404 / 500 / maintenance : `public/404.html`, `public/500.html`, `public/maintenance.html`
- Catch-all SPA retiré : une URL inconnue sert la 404, elle n’ouvre plus l’accueil
- Maintenance : `PINO_FLAGS.maintenance === true` redirige vers `/maintenance.html`
- Sentry : uniquement si `PINO_FLAGS.sentryDsn` **et** consentement analytics CNIL **et** `window.PINO_SENTRY`. Aucun SDK chargé en v1
- Cloud Functions : non déployées (Spark). Le Worker mail journalise côté Cloudflare

## Hors périmètre v1

Custom Claims admin (FASE 7–8), Firestore, chargement Sentry sans consentement.
