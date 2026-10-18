/* CapraLabsGames · dibujos del elenco del Bosque de Bruma (Chispa, Tomillo, Don Hornero, el ceibo, Doña Lenta,
   Ulises, Hilda). Mismo trazo que Silabo (game/js/silabo.js). Fuente única: la usan el juego (window.WWElenco,
   para el libro de campañas, game/js/campanas.js) y el lab (lab/elenco-dibujos.js la carga y la deja global).
   Cada función devuelve un string SVG. Necesita document.body (cargar al final de la página). */
(function () {
'use strict';
const L = '#16262c';
const n1 = (x) => Math.round(x * 10) / 10;
/** Mezcla de colores (tonos planos derivados, como silabo.js). */
function mezclar(hex, otro, k) {
  const a = parseInt(hex.slice(1), 16), b = parseInt(otro.slice(1), 16);
  const c = (sh) => Math.round(((a >> sh) & 255) * (1 - k) + ((b >> sh) & 255) * k);
  return '#' + ((1 << 24) + (c(16) << 16) + (c(8) << 8) + c(0)).toString(16).slice(1);
}
const luz = (h, k) => mezclar(h, '#ffffff', k == null ? .22 : k), somb = (h, k) => mezclar(h, L, k == null ? .22 : k);
const S = (d, fill, w) => `<path d="${d}" fill="${fill}" stroke="${L}" stroke-width="${w || 4.5}" stroke-linejoin="round" stroke-linecap="round"/>`;
const F = (d, fill, op) => `<path d="${d}" fill="${fill}"${op ? ` opacity="${op}"` : ''}/>`;
const T = (d, color, w, op) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${op ? ` opacity="${op}"` : ''}/>`;
/** Trazo grueso con contorno: primero el contorno, después el color (para colas, patas, ramas). */
const tubo = (d, color, w) => T(d, L, w + 7) + T(d, color, w);
const sombraPiso = (cx, cy, rx) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${rx * .13}" fill="#0d1418" opacity=".28"/>`;

/** Puntos a lo largo de un trazo: [{x, y, nx, ny, ang}] (normal hacia la izquierda del avance; ang en grados, 0 = arriba). */
const _medidor = (() => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('width', 0); s.setAttribute('height', 0); s.style.position = 'absolute'; document.body.appendChild(s); return s; })();
function aLoLargo(d, ts) {
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', d); _medidor.appendChild(p);
  const L0 = p.getTotalLength();
  const out = ts.map((t) => {
    const a = p.getPointAtLength(Math.max(0, t * L0 - .5)), b = p.getPointAtLength(Math.min(L0, t * L0 + .5)), m = p.getPointAtLength(t * L0);
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
    const nx = dy / len, ny = -dx / len;
    return { x: m.x, y: m.y, nx, ny, ang: Math.atan2(nx, -ny) * 180 / Math.PI };
  });
  p.remove();
  return out;
}
/** Forma afinada a lo largo de un trazo (cola): ancho de w0 a w1. */
function afinado(d, w0, w1, n) {
  const ts = Array.from({ length: n + 1 }, (_, i) => i / n), pts = aLoLargo(d, ts);
  const izq = pts.map((p, i) => { const w = (w0 + (w1 - w0) * ts[i]) / 2; return [p.x + p.nx * w, p.y + p.ny * w]; });
  const der = pts.map((p, i) => { const w = (w0 + (w1 - w0) * ts[i]) / 2; return [p.x - p.nx * w, p.y - p.ny * w]; }).reverse();
  const f = (q) => q.map(([x, y]) => `${n1(x)} ${n1(y)}`).join(' L');
  const fin = pts[pts.length - 1];
  return { d: `M${f(izq)} A${w1 / 2} ${w1 / 2} 0 0 1 ${f(der)} Z`, pts, fin };
}

// ======================================================================== CHISPA
function chispa(o) {
  const c = o.cuerpo, cs = somb(c, .26), cl = luz(c, .3), panza = o.panza, panzaS = somb(panza, .16), panzaL = luz(panza, .4);
  const cuerno = o.cuerno, cuernoS = somb(cuerno, .28), cresta = o.cresta, crestaS = somb(cresta, .22), ala = o.ala, alaS = somb(ala, .24);
  const garra = '#f3f6ee';
  /** Placa dorsal redondeada; ang 0 = apunta arriba. */
  const placa = (x, y, ang, t) => `<g transform="translate(${n1(x)} ${n1(y)}) rotate(${n1(ang)})"><path d="M${-t} ${t * .25} Q${-t * .35} ${-t * 1.1} 0 ${-t * 1.8} Q${t * .35} ${-t * 1.1} ${t} ${t * .25}Z" fill="${cresta}" stroke="${L}" stroke-width="2.6" stroke-linejoin="round"/><path d="M0 ${-t * 1.6} Q${t * .3} ${-t * 1} ${t * .8} ${t * .1} L${t * .2} ${t * .1}Z" fill="${crestaS}"/></g>`;
  const escama = (x, y, k) => T(`M${n1(x - 4 * k)} ${n1(y - 1.5 * k)} q${n1(4 * k)} ${n1(4 * k)} ${n1(8 * k)} 0`, cs, 2.1 * Math.min(1, k + .2), .85);
  let s = sombraPiso(120, 214, 74);

  // ---- cola afinada que se enrosca, con placas por arriba y escamas
  const cola = afinado('M100 196 C76 210 42 206 30 184 C20 166 26 146 44 138', 22, 8, 40);
  s += S(cola.d, c, 4.5);
  s += F(afinado('M100 200 C78 212 46 210 34 190', 7, 3, 20).d, cs, .9);
  for (const t of [.42, .58, .72, .86]) { const p = aLoLargo('M100 196 C76 210 42 206 30 184 C20 166 26 146 44 138', [t])[0]; const w = (22 + (8 - 22) * t) / 2; s += placa(p.x + p.nx * (w - 1), p.y + p.ny * (w - 1), p.ang, 5.2 - t * 2.4); }
  for (const t of [.2, .38, .56]) { const p = aLoLargo('M100 196 C76 210 42 206 30 184 C20 166 26 146 44 138', [t])[0]; s += escama(p.x, p.y, .8 - t * .4); }
  // punta de pica
  const fin = cola.fin;
  s += `<g transform="translate(${n1(fin.x)} ${n1(fin.y)}) rotate(${n1(fin.ang + 70)})">${S('M0 4 C-10 -2 -11 -14 0 -24 C11 -14 10 -2 0 4Z', cresta, 3.2)}${F('M0 -22 C8 -14 8 -4 0 2Z', crestaS)}${T('M-4 -12 C-3 -16 -1 -19 0 -20', luz(cresta, .35), 2)}</g>`;

  // ---- ala de atrás
  s += S('M104 124 C90 92 72 78 52 74 C58 84 58 92 54 98 C64 96 70 102 70 112 C78 110 84 116 84 126 C90 126 94 130 96 138 Z', alaS, 3.4);
  // ---- cuerpo
  s += S('M88 204 C74 172 80 130 114 120 C148 112 168 146 162 182 C160 198 150 206 134 206 H104 C96 206 90 206 88 204Z', c);
  s += F('M150 124 C168 142 170 180 160 198 C154 204 146 206 138 206 C154 188 156 152 150 124Z', cs);
  s += F('M94 146 C96 132 106 124 118 121 C108 128 100 138 98 152Z', cl, .75);
  // escamas del lomo, en hileras parejas
  for (const [x, y] of [[96, 160], [94, 174], [97, 188], [150, 146], [154, 160], [155, 174], [152, 188]]) s += escama(x, y, 1);
  // ---- panza con placas que siguen la curva
  s += S('M106 202 C98 178 102 150 122 140 C142 150 148 178 140 202 Z', panza, 3.4);
  s += F('M110 196 C104 176 108 156 120 146 C114 158 112 178 116 198Z', panzaL, .8);
  for (const [y, a, b] of [[152, 112, 133], [163, 108, 138], [174, 106, 140], [185, 106, 141], [195, 107, 140]]) s += T(`M${a} ${y} Q${(a + b) / 2} ${y + 5} ${b} ${y}`, panzaS, 2.4);
  // ---- patas: pie con tres dedos redondos y garritas
  const pie = (x) => S(`M${x - 18} 210 C${x - 20} 200 ${x - 10} 194 ${x} 194 C${x + 12} 194 ${x + 20} 200 ${x + 18} 210 Z`, c, 3.6)
    + F(`M${x + 6} 195 C${x + 14} 197 ${x + 19} 202 ${x + 18} 209 L${x + 8} 209 C${x + 10} 204 ${x + 9} 199 ${x + 6} 195Z`, cs)
    + T(`M${x - 6} 210 V203 M${x + 6} 210 V203`, cs, 2)
    + [-12, 0, 12].map((d) => S(`M${x + d - 3.4} 209 Q${x + d} 217 ${x + d + 3.4} 209Z`, garra, 2)).join('');
  s += pie(104) + pie(140);
  // ---- bracito de adelante: corto, relleno, con la mano apenas hacia la panza
  s += S('M146 144 C158 144 166 156 162 170 C160 178 152 182 146 178 C142 175 142 170 146 166 C150 160 148 152 146 144Z', c, 3.6);
  s += F('M156 148 C164 156 165 168 160 176 C158 172 158 160 156 148Z', cs);
  s += [[145, 172, 200], [144, 167, 225], [148, 178, 175]].map(([x, y, r]) => `<path d="M0 -2.6 L-6 0 L0 2.6Z" transform="translate(${x} ${y}) rotate(${r})" fill="${garra}" stroke="${L}" stroke-width="1.8" stroke-linejoin="round"/>`).join('');
  // ---- ala de adelante: borde ondulado y huesitos
  s += S('M112 130 C104 98 86 78 62 72 C68 82 68 92 64 98 C74 96 80 102 80 112 C88 110 94 116 94 126 C100 126 104 132 104 140 Z', ala, 3.4);
  s += T('M112 130 C104 100 88 82 64 74', alaS, 3) + T('M110 124 L66 98 M108 128 L82 112 M106 134 L96 126', alaS, 2.2);
  // ---- cresta por la nuca y el lomo (placas que achican hacia la cola)
  const lomo = 'M106 56 C92 70 86 94 90 118 C92 134 92 150 92 164';
  aLoLargo(lomo, [.04, .2, .36, .52]).forEach((p, i) => { s += placa(p.x - p.nx * 2, p.y - p.ny * 2, p.ang + 180, 7.4 - i * .8); });
  // ---- cuernos con anillos
  s += S('M136 52 C138 32 128 16 112 10 C122 22 124 36 122 54Z', cuernoS, 3.4);
  s += S('M114 58 C108 36 92 26 76 26 C90 34 98 46 100 64Z', cuerno, 3.4);
  s += T('M106 48 q-5 2 -9 -1 M101 40 q-5 1 -8 -2 M95 33 q-4 1 -6 -1', cuernoS, 2);
  s += T('M127 40 q4 1 7 -1 M124 30 q3 0 6 -2', somb(cuerno, .45), 2);
  // ---- cabeza con hocico
  s += S('M92 94 C88 64 110 46 136 48 C162 50 174 66 172 84 C184 86 198 94 196 108 C194 120 180 122 166 118 C152 126 112 128 100 116 C94 110 92 102 92 94Z', c);
  s += F('M166 118 C180 122 194 120 196 108 C190 116 176 116 166 112 C152 120 116 122 102 112 C104 118 108 122 114 124 C134 128 156 126 166 118Z', cs);
  s += F('M108 64 C116 54 128 50 140 50 C128 56 118 62 112 74Z', cl, .85);
  s += F('M174 88 C184 88 192 94 192 100 C186 96 180 94 172 94Z', cl, .7);
  // pintitas de la cabeza
  for (const [x, y, r] of [[118, 60, 3.2], [127, 56, 2.4], [112, 70, 2.2]]) s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${cs}" opacity=".8"/>`;
  // aleta de la oreja con nervaduras
  s += S('M104 80 C90 72 80 76 78 86 C86 86 94 90 98 96Z', cresta, 3) + T('M100 84 L84 80 M100 88 L86 88', crestaS, 1.8);
  // ojo con ceja
  s += S('M134 78 C134 66 146 62 154 68 C160 74 158 90 148 92 C140 93 134 88 134 78Z', '#f3f6ee', 3);
  s += `<ellipse cx="149" cy="80" rx="6" ry="8.5" fill="${L}"/><circle cx="151.6" cy="76" r="2.7" fill="#fff"/><circle cx="146.4" cy="84.4" r="1.2" fill="#fff"/>`;
  s += T('M131 63 Q143 55 156 61', L, 3.6);
  // fosas, sonrisa, colmillito, cachete
  s += T('M184 93 q3 -2 5 1', L, 2.6) + `<ellipse cx="188" cy="97.5" rx="2.4" ry="1.8" fill="${L}"/>`;
  s += T('M158 109 Q171 116 186 110', L, 3) + S('M168 112.5 l2.6 6 l2.6 -6z', garra, 1.8);
  s += `<ellipse cx="160" cy="98" rx="8" ry="5" fill="#e8907a" opacity=".45"/>`;
  // humito: todavía no le sale el fuego
  if (o.humo) s += [[206, 88, 5.5], [215, 78, 7.5], [228, 68, 5.5]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#dfebd6" opacity=".9" stroke="${L}" stroke-width="2"/>`).join('');
  return `<svg viewBox="10 0 230 230" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
}

// ======================================================================== TOMILLO
function tomillo(o) {
  const p = o.pelo, ps = somb(p, .16), pl = luz(p, .35), rosa = '#e8a99a', bufa = o.bufanda, bufaS = somb(bufa, .25);
  let s = sombraPiso(120, 218, 64);
  // cola de pompón
  s += [[78, 196, 13], [70, 188, 10], [82, 184, 9]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${pl}" stroke="${L}" stroke-width="3.5"/>`).join('');
  // patas traseras grandes
  s += S('M78 214 C70 214 66 206 72 200 C80 192 104 196 108 206 C110 212 104 216 96 216Z', p) + F('M80 210 C86 206 96 206 102 210', ps);
  s += [[82, 208], [90, 206], [98, 208]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="${rosa}"/>`).join('');
  s += S('M132 216 C126 210 132 198 144 198 C158 198 168 206 164 212 C162 216 156 216 150 216Z', p);
  // cuerpo con sombra y mechones del pecho
  s += S('M80 200 C70 170 78 132 108 122 C136 114 160 132 162 162 C164 184 156 204 136 206 H96 C88 206 82 204 80 200Z', p);
  s += F('M146 128 C162 142 166 172 158 192 C152 202 144 206 136 206 C150 190 154 158 146 128Z', ps);
  s += S('M98 194 C92 172 98 148 118 140 C136 146 144 170 138 194 L132 186 L126 196 L120 186 L114 196 L108 186 L104 196Z', pl, 3);
  // morral con correa y mapa
  s += T('M100 128 L150 186', '#6b4a2f', 6) + T('M100 128 L150 186', L, 1.5, .4);
  s += S('M142 176 C142 168 166 166 168 176 L168 196 C166 202 144 202 142 196Z', '#8a6440', 3.5) + S('M142 176 C150 182 162 182 168 176 L166 184 C158 188 150 188 144 184Z', '#76553a', 3) + `<circle cx="155" cy="185" r="3" fill="#f2c66d" stroke="${L}" stroke-width="2"/>`;
  s += S('M150 170 L158 158 L170 164 L162 176Z', '#efe3c8', 2.5) + T('M154 168 l6 -6 M158 171 l6 -5', '#c49a42', 1.6);
  // brazos
  s += S('M86 148 C76 156 74 170 82 176 C88 178 92 172 92 166 C96 160 94 150 86 148Z', p, 3.5);
  s += S('M140 150 C150 154 154 166 148 172 C142 174 138 168 138 164 C134 160 134 152 140 150Z', p, 3.5);
  // bufanda (rojo ceibo apagado) con nudo y puntas con flequillo
  s += S('M90 124 C104 132 134 132 148 122 C150 130 148 136 146 138 C130 146 104 146 92 138 C88 134 88 128 90 124Z', bufa, 3.5);
  s += S('M128 136 C136 150 136 164 130 172 L124 166 L118 172 C122 160 122 148 120 138Z', bufaS, 3);
  s += T('M98 136 L104 128 M110 140 L116 131 M136 136 L140 128', luz(bufa, .25), 2.2);
  // orejas: una derecha alta, otra doblada en la punta
  s += S('M98 66 C88 34 92 8 104 6 C116 6 116 36 112 66Z', p) + F('M100 60 C94 36 98 16 104 14 C110 16 110 40 108 60Z', rosa) + F('M104 14 C110 16 110 40 108 60 L106 60 C108 40 108 22 104 14Z', somb(rosa, .18));
  s += S('M126 64 C128 36 142 18 154 20 C162 22 160 34 152 42 C146 48 140 58 138 68Z', p) + F('M130 62 C134 40 144 28 152 28 C154 32 150 38 146 42 C140 48 136 56 134 64Z', rosa);
  s += S('M152 22 C160 22 170 30 168 40 C164 36 158 36 152 40Z', ps, 3);
  // cabeza con cachetes inflados y mechón
  s += S('M80 96 C78 70 98 56 120 56 C144 56 162 72 160 98 C168 104 168 118 158 122 C148 132 92 132 82 122 C72 118 72 104 80 96Z', p);
  s += F('M150 66 C160 76 162 92 160 100 C168 106 168 118 158 122 C150 128 140 130 130 131 C150 120 158 96 150 66Z', ps);
  s += S('M108 58 L112 46 L118 56 L124 44 L128 58', p, 3.5);
  // ojos grandes
  for (const x of [104, 136]) s += `<ellipse cx="${x}" cy="92" rx="8" ry="10" fill="${L}"/><circle cx="${x + 2.5}" cy="88" r="3.2" fill="#fff"/><circle cx="${x - 2}" cy="96" r="1.4" fill="#fff"/>`;
  s += T('M96 78 Q104 74 110 78 M130 78 Q136 74 144 78', L, 2.8);
  // nariz, boca en w, dientes, bigotes, cachetes
  s += S('M116 106 L124 106 L120 111Z', '#e8907a', 2.2);
  s += S('M115 116 L115 124 L125 124 L125 116 Z', '#f6f2ea', 2.2) + T('M120 116 V124', L, 1.6);
  s += T('M110 113 Q115 118 120 112 Q125 118 130 113', L, 2.6);
  s += T('M94 110 L76 106 M94 115 L76 117 M146 110 L164 106 M146 115 L164 117', L, 1.8, .8);
  s += `<ellipse cx="96" cy="108" rx="7" ry="4.5" fill="#e8907a" opacity=".42"/><ellipse cx="144" cy="108" rx="7" ry="4.5" fill="#e8907a" opacity=".42"/>`;
  return `<svg viewBox="40 0 160 230" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
}

// ======================================================================== HORNERO
function nidoHorno(x, y, k) {
  const b = '#b5835a', bs = somb(b, .2), bl = luz(b, .2);
  let s = `<g transform="translate(${x} ${y}) scale(${k})">`;
  s += S('M-62 0 C-66 -58 -30 -92 4 -90 C40 -88 66 -56 60 0 Z', b);
  s += F('M20 -86 C50 -74 66 -44 60 0 L36 0 C46 -36 42 -66 20 -86Z', bs);
  s += F('M-40 -60 C-30 -78 -12 -86 2 -86 C-14 -78 -26 -68 -34 -52Z', bl, .9);
  // terrones de barro
  for (const [px, py] of [[-44, -30], [-20, -58], [10, -66], [30, -40], [-30, -10], [22, -14], [-6, -36]]) s += T(`M${px - 6} ${py} q6 -4 12 0`, bs, 2.4);
  // entrada lateral
  s += S('M-38 -4 C-42 -34 -24 -48 -10 -44 C2 -40 4 -18 -2 -4Z', '#3a2a1e', 3.5) + F('M-30 -8 C-32 -28 -22 -38 -14 -36 C-22 -30 -26 -20 -24 -8Z', '#523c2a');
  s += '</g>';
  return s;
}
function hornero(o) {
  const lomo = '#b06a3c', lomoS = somb(lomo, .22), lomoL = luz(lomo, .2), panza = '#ead7b5', panzaS = somb(panza, .12), garganta = '#f6efe2', ala = '#93552f';
  let s = '';
  // rama
  s += tubo('M0 206 C60 200 150 204 240 198', '#6b4a2f', 9) + T('M40 202 l-10 -10 M200 200 l8 -12', L, 4) + T('M40 202 l-10 -10 M200 200 l8 -12', '#6b4a2f', 2);
  if (o.nido) s += nidoHorno(78, 202, 1);
  if (o.ceibo) s += ramitoCeibo(206, 120, .8, 20);
  const bx = o.nido ? 160 : 120;
  s += `<g transform="translate(${bx} 0)">`;
  // patas
  s += T('M-6 196 L-10 176 M8 196 L6 176', '#8a6a5a', 3.4) + T('M-16 200 l10 -4 l8 4 M2 200 l8 -4 l8 4', '#8a6a5a', 3);
  // cola larga rojiza
  s += S('M-24 160 C-46 170 -58 184 -60 196 C-50 194 -40 186 -32 176Z', luz(lomo, .08), 3.5) + T('M-30 170 L-52 190', lomoS, 2);
  // cuerpo
  s += S('M-30 150 C-34 122 -14 104 8 104 C30 104 42 122 38 146 C34 170 16 182 0 182 C-18 182 -28 168 -30 150Z', lomo);
  s += S('M-14 160 C-16 134 -2 120 12 120 C28 122 34 140 30 158 C26 174 12 180 2 180 C-8 178 -12 170 -14 160Z', panza, 3);
  s += F('M20 126 C30 136 32 152 28 164 C26 172 18 178 10 180 C22 166 26 146 20 126Z', panzaS);
  // ala con plumas
  s += S('M-30 132 C-20 118 0 120 6 136 C10 150 0 166 -16 170 C-26 168 -32 152 -30 132Z', ala, 3.5);
  s += T('M-22 142 q8 6 18 2 M-24 152 q8 6 18 2 M-20 162 q6 4 14 0', somb(ala, .25), 2.2);
  // cabeza
  s += S('M-8 92 C-10 70 6 58 22 60 C40 62 48 78 44 96 C40 112 24 118 10 116 C0 114 -6 104 -8 92Z', lomo);
  s += F('M-2 72 C6 62 18 60 26 62 C14 66 6 72 2 82Z', lomoL);
  // garganta blanca y ceja clara
  s += F('M22 100 C30 98 38 100 42 106 C38 114 26 118 16 116 C14 110 16 102 22 100Z', garganta);
  s += T('M10 78 Q22 70 38 78', panza, 3.4);
  // pico finito, levemente curvo (abierto si canta)
  if (o.canta) {
    s += S('M42 86 C54 82 66 80 74 78 C66 84 54 88 44 90Z', '#6b5a4a', 2.6) + S('M42 92 C54 94 64 98 72 102 C62 102 52 98 42 96Z', '#8a786a', 2.6);
    s += [[86, 66], [98, 54], [84, 46]].map(([x, y], i) => `<text x="${x}" y="${y}" font-family="Fredoka" font-weight="700" font-size="${18 - i * 2}" fill="#dfebd6" stroke="${L}" stroke-width="1.2">♪</text>`).join('');
  } else s += S('M42 88 C56 86 68 86 78 90 C66 92 54 94 42 94Z', '#6b5a4a', 2.6);
  // ojo
  s += `<circle cx="26" cy="86" r="5.6" fill="${L}"/><circle cx="27.8" cy="84.2" r="2" fill="#fff"/>`;
  s += `<ellipse cx="30" cy="100" rx="6" ry="3.4" fill="#e8907a" opacity=".35"/>`;
  s += '</g>';
  return `<svg viewBox="0 30 240 200" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
}

// ======================================================================== CEIBO
const CEIBO = '#c9485b';
/** Una flor de ceibo: el pétalo grande curvado como quilla, con sombra y luz, y el cáliz. */
function florCeibo(x, y, k, rot) {
  const c = CEIBO, cs = somb(c, .28), cl = luz(c, .3);
  // dos pétalos abiertos en V: el estandarte tirado hacia atrás y la quilla larga curvada hacia adelante, con los estambres
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${k})">
    ${T('M2 -30 C8 -40 14 -48 22 -52', '#f3e3c3', 1.6)}${T('M4 -28 C12 -36 20 -40 28 -42', '#f3e3c3', 1.6)}
    ${S('M2 -6 C14 -14 26 -30 26 -48 C18 -42 10 -30 -1 -18Z', cs, 3)}
    ${T('M6 -12 C14 -20 20 -30 22 -40', luz(cs, .18), 2)}
    ${S('M-2 -8 C-16 -16 -26 -32 -20 -46 C-12 -44 -4 -34 -1 -22 C0 -16 0 -12 -2 -8Z', c, 3)}
    ${T('M-16 -40 C-14 -30 -8 -22 -3 -15', cl, 2.4)}
    ${S('M-4 0 C-6 -6 -4 -11 0 -12 C5 -11 6 -6 3 0Z', '#7a3a44', 2.2)}
  </g>`;
}
/** Ramito: rama, hojas de tres folíolos y flores colgando. */
function ramitoCeibo(x, y, k, rot) {
  const hoja = (hx, hy, r) => `<g transform="translate(${hx} ${hy}) rotate(${r})">${[[-10, -4, -30], [0, -12, 0], [10, -4, 30]].map(([a, b, rr]) => `<ellipse cx="${a}" cy="${b}" rx="5.5" ry="10" transform="rotate(${rr} ${a} ${b})" fill="#7fa36a" stroke="${L}" stroke-width="2.4"/>`).join('')}</g>`;
  return `<g transform="translate(${x} ${y}) rotate(${rot || 0}) scale(${k})">${tubo('M0 0 C-16 20 -30 46 -34 80', '#7a5a3c', 5)}
    ${hoja(-6, 14, -50)}${hoja(-28, 52, -80)}
    ${florCeibo(-16, 36, .8, 150)}${florCeibo(-26, 66, .9, 170)}${florCeibo(-36, 84, .75, 200)}${florCeibo(-8, 22, .6, 120)}</g>`;
}
function escenaLaguna() {
  let s = `<defs><linearGradient id="cl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9c4bb"/><stop offset="1" stop-color="#ecdcb4"/></linearGradient></defs><rect width="480" height="300" fill="url(#cl)"/>`;
  s += `<path d="M0 170 C120 150 360 150 480 172 V300 H0Z" fill="#98ad7e"/>`;
  s += S('M150 236 C190 214 330 212 380 236 C340 258 190 260 150 236Z', '#7fa3a3', 3.5) + T('M200 236 h40 M270 242 h50', '#a9c4bb', 3);
  // ceibo torcido junto al agua
  s += tubo('M110 240 C104 210 120 186 108 160 C100 140 112 120 128 112', '#7a5a3c', 14) + tubo('M114 168 C134 160 150 150 160 134', '#7a5a3c', 8);
  s += [[96, 108, 34], [134, 98, 38], [166, 122, 30], [118, 134, 28]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#6f9466" stroke="${L}" stroke-width="3.5"/>`).join('');
  s += [[96, 108, 34], [134, 98, 38], [166, 122, 30]].map(([x, y, r]) => `<circle cx="${x + r * .3}" cy="${y + r * .3}" r="${r * .62}" fill="#5f8458"/>`).join('');
  for (const [fx, fy, r] of [[86, 96, 160], [118, 84, 190], [150, 102, 140], [176, 118, 200], [104, 130, 170], [140, 126, 150], [70, 116, 210]]) s += florCeibo(fx, fy, .55, r);
  // poste con nido de hornero
  s += tubo('M380 236 V170', '#8a6440', 9) + nidoHorno(380, 172, .45);
  s += `<g transform="translate(330 118) scale(.36)">${hornero({}).replace(/^<svg[^>]*>|<\/svg>$/g, '').replace('<path d="M0 206', '<path opacity="0" d="M0 206')}</g>`;
  return `<svg viewBox="0 0 480 300" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
}
const silaboCeibo = () => window.Silabo.mago(Object.assign({}, window.Silabo.OFICIAL, { colores: { hat: CEIBO, hatSh: somb(CEIBO, .25), band: '#f2c66d', robe: '#4f7a3a', robeSh: '#3b5d2b', hem: '#f2c66d', starRobe: '#f2c66d', shoe: '#5c4330' } }));


// ======================================================================== bocetos simples (de lab/estudio.html): Doña Lenta, Ulises, Hilda
function caracol(x, y, k) {
  return `<g transform="translate(${x} ${y}) scale(${k})"><ellipse cx="0" cy="22" rx="34" ry="5" fill="#0d1418" opacity=".25"/>
  <path d="M-34 20 C-34 8 -24 6 -12 6 H22 C30 6 34 12 34 20 Z" fill="#c9b48a" stroke="${L}" stroke-width="4" stroke-linejoin="round"/>
  <path d="M24 8 L28 -14 M30 8 L36 -12" stroke="${L}" stroke-width="3.5" stroke-linecap="round"/><circle cx="28" cy="-15" r="3.5" fill="${L}"/><circle cx="36" cy="-13" r="3.5" fill="${L}"/>
  <circle cx="-6" cy="-6" r="22" fill="#e8907a" stroke="${L}" stroke-width="4"/><path d="M-6 -6 m-12 0 a12 12 0 1 0 12 -12 a8 8 0 1 0 -8 8 a4 4 0 1 0 4 -4" fill="none" stroke="#b86f5d" stroke-width="3.5" stroke-linecap="round"/></g>`;
}
function buho(x, y, k) {
  return `<g transform="translate(${x} ${y}) scale(${k})"><ellipse cx="0" cy="40" rx="24" ry="5" fill="#0d1418" opacity=".25"/>
  <path d="M-24 -18 L-20 -40 L-8 -26 H8 L20 -40 L24 -18 C30 10 22 38 0 38 C-22 38 -30 10 -24 -18Z" fill="#8a6a50" stroke="${L}" stroke-width="4" stroke-linejoin="round"/>
  <path d="M-14 4 C-8 30 8 30 14 4 C8 14 -8 14 -14 4Z" fill="#c9b48a"/>
  <circle cx="-10" cy="-14" r="10" fill="#efe6cf" stroke="${L}" stroke-width="3.5"/><circle cx="10" cy="-14" r="10" fill="#efe6cf" stroke="${L}" stroke-width="3.5"/>
  <circle cx="-9" cy="-13" r="4.2" fill="${L}"/><circle cx="9" cy="-13" r="4.2" fill="${L}"/><circle cx="-8" cy="-15" r="1.4" fill="#fff"/><circle cx="10" cy="-15" r="1.4" fill="#fff"/>
  <path d="M-4 -4 L0 3 L4 -4Z" fill="#f2c66d" stroke="${L}" stroke-width="2.5" stroke-linejoin="round"/></g>`;
}
function arana(x, y, k) {
  let patas = '';
  for (const s of [-1, 1]) for (const [a, b] of [[10, -8], [14, 2], [12, 12]]) patas += `<path d="M${s * 8} ${b * .4} Q${s * (a + 8)} ${b - 8} ${s * (a + 14)} ${b + 6}" fill="none" stroke="${L}" stroke-width="3.5" stroke-linecap="round"/>`;
  return `<g transform="translate(${x} ${y}) scale(${k})"><path d="M0 -60 V-14" stroke="#dfebd6" stroke-width="1.5" opacity=".7"/>${patas}
  <circle cx="0" cy="2" r="14" fill="#3a3f5a" stroke="${L}" stroke-width="4"/><circle cx="0" cy="-12" r="10" fill="#4a5070" stroke="${L}" stroke-width="3.5"/>
  <circle cx="-4" cy="-13" r="3.6" fill="#fff"/><circle cx="4" cy="-13" r="3.6" fill="#fff"/><circle cx="-3.6" cy="-12.4" r="1.8" fill="${L}"/><circle cx="4.4" cy="-12.4" r="1.8" fill="${L}"/></g>`;
}

// ======================================================================== DOÑA LENTA (ronda 3)
/** La caracola sabia. o.casita: el caracol es una casita (ventana y chimenea); si no, caracol coral con ceibo. */
function lenta(o) {
  o = o || {};
  const piel = '#d8c39a', pielS = somb(piel, .2), pielL = luz(piel, .35);
  const conc = o.casita ? '#c46a4a' : '#e8907a', concS = somb(conc, .24), concL = luz(conc, .3), banda = somb(conc, .38);
  let s = sombraPiso(124, 217, 88);
  // rastro brillante
  s += T('M22 214 C40 212 52 213 66 212', '#dfeef0', 4, .5) + T('M28 213 C36 212 44 212 52 212', '#ffffff', 1.6, .6);
  // pie y cuello
  const cuerpo = 'M40 214 C40 204 50 199 64 199 L160 199 C170 199 175 192 176 182 C177 168 172 152 176 140 C181 126 196 119 208 125 C221 132 223 150 217 165 C211 181 209 196 215 206 C217 212 213 216 205 216 L46 216 C42 216 40 216 40 214Z';
  s += S(cuerpo, piel) + F('M64 208 C100 206 150 206 200 208 L205 216 L46 216 C50 212 56 209 64 208Z', pielS) + T('M190 134 C184 150 186 170 192 186', pielL, 3);
  for (const x of [70, 92, 114, 136]) s += T(`M${x} 211 q4 -3 8 0`, pielS, 1.6);
  // chal tejido lila sobre el cuello, con flecos
  s += S('M170 158 C182 168 206 170 220 160 C222 170 220 178 214 182 C200 188 182 184 172 176 C168 170 168 164 170 158Z', '#a58fc9', 3.2);
  s += T('M176 166 l4 8 M186 170 l3 8 M196 171 l2 8 M206 169 l1 8', somb('#a58fc9', .25), 1.6);
  s += S('M174 176 L168 194 L176 192 L180 198 L184 180Z', '#a58fc9', 2.6);
  // caracol: espiral, sombra y luz
  const cx = 108, cy = 144, r = 54;
  const id = 'lc' + Math.random().toString(36).slice(2, 7);
  s += `<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${conc}"/>`;
  s += `<g clip-path="url(#${id})"><circle cx="${cx + 18}" cy="${cy + 20}" r="${r}" fill="${concS}"/><circle cx="${cx - 14}" cy="${cy - 16}" r="${r * .62}" fill="${concL}" opacity=".55"/></g>`;
  let esp = '';
  for (let a = 0; a <= Math.PI * 6.2; a += .12) { const rr = 4 + a * 7.6, x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr; esp += (esp ? ' L' : 'M') + `${n1(x)} ${n1(y)}`; }
  s += `<g clip-path="url(#${id})">${T(esp, banda, 5.5)}${T(esp, concL, 1.6, .7)}</g>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${L}" stroke-width="4.5"/>`;
  if (o.casita) {
    // puerta redonda, ventanita encendida, chimenea con humo y hiedra
    s += S(`M${cx - 30} ${cy + 46} C${cx - 30} ${cy + 26} ${cx - 10} ${cy + 26} ${cx - 10} ${cy + 46}Z`, '#6b4a2f', 3) + `<circle cx="${cx - 14}" cy="${cy + 38}" r="1.8" fill="#f2c66d"/>`;
    s += S(`M${cx + 12} ${cy - 12} h20 v18 h-20z`, '#ffe08a', 3) + T(`M${cx + 22} ${cy - 12} v18 M${cx + 12} ${cy - 3} h20`, L, 2);
    s += S(`M${cx + 24} ${cy - 66} h12 v22 h-12z`, '#8a6440', 3) + T(`M${cx + 30} ${cy - 70} c-8 -8 6 -12 0 -20 c-6 -8 8 -12 2 -20`, '#dfe7dc', 4, .8);
    s += [[cx - 40, cy - 30], [cx - 48, cy - 10], [cx - 34, cy - 44]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="4" transform="rotate(-30 ${x} ${y})" fill="#6f9466" stroke="${L}" stroke-width="2"/>`).join('');
  } else {
    // musgo y flores de ceibo arriba
    s += S(`M${cx - 40} ${cy - 34} C${cx - 30} ${cy - 50} ${cx - 6} ${cy - 56} ${cx + 10} ${cy - 52} C${cx} ${cy - 46} ${cx - 22} ${cy - 40} ${cx - 34} ${cy - 28}Z`, '#7d9b62', 3);
    s += florCeibo(cx + 6, cy - 50, .55, 20) + florCeibo(cx - 18, cy - 48, .42, -30);
  }
  // antenas con ojos sabios (párpado a media asta)
  s += tubo('M196 128 C192 114 188 104 184 96', piel, 5) + tubo('M208 128 C210 114 214 106 218 98', piel, 5);
  for (const [x, y] of [[184, 92], [219, 94]]) {
    s += `<circle cx="${x}" cy="${y}" r="9" fill="#fff" stroke="${L}" stroke-width="3.5"/><circle cx="${x + 1.5}" cy="${y + 2}" r="4.2" fill="${L}"/><circle cx="${x + 3}" cy="${y + .5}" r="1.4" fill="#fff"/>`;
    s += S(`M${x - 9} ${y} C${x - 8} ${y - 11} ${x + 8} ${y - 11} ${x + 9} ${y} C${x + 4} ${y - 2} ${x - 4} ${y - 2} ${x - 9} ${y}Z`, piel, 2.6);
  }
  // anteojos de media luna, cachete y sonrisa tranquila
  s += T('M197 146 a6 6 0 0 0 12 0 M211 146 a6 6 0 0 0 12 0', L, 2.6) + T('M197 146 h12 M211 146 h12', '#c49a42', 1.6) + T('M209 146 h2', L, 2);
  s += `<ellipse cx="200" cy="156" rx="5" ry="3" fill="#e8907a" opacity=".45"/>` + T('M206 160 Q212 165 218 159', L, 2.6);
  return `<svg viewBox="16 40 220 190" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
}

// ======================================================================== ULISES (ronda 3)
/** El búho de la biblioteca. o.farol: versión explorador nocturno (farol y bufanda); si no, anteojos y libro. */
function ulises(o) {
  o = o || {};
  const plu = '#8a6a50', pluS = somb(plu, .24), pluL = luz(plu, .25), disco = '#e3cfa6', discoS = somb(disco, .18), crema = '#efe0bd';
  let s = sombraPiso(120, 218, 60);
  // base: pila de libros o rama
  if (o.farol) s += tubo('M44 206 C90 200 150 200 200 206', '#7a5a3c', 10) + `<ellipse cx="70" cy="196" rx="9" ry="5" fill="#6f9466" stroke="${L}" stroke-width="2.4"/>`;
  else {
    s += S('M66 200 h112 v16 h-112z', '#5b7fa0', 3.5) + T('M70 205 h104', luz('#5b7fa0', .3), 2) + S('M74 186 h96 v14 h-96z', '#a2553a', 3.5) + T('M78 191 h88', luz('#a2553a', .3), 2);
    s += S('M150 186 h12 v14 h-12z', '#f2c66d', 2.4);
  }
  // cuerpo
  s += S('M82 190 C66 150 72 104 120 98 C168 104 174 150 158 190 C150 200 90 200 82 190Z', plu);
  s += F('M146 106 C166 124 170 160 158 190 C152 196 142 198 132 199 C150 182 160 144 146 106Z', pluS);
  // pecho crema con plumitas en V
  s += S('M98 132 C96 160 104 186 120 190 C136 186 144 160 142 132 C134 140 106 140 98 132Z', crema, 3);
  for (const [y, xs] of [[150, [108, 120, 132]], [162, [102, 114, 126, 138]], [174, [110, 122, 134]]]) for (const x of xs) s += T(`M${x - 4} ${y} l4 4 l4 -4`, '#a88b63', 2);
  // ala plegada
  s += S('M84 128 C70 146 70 176 86 192 C92 176 96 152 94 132Z', pluS, 3.5) + T('M80 160 l8 4 M80 172 l8 4 M82 182 l8 2', somb(plu, .45), 1.8);
  // penachos y cabeza
  s += S('M86 82 L78 46 L104 70Z', plu) + S('M154 82 L162 46 L136 70Z', plu) + F('M84 74 L80 54 L96 70Z', pluL) + F('M156 74 L160 54 L144 70Z', pluS);
  s += S('M74 96 C72 66 96 56 120 56 C144 56 168 66 166 96 C166 124 146 136 120 136 C94 136 74 124 74 96Z', plu);
  s += F('M150 64 C164 74 168 92 166 104 C162 122 148 132 132 135 C152 120 158 92 150 64Z', pluS);
  // disco facial en corazón
  s += S('M120 74 C102 58 78 66 80 94 C82 118 106 126 120 116 C134 126 158 118 160 94 C162 66 138 58 120 74Z', disco, 3);
  s += F('M120 116 C134 126 158 118 160 94 C158 112 140 120 124 114Z', discoS);
  // ojos grandes y tranquilos
  for (const x of [101, 139]) {
    s += `<circle cx="${x}" cy="92" r="15" fill="#f2b24a" stroke="${L}" stroke-width="3.5"/><circle cx="${x}" cy="93" r="7.5" fill="${L}"/><circle cx="${x + 3}" cy="89" r="2.6" fill="#fff"/><circle cx="${x - 3}" cy="97" r="1.2" fill="#fff"/>`;
    s += S(`M${x - 15} 90 C${x - 12} ${o.farol ? 82 : 78} ${x + 12} ${o.farol ? 82 : 78} ${x + 15} 90 C${x + 8} 86 ${x - 8} 86 ${x - 15} 90Z`, disco, 2.4);
  }
  if (!o.farol) s += T('M84 92 a17 17 0 0 0 34 0 a17 17 0 0 0 -34 0 M122 92 a17 17 0 0 0 34 0 a17 17 0 0 0 -34 0 M118 90 q2 -3 4 0', L, 4) + T('M84 92 a17 17 0 0 0 34 0 a17 17 0 0 0 -34 0 M122 92 a17 17 0 0 0 34 0 a17 17 0 0 0 -34 0', '#d9a441', 2);
  // pico y cejas de plumas
  s += S('M114 104 L126 104 L120 118Z', '#f2c66d', 2.8) + F('M120 104 L126 104 L120 116Z', '#c49a42');
  s += T('M88 74 q10 -6 22 0 M130 74 q12 -6 22 0', '#5c4330', 2.6);
  // patas
  for (const x of [106, 134]) s += S(`M${x - 8} ${o.farol ? 200 : 186} q-2 6 2 6 q2 -6 6 -6 q2 6 6 6 q2 -6 -2 -6z`, '#f2a14a', 2.4);
  if (o.farol) {
    // bufanda verde agua y farol colgando del ala
    s += S('M84 124 C100 136 140 136 156 124 C158 132 156 138 152 140 C134 148 106 148 88 140 C84 136 82 130 84 124Z', '#4fa38f', 3.2) + S('M140 138 L148 168 L156 164 L150 136Z', '#3b8474', 2.8);
    s += T('M158 150 C170 150 174 158 176 166', L, 3) + `<circle cx="178" cy="182" r="16" fill="#ffe08a" opacity=".25"/>` + S('M170 168 h16 l-2 -5 h-12z', '#2b2f45', 2.4) + S('M171 168 h14 v20 h-14z', '#ffe08a', 2.8) + S('M168 188 h20 v5 h-20z', '#2b2f45', 2.4);
  } else {
    // libro abierto en el ala
    s += S('M128 152 C140 146 154 146 166 152 L166 176 C154 170 140 170 128 176Z', '#f6efe0', 3) + S('M166 152 C176 146 186 148 190 152 L190 176 C182 172 174 172 166 176Z', '#efe3c8', 3);
    s += T('M134 158 h24 M134 164 h24 M172 158 h12 M172 164 h12', '#b9a77f', 1.6) + S('M140 172 C134 178 136 186 146 186 C152 184 152 176 146 172Z', pluS, 3);
  }
  return `<svg viewBox="40 30 170 200" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
}

// ======================================================================== HILDA (ronda 3)
/** La araña gruñona que teje. o.medir: colgada del hilo con anteojos y cinta métrica; si no, tejiendo con agujas y ovillo. */
function hilda(o) {
  o = o || {};
  const c = '#3d4466', cs = somb(c, .28), cl = luz(c, .22), cab = '#4f5780', media = '#c9485b';
  const dy = o.medir ? -24 : 0;
  let s = o.medir ? '' : sombraPiso(120, 218, 70);
  // hilo
  s += T(`M120 0 V${96 + dy}`, '#dfebd6', 1.8, .8);
  // patas: 4 por lado, con rodilla y medias a rayas en la punta
  const pata = (x0, y0, xk, yk, xf, yf) => {
    const d = `M${x0} ${y0 + dy} Q${xk} ${yk + dy} ${xf} ${yf + dy}`;
    const mx = n1(xf + (xk - xf) * .3), my = n1(yf + dy + (yk - yf) * .3);
    return tubo(d, c, 5) + T(`M${mx} ${my} L${xf} ${yf + dy}`, media, 5) + `<path d="M${mx} ${my} L${xf} ${yf + dy}" stroke="#f6efe0" stroke-width="5" stroke-dasharray="2 3"/>` + `<circle cx="${xk}" cy="${yk + dy}" r="3" fill="${cl}"/>`;
  };
  const piso = o.medir ? 200 : 214;
  s += pata(84, 134, 38, 104, 28, piso - 10) + pata(80, 152, 34, 136, 40, piso - 2) + pata(90, 170, 54, 168, 62, piso) + pata(98, 182, 76, 192, 84, piso)
    + pata(156, 134, 202, 104, 212, piso - 10) + pata(160, 152, 206, 136, 200, piso - 2) + pata(150, 170, 186, 168, 178, piso) + pata(142, 182, 164, 192, 156, piso);
  // abdomen redondo con dibujo dorado
  s += S(`M120 ${98 + dy} C152 ${98 + dy} 170 ${120 + dy} 168 ${146 + dy} C166 ${172 + dy} 146 ${184 + dy} 120 ${184 + dy} C94 ${184 + dy} 74 ${172 + dy} 72 ${146 + dy} C70 ${120 + dy} 88 ${98 + dy} 120 ${98 + dy}Z`, c);
  s += F(`M150 ${108 + dy} C166 ${124 + dy} 170 ${150 + dy} 158 ${170 + dy} C150 ${178 + dy} 140 ${182 + dy} 130 ${183 + dy} C152 ${166 + dy} 160 ${136 + dy} 150 ${108 + dy}Z`, cs);
  s += `<ellipse cx="102" cy="${118 + dy}" rx="14" ry="8" fill="${cl}" opacity=".7"/>`;
  s += S(`M120 ${112 + dy} L128 ${128 + dy} L120 ${144 + dy} L112 ${128 + dy}Z`, '#f2c66d', 2.4) + `<circle cx="104" cy="${140 + dy}" r="4" fill="#f2c66d" stroke="${L}" stroke-width="1.8"/><circle cx="136" cy="${140 + dy}" r="4" fill="#f2c66d" stroke="${L}" stroke-width="1.8"/>`;
  // pelusa
  s += T(`M76 ${132 + dy} l-5 -2 M74 ${150 + dy} l-6 0 M164 ${132 + dy} l5 -2 M166 ${150 + dy} l6 0`, c, 2.4);
  // cabeza
  s += S(`M90 ${180 + dy} C88 ${160 + dy} 104 ${152 + dy} 120 ${152 + dy} C136 ${152 + dy} 152 ${160 + dy} 150 ${180 + dy} C148 ${198 + dy} 134 ${204 + dy} 120 ${204 + dy} C106 ${204 + dy} 92 ${198 + dy} 90 ${180 + dy}Z`, cab);
  // ojos: dos grandes y dos chiquitos; cejas fruncidas pero cachetes rosados
  for (const x of [109, 131]) s += `<circle cx="${x}" cy="${176 + dy}" r="7.5" fill="#fff" stroke="${L}" stroke-width="2.6"/><circle cx="${x + (x < 120 ? 1.5 : -1.5)}" cy="${178 + dy}" r="3.6" fill="${L}"/><circle cx="${x + .5}" cy="${175.5 + dy}" r="1.2" fill="#fff"/>`;
  s += `<circle cx="102" cy="${165 + dy}" r="2.6" fill="${L}"/><circle cx="138" cy="${165 + dy}" r="2.6" fill="${L}"/>`;
  s += T(`M100 ${166 + dy} L116 ${170 + dy} M140 ${166 + dy} L124 ${170 + dy}`, L, 3);
  s += `<ellipse cx="102" cy="${188 + dy}" rx="5" ry="3" fill="#e8907a" opacity=".55"/><ellipse cx="138" cy="${188 + dy}" rx="5" ry="3" fill="#e8907a" opacity=".55"/>`;
  s += T(`M114 ${192 + dy} Q120 ${188 + dy} 126 ${192 + dy}`, L, 2.4) + T(`M116 ${197 + dy} l-1 4 M124 ${197 + dy} l1 4`, '#dfe4ef', 2.4);
  if (o.medir) {
    // anteojos en la punta de la nariz y cinta métrica al cuello
    s += T(`M100 ${160 + dy} a8 6 0 0 0 16 0 M124 ${160 + dy} a8 6 0 0 0 16 0 M116 ${160 + dy} h8`, '#d9a441', 2.2);
    s += S(`M92 ${196 + dy} C104 ${210 + dy} 136 ${210 + dy} 148 ${196 + dy} L150 ${202 + dy} C136 ${216 + dy} 104 ${216 + dy} 90 ${202 + dy}Z`, '#f2c66d', 2.4);
    s += S(`M140 ${206 + dy} L150 ${236 + dy} L158 ${232 + dy} L148 ${204 + dy}Z`, '#f2c66d', 2.4) + T(`M143 ${214 + dy} l6 -2 M146 ${222 + dy} l6 -2 M148 ${230 + dy} l6 -2`, L, 1.4);
  } else {
    // agujas de tejer cruzadas, el tejido a medio hacer y el ovillo
    s += T('M92 216 L146 196', '#c49a42', 4) + T('M148 216 L94 196', '#c49a42', 4) + `<circle cx="146" cy="196" r="3" fill="${L}"/><circle cx="94" cy="196" r="3" fill="${L}"/>`;
    s += S('M100 206 C104 212 136 212 140 206 L138 222 C130 226 110 226 102 222Z', '#4fa38f', 3) + T('M106 212 v8 M114 213 v9 M122 213 v9 M130 213 v9 M136 212 v7', somb('#4fa38f', .28), 1.6);
    s += `<circle cx="196" cy="212" r="13" fill="${media}" stroke="${L}" stroke-width="3.2"/>` + T('M186 208 C192 202 202 204 206 212 M188 216 C194 210 202 212 206 218', luz(media, .3), 1.8) + T('M184 214 C168 222 154 220 140 214', media, 2);
  }
  return `<svg viewBox="26 0 188 236" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
}

window.WWElenco = { L, n1, mezclar, luz, somb, S, F, T, tubo, sombraPiso, aLoLargo, afinado, chispa, tomillo, nidoHorno, hornero, CEIBO, florCeibo, ramitoCeibo, escenaLaguna, silaboCeibo, caracol, buho, arana, lenta, ulises, hilda };
})();
