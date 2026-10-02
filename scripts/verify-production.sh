#!/usr/bin/env bash
# scripts/verify-production.sh — verificación de producción (solo lectura, GET).
set -uo pipefail

# Domaine canónico. Antes de conectar el dominio, audita el repli con:
#   DOMAIN=https://pagepino-e8e97.web.app pnpm verify:production
DOMAIN="${DOMAIN:-https://pinoespacesverts.online}"
RTDB="${RTDB:-https://pagepino-e8e97-default-rtdb.europe-west1.firebasedatabase.app}"

PASS=0
FAIL=0
CHK=1

check() {
  local name="$1" status="$2"
  if [ "$status" -eq 0 ]; then
    echo "✅ CHK-$(printf '%02d' "$CHK"): $name"; PASS=$((PASS + 1))
  else
    echo "❌ CHK-$(printf '%02d' "$CHK"): $name"; FAIL=$((FAIL + 1))
  fi
  CHK=$((CHK + 1))
}

# has HAYSTACK REGEX → 0 si el patrón aparece. Usa here-string (grep no cierra
# una tubería viva), evitando el falso fallo por SIGPIPE + pipefail.
has()    { grep -qiE "$2" <<< "$1"; }
hasnot() { ! grep -qiE "$2" <<< "$1"; }

echo "════════════════════════════════════════════════════"
echo " PINO ESPACES VERTS — VERIFICACIÓN DE PRODUCCIÓN"
echo " Dominio: $DOMAIN"
echo " Fecha: $(date -u '+%Y-%m-%d %H:%M UTC')"
echo "════════════════════════════════════════════════════"

# Descargas únicas (cada recurso se pide una sola vez).
# -L sigue las redirecciones (cleanUrls redirige /legal/x.html -> /legal/x).
HOME_HTML="$(curl -sfL "$DOMAIN" || true)"
HOME_HEAD="$(curl -sfIL "$DOMAIN" || true)"
MANIFEST="$(curl -sfL "$DOMAIN/manifest.json" || true)"
SW_HEAD="$(curl -sfIL "$DOMAIN/sw.js" || true)"
SW_JS="$(curl -sfL "$DOMAIN/sw.js" || true)"
ROBOTS="$(curl -sfL "$DOMAIN/robots.txt" || true)"
SITEMAP="$(curl -sfL "$DOMAIN/sitemap.xml" || true)"
RGPD="$(curl -sfL "$DOMAIN/legal/rgpd.html" || true)"
MENTIONS="$(curl -sfL "$DOMAIN/legal/mentions-legales.html" || true)"
CGV="$(curl -sfL "$DOMAIN/legal/cgv.html" || true)"
PRIVACY="$(curl -sfL "$DOMAIN/politique-de-confidentialite" || true)"
TERMS="$(curl -sfL "$DOMAIN/conditions-generales" || true)"
PRIVACY_CODE="$(curl -sfL -o /dev/null -w '%{http_code}' "$DOMAIN/politique-de-confidentialite" || true)"
TERMS_CODE="$(curl -sfL -o /dev/null -w '%{http_code}' "$DOMAIN/conditions-generales" || true)"
UNKNOWN_CODE="$(curl -sL -o /tmp/pino-fase6-404.html -w '%{http_code}' "$DOMAIN/cette-page-nexiste-pas-pino-fase6" || true)"
UNKNOWN_BODY="$(cat /tmp/pino-fase6-404.html 2>/dev/null || true)"
ADMIN_CODE="$(curl -sL -o /tmp/pino-fase7-admin.html -w '%{http_code}' "$DOMAIN/admin" || true)"
ADMIN_BODY="$(cat /tmp/pino-fase7-admin.html 2>/dev/null || true)"
FORBIDDEN="$(curl -sfL "$DOMAIN/403.html" || true)"
FIVEHUNDRED="$(curl -sfL "$DOMAIN/500.html" || true)"
MAINT="$(curl -sfL "$DOMAIN/maintenance.html" || true)"
ERR_JS="$(curl -sfL "$DOMAIN/assets/js/pino-errors.js" || true)"
ADMIN_JS="$(curl -sfL "$DOMAIN/assets/js/pino-admin.js" || true)"
FB_CFG="$(curl -sfL "$DOMAIN/assets/js/firebase-config.js" || true)"

[ -n "$HOME_HTML" ]; check "Home responde 200" $?
has "$HOME_HEAD" "HTTP/[123](\.[0-9])? 200"; check "HTTPS/SSL operativo" $?
has "$MANIFEST" '"name"'; check "Manifest PWA disponible" $?
has "$SW_HEAD" "200"; check "Service Worker disponible" $?
hasnot "$HOME_HTML" "cdn\.tailwindcss"; check "No usa Tailwind CDN" $?
hasnot "$HOME_HTML" "localhost|127\.0\.0\.1"; check "No contiene localhost" $?
hasnot "$HOME_HTML" "github\.io"; check "No contiene GitHub Pages" $?
hasnot "$HOME_HTML" "Pino2026"; check "No contiene password hardcodeada" $?
hasnot "$HOME_HTML" "Jean-Christophe"; check "No contiene datos demo" $?
has "$HOME_HEAD" "content-security-policy"; check "CSP presente" $?
has "$HOME_HEAD" "x-content-type-options"; check "X-Content-Type-Options presente" $?
has "$HOME_HEAD" "referrer-policy"; check "Referrer-Policy presente" $?
has "$ROBOTS" "sitemap"; check "robots.txt contiene sitemap" $?
has "$SITEMAP" "<urlset"; check "sitemap.xml válido" $?
has "$HOME_HTML" 'property="og:title"'; check "Open Graph presente" $?
has "$HOME_HTML" 'application/ld\+json'; check "Schema JSON-LD presente" $?
has "$HOME_HTML" "cookie"; check "Banner o configuración de cookies presente" $?
has "$HOME_HTML" "canonical.*pinoespacesverts\.online"; check "Canonical apunta a .online" $?

has "$(curl -s "$RTDB/users.json" || true)" "permission_denied|permission denied"; check "RTDB anónima no lee users" $?
has "$(curl -s "$RTDB/clients_records.json" || true)" "permission_denied|permission denied"; check "RTDB anónima no lee clients" $?
has "$(curl -s "$RTDB/quotes.json" || true)" "permission_denied|permission denied"; check "RTDB anónima no lee quotes" $?
has "$(curl -s "$RTDB/coupons.json" || true)" "permission_denied|permission denied"; check "RTDB anónima no lee coupons" $?
has "$(curl -s "$RTDB/leads.json" || true)" "permission_denied|permission denied"; check "RTDB anónima no lee leads" $?

has "$RGPD" "RGPD|données"; check "Página legal RGPD disponible" $?
has "$MENTIONS" "mentions|éditeur"; check "Mentions légales disponibles" $?
has "$CGV" "conditions|vente"; check "CGV disponible" $?
[ "$PRIVACY_CODE" = "200" ]; check "URL OAuth privacy HTTP 200" $?
has "$PRIVACY" "Politique de Confidentialité"; check "URL OAuth privacy publique sans login" $?
hasnot "$PRIVACY" "pinoConsumeRedirectResult"; check "Privacy n'est pas le SPA" $?
[ "$TERMS_CODE" = "200" ]; check "URL OAuth CGV HTTP 200" $?
has "$TERMS" "Conditions Générales de Vente"; check "URL OAuth CGV publique sans login" $?
hasnot "$TERMS" "pinoConsumeRedirectResult"; check "CGV n'est pas le SPA" $?
has "$SITEMAP" "politique-de-confidentialite"; check "Sitemap contient privacy OAuth" $?
has "$HOME_HTML" 'href="/politique-de-confidentialite"'; check "Footer accueil lie la privacy" $?
has "$HOME_HTML" "Pino Espaces Verts"; check "Marca correcta en dominio final" $?
has "$HOME_HTML" "pino-auth-google.js"; check "Script Google multidispositif chargé" $?
has "$HOME_HTML" "pinoConsumeRedirectResult"; check "getRedirectResult singleton présent" $?
has "$HOME_HTML" "pino-ba-slider.js"; check "Script curseur Avant/Après chargé" $?
has "$HOME_HTML" 'id="galerie-ba-prev"'; check "Bouton Voir l'Avant présent" $?
has "$HOME_HTML" 'id="lightbox-next"'; check "Navigation lightbox galerie présente" $?
has "$SW_JS" "pino-ev-v47-admin"; check "Service Worker v47 admin" $?
has "$SW_JS" "pino-ba-slider.js"; check "SW cache le helper slider" $?
has "$HOME_HTML" "pino-errors.js"; check "Script couche erreurs globale chargé" $?
has "$SW_JS" "pino-errors.js"; check "SW cache pino-errors.js" $?
[ "$UNKNOWN_CODE" = "404" ]; check "URL inconnue HTTP 404" $?
has "$UNKNOWN_BODY" "introuvable"; check "Page 404 française (pas le SPA)" $?
hasnot "$UNKNOWN_BODY" "pinoConsumeRedirectResult"; check "404 n'est pas le SPA" $?
has "$FIVEHUNDRED" "indisponible"; check "Page 500 française disponible" $?
has "$MAINT" "maintenance"; check "Page maintenance française disponible" $?
has "$ERR_JS" "textContent"; check "Toast live utilise textContent" $?
hasnot "$ERR_JS" "innerHTML"; check "Toast live sans innerHTML" $?
has "$FB_CFG" "maintenance:\s*false"; check "PINO_FLAGS.maintenance désactivé" $?
[ "$ADMIN_CODE" = "200" ]; check "/admin HTTP 200 (SPA, pas 404)" $?
has "$ADMIN_BODY" "pinoConsumeRedirectResult"; check "/admin sert le SPA" $?
has "$ADMIN_BODY" "modal-window-admin"; check "/admin contient le panneau admin" $?
hasnot "$ADMIN_BODY" "Page introuvable"; check "/admin n'est pas la 404" $?
has "$FORBIDDEN" "Accès refusé"; check "Page 403 française disponible" $?
has "$FORBIDDEN" "noindex"; check "403 noindex" $?
has "$HOME_HTML" "pino-admin.js"; check "Script PinoAdmin chargé" $?
has "$ADMIN_JS" "decideAdminRoute"; check "PinoAdmin.decideAdminRoute live" $?
has "$SW_JS" "pino-admin.js"; check "SW cache pino-admin.js" $?

# API (Cloud Functions): informativo. En plan Spark no se despliegan y /api da 404;
# la v1 estática no llama a /api, así que NO cuenta como fallo de producción.
echo "──────────────── API (informativo) ────────────────"
API_HEALTH="$(curl -sf "$DOMAIN/api/health" 2>/dev/null || true)"
if [ -n "$API_HEALTH" ] && grep -qiE '"status"\s*:\s*"ok"' <<< "$API_HEALTH"; then
  echo "ℹ️  API /api/health activa (Functions desplegadas)."
else
  echo "ℹ️  API /api/* no desplegada (plan Spark). Normal en v1: no se usa /api."
fi

echo "════════════════════════════════════════════════════"
echo " RESULTADO: $PASS PASS · $FAIL FAIL"
echo "════════════════════════════════════════════════════"

if [ "$FAIL" -eq 0 ]; then
  echo "🎉 PRODUCCIÓN APROBADA PARA PINO ESPACES VERTS."
  exit 0
fi
echo "⛔ Revisar los checks marcados ❌."
exit 1
