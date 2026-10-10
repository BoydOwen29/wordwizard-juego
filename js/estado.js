/**
 * Word Wizard — estado persistente (perfiles en localStorage).
 * Varios perfiles por dispositivo (como el juego original), uno activo.
 */
(function () {
  'use strict';
  const CLAVE = 'ww.perfiles.v1';
  const CLAVE_ACTUAL = 'ww.actual.v1';

  function perfilNuevo(nombre) {
    return {
      nombre, creado: new Date().toISOString(), version: 2,
      xp: 0, nivel: 1, monedas: 20,
      racha: 0, mejorRacha: 0, ultimoDiario: null,
      diarios: {},          // fecha -> {numero, palabra, puntos, pct, rango, encontradas, total, totalPuntos, combo}
      enCurso: null,        // desafío diario empezado y no terminado (para reanudar o cerrar)
      misiones: null,       // {fecha, lista:[...], bonus}
      arcade: { mejorPuntaje: 0, mejorPiso: 0, partidas: 0, jefes: 0, historial: [], checkpoint: 0 },
      subida: null,         // subida a la Torre guardada para seguirla otro día (piso, vidas, puntaje…)
      practica: { partidas: 0 },
      logros: {},
      stats: { palabras: 0, partidas: 0, completas: 0, mejorLargo: 0, mejorCombo: 0, monedasTotales: 20, porLargo: {}, mejorPalabra: '', puntos: 0, misiones: 0, segundos: 0, mejoresPalabras: [] },
      inventario: { tiempo: 1, pista: 2, ojo: 0, escudo: 0, vela: 0 },
      ajustes: { sonido: true, musica: true, vibracion: true, grilla: true },
      sombrero: 'turquesa',
      tutorial: false,
    };
  }

  // Todo vive en memoria y se escribe agrupado (300 ms) y al salir de la app.
  // Si el navegador no deja guardar (modo privado, WebView bloqueada), el juego sigue andando igual.
  let cache = null, tGuardar = null, actualMem = null;
  function leerTodos() {
    if (cache) return cache;
    try { cache = JSON.parse(localStorage.getItem(CLAVE) || '{}'); } catch (e) { cache = {}; }
    return cache;
  }
  function escribir() {
    tGuardar = null;
    try { localStorage.setItem(CLAVE, JSON.stringify(cache)); } catch (e) { /* sin espacio o modo privado */ }
  }
  function guardarTodos(obj) { cache = obj; if (!tGuardar) tGuardar = setTimeout(escribir, 300); }
  const vaciar = () => { if (tGuardar) { clearTimeout(tGuardar); escribir(); } };
  addEventListener('pagehide', vaciar);
  document.addEventListener('visibilitychange', () => { if (document.hidden) vaciar(); });

  const Estado = {
    perfil: null,

    /** ¿Se puede guardar en este navegador? */
    almacenamientoOk() { try { localStorage.setItem('ww.prueba', '1'); localStorage.removeItem('ww.prueba'); return true; } catch (e) { return false; } },

    nombres() { return Object.keys(leerTodos()).sort(); },

    cargar(nombre) {
      const todos = leerTodos();
      let n = nombre;
      if (!n) { try { n = localStorage.getItem(CLAVE_ACTUAL); } catch (e) { n = null; } }
      if (!n) n = actualMem;
      if (!n || !todos[n]) return null;
      const base = perfilNuevo(n);
      this.perfil = Object.assign(base, todos[n]);
      // completar campos nuevos de versiones viejas
      for (const k of ['arcade', 'practica', 'stats', 'inventario', 'ajustes']) {
        this.perfil[k] = Object.assign(perfilNuevo(n)[k], this.perfil[k] || {});
      }
      actualMem = n;
      try { localStorage.setItem(CLAVE_ACTUAL, n); } catch (e) { /* nada */ }
      return this.perfil;
    },

    crear(nombre) {
      const n = String(nombre || '').trim().slice(0, 16);
      if (!n) return null;
      const todos = leerTodos();
      if (!todos[n]) { todos[n] = perfilNuevo(n); guardarTodos(todos); }
      return this.cargar(n);
    },

    guardar() {
      if (!this.perfil) return;
      const todos = leerTodos();
      todos[this.perfil.nombre] = this.perfil;
      guardarTodos(todos);
    },

    renombrar(nuevo) {
      const n = String(nuevo || '').trim().slice(0, 16);
      if (!n || !this.perfil) return false;
      const todos = leerTodos();
      if (todos[n] && n !== this.perfil.nombre) return false;
      delete todos[this.perfil.nombre];
      this.perfil.nombre = n;
      todos[n] = this.perfil;
      guardarTodos(todos);
      try { localStorage.setItem(CLAVE_ACTUAL, n); } catch (e) { /* nada */ }
      return true;
    },

    borrar(nombre) {
      const todos = leerTodos();
      delete todos[nombre];
      guardarTodos(todos);
      if (this.perfil && this.perfil.nombre === nombre) { this.perfil = null; try { localStorage.removeItem(CLAVE_ACTUAL); } catch (e) { /* nada */ } }
    },

    salir() { this.perfil = null; try { localStorage.removeItem(CLAVE_ACTUAL); } catch (e) { /* nada */ } },

    /** Todos los perfiles del dispositivo (solo lectura, para rankings). */
    todos() { return leerTodos(); },

    /** Suma XP y devuelve {antes, despues, subio}. */
    sumarXp(xp) {
      const p = this.perfil;
      const antes = p.nivel;
      p.xp += Math.max(0, Math.round(xp));
      p.nivel = window.WW.nivelPorXp(p.xp);
      return { antes, despues: p.nivel, subio: p.nivel > antes };
    },

    sumarMonedas(n) {
      const p = this.perfil;
      p.monedas = Math.max(0, p.monedas + n);
      if (n > 0) p.stats.monedasTotales += n;
    },

    /** Actualiza la racha con un diario jugado en `fecha`. */
    /** Días sin jugar entre el último diario y `fecha` (sin contar ninguno de los dos). */
    diasPerdidos(fecha) {
      const p = this.perfil;
      if (!p.ultimoDiario) return 0;
      const d = Math.round((new Date(fecha + 'T12:00:00') - new Date(p.ultimoDiario + 'T12:00:00')) / 86400000);
      return Math.max(0, d - 1);
    },
    /**
     * Actualiza la racha con un diario jugado en `fecha`. Si faltaste días y tenés velas de racha,
     * se consume una vela por día perdido y la racha sigue. Devuelve cuántas velas se usaron.
     */
    registrarRacha(fecha) {
      const p = this.perfil;
      if (p.ultimoDiario === fecha) return 0;
      const perdidos = this.diasPerdidos(fecha), velas = p.inventario.vela || 0;
      let usadas = 0;
      if (p.ultimoDiario && perdidos === 0) p.racha += 1;
      else if (p.ultimoDiario && perdidos <= velas) { usadas = perdidos; p.inventario.vela = velas - perdidos; p.racha += 1; p.stats.velasUsadas = (p.stats.velasUsadas || 0) + perdidos; }
      else p.racha = 1;
      p.mejorRacha = Math.max(p.mejorRacha, p.racha);
      p.ultimoDiario = fecha;
      return usadas;
    },
    /** Racha que se muestra hoy: sigue viva si jugaste ayer o si las velas alcanzan para los días perdidos. */
    rachaVigente(fechaHoy) {
      const p = this.perfil;
      if (!p.ultimoDiario) return 0;
      if (p.ultimoDiario === fechaHoy) return p.racha;
      return this.diasPerdidos(fechaHoy) <= (p.inventario.vela || 0) ? p.racha : 0;
    },

    /** Misiones del día: las regenera si cambió la fecha. */
    misionesHoy(fechaHoy) {
      const p = this.perfil;
      if (!p.misiones || p.misiones.fecha !== fechaHoy) {
        p.misiones = { fecha: fechaHoy, lista: window.WW.misionesDelDia(new Date(fechaHoy + 'T12:00:00')), bonus: false };
      }
      return p.misiones;
    },

    /** Registra las mejores palabras (hasta 10) por puntos. */
    registrarMejorPalabra(palabra, puntos) {
      const s = this.perfil.stats;
      if (!Array.isArray(s.mejoresPalabras)) s.mejoresPalabras = [];
      if (s.mejoresPalabras.some((x) => x.p === palabra)) return;
      s.mejoresPalabras.push({ p: palabra, n: puntos });
      s.mejoresPalabras.sort((a, b) => b.n - a.n || a.p.localeCompare(b.p));
      s.mejoresPalabras = s.mejoresPalabras.slice(0, 10);
    },

    exportar() { return JSON.stringify(leerTodos()); },
    importar(json) {
      const obj = JSON.parse(json);
      if (!obj || typeof obj !== 'object') throw new Error('formato');
      const todos = leerTodos();
      Object.assign(todos, obj);
      guardarTodos(todos);
    },
  };

  window.WWEstado = Estado;
})();
