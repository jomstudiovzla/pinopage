#!/usr/bin/env bash
# scripts/cleanup-preprod.sh
set -euo pipefail

DIST="dist"

echo "══════════════════════════════════════════════"
echo " PINO ESPACES VERTS — CLEANUP PRE-PRODUCCIÓN"
echo "══════════════════════════════════════════════"

test -d "$DIST" || {
  echo "❌ dist/ no existe. Ejecuta el build primero."
  exit 1
}

fail_if_found() {
  local pattern="$1"
  local message="$2"

  if grep -RniE "$pattern" "$DIST" \
    --include="*.html" \
    --include="*.js" \
    --include="*.css" \
    --include="*.json"; then
    echo "❌ $message"
    exit 1
  fi
}

fail_if_found "localhost|127\.0\.0\.1" "Se detectó localhost en producción."
fail_if_found "github\.io" "Se detectó github.io en producción."
fail_if_found "cdn\.tailwindcss\.com" "Tailwind CDN sigue presente."
fail_if_found "Pino2026|password.*admin|mock.*login|fake.*login" "Se detectó posible bypass o secreto."
fail_if_found "Jean-Christophe|demo.*quote|fake.*quote" "Se detectaron datos demo."
fail_if_found "serve\.py" "serve.py no puede existir en dist/."
fail_if_found "sourceMappingURL" "Se detectó source map público."
fail_if_found "console\.log" "Se detectó console.log en bundle productivo."

if find "$DIST" -type f \( -name ".env" -o -name "package.json" -o -name "*.map" \) | grep -q .; then
  echo "❌ Hay archivos prohibidos dentro de dist/."
  exit 1
fi

echo "✅ Cleanup de producción completado."
