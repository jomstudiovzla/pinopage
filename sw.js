// Pino Espaces Verts — service worker (hors ligne basique, mêmes origines uniquement).
// Les appels Firebase / Google / CDN ne sont jamais mis en cache : données et sessions toujours à jour.
const CACHE_NAME = 'pino-ev-v47-admin';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/css/tailwind.min.css',
  './assets/js/firebase-config.js',
  './assets/js/pino-auth-errors.js',
  './assets/js/pino-errors.js',
  './assets/js/pino-admin.js',
  './assets/js/pino-auth-google.js',
  './assets/js/pino-ba-slider.js',
  './assets/js/pino-db.js',
  './assets/js/chatbot_knowledge_base.js',
  './assets/logo/Logo pino.png',
  './assets/logo/Logo completo.png',
  './assets/logo/unipros.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './favicon.ico',
  './apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Réseau d'abord pour la page et les scripts (mises à jour immédiates), cache si hors ligne.
  if (req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    e.respondWith(
      fetch(req)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone)).catch(() => {});
          }
          return response;
        })
        .catch(() => caches.match(req).then((hit) => hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)))
    );
    return;
  }

  // Cache d'abord pour les images et polices locales.
  e.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((response) => {
      if (response && response.status === 200 && response.type === 'basic') {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, clone)).catch(() => {});
      }
      return response;
    }))
  );
});
