const CACHE_NAME = 'pino-ev-v2-remediation';
const ASSETS = [
  './',
  './index.html',
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
  './assets/images/quiero_que_me_hagas_una_202605171317.jpeg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
