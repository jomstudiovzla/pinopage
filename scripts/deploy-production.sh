#!/usr/bin/env bash
# scripts/deploy-production.sh
# Publica Pino Espaces Verts en Firebase Hosting (dominio canónico pinoespacesverts.online).
# El dominio gratuito pagepino-e8e97.web.app sigue funcionando como repli permanente.
# Funciona en el plan gratuito Spark: si Cloud Functions no se puede desplegar
# (requiere plan Blaze), publica el sitio igualmente sin la ruta /api
# (la v1 estática no llama nunca a /api desde el cliente).
set -euo pipefail

PROJECT_ID="pagepino-e8e97"
SITE_URL="${PINO_SITE_URL:-https://pinoespacesverts.online}"
# Cuenta con acceso al proyecto. Se pasa explícitamente con --account porque, al
# ejecutarse dentro de pnpm (shell no interactivo), la cuenta activa por directorio
# no siempre se resuelve. Override: FIREBASE_ACCOUNT=otra@cuenta pnpm deploy:production
FIREBASE_ACCOUNT="${FIREBASE_ACCOUNT:-pino.spacesverts@gmail.com}"
# Los flags van DESPUÉS del subcomando (posición fiable en firebase-tools).
FB_ARGS="--account $FIREBASE_ACCOUNT --non-interactive"

echo "0/7 — Verificando acceso al proyecto $PROJECT_ID (cuenta: $FIREBASE_ACCOUNT)..."
if ! firebase projects:list --account "$FIREBASE_ACCOUNT" 2>&1 | grep -q "$PROJECT_ID"; then
  echo "⛔ La cuenta $FIREBASE_ACCOUNT no tiene acceso a $PROJECT_ID."
  echo "   Añádela con: firebase login:add  (inicia sesión con esa cuenta),"
  echo "   o exporta otra: FIREBASE_ACCOUNT=tu@cuenta pnpm deploy:production"
  exit 1
fi

echo "1/7 — Instalando dependencias..."
pnpm install
pnpm --prefix functions install

echo "2/7 — Ejecutando tests..."
pnpm test:rules
pnpm audit:static

echo "3/7 — Compilando frontend..."
PINO_SITE_URL="$SITE_URL" pnpm build

echo "4/7 — Limpiando build..."
bash scripts/cleanup-preprod.sh

echo "5/7 — Desplegando reglas de base de datos..."
firebase deploy --only database --project "$PROJECT_ID" $FB_ARGS

echo "6/7 — Desplegando Functions + Hosting..."
if firebase deploy --only functions --project "$PROJECT_ID" $FB_ARGS; then
  firebase deploy --only hosting --project "$PROJECT_ID" $FB_ARGS
else
  echo "⚠️  Functions no desplegadas (¿plan Spark?). Publicando Hosting sin /api..."
  node -e '
    const c = require("./firebase.json");
    c.hosting.rewrites = c.hosting.rewrites.filter((r) => !r.function);
    require("fs").writeFileSync("firebase.static.json", JSON.stringify(c, null, 2));
  '
  firebase deploy --only hosting --project "$PROJECT_ID" --config firebase.static.json $FB_ARGS
  rm -f firebase.static.json
fi

echo "7/7 — Verificando producción..."
DOMAIN="$SITE_URL" bash scripts/verify-production.sh || true

echo "✅ Publicado en $SITE_URL"
