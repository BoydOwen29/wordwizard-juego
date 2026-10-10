/**
 * Word Wizard — tarjeta para compartir.
 *
 * Dibuja en un canvas de 1080×1350 (4:5, se ve entera en WhatsApp, Instagram y X) el resultado del desafío
 * o de la subida a la Torre: el bosque de noche, el logo, Silabo y los datos. Nunca muestra las palabras
 * del desafío (serían spoiler para el que todavía no jugó).
 *
 *   WWTarjeta.crear(datos) → Promise<Blob png>
 *   datos: { modo: 'diario'|'arcade', numero, puntos, rango: {nombre, icono}, rangoIdx, nEnc, total, combo, racha,
 *            piso, jefes, palabrasTotal, textos: { ... ya traducidos } }
 */
(function () {
  'use strict';
  const W = 1080, H = 1350;
  const C = { noche: '#1c2f38', noche2: '#142128', pino: '#2c4d58', linea: '#16262c', oro: '#f2c66d', oroOsc: '#c49a42',
    menta: '#dfebd6', bruma: '#bbd0b9', salvia: '#67948f', texto: '#eef4ea', suave: '#b5c8bd', coral: '#e8907a' };

  /** Generador pseudoaleatorio fijo: la tarjeta sale siempre igual para los mismos datos. */
  function azar(semilla) { let a = semilla >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  function imagenSvg(svg) {
    return new Promise((ok, mal) => {
      const img = new Image();
      const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
      img.onload = () => { URL.revokeObjectURL(url); ok(img); };
      img.onerror = (e) => { URL.revokeObjectURL(url); mal(e); };
      img.src = url;
    });
  }

  /** El dibujo del logo de index.html, sin las letras (van aparte, ver letrasLogo). */
  function logo() {
    const orig = document.querySelector('#p-titulo .logo-titulo') || document.querySelector('.logo-titulo');
    if (!orig) return null;
    const svg = orig.cloneNode(true);
    // las letras se dibujan aparte en el canvas: Safari no carga fuentes dentro de un SVG usado como imagen
    svg.querySelectorAll('.logo-brillo, .logo-destello, text').forEach((n) => n.remove());
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('width', 680); svg.setAttribute('height', 392);
    return imagenSvg(new XMLSerializer().serializeToString(svg));
  }

  /** Las letras del logo (mismas posiciones que el SVG de index.html, viewBox 340×196), con la fuente de la página. */
  function letrasLogo(ctx, x0, y0, k) {
    ctx.save(); ctx.translate(x0, y0); ctx.scale(k, k);
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.font = "700 40px Fredoka, 'Segoe UI', sans-serif"; ctx.fillStyle = '#1c2f38';
    [['W', 85, -6], ['O', 143, 4], ['R', 201, -3], ['D', 259, 6]].forEach(([l, x, rot]) => {
      ctx.save(); ctx.translate(x, 52); ctx.rotate(rot * Math.PI / 180); ctx.fillText(l, 0, 17); ctx.restore();
    });
    ctx.font = "700 66px Fredoka, 'Segoe UI', sans-serif"; ctx.lineJoin = 'round'; ctx.lineWidth = 11; ctx.strokeStyle = C.linea;
    if ('letterSpacing' in ctx) ctx.letterSpacing = '1px';
    ctx.fillStyle = C.linea; ctx.strokeText('WIZARD', 170, 177); ctx.fillText('WIZARD', 170, 177);
    ctx.strokeText('WIZARD', 170, 170); ctx.fillStyle = C.oro; ctx.fillText('WIZARD', 170, 170);
    ctx.restore();
  }

  function silabo(pose) {
    if (!window.Silabo) return null;
    const o = Object.assign({}, window.Silabo.OFICIAL, pose === 'happy' ? { anguloVarita: -78, rotSombrero: -12 } : {});
    let svg = window.Silabo.mago(o);
    svg = svg.replace('<svg ', '<svg width="660" height="900" ');
    return imagenSvg(svg);
  }

  function redondeado(x, y, w, h, r) {
    return (ctx) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
  }

  /** Pino de tonos planos con contorno, como los del bosque del juego. */
  function pino(ctx, x, base, alto, ancho, color, sombra) {
    const pisos = 4;
    ctx.lineJoin = 'round';
    for (let i = 0; i < pisos; i++) {
      const y0 = base - alto * (i / pisos) * .82, y1 = y0 - alto * .42, a = ancho * (1 - i / (pisos + 1.2));
      ctx.beginPath(); ctx.moveTo(x - a / 2, y0); ctx.lineTo(x, y1); ctx.lineTo(x + a / 2, y0); ctx.closePath();
      ctx.fillStyle = color; ctx.fill();
      ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x + a / 2, y0); ctx.lineTo(x + a * .08, y0); ctx.closePath();
      ctx.fillStyle = sombra; ctx.fill();
    }
  }

  function fondo(ctx, rnd) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#2b4a55'); g.addColorStop(.45, C.noche); g.addColorStop(1, C.noche2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // estrellas
    for (let i = 0; i < 70; i++) {
      const x = rnd() * W, y = rnd() * H * .55, r = .8 + rnd() * 2.2;
      ctx.globalAlpha = .25 + rnd() * .6; ctx.fillStyle = '#fff6da';
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // luna con halo
    const lx = 900, ly = 170;
    const halo = ctx.createRadialGradient(lx, ly, 60, lx, ly, 260);
    halo.addColorStop(0, 'rgba(242,232,196,.28)'); halo.addColorStop(1, 'rgba(242,232,196,0)');
    ctx.fillStyle = halo; ctx.fillRect(lx - 260, ly - 260, 520, 520);
    ctx.fillStyle = '#e9e2c6'; ctx.strokeStyle = C.linea; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(lx, ly, 86, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d3caa8';
    for (const [dx, dy, r] of [[-30, -18, 16], [24, 20, 12], [-6, 40, 9], [34, -34, 7]]) { ctx.beginPath(); ctx.arc(lx + dx, ly + dy, r, 0, Math.PI * 2); ctx.fill(); }
    // tres filas de pinos, de lejos (claros y con niebla) a cerca (oscuros)
    const filas = [
      { base: H * .80, alto: [170, 260], ancho: 120, n: 14, color: '#36565c', sombra: '#2d4b52' },
      { base: H * .90, alto: [230, 340], ancho: 160, n: 10, color: '#24414a', sombra: '#1d363e' },
      { base: H + 20, alto: [300, 440], ancho: 210, n: 7, color: '#182d35', sombra: '#13252c' },
    ];
    filas.forEach((f, k) => {
      for (let i = 0; i < f.n; i++) {
        const x = (i + rnd() * .6) * (W / (f.n - 1)) - 40, alto = f.alto[0] + rnd() * (f.alto[1] - f.alto[0]);
        pino(ctx, x, f.base, alto, f.ancho * (.8 + rnd() * .4), f.color, f.sombra);
      }
      if (k < 2) {
        const n = ctx.createLinearGradient(0, f.base - 120, 0, f.base + 40);
        n.addColorStop(0, 'rgba(187,208,185,0)'); n.addColorStop(1, 'rgba(187,208,185,.16)');
        ctx.fillStyle = n; ctx.fillRect(0, f.base - 120, W, 160);
      }
    });
  }

  /** Texto con contorno grueso y sombra dura (como el WIZARD del logo). */
  function titulo(ctx, txt, x, y, px, color) {
    ctx.font = `700 ${px}px Fredoka, 'Segoe UI', sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round';
    ctx.lineWidth = px * .16; ctx.strokeStyle = C.linea;
    ctx.fillStyle = C.linea; ctx.strokeText(txt, x, y + px * .1); ctx.fillText(txt, x, y + px * .1);
    ctx.strokeText(txt, x, y); ctx.fillStyle = color; ctx.fillText(txt, x, y);
  }

  function texto(ctx, txt, x, y, px, color, peso, alin) {
    ctx.font = `${peso || 800} ${px}px Nunito, 'Segoe UI', sans-serif`;
    ctx.textAlign = alin || 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = color; ctx.fillText(txt, x, y);
  }

  /** Ajusta el tamaño para que un texto entre en un ancho. */
  function encajar(ctx, txt, px, max, fam) {
    let p = px;
    do { ctx.font = `700 ${p}px ${fam || 'Fredoka'}`; if (ctx.measureText(txt).width <= max) break; p -= 2; } while (p > 18);
    return p;
  }

  async function crear(d) {
    await Promise.all(['700 60px Fredoka', '800 30px Nunito', '700 30px Nunito'].map((f) => document.fonts && document.fonts.load(f).catch(() => {})));
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    const rnd = azar((d.numero || d.piso || 7) * 7919 + (d.puntos || 0));
    fondo(ctx, rnd);
    const t = d.textos;

    const [imgLogo, imgMago] = await Promise.all([Promise.resolve().then(logo).catch(() => null), Promise.resolve().then(() => silabo('happy')).catch(() => null)]);
    if (imgLogo) { ctx.drawImage(imgLogo, (W - 580) / 2, 36, 580, 334); letrasLogo(ctx, (W - 580) / 2, 36, 580 / 340); }
    else titulo(ctx, 'WORD WIZARD', W / 2, 220, 110, C.oro);

    // panel de piedra rúnica
    const px = 90, py = 432, pw = W - 180, ph = 540;
    ctx.save();
    ctx.shadowColor = 'rgba(8,16,20,.55)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 18;
    redondeado(px, py, pw, ph, 44)(ctx); ctx.fillStyle = 'rgba(28,47,56,.94)'; ctx.fill();
    ctx.restore();
    redondeado(px, py, pw, ph, 44)(ctx); ctx.lineWidth = 8; ctx.strokeStyle = C.linea; ctx.stroke();
    redondeado(px + 14, py + 14, pw - 28, ph - 28, 32)(ctx); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(242,198,109,.38)'; ctx.stroke();
    // runas de las esquinas
    ctx.fillStyle = 'rgba(242,198,109,.5)';
    for (const [x, y] of [[px + 40, py + 40], [px + pw - 40, py + 40], [px + 40, py + ph - 40], [px + pw - 40, py + ph - 40]]) {
      ctx.beginPath(); ctx.moveTo(x, y - 9); ctx.lineTo(x + 9, y); ctx.lineTo(x, y + 9); ctx.lineTo(x - 9, y); ctx.closePath(); ctx.fill();
    }

    const cx = W / 2;
    // antetítulo en cinta
    const ante = d.modo === 'arcade' ? t.torre.toUpperCase() : `${t.desafio.toUpperCase()} #${d.numero}`;
    ctx.font = "700 40px Fredoka, sans-serif";
    const aw = Math.min(pw - 120, ctx.measureText(ante).width + 90);
    redondeado(cx - aw / 2, py - 34, aw, 72, 36)(ctx); ctx.fillStyle = C.oro; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = C.linea; ctx.stroke();
    ctx.fillStyle = '#3a2a0c'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ante, cx, py + 3);
    ctx.textBaseline = 'alphabetic';

    if (d.modo === 'arcade') {
      texto(ctx, t.llegue, cx, py + 100, 38, C.suave);
      titulo(ctx, `${t.piso.toUpperCase()} ${d.piso}`, cx, py + 235, 150, C.oro);
      texto(ctx, `${d.puntos} ${t.pts}`, cx, py + 310, 58, C.texto, 800);
      const datos = [[`${d.palabrasTotal}`, t.palabras], [`${d.jefes || 0}`, t.jefes], [d.combo ? `x${d.combo}` : "—", t.combo]];
      fichas(ctx, datos, py + 392, pw);
    } else {
      titulo(ctx, String(d.puntos), cx, py + 200, 170, C.oro);
      texto(ctx, t.puntos.toUpperCase(), cx, py + 250, 34, C.suave, 800);
      // rango con su escalera de marcas
      const rn = `${d.rango.icono}  ${d.rango.nombre}`;
      const p = encajar(ctx, rn, 64, pw - 120);
      ctx.font = `700 ${p}px Fredoka, sans-serif`; ctx.fillStyle = C.menta; ctx.textAlign = 'center'; ctx.fillText(rn, cx, py + 330);
      const n = 7, lado = 40, gap = 14, x0 = cx - (n * lado + (n - 1) * gap) / 2;
      for (let i = 0; i < n; i++) {
        const on = i < d.rangoIdx;
        redondeado(x0 + i * (lado + gap), py + 356, lado, lado, 10)(ctx);
        ctx.fillStyle = on ? (i === d.rangoIdx - 1 ? C.oro : C.salvia) : 'rgba(223,235,214,.12)'; ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = C.linea; ctx.stroke();
      }
      const datos = [[`${d.nEnc}/${d.total}`, t.palabras], [d.combo ? `x${d.combo}` : "—", t.combo], [`${d.racha || 0}`, t.racha]];
      fichas(ctx, datos, py + 420, pw);
    }

    // Silabo y su globo de desafío
    if (imgMago) ctx.drawImage(imgMago, 46, H - 388, 272, 371);
    const gx = 330, gy = H - 320, gw = W - gx - 70, gh = 150;
    ctx.save(); ctx.shadowColor = 'rgba(8,16,20,.45)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
    redondeado(gx, gy, gw, gh, 40)(ctx); ctx.fillStyle = C.menta; ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.moveTo(gx + 10, gy + gh - 60); ctx.lineTo(gx - 34, gy + gh - 10); ctx.lineTo(gx + 40, gy + gh - 30); ctx.closePath(); ctx.fillStyle = C.menta; ctx.fill();
    redondeado(gx, gy, gw, gh, 40)(ctx); ctx.lineWidth = 7; ctx.strokeStyle = C.linea; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(gx + 6, gy + gh - 62); ctx.lineTo(gx - 34, gy + gh - 10); ctx.lineTo(gx + 44, gy + gh - 27); ctx.stroke();
    redondeado(gx + 3, gy + 3, gw - 6, gh - 6, 37)(ctx); ctx.fillStyle = C.menta; ctx.fill();
    const pr = encajar(ctx, t.reto, 58, gw - 60);
    ctx.font = `700 ${pr}px Fredoka, sans-serif`; ctx.fillStyle = C.noche; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(t.reto, gx + gw / 2, gy + gh / 2 + 2);
    ctx.textBaseline = 'alphabetic';
    texto(ctx, 'wordwizard.capralabsgames.com', gx + gw / 2, H - 110, 32, C.bruma, 800);

    return new Promise((ok, mal) => cv.toBlob((b) => (b ? ok(b) : mal(new Error('sin imagen'))), 'image/png'));
  }

  /** Tres fichas de dato (valor grande, etiqueta chica) en fila. */
  function fichas(ctx, datos, y, pw) {
    const n = datos.length, gap = 26, w = (pw - 120 - gap * (n - 1)) / n, x0 = (W - pw) / 2 + 60;
    datos.forEach(([v, l], i) => {
      const x = x0 + i * (w + gap);
      redondeado(x, y, w, 96, 22)(ctx); ctx.fillStyle = 'rgba(223,235,214,.10)'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(223,235,214,.22)'; ctx.stroke();
      ctx.font = '700 44px Fredoka, sans-serif'; ctx.fillStyle = C.texto; ctx.textAlign = 'center'; ctx.fillText(v, x + w / 2, y + 50);
      const pl = encajar(ctx, l.toUpperCase(), 22, w - 16, 'Nunito');
      ctx.font = `800 ${pl}px Nunito, sans-serif`; ctx.fillStyle = C.suave; ctx.fillText(l.toUpperCase(), x + w / 2, y + 80);
    });
  }

  window.WWTarjeta = { crear };
})();
