#!/usr/bin/env bash
# scripts/verify-production.sh
set -uo pipefail

DOMAIN="${DOMAIN:-https://pagepino-e8e97.web.app}"
RTDB="${RTDB:-https://pagepino-e8e97-default-rtdb.europe-west1.firebasedatabase.app}"

PASS=0
FAIL=0
CHK=1

check() {
  local name="$1"
  local status="$2"

  if [ "$status" -eq 0 ]; then
    echo "✅ CHK-$(printf '%02d' "$CHK"): $name"
    PASS=$((PASS + 1))
  else
    echo "❌ CHK-$(printf '%02d' "$CHK"): $name"
    FAIL=$((FAIL + 1))
  fi

  CHK=$((CHK + 1))
}

echo "════════════════════════════════════════════════════"
echo " PINO ESPACES VERTS — VERIFICACIÓN DE PRODUCCIÓN"
echo " Dominio: $DOMAIN"
echo " Fecha: $(date -u '+%Y-%m-%d %H:%M UTC')"
echo "════════════════════════════════════════════════════"

curl -sf -o /dev/null "$DOMAIN"
check "Home responde 200" $?

curl -sfI "$DOMAIN" | grep -qiE "HTTP/[123](\.[0-9])? 200"
check "HTTPS/SSL operativo" $?

curl -sf "$DOMAIN/manifest.json" | grep -q '"name"'
check "Manifest PWA disponible" $?

curl -sfI "$DOMAIN/sw.js" | grep -qi "200"
check "Service Worker disponible" $?

curl -sf "$DOMAIN" | grep -qi "cdn.tailwindcss" && R=1 || R=0
check "No usa Tailwind CDN" $R

curl -sf "$DOMAIN" | grep -qiE "localhost|127\.0\.0\.1" && R=1 || R=0
check "No contiene localhost" $R

curl -sf "$DOMAIN" | grep -qi "github.io" && R=1 || R=0
check "No contiene GitHub Pages" $R

curl -sf "$DOMAIN" | grep -qi "Pino2026" && R=1 || R=0
check "No contiene password hardcodeada" $R

curl -sf "$DOMAIN" | grep -qi "Jean-Christophe" && R=1 || R=0
check "No contiene datos demo" $R

curl -sfI "$DOMAIN" | grep -qi "content-security-policy"
check "CSP presente" $?

curl -sfI "$DOMAIN" | grep -qi "x-content-type-options"
check "X-Content-Type-Options presente" $?

curl -sfI "$DOMAIN" | grep -qi "referrer-policy"
check "Referrer-Policy presente" $?

curl -sf "$DOMAIN/robots.txt" | grep -qi "sitemap"
check "robots.txt contiene sitemap" $?

curl -sf "$DOMAIN/sitemap.xml" | grep -qi "<urlset"
check "sitemap.xml válido" $?

curl -sf "$DOMAIN" | grep -qi 'property="og:title"'
check "Open Graph presente" $?

curl -sf "$DOMAIN" | grep -qi 'application/ld+json'
check "Schema JSON-LD presente" $?

curl -sf "$DOMAIN" | grep -qi "cookie"
check "Banner o configuración de cookies presente" $?

curl -sf "$DOMAIN" | grep -qiE "maps\.google|google\.com/maps"
check "Integración de mapa presente" $?

curl -s "$RTDB/users.json" | grep -qiE "permission_denied|permission denied"
check "RTDB anónima no lee users" $?

curl -s "$RTDB/clients.json" | grep -qiE "permission_denied|permission denied"
check "RTDB anónima no lee clients" $?

curl -s "$RTDB/quotes.json" | grep -qiE "permission_denied|permission denied"
check "RTDB anónima no lee quotes" $?

curl -s "$RTDB/coupons.json" | grep -qiE "permission_denied|permission denied"
check "RTDB anónima no lee coupons" $?

curl -s "$RTDB/sessions.json" | grep -qiE "permission_denied|permission denied"
check "RTDB anónima no lee sessions" $?

curl -sf "$DOMAIN/api/health" | grep -qiE '"status"\s*:\s*"ok"'
check "API health responde correctamente" $?

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$DOMAIN/api/coupons/validate" \
  -H "Content-Type: application/json" \
  -d '{"couponCode":"TEST"}')
[ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]
check "API cupón bloquea llamada anónima" $?

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$DOMAIN/api/admin/users/test/role" \
  -H "Content-Type: application/json" \
  -d '{"role":"admin"}')
[ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]
check "API admin bloquea llamada anónima" $?

curl -sf "$DOMAIN/legal/rgpd.html" | grep -qiE "RGPD|données"
check "Página legal RGPD disponible" $?

curl -sf "$DOMAIN/legal/mentions-legales.html" | grep -qiE "mentions|éditeur"
check "Mentions légales disponibles" $?

curl -sf "$DOMAIN/legal/cgv.html" | grep -qiE "conditions|vente"
check "CGV disponible" $?

curl -sf "$DOMAIN" | grep -qi "Pino Espaces Verts"
check "Marca correcta en dominio final" $?

echo "════════════════════════════════════════════════════"
echo " RESULTADO: $PASS/30 PASS · $FAIL/30 FAIL"
echo "════════════════════════════════════════════════════"

if [ "$FAIL" -eq 0 ]; then
  echo "🎉 PRODUCCIÓN APROBADA PARA PINO ESPACES VERTS."
  exit 0
fi

echo "⛔ PRODUCCIÓN NO APROBADA. Corregir fallos antes del cierre."
exit 1
