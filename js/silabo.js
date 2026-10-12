/* Word Wizard · Silabo, el maguito. Dibujo en SVG (fuente única: lo usan el juego y lab/).
   Cada función devuelve un string SVG. */
(function () {
  const L = '#16262c';
  const C = { hat: '#2f7f7a', hatSh: '#22605c', band: '#f2c66d', beard: '#f3f6ee', beardSh: '#c8d7cc', strand: '#a9bdb2',
    nose: '#e8907a', noseHi: '#f8c9b8', skin: '#efb39d', robe: '#34507a', robeSh: '#28405f', hem: '#f2c66d',
    starRobe: '#f2c66d', shoe: '#5b3f6e', wood: '#7a5a3c', star: '#fff1bf' };

  function estrella(cx, cy, r) {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r;
      d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1);
    }
    return d + 'Z';
  }
  /* tonos planos derivados (técnica Ironhide: base, sombra y luz, sin degradados) */
  function mezclar(hex, otro, k) {
    const a = parseInt(hex.slice(1), 16), b = parseInt(otro.slice(1), 16);
    const c = (sh) => Math.round(((a >> sh) & 255) * (1 - k) + ((b >> sh) & 255) * k);
    return '#' + ((1 << 24) + (c(16) << 16) + (c(8) << 8) + c(0)).toString(16).slice(1);
  }
  const luz = (hex, k) => mezclar(hex, '#ffffff', k == null ? .22 : k);
  const somb = (hex, k) => mezclar(hex, '#16262c', k == null ? .22 : k);
  let idClip = 0;
  let P = false; // pulido activo durante el render
  let ADORNO = null; // accesorio de los trajes especiales (flor, sol, pompon, calabaza, mate)

  /** Accesorios que van sobre el sombrero (en sus coordenadas: giran con él). */
  function adornoSombrero() {
    if (ADORNO === 'flor') {   // flor de ceibo en la banda: estandarte hacia atrás y quilla hacia adelante
      return `<g transform="translate(70 110) rotate(-14) scale(.78)">${S('M2 -6 C14 -14 26 -30 26 -48 C18 -42 10 -30 -1 -18Z', '#9e3346', 3.4)}${S('M-2 -8 C-16 -16 -26 -32 -20 -46 C-12 -44 -4 -34 -1 -22 C0 -16 0 -12 -2 -8Z', '#c9485b', 3.4)}<path d="M-16 -40 C-14 -30 -8 -22 -3 -15" stroke="#e57a89" stroke-width="2.6" fill="none" stroke-linecap="round"/>${S('M-4 0 C-6 -6 -4 -11 0 -12 C5 -11 6 -6 3 0Z', '#4f7a3a', 2.6)}</g>`;
    }
    if (ADORNO === 'sol') {   // sol de mayo dorado, tapa la hebilla de la banda
      let rayos = '';
      for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, r1 = 8.5, r2 = i % 2 ? 12 : 14; rayos += `M${(99 + Math.cos(a) * r1).toFixed(1)} ${(107 + Math.sin(a) * r1).toFixed(1)} L${(99 + Math.cos(a) * r2).toFixed(1)} ${(107 + Math.sin(a) * r2).toFixed(1)} `; }
      return `<g transform="translate(99 107) scale(1.3) translate(-99 -107)"><path d="${rayos}" stroke="${L}" stroke-width="5" stroke-linecap="round"/><path d="${rayos}" stroke="#f2c66d" stroke-width="2.4" stroke-linecap="round"/><circle cx="99" cy="107" r="8" fill="#f2c66d" stroke="${L}" stroke-width="3"/><circle cx="97" cy="105" r="2.6" fill="#ffe6a8"/></g>`;
    }
    if (ADORNO === 'pompon') {   // pompón de algodón en la punta (Navidad)
      return `<circle cx="101" cy="9" r="9" fill="#f3f6ee" stroke="${L}" stroke-width="3.6"/><circle cx="98" cy="6" r="3" fill="#ffffff"/><path d="M106 12 C104 15 100 16 97 15" stroke="#d7dfd6" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    }
    if (ADORNO === 'calabaza') {   // calabacita en la banda
      return `<g transform="translate(68 106) scale(1.35)">${S('M-9 2 C-12 -6 -6 -10 0 -9 C6 -10 12 -6 9 2 C7 7 -7 7 -9 2Z', '#e8902f', 3)}<path d="M-3 -8 C-5 -2 -4 4 -2 6 M3 -8 C5 -2 4 4 2 6" stroke="#b46a1f" stroke-width="1.8" fill="none"/>${S('M0 -9 C0 -13 2 -15 4 -16', 'none', 2.6)}</g>`;
    }
    return '';
  }
  /** El mate en la mano libre (Matecito): calabacita con bombilla plateada. */
  function adornoCuerpo() {
    if (ADORNO !== 'mate') return '';
    return `<g transform="translate(56 196)">
      <path d="M8 -26 L2 -6" stroke="${L}" stroke-width="6" stroke-linecap="round"/><path d="M8 -26 L2 -6" stroke="#cfd6dc" stroke-width="2.8" stroke-linecap="round"/>
      ${S('M-12 -6 C-14 6 -8 16 0 16 C8 16 14 6 12 -6 C8 -10 -8 -10 -12 -6Z', '#8a6440', 3.4)}
      ${S('M-12 -6 C-8 -11 8 -11 12 -6 C8 -3 -8 -3 -12 -6Z', '#4f7a3a', 2.6)}
      <path d="M-7 2 C-7 8 -4 12 0 13" stroke="#a5835a" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M-14 4 C-20 4 -22 12 -16 14" stroke="${L}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M-14 4 C-20 4 -22 12 -16 14" stroke="${C.skin}" stroke-width="3.6" fill="none" stroke-linecap="round"/>
    </g>`;
  }
  /* ---------- Estilo de los trajes (o.estilo): diseño propio, no solo color. Todo es opcional:
     { forma, barbaFin, sombrero: 'hojas'|'franjas'|'corona'|'gema'|'nube'|'aurora'|'lunares'|'llama'|'luna'|'runas',
       motivo: 'hojas'|'franjas'|'armino'|'runas'|'nubes'|'ondas'|'lunares'|'llamas'|'constelacion', tonos: [c1, c2],
       capa: color, bufanda: [color, raya], anteojos: color, mano: 'libro'|'farol'|'hongo', punta: 'hoja'|'sol'|'orbe'|'cristal'|'llama'|'luna',
       barba: 'bifida'|'rulos' (corte), barbaExtra: 'trenza'|'cuentas'|'rulos', metal: color, bigote: 'manubrio', nariz: radio (19 = normal), pecas: true }
     La esencia no se toca: barba blanca y nariz redonda. El tono de la nariz va en los colores (nose, noseHi). */
  let EST = null;
  const hojaD = 'M0 -8 C6 -4 6 4 0 9 C-6 4 -6 -4 0 -8Z';
  const hoja = (x, y, rot, k, fill) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${k})"><path d="${hojaD}" fill="${fill}" stroke="${L}" stroke-width="${(2.2 / k).toFixed(2)}" stroke-linejoin="round"/><path d="M0 -5 L0 7" stroke="${somb(fill, .3)}" stroke-width="${(1.4 / k).toFixed(2)}" stroke-linecap="round"/></g>`;
  const RUNAS = ['M0 -6 L0 6 M0 -6 L4 -2 L0 1 L4 6', 'M-3 -6 L3 6 M3 -6 L-3 6', 'M0 -6 L0 6 M-4 -3 L0 0 L4 -3', 'M-3 6 L-3 -6 L3 -2 L-3 2', 'M0 -6 L0 6 M0 -2 L4 -6 M0 2 L4 6', 'M-3 -6 L3 -6 L-3 6 L3 6'];
  const runa = (x, y, i, color, w) => `<path transform="translate(${x} ${y})" d="${RUNAS[i % RUNAS.length]}" stroke="${color}" stroke-width="${w || 2.2}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  const nubeD = (x, y, k) => `M${x - 12 * k} ${y + 5 * k} C${x - 17 * k} ${y + 5 * k} ${x - 17 * k} ${y - 3 * k} ${x - 11 * k} ${y - 3 * k} C${x - 10 * k} ${y - 10 * k} ${x - 1 * k} ${y - 11 * k} ${x + 2 * k} ${y - 5 * k} C${x + 7 * k} ${y - 9 * k} ${x + 14 * k} ${y - 5 * k} ${x + 12 * k} ${y + 1 * k} C${x + 17 * k} ${y + 2 * k} ${x + 16 * k} ${y + 6 * k} ${x + 12 * k} ${y + 6 * k} Z`;
  const tono = (i, def) => (EST && EST.tonos && EST.tonos[i]) || def;

  /** Lo que lleva el sombrero encima de la tela (va dentro del grupo que gira). */
  function decoSombrero(fm) {
    const s = EST && EST.sombrero; if (!s) return '';
    const id = 'sbd' + (++idClip), recorte = `<clipPath id="${id}"><path d="${fm.cono}"/></clipPath>`;
    const dentro = (svg) => `${recorte}<g clip-path="url(#${id})">${svg}</g>`;
    if (s === 'lunares') {
      const pts = fm.hongo ? [[64, 98, 9], [98, 60, 11], [134, 86, 9], [104, 102, 6], [78, 70, 6], [124, 56, 5], [152, 106, 6], [44, 108, 5]] : [[74, 100, 8], [100, 66, 8], [126, 98, 7], [94, 40, 5], [80, 76, 5], [118, 78, 5]];
      return dentro(pts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#f6efe0" stroke="${L}" stroke-width="2.6"/>`).join(''));
    }
    if (s === 'franjas') return dentro(`<path d="M20 52 Q100 44 180 52 L180 64 Q100 56 20 64Z" fill="${tono(0, '#ffd28a')}"/><path d="M20 74 Q100 66 180 74 L180 82 Q100 74 20 82Z" fill="${tono(1, '#f2a14a')}"/><path d="M20 30 Q100 24 180 30 L180 36 Q100 30 20 36Z" fill="${tono(0, '#ffd28a')}" opacity=".7"/>`);
    if (s === 'aurora') return dentro(`<path d="M30 66 Q50 54 70 66 T110 66 T150 66 T190 66" stroke="${tono(0, '#7fd6c2')}" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M30 86 Q50 74 70 86 T110 86 T150 86 T190 86" stroke="${tono(1, '#c9b6ff')}" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M60 40 Q74 32 88 40 T116 40" stroke="${tono(1, '#c9b6ff')}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>`);
    if (s === 'runas') return dentro(`<path d="M30 80 Q100 72 170 80" stroke="${C.band}" stroke-width="2" fill="none"/><path d="M30 94 Q100 86 170 94" stroke="${C.band}" stroke-width="2" fill="none"/>${[64, 80, 96, 112, 128].map((x, i) => runa(x, 87 - (x > 100 ? (x - 100) * -0.02 : 0), i, C.band, 2)).join('')}`);
    if (s === 'llama') {
      const brasas = dentro([[70, 100, 3], [88, 88, 2.4], [120, 96, 2.8], [108, 70, 2], [134, 104, 2.2]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#f2a14a"/>`).join(''));
      const [tx, ty] = fm.punta || [101, 8];
      return `${brasas}<g transform="translate(${tx} ${ty})">${S('M0 6 C-14 2 -12 -14 -3 -28 C-2 -18 3 -16 6 -22 C16 -10 14 4 0 6Z', '#f2a14a', 3.6)}<path d="M0 2 C-6 -1 -5 -9 -1 -15 C1 -9 5 -7 5 -4 C6 0 3 2 0 2Z" fill="#ffe08a"/></g>`;
    }
    if (s === 'luna') {
      const [cx, cy] = fm.estrella || [100, 74];
      const motas = [[cx - 26, cy + 18, 2.4], [cx + 18, cy - 26, 2], [cx + 22, cy + 22, 1.8], [cx - 12, cy - 30, 1.6]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.starRobe}"/>`).join('');
      return `${dentro(motas)}<path d="M${cx + 3} ${cy - 15} A15 15 0 0 0 ${cx + 3} ${cy + 15} A19 19 0 0 1 ${cx + 3} ${cy - 15}Z" fill="${C.star}" stroke="${L}" stroke-width="2.6" stroke-linejoin="round"/>`;
    }
    if (s === 'hojas') {
      return `<g transform="translate(64 100)">${hoja(-6, -14, -48, 2.1, '#7fae5a')}${hoja(6, -18, -8, 1.9, '#5f9a4a')}${hoja(14, -8, 34, 1.5, '#8fbe6a')}<circle cx="-1" cy="-2" r="3.6" fill="#c9485b" stroke="${L}" stroke-width="2"/><circle cx="6" cy="0" r="3.2" fill="#c9485b" stroke="${L}" stroke-width="2"/></g>`;
    }
    if (s === 'nube') return `<path d="${nubeD(132, 70, 1.1)}" fill="#f3f6ee" stroke="${L}" stroke-width="3" stroke-linejoin="round"/><path d="${nubeD(62, 86, .8)}" fill="#f3f6ee" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>`;
    return '';
  }
  /** Lo que va sobre la banda (corona, gema). */
  function decoBanda() {
    const s = EST && EST.sombrero;
    if (s === 'corona') {
      const pts = 'M50 104 L54 82 L66 96 L78 76 L89 94 L100 70 L111 94 L122 76 L134 96 L146 82 L150 104 Z';
      const gemas = [[54, 82, '#c9485b'], [78, 76, '#75aadb'], [100, 70, '#c9485b'], [122, 76, '#75aadb'], [146, 82, '#c9485b']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="4" fill="${c}" stroke="${L}" stroke-width="2.2"/>`).join('');
      return `${S(pts, '#f2c66d', 4)}<path d="M56 100 L60 88 M98 94 L100 80" stroke="#fff1bf" stroke-width="2" stroke-linecap="round"/>${gemas}`;
    }
    if (s === 'gema') return `${S('M99 96 L108 106 L99 118 L90 106 Z', '#c9485b', 3)}<path d="M99 99 L104 106 L99 106 Z" fill="#f2a0ac"/>`;
    return '';
  }
  /** Motivo de la túnica (en lugar de las estrellas). */
  function motivoTunica(b, yTop, yHem, forma) {
    const m = EST && EST.motivo; if (!m) return null;
    const id = 'sbm' + (++idClip), dentro = (svg) => `<clipPath id="${id}"><path d="${forma}"/></clipPath><g clip-path="url(#${id})">${svg}</g>`;
    const c = C.starRobe, h = yHem;
    if (m === 'hojas') return hoja(100 - b + 16, h - 16, -34, 1.3, c) + hoja(100 - b + 40, h - 20, 22, 1.15, c) + hoja(100 + b - 40, h - 18, -18, 1.15, c) + hoja(100 + b - 16, h - 14, 32, 1.3, c) + hoja(100 - b + 26, h - 40, 8, .9, c) + hoja(100 + b - 24, h - 42, -10, .9, c);
    if (m === 'franjas') return dentro(`<path d="M20 ${h - 34} Q100 ${h - 42} 180 ${h - 34} L180 ${h - 26} Q100 ${h - 34} 20 ${h - 26}Z" fill="${tono(0, c)}"/><path d="M20 ${h - 22} Q100 ${h - 30} 180 ${h - 22} L180 ${h - 16} Q100 ${h - 24} 20 ${h - 16}Z" fill="${tono(1, c)}"/>`);
    if (m === 'armino') return [56, 72, 88, 104, 120, 136].map((x) => `<path d="M${x} ${h - 10} l0 6 M${x - 2.4} ${h - 3} l2.4 -2.4 l2.4 2.4" stroke="${L}" stroke-width="2" fill="none" stroke-linecap="round"/>`).join('');
    if (m === 'runas') return `<path d="M${100 - b + 8} ${h - 28} Q100 ${h - 36} ${100 + b - 8} ${h - 28}" stroke="${c}" stroke-width="2" fill="none"/>` + [0, 1, 2, 3, 4, 5].map((i) => runa(100 - b + 20 + i * ((2 * b - 40) / 5), h - 18 + Math.abs(i - 2.5) * -1.2, i, c, 2.2)).join('');
    if (m === 'nubes') return `<path d="${nubeD(100 - b + 22, h - 22, .85)}" fill="${c}" stroke="${L}" stroke-width="2.4" stroke-linejoin="round"/><path d="${nubeD(100 + b - 20, h - 36, .7)}" fill="${c}" stroke="${L}" stroke-width="2.4" stroke-linejoin="round"/>`;
    if (m === 'ondas') return dentro(`<path d="M20 ${h - 30} Q35 ${h - 40} 50 ${h - 30} T80 ${h - 30} T110 ${h - 30} T140 ${h - 30} T170 ${h - 30}" stroke="${tono(0, c)}" stroke-width="6" fill="none"/><path d="M20 ${h - 46} Q35 ${h - 56} 50 ${h - 46} T80 ${h - 46} T110 ${h - 46} T140 ${h - 46} T170 ${h - 46}" stroke="${tono(1, c)}" stroke-width="4" fill="none"/>`) + est(100 + b - 16, h - 18, 3.6) + est(100 - b + 30, h - 58, 3);
    if (m === 'lunares') return dentro([[60, h - 18, 6], [84, h - 30, 4.5], [112, h - 20, 6.5], [138, h - 34, 5], [70, h - 50, 4], [128, h - 58, 3.6], [100, h - 44, 3.4]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`).join(''));
    if (m === 'llamas') {
      let d = `M20 ${h + 8}`, d2 = `M20 ${h + 8}`;
      for (let x = 20; x < 180; x += 16) { const alto = 22 + ((x * 7) % 13); d += ` L${x} ${h - 6} Q${x + 4} ${h - alto} ${x + 8} ${h - 8} Q${x + 12} ${h - alto + 8} ${x + 16} ${h - 6}`; d2 += ` L${x} ${h - 2} Q${x + 4} ${h - alto + 10} ${x + 8} ${h - 4} Q${x + 12} ${h - alto + 16} ${x + 16} ${h - 2}`; }
      return dentro(`<path d="${d} L180 ${h + 8} Z" fill="${tono(0, '#e8742f')}"/><path d="${d2} L180 ${h + 8} Z" fill="${tono(1, '#f2c66d')}"/>`) + [[70, h - 46], [126, h - 52], [100, h - 62]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#f2a14a"/>`).join('');
    }
    if (m === 'constelacion') {
      const p = [[100 - b + 14, h - 14], [100 - b + 28, h - 32], [100 - b + 48, h - 18], [100 + b - 44, h - 16], [100 + b - 28, h - 34], [100 + b - 14, h - 14]];
      return `<path d="M${p[0]} L${p[1]} L${p[2]} M${p[3]} L${p[4]} L${p[5]}" stroke="${c}" stroke-width="1.6" opacity=".75" fill="none"/>` + p.map(([x, y], i) => (i % 2 ? `<circle cx="${x}" cy="${y}" r="2.2" fill="${c}"/>` : est(x, y, 4.2))).join('');
    }
    return null;
  }
  /** Capa: va detrás de todo el cuerpo. */
  function capa() {
    const c = EST && EST.capa; if (!c) return '';
    return `${S('M76 146 C58 170 40 206 26 238 Q100 252 174 238 C160 206 142 170 124 146 Z', c, 5)}${F('M124 146 C142 170 160 206 174 238 Q164 243 150 245 C142 206 132 172 116 150 Z', somb(c, .2))}${F('M76 146 C62 168 48 200 36 232 L46 234 C56 202 68 172 84 150 Z', luz(c, .14))}`;
  }
  /** Bufanda: la vuelta queda tapada por la barba; se ve la punta flameando a la izquierda. */
  function bufanda() {
    const b = EST && EST.bufanda; if (!b) return '';
    const [c, raya] = b;
    const forma = 'M72 146 C58 150 46 160 38 176 L30 196 L46 200 L50 184 C56 172 64 164 76 160 Z';
    const id = 'sbf' + (++idClip);
    return `${S(forma, c, 4.5)}<clipPath id="${id}"><path d="${forma}"/></clipPath><g clip-path="url(#${id})"><path d="M20 180 L60 166 M16 190 L56 176" stroke="${raya}" stroke-width="4"/></g>
      <path d="M32 197 l-2 7 M37 198 l-1 7 M42 199 l0 7" stroke="${c}" stroke-width="3" stroke-linecap="round"/><path d="M32 197 l-2 7 M37 198 l-1 7 M42 199 l0 7" stroke="${L}" stroke-width="1" stroke-linecap="round" opacity=".5"/>`;
  }
  /** Anteojitos sobre la nariz (debajo del ala). */
  function anteojos() {
    const c = EST && EST.anteojos; if (!c) return '';
    return `<g><path d="M90 133 Q98 128 106 133" stroke="${L}" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M90 133 Q98 128 106 133" stroke="${c}" stroke-width="2" fill="none" stroke-linecap="round"/>
      <circle cx="81" cy="136" r="9" fill="#dfeef0" fill-opacity=".45" stroke="${L}" stroke-width="4.5"/><circle cx="81" cy="136" r="9" fill="none" stroke="${c}" stroke-width="2"/>
      <circle cx="115" cy="136" r="9" fill="#dfeef0" fill-opacity=".45" stroke="${L}" stroke-width="4.5"/><circle cx="115" cy="136" r="9" fill="none" stroke="${c}" stroke-width="2"/>
      <path d="M77 132 l4 -2" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/><path d="M111 132 l4 -2" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/></g>`;
  }
  /** Algo en la mano libre (la izquierda), como el mate del Matecito. */
  function enLaMano() {
    const m = EST && EST.mano; if (!m) return '';
    const mano = `<path d="M-14 4 C-20 4 -22 12 -16 14" stroke="${L}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M-14 4 C-20 4 -22 12 -16 14" stroke="${C.skin}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`;
    let obj = '';
    if (m === 'libro') obj = `${S('M-16 -16 L10 -20 L15 6 L-11 10 Z', '#7a2a3e', 3.4)}${F('M-11 10 L15 6 L15 9 L-10 13 Z', '#f3e9cf')}<path d="M-11 10 L15 6 L15 9 L-10 13 Z" fill="none" stroke="${L}" stroke-width="2.4" stroke-linejoin="round"/><circle cx="0" cy="-5" r="4.5" fill="none" stroke="#f2c66d" stroke-width="2.2"/><path d="M-3 -5 L3 -5 M0 -8 L0 -2" stroke="#f2c66d" stroke-width="1.6"/>`;
    if (m === 'farol') obj = `<path d="M-6 -24 Q0 -32 6 -24" stroke="${L}" stroke-width="3" fill="none"/><circle cx="0" cy="-2" r="16" fill="#ffe08a" opacity=".22"/>${S('M-8 -22 L8 -22 L6 -17 L-6 -17 Z', '#2b2f45', 2.6)}${S('M-7 -17 L7 -17 L8 6 L-8 6 Z', '#ffe08a', 3)}<path d="M0 -14 L0 4 M-4 -15 L-5 5 M4 -15 L5 5" stroke="#c49a42" stroke-width="1.6"/>${S('M-10 6 L10 6 L8 11 L-8 11 Z', '#2b2f45', 2.6)}`;
    if (m === 'hongo') obj = `${S('M-4 -6 C-5 2 -5 8 -3 12 L4 12 C5 8 5 2 4 -6 Z', '#efe3c8', 3)}${S('M-15 -6 C-14 -18 14 -18 15 -6 C8 -3 -8 -3 -15 -6 Z', '#d9574a', 3.2)}<circle cx="-6" cy="-11" r="2.4" fill="#f6efe0"/><circle cx="5" cy="-13" r="2" fill="#f6efe0"/><circle cx="9" cy="-8" r="1.6" fill="#f6efe0"/>`;
    return `<g transform="translate(56 196)">${obj}${mano}</g>`;
  }
  /** La punta de la varita: estrella (siempre) o la del traje. */
  function puntaVarita(x, y, r) {
    const p = EST && EST.punta, X = (v) => (x + v * r).toFixed(1), Y = (v) => (y + v * r).toFixed(1);
    if (p === 'hoja') return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(28) scale(${(r / 7).toFixed(2)})"><path d="${hojaD}" fill="#7fae5a" stroke="${L}" stroke-width="${(3 / (r / 7)).toFixed(2)}" stroke-linejoin="round"/><path d="M0 -5 L0 7" stroke="#4f7a3a" stroke-width="1.4"/></g>`;
    if (p === 'sol') {
      let rayos = ''; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; rayos += `M${X(Math.cos(a) * .7)} ${Y(Math.sin(a) * .7)} L${X(Math.cos(a) * 1.25)} ${Y(Math.sin(a) * 1.25)} `; }
      return `<path d="${rayos}" stroke="${L}" stroke-width="5" stroke-linecap="round"/><path d="${rayos}" stroke="#ffd28a" stroke-width="2.4" stroke-linecap="round"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r * .7).toFixed(1)}" fill="#ffd28a" stroke="${L}" stroke-width="3"/>`;
    }
    if (p === 'orbe') return `<path d="M${X(-.7)} ${Y(.5)} Q${X(0)} ${Y(1.2)} ${X(.7)} ${Y(.5)}" stroke="${L}" stroke-width="4" fill="none"/><path d="M${X(-.7)} ${Y(.5)} Q${X(0)} ${Y(1.2)} ${X(.7)} ${Y(.5)}" stroke="#f2c66d" stroke-width="2" fill="none"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r * .8).toFixed(1)}" fill="${C.star}" stroke="${L}" stroke-width="3"/><circle cx="${X(-.25)}" cy="${Y(-.28)}" r="${(r * .22).toFixed(1)}" fill="#ffffff"/>`;
    if (p === 'cristal') return `<path d="M${X(0)} ${Y(-1.5)} L${X(.62)} ${Y(-.3)} L${X(0)} ${Y(.9)} L${X(-.62)} ${Y(-.3)} Z" fill="${C.star}" stroke="${L}" stroke-width="3" stroke-linejoin="round"/><path d="M${X(0)} ${Y(-1.5)} L${X(.62)} ${Y(-.3)} L${X(0)} ${Y(-.1)} Z" fill="#ffffff" opacity=".55"/>`;
    if (p === 'llama') return `<path d="M${X(0)} ${Y(.8)} C${X(-1)} ${Y(.5)} ${X(-.8)} ${Y(-.6)} ${X(-.1)} ${Y(-1.5)} C${X(.1)} ${Y(-.8)} ${X(.4)} ${Y(-.7)} ${X(.5)} ${Y(-1)} C${X(1.1)} ${Y(-.2)} ${X(.9)} ${Y(.6)} ${X(0)} ${Y(.8)} Z" fill="#f2a14a" stroke="${L}" stroke-width="3" stroke-linejoin="round"/><path d="M${X(0)} ${Y(.5)} C${X(-.45)} ${Y(.3)} ${X(-.35)} ${Y(-.3)} ${X(0)} ${Y(-.8)} C${X(.2)} ${Y(-.3)} ${X(.45)} ${Y(0)} ${X(0)} ${Y(.5)} Z" fill="#ffe08a"/>`;
    if (p === 'luna') return `<path d="M${X(.25)} ${Y(-1)} A${r.toFixed(1)} ${r.toFixed(1)} 0 0 0 ${X(.25)} ${Y(1)} A${(r * 1.3).toFixed(1)} ${(r * 1.3).toFixed(1)} 0 0 1 ${X(.25)} ${Y(-1)} Z" fill="${C.star}" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>`;
    return `<path d="${estrella(x, y, r)}" fill="${C.star}" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>${P ? `<path d="${estrella(x - r * .1, y - r * .12, r * .42)}" fill="#ffffff"/>` : ''}`;
  }

  const S = (d, fill, w) =>`<path d="${d}" fill="${fill}" stroke="${L}" stroke-width="${w || 5.5}" stroke-linejoin="round" stroke-linecap="round"/>`;
  const F = (d, fill, op) => `<path d="${d}" fill="${fill}" ${op ? `opacity="${op}"` : ''}/>`;
  const est = (x, y, r, fill) => `<path d="${estrella(x, y, r)}" fill="${fill || C.starRobe}" stroke="${L}" stroke-width="2.2" stroke-linejoin="round"/>`;

  /* La varita crece con el progreso. etapa 0..3 */
  const ETAPAS = [
    { largo: 20, r: 6, nombre: 'Ramita', cuando: 'al empezar' },
    { largo: 32, r: 8, nombre: 'Varita', cuando: 'nivel 5' },
    { largo: 50, r: 11, nombre: 'Vara', cuando: 'nivel 10' },
    { largo: 84, r: 15, nombre: 'Báculo', cuando: 'nivel 20' },
  ];

  /* mano + varita: sale de la barba; el brazo casi no se ve */
  function manoVarita(hx, hy, etapa, angulo, escala) {
    const k = escala || 1, base = ETAPAS[etapa];
    const e = { largo: base.largo * k, r: base.r * Math.sqrt(k) };
    const a = (angulo == null ? -62 : angulo) * Math.PI / 180;
    const x2 = hx + Math.cos(a) * e.largo, y2 = hy + Math.sin(a) * e.largo;
    return `<g class="brazo" style="transform-origin:${hx}px ${hy}px">
      <path d="M${hx} ${hy} L${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="${L}" stroke-width="8" stroke-linecap="round"/>
      <path d="M${hx} ${hy} L${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="${C.wood}" stroke-width="3.6" stroke-linecap="round"/>
      ${P ? detalleVarita(hx, hy, x2, y2, e.largo) : ''}
      <circle class="glow" cx="${x2.toFixed(1)}" cy="${y2.toFixed(1)}" r="${e.r * 1.9}" fill="#fff6cf" opacity=".35"/>
      ${puntaVarita(x2, y2, e.r)}
      <circle cx="${hx}" cy="${hy}" r="7.5" fill="${C.skin}" stroke="${L}" stroke-width="4.5"/>
      ${P ? `<circle cx="${hx - 2.2}" cy="${hy - 2.4}" r="2.2" fill="${luz(C.skin, .45)}"/>` : ''}</g>`;
  }

  function detalleVarita(hx, hy, x2, y2, largo) {
    const ux = (x2 - hx) / largo, uy = (y2 - hy) / largo, px = -uy, py = ux;
    const pt = (t, off) => [(hx + ux * t + px * off).toFixed(1), (hy + uy * t + py * off).toFixed(1)];
    const [a1, b1] = pt(5, -.9), [a2, b2] = pt(largo - 5, -.9);
    const nudos = [.45, .72].map((t) => { const [nx, ny] = pt(largo * t, 0); return `<circle cx="${nx}" cy="${ny}" r="1.6" fill="${somb(C.wood, .35)}"/>`; }).join('');
    const [g1, h1] = pt(8, 0), [g2, h2] = pt(14, 0);
    return `<path d="M${a1} ${b1} L${a2} ${b2}" stroke="${luz(C.wood, .3)}" stroke-width="1.3" stroke-linecap="round"/>${nudos}
      <path d="M${g1} ${h1} L${g2} ${h2}" stroke="${L}" stroke-width="7.5"/><path d="M${g1} ${h1} L${g2} ${h2}" stroke="${C.band}" stroke-width="4.2"/>`;
  }

  /* piecitos chiquitos, justo debajo del ruedo, con la puntita apenas enroscada */
  function piecitos(yHem, sep, tam) {
    const s = sep || 9, t = tam || 1;
    const uno = (x, d) => `<path d="M${x} ${yHem - 4} C${x + d * 2} ${yHem + 8} ${x - d * 6} ${yHem + 12} ${x - d * 15} ${yHem + 11} C${x - d * 21} ${yHem + 10} ${x - d * 23} ${yHem + 5} ${x - d * 21} ${yHem + 2} C${x - d * 19} ${yHem} ${x - d * 17} ${yHem + 2} ${x - d * 17} ${yHem + 4} C${x - d * 12} ${yHem + 5} ${x - d * 6} ${yHem + 2} ${x - d * 2} ${yHem - 4} Z" fill="${C.shoe}" stroke="${L}" stroke-width="4" stroke-linejoin="round"/>
      ${P ? `<path d="M${x - d * 3} ${yHem} C${x - d * 7} ${yHem + 4} ${x - d * 12} ${yHem + 5} ${x - d * 16} ${yHem + 4}" stroke="${luz(C.shoe, .3)}" stroke-width="2" stroke-linecap="round" fill="none"/>` : ''}
      <circle cx="${x - d * 20}" cy="${yHem + 1}" r="2.6" fill="${C.hem}" stroke="${L}" stroke-width="1.8"/>`;
    const esc = (x, svg) => `<g transform="translate(${x} ${yHem}) scale(${t}) translate(${-x} ${-yHem})">${svg}</g>`;
    return esc(100 - s, uno(100 - s, 1)) + esc(100 + s, uno(100 + s, -1));
  }

  /* túnica angosta en campana */
  function tunica(b, yTop, yHem) {
    const motivo = motivoTunica(b, yTop, yHem, `M80 ${yTop} L120 ${yTop} C132 ${yTop + 26} ${100 + b - 6} ${yHem - 26} ${100 + b} ${yHem - 3} Q100 ${yHem + 7} ${100 - b} ${yHem - 3} C${100 - b + 6} ${yHem - 26} 68 ${yTop + 26} 80 ${yTop} Z`);
    if (P) {
      const forma = `M80 ${yTop} L120 ${yTop} C132 ${yTop + 26} ${100 + b - 6} ${yHem - 26} ${100 + b} ${yHem - 3} Q100 ${yHem + 7} ${100 - b} ${yHem - 3} C${100 - b + 6} ${yHem - 26} 68 ${yTop + 26} 80 ${yTop} Z`;
      const id = 'sbt' + (++idClip);
      return `${S(forma, C.robe)}<clipPath id="${id}"><path d="${forma}"/></clipPath>
        <path clip-path="url(#${id})" d="M60 ${yTop} L86 ${yTop} C78 ${yTop + 30} ${100 - b + 20} ${yHem - 30} ${100 - b + 18} ${yHem + 6} L${100 - b - 10} ${yHem + 6} Z" fill="${luz(C.robe, .14)}"/>
        ${F(`M110 ${yTop} L120 ${yTop} C132 ${yTop + 26} ${100 + b - 6} ${yHem - 26} ${100 + b} ${yHem - 3} Q${100 + b / 2} ${yHem + 3} 114 ${yHem + 2} C118 ${yHem - 30} 116 ${yTop + 30} 110 ${yTop} Z`, C.robeSh)}
        ${S(`M${100 - b + 2} ${yHem - 8} Q100 ${yHem + 2} ${100 + b - 2} ${yHem - 8} L${100 + b} ${yHem - 3} Q100 ${yHem + 7} ${100 - b} ${yHem - 3} Z`, C.hem, 4)}
        <path d="M${100 - b + 8} ${yHem - 6.5} Q100 ${yHem + .5} ${100 + b - 8} ${yHem - 6.5}" stroke="${luz(C.hem, .4)}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        ${motivo != null ? motivo : `${est(100 - b + 16, yHem - 20, 5.5)}${est(100 + b - 14, yHem - 26, 4.5)}${est(100 - b + 28, yHem - 40, 4)}
        <circle cx="${100 + b - 22}" cy="${yHem - 44}" r="2" fill="${C.starRobe}"/><circle cx="${100 - b + 22}" cy="${yHem - 58}" r="1.6" fill="${C.starRobe}"/>`}`;
    }
    return `${S(`M80 ${yTop} L120 ${yTop} C132 ${yTop + 26} ${100 + b - 6} ${yHem - 26} ${100 + b} ${yHem - 3} Q100 ${yHem + 7} ${100 - b} ${yHem - 3} C${100 - b + 6} ${yHem - 26} 68 ${yTop + 26} 80 ${yTop} Z`, C.robe)}
      ${F(`M110 ${yTop} L120 ${yTop} C132 ${yTop + 26} ${100 + b - 6} ${yHem - 26} ${100 + b} ${yHem - 3} Q${100 + b / 2} ${yHem + 3} 114 ${yHem + 2} C118 ${yHem - 30} 116 ${yTop + 30} 110 ${yTop} Z`, C.robeSh)}
      ${S(`M${100 - b + 2} ${yHem - 8} Q100 ${yHem + 2} ${100 + b - 2} ${yHem - 8} L${100 + b} ${yHem - 3} Q100 ${yHem + 7} ${100 - b} ${yHem - 3} Z`, C.hem, 4)}
      ${motivo != null ? motivo : `${est(100 - b + 16, yHem - 20, 5.5)}${est(100 + b - 14, yHem - 26, 4.5)}${est(100 - b + 28, yHem - 40, 4)}
      <circle cx="${100 + b - 22}" cy="${yHem - 44}" r="2" fill="${C.starRobe}"/>`}`;
  }

  /* barba de C2: punta barrida hacia adelante. redonda=true la hace más suave (más tierna) */
  function barba(y, ancho, redonda) {
    const a = ancho || 0;
    if (P && redonda) {
      const contorno = `M${54 - a} 118 C${44 - a} 158 ${54 - a} ${y - 6} 70 ${y - 2} Q77 ${y + 9} 86 ${y + 3} Q93 ${y + 11} 100 ${y + 5} Q107 ${y + 11} 114 ${y + 3} Q123 ${y + 9} 130 ${y - 2} C${146 + a} ${y - 6} ${156 + a} 158 ${146 + a} 118 Z`;
      const id = 'sbb' + (++idClip);
      const base = C.beard === BASE.beard ? '#eaf1e6' : C.beard;
      return `<g class="barba"><clipPath id="${id}"><path d="${contorno}"/></clipPath>${S(contorno, base)}
        <g clip-path="url(#${id})">
          <path d="M128 118 C142 150 140 ${y - 18} 122 ${y + 16} L172 ${y + 16} L172 118 Z" fill="${C.beardSh}"/>
          <path d="M40 118 C52 126 62 150 64 178 C58 152 54 134 40 130 Z" fill="#ffffff"/>
        </g>
        <path d="M78 156 C82 ${y - 30} 88 ${y - 16} 96 ${y - 6} M100 162 C100 ${y - 34} 104 ${y - 18} 112 ${y - 8} M121 156 C123 172 123 ${y - 26} 121 ${y - 14}" stroke="${somb(C.beardSh, .12)}" stroke-width="2.4" stroke-linecap="round" fill="none"/></g>`;
    }
    const corte = EST && EST.barba;
    const fondo = redonda && corte === 'bifida' ? `${64 - a} ${y} 84 ${y + 9} Q93 ${y + 12} 100 ${y + 1} Q107 ${y + 12} 116 ${y + 9} C${136 + a} ${y} ${156 + a} 160 ${146 + a} 118 Z`
      : redonda && corte === 'rulos' ? `${54 - a} ${y - 6} 68 ${y - 1} Q74 ${y + 10} 84 ${y + 4} Q92 ${y + 13} 100 ${y + 5} Q108 ${y + 13} 116 ${y + 4} Q126 ${y + 10} 132 ${y - 1} C${146 + a} ${y - 6} ${156 + a} 160 ${146 + a} 118 Z`
      : redonda
      ? `${70 - a} ${y + 4} 100 ${y + 4} C${130 + a} ${y + 4} ${156 + a} 160 ${146 + a} 118 Z`
      : `${54 - a} ${y - 30} 80 ${y - 6} C98 ${y + 6} 124 ${y + 8} 148 ${y - 2} C${136 + a} ${y - 14} ${144 + a} ${y - 50} ${146 + a} 118 Z`;
    return `<g class="barba">${S(`M${54 - a} 118 C${44 - a} 160 ` + fondo, C.beard)}
      ${redonda ? F(`M128 124 C140 160 136 ${y - 16} 112 ${y + 2} C132 ${y} ${146 + a} ${y - 30} ${146 + a} 120 Z`, C.beardSh)
        : F(`M126 124 C136 156 130 ${y - 40} 132 ${y - 4} C138 ${y - 2} 144 ${y - 2} 148 ${y - 2} C${136 + a} ${y - 14} ${144 + a} ${y - 50} ${146 + a} 120 Z`, C.beardSh)}
      <path d="M76 160 C80 ${y - 28} 88 ${y - 12} 102 ${y - 2} M110 166 C110 ${y - 32} 114 ${y - 16} 126 ${y - 8}" stroke="${C.strand}" stroke-width="3.6" stroke-linecap="round" fill="none"/>${redonda ? extrasBarba(y) : ''}</g>`;
  }
  /** Lo que se le cuelga a la barba: trenza con anillo o cuentas. EST.adornoBarba = color del metal. */
  function extrasBarba(y) {
    const e = EST && EST.barbaExtra, metal = (EST && EST.metal) || '#f2c66d';
    if (e === 'rulos') return `<path d="M72 ${y - 22} c-4 0 -5 6 -1 7 M90 ${y - 12} c-4 0 -5 6 -1 7 M122 ${y - 18} c4 0 5 6 1 7" stroke="${C.strand}" stroke-width="3" stroke-linecap="round" fill="none"/>`;
    if (e === 'trenza') {
      const lobulo = (yy, rot) => `<ellipse cx="100" cy="${yy}" rx="6.5" ry="5" transform="rotate(${rot} 100 ${yy})" fill="${C.beard}" stroke="${L}" stroke-width="3"/>`;
      return `${lobulo(y + 22, 14)}${lobulo(y + 15, -14)}${lobulo(y + 8, 14)}
        <path d="M95 ${y + 31} C93 ${y + 38} 97 ${y + 41} 100 ${y + 37} C103 ${y + 41} 107 ${y + 38} 105 ${y + 31} Z" fill="${C.beard}" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>
        <rect x="93.5" y="${y + 25}" width="13" height="7" rx="2.5" fill="${metal}" stroke="${L}" stroke-width="2.6"/>`;
    }
    if (e === 'cuentas') return [[84, y - 6], [84, y + 1], [116, y - 6], [116, y + 1]].map(([x, yy]) => `<circle cx="${x}" cy="${yy}" r="3.4" fill="${metal}" stroke="${L}" stroke-width="2"/>`).join('');
    return '';
  }

  function cara(cy, r) {
    if (P) {
      const id = 'sbn' + (++idClip);
      return `<g class="nariz"><clipPath id="${id}"><circle cx="98" cy="${cy}" r="${r}"/></clipPath><circle cx="98" cy="${cy}" r="${r}" fill="${C.nose}"/>
        <circle clip-path="url(#${id})" cx="${98 + r * .45}" cy="${cy + r * .5}" r="${r * .95}" fill="${somb(C.nose, .12)}"/>
        <circle cx="98" cy="${cy}" r="${r}" fill="none" stroke="${L}" stroke-width="5.5"/>
        <ellipse cx="${98 - r * .38}" cy="${cy - r * .38}" rx="${r * .3}" ry="${r * .22}" fill="${C.noseHi}"/><circle cx="${98 - r * .05}" cy="${cy - r * .58}" r="${r * .09}" fill="#ffffff"/></g>
        ${S(`M98 ${cy + 18} C86 ${cy + 9} 68 ${cy + 13} 63 ${cy + 25} C76 ${cy + 28} 88 ${cy + 25} 98 ${cy + 20} C108 ${cy + 25} 120 ${cy + 28} 133 ${cy + 25} C128 ${cy + 13} 110 ${cy + 9} 98 ${cy + 18} Z`, '#ffffff', 4.5)}
        <path d="M66 ${cy + 24} C61 ${cy + 22} 60 ${cy + 17} 64 ${cy + 15}" stroke="${L}" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M130 ${cy + 24} C135 ${cy + 22} 136 ${cy + 17} 132 ${cy + 15}" stroke="${L}" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M108 ${cy + 22.5} C116 ${cy + 25} 124 ${cy + 26} 129 ${cy + 25}" stroke="${C.beardSh}" stroke-width="2.4" stroke-linecap="round" fill="none"/>`;
    }
    const pecas = EST && EST.pecas ? [[89, cy + 3], [95, cy + 7], [103, cy + 6], [108, cy + 1], [100, cy + 1]].map(([x, yy]) => `<circle cx="${x}" cy="${yy}" r="1.5" fill="${somb(C.nose, .35)}"/>`).join('') : '';
    const rulo = (x, d) => `<path d="M${x} ${cy + 25} C${x - d * 9} ${cy + 25} ${x - d * 11} ${cy + 15} ${x - d * 4} ${cy + 13} C${x + d * 1} ${cy + 12} ${x + d * 2} ${cy + 18} ${x - d * 2} ${cy + 19}" stroke="${L}" stroke-width="8" stroke-linecap="round" fill="none"/><path d="M${x} ${cy + 25} C${x - d * 9} ${cy + 25} ${x - d * 11} ${cy + 15} ${x - d * 4} ${cy + 13} C${x + d * 1} ${cy + 12} ${x + d * 2} ${cy + 18} ${x - d * 2} ${cy + 19}" stroke="${C.beard}" stroke-width="3.4" stroke-linecap="round" fill="none"/>`;
    const manubrio = EST && EST.bigote === 'manubrio' ? rulo(65, 1) + rulo(131, -1) : '';
    return `<g class="nariz"><circle cx="98" cy="${cy}" r="${r}" fill="${C.nose}" stroke="${L}" stroke-width="5.5"/><ellipse cx="91" cy="${cy - 7}" rx="6" ry="4.5" fill="${C.noseHi}"/>${pecas}</g>
      ${manubrio}${S(`M98 ${cy + 18} C86 ${cy + 9} 68 ${cy + 13} 63 ${cy + 25} C76 ${cy + 28} 88 ${cy + 25} 98 ${cy + 20} C108 ${cy + 25} 120 ${cy + 28} 133 ${cy + 25} C128 ${cy + 13} 110 ${cy + 9} 98 ${cy + 18} Z`, C.beard, 4.5)}`;
  }

  const FORMAS = {
    gancho: { nombre: 'Gancho', cono: 'M46 114 C66 84 80 50 90 22 C96 8 114 4 126 14 C114 16 106 24 104 36 C110 66 128 90 152 114 Z', sombra: 'M104 36 C110 66 128 90 152 114 L124 114 C110 92 102 66 102 42 Z', estrella: [108, 70] },
    blando: { nombre: 'Punta blanda', cono: 'M48 114 C64 86 76 56 86 32 C92 16 112 8 126 18 C132 24 128 34 120 32 C112 30 106 34 104 42 C110 70 128 92 152 114 Z', sombra: 'M104 42 C110 70 128 92 152 114 L124 114 C110 94 102 70 102 48 Z', estrella: [108, 74] },
    cono: { nombre: 'Cono recto', punta: [101, 8], cono: 'M48 114 C66 84 84 44 96 12 C98 5 104 5 106 12 C118 44 134 84 152 114 Z', sombra: 'M102 10 C114 44 132 84 152 114 L124 114 C112 84 104 48 102 18 Z', estrella: [100, 74] },
    hongo: { nombre: 'Hongo', hongo: true, cono: 'M32 120 C26 74 60 38 100 36 C140 38 174 74 168 120 C140 128 60 128 32 120 Z', sombra: 'M130 48 C156 64 170 92 168 120 C158 123 148 124 138 125 C144 98 142 70 130 48 Z', estrella: null },
    dormilon: { nombre: 'Dormilón', cono: 'M48 114 C64 88 76 60 86 38 C96 16 124 6 146 14 C160 20 166 36 158 50 C154 40 146 34 136 34 C120 34 110 44 108 58 C112 82 130 100 152 114 Z', sombra: 'M108 58 C112 82 130 100 152 114 L126 114 C112 98 104 80 106 62 Z', estrella: [94, 82], pompon: [160, 52] },
  };
  function sombrero(rot, forma, ala) {
    const fm = FORMAS[forma] || (forma === true ? FORMAS.blando : FORMAS.gancho);
    const w = 60 * (ala || 1);
    const id = 'sbs' + (++idClip);
    const extra = P ? `<clipPath id="${id}"><path d="${fm.cono}"/></clipPath>
      <g clip-path="url(#${id})"><path d="M38 114 C60 80 76 44 90 2 L97 2 C88 40 76 80 66 114 Z" fill="${luz(C.hat, .2)}"/></g>
      <path d="M84 70 C92 74 104 74 112 68" stroke="${somb(C.hat, .28)}" stroke-width="2.6" stroke-linecap="round" fill="none"/>
      <g transform="rotate(12 124 88)"><rect x="116" y="80" width="15" height="12" rx="2" fill="${luz(C.hatSh, .12)}" stroke="${L}" stroke-width="2.4"/>
        <path d="M118 83 h11 M118 89 h11" stroke="${luz(C.hat, .45)}" stroke-width="1.3" stroke-dasharray="2 2"/></g>` : '';
    const bandaLuz = P ? `<path d="M56 101 C80 96 118 96 142 101" stroke="${luz(C.band, .45)}" stroke-width="2" stroke-linecap="round" fill="none"/>
      <rect x="92" y="100" width="12" height="13" rx="2" fill="${somb(C.band, .15)}" stroke="${L}" stroke-width="2.4"/><rect x="95.5" y="103.5" width="5" height="6" rx="1" fill="${C.band}"/>` : '';
    const alaLuz = P ? `<path d="M${100 - w + 10} 117 C${100 - w + 26} 110 90 109 106 109" stroke="${luz(C.hat, .3)}" stroke-width="2.6" stroke-linecap="round" fill="none"/>` : '';
    if (fm.hongo) {   // sombrero de hongo: la copa con lunares y las laminillas abajo, sin banda ni ala
      const lam = [52, 64, 76, 88, 100, 112, 124, 136, 148].map((x) => `M${x} 121 L${100 + (x - 100) * .8} 127`).join(' ');
      return `<g class="sombrero"><g transform="rotate(${rot} 100 118)">${S('M36 118 C60 132 140 132 164 118 C150 136 50 136 36 118 Z', '#efe3c8', 4)}<path d="${lam}" stroke="#c8b48e" stroke-width="1.6"/>${S(fm.cono, C.hat)}${F(fm.sombra, C.hatSh)}${decoSombrero(fm)}${adornoSombrero()}</g></g>`;
    }
    const sinEstrella = EST && EST.sombrero === 'luna';
    return `<g class="sombrero"><g transform="rotate(${rot} 100 118)">${S(fm.cono, C.hat)}${F(fm.sombra, C.hatSh)}${extra}${decoSombrero(fm)}
      ${fm.pompon ? `<circle cx="${fm.pompon[0]}" cy="${fm.pompon[1]}" r="7" fill="${C.band}" stroke="${L}" stroke-width="4"/>` : ''}
      ${fm.estrella && !sinEstrella ? est(fm.estrella[0], fm.estrella[1], 6.5, '#fff1bf') : ''}
      ${S('M52 102 C78 96 120 96 146 102 L150 114 L48 114 Z', C.band, 4.5)}${bandaLuz}${decoBanda()}${adornoSombrero()}
      ${S(`M${100 - w} 120 C${100 - w + 18} 108 ${100 + w - 18} 108 ${100 + w} 120 C${100 + w - 18} 132 ${100 - w + 18} 132 ${100 - w} 120 Z`, C.hat)}
      ${alaLuz}</g></g>`;
  }


  const piso = (rx) => `<ellipse cx="100" cy="244" rx="${rx}" ry="6" fill="#0d1a1f" opacity=".28"/>`;
  const wrap = (inner) => `<svg viewBox="-10 -40 220 300" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

  /* opciones: { tunica: ancho, barbaFin, redonda, rotSombrero, sombreroSuave, nariz, etapa, anguloVarita, aplastar } */
  const BASE = Object.assign({}, C);
  function mago(o) {
    Object.assign(C, BASE, o.colores || {});
    ADORNO = o.adorno || null;
    EST = o.estilo || null;
    if (EST && EST.forma) o = Object.assign({}, o, { forma: EST.forma });
    if (EST && EST.barbaFin) o = Object.assign({}, o, { barbaFin: EST.barbaFin });
    if (EST && EST.nariz) o = Object.assign({}, o, { nariz: EST.nariz });
    const yHem = 230, yTop = 150;
    P = !!o.pulido;
    const k = o.cabeza || 1;
    const cuerpo = `${capa()}${piecitos(yHem, o.pies, o.tamPies)}${tunica(o.tunica || 56, yTop - (o.alturaTunica || 0), yHem)}${bufanda()}
      <g transform="translate(100 ${yTop + 20}) scale(${k}) translate(-100 ${-(yTop + 20)})"><g class="cabeza"><path d="M136 172 C142 172 145 176 145 180" stroke="${L}" stroke-width="13" stroke-linecap="round" fill="none"/><path d="M136 172 C142 172 145 176 145 180" stroke="${C.robe}" stroke-width="6" stroke-linecap="round" fill="none"/>
      ${barba(o.barbaFin || 198, o.barbaAncho, o.redonda)}${manoVarita(145, 183, o.etapa || 0, o.anguloVarita, o.varita)}
      ${cara(o.narizY || 138, o.nariz || 20)}${anteojos()}${P ? '<path d="M58 124 C80 129 120 129 142 124 C120 132 80 132 58 124 Z" fill="#16262c" opacity=".18"/>' : ''}${sombrero(o.rotSombrero == null ? -10 : o.rotSombrero, o.forma || o.sombreroSuave, o.ala)}</g></g>${adornoCuerpo()}${enLaMano()}`;
    const esc = o.aplastar ? `<g transform="translate(100 240) scale(${o.aplastar[0]} ${o.aplastar[1]}) translate(-100 -240)">${cuerpo}</g>` : cuerpo;
    const out = wrap(`${piso(64)}<g class="cuerpo">${esc}</g>`);
    Object.assign(C, BASE);
    P = false; ADORNO = null; EST = null;
    return out;
  }

  /* El maguito oficial (elegido por Owen en el taller, 08/10/2026) */
  const OFICIAL = { pulido: false, cabeza: .88, alturaTunica: 8, forma: 'cono', rotSombrero: -7, ala: 1.02, varita: 1.55, etapa: 1, anguloVarita: -60, tamPies: 1.6, tunica: 58, barbaFin: 197, redonda: true, nariz: 19 };
  /* La varita crece desde la elegida: cada etapa es (etapa base, escala) */
  const CRECIMIENTO = [
    { nombre: 'Varita', cuando: 'al empezar', etapa: 1, varita: 1.55 },
    { nombre: 'Varita larga', cuando: 'nivel 5', etapa: 1, varita: 2.4, angulo: -66 },
    { nombre: 'Vara', cuando: 'nivel 10', etapa: 2, varita: 2.1, angulo: -74 },
    { nombre: 'Báculo', cuando: 'nivel 20', etapa: 3, varita: 1.75, angulo: -84 },
  ];
  window.MagoLab = window.Silabo = { mago, ETAPAS, C, FORMAS, OFICIAL, CRECIMIENTO };
})();
