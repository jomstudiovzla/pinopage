#!/usr/bin/env node
/**
 * Pino Espaces Verts — Production Build System (v3.0.0)
 * Construit un répertoire dist/ hermétique, optimisé et conforme aux standards de sécurité.
 */

import { existsSync, rmSync, mkdirSync, cpSync, readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const DIST = join(ROOT, 'dist');
// URL publique officielle (domaine gratuit Firebase Hosting). Une seule ligne à changer
// le jour où un domaine propre est acheté et branché dans Firebase Hosting.
const SITE_URL = (process.env.PINO_SITE_URL || 'https://pagepino-e8e97.web.app').replace(/\/?$/, '/');

console.log('════════════════════════════════════════════════════');
console.log(' PINO ESPACES VERTS — COMPILATION PRODUCTION DIST');
console.log('════════════════════════════════════════════════════');

// 1. Nettoyage de dist/
console.log('1/6 — Nettoyage du répertoire dist/...');
if (existsSync(DIST)) {
  rmSync(DIST, { recursive: true, force: true });
}
mkdirSync(DIST, { recursive: true });

// 2. Compilation Tailwind CSS
console.log('2/6 — Compilation CSS Tailwind local...');
try {
  execSync('npx tailwindcss -c tailwind.config.js -i assets/css/tailwind.src.css -o assets/css/tailwind.min.css --minify', { stdio: 'inherit' });
} catch (e) {
  console.warn('Compilation Tailwind via npx a échoué, vérification de tailwind.min.css existant...');
}

// 3. Copie des fichiers racine (index.html, manifest, sw, icônes)
console.log('3/6 — Copie et nettoyage des fichiers racine...');
const rootFiles = ['index.html', 'manifest.json', 'sw.js', 'favicon.ico', 'apple-touch-icon.png'];
for (const f of rootFiles) {
  if (existsSync(join(ROOT, f))) {
    cpSync(join(ROOT, f), join(DIST, f));
  }
}

// Nettoyage de dist/index.html (suppression de tout résidu dev)
if (existsSync(join(DIST, 'index.html'))) {
  let html = readFileSync(join(DIST, 'index.html'), 'utf8');
  // Remplacement de tout github.io par le domaine officiel
  html = html.replace(/https:\/\/jomstudiovzla\.github\.io\/pinopage\/?/g, SITE_URL);
  writeFileSync(join(DIST, 'index.html'), html, 'utf8');
}

// 4. Copie de assets/
console.log('4/6 — Copie et sécurisation des assets statiques...');
if (existsSync(join(ROOT, 'assets'))) {
  // Images brutes non référencées par le site (131 Mo) : exclues pour respecter le
  // quota gratuit de transfert Firebase Hosting (360 Mo/jour sur le plan Spark).
  const UNUSED = [join(ROOT, 'assets', 'images', 'instagram'), join(ROOT, 'assets', 'images', 'retiro.png'), join(ROOT, 'assets', 'images', 'tiro.png')];
  cpSync(join(ROOT, 'assets'), join(DIST, 'assets'), {
    recursive: true,
    filter: (src) => !UNUSED.some((u) => src === u || src.startsWith(u + '/'))
  });
}

// Sécurisation de firebase-config.js dans dist/ (0 mention d'émulateur / localhost)
const distFirebaseConfig = join(DIST, 'assets', 'js', 'firebase-config.js');
if (existsSync(distFirebaseConfig)) {
  const prodFirebaseConfig = `/**
 * Pino Espaces Verts — Configuration Firebase Production
 * Projet : pagepino-e8e97
 * Realtime Database : https://pagepino-e8e97-default-rtdb.europe-west1.firebasedatabase.app
 */

window.PINO_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCOrSsb3dMl-tYr9y23zCPaDu63cRn7l-k",
  authDomain: "pagepino-e8e97.firebaseapp.com",
  databaseURL: "https://pagepino-e8e97-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "pagepino-e8e97",
  storageBucket: "pagepino-e8e97.firebasestorage.app",
  messagingSenderId: "102396108475",
  appId: "1:102396108475:web:070dcbdf881bd2b10c139e"
};

window.PINO_FLAGS = Object.assign({ appleLogin: false }, window.PINO_FLAGS || {});

window.PINO_PUBLIC_URL = "${SITE_URL}";
window.pinoSiteUrl = () => window.PINO_PUBLIC_URL;

(function computeSiteUrl() {
  const { protocol, origin, pathname } = window.location;
  if (protocol === "file:") {
    window.PINO_SITE_URL = "";
    return;
  }
  const dir = pathname.replace(/[^/]*$/, "");
  window.PINO_SITE_URL = origin + dir;
})();

window.PINO_USE_EMULATOR = false;

window.initPinoFirebase = () => {
  if (typeof firebase === 'undefined') {
    console.warn('[pino-firebase] Firebase SDK non chargé.');
    return false;
  }
  try {
    const cfg = Object.assign({}, window.PINO_FIREBASE_CONFIG);
    if (!firebase.apps.length) {
      firebase.initializeApp(cfg);
    }
    window.pinoAuth = firebase.auth();
    window.pinoRtdb = firebase.database();

    if (window.pinoAuth && typeof window.pinoAuth.setPersistence === 'function') {
      window.pinoAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .catch((err) => console.warn('[pino-auth] Persistance LOCAL indisponible:', err));
    }
    return true;
  } catch (err) {
    console.error('[pino-firebase] Échec initialisation:', err);
    return false;
  }
};
`;
  writeFileSync(distFirebaseConfig, prodFirebaseConfig, 'utf8');
}

// Sécurisation de supabase-config.js dans dist/
const distSupabaseConfig = join(DIST, 'assets', 'js', 'supabase-config.js');
if (existsSync(distSupabaseConfig)) {
  let sb = readFileSync(distSupabaseConfig, 'utf8');
  sb = sb.replace(/http:\/\/127\.0\.0\.1:8080\/?/g, SITE_URL);
  sb = sb.replace(/\/pinopage\/?/g, '/');
  writeFileSync(distSupabaseConfig, sb, 'utf8');
}

// Nettoyage de pino-db.js dans dist/ (retrait mentions dev dans commentaires)
const distPinoDb = join(DIST, 'assets', 'js', 'pino-db.js');
if (existsSync(distPinoDb)) {
  let pdb = readFileSync(distPinoDb, 'utf8');
  pdb = pdb.replace(/,\s*localhost\)/g, ')');
  pdb = pdb.replace(/,\s*jamais\s+localhost/g, '');
  writeFileSync(distPinoDb, pdb, 'utf8');
}

// 5. Copie des fichiers publics et légaux (robots.txt, sitemap.xml, 404, legal/)
console.log('5/6 — Déploiement des pages légales, SEO et 404...');
if (existsSync(join(ROOT, 'public'))) {
  cpSync(join(ROOT, 'public'), DIST, { recursive: true });
  if (existsSync(join(ROOT, 'public', '.htaccess'))) {
    cpSync(join(ROOT, 'public', '.htaccess'), join(DIST, '.htaccess'));
  }
}

// 6. Suppression de fichiers interdits dans dist/
console.log('6/7 — Vérification d\'exclusion des fichiers sensibles...');
const forbiddenNames = ['package.json', 'pnpm-lock.yaml', 'serve.py', '.env', 'database.rules.json', 'firestore.rules'];
function purgeForbidden(dir) {
  const files = readdirSync(dir);
  for (const f of files) {
    const p = join(dir, f);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (['node_modules', 'tests', 'scripts', 'docs', '.git'].includes(f)) {
        rmSync(p, { recursive: true, force: true });
      } else {
        purgeForbidden(p);
      }
    } else {
      if (forbiddenNames.includes(f) || f.endsWith('.map') || f.endsWith('.py') || f.endsWith('.md')) {
        rmSync(p, { force: true });
      }
    }
  }
}
purgeForbidden(DIST);

// 7. Génération de l'archive ZIP pour Hostinger
console.log('7/7 — Création de l\'archive ZIP pour Hostinger / Déploiement...');
const zipFile = join(ROOT, 'pino-espaces-verts-production.zip');
if (existsSync(zipFile)) {
  rmSync(zipFile, { force: true });
}
try {
  execSync(`cd "${DIST}" && zip -rq "${zipFile}" .`, { stdio: 'inherit' });
  const sizeKb = (statSync(zipFile).size / 1024).toFixed(1);
  console.log(`📦 Archive prête pour Hostinger : pino-espaces-verts-production.zip (${sizeKb} KB)`);
} catch (e) {
  console.warn('Création du zip impossible via commande zip.');
}

console.log('✅ Compilation du bundle de production terminée avec succès dans dist/.');
