#!/usr/bin/env bash
# scripts/deploy-production.sh
set -euo pipefail

PROJECT_ID="pagepino-e8e97"

echo "1/6 — Instalando dependencias..."
pnpm install
pnpm --prefix functions install

echo "2/6 — Ejecutando tests..."
pnpm test:rules
pnpm audit:static

echo "3/6 — Compilando frontend..."
pnpm build

echo "4/6 — Limpiando build..."
bash scripts/cleanup-preprod.sh

echo "5/6 — Desplegando Firebase..."
firebase deploy \
  --only hosting,functions,database \
  --project "$PROJECT_ID"

echo "6/6 — Verificando producción..."
DOMAIN="https://www.pinoespacesverts.fr" \
bash scripts/verify-production.sh

echo "✅ Deploy de Pino Espaces Verts finalizado."
