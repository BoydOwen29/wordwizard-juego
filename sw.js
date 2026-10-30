/* Word Wizard — service worker (solo cuando se sirve por http/https).
   Estrategia: red primero y, si no hay conexión, caché. Así una versión nueva
   se ve al instante y el juego sigue abriendo sin internet. */
const VERSION = 'ww-v2.54.3';
const ARCHIVOS = [
  './', './index.html', './manifest.json',
  './css/estilo.css?v=2.54.3',
  './js/reportes.js?v=2.54.3', './js/i18n.js?v=2.54.3', './js/i18n-en.js?v=2.54.3', './js/i18n-pt.js?v=2.54.3', './js/motor.js?v=2.54.3', './js/silabo.js?v=2.54.3', './js/iconos.js?v=2.54.3', './js/logros-iconos.js?v=2.54.3', './js/mago.js?v=2.54.3', './js/mapa.js?v=2.54.3', './js/escena.js?v=2.54.3', './js/vida.js?v=2.54.3', './js/audio.js?v=2.54.3', './js/logros.js?v=2.54.3', './js/estado.js?v=2.54.3', './js/ranking.js?v=2.54.3', './js/compras.js?v=2.54.3', './js/cuenta.js?v=2.54.3', './js/recordatorio.js?v=2.54.3', './js/metricas.js?v=2.54.3', './js/tarjeta.js?v=2.54.3', './js/qr.js?v=2.54.3', './js/elenco.js?v=2.54.3', './js/campanas.js?v=2.54.3', './js/app.js?v=2.54.3',
  ...['400', '600', '700'].map((w) => './assets/fonts/fredoka-' + w + '.woff2'), ...['400', '700', '800'].map((w) => './assets/fonts/nunito-' + w + '.woff2'),
  './assets/img/icon-192x192.png', './assets/img/icon-512x512.png', './assets/img/wordwizard.ico',
];
// los datos (diccionario de unos 3 MB) solo del idioma de este jugador: la app registra sw.js?datos=data/en/
const PEDIDO = new URL(location).searchParams.get('datos') || '';
const DATOS = /^data\/([a-z]{2}\/)?$/.test(PEDIDO) ? PEDIDO : 'data/';
ARCHIVOS.push(...['diccionario', 'desafios', 'totales', 'torre', 'capitulos'].map((n) => './' + DATOS + n + '.js?v=2.54.3'));

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
      if (res.ok && propio) {
        const copia = res.clone();
        // la página de una versión nueva no se guarda en la caché de esta: sin señal, la recarga abría esa página, que
        // pide archivos que todavía no están guardados, y el juego no arrancaba (15/10). Así queda la última que coincide.
        if (e.request.mode === 'navigate') copia.text().then((t) => { if (t.includes('?v=' + VERSION.slice(4) + '"')) caches.open(VERSION).then((c) => c.put(e.request, new Response(t, { headers: res.headers }))); });
        else caches.open(VERSION).then((c) => c.put(e.request, copia));
      }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: e.request.mode === 'navigate' }).then((r) => r || caches.match('./index.html')))
  );
});

// ---------------------------------------------------------------- recordatorio diario (push)
// El servidor (supabase/functions/recordatorio) manda un push sin contenido; el texto se arma acá con lo que el juego
// dejó en la caché 'ww-recordatorio' (idioma, racha y si ya jugó hoy).
const TEXTOS = {
  es: { titulo: 'Word Wizard', racha: (n) => `🔥 Tu racha de ${n} días sigue viva: el desafío de hoy te espera.`, nueva: '🧙 Silabo tiene una palabra nueva para vos. ¿Jugás el desafío de hoy?' },
  en: { titulo: 'Word Wizard', racha: (n) => `🔥 Your ${n}-day streak is still alive: today's challenge is waiting.`, nueva: '🧙 Silabo has a new word for you. Up for today\'s challenge?' },
  pt: { titulo: 'Word Wizard', racha: (n) => `🔥 Sua sequência de ${n} dias continua: o desafio de hoje te espera.`, nueva: '🧙 O Silabo tem uma palavra nova para você. Bora o desafio de hoje?' },
};
self.addEventListener('push', (e) => {
  e.waitUntil((async () => {
    let d = {};
    try { const r = await (await caches.open('ww-recordatorio')).match('./recordatorio.json'); if (r) d = await r.json(); } catch (err) { /* sin datos: texto genérico */ }
    const t = TEXTOS[d.idioma] || TEXTOS.es;
    const hoy = new Date(); const clave = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    const racha = d.ultimoDiario && d.racha >= 2 ? d.racha : 0;   // la racha que tenía la última vez que jugó
    await self.registration.showNotification(t.titulo, {
      body: racha ? t.racha(racha) : t.nueva, icon: './assets/img/icon-192x192.png', badge: './assets/img/icon-192x192.png',
      tag: 'ww-diario', renotify: false, data: { url: './', dia: clave },
    });
  })());
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil((async () => {
    const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const v of ventanas) if ('focus' in v) return v.focus();
    return self.clients.openWindow('./');
  })());
});
