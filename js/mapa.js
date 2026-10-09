/**
 * Word Wizard — el camino de la Torre Arcana. Un sendero que serpentea hacia arriba con un nodo por piso:
 * los superados en oro, el actual de madera y latiendo, los que faltan apagados y los jefes con calavera.
 * Al ganar un piso, el tramo siguiente se "construye" y Silabo camina hasta el nodo nuevo.
 * Mismo trazo que el resto: tonos planos y contorno de color.
 *
 *   WWMapa.pintar(cont, { actual, hecho, lugares, nombreJefe, esJefe, mago })
 *   WWMapa.avanzar(hasta) → Promise (anima el tramo y la caminata)
 */
(function () {
  'use strict';
  const L = '#16262c';
  const PASO = 104;          // distancia vertical entre pisos
  const n1 = (v) => Math.round(v * 10) / 10;
  const QUIETO = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  const Mapa = {
    cont: null, svg: null, nodos: [], W: 0, H: 0, actual: 0, opts: null,

    /** Posición del nodo de un piso (0 = la entrada, abajo de todo). */
    punto(p) {
      const y = this.H - 70 - p * PASO;
      const x = p === 0 ? this.W / 2 : this.W / 2 + Math.sin(p * 1.3 + .4) * this.W * .27;
      return { x, y };
    },
    tramo(p) { // del piso p-1 al p
      const a = this.punto(p - 1), b = this.punto(p);
      return `M${n1(a.x)} ${n1(a.y)} C${n1(a.x)} ${n1(a.y - PASO * .55)} ${n1(b.x)} ${n1(b.y + PASO * .55)} ${n1(b.x)} ${n1(b.y)}`;
    },

    /**
     * actual: piso donde está Silabo (0 = entrada). hecho: último piso superado.
     * Se dibuja hasta unos pisos por encima del actual, así se ve lo que viene.
     */
    pintar(cont, o) {
      this.cont = cont; this.opts = o; this.actual = o.actual;
      const tope = Math.max(o.actual + 4, 6);
      this.W = Math.min(cont.clientWidth || 360, 460);
      this.H = (tope + 1) * PASO + 40;
      let caminos = '', nodos = '', carteles = '';
      for (let p = 1; p <= tope; p++) {
        const d = this.tramo(p), listo = p <= o.actual;
        caminos += `<g class="tramo ${listo ? 'listo' : ''}" data-p="${p}">
          <path class="tramo-futuro" d="${d}"/>
          <path class="tramo-borde" d="${d}"/><path class="tramo-tierra" d="${d}"/><path class="tramo-piedras" d="${d}"/></g>`;
      }
      // la entrada: un arco de piedra al pie de la torre
      const e = this.punto(0);
      nodos += `<g class="entrada"><path d="M${n1(e.x - 30)} ${n1(e.y + 16)} V${n1(e.y - 8)} A30 30 0 0 1 ${n1(e.x + 30)} ${n1(e.y - 8)} V${n1(e.y + 16)} H${n1(e.x + 18)} V${n1(e.y - 6)} A18 18 0 0 0 ${n1(e.x - 18)} ${n1(e.y - 6)} V${n1(e.y + 16)}Z" fill="#67948f" stroke="${L}" stroke-width="3" stroke-linejoin="round"/></g>`;
      for (let p = 1; p <= tope; p++) {
        const { x, y } = this.punto(p), jefe = o.esJefe(p);
        const estado = p <= o.hecho ? 'hecho' : p === o.actual ? 'actual' : 'futuro';
        const r = jefe ? 27 : 22;
        const icono = estado === 'hecho' ? (jefe ? 'espadas' : 'estrella') : jefe ? 'calavera' : null;
        nodos += `<g class="nodo ${estado}${jefe ? ' jefe' : ''}" data-p="${p}" transform="translate(${n1(x)} ${n1(y)})">
          <circle class="nodo-halo" r="${r + 10}"/>
          <circle class="nodo-base" r="${r}" cy="4"/>
          <circle class="nodo-cara" r="${r}"/>
          ${icono ? `<g transform="translate(-13 -13) scale(.82)">${window.WWIconos.ICONOS[icono]}</g>` : `<text class="nodo-num" y="7">${p}</text>`}
        </g>`;
        if (jefe) nodos += `<text class="nodo-jefe ${estado}" x="${n1(x)}" y="${n1(y + r + 22)}">${o.nombreJefe(p)}</text>`;
        const lugar = o.lugares.find((l) => l.desde === p);
        if (lugar) {
          const izq = x > this.W / 2, sx = izq ? x - r - 92 : x + r + 12;
          carteles += `<g class="cartel" transform="translate(${n1(sx)} ${n1(y - 30)})">
            <path d="M40 22 V54" stroke="${L}" stroke-width="5"/><path d="M40 22 V54" stroke="#7a5a3c" stroke-width="2.5"/>
            <rect x="0" y="0" width="80" height="26" rx="6" fill="#4c5a4b" stroke="${L}" stroke-width="3"/>
            <text x="40" y="17.5">${lugar.corto}</text></g>`;
        }
      }
      cont.innerHTML = `<div class="mapa-lienzo" style="height:${this.H}px;width:${this.W}px"><svg class="mapa-svg" width="${this.W}" height="${this.H}" viewBox="0 0 ${this.W} ${this.H}" xmlns="http://www.w3.org/2000/svg">${caminos}${carteles}${nodos}</svg><div class="mapa-silabo" id="mapa-silabo"></div></div>`;
      this.svg = cont.querySelector('svg');
      // los tramos ya hechos se ven completos
      this.svg.querySelectorAll('.tramo.listo .tramo-tierra, .tramo.listo .tramo-borde, .tramo.listo .tramo-piedras').forEach((pth) => { pth.style.strokeDasharray = 'none'; });
      this.svg.querySelectorAll('.tramo:not(.listo)').forEach((g) => g.querySelectorAll('.tramo-borde, .tramo-tierra, .tramo-piedras').forEach((pth) => { const l = pth.getTotalLength(); pth.style.strokeDasharray = `${l} ${l}`; pth.style.strokeDashoffset = l; }));
      // Silabo parado en su nodo
      const s = cont.querySelector('#mapa-silabo');
      if (o.mago) { s.appendChild(o.mago.cont); }
      this.ponerSilabo(this.punto(o.actual));
      this.centrar(this.punto(o.actual).y, false);
    },

    ponerSilabo(pt, salto) {
      const s = this.cont.querySelector('#mapa-silabo');
      if (s) s.style.transform = `translate(${n1(pt.x - 36)}px, ${n1(pt.y - 100 - (salto || 0))}px)`;
    },
    centrar(y, suave) {
      const vis = this.cont.clientHeight || 400;
      const top = Math.max(0, y - vis * .58);
      if (suave && this.cont.scrollTo) this.cont.scrollTo({ top, behavior: 'smooth' }); else this.cont.scrollTop = top;
    },

    /** Construye el tramo hasta `hasta` y hace caminar a Silabo. Devuelve una promesa. */
    avanzar(hasta, alPaso) {
      return new Promise((listo) => {
        const desde = this.actual, g = this.svg && this.svg.querySelector(`.tramo[data-p="${hasta}"]`);
        if (!g || hasta !== desde + 1) { this.actual = hasta; listo(); return; }
        const dur = QUIETO ? 10 : 900;
        // 1) el nodo de donde sale se vuelve dorado
        const nodoDesde = this.svg.querySelector(`.nodo[data-p="${desde}"]`);
        if (nodoDesde) { nodoDesde.classList.remove('actual'); nodoDesde.classList.add('hecho', 'recien'); }
        // 2) el camino se construye
        g.classList.add('listo');
        g.querySelectorAll('.tramo-borde, .tramo-tierra, .tramo-piedras').forEach((pth) => {
          pth.style.transition = `stroke-dashoffset ${dur}ms cubic-bezier(.5,0,.3,1)`;
          requestAnimationFrame(() => { pth.style.strokeDashoffset = 0; });
        });
        // 3) Silabo camina por el tramo, a saltitos
        const guia = g.querySelector('.tramo-tierra'), largo = guia.getTotalLength();
        const s = this.cont.querySelector('#mapa-silabo');
        const izq = this.punto(hasta).x < this.punto(desde).x;
        if (s) s.classList.toggle('izq', izq);
        const t0 = performance.now() + (QUIETO ? 0 : 250), durCamino = QUIETO ? 10 : 1300;
        let saltos = 0;
        const paso = (t) => {
          const k = Math.max(0, Math.min(1, (t - t0) / durCamino));
          const e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
          const pt = guia.getPointAtLength(e * largo);
          const fase = e * 5;
          if (Math.floor(fase) > saltos) { saltos = Math.floor(fase); if (alPaso) alPaso(saltos); }
          this.ponerSilabo(pt, Math.abs(Math.sin(fase * Math.PI)) * 12);
          if (k > .1) this.centrar(pt.y, false);
          if (k < 1) requestAnimationFrame(paso);
          else {
            this.actual = hasta;
            const nodo = this.svg.querySelector(`.nodo[data-p="${hasta}"]`);
            if (nodo) { nodo.classList.remove('futuro'); nodo.classList.add('actual', 'llega'); }
            if (s) s.classList.remove('izq');
            listo();
          }
        };
        requestAnimationFrame(paso);
      });
    },
  };

  window.WWMapa = Mapa;
})();
