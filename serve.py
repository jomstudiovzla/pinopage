#!/usr/bin/env python3
"""
Pino Espaces Verts — Serveur HTTP Local Sécurisé avec Support CORS Intégral
Auteur: Pino Espaces Verts & JOM Studio
Usage:
    python3 serve.py [port]
Exemple:
    python3 serve.py 8080
"""
import sys
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler

class PinoCORSRequestHandler(SimpleHTTPRequestHandler):
    """
    Gestionnaire HTTP local fournissant les en-têtes CORS universels
    et la négociation OPTIONS pour les requêtes asynchrones OAuth et API.
    """

    def end_headers(self):
        # En-têtes CORS complets pour éviter tout blocage cross-origin
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD')
        self.send_header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Authorization, Range, Origin')
        self.send_header('Access-Control-Expose-Headers', 'Content-Length, Content-Range')
        # Désactiver le cache local en développement pour rafraîchissement immédiat
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_OPTIONS(self):
        """Réponse immédiate aux requêtes preflight OPTIONS sans blocage."""
        self.send_response(200, "OK")
        self.end_headers()

def run(port=8080, bind="0.0.0.0"):
    # Changer le répertoire de travail vers le dossier contenant le script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    server_address = (bind, port)
    httpd = HTTPServer(server_address, PinoCORSRequestHandler)
    print("==================================================================")
    print("🌲 PINO ESPACES VERTS — SERVEUR LOCAL AVEC SUPPORT CORS ACTIF")
    print("==================================================================")
    print(f"🚀 Serveur accessible sur : http://localhost:{port}/")
    print(f"📡 Accès réseau local   : http://127.0.0.1:{port}/")
    print(f"🛡️  En-têtes CORS       : Access-Control-Allow-Origin: *")
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
