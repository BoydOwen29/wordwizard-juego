/**
 * Word Wizard — idiomas.
 *
 * El juego está escrito en español; los otros idiomas se aplican traduciendo el texto que se muestra.
 * Un observador recorre lo que se pinta en pantalla y reemplaza cada texto por su traducción (exacta o
 * por plantilla con huecos {n}). Así los datos internos (rangos, misiones guardadas, etc.) siguen en
 * español y no hace falta tocar cada línea del código.
 *
 *   WWI18n.idioma            'es' | 'en'
 *   WWI18n.t('Hola {n}', {n}) traducción explícita (para lo que no pasa por el DOM, p. ej. textos para compartir)
 *   WWI18n.cambiar('en')      guarda el idioma y recarga (cambian también diccionario y desafíos)
 *   WWI18n.faltan             textos en español que no tienen traducción (para completar el diccionario)
 *
 * Los diccionarios viven en js/i18n-<idioma>.js y se registran con WWI18n.registrar(idioma, {...}).
 */
(function () {
  'use strict';

  const LS = 'ww.idioma';
  const IDIOMAS = { es: 'Español', en: 'English' };

  // idiomas con diccionario propio: solo esos se eligen solos o aparecen en Ajustes.
  // Para probar uno en preparación: localStorage 'ww.idioma.prueba' = '1'.
  const LISTOS = ['es'];
  let prueba = false;
  try { prueba = localStorage.getItem('ww.idioma.prueba') === '1'; } catch (e) { /* sin almacenamiento */ }
  const disponibles = prueba ? Object.keys(IDIOMAS) : LISTOS;

  function detectar() {
    try { const g = localStorage.getItem(LS); if (g && disponibles.includes(g)) return g; } catch (e) { /* sin almacenamiento */ }
    const nav = (navigator.languages && navigator.languages[0]) || navigator.language || 'es';
    const corto = nav.slice(0, 2).toLowerCase();
    return disponibles.includes(corto) ? corto : disponibles.includes('en') ? 'en' : 'es';
  }

  const I = { idioma: detectar(), IDIOMAS, disponibles, exactas: {}, plantillas: [], faltan: new Set() };
  const yaTraducidos = new Set();   // textos que ya están en el otro idioma (p. ej. copias de algo traducido)
  document.documentElement.lang = I.idioma;

  const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  I.registrar = function (idioma, dic) {
    if (idioma !== I.idioma) return;
    // el juego muestra muchos textos en mayúsculas (toUpperCase): las variantes se agregan solas
    const may = (x) => x.replace(/\{\w+\}|[^{}]+/g, (y) => (y[0] === '{' ? y : y.toUpperCase()));
    const todas = Object.entries(dic);
    for (const [es, otro] of Object.entries(dic)) if (may(es) !== es && !(may(es) in dic)) todas.push([may(es), may(otro)]);
    for (const [es, otro] of todas) {
      if (/\{\w+\}/.test(es)) {
        const nombres = [];
        const re = new RegExp('^' + escapar(es).replace(/\\\{(\w+)\\\}/g, (m, n) => { nombres.push(n); return '(.+?)'; }) + '$');
        I.plantillas.push({ re, nombres, otro });
      } else { I.exactas[es] = otro; yaTraducidos.add(otro); }
    }
    // las plantillas más largas primero: son más específicas
    I.plantillas.sort((a, b) => b.re.source.length - a.re.source.length);
  };

  /** Traduce un texto ya armado (sin espacios de los bordes). Devuelve null si no hay traducción. */
  function traducir(s, prof) {
    if (Object.prototype.hasOwnProperty.call(I.exactas, s)) return I.exactas[s];
    if ((prof || 0) > 2) return null;
    for (const p of I.plantillas) {
      const m = s.match(p.re);
      if (!m) continue;
      const vals = {};
      p.nombres.forEach((n, i) => { const v = m[i + 1]; vals[n] = traducir(v, (prof || 0) + 1) ?? v; });
      return p.otro.replace(/\{(\w+)\}/g, (x, n) => (n in vals ? vals[n] : x));
    }
    return null;
  }

  /** Traducción explícita, con variables. En español devuelve el texto tal cual. */
  I.t = function (es, vars) {
    let s = es;
    if (I.idioma !== 'es') s = traducir(es) ?? es;
    if (vars) s = s.replace(/\{(\w+)\}/g, (x, n) => (n in vars ? vars[n] : x));
    return s;
  };

  // ------------------------------------------------------------ traducción del DOM
  const LETRAS = /[a-záéíóúñü¿¡]/i;
  // lo que escribe el jugador o son palabras del juego: no se toca
  const SALTAR = '[data-no-t], [data-idioma], .chip-palabra, .ficha, #palabra-actual, #hud-nombre, #menu-nombre, .hist-palabra, #res-mejor, .perfil-btn span, input, textarea, script, style';
  const SALTAR_PROPIO = '.rank-nombre';   // el nombre del mago no, pero lo que va adentro (<small>) sí
  const hechos = new WeakMap();   // nodo → texto que pusimos nosotros (para no traducir dos veces)

  function nodoTexto(n) {
    const v = n.nodeValue;
    if (!v || hechos.get(n) === v || !LETRAS.test(v)) return;
    const el = n.parentElement;
    if (!el || el.closest(SALTAR) || el.matches(SALTAR_PROPIO)) return;
    const s = v.trim();
    const tr = traducir(s);
    if (tr == null) { if (s.length > 1 && /[a-záéíóúñ]{2}/i.test(s) && !yaTraducidos.has(s)) I.faltan.add(s); return; }
    const nuevo = v.replace(s, tr);
    hechos.set(n, nuevo);
    n.nodeValue = nuevo;
  }

  function atributos(el) {
    for (const a of ['title', 'placeholder', 'aria-label']) {
      const v = el.getAttribute(a);
      if (!v || el.dataset['t' + a] === v) continue;
      const tr = traducir(v.trim());
      if (tr != null) { el.setAttribute(a, tr); el.dataset['t' + a] = tr; }
    }
  }

  function recorrer(raiz) {
    if (raiz.nodeType === 3) return nodoTexto(raiz);
    if (raiz.nodeType !== 1 || raiz.closest(SALTAR)) return;
    atributos(raiz);
    raiz.querySelectorAll('[title], [placeholder], [aria-label]').forEach(atributos);
    const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
    let n; while ((n = w.nextNode())) nodoTexto(n);
  }
  I.recorrer = recorrer;

  I.cambiar = function (idioma) {
    try { localStorage.setItem(LS, idioma); } catch (e) { /* sin almacenamiento */ }
    location.reload();
  };

  /** Prefijo de los archivos de datos (diccionario, desafíos, totales) de este idioma. */
  I.datos = I.idioma === 'es' || !LISTOS.includes(I.idioma) ? 'data/' : `data/${I.idioma}/`;

  if (I.idioma !== 'es') {
    const arrancar = () => {
      recorrer(document.body);
      new MutationObserver((ms) => {
        for (const m of ms) {
          if (m.type === 'characterData') nodoTexto(m.target);
          else if (m.type === 'attributes') atributos(m.target);
          else m.addedNodes.forEach(recorrer);
        }
      }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['title', 'placeholder', 'aria-label'] });
    };
    // después de que se carguen todos los scripts (los diccionarios se registran después de este archivo)
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar); else setTimeout(arrancar);
  }

  window.WWI18n = I;
})();
