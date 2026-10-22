/**
 * Word Wizard — el libro de Aventura (v2.44, 18/10/2026; lab/libro-capitulos.html, lab/escenas-ronda2.html y lab/aventura.html).
 * La Torre Arcana es el capítulo gratis; después vienen las regiones de la Campaña del Archimago (con el Pase).
 * Cada capítulo tiene su escena animada con un "antes" (por jugar) y un "después" (el lugar liberado cuando lo
 * terminaste). Las animaciones son clases c-* (estilo.css, sección "campañas"); nada de filter (iPhone).
 * Los personajes salen de game/js/elenco.js (WWElenco), Silabo de silabo.js y las formas del bosque de escena.js.
 *
 * Ronda 3 (18/10): las escenas se arman como el fondo del juego, por capas: cielo en bandas, lo lejano sin contorno
 * y teñido de bruma, lo del medio con contorno fino del mismo tono y lo de adelante con el contorno oscuro de los
 * personajes. Los personajes, grandes y apoyados en algo (nada flota sin motivo), y cada escena cuenta su problema
 * en el "antes" y lo resuelto en el "después". La versión anterior quedó en lab/campanas-v245.js para comparar.
 */
(function () {
  'use strict';
  const E = () => window.WWElenco;
  const sinSvg = (s) => s.replace(/^<svg[^>]*>|<\/svg>$/g, '');
  const vb = (s) => (s.match(/viewBox="([^"]+)"/) || [0, '0 0 100 100'])[1].split(' ').map(Number);
  const n1 = (v) => Math.round(v * 10) / 10;
  /** Un dibujo dentro de la escena: x, y = centro de los pies (el borde de abajo del dibujo), h = alto. */
  function figura(svg, x, y, h, clase, estilo) {
    const [vx, vy, vw, vh] = vb(svg), k = h / vh;
    return `<g class="${clase || ''}"${estilo ? ` style="${estilo}"` : ''}><g transform="translate(${n1(x - (vw / 2) * k)} ${n1(y - vh * k)}) scale(${n1(k * 1000) / 1000}) translate(${-vx} ${-vy})">${sinSvg(svg)}</g></g>`;
  }
  /** Dónde cae, en la escena, un punto (px, py) del dibujo puesto con figura(svg, x, y, h). */
  function punto(svg, x, y, h, px, py) { const [vx, vy, vw, vh] = vb(svg), k = h / vh; return [n1(x - (vw / 2) * k + (px - vx) * k), n1(y - vh * k + (py - vy) * k)]; }
  let semilla = 11;
  const rnd = () => (semilla = (semilla * 9301 + 49297) % 233280) / 233280;
  const d = (s) => `style="animation-delay:${s}s"`;

  // ---------------------------------------------------------------- el elenco con sus trajes de escena
  const SILABO = (o) => window.Silabo.mago(Object.assign({}, window.Silabo.OFICIAL, o || {}));
  const sombra = () => { const P = window.WWMago && window.WWMago.PALETAS && window.WWMago.PALETAS.sombra; return P ? { colores: P.c } : {}; };
  const NOCTURNIA = () => window.Silabo.mago(Object.assign({}, window.Silabo.OFICIAL, sombra(), { etapa: 3, varita: 1.6, anguloVarita: -78 }));
  const UMBRIO_C = { hat: '#2b2340', hatSh: '#1d1830', robe: '#3a2b5c', robeSh: '#2a1f45', band: '#8a6fc9', hem: '#8a6fc9', starRobe: '#c9b6ff', shoe: '#151225', star: '#c9b6ff', nose: '#b8a4c9', noseHi: '#d8cbe3', beard: '#cfd2e0', beardSh: '#a3a8bd' };
  const UMBRIO_E = { forma: 'dormilon', sombrero: 'runas', motivo: 'runas', capa: '#1d1830', punta: 'orbe', barbaFin: 214, barbaExtra: 'trenza', metal: '#8a6fc9', bigote: 'manubrio' };
  const UMBRIO = (redimido) => window.Silabo.mago(Object.assign({}, window.Silabo.OFICIAL, {
    colores: redimido ? Object.assign({}, UMBRIO_C, { hat: '#efe9dc', hatSh: '#d8cfba', robe: '#e9e1cf', robeSh: '#cfc4ad', band: '#f2c66d', hem: '#f2c66d', starRobe: '#f2c66d', star: '#fff1bf' }) : UMBRIO_C,
    estilo: redimido ? Object.assign({}, UMBRIO_E, { capa: '#d9a441' }) : UMBRIO_E, etapa: 3, varita: 1.75, anguloVarita: -84,
  }));
  const TOMILLO = (e) => e.tomillo({ pelo: '#b99a76', bufanda: e.CEIBO });
  const CHISPA = (e, humo) => e.chispa({ cuerpo: '#67948f', panza: '#dfebd6', cuerno: '#f2c66d', cresta: '#e8907a', ala: '#92afa1', humo });

  // ---------------------------------------------------------------- piezas del paisaje (300 × 200)
  const formas = () => { const F = window.WWEscena && window.WWEscena.formas; if (F && F.usarLugar) F.usarLugar('bosque'); return F; };
  /** El cielo en bandas planas, como el fondo del juego. */
  const bandas = (cols, h) => `<rect width="300" height="200" fill="${cols[cols.length - 1]}"/>` + cols.map((c, i) => `<rect y="${n1(i * h / cols.length - 1)}" width="300" height="${n1(h / cols.length + 2)}" fill="${c}"/>`).join('');
  const estrellas = (n, h, x0, x1) => Array.from({ length: n }, () => `<circle cx="${((x0 || 0) + rnd() * ((x1 || 300) - (x0 || 0))).toFixed(1)}" cy="${(rnd() * h).toFixed(1)}" r="${(0.5 + rnd() * 1.1).toFixed(1)}" fill="#fff1c9" class="c-tit" style="animation-delay:${(rnd() * 2.4).toFixed(2)}s"/>`).join('');
  const halo = (x, y, r, col) => `<circle cx="${x}" cy="${y}" r="${n1(r * 2.4)}" fill="${col}" opacity=".07"/><circle cx="${x}" cy="${y}" r="${n1(r * 1.6)}" fill="${col}" opacity=".12"/>`;
  const luna = (L, x, y, r) => halo(x, y, r, '#f3efd6') + `<circle cx="${x}" cy="${y}" r="${r}" fill="#f3efd6" stroke="${L}" stroke-width="2"/><circle cx="${n1(x + r * .3)}" cy="${n1(y - r * .2)}" r="${n1(r * .2)}" fill="#e0dabb"/><circle cx="${n1(x - r * .32)}" cy="${n1(y + r * .3)}" r="${n1(r * .14)}" fill="#e0dabb"/>`;
  const sol = (L, x, y, r, clase) => `<g class="${clase || ''}">${halo(x, y, r, '#fff1c9')}<circle cx="${x}" cy="${y}" r="${r}" fill="#ffe7a8" stroke="${L}" stroke-width="2"/></g>`;
  /** Una loma que cruza la escena por los puntos dados (curva suave) y baja hasta abajo. */
  function loma(pts, fill, stroke, sw, clase) {
    let dd = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length - 1; i++) { const [x, y] = pts[i], [x2, y2] = pts[i + 1]; dd += ` Q${x} ${y} ${n1((x + x2) / 2)} ${n1((y + y2) / 2)}`; }
    const u = pts[pts.length - 1]; dd += ` L${u[0]} ${u[1]} V212 H${pts[0][0]}Z`;
    return `<path d="${dd}" fill="${fill}"${sw ? ` stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"` : ''}${clase ? ` class="${clase}"` : ''}/>`;
  }
  /** Una fila de pinos (lejos: sin contorno; cerca: con contorno). */
  function fila(F, o) {
    if (!F) return '';
    const r = F.azarCon(o.sem || 7); let s = '';
    for (let i = 0; i < o.n; i++) {
      const x = o.x0 + (i + .15 + r() * .7) * (o.x1 - o.x0) / o.n, h = o.h[0] + r() * (o.h[1] - o.h[0]);
      s += F.pino(x, o.y + r() * (o.dy || 4), h, h * (o.w || .55), o.c, o.sh, o.sw || 0, !!o.nieve, r);
    }
    return s;
  }
  /** Los degradados van en <defs>; cada uno con un id propio de la escena (k.u) para que el antes y el después no se pisen. */
  function brillo(k, x, y, r, col, op, clase) {
    const id = `${k.u}b${k.n++}`;
    k.defs += `<radialGradient id="${id}"><stop offset="0" stop-color="${col}" stop-opacity="${op == null ? .6 : op}"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient>`;
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${id})"${clase ? ` class="${clase}"` : ''}/>`;
  }
  /** Una banda de bruma (se desvanece arriba y abajo) que se corre despacito. */
  function bruma(k, y, h, col, op, clase) {
    const id = `${k.u}n${k.n++}`;
    k.defs += `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity="0"/><stop offset=".5" stop-color="${col}" stop-opacity="${op}"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient>`;
    return `<rect x="-50" y="${y}" width="400" height="${h}" fill="url(#${id})" class="${clase == null ? 'c-niebla' : clase}"/>`;
  }
  /** Una mata de pasto de tres hojas, apoyada en (x, y). */
  const mata = (L, x, y, k, c, clase, dl) => `<path d="M${n1(x - 6 * k)} ${y} Q${n1(x - 7 * k)} ${n1(y - 8 * k)} ${n1(x - 11 * k)} ${n1(y - 13 * k)} Q${n1(x - 3 * k)} ${n1(y - 9 * k)} ${n1(x - 1 * k)} ${n1(y - 4 * k)} Q${n1(x)} ${n1(y - 12 * k)} ${n1(x + 2 * k)} ${n1(y - 18 * k)} Q${n1(x + 4.5 * k)} ${n1(y - 10 * k)} ${n1(x + 3 * k)} ${n1(y - 4 * k)} Q${n1(x + 7 * k)} ${n1(y - 10 * k)} ${n1(x + 12 * k)} ${n1(y - 12 * k)} Q${n1(x + 8 * k)} ${n1(y - 5 * k)} ${n1(x + 6 * k)} ${y}Z" fill="${c}" stroke="${L}" stroke-width="1.3" stroke-linejoin="round"${clase ? ` class="${clase}"` : ''}${dl != null ? ` ${d(dl)}` : ''}/>`;
  const matas = (L, n, y, k, c, x0, x1, clase) => Array.from({ length: n }, (_, i) => mata(L, n1(x0 + (i + .2 + rnd() * .6) * (x1 - x0) / n), n1(y + rnd() * 3), k * (.8 + rnd() * .4), c, clase, n1((i % 5) * .35))).join('');
  /** Una piedra apoyada en el piso (y), con su brillo arriba. */
  const piedra = (L, x, y, w, h, c, cl) => `<path d="M${n1(x - w / 2)} ${y} C${n1(x - w / 2)} ${n1(y - h * .9)} ${n1(x - w * .2)} ${n1(y - h)} ${x} ${n1(y - h)} C${n1(x + w * .35)} ${n1(y - h)} ${n1(x + w / 2)} ${n1(y - h * .6)} ${n1(x + w / 2)} ${y}Z" fill="${c}" stroke="${L}" stroke-width="1.6" stroke-linejoin="round"/><path d="M${n1(x - w * .28)} ${n1(y - h * .62)} Q${n1(x - w * .1)} ${n1(y - h * .88)} ${n1(x + w * .14)} ${n1(y - h * .84)}" fill="none" stroke="${cl}" stroke-width="1.6" stroke-linecap="round"/>`;
  /** Una florcita de cinco pétalos. */
  const flor = (L, x, y, r, col, clase, dl) => `<g${clase ? ` class="${clase}"` : ''}${dl != null ? ` ${d(dl)}` : ''}><path d="M${x} ${n1(y + r)} V${n1(y + r * 3.2)}" stroke="#5f8458" stroke-width="1.4"/>${[0, 72, 144, 216, 288].map((a) => `<circle cx="${n1(x + Math.cos(a * Math.PI / 180) * r * .8)}" cy="${n1(y + Math.sin(a * Math.PI / 180) * r * .8)}" r="${n1(r * .62)}" fill="${col}" stroke="${L}" stroke-width=".9"/>`).join('')}<circle cx="${x}" cy="${y}" r="${n1(r * .45)}" fill="#f2c66d"/></g>`;
  /** Una mariposa que aletea y revolotea. */
  const mariposa = (L, x, y, col, dl) => `<g class="c-revolotea" ${d(dl || 0)}><g transform="translate(${x} ${y})"><g class="c-aleteo" ${d((dl || 0) * .3)}><path d="M0 0 C-7 -9 -12 -3 -8 2 C-11 6 -5 9 0 2Z M0 0 C7 -9 12 -3 8 2 C11 6 5 9 0 2Z" fill="${col}" stroke="${L}" stroke-width="1"/></g><path d="M0 -3 V4" stroke="${L}" stroke-width="1.6" stroke-linecap="round"/></g></g>`;
  /** Una luciérnaga con su luz. */
  const luciernaga = (k, x, y, dl, fuerte) => `<g class="c-luciernaga" ${d(dl)}>${brillo(k, x, y, fuerte ? 9 : 6, '#f6ee9a', fuerte ? .8 : .55)}<circle cx="${x}" cy="${y}" r="1.6" fill="#fbf6c4"/></g>`;
  /** Letras que salen volando en bandada (el "después"): de (x, y) hacia donde dice cada una (--dx, --dy). */
  const bandada = (L, txt, x, y, dirs) => txt.split('').map((c, i) => { const [dx, dy] = dirs(i, txt.length); return `<text x="${x}" y="${y}" font-size="12" font-family="Fredoka, sans-serif" font-weight="600" text-anchor="middle" fill="#fff1c9" stroke="${L}" stroke-width="2.6" paint-order="stroke" class="c-bandada" style="--dx:${n1(dx)}px;--dy:${n1(dy)}px;animation-delay:${(i * .45).toFixed(2)}s">${c}</text>`; }).join('');
  const letra = (L, c, x, y, t, fill, clase, dl, rot) => `<g class="${clase || ''}" ${dl != null ? d(dl) : ''}><text x="${x}" y="${y}" font-size="${t}" font-family="Fredoka, sans-serif" font-weight="600" text-anchor="middle" fill="${fill}" stroke="${L}" stroke-width="2.2" paint-order="stroke"${rot ? ` transform="rotate(${rot} ${x} ${y})"` : ''}>${c}</text></g>`;

  /** Las palabras dibujadas en las escenas, en el idioma del jugador (v2.45.1). */
  const PALABRAS = {
    es: { camino: 'CAMINO', panaderia: 'PANADERIA', voz: 'VOZ', palabras: 'PALABRAS' },
    en: { camino: 'PATH', panaderia: 'BAKERY', voz: 'VOICE', palabras: 'WORDS' },
    pt: { camino: 'CAMINHO', panaderia: 'PADARIA', voz: 'VOZ', palabras: 'PALAVRAS' },
  };
  const idioma = () => (window.WWI18n && PALABRAS[window.WWI18n.idioma] ? window.WWI18n.idioma : 'es');
  const W = (k) => PALABRAS[idioma()][k];
  const ANCHO = { C: 7.2, A: 7.4, M: 9.4, I: 3.6, N: 7.8, O: 7.8, H: 7.8, P: 7, T: 6.6, W: 10, R: 7.2, S: 6.6, E: 6.6, D: 7.6, V: 7.2, B: 7.2, K: 7.2, Y: 7, Z: 6.6, L: 6, G: 7.6 };
  /** Una palabra centrada en (cx, y) que entra en el ancho dado; clase(i) le da una animación a cada letra. */
  function rotulo(txt, cx, y, ancho, t, fill, clase, ocultar) {
    const bruto = txt.split('').reduce((s, c) => s + (ANCHO[c] || 7) + .6, 0) - .6, k = Math.min(1, ancho / bruto) * t / 11, total = bruto * k;
    let x = cx - total / 2;
    return txt.split('').map((c, i) => { const w = (ANCHO[c] || 7) * k, falta = ocultar && ocultar(i); const out = `<text x="${n1(x + w / 2)}" y="${y}" font-size="${n1(11 * k)}" font-weight="600" text-anchor="middle" font-family="Fredoka, sans-serif" fill="${fill}" class="${clase ? clase(i) : ''}" ${d(n1(i * .6))}${falta ? ' opacity=".3"' : ''}>${falta ? '_' : c}</text>`; x += w + .6 * k; return out; }).join('');
  }

  // ---------------------------------------------------------------- las escenas. k = { L, e, despues, u, defs, n }
  const ESCENAS = {
    // La Torre Arcana: el camino de piedra sube desde Silabo hasta la puerta; arriba, Nocturnia y las palabras presas
    torre: (k) => {
      const { L, e } = k, D = k.despues, F = formas();
      let s = D ? bandas(['#5f5e98', '#80699f', '#a77aa6', '#d08f9e', '#ecae98', '#f5c79a'], 150)
        : bandas(['#172e38', '#1c3540', '#203b45', '#26444e', '#2d4e57', '#355a61'], 150) + estrellas(40, 96);
      s += D ? sol(L, 98, 112, 19, 'c-asoma') : luna(L, 58, 38, 14);
      if (D) s += estrellas(8, 40, 180, 300);
      s += loma([[-10, 126], [40, 102], [86, 118], [130, 96], [176, 112], [236, 90], [276, 106], [310, 98]], D ? '#b986a4' : '#355a5c');
      s += bruma(k, 96, 46, D ? '#ffe2cf' : '#a7c2b4', D ? .5 : .42);
      s += fila(F, { n: 7, x0: -10, x1: 132, y: 150, h: [26, 44], c: D ? '#8b6f98' : '#2f5458', sh: D ? '#7b6189' : '#284a4e', sem: 5 });
      s += fila(F, { n: 5, x0: 232, x1: 312, y: 150, h: [28, 46], c: D ? '#8b6f98' : '#2f5458', sh: D ? '#7b6189' : '#284a4e', sem: 9 });
      // el cerro de la torre
      s += `<path d="M104 164 C132 132 170 120 200 120 C232 120 266 134 296 164Z" fill="${D ? '#6c5a80' : '#22414a'}" stroke="${L}" stroke-width="1.8"/>`;
      s += `<path d="M150 134 C168 126 186 122 200 122" fill="none" stroke="${D ? '#8a76a0' : '#2e535a'}" stroke-width="2" stroke-linecap="round"/>`;
      // la torre: piedra con su lado en sombra, almenas, techo cónico y la estrella (achicada desde la puerta, para que entre)
      const s0 = s.length;
      const piedraT = D ? '#8d86a6' : '#4c7170', piedraS = D ? '#736c8e' : '#3d5e5e', piedraL = D ? '#a7a0bd' : '#5d8381';
      s += `<path d="M184 124 L188 46 H212 L216 124Z" fill="${piedraT}" stroke="${L}" stroke-width="2" stroke-linejoin="round"/><path d="M204 124 L205 46 H212 L216 124Z" fill="${piedraS}"/>`;
      s += `<path d="M190 60 h7 M199 72 h8 M189 84 h7 M198 98 h9 M188 112 h8 M193 66 v6 M202 90 v8" stroke="${piedraS}" stroke-width="1.4" stroke-linecap="round"/><path d="M189 52 V118" stroke="${piedraL}" stroke-width="1.6" stroke-linecap="round"/>`;
      s += `<path d="M181 48 V38 h6 v4 h6 v-4 h6 v4 h6 v-4 h6 v4 h6 v-4 h2 V48Z" fill="${piedraT}" stroke="${L}" stroke-width="1.8" stroke-linejoin="round"/>`;
      s += `<path d="M182 39 L200 6 L218 39Z" fill="#2f7f7a" stroke="${L}" stroke-width="2" stroke-linejoin="round"/><path d="M200 6 L218 39 H204Z" fill="#256a66"/><path d="M193 26 L200 12" stroke="#4fa39b" stroke-width="1.6" stroke-linecap="round"/>`;
      if (F) s += `<path d="${F.estrella(200, 4, 5)}" fill="#fff1bf" stroke="${L}" stroke-width="1.2" class="c-late"/>`;
      if (D) s += `<g class="c-bandera" style="transform-origin:200px 8px"><path d="M200 8 V-6" stroke="${L}" stroke-width="1.4"/><path d="M200 -6 C206 -8 210 -3 216 -5 L216 2 C210 4 206 -1 200 1Z" fill="#e8907a" stroke="${L}" stroke-width="1.2"/></g>`;
      // ventanas en arco (apagadas y con una luz violeta antes; todas encendidas después) y la puerta
      for (const [i, y] of [[0, 104], [1, 82], [2, 60]].map((v) => v)) {
        if (D) s += brillo(k, 200, y, 11, '#ffd98a', .55, 'c-late');
        s += `<path d="M195.5 ${y + 6} V${y - 1} a4.5 4.5 0 0 1 9 0 V${y + 6}Z" fill="${D ? '#f6d27a' : i === 1 ? '#6b5a9e' : '#24353b'}" stroke="${L}" stroke-width="1.5" class="${!D && i === 1 ? 'c-late' : ''}"/>`;
      }
      s += brillo(k, 200, 118, D ? 16 : 10, '#ffd98a', D ? .6 : .35) + `<path d="M194 124 V116 a6 6 0 0 1 12 0 V124Z" fill="${D ? '#f2c66d' : '#c99a4e'}" stroke="${L}" stroke-width="1.5"/>`;
      if (!D) {
        // las palabras presas: un anillo de magia violeta que gira alrededor del techo, con Nocturnia en el balcón
        s += brillo(k, 200, 30, 40, '#9d7fe0', .4, 'c-late');
        s += `<ellipse cx="200" cy="30" rx="38" ry="9" fill="none" stroke="#b9a2f0" stroke-width="1.6" stroke-dasharray="8 6" class="c-hilo" opacity=".85"/>`;
        s += [['P', 164, 30, 9], ['A', 176, 38, 10], ['L', 224, 38, 10], ['B', 236, 30, 9], ['R', 222, 22, 7], ['S', 178, 22, 7]].map(([c, x, y, t], i) => letra(L, c, x, y + 3, t, '#e6dcff', 'c-flota', i * .5)).join('');
        // Nocturnia flota al lado de la cima y sostiene el hechizo con la varita
        s += brillo(k, 248, 46, 32, '#8a6fc9', .45, 'c-late') + figura(NOCTURNIA(), 250, 76, 58, 'c-flota');
      } else {
        // liberadas: las palabras salen volando en bandada hacia el valle
        s += bandada(L, W('palabras'), 200, 28, (i, n) => [-150 + i * (110 / n) - rnd() * 20, -30 + i * 6 - rnd() * 14]);
        s += [0, 1, 2].map((i) => `<g class="c-revolotea" ${d(i * 1.4)}><path d="M${60 + i * 34} ${54 + i * 10} q4 -4 8 0 q4 -4 8 0" fill="none" stroke="${L}" stroke-width="1.6" stroke-linecap="round"/></g>`).join('');
      }
      s = s.slice(0, s0) + `<g transform="translate(200 124) scale(.84) translate(-200 -124)">${s.slice(s0)}</g>`;
      // el suelo de adelante y el camino de piedras que sube a la torre
      s += loma([[-10, 168], [60, 160], [140, 166], [230, 158], [310, 162]], D ? '#4b5a5c' : '#1b363e', L, 2);
      s += `<path d="M40 212 C82 186 138 176 160 156 C176 142 188 132 195 124 L205 124 C200 134 194 146 184 160 C164 186 140 200 130 212Z" fill="${D ? '#d9bfa6' : '#5f7d78'}" stroke="${L}" stroke-width="1.6" stroke-linejoin="round"/>`;
      s += [[104, 192, 14], [140, 176, 10], [166, 156, 7], [184, 140, 5]].map(([x, y, w]) => `<path d="M${x - w} ${y} h${w * 2}" stroke="${D ? '#b89c84' : '#4b6662'}" stroke-width="1.6" stroke-linecap="round"/>`).join('');
      // pinos grandes en los bordes (enmarcan) y matas de pasto
      s += fila(F, { n: 1, x0: -40, x1: 10, y: 206, h: [118, 126], c: D ? '#3d4a55' : '#19343c', sh: D ? '#323e48' : '#142c33', sw: 2, sem: 3 });
      s += fila(F, { n: 1, x0: 280, x1: 320, y: 206, h: [100, 110], c: D ? '#3d4a55' : '#19343c', sh: D ? '#323e48' : '#142c33', sw: 2, sem: 4 });
      if (!D) s += [[40, 150, 0], [120, 140, 1.4], [250, 152, 2.6], [270, 128, .8]].map(([x, y, dl]) => luciernaga(k, x, y, dl)).join('');
      // Silabo al pie del camino: con el farol, mirando para arriba (antes); con la varita en alto (después)
      const sil = D ? SILABO({ etapa: 2, varita: 1.9, anguloVarita: -96 }) : SILABO({ estilo: { mano: 'farol' } });
      if (!D) { const [fx, fy] = punto(sil, 74, 204, 104, 56, 194); s += brillo(k, fx, fy, 24, '#ffe08a', .55, 'c-late'); }
      s += figura(sil, 74, 204, 104, D ? 'c-salta' : 'c-respira');
      s += matas(L, 7, 200, 1, D ? '#5e7a5c' : '#2c5049', 100, 300, 'c-pasto');
      return s;
    },

    // La Pradera: el Viento Ladrón sopla y se lleva las letras del cartel; el camino se pierde en el pasto
    pradera: (k) => {
      const { L, e } = k, D = k.despues, F = formas();
      let s = D ? bandas(['#9cc4c6', '#aed0cc', '#c0dbd1', '#d3e5d6'], 120) : bandas(['#8ea7a9', '#9cb3b2', '#aabebb', '#b8c9c3'], 120);
      s += D ? sol(L, 250, 34, 13) : `<circle cx="250" cy="34" r="13" fill="#f2e7c4" opacity=".6"/>`;
      s += [[40, 30, 1.1, 0], [170, 46, .8, -14]].map(([x, y, kk, dl]) => `<g class="c-nube" ${d(dl)}><path transform="translate(${x - 120} ${y}) scale(${kk})" d="M0 0 a10 10 0 0 1 14 -10 a14 14 0 0 1 26 2 a10 10 0 0 1 8 14 Z" fill="#fff" opacity=".85"/></g>`).join('');
      // lejos: lomas teñidas, una hilera de pinos y la Torre chiquita en su cerro (el camino lleva ahí)
      s += loma([[-10, 106], [60, 96], [120, 104], [200, 90], [260, 98], [310, 92]], D ? '#9cbca8' : '#97ada4');
      s += fila(F, { n: 9, x0: 0, x1: 170, y: 104, h: [12, 20], c: D ? '#7fa592' : '#88a097', sh: D ? '#729886' : '#7d948b', sem: 21 });
      s += `<path d="M254 98 L256 70 H262 L264 98Z" fill="${D ? '#86a99b' : '#8ea49c'}"/><path d="M253 71 L259 58 L265 71Z" fill="${D ? '#6f978a' : '#82988f'}"/>`;
      s += bruma(k, 84, 34, '#eef4ef', D ? .35 : .6);
      s += loma([[-10, 128], [50, 120], [130, 128], [210, 116], [310, 124]], D ? '#86b285' : '#8aa68a', D ? '#6f9a70' : '#76927a', 1.4);
      // el camino: completo hasta la torre (después); se corta y lo tapa el pasto (antes)
      s += D ? `<path d="M60 212 C96 186 150 170 182 152 C206 138 236 126 256 112 L262 112 C246 128 222 144 202 158 C174 178 140 198 130 212Z" fill="#e3cfa2" stroke="#b49a6c" stroke-width="1.4"/>`
        : `<path d="M60 212 C96 186 150 170 182 152 L200 150 C176 172 146 196 130 212Z" fill="#cdbb92" stroke="#a89470" stroke-width="1.4"/>`;
      s += loma([[-10, 150], [70, 142], [160, 152], [240, 140], [310, 146]], D ? '#78a66f' : '#7c9a72', L, 1.8);
      s += D ? `<path d="M110 212 C140 192 170 172 196 156 L206 156 C186 174 164 194 150 212Z" fill="#e3cfa2" stroke="#b49a6c" stroke-width="1.4"/>`
        : `<path d="M110 212 C136 194 160 178 178 166 L188 166 C172 182 156 198 150 212Z" fill="#cdbb92" stroke="#a89470" stroke-width="1.4"/>` + matas(L, 4, 168, 1.15, '#6e8f64', 168, 214, 'c-pasto');
      // el cartel de dos flechas: "CAMINO" para un lado y la casita del pueblito para el otro
      s += `<path d="M197 176 V82" stroke="${L}" stroke-width="7" stroke-linecap="round"/><path d="M197 176 V82" stroke="#8a6440" stroke-width="4" stroke-linecap="round"/>`;
      s += `<path d="M172 86 H226 L234 95 L226 104 H172Z" fill="#e9dcbc" stroke="${L}" stroke-width="1.8" stroke-linejoin="round"/><path d="M174 102 H225" stroke="#cdbb92" stroke-width="1.6"/>`;
      s += rotulo(W('camino'), 200, 99, 46, 11, '#5a4a36', D ? null : (i) => (i % 2 ? 'c-vuela' : ''));
      const fl2 = `<path d="M222 112 H174 L166 121 L174 130 H222Z" fill="#e3d4b1" stroke="${L}" stroke-width="1.8" stroke-linejoin="round"/><path d="M188 125 V118 L194 113 L200 118 V125Z" fill="#c46a4a" stroke="#5a4a36" stroke-width="1.2" stroke-linejoin="round"/><path d="M204 121 h12" stroke="#8a6440" stroke-width="2" stroke-linecap="round"/>`;
      s += D ? fl2 : `<g transform="rotate(14 222 114)">${fl2}</g>`;
      s += `<circle cx="197" cy="95" r="1.6" fill="${L}"/><circle cx="${D ? 197 : 220}" cy="${D ? 121 : 115}" r="1.6" fill="${L}"/>`;
      if (!D) {
        // el Viento Ladrón: una nube con cachetes inflados que sopla una corriente; las letras viajan en ella
        s += `<g class="c-sopla" style="transform-origin:40px 58px"><path d="M14 64 C6 64 4 52 14 50 C14 40 28 38 32 46 C38 38 54 42 52 52 C62 54 60 66 50 66Z" fill="#f5f8f4" stroke="${L}" stroke-width="1.6" stroke-linejoin="round"/><circle cx="28" cy="54" r="1.8" fill="${L}"/><circle cx="38" cy="54" r="1.8" fill="${L}"/><ellipse cx="46" cy="58" rx="4" ry="3" fill="#e8a99a" opacity=".6"/><circle cx="54" cy="58" r="2.6" fill="none" stroke="${L}" stroke-width="1.4"/></g>`;
        s += [0, 1, 2].map((i) => `<path d="M60 ${58 + i * 6} C110 ${44 + i * 8} 150 ${84 + i * 6} 200 ${78 + i * 4} S280 ${56 + i * 10} 320 ${60 + i * 8}" fill="none" stroke="#f3f6ee" stroke-width="${2.4 - i * .5}" stroke-linecap="round" stroke-dasharray="14 10" class="c-flujo" opacity="${.9 - i * .2}" ${d(i * .3)}/>`).join('');
        s += [['C', 236, 72, 0], ['M', 262, 60, 1.2], ['O', 286, 70, 2.4]].map(([c, x, y, dl]) => letra(L, c, x, y, 10, '#5a4a36', 'c-tumba', dl)).join('');
      } else {
        s += mariposa(L, 120, 70, '#f2c66d', 0) + mariposa(L, 236, 60, '#e8a99a', 2);
      }
      // adelante: pasto alto, flores y Tomillo, apoyado contra el poste con su mapa
      s += loma([[-10, 182], [80, 176], [170, 186], [310, 178]], D ? '#679a5e' : '#6c8b62', L, 1.8);
      if (D) s += [[30, 176, '#f2c66d'], [64, 184, '#e8907a'], [238, 180, '#f2c66d'], [270, 186, '#c9485b'], [292, 176, '#f6efe2']].map(([x, y, c], i) => flor(L, x, y - 8, 3.2, c, 'c-pasto', i * .4)).join('');
      s += figura(TOMILLO(e), 150, 196, 112, D ? 'c-salta' : 'c-duda');
      s += matas(L, 10, 200, 1.2, D ? '#4f7f4a' : '#58764f', -10, 310, 'c-pasto');
      return s;
    },

    // La Laguna del Ceibo: la Niebla Muda, dormida sobre el agua, tapó las flores; Doña Lenta perdió el hilo
    laguna: (k) => {
      const { L, e } = k, D = k.despues, F = formas();
      let s = D ? bandas(['#97c1c4', '#aacfcc', '#c1ddd2', '#dbe6cf', '#ece6c8'], 110) : bandas(['#a3b4b1', '#adbdba', '#b8c5c1', '#c3cdc9'], 110);
      if (D) s += sol(L, 236, 40, 14);
      s += loma([[-10, 98], [70, 88], [150, 96], [230, 84], [310, 92]], D ? '#9cbcac' : '#a2b3ad');
      s += fila(F, { n: 12, x0: 90, x1: 310, y: 104, h: [16, 28], c: D ? '#6f978b' : '#94a8a2', sh: D ? '#638a7f' : '#8a9e98', sem: 33 });
      // el agua, con el reflejo de la orilla de enfrente
      s += `<path d="M-10 104 H310 V212 H-10Z" fill="${D ? '#78aab0' : '#93a9a8'}"/>`;
      if (D) s += `<g opacity=".28" transform="translate(0 208) scale(1 -1)">${fila(F, { n: 12, x0: 90, x1: 310, y: 104, h: [16, 28], c: '#456f6a', sh: '#456f6a', sem: 33 })}</g>`;
      s += [[150, 118, 30], [230, 126, 22], [120, 140, 18], [250, 150, 34]].map(([x, y, w], i) => `<path d="M${x - w} ${y} h${w * 2}" stroke="${D ? '#c9e2e0' : '#b4c4c2'}" stroke-width="1.6" stroke-linecap="round" class="c-brilla" ${d(i * .8)}/>`).join('');
      // camalotes con su flor
      s += [[96, 158, 12], [270, 136, 9]].map(([x, y, r], i) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${n1(r * .38)}" fill="#6f9a66" stroke="${L}" stroke-width="1.3"/>${D ? `<circle cx="${x + 2}" cy="${y - 3}" r="3" fill="#e8a6c0" stroke="${L}" stroke-width="1"/>` : ''}${D ? `<ellipse cx="${x}" cy="${y}" rx="${r + 2}" ry="${n1(r * .5)}" fill="none" stroke="#e9f1ea" stroke-width="1.2" class="c-onda" ${d(i * 1.3)}/>` : ''}`).join('');
      if (!D) {
        // la Niebla Muda: una nube larga y baja que duerme sobre el agua (ojos cerrados, boca cosida)
        s += bruma(k, 76, 70, '#eef3ef', .75);
        s += `<g class="c-niebla"><path d="M70 138 C54 138 50 120 66 116 C64 100 86 94 98 104 C108 88 136 88 146 102 C160 92 186 96 188 110 C204 106 222 116 214 132 C226 136 222 148 208 148 L84 148 C74 148 66 144 70 138Z" fill="#f2f5f1" opacity=".9" stroke="#c9d3cf" stroke-width="1.4"/>`;
        s += `<path d="M118 120 q5 4 10 0 M150 118 q5 4 10 0" fill="none" stroke="#7d8e8a" stroke-width="1.8" stroke-linecap="round"/><path d="M132 132 h12 M135 129 v6 M141 129 v6" stroke="#7d8e8a" stroke-width="1.4" stroke-linecap="round"/>`;
        s += `<text x="196" y="96" font-size="9" font-family="Fredoka, sans-serif" fill="#7d8e8a" class="c-sube">z</text><text x="204" y="88" font-size="7" font-family="Fredoka, sans-serif" fill="#7d8e8a" class="c-sube" ${d(1.2)}>z</text></g>`;
      }
      // la orilla de adelante, con juncos y totoras
      s += loma([[-10, 168], [90, 164], [180, 172], [310, 166]], D ? '#7fa66e' : '#8a9d80', L, 1.8);
      s += [[262, 176, 54], [276, 178, 44], [288, 174, 60], [298, 178, 40]].map(([x, y, h], i) => `<path d="M${x} ${y} Q${x - 3} ${y - h * .6} ${x + 2} ${y - h}" fill="none" stroke="${L}" stroke-width="4" stroke-linecap="round"/><path d="M${x} ${y} Q${x - 3} ${y - h * .6} ${x + 2} ${y - h}" fill="none" stroke="${D ? '#6f9a58' : '#7f9070'}" stroke-width="2.2" stroke-linecap="round" class="c-pasto" ${d(i * .4)}/>${i % 2 ? '' : `<rect x="${x - 2.2}" y="${y - h * .78}" width="5" height="12" rx="2.5" fill="#8a5a3c" stroke="${L}" stroke-width="1.2"/>`}`).join('');
      // el ceibo: tronco torcido desde la izquierda y ramas por arriba de toda la escena (enmarca)
      s += `<path d="M-6 212 C10 170 4 140 22 112 C34 92 30 70 44 52 C60 32 100 20 150 18" fill="none" stroke="${L}" stroke-width="15" stroke-linecap="round"/><path d="M-6 212 C10 170 4 140 22 112 C34 92 30 70 44 52 C60 32 100 20 150 18" fill="none" stroke="#7a5a3c" stroke-width="10" stroke-linecap="round"/><path d="M2 196 C14 166 10 140 26 116" fill="none" stroke="#94714f" stroke-width="3" stroke-linecap="round"/>`;
      s += `<path d="M40 60 C30 46 20 40 6 40 M96 22 C110 8 130 4 150 6 M120 19 C146 26 170 40 186 36" fill="none" stroke="${L}" stroke-width="7" stroke-linecap="round"/><path d="M40 60 C30 46 20 40 6 40 M96 22 C110 8 130 4 150 6 M120 19 C146 26 170 40 186 36" fill="none" stroke="#7a5a3c" stroke-width="3.6" stroke-linecap="round"/>`;
      const hojas = [[10, 36], [30, 30], [56, 26], [70, 40], [92, 14], [114, 26], [134, 8], [152, 22], [170, 32], [186, 32], [38, 74], [16, 96]];
      s += hojas.map(([x, y], i) => `<g transform="translate(${x} ${y}) rotate(${(i * 47) % 360})">${[[-5, -2, -30], [0, -6, 0], [5, -2, 30]].map(([a, b, r]) => `<ellipse cx="${a}" cy="${b}" rx="3" ry="6" transform="rotate(${r} ${a} ${b})" fill="${D ? '#7fa36a' : '#8f9e86'}" stroke="${L}" stroke-width="1.1"/>`).join('')}</g>`).join('');
      if (D) {
        s += [[22, 40, 160], [62, 30, 190], [104, 18, 140], [142, 14, 200], [178, 38, 170], [48, 58, 150], [124, 30, 180], [28, 86, 200]].map(([x, y, r]) => e.florCeibo(x, y, .3, r)).join('');
        s += [0, 1, 2, 3].map((i) => `<g class="c-cae" ${d(i * 1.3)}>${e.florCeibo(70 + i * 30, 30, .22, 160 + i * 20)}</g>`).join('');
        s += [0, 1].map((i) => `<g class="c-revolotea" ${d(i * 2)}><g transform="translate(${180 + i * 50} ${100 + i * 12})"><path d="M-8 0 H8" stroke="${L}" stroke-width="2" stroke-linecap="round"/><g class="c-aleteo"><ellipse cx="-2" cy="-4" rx="6" ry="2.4" fill="#cfe8ee" stroke="${L}" stroke-width=".9" opacity=".9"/><ellipse cx="2" cy="-4" rx="6" ry="2.4" fill="#cfe8ee" stroke="${L}" stroke-width=".9" opacity=".9"/></g></g></g>`).join('');
      } else {
        s += [[22, 40], [62, 30], [104, 18], [142, 14], [178, 38], [48, 58]].map(([x, y]) => `<path d="M${x} ${y} c-3 4 -2 9 1 10 c3 -1 4 -6 -1 -10Z" fill="#a9aeab" stroke="${L}" stroke-width="1.1"/>`).join('');
      }
      // Doña Lenta en su piedra de la orilla; antes, con el hilo enredado arriba de la cabeza
      s += piedra(L, 186, 178, 70, 18, D ? '#a6a294' : '#9a9a90', D ? '#c7c2b2' : '#b4b3a8');
      s += figura(e.lenta(), 186, 166, 66, D ? 'c-respira' : '');
      s += D ? `<g class="c-flota"><path d="M214 108 c6 -8 16 -4 12 4 c-3 6 -10 4 -8 -1" fill="none" stroke="#9a7fd0" stroke-width="2" stroke-linecap="round"/><circle cx="226" cy="104" r="1.6" fill="#f2c66d"/></g>`
        : `<g class="c-duda" style="transform-origin:214px 118px"><path d="M206 118 c-6 -10 12 -14 10 -4 c-2 8 -14 2 -6 -6 c6 -6 14 2 6 6 c-8 4 -12 -8 -2 -10 c8 -1 10 8 2 10" fill="none" stroke="#9a7fd0" stroke-width="1.6" stroke-linecap="round"/><path d="M212 120 Q206 132 200 138" fill="none" stroke="#9a7fd0" stroke-width="1.2" stroke-dasharray="2 2"/></g>`;
      s += matas(L, 6, 204, 1.1, D ? '#5e8a52' : '#6a7d62', 60, 250, 'c-pasto');
      return s;
    },

    // El Pueblito: la panadería de cerca. Antes, cartel sin letras, vidriera vacía y Don Hornero sin canto en su nido
    pueblito: (k) => {
      const { L, e } = k, D = k.despues, F = formas();
      const P = (dd, fill, w) => `<path d="${dd}" fill="${fill}" stroke="${L}" stroke-width="${w || 1.8}" stroke-linejoin="round"/>`;
      let s = D ? bandas(['#a6cbdc', '#b9d6e1', '#cde1e2', '#e3e7d9'], 120) : bandas(['#aab6ba', '#b4bfc1', '#bec7c7', '#c8cecc'], 120);
      if (D) s += sol(L, 46, 30, 12);
      // al fondo, el resto del pueblito: casitas teñidas por la bruma y un pino
      s += loma([[-10, 116], [80, 110], [160, 118], [310, 108]], D ? '#a7c2b4' : '#a9b6b2');
      s += [[16, 116, 26, 22], [48, 116, 22, 28], [80, 118, 24, 20]].map(([x, y, w, h]) => `<path d="M${x - w / 2} ${y} V${y - h} H${x + w / 2} V${y}Z" fill="${D ? '#d9c9b0' : '#b9b5aa'}"/><path d="M${x - w / 2 - 3} ${y - h} L${x} ${y - h - w * .5} L${x + w / 2 + 3} ${y - h}Z" fill="${D ? '#c48a72' : '#a39d94'}"/><rect x="${x - 3}" y="${y - h + 6}" width="6" height="6" fill="${D ? '#f2d48a' : '#9aa19f'}"/>`).join('');
      s += fila(F, { n: 2, x0: 90, x1: 124, y: 118, h: [30, 38], c: D ? '#7fa592' : '#9aaba5', sh: D ? '#729886' : '#8e9f99', sem: 8 });
      s += bruma(k, 96, 34, '#eef3ef', D ? .3 : .55);
      // la calle de adoquines (más grandes adelante)
      s += P('M-10 168 H310 V212 H-10Z', D ? '#c6b08a' : '#ada291', 0);
      for (const [y, h, w] of [[170, 6, 16], [178, 8, 20], [188, 10, 26], [200, 12, 32]]) {
        const of = (y / 2) % w;
        for (let x = -of; x < 310; x += w) s += `<rect x="${n1(x + 1)}" y="${y}" width="${w - 2}" height="${h - 1.5}" rx="${n1(h * .45)}" fill="${D ? '#d3bf9a' : '#b9af9f'}" stroke="${D ? '#a8916c' : '#968d7e'}" stroke-width="1"/>`;
      }
      // la panadería, de frente y de cerca
      s += P('M120 168 V72 H292 V168Z', D ? '#f1dcb8' : '#ddd0bb') + `<path d="M268 74 H292 V168 H268Z" fill="${D ? '#dcc39b' : '#c9bca7'}"/>`;
      s += P('M108 76 L206 26 L304 76Z', D ? '#c46a4a' : '#a7826f') + `<path d="M206 26 L304 76 H262Z" fill="${D ? '#a85638' : '#94725f'}"/><path d="M130 66 L206 30 M150 70 L206 40 M262 54 L282 70" stroke="${D ? '#a85638' : '#94725f'}" stroke-width="1.4"/>`;
      s += P('M248 50 V24 H262 V58Z', '#8a5a3c') + P('M245 24 h20 v-5 h-20z', '#6f4a32', 1.6);
      if (D) s += [0, 1, 2].map((i) => `<circle cx="255" cy="14" r="6" fill="#f3efe6" stroke="${L}" stroke-width="1.4" class="c-humo" ${d(i * 1.1)}/>`).join('');
      // el cartel colgado
      s += `<path d="M164 76 V82 M248 76 V82" stroke="${L}" stroke-width="1.6"/>` + P('M150 82 H262 V100 H150Z', '#8a6440') + `<path d="M153 85 H259" stroke="#a37a52" stroke-width="1.4"/>`;
      s += rotulo(W('panaderia'), 206, 95, 100, 10.5, '#fff1c9', D ? null : (i) => (i % 2 ? 'c-tit' : ''), D ? null : (i) => i % 2 === 1);
      // el toldo a rayas (gastado antes)
      const t1 = D ? '#c9485b' : '#b39189', t2 = D ? '#f6efe2' : '#ddd4c6';
      s += Array.from({ length: 8 }, (_, i) => `<path d="M${130 + i * 19.5} 104 h19.5 v14 a9.75 6 0 0 1 -19.5 0Z" fill="${i % 2 ? t2 : t1}" stroke="${L}" stroke-width="1.4"/>`).join('') + `<path d="M126 104 H286" stroke="${L}" stroke-width="2.2" stroke-linecap="round"/>`;
      // vidriera: vacía y gris antes; con pan y medialunas, y la luz cálida, después
      if (D) s += brillo(k, 164, 144, 30, '#ffd98a', .55);
      s += P('M134 128 H196 V162 H134Z', D ? '#f6d58e' : '#a9b7b8') + `<path d="M134 150 H196" stroke="${L}" stroke-width="1.4"/>`;
      s += D ? [[146, 149, 0], [164, 149, 1], [182, 149, 0]].map(([x, y, m]) => m ? `<path d="M${x - 9} ${y} C${x - 8} ${y - 8} ${x + 8} ${y - 8} ${x + 9} ${y} C${x + 4} ${y - 3} ${x - 4} ${y - 3} ${x - 9} ${y}Z" fill="#d9a441" stroke="${L}" stroke-width="1.2"/>` : `<ellipse cx="${x}" cy="${y - 4}" rx="8" ry="4.6" fill="#c98a3e" stroke="${L}" stroke-width="1.2"/><path d="M${x - 4} ${y - 6} l2 2 M${x} ${y - 7} l2 2 M${x + 4} ${y - 6} l-2 2" stroke="#f2d48a" stroke-width="1"/>`).join('') + `<ellipse cx="164" cy="158" rx="14" ry="3" fill="#d9a441" stroke="${L}" stroke-width="1.1"/>`
        : `<path d="M140 156 h3 M168 157 h2 M186 155 h3" stroke="#8b9590" stroke-width="1.4" stroke-linecap="round"/><path d="M140 134 L152 146 M176 132 L188 144" stroke="#c9d3d3" stroke-width="2" stroke-linecap="round"/>`;
      // la puerta (abierta y con luz después) y la campanita
      if (D) s += brillo(k, 232, 150, 26, '#ffd98a', .5);
      s += P('M216 168 V136 a14 14 0 0 1 28 0 V168Z', D ? '#f2c66d' : '#7a5638') + (D ? P('M216 168 V136 a14 14 0 0 1 6 -11 V160Z', '#7a5638', 1.4) : `<circle cx="238" cy="152" r="1.6" fill="${L}"/><path d="M230 124 v-4" stroke="${L}" stroke-width="1.4"/>`);
      s += `<g class="${D ? 'c-cabecea' : ''}" style="transform-origin:262px 122px"><path d="M262 122 v4" stroke="${L}" stroke-width="1.3"/><path d="M258 132 a4 5 0 0 1 8 0 h1 h-10z" fill="#d9a441" stroke="${L}" stroke-width="1.2"/></g>`;
      // Don Hornero en su nido de barro, sobre la punta del alero
      s += P('M98 78 L124 72 L124 80 L98 84Z', '#8a6440', 1.6);
      const hor = e.hornero({ nido: true, canta: D });
      s += figura(hor, 108, 80, 48, D ? 'c-canta' : 'c-triste');
      s += (D ? [0, 1, 2] : [0, 1]).map((i) => `<text x="${D ? 122 : 116}" y="${D ? 40 : 46}" font-size="12" fill="${D ? '#7a3a44' : '#7a8582'}" class="${D ? 'c-nota-sube' : 'c-nota-cae'}" ${d(i * 1.1)}>♪</text>`).join('');
      if (D) s += `<path d="M0 60 Q60 78 120 66" fill="none" stroke="${L}" stroke-width="1.2"/>` + [12, 30, 48, 66, 84, 102].map((x, i) => `<path d="M${x - 5} ${63 + Math.sin(i * .9) * 2 + i * .6} l5 9 l5 -9z" fill="${['#c9485b', '#f2c66d', '#67948f', '#e8907a'][i % 4]}" stroke="${L}" stroke-width="1" class="c-pasto" ${d(i * .3)}/>`).join('');
      // Tomillo adelante con su canasta (vacía antes, llena después)
      s += figura(TOMILLO(e), 64, 198, 100, D ? 'c-salta' : 'c-duda');
      s += `<g transform="translate(104 196)">${P('M-12 0 h24 l-3 -12 h-18z', '#c9a46a', 1.5)}<path d="M-10 -12 Q0 -26 10 -12" fill="none" stroke="${L}" stroke-width="1.6"/><path d="M-9 -6 h18" stroke="#a5824b" stroke-width="1.2"/>${D ? `<ellipse cx="-3" cy="-14" rx="7" ry="4" fill="#c98a3e" stroke="${L}" stroke-width="1.1"/><path d="M0 -13 C1 -19 11 -19 12 -13 C8 -15 4 -15 0 -13Z" fill="#d9a441" stroke="${L}" stroke-width="1"/>` : ''}</g>`;
      if (D) s += [0, 1].map((i) => `<path d="M${100 + i * 6} 176 q-3 -5 0 -10" fill="none" stroke="#f3efe6" stroke-width="1.6" stroke-linecap="round" class="c-sube" ${d(i * 1.2)}/>`).join('');
      return s;
    },

    // El Robledal: el roble-biblioteca de noche. Antes, a oscuras y con Ulises lleno de dudas; después, todo encendido
    robledal: (k) => {
      const { L, e } = k, D = k.despues;
      let s = D ? bandas(['#1d3a34', '#22433a', '#284d41', '#2f5848'], 130) : bandas(['#122420', '#152a24', '#192f28', '#1d352c'], 130);
      s += estrellas(D ? 22 : 14, 70);
      if (D) s += luna(L, 262, 30, 11);
      // lejos: copas redondas teñidas y bruma verde
      s += [[20, 120, 30], [70, 112, 34], [240, 114, 32], [292, 122, 28]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${D ? '#2f5446' : '#203a31'}"/>`).join('');
      s += `<path d="M-10 132 H310 V212 H-10Z" fill="${D ? '#2f5446' : '#203a31'}"/>`;
      s += bruma(k, 112, 40, D ? '#8fbca0' : '#4f7464', D ? .35 : .3);
      s += loma([[-10, 178], [90, 172], [200, 176], [310, 170]], D ? '#2c4a33' : '#1d3326', L, 1.8);
      // el roble: raíces, tronco ancho con su lado en sombra y la corteza
      s += `<path d="M120 182 C136 178 146 168 150 150 C154 128 150 104 146 86 L224 86 C220 106 216 128 222 150 C226 168 238 178 254 182 C232 186 222 180 214 184 C204 178 196 186 186 182 C176 188 166 180 158 186 C150 180 138 186 120 182Z" fill="${D ? '#74533a' : '#5a4130'}" stroke="${L}" stroke-width="2" stroke-linejoin="round"/>`;
      s += `<path d="M202 88 C200 112 198 136 206 156 C210 168 220 176 236 182 C226 184 218 180 214 184 C206 176 200 166 196 150 C190 128 192 106 194 88Z" fill="${D ? '#5f4430' : '#4a3528'}"/>`;
      s += `<path d="M160 100 C158 116 160 128 156 140 M176 96 C178 108 174 118 176 126 M212 132 C210 144 214 152 212 160" fill="none" stroke="${D ? '#5f4430' : '#43301f'}" stroke-width="1.6" stroke-linecap="round"/>`;
      // la rama de Ulises, que sale del tronco hacia la izquierda
      s += `<path d="M152 104 C120 100 96 108 40 104" fill="none" stroke="${L}" stroke-width="11" stroke-linecap="round"/><path d="M152 104 C120 100 96 108 40 104" fill="none" stroke="${D ? '#74533a' : '#5a4130'}" stroke-width="7" stroke-linecap="round"/><path d="M60 104 C52 96 46 92 38 92" fill="none" stroke="${L}" stroke-width="3" stroke-linecap="round"/>`;
      // la copa: masas grandes que se salen por arriba (con sombra y luz planas)
      for (const [x, y, r] of [[60, 34, 40], [130, 18, 46], [200, 22, 48], [264, 40, 40], [100, 64, 30], [236, 72, 30], [168, 60, 34]]) s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${D ? '#3f6a45' : '#2c4a31'}" stroke="${L}" stroke-width="2"/>`;
      for (const [x, y, r] of [[52, 26, 22], [122, 8, 26], [192, 10, 26], [256, 30, 22], [162, 52, 16]]) s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${D ? '#4d7c50' : '#33553a'}"/>`;
      s += `<path d="M30 60 C50 74 80 78 100 92 M210 96 C240 94 262 80 290 66" fill="none" stroke="${D ? '#335a3a' : '#22392a'}" stroke-width="2.4" stroke-linecap="round"/>`;
      // la puerta redonda (con luz que sale después) y dos ventanitas
      if (D) s += `<path d="M178 184 L156 212 H236 L214 184Z" fill="#ffd98a" opacity=".22"/>` + brillo(k, 196, 166, 30, '#ffd98a', .6);
      s += `<path d="M182 184 V166 a14 14 0 0 1 28 0 V184Z" fill="${D ? '#f2c66d' : '#2b1f17'}" stroke="${L}" stroke-width="1.8"/>`;
      s += D ? `<path d="M182 184 V166 a14 14 0 0 1 5 -10 V176Z" fill="#6b4a2f" stroke="${L}" stroke-width="1.4"/>` : `<path d="M196 152 V184" stroke="#4a3528" stroke-width="1.4"/><circle cx="204" cy="172" r="1.5" fill="#c9a46a"/>`;
      for (const [i, x, y] of [[0, 166, 124], [1, 200, 112]]) { if (D) s += brillo(k, x + 5, y + 6, 14, '#ffd98a', .6, 'c-late'); s += `<rect x="${x}" y="${y}" width="10" height="12" rx="5" stroke="${L}" stroke-width="1.6" fill="${D ? '#f6d27a' : '#1d2a22'}" ${D ? `class="c-late" ${d(i * .7)}` : ''}/><path d="M${x + 5} ${y} V${y + 12} M${x} ${y + 6} H${x + 10}" stroke="${L}" stroke-width="1"/>`; }
      // libros: tirados y cerrados antes; volando alrededor de la copa después
      s += D ? [[96, 136, '#c4553f', 0], [252, 128, '#2f7f7a', 1.4], [140, 76, '#d9a441', 2.6]].map(([x, y, c, dl]) => `<g class="c-flota" ${d(dl)}><g transform="translate(${x} ${y})"><g class="c-aleteo"><path d="M0 0 L-9 -5 L-9 4 L0 8Z" fill="${c}" stroke="${L}" stroke-width="1.2" stroke-linejoin="round"/><path d="M0 0 L9 -5 L9 4 L0 8Z" fill="${c}" stroke="${L}" stroke-width="1.2" stroke-linejoin="round"/></g><path d="M-6 -2 L-1 1 M6 -2 L1 1" stroke="#f3e2b8" stroke-width="1"/></g></g>`).join('')
        : [[232, 182, 16, '#7d3a30', -6], [248, 180, 14, '#2f5452', 8], [240, 172, 12, '#8a7030', -2]].map(([x, y, w, c, r]) => `<rect x="${x - w / 2}" y="${y - 5}" width="${w}" height="5" rx="1" fill="${c}" stroke="${L}" stroke-width="1.2" transform="rotate(${r} ${x} ${y})"/>`).join('');
      // luciérnagas
      s += Array.from({ length: D ? 9 : 4 }, (_, i) => luciernaga(k, n1(20 + rnd() * 260), n1(120 + rnd() * 50), n1(i * .7), D)).join('');
      // Ulises en su rama con el farol; antes, las preguntas le salen de la cabeza
      const u = e.ulises({ farol: true });
      const [fx, fy] = punto(u, 76, 108, 80, 178, 182);
      s += brillo(k, fx, fy, D ? 26 : 18, '#ffe08a', D ? .65 : .45, 'c-late');
      s += figura(u, 76, 108, 80, D ? 'c-cabecea' : '');
      s += D ? letra(L, '!', 104, 34, 18, '#f2c66d', 'c-salta') + `<path d="M116 22 l3 -6 M122 28 l6 -2 M110 18 l-1 -6" stroke="#f2c66d" stroke-width="1.6" stroke-linecap="round" class="c-late"/>`
        : letra(L, '?', 100, 36, 15, '#f2c66d', 'c-sube') + letra(L, '?', 112, 30, 11, '#e9dcbc', 'c-sube', 1.3) + letra(L, '?', 92, 28, 9, '#e9dcbc', 'c-sube', 2.4);
      s += matas(L, 7, 200, 1.05, D ? '#3a6040' : '#28432f', -10, 310, 'c-pasto');
      return s;
    },

    // Las Cumbres: Chispa en la boca de su cueva. Antes, tiritando con el fogón helado; después, el fuego y el deshielo
    cumbres: (k) => {
      const { L, e } = k, D = k.despues, F = formas();
      let s = D ? bandas(['#8db3d2', '#a2c3da', '#bcd3de', '#d8dfd8', '#ece2cd'], 120) : bandas(['#8aa1b3', '#97adbe', '#a5b9c8', '#b4c5d1'], 120);
      if (D) s += sol(L, 64, 34, 14, 'c-asoma');
      // cordillera lejana (sin contorno) y una del medio con contorno fino
      s += `<path d="M-10 120 L36 62 L64 88 L104 40 L148 92 L176 70 L214 104 L310 96 V212 H-10Z" fill="${D ? '#c9d5df' : '#bccad6'}"/><path d="M26 74 L36 62 L48 76 L40 72Z M92 54 L104 40 L118 58 L106 52 L98 60Z M168 78 L176 70 L186 82Z" fill="#f4f8fa"/>`;
      s += bruma(k, 84, 40, '#f4f8fa', .55);
      s += `<path d="M-10 146 L30 108 L62 130 L98 98 L142 140 L310 132 V212 H-10Z" fill="${D ? '#9fb3c3' : '#94a8b8'}" stroke="#7f95a6" stroke-width="1.4" stroke-linejoin="round"/><path d="M86 110 L98 98 L112 112 L102 108 L94 116Z M22 116 L30 108 L40 116Z" fill="#f4f8fa" stroke="#7f95a6" stroke-width="1"/>`;
      s += fila(F, { n: 6, x0: -10, x1: 150, y: 150, h: [22, 34], c: D ? '#56787f' : '#5d7783', sh: D ? '#4a6a71' : '#516a75', nieve: true, sem: 31 });
      // la roca de la cueva, a la derecha, con nieve arriba y la boca oscura (con luz cálida después)
      s += `<path d="M168 178 C164 140 176 104 204 84 C226 68 262 62 290 70 C304 74 312 80 312 84 V212 H168Z" fill="${D ? '#8a8f98' : '#7d8794'}" stroke="${L}" stroke-width="2" stroke-linejoin="round"/>`;
      s += `<path d="M252 70 C272 66 296 70 312 80 V212 H286 C292 170 280 120 252 70Z" fill="${D ? '#767b85' : '#6b7582'}"/>`;
      s += `<path d="M176 108 C190 86 214 72 240 66 C262 62 286 64 312 76 L312 86 C292 76 268 72 246 76 C224 80 200 92 186 112 C182 118 174 116 176 108Z" fill="#f4f8fa" stroke="${L}" stroke-width="1.6" stroke-linejoin="round"/>`;
      s += `<path d="M206 180 V136 C206 112 226 98 246 98 C266 98 284 112 284 136 V180Z" fill="${D ? '#4a3a33' : '#26313a'}" stroke="${L}" stroke-width="2"/>`;
      if (D) s += brillo(k, 246, 150, 40, '#ffb36b', .55, 'c-late');
      // carámbanos colgando del borde de la boca (gotean después)
      for (let i = 0; i < 7; i++) {
        const a = Math.PI * (1 - (i + .5) / 7), x = n1(246 + Math.cos(a) * 39), y = n1(137 - Math.sin(a) * 39 * .98), h = 8 + ((i * 5) % 7);
        s += `<path d="M${n1(x - 2.6)} ${y} L${x} ${n1(y + h)} L${n1(x + 2.6)} ${y}Z" fill="#e4f1f7" stroke="${L}" stroke-width="1.1" stroke-linejoin="round"/>`;
        if (D && i % 2 === 0) s += `<circle cx="${x}" cy="${n1(y + h + 2)}" r="1.4" fill="#9fc6e0" class="c-gota" ${d(i * .4)}/>`;
      }
      // el piso nevado (con pasto y flores que asoman después)
      s += loma([[-10, 178], [80, 172], [180, 180], [310, 176]], D ? '#e9efe9' : '#f1f5f7', L, 1.8);
      if (D) s += [[30, 186, 26], [120, 192, 30], [276, 190, 22]].map(([x, y, w]) => `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="5" fill="#8fb27a" stroke="${L}" stroke-width="1.2"/>`).join('') + [[22, 184, '#f2c66d'], [36, 186, '#e8907a'], [116, 190, '#f6efe2'], [128, 188, '#f2c66d']].map(([x, y, c], i) => flor(L, x, y - 7, 2.6, c, 'c-pasto', i * .4)).join('');
      // el fogón frente a la cueva: troncos con hielo (antes) o encendido (después)
      s += `<path d="M228 188 L262 178 M230 178 L262 188" stroke="${L}" stroke-width="7" stroke-linecap="round"/><path d="M228 188 L262 178 M230 178 L262 188" stroke="#8a5a3c" stroke-width="4" stroke-linecap="round"/>`;
      s += [[222, 188], [236, 190], [250, 190], [264, 188]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="3" fill="#9aa1a8" stroke="${L}" stroke-width="1.1"/>`).join('');
      s += D ? brillo(k, 246, 172, 28, '#ffcf6b', .6, 'c-late') + `<g class="c-fuego" style="transform-origin:246px 182px"><path d="M234 182 C232 170 240 166 238 154 C246 160 252 162 252 150 C260 160 262 172 258 182Z" fill="#e8907a" stroke="${L}" stroke-width="1.5" stroke-linejoin="round"/><path d="M240 182 C240 174 244 172 244 164 C250 170 254 174 252 182Z" fill="#f2c66d"/></g>`
        : `<path d="M232 180 C240 174 252 174 260 180" fill="none" stroke="#e4f1f7" stroke-width="3" stroke-linecap="round"/>`;
      // nieve que cae (antes)
      if (!D) s += Array.from({ length: 24 }, () => `<circle cx="${(rnd() * 320).toFixed(0)}" cy="-12" r="${(1.2 + rnd() * 1.6).toFixed(1)}" fill="#fff" class="c-nieve" ${d((rnd() * 6).toFixed(2))}/>`).join('');
      // Chispa: tiritando y echando humito (antes); contenta, con una llamita en la boca (después)
      const ch = CHISPA(e, !D), [bx, by] = punto(ch, 150, 192, 100, 178, 94);
      s += figura(ch, 150, 192, 100, D ? 'c-respira' : 'c-tirita');
      if (D) s += `<g transform="translate(${n1(bx)} ${n1(by - 2)})"><g class="c-fuego"><path d="M0 0 C6 -5 12 -2 16 -8 C15 0 19 3 13 8 C7 9 3 6 0 0Z" fill="#e8907a" stroke="${L}" stroke-width="1.3"/><path d="M3 1 C7 -2 10 0 12 -3 C11 2 12 4 8 5 C6 5 4 4 3 1Z" fill="#f2c66d"/></g></g>`;
      // una roca nevada adelante, a la izquierda (enmarca)
      s += `<path d="M-12 212 C-12 186 4 168 30 166 C54 164 70 180 74 212Z" fill="${D ? '#8a8f98' : '#7d8794'}" stroke="${L}" stroke-width="1.8" stroke-linejoin="round"/><path d="M48 168 C62 174 70 190 74 212 H58 C58 194 54 180 48 168Z" fill="${D ? '#767b85' : '#6b7582'}"/><path d="M-10 180 C0 168 18 162 34 164 C46 165 56 170 60 176 C48 172 38 174 30 172 C18 172 6 176 -10 186Z" fill="#f4f8fa" stroke="${L}" stroke-width="1.4" stroke-linejoin="round"/>`;
      return s;
    },

    // La Torre Umbría: la torre torcida del archimago, con ojos por ventanas; Hilda baja colgada de su hilo
    umbria: (k) => {
      const { L, e } = k, D = k.despues;
      let s = D ? bandas(['#3c4f86', '#5e62a0', '#8a73ac', '#bb86aa', '#e3a1a2', '#f2c09a'], 150) : bandas(['#100c1f', '#151029', '#1b1534', '#221a40', '#2b214d', '#34285a'], 150);
      s += estrellas(D ? 10 : 24, 90);
      if (!D) s += `<path d="M262 0 L250 30 L262 30 L246 66" fill="none" stroke="#e6dcff" stroke-width="2.4" stroke-linejoin="round" class="c-rayo"/><rect width="300" height="200" fill="#c9b6ff" opacity=".5" class="c-rayo"/>`;
      // lejos: agujas de roca teñidas y bruma violeta
      s += `<path d="M-10 150 L20 112 L34 128 L56 92 L80 136 L230 140 L252 100 L270 122 L292 86 L310 120 V212 H-10Z" fill="${D ? '#7a6a9a' : '#241b3d'}"/>`;
      s += bruma(k, 120, 44, D ? '#f6d6c8' : '#6d5a9e', D ? .45 : .35);
      s += loma([[-10, 176], [100, 168], [200, 172], [310, 166]], D ? '#4c4468' : '#1c1530', L, 1.8);
      // la torre torcida, con su lado en sombra, ventanas-ojo y techo de púas (antes) o cono claro con bandera (después)
      const pt = D ? '#7d6aa8' : '#3a2b5c', ps = D ? '#66558f' : '#2c2147';
      s += `<path d="M126 176 C130 140 124 104 136 70 L168 70 C162 104 170 140 176 176Z" fill="${pt}" stroke="${L}" stroke-width="2" stroke-linejoin="round"/><path d="M158 70 H168 C162 104 170 140 176 176 H164 C160 140 154 104 158 70Z" fill="${ps}"/>`;
      s += `<path d="M132 120 h8 M150 96 h8 M138 150 h9 M154 136 h8" stroke="${ps}" stroke-width="1.4" stroke-linecap="round"/>`;
      s += `<path d="M130 72 L134 62 H170 L174 72Z" fill="${pt}" stroke="${L}" stroke-width="1.8" stroke-linejoin="round"/>`;
      s += D ? `<path d="M132 63 L152 22 L172 63Z" fill="#efe9dc" stroke="${L}" stroke-width="1.8" stroke-linejoin="round"/><path d="M152 22 L172 63 H158Z" fill="#d8cfba"/><g class="c-bandera" style="transform-origin:152px 22px"><path d="M152 22 V8" stroke="${L}" stroke-width="1.4"/><path d="M152 8 C158 6 162 11 168 9 L168 16 C162 18 158 13 152 15Z" fill="#f2c66d" stroke="${L}" stroke-width="1.2"/></g>`
        : `<path d="M134 63 L140 36 L146 63 M146 63 L152 18 L158 63 M158 63 L164 40 L170 63Z" fill="#1d1830" stroke="${L}" stroke-width="1.8" stroke-linejoin="round"/>`;
      for (const [x, y] of [[142, 92], [158, 92]]) {
        if (!D) s += brillo(k, x, y, 10, '#b9a2f0', .6, 'c-late');
        s += `<path d="M${x - 5} ${y} Q${x} ${y - 7} ${x + 5} ${y} Q${x} ${y + 5} ${x - 5} ${y}Z" fill="${D ? '#f6d27a' : '#c9b6ff'}" stroke="${L}" stroke-width="1.4"/>${D ? '' : `<circle cx="${x}" cy="${y}" r="1.8" fill="#1d1830"/>`}`;
      }
      s += `<path d="M144 176 V160 a7 7 0 0 1 14 0 V176Z" fill="${D ? '#f2c66d' : '#1d1830'}" stroke="${L}" stroke-width="1.6"/>`;
      // las runas giran alrededor de la torre (antes); la voz sale en letras (después)
      if (!D) s += `<ellipse cx="152" cy="118" rx="64" ry="14" fill="none" stroke="#9d7fe0" stroke-width="1.6" stroke-dasharray="8 6" class="c-hilo" opacity=".8"/>` + [[92, 120], [118, 132], [186, 132], [212, 120], [178, 106], [126, 106]].map(([x, y], i) => letra(L, 'ᚱᚢᚾᛖᛋᚹ'[i], x, y + 4, i < 4 ? 12 : 9, '#d8c9ff', 'c-flota', i * .4)).join('');
      else s += bandada(L, W('voz'), 152, 60, (i, n) => [(i - (n - 1) / 2) * 34, -50 - (i % 2) * 10]);
      // Umbrío flota delante de la torre
      s += brillo(k, 228, 128, 44, D ? '#ffe08a' : '#8a6fc9', D ? .55 : .5, 'c-late');
      s += `<ellipse cx="228" cy="176" rx="22" ry="3.4" fill="#0d1418" opacity=".3" class="c-late"/>`;
      s += figura(UMBRIO(D), 228, 166, 82, 'c-flota');
      // el árbol seco de la izquierda (enmarca), con zarzas; flores después
      s += `<path d="M-8 212 C4 176 0 140 14 110 C24 88 20 62 36 40 C46 26 66 18 90 16" fill="none" stroke="${L}" stroke-width="13" stroke-linecap="round"/><path d="M-8 212 C4 176 0 140 14 110 C24 88 20 62 36 40 C46 26 66 18 90 16" fill="none" stroke="${D ? '#5a4a6a' : '#2a2238'}" stroke-width="8" stroke-linecap="round"/>`;
      s += `<path d="M30 48 C20 38 12 36 2 38 M62 20 C70 8 80 4 92 2 M76 17 C90 22 100 30 108 28" fill="none" stroke="${L}" stroke-width="6" stroke-linecap="round"/><path d="M30 48 C20 38 12 36 2 38 M62 20 C70 8 80 4 92 2 M76 17 C90 22 100 30 108 28" fill="none" stroke="${D ? '#5a4a6a' : '#2a2238'}" stroke-width="3" stroke-linecap="round"/>`;
      // Hilda baja colgada de su hilo desde la rama y teje el mapa: un hilo rojo que lleva a la puerta
      s += `<g class="c-hamaca" style="transform-origin:94px 26px"><path d="M94 26 V86" stroke="#e6dcff" stroke-width="1.1" opacity=".8"/>${figura(e.hilda({ medir: true }), 94, 136, 56, '')}</g>`;
      s += `<path d="M96 136 C100 160 120 176 144 176" fill="none" stroke="#c9485b" stroke-width="1.8" stroke-dasharray="4 3" class="c-hilo"/>`;
      s += [[214, 186], [248, 182], [282, 188], [36, 190]].map(([x, y], i) => `<path d="M${x - 14} ${y} C${x - 10} ${y - 14} ${x + 4} ${y - 18} ${x + 14} ${y - 6} M${x - 6} ${y} C${x - 4} ${y - 8} ${x + 2} ${y - 10} ${x + 8} ${y - 4}" fill="none" stroke="${L}" stroke-width="2.4" stroke-linecap="round"/>${D ? flor(L, x + 12, y - 10, 2.6, i % 2 ? '#f2c66d' : '#e8a6c0', 'c-pasto', i * .4) : `<path d="M${x - 2} ${y - 13} l3 -3 M${x + 8} ${y - 12} l3 -2" stroke="${L}" stroke-width="1.6" stroke-linecap="round"/>`}`).join('');
      return s;
    },
  };

  const CAPITULOS = [
    { id: 'torre', ante: 'Capítulo gratis', n: 'La Torre Arcana', sub: '20 pisos · las mismas palabras para todos', libre: true,
      p: 'Nocturnia encerró las palabras del bosque en lo alto de la torre. Silabo sube piso por piso para liberarlas.', ayuda: 'Cada 5 pisos te espera un jefe. Arriba, la cima.' },
    { id: 'pradera', ante: 'Capítulo 1', n: 'La Pradera', corto: 'Pradera', sub: 'Con Tomillo, la liebre', jugable: true, pisos: 6, jefe: 'El Viento Ladrón', contra: 'al Viento Ladrón', logro: 'pradera',
      icono: '🌾', hilo: 'letras', palabraHilo: 'camino', poder: 'atajo', reglaJefe: 'Cuidado: cada tanto te tapa una letra', vuelve: '¡VOLVIERON LETRAS AL CARTEL!', final: 'El cartel ya dice {w} otra vez: la Pradera tiene camino.',
      suma: 'Tomillo se suma a tu equipo:', sumaTexto: 'su Atajo te acompaña en los capítulos que siguen.', ayudaTexto: 'Tomillo te acompaña: una vez por piso, su Atajo te muestra con qué letra empieza una palabra larga.',
      historia: 'El Viento Ladrón se llevó las letras del cartel y Tomillo no encuentra el camino. Cada piso que pasás devuelve letras al cartel; en el sexto te espera el Viento.',
      p: 'El viento borró los carteles del camino y Tomillo no puede leer su mapa.', ayuda: 'Atajo de Tomillo: una vez por piso, te muestra la primera letra de una palabra larga que te falta.' },
    { id: 'laguna', ante: 'Capítulo 2', n: 'La Laguna del Ceibo', corto: 'Laguna', sub: 'Con Doña Lenta', jugable: true, pisos: 6, jefe: 'La Niebla Muda', contra: 'a la Niebla Muda', logro: 'laguna', requiere: 'pradera',
      icono: '🌺', hilo: 'iconos', poder: 'paciencia', reglaJefe: 'Empaña letras: cada palabra que encontrás despeja una', vuelve: '¡SE ABRIÓ UNA FLOR DEL CEIBO!', final: 'El ceibo volvió a florecer y Doña Lenta encontró el hilo.',
      historia: 'La Niebla Muda se echó a dormir sobre la laguna: tapó las flores del ceibo y Doña Lenta perdió el hilo. Cada piso que pasás abre una flor; en el sexto te espera la Niebla.',
      suma: 'Doña Lenta se suma a tu equipo:', sumaTexto: 'su Paciencia congela el reloj 10 segundos, una vez por piso, en los capítulos que siguen.', ayudaTexto: 'Doña Lenta te acompaña: una vez por piso, su Paciencia congela el reloj 10 segundos.',
      p: 'La niebla tapó las flores del ceibo y Doña Lenta perdió el hilo de sus definiciones.', ayuda: 'Paciencia de Doña Lenta: congela el reloj 10 segundos una vez por piso.' },
    { id: 'pueblito', ante: 'Capítulo 3', n: 'El Pueblito', corto: 'Pueblito', sub: 'Con Don Hornero', jugable: true, pisos: 6, jefe: 'El Horno Frío', contra: 'al Horno Frío', logro: 'pueblito', requiere: 'laguna',
      icono: '🍞', hilo: 'letras', palabraHilo: 'panaderia', poder: 'barro', lugar: 'pueblito', reglaJefe: 'Las palabras de 3 letras no le hacen nada',
      historia: 'El Horno Frío se quedó con el calor del pueblito: Don Hornero no puede cantar y no hay pan. Cada piso que pasás devuelve letras al cartel de la panadería; en el sexto te espera el Horno.',
      vuelve: '¡VOLVIERON LETRAS A LA PANADERÍA!', final: 'El cartel dice {w} otra vez, el horno calienta y Don Hornero canta.',
      suma: 'Don Hornero se suma a tu equipo:', sumaTexto: 'su Barro pega dos palabras cortas y valen como una larga, una vez por piso.', ayudaTexto: 'Don Hornero te acompaña: una vez por piso, su Barro pega dos palabras cortas que encontraste y valen como una larga.',
      p: 'Don Hornero no puede cantar y sin su canto el horno no calienta: el pueblito se quedó sin pan.', ayuda: 'Barro de Hornero: pega dos palabras cortas que encontraste y cuentan como una larga.' },
    { id: 'robledal', ante: 'Capítulo 4', n: 'El Robledal', corto: 'Robledal', sub: 'Con Ulises, el búho', jugable: true, pisos: 6, jefe: 'La Gran Polilla', contra: 'a la Gran Polilla', logro: 'robledal', requiere: 'pueblito',
      icono: '🦉', hilo: 'iconos', poder: 'memoria', lugar: 'biblioteca', reglaJefe: 'Cada tanto apaga la luz: acordate de las letras',
      historia: 'La Gran Polilla se comió los acertijos de Ulises y dejó la biblioteca del roble a oscuras. Cada piso que pasás enciende una ventana; en el sexto te espera la Polilla.',
      vuelve: '¡SE ENCENDIÓ UNA VENTANA!', final: 'La biblioteca del roble brilla otra vez y Ulises recordó sus acertijos.',
      suma: 'Ulises se suma a tu equipo:', sumaTexto: 'su Memoria te dice con qué letra termina una palabra larga, una vez por piso.', ayudaTexto: 'Ulises te acompaña: una vez por piso, su Memoria te dice con qué letra termina una palabra larga.',
      p: 'Ulises se olvidó los acertijos y la biblioteca del roble quedó a oscuras.', ayuda: 'Memoria de Ulises: una vez por piso, te dice con qué letra termina una palabra larga que te falta.' },
    { id: 'cumbres', ante: 'Capítulo 5', n: 'Las Cumbres', corto: 'Cumbres', sub: 'Con Chispa', jugable: true, pisos: 6, jefe: 'La Ventisca', contra: 'a la Ventisca', logro: 'cumbres', requiere: 'robledal',
      icono: '🔥', hilo: 'iconos', poder: 'llamita', lugar: 'cumbre', reglaJefe: 'Si te quedás quieto, te roba segundos',
      historia: 'La Ventisca le robó a Chispa la palabra "fuego" y congeló las cumbres. Cada piso que pasás prende una fogata; en el sexto te espera la Ventisca.',
      vuelve: '¡SE PRENDIÓ UNA FOGATA!', final: 'Las cumbres se deshielan y Chispa recuperó su fuego.',
      suma: 'Chispa se suma a tu equipo:', sumaTexto: 'su Llamita hace que tu próxima palabra valga el doble, una vez por piso.', ayudaTexto: 'Chispa te acompaña: una vez por piso, su Llamita hace que tu próxima palabra valga el doble.',
      p: 'Chispa solo echa humo: le robaron la palabra "fuego". Las cumbres se congelaron.', ayuda: 'Llamita de Chispa: una vez por piso, tu próxima palabra vale el doble.' },
    { id: 'umbria', ante: 'Capítulo 6', n: 'La Torre Umbría', corto: 'Umbría', sub: 'El duelo con Umbrío', jugable: true, pisos: 6, jefe: 'Umbrío', contra: 'a Umbrío', logro: 'umbria', requiere: 'cumbres',
      icono: '🌀', hilo: 'letras', palabraHilo: 'voz', lugar: 'cueva', reglaJefe: 'Usa todos los trucos: viento, niebla y apagón',
      historia: 'La torre del archimago. Umbrío se robó las palabras porque nadie lo escuchaba. Hilda conoce el camino de adentro y todos tus aliados vienen con vos: cada piso le devuelve letras a su voz; en el sexto, el duelo.',
      vuelve: '¡UMBRÍO RECUPERA SU VOZ!', final: 'Umbrío dice {w} y por fin lo escuchan. Devolviste la voz al bosque.',
      suma: '¡Terminaste la Campaña del Archimago!', sumaTexto: 'Umbrío se queda en el bosque contando cuentos. Gracias por jugarla.', ayudaTexto: 'En el duelo final se usan las ayudas de todos tus aliados.',
      p: 'La torre del archimago. Hilda, que tejió el mapa todo el viaje, conoce el camino de adentro.', ayuda: 'Todos juntos: en el duelo final se usan las ayudas de todos los aliados.' },
  ];

  const cache = {};
  /** La escena de un capítulo como SVG. despues: el lugar liberado (capítulo terminado). */
  function escena(id, despues) {
    const clave = idioma() + ':' + id + (despues ? ':d' : '');
    if (!cache[clave]) {
      const e = E(), L = (e && e.L) || '#16262c';
      // cada escena con su propia semilla: siempre se dibuja igual
      semilla = 11 + id.length * 97 + (despues ? 5 : 0);
      const k = { L, e, despues: !!despues, u: 'c' + id.slice(0, 3) + (despues ? 'd' : 'a'), defs: '', n: 0 };
      let cuerpo = '';
      try { cuerpo = e && ESCENAS[id] ? ESCENAS[id](k) : ''; } catch (err) { cuerpo = ''; if (window.WWReportes && WWReportes.error) WWReportes.error('Escena ' + id + ': ' + err.message); }
      cache[clave] = `<svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${k.defs ? `<defs>${k.defs}</defs>` : ''}${cuerpo}</svg>`;
    }
    return cache[clave];
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

  /** El Viento Ladrón, para el piso del jefe (una nube con cachetes que sopla; ronda 3). */
  function viento() {
    const L = (E() && E().L) || '#16262c';
    return `<svg viewBox="0 0 120 90" aria-hidden="true"><g class="c-sopla" style="transform-origin:60px 50px">
      <path d="M26 70 C8 70 4 48 22 44 C20 24 46 18 56 32 C64 14 98 18 96 40 C114 42 116 68 96 70Z" fill="#f5f8f4" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M30 62 C44 66 78 66 92 62" fill="none" stroke="#d9e3de" stroke-width="4" stroke-linecap="round"/>
      <path d="M42 46 q4 -5 8 0 M64 46 q4 -5 8 0" fill="none" stroke="${L}" stroke-width="3" stroke-linecap="round"/>
      <path d="M40 40 l9 -3 M74 37 l9 3" stroke="${L}" stroke-width="2.6" stroke-linecap="round"/>
      <ellipse cx="38" cy="56" rx="7" ry="4.5" fill="#e8a99a" opacity=".7"/><ellipse cx="80" cy="56" rx="7" ry="4.5" fill="#e8a99a" opacity=".7"/>
      <circle cx="98" cy="54" r="5" fill="#f5f8f4" stroke="${L}" stroke-width="2.6"/></g>
      ${[0, 1, 2].map((i) => `<path d="M104 ${48 + i * 7} h14" stroke="#f3f6ee" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="6 5" class="c-flujo" style="animation-delay:${i * .2}s"/>`).join('')}</svg>`;
  }

  /** La Niebla Muda, jefa de la Laguna: una nube larga y baja que duerme, con la boca cosida. */
  function nieblaJefe() {
    const L = (E() && E().L) || '#16262c';
    return `<svg viewBox="0 0 120 90" aria-hidden="true"><g class="c-niebla" style="animation-duration:6s">
      <path d="M18 72 C4 72 2 54 16 50 C12 32 34 24 46 34 C54 18 82 18 88 34 C102 28 118 40 110 56 C120 60 116 74 104 74Z" fill="#eef3ef" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M24 66 C44 70 82 70 104 66" fill="none" stroke="#cfdad5" stroke-width="4" stroke-linecap="round"/>
      <path d="M40 50 q6 5 12 0 M68 50 q6 5 12 0" fill="none" stroke="${L}" stroke-width="3" stroke-linecap="round"/>
      <path d="M52 60 h16 M56 56 v8 M64 56 v8" stroke="${L}" stroke-width="2.4" stroke-linecap="round"/>
      <ellipse cx="36" cy="58" rx="6" ry="3.5" fill="#c9b6c8" opacity=".55"/><ellipse cx="86" cy="58" rx="6" ry="3.5" fill="#c9b6c8" opacity=".55"/></g>
      <text x="98" y="22" font-size="14" font-family="Fredoka, sans-serif" fill="#cfdad5" stroke="${L}" stroke-width="2" paint-order="stroke" class="c-sube">z</text>
      <text x="108" y="12" font-size="10" font-family="Fredoka, sans-serif" fill="#cfdad5" stroke="${L}" stroke-width="2" paint-order="stroke" class="c-sube" style="animation-delay:1.2s">z</text></svg>`;
  }

  /** El Horno Frío, jefe del Pueblito: un horno de barro con escarcha y cara de pocos amigos. */
  function hornoFrio() {
    const L = (E() && E().L) || '#16262c';
    return `<svg viewBox="0 0 120 90" aria-hidden="true"><g class="c-tirita">
      <path d="M14 82 C10 46 34 18 60 18 C86 18 110 46 106 82Z" fill="#a98a72" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M82 24 C98 34 108 56 106 82 H92 C96 60 90 38 82 24Z" fill="#8f7360"/>
      <path d="M24 44 C34 26 48 20 60 20 C76 20 90 28 98 42 C86 36 74 34 62 36 C48 38 36 40 24 44Z" fill="#eef4f7" stroke="${L}" stroke-width="2.4" stroke-linejoin="round"/>
      ${[34, 46, 58, 70, 82].map((x, i) => `<path d="M${x - 3} ${40 - (i % 2) * 3} L${x} ${50 - (i % 2) * 3} L${x + 3} ${40 - (i % 2) * 3}Z" fill="#dff1f8" stroke="${L}" stroke-width="1.4"/>`).join('')}
      <path d="M44 82 V66 a16 14 0 0 1 32 0 V82Z" fill="#2b3a44" stroke="${L}" stroke-width="2.4"/>
      <path d="M60 68 v10 M55 73 h10 M56.5 69.5 l7 7 M63.5 69.5 l-7 7" stroke="#cfe6f0" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M40 54 l10 3 M80 54 l-10 3" stroke="${L}" stroke-width="2.6" stroke-linecap="round"/>
      <circle cx="46" cy="60" r="2.6" fill="${L}"/><circle cx="74" cy="60" r="2.6" fill="${L}"/></g></svg>`;
  }
  /** La Gran Polilla, jefa del Robledal: alas grandes que aletean y antenas, con ojos de sueño. */
  function polilla() {
    const L = (E() && E().L) || '#16262c';
    return `<svg viewBox="0 0 120 90" aria-hidden="true"><g class="c-flota">
      <g class="c-aleteo" style="animation-duration:.6s"><path d="M58 46 C40 18 10 16 8 36 C6 52 28 60 56 52Z" fill="#9c8a74" stroke="${L}" stroke-width="3" stroke-linejoin="round"/><path d="M62 46 C80 18 110 16 112 36 C114 52 92 60 64 52Z" fill="#9c8a74" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M56 54 C40 58 22 70 28 80 C36 86 50 74 58 60Z M64 54 C80 58 98 70 92 80 C84 86 70 74 62 60Z" fill="#857460" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="28" cy="36" r="7" fill="#e9dcbc" stroke="${L}" stroke-width="2"/><circle cx="92" cy="36" r="7" fill="#e9dcbc" stroke="${L}" stroke-width="2"/></g>
      <ellipse cx="60" cy="54" rx="9" ry="22" fill="#6e5e4e" stroke="${L}" stroke-width="3"/>
      <path d="M56 34 C50 20 44 14 38 12 M64 34 C70 20 76 14 82 12" fill="none" stroke="${L}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M54 42 q3 3 6 0 M60 42 q3 3 6 0" fill="none" stroke="${L}" stroke-width="2.2" stroke-linecap="round"/></g></svg>`;
  }
  /** La Ventisca, jefa de las Cumbres: una nube de nieve con el ceño fruncido. */
  function ventiscaJefe() {
    const L = (E() && E().L) || '#16262c';
    return `<svg viewBox="0 0 120 90" aria-hidden="true"><g class="c-sopla" style="transform-origin:60px 40px">
      <path d="M22 58 C6 58 4 38 20 34 C18 16 42 10 52 22 C60 6 92 10 92 30 C108 30 116 48 104 58Z" fill="#eef4f7" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M40 36 l10 4 M80 36 l-10 4" stroke="${L}" stroke-width="2.8" stroke-linecap="round"/>
      <circle cx="46" cy="44" r="2.8" fill="${L}"/><circle cx="74" cy="44" r="2.8" fill="${L}"/>
      <path d="M54 52 q6 -4 12 0" fill="none" stroke="${L}" stroke-width="2.4" stroke-linecap="round"/></g>
      ${[[30, 0], [52, .8], [74, 1.6], [96, .4], [42, 2.2], [86, 1.2]].map(([x, dl]) => `<circle cx="${x}" cy="64" r="2.4" fill="#ffffff" stroke="${L}" stroke-width=".8" class="c-gota" style="animation-delay:${dl}s;animation-duration:1.6s"/>`).join('')}</svg>`;
  }
  /** El jefe de cada capítulo, para el piso 6. */
  function jefeSvg(id) {
    if (id === 'laguna') return nieblaJefe();
    if (id === 'pueblito') return hornoFrio();
    if (id === 'robledal') return polilla();
    if (id === 'cumbres') return ventiscaJefe();
    if (id === 'umbria') return UMBRIO(false);
    return viento();
  }
  /** El hilo de cada capítulo cuando no son letras: flores del ceibo, ventanas encendidas, fogatas. */
  function hiloIcono(id, on) {
    const L = (E() && E().L) || '#16262c';
    if (id === 'laguna') return `<svg viewBox="-30 -58 60 62" aria-hidden="true">${on && E() ? E().florCeibo(0, 0, .95, 0) : `<path d="M0 -4 C-8 -16 -6 -34 0 -44 C6 -34 8 -16 0 -4Z" fill="#a9aeab" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>`}</svg>`;
    if (id === 'robledal') return `<svg viewBox="0 0 40 44" aria-hidden="true">${on ? `<circle cx="20" cy="22" r="18" fill="#ffd98a" opacity=".35"/>` : ''}<path d="M8 40 V18 a12 12 0 0 1 24 0 V40Z" fill="${on ? '#f6d27a' : '#2b3a30'}" stroke="${L}" stroke-width="2.6"/><path d="M20 6 V40 M8 24 H32" stroke="${L}" stroke-width="2"/></svg>`;
    if (id === 'cumbres') return `<svg viewBox="0 0 40 44" aria-hidden="true"><path d="M6 40 L34 32 M8 32 L34 40" stroke="${L}" stroke-width="6" stroke-linecap="round"/><path d="M6 40 L34 32 M8 32 L34 40" stroke="#8a5a3c" stroke-width="3.4" stroke-linecap="round"/>${on ? `<path d="M10 34 C8 22 16 18 14 6 C22 12 28 14 28 4 C34 14 34 26 30 34Z" fill="#e8907a" stroke="${L}" stroke-width="2.2" stroke-linejoin="round"/><path d="M16 34 C16 26 20 24 20 16 C26 22 28 26 26 34Z" fill="#f2c66d"/>` : `<path d="M10 32 C16 28 26 28 32 32" fill="none" stroke="#dfeef5" stroke-width="3" stroke-linecap="round"/>`}</svg>`;
    return '';
  }

  window.WWCampanas = { CAPITULOS, escena, vigilar, ESCENAS, viento, nieblaJefe, jefeSvg, hiloIcono, palabra: W };
})();
