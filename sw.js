/* Word Wizard — service worker (solo cuando se sirve por http/https).
   Estrategia: red primero y, si no hay conexión, caché. Así una versión nueva
   se ve al instante y el juego sigue abriendo sin internet. */
const VERSION = 'ww-v2.19.1';
const ARCHIVOS = [
  './', './index.html', './manifest.json',
  './css/estilo.css?v=2.19.1',
  './js/reportes.js?v=2.19.1', './js/i18n.js?v=2.19.1', './js/i18n-en.js?v=2.19.1', './js/i18n-pt.js?v=2.19.1', './js/motor.js?v=2.19.1', './js/silabo.js?v=2.19.1', './js/iconos.js?v=2.19.1', './js/logros-iconos.js?v=2.19.1', './js/mago.js?v=2.19.1', './js/mapa.js?v=2.19.1', './js/escena.js?v=2.19.1', './js/vida.js?v=2.19.1', './js/audio.js?v=2.19.1', './js/logros.js?v=2.19.1', './js/estado.js?v=2.19.1', './js/ranking.js?v=2.19.1', './js/tarjeta.js?v=2.19.1', './js/app.js?v=2.19.1',
  ...['400', '600', '700'].map((w) => './assets/fonts/fredoka-' + w + '.woff2'), ...['400', '700', '800'].map((w) => './assets/fonts/nunito-' + w + '.woff2'),
  './assets/img/icon-192x192.png', './assets/img/icon-512x512.png', './assets/img/wordwizard.ico',
];
// los datos (diccionario de unos 3 MB) solo del idioma de este jugador: la app registra sw.js?datos=data/en/
const PEDIDO = new URL(location).searchParams.get('datos') || '';
const DATOS = /^data\/([a-z]{2}\/)?$/.test(PEDIDO) ? PEDIDO : 'data/';
ARCHIVOS.push(...['diccionario', 'desafios', 'totales'].map((n) => './' + DATOS + n + '.js?v=2.19.1'));

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
  // sin ?v= (index.html, sw.js…): siempre se pregunta al servidor. Sin esto, Safari usaba la copia
  // del caché HTTP (GitHub Pages la guarda 10 minutos) y "tocá para actualizar" volvía a abrir la versión vieja.
  const pedido = e.request.mode === 'navigate' ? new Request(e.request.url, { cache: 'no-cache', credentials: 'same-origin' }) : new Request(e.request, { cache: 'no-cache' });
  e.respondWith(
    fetch(pedido).then((res) => {
      if (res.ok && propio) { const copia = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copia)); }
      return res;
    }).catch(() => caches.match(e.request))
  );
});
