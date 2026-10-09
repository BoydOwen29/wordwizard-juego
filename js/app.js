/**
 * Word Wizard — pantallas, partidas y progresión.
 */
(function () {
  'use strict';
  const WW = window.WW, Estado = window.WWEstado, Audio = window.WWAudio, Logros = window.WWLogros, Magos = window.WWMago, Ranking = window.WWRanking;
  const $ = (id) => document.getElementById(id);

  const CONFIG = {
    version: '2.9.0',
    diario: { tiempo: 180 },
    arcade: { tiempo: 75, tiempoJefe: 90, vidas: 3 },
    practica: { tiempo: 180 },
    precios: { pista: 8, tiempo: 12, ojo: 15, escudo: 10, vela: 50 },
    velasMax: 2,
    comboVentana: 6000,
  };

  const MENSAJES = {
    corta: ['Muy corta: mínimo 3 letras', 'Más letras, aprendiz', 'Con 3 letras arrancamos'],
    letras: ['Esas letras no están', 'Usá solo las letras de la base', 'Letra de más por ahí'],
    repetida: ['Ya la encontraste', 'Esa ya está', 'Repetida, pero buen ojo'],
    desconocida: ['No la conozco', 'Mi grimorio no la tiene', 'Hmm, esa no vale'],
    ok: ['¡Bien!', '¡Esa es!', '¡Muy bien!', '¡Hechizo logrado!', '¡Seguí así!', '¡Zas!'],
    largo: ['¡Qué palabra!', '¡Brillante!', '¡Palabrón!', '¡Poder arcano!'],
    jefeGolpe: ['¡Ay!', '¡Eso dolió!', 'Grr...', '¡Basta!', '¡Mi barba!'],
    toque: { risa: ['¡Jiji, cosquillas!', '¡Ja! Eso hace cosquillas'], giro: ['¡Wiii!', '¡Qué mareo!'], estornudo: ['¡Achís! ✨', 'Perdón, polvo de hada'], sombrerazo: ['¡Mi sombrero!', '¡Epa!'], despierta: ['¡Eh! No dormía, pensaba', '¿Qué? ¿Quién?'] },
    consejo: ['Probá mezclar las letras 🔀', 'Buscá palabras cortas primero', 'Los plurales también valen', 'Probá con verbos: -ar, -er, -ir', 'La grilla de abajo te dice cuántas faltan', 'Tocame si te aburrís'],
    jefeBurla: ['¿Eso es todo?', 'Ja, ja, ja', 'Patético', 'Seguí intentando', 'Mi abuela lo hace mejor'],
  };
  const QUIETO = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const ICONO_MISION = { palabra: 'libro', larga: 'objetivo', completa: 'trofeo', diario: 'calendario', piso: 'torre', combo: 'llama', practica: 'vela', puntos: 'estrella', seis: 'rayo' };
  const iconoMision = (x) => ICONO_MISION[x.evento] ? WWIconos.html(ICONO_MISION[x.evento]) : x.icono;
  const azar = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const WW_LUGARES = {
    lista: [
      { id: 'cueva', nombre: 'Cueva de cristales', corto: 'Cueva', icono: '💎', desde: 1, rango: '1 a 5' },
      { id: 'biblioteca', nombre: 'Biblioteca encantada', corto: 'Biblioteca', icono: '📚', desde: 6, rango: '6 a 10' },
      { id: 'cumbre', nombre: 'Cumbre nevada', corto: 'Cumbre', icono: '🏔️', desde: 11, rango: '11 a 15' },
      { id: 'cielo', nombre: 'Cielo sobre las nubes', corto: 'Cielo', icono: '☁️', desde: 16, rango: '16 en adelante' },
    ],
    dePiso(p) { let l = this.lista[0]; for (const x of this.lista) if (p >= x.desde) l = x; return l; },
  };

  const App = {
    dic: null, pool: [], hoy: WW.claveDia(), partida: null, pantalla: 'p-titulo', magos: {}, resultadoActual: null,
    instalarEvento: null,

    // ============================================================ arranque
    init() {
      WWIconos.pintar();
      this.magos.titulo = new Magos.Mago($('mago-titulo'));
      this.magos.resultado = new Magos.Mago($('mago-resultado'));
      this.magos.mapa = new Magos.Mago(document.createElement('div'));
      this.magos.mapa.cont.classList.add('mago-mapa');
      this.magos.mapaJefe = new Magos.Mago(document.createElement('div'), { paleta: 'sombra' });
      this.magos.menu = new Magos.Mago($('mago-menu'));
      this.magos.juego = new Magos.Mago($('mago-juego'));
      this.magos.jefe = new Magos.Mago($('mago-jefe'), { paleta: 'sombra' });
      this.magos.menu.visible = this.magos.juego.visible = this.magos.jefe.visible = false;
      if (window.WWEscena) { WWEscena.montar($('esc-atras'), $('esc-frente'), 'bosque'); WWEscena.intro(() => setTimeout(() => this.magos.titulo.animar('happy', 900), 2300)); }
      this.vidaTitulo();
      setTimeout(() => $('p-titulo').classList.remove('con-intro'), 5000);
      this.silaboVivo();
      $('version').textContent = 'v' + CONFIG.version;
      this.destellos();
      this.eventos();
      this.pwa();
      this.juice();
      // cargar diccionario sin congelar la pantalla de título
      setTimeout(() => {
        try {
          this.dic = new WW.Diccionario(window.WW_DICT || '');
          this.pool = window.WW_DESAFIOS || [];
        } catch (e) { this.dic = new WW.Diccionario(''); this.pool = []; }
        if (!this.dic.tamano || !this.pool.length) {
          $('titulo-cargando').textContent = 'No se pudo cargar el diccionario. Recargá la página.';
          $('titulo-cargando').classList.remove('parpadea');
          return;
        }
        $('titulo-cargando').classList.add('oculto');
        this.renderPerfiles();
        $('titulo-perfiles').classList.remove('oculto');
        const p = Estado.cargar();
        if (p) { const b = $('btn-jugar'); b.textContent = '▶ Jugar como ' + p.nombre; b.classList.remove('oculto'); b.onclick = () => { Audio.despertar(); Audio.click(); this.entrar(p.nombre); }; }
      }, 60);
    },

    pwa() {
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        this.instalarEvento = e;
        $('btn-instalar').classList.remove('oculto');
        $('aj-instalar').classList.remove('oculto');
      });
      window.addEventListener('appinstalled', () => {
        this.instalarEvento = null;
        $('btn-instalar').classList.add('oculto');
        $('aj-instalar').classList.add('oculto');
        this.toast('📲 ¡Word Wizard instalado!');
      });
      if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) {
        navigator.serviceWorker.register('sw.js').then((reg) => {
          reg.addEventListener('updatefound', () => {
            const nuevo = reg.installing;
            if (!nuevo) return;
            nuevo.addEventListener('statechange', () => {
              if (nuevo.state === 'installed' && navigator.serviceWorker.controller) {
                this.toast('✨ Hay una versión nueva. Tocá acá para actualizar.', 'accion', () => location.reload());
              }
            });
          });
        }).catch(() => {});
      }
    },

    /** Versión de prueba: el tester escribe y lo manda por WhatsApp (o lo copia) con contexto. */
    comentario() {
      this.modal(`<h3>¿QUÉ TE PARECIÓ?</h3><p>Contame lo que quieras: qué te gustó, qué no se entendió, si algo se rompió.</p>
        <textarea class="modal-input" id="fb-texto" rows="5" style="border-radius:14px;resize:vertical;min-height:110px" placeholder="Escribí acá..."></textarea>
        <div class="fila" style="margin-top:12px"><a class="btn btn-primario" id="fb-wa" href="https://wa.me/" target="_blank" rel="noopener" style="text-decoration:none;text-align:center">Mandar por WhatsApp</a></div>`, [
        { texto: 'Cerrar', clase: 'btn-secundario' },
      ]);
      const fila = document.querySelector('#modal-caja .fila:last-child');
      const copiar = document.createElement('button');
      copiar.className = 'btn btn-secundario'; copiar.textContent = 'Copiar texto';
      copiar.addEventListener('click', () => { Audio.click(); const m = this.mensajeComentario(); if (m) this.copiar(m); else this.toast('Escribí algo primero'); });
      fila.insertBefore(copiar, fila.firstChild);
      const ta = $('fb-texto'), wa = $('fb-wa');
      const actualizar = () => { const m = this.mensajeComentario(); wa.href = 'https://wa.me/?text=' + encodeURIComponent(m || ''); };
      ta.addEventListener('input', actualizar); actualizar();
      wa.addEventListener('click', (e) => { if (!this.mensajeComentario()) { e.preventDefault(); this.toast('Escribí algo primero'); } else this.toast('¡Gracias! 🙌'); });
      setTimeout(() => ta.focus(), 150);
    },
    mensajeComentario() {
      const ta = $('fb-texto'); const t = (ta && ta.value || '').trim();
      if (!t) return '';
      const p = Estado.perfil;
      const ctx = [
        'Word Wizard v' + CONFIG.version,
        p ? `${p.nombre}, nivel ${p.nivel}, ${p.stats.partidas} partidas` : '',
        window.innerWidth + 'x' + window.innerHeight,
        /Android/i.test(navigator.userAgent) ? 'Android' : /iPhone|iPad/i.test(navigator.userAgent) ? 'iPhone' : 'compu',
      ].filter(Boolean).join(' · ');
      return `💬 Comentario sobre Word Wizard\n\n${t}\n\n(${ctx})`;
    },

    alternarMusica() {
      const p = Estado.perfil; if (!p) return;
      p.ajustes.musica = !p.ajustes.musica;
      Audio.setMusica(p.ajustes.musica); Estado.guardar();
      this.pintarMusica();
      this.toast(p.ajustes.musica ? '♪ Música encendida' : 'Música apagada');
    },
    pintarMusica() {
      const on = !!(Estado.perfil && Estado.perfil.ajustes.musica);
      document.querySelectorAll('.btn-musica').forEach((b) => { b.classList.toggle('apagada', !on); b.title = on ? 'Apagar música' : 'Prender música'; });
      if ($('aj-musica')) $('aj-musica').checked = on;
    },

    instalar() {
      if (!this.instalarEvento) return;
      Audio.click();
      this.instalarEvento.prompt();
      this.instalarEvento.userChoice.finally(() => { this.instalarEvento = null; $('btn-instalar').classList.add('oculto'); $('aj-instalar').classList.add('oculto'); });
    },

    renderPerfiles() {
      const cont = $('titulo-lista-perfiles');
      cont.innerHTML = '';
      const todos = Estado.todos();
      for (const n of Object.keys(todos).sort()) {
        const p = todos[n];
        const b = document.createElement('button');
        b.className = 'perfil-btn';
        b.innerHTML = `🧙 <span>${esc(n)}</span><small>NV ${p.nivel || 1}</small>`;
        b.addEventListener('click', () => { Audio.despertar(); this.entrar(n); });
        cont.appendChild(b);
      }
    },

    entrar(nombre) {
      const p = Estado.cargar(nombre) || Estado.crear(nombre);
      if (!p) return;
      if (!Estado.almacenamientoOk()) this.toast('Este navegador no deja guardar: tu progreso se pierde al cerrar.');
      Audio.setSonido(p.ajustes.sonido);
      if (p.ajustes.musica) Audio.musica = true; else Audio.setMusica(false);
      for (const k of ['titulo', 'menu', 'juego', 'resultado', 'mapa']) { this.magos[k].setPaleta(p.sombrero); this.magos[k].setNivel(p.nivel); }
      this.hoy = WW.claveDia();
      this.pintarMusica();
      this.irMenu();
      this.revisarEnCurso();
    },

    // ============================================================ navegación
    mostrar(id) {
      document.querySelectorAll('.pantalla').forEach((s) => s.classList.toggle('activa', s.id === id));
      this.pantalla = id;
      this.magos.titulo.visible = id === 'p-titulo';
      this.magos.menu.visible = id === 'p-menu';
      this.magos.juego.visible = id === 'p-juego';
      this.magos.resultado.visible = id === 'p-resultado';
      this.magos.mapa.visible = this.magos.mapaJefe.visible = id === 'p-mapa';
      this.magos.jefe.visible = id === 'p-juego' && !!(this.partida && this.partida.jefe);
      Audio.musicaSuave(id === 'p-juego');
      document.body.classList.toggle('jugando', id === 'p-juego');
      if (id === 'p-juego' && window.WWEscena) WWEscena.calmar();
      Audio.tema(id === 'p-juego' ? (this.partida && this.partida.jefe ? 'jefe' : 'juego') : id === 'p-mapa' ? 'juego' : 'menu');
      const s = $(id); if (s) s.scrollTop = 0;
    },

    irMenu() {
      this.ponerLugar(null);
      const p = Estado.perfil;
      this.hoy = WW.claveDia();
      if (p.enCurso && p.enCurso.fecha !== this.hoy && !p.diarios[p.enCurso.fecha]) this.cerrarDiarioGuardado(p.enCurso);
      if (this.nivelPendiente) { const n = this.nivelPendiente; this.nivelPendiente = 0; setTimeout(() => this.anunciarNivel(n), 600); }
      $('menu-nombre').textContent = p.nombre;
      $('menu-titulo').textContent = WW.tituloNivel(p.nivel);
      this.pintarXp('menu-xp-fill', 'menu-xp-txt', p.xp);
      $('menu-monedas').textContent = p.monedas;
      $('menu-racha').textContent = Estado.rachaVigente(this.hoy);
      const nv = p.inventario.vela || 0;
      $('menu-velas').innerHTML = nv ? WWIconos.html('vela') + (nv > 1 ? nv : '') : '';
      $('menu-logros').textContent = `${Object.keys(p.logros).length}/${Logros.LOGROS.length}`;
      const n = WW.numeroDia();
      const jugado = p.diarios[this.hoy];
      const enCurso = p.enCurso && p.enCurso.fecha === this.hoy && !jugado;
      $('btn-diario-sub').textContent = jugado ? `#${n} · ${jugado.rango} · ${jugado.puntos} pts` : enCurso ? `#${n} · en curso, ¡volvé rápido!` : `Desafío #${n} · 3 minutos`;
      $('btn-diario-estado').textContent = jugado ? 'LISTO ✓' : enCurso ? 'EN CURSO' : '';
      $('btn-arcade-sub').textContent = 'Capítulo 1 · ' + (p.arcade.mejorPiso ? `mejor: piso ${p.arcade.mejorPiso} · ${p.arcade.mejorPuntaje} pts${p.arcade.jefes ? ` · ${p.arcade.jefes} jefes` : ''}` : 'subí pisos y vencé jefes');
      this.renderMisiones();
      this.mostrar('p-menu');
    },

    pintarXp(idFill, idTxt, xp, nivelForzado) {
      const n = nivelForzado || WW.nivelPorXp(xp);
      const a = WW.xpParaNivel(n), b = WW.xpParaNivel(n + 1);
      const pct = Math.max(0, Math.min(100, ((xp - a) / (b - a)) * 100));
      $(idFill).style.width = pct + '%';
      $(idTxt).textContent = `NV ${n} · ${xp - a}/${b - a} XP`;
    },

    // ============================================================ eventos
    eventos() {
      document.addEventListener('pointerdown', () => Audio.despertar(), { once: true });
      document.addEventListener('keydown', () => Audio.despertar(), { once: true });

      $('form-nombre').addEventListener('submit', (e) => {
        e.preventDefault();
        const n = $('input-nombre').value.trim();
        if (!n) return;
        Audio.despertar(); Audio.click();
        $('input-nombre').value = '';
        this.entrar(n);
      });

      $('btn-diario').addEventListener('click', () => { Audio.click(); this.jugarDiario(); });
      $('btn-arcade').addEventListener('click', () => { Audio.click(); this.verTorre(); });
      $('mapa-jugar').addEventListener('click', () => {
        const t = this._torre; if (!t || $('mapa-jugar').disabled) return;
        Audio.click();
        if (t.pa) this.nuevaPartida('arcade', { piso: t.sig, continuar: true, usadas: t.pa.arcade.usadas });
        else this.nuevaPartida('arcade');
      });
      $('mapa-tienda').addEventListener('click', () => {
        Audio.click();
        this.modal(`<h3>TIENDA</h3><p class="tienda-saldo">TENÉS ${Estado.perfil.monedas} ${WWIconos.html('moneda')}</p><div class="tienda" id="tienda"></div>`, [{ texto: 'Listo', clase: 'btn-primario' }]);
        this.renderTienda();
      });
      $('mapa-salir').addEventListener('click', () => {
        Audio.click();
        const t = this._torre;
        if (!t || !t.pa || t.pa.arcade.cerrada) return this.irMenu();
        this.modal('<h3>¿BAJAR DE LA TORRE?</h3><p>Se termina la subida y se guarda tu puntaje.</p>', [
          { texto: 'Seguir subiendo', clase: 'btn-secundario' },
          { texto: 'Terminar', clase: 'btn-peligro', accion: () => this.cerrarArcade(t.pa) },
        ]);
      });
      $('btn-practica').addEventListener('click', () => { Audio.click(); this.mostrar('p-practica'); });
      $('btn-rankings').addEventListener('click', () => { Audio.click(); this.verRankings(Ranking.activo() ? 'mundo' : 'diario'); });
      $('btn-stats').addEventListener('click', () => { Audio.click(); this.verEstadisticas(); });
      $('btn-logros').addEventListener('click', () => { Audio.click(); this.verLogros(); });
      $('btn-ayuda').addEventListener('click', () => { Audio.click(); this.tutorial(); });
      $('btn-ajustes').addEventListener('click', () => { Audio.click(); this.verAjustes(); });
      $('btn-instalar').addEventListener('click', () => this.instalar());
      for (const id of ['btn-musica-menu', 'btn-musica-juego']) $(id).addEventListener('click', () => this.alternarMusica());
      $('btn-comentario').addEventListener('click', () => { Audio.click(); this.comentario(); });
      $('chip-racha').addEventListener('click', () => { Audio.click(); this.verVela(); });
      if (typeof Audio.vigilarVisibilidad === "function") Audio.vigilarVisibilidad();
      $('aj-instalar').addEventListener('click', () => this.instalar());
      document.querySelectorAll('.btn-volver').forEach((b) => b.addEventListener('click', () => { Audio.click(); this.irMenu(); }));

      document.querySelectorAll('#p-practica [data-largo]').forEach((b) => b.addEventListener('click', () => {
        Audio.click();
        this.nuevaPartida('practica', { largo: Number(b.dataset.largo), reloj: $('practica-reloj').checked });
      }));

      // juego
      $('fichas').addEventListener('click', (e) => {
        const f = e.target.closest('.ficha');
        if (f && !f.classList.contains('usada')) this.elegirFicha(Number(f.dataset.idx));
      });
      $('palabra-actual').addEventListener('click', (e) => {
        const l = e.target.closest('.letra-actual');
        if (l) this.quitarLetra(Number(l.dataset.pos));
      });
      $('btn-borrar').addEventListener('click', () => this.quitarLetra());
      $('btn-mezclar').addEventListener('click', () => this.mezclar());
      $('btn-enviar').addEventListener('click', () => this.enviar());
      $('btn-salir').addEventListener('click', () => this.pedirSalir());
      $('btn-terminar').addEventListener('click', () => this.pedirTerminar());
      document.querySelectorAll('.poder').forEach((b) => b.addEventListener('click', () => this.usarPoder(b.dataset.poder)));
      document.addEventListener('keydown', (e) => this.tecla(e));

      // resultado
      $('btn-compartir').addEventListener('click', () => this.compartir());
      $('btn-ver-palabras').addEventListener('click', () => { Audio.click(); $('res-palabras').classList.toggle('oculto'); });
      $('btn-otra').addEventListener('click', () => {
        Audio.click();
        const r = this.resultadoActual;
        if (!r) return this.irMenu();
        if (r.modo === 'arcade') this.nuevaPartida('arcade');
        else if (r.modo === 'practica') this.nuevaPartida('practica', r.opts);
        else this.irMenu();
      });
      $('btn-res-menu').addEventListener('click', () => { Audio.click(); this.irMenu(); });

      // rankings
      document.querySelectorAll('#tabs-ranking .tab').forEach((t) => t.addEventListener('click', () => { Audio.click(); this.verRankings(t.dataset.tab); }));

      // ajustes
      $('aj-sonido').addEventListener('change', (e) => { Estado.perfil.ajustes.sonido = e.target.checked; Audio.setSonido(e.target.checked); Estado.guardar(); Audio.click(); });
      $('aj-musica').addEventListener('change', (e) => { Estado.perfil.ajustes.musica = e.target.checked; Audio.setMusica(e.target.checked); Estado.guardar(); this.pintarMusica(); });
      $('aj-vibracion').addEventListener('change', (e) => { Estado.perfil.ajustes.vibracion = e.target.checked; Estado.guardar(); });
      $('aj-grilla').addEventListener('change', (e) => { Estado.perfil.ajustes.grilla = e.target.checked; Estado.guardar(); });
      $('aj-nombre').addEventListener('click', () => this.cambiarNombre());
      $('aj-cambiar').addEventListener('click', () => { Audio.click(); Estado.salir(); this.renderPerfiles(); this.mostrar('p-titulo'); });
      $('aj-tutorial').addEventListener('click', () => { Audio.click(); this.tutorial(); });
      $('aj-exportar').addEventListener('click', () => this.exportar());
      $('aj-borrar').addEventListener('click', () => {
        this.modal(`<h3>¿BORRAR A ${esc(Estado.perfil.nombre).toUpperCase()}?</h3><p>Se pierde todo el progreso de este mago en este dispositivo${Ranking.activo() ? ' y sus resultados en el ranking mundial' : ''}.</p>`, [
          { texto: 'Cancelar', clase: 'btn-secundario' },
          { texto: 'Borrar', clase: 'btn-peligro', accion: () => { if (Ranking.activo()) Ranking.borrar(this.claveNube()); Estado.borrar(Estado.perfil.nombre); this.renderPerfiles(); this.mostrar('p-titulo'); } },
        ]);
      });

      window.addEventListener('beforeunload', (e) => {
        if (this.partida && !this.partida.terminada && this.partida.modo === 'diario') { e.preventDefault(); e.returnValue = ''; }
      });
      document.addEventListener('visibilitychange', () => {
        const pa = this.partida; if (!pa || pa.terminada) return;
        if (pa.modo !== 'diario' && pa.deadline && !pa.congelado) {
          if (document.hidden) pa.pausaDesde = Date.now();
          else if (pa.pausaDesde) { pa.deadline += Date.now() - pa.pausaDesde; pa.pausaDesde = 0; }
        }
        if (!document.hidden) this.tic();
      });
    },

    tecla(e) {
      if (this.pantalla !== 'p-juego' || !this.partida || this.partida.terminada) return;
      if (!$('modal').classList.contains('oculto')) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key;
      if (k === 'Enter') { e.preventDefault(); this.enviar(); }
      else if (k === 'Backspace') { e.preventDefault(); this.quitarLetra(); }
      else if (k === ' ') { e.preventDefault(); this.mezclar(); }
      else if (k === 'Escape') { e.preventDefault(); this.limpiarSeleccion(); }
      else if (k.length === 1) {
        const l = WW.normalizar(k);
        if (!/^[a-zñ]$/.test(l)) return;
        e.preventDefault();
        const pa = this.partida;
        const idx = pa.orden.find((i) => !pa.fichas[i].usada && pa.fichas[i].l === l);
        if (idx != null) this.elegirFicha(idx);
        else { Audio.borrar(); this.globo('Esa letra no está', 'mal'); }
      }
    },

    // ============================================================ misiones diarias
    renderMisiones() {
      const m = Estado.misionesHoy(this.hoy);
      const cont = $('misiones-lista');
      cont.innerHTML = '';
      for (const x of m.lista) {
        const d = document.createElement('div');
        d.className = 'mision' + (x.hecha ? ' hecha' : '');
        const pct = Math.min(100, (x.progreso / x.meta) * 100);
        d.innerHTML = `<span class="mision-icono">${iconoMision(x)}</span><div class="mision-info"><span class="mision-texto">${esc(x.texto)}</span><div class="mision-barra"><div style="width:${pct}%"></div></div></div><span class="mision-n">${x.hecha ? '✓' : `${Math.min(x.progreso, x.meta)}/${x.meta}`}</span>`;
        cont.appendChild(d);
      }
      const hechas = m.lista.filter((x) => x.hecha).length;
      $('misiones-estado').innerHTML = hechas === m.lista.length ? '¡TODAS!' : `${hechas}/${m.lista.length} · ${WWIconos.html('moneda')}${WW.RECOMPENSA_MISION.monedas} c/u`;
      Estado.guardar();
    },

    /** Registra progreso de misiones. `valor` suma, o es el máximo alcanzado si la misión es de tipo máximo. */
    mision(evento, valor) {
      const p = Estado.perfil;
      const m = Estado.misionesHoy(this.hoy);
      let cambio = false;
      for (const x of m.lista) {
        if (x.hecha || x.evento !== evento) continue;
        x.progreso = x.maximo ? Math.max(x.progreso, valor) : x.progreso + (valor || 1);
        if (x.progreso >= x.meta) {
          x.hecha = true; cambio = true;
          p.stats.misiones = (p.stats.misiones || 0) + 1;
          Estado.sumarMonedas(WW.RECOMPENSA_MISION.monedas);
          Estado.sumarXp(WW.RECOMPENSA_MISION.xp);
          setTimeout(() => { Audio.mision(); this.toast(`<span>${iconoMision(x)}</span><div><b>Misión cumplida</b><br><small>${esc(x.texto)} · +${WW.RECOMPENSA_MISION.monedas} ${WWIconos.html('moneda')} +${WW.RECOMPENSA_MISION.xp} XP</small></div>`, 'logro'); }, 400);
        }
      }
      if (cambio && !m.bonus && m.lista.every((x) => x.hecha)) {
        m.bonus = true;
        Estado.sumarMonedas(WW.BONUS_TODAS_MISIONES);
        setTimeout(() => this.toast(`<span>🎉</span><div><b>¡Las tres misiones!</b><br><small>Bonus +${WW.BONUS_TODAS_MISIONES} ${WWIconos.html('moneda')}</small></div>`, 'logro'), 1500);
      }
      if (cambio) { this.anunciarLogros(Logros.evaluar(p, { tipo: 'mision' })); Estado.guardar(); }
    },

    // ============================================================ diario en curso (reanudar o cerrar)
    revisarEnCurso() {
      const p = Estado.perfil;
      const c = p.enCurso;
      if (!c) return;
      if (p.diarios[c.fecha]) { p.enCurso = null; Estado.guardar(); return; }
      if (c.fecha === this.hoy && Date.now() < c.deadline) {
        const seg = Math.ceil((c.deadline - Date.now()) / 1000);
        this.modal(`<h3>DESAFÍO EN CURSO</h3><div class="modal-silabo" data-pose="cast"></div><p>Dejaste el desafío #${c.numero} empezado: ${c.encontradas.length} palabras y ${c.puntos} pts. Quedan ${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}.</p>`, [
          { texto: '¡Seguir!', clase: 'btn-primario', accion: () => this.nuevaPartida('diario', { reanudar: c }) },
        ]);
      } else {
        this.cerrarDiarioGuardado(c);
      }
    },

    cerrarDiarioGuardado(c) {
      const p = Estado.perfil;
      const derivables = this.dic.derivables(c.base);
      const totalPuntos = WW.totalPosible(derivables, c.base);
      const base = c.encontradas.reduce((t, w) => t + WW.puntosPalabra(w, c.base), 0);
      const pct = totalPuntos ? (base / totalPuntos) * 100 : 0;
      const rango = WW.rangoPorPct(pct);
      p.diarios[c.fecha] = { numero: c.numero, palabra: c.base, puntos: c.puntos, pct: Math.round(pct * 10) / 10, rango: rango.nombre, encontradas: c.encontradas.slice(), total: derivables.size, totalPuntos, combo: c.combo || 0, fecha: c.fecha };
      Estado.registrarRacha(c.fecha);
      const ri = WW.RANGOS.indexOf(rango);
      const nv = Estado.sumarXp(Math.round(c.puntos * 1.5 + ri * 10));
      if (nv.subio) this.nivelPendiente = nv.despues;
      Estado.sumarMonedas(c.encontradas.length + ri * 4);
      p.stats.partidas += 1;
      if (c.fecha === WW.claveDia()) this.mision('diario', 1);
      p.enCurso = null;
      Estado.guardar();
      this.toast(`${WWIconos.html('calendario')} El desafío #${c.numero} se cerró con ${c.puntos} pts (${rango.nombre}).`);
      if (c.fecha === this.hoy) this.irMenu();
    },

    guardarEnCurso() {
      const pa = this.partida, p = Estado.perfil;
      if (!pa || pa.modo !== 'diario') return;
      p.enCurso = { fecha: this.hoy, base: pa.base, numero: pa.numero, encontradas: pa.encontradas.slice(), deadline: pa.deadline, puntos: pa.puntos, combo: pa.mejorCombo };
      Estado.guardar();
    },

    // ============================================================ partidas
    jugarDiario() {
      const p = Estado.perfil;
      this.hoy = WW.claveDia();
      const hecho = p.diarios[this.hoy];
      if (hecho) { this.mostrarResultadoGuardado(hecho); return; }
      if (p.enCurso && p.enCurso.fecha !== this.hoy && !p.diarios[p.enCurso.fecha]) this.cerrarDiarioGuardado(p.enCurso);
      if (p.enCurso && p.enCurso.fecha === this.hoy) {
        if (Date.now() < p.enCurso.deadline) return this.nuevaPartida('diario', { reanudar: p.enCurso });
        return this.cerrarDiarioGuardado(p.enCurso);
      }
      this.nuevaPartida('diario');
    },

    elegirBase(modo, opts) {
      if (modo === 'diario') {
        const { numero, desafio } = WW.palabraDelDia(this.pool);
        return { base: desafio.p, numero };
      }
      const deHoy = WW.palabraDelDia(this.pool).desafio.p;
      if (modo === 'practica') {
        const cands = this.pool.filter((c) => c.l === (opts.largo || 7) && c.p !== deHoy);
        return { base: azar(cands.length ? cands : this.pool).p };
      }
      // arcade: la dificultad sube con el piso
      const piso = opts.piso || 1;
      let cands;
      if (opts.jefe) cands = this.pool.filter((c) => c.l >= 8 && c.n >= 60);
      else if (piso <= 3) cands = this.pool.filter((c) => c.l === 7 && c.n >= 50);
      else if (piso <= 7) cands = this.pool.filter((c) => c.l <= 8 && c.n >= 40);
      else if (piso <= 12) cands = this.pool.filter((c) => c.l >= 8);
      else cands = this.pool.filter((c) => c.l >= 8 && c.n <= 90);
      if (!cands.length) cands = this.pool;
      // Torre pareja: solo palabras con un total cerca de la mediana del tramo (±15 %),
      // así el mismo piso pide lo mismo sin importar qué palabra toque (docs/AUDITORIA.md)
      const TOT = window.WW_TOTALES;
      let ref = null;
      if (TOT) {
        const vs = cands.map((c) => TOT[c.p]).filter(Boolean).sort((a, b) => a - b);
        const med = vs[vs.length >> 1];
        const banda = cands.filter((c) => TOT[c.p] >= med * .85 && TOT[c.p] <= med * 1.15);
        if (banda.length >= 20) { cands = banda; ref = med; }
      }
      const usadas = opts.usadas || [];
      const libres = cands.filter((c) => !usadas.includes(c.p) && c.p !== deHoy);
      return { base: azar(libres.length ? libres : cands).p, ref };
    },

    nuevaPartida(modo, opts) {
      opts = opts || {};
      const p = Estado.perfil;
      if (!opts.continuar) this.nivelSesion = p.nivel;
      if (!p.tutorial) { return this.tutorial(() => { p.tutorial = true; Estado.guardar(); this.nuevaPartida(modo, opts); }); }
      if (this.partida && this.partida.timer) clearInterval(this.partida.timer);
      const piso = modo === 'arcade' ? (opts.piso || 1) : 0;
      const jefe = modo === 'arcade' && WW.esPisoJefe(piso);
      let base, numero, ref;
      if (opts.reanudar) { base = opts.reanudar.base; numero = opts.reanudar.numero; }
      else ({ base, numero, ref } = this.elegirBase(modo, Object.assign({}, opts, { piso, jefe })));
      const derivables = this.dic.derivables(base);
      const totalPuntos = WW.totalPosible(derivables, base);
      const fichas = base.split('').map((l) => ({ l, usada: false }));
      let tiempo = null;
      if (modo === 'diario') tiempo = CONFIG.diario.tiempo;
      else if (modo === 'arcade') tiempo = jefe ? CONFIG.arcade.tiempoJefe : CONFIG.arcade.tiempo;
      else if (opts.reloj) tiempo = CONFIG.practica.tiempo;

      const anterior = this.partida && this.partida.modo === 'arcade' && modo === 'arcade' && opts.continuar ? this.partida.arcade : null;
      let objetivo = 0;
      if (modo === 'arcade') {
        // el objetivo sale del total típico del tramo, no del de la palabra que tocó
        objetivo = Math.round((ref || totalPuntos) * (0.08 + 0.012 * piso));
        if (jefe) objetivo += 10;
        objetivo = Math.max(12, Math.min(Math.round(totalPuntos * 0.5), objetivo));
      }

      this.partida = {
        modo, opts, base, numero, derivables, total: derivables.size, totalPuntos,
        fichas, orden: WW.mezclar(fichas.map((_, i) => i)), seleccion: [],
        encontradas: [], encontradasSet: new Set(), puntos: 0, puntosBase: 0, puntosPiso: 0,
        combo: 0, mejorCombo: 0, ultimoAcierto: 0,
        tiempoTotal: tiempo, deadline: tiempo ? Date.now() + tiempo * 1000 : null, restante: tiempo, timer: null,
        inicio: Date.now(), terminada: false, pistas: [], ojos: new Set(), escudo: false,
        rangoIdx: 0, monedasGanadas: 0, mejorPalabra: '',
        arcade: modo === 'arcade' ? (anterior || { piso: 1, vidas: CONFIG.arcade.vidas, puntajeTotal: 0, palabrasTotal: 0, usadas: [], monedas: 0, jefes: 0 }) : null,
        objetivo, jefe, nombreJefe: jefe ? WW.nombreJefe(piso) : '',
      };
      const pa = this.partida;
      if (pa.arcade) { pa.arcade.piso = piso; pa.arcade.usadas.push(base); }
      const lugar = modo === 'arcade' ? WW_LUGARES.dePiso(piso) : null;
      const lugarNuevo = lugar && (piso === 1 || WW_LUGARES.dePiso(piso - 1).id !== lugar.id) && !opts.reintento;
      this.ponerLugar(lugar);
      if (lugarNuevo && !jefe) setTimeout(() => this.banner(lugar.icono, lugar.nombre, 'Pisos ' + lugar.rango), 250);
      this.magos.jefe.setEtapa(2);
      if (opts.reanudar) {
        const r = opts.reanudar;
        pa.deadline = r.deadline; pa.restante = Math.ceil((r.deadline - Date.now()) / 1000);
        for (const w of r.encontradas) { pa.encontradas.push(w); pa.encontradasSet.add(w); pa.puntosBase += WW.puntosPalabra(w, base); }
        pa.puntos = r.puntos != null ? r.puntos : pa.puntosBase;
        pa.mejorCombo = r.combo || 0;
        pa.rangoIdx = WW.RANGOS.indexOf(WW.rangoPorPct(totalPuntos ? (pa.puntosBase / totalPuntos) * 100 : 0));
      }
      this.renderJuego();
      this.mostrar('p-juego');
      if (jefe) {
        this.globo(`${pa.nombreJefe}: "${azar(MENSAJES.jefeBurla)}"`, 'mal');
        Audio.jefe(); Audio.tema('jefe');
        this.sacudir(true); this.vineta('flash-rojo'); this.banner('💀', pa.nombreJefe.toUpperCase(), 'Jefe del piso ' + piso, 'rojo');
        this.magos.jefe.animar('cast', 1200);
      } else {
        Audio.setTempo(false);
        this.globo(modo === 'arcade' ? `Piso ${piso}: llegá a ${objetivo} pts` : modo === 'diario' ? (opts.reanudar ? '¡Seguimos! Dale que queda poco' : `Desafío #${numero}. ¡Suerte!`) : 'Sin apuro. ¡A buscar!');
        this.magos.juego.animar('happy', 600);
      }
      if (modo === 'arcade' && piso === 1) this.mision('piso', 1);
      if (modo === 'diario') this.guardarEnCurso();
      if (tiempo) pa.timer = setInterval(() => this.tic(), 250);
      this.tic();
    },

    renderJuego() {
      const pa = this.partida, p = Estado.perfil;
      $('hud-modo').textContent = pa.modo === 'diario' ? `DESAFÍO #${pa.numero}` : pa.modo === 'arcade' ? (pa.jefe ? `JEFE · PISO ${pa.arcade.piso}` : `TORRE · PISO ${pa.arcade.piso}`) : 'PRÁCTICA';
      $('hud-modo').classList.toggle('jefe', !!pa.jefe);
      $('hud-vidas').innerHTML = pa.arcade ? WWIconos.html('corazon').repeat(pa.arcade.vidas) + WWIconos.html('corazonVacio').repeat(CONFIG.arcade.vidas - pa.arcade.vidas) : '';
      $('hud-tiempo').classList.toggle('infinito', !pa.tiempoTotal);
      $('escenario').classList.toggle('con-jefe', !!pa.jefe);
      $('mago-jefe').classList.toggle('oculto', !pa.jefe);
      $('barra-rango').classList.toggle('hp', !!pa.jefe);
      this.renderFichas();
      this.renderSeleccion();
      this.renderEncontradas();
      this.renderProgreso();
      this.renderPoderes();
      $('hud-puntos').textContent = pa.arcade ? pa.arcade.puntajeTotal + pa.puntos : pa.puntos;
      $('combo').textContent = ''; $('combo').classList.remove('fuego');
      $('btn-terminar').classList.toggle('oculto', pa.modo === 'arcade');
      const marcas = $('barra-marcas');
      marcas.innerHTML = '';
      if (pa.modo !== 'arcade') for (const r of WW.RANGOS) { if (r.pct > 0 && r.pct < 100) { const i = document.createElement('i'); i.style.left = r.pct + '%'; marcas.appendChild(i); } }
      this.magos.juego.setPaleta(p.sombrero);
    },

    renderFichas() {
      const pa = this.partida, cont = $('fichas');
      cont.innerHTML = '';
      for (const i of pa.orden) {
        const f = pa.fichas[i];
        const d = document.createElement('button');
        d.className = 'ficha' + (f.usada ? ' usada' : '');
        d.dataset.idx = i;
        d.setAttribute('aria-label', 'letra ' + f.l);
        d.textContent = f.l.toUpperCase();
        cont.appendChild(d);
      }
    },

    renderSeleccion() {
      const pa = this.partida, cont = $('palabra-actual');
      cont.className = 'palabra-actual';
      cont.innerHTML = '';
      if (!pa.seleccion.length) { cont.innerHTML = '<span class="placeholder">Tocá las letras o escribí</span>'; return; }
      pa.seleccion.forEach((idx, pos) => {
        const s = document.createElement('span');
        s.className = 'letra-actual'; s.dataset.pos = pos; s.textContent = pa.fichas[idx].l.toUpperCase();
        cont.appendChild(s);
      });
    },

    renderEncontradas() {
      const pa = this.partida, cont = $('lista-encontradas');
      cont.innerHTML = '';
      for (const h of pa.pistas) {
        if (pa.encontradasSet.has(h.palabra)) continue;
        const c = document.createElement('span'); c.className = 'chip-palabra pista'; c.textContent = h.texto; cont.appendChild(c);
      }
      for (let i = pa.encontradas.length - 1; i >= 0; i--) {
        const w = pa.encontradas[i];
        const c = document.createElement('span');
        c.className = 'chip-palabra' + (w === pa.base ? ' completa' : w.length >= 6 ? ' larga' : '') + (pa.ojos.has(w) ? ' ojo' : '') + (w === this._ultimaNueva ? ' nueva' : '');
        c.textContent = w;
        cont.appendChild(c);
      }
      $('enc-n').textContent = pa.encontradas.length;
      this.renderGrilla();
    },

    renderGrilla() {
      const pa = this.partida, p = Estado.perfil, cont = $('grilla');
      if (p.ajustes.grilla === false) { cont.innerHTML = ''; cont.classList.add('oculto'); return; }
      cont.classList.remove('oculto');
      const tot = {}, enc = {};
      for (const w of pa.derivables) tot[w.length] = (tot[w.length] || 0) + 1;
      for (const w of pa.encontradas) enc[w.length] = (enc[w.length] || 0) + 1;
      cont.innerHTML = Object.keys(tot).map(Number).sort((a, b) => a - b).map((L) => {
        const e = enc[L] || 0, t = tot[L];
        return `<span class="${e >= t ? 'lista' : ''}">${L}: <b>${e}</b>/${t}</span>`;
      }).join('');
    },

    renderProgreso() {
      const pa = this.partida;
      if (pa.modo === 'arcade') {
        if (pa.jefe) {
          const hp = Math.max(0, pa.objetivo - pa.puntosPiso);
          $('barra-rango-fill').style.width = (hp / pa.objetivo * 100) + '%';
          $('rango-icono').textContent = '💀';
          $('rango-nombre').textContent = pa.nombreJefe.toUpperCase();
          $('progreso-txt').textContent = `${hp} HP`;
          return;
        }
        const pct = Math.min(100, (pa.puntosPiso / pa.objetivo) * 100);
        $('barra-rango-fill').style.width = pct + '%';
        $('rango-icono').textContent = '🎯';
        $('rango-nombre').textContent = 'OBJETIVO';
        $('progreso-txt').textContent = `${pa.puntosPiso}/${pa.objetivo}`;
        return;
      }
      const pct = pa.totalPuntos ? (pa.puntosBase / pa.totalPuntos) * 100 : 0;
      const r = WW.rangoPorPct(pct);
      $('barra-rango-fill').style.width = Math.min(100, pct) + '%';
      $('rango-icono').textContent = r.icono;
      $('rango-nombre').textContent = r.nombre.toUpperCase();
      $('progreso-txt').textContent = `${pa.encontradas.length}/${pa.total}`;
    },

    renderPoderes() {
      const pa = this.partida, p = Estado.perfil;
      for (const b of $('poderes').querySelectorAll('.poder')) {
        const k = b.dataset.poder;
        const n = $(`poder-${k}-n`);
        let hab = true, txt = '';
        if (pa.modo === 'diario') { hab = false; txt = '—'; }
        else if (pa.modo === 'practica') {
          if (k === 'pista' || k === 'ojo') txt = 'LIBRE';
          else { hab = false; txt = '—'; }
          if (k === 'tiempo' && pa.tiempoTotal) { hab = true; txt = 'LIBRE'; }
        } else {
          const inv = p.inventario[k] || 0;
          txt = inv > 0 ? `x${inv}` : `${WWIconos.html('moneda')}${CONFIG.precios[k]}`;
          hab = inv > 0 || p.monedas >= CONFIG.precios[k];
          if (k === 'escudo' && pa.escudo) { txt = 'ON'; hab = false; }
        }
        b.disabled = !hab || pa.terminada;
        n.innerHTML = txt;
      }
    },

    tic() {
      const pa = this.partida;
      if (!pa || pa.terminada || pa.congelado || pa.pausaDesde) return;
      if (!pa.deadline) { $('hud-tiempo').textContent = '∞'; $('barra-tiempo-fill').style.width = '100%'; return; }
      const rest = Math.max(0, (pa.deadline - Date.now()) / 1000);
      const seg = Math.ceil(rest);
      if (seg !== pa.restante) {
        pa.restante = seg;
        if (seg <= 10 && seg > 0) Audio.tick();
      }
      $('hud-tiempo').textContent = `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}`;
      $('hud-tiempo').classList.toggle('urgente', seg <= 10);
      Audio.setTempo(seg <= 10 && seg > 0); this.magos.juego.nervioso(seg <= 10 && seg > 0);
      const roja = seg <= 10 && seg > 0;
      if (roja !== !!pa.vinetaRoja) { pa.vinetaRoja = roja; this.vineta(roja ? 'roja' : ''); }
      const fill = $('barra-tiempo-fill');
      fill.style.width = (rest / pa.tiempoTotal * 100) + '%';
      fill.classList.toggle('urgente', seg <= 10);
      if (rest <= 0) this.terminar('tiempo');
    },

    // ------------------------------------------------------------ interacción
    elegirFicha(idx) {
      const pa = this.partida;
      if (!pa || pa.terminada || pa.bloqueo || pa.congelado || pa.fichas[idx].usada) return;
      pa.fichas[idx].usada = true;
      pa.seleccion.push(idx);
      Audio.tecla();
      const el = $('fichas').querySelector(`[data-idx="${idx}"]`);
      if (el) { el.classList.add('usada', 'toque'); const r = el.getBoundingClientRect(); this.magos.juego.mirar(r.left + r.width / 2, r.top + r.height / 2); }
      this.magos.juego.flick();
      this.renderSeleccion();
      this.volarFicha(idx);
    },

    quitarLetra(pos) {
      const pa = this.partida;
      if (!pa || pa.terminada || pa.bloqueo || pa.congelado || !pa.seleccion.length) return;
      if (pos == null) pos = pa.seleccion.length - 1;
      const [idx] = pa.seleccion.splice(pos, 1);
      pa.fichas[idx].usada = false;
      Audio.borrar();
      const el = $('fichas').querySelector(`[data-idx="${idx}"]`);
      if (el) el.classList.remove('usada');
      this.renderSeleccion();
    },

    limpiarSeleccion() {
      const pa = this.partida;
      if (!pa) return;
      for (const idx of pa.seleccion) pa.fichas[idx].usada = false;
      pa.seleccion = [];
      this.renderFichas(); this.renderSeleccion();
    },

    mezclar() {
      const pa = this.partida;
      if (!pa || pa.terminada || pa.bloqueo || pa.congelado) return;
      const antes = {};
      $('fichas').querySelectorAll('.ficha').forEach((f) => { antes[f.dataset.idx] = f.getBoundingClientRect(); });
      pa.orden = WW.mezclar(pa.orden);
      Audio.mezclar(); this.magos.juego.animar('gira', 700);
      this.renderFichas();
      $('fichas').querySelectorAll('.ficha').forEach((f) => {
        const a = antes[f.dataset.idx], b = f.getBoundingClientRect();
        if (!a || !f.animate) return;
        f.animate([{ transform: `translate(${a.left - b.left}px, ${a.top - b.top}px) rotate(${(Math.random() - .5) * 30}deg)` }, { transform: 'translate(0,0) rotate(0)' }], { duration: 420, easing: 'cubic-bezier(.34,1.56,.64,1)' });
      });
    },

    enviar() {
      const pa = this.partida;
      if (!pa || pa.terminada || pa.bloqueo || pa.congelado) return;
      const w = pa.seleccion.map((i) => pa.fichas[i].l).join('');
      if (!w) return;
      const r = this.dic.validar(w, pa.base, pa.encontradasSet);
      if (r.ok) this.acierto(r.palabra, false);
      else this.fallo(r.codigo);
    },

    acierto(w, revelada) {
      const pa = this.partida, p = Estado.perfil;
      const ahora = Date.now();
      const base = WW.puntosPalabra(w, pa.base);
      let pts = revelada ? Math.max(1, Math.round(base / 2)) : base;
      let mult = 1;
      if (!revelada) {
        pa.combo = (ahora - pa.ultimoAcierto <= CONFIG.comboVentana) ? pa.combo + 1 : 1;
        pa.ultimoAcierto = ahora;
        pa.mejorCombo = Math.max(pa.mejorCombo, pa.combo);
        this.magos.juego.setCombo(pa.combo);
        // el combo multiplica en todos los modos: desde el tercer acierto seguido, +25 % por paso, hasta ×2
        if (pa.combo >= 3) mult = 1 + Math.min(pa.combo - 2, 4) * 0.25;
      }
      // el rango y el % se calculan sin combo (puntosBase); el puntaje lleva el combo
      pa.puntosBase += pts;
      pts = Math.round(pts * mult);
      pa.puntos += pts; pa.puntosPiso += pts;
      pa.encontradas.push(w); pa.encontradasSet.add(w);
      if (revelada) pa.ojos.add(w);
      if (!pa.mejorPalabra || base > WW.puntosPalabra(pa.mejorPalabra, pa.base)) pa.mejorPalabra = w;
      if (pa.modo === 'arcade' && !revelada) { pa.arcade.monedas += 1; pa.monedasGanadas += 1; Estado.sumarMonedas(1); }

      // stats de perfil (lo revelado con el ojo no cuenta)
      if (!revelada) {
        p.stats.palabras += 1;
        p.stats.puntos = (p.stats.puntos || 0) + pts;
        p.stats.porLargo[w.length] = (p.stats.porLargo[w.length] || 0) + 1;
        p.stats.mejorLargo = Math.max(p.stats.mejorLargo, w.length);
        p.stats.mejorCombo = Math.max(p.stats.mejorCombo, pa.mejorCombo);
        if (w === pa.base) p.stats.completas += 1;
        if (!p.stats.mejorPalabra || w.length > p.stats.mejorPalabra.length) p.stats.mejorPalabra = w;
        Estado.registrarMejorPalabra(w, base);
      }

      // feedback
      this.particulas($('palabra-actual'), w === pa.base ? '#ffd166' : w.length >= 6 ? '#9d7bff' : '#5ee7ff', w.length >= 6 ? 18 : 10);
      $('palabra-actual').classList.add('ok');
      pa.bloqueo = true; setTimeout(() => { pa.bloqueo = false; if (this.partida === pa && !pa.terminada) this.limpiarSeleccion(); }, 320);
      if (!revelada) this._ultimaNueva = w;
      const colorRayo = w === pa.base ? '#f2c66d' : w.length >= 6 ? '#c9b6ff' : '#dfebd6';
      if (pa.jefe) {
        this.magos.juego.animar('cast', 700);
        this.rayo(this.magos.juego.puntaVarita(), this.centro($('mago-jefe')), colorRayo, () => {
          Audio.golpe(); this.sacudir(w.length >= 6); this.vineta('flash-rojo'); this.magos.jefe.animar('sad', 700);
          this.particulas($('mago-jefe'), colorRayo, 12);
        });
        this.globo(`${azar(MENSAJES.jefeGolpe)} −${pts} HP`, w.length >= 6 ? 'wow' : 'ok');
      } else if (w === pa.base) { Audio.completa(); this.vineta('flash-oro'); this.banner('💎', 'PALABRA COMPLETA', '+' + pts + ' puntos', 'oro'); this.globo('¡PALABRA COMPLETA! +' + pts, 'wow'); this.magos.juego.animar('happy', 1200); }
      else if (w.length >= 6) { Audio.acierto(w.length); this.globo(`${azar(MENSAJES.largo)} +${pts}`, 'wow'); this.magos.juego.animar('cast', 900); }
      else { Audio.acierto(w.length); this.globo(`${azar(MENSAJES.ok)} +${pts}`, 'ok'); this.magos.juego.animar('cast', 600); }
      if (pa.combo >= 3 && !revelada) {
        const c = $('combo'); c.textContent = `COMBO x${pa.combo}` + (mult > 1 ? ` · ×${String(mult).replace('.', ',')}` : ''); c.classList.toggle('fuego', pa.combo >= 5);
        c.classList.remove('pum'); void c.offsetWidth; c.classList.add('pum'); Audio.combo(pa.combo);
      }
      this.flotante(`+${pts}`);
      if (pa.modo === 'arcade' && !revelada) this.flotante(WWIconos.html('moneda'), 1);
      if (!pa.jefe) setTimeout(() => this.rayo(this.magos.juego.puntaVarita(), this.centro($('hud-puntos')), colorRayo, () => this.particulas($('hud-puntos'), colorRayo, 6)), 90);

      const rangoAntes = pa.rangoIdx;
      this.renderEncontradas(); this.renderProgreso(); this.renderPoderes();
      const hp = $('hud-puntos'); this.tween(hp, pa.arcade ? pa.arcade.puntajeTotal + pa.puntos : pa.puntos, 450);
      hp.classList.remove('pum'); void hp.offsetWidth; hp.classList.add('pum');
      if (w === pa.base) this.confeti(70);
      if (pa.modo !== 'arcade') {
        const pct = (pa.puntosBase / pa.totalPuntos) * 100;
        const idx = WW.RANGOS.indexOf(WW.rangoPorPct(pct));
        if (idx > rangoAntes) {
          pa.rangoIdx = idx;
          setTimeout(() => { Audio.rango(); this.vineta('flash'); this.banner(WW.RANGOS[idx].icono, WW.RANGOS[idx].nombre, 'Nuevo rango'); const ra = document.querySelector('.rango-actual'); ra.classList.remove('pum'); void ra.offsetWidth; ra.classList.add('pum'); if (idx >= 4) this.confeti(30); }, 350);
        }
      }

      // misiones (lo revelado no cuenta)
      if (!revelada) {
        this.mision('palabra', 1);
        this.mision('puntos', pts);
        if (w.length >= 5) this.mision('larga', 1);
        if (w.length >= 6) this.mision('seis', 1);
        if (w === pa.base) this.mision('completa', 1);
        this.mision('combo', pa.combo);
        this.anunciarLogros(Logros.evaluar(p, { tipo: 'palabra', palabra: w, segundos: (ahora - pa.inicio) / 1000, restante: pa.deadline ? (pa.deadline - ahora) / 1000 : null }));
      }

      if (pa.modo === 'diario') this.guardarEnCurso();

      if (pa.modo === 'arcade' && pa.puntosPiso >= pa.objetivo) { this.congelarReloj(pa); setTimeout(() => this.pisoSuperado(), 500); }
      else if (pa.encontradas.length >= pa.total) { this.congelarReloj(pa); setTimeout(() => this.terminar('completo'), 600); }
    },

    fallo(codigo) {
      const pa = this.partida, p = Estado.perfil;
      $('palabra-actual').classList.add('mal');
      if (codigo === 'repetida') Audio.repetida(); else Audio.error();
      if (p.ajustes.vibracion && navigator.vibrate) { try { navigator.vibrate(60); } catch (e) { /* sin gesto previo */ } }
      this.globo(azar(MENSAJES[codigo] || MENSAJES.desconocida), 'mal');
      this.magos.juego.animar('sad', 600);
      const pv = this.magos.juego.puntaVarita(); this.humo(pv.x, pv.y);
      if (pa.jefe) { this.magos.jefe.animar('cast', 600); this.rayo(this.magos.jefe.puntaVarita(), this.centro($('mago-juego')), '#ff5c7a', () => this.particulas($('mago-juego'), '#ff5c7a', 8)); }
      if (!pa.escudo) { pa.combo = 0; $('combo').textContent = ''; $('combo').classList.remove('fuego'); this.magos.juego.setCombo(0); }
      pa.bloqueo = true; setTimeout(() => { pa.bloqueo = false; if (this.partida === pa && !pa.terminada) this.limpiarSeleccion(); }, 260);
    },

    globo(texto, clase) {
      const g = $('globo');
      g.textContent = texto;
      g.className = 'globo' + (clase ? ' ' + clase : '');
      void g.offsetWidth;
    },

    flotante(texto, offset) {
      const f = document.createElement('span');
      f.className = 'flotante'; if (texto.startsWith('<i')) f.innerHTML = texto; else f.textContent = texto;
      f.style.left = (90 + (offset || 0) * 40 + Math.random() * 30) + 'px';
      f.style.top = '30px';
      $('flotantes').appendChild(f);
      setTimeout(() => f.remove(), 1000);
    },

    toast(html, clase, accion) {
      const t = document.createElement('div');
      t.className = 'toast' + (clase ? ' ' + clase : ''); t.innerHTML = html;
      if (accion) { t.addEventListener('click', accion); t.style.animationDuration = '12s'; }
      const cont = $('toasts');
      while (cont.children.length >= 3) cont.firstChild.remove();
      cont.appendChild(t);
      setTimeout(() => t.remove(), accion ? 12100 : 3100);
    },

    anunciarLogros(nuevos) {
      if (!nuevos || !nuevos.length) return;
      nuevos.forEach((l, i) => setTimeout(() => { Audio.logro(); this.toast(`<span>${l.icono}</span><div><b>Logro: ${l.nombre}</b><br><small>${l.desc}</small></div>`, 'logro'); }, 600 + i * 900));
      Estado.sumarMonedas(5 * nuevos.length); Estado.guardar();
    },

    // ------------------------------------------------------------ poderes
    usarPoder(k) {
      const pa = this.partida, p = Estado.perfil;
      if (!pa || pa.terminada || pa.modo === 'diario') return;
      if (pa.modo === 'arcade') {
        if (k === 'escudo' && pa.escudo) return;
        if ((p.inventario[k] || 0) > 0) p.inventario[k] -= 1;
        else if (p.monedas >= CONFIG.precios[k]) { Estado.sumarMonedas(-CONFIG.precios[k]); Audio.moneda(); }
        else { this.globo('Te faltan monedas', 'mal'); return; }
      }
      Audio.poder();
      if (k === 'pista') this.darPista();
      else if (k === 'tiempo') { if (pa.deadline) { pa.deadline += 20000; this.tic(); this.globo('+20 segundos', 'ok'); } }
      else if (k === 'ojo') this.ojoArcano();
      else if (k === 'escudo') { pa.escudo = true; this.globo('Escudo activo: el combo no se corta', 'ok'); }
      this.renderPoderes();
      Estado.guardar();
    },

    faltantes() {
      const pa = this.partida;
      return Array.from(pa.derivables).filter((w) => !pa.encontradasSet.has(w));
    },

    darPista() {
      const pa = this.partida;
      const yaPista = new Set(pa.pistas.map((h) => h.palabra));
      let cands = this.faltantes().filter((w) => !yaPista.has(w) && w.length >= 4);
      if (!cands.length) cands = this.faltantes().filter((w) => !yaPista.has(w));
      if (!cands.length) { this.globo('¡No falta ninguna!', 'wow'); return; }
      cands.sort((a, b) => b.length - a.length);
      const w = cands[Math.floor(Math.random() * Math.min(5, cands.length))];
      pa.pistas.push({ palabra: w, texto: (w.slice(0, 2) + '_'.repeat(w.length - 2)).toUpperCase() });
      this.renderEncontradas();
      this.globo(`Pista: ${pa.pistas[pa.pistas.length - 1].texto}`, 'ok');
    },

    ojoArcano() {
      const pa = this.partida;
      let cands = this.faltantes().filter((w) => w.length >= 5 && w !== pa.base);
      if (!cands.length) cands = this.faltantes();
      if (!cands.length) { this.globo('¡No falta ninguna!', 'wow'); return; }
      const w = azar(cands);
      this.acierto(w, true);
      this.globo(`El ojo revela: ${w.toUpperCase()}`, 'wow');
    },

    // ------------------------------------------------------------ fin de partida
    pedirSalir() {
      const pa = this.partida;
      if (!pa || pa.terminada) {
        if (pa && pa.modo === 'arcade' && pa.arcade && !pa.arcade.cerrada && !document.querySelector('#modal:not(.oculto)')) return this.cerrarArcade(pa);
        return this.irMenu();
      }
      if (pa.congelado) return;
      const aviso = pa.modo === 'diario' ? 'El reloj sigue corriendo aunque salgas. Podés volver desde el menú si queda tiempo.' : pa.modo === 'arcade' ? 'Se termina la subida: se guarda el puntaje que llevás.' : 'La práctica no se guarda.';
      this.modal(`<h3>¿SALIR?</h3><p>${aviso}</p>`, [
        { texto: 'Seguir jugando', clase: 'btn-secundario' },
        { texto: 'Salir', clase: 'btn-peligro', accion: () => { if (pa.modo === 'practica') this.abandonarPractica(); else if (pa.modo === 'diario') this.salirDiario(); else this.terminar('abandono'); } },
      ]);
    },

    salirDiario() {
      const pa = this.partida;
      this.guardarEnCurso();
      pa.terminada = true; clearInterval(pa.timer);
      this.limpiarEfectos();
      this.irMenu();
    },

    pedirTerminar() {
      const pa = this.partida;
      if (!pa || pa.terminada) return;
      if (pa.modo === 'practica') return this.terminar('manual');
      this.modal(`<h3>¿TERMINAR AHORA?</h3><p>Se cierra con ${pa.puntos} puntos y ${pa.encontradas.length} palabras.</p>`, [
        { texto: 'Seguir', clase: 'btn-secundario' },
        { texto: 'Terminar', clase: 'btn-primario', accion: () => this.terminar('manual') },
      ]);
    },

    abandonarPractica() {
      const pa = this.partida;
      pa.terminada = true; clearInterval(pa.timer);
      this.limpiarEfectos();
      Estado.guardar();
      this.irMenu();
    },

    pisoSuperado() {
      const pa = this.partida, p = Estado.perfil;
      if (pa.terminada) return;
      pa.terminada = true; clearInterval(pa.timer);
      const rest = pa.deadline ? Math.max(0, Math.round((pa.deadline - Date.now()) / 1000)) : 0;
      let bonusMonedas = 4 + Math.floor(rest / 8);
      let bonusPts = pa.arcade.piso * 10 + Math.floor(rest / 3);
      if (pa.jefe) { bonusMonedas += 20; bonusPts += 40; pa.arcade.jefes += 1; p.arcade.jefes = (p.arcade.jefes || 0) + 1; }
      Estado.sumarMonedas(bonusMonedas); pa.arcade.monedas += bonusMonedas; pa.monedasGanadas += bonusMonedas;
      pa.arcade.puntajeTotal += pa.puntos + bonusPts;
      pa.arcade.palabrasTotal += pa.encontradas.length;
      p.arcade.mejorPiso = Math.max(p.arcade.mejorPiso, pa.arcade.piso);
      p.stats.segundos = (p.stats.segundos || 0) + Math.round((Date.now() - pa.inicio) / 1000);
      Estado.guardar();
      this.limpiarEfectos();
      if (pa.jefe) { Audio.victoria(); this.sacudir(true); this.vineta('flash-oro'); this.banner('⚔️', pa.nombreJefe.toUpperCase(), 'Jefe vencido', 'oro'); this.magos.jefe.animar('sad', 2500); }
      else { Audio.nivel(); this.vineta('flash'); this.banner('🗼', 'PISO ' + pa.arcade.piso, 'Superado'); }
      this.magos.juego.animar('happy', 1500);
      this.confeti(pa.jefe ? 90 : 40);
      const sig = pa.arcade.piso + 1;
      this.mision('piso', sig);
      this.anunciarLogros(Logros.evaluar(p, { tipo: 'piso' }));
      this._tModalPiso = setTimeout(() => this.verTorre({ pa, bonusPts, bonusMonedas, rest }), 1400);
    },

    renderTienda() {
      const p = Estado.perfil, cont = $('tienda');
      if (!cont) return;
      const items = [
        { k: 'pista', icono: WWIconos.html('pista'), nombre: 'Pista', desc: 'Muestra el principio de una palabra' },
        { k: 'tiempo', icono: WWIconos.html('arena'), nombre: 'Reloj de arena', desc: '+20 segundos' },
        { k: 'ojo', icono: WWIconos.html('ojo'), nombre: 'Ojo arcano', desc: 'Revela una palabra (vale la mitad)' },
        { k: 'vela', icono: WWIconos.html('vela'), nombre: 'Vela de racha', desc: 'Si faltás un día al desafío, tu racha sigue', max: CONFIG.velasMax },
        { k: 'escudo', icono: WWIconos.html('escudo'), nombre: 'Escudo', desc: 'Los errores no cortan el combo' },
      ];
      cont.innerHTML = '';
      for (const it of items) {
        const d = document.createElement('div');
        d.className = 'tienda-item';
        d.innerHTML = `<span>${it.icono}</span><div><b>${it.nombre}</b> <small>${it.desc} · tenés x${p.inventario[it.k] || 0}</small></div><button class="btn btn-primario">${WWIconos.html('moneda')}${CONFIG.precios[it.k]}</button>`;
        const b = d.querySelector('button');
        b.disabled = p.monedas < CONFIG.precios[it.k] || (it.max && (p.inventario[it.k] || 0) >= it.max);
        if (it.max && (p.inventario[it.k] || 0) >= it.max) b.innerHTML = 'Máx.';
        b.addEventListener('click', () => {
          if (p.monedas < CONFIG.precios[it.k] || (it.max && (p.inventario[it.k] || 0) >= it.max)) return;
          Estado.sumarMonedas(-CONFIG.precios[it.k]); p.inventario[it.k] = (p.inventario[it.k] || 0) + 1;
          Audio.moneda(); Estado.guardar();
          const saldo = document.querySelector('.tienda-saldo'); if (saldo) saldo.innerHTML = `TENÉS ${p.monedas} ${WWIconos.html('moneda')}`;
          this.renderTienda();
        });
        cont.appendChild(d);
      }
    },

    terminar(motivo) {
      const pa = this.partida, p = Estado.perfil;
      if (!pa || pa.terminada) return;
      pa.terminada = true; clearInterval(pa.timer);
      this.limpiarSeleccion();
      this.limpiarEfectos();
      if (motivo === 'tiempo') { Audio.tiempoAgotado(); this.sacudir(true); }
      p.stats.segundos = (p.stats.segundos || 0) + Math.round((Date.now() - pa.inicio) / 1000);

      // --- arcade: ¿queda vida?
      if (pa.modo === 'arcade' && motivo !== 'abandono') {
        pa.arcade.vidas -= 1;
        pa.arcade.puntajeTotal += pa.puntos;
        pa.arcade.palabrasTotal += pa.encontradas.length;
        Estado.guardar();
        if (pa.arcade.vidas > 0) {
          Audio.vida(); this.vineta('flash-rojo');
          this.magos.juego.animar('sad', 1500);
          if (pa.jefe) this.magos.jefe.animar('happy', 1500);
          this.modal(`<h3>${pa.jefe ? `${esc(pa.nombreJefe.toUpperCase())} RESISTIÓ` : '¡SE ACABÓ EL TIEMPO!'}</h3><div class="modal-silabo" data-pose="sad"></div><p>${pa.jefe ? `Le quedaban ${pa.objetivo - pa.puntosPiso} HP.` : `Te faltaron ${pa.objetivo - pa.puntosPiso} pts para el objetivo.`} Te quedan ${WWIconos.html('corazon').repeat(pa.arcade.vidas)}.</p><p>Otra palabra, mismo piso.</p>`, [
            { texto: 'Reintentar piso ' + pa.arcade.piso, clase: 'btn-primario', accion: () => this.nuevaPartida('arcade', { piso: pa.arcade.piso, continuar: true, usadas: pa.arcade.usadas, reintento: true }) },
            { texto: 'Rendirse', clase: 'btn-secundario', accion: () => this.cerrarArcade(pa) },
          ]);
          return;
        }
      } else if (pa.modo === 'arcade') {
        pa.arcade.puntajeTotal += pa.puntos;
        pa.arcade.palabrasTotal += pa.encontradas.length;
      }
      if (pa.modo === 'arcade') return this.cerrarArcade(pa);

      // --- diario / práctica
      const pct = pa.totalPuntos ? (pa.puntosBase / pa.totalPuntos) * 100 : 0;
      const rango = WW.rangoPorPct(pct);
      const rangoIdx = WW.RANGOS.indexOf(rango);
      let xp = 0, monedas = 0;
      if (pa.modo === 'diario') {
        xp = Math.round(pa.puntos * 1.5 + rangoIdx * 10);
        monedas = pa.encontradas.length + rangoIdx * 4;
        p.diarios[this.hoy] = { numero: pa.numero, palabra: pa.base, puntos: pa.puntos, pct: Math.round(pct * 10) / 10, rango: rango.nombre, encontradas: pa.encontradas.slice(), total: pa.total, totalPuntos: pa.totalPuntos, combo: pa.mejorCombo, fecha: this.hoy };
        p.enCurso = null;
        const velasUsadas = Estado.registrarRacha(this.hoy);
        if (velasUsadas) setTimeout(() => this.toast(`${WWIconos.html('vela')}<div><b>La vela salvó tu racha</b><br><small>Se ${velasUsadas > 1 ? `consumieron ${velasUsadas} velas` : 'consumió una vela'}. Racha: ${p.racha} días</small></div>`, 'logro'), 1200);
        this.mision('diario', 1);
        if (Ranking.activo()) Ranking.enviarDiario({ clave: this.claveNube(), fecha: this.hoy, numero: pa.numero, nombre: p.nombre, puntos: pa.puntos, palabras: pa.encontradas.length, rango: rango.nombre });
      } else {
        xp = Math.round(pa.puntos * 0.5);
        monedas = Math.floor(pa.encontradas.length / 3);
        p.practica.partidas += 1;
        this.mision('practica', 1);
      }
      p.stats.partidas += 1;
      Estado.sumarXp(xp);
      const nivel = { antes: this.nivelSesion || p.nivel, despues: p.nivel, subio: p.nivel > (this.nivelSesion || p.nivel) };
      Estado.sumarMonedas(monedas);
      const nuevos = Logros.evaluar(p, { tipo: 'fin', encontradas: pa.encontradas.length - pa.ojos.size, total: pa.total, modo: pa.modo });
      if (nuevos.length) Estado.sumarMonedas(5 * nuevos.length);
      Estado.guardar();

      this.resultadoActual = { modo: pa.modo, opts: pa.opts, base: pa.base, numero: pa.numero, puntos: pa.puntos, encontradas: pa.encontradas, total: pa.total, totalPuntos: pa.totalPuntos, pct, rango, xp, monedas, nivel, nuevos, mejorPalabra: pa.mejorPalabra, combo: pa.mejorCombo, derivables: pa.derivables, motivo };
      this.mostrarResultado(this.resultadoActual);
    },

    cerrarArcade(pa) {
      const p = Estado.perfil;
      const a = pa.arcade;
      if (a.cerrada) return;
      a.cerrada = true; clearTimeout(this._tModalPiso);
      const xp = Math.round(a.puntajeTotal * 0.8 + a.piso * 8);
      const esRecord = a.puntajeTotal > p.arcade.mejorPuntaje;
      p.arcade.mejorPuntaje = Math.max(p.arcade.mejorPuntaje, a.puntajeTotal);
      p.arcade.mejorPiso = Math.max(p.arcade.mejorPiso, a.piso);
      p.arcade.partidas += 1;
      if (Ranking.activo()) Ranking.enviarTorre({ clave: this.claveNube(), nombre: p.nombre, puntaje: p.arcade.mejorPuntaje, piso: p.arcade.mejorPiso, jefes: Math.floor(p.arcade.mejorPiso / 5) });
      p.arcade.historial.unshift({ fecha: this.hoy, puntos: a.puntajeTotal, piso: a.piso, jefes: a.jefes });
      p.arcade.historial = p.arcade.historial.slice(0, 20);
      p.stats.partidas += 1;
      Estado.sumarXp(xp);
      const nivel = { antes: this.nivelSesion || p.nivel, despues: p.nivel, subio: p.nivel > (this.nivelSesion || p.nivel) };
      const nuevos = Logros.evaluar(p, { tipo: 'fin', encontradas: pa.encontradas.length, total: pa.total, modo: 'arcade' });
      if (nuevos.length) Estado.sumarMonedas(5 * nuevos.length);
      Estado.guardar();
      this.resultadoActual = { modo: 'arcade', base: pa.base, puntos: a.puntajeTotal, encontradas: pa.encontradas, total: pa.total, totalPuntos: pa.totalPuntos, piso: a.piso, jefes: a.jefes, palabrasTotal: a.palabrasTotal, xp, monedas: a.monedas, nivel, nuevos, mejorPalabra: pa.mejorPalabra, combo: pa.mejorCombo, derivables: pa.derivables, esRecord };
      this.mostrarResultado(this.resultadoActual);
    },

    mostrarResultado(r) {
      const p = Estado.perfil;
      const esArcade = r.modo === 'arcade';
      $('res-titulo').textContent = esArcade ? (r.esRecord ? '¡NUEVO RÉCORD!' : 'FIN DE LA SUBIDA') : r.motivo === 'completo' ? '¡TODAS!' : r.modo === 'diario' ? `DESAFÍO #${r.numero}` : 'PRÁCTICA';
      if (esArcade) $('res-rango-icono').innerHTML = WWIconos.html('torre'); else $('res-rango-icono').textContent = r.rango.icono;
      { const mr = this.magos.resultado, bien = r.motivo === 'completo' || r.esRecord || (esArcade ? r.piso >= 3 : (r.pct || 0) >= 35);
        mr.setPaleta(p.sombrero); mr.setNivel(p.nivel);
        setTimeout(() => { mr.animar(bien ? 'happy' : 'sad', bien ? 2200 : 1600); if (bien) Audio.risita(); }, 500); }
      $('res-rango-sub').textContent = esArcade ? (r.jefes ? `${r.jefes} jefe${r.jefes > 1 ? 's' : ''} vencido${r.jefes > 1 ? 's' : ''}` : 'Llegaste al') : 'Rango';
      $('res-rango-nombre').textContent = esArcade ? `PISO ${r.piso}` : r.rango.nombre;
      $('res-puntos').textContent = '0'; setTimeout(() => this.tween($('res-puntos'), r.puntos, 900), 200);
      $('res-palabras-n').textContent = esArcade ? r.palabrasTotal : `${r.encontradas.length}/${r.total}`;
      $('res-mejor').textContent = r.mejorPalabra ? r.mejorPalabra.toUpperCase() : '—';
      $('res-combo').textContent = `x${r.combo || 0}`;
      $('res-xp-mas').textContent = `+${r.xp} XP`;
      $('res-monedas').innerHTML = `${WWIconos.html('moneda')} +${r.monedas}` + (r.nuevos && r.nuevos.length ? ` (+${5 * r.nuevos.length} por logros)` : '');
      this.pintarXp('res-xp-fill', 'res-xp-txt', Math.max(0, p.xp - r.xp), r.nivel ? r.nivel.antes : undefined);
      setTimeout(() => this.pintarXp('res-xp-fill', 'res-xp-txt', p.xp), 400);
      const lg = $('res-logros'); lg.innerHTML = '';
      for (const l of (r.nuevos || [])) {
        const d = document.createElement('div'); d.className = 'res-logro';
        d.innerHTML = `<span>${l.icono}</span><div><b>${l.nombre}</b><small>${l.desc}</small></div>`; lg.appendChild(d);
      }
      $('btn-compartir').classList.toggle('oculto', r.modo === 'practica');
      $('btn-otra').innerHTML = esArcade ? WWIconos.html('repetir') + ' Otra subida' : r.modo === 'practica' ? WWIconos.html('repetir') + ' Otra palabra' : WWIconos.html('calendario') + ' Mañana hay más';
      $('btn-otra').disabled = r.modo === 'diario';
      this.renderResPalabras(r);
      $('res-palabras').classList.add('oculto');
      this.mostrar('p-resultado');
      if (r.modo === 'diario' || r.motivo === 'completo') Audio.rango();
      if (r.esRecord || r.motivo === 'completo' || (r.rango && WW.RANGOS.indexOf(r.rango) >= 4)) setTimeout(() => this.confeti(80), 300);
      if (r.nivel && r.nivel.subio) setTimeout(() => { if (this.pantalla === 'p-resultado') this.anunciarNivel(r.nivel.despues); else this.nivelPendiente = r.nivel.despues; }, 900);
    },

    renderResPalabras(r) {
      const cont = $('res-palabras');
      const enc = new Set(r.encontradas);
      const todas = Array.from(r.derivables || this.dic.derivables(r.base));
      const porLargo = {};
      for (const w of todas) (porLargo[w.length] || (porLargo[w.length] = [])).push(w);
      let html = `<h4>BASE: ${r.base.toUpperCase()}</h4>`;
      for (const L of Object.keys(porLargo).map(Number).sort((a, b) => b - a)) {
        const ws = porLargo[L].sort();
        html += `<h4>${L} LETRAS · ${ws.filter((w) => enc.has(w)).length}/${ws.length}</h4><div class="lista-chips">` +
          ws.map((w) => `<span class="chip-palabra ${enc.has(w) ? (w === r.base ? 'completa' : '') : 'falta'}">${w}</span>`).join('') + '</div>';
      }
      cont.innerHTML = html;
    },

    mostrarResultadoGuardado(d) {
      const rango = WW.rangoPorPct(d.pct);
      this.resultadoActual = { modo: 'diario', base: d.palabra, numero: d.numero, puntos: d.puntos, encontradas: d.encontradas, total: d.total, totalPuntos: d.totalPuntos, pct: d.pct, rango, xp: 0, monedas: 0, nuevos: [], mejorPalabra: d.encontradas.slice().sort((a, b) => b.length - a.length)[0] || '', combo: d.combo, guardado: true };
      this.mostrarResultado(this.resultadoActual);
      $('res-xp-mas').textContent = 'ya jugado';
      $('res-monedas').textContent = 'Volvé mañana por otro desafío';
    },

    anunciarNivel(n) {
      const etapaAntes = Magos.etapaPorNivel(n - 1), etapaAhora = Magos.etapaPorNivel(n);
      for (const k of ['titulo', 'menu', 'juego', 'resultado', 'mapa']) this.magos[k].setNivel(n);
      const crecio = etapaAhora > etapaAntes ? window.Silabo.CRECIMIENTO[etapaAhora] : null;
      Audio.nivel();
      this.magos.menu.animar('happy', 2000);
      this.confeti(60); this.vineta('flash-oro'); this.banner('⭐', 'NIVEL ' + n, WW.tituloNivel(n), 'oro');
      const nuevoSombrero = Object.entries(Magos.PALETAS).find(([, v]) => v.nivel === n);
      this.modal(`<h3>¡NIVEL ${n}!</h3><div class="modal-silabo" data-pose="happy"></div><p>Ahora sos <b>${WW.tituloNivel(n)}</b>. +10 ${WWIconos.html('moneda')}</p>${crecio ? `<p>✨ <b>¡La varita de Silabo creció!</b> Ahora es una ${crecio.nombre.toLowerCase()}.</p>` : ''}${nuevoSombrero ? `<p>Desbloqueaste el sombrero <b>${nuevoSombrero[1].nombre}</b>. Cambialo en Ajustes.</p>` : ''}`, [{ texto: '¡Genial!', clase: 'btn-primario' }]);
      Estado.sumarMonedas(10); Estado.guardar();
    },

    compartir() {
      const r = this.resultadoActual;
      if (!r) return;
      const url = /^https?:/.test(location.protocol) ? '\n' + location.origin + location.pathname : '';
      let texto;
      if (r.modo === 'arcade') {
        texto = `🗼 Word Wizard · Torre Arcana\n🏁 Piso ${r.piso} · ${r.puntos} pts · ${r.palabrasTotal} palabras${r.jefes ? ` · ${r.jefes} jefe${r.jefes > 1 ? 's' : ''} ⚔️` : ''}\n¿Me superás?${url}`;
      } else {
        const idx = WW.RANGOS.indexOf(r.rango);
        const barra = WW.RANGOS.slice(1).map((_, i) => (i < idx ? '🟩' : '⬛')).join('');
        const racha = Estado.rachaVigente(this.hoy);
        texto = `🧙 Word Wizard #${r.numero} · ${r.rango.icono} ${r.rango.nombre}\n⭐ ${r.puntos} pts · ${r.encontradas.length}/${r.total} palabras\n${barra}${racha > 1 ? ` racha ${racha}🔥` : ''}${url}`;
      }
      Audio.click();
      if (navigator.share && !window.WW_ARTIFACT) navigator.share({ text: texto }).catch(() => this.copiar(texto));
      else this.copiar(texto);
    },

    copiar(texto) {
      const ok = () => this.toast('📋 Copiado. ¡Pegalo donde quieras!');
      const mostrar = () => this.modal(`<h3>TU RESULTADO</h3><pre style="text-align:left;white-space:pre-wrap">${esc(texto)}</pre>`, [{ texto: 'Cerrar', clase: 'btn-secundario' }]);
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texto).then(ok, mostrar);
      else mostrar();
    },

    // ============================================================ rankings / estadísticas / logros / ajustes
    verRankings(tab) {
      $('tab-mundo').classList.toggle('oculto', !Ranking.activo());
      document.querySelectorAll('#tabs-ranking .tab').forEach((t) => t.classList.toggle('activa', t.dataset.tab === tab));
      const todos = Estado.todos(), yo = Estado.perfil.nombre;
      const cont = $('ranking-contenido');
      let filas = [];
      if (tab === 'mundo') return this.verMundo(this.mundoSub || 'hoy');
      $('ranking-nota').textContent = 'Rankings de este dispositivo.';
      if (tab === 'diario') {
        filas = Object.values(todos).filter((p) => p.diarios && p.diarios[this.hoy]).map((p) => ({ nombre: p.nombre, valor: p.diarios[this.hoy].puntos, sub: `${p.diarios[this.hoy].rango} · ${p.diarios[this.hoy].encontradas.length} palabras`, unidad: 'PTS', yo: p.nombre === yo }));
      } else if (tab === 'torre') {
        filas = Object.values(todos).filter((p) => p.arcade && p.arcade.mejorPuntaje > 0).map((p) => ({ nombre: p.nombre, valor: p.arcade.mejorPuntaje, sub: `piso ${p.arcade.mejorPiso} · ${p.arcade.partidas} subidas · ${p.arcade.jefes || 0} jefes`, unidad: 'PTS', yo: p.nombre === yo }));
      } else {
        filas = Object.values(todos).map((p) => ({ nombre: p.nombre, valor: p.xp || 0, sub: `nivel ${p.nivel || 1} · ${WW.tituloNivel(p.nivel || 1)} · ${Object.keys(p.logros || {}).length} logros`, unidad: 'XP', yo: p.nombre === yo }));
      }
      this.pintarRanking(cont, filas, tab === 'diario' ? 'Nadie jugó el desafío de hoy todavía.' : 'Todavía no hay registros.');
      this.mostrar('p-rankings');
    },

    /** Clave del mago para la nube: no cambia si se renombra. */
    claveNube() { const p = Estado.perfil; return p.creado || p.nombre; },

    verMundo(sub) {
      this.mundoSub = sub;
      const cont = $('ranking-contenido');
      const subs = [['hoy', 'Hoy'], ['semana', 'Semana'], ['torre', 'Torre']];
      cont.innerHTML = `<div class="mundo-sub">${subs.map(([k, t]) => `<button class="${k === sub ? 'activa' : ''}" data-sub="${k}">${t}</button>`).join('')}</div><div class="mundo-lista"><div class="rank-vacio">Cargando ranking mundial…</div></div>`;
      cont.querySelectorAll('[data-sub]').forEach((b) => b.addEventListener('click', () => { Audio.click(); this.verMundo(b.dataset.sub); }));
      $('ranking-nota').textContent = { hoy: 'Desafío de hoy, en todo el mundo.', semana: 'Puntos del desafío sumados desde el lunes.', torre: 'La mejor subida a la Torre Arcana de cada mago.' }[sub];
      if (!$('p-rankings').classList.contains('activa')) this.mostrar('p-rankings');
      const mio = Ranking.miId(this.claveNube());
      const lunes = (() => { const d = new Date(this.hoy + 'T12:00:00'); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.toISOString().slice(0, 10); })();
      const pedido = sub === 'hoy' ? Ranking.topDiario(this.hoy) : sub === 'semana' ? Ranking.topSemanal(lunes) : Ranking.topTorre();
      pedido.then((rows) => {
        const lista = cont.querySelector('.mundo-lista');
        if (this.mundoSub !== sub || !lista) return;
        if (rows === null) { lista.innerHTML = '<div class="rank-vacio">Sin conexión. El ranking mundial necesita internet.</div>'; return; }
        const filas = rows.map((r) => sub === 'torre'
          ? { nombre: r.nombre, valor: r.mejor_puntaje, sub: `piso ${r.mejor_piso} · ${r.jefes} ${r.jefes === 1 ? 'jefe' : 'jefes'}`, unidad: 'PTS', yo: r.usuario === mio }
          : sub === 'semana'
            ? { nombre: r.nombre, valor: r.puntos, sub: `${r.dias} ${r.dias === 1 ? 'día' : 'días'}`, unidad: 'PTS', yo: r.usuario === mio }
            : { nombre: r.nombre, valor: r.puntos, sub: `${r.rango} · ${r.palabras} palabras`, unidad: 'PTS', yo: r.usuario === mio });
        this.pintarRanking(lista, filas, sub === 'torre' ? 'Nadie subió la Torre todavía. ¡Estrenala!' : 'Nadie jugó todavía. ¡Sé el primero!');
      });
    },

    pintarRanking(cont, filas, vacio) {
      filas.sort((a, b) => b.valor - a.valor);
      cont.innerHTML = filas.length ? '' : `<div class="rank-vacio">${vacio}</div>`;
      filas.forEach((f, i) => {
        const d = document.createElement('div');
        d.className = 'rank-fila' + (f.yo ? ' yo' : '');
        d.innerHTML = `<span class="rank-pos">${['🥇', '🥈', '🥉'][i] || (i + 1)}</span><div class="rank-nombre">${esc(f.nombre)}<small>${esc(f.sub)}</small></div><div class="rank-valor">${f.valor}<small>${f.unidad}</small></div>`;
        cont.appendChild(d);
      });
    },

    verEstadisticas() {
      const p = Estado.perfil, s = p.stats;
      const diarios = Object.values(p.diarios).sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));
      const dist = {};
      for (const r of WW.RANGOS) dist[r.nombre] = 0;
      for (const d of diarios) dist[d.rango] = (dist[d.rango] || 0) + 1;
      const maxDist = Math.max(1, ...Object.values(dist));
      const prom = diarios.length ? Math.round(diarios.reduce((a, d) => a + d.puntos, 0) / diarios.length) : 0;
      const mejor = diarios.slice().sort((a, b) => b.puntos - a.puntos)[0];
      const porLargo = s.porLargo || {};
      const maxLargo = Math.max(1, ...Object.values(porLargo));
      const horas = Math.floor((s.segundos || 0) / 3600), min = Math.floor(((s.segundos || 0) % 3600) / 60);
      const num = (v, t) => `<div class="stats-num"><b>${v}</b><small>${t}</small></div>`;
      let html = `
        <div class="stats-panel"><h3>📅 Desafío diario</h3>
          <div class="stats-grilla">${num(diarios.length, 'jugados')}${num(Estado.rachaVigente(this.hoy), 'racha actual')}${num(p.mejorRacha, 'mejor racha')}${num(prom, 'promedio pts')}${num(mejor ? mejor.puntos : 0, 'mejor puntaje')}${num(mejor ? mejor.rango : '—', 'mejor rango')}</div>
          <h3 style="margin-top:10px">Rangos alcanzados</h3>
          <div class="dist">${WW.RANGOS.map((r) => `<div class="dist-fila"><span class="dist-nombre">${r.icono} ${r.nombre}</span><div class="dist-barra"><div style="width:${(dist[r.nombre] / maxDist) * 100}%"></div></div><span class="dist-n">${dist[r.nombre]}</span></div>`).join('')}</div>
        </div>
        <div class="stats-panel"><h3>🧙 En total</h3>
          <div class="stats-grilla">${num(s.palabras, 'palabras')}${num(s.puntos || 0, 'puntos')}${num(s.partidas, 'partidas')}${num(s.completas, 'bases completas')}${num('x' + s.mejorCombo, 'mejor combo')}${num(horas ? `${horas}h ${min}m` : `${min}m`, 'jugado')}${num(s.misiones || 0, 'misiones')}${num(Object.keys(p.logros).length, 'logros')}${num(s.monedasTotales, 'monedas ganadas')}</div>
          <h3 style="margin-top:10px">Palabras por largo</h3>
          <div class="dist">${Object.keys(porLargo).map(Number).sort((a, b) => a - b).map((L) => `<div class="dist-fila"><span class="dist-nombre">${L} letras</span><div class="dist-barra"><div style="width:${(porLargo[L] / maxLargo) * 100}%"></div></div><span class="dist-n">${porLargo[L]}</span></div>`).join('') || '<small>Todavía nada. ¡A jugar!</small>'}</div>
          ${(s.mejoresPalabras || []).length ? `<h3 style="margin-top:10px">Mejores palabras</h3><div class="stats-palabras">${s.mejoresPalabras.map((x) => `<span class="chip-palabra ${x.p.length >= 6 ? 'larga' : ''}">${x.p} · ${x.n}</span>`).join('')}</div>` : ''}
        </div>
        <div class="stats-panel"><h3>🗼 Torre Arcana</h3>
          <div class="stats-grilla">${num(p.arcade.mejorPiso, 'mejor piso')}${num(p.arcade.mejorPuntaje, 'mejor puntaje')}${num(p.arcade.partidas, 'subidas')}${num(p.arcade.jefes || 0, 'jefes vencidos')}</div>
        </div>`;
      if (diarios.length) {
        html += `<div class="stats-panel"><h3>📜 Últimos desafíos</h3><div class="hist">${diarios.slice(-14).reverse().map((d) => `<div class="hist-fila"><span class="hist-fecha">${(d.fecha || '').slice(5).replace('-', '/')}</span><span class="hist-palabra">${d.palabra.toUpperCase()}</span><span class="hist-rango">${(WW.RANGOS.find((r) => r.nombre === d.rango) || {}).icono || ''} ${d.rango}</span><span class="hist-pts">${d.puntos} pts</span></div>`).join('')}</div></div>`;
      }
      $('stats-contenido').innerHTML = html;
      this.mostrar('p-stats');
    },

    verLogros() {
      const p = Estado.perfil;
      const cont = $('logros-grilla'); cont.innerHTML = '';
      const n = Object.keys(p.logros).length;
      $('logros-resumen').textContent = `${n} de ${Logros.LOGROS.length} logros. Cada uno da 5 monedas.`;
      for (const l of Logros.LOGROS) {
        const d = document.createElement('div');
        const ok = !!p.logros[l.id];
        d.className = 'logro' + (ok ? '' : ' bloqueado');
        d.innerHTML = `<span>${ok ? l.icono : '🔒'}</span><b>${l.nombre}</b><small>${l.desc}</small>`;
        cont.appendChild(d);
      }
      this.mostrar('p-logros');
    },

    verAjustes() {
      const p = Estado.perfil;
      $('aj-sonido').checked = p.ajustes.sonido;
      $('aj-musica').checked = p.ajustes.musica;
      $('aj-vibracion').checked = p.ajustes.vibracion;
      $('aj-grilla').checked = p.ajustes.grilla !== false;
      const cont = $('aj-sombreros'); cont.innerHTML = '';
      for (const [k, v] of Object.entries(Magos.PALETAS)) {
        const b = document.createElement('button');
        if (v.nivel > 100) continue;
        const hab = p.nivel >= v.nivel;
        b.className = 'sombrero' + (p.sombrero === k ? ' activo' : '');
        b.disabled = !hab;
        b.innerHTML = `<span class="mini-mago">${window.Silabo.mago(Object.assign({}, window.Silabo.OFICIAL, { colores: v.c }))}</span>${v.nombre}<small>${hab ? '' : 'NV ' + v.nivel}</small>`;
        b.addEventListener('click', () => { p.sombrero = k; Estado.guardar(); for (const m of ['titulo', 'menu', 'juego']) this.magos[m].setPaleta(k); Audio.click(); this.verAjustes(); });
        cont.appendChild(b);
      }
      $('aj-info').textContent = `${p.nombre} · ${p.stats.palabras} palabras encontradas · ${p.stats.partidas} partidas · desde ${p.creado.slice(0, 10)} · v${CONFIG.version}`;
      this.mostrar('p-ajustes');
    },

    cambiarNombre() {
      Audio.click();
      this.modal(`<h3>CAMBIAR NOMBRE</h3><input class="modal-input" id="modal-nombre" type="text" maxlength="16" value="${esc(Estado.perfil.nombre)}">`, [
        { texto: 'Cancelar', clase: 'btn-secundario' },
        { texto: 'Guardar', clase: 'btn-primario', accion: () => {
          const v = $('modal-nombre') ? $('modal-nombre').value : '';
          if (Estado.renombrar(v)) { this.toast('✏️ Nombre cambiado'); this.verAjustes(); }
          else this.toast('Ese nombre ya existe o no sirve');
        } },
      ]);
      setTimeout(() => { const i = $('modal-nombre'); if (i) { i.focus(); i.select(); } }, 100);
    },

    exportar() {
      Audio.click();
      const json = Estado.exportar();
      if (window.WW_ARTIFACT) { this.copiar(json); return; }
      try {
        const blob = new Blob([json], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = `wordwizard-progreso-${this.hoy}.json`;
        document.body.appendChild(a); a.click(); a.remove();
        this.toast('💾 Progreso exportado');
      } catch (e) { this.copiar(json); }
    },

    // ============================================================ tutorial
    /** Cómo jugar: carrusel que se desliza con el dedo (o con las flechas). alTerminar: al tocar "¡A jugar!". */
    tutorial(alTerminar) {
      const I = (n) => WWIconos.html(n);
      const fichas = (txt, clase) => `<div class="ej">${txt.split('').map((l) => `<span class="${clase || ''}">${l}</span>`).join('')}</div>`;
      const fila = (ic, b, t) => `<div class="tut-fila">${I(ic)}<div><b>${b}</b><small>${t}</small></div></div>`;
      const pasos = [
        { t: '¡HOLA! SOY SILABO', h: `<div class="tut-mago tut-saluda">${window.Silabo.mago(window.Silabo.OFICIAL)}</div><p>Soy el mago de las palabras. Te doy las letras de una palabra y vos armás todas las que puedas.</p>` },
        { t: 'ARMÁ PALABRAS', h: `${fichas('CAMINAR')}<div class="tut-flecha">↓</div><div class="tut-arma">${'CAMA'.split('').map((l, i) => `<span style="--i:${i}">${l}</span>`).join('')}<em style="--i:4">✓</em></div><p>Tocá las letras y mandá con <b>Enviar</b>. Mínimo 3 letras, cada una las veces que aparece. <b>cama</b>, <b>mina</b>, <b>rima</b>… y <b>caminar</b>.</p>` },
        { t: 'MÁS LARGAS, MÁS PUNTOS', h: `<div class="tut-puntos"><span><b>3</b> letras <i>1</i></span><span><b>5</b> letras <i>4</i></span><span><b>7</b> letras <i>10</i></span><span class="oro">la palabra entera <i>+15</i></span></div><p>Si acertás seguido armás <b>combo</b>: desde la tercera, cada palabra vale más, hasta ×2.</p>` },
        { t: 'TRES FORMAS DE JUGAR', h: `<div class="tut-filas">${fila('calendario', 'Desafío diario', 'La misma palabra para todos, 3 minutos, una vez por día.')}${fila('torre', 'Torre Arcana', 'Subí piso por piso, vencé jefes y juntá monedas.')}${fila('vela', 'Práctica', 'Sin reloj y con pistas, para aprender.')}</div>` },
        { t: 'VOLVÉ CADA DÍA', h: `<div class="tut-filas">${fila('llama', 'Racha', 'Jugá el desafío todos los días.')}${fila('vela', 'Vela de racha', 'Si un día faltás, salva tu racha.')}${fila('estrella', 'Misiones', 'Tres por día, con monedas de premio.')}</div><button class="link-reglas" id="tut-reglas">Ver las reglas completas</button>` },
      ];
      const n = pasos.length;
      this.modal(`<div class="carrusel" id="carrusel"><div class="carrusel-pista" id="carrusel-pista">${pasos.map((s) => `<section class="carrusel-paso"><h3>${s.t}</h3><div class="tutorial-paso">${s.h}</div></section>`).join('')}</div></div>
        <div class="puntitos" id="tut-puntos">${pasos.map((_, j) => `<i class="${j ? '' : 'on'}"></i>`).join('')}</div>
        <div class="fila tut-botones"><button class="btn btn-secundario" id="tut-saltar">Saltar</button><button class="btn btn-primario" id="tut-sig">Siguiente</button></div>`, []);
      const caja = $('modal-caja'), car = $('carrusel'), pista = $('carrusel-pista');
      caja.classList.add('con-carrusel');
      let i = 0;
      const ir = (k, animar) => {
        i = Math.max(0, Math.min(n - 1, k));
        pista.style.transition = animar === false ? 'none' : '';
        pista.style.transform = `translateX(${-i * 100}%)`;
        $('tut-puntos').querySelectorAll('i').forEach((d, j) => d.classList.toggle('on', j === i));
        $('tut-sig').textContent = i === n - 1 ? '¡A jugar!' : 'Siguiente';
        $('tut-saltar').style.visibility = i === n - 1 ? 'hidden' : '';
        pista.querySelectorAll('.carrusel-paso').forEach((p, j) => p.classList.toggle('activo', j === i));
      };
      const cerrar = (jugar) => {
        $('modal').classList.add('oculto'); caja.classList.remove('con-carrusel');
        document.removeEventListener('keydown', teclas);
        removeEventListener('pointerup', soltar); removeEventListener('pointercancel', soltar);
        if (jugar && alTerminar) alTerminar();
      };
      const teclas = (e) => { if (e.key === 'ArrowRight') ir(i + 1); else if (e.key === 'ArrowLeft') ir(i - 1); };
      document.addEventListener('keydown', teclas);
      $('tut-sig').addEventListener('click', () => { Audio.click(); if (i === n - 1) cerrar(true); else ir(i + 1); });
      $('tut-saltar').addEventListener('click', () => { Audio.click(); cerrar(true); });
      $('tut-reglas').addEventListener('click', () => { Audio.click(); cerrar(false); if (!alTerminar) this.mostrar('p-ayuda'); else alTerminar(); });
      // arrastre con el dedo: la pista sigue al dedo y al soltar va al paso más cercano
      let x0 = 0, y0 = 0, dx = 0, arrastrando = false, horizontal = null, t0 = 0;
      car.addEventListener('pointerdown', (e) => { if (e.target.closest('button')) return; x0 = e.clientX; y0 = e.clientY; dx = 0; arrastrando = true; horizontal = null; t0 = performance.now(); });
      car.addEventListener('pointermove', (e) => {
        if (!arrastrando) return;
        dx = e.clientX - x0;
        if (horizontal === null && (Math.abs(dx) > 8 || Math.abs(e.clientY - y0) > 8)) { horizontal = Math.abs(dx) > Math.abs(e.clientY - y0); if (horizontal) car.setPointerCapture(e.pointerId); }
        if (!horizontal) return;
        const borde = (i === 0 && dx > 0) || (i === n - 1 && dx < 0) ? .35 : 1;
        pista.style.transition = 'none';
        pista.style.transform = `translateX(calc(${-i * 100}% + ${dx * borde}px))`;
      });
      const soltar = () => {
        if (!arrastrando) return; arrastrando = false;
        if (!horizontal) return;
        const rapido = Math.abs(dx) / Math.max(1, performance.now() - t0) > .45;
        if (dx < -car.clientWidth * .22 || (rapido && dx < -20)) ir(i + 1);
        else if (dx > car.clientWidth * .22 || (rapido && dx > 20)) ir(i - 1);
        else ir(i);
        if (Math.abs(dx) > 20) Audio.click();
      };
      // se escucha en la ventana: el dedo puede soltarse fuera del carrusel
      addEventListener('pointerup', soltar);
      addEventListener('pointercancel', soltar);
      car.addEventListener('lostpointercapture', soltar);
      ir(0, false);
    },


    // ============================================================ efectos
    juice() {
      // viñeta y banner (capas globales)
      const v = document.createElement('div'); v.id = 'vineta'; document.body.appendChild(v);
      const b = document.createElement('div'); b.id = 'banner'; document.body.appendChild(b);
      // ripple + punto de brillo en botones
      document.addEventListener('pointerdown', (e) => {
        const btn = e.target.closest('.btn, .btn-menu');
        if (!btn) return;
        const r = btn.getBoundingClientRect();
        btn.style.setProperty('--rx', ((e.clientX - r.left) / r.width * 100) + '%');
        btn.style.setProperty('--ry', ((e.clientY - r.top) / r.height * 100) + '%');
        btn.classList.remove('pulso'); void btn.offsetWidth; btn.classList.add('pulso');
      });
      document.addEventListener('pointermove', (e) => {
        const btn = e.target.closest('.btn-menu');
        if (!btn) return;
        const r = btn.getBoundingClientRect();
        btn.style.setProperty('--rx', ((e.clientX - r.left) / r.width * 100) + '%');
        btn.style.setProperty('--ry', ((e.clientY - r.top) / r.height * 100) + '%');
      });
      // parallax suave del fondo con el puntero / el giroscopio
      const mover = (x, y) => { if (window.WWEscena) WWEscena.mover(x, y); this.punteroMundo = { x, y }; };
      this.luciernagas();
      document.addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') return; mover(e.clientX / innerWidth - .5, e.clientY / innerHeight - .5); });
      window.addEventListener('deviceorientation', (e) => { if (e.gamma == null) return; mover(Math.max(-.5, Math.min(.5, e.gamma / 60)), Math.max(-.5, Math.min(.5, (e.beta - 40) / 80))); });
    },

    /** Tiñe el bosque y cambia las partículas según el lugar de la Torre (null = el bosque de siempre). */
    ponerLugar(lugar) {
      document.body.classList.remove('lugar-cueva', 'lugar-biblioteca', 'lugar-cumbre', 'lugar-cielo');
      if (lugar) document.body.classList.add('lugar-' + lugar.id);
      this.lugar = lugar ? lugar.id : null;
      if (window.WWEscena) WWEscena.ponerLugar(lugar ? lugar.id : 'bosque');
      Audio.lugar(lugar ? lugar.id : null);
    },

    /** Luciérnagas del bosque (o cristales, letras, nieve, motas según el lugar). Siguen al puntero. */
    luciernagas() {
      const cv = $('luces'); if (!cv || !cv.getContext) return;
      const ctx = cv.getContext('2d');
      let W = 0, H = 0; const dpr = Math.min(2, window.devicePixelRatio || 1);
      const medir = () => { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
      medir(); addEventListener('resize', medir);
      const LETRAS = 'ABCDEFGHIJLMNÑOPRSTUV';
      const nueva = () => ({ x: Math.random() * W, y: H * (.3 + Math.random() * .7), vx: 0, vy: 0, r: 1 + Math.random() * 2, f: Math.random() * 6.28, l: LETRAS[Math.floor(Math.random() * LETRAS.length)] });
      const ps = Array.from({ length: 34 }, nueva);
      const ptr = { x: -999, y: -999, t: 0 };
      addEventListener('pointermove', (e) => { ptr.x = e.clientX; ptr.y = e.clientY; ptr.t = performance.now(); }, { passive: true });
      addEventListener('pointerdown', (e) => { ptr.x = e.clientX; ptr.y = e.clientY; ptr.t = performance.now(); }, { passive: true });
      // un sprite por color en vez de un degradado por luciérnaga y por cuadro
      const sprites = {};
      const sprite = (tinte) => {
        if (sprites[tinte]) return sprites[tinte];
        const c = document.createElement('canvas'); c.width = c.height = 64;
        const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
        gr.addColorStop(0, `rgba(${tinte},1)`); gr.addColorStop(1, `rgba(${tinte},0)`);
        g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
        return (sprites[tinte] = c);
      };
      let ultimo = 0, limpio = false;
      const paso = (t) => {
        const jugando = document.body.classList.contains('jugando');
        if (jugando && !limpio) { ctx.clearRect(0, 0, W, H); limpio = true; }
        if (!document.hidden && !jugando && t - ultimo > 32) {
          ultimo = t; limpio = false;
          ctx.clearRect(0, 0, W, H);
          const lugar = this.lugar, activo = performance.now() - ptr.t < 2500;
          for (const p of ps) {
            p.f += .02;
            if (lugar === 'cumbre') { p.vy = .6 + p.r * .25; p.vx = Math.sin(p.f) * .4; }
            else if (lugar === 'cielo') { p.vy = -.25 - p.r * .05; p.vx = Math.sin(p.f * .5) * .2; }
            else { p.vx += Math.cos(p.f * .7) * .02; p.vy += Math.sin(p.f) * .02; }
            if (activo && lugar !== 'cumbre') { const dx = ptr.x - p.x, dy = ptr.y - p.y, d = Math.hypot(dx, dy); if (d < 150 && d > 1) { p.vx += dx / d * .05; p.vy += dy / d * .05; } }
            if (lugar !== 'cumbre' && lugar !== 'cielo') { p.vx *= .96; p.vy *= .96; }
            p.x += p.vx; p.y += p.vy;
            if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10;
            if (p.y > H + 10) { p.y = -10; p.x = Math.random() * W; }
            if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
            if (!lugar && p.y < H * .25) p.vy += .04;
            const b = .45 + .4 * Math.sin(p.f * 2);
            if (lugar === 'biblioteca') {
              ctx.fillStyle = `rgba(242,198,109,${b * .55})`; ctx.font = `600 ${10 + p.r * 4}px Fredoka, sans-serif`; ctx.fillText(p.l, p.x, p.y);
            } else if (lugar === 'cumbre') {
              ctx.fillStyle = `rgba(255,255,255,${.5 + p.r * .15})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 1.2, 0, 6.29); ctx.fill();
            } else {
              const tinte = lugar === 'cueva' ? (p.r > 2 ? '196,170,255' : '223,235,214') : lugar === 'cielo' ? '255,226,168' : (p.r > 2.4 ? '242,198,109' : '223,235,214');
              ctx.globalAlpha = Math.max(0, Math.min(1, b)); ctx.drawImage(sprite(tinte), p.x - p.r * 6, p.y - p.r * 6, p.r * 12, p.r * 12); ctx.globalAlpha = 1;
            }
          }
        }
        requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
    },

    sacudir(fuerte) {
      if (QUIETO) return;
      const app = $('app');
      app.classList.remove('sacudir', 'sacudir-fuerte'); void app.offsetWidth;
      app.classList.add(fuerte ? 'sacudir-fuerte' : 'sacudir');
      setTimeout(() => app.classList.remove('sacudir', 'sacudir-fuerte'), 520);
    },

    vineta(clase) {
      const v = $('vineta'); if (!v) return;
      if (clase === 'roja' || clase === '') { v.className = clase; return; }
      v.className = ''; void v.offsetWidth; v.className = clase;
      setTimeout(() => { if (v.className === clase) v.className = this.partida && !this.partida.terminada && this.partida.vinetaRoja ? 'roja' : ''; }, 700);
    },

    /** Cartel grande que cruza la pantalla (rango nuevo, jefe vencido, nivel). */
    banner(icono, titulo, sub, clase) {
      const cont = $('banner'); if (!cont) return;
      cont.innerHTML = `<div class="banner-caja ${clase || ''}"><span>${icono}</span><div><small>${esc(sub || '')}</small><b>${esc(titulo)}</b></div></div>`;
      setTimeout(() => { cont.innerHTML = ''; }, 2000);
    },

    /** Partículas que salen de un elemento (al aceptar una palabra). */
    particulas(el, color, n) {
      if (!el) return;
      const r = el.getBoundingClientRect();
      for (let i = 0; i < (n || 10); i++) {
        const p = document.createElement('span');
        p.className = 'particula';
        p.style.left = (r.left + Math.random() * r.width) + 'px';
        p.style.top = (r.top + r.height / 2) + 'px';
        p.style.background = color; p.style.color = color;
        document.body.appendChild(p);
        const a = -Math.PI / 2 + (Math.random() - .5) * 1.6, d = 40 + Math.random() * 70;
        p.animate([
          { transform: 'translate(0,0) scale(1)', opacity: 1 },
          { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d}px) scale(0)`, opacity: 0 },
        ], { duration: 500 + Math.random() * 400, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => p.remove();
      }
    },

    destellos() {
      const cont = $('destellos');
      if (!cont) return;
      const uno = () => {
        if (document.hidden) return;
        const d = document.createElement('span');
        d.className = 'destello';
        d.style.left = Math.random() * 100 + '%';
        d.style.animationDuration = (9 + Math.random() * 8) + 's';
        cont.appendChild(d);
        setTimeout(() => d.remove(), 18000);
      };
      for (let i = 0; i < 6; i++) setTimeout(uno, i * 1200);
      setInterval(uno, 2200);
    },

    confeti(n) {
      if (QUIETO) return;
      let cont = $('confeti');
      if (!cont) { cont = document.createElement('div'); cont.id = 'confeti'; document.body.appendChild(cont); }
      const colores = ['#f2c66d', '#dfebd6', '#bbd0b9', '#e8907a', '#ffffff', '#92afa1'];
      const W = window.innerWidth;
      for (let i = 0; i < (n || 60); i++) {
        const p = document.createElement('span');
        p.className = 'papelito';
        p.style.left = Math.random() * W + 'px';
        p.style.background = colores[i % colores.length];
        cont.appendChild(p);
        const dur = 1800 + Math.random() * 1600, dx = (Math.random() - .5) * 160, rot = (Math.random() - .5) * 900;
        p.animate([
          { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
          { transform: `translate(${dx}px, ${window.innerHeight + 40}px) rotate(${rot}deg)`, opacity: .9 },
        ], { duration: dur, easing: 'cubic-bezier(.2,.6,.4,1)', delay: Math.random() * 500 }).onfinish = () => p.remove();
      }
    },

    /** Anima un número en un elemento (de su valor actual al nuevo). */
    tween(el, hasta, ms) {
      const desde = Number(String(el.textContent).replace(/[^0-9-]/g, '')) || 0;
      if (desde === hasta) { el.textContent = hasta; return; }
      const t0 = performance.now();
      const paso = () => {
        const k = Math.max(0, Math.min(1, (performance.now() - t0) / (ms || 500)));
        const e = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(desde + (hasta - desde) * e);
        if (k < 1) requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
    },

    /** Mueve una ficha volando desde la bandeja hasta el hueco de la palabra. */
    volarFicha(idx) {
      const origen = $('fichas').querySelector(`[data-idx="${idx}"]`);
      const destino = $('palabra-actual').querySelector('.letra-actual:last-child');
      if (!origen || !destino || !destino.animate) return;
      const a = origen.getBoundingClientRect(), b = destino.getBoundingClientRect();
      destino.classList.add('volando');
      const v = document.createElement('div');
      v.className = 'ficha-volando';
      v.textContent = destino.textContent;
      v.style.left = a.left + (a.width - 38) / 2 + 'px';
      v.style.top = a.top + (a.height - 42) / 2 + 'px';
      document.body.appendChild(v);
      const dx = b.left - (a.left + (a.width - 38) / 2), dy = b.top - (a.top + (a.height - 42) / 2);
      v.animate([
        { transform: 'translate(0,0) scale(1.1)' },
        { transform: `translate(${dx * .5}px, ${dy * .5 - 24}px) scale(1.2)`, offset: .5 },
        { transform: `translate(${dx}px, ${dy}px) scale(1)` },
      ], { duration: 240, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => { v.remove(); destino.classList.remove('volando'); destino.style.animation = 'pop .25s cubic-bezier(.34,1.56,.64,1)'; };
    },

    centro(el) { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; },

    /** Un hechizo que vuela en arco de un punto a otro, con estela. */
    rayo(desde, hasta, color, alLlegar) {
      if (!document.body.animate || !hasta) { if (alLlegar) alLlegar(); return; }
      const dx = hasta.x - desde.x, dy = hasta.y - desde.y;
      const cx = desde.x + dx / 2 + dy * .15, cy = desde.y + dy / 2 - Math.min(110, Math.hypot(dx, dy) * .35);
      const pts = [0, .2, .4, .6, .8, 1].map((t) => {
        const u = 1 - t;
        return { transform: `translate(${u * u * desde.x + 2 * u * t * cx + t * t * hasta.x}px, ${u * u * desde.y + 2 * u * t * cy + t * t * hasta.y}px) scale(${.7 + Math.sin(t * Math.PI) * .5})` };
      });
      for (let i = 0; i < 6; i++) {
        const o = document.createElement('span');
        o.className = 'rayo' + (i ? ' estela' : ''); o.style.setProperty('--c', color);
        if (i) { const t = 13 - i * 1.7; o.style.width = o.style.height = t + 'px'; o.style.margin = (-t / 2) + 'px 0 0 ' + (-t / 2) + 'px'; o.style.opacity = String(.85 - i * .12); }
        document.body.appendChild(o);
        o.animate(pts, { duration: 420, delay: i * 24, easing: 'cubic-bezier(.45,0,.55,1)', fill: 'both' }).onfinish = () => { o.remove(); if (!i && alLlegar) alLlegar(); };
      }
    },

    /** Humito de hechizo fallido. */
    humo(x, y) {
      for (let i = 0; i < 6; i++) {
        const h = document.createElement('span'); h.className = 'humo';
        h.style.left = x + 'px'; h.style.top = y + 'px';
        document.body.appendChild(h);
        const dx = (Math.random() - .5) * 40, dy = -20 - Math.random() * 30;
        h.animate([{ transform: 'translate(-50%,-50%) scale(.4)', opacity: .9 }, { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1.6)`, opacity: 0 }],
          { duration: 700 + Math.random() * 300, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => h.remove();
      }
    },

    /** En el título y el menú Silabo hace cositas solo y de vez en cuando pasa una tormenta. */
    vidaTitulo() {
      const enTitulo = () => this.pantalla === 'p-titulo' || this.pantalla === 'p-menu';
      setInterval(() => {
        const m = this.pantalla === 'p-titulo' ? this.magos.titulo : null;
        if (!m || document.hidden || m.estado !== 'idle') return;
        const r = Math.random();
        if (r < .3) m.toque();
        else if (r < .5) { m.animar('cast', 800); }
        else if (r < .7) m.mirar(innerWidth * .8, innerHeight * .1);
        else if (r < .85) m.animar('saludo', 1100);
        else m.animar('happy', 900);
      }, 5500);
      const tormenta = () => {
        setTimeout(tormenta, 40000 + Math.random() * 35000);
        if (QUIETO || document.hidden || !enTitulo() || this.lugar || !window.WWEscena) return;
        WWEscena.tormenta((x, y) => {
          if (!enTitulo()) return;
          Audio.trueno();
          const m = this.pantalla === 'p-titulo' ? this.magos.titulo : this.magos.menu;
          if (m.estado === 'dormido') m.despertar(); else if (m.estado === 'idle') m.animar('sombrerazo', 900);
          m.mirar(x, y);
        });
      };
      setTimeout(tormenta, 11000);
    },

    /** Silabo atento: mira el puntero, reacciona al tocarlo, se duerme y da consejos si no jugás. */
    silaboVivo() {
      this.ultimaAccion = Date.now();
      const activo = () => this.pantalla === 'p-titulo' ? this.magos.titulo : this.pantalla === 'p-menu' ? this.magos.menu : this.pantalla === 'p-juego' ? this.magos.juego : null;
      let tMirar = 0;
      const alMover = (e) => {
        const now = performance.now(); if (now - tMirar < 90) return; tMirar = now;
        const m = activo(); if (m) m.mirar(e.clientX, e.clientY);
      };
      document.addEventListener('pointermove', alMover, { passive: true });
      document.addEventListener('pointerdown', (e) => {
        this.ultimaAccion = Date.now(); this._consejoDado = false;
        const m = activo();
        if (m && m.estado === 'dormido' && !e.target.closest('.mago')) m.despertar();
        if (m) m.mirar(e.clientX, e.clientY);
        // tocar el fondo sacude los árboles
        if (window.WWEscena && !e.target.closest('button, input, textarea, a, label, .ficha, .mago, .modal-caja, .tarjeta-jugador, .misiones, .encontradas, .palabra-actual, .hud')) {
          if (WWEscena.tocar(e.clientX)) Audio.hojas();
        }
      }, { passive: true });
      document.addEventListener('keydown', () => { this.ultimaAccion = Date.now(); this._consejoDado = false; const m = activo(); if (m && m.estado === 'dormido') m.despertar(); });
      for (const k of ['titulo', 'menu', 'juego']) {
        this.magos[k].cont.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          Audio.despertar();
          const r = this.magos[k].toque();
          ({ risa: () => Audio.risita(), giro: () => Audio.wiii(), estornudo: () => Audio.achis(), sombrerazo: () => Audio.boing(), despierta: () => Audio.boing() })[r]();
          if (k === 'juego') this.globo(azar(MENSAJES.toque[r]), 'ok');
          if (Estado.perfil) { Estado.perfil.stats.cosquillas = (Estado.perfil.stats.cosquillas || 0) + 1; }
        });
      }
      setInterval(() => {
        if (document.hidden) return;
        const quieto = Date.now() - this.ultimaAccion, m = activo();
        if (!m) return;
        if ((this.pantalla === 'p-titulo' || this.pantalla === 'p-menu') && quieto > 30000 && m.estado === 'idle') { m.dormir(); Audio.ronquido(); }
        const pa = this.partida;
        if (this.pantalla === 'p-juego' && pa && !pa.terminada && !pa.jefe && quieto > 15000 && !this._consejoDado) {
          this._consejoDado = true;
          this.globo(azar(MENSAJES.consejo)); m.animar('saludo', 900);
          const fs = $('fichas').querySelectorAll('.ficha:not(.usada)');
          if (fs.length) { const r = fs[Math.floor(Math.random() * fs.length)].getBoundingClientRect(); m.mirar(r.left + r.width / 2, r.top); }
        }
      }, 2000);
    },

    /** Ventana de la vela de racha (desde la racha del menú). */
    verVela() {
      const p = Estado.perfil, nv = p.inventario.vela || 0, precio = CONFIG.precios.vela, racha = Estado.rachaVigente(this.hoy);
      const lleno = nv >= CONFIG.velasMax;
      this.modal(`<h3>VELA DE RACHA</h3><div class="vela-grande">${WWIconos.html('vela')}</div>
        <p>Tu racha: <b>${racha} día${racha === 1 ? '' : 's'}</b>. Si un día no jugás el desafío, se consume una vela y la racha sigue.</p>
        <p>Tenés <b>${nv} de ${CONFIG.velasMax}</b> velas · Cuesta ${WWIconos.html('moneda')}${precio} (tenés ${p.monedas}).</p>`, [
        { texto: 'Cerrar', clase: 'btn-secundario' },
        { texto: lleno ? 'Tenés el máximo' : `Comprar por ${precio}`, clase: 'btn-primario', accion: () => {
          if (lleno || p.monedas < precio) { this.toast(lleno ? 'Ya tenés el máximo de velas' : 'Te faltan monedas'); return; }
          Estado.sumarMonedas(-precio); p.inventario.vela = nv + 1; Estado.guardar(); Audio.moneda();
          this.toast(`${WWIconos.html('vela')}<div><b>Vela encendida</b><br><small>Tu racha está protegida un día más</small></div>`, 'logro');
          this.irMenu();
        } },
      ]);
      const b = document.querySelector('#modal-caja .fila:last-child .btn-primario');
      if (b && (lleno || p.monedas < precio)) b.disabled = true;
    },

    /**
     * Capítulo 1: La Torre Arcana. Sin datos: el arranque (presentación del capítulo y Silabo camina al piso 1).
     * Con { pa, bonusPts, bonusMonedas, rest }: después de ganar un piso, camina al siguiente,
     * con cartel si entra a una zona nueva, aparición si lo espera un jefe y cierre al terminar el capítulo.
     */
    verTorre(info) {
      const p = Estado.perfil, pa = info && info.pa;
      const hecho = pa ? pa.arcade.piso : 0, sig = hecho + 1;
      const CAP = WWMapa.PISOS_CAPITULO;
      this._torre = { pa, sig };
      this.ponerLugar(WW_LUGARES.dePiso(Math.max(1, hecho)));
      this.mostrar('p-mapa');
      const vidas = pa ? pa.arcade.vidas : CONFIG.arcade.vidas;
      $('mapa-vidas').innerHTML = WWIconos.html('corazon').repeat(vidas) + WWIconos.html('corazonVacio').repeat(CONFIG.arcade.vidas - vidas);
      const jefeSig = WW.esPisoJefe(sig) ? `<p class="mapa-aviso">${WWIconos.html('calavera')} En el piso ${sig} te espera <b>${esc(WW.nombreJefe(sig))}</b></p>` : '';
      $('mapa-info').innerHTML = pa
        ? `<b>${pa.jefe ? `¡${esc(pa.nombreJefe)} vencido!` : `¡Piso ${hecho} superado!`}</b><small>+${info.bonusPts} pts de bonus (${info.rest} s sobrantes) · +${info.bonusMonedas} ${WWIconos.html('moneda')} · total <b>${pa.arcade.puntajeTotal}</b> pts</small>${jefeSig}`
        : `<b>Subí lo más alto que puedas</b><small>Cada piso es una palabra con un objetivo de puntos. Tenés 3 vidas y cada 5 pisos hay un jefe.${p.arcade.mejorPiso ? ` Tu mejor marca: piso ${p.arcade.mejorPiso}.` : ''}</small>`;
      const btn = $('mapa-jugar');
      btn.textContent = pa ? `Subir al piso ${sig}` : 'Empezar la subida';
      btn.disabled = true; btn.classList.remove('pulso-listo');
      this.magos.mapaJefe.setEtapa(2);
      WWMapa.pintar($('mapa'), { actual: hecho, hecho, esJefe: WW.esPisoJefe, nombreJefe: (n) => esc(WW.nombreJefe(n)), mago: this.magos.mapa, jefe: this.magos.mapaJefe });
      const caminar = () => WWMapa.avanzar(sig, () => Audio.tecla()).then(() => {
        if (this.pantalla !== 'p-mapa') return;
        Audio.poder(); this.magos.mapa.animar('happy', 800);
        const lugar = WW_LUGARES.dePiso(sig), zona = WWMapa.zonaDe(sig);
        let espera = 0;
        if (zona.desde === sig) {
          this.ponerLugar(lugar);
          this.cartelCapitulo(`ZONA ${WWMapa.ZONAS.indexOf(zona)}`, zona.nombre, '', 'zona');
          Audio.rango(); espera = 1900;
        }
        if (WW.esPisoJefe(sig)) setTimeout(() => {
          if (this.pantalla !== 'p-mapa') return;
          WWMapa.mostrarJefe(sig); Audio.jefe(); this.vineta('flash-rojo'); this.sacudir(false);
          this.magos.mapaJefe.animar('cast', 1200); this.magos.mapa.animar('sad', 700);
        }, espera);
        setTimeout(() => { btn.disabled = false; btn.classList.add('pulso-listo'); }, espera + (WW.esPisoJefe(sig) ? 900 : 0));
      });
      // presentación del capítulo: carteles y cámara que baja desde la cima
      if (!pa) {
        const primera = !(p.vistos && p.vistos.cap1);
        p.vistos = Object.assign({}, p.vistos, { cap1: true }); Estado.guardar();
        const cartel = this.cartelCapitulo('CAPÍTULO 1', 'La Torre Arcana', 'Nocturnia encerró las palabras del bosque en lo alto de la torre. Silabo va a subir piso por piso para liberarlas.', 'capitulo', primera ? 5200 : 2600);
        setTimeout(() => WWMapa.recorrido(primera ? 4200 : 1800).then(() => { cartel.cerrar(); setTimeout(caminar, 350); }), 600);
        cartel.alTocar = () => WWMapa.cortarRecorrido();
        return;
      }
      // fin del capítulo: cartel y sigue la subida, más allá de la torre
      if (hecho === CAP) {
        this.confeti(120); Audio.victoria();
        const cartel = this.cartelCapitulo('¡CAPÍTULO 1 COMPLETO!', 'Liberaste las palabras', 'Pero Nocturnia no estaba sola: el Archimago Gris espera más arriba. La subida sigue…', 'capitulo', 4200);
        cartel.alCerrar = () => caminar();
        return;
      }
      setTimeout(caminar, 450);
    },

    /**
     * Cartel de cine sobre el camino (franjas negras arriba y abajo). Devuelve { cerrar, alTocar, alCerrar }.
     * tipo 'capitulo' es grande y se queda hasta ms; 'zona' es más chico y se va solo.
     */
    cartelCapitulo(antetitulo, titulo, texto, tipo, ms) {
      const pant = $('p-mapa');
      pant.querySelectorAll('.cine').forEach((c) => c.remove());
      const c = document.createElement('div');
      c.className = 'cine ' + tipo;
      c.innerHTML = `<i class="cine-franja arriba"></i><i class="cine-franja abajo"></i><div class="cine-caja"><small>${esc(antetitulo)}</small><b>${esc(titulo)}</b>${texto ? `<p>${esc(texto)}</p>` : ''}${tipo === 'capitulo' ? '<em>Tocá para seguir</em>' : ''}</div>`;
      pant.appendChild(c);
      void c.offsetWidth; c.classList.add('ve');
      const ctl = { cerrado: false, alTocar: null, alCerrar: null };
      ctl.cerrar = () => {
        if (ctl.cerrado) return; ctl.cerrado = true;
        c.classList.remove('ve'); setTimeout(() => c.remove(), 600);
        if (ctl.alCerrar) ctl.alCerrar();
      };
      c.addEventListener('pointerdown', () => { if (ctl.alTocar) ctl.alTocar(); ctl.cerrar(); });
      setTimeout(ctl.cerrar, ms || 1800);
      return ctl;
    },

    limpiarEfectos() {
      Audio.setTempo(false); this.magos.juego.nervioso(false);
      if (this.partida) this.partida.vinetaRoja = false;
      this.vineta('');
    },
    congelarReloj(pa) { pa.congelado = true; clearInterval(pa.timer); this.magos.juego.nervioso(false); },

    // ============================================================ modal
    modal(html, botones) {
      const m = $('modal'), caja = $('modal-caja');
      caja.innerHTML = html + '<div class="fila"></div>';
      const fila = caja.querySelector('.fila:last-child');
      for (const b of botones || []) {
        const el = document.createElement('button');
        el.className = 'btn ' + (b.clase || 'btn-secundario'); el.textContent = b.texto;
        el.addEventListener('click', () => { Audio.click(); m.classList.add('oculto'); if (b.accion) b.accion(); });
        fila.appendChild(el);
      }
      m.classList.remove('oculto');
      const hs = caja.querySelector('.modal-silabo');
      if (hs) {
        const p = Estado.perfil, mg = new Magos.Mago(hs, { paleta: p ? p.sombrero : 'turquesa', etapa: p ? Magos.etapaPorNivel(p.nivel) : 0 });
        if (hs.dataset.pose === 'happy') mg.chispas(16, .5, .3);
        hs.classList.add(hs.dataset.pose);
      }
      WWIconos.pintar(caja);
    },
  };

  function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  window.App = App;
  document.addEventListener('DOMContentLoaded', () => App.init());
})();
