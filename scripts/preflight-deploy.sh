#!/usr/bin/env bash
# Porte locale avant un déploiement (aucune écriture production).
# Usage : pnpm preflight
# Optionnel : PINO_PREFLIGHT_E2E=1 pnpm preflight   (ajoute Playwright, ~5 min)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROJECT_ID="pagepino-e8e97"
FIREBASE_ACCOUNT="${FIREBASE_ACCOUNT:-pino.spacesverts@gmail.com}"

echo "════════════════════════════════════════════════════"
echo " PINO — PREFLIGHT DÉPLOIEMENT (FASE 10)"
echo " Lecture seule. Pas de Hosting / Functions / Firestore."
echo "════════════════════════════════════════════════════"

test -f firebase.json
test -f database.rules.json
test -f scripts/deploy-production.sh

if grep -E '"firestore"' firebase.json | grep -qv 'emulators'; then
  echo "⛔ firebase.json déclare un cible firestore. v1 = RTDB uniquement (ADR 0006)."
  exit 1
fi

if grep -q '"source": "\*\*"' firebase.json; then
  echo "⛔ Catch-all SPA ** détecté dans firebase.json (casse les 404 FASE 6)."
  exit 1
fi

command -v pnpm >/dev/null
command -v firebase >/dev/null
command -v node >/dev/null

echo "1/6 — Snapshot config…"
bash scripts/backup-firebase-config.sh

echo "2/6 — Accès projet (lecture)…"
PROJECTS_LIST="$(firebase projects:list --account "$FIREBASE_ACCOUNT" 2>&1 || true)"
if ! printf '%s\n' "$PROJECTS_LIST" | grep -q "$PROJECT_ID"; then
  echo "⛔ Compte $FIREBASE_ACCOUNT sans accès à $PROJECT_ID."
  echo "   firebase login:add   ou   FIREBASE_ACCOUNT=autre@compte pnpm preflight"
  exit 1
fi
echo "   OK $FIREBASE_ACCOUNT → $PROJECT_ID"

echo "3/6 — Tests unitaires…"
pnpm test:unit

echo "4/6 — Règles RTDB (émulateur)…"
pnpm test:rules

echo "5/6 — Audit statique…"
pnpm audit:static

if [ "${PINO_PREFLIGHT_E2E:-}" = "1" ]; then
  echo "6/6 — E2E (émulateurs Auth+RTDB)…"
  pnpm test:e2e
else
  echo "6/6 — E2E sauté (PINO_PREFLIGHT_E2E=1 pour l'activer)."
fi

echo
echo "✅ Preflight OK. Prochaines commandes (production) :"
echo "   pnpm deploy:production"
echo "   DOMAIN=https://pinoespacesverts.online pnpm verify:production"
echo "   DOMAIN=https://pagepino-e8e97.web.app pnpm verify:production"
echo
echo "Interdits : firebase deploy --only firestore"
echo "            wrangler depuis la racine du repo"
echo "            POST /notify de devis de test (envoie un vrai mail à Andrés)"
echo "Voir docs/qa/RUNBOOK_FASE10.md"
