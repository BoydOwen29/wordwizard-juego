/**
 * Word Wizard — uso anónimo, para el tablero de métricas (tools/tablero.js).
 * Manda, sin esperar respuesta: que se abrió el juego y cada partida terminada (con su modo), junto con un
 * identificador al azar de este dispositivo, la plataforma, la versión, el idioma y la zona horaria. Nada personal.
 * Tabla y función: supabase/migrations/20261012220000_actividad.sql y 20261014180000_actividad_zona.sql. Si falla (sin internet), no pasa nada.
 */
(function () {
  'use strict';
  const LS = 'ww.disp';

  function dispositivo() {
    try {
      let id = localStorage.getItem(LS);
      if (!id) { id = crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, () => (Math.random() * 16 | 0).toString(16)); localStorage.setItem(LS, id); }
      return id;
    } catch (e) { return null; }
  }

  /** android-app (la de Play), pwa-ios / pwa-android / pwa-pc (instalada) o web-ios / web-android / web-pc. */
  function plataforma() {
    const ua = navigator.userAgent || '';
    const so = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? 'ios' : /Android/.test(ua) ? 'android' : 'pc';
    let twa = false;
    try {
      if (document.referrer.startsWith('android-app://')) sessionStorage.setItem('ww.twa', '1');
      twa = sessionStorage.getItem('ww.twa') === '1';
      // el referrer no siempre llega: la app de Play es la única que trae el cobro de Google (Digital Goods)
      if (!twa && typeof window.getDigitalGoodsService === 'function') twa = true;
    } catch (e) { /* nada */ }
    if (twa) return 'android-app';
    const instalada = navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
    return (instalada ? 'pwa-' : 'web-') + so;
  }

  function marcar(fecha, version, modo) {
    const R = window.WWRanking;
    if (!R || !R.activo() || !fecha) return;
    const id = dispositivo(); if (!id) return;
    if (esRobot()) return;
    const idioma = (window.WWI18n && window.WWI18n.idiomaDatos) || 'es';
    const datos = { p_dispositivo: id, p_fecha: fecha, p_plataforma: plataforma(), p_version: version || null, p_idioma: idioma, p_modo: modo || null };
    const mandar = (d) => fetch(`${R.CONFIG.url}/rest/v1/rpc/actividad_marcar`, {
      method: 'POST', keepalive: true,
      headers: { apikey: R.CONFIG.key, 'Content-Type': 'application/json' },
      body: JSON.stringify(d),
    });
    // con la zona horaria (de qué país se juega); si la base todavía no la conoce, sin ella
    mandar(Object.assign({ p_zona: zona() }, datos)).then((r) => { if (!r.ok) return mandar(datos); }).catch(() => { /* sin internet: no importa */ });
  }

  /** La zona horaria del dispositivo (America/Argentina/Buenos_Aires…): el país, sin ubicación exacta. */
  function zona() { try { return (Intl.DateTimeFormat().resolvedOptions().timeZone || '').slice(0, 40) || null; } catch (e) { return null; } }

  /** Buscadores, vistas previas de links y pruebas automáticas (la revisión de Play): no son jugadores. */
  function esRobot() {
    try {
      return !!navigator.webdriver || /bot|crawl|spider|slurp|headless|lighthouse|inspectiontool/i.test(navigator.userAgent || '');
    } catch (e) { return false; }
  }

  window.WWMetricas = { marcar, plataforma, esRobot };
})();
