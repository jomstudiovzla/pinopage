#!/usr/bin/env bash
# scripts/connect-domain.sh — pnpm domain:connect [dominio]
# Comprueba que el dominio propio ya apunta a Firebase Hosting (DNS + HTTPS)
# y republica el sitio con ese dominio como URL canónica.
# Requisitos previos (manuales, ver docs/dns/CONECTAR_DOMINIO.md):
#   1. Dominio pinoespacesverts.online (ya registrado en Cloudflare).
#   2. Firebase Console → Hosting → Add custom domain, registros DNS copiados en Cloudflare DNS
#      en modo "DNS only" (nube gris), no "Proxied" (nube naranja): el proxy de Cloudflare
#      rompe la emisión del certificado gestionado por Firebase.
set -uo pipefail

DOMAIN="${1:-pinoespacesverts.online}"

echo "1/3 — DNS de $DOMAIN (resolvers públicos)..."
A_RECORDS=$(dig +short A "$DOMAIN" @8.8.8.8; dig +short A "$DOMAIN" @1.1.1.1)
if [ -z "$A_RECORDS" ]; then
  echo "⛔ $DOMAIN todavía no resuelve."
  echo "   ¿Están los registros A/TXT de Firebase en Cloudflare DNS, en modo 'DNS only'?"
  echo "   (nube gris, no naranja; pueden tardar hasta 24 h en propagar)"
  echo "   Comprobar: whois $DOMAIN"
  exit 1
fi
echo "$A_RECORDS" | sort -u
echo "   www → $(dig +short "www.$DOMAIN" @8.8.8.8 | tr '\n' ' ')"

echo "2/3 — HTTPS / certificado..."
if ! curl -sfI "https://$DOMAIN" >/dev/null; then
  echo "⛔ HTTPS aún no responde en https://$DOMAIN."
  echo "   Firebase emite el certificado tras validar el DNS (minutos a 24 h). Reintenta más tarde."
  exit 1
fi
echo "   $(echo | openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" 2>/dev/null | openssl x509 -noout -issuer -enddate | tr '\n' ' ')"

echo "3/3 — Republicando con URL canónica https://$DOMAIN ..."
PINO_SITE_URL="https://$DOMAIN" bash scripts/deploy-production.sh
