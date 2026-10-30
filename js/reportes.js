/**
 * Word Wizard — reportes: errores que el juego detecta solo y comentarios de los jugadores.
 * Van a la tabla public.reportes de Supabase (supabase/migrations/20261010180000_reportes.sql), que acepta escribir
 * sin cuenta y no deja leer: se leen con node tools/reportes.js. Si no hay conexión, quedan en cola.
 *
 *   WWReportes.comentario(texto, detalle)  → Promise<bool>
 *   (los errores se capturan solos con window.onerror y unhandledrejection)
 */
(function () {
  'use strict';
  const URL_BASE = 'https://syvlvisokezsvkjfwalo.supabase.co/rest/v1/reportes';
  const KEY = 'sb_publishable_vQ6qMxkyeKpOW0o3NgTWIg_WDcHmdvp';
  const LS_COLA = 'ww.reportes.cola';
  const MAX_ERRORES = 5;   // por sesión: un error que se repite en un bucle no llena la base
  const vistos = new Set();
  let errores = 0;

  const leer = () => { try { return JSON.parse(localStorage.getItem(LS_COLA)) || []; } catch (e) { return []; } };
  const escribir = (c) => { try { localStorage.setItem(LS_COLA, JSON.stringify(c.slice(-20))); } catch (e) { /* sin almacenamiento */ } };

  function contexto() {
    const ua = navigator.userAgent;
    const sistema = /Android/i.test(ua) ? 'Android' : /iPhone|iPad|iPod/i.test(ua) ? 'iOS' : /Windows/i.test(ua) ? 'Windows' : /Mac/i.test(ua) ? 'Mac' : 'otro';
    const nav = /SamsungBrowser\//.test(ua) ? 'Samsung Internet' : /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : /Firefox\//.test(ua) ? 'Firefox' : 'otro';
    const app = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) ? 'instalada' : 'navegador';
    return {
      version: (window.WW_VERSION || '?').slice(0, 20),
      idioma: ((window.WWI18n && WWI18n.idioma) || 'es').slice(0, 5),
      dispositivo: `${sistema} · ${nav} · ${app} · ${innerWidth}×${innerHeight}`.slice(0, 200),
    };
  }

  /** La cola guarda un uid para borrar lo mandado; la tabla no tiene ese campo. */
  async function mandar({ uid, ...r }) {
    const res = await fetch(URL_BASE, { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(r) });
    return res.ok || (res.status >= 400 && res.status < 500);   // un 4xx no se reintenta
  }
  let vaciando = false;
  async function vaciar() {
    if (vaciando) return; vaciando = true;
    try {
      for (const r of leer()) {
        let ok = false;
        try { ok = await mandar(r); } catch (e) { break; }
        if (ok) escribir(leer().filter((x) => x.uid !== r.uid));
      }
    } finally { vaciando = false; }
  }
  // en la compu de desarrollo (y en las pruebas automáticas) no se manda nada, salvo que se active a propósito
  const LOCAL = /^(localhost|127.0.0.1)$/.test(location.hostname) && (() => { try { return localStorage.getItem('ww.reportes.local') !== '1'; } catch (e) { return true; } })();
  function encolar(tipo, mensaje, detalle) {
    if (LOCAL) { console.info('[reportes] ' + tipo + ': ' + mensaje); return Promise.resolve(); }
    const r = Object.assign({ juego: 'wordwizard', tipo, mensaje: String(mensaje).slice(0, 2000), detalle: detalle || null }, contexto());
    const cola = leer(); cola.push(Object.assign({ uid: Date.now().toString(36) + Math.random().toString(36).slice(2, 6) }, r));
    escribir(cola);
    return vaciar();
  }
  // ------------------------------------------------------------ diagnóstico de arranques (app de Android, 14/10)
  // En un celu la app de Play se abría y se cerraba sola. Cada arranque anota hasta dónde llegó (html → app → título)
  // y lo que pasó (oculta, popstate, back, salida). Si el arranque anterior se cortó antes del título, o se cerró en
  // menos de 3 s (el rebote de Motorola dura menos de 1 s; cerrar a los 6 u 8 s es un jugador que salió), el siguiente lo manda como reporte. Solo en la app de Play; no guarda nada personal.
  const TWA = (document.referrer || '').indexOf('android-app://') === 0 || 'getDigitalGoodsService' in window;
  if (TWA) {
    const T0 = Date.now(), LSD = 'ww.diag';
    let prev = null; try { prev = JSON.parse(localStorage.getItem(LSD)); } catch (e) { /* nada */ }
    const nav = (performance.getEntriesByType && (performance.getEntriesByType('navigation')[0] || {}).type) || '?';
    const d = { t: T0, etapa: 'html', ev: [], ref: (document.referrer || '').slice(0, 60), nav, hist: history.length,
      url: location.pathname + (location.search ? '?…' : '') + (location.hash ? '#' + location.hash.slice(1, 14) : ''), oculta: null };
    const guardar = () => { try { localStorage.setItem(LSD, JSON.stringify(d)); } catch (e) { /* nada */ } };
    const ev = (x) => { d.ev.push(x + '@' + (Date.now() - T0)); if (d.ev.length > 30) d.ev.shift(); guardar(); };
    guardar();
    window.WWDiag = { etapa(e) { d.etapa = e; ev(e); }, ev };
    addEventListener('popstate', () => ev('popstate'));
    addEventListener('pagehide', () => ev('pagehide'));
    addEventListener('beforeunload', () => ev('salida'));
    document.addEventListener('visibilitychange', () => { if (document.hidden && d.oculta == null) d.oculta = Date.now() - T0; ev(document.hidden ? 'oculta' : 'visible'); });
    const atras = history.back.bind(history);
    history.back = function () { ev('back'); return atras(); };
    if (prev && T0 - prev.t < 864e5) {
      const motivo = prev.etapa !== 'titulo' ? `se cortó en "${prev.etapa}"` : prev.oculta != null && prev.oculta < 3000 ? `se cerró a los ${Math.round(prev.oculta / 100) / 10} s` : null;
      if (motivo) setTimeout(() => encolar('error', 'Diagnóstico: el arranque anterior de la app ' + motivo, prev), 4000);
    }
  }

  // ------------------------------------------------------------ errores automáticos
  // las extensiones del navegador (billeteras, traductores) tiran errores en la página que no son del juego
  const DE_AFUERA = /chrome-extension:|moz-extension:|safari-(web-)?extension:/;
  function error(mensaje, detalle) {
    if (detalle && (DE_AFUERA.test(detalle.pila || '') || DE_AFUERA.test(detalle.archivo || ''))) return;
    const clave = mensaje + '|' + (detalle && detalle.linea);
    if (vistos.has(clave) || errores >= MAX_ERRORES) return;
    vistos.add(clave); errores++;
    const app = window.App;
    encolar('error', mensaje, Object.assign({ pantalla: app && app.pantalla, modo: app && app.partida && app.partida.modo }, detalle));
  }
  addEventListener('error', (e) => {
    if (!e.message) return;   // errores de carga de imágenes o scripts de afuera: sin datos útiles
    error(e.message, { archivo: (e.filename || '').split('/').pop().slice(0, 80), linea: e.lineno, columna: e.colno, pila: e.error && e.error.stack ? String(e.error.stack).slice(0, 1500) : null });
  });
  addEventListener('unhandledrejection', (e) => {
    const r = e.reason;
    const msg = r && r.message ? r.message : String(r);
    if (/Failed to fetch|NetworkError|Load failed|AbortError/i.test(msg)) return;   // sin señal no es un error del juego
    error('Promesa: ' + msg, { pila: r && r.stack ? String(r.stack).slice(0, 1500) : null });
  });

  /** Comentario del jugador: texto, y un detalle con lo que ayude a entenderlo (nivel, carita, etc.). */
  async function comentario(texto, detalle) {
    await encolar('comentario', texto, detalle);
    return !leer().some((x) => x.tipo === 'comentario' && x.mensaje === String(texto).slice(0, 2000));
  }

  addEventListener('online', vaciar);
  setTimeout(vaciar, 5000);
  window.WWReportes = { comentario, error };
})();
