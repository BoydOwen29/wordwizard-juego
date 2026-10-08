/**
 * Word Wizard — ranking online (opcional). Adaptador para Supabase vía REST.
 * Si CONFIG.url está vacío, el juego funciona igual y la pestaña "Mundo" no aparece.
 * El SQL de la tabla está en docs/SUPABASE.md.
 */
(function () {
  'use strict';

  const CONFIG = {
    url: '',      // p. ej. https://xxxx.supabase.co
    key: '',      // anon key (pública)
    tabla: 'resultados_diarios',
  };

  function activo() { return !!(CONFIG.url && CONFIG.key); }

  function cabeceras() {
    return { 'Content-Type': 'application/json', apikey: CONFIG.key, Authorization: 'Bearer ' + CONFIG.key, Prefer: 'resolution=merge-duplicates' };
  }

  /** Identificador estable y anónimo del dispositivo (para que cada uno cuente una vez por día). */
  function dispositivo() {
    try {
      let id = localStorage.getItem('ww.dispositivo');
      if (!id) { id = 'd' + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('ww.dispositivo', id); }
      return id;
    } catch (e) { return 'anon'; }
  }

  async function enviarDiario(r) {
    if (!activo()) return false;
    const fila = { fecha: r.fecha, numero: r.numero, dispositivo: dispositivo(), nombre: String(r.nombre).slice(0, 16), puntos: r.puntos, palabras: r.palabras, rango: r.rango };
    try {
      const res = await fetch(`${CONFIG.url}/rest/v1/${CONFIG.tabla}?on_conflict=fecha,dispositivo`, { method: 'POST', headers: cabeceras(), body: JSON.stringify(fila) });
      return res.ok;
    } catch (e) { return false; }
  }

  async function topDiario(fecha, limite) {
    if (!activo()) return [];
    try {
      const res = await fetch(`${CONFIG.url}/rest/v1/${CONFIG.tabla}?fecha=eq.${fecha}&select=nombre,puntos,palabras,rango,dispositivo&order=puntos.desc&limit=${limite || 50}`, { headers: cabeceras() });
      if (!res.ok) return [];
      return await res.json();
    } catch (e) { return []; }
  }

  window.WWRanking = { CONFIG, activo, enviarDiario, topDiario, dispositivo };
})();
