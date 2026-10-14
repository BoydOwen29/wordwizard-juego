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

  // ------------------------------------------------------------ juntar dos versiones del mismo mago
  // Pasa cuando se jugó en dos dispositivos con la misma cuenta sin que se sincronizaran en el medio. `base` es lo que
  // ambos tenían la última vez que coincidieron; se suma lo que cada uno ganó desde ahí:
  //   · números (xp, monedas, inventario, contadores): nube + (local − base); los récords ("mejor…"), el máximo
  //   · objetos (diarios, logros, trajes, registro…): campo por campo; lo que solo uno tiene, se queda (ENTERO: de a uno)
  //   · listas (historial, mejores palabras): se juntan sin repetir
  //   · lo demás (sombrero, ajustes, nombre): gana este dispositivo si lo cambió
  //   · la racha va con el que jugó el diario más reciente
  const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const copia = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
  const esObj = (x) => x && typeof x === 'object' && !Array.isArray(x);
  const MAXIMO = /^(mejor|nivel$|checkpoint$|totalPuntos$|total$|pct$)/;
  // cosas que valen enteras (una partida a medias, las misiones del día, un día del diario): si las dos cambiaron, la de acá
  const ENTERO = /^(enCurso|subida|misiones|ajustes|torreHoy|practicasHoy|ventas|\d)/;
  function juntar(b, l, n, k) {
    if (l === undefined) return b === undefined ? copia(n) : undefined;   // lo borró este dispositivo (o nunca lo tuvo)
    if (n === undefined) return b === undefined ? copia(l) : undefined;
    if (igual(l, b)) return copia(n);
    if (igual(n, b)) return copia(l);
    if (typeof l === 'number' && typeof n === 'number') {
      if (MAXIMO.test(k) || typeof b !== 'number') return Math.max(l, n);
      return Math.max(0, n + (l - b));
    }
    if (Array.isArray(l) && Array.isArray(n)) {
      const vistos = new Set(), out = [];
      for (const x of [...l, ...n]) { const j = JSON.stringify(x); if (!vistos.has(j)) { vistos.add(j); out.push(copia(x)); } }
      if (k === 'mejoresPalabras') return out.filter((x, i) => out.findIndex((y) => y.p === x.p) === i).sort((x, y) => y.n - x.n || String(x.p).localeCompare(y.p)).slice(0, 10);
      if (k === 'historial') return out.sort((x, y) => String(y.fecha).localeCompare(String(x.fecha)) || y.puntos - x.puntos).slice(0, 20);
      return out;
    }
    // una entrada que apareció en los dos lados a la vez (el mismo día jugado en dos lados): queda la de acá entera
    if (esObj(l) && esObj(n) && esObj(b) && !ENTERO.test(k)) {
      const out = {};
      for (const c of new Set([...Object.keys(n), ...Object.keys(l)])) { const v = juntar(b[c], l[c], n[c], c); if (v !== undefined) out[c] = v; }
      return out;
    }
    return copia(l);
  }
  function fusionar(base, local, nube) {
    if (!base) return copia(local);
    const p = juntar(base, local, nube, '');
    const deNube = String(nube.ultimoDiario || '') > String(local.ultimoDiario || '');
    p.racha = deNube ? nube.racha : local.racha;
    p.ultimoDiario = deNube ? nube.ultimoDiario : local.ultimoDiario;
    p.mejorRacha = Math.max(p.racha || 0, local.mejorRacha || 0, nube.mejorRacha || 0);
    if (window.WW && window.WW.nivelPorXp) p.nivel = window.WW.nivelPorXp(p.xp);
    return p;
  }

  const Estado = {
    perfil: null,
    fusionar,

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
      if (this.alGuardar) try { this.alGuardar(this.perfil); } catch (e) { /* la nube nunca frena el juego */ }
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
      } else if (!p.misiones.lista.some((x) => x.temporada)) {
        // misiones generadas con una versión sin temporadas: se suma la de temporada sin tocar las otras
        const extra = window.WW.misionesDelDia(new Date(fechaHoy + 'T12:00:00')).find((x) => x.temporada);
        if (extra) p.misiones.lista.push(extra);
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

    /** Avisos cuando el perfil se guarda (cuenta.js sube el progreso a la nube un rato después). */
    alGuardar: null,

    /**
     * Trae un perfil de la nube a este dispositivo: reemplaza al mago con ese `creado` (o al del mismo nombre)
     * y lo deja activo. Si el nombre está ocupado por otro mago de acá, le agrega un número.
     */
    instalar(datos) {
      const todos = leerTodos();
      let viejo = Object.keys(todos).find((k) => todos[k].creado && todos[k].creado === datos.creado);
      let n = String(datos.nombre || 'Mago').trim().slice(0, 16) || 'Mago';
      if (viejo && viejo !== n) delete todos[viejo];
      for (let i = 2; todos[n] && todos[n].creado !== datos.creado && i < 99; i++) n = String(datos.nombre).slice(0, 13) + ' ' + i;
      todos[n] = Object.assign({}, datos, { nombre: n });
      guardarTodos(todos);
      vaciar();
      return this.cargar(n);
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
