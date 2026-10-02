#!/usr/bin/env bash
# Snapshot local de la config Firebase / Worker (pas de données RTDB, pas de PII).
# Usage : bash scripts/backup-firebase-config.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

test -f firebase.json
test -f database.rules.json

STAMP="${PINO_BACKUP_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
DEST="backups/${STAMP}"
mkdir -p "$DEST"

copy_if() {
  local src="$1"
  if [ -f "$src" ]; then
    mkdir -p "$DEST/$(dirname "$src")"
    cp -p "$src" "$DEST/$src"
  fi
}

copy_if database.rules.json
copy_if firestore.rules
copy_if firebase.json
copy_if .firebaserc
copy_if sw.js
copy_if infra/cloudflare/mail-worker/wrangler.toml
copy_if assets/js/firebase-config.js

{
  echo "stamp=${STAMP}"
  echo "project=pagepino-e8e97"
  echo "account=${FIREBASE_ACCOUNT:-pino.spacesverts@gmail.com}"
  echo "site_url=${PINO_SITE_URL:-https://pinoespacesverts.online}"
  echo "branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
  echo "commit=$(git rev-parse HEAD 2>/dev/null || echo unknown)"
  echo "sw=$(grep -oE "pino-ev-v[0-9]+[-a-zA-Z0-9]*" sw.js | head -1)"
  echo "note=Pas de dump RTDB (PII). Pas de .env / secrets."
} > "$DEST/MANIFEST.txt"

echo "✅ Backup config → ${DEST}"
echo "   (gitignored ; ne contient pas de données clients ni de secrets)"
