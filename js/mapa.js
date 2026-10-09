/**
 * Word Wizard — Capítulo 1: La Torre Arcana. El camino que sube por la torre, dibujado en franjas:
 * el bosque de la entrada, la cueva de cristales, la biblioteca encantada, la cumbre nevada y el cielo.
 * Un nodo por piso (superados en oro, el actual latiendo, los jefes con calavera). Al ganar un piso el
 * tramo se construye, Silabo camina dejando una estela y, si cambia de zona o lo espera un jefe,
 * hay cartel y aparición. Mismo trazo que el resto: tonos planos y contorno de color.
 *
 *   WWMapa.pintar(cont, { actual, hecho, nombreJefe, esJefe, mago, jefe })
 *   WWMapa.avanzar(hasta) → Promise    WWMapa.recorrido(ms) → Promise (paneo de cámara de arriba abajo)
 */
(function () {
  'use strict';
  const L = '#16262c';
  const PASO = 104;
  const PISOS_CAPITULO = 20;
  const n1 = (v) => Math.round(v * 10) / 10;
  const QUIETO = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const F = () => window.WWEscena && window.WWEscena.formas;

  // zonas del capítulo 1 (de abajo hacia arriba)
  const ZONAS = [
    { id: 'bosque', desde: 0, hasta: 0, nombre: 'El bosque', fondo: '#203b45', fondo2: '#26444e', pared: '#1b363e', acento: '#f2c66d' },
    { id: 'cueva', desde: 1, hasta: 5, nombre: 'Cueva de cristales', fondo: '#231c3a', fondo2: '#2a2245', pared: '#3b2f5c', paredSh: '#2d2449', acento: '#b3a3ff' },
    { id: 'biblioteca', desde: 6, hasta: 10, nombre: 'Biblioteca encantada', fondo: '#3d2a22', fondo2: '#4a3226', pared: '#5a3f2f', paredSh: '#4a3326', acento: '#f2c66d' },
    { id: 'cumbre', desde: 11, hasta: 15, nombre: 'Cumbre nevada', fondo: '#6c8da6', fondo2: '#7d9bb2', pared: '#dfe9ef', paredSh: '#b9cbd7', acento: '#ffffff' },
    { id: 'cielo', desde: 16, hasta: 999, nombre: 'Cielo sobre las nubes', fondo: '#9b7fb2', fondo2: '#c493b0', pared: '#fbefe4', paredSh: '#ecd6c8', acento: '#fff1c9' },
  ];
  const zonaDe = (p) => ZONAS.slice().reverse().find((z) => p >= z.desde) || ZONAS[0];

  const Mapa = {
    cont: null, svg: null, lienzo: null, W: 0, H: 0, actual: 0, opts: null, ZONAS, PISOS_CAPITULO, zonaDe,

    punto(p) {
      const y = this.H - 90 - p * PASO;
      const x = p === 0 ? this.W / 2 : this.W / 2 + Math.sin(p * 1.3 + .4) * this.W * .25;
      return { x, y };
    },
    tramo(p) {
      const a = this.punto(p - 1), b = this.punto(p);
      return `M${n1(a.x)} ${n1(a.y)} C${n1(a.x)} ${n1(a.y - PASO * .55)} ${n1(b.x)} ${n1(b.y + PASO * .55)} ${n1(b.x)} ${n1(b.y)}`;
    },
    /** y del borde inferior de la zona (entre el piso desde-1 y desde) */
    borde(desde) { return desde <= 0 ? this.H + 20 : this.punto(desde).y + PASO / 2; },

    /** Una franja de mundo: fondo con borde de arriba ondulado y decorados a los costados. */
    franja(z, yTop, yBot, rnd) {
      const W = this.W, f = F();
      let d = `M-10 ${n1(yBot + 30)} L-10 ${n1(yTop)}`;
      for (let x = 0; x <= W + 20; x += 40) d += ` Q${n1(x + 20)} ${n1(yTop - 14 - rnd() * 10)} ${n1(x + 40)} ${n1(yTop)}`;
      d += ` L${W + 10} ${n1(yBot + 30)}Z`;
      let out = `<path d="${d}" fill="${z.fondo}"/>`;
      const alto = yBot - yTop;
      out += `<rect x="-10" y="${n1(yTop + alto * .45)}" width="${W + 20}" height="${n1(alto * .55 + 30)}" fill="${z.fondo2}" opacity=".7"/>`;
      if (!f) return out;
      f.usarLugar(z.id);
      const lado = (fn) => { for (let y = yBot - 40; y > yTop + 30; y -= 70 + rnd() * 50) { fn(rnd() * W * .13 + 4, y, -1); fn(W - rnd() * W * .13 - 4, y - 30, 1); } };
      if (z.id === 'bosque') {
        lado((x, y) => { const h = 70 + rnd() * 50; out += f.pino(x, y, h, h * .5, '#20404a', '#19343c', 2.5, false, rnd); });
      } else if (z.id === 'cueva') {
        for (const s of [-1, 1]) {
          let pd = `M${s < 0 ? -10 : W + 10} ${n1(yBot + 20)}`;
          for (let y = yBot; y > yTop - 10; y -= 34) pd += ` L${n1(s < 0 ? W * (.06 + rnd() * .09) : W * (.94 - rnd() * .09))} ${n1(y)}`;
          pd += ` L${s < 0 ? -10 : W + 10} ${n1(yTop - 20)}Z`;
          out += `<path d="${pd}" fill="${z.pared}" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>`;
        }
        lado((x, y) => { const h = 34 + rnd() * 30; out += `<g class="mapa-brilla" style="animation-delay:-${n1(rnd() * 3)}s">${f.cristal(x, y, h, h * .7, '#8f7bd9', '#6352ad', 2, rnd)}</g>`; });
      } else if (z.id === 'biblioteca') {
        for (const s of [-1, 1]) {
          const x0 = s < 0 ? -6 : W - W * .16, ancho = W * .16 + 6;
          out += `<rect x="${n1(x0)}" y="${n1(yTop - 10)}" width="${n1(ancho)}" height="${n1(yBot - yTop + 40)}" fill="${z.pared}" stroke="${L}" stroke-width="3"/>`;
          for (let y = yBot - 6; y > yTop + 10; y -= 34) {
            out += `<rect x="${n1(x0)}" y="${n1(y)}" width="${n1(ancho)}" height="5" fill="${z.paredSh}" stroke="${L}" stroke-width="2"/>`;
            let bx = x0 + 6;
            while (bx < x0 + ancho - 8) { const bw = 5 + rnd() * 5, bh = 18 + rnd() * 9; out += `<rect x="${n1(bx)}" y="${n1(y - bh)}" width="${n1(bw)}" height="${n1(bh)}" rx="1.5" fill="${['#c4553f', '#2f7f7a', '#d9a441', '#5b3f6e', '#34507a', '#8f2f4a', '#4f7a3a'][Math.floor(rnd() * 7)]}" stroke="${L}" stroke-width="1.4"/>`; bx += bw + 1.5; }
          }
        }
        for (let y = yBot - 80; y > yTop + 40; y -= 150) {
          const x = W * (.25 + rnd() * .5);
          out += `<g class="mapa-flota" style="animation-delay:-${n1(rnd() * 4)}s"><g transform="translate(${n1(x)} ${n1(y)}) scale(.8)"><path d="M0 0 Q-12 -8 -24 -4 L-24 10 Q-12 6 0 14 Q12 6 24 10 L24 -4 Q12 -8 0 0Z" fill="#f3e2b8" stroke="${L}" stroke-width="2.5" stroke-linejoin="round"/><path d="M0 0 L0 14" stroke="${L}" stroke-width="2"/></g></g>`;
        }
      } else if (z.id === 'cumbre') {
        for (const s of [-1, 1]) for (let y = yBot + 10; y > yTop + 40; y -= 120) {
          const x = s < 0 ? W * .02 : W * .98, w = W * (.18 + rnd() * .06), h = 90 + rnd() * 40;
          out += `<path d="M${n1(x - w)} ${n1(y)} L${n1(x)} ${n1(y - h)} L${n1(x + w)} ${n1(y)}Z" fill="#c9d8e1" stroke="${L}" stroke-width="2.5" stroke-linejoin="round"/>
            <path d="M${n1(x - w * .32)} ${n1(y - h * .68)} L${n1(x)} ${n1(y - h)} L${n1(x + w * .32)} ${n1(y - h * .68)} L${n1(x + w * .12)} ${n1(y - h * .72)} L${n1(x)} ${n1(y - h * .62)} L${n1(x - w * .14)} ${n1(y - h * .73)}Z" fill="#fff" stroke="${L}" stroke-width="2" stroke-linejoin="round"/>`;
        }
        lado((x, y) => { const h = 44 + rnd() * 26; out += f.pino(x, y, h, h * .5, '#4f6f7d', '#43606d', 2, true, rnd); });
        for (let i = 0; i < 26; i++) out += `<circle class="mapa-copo" style="animation-delay:-${n1(rnd() * 6)}s;animation-duration:${n1(5 + rnd() * 4)}s" cx="${n1(rnd() * W)}" cy="${n1(yTop + rnd() * (yBot - yTop))}" r="${n1(1.5 + rnd() * 2)}" fill="#fff"/>`;
      } else if (z.id === 'cielo') {
        out += `<circle cx="${n1(W * .78)}" cy="${n1(yTop + 90)}" r="34" fill="#fff1c9" stroke="${L}" stroke-width="3"/><circle cx="${n1(W * .78)}" cy="${n1(yTop + 90)}" r="58" fill="#fff1c9" opacity=".18"/>`;
        lado((x, y, s) => { out += f.nube(x + s * -10, y, 70 + rnd() * 50, '#ffffff', '#f5e3d6', 1.5, rnd); });
        for (let i = 0; i < 14; i++) out += `<circle class="mapa-titila" style="animation-delay:-${n1(rnd() * 3)}s" cx="${n1(rnd() * W)}" cy="${n1(yTop + rnd() * (yBot - yTop) * .6)}" r="${n1(1 + rnd() * 1.6)}" fill="#fff6d8"/>`;
      }
      for (let i = 0; i < 7; i++) out += `<circle class="mapa-mota" style="animation-delay:-${n1(rnd() * 5)}s" cx="${n1(W * (.15 + rnd() * .7))}" cy="${n1(yTop + rnd() * (yBot - yTop))}" r="${n1(1.5 + rnd() * 1.5)}" fill="${z.acento}"/>`;
      return out;
    },

    pintar(cont, o) {
      this.cont = cont; this.opts = o; this.actual = o.actual;
      const tope = Math.max(o.actual + 4, PISOS_CAPITULO + 1);
      this.W = Math.min(cont.clientWidth || 360, 460);
      this.H = (tope + 1) * PASO + 160;
      const f = F(), rnd = f ? f.azarCon(20261009) : Math.random;
      let mundo = '';
      ZONAS.slice().reverse().forEach((z) => {
        const yBot = this.borde(z.desde);
        const yTop = z.hasta >= 999 ? -40 : this.borde(z.hasta + 1);
        mundo += this.franja(z, yTop, yBot, rnd);
      });
      const c = this.punto(PISOS_CAPITULO);
      if (f) mundo += `<g class="mapa-cima"><circle cx="${n1(c.x)}" cy="${n1(c.y - 64)}" r="22" fill="#fff1bf" opacity=".25"/><path d="${f.estrella(c.x, c.y - 64, 14)}" fill="#fff1bf" stroke="${L}" stroke-width="2.5" stroke-linejoin="round"/></g>`;
      let caminos = '', nodos = '';
      for (let p = 1; p <= tope; p++) {
        const d = this.tramo(p), listo = p <= o.actual;
        caminos += `<g class="tramo ${listo ? 'listo' : ''}" data-p="${p}"><path class="tramo-futuro" d="${d}"/><path class="tramo-borde" d="${d}"/><path class="tramo-tierra" d="${d}"/><path class="tramo-piedras" d="${d}"/></g>`;
      }
      const e = this.punto(0);
      nodos += `<g class="entrada"><path d="M${n1(e.x - 34)} ${n1(e.y + 18)} V${n1(e.y - 10)} A34 34 0 0 1 ${n1(e.x + 34)} ${n1(e.y - 10)} V${n1(e.y + 18)} H${n1(e.x + 20)} V${n1(e.y - 8)} A20 20 0 0 0 ${n1(e.x - 20)} ${n1(e.y - 8)} V${n1(e.y + 18)}Z" fill="#67948f" stroke="${L}" stroke-width="3" stroke-linejoin="round"/></g>`;
      for (let p = 1; p <= tope; p++) {
        const { x, y } = this.punto(p), jefe = o.esJefe(p);
        const estado = p <= o.hecho ? 'hecho' : p === o.actual ? 'actual' : 'futuro';
        const r = jefe ? 27 : 22;
        const icono = estado === 'hecho' ? (jefe ? 'espadas' : 'estrella') : jefe ? 'calavera' : null;
        nodos += `<g class="nodo ${estado}${jefe ? ' jefe' : ''}" data-p="${p}" transform="translate(${n1(x)} ${n1(y)})">
          <circle class="nodo-halo" r="${r + 10}"/><circle class="nodo-base" r="${r}" cy="4"/><circle class="nodo-cara" r="${r}"/>
          ${icono ? `<g transform="translate(-13 -13) scale(.82)">${window.WWIconos.ICONOS[icono]}</g>` : `<text class="nodo-num" y="7">${p}</text>`}</g>`;
        if (jefe) nodos += `<text class="nodo-jefe ${estado}" x="${n1(x)}" y="${n1(y + r + 22)}">${o.nombreJefe(p)}</text>`;
        const z = ZONAS.find((zz) => zz.desde === p);
        if (z) {
          const izq = x > this.W / 2, sx = izq ? x - r - 104 : x + r + 12;
          nodos += `<g class="cartel" transform="translate(${n1(sx)} ${n1(y - 30)})"><path d="M46 22 V56" stroke="${L}" stroke-width="5"/><path d="M46 22 V56" stroke="#7a5a3c" stroke-width="2.5"/>
            <rect x="0" y="0" width="92" height="26" rx="6" fill="#4c5a4b" stroke="${L}" stroke-width="3"/><text x="46" y="17.5">${z.nombre.split(' ')[0]}</text></g>`;
        }
      }
      cont.innerHTML = `<div class="mapa-lienzo" style="height:${this.H}px;width:${this.W}px"><svg class="mapa-svg" width="${this.W}" height="${this.H}" viewBox="0 0 ${this.W} ${this.H}" xmlns="http://www.w3.org/2000/svg"><g class="mapa-mundo">${mundo}</g>${caminos}${nodos}</svg><div class="mapa-silabo" id="mapa-silabo"></div><div class="mapa-jefe" id="mapa-jefe"></div><div class="mapa-chispas" id="mapa-chispas"></div></div>`;
      this.svg = cont.querySelector('svg'); this.lienzo = cont.querySelector('.mapa-lienzo');
      this.svg.querySelectorAll('.tramo.listo path').forEach((pth) => { pth.style.strokeDasharray = pth.classList.contains('tramo-futuro') || pth.classList.contains('tramo-piedras') ? '' : 'none'; });
      this.svg.querySelectorAll('.tramo:not(.listo)').forEach((g) => g.querySelectorAll('.tramo-borde, .tramo-tierra, .tramo-piedras').forEach((pth) => { const l = pth.getTotalLength(); pth.style.strokeDasharray = `${l} ${l}`; pth.style.strokeDashoffset = l; }));
      const s = cont.querySelector('#mapa-silabo');
      if (o.mago) s.appendChild(o.mago.cont);
      if (o.jefe) cont.querySelector('#mapa-jefe').appendChild(o.jefe.cont);
      this.ponerSilabo(this.punto(o.actual));
      this.centrar(this.punto(o.actual).y);
    },

    ponerSilabo(pt, salto) {
      const s = this.cont.querySelector('#mapa-silabo');
      if (s) s.style.transform = `translate(${n1(pt.x - 36)}px, ${n1(pt.y - 100 - (salto || 0))}px)`;
    },
    centrar(y) {
      const vis = this.cont.clientHeight || 400;
      this.cont.scrollTop = Math.max(0, y - vis * .58);
    },

    /** Chispas de la estela de Silabo. */
    chispa(x, y, color, n) {
      const c = this.cont.querySelector('#mapa-chispas'); if (!c || QUIETO) return;
      for (let i = 0; i < (n || 1); i++) {
        const s = document.createElement('i');
        s.style.cssText = `left:${n1(x + (Math.random() - .5) * 18)}px;top:${n1(y + (Math.random() - .5) * 10)}px;background:${color || '#fff1bf'}`;
        c.appendChild(s);
        const a = Math.random() * Math.PI * 2, d = 10 + Math.random() * 26;
        s.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d - 18}px)) scale(0)`, opacity: 0 }],
          { duration: 600 + Math.random() * 500, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => s.remove();
      }
    },
    /** Onda expansiva en un nodo. */
    onda(p, color) {
      const c = this.cont.querySelector('#mapa-chispas'); if (!c || p < 1) return;
      const { x, y } = this.punto(p), o = document.createElement('b');
      o.className = 'mapa-onda'; o.style.cssText = `left:${n1(x)}px;top:${n1(y)}px;border-color:${color || '#f2c66d'}`;
      c.appendChild(o); setTimeout(() => o.remove(), 900);
      this.chispa(x, y, color, 14);
    },

    /** Paneo de cámara desde la cima hasta donde está Silabo (presentación del capítulo). */
    recorrido(ms) {
      return new Promise((listo) => {
        const vis = this.cont.clientHeight || 400, fin = Math.max(0, this.punto(this.actual).y - vis * .58);
        if (QUIETO) { this.cont.scrollTop = fin; listo(); return; }
        const t0 = performance.now();
        this._cortar = false;
        const paso = () => {
          const t = performance.now(), k = Math.min(1, (t - t0) / ms), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
          this.cont.scrollTop = fin * e;
          if (k < 1 && !this._cortar) requestAnimationFrame(paso); else { this.cont.scrollTop = fin; listo(); }
        };
        this.cont.scrollTop = 0;
        requestAnimationFrame(paso);
      });
    },
    cortarRecorrido() { this._cortar = true; },

    avanzar(hasta, alPaso) {
      return new Promise((listo) => {
        const desde = this.actual, g = this.svg && this.svg.querySelector(`.tramo[data-p="${hasta}"]`);
        if (!g || hasta !== desde + 1) { this.actual = hasta; listo(); return; }
        const dur = QUIETO ? 10 : 1100;
        const nodoDesde = this.svg.querySelector(`.nodo[data-p="${desde}"]`);
        if (nodoDesde) { nodoDesde.classList.remove('actual'); nodoDesde.classList.add('hecho', 'recien'); this.onda(desde); }
        g.classList.add('listo');
        g.querySelectorAll('.tramo-borde, .tramo-tierra, .tramo-piedras').forEach((pth) => {
          pth.style.transition = `stroke-dashoffset ${dur}ms cubic-bezier(.5,0,.3,1)`;
          void pth.getBoundingClientRect(); pth.style.strokeDashoffset = 0;
        });
        setTimeout(() => { const pd = g.querySelector('.tramo-piedras'); if (pd) { pd.style.transition = ''; pd.style.strokeDasharray = ''; pd.style.strokeDashoffset = ''; } }, dur + 80);
        const guia = g.querySelector('.tramo-tierra'), largo = guia.getTotalLength();
        const s = this.cont.querySelector('#mapa-silabo');
        if (s) s.classList.toggle('izq', this.punto(hasta).x < this.punto(desde).x);
        const zona = zonaDe(hasta);
        const t0 = performance.now() + (QUIETO ? 0 : 350), durCamino = QUIETO ? 10 : 1600;
        let saltos = 0, ultimaChispa = 0;
        const paso = () => {
          const t = performance.now(), k = Math.max(0, Math.min(1, (t - t0) / durCamino));
          const e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
          const pt = guia.getPointAtLength(e * largo), fase = e * 6;
          if (Math.floor(fase) > saltos) { saltos = Math.floor(fase); if (alPaso) alPaso(saltos); this.chispa(pt.x, pt.y, zona.acento, 4); }
          if (t - ultimaChispa > 70 && k > 0 && k < 1) { ultimaChispa = t; this.chispa(pt.x, pt.y - 6, zona.acento, 1); }
          this.ponerSilabo(pt, Math.abs(Math.sin(fase * Math.PI)) * 14);
          if (k > 0) this.centrar(pt.y);
          if (k < 1) requestAnimationFrame(paso);
          else {
            this.actual = hasta;
            const nodo = this.svg.querySelector(`.nodo[data-p="${hasta}"]`);
            if (nodo) { nodo.classList.remove('futuro'); nodo.classList.add('actual', 'llega'); }
            this.onda(hasta, zona.acento);
            if (s) s.classList.remove('izq');
            listo();
          }
        };
        requestAnimationFrame(paso);
      });
    },

    /** El jefe aparece parado en su nodo, del otro lado de Silabo. */
    mostrarJefe(p) {
      const j = this.cont.querySelector('#mapa-jefe'); if (!j) return;
      const { x, y } = this.punto(p);
      j.style.left = `${n1(x + 8)}px`; j.style.top = `${n1(y - 112)}px`;
      this.ponerSilabo({ x: x - 22, y });
      j.classList.remove('ve'); void j.offsetWidth; j.classList.add('ve');
      this.onda(p, '#ff5c7a');
    },
  };

  window.WWMapa = Mapa;
})();
