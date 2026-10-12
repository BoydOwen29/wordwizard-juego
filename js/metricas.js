/**
 * Word Wizard — uso anónimo, para el tablero de métricas (tools/tablero.js).
 * Manda, sin esperar respuesta: que se abrió el juego y cada partida terminada (con su modo), junto con un
 * identificador al azar de este dispositivo, la plataforma, la versión y el idioma. Nada personal.
 * Tabla y función: supabase/migrations/20261012220000_actividad.sql. Si falla (sin internet), no pasa nada.
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
    } catch (e) { /* nada */ }
    if (twa) return 'android-app';
    const instalada = navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
    return (instalada ? 'pwa-' : 'web-') + so;
  }

  function marcar(fecha, version, modo) {
    const R = window.WWRanking;
    if (!R || !R.activo() || !fecha) return;
    const id = dispositivo(); if (!id) return;
    const idioma = (window.WWI18n && window.WWI18n.idiomaDatos) || 'es';
    fetch(`${R.CONFIG.url}/rest/v1/rpc/actividad_marcar`, {
      method: 'POST', keepalive: true,
      headers: { apikey: R.CONFIG.key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_dispositivo: id, p_fecha: fecha, p_plataforma: plataforma(), p_version: version || null, p_idioma: idioma, p_modo: modo || null }),
    }).catch(() => { /* sin internet: no importa */ });
  }

  window.WWMetricas = { marcar, plataforma };
})();
