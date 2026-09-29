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
ROBOTS="$(curl -sfL "$DOMAIN/robots.txt" || true)"
SITEMAP="$(curl -sfL "$DOMAIN/sitemap.xml" || true)"
RGPD="$(curl -sfL "$DOMAIN/legal/rgpd.html" || true)"
MENTIONS="$(curl -sfL "$DOMAIN/legal/mentions-legales.html" || true)"
CGV="$(curl -sfL "$DOMAIN/legal/cgv.html" || true)"

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
has "$HOME_HTML" "Pino Espaces Verts"; check "Marca correcta en dominio final" $?

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
