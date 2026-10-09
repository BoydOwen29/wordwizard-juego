/**
 * Word Wizard — la vida del bosque: bichos, sorpresas y respuestas a los toques.
 * Mismo trazo que Silabo y que escena.js (tonos planos, contorno de color). Todo es chiquito y tierno.
 *
 *   WWVida.montar(cont, escena)  cont: capa donde se dibujan (encima del bosque); escena: dónde buscar la luna y el búho
 *   WWVida.activar(on)           solo vive en el bosque del título y del inicio
 *   WWVida.tocar(x, y)           toque en el fondo (coordenadas de pantalla). Devuelve qué tocó o null
 *   WWVida.conjuro(x, y)         mariposas que salen del sombrero de Silabo
 *   WWVida.ahora(nombre)         'conejo' | 'caracol' | 'dragon' (para probar en el laboratorio)
 *
 * Sorpresas: la telaraña de la rama (la araña baja enojada y se va), el conejo que cruza, el caracol que se esconde,
 * el dragón que pasa muy de vez en cuando (si lo tocás, escupe fuego y da una vuelta), el búho que ulula,
 * la luna que guiña y chispitas donde toques.
 */
(function () {
  'use strict';
  const L = '#16262c';
  const QUIETO = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const azar = (a, b) => a + Math.random() * (b - a);
  const sonar = (n) => { if (window.WWAudio && window.WWAudio[n]) window.WWAudio[n](); };
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

  // ---------------------------------------------------------------- dibujos (en su propio viewBox, mirando a la derecha)
  const DIBUJO = {
    arana: () => `<svg class="v-arana" viewBox="-22 -22 44 40" width="44" height="40" overflow="visible">
      <g class="v-patas" fill="none" stroke="${L}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M-5 -1 Q-12 -9 -17 -4"/><path d="M-5 2 Q-14 -2 -19 4"/><path d="M-5 4 Q-13 6 -17 12"/><path d="M-4 6 Q-9 11 -12 16"/>
        <path d="M5 -1 Q12 -9 17 -4"/><path d="M5 2 Q14 -2 19 4"/><path d="M5 4 Q13 6 17 12"/><path d="M4 6 Q9 11 12 16"/>
      </g>
      <ellipse cx="0" cy="5" rx="8" ry="7.5" fill="#3b3550" stroke="${L}" stroke-width="2.2"/>
      <path d="M-3.5 7 Q0 10.5 3.5 7" fill="none" stroke="#5a5275" stroke-width="2" stroke-linecap="round"/>
      <circle cx="0" cy="-4" r="6" fill="#4a4366" stroke="${L}" stroke-width="2.2"/>
      <circle cx="-2.4" cy="-5" r="2.5" fill="#fff"/><circle cx="2.4" cy="-5" r="2.5" fill="#fff"/>
      <circle class="v-pupila" cx="-2" cy="-4.6" r="1.2" fill="${L}"/><circle class="v-pupila" cx="2.8" cy="-4.6" r="1.2" fill="${L}"/>
      <g class="v-cejas" stroke="${L}" stroke-width="1.8" stroke-linecap="round"><path d="M-5 -9 L-0.8 -7.2"/><path d="M5 -9 L0.8 -7.2"/></g>
      <path class="v-boca" d="M-1.6 -0.8 Q0 0.4 1.6 -0.8" fill="none" stroke="${L}" stroke-width="1.4" stroke-linecap="round"/>
      <g class="v-mejillas"><circle cx="-4.4" cy="-1.6" r="1.4" fill="#e8907a" opacity=".85"/><circle cx="4.4" cy="-1.6" r="1.4" fill="#e8907a" opacity=".85"/></g>
    </svg>`,

    conejo: () => `<svg class="v-conejo" viewBox="-24 -40 50 46" width="50" height="46" overflow="visible">
      <g class="v-orejas">
        <path d="M-2 -18 Q-10 -40 -4 -42 Q2 -40 2 -19Z" fill="#efe9dc" stroke="${L}" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M-2.5 -21 Q-6.5 -36 -3.8 -38 Q-0.8 -36 -0.6 -21Z" fill="#e8a598"/>
        <path d="M4 -18 Q4 -40 11 -40 Q15 -36 8 -17Z" fill="#e3dccd" stroke="${L}" stroke-width="2.4" stroke-linejoin="round"/>
      </g>
      <circle cx="-18" cy="-6" r="5.5" fill="#fbf8f1" stroke="${L}" stroke-width="2.2"/>
      <ellipse cx="-5" cy="-6" rx="14" ry="11" fill="#efe9dc" stroke="${L}" stroke-width="2.4"/>
      <path d="M-14 3 Q-6 0 2 3" fill="none" stroke="#d6cdb9" stroke-width="3" stroke-linecap="round"/>
      <circle cx="6" cy="-15" r="9.5" fill="#efe9dc" stroke="${L}" stroke-width="2.4"/>
      <circle cx="9.5" cy="-17" r="1.9" fill="${L}"/><circle cx="10.2" cy="-17.7" r=".6" fill="#fff"/>
      <circle cx="9" cy="-12.3" r="1.6" fill="#e8907a" opacity=".7"/>
      <path class="v-nariz" d="M14.6 -14.6 l1.6 1 l-1.6 1 z" fill="#e8907a" stroke="${L}" stroke-width="1"/>
      <path d="M4 3 l0 2 M10 1 l0 4" stroke="${L}" stroke-width="2.4" stroke-linecap="round"/>
      <ellipse cx="7" cy="4.5" rx="4" ry="2.2" fill="#efe9dc" stroke="${L}" stroke-width="2"/>
    </svg>`,

    caracol: () => `<svg class="v-caracol" viewBox="-24 -30 50 34" width="50" height="34" overflow="visible">
      <g class="v-cuerpo">
        <path d="M-20 2 Q-22 -4 -12 -4 L10 -4 Q16 -4 18 -14 Q19 -18 23 -16 Q24 -10 20 -3 Q18 2 12 2Z" fill="#a9bd9f" stroke="${L}" stroke-width="2.2" stroke-linejoin="round"/>
        <g class="v-antenas" stroke="${L}" stroke-width="1.8" stroke-linecap="round" fill="none"><path d="M19 -16 Q18 -24 15 -27"/><path d="M21.5 -15.5 Q23 -24 22 -28"/></g>
        <circle cx="15" cy="-27" r="2" fill="#a9bd9f" stroke="${L}" stroke-width="1.4"/><circle cx="22" cy="-28" r="2" fill="#a9bd9f" stroke="${L}" stroke-width="1.4"/>
        <circle cx="15.4" cy="-27" r=".8" fill="${L}"/><circle cx="22.4" cy="-28" r=".8" fill="${L}"/>
        <path d="M18.5 -9 Q20 -8 21.2 -9.2" fill="none" stroke="${L}" stroke-width="1.2" stroke-linecap="round"/>
      </g>
      <circle cx="-4" cy="-13" r="12" fill="#d9a441" stroke="${L}" stroke-width="2.4"/>
      <path d="M-4 -13 m0 -7 a7 7 0 1 1 -6.5 9.5 a4.5 4.5 0 1 1 6 -5 a2 2 0 1 1 -2 2.6" fill="none" stroke="#a8742a" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M-12 -21 Q-8 -24.5 -3 -24.6" fill="none" stroke="#f2d48d" stroke-width="2" stroke-linecap="round"/>
    </svg>`,

    dragon: () => `<svg class="v-dragon" viewBox="-66 -40 128 74" width="128" height="74" overflow="visible">
      <g class="v-ala-atras"><path d="M-6 -6 Q-8 -36 18 -40 Q12 -28 20 -24 Q8 -22 14 -14 Q2 -14 6 -6Z" fill="#8f2f4a" stroke="${L}" stroke-width="2.4" stroke-linejoin="round"/></g>
      <path class="v-cola" d="M-14 2 Q-34 10 -48 0 Q-56 -6 -62 -2" fill="none" stroke="${L}" stroke-width="8.5" stroke-linecap="round"/>
      <path class="v-cola" d="M-14 2 Q-34 10 -48 0 Q-56 -6 -62 -2" fill="none" stroke="#c4553f" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M-62 -2 l-5 -6 l2 8 l-6 3 l9 1z" fill="#f2c66d" stroke="${L}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M-20 2 Q-18 -12 2 -12 Q18 -12 24 -18 Q28 -22 34 -20 L34 -12 Q26 2 6 8 Q-14 12 -20 2Z" fill="#c4553f" stroke="${L}" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M-14 4 Q2 8 20 -4" fill="none" stroke="#f2c66d" stroke-width="4" stroke-linecap="round"/>
      <path d="M-6 -12 l3 -5 l3 5 M4 -12 l3 -5 l3 5 M14 -14 l3 -5 l2 5" fill="#f2c66d" stroke="${L}" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M-8 8 l-2 6 M8 6 l2 6" stroke="${L}" stroke-width="3" stroke-linecap="round"/>
      <path d="M30 -24 Q42 -30 50 -24 Q56 -20 54 -14 Q48 -11 38 -12 Q30 -12 28 -18Z" fill="#c4553f" stroke="${L}" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M33 -25 Q28 -30 26 -35 Q32 -32 37 -27Z M39 -27 Q37 -33 38 -38 Q42 -33 43 -28Z" fill="#f2c66d" stroke="${L}" stroke-width="1.8" stroke-linejoin="round"/>
      <circle cx="42" cy="-22" r="2.6" fill="#fff6d8" stroke="${L}" stroke-width="1.4"/><circle cx="42.8" cy="-22" r="1.2" fill="${L}"/>
      <circle cx="51" cy="-17.5" r=".9" fill="${L}"/>
      <path d="M44 -13.6 Q48 -12.4 53 -14" fill="none" stroke="${L}" stroke-width="1.4" stroke-linecap="round"/>
      <g class="v-fuego"><path d="M55 -16 Q66 -24 78 -18 Q70 -16 80 -11 Q68 -10 72 -4 Q62 -8 55 -14Z" fill="#f2c66d" stroke="${L}" stroke-width="2" stroke-linejoin="round"/><path d="M57 -15 Q64 -18 70 -15 Q64 -13 66 -9 Q60 -11 57 -14Z" fill="#fff1bf"/></g>
      <g class="v-ala"><path d="M0 -10 Q-4 -44 26 -50 Q18 -36 30 -32 Q14 -28 22 -18 Q8 -18 12 -10Z" fill="#a8384f" stroke="${L}" stroke-width="2.6" stroke-linejoin="round"/>
        <path d="M6 -14 Q4 -34 22 -44 M10 -14 Q16 -26 26 -32" fill="none" stroke="${L}" stroke-width="1.6" stroke-linecap="round" opacity=".6"/></g>
    </svg>`,

    mariposa: (c) => `<svg class="v-mariposa" viewBox="-12 -10 24 20" width="24" height="20" overflow="visible">
      <g class="v-alas"><path d="M0 0 Q-9 -12 -11 -3 Q-11 3 0 1Z M0 0 Q-7 8 -9 6 Q-9 2 0 1Z" fill="${c}" stroke="${L}" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M0 0 Q9 -12 11 -3 Q11 3 0 1Z M0 0 Q7 8 9 6 Q9 2 0 1Z" fill="${c}" stroke="${L}" stroke-width="1.6" stroke-linejoin="round"/></g>
      <path d="M0 -3 L0 4" stroke="${L}" stroke-width="2.2" stroke-linecap="round"/><path d="M0 -3 Q-2 -7 -3.5 -8 M0 -3 Q2 -7 3.5 -8" fill="none" stroke="${L}" stroke-width="1.1"/>
    </svg>`,
  };

  // ---------------------------------------------------------------- la capa
  const Vida = {
    cont: null, escena: null, activa: false, W: 0, H: 0,
    bichos: new Set(),   // los que andan dando vueltas (para tocar)

    montar(cont, escena) {
      this.cont = cont; this.escena = escena || document;
      this.medir();
      let t = null;
      addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => { this.medir(); this.telarana(); }, 300); });
      this.telarana();
      this.programar();
    },

    medir() {
      const r = this.cont.getBoundingClientRect();
      this.W = this.cont.clientWidth || innerWidth; this.H = this.cont.clientHeight || innerHeight;   // sin escalas de CSS
      this.x0 = r.left; this.y0 = r.top; this.k = r.width / this.W || 1;
    },
    /** De coordenadas de pantalla a coordenadas de la capa. */
    local(x, y) { this.medir(); return [(x - this.x0) / this.k, (y - this.y0) / this.k]; },
    /** Altura del pasto donde caminan (el cerro del medio, atrás de Silabo). */
    suelo() { return Math.round(this.H * .68 + 16); },

    activar(on) {
      this.activa = !!on;
      if (this.cont) this.cont.classList.toggle('vida-dormida', !on);
    },

    /** Agrega un elemento posicionado (x, y en la capa). */
    poner(html, cls, x, y) {
      const el = document.createElement('div');
      el.className = 'v ' + cls; el.innerHTML = html;
      el.style.left = Math.round(x) + 'px'; el.style.top = Math.round(y) + 'px';
      this.cont.appendChild(el);
      return el;
    },

    // -------------------------------------------------------------- telaraña y araña
    telarana() {
      if (!this.cont) return;
      if (this.web) this.web.remove();
      const y = Math.max(104, Math.round(this.H * .17));
      // rama que entra desde el borde, con la tela colgada en el rincón
      const cx = 3, cy = 21, R = 60, angs = [6, 24, 43, 62, 82], rs = [13, 24, 35, 46, 57];
      const pt = (a, r) => [cx + Math.cos(a * Math.PI / 180) * r, cy + Math.sin(a * Math.PI / 180) * r];
      let hilos = '';
      for (const a of angs) { const [x, yy] = pt(a, R); hilos += `M${cx} ${cy} L${x.toFixed(1)} ${yy.toFixed(1)} `; }
      for (const r of rs) {
        let d = '';
        angs.forEach((a, i) => { const [x, yy] = pt(a, r); if (!i) d += `M${x.toFixed(1)} ${yy.toFixed(1)}`; else { const [px, py] = pt(angs[i - 1], r); const m = pt((a + angs[i - 1]) / 2, r * .86); d += ` Q${m[0].toFixed(1)} ${m[1].toFixed(1)} ${x.toFixed(1)} ${yy.toFixed(1)}`; void px; void py; } });
        hilos += d + ' ';
      }
      const [ex, ey] = pt(82, R), [bx, by] = pt(6, R);
      hilos += `M${ex.toFixed(1)} ${ey.toFixed(1)} L0 ${(ey + 6).toFixed(1)} M${bx.toFixed(1)} ${by.toFixed(1)} L${(bx + 6).toFixed(1)} 17`;
      const gotas = [[26, 32], [44, 30], [17, 49], [36, 52]].map(([x, yy]) => `<circle cx="${x}" cy="${yy}" r="1.3" fill="#fff" opacity=".75"/>`).join('');
      // hojitas redondas, como las del resto del bosque
      const hoja = (x, yy, a, s) => `<g transform="translate(${x} ${yy}) rotate(${a}) scale(${s || 1})"><path d="M0 0 Q5 -5 12 0 Q5 5 0 0Z" fill="#4f7a6a" stroke="${L}" stroke-width="1.8" stroke-linejoin="round"/><path d="M1.5 0 L9 0" stroke="#3a5e52" stroke-width="1.2" stroke-linecap="round"/></g>`;
      const html = `<svg viewBox="-12 0 124 96" width="124" height="96" overflow="visible">
        <path d="M-14 15 Q28 9 62 18 Q74 21 84 20" fill="none" stroke="${L}" stroke-width="9" stroke-linecap="round"/>
        <path d="M-14 15 Q28 9 62 18 Q74 21 84 20" fill="none" stroke="#5a463a" stroke-width="4.6" stroke-linecap="round"/>
        <path d="M-12 13 Q20 8 50 13" fill="none" stroke="#6e5848" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M58 17 Q64 9 72 6" fill="none" stroke="${L}" stroke-width="5" stroke-linecap="round"/><path d="M58 17 Q64 9 72 6" fill="none" stroke="#5a463a" stroke-width="2" stroke-linecap="round"/>
        ${hoja(72, 6, -30)}${hoja(72, 6, 25, .85)}${hoja(84, 20, -12)}${hoja(84, 20, 38, .8)}${hoja(34, 12, -70, .75)}
        <path class="v-tela" d="${hilos}" fill="none" stroke="#eef3ea" stroke-width="1.1" opacity=".6"/>${gotas}
      </svg>`;
      this.web = this.poner(html, 'v-web', 0, y);
      // la araña cuelga de un hilo, dentro de una caja que recorta el hilo por arriba
      const [ax, ay] = pt(43, 34);
      const caja = document.createElement('div'); caja.className = 'v-hilo-caja';
      caja.style.left = Math.round(ax - 30 + 12) + 'px'; caja.style.top = Math.round(ay - 2) + 'px';
      caja.innerHTML = `<div class="v-colgante"><i class="v-hilo"></i>${DIBUJO.arana()}</div>`;
      this.web.appendChild(caja);
      this.arana = caja.querySelector('.v-colgante');
      this.aranaEstado = 'tela';
      if (!this._aranaIdle) this._aranaIdle = setInterval(() => {
        if (!this.activa || document.hidden || this.aranaEstado !== 'tela' || QUIETO) return;
        this.arana.animate([{ transform: 'translateY(0) rotate(0)' }, { transform: 'translateY(2px) rotate(-7deg)' }, { transform: 'translateY(-1px) rotate(6deg)' }, { transform: 'translateY(0) rotate(0)' }], { duration: 900, easing: 'ease-in-out' });
      }, 7000);
    },

    async enojarArana() {
      if (this.aranaEstado !== 'tela') {
        // sin araña: la tela tiembla
        this.web.querySelector('.v-tela').animate([{ transform: 'translate(0,0)' }, { transform: 'translate(1px,2px)' }, { transform: 'translate(-1px,-1px)' }, { transform: 'translate(0,0)' }], { duration: 400 });
        return;
      }
      this.aranaEstado = 'enojada';
      const a = this.arana, svg = a.querySelector('.v-arana');
      svg.classList.add('enojada');
      const bajar = 74;
      await a.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${bajar + 8}px)`, offset: .7 }, { transform: `translateY(${bajar - 5}px)`, offset: .85 }, { transform: `translateY(${bajar}px)` }],
        { duration: 750, easing: 'cubic-bezier(.3,.7,.4,1)', fill: 'forwards' }).finished.catch(() => {});
      sonar('grunon');
      const r = a.getBoundingClientRect(), [bx, by] = this.local(r.right, r.top);
      this.burbuja(bx + 2, by - 8, '#@%!', 'v-burbuja-enojo');
      await svg.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-14deg)' }, { transform: 'rotate(12deg)' }, { transform: 'rotate(-10deg)' }, { transform: 'rotate(8deg)' }, { transform: 'rotate(0)' }],
        { duration: 900, easing: 'ease-in-out' }).finished.catch(() => {});
      await esperar(350);
      // se va trepando, ofendida
      await a.animate([{ transform: `translateY(${bajar}px)` }, { transform: 'translateY(-60px)' }], { duration: 650, easing: 'cubic-bezier(.5,0,.8,.4)', fill: 'forwards' }).finished.catch(() => {});
      svg.classList.remove('enojada');
      this.aranaEstado = 'fuera';
      await esperar(azar(18000, 30000));
      // vuelve despacito, ya tranquila
      await a.animate([{ transform: 'translateY(-60px)' }, { transform: 'translateY(0)' }], { duration: 2600, easing: 'ease-out', fill: 'forwards' }).finished.catch(() => {});
      this.aranaEstado = 'tela';
    },

    burbuja(x, y, texto, cls) {
      const b = this.poner(`<span>${texto}</span>`, 'v-burbuja ' + (cls || ''), x, y);
      setTimeout(() => b.remove(), 1700);
      return b;
    },

    // -------------------------------------------------------------- caminantes: conejo y caracol
    async conejo() {
      if (!this.cont || this._conejo) return;
      const dir = Math.random() < .5 ? 1 : -1, y = this.suelo() - 40;
      const el = this.poner(DIBUJO.conejo(), 'v-conejo-caja' + (dir < 0 ? ' izq' : ''), 0, y);
      const bicho = { el, tipo: 'conejo', huyendo: false };
      this._conejo = bicho; this.bichos.add(bicho);
      let x = dir > 0 ? -50 : this.W + 10;
      const fin = dir > 0 ? this.W + 20 : -60;
      const paradas = [azar(.2, .4), azar(.55, .75)].map((f) => (dir > 0 ? f * this.W : (1 - f) * this.W));
      el.style.transform = `translateX(${x}px)`;
      const salto = async (dx, alto, ms) => {
        const x1 = x + dx;
        await el.animate([{ transform: `translate(${x}px,0)` }, { transform: `translate(${x + dx / 2}px,${-alto}px)` }, { transform: `translate(${x1}px,0)` }],
          { duration: ms, easing: 'ease-in-out', fill: 'forwards' }).finished.catch(() => {});
        x = x1;
      };
      while (dir > 0 ? x < fin : x > fin) {
        if (!this.cont.isConnected) break;
        if (bicho.huyendo) { await salto(dir * 64, 26, 230); continue; }
        await salto(dir * azar(26, 34), azar(12, 17), 380);
        await esperar(azar(60, 160));
        const p = paradas.findIndex((px) => (dir > 0 ? x >= px : x <= px));
        if (p >= 0 && !bicho.huyendo) {
          paradas.splice(p, 1);
          el.classList.add('sentado');
          await esperar(azar(1600, 3200));
          el.classList.remove('sentado');
        }
      }
      el.remove(); this.bichos.delete(bicho); this._conejo = null;
    },

    async caracol() {
      if (!this.cont || this._caracol) return;
      const dir = Math.random() < .5 ? 1 : -1, y = this.suelo() - 30;
      const el = this.poner(DIBUJO.caracol(), 'v-caracol-caja' + (dir < 0 ? ' izq' : ''), 0, y);
      const bicho = { el, tipo: 'caracol' };
      this._caracol = bicho; this.bichos.add(bicho);
      const x0 = dir > 0 ? -50 : this.W + 10, x1 = dir > 0 ? this.W + 10 : -50;
      bicho.anim = el.animate([{ transform: `translateX(${x0}px)` }, { transform: `translateX(${x1}px)` }], { duration: 75000, easing: 'linear', fill: 'forwards' });
      await bicho.anim.finished.catch(() => {});
      el.remove(); this.bichos.delete(bicho); this._caracol = null;
    },

    async esconderCaracol(b) {
      if (b.escondido) return;
      b.escondido = true; sonar('plop');
      b.anim.pause(); b.el.classList.add('escondido');
      await esperar(3800);
      b.el.classList.remove('escondido'); b.anim.play(); b.escondido = false;
    },

    // -------------------------------------------------------------- dragón
    async dragon() {
      if (!this.cont || this._dragon) return;
      const dir = Math.random() < .7 ? 1 : -1, y = this.H * azar(.13, .24);
      const el = this.poner(DIBUJO.dragon(), 'v-dragon-caja' + (dir < 0 ? ' izq' : ''), 0, y);
      const bicho = { el, tipo: 'dragon' };
      this._dragon = bicho; this.bichos.add(bicho);
      const x0 = dir > 0 ? -150 : this.W + 30, x1 = dir > 0 ? this.W + 30 : -150, dy = 14;
      const pasos = 6, frames = [];
      for (let i = 0; i <= pasos; i++) frames.push({ transform: `translate(${x0 + (x1 - x0) * i / pasos}px, ${Math.sin(i * 1.3) * dy}px)` });
      bicho.anim = el.animate(frames, { duration: 12000, easing: 'linear', fill: 'forwards' });
      await bicho.anim.finished.catch(() => {});
      el.remove(); this.bichos.delete(bicho); this._dragon = null;
    },

    async fuegoDragon(b) {
      if (b.ocupado) return;
      b.ocupado = true; sonar('rugido');
      const inner = b.el.querySelector('svg');
      b.el.classList.add('escupe');
      const giro = b.el.classList.contains('izq') ? 'scaleX(-1) ' : '';   // el que vuela a la izquierda está espejado
      await inner.animate([{ transform: giro + 'rotate(0)' }, { transform: giro + 'rotate(-360deg)' }], { duration: 1100, easing: 'cubic-bezier(.4,.1,.3,1)' }).finished.catch(() => {});
      b.el.classList.remove('escupe');
      b.ocupado = false;
    },

    // -------------------------------------------------------------- conjuro de Silabo: mariposas
    conjuro(x, y) {
      if (!this.cont) return;
      sonar('conjuro');
      const [cx, cy] = this.local(x, y);
      ['#f2c66d', '#e8907a', '#c9b6ff', '#9fd8c4'].forEach((col, i) => {
        const m = this.poner(DIBUJO.mariposa(col), 'v-mariposa-caja', cx - 12, cy - 10);
        const dx = (i - 1.5) * azar(40, 70), sube = azar(160, 260), ms = azar(2600, 3600);
        m.animate([
          { transform: 'translate(0,0) scale(.3)', opacity: 0 },
          { transform: `translate(${dx * .3}px,${-sube * .25}px) scale(1)`, opacity: 1, offset: .1 },
          { transform: `translate(${dx * .9 + 20}px,${-sube * .55}px) rotate(${dx > 0 ? 12 : -12}deg)`, offset: .5 },
          { transform: `translate(${dx * 1.3 - 15}px,${-sube * .8}px)`, opacity: 1, offset: .8 },
          { transform: `translate(${dx * 1.6}px,${-sube}px) scale(.8)`, opacity: 0 },
        ], { duration: ms, easing: 'ease-in-out', delay: i * 90, fill: 'both' }).finished.then(() => m.remove(), () => m.remove());
      });
    },

    // -------------------------------------------------------------- chispitas donde toques
    chispas(x, y) {
      const n = 6;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + azar(-.3, .3), d = azar(22, 38);
        const s = this.poner('<svg viewBox="-5 -5 10 10" width="10" height="10"><path d="M0 -5 Q1 -1 5 0 Q1 1 0 5 Q-1 1 -5 0 Q-1 -1 0 -5Z" fill="#fff1bf"/></svg>', 'v-chispa', x - 5, y - 5);
        s.animate([{ transform: 'translate(0,0) scale(.4)', opacity: 1 }, { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px) scale(1) rotate(90deg)`, opacity: 0 }],
          { duration: azar(500, 750), easing: 'cubic-bezier(.2,.7,.3,1)' }).finished.then(() => s.remove(), () => s.remove());
      }
    },

    // -------------------------------------------------------------- toques
    /** Toque en el fondo. Devuelve el nombre de lo que tocó, o null. */
    tocar(x, y) {
      if (!this.activa || !this.cont) return null;
      this.medir();
      const lx = (x - this.x0) / this.k, ly = (y - this.y0) / this.k;
      const cerca = (el, pad) => { const r = el.getBoundingClientRect(); return x > r.left - pad && x < r.right + pad && y > r.top - pad && y < r.bottom + pad; };

      for (const b of this.bichos) {
        if (!cerca(b.el, 16)) continue;
        if (b.tipo === 'conejo' && !b.huyendo) { b.huyendo = true; b.el.classList.add('susto'); sonar('salto'); return 'conejo'; }
        if (b.tipo === 'caracol') { this.esconderCaracol(b); return 'caracol'; }
        if (b.tipo === 'dragon') { this.fuegoDragon(b); return 'dragon'; }
      }
      if (this.web && cerca(this.web.querySelector('svg'), 10)) { this.enojarArana(); return 'arana'; }
      const buho = this.escena.querySelector('.esc-buho');
      if (buho && cerca(buho, 18)) {
        if (!this._uluTiempo || Date.now() - this._uluTiempo > 1500) {
          this._uluTiempo = Date.now(); sonar('ulula');
          const r = buho.getBoundingClientRect(), [bx, by] = this.local(r.right, r.top); this.burbuja(bx + 4, by - 14, '¡Uh-uuh!');
        }
        return 'buho';
      }
      const luna = this.escena.querySelector('.esc-astro circle[stroke]');
      if (luna && cerca(luna, 8)) { this.guinoLuna(luna); return 'luna'; }
      if (!this._tChispa || Date.now() - this._tChispa > 120) { this._tChispa = Date.now(); this.chispas(lx, ly); }
      return null;
    },

    /** La luna guiña y se sonroja. La cara va dentro del dibujo de la luna, así las nubes que pasan la tapan. */
    guinoLuna(luna) {
      if (this._luna) return;
      const NS = 'http://www.w3.org/2000/svg';
      const cx = +luna.getAttribute('cx'), cy = +luna.getAttribute('cy'), k = +luna.getAttribute('r') / 20;
      const cara = document.createElementNS(NS, 'g');
      cara.setAttribute('class', 'v-luna');
      cara.setAttribute('transform', `translate(${cx} ${cy}) scale(${k})`);
      cara.innerHTML = `<path d="M-9 -3 Q-6 -6 -3 -3" fill="none" stroke="${L}" stroke-width="2" stroke-linecap="round"/>
        <g class="v-ojo-luna"><circle cx="6" cy="-3.5" r="2" fill="${L}"/></g>
        <path d="M-6 4 Q0 9 6 4" fill="none" stroke="${L}" stroke-width="2" stroke-linecap="round"/>
        <circle cx="-11" cy="3" r="2.6" fill="#e8907a" opacity=".55"/><circle cx="11" cy="3" r="2.6" fill="#e8907a" opacity=".55"/>`;
      luna.after(cara);
      this._luna = cara;
      const fin = () => { cara.remove(); this._luna = null; };
      cara.animate([{ opacity: 0 }, { opacity: 1, offset: .15 }, { opacity: 1, offset: .85 }, { opacity: 0 }], { duration: 2600 }).finished.then(fin, fin);
      sonar('risita');
    },

    // -------------------------------------------------------------- cuándo aparecen
    programar() {
      if (QUIETO) return;
      const cada = (fn, min, max, primera) => {
        const vez = () => { setTimeout(vez, azar(min, max)); if (this.activa && !document.hidden) fn(); };
        setTimeout(vez, primera != null ? primera : azar(min, max));
      };
      cada(() => this.conejo(), 45000, 95000, azar(14000, 26000));
      cada(() => this.caracol(), 120000, 220000, azar(40000, 70000));
      cada(() => this.dragon(), 200000, 380000, azar(80000, 140000));   // muy de vez en cuando
    },

    ahora(nombre) { if (this[nombre]) this[nombre](); },
  };

  window.WWVida = Vida;
})();
