const CACHE_NAME = 'pino-ev-v11-auth-safari-fix';
const ASSETS = [
  './manifest.json',
  './assets/logo/Logo pino.png',
  './assets/logo/Logo completo.png',
  './assets/images/tiro.png',
  './assets/images/retiro.png',
  './assets/qr/QR_WhatsApp.png',
  './assets/qr/QR_Instagram.png',
  './assets/qr/QR_LandingPage.png',
  './assets/qr/QR_Email.png',
  './assets/images/garden_reference_1.jpg',
  './assets/images/garden_reference_2.jpg',
  './assets/images/garden_reference_3.jpg',
  './assets/flyer/flyer_pino_oferta_muy_centrado.jpg',
  './assets/images/quiero_que_me_hagas_una_202605171317.jpeg',
  './assets/js/pino-db.js',
  './assets/js/firebase-config.js',
  './assets/js/chatbot_knowledge_base.js'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Network-first para navegación / index.html para ver actualizaciones inmediatamente
  if (e.request.mode === 'navigate' || e.request.url.includes('index.html')) {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          return response;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first con fallback a red para assets estáticos
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});
