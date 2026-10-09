/* Word Wizard — service worker (solo cuando se sirve por http/https).
   Estrategia: red primero y, si no hay conexión, caché. Así una versión nueva
   se ve al instante y el juego sigue abriendo sin internet. */
const VERSION = 'ww-v2.13.0';
const ARCHIVOS = [
  './', './index.html', './manifest.json',
  './css/estilo.css?v=2.13.0',
  './js/i18n.js?v=2.13.0', './js/i18n-en.js?v=2.13.0', './js/motor.js?v=2.13.0', './js/silabo.js?v=2.13.0', './js/iconos.js?v=2.13.0', './js/mago.js?v=2.13.0', './js/mapa.js?v=2.13.0', './js/escena.js?v=2.13.0', './js/vida.js?v=2.13.0', './js/audio.js?v=2.13.0', './js/logros.js?v=2.13.0', './js/estado.js?v=2.13.0', './js/ranking.js?v=2.13.0', './js/app.js?v=2.13.0',
  './data/diccionario.js?v=2.13.0', './data/desafios.js?v=2.13.0', './data/totales.js?v=2.13.0',
  './assets/fonts/fredoka-latin.woff2', './assets/fonts/nunito-latin.woff2',
  './assets/img/icon-192x192.png', './assets/img/icon-512x512.png', './assets/img/wordwizard.ico',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const propio = new URL(e.request.url).origin === location.origin;
  if (!propio) return;   // el ranking mundial (Supabase) va directo a la red
  // los archivos con ?v= no cambian nunca: caché primero (arranque instantáneo, anda sin señal).
  // En localhost no, para que los cambios se vean al recargar sin subir la versión.
  const local = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if (propio && !local && e.request.url.includes('?v=')) {
    e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request).then((res) => {
      if (res.ok) { const copia = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copia)); }
      return res;
    })));
    return;
  }
  e.respondWith(
    fetch(e.request).then((res) => {
      if (res.ok && propio) { const copia = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copia)); }
      return res;
    }).catch(() => caches.match(e.request))
  );
});
