/**
 * Word Wizard — íconos propios, con el mismo trazo que Silabo y el bosque:
 * tonos planos, contorno de color (#16262c), sin degradados. Reemplazan a los emojis de la interfaz.
 *
 *   WWIconos.html('moneda')          → '<i class="ic">…svg…</i>' para meter en innerHTML
 *   <i class="ic" data-ic="torre"></i> en el HTML se completa solo al cargar (WWIconos.pintar()).
 */
(function () {
  'use strict';
  const L = '#16262c';
  const C = { oro: '#f2c66d', oroSh: '#c49a42', menta: '#dfebd6', mentaSh: '#b9cbb5', salvia: '#67948f', salviaCl: '#92afa1',
    pino: '#2f7f7a', coral: '#e8907a', coralSh: '#c9705c', madera: '#7a5a3c', violeta: '#7a66c9', claro: '#f3f6ee' };
  const P = (d, fill, sw) => `<path d="${d}" fill="${fill || 'none'}" stroke="${L}" stroke-width="${sw == null ? 2.2 : sw}" stroke-linejoin="round" stroke-linecap="round"/>`;
  const F = (d, fill) => `<path d="${d}" fill="${fill}"/>`;
  /** trazo claro con borde oscuro (para flechas y cruces sobre madera) */
  const T = (d, color) => `<path d="${d}" fill="none" stroke="${L}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${color || C.claro}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>`;
  function estrella(cx, cy, r, k) {
    let d = '';
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * (k || .45) : r; d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1); }
    return d + 'Z';
  }
  function engranaje() {
    let d = '';
    for (let i = 0; i < 16; i++) {
      const a0 = i * Math.PI / 8 - .2, a1 = i * Math.PI / 8 + .2, r = i % 2 ? 9.5 : 13;
      d += (i ? 'L' : 'M') + (16 + Math.cos(a0) * r).toFixed(1) + ' ' + (16 + Math.sin(a0) * r).toFixed(1) + ' L' + (16 + Math.cos(a1) * r).toFixed(1) + ' ' + (16 + Math.sin(a1) * r).toFixed(1);
    }
    return d + 'Z';
  }
  const corazon = 'M16 27 C9 22 4 17.5 4 12 C4 8 7 5.5 10.5 5.5 C13 5.5 15 7 16 9 C17 7 19 5.5 21.5 5.5 C25 5.5 28 8 28 12 C28 17.5 23 22 16 27Z';

  const ICONOS = {
    moneda: P('M16 4.5 A11.5 11.5 0 1 1 15.9 4.5Z', C.oro) + `<circle cx="16" cy="16" r="7.2" fill="none" stroke="${C.oroSh}" stroke-width="2"/>` + F(estrella(16, 16, 4.2), C.oroSh) + `<path d="M9 10.5 A9 9 0 0 1 13 7.6" stroke="#fff6d8" stroke-width="2" fill="none" stroke-linecap="round"/>`,
    llama: P('M16 3.5 C20.5 9.5 26 13 25 20 C24.2 25.8 20.4 29 16 29 C11.6 29 7.6 25.8 7.3 20.8 C7 15.6 11 13.6 12 8.6 C13.8 11.4 15 12.6 16 14 C16.6 10.6 15.4 7 16 3.5Z', C.coral) + F('M16 16.5 C18.6 19.6 20.4 21.8 19.6 24.6 C19 26.6 13.4 26.8 12.6 24.4 C11.8 21.6 15 19.8 16 16.5Z', C.oro),
    trofeo: P('M9 8 H5.5 C5.5 13 7.5 15.5 10.5 15.5 M23 8 H26.5 C26.5 13 24.5 15.5 21.5 15.5') + P('M9 4.5 H23 V12 C23 17 20 20 16 20 C12 20 9 17 9 12Z', C.oro) + F('M19.5 6.5 H21.5 V12 C21.5 14.6 20.6 16.6 19 17.8 C19.5 16 19.5 14 19.5 12Z', C.oroSh) + P('M14 20 H18 V24 H14Z', C.oroSh) + P('M10 24 H22 V28 H10Z', C.madera),
    calendario: P('M5 9 C5 7.3 6.3 6 8 6 H24 C25.7 6 27 7.3 27 9 V25 C27 26.7 25.7 28 24 28 H8 C6.3 28 5 26.7 5 25Z', C.menta) + P('M5 9 C5 7.3 6.3 6 8 6 H24 C25.7 6 27 7.3 27 9 V12.5 H5Z', C.coral) + P('M11 3.5 V8.5 M21 3.5 V8.5', null, 2.6) + [[10, 17], [16, 17], [22, 17], [10, 22.5], [16, 22.5]].map(([x, y]) => `<rect x="${x - 2}" y="${y - 2}" width="4" height="4" rx="1" fill="${C.salvia}"/>`).join('') + `<rect x="20" y="20.5" width="4" height="4" rx="1" fill="${C.oro}" stroke="${L}" stroke-width="1.4"/>`,
    torre: P('M10.5 29 L11.8 13 H20.2 L21.5 29Z', C.salviaCl) + F('M17.6 13 H20.2 L21.5 29 H18.4Z', C.salvia) + P('M10.2 14.5 H21.8 V11 H10.2Z', C.salvia) + P('M8.5 11.5 L16 2.5 L23.5 11.5Z', C.pino) + `<rect x="14.4" y="17" width="3.2" height="4.6" rx="1.6" fill="${C.oro}" stroke="${L}" stroke-width="1.4"/>` + P('M14 29 V25.5 C14 24 18 24 18 25.5 V29', C.madera, 1.6),
    vela: P('M10 27.5 C10 25.5 22 25.5 22 27.5 C22 29 10 29 10 27.5Z', C.oroSh) + P('M12 14 H20 V26.5 H12Z', C.menta) + F('M17.5 14 H20 V26.5 H17.5Z', C.mentaSh) + P('M16 14 V11.5', null, 1.6) + P('M16 3.5 C19 7 19 10 16 11.5 C13 10 13 7 16 3.5Z', C.oro),
    libro: P('M16 9 C12 6 7.5 6 4 7.5 V25 C7.5 23.5 12 23.5 16 26 C20 23.5 24.5 23.5 28 25 V7.5 C24.5 6 20 6 16 9Z', C.menta) + F('M16 9 C20 6 24.5 6 28 7.5 V25 C24.5 23.5 20 23.5 16 26Z', C.mentaSh) + P('M16 9 V26') + P('M7 11.5 C9 11 11 11 13 12 M7 15.5 C9 15 11 15 13 16 M19 12 C21 11 23 11 25 11.5', null, 1.5),
    medalla: P('M10 3.5 H15 L18 12 H13Z', C.coral) + P('M22 3.5 H17 L14 12 H19Z', C.salvia) + P('M16 11 A8.5 8.5 0 1 1 15.9 11Z', C.oro) + F(estrella(16, 19.5, 4.6), C.oroSh),
    grafico: P('M4.5 27.5 H27.5', null, 2.4) + P('M6.5 16 H11.5 V27.5 H6.5Z', C.salvia) + P('M13.5 9 H18.5 V27.5 H13.5Z', C.oro) + P('M20.5 13 H25.5 V27.5 H20.5Z', C.coral),
    pregunta: P('M16 3.5 A12.5 12.5 0 1 1 15.9 3.5Z', C.salviaCl) + `<path d="M12 12.4 C12 9.4 14 7.8 16.4 7.8 C19 7.8 20.6 9.6 20.6 11.8 C20.6 14.8 17 15.2 17 18.6" fill="none" stroke="${L}" stroke-width="3.2" stroke-linecap="round"/><circle cx="17" cy="23.2" r="2" fill="${L}"/>`,
    engranaje: P(engranaje(), C.salviaCl) + P('M16 11.5 A4.5 4.5 0 1 1 15.9 11.5Z', C.madera),
    globo: P('M6.5 6.5 H25.5 C27 6.5 28 7.5 28 9 V19 C28 20.5 27 21.5 25.5 21.5 H15 L9 26.5 V21.5 H6.5 C5 21.5 4 20.5 4 19 V9 C4 7.5 5 6.5 6.5 6.5Z', C.menta) + [11, 16, 21].map((x) => `<circle cx="${x}" cy="14" r="1.9" fill="${C.salvia}"/>`).join(''),
    nota: P('M13 23.5 V8.5 L25 5.5 V20.5', null, 2.8) + P('M13 8.5 L25 5.5 V9.5 L13 12.5Z', C.oro) + P('M7 23.5 C7 21.5 9 20.5 10.5 20.5 C12 20.5 13 21.5 13 23.5 C13 25.5 11 26.5 9.5 26.5 C8 26.5 7 25.5 7 23.5Z', C.oro) + P('M19 20.5 C19 18.5 21 17.5 22.5 17.5 C24 17.5 25 18.5 25 20.5 C25 22.5 23 23.5 21.5 23.5 C20 23.5 19 22.5 19 20.5Z', C.oro),
    pista: P('M16 3.5 C21 3.5 24 7 24 11 C24 14.6 21.5 16 20.5 19 H11.5 C10.5 16 8 14.6 8 11 C8 7 11 3.5 16 3.5Z', C.oro) + `<path d="M11.5 8.5 C12 7 13.2 6.2 14.6 6" stroke="#fff6d8" stroke-width="2" fill="none" stroke-linecap="round"/>` + P('M11.5 19 H20.5 V23 C20.5 24.5 19.5 25.5 18 25.5 H14 C12.5 25.5 11.5 24.5 11.5 23Z', C.salviaCl) + P('M12 22 H20', null, 1.6) + P('M14 28.5 H18', null, 2.4),
    arena: P('M7 4 H25 V7.5 H7Z M7 24.5 H25 V28 H7Z', C.madera) + P('M9.5 7.5 C9.5 13 15 14 15 16 C15 18 9.5 19 9.5 24.5 H22.5 C22.5 19 17 18 17 16 C17 14 22.5 13 22.5 7.5Z', C.menta) + F('M11.5 24.5 C12 21 15 20.5 16 18.5 C17 20.5 20 21 20.5 24.5Z', C.oro) + F('M12.3 10 H19.7 C19 12 16.8 13 16 14.5 C15.2 13 13 12 12.3 10Z', C.oro),
    ojo: P('M3 16 C8 8 24 8 29 16 C24 24 8 24 3 16Z', C.menta) + P('M16 10.3 A5.7 5.7 0 1 1 15.9 10.3Z', C.violeta) + `<circle cx="16" cy="16" r="2.6" fill="${L}"/><circle cx="14" cy="14" r="1.4" fill="#fff"/>`,
    escudo: P('M16 3 L27 7 V15 C27 22 22.5 26.8 16 29 C9.5 26.8 5 22 5 15 V7Z', C.salvia) + F('M16 3 L27 7 V15 C27 22 22.5 26.8 16 29Z', C.pino) + P(estrella(16, 15.5, 5.6), C.oro, 1.6),
    corazon: P(corazon, C.coral) + `<path d="M8.5 10.5 C9 9 10 8.3 11.4 8.2" stroke="#fbd2c6" stroke-width="2" fill="none" stroke-linecap="round"/>`,
    corazonVacio: P(corazon, '#3a4639'),
    estrella: P(estrella(16, 16.5, 12.5), C.oro) + F(estrella(16, 16.5, 5.5), '#fff1bf'),
    casa: P('M7 15 V27.5 H25 V15', C.menta) + F('M18 15 H25 V27.5 H18Z', C.mentaSh) + P('M4 16 L16 5 L28 16 L25.5 18 L16 9.5 L6.5 18Z', C.coral) + P('M13.5 27.5 V21 H18.5 V27.5', C.madera) + P('M7 15 V27.5 H25 V15'),
    compartir: P('M10 16 L22 9 M10 16 L22 23', null, 2.6) + [[9, 16, C.oro], [23, 8.5, C.salviaCl], [23, 23.5, C.coral]].map(([x, y, c]) => P(`M${x} ${y - 4.5} A4.5 4.5 0 1 1 ${x - .1} ${y - 4.5}Z`, c)).join(''),
    repetir: T('M24.5 13 A9 9 0 1 0 25 19') + T('M25.5 6.5 V13.5 H18.5'),
    cerrar: T('M9 9 L23 23 M23 9 L9 23'),
    volver: T('M18.5 8 L10.5 16 L18.5 24 M11 16 H25'),
    mezclar: T('M5 10.5 H10 C16 10.5 16 21.5 22 21.5 H26.5 M5 21.5 H10 C12.5 21.5 13.5 19.5 14.5 17.5 M17.5 14.5 C18.5 12.5 19.5 10.5 22 10.5 H26.5') + T('M23 7 L26.8 10.5 L23 14 M23 18 L26.8 21.5 L23 25'),
    borrar: P('M11.5 7.5 H25.5 C27 7.5 28 8.5 28 10 V22 C28 23.5 27 24.5 25.5 24.5 H11.5 L4 16Z', C.coral) + T('M14.5 12 L22.5 20 M22.5 12 L14.5 20'),
    enviar: `<path d="M6.5 16.5 L13 23 L26 9.5" fill="none" stroke="#2a2412" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
    instalar: P('M9.5 3.5 H22.5 C23.6 3.5 24.5 4.4 24.5 5.5 V26.5 C24.5 27.6 23.6 28.5 22.5 28.5 H9.5 C8.4 28.5 7.5 27.6 7.5 26.5 V5.5 C7.5 4.4 8.4 3.5 9.5 3.5Z', C.salviaCl) + P('M10.5 7 H21.5 V23 H10.5Z', C.menta) + T('M16 9.5 V19 M12.5 15.5 L16 19 L19.5 15.5', C.pino),
    objetivo: P('M16 3.5 A12.5 12.5 0 1 1 15.9 3.5Z', C.coral) + P('M16 8 A8 8 0 1 1 15.9 8Z', C.menta) + P('M16 12.2 A3.8 3.8 0 1 1 15.9 12.2Z', C.coral),
    calavera: P('M16 4 C22.5 4 26.5 8.5 26.5 14 C26.5 17.5 24.5 19.5 22.5 20.5 V25 C22.5 26.4 21.4 27.5 20 27.5 H12 C10.6 27.5 9.5 26.4 9.5 25 V20.5 C7.5 19.5 5.5 17.5 5.5 14 C5.5 8.5 9.5 4 16 4Z', C.menta) + `<circle cx="11.8" cy="14.5" r="3" fill="${L}"/><circle cx="20.2" cy="14.5" r="3" fill="${L}"/>` + P('M13.5 27.5 V23.5 M16 27.5 V23.5 M18.5 27.5 V23.5', null, 1.6),
    espadas: T('M7 25 L24 8 M25 25 L8 8', C.menta) + P('M5 22.5 L9.5 27 M27 22.5 L22.5 27', null, 3.4),
    rayo: P('M18.5 3 L7.5 18 H15 L12.5 29 L24.5 13 H17Z', C.oro),
  };

  const Iconos = {
    ICONOS,
    svg(n) { const i = ICONOS[n]; return i ? `<svg viewBox="0 0 32 32" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${i}</svg>` : ''; },
    html(n, extra) { return `<i class="ic${extra ? ' ' + extra : ''}" data-ic="${n}">${this.svg(n)}</i>`; },
    /** Completa todos los <i class="ic" data-ic="..."> que estén vacíos. */
    pintar(raiz) { (raiz || document).querySelectorAll('i.ic[data-ic]').forEach((el) => { if (!el.firstChild) el.innerHTML = this.svg(el.dataset.ic); }); },
  };
  window.WWIconos = Iconos;
})();
