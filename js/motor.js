/**
 * Word Wizard — motor del juego (lógica pura, sin DOM).
 * Se usa en el navegador (window.WW) y en Node (tools/ y tests/).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.WW = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const MIN_LEN = 3;
  const FECHA_LANZAMIENTO = '2026-10-07'; // día 1 del desafío diario

  // ------------------------------------------------------------ texto
  const MAPA_TILDES = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ü': 'u', 'à': 'a', 'è': 'e', 'ì': 'i', 'ò': 'o', 'ù': 'u' };
  function normalizar(s) {
    return String(s || '').trim().toLowerCase().replace(/[áéíóúüàèìòù]/g, (c) => MAPA_TILDES[c]);
  }

  function contarLetras(w) {
    const c = {};
    for (const ch of w) c[ch] = (c[ch] || 0) + 1;
    return c;
  }

  /** ¿Se puede armar `w` con las letras disponibles en `pool` (objeto de conteos)? */
  function cabeEn(w, pool) {
    const usado = {};
    for (const ch of w) {
      usado[ch] = (usado[ch] || 0) + 1;
      if (usado[ch] > (pool[ch] || 0)) return false;
    }
    return true;
  }

  /** Formas plurales posibles de una palabra (el diccionario fuente casi no trae plurales). */
  function plurales(w) {
    if (w.length < MIN_LEN) return [];
    const ult = w[w.length - 1];
    if (ult === 's' || ult === 'x') return [];
    if (ult === 'z') return [w.slice(0, -1) + 'ces'];
    if ('aeiou'.includes(ult)) return [w + 's'];
    if ('íúé'.includes(ult)) return [w + 's', w + 'es'];
    return [w + 'es'];
  }

  /** Dada una posible forma plural, devuelve los singulares candidatos. */
  function singulares(w) {
    const out = [];
    if (w.endsWith('ces')) out.push(w.slice(0, -3) + 'z');
    if (w.endsWith('es')) out.push(w.slice(0, -2));
    if (w.endsWith('s')) out.push(w.slice(0, -1));
    return out.filter((s) => s.length >= MIN_LEN);
  }

  // ------------------------------------------------------------ azar determinístico
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function mezclar(arr, rng) {
    const r = rng || Math.random;
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ------------------------------------------------------------ fechas
  function claveDia(fecha) {
    const d = fecha || new Date();
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }

  /** Número de desafío (1 = día de lanzamiento). Usa la fecha local. */
  function numeroDia(fecha) {
    const [y0, m0, d0] = FECHA_LANZAMIENTO.split('-').map(Number);
    const base = Date.UTC(y0, m0 - 1, d0);
    const d = fecha || new Date();
    const hoy = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    return Math.floor((hoy - base) / 86400000) + 1;
  }

  function palabraDelDia(pool, fecha) {
    const n = numeroDia(fecha);
    const i = ((n - 1) % pool.length + pool.length) % pool.length;
    return { numero: n, desafio: pool[i] };
  }

  // ------------------------------------------------------------ puntaje y rangos
  const PUNTOS_POR_LARGO = { 3: 1, 4: 2, 5: 4, 6: 7, 7: 10, 8: 14, 9: 18, 10: 22 };
  const BONUS_COMPLETA = 15;

  function puntosPalabra(w, base) {
    const p = PUNTOS_POR_LARGO[w.length] || (w.length * 2);
    return w === base ? p + BONUS_COMPLETA : p;
  }

  const RANGOS = [
    { nombre: 'Aprendiz',      pct: 0,   icono: '🕯️' },
    { nombre: 'Iniciado',      pct: 4,   icono: '📜' },
    { nombre: 'Conjurador',    pct: 10,  icono: '✨' },
    { nombre: 'Hechicero',     pct: 18,  icono: '🔮' },
    { nombre: 'Mago',          pct: 28,  icono: '🧙' },
    { nombre: 'Archimago',     pct: 40,  icono: '⚡' },
    { nombre: 'Leyenda',       pct: 60,  icono: '🌟' },
    { nombre: 'Omnisciente',   pct: 100, icono: '👑' },
  ];

  function rangoPorPct(pct) {
    let r = RANGOS[0];
    for (const x of RANGOS) if (pct >= x.pct) r = x;
    return r;
  }

  function siguienteRango(pct) {
    for (const x of RANGOS) if (pct < x.pct) return x;
    return null;
  }

  // ------------------------------------------------------------ niveles de jugador (XP)
  const TITULOS = [
    'Aprendiz de letras', 'Lector de runas', 'Escriba novato', 'Conjurador de sílabas', 'Hechicero verbal',
    'Mago de palabras', 'Mago lexicógrafo', 'Archimago silábico', 'Gran Archimago', 'Leyenda del verbo',
    'Oráculo', 'Guardián del diccionario', 'Maestro de anagramas', 'Sabio ancestral', 'Omnisciente',
  ];
  function xpParaNivel(n) { // XP acumulada necesaria para alcanzar el nivel n (nivel 1 = 0)
    return Math.round(60 * (n - 1) * (n - 1) + 90 * (n - 1));
  }
  function nivelPorXp(xp) {
    let n = 1;
    while (xpParaNivel(n + 1) <= xp) n++;
    return n;
  }
  function tituloNivel(n) {
    return TITULOS[Math.min(TITULOS.length - 1, Math.floor((n - 1) / 2))];
  }

  // ------------------------------------------------------------ diccionario
  class Diccionario {
    constructor(texto) {
      this.set = new Set();
      this.porLargo = {};
      if (texto) this.cargar(texto);
    }
    cargar(texto) {
      const lineas = typeof texto === 'string' ? texto.split('\n') : texto;
      for (const w of lineas) {
        if (!w) continue;
        this.set.add(w);
        (this.porLargo[w.length] || (this.porLargo[w.length] = [])).push(w);
      }
      return this;
    }
    get tamano() { return this.set.size; }

    /** ¿`w` es palabra válida (directa o como plural regular)? */
    tiene(w) {
      if (this.set.has(w)) return true;
      for (const s of singulares(w)) if (this.set.has(s) && plurales(s).includes(w)) return true;
      return false;
    }

    /** Todas las palabras (>= MIN_LEN) que se arman con las letras de `base`, incluidos plurales. */
    derivables(base) {
      const pool = contarLetras(base);
      const L = base.length;
      const out = new Set();
      for (let len = MIN_LEN; len <= L; len++) {
        const lista = this.porLargo[len];
        if (!lista) continue;
        for (const w of lista) if (cabeEn(w, pool)) out.add(w);
      }
      for (const w of Array.from(out)) {
        for (const pl of plurales(w)) {
          if (pl.length <= L && !out.has(pl) && cabeEn(pl, pool)) out.add(pl);
        }
      }
      return out;
    }

    /**
     * Valida un intento contra la palabra base.
     * @returns {{ok:boolean, codigo:string, palabra:string}}
     *   codigos: ok | corta | letras | repetida | desconocida
     */
    validar(intento, base, encontradas) {
      const w = normalizar(intento);
      if (w.length < MIN_LEN) return { ok: false, codigo: 'corta', palabra: w };
      if (!/^[a-zñ]+$/.test(w)) return { ok: false, codigo: 'letras', palabra: w };
      if (!cabeEn(w, contarLetras(base))) return { ok: false, codigo: 'letras', palabra: w };
      if (encontradas && (encontradas.has ? encontradas.has(w) : encontradas.includes(w))) return { ok: false, codigo: 'repetida', palabra: w };
      if (!this.tiene(w)) return { ok: false, codigo: 'desconocida', palabra: w };
      return { ok: true, codigo: 'ok', palabra: w };
    }
  }

  // ------------------------------------------------------------ misiones diarias
  const PLANTILLAS_MISIONES = [
    { id: 'palabras', texto: (m) => `Encontrá ${m} palabras hoy`, metas: [15, 25, 40], evento: 'palabra', icono: '📖' },
    { id: 'largas', texto: (m) => `Encontrá ${m} palabras de 5+ letras`, metas: [3, 5, 8], evento: 'larga', icono: '📏' },
    { id: 'completa', texto: () => 'Armá una palabra base entera', metas: [1], evento: 'completa', icono: '💎' },
    { id: 'diario', texto: () => 'Jugá el desafío diario', metas: [1], evento: 'diario', icono: '📅' },
    { id: 'piso', texto: (m) => `Llegá al piso ${m} de la Torre`, metas: [3, 5], evento: 'piso', icono: '🗼', maximo: true },
    { id: 'combo', texto: (m) => `Hacé un combo de ${m}`, metas: [4, 6], evento: 'combo', icono: '🔥', maximo: true },
    { id: 'practica', texto: () => 'Jugá una práctica', metas: [1], evento: 'practica', icono: '🧘' },
    { id: 'puntos', texto: (m) => `Sumá ${m} puntos hoy`, metas: [100, 200, 350], evento: 'puntos', icono: '⭐' },
    { id: 'seis', texto: (m) => `Encontrá ${m} palabra${m > 1 ? 's' : ''} de 6+ letras`, metas: [1, 2, 3], evento: 'seis', icono: '🧙' },
  ];
  const RECOMPENSA_MISION = { monedas: 15, xp: 30 };
  const BONUS_TODAS_MISIONES = 25;

  /** Tres misiones determinísticas por fecha (todos los jugadores reciben las mismas). */
  function misionesDelDia(fecha) {
    const clave = claveDia(fecha);
    const semilla = Number(clave.replace(/-/g, '')) ^ 0x5eed;
    const rng = mulberry32(semilla);
    const orden = mezclar(PLANTILLAS_MISIONES, rng);
    const elegidas = [orden.find((p) => p.id === 'diario') || orden[0]];
    for (const p of orden) { if (elegidas.length >= 3) break; if (!elegidas.includes(p)) elegidas.push(p); }
    return elegidas.map((p) => {
      const meta = p.metas[Math.floor(rng() * p.metas.length)];
      return { id: p.id, icono: p.icono, texto: p.texto(meta), meta, evento: p.evento, maximo: !!p.maximo, progreso: 0, hecha: false };
    });
  }

  // ------------------------------------------------------------ torre
  function esPisoJefe(piso) { return piso > 0 && piso % 5 === 0; }
  const NOMBRES_JEFES = ['Morgrim el Mudo', 'Vexa la Enredada', 'Tharok Sin Voz', 'Nocturnia', 'El Archimago Gris', 'Zilgar Lenguaraz'];
  function nombreJefe(piso) { return NOMBRES_JEFES[(piso / 5 - 1) % NOMBRES_JEFES.length]; }

  /** Puntos totales posibles para una palabra base. */
  function totalPosible(derivables, base) {
    let t = 0;
    for (const w of derivables) t += puntosPalabra(w, base);
    return t;
  }

  return {
    MIN_LEN, FECHA_LANZAMIENTO, PUNTOS_POR_LARGO, BONUS_COMPLETA, RANGOS, TITULOS,
    normalizar, contarLetras, cabeEn, plurales, singulares, mulberry32, mezclar,
    claveDia, numeroDia, palabraDelDia,
    puntosPalabra, totalPosible, rangoPorPct, siguienteRango,
    xpParaNivel, nivelPorXp, tituloNivel,
    PLANTILLAS_MISIONES, RECOMPENSA_MISION, BONUS_TODAS_MISIONES, misionesDelDia,
    esPisoJefe, nombreJefe,
    Diccionario,
  };
});
