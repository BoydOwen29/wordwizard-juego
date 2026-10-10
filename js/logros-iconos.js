/**
 * Word Wizard — íconos de logros (medallón de bronce, estilo A de lab/logros.html).
 * Mismo trazo que iconos.js y Silabo: tonos planos con sombra y luz, contorno #16262c, sin degradados.
 *
 *   WWLogrosIconos.html('combo5')        → '<svg class="ic-logro" viewBox="0 0 64 64">…</svg>'
 *   WWLogrosIconos.html('combo5', true)  → bloqueado: gris, símbolo en un solo tono y candado
 *
 * El tamaño lo pone el CSS (.ic-logro { width; height }).
 */
(function () {
  'use strict';

  const L = '#16262c';
  const K = {
    L, tinta: L,
    oro: '#f2c66d', oroSh: '#c49a42', oroLi: '#fff1bf',
    coral: '#e8907a', coralSh: '#c9705c', coralLi: '#fbd2c6',
    menta: '#dfebd6', mentaSh: '#b9cbb5',
    salvia: '#67948f', salviaCl: '#92afa1', pino: '#2f7f7a', pinoSh: '#22605c',
    madera: '#7a5a3c', maderaSh: '#5c4128', maderaCl: '#a07a52',
    violeta: '#7a66c9', violetaSh: '#5d4ca6', violetaLi: '#b8acec',
    brillo: '#ffffff',
  };
  // tono de cada color, para pasar un símbolo a un solo color (bloqueado)
  const ROL = { oro: 'm', oroSh: 's', oroLi: 'l', coral: 'm', coralSh: 's', coralLi: 'l', menta: 'l', mentaSh: 'm',
    salvia: 's', salviaCl: 'm', pino: 's', pinoSh: 's', madera: 's', maderaSh: 's', maderaCl: 'm',
    violeta: 'm', violetaSh: 's', violetaLi: 'l', brillo: 'l' };
  function mono(l, m, s, linea, tinta) {
    const k = { L: linea, tinta: tinta || linea };
    for (const c in ROL) k[c] = ROL[c] === 'l' ? l : ROL[c] === 'm' ? m : s;
    return k;
  }

  const P = (k, d, fill, sw) => `<path d="${d}" fill="${fill || 'none'}" stroke="${k.L}" stroke-width="${sw == null ? 2.2 : sw}" stroke-linejoin="round" stroke-linecap="round"/>`;
  const F = (d, fill) => `<path d="${d}" fill="${fill}"/>`;
  const rr = (x, y, w, h, r) => `M${x + r} ${y} H${x + w - r} A${r} ${r} 0 0 1 ${x + w} ${y + r} V${y + h - r} A${r} ${r} 0 0 1 ${x + w - r} ${y + h} H${x + r} A${r} ${r} 0 0 1 ${x} ${y + h - r} V${y + r} A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
  const circ = (cx, cy, r) => `M${cx} ${cy - r} A${r} ${r} 0 1 1 ${cx - .01} ${cy - r}Z`;
  /** destello de cuatro puntas, curvo */
  const destello = (cx, cy, r) => `M${cx} ${cy - r} Q${cx} ${cy} ${cx + r} ${cy} Q${cx} ${cy} ${cx} ${cy + r} Q${cx} ${cy} ${cx - r} ${cy} Q${cx} ${cy} ${cx} ${cy - r}Z`;
  function estrella(cx, cy, r, q) {
    let d = '';
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, ra = i % 2 ? r * (q || .45) : r; d += (i ? 'L' : 'M') + (cx + Math.cos(a) * ra).toFixed(1) + ' ' + (cy + Math.sin(a) * ra).toFixed(1); }
    return d + 'Z';
  }
  /** trazo con borde oscuro y color adentro */
  const T = (k, d, color, w) => `<path d="${d}" fill="none" stroke="${k.L}" stroke-width="${(w || 2) + 2.6}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${color}" stroke-width="${w || 2}" stroke-linecap="round" stroke-linejoin="round"/>`;

  /* ---------- cifras dibujadas (caja de 6×10) ---------- */
  const DIG = {
    0: 'M3 0 C5.2 0 6 2.4 6 5 C6 7.6 5.2 10 3 10 C0.8 10 0 7.6 0 5 C0 2.4 0.8 0 3 0Z',
    1: 'M1 2.2 L3.6 0 V10',
    2: 'M0.4 2.4 C0.9 0.8 2 0 3.2 0 C4.9 0 6 1.2 6 2.8 C6 5 3.2 7 0.2 10 H6',
    3: 'M0.4 1.2 C1.1 0.4 2 0 3 0 C4.7 0 5.8 1 5.8 2.5 C5.8 3.9 4.6 4.8 2.9 4.8 C4.8 4.8 6 5.9 6 7.4 C6 9 4.7 10 3 10 C1.8 10 0.8 9.6 0 8.8',
    5: 'M5.6 0 H1 L0.5 4.3 C1.2 3.8 2.1 3.5 3 3.5 C4.8 3.5 6 4.9 6 6.7 C6 8.7 4.6 10 2.9 10 C1.8 10 0.8 9.6 0 8.8',
    7: 'M0 0 H6 L2 10',
    9: 'M6 3.2 C6 5 4.7 6.3 3 6.3 C1.3 6.3 0 5 0 3.2 C0 1.4 1.3 0 3 0 C4.7 0 6 1.4 6 3.2 V5.5 C6 8.5 4.6 10 2.6 10 C1.6 10 0.8 9.6 0.2 9',
  };
  /** número centrado en (cx, cy), de alto h y trazo sw */
  function num(k, txt, cx, cy, h, sw) {
    const s = h / 10, w = 6 * s, gap = 2.3 * s, n = txt.length;
    const x0 = cx - (n * w + (n - 1) * gap) / 2, y0 = cy - h / 2;
    let out = '';
    for (let i = 0; i < n; i++) {
      out += `<path transform="translate(${(x0 + i * (w + gap)).toFixed(2)} ${y0.toFixed(2)}) scale(${s})" d="${DIG[txt[i]]}" fill="none" stroke="${k.tinta}" stroke-width="${(sw / s).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    return out;
  }

  /* ---------- piezas que se repiten ---------- */
  /** ficha de letra (siete, nueve, eñe) */
  const ficha = (k, cara, canto) =>
    P(k, rr(5, 6.5, 22, 22, 5), canto) +
    P(k, rr(5, 4, 22, 21.5, 5), cara) +
    `<path d="M8.6 7.6 H13.6" stroke="${k.brillo}" stroke-width="1.8" stroke-linecap="round"/>`;

  /** almanaque con un número */
  const almanaque = (k, cabeza, cabezaSh, n, atras) =>
    (atras ? P(k, rr(8, 8.5, 22, 21, 3), k.mentaSh) : '') +
    P(k, rr(4, 6.5, 22, 22, 3), k.menta) +
    F('M22.4 13 H24.6 V26 C24.6 26.6 24.1 27.1 23.5 27.1 H22.4Z', k.mentaSh) +
    P(k, 'M4 9.5 C4 7.8 5.3 6.5 7 6.5 H23 C24.7 6.5 26 7.8 26 9.5 V13 H4Z', cabeza) +
    F('M5.4 11.4 H24.6 V12 H5.4Z', cabezaSh) +
    P(k, 'M10 4 V9 M20 4 V9', null, 2.6) +
    num(k, n, 15, 20.4, n.length > 1 ? 8.4 : 9.6, n.length > 1 ? 3 : 3.4);

  /** gema facetada (como la de Palabra completa) */
  function gema(k, cx, top, w, h, c, cs, cl) {
    const y = top + h * .3, a = w * .155;
    return P(k, `M${cx - w / 2} ${y} L${cx - w / 4} ${top} H${cx + w / 4} L${cx + w / 2} ${y} L${cx} ${top + h}Z`, c, 1.9) +
      F(`M${cx + w / 4} ${top} L${cx + w / 2} ${y} L${cx} ${top + h} L${cx + a} ${y}Z`, cs) +
      F(`M${cx - w / 4} ${top} H${cx + w / 4} L${cx + a} ${y} H${cx - a}Z`, cl) +
      P(k, `M${cx - w / 2} ${y} H${cx + w / 2}`, null, 1.4) +
      P(k, `M${cx - w / 4} ${top} L${cx - a} ${y} L${cx} ${top + h} L${cx + a} ${y} L${cx + w / 4} ${top}`, null, 1.4);
  }

  /** estrella de nivel */
  const estrellaNivel = (k, cx, cy, r) => {
    const d = estrella(cx, cy, r, .52), m = d.split('L').slice(0, 6).join('L') + 'Z';
    return P(k, d, k.oro) + F(m, k.oroSh) + P(k, d, null) + F(destello(cx - r * .45, cy - r * .3, r * .2), k.oroLi);
  };

  /** moneda de canto */
  const canto = (k, x, y, w) =>
    P(k, rr(x, y, w, 4.2, 2.1), k.oro, 1.8) +
    F(`M${x + 1.6} ${y + 2.8} H${x + w - 1.6} V${y + 3.3} H${x + 1.6}Z`, k.oroSh);

  /* ---------- los símbolos (caja de 32×32) ---------- */
  const SIMBOLOS = {
    // Primer hechizo: varita con destello
    primera: (k) =>
      `<g transform="rotate(-45 16 17)">` +
        P(k, rr(3.5, 15, 19, 4.2, 2.1), k.madera) +
        F('M5.6 17.4 H20.5 V19.2 H5.6Z', k.maderaSh) +
        P(k, rr(18.5, 15, 4.5, 4.2, 2.1), k.menta) +
        F('M18.6 17.6 H22.8 V18.9 H18.6Z', k.mentaSh) +
      `</g>` +
      P(k, destello(23.5, 8, 6.2), k.oro, 2) + F(destello(23.5, 8, 2.4), k.oroLi) +
      P(k, destello(27.5, 16.8, 2.6), k.oro, 1.5) +
      P(k, destello(15.2, 5.2, 2.2), k.oro, 1.5),

    // Biblioteca: pila de libros
    cien: (k) => {
      const libro = (x, y, w, h, c, cs) =>
        P(k, rr(x, y, w, h, 1.6), c) +
        F(`M${x + 1.2} ${y + h - 2} H${x + w - 4.6} V${y + h - 1.1} H${x + 1.2}Z`, cs) +
        P(k, `M${x + w - 4} ${y + 1.4} H${x + w - 1.3} V${y + h - 1.4} H${x + w - 4}`, k.menta, 1.6) +
        P(k, `M${x + 3.6} ${y + 1.2} V${y + h - 1.2}`, null, 1.5);
      return libro(4, 20.5, 24, 7, k.coral, k.coralSh) +
        libro(6.5, 13.8, 21, 6.7, k.salviaCl, k.salvia) +
        libro(5.5, 7, 20, 6.8, k.oro, k.oroSh) +
        P(k, 'M19.5 7 V3.6 L21 4.8 L22.5 3.6 V7', k.coral, 1.5);
    },

    // Archivo arcano: pergamino abierto, escrito y con sello de lacre
    quinientas: (k) => {
      const rodillo = (x) =>
        P(k, rr(x, 4.5, 5.6, 23, 2.8), k.maderaCl) +
        F(`M${x + 3.6} 6 H${x + 4.4} V26 H${x + 3.6}Z`, k.madera) +
        P(k, `M${x + 2.8} 4.5 V2.6 M${x + 2.8} 27.5 V29.4`, null, 2.4);
      return P(k, 'M7 7 H25 V25 H7Z', k.oroLi) +
        F('M7 22.6 H25 V25 H7Z', k.oro) +
        P(k, 'M10.6 11 H21.4 M10.6 14.6 H21.4 M10.6 18.2 H17', null, 1.6) +
        rodillo(3) + rodillo(23.4) +
        P(k, 'M19.4 21.4 L18.4 28.6 L20.4 27.4 L21.6 29 L22.2 21.6Z', k.coralSh, 1.4) +
        P(k, circ(21, 20.6, 3.6), k.coral, 1.8) +
        F(destello(21, 20.6, 1.6), k.coralLi);
    },

    // Gran biblioteca: templo de columnas
    mil: (k) => {
      let s = P(k, 'M2.5 25.5 H29.5 V29 H2.5Z', k.mentaSh) +
        P(k, 'M4.5 22.5 H27.5 V25.5 H4.5Z', k.menta);
      for (const x of [6.3, 11.6, 16.9, 22.2]) {
        s += P(k, `M${x} 13 H${x + 3.5} V22.5 H${x}Z`, k.menta, 1.8) + F(`M${x + 2.2} 14 H${x + 2.9} V21.6 H${x + 2.2}Z`, k.mentaSh);
      }
      return s + P(k, 'M4 10.5 H28 V13.2 H4Z', k.salviaCl) +
        P(k, 'M3 10.5 L16 2.8 L29 10.5Z', k.oro) +
        F('M16 4.4 L26.4 9.6 H22Z', k.oroSh) +
        P(k, circ(16, 7.6, 1.7), k.coral, 1.5);
    },

    // Palabra completa: gema
    completa: (k) =>
      P(k, 'M5 12 L10.5 5 H21.5 L27 12 L16 28.5Z', k.salviaCl) +
      F('M21.5 5 L27 12 L16 28.5 L19.4 12Z', k.salvia) +
      F('M10.5 5 H21.5 L19.4 12 H12.6Z', k.menta) +
      P(k, 'M5 12 H27', null, 1.6) +
      P(k, 'M10.5 5 L12.6 12 L16 28.5 L19.4 12 L21.5 5', null, 1.6) +
      F('M8.6 11 L11.2 7.4 L11.8 10.6Z', k.brillo),

    // Coleccionista: tres gemas juntas
    completa10: (k) =>
      gema(k, 8.5, 12, 12, 16, k.salviaCl, k.salvia, k.menta) +
      gema(k, 23.5, 12, 12, 16, k.oro, k.oroSh, k.oroLi) +
      gema(k, 16, 6, 16, 22, k.coral, k.coralSh, k.coralLi) +
      F('M10.3 11.6 L12.2 8.6 L12.7 11.2Z', k.brillo) +
      P(k, destello(27, 5.5, 3.4), k.oro, 1.5),

    // Siete letras: ficha con el 7
    siete: (k) =>
      P(k, rr(5, 6.5, 22, 22, 5), k.mentaSh) +
      P(k, rr(5, 4, 22, 21.5, 5), k.menta) +
      `<path d="M8.6 7.6 H13.6" stroke="${k.brillo}" stroke-width="1.8" stroke-linecap="round"/>` +
      `<path d="M10.8 9.6 H21.2 L15 21.4" fill="none" stroke="${k.tinta}" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="M12.8 15.2 H18.2" fill="none" stroke="${k.tinta}" stroke-width="2.6" stroke-linecap="round"/>` +
      P(k, destello(26.5, 4.8, 3.6), k.oro, 1.5),

    // Nueve letras: ficha dorada con el 9
    nueve: (k) =>
      ficha(k, k.oroLi, k.oro) +
      num(k, '9', 16, 15, 12, 3.8) +
      P(k, destello(26.5, 4.8, 3.6), k.oro, 1.5) +
      P(k, destello(4.6, 25.5, 2.6), k.oro, 1.4),

    // Torbellino: remolino con fichas volando
    veinte: (k) =>
      P(k, 'M4 6.5 C4 3 28 3 28 6.5 C28 9.8 22 10.6 21.2 14 C20.5 17.2 18.6 18.8 18 22 C17.5 24.6 16.4 27 14.6 29 C13.6 27 14.3 24.6 13.7 22 C13 19.4 10.7 17.4 10.6 14 C10.5 10.6 4 9.8 4 6.5Z', k.menta) +
      F('M24.5 9.4 C27 8.6 28 7.6 28 6.5 C28 9.8 22 10.6 21.2 14 C20.5 17.2 18.6 18.8 18 22 C17.5 24.6 16.4 27 14.6 29 C15.6 26 16.2 23 16.8 20 C17.6 16.4 20 14.6 20.6 12 C21 10.6 22.6 9.9 24.5 9.4Z', k.mentaSh) +
      P(k, 'M7.5 7.4 C12 9 20 9 24.5 7.4', null, 1.6) +
      P(k, 'M12.4 13.6 C15 14.8 18 14.8 19.8 13.6', null, 1.5) +
      P(k, 'M14.2 20 C15.4 20.8 16.4 20.8 17.2 20', null, 1.4) +
      `<g transform="rotate(18 25.5 18.5)">${P(k, rr(23, 16, 5.2, 5.2, 1.3), k.oro, 1.6)}</g>` +
      `<g transform="rotate(-14 6 17.5)">${P(k, rr(3.6, 15, 4.8, 4.8, 1.2), k.coral, 1.6)}</g>` +
      `<g transform="rotate(10 23.5 26.5)">${P(k, rr(21.6, 24.6, 3.8, 3.8, 1), k.salviaCl, 1.4)}</g>`,

    // Maremoto: ola grande que rompe
    treinta: (k) =>
      P(k, 'M2.5 27.5 C2.5 17 8.5 8 17.5 6.2 C24.5 4.8 29.6 9 29.2 14 C28.8 18.4 24 20 21.3 17.8 C19.2 16 19.8 12.8 22.2 12.4 C17.6 11.4 13.6 14.6 12.8 19.6 C12.3 22.8 13.2 25.6 15.4 27.5Z', k.salviaCl) +
      F('M22.2 12.4 C17.6 11.4 13.6 14.6 12.8 19.6 C12.3 22.8 13.2 25.6 15.4 27.5 H11 C9.6 24.6 9.8 20 11.6 16.4 C14 12 18.4 10.8 22.2 12.4Z', k.salvia) +
      P(k, 'M17.5 6.2 C24.5 4.8 29.6 9 29.2 14 C28.8 18.4 24 20 21.3 17.8 C23.6 18 26 16.6 26.2 13.8 C26.4 10.4 22.4 8.4 17.5 6.2Z', k.menta, 1.8) +
      P(k, rr(1.5, 25.5, 29, 4.5, 2.25), k.pino) +
      F('M4 27 H13 V27.8 H4Z', k.salviaCl) +
      P(k, circ(6.8, 8.6, 1.6), k.menta, 1.3) +
      P(k, circ(10.8, 5.2, 1.1), k.menta, 1.2) +
      P(k, circ(26, 22.4, 1.3), k.menta, 1.2),

    // En llamas: llama de combo
    combo5: (k) =>
      P(k, 'M16 3 C20.5 9 26.5 12.6 25.5 20 C24.7 25.8 20.6 29 16 29 C11.4 29 7.3 25.8 7 20.6 C6.7 15.4 10.8 13.4 11.8 8.4 C13.6 11.2 14.9 12.4 16 13.8 C16.6 10.4 15.4 6.8 16 3Z', k.coral) +
      F('M22 12.6 C24.6 15 25.9 17.4 25.5 20 C24.9 24.5 22.3 27.6 18.6 28.6 C22 25.8 23.6 21.4 22 12.6Z', k.coralSh) +
      P(k, 'M16 15.8 C19 19.2 21 21.8 20.1 25 C19.4 27.3 12.9 27.5 12 24.8 C11.1 21.6 14.8 19.6 16 15.8Z', k.oro, 1.8) +
      F('M15.2 21.4 C15.6 22.5 15.1 24 14.2 24.6 C13.6 23.4 14.2 22.2 15.2 21.4Z', k.oroLi),

    // Meteoro: roca encendida con estela
    combo10: (k) =>
      P(k, 'M5.6 16.2 C12 9.6 20 5.2 29 3 C26.6 12 22.2 20 15.8 26.4Z', k.coral) +
      F('M9.2 17.6 C14 13 20 9.2 26.2 5.8 C24 12 20.6 17.6 14.4 22.8Z', k.oro) +
      F('M13 18.6 C16.6 15 20 12.8 23.4 10.6 C22 14 19.6 17 15.8 20Z', k.oroLi) +
      P(k, circ(11, 21, 7.2), k.maderaCl) +
      F('M16.6 24.4 A7.2 7.2 0 0 1 5.2 25.2 A6.2 6.2 0 0 0 16.6 24.4Z', k.madera) +
      P(k, circ(8.6, 19.4, 1.8), k.madera, 1.4) +
      P(k, circ(13.6, 23.2, 1.3), k.madera, 1.3) +
      P(k, circ(13.2, 17.6, .9), k.madera, 1.1),

    // Rutina mágica: almanaque con el 1
    diario1: (k) => almanaque(k, k.salviaCl, k.salvia, '1') + P(k, destello(26.2, 5.4, 3.6), k.oro, 1.5),

    // Una semana: almanaque con el 7
    diario7: (k) => almanaque(k, k.coral, k.coralSh, '7') + P(k, destello(26.2, 5.4, 3.6), k.oro, 1.5),

    // Un mes: dos hojas de almanaque con el 30
    diario30: (k) => almanaque(k, k.oro, k.oroSh, '30', true) + P(k, destello(27, 4.6, 3.6), k.oro, 1.5),

    // Tres velas: racha
    racha3: (k) => {
      const vela = (x, top, w) => {
        const cx = x + w / 2;
        return P(k, rr(x, top, w, 26.5 - top, 1.4), k.menta) +
          F(`M${x + w - 2} ${top + 1} H${x + w - 1.1} V${25.6} H${x + w - 2}Z`, k.mentaSh) +
          P(k, `M${cx} ${top} V${top - 1.8}`, null, 1.4) +
          P(k, `M${cx} ${top - 8} C${cx + 2.8} ${top - 5} ${cx + 2.6} ${top - 2.4} ${cx} ${top - 1.4} C${cx - 2.6} ${top - 2.4} ${cx - 2.8} ${top - 5} ${cx} ${top - 8}Z`, k.oro, 1.6);
      };
      return P(k, 'M3.5 26.5 H28.5 C28.5 28.6 26.8 29.5 25 29.5 H7 C5.2 29.5 3.5 28.6 3.5 26.5Z', k.oroSh) +
        vela(5, 18.5, 6) + vela(13, 12, 6) + vela(21, 16, 6);
    },

    // Semana lunar: luna creciente con estrellas
    racha7: (k) =>
      P(k, 'M14.25 5.03 A11 11 0 1 0 25.61 18.91 A9 9 0 0 1 14.25 5.03Z', k.oro) +
      P(k, circ(9, 15.6, 1.8), k.oroSh, 1.3) +
      P(k, circ(13.4, 22.4, 1.3), k.oroSh, 1.2) +
      P(k, destello(24.6, 6, 4.4), k.oroLi, 1.7) +
      P(k, destello(28.4, 25.4, 2.4), k.oroLi, 1.3),

    // Ciclo completo: luna llena con sus fases alrededor
    racha30: (k) => {
      let s = '';
      for (let i = 0; i < 8; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 4, x = (16 + Math.cos(a) * 13.6).toFixed(2), y = (16 + Math.sin(a) * 13.6).toFixed(2);
        s += P(k, circ(+x, +y, 1.7), i % 2 ? k.mentaSh : k.oroLi, 1.2);
      }
      return s + P(k, circ(16, 16, 9.4), k.oro) +
        F('M23.6 21.4 A9.4 9.4 0 0 1 8.4 21.6 A8.6 8.6 0 0 0 23.6 21.4Z', k.oroSh) +
        P(k, circ(12.6, 13.6, 2.2), k.oroSh, 1.3) +
        P(k, circ(19.6, 18.4, 1.6), k.oroSh, 1.2) +
        P(k, circ(18.6, 11.6, 1), k.oroSh, 1.1) +
        F('M9.4 12 A7.4 7.4 0 0 1 13.4 8.2 A6.4 6.4 0 0 0 9.4 12Z', k.oroLi);
    },

    // Mago de verdad: sombrero de mago (como el de Silabo)
    mago: (k) =>
      P(k, 'M7.5 24 C10.6 19 12.4 12 14 6.6 C15 3.6 18.6 2 21.6 3.6 C19.6 4.6 18.6 6.6 19 9.6 C19.8 15 21.6 19.6 24.5 24Z', k.pino) +
      F('M19 9.6 C19.8 15 21.6 19.6 24.5 24 H20.6 C18.6 19.6 17.8 14 18.2 8.4Z', k.pinoSh) +
      P(k, rr(2.5, 23, 27, 5.6, 2.8), k.pino) +
      F('M5 26.6 H27 V27.4 H5Z', k.pinoSh) +
      P(k, 'M8.4 20 C12 21.8 20 21.8 23.6 20 L24.6 23.4 C20.4 25 11.6 25 7.4 23.4Z', k.oro, 1.8) +
      F(estrella(15.6, 14, 3, .5), k.oroLi) +
      F(destello(19.4, 8, 1.4), k.oroLi) +
      P(k, destello(26.4, 8.4, 3.6), k.oro, 1.5),

    // Archimago: orbe arcano con un rayo
    archimago: (k) =>
      P(k, 'M9.5 28.5 C9.5 25 12 23.4 16 23.4 C20 23.4 22.5 25 22.5 28.5Z', k.madera) +
      P(k, rr(6.5, 26.6, 19, 3.2, 1.6), k.maderaSh, 1.8) +
      P(k, circ(16, 13.6, 10.4), k.violeta) +
      F('M24.4 19.6 A10.4 10.4 0 0 1 7.2 19.4 A9.4 9.4 0 0 0 24.4 19.6Z', k.violetaSh) +
      `<path d="M9 10.4 A7.6 7.6 0 0 1 13.6 6.4" fill="none" stroke="${k.violetaLi}" stroke-width="2" stroke-linecap="round"/>` +
      P(k, 'M17.8 5.6 L11.4 14.6 H15.6 L14 21.6 L21 12.2 H17Z', k.oro, 1.7) +
      P(k, destello(27.4, 4.8, 3.2), k.oro, 1.4),

    // Leyenda: estrella con laureles
    leyenda: (k) => {
      let s = P(k, 'M16 28.4 C9 27.4 4.4 22 3.8 14.4 M16 28.4 C23 27.4 27.6 22 28.2 14.4', null, 1.6);
      for (const lado of [-1, 1]) {
        for (let i = 0; i < 4; i++) {
          const g = 108 + i * 26, a = g * Math.PI / 180;
          const x = (16 + lado * Math.cos(a) * 12.4).toFixed(2), y = (15.6 + Math.sin(a) * 12.4).toFixed(2);
          s += `<ellipse cx="${x}" cy="${y}" rx="1.9" ry="3.6" transform="rotate(${lado * (g - 28)} ${x} ${y})" fill="${k.salviaCl}" stroke="${k.L}" stroke-width="1.3"/>`;
        }
      }
      return s + P(k, estrella(16, 14, 11, .48), k.oro) +
        F(estrella(16, 14, 11, .48).split('L').slice(0, 6).join('L') + 'Z', k.oroSh) + P(k, estrella(16, 14, 11, .48), null) +
        F(destello(12.2, 11.4, 2.2), k.oroLi);
    },

    // Quinto piso: torre con bandera
    piso5: (k) =>
      P(k, 'M10 29 L11.5 14 H20.5 L22 29Z', k.salviaCl) +
      F('M17.8 14 H20.5 L22 29 H18.8Z', k.salvia) +
      P(k, 'M9.4 15.4 H22.6 V11.6 H9.4Z', k.salvia) +
      P(k, 'M8 12 L16 4 L24 12Z', k.pino) +
      P(k, 'M16 4 V0.8', null, 1.6) +
      P(k, 'M16 1 L21 2.6 L16 4.2Z', k.coral, 1.4) +
      `<rect x="14.3" y="17.4" width="3.4" height="4.8" rx="1.7" fill="${k.oro}" stroke="${k.L}" stroke-width="1.5"/>` +
      P(k, 'M13.8 29 V25.6 C13.8 23.8 18.2 23.8 18.2 25.6 V29', k.madera, 1.6),

    // Décimo piso: castillo de dos torres
    piso10: (k) => {
      const torre = (x, bandera) =>
        P(k, `M${x} 29 V12 H${x + 7} V29Z`, k.salvia) +
        F(`M${x + 4.8} 12.8 H${x + 6.2} V28.2 H${x + 4.8}Z`, k.pinoSh) +
        P(k, `M${x - 1.2} 12.4 L${x + 3.5} 4.6 L${x + 8.2} 12.4Z`, k.pino) +
        P(k, `M${x + 3.5} 4.6 V1.6`, null, 1.5) +
        P(k, bandera ? `M${x + 3.5} 1.6 L${x + 7.6} 3 L${x + 3.5} 4.4Z` : `M${x + 3.5} 1.6 L${x - .6} 3 L${x + 3.5} 4.4Z`, k.coral, 1.3) +
        `<rect x="${x + 2.2}" y="15.6" width="2.6" height="3.8" rx="1.3" fill="${k.oro}" stroke="${k.L}" stroke-width="1.3"/>`;
      return P(k, 'M8 29 V14.5 H10.8 V16.6 H13.6 V14.5 H18.4 V16.6 H21.2 V14.5 H24 V29Z', k.salviaCl) +
        F('M8.9 19 H23.1 V19.8 H8.9Z', k.salvia) +
        torre(2.5, false) + torre(22.5, true) +
        P(k, 'M12.6 29 V24 C12.6 20.6 19.4 20.6 19.4 24 V29', k.madera, 1.8) +
        P(k, 'M16 21.4 V29', null, 1.4);
    },

    // Tocar el cielo: punta de la torre entre nubes, con estrellas
    piso20: (k) =>
      P(k, 'M12.4 23 L13.2 12.4 H18.8 L19.6 23Z', k.salviaCl) +
      F('M16.8 12.4 H18.8 L19.6 23 H17.4Z', k.salvia) +
      P(k, 'M11.8 13.6 H20.2 V10.6 H11.8Z', k.salvia) +
      P(k, 'M10.4 11 L16 4.4 L21.6 11Z', k.pino) +
      `<rect x="14.6" y="15.6" width="2.8" height="4" rx="1.4" fill="${k.oro}" stroke="${k.L}" stroke-width="1.3"/>` +
      P(k, 'M3.6 28.6 C1 28.6 .8 23.6 4.6 23.6 C5 20.4 9.6 19.6 11.4 22.2 C12.4 19 18.4 18.6 20 21.8 C21.6 19.6 26.8 20 26.8 23.6 C30.8 23.4 31.4 28.6 28.4 28.6Z', k.menta) +
      F('M2.6 26.6 C5 27.4 26 27.4 30.2 26.4 C30 27.8 29.4 28.6 28.4 28.6 H3.6 C3 28.6 2.7 27.8 2.6 26.6Z', k.mentaSh) +
      P(k, estrella(25.6, 7.4, 4.6), k.oro, 1.7) +
      P(k, destello(5.6, 8.4, 3.4), k.oroLi, 1.5) +
      P(k, destello(9.6, 3.2, 1.8), k.oroLi, 1.2),

    // Cazajefes: corona del jefe partida en dos
    jefe1: (k) => {
      const mitad = (d, banda, gx, rot, cx) =>
        `<g transform="rotate(${rot} ${cx} 25.5)">` + P(k, d, k.violeta) +
        F(banda, k.oro) + P(k, d, null) + P(k, banda, null, 1.6) +
        P(k, circ(gx, 23, 1.5), k.coral, 1.3) + `</g>`;
      return mitad('M5 25.5 L4 10.5 L10.5 16 L16 6 L14.6 11 L17 14.6 L14.8 19.2 L16.4 25.5Z', 'M4.67 20.6 H15.16 L16.4 25.5 H5Z', 9.8, -9, 5) +
        mitad('M16 6 L21.5 16 L28 10.5 L27 25.5 L16.4 25.5 L14.8 19.2 L17 14.6 L14.6 11Z', 'M15.16 20.6 H27.33 L27 25.5 H16.4Z', 22, 9, 27) +
        P(k, destello(16, 3.4, 2.8), k.oro, 1.4) +
        P(k, destello(16.4, 29.4, 1.8), k.oro, 1.2);
    },

    // Azote de la Torre: escudo con tres estrellas
    jefe3: (k) =>
      P(k, 'M16 3 L27 7 V15 C27 22 22.5 26.8 16 29 C9.5 26.8 5 22 5 15 V7Z', k.salvia) +
      F('M16 3 L27 7 V15 C27 22 22.5 26.8 16 29Z', k.pino) +
      P(k, 'M16 6.2 L24 9.2 V15 C24 20.4 20.8 24 16 25.8 C11.2 24 8 20.4 8 15 V9.2Z', null, 1.4) +
      P(k, estrella(11.8, 12.6, 3.6), k.oro, 1.5) +
      P(k, estrella(20.2, 12.6, 3.6), k.oro, 1.5) +
      P(k, estrella(16, 19.6, 3.6), k.oro, 1.5),

    // Nivel 5: estrella con el 5
    nivel5: (k) => estrellaNivel(k, 16, 16.6, 13.6) + num(k, '5', 16, 18, 8.4, 2.9),

    // Nivel 10: estrella fugaz con el 10
    nivel10: (k) =>
      T(k, 'M2.6 22.4 L8.6 18.4', k.oro, 2) + T(k, 'M4.8 28.4 L11.2 23.4', k.coral, 2) + T(k, 'M10.6 29.6 L14.4 26', k.oro, 1.8) +
      estrellaNivel(k, 18.2, 14.4, 13) + num(k, '10', 18.2, 15.9, 6.4, 2.4),

    // Nivel 20: estrella radiante con el 20
    nivel20: (k) => {
      let s = '';
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + Math.PI / 5 + i * 2 * Math.PI / 5;
        const x1 = 16 + Math.cos(a) * 10.4, y1 = 16.6 + Math.sin(a) * 10.4, x2 = 16 + Math.cos(a) * 14.6, y2 = 16.6 + Math.sin(a) * 14.6;
        s += T(k, `M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}`, k.oroLi, 1.8);
      }
      return s + estrellaNivel(k, 16, 16.6, 13.2) + num(k, '20', 16, 18, 6.4, 2.4);
    },

    // Tesoro: pila de monedas y una de frente
    rico: (k) =>
      canto(k, 3, 24.6, 15) + canto(k, 4, 21, 14) + canto(k, 2.6, 17.4, 14.6) + canto(k, 4.4, 13.8, 13.4) +
      P(k, circ(22.4, 19.6, 7.8), k.oro) +
      `<circle cx="22.4" cy="19.6" r="4.8" fill="none" stroke="${k.oroSh}" stroke-width="1.8"/>` +
      F(estrella(22.4, 19.6, 2.8), k.oroSh) +
      F('M16.8 15.6 A7 7 0 0 1 20.4 12.4 A6 6 0 0 0 16.8 15.6Z', k.oroLi) +
      P(k, destello(26.6, 6.6, 3.8), k.oro, 1.5) +
      P(k, destello(9.6, 8.2, 2.2), k.oro, 1.3),

    // Banco arcano: cofre del tesoro con monedas
    millonario: (k) =>
      P(k, 'M4 14.5 V11 C4 6.6 9 4.6 16 4.6 C23 4.6 28 6.6 28 11 V14.5Z', k.maderaCl) +
      F('M4.9 13.2 H27.1 V14 H4.9Z', k.madera) +
      P(k, rr(4, 14.5, 24, 12.5, 1.8), k.madera) +
      F('M5.2 24 H26.8 V25.6 C26.8 25.9 26.6 26 26.4 26 H5.6 C5.4 26 5.2 25.9 5.2 25.6Z', k.maderaSh) +
      P(k, 'M8.4 5.6 V27 M23.6 5.6 V27', null, 4.6) +
      `<path d="M8.4 6.4 V26.2 M23.6 6.4 V26.2" stroke="${k.oro}" stroke-width="2.2"/>` +
      P(k, rr(13.2, 11.6, 5.6, 6.6, 1.4), k.oro, 1.8) +
      `<circle cx="16" cy="14.2" r="1.1" fill="${k.L}"/><path d="M16 14.6 V16.4" stroke="${k.L}" stroke-width="1.3" stroke-linecap="round"/>` +
      P(k, circ(25.8, 26.6, 3.2), k.oro, 1.6) + F(estrella(25.8, 26.6, 1.6), k.oroSh) +
      P(k, destello(27.4, 4, 3.2), k.oro, 1.4),

    // Manos rápidas: cronómetro con líneas de velocidad
    rapido: (k) =>
      P(k, rr(13.4, 2.6, 5.2, 3.4, 1.2), k.oro, 1.8) +
      P(k, 'M16 6 V8', null, 2) +
      P(k, 'M23.4 8.8 L25.4 6.8', null, 2.4) +
      P(k, circ(17, 18, 10.6), k.coral) +
      F('M25.6 23.6 A10.6 10.6 0 0 1 8.6 24.6 A9.6 9.6 0 0 0 25.6 23.6Z', k.coralSh) +
      P(k, circ(17, 18, 7.6), k.menta, 1.6) +
      F('M17 18 V10.4 A7.6 7.6 0 0 1 22.4 12.6Z', k.oro) +
      P(k, 'M17 18 L21.4 12.8', null, 2.2) +
      `<circle cx="17" cy="18" r="1.6" fill="${k.L}"/>` +
      T(k, 'M1.6 13.6 H4.6', k.menta, 1.8) + T(k, 'M1 18.4 H4', k.menta, 1.8) + T(k, 'M1.8 23.2 H4.8', k.menta, 1.8),

    // Sobre la hora: reloj de arena con el último grano
    ultimo: (k) =>
      P(k, 'M9.5 7.5 C9.5 13 15 14 15 16 C15 18 9.5 19 9.5 24.5 H22.5 C22.5 19 17 18 17 16 C17 14 22.5 13 22.5 7.5Z', k.menta) +
      F('M11 24.5 C11.4 21 14.6 19.8 16 19.4 C17.4 19.8 20.6 21 21 24.5Z', k.oro) +
      F('M14.4 13.4 H17.6 C17 14.2 16.4 14.6 16 15.2 C15.6 14.6 15 14.2 14.4 13.4Z', k.oro) +
      `<circle cx="16" cy="17.4" r=".9" fill="${k.oroSh}"/>` +
      P(k, rr(6.5, 3.6, 19, 4, 1.6), k.madera) +
      P(k, rr(6.5, 24.4, 19, 4, 1.6), k.madera) +
      F('M8 6.2 H24 V6.8 H8Z M8 27 H24 V27.6 H8Z', k.maderaSh) +
      P(k, destello(26.8, 14.2, 3.8), k.oro, 1.5) +
      P(k, destello(4.6, 16.6, 2.2), k.oro, 1.3),

    // Con eñe: ficha con la Ñ
    enie: (k) =>
      ficha(k, k.coralLi, k.coral) +
      `<path d="M10.6 22 V12 L21.4 22 V12" fill="none" stroke="${k.tinta}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="M10.8 8.6 C12.2 6.6 13.9 6.6 15.6 7.8 C17.3 9 19 9 20.6 7" fill="none" stroke="${k.tinta}" stroke-width="2.4" stroke-linecap="round"/>` +
      P(k, destello(26.5, 4.8, 3.6), k.oro, 1.5),

    // Practicante: flor de loto sobre la hoja
    practicante: (k) =>
      P(k, 'M3.5 25.6 C8 23.6 24 23.6 28.5 25.6 C24 28.6 8 28.6 3.5 25.6Z', k.salviaCl) +
      P(k, 'M16 24.4 C10 25.4 4.6 23.4 3 19 C7.6 17.8 12.4 19.6 16 24.4Z', k.coralSh, 1.8) +
      P(k, 'M16 24.4 C22 25.4 27.4 23.4 29 19 C24.4 17.8 19.6 19.6 16 24.4Z', k.coralSh, 1.8) +
      P(k, 'M16 24 C10.4 22.6 6.4 17.6 6.2 11 C11.2 11.8 14.8 16 16 24Z', k.coral, 1.8) +
      P(k, 'M16 24 C21.6 22.6 25.6 17.6 25.8 11 C20.8 11.8 17.2 16 16 24Z', k.coral, 1.8) +
      P(k, 'M16 5 C20.4 9.4 20.6 18.6 16 24 C11.4 18.6 11.6 9.4 16 5Z', k.coralLi, 1.8) +
      F('M16 7.6 C18.6 11 18.8 17.6 16 21.8 C17.4 17.4 17.4 11.6 16 7.6Z', k.coral) +
      P(k, destello(26.4, 5.4, 3), k.oro, 1.4) +
      P(k, destello(5.4, 6.6, 2), k.oro, 1.2),

    // Recadero: pergamino de misiones
    misiones5: (k) => {
      const fila = (y, hecho) =>
        `<rect x="10" y="${y - 2}" width="4" height="4" rx="1" fill="${hecho ? k.salviaCl : k.menta}" stroke="${k.L}" stroke-width="1.4"/>` +
        (hecho ? `<path d="M10.8 ${y} L12 ${y + 1.3} L14.6 ${y - 2.2}" fill="none" stroke="${k.tinta}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>` : '') +
        `<path d="M16.5 ${y} H22" stroke="${k.salvia}" stroke-width="1.8" stroke-linecap="round"/>`;
      return P(k, 'M8 7 H24 V25 H8Z', k.menta) +
        F('M21.6 7 H24 V25 H21.6Z', k.mentaSh) +
        P(k, rr(5.5, 3.5, 21, 5, 2.5), k.maderaCl) +
        F('M7 6.8 H25 V7.6 C25 8 24.6 8.5 24 8.5 H8 C7.4 8.5 7 8 7 7.6Z', k.madera) +
        P(k, rr(5.5, 23.5, 21, 5, 2.5), k.maderaCl) +
        F('M7 26.8 H25 V27.4 C25 28 24.6 28.5 24 28.5 H8 C7.4 28.5 7 28 7 27.4Z', k.madera) +
        fila(12, true) + fila(17.5, true) + fila(22.5 - 1.3, false);
    },

    // Cumplidor: carpetas con el sello de hecho
    misiones25: (k) =>
      P(k, 'M5.5 7.6 C5.5 6.7 6.2 6 7.1 6 H12 L14 8.4 H25.4 C26.3 8.4 27 9.1 27 10 V22 H5.5Z', k.salvia) +
      P(k, rr(8.4, 9.4, 15.2, 12, 1), k.menta, 1.8) +
      P(k, 'M11 13 H21 M11 16 H18', null, 1.4) +
      P(k, 'M3.8 14.4 C3.8 13.5 4.5 12.8 5.4 12.8 H26.6 C27.5 12.8 28.2 13.5 28.2 14.4 V26.4 C28.2 27.3 27.5 28 26.6 28 H5.4 C4.5 28 3.8 27.3 3.8 26.4Z', k.oro) +
      F('M5 25.4 H27 V26.2 C27 26.6 26.7 26.8 26.4 26.8 H5.6 C5.3 26.8 5 26.6 5 26.2Z', k.oroSh) +
      P(k, circ(21.4, 20.6, 5.2), k.pino, 1.8) +
      `<path d="M18.8 20.8 L20.7 22.7 L24 18.8" fill="none" stroke="${k.menta}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>` +
      P(k, 'M7.4 17 H13.4', null, 1.6),

    // Omnisciente: ojo que todo lo ve, con rayos
    perfecto: (k) =>
      T(k, 'M16 2.6 V6', k.oro, 2) + T(k, 'M7.6 4.8 L9.6 8', k.oro, 2) + T(k, 'M24.4 4.8 L22.4 8', k.oro, 2) +
      T(k, 'M2.4 10.4 L5.4 12.4', k.oro, 2) + T(k, 'M29.6 10.4 L26.6 12.4', k.oro, 2) +
      P(k, 'M3 18 C8 10 24 10 29 18 C24 26 8 26 3 18Z', k.menta) +
      F('M29 18 C24 26 8 26 3 18 C8 23.6 24 23.6 29 18Z', k.mentaSh) +
      P(k, circ(16, 18, 6), k.violeta, 1.8) +
      `<circle cx="16" cy="18" r="2.7" fill="${k.L}"/><circle cx="13.9" cy="15.9" r="1.5" fill="${k.brillo}"/>` +
      P(k, destello(27.4, 26.6, 2.6), k.oro, 1.3),
  };

  /* ---------- medallón de bronce ---------- */
  function candado() {
    return `<path d="M46 47.5 V44.5 A3.8 3.8 0 0 1 53.6 44.5 V47.5" fill="none" stroke="${L}" stroke-width="5" stroke-linecap="round"/>` +
      `<path d="M46 47.5 V44.5 A3.8 3.8 0 0 1 53.6 44.5 V47.5" fill="none" stroke="#c9d3cf" stroke-width="2" stroke-linecap="round"/>` +
      `<path d="${rr(42.3, 46.3, 15, 11.7, 3)}" fill="#c9d3cf" stroke="${L}" stroke-width="2.4" stroke-linejoin="round"/>` +
      `<path d="M43.9 54.6 H56.4 V55.3 C56.4 56.2 55.7 56.6 55 56.6 H45.3 C44.6 56.6 43.9 56.2 43.9 55.3Z" fill="#9aa8a4"/>` +
      `<circle cx="49.8" cy="50.8" r="1.7" fill="${L}"/><path d="M49.8 51.5 V54" stroke="${L}" stroke-width="1.6" stroke-linecap="round"/>`;
  }

  const KB = mono('#4d5c5c', '#4d5c5c', '#4d5c5c', L);
  const genericO = (k) => P(k, estrella(16, 16.5, 12), k.oro) + F(estrella(16, 16.5, 5), k.oroLi);

  function medallon(id, b) {
    const c = b ? { r: '#8e9a97', sh: '#65726f', li: '#b6c0bd', perla: '#6f7c79', fondo: '#26353b', fondoSh: '#1d2a2f' }
                : { r: '#f2c66d', sh: '#c49a42', li: '#fff1bf', perla: '#c49a42', fondo: '#2c4d58', fondoSh: '#223e47' };
    const k = b ? KB : K;
    let s = `<circle cx="32" cy="33.5" r="28.5" fill="${L}" opacity=".35"/>`;
    s += P(K, circ(32, 32, 28.5), c.r, 2.8);
    s += F('M53.5 46 A25 25 0 0 1 14 52 A28.5 28.5 0 0 0 53.5 46Z', c.sh);
    s += F('M8.5 30 A24 24 0 0 1 24 8.5 A26 26 0 0 0 8.5 30Z', c.li);
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2 + Math.PI / 16; s += `<circle cx="${(32 + Math.cos(a) * 25.6).toFixed(2)}" cy="${(32 + Math.sin(a) * 25.6).toFixed(2)}" r="1.05" fill="${c.perla}"/>`; }
    s += P(K, circ(32, 32, 22.2), c.sh, 2.2);
    s += P(K, circ(32, 32, 20.2), c.fondo, 1.6);
    s += F('M14.2 28 A18.2 18.2 0 0 1 46 19 A20.2 20.2 0 0 0 14.2 28Z', c.fondoSh);
    s += `<g transform="translate(14.4 14.6) scale(1.1)">${(SIMBOLOS[id] || genericO)(k)}</g>`;
    if (b) s += candado();
    return s;
  }

  // cache: cada ícono se arma una sola vez
  const cache = {};
  window.WWLogrosIconos = {
    SIMBOLOS,
    /** '<svg class="ic-logro" …>' del logro; bloqueado = gris con candado */
    html(id, bloqueado) {
      const key = id + (bloqueado ? '|b' : '');
      if (!cache[key]) cache[key] = `<svg class="ic-logro" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${medallon(id, !!bloqueado)}</svg>`;
      return cache[key];
    },
  };
})();
