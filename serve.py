#!/usr/bin/env python3
"""
Pino Espaces Verts — serveur de développement local (fichiers statiques uniquement).

La production est statique (GitHub Pages / Firebase Hosting) : il n'y a pas d'API serveur.
Ce serveur ne simule donc aucune API ; les règles d'accès sont imposées par
Firebase Auth + database.rules.json, y compris en local.

Usage :
    python3 serve.py [port]        # défaut 5500, écoute sur 127.0.0.1
    PINO_BIND=0.0.0.0 python3 serve.py 5500   # pour tester depuis un téléphone du réseau local
"""
import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

BLOCKED_SUFFIXES = ('.py', '.sql', '.sh', '.log', '.key', '.pem', '.env', '.md', '.toml', '.lock', '.yaml', '.yml')
BLOCKED_DIRS = {'node_modules', 'supabase', 'tests', 'scripts', 'docs', 'correcciones', 'error'}

# Pages d'erreur FASE 6 (fichiers dans public/, servies à la racine comme en prod).
ERROR_PAGES = {
    '/404': 'public/404.html',
    '/404.html': 'public/404.html',
    '/403': 'public/403.html',
    '/403.html': 'public/403.html',
    '/500': 'public/500.html',
    '/500.html': 'public/500.html',
    '/maintenance': 'public/maintenance.html',
    '/maintenance.html': 'public/maintenance.html',
}

# Route protégée FASE 7 : le navigateur garde /admin, le fichier servi est index.html.
SPA_ALIASES = {
    '/admin': '/index.html',
    '/admin.html': '/index.html',
}


class PinoDevHandler(SimpleHTTPRequestHandler):
    server_version = "PinoDev"
    sys_version = ""

    def _is_blocked(self):
        path = self.path.split('?', 1)[0].split('#', 1)[0]
        parts = [p for p in path.split('/') if p]
        if any(p.startswith('.') for p in parts):
            return True
        if parts and parts[0] in BLOCKED_DIRS:
            return True
        name = parts[-1].lower() if parts else ''
        if name.endswith(BLOCKED_SUFFIXES) or name in ('package.json', 'firebase.json', 'database.rules.json', 'firestore.rules'):
            return True
        return False

    def send_error(self, code, message=None, explain=None):
        if code == 404:
            path = os.path.join(os.getcwd(), 'public', '404.html')
            if os.path.isfile(path):
                try:
                    with open(path, 'rb') as fh:
                        body = fh.read()
                    self.send_response(404, message or "Not Found")
                    self.send_header('Content-Type', 'text/html; charset=utf-8')
                    self.send_header('Content-Length', str(len(body)))
                    self.end_headers()
                    if self.command != 'HEAD':
                        self.wfile.write(body)
                    return
                except OSError:
                    pass
        return super().send_error(code, message, explain)

    def send_head(self):
        if self._is_blocked():
            self.send_error(404, "Not Found")
            return None
        route = self.path.split('?', 1)[0]
        alias = ERROR_PAGES.get(route)
        if alias:
            self.path = '/' + alias
        spa = SPA_ALIASES.get(route)
        if spa:
            self.path = spa
        # Pas de listing de répertoire
        local = self.translate_path(self.path)
        if os.path.isdir(local) and not os.path.exists(os.path.join(local, 'index.html')):
            self.send_error(404, "Not Found")
            return None
        return super().send_head()

    def end_headers(self):
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin-allow-popups')
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def do_POST(self):
        self.send_error(405, "Method Not Allowed")

    def log_request(self, code='-', size='-'):
        if str(code).isdigit() and int(code) >= 400:
            super().log_request(code, size)

    def log_message(self, fmt, *args):
        sys.stderr.write("[pino-dev] " + (fmt % args) + "\n")


def run(port, bind):
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    httpd = ThreadingHTTPServer((bind, port), PinoDevHandler)
    print(f"Pino Espaces Verts — serveur de développement : http://localhost:{port}/")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        httpd.server_close()


if __name__ == '__main__':
    port = int(os.environ.get('PINO_PORT') or (sys.argv[1] if len(sys.argv) > 1 else 5500))
    run(port, os.environ.get('PINO_BIND', '127.0.0.1'))
