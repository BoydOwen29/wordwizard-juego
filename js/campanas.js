/**
 * Word Wizard — el libro de Aventura (v2.44, 18/10/2026; lab/libro-capitulos.html y lab/escenas-ronda2.html).
 * La Torre Arcana es el capítulo gratis; después vienen las regiones de la Campaña del Archimago (con el Pase).
 * Cada capítulo tiene su escena animada con un "antes" (por jugar) y un "después" (el lugar liberado cuando lo
 * terminaste). Las animaciones son clases c-* (estilo.css, sección "campañas"); nada de filter (iPhone).
 * Los personajes salen de game/js/elenco.js (WWElenco), Silabo de silabo.js y las formas del bosque de escena.js.
 */
(function () {
  'use strict';
  const E = () => window.WWElenco;
  const sinSvg = (s) => s.replace(/^<svg[^>]*>|<\/svg>$/g, '');
  const vb = (s) => (s.match(/viewBox="([^"]+)"/) || [0, '0 0 100 100'])[1].split(' ').map(Number);
  /** Un dibujo dentro de la escena: x, y = centro de los pies, h = alto. */
  function figura(svg, x, y, h, clase, estilo) {
    const [vx, vy, vw, vh] = vb(svg), k = h / vh;
    return `<g class="${clase || ''}"${estilo ? ` style="${estilo}"` : ''}><g transform="translate(${n1(x - (vw / 2) * k)} ${n1(y - vh * k)}) scale(${n1(k * 1000) / 1000}) translate(${-vx} ${-vy})">${sinSvg(svg)}</g></g>`;
  }
  /** Dónde cae, en la escena, un punto (px, py) del dibujo puesto con figura(svg, x, y, h). */
  function punto(svg, x, y, h, px, py) { const [vx, vy, vw, vh] = vb(svg), k = h / vh; return [n1(x - (vw / 2) * k + (px - vx) * k), n1(y - vh * k + (py - vy) * k)]; }
  const n1 = (v) => Math.round(v * 10) / 10;
  let semilla = 11;
  const rnd = () => (semilla = (semilla * 9301 + 49297) % 233280) / 233280;
  const estrellas = (n, h) => Array.from({ length: n }, () => `<circle cx="${(rnd() * 300).toFixed(1)}" cy="${(rnd() * h).toFixed(1)}" r="${(0.7 + rnd() * 1.5).toFixed(1)}" fill="#fff1c9" class="c-tit" style="animation-delay:${(rnd() * 2.4).toFixed(2)}s"/>`).join('');
  const d = (s) => `style="animation-delay:${s}s"`;
  const SILABO = () => window.Silabo.mago(Object.assign({}, window.Silabo.OFICIAL));
  const sombra = () => { const P = window.WWMago && window.WWMago.PALETAS && window.WWMago.PALETAS.sombra; return P ? { colores: P.c } : {}; };
  const NOCTURNIA = () => window.Silabo.mago(Object.assign({}, window.Silabo.OFICIAL, sombra(), { etapa: 3, varita: 1.6, anguloVarita: -70 }));
  const UMBRIO_C = { hat: '#2b2340', hatSh: '#1d1830', robe: '#3a2b5c', robeSh: '#2a1f45', band: '#8a6fc9', hem: '#8a6fc9', starRobe: '#c9b6ff', shoe: '#151225', star: '#c9b6ff', nose: '#b8a4c9', noseHi: '#d8cbe3', beard: '#cfd2e0', beardSh: '#a3a8bd' };
  const UMBRIO_E = { forma: 'dormilon', sombrero: 'runas', motivo: 'runas', capa: '#1d1830', punta: 'orbe', barbaFin: 214, barbaExtra: 'trenza', metal: '#8a6fc9', bigote: 'manubrio' };
  const UMBRIO = (redimido) => window.Silabo.mago(Object.assign({}, window.Silabo.OFICIAL, {
    colores: redimido ? Object.assign({}, UMBRIO_C, { hat: '#efe9dc', hatSh: '#d8cfba', band: '#f2c66d', hem: '#f2c66d', starRobe: '#f2c66d', star: '#fff1bf' }) : UMBRIO_C,
    estilo: redimido ? Object.assign({}, UMBRIO_E, { capa: '#d9a441' }) : UMBRIO_E, etapa: 3, varita: 1.75, anguloVarita: -84,
  }));
  const formas = () => { const F = window.WWEscena && window.WWEscena.formas; if (F && F.usarLugar) F.usarLugar('bosque'); return F; };
  const pinos = (F, n, y, hMin, hMax, c, sh, sem0, x0, x1) => {
    if (!F) return '';
    const r = F.azarCon(sem0); let s = '';
    for (let i = 0; i < n; i++) { const x = x0 + (i + r() * .7) * (x1 - x0) / n, h = hMin + r() * (hMax - hMin); s += F.pino(x, y + r() * 4, h, h * .55, c, sh, 2, false, r); }
    return s;
  };
  /** Una nube que cruza el cielo (lenta). */
  const nubeCruza = (y, k, op, demora) => `<g class="c-nube" ${d(demora || 0)}><path transform="translate(0 ${y}) scale(${k})" d="M0 0 a10 10 0 0 1 14 -10 a14 14 0 0 1 26 2 a10 10 0 0 1 8 14 Z" fill="#fff" opacity="${op}"/></g>`;
  /** Las letras del cartel de la Pradera, una por una según su ancho (para que el viento se lleve algunas). */
  const ANCHO = { C: 7.2, A: 7.4, M: 9.4, I: 3.6, N: 7.8, O: 7.8 };
  function cartel(L, txt, clase) {
    const total = txt.split('').reduce((s, c) => s + (ANCHO[c] || 7), 0);
    let x = 201 - total / 2;
    return txt.split('').map((c, i) => { const w = ANCHO[c] || 7, t = `<text x="${n1(x + w / 2)}" y="106" font-size="11" text-anchor="middle" font-family="Fredoka, sans-serif" fill="#5a4a36" class="${clase(i)}" ${d(i * .6)}>${c}</text>`; x += w + .6; return t; }).join('');
  }
  /** Letras que caen libres (el "después" de cada capítulo). */
  const letrasLibres = (L, txt, x, y, abanico) => txt.split('').map((c, i) => `<text x="${x}" y="${y}" font-size="11" font-family="Fredoka, sans-serif" fill="#fff1c9" stroke="${L}" stroke-width="2.5" paint-order="stroke" class="c-libre" style="--dx:${n1((i - (txt.length - 1) / 2) * abanico)}px;animation-delay:${(i * .5).toFixed(2)}s">${c}</text>`).join('');

  // ---------------------------------------------------------------- las escenas (300 × 200). (L, e, despues)
  const ESCENAS = {
    // La cima desde el bosque (ronda 2, opción B): la torre en el cerro, ventanas que se prenden y Nocturnia arriba
    torre: (L, e, despues) => {
      const F = formas(), P = (dd, fill, w) => `<path d="${dd}" fill="${fill}" stroke="${L}" stroke-width="${w || 2.5}" stroke-linejoin="round"/>`;
      let s = `<defs><linearGradient id="cgT${despues ? 'd' : ''}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${despues ? '#2b4a7a' : '#14212b'}"/><stop offset=".7" stop-color="${despues ? '#7d6aa8' : '#2c4d58'}"/><stop offset="1" stop-color="${despues ? '#c493b0' : '#3f666c'}"/></linearGradient></defs><rect width="300" height="200" fill="url(#cgT${despues ? 'd' : ''})"/>${estrellas(36, 120)}`;
      s += `<circle cx="60" cy="44" r="20" fill="#fff1c9" stroke="${L}" stroke-width="2.2"/><circle cx="54" cy="40" r="4" fill="#e9dcbc"/><circle cx="66" cy="50" r="3" fill="#e9dcbc"/>`;
      s += `<g class="c-fugaz"><path d="M262 18 l-24 9" stroke="#fff1c9" stroke-width="2.2" stroke-linecap="round"/></g>`;
      s += P('M108 152 C138 112 202 112 238 152 Z', '#24454c', 3);
      const tx = 172, ty = 126, th = 72, tw = 33;
      s += P(`M${tx - tw / 2} ${ty} L${tx - tw * .4} ${ty - th} L${tx + tw * .4} ${ty - th} L${tx + tw / 2} ${ty}Z`, '#4a6c6b');
      s += P(`M${tx - tw * .55} ${ty - th + 6} L${tx - tw * .55} ${ty - th - 4} L${tx + tw * .55} ${ty - th - 4} L${tx + tw * .55} ${ty - th + 6}Z`, '#56787a') + P(`M${tx - tw * .65} ${ty - th - 3} L${tx} ${ty - th - tw * 1.4} L${tx + tw * .65} ${ty - th - 3}Z`, '#2f7f7a');
      if (F) s += `<path d="${F.estrella(tx, ty - th - tw * 1.5, 7)}" fill="#fff1bf" stroke="${L}" stroke-width="1.5" class="c-late"/>`;
      s += [0, 1, 2, 3].map((i) => `<rect x="${tx - 4}" y="${ty - 15 - i * 15}" width="8" height="10" rx="4" stroke="${L}" stroke-width="1.8" fill="${despues ? '#f2c66d' : '#3b4a55'}" class="${despues ? 'c-late' : 'c-ventana'}" style="animation-delay:${(i * 1.4).toFixed(1)}s"/>`).join('');
      if (!despues) s += `<circle cx="${tx}" cy="${ty - th - 28}" r="19" fill="#8a6fc9" opacity=".28" class="c-late"/>` + figura(NOCTURNIA(), tx, ty - th - 13, 30, 'c-flota');
      else s += letrasLibres(L, 'PALABRAS', tx, ty - th - 22, 26);
      s += P('M0 172 C80 160 160 168 300 158 V200 H0Z', '#1b363e', 3);
      s += pinos(F, 4, 194, 50, 74, '#2a5155', '#1f4246', 21, 196, 300) + pinos(F, 3, 194, 46, 64, '#2a5155', '#1f4246', 12, -10, 60);
      s += figura(SILABO(), 92, 196, 70, despues ? 'c-salta' : 'c-flota') + `<circle cx="121" cy="134" r="10" fill="#f2c66d" opacity=".3" class="c-late"/>`;
      return s;
    },
    // El Viento Ladrón se lleva las letras del cartel; Tomillo, con su mapa, no sabe para dónde ir
    pradera: (L, e, despues) => {
      let s = `<rect width="300" height="200" fill="${despues ? '#c6e2d0' : '#b3c9c0'}"/><circle cx="252" cy="40" r="17" fill="#f2d48a" stroke="${L}" stroke-width="2.5"/>${nubeCruza(44, 1.2, .8)}${nubeCruza(70, .9, .6, -12)}`;
      s += `<path d="M0 118 C70 96 150 110 300 92 V200 H0Z" fill="#9cbf86" stroke="${L}" stroke-width="3"/><path d="M0 150 C90 130 200 150 300 136 V200 H0Z" fill="#86ac72" stroke="${L}" stroke-width="3"/>`;
      s += `<rect x="198" y="98" width="6" height="56" fill="#8a6440" stroke="${L}" stroke-width="2.5"/><rect x="174" y="90" width="54" height="22" rx="3" fill="#e9dcbc" stroke="${L}" stroke-width="2.5"/>`;
      if (!despues) {
        // el viento: un remolino con ojitos que pasa y se lleva las letras
        s += `<g class="c-remolino"><path d="M0 0 c14 -12 34 -6 32 8 c-2 10 -16 12 -20 4 c-3 -6 4 -10 8 -6" fill="none" stroke="#f3f6ee" stroke-width="3.5" stroke-linecap="round"/><circle cx="12" cy="-2" r="2" fill="${L}"/><circle cx="20" cy="-3" r="2" fill="${L}"/></g>`;
        s += cartel(L, 'CAMINO', (i) => (i % 2 ? 'c-vuela' : ''));
        s += [0, 1, 2].map((i) => `<path d="M-20 ${52 + i * 24} h60 q12 0 12 -8" fill="none" stroke="#f3f6ee" stroke-width="3" stroke-linecap="round" class="c-viento" ${d(i)}/>`).join('');
      } else {
        s += cartel(L, 'CAMINO', () => '');
        s += [[40, 160], [130, 150], [260, 160]].map(([x, y], i) => `<g class="c-flota" ${d(i * .7)}><circle cx="${x}" cy="${y}" r="5" fill="#f2c66d" stroke="${L}" stroke-width="2"/><circle cx="${x}" cy="${y}" r="2" fill="#e8907a"/></g>`).join('');
      }
      s += Array.from({ length: 16 }, (_, i) => `<path d="M${10 + i * 19} 196 q-2 -14 4 -26" fill="none" stroke="#5f8458" stroke-width="3" stroke-linecap="round" class="c-pasto" ${d((i % 5) * .3)}/>`).join('');
      s += figura(e.tomillo({ pelo: '#b99a76', bufanda: e.CEIBO }), 96, 190, 92, despues ? 'c-salta' : 'c-duda');
      return s;
    },
    // La Niebla Muda tapó las flores del ceibo; Doña Lenta avanza despacito por la orilla
    laguna: (L, e, despues) => {
      let s = `<rect width="300" height="200" fill="${despues ? '#cfe3da' : '#b9c7c2'}"/>${nubeCruza(36, 1, .7, -6)}`;
      s += `<path d="M0 118 C90 104 220 108 300 120 V200 H0Z" fill="#98ad7e" stroke="${L}" stroke-width="3"/>`;
      s += `<path d="M110 160 C140 142 250 140 290 160 C254 178 140 180 110 160Z" fill="#7fa3a3" stroke="${L}" stroke-width="3"/><path d="M150 160 h34 M206 166 h40" stroke="#c6dcd9" stroke-width="3" stroke-linecap="round"/>`;
      s += [0, 1, 2].map((i) => `<ellipse cx="206" cy="160" rx="20" ry="5" fill="none" stroke="#e9f1ea" stroke-width="2" class="c-onda" ${d(i)}/>`).join('');
      // el ceibo torcido junto al agua (con flores rojas después; grises bajo la niebla antes)
      s += `<path d="M70 172 C64 146 80 124 68 100 C62 86 72 70 86 64" fill="none" stroke="${L}" stroke-width="16" stroke-linecap="round"/><path d="M70 172 C64 146 80 124 68 100 C62 86 72 70 86 64" fill="none" stroke="#7a5a3c" stroke-width="10" stroke-linecap="round"/>`;
      s += [[58, 64, 28], [92, 56, 30], [112, 78, 24], [76, 86, 22]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#6f9466" stroke="${L}" stroke-width="3"/>`).join('');
      if (despues) {
        s += [[50, 56, 160], [80, 46, 190], [104, 62, 140], [118, 82, 200], [68, 82, 170], [94, 74, 150]].map(([x, y, r]) => e.florCeibo(x, y, .42, r)).join('');
        s += [0, 1, 2].map((i) => `<g class="c-cae" ${d(i * 1.6)}>${e.florCeibo(84 + i * 14, 70, .32, 160)}</g>`).join('');
      } else {
        s += [[50, 56], [80, 46], [104, 62], [118, 82], [68, 82]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#a9aeb0" stroke="${L}" stroke-width="1.6"/>`).join('');
        // la niebla, con ojitos (es la jefa del capítulo)
        s += `<g class="c-niebla">${[[20, 108, 46, 16], [80, 100, 54, 18], [150, 106, 60, 17], [222, 100, 52, 18], [286, 108, 44, 15], [60, 124, 70, 12], [190, 124, 80, 12]].map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#eef4ef" opacity=".62"/>`).join('')}<circle cx="146" cy="104" r="2.4" fill="${L}" opacity=".6"/><circle cx="156" cy="103" r="2.4" fill="${L}" opacity=".6"/></g>`;
      }
      s += `<g class="c-repta">${figura(e.lenta(), 150, 192, 40)}</g>`;
      return s;
    },
    // Don Hornero no puede cantar: el cartel de la panadería perdió letras y no hay pan (ronda 2, opción B)
    pueblito: (L, e, despues) => {
      const P = (dd, fill, w) => `<path d="${dd}" fill="${fill}" stroke="${L}" stroke-width="${w || 2.5}" stroke-linejoin="round"/>`;
      let s = `<rect width="300" height="200" fill="${despues ? '#bcd7e6' : '#c3cbd0'}"/>${nubeCruza(46, 1, .8)}`;
      s += P('M0 150 H300 V200 H0Z', despues ? '#c9b48a' : '#b3aa99', 3) + `<path d="M0 166 H300 M0 182 H300" stroke="${L}" stroke-width="1" opacity=".25"/>`;
      s += P('M96 150 V90 H204 V150Z', '#efd9b6') + P('M88 92 L150 58 L212 92Z', '#c46a4a');
      s += P('M138 150 V116 H162 V150Z', '#7a5638', 2.2) + `<circle cx="158" cy="134" r="1.8" fill="${L}"/>`;
      s += [106, 172].map((x) => `<rect x="${x}" y="112" width="22" height="18" rx="3" stroke="${L}" stroke-width="2" fill="${despues ? '#f2c66d' : '#8b9590'}" class="${despues ? 'c-late' : ''}"/>`).join('');
      s += P('M110 96 h80 v14 h-80z', '#8a6440', 2);
      s += 'PANADERIA'.split('').map((c, i) => { const falta = !despues && [1, 3, 5, 7].includes(i); return `<text x="${n1(116 + i * 8.6)}" y="107" font-size="9" font-family="Fredoka, sans-serif" fill="#fff1c9" class="${falta ? 'c-tit' : ''}" opacity="${falta ? '.25' : '1'}">${falta ? '_' : c}</text>`; }).join('');
      s += P('M184 78 v-18 h10 v24', '#8a5a3c', 2.2);
      if (despues) s += [0, 1, 2].map((i) => `<circle cx="189" cy="56" r="6" fill="#e9e3d6" stroke="${L}" stroke-width="2" class="c-humo" ${d(i * 1.1)}/>`).join('');
      s += P('M40 160 C40 148 76 148 76 160 V172 C76 180 40 180 40 172Z', '#9aa7a4') + P('M36 128 h44 v6 h-44z', '#8a6440', 2) + `<path d="M40 134 v20 M76 134 v20" stroke="${L}" stroke-width="3"/>`;
      s += `<path d="M252 168 V112" stroke="${L}" stroke-width="7" stroke-linecap="round"/><path d="M252 168 V112" stroke="#8a6440" stroke-width="4" stroke-linecap="round"/>`;
      s += figura(e.hornero({}), 252, 116, 40, despues ? 'c-canta' : 'c-triste');
      s += (despues ? [0, 1, 2] : [0, 1]).map((i) => `<text x="262" y="88" font-size="13" fill="${despues ? '#7a3a44' : '#5f6a66'}" class="${despues ? 'c-nota-sube' : 'c-nota-cae'}" ${d(i * 1.1)}>♪</text>`).join('');
      s += figura(e.tomillo({ pelo: '#b99a76', bufanda: e.CEIBO }), 214, 184, 46, despues ? 'c-salta' : '');
      s += `<g transform="translate(232 172)">${P('M-8 0 h16 l-2 8 h-12z', '#c9a46a', 2)}${despues ? `<ellipse cx="0" cy="-1" rx="6" ry="3.5" fill="#d9a441" stroke="${L}" stroke-width="1.6"/>` : ''}</g>`;
      s += `<g class="c-hoja"><ellipse cx="0" cy="60" rx="5" ry="3" fill="#9cb37f" stroke="${L}" stroke-width="1.5"/></g>`;
      return s;
    },
    // Ulises se olvidó los acertijos: la biblioteca del roble a oscuras (antes) y con sus ventanitas encendidas (después)
    robledal: (L, e, despues) => {
      let s = `<rect width="300" height="200" fill="${despues ? '#2a4a3a' : '#1f3326'}"/>${estrellas(14, 70)}`;
      s += `<path d="M0 178 C100 168 200 170 300 180 V200 H0Z" fill="#2c4430" stroke="${L}" stroke-width="3"/>`;
      // el roble: tronco ancho con raíces y una copa de varias masas
      s += `<path d="M150 182 C152 168 146 150 152 132 C156 120 160 112 158 100 L188 100 C186 114 190 124 194 136 C200 154 194 170 198 182 C186 178 176 186 172 180 C166 186 158 178 150 182Z" fill="#6b4a2f" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>`;
      s += [[150, 70, 34], [196, 62, 36], [226, 86, 26], [124, 92, 24], [176, 40, 28]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#3f5f3a" stroke="${L}" stroke-width="3"/>`).join('');
      s += [[142, 62, 18], [190, 52, 18], [174, 34, 14]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#4d7046"/>`).join('');
      // la biblioteca adentro del tronco: una puerta redonda y dos ventanitas
      s += `<path d="M164 182 V160 a9 9 0 0 1 18 0 V182Z" fill="#3b2a1e" stroke="${L}" stroke-width="2.4"/>`;
      s += [[160, 132], [184, 126]].map(([x, y], i) => `<rect x="${x}" y="${y}" width="9" height="11" rx="4.5" stroke="${L}" stroke-width="2" fill="${despues ? '#f2c66d' : '#2b3a30'}" class="${despues ? 'c-late' : ''}" ${d(i * .7)}/>`).join('');
      s += Array.from({ length: 9 }, (_, i) => `<circle cx="${(30 + rnd() * 240).toFixed(0)}" cy="${(96 + rnd() * 70).toFixed(0)}" r="2.6" fill="#f2e98a" class="c-luciernaga" ${d(i * .7)}/>`).join('');
      s += [0, 1].map((i) => `<ellipse cx="${150 + i * 60}" cy="40" rx="5" ry="3" fill="#9cb37f" stroke="${L}" stroke-width="1.5" class="c-cae" ${d(i * 2.5)}/>`).join('');
      s += despues ? `<text x="232" y="128" font-size="20" font-family="Fredoka, sans-serif" fill="#f2c66d" stroke="${L}" stroke-width="3" paint-order="stroke" class="c-salta">!</text>`
        : `<text x="232" y="128" font-size="20" font-family="Fredoka, sans-serif" fill="#f2c66d" stroke="${L}" stroke-width="3" paint-order="stroke" class="c-flota">?</text><text x="250" y="110" font-size="14" font-family="Fredoka, sans-serif" fill="#f2c66d" stroke="${L}" stroke-width="3" paint-order="stroke" class="c-flota" ${d(1)}>?</text>`;
      const u = e.ulises({ farol: true }), [fx, fy] = punto(u, 84, 190, 86, 178, 182);
      s += `<circle cx="${fx}" cy="${fy}" r="15" fill="#ffe08a" opacity=".35" class="c-late"/>` + figura(u, 84, 190, 86, 'c-flota');
      return s;
    },
    // Chispa solo echa humo (le robaron la palabra "fuego"): nieve y hielo antes; su llamita y el deshielo después
    cumbres: (L, e, despues) => {
      let s = `<defs><linearGradient id="cgC${despues ? 'd' : ''}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${despues ? '#a9cbe0' : '#9fb8cc'}"/><stop offset="1" stop-color="${despues ? '#f0e2c4' : '#dfe9ef'}"/></linearGradient></defs><rect width="300" height="200" fill="url(#cgC${despues ? 'd' : ''})"/>`;
      if (despues) s += `<circle cx="60" cy="40" r="16" fill="#f2c66d" stroke="${L}" stroke-width="2.4" class="c-late"/>`;
      s += `<path d="M0 160 L66 64 L112 128 L168 40 L236 118 L300 76 V200 H0Z" fill="#8aa2b8" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>`;
      s += `<path d="M50 88 L66 64 L82 86 L72 82 L62 92Z M150 66 L168 40 L188 70 L176 64 L164 74Z M282 88 L300 76 V96 L290 92Z" fill="#f3f6ee" stroke="${L}" stroke-width="2.4" stroke-linejoin="round"/>`;
      s += `<path d="M0 172 C100 160 200 164 300 174 V200 H0Z" fill="#f3f6ee" stroke="${L}" stroke-width="3"/>`;
      // carámbanos que gotean (después) o quietos (antes)
      s += [[118, 132], [124, 134], [130, 133]].map(([x, y], i) => `<path d="M${x} ${y} l3 ${10 + i * 3} l3 ${-10 - i * 3}Z" fill="#dfe9ef" stroke="${L}" stroke-width="1.6"/>${despues ? `<circle cx="${x + 3}" cy="${y + 14 + i * 3}" r="1.6" fill="#9fc6e0" class="c-gota" ${d(i * .6)}/>` : ''}`).join('');
      if (!despues) s += Array.from({ length: 22 }, () => `<circle cx="${(rnd() * 320).toFixed(0)}" cy="0" r="${(1.5 + rnd() * 2).toFixed(1)}" fill="#fff" class="c-nieve" ${d((rnd() * 6).toFixed(2))}/>`).join('');
      const ch = e.chispa({ cuerpo: '#67948f', panza: '#dfebd6', cuerno: '#f2c66d', cresta: '#e8907a', ala: '#92afa1', humo: !despues });
      const [bx, by] = punto(ch, 200, 188, 90, 200, 96);
      s += figura(ch, 200, 188, 90, 'c-flota');
      s += despues ? `<g transform="translate(${bx + 10} ${by - 4})"><path d="M0 0 C10 -6 18 -2 24 -10 C22 0 28 4 20 10 C12 12 4 8 0 0Z" fill="#e8907a" stroke="${L}" stroke-width="2" class="c-fuego"/><path d="M4 2 C10 -2 14 0 18 -4 C16 2 18 6 12 7 C8 7 6 5 4 2Z" fill="#f2c66d" class="c-fuego" ${d(.3)}/></g>`
        : [0, 1].map((i) => `<circle cx="${bx + 14}" cy="${by - 14}" r="6" fill="#bfc6c9" stroke="${L}" stroke-width="2" class="c-humo" ${d(i * 1.6)}/>`).join('');
      return s;
    },
    // La torre del archimago: runas que giran y relámpagos (antes); Umbrío redimido y la torre iluminada (después)
    umbria: (L, e, despues) => {
      let s = `<defs><linearGradient id="cgU${despues ? 'd' : ''}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${despues ? '#2b4a7a' : '#140f24'}"/><stop offset="1" stop-color="${despues ? '#c493b0' : '#3a2b5c'}"/></linearGradient></defs><rect width="300" height="200" fill="url(#cgU${despues ? 'd' : ''})"/>${estrellas(16, 90)}`;
      if (!despues) s += `<rect width="300" height="200" fill="#c9b6ff" class="c-rayo"/>`;
      s += `<path d="M0 182 C100 170 200 172 300 184 V200 H0Z" fill="#241a3a" stroke="${L}" stroke-width="3"/>`;
      s += `<rect x="124" y="64" width="52" height="122" rx="4" fill="${despues ? '#6b5a9a' : '#4a3870'}" stroke="${L}" stroke-width="3"/><path d="M114 66 L150 18 L186 66Z" fill="${despues ? '#efe9dc' : '#1d1830'}" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>`;
      s += `<rect x="137" y="84" width="26" height="34" rx="13" fill="${despues ? '#f2c66d' : '#8a6fc9'}" stroke="${L}" stroke-width="2.5" class="c-late"/>`;
      if (!despues) s += `<g class="c-gira" style="transform-origin:150px 116px">${Array.from({ length: 6 }, (_, i) => { const a = i / 6 * Math.PI * 2; return `<text x="${(150 + Math.cos(a) * 74).toFixed(0)}" y="${(120 + Math.sin(a) * 34).toFixed(0)}" font-size="13" fill="#c9b6ff" text-anchor="middle">${'ᚱᚢᚾᛖᛋᚹ'[i]}</text>`; }).join('')}</g>`;
      else s += letrasLibres(L, 'VOZ', 150, 70, 40);
      s += figura(UMBRIO(despues), 150, 120, 34, 'c-flota');
      // Hilda tejiendo al pie de la torre: teje el mapa del camino de adentro
      s += figura(e.hilda(), 236, 190, 62, '');
      s += `<path d="M206 186 C190 186 176 180 168 186" fill="none" stroke="#c9485b" stroke-width="2" stroke-dasharray="3 4" class="c-hilo"/>`;
      return s;
    },
  };

  const CAPITULOS = [
    { id: 'torre', ante: 'Capítulo gratis', n: 'La Torre Arcana', sub: '20 pisos · las mismas palabras para todos', libre: true,
      p: 'Nocturnia encerró las palabras del bosque en lo alto de la torre. Silabo sube piso por piso para liberarlas.', ayuda: 'Cada 5 pisos te espera un jefe. Arriba, la cima.' },
    { id: 'pradera', ante: 'Capítulo 1', n: 'La Pradera', sub: 'Con Tomillo, la liebre',
      p: 'El viento borró los carteles del camino y Tomillo no puede leer su mapa.', ayuda: 'Atajo de Tomillo: una vez por piso, te muestra la primera letra de una palabra larga que te falta.' },
    { id: 'laguna', ante: 'Capítulo 2', n: 'La Laguna del Ceibo', sub: 'Con Doña Lenta',
      p: 'La niebla tapó las flores del ceibo y Doña Lenta perdió el hilo de sus definiciones.', ayuda: 'Paciencia de Doña Lenta: congela el reloj 10 segundos una vez por piso.' },
    { id: 'pueblito', ante: 'Capítulo 3', n: 'El Pueblito', sub: 'Con Don Hornero',
      p: 'Don Hornero no puede cantar y sin su canto el horno no calienta: el pueblito se quedó sin pan.', ayuda: 'Barro de Hornero: pega dos palabras cortas que encontraste y cuentan como una larga.' },
    { id: 'robledal', ante: 'Capítulo 4', n: 'El Robledal', sub: 'Con Ulises, el búho',
      p: 'Ulises se olvidó los acertijos y la biblioteca del roble quedó a oscuras.', ayuda: 'Memoria de Ulises: una vez por piso, te dice cuántas palabras faltan de cada largo.' },
    { id: 'cumbres', ante: 'Capítulo 5', n: 'Las Cumbres', sub: 'Con Chispa',
      p: 'Chispa solo echa humo: le robaron la palabra "fuego". Las cumbres se congelaron.', ayuda: 'Llamita de Chispa: derrite una letra repetida y te la cambia por otra.' },
    { id: 'umbria', ante: 'Capítulo 6', n: 'La Torre Umbría', sub: 'El duelo con Umbrío',
      p: 'La torre del archimago. Hilda, que tejió el mapa todo el viaje, conoce el camino de adentro.', ayuda: 'Todos juntos: en el duelo final se usan las ayudas de todos los aliados.' },
  ];

  const cache = {};
  /** La escena de un capítulo como SVG. despues: el lugar liberado (capítulo terminado). */
  function escena(id, despues) {
    const k = id + (despues ? ':d' : '');
    if (!cache[k]) {
      const e = E(), L = (e && e.L) || '#16262c';
      let cuerpo = '';
      try { cuerpo = e && ESCENAS[id] ? ESCENAS[id](L, e, !!despues) : ''; } catch (err) { cuerpo = ''; if (window.WWReportes && WWReportes.error) WWReportes.error('Escena ' + id + ': ' + err.message); }
      cache[k] = `<svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${cuerpo}</svg>`;
    }
    return cache[k];
  }

  /**
   * Las escenas animadas solo se mueven cuando se ven (en un celu modesto, siete escenas a la vez pesan).
   * Marca con .c-quieta las que están fuera de la pantalla; estilo.css les pausa las animaciones.
   */
  let obs = null;
  function vigilar(cont) {
    if (!('IntersectionObserver' in window) || !cont) return;
    if (!obs) obs = new IntersectionObserver((es) => { for (const x of es) x.target.classList.toggle('c-quieta', !x.isIntersecting); }, { rootMargin: '40px' });
    cont.querySelectorAll('.ilu, .escena, .novedad-ilu').forEach((el) => obs.observe(el));
  }

  window.WWCampanas = { CAPITULOS, escena, vigilar, ESCENAS };
})();
