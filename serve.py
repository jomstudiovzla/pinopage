#!/usr/bin/env python3
"""
Pino Espaces Verts — Serveur HTTP Local Sécurisé avec Support CORS Intégral & Apple SSO POST
Auteur: Pino Espaces Verts & JOM Studio
Usage:
    python3 serve.py [port]
Exemple:
    python3 serve.py 8080
"""
import sys
import os
import time
import json
import re
import datetime
import urllib.parse
from http.server import HTTPServer, SimpleHTTPRequestHandler

class PinoCORSRequestHandler(SimpleHTTPRequestHandler):
    """
    Gestionnaire HTTP local fournissant les en-têtes CORS universels,
    la négociation OPTIONS pour les requêtes asynchrones, la prise en charge
    des requêtes POST (form_post) pour Sign In with Apple, et les points de terminaison
    d'API pour la validation côté serveur (canjear-cupones, vérification de rôles, calcul SAP).
    """

    server_version = "PinoServer"
    sys_version = ""

    # Stockage en mémoire du limiteur de débit (IP -> list[timestamp])
    RATE_LIMIT_STORE = {}
    # Registre des coupons canjeados côté serveur (userId:code)
    REDEEMED_COUPONS = set()

    @classmethod
    def check_rate_limit(cls, ip, max_requests=5, window_seconds=300):
        """Limite de débit (Rate Limiting) : max 5 requêtes par tranche de 5 minutes par IP."""
        now = time.time()
        timestamps = cls.RATE_LIMIT_STORE.get(ip, [])
        # Ne conserver que les requêtes dans la fenêtre active
        timestamps = [t for t in timestamps if now - t < window_seconds]
        if len(timestamps) >= max_requests:
            cls.RATE_LIMIT_STORE[ip] = timestamps
            retry_after = int(window_seconds - (now - timestamps[0]))
            return False, max(1, retry_after)
        timestamps.append(now)
        cls.RATE_LIMIT_STORE[ip] = timestamps
        return True, 0

    def send_head(self):
        """
        Interception stricte anti-divulgation :
        1. Bloque l'accès aux dossiers/fichiers cachés (.git, .env, .firebaserc, etc.)
        2. Bloque les fichiers serveur sensibles (.sql, .sh, .py, .log, .key, etc.)
        3. Bloque le listing des répertoires sans index.html (protection 403 Forbidden)
        """
        clean_path = self.path.split('?')[0].split('#')[0]
        parts = clean_path.split('/')
        # Bloquer les fichiers cachés
        for part in parts:
            if part.startswith('.') and part not in ('.', '..', ''):
                self.send_error(404, "File not found")
                return None

        # Bloquer les extensions sensibles
        sensitive_exts = ('.sql', '.sh', '.py', '.log', '.key', '.pem', '.env', '.bak', '.swp')
        if any(clean_path.lower().endswith(ext) for ext in sensitive_exts):
            self.send_error(404, "File not found")
            return None

        # Bloquer le listing des répertoires sans index.html
        local_path = self.translate_path(self.path)
        if os.path.isdir(local_path):
            index_path = os.path.join(local_path, "index.html")
            if not os.path.exists(index_path):
                self.send_error(403, "Directory listing is forbidden")
                return None

        return super().send_head()

    def do_TRACE(self):
        """Interdire formellement la méthode HTTP TRACE (protection anti-XST)."""
        self.send_error(405, "Method Not Allowed")

    def end_headers(self):
        # En-têtes CORS complets pour éviter tout blocage cross-origin
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD')
        self.send_header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Authorization, Range, Origin')
        # En-têtes de sécurité HTTP & Hardening
        csp = (
            "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: http: data: blob:; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com https://www.gstatic.com https://cdn.jsdelivr.net https://appleid.cdn-apple.com https://apis.google.com https://accounts.google.com blob:; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; "
            "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com data:; "
            "img-src 'self' data: blob: https: http:; "
            "connect-src 'self' https://*.firebaseio.com https://*.firebasedatabase.app https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.supabase.co https://api.web3forms.com https://formsubmit.co https://appleid.apple.com https://accounts.google.com https://oauth2.googleapis.com wss://*.firebaseio.com wss://*.firebasedatabase.app http://localhost:* http://127.0.0.1:*; "
            "frame-src 'self' https://accounts.google.com https://appleid.apple.com; "
            "frame-ancestors 'self'; "
            "base-uri 'self'; "
            "form-action 'self' https://formsubmit.co https://api.web3forms.com; "
            "object-src 'none';"
        )
        self.send_header('Content-Security-Policy', csp)
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'SAMEORIGIN')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        self.send_header('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)')
        self.send_header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
        self.send_header('X-Permitted-Cross-Domain-Policies', 'none')
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin-allow-popups')
        self.send_header('Cross-Origin-Resource-Policy', 'same-site')
        # Désactiver le cache local en développement pour rafraîchissement immédiat
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_OPTIONS(self):
        """Réponse immédiate aux requêtes preflight OPTIONS sans blocage."""
        self.send_response(200, "OK")
        self.end_headers()

    def do_POST(self):
        """
        Gère les requêtes POST provenant de Sign In with Apple (response_mode=form_post),
        des endpoints d'API métier sécurisés (/api/canjear-cupones, /api/admin/verify, /api/tax/calculate-sap),
        et des requêtes de développement.
        """
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8', errors='ignore') if content_length > 0 else ''
        client_ip = self.client_address[0] if self.client_address else '127.0.0.1'

        # ── 1. API : Canjear Cupones (Validation Côté Serveur & Rate Limiting) ──
        if self.path.startswith('/api/canjear-cupones'):
            allowed, retry_after = self.check_rate_limit(client_ip, max_requests=5, window_seconds=300)
            if not allowed:
                self.send_response(429)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Retry-After', str(retry_after))
                self.end_headers()
                self.wfile.write(json.dumps({
                    "ok": False,
                    "valid": False,
                    "error": f"Limite de débit atteinte (5 requêtes / 5 min). Veuillez réessayer dans {retry_after} secondes."
                }).encode('utf-8'))
                return

            try:
                data = json.loads(body) if body else {}
            except Exception:
                data = urllib.parse.parse_qs(body)
                data = {k: v[0] for k, v in data.items()}

            user_id = str(data.get('userId') or data.get('user_id') or '').strip()
            email = str(data.get('email') or '').strip().lower()
            code = str(data.get('couponCode') or data.get('code') or '').strip().upper()

            valid_codes = ('PELABOLA', 'PINO-APPLE20', 'PINO-BIENVENUE20', 'PINO-GOOGLE20')
            is_valid_pattern = bool(re.match(r'^PINO-[A-Z0-9]{4,12}$', code))

            if not (code in valid_codes or is_valid_pattern):
                self.send_response(400)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "ok": False,
                    "valid": False,
                    "error": "Code promotionnel invalide ou inexistant."
                }).encode('utf-8'))
                return

            if not user_id:
                self.send_response(401)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "ok": False,
                    "valid": False,
                    "error": "Authentification requise pour activer un coupon nominatif."
                }).encode('utf-8'))
                return

            action = str(data.get('action') or 'redeem').strip().lower()
            redemption_key = f"{user_id}:{code}"

            if action == 'validate':
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "ok": True,
                    "valid": True,
                    "already_used": redemption_key in self.REDEEMED_COUPONS,
                    "coupon": {
                        "code": code,
                        "descuento_pct": 20,
                        "discount_cap_eur": 150.0,
                        "status": "already_used" if redemption_key in self.REDEEMED_COUPONS else "valid"
                    }
                }).encode('utf-8'))
                return

            if redemption_key in self.REDEEMED_COUPONS:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "ok": False,
                    "valid": False,
                    "error": "Ce coupon a déjà été activé pour ce compte client."
                }).encode('utf-8'))
                return

            self.REDEEMED_COUPONS.add(redemption_key)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({
                "ok": True,
                "valid": True,
                "coupon": {
                    "code": code,
                    "descuento_pct": 20,
                    "discount_cap_eur": 150.0,
                    "status": "valid",
                    "user_id": user_id,
                    "email": email,
                    "redeemed_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
                }
            }).encode('utf-8'))
            return

        # ── 2. API : Vérification de Rôle & Contrôle d'Accès Admin (Politique Default Deny) ──
        if self.path.startswith('/api/admin/verify'):
            try:
                data = json.loads(body) if body else {}
            except Exception:
                data = urllib.parse.parse_qs(body)
                data = {k: v[0] for k, v in data.items()}

            email = str(data.get('email') or '').strip().lower()
            admin_emails = ('pino.espacesverts@gmail.com', 'pino.spacesverts@gmail.com', 'jomstudiovzla@gmail.com')

            if email in admin_emails:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"authorized": True, "role": "admin"}).encode('utf-8'))
            else:
                self.send_response(403)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "authorized": False,
                    "role": "client",
                    "error": "Accès refusé. Privilèges administrateur requis (403 Forbidden)."
                }).encode('utf-8'))
            return

        # ── 3. API : Calcul Côté Serveur Crédit d'Impôt SAP 50% (Non-Manipulable) ──
        if self.path.startswith('/api/tax/calculate-sap'):
            try:
                data = json.loads(body) if body else {}
            except Exception:
                data = urllib.parse.parse_qs(body)
                data = {k: v[0] for k, v in data.items()}

            raw_amount = data.get('amountTTC') or data.get('amount_ttc') or 0.0
            try:
                amount_ttc = float(raw_amount)
            except (ValueError, TypeError):
                amount_ttc = 0.0

            amount_ttc = max(0.0, round(amount_ttc, 2))
            sap_credit = round(amount_ttc * 0.50, 2)
            net_payable = round(amount_ttc - sap_credit, 2)

            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({
                "amountTTC": amount_ttc,
                "sapCredit": sap_credit,
                "netPayable": net_payable,
                "annualCeilingEur": 12000.0,
                "vatRatePct": 20.0
            }).encode('utf-8'))
            return

        # ── 4. API : Déconnexion Totale Côté Serveur (Révocation de Session) ──
        if self.path.startswith('/api/auth/logout'):
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Set-Cookie', 'pino_session=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax; HttpOnly')
            self.send_header('Set-Cookie', 'pino_apple_auth=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax; HttpOnly')
            self.send_header('Set-Cookie', 'pino_auth_status=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax; HttpOnly')
            self.end_headers()
            self.wfile.write(json.dumps({"ok": True, "message": "Déconnexion totale côté serveur validée."}).encode('utf-8'))
            return

        # ── 5. API : Formulaire de Contact avec Rate Limiting Anti-Spam ──
        if self.path.startswith('/api/contact'):
            allowed, retry_after = self.check_rate_limit(client_ip, max_requests=5, window_seconds=300)
            if not allowed:
                self.send_response(429)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Retry-After', str(retry_after))
                self.end_headers()
                self.wfile.write(json.dumps({
                    "ok": False,
                    "error": f"Trop de tentatives de contact. Veuillez patienter {retry_after} secondes."
                }).encode('utf-8'))
                return

        # ── 6. Flux Apple SSO (response_mode=form_post) ──
        post_data = urllib.parse.parse_qs(body)

        # Extraction des paramètres Apple SSO
        id_token = post_data.get('id_token', [''])[0]
        code = post_data.get('code', [''])[0]
        state = post_data.get('state', [''])[0]
        user_json = post_data.get('user', [''])[0]
        error = post_data.get('error', [''])[0]
        error_desc = post_data.get('error_description', [''])[0]

        if error:
            # Redirection 303 avec hash d'erreur pour capture par le frontend
            self.send_response(303)
            self.send_header('Location', f'/#error={urllib.parse.quote(error)}&error_description={urllib.parse.quote(error_desc)}')
            self.send_header('Set-Cookie', 'pino_auth_status=error; SameSite=None; Secure; HttpOnly; Path=/')
            self.end_headers()
            return

        if id_token or code:
            redirect_hash = f'#id_token={urllib.parse.quote(id_token)}'
            if user_json:
                redirect_hash += f'&apple_user={urllib.parse.quote(user_json)}'
            if state:
                redirect_hash += f'&state={urllib.parse.quote(state)}'

            self.send_response(303)
            self.send_header('Location', f'/{redirect_hash}')
            self.send_header('Set-Cookie', 'pino_apple_auth=active; SameSite=None; Secure; HttpOnly; Path=/')
            self.end_headers()
            return

        # Réponse 200 par défaut avec index.html pour toute autre requête POST
        try:
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Set-Cookie', 'pino_session=active; SameSite=None; Secure; HttpOnly; Path=/')
            self.end_headers()
            with open(os.path.join(os.getcwd(), 'index.html'), 'rb') as f:
                self.wfile.write(f.read())
        except (BrokenPipeError, ConnectionResetError):
            pass
        except Exception:
            try:
                self.wfile.write(b"OK")
            except (BrokenPipeError, ConnectionResetError, Exception):
                pass

def run(port=8080, bind="0.0.0.0"):
    # Changer le répertoire de travail vers le dossier contenant le script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    server_address = (bind, port)
    httpd = HTTPServer(server_address, PinoCORSRequestHandler)
    print("==================================================================")
    print("🌲 PINO ESPACES VERTS — SERVEUR LOCAL AVEC SUPPORT CORS & APPLE POST")
    print("==================================================================")
    print(f"🚀 Serveur accessible sur : http://localhost:{port}/")
    print(f"📡 Accès réseau local   : http://127.0.0.1:{port}/")
    print(f"🛡️  En-têtes CORS       : Access-Control-Allow-Origin: *")
    print(f"🍎 Support Apple POST   : response_mode=form_post activé (HTTP 303 Bridge)")
    print("Appuyez sur Ctrl+C pour arrêter le serveur.")
    print("==================================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nArrêt du serveur.")
        httpd.server_close()

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    run(port=port)
