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
import urllib.parse
from http.server import HTTPServer, SimpleHTTPRequestHandler

class PinoCORSRequestHandler(SimpleHTTPRequestHandler):
    """
    Gestionnaire HTTP local fournissant les en-têtes CORS universels,
    la négociation OPTIONS pour les requêtes asynchrones et la prise en charge
    des requêtes POST (form_post) pour Sign In with Apple.
    """

    server_version = "PinoServer"
    sys_version = ""

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
        Gère les requêtes POST provenant de Sign In with Apple (response_mode=form_post)
        ou des tunnels de développement (ngrok, localtunnel), évitant tout code 405 Method Not Allowed.
        """
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8', errors='ignore') if content_length > 0 else ''
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
