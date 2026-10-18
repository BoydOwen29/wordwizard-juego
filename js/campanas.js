/**
 * Word Wizard — el libro de campañas (v2.44, 18/10/2026; lab/libro-capitulos.html, opción C elegida por Owen).
 * La Torre Arcana es el capítulo gratis; después vienen las regiones de la Campaña del Archimago (con el Pase).
 * Cada capítulo tiene su escena animada (SVG con clases que anima estilo.css, sección "campañas").
 * Los personajes salen de game/js/elenco.js (WWElenco) y Silabo de game/js/silabo.js.
 */
(function () {
  'use strict';
  const E = () => window.WWElenco;
  const sinSvg = (s) => s.replace(/^<svg[^>]*>|<\/svg>$/g, '');
  const vb = (s) => (s.match(/viewBox="([^"]+)"/) || [0, '0 0 100 100'])[1].split(' ').map(Number);
  /** Un dibujo dentro de la escena: x, y = centro de los pies, h = alto. */
  function figura(svg, x, y, h, clase) {
    const [vx, vy, vw, vh] = vb(svg), k = h / vh;
    return `<g class="${clase || ''}"><g transform="translate(${x - (vw / 2) * k} ${y - vh * k}) scale(${k}) translate(${-vx} ${-vy})">${sinSvg(svg)}</g></g>`;
  }
  let semilla = 11;
  const rnd = () => (semilla = (semilla * 9301 + 49297) % 233280) / 233280;
  const estrellas = (n, h) => Array.from({ length: n }, () => `<circle cx="${(rnd() * 300).toFixed(1)}" cy="${(rnd() * h).toFixed(1)}" r="${(0.8 + rnd() * 1.6).toFixed(1)}" fill="#fff1c9" class="c-tit" style="animation-delay:${(rnd() * 2.4).toFixed(2)}s"/>`).join('');
  const d = (s) => `style="animation-delay:${s}s"`;
  const SILABO = () => window.Silabo.mago(Object.assign({}, window.Silabo.OFICIAL));
  const UMBRIO = () => window.Silabo.mago(Object.assign({}, window.Silabo.OFICIAL, {
    colores: { hat: '#2b2340', hatSh: '#1d1830', robe: '#3a2b5c', robeSh: '#2a1f45', band: '#8a6fc9', hem: '#8a6fc9', starRobe: '#c9b6ff', shoe: '#151225', star: '#c9b6ff', nose: '#b8a4c9', noseHi: '#d8cbe3', beard: '#cfd2e0', beardSh: '#a3a8bd' },
    estilo: { forma: 'dormilon', sombrero: 'runas', motivo: 'runas', capa: '#1d1830', punta: 'orbe', barbaFin: 214, barbaExtra: 'trenza', metal: '#8a6fc9', bigote: 'manubrio' }, etapa: 3, varita: 1.75, anguloVarita: -84,
  }));

  // ---------------------------------------------------------------- las escenas (300 × 200)
  const ESCENAS = {
    torre: (L) => `<defs><linearGradient id="cgT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d1a3a"/><stop offset="1" stop-color="#3b3170"/></linearGradient></defs>
      <rect width="300" height="200" fill="url(#cgT)"/>${estrellas(26, 120)}
      <path d="M232 34 a18 18 0 1 0 14 30 a14 14 0 1 1 -14 -30z" fill="#fff1c9" stroke="${L}" stroke-width="2.5"/>
      <path d="M0 176 C80 160 220 160 300 178 V200 H0Z" fill="#2c4d58" stroke="${L}" stroke-width="3"/>
      <rect x="130" y="62" width="40" height="118" rx="4" fill="#7a6bb8" stroke="${L}" stroke-width="3"/>
      <path d="M122 64 L150 22 L178 64Z" fill="#b3a3ff" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>
      ${[86, 116, 146].map((y, i) => `<rect x="143" y="${y - 9}" width="14" height="18" rx="7" fill="#f2c66d" stroke="${L}" stroke-width="2.5" class="c-late" ${d(i * .5)}/>`).join('')}
      ${[[104, 178, 1], [196, 180, .8], [86, 182, .6]].map(([x, y, k], i) => `<path d="M${x} ${y} l${6 * k} ${-26 * k} l${6 * k} ${26 * k}z" fill="#b3a3ff" stroke="${L}" stroke-width="2.5" class="c-late" ${d(i * .7)}/>`).join('')}
      ${'WORD'.split('').map((c, i) => `<text x="${118 + i * 22}" y="70" font-size="15" fill="#fff1c9" stroke="${L}" stroke-width="3" paint-order="stroke" class="c-sube" ${d(i * .9)}>${c}</text>`).join('')}
      ${figura(SILABO(), 96, 184, 52, 'c-flota')}`,
    pradera: (L, e) => `<rect width="300" height="200" fill="#bcd7c6"/><circle cx="250" cy="42" r="18" fill="#f2d48a" stroke="${L}" stroke-width="2.5"/>
      <path d="M0 120 C70 96 150 110 300 92 V200 H0Z" fill="#9cbf86" stroke="${L}" stroke-width="3"/><path d="M0 150 C90 130 200 150 300 136 V200 H0Z" fill="#86ac72" stroke="${L}" stroke-width="3"/>
      ${[0, 1, 2].map((i) => `<path d="M-20 ${50 + i * 26} h60 q12 0 12 -8" fill="none" stroke="#f3f6ee" stroke-width="3" stroke-linecap="round" class="c-viento" ${d(i)}/>`).join('')}
      <rect x="196" y="98" width="6" height="56" fill="#8a6440" stroke="${L}" stroke-width="2.5"/><rect x="176" y="92" width="48" height="22" rx="3" fill="#e9dcbc" stroke="${L}" stroke-width="2.5"/>
      ${'CAMINO'.split('').map((c, i) => `<text x="${181 + i * 7}" y="108" font-size="10" fill="#5a4a36" class="c-vuela" ${d(i * .6)}>${c}</text>`).join('')}
      ${Array.from({ length: 16 }, (_, i) => `<path d="M${10 + i * 19} 196 q-2 -14 4 -26" fill="none" stroke="#5f8458" stroke-width="3" stroke-linecap="round" class="c-pasto" ${d((i % 5) * .3)}/>`).join('')}
      ${figura(e.tomillo({ pelo: '#b99a76', bufanda: e.CEIBO }), 92, 188, 92, 'c-salta')}`,
    laguna: (L, e) => `<g transform="scale(${300 / 480} ${200 / 300})">${sinSvg(e.escenaLaguna())}</g>
      ${[0, 1, 2].map((i) => `<ellipse cx="166" cy="158" rx="22" ry="6" fill="none" stroke="#e9f1ea" stroke-width="2" class="c-onda" ${d(i)}/>`).join('')}
      ${[0, 1, 2, 3].map((i) => `<g class="c-cae" ${d(i * 1.25)}>${e.florCeibo(80 + i * 16, 60, .35, 160)}</g>`).join('')}
      <ellipse cx="80" cy="150" rx="120" ry="14" fill="#e9f1ea" opacity=".35" class="c-niebla"/>
      <g class="c-repta">${figura('<svg viewBox="-40 -30 80 60">' + e.caracol(0, 0, 1) + '</svg>', 200, 178, 26)}</g>`,
    pueblito: (L, e) => `<rect width="300" height="200" fill="#e8cfa4"/><circle cx="58" cy="40" r="16" fill="#f2c66d" stroke="${L}" stroke-width="2.5"/>
      <path d="M0 150 C80 136 220 140 300 152 V200 H0Z" fill="#a9b77e" stroke="${L}" stroke-width="3"/>
      ${[[150, 150, '#efd9b6', '#c46a4a'], [206, 154, '#e3c79c', '#b07a52'], [250, 150, '#efd9b6', '#e8907a']].map(([x, y, c, t], i) => `<rect x="${x - 20}" y="${y - 36}" width="40" height="36" fill="${c}" stroke="${L}" stroke-width="2.5"/><path d="M${x - 25} ${y - 36} L${x} ${y - 58} L${x + 25} ${y - 36}Z" fill="${t}" stroke="${L}" stroke-width="2.5" stroke-linejoin="round"/><rect x="${x - 6}" y="${y - 26}" width="12" height="12" fill="#f2c66d" stroke="${L}" stroke-width="2" class="c-late" ${d(i * .8)}/>`).join('')}
      <path d="M44 150 C44 116 100 116 100 150Z" fill="#b07a52" stroke="${L}" stroke-width="3"/><path d="M62 150 C62 136 82 136 82 150Z" fill="#3b2a1e"/><path d="M90 124 v-14 h8 v18" fill="#8a5a3c" stroke="${L}" stroke-width="2.5"/>
      ${[0, 1, 2].map((i) => `<circle cx="94" cy="104" r="7" fill="#e9e3d6" stroke="${L}" stroke-width="2" class="c-humo" ${d(i * 1.1)}/>`).join('')}
      <rect x="26" y="112" width="6" height="40" fill="#8a6440" stroke="${L}" stroke-width="2.5"/>
      ${figura(e.hornero({}), 30, 116, 46, 'c-cabecea')}`,
    robledal: (L, e) => `<rect width="300" height="200" fill="#1f3326"/>${estrellas(14, 70)}
      <path d="M0 178 C100 168 200 170 300 180 V200 H0Z" fill="#2c4430" stroke="${L}" stroke-width="3"/>
      <path d="M138 180 C140 150 128 120 140 96 L156 96 C164 124 154 150 160 180Z" fill="#6b4a2f" stroke="${L}" stroke-width="3"/>
      <circle cx="150" cy="70" r="58" fill="#3f5f3a" stroke="${L}" stroke-width="3"/><circle cx="118" cy="58" r="26" fill="#4d7046"/><circle cx="182" cy="76" r="22" fill="#4d7046"/>
      ${Array.from({ length: 9 }, (_, i) => `<circle cx="${(30 + rnd() * 240).toFixed(0)}" cy="${(90 + rnd() * 80).toFixed(0)}" r="2.6" fill="#f2e98a" class="c-luciernaga" ${d(i * .7)}/>`).join('')}
      ${[0, 1].map((i) => `<ellipse cx="${120 + i * 60}" cy="40" rx="5" ry="3" fill="#9cb37f" stroke="${L}" stroke-width="1.5" class="c-cae" ${d(i * 2.5)}/>`).join('')}
      <text x="210" y="120" font-size="20" fill="#f2c66d" stroke="${L}" stroke-width="3" paint-order="stroke" class="c-flota">?</text>
      ${figura(e.ulises({ farol: true }), 92, 188, 80, 'c-flota')}<circle cx="122" cy="150" r="16" fill="#f2c66d" opacity=".25" class="c-late"/>`,
    cumbres: (L, e) => `<defs><linearGradient id="cgC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fb8cc"/><stop offset="1" stop-color="#dfe9ef"/></linearGradient></defs><rect width="300" height="200" fill="url(#cgC)"/>
      <path d="M0 160 L70 60 L120 130 L170 40 L240 120 L300 80 V200 H0Z" fill="#8aa2b8" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M52 86 L70 60 L86 82 L76 78 L66 88Z M152 66 L170 40 L190 70 L178 64 L166 74Z" fill="#f3f6ee" stroke="${L}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M0 170 C100 158 200 162 300 172 V200 H0Z" fill="#f3f6ee" stroke="${L}" stroke-width="3"/>
      ${Array.from({ length: 22 }, () => `<circle cx="${(rnd() * 320).toFixed(0)}" cy="0" r="${(1.5 + rnd() * 2).toFixed(1)}" fill="#fff" class="c-nieve" ${d((rnd() * 6).toFixed(2))}/>`).join('')}
      ${figura(e.chispa({ cuerpo: '#67948f', panza: '#dfebd6', cuerno: '#f2c66d', cresta: '#e8907a', ala: '#92afa1', humo: true }), 212, 186, 86, 'c-flota')}
      ${[0, 1].map((i) => `<circle cx="240" cy="116" r="6" fill="#bfc6c9" stroke="${L}" stroke-width="2" class="c-humo" ${d(i * 1.6)}/>`).join('')}`,
    umbria: (L, e) => `<defs><linearGradient id="cgU" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#140f24"/><stop offset="1" stop-color="#3a2b5c"/></linearGradient></defs><rect width="300" height="200" fill="url(#cgU)"/>${estrellas(16, 90)}
      <rect width="300" height="200" fill="#c9b6ff" class="c-rayo"/>
      <path d="M0 182 C100 170 200 172 300 184 V200 H0Z" fill="#241a3a" stroke="${L}" stroke-width="3"/>
      <rect x="124" y="58" width="52" height="128" rx="4" fill="#4a3870" stroke="${L}" stroke-width="3"/><path d="M114 60 L150 10 L186 60Z" fill="#1d1830" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>
      <rect x="140" y="80" width="20" height="26" rx="10" fill="#8a6fc9" stroke="${L}" stroke-width="2.5" class="c-late"/>
      <g class="c-gira" style="transform-origin:150px 110px">${Array.from({ length: 6 }, (_, i) => { const a = i / 6 * Math.PI * 2; return `<text x="${(150 + Math.cos(a) * 78).toFixed(0)}" y="${(110 + Math.sin(a) * 40).toFixed(0)}" font-size="14" fill="#c9b6ff" text-anchor="middle">${'ᚱᚢᚾᛖᛋᚹ'[i]}</text>`; }).join('')}</g>
      ${figura(UMBRIO(), 150, 124, 54, 'c-flota')}
      <g class="c-hamaca" style="transform-origin:250px 0px"><path d="M250 0 V92" stroke="#dfebd6" stroke-width="1.5"/>${figura(e.hilda(), 250, 140, 54)}</g>`,
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
  /** La escena de un capítulo como SVG (se arma una vez y se reusa). */
  function escena(id) {
    if (!cache[id]) {
      const e = E(), L = (e && e.L) || '#16262c';
      let cuerpo = '';
      try { cuerpo = e ? ESCENAS[id](L, e) : ''; } catch (err) { cuerpo = ''; }
      cache[id] = `<svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${cuerpo}</svg>`;
    }
    return cache[id];
  }

  window.WWCampanas = { CAPITULOS, escena };
})();
