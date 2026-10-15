/**
 * Word Wizard — pantallas, partidas y progresión.
 */
(function () {
  'use strict';
  // algún archivo no llegó (index.html lo reintenta una vez y si no avisa): sin esto, la pantalla quedaba en blanco
  if (!window.WWI18n || !window.WW || !window.WWEstado) { if (window.WWFalla) window.WWFalla(); return; }
  try { sessionStorage.removeItem('ww.reintento'); } catch (e) { /* nada */ }
  if (window.WWDiag) WWDiag.etapa('app');
  const T = (es, v) => window.WWI18n.t(es, v), EN = window.WWI18n.idioma === 'en';
  const IDIOMA_DATOS = window.WWI18n.idiomaDatos;
  /**
   * Tamaño de letra (Ajustes): se guarda por dispositivo. Si nunca se eligió y el celular tiene la letra agrandada
   * (Dynamic Type en iPhone, letra base del navegador en Android), arranca en Grande o Muy grande.
   */
  const Letra = {
    LS: 'ww.letra', PASOS: [1, 1.18, 1.36],
    sistema() {
      try {
        const p = document.createElement('span');
        p.style.cssText = 'position:absolute;visibility:hidden;font:-apple-system-body';
        document.documentElement.appendChild(p);
        const ios = p.style.font ? parseFloat(getComputedStyle(p).fontSize) / 17 : 1;   // en iPhone, 17 px es el tamaño normal
        p.remove();
        const raiz = parseFloat(getComputedStyle(document.documentElement).fontSize) / 16 || 1;
        return Math.max(ios || 1, raiz);
      } catch (e) { return 1; }
    },
    factor() {
      let g = null;
      try { g = localStorage.getItem(this.LS); } catch (e) { /* nada */ }
      if (g && this.PASOS.includes(Number(g))) return Number(g);
      const s = this.sistema();
      return s >= 1.3 ? 1.36 : s >= 1.1 ? 1.18 : 1;
    },
    aplicar(k) { document.documentElement.style.setProperty('--letra', String(k || this.factor())); },
    guardar(k) { try { localStorage.setItem(this.LS, String(k)); } catch (e) { /* nada */ } this.aplicar(k); },
  };
  Letra.aplicar();
  window.WWLetra = Letra;

  /** Lo que cambia con el idioma y no es una traducción: ejemplos del tutorial, letras del fondo, texto para compartir. */
  const LOCAL = {
    es: { base: 'CAMINAR', arma: 'CAMA', ejemplos: ['cama', 'mina', 'rima'], y: 'y', letras: 'ABCDEFGHIJLMNÑOPRSTUV',
      torre: 'Torre Arcana', piso: 'Piso', palabras: 'palabras', jefe: (n) => `${n} jefe${n > 1 ? 's' : ''}`, reto: '¿Me superás?', racha: 'racha' },
    en: { base: 'PLANETS', arma: 'PLAN', ejemplos: ['plan', 'lane', 'slant'], y: 'and', letras: 'ABCDEFGHIKLMNOPRSTUWY',
      torre: 'Arcane Tower', piso: 'Floor', palabras: 'words', jefe: (n) => `${n} boss${n > 1 ? 'es' : ''}`, reto: 'Can you beat me?', racha: 'streak' },
    pt: { base: 'PLANETA', arma: 'PENA', ejemplos: ['pena', 'tela', 'planta'], y: 'e', letras: 'ABCDEFGHIJLMNOPRSTUVÇ',
      torre: 'Torre Arcana', piso: 'Andar', palabras: 'palavras', jefe: (n) => `${n} chef${n > 1 ? 'ões' : 'ão'}`, reto: 'Consegue me superar?', racha: 'sequência' },
  }[window.WWI18n.idioma] || {};
  /** Clave del desafío diario en el perfil: cada idioma tiene el suyo (en español, solo la fecha, como siempre). */
  const K = (fecha) => (IDIOMA_DATOS === 'es' ? fecha : `${IDIOMA_DATOS}:${fecha}`);
  /** El desafío empezado, si es de este idioma (uno empezado en otro idioma espera a que se vuelva a ese). */
  // fondo propio de algunas pantallas (el resto, el bosque)
  const FONDOS = { 'p-practica': 'biblioteca', 'p-rankings': 'cumbre' };
  const FONDOS_BOSQUE = ['p-menu', 'p-mago', 'p-titulo', 'p-stats', 'p-logros', 'p-ayuda', 'p-ajustes'];
  const enCursoAca = (p) => (p.enCurso && (p.enCurso.idioma || 'es') === IDIOMA_DATOS ? p.enCurso : null);
  const WW = window.WW, Estado = window.WWEstado, Audio = window.WWAudio, Logros = window.WWLogros, Magos = window.WWMago, Ranking = window.WWRanking;
  const $ = (id) => document.getElementById(id);

  const CONFIG = {
    version: '2.40.0',
    diario: { tiempo: 180 },
    arcade: { tiempo: 75, tiempoJefe: 110, vidas: 3 },
    practica: { tiempo: 180 },
    precios: { pista: 10, tiempo: 15, ojo: 25, escudo: 12, vela: 60 },
    // cuántas veces se puede usar cada poder en un mismo piso de la Torre: ayudan a destrabar, no reemplazan jugar
    limites: { pista: 2, tiempo: 1, ojo: 1, escudo: 1 },
    // archivo de desafíos: los últimos días gratis; el resto, con el Pase de Mago (docs/HOJA-DE-RUTA.md)
    archivoGratis: 3, archivoDias: 30,
    trajeTemporada: 'ceibo',   // el traje de la temporada que viene con el Pase (Silabo lo luce en la pantalla del Pase)
    practicasGratis: 3,   // por día; con el Pase de Mago, sin límite (docs/MONETIZACION.md)
    practicasTester: 10,  // los testers de la prueba cerrada (entran una vez con el link ?tester=bosque)
    // monedas que la Torre puede dar por día; las fuertes vienen de volver cada día (diario y misiones)
    topeTorre: 150,
    velasMax: 2,
    comboVentana: 6000,
  };
  window.WW_VERSION = CONFIG.version;   // para los reportes de errores (js/reportes.js)
  /** Precio en monedas para adelantar un traje (las monedas sobraban: ver docs/PROGRESO.md). */
  const PRECIO_TRAJE = (nivel) => nivel * 80;

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
  // ícono de logro: medallón dibujado (logros-iconos.js); si falta, el emoji de siempre
  const iconoLogro = (l, bloq) => (window.WWLogrosIconos && WWLogrosIconos.SIMBOLOS && WWLogrosIconos.SIMBOLOS[l.id]) ? WWLogrosIconos.html(l.id, bloq) : (bloq ? '🔒' : l.icono);
  // la flor de ceibo de la temporada (misma que escena.js, en chico)
  const FLOR = '<svg class="ic flor-ceibo" viewBox="-12 -16 24 20"><path d="M0 0 Q-4 -7 -1 -13 Q3 -8 0 0Z" fill="#c9485b" stroke="#16262c" stroke-width="1.3"/><path d="M0 0 Q3 -4 5 -9 Q6 -4 0 0Z" fill="#e2737a" stroke="#16262c" stroke-width="1.2"/></svg>';
  const iconoMision = (x) => x.temporada ? FLOR : ICONO_MISION[x.evento] ? WWIconos.html(ICONO_MISION[x.evento]) : x.icono;
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
    /** Chip de idioma en el título: muestra la bandera del idioma actual y al tocarlo abre los disponibles. */
    chipIdioma() {
      const I = window.WWI18n, caja = $('idioma-chip-caja');
      if (!caja || !I || I.disponibles.length < 2) return;
      const AR = '<svg viewBox="0 0 30 21"><rect width="30" height="21" fill="#75aadb"/><rect y="7" width="30" height="7" fill="#fff"/><circle cx="15" cy="10.5" r="2.4" fill="#f2c66d" stroke="#c49a42" stroke-width=".6"/></svg>';
      const US = '<svg viewBox="0 0 30 21"><rect width="30" height="21" fill="#fff"/>' + Array.from({ length: 7 }, (_, i) => `<rect y="${i * 3}" width="30" height="1.6" fill="#c9485b"/>`).join('') + '<rect width="13" height="11" fill="#34507a"/><g fill="#fff">' + Array.from({ length: 6 }, (_, i) => `<circle cx="${2.5 + (i % 3) * 4}" cy="${3 + Math.floor(i / 3) * 4.5}" r=".9"/>`).join('') + '</g></svg>';
      const BR = '<svg viewBox="0 0 30 21"><rect width="30" height="21" fill="#3f8f4f"/><path d="M15 3 L27 10.5 L15 18 L3 10.5Z" fill="#f2c66d"/><circle cx="15" cy="10.5" r="4.2" fill="#34507a"/><path d="M11 10 Q15 8.6 19 10.6" stroke="#fff" stroke-width=".9" fill="none"/></svg>';
      const IDI = { es: [AR, 'Español'], en: [US, 'English'], pt: [BR, 'Português'] };
      const band = (k) => `<span class="bandera">${IDI[k][0]}</span>`;
      const chip = $('idioma-chip'), menu = $('idioma-menu');
      chip.innerHTML = `${band(I.idioma)} ${I.idioma.toUpperCase()} ▾`;
      menu.innerHTML = I.disponibles.filter((k) => IDI[k]).map((k) => `<button data-k="${k}" class="${k === I.idioma ? 'on' : ''}">${band(k)} ${IDI[k][1]}</button>`).join('');
      caja.classList.remove('oculto');
      chip.addEventListener('click', (e) => { e.stopPropagation(); Audio.click(); menu.classList.toggle('oculto'); });
      menu.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        Audio.click(); menu.classList.add('oculto');
        if (b.dataset.k !== I.idioma) { if (Estado.perfil) Estado.guardar(); I.cambiar(b.dataset.k); }
      });
      document.addEventListener('click', () => menu.classList.add('oculto'));
    },

    init() {
      // testers de la prueba cerrada: el link ?tester=bosque deja marcado este dispositivo (más prácticas por día)
      try {
        if (new URLSearchParams(location.search).get('tester') === 'bosque') {
          localStorage.setItem('ww.tester', '1'); history.replaceState(null, '', location.pathname);
          setTimeout(() => this.toast(`🧪 Modo tester: ${CONFIG.practicasTester} prácticas por día. ¡Gracias por probar!`), 2500);
        }
      } catch (e) { /* sin almacenamiento */ }
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
      this.temporada = WW.temporadaDe(new Date());
      if (window.WWEscena && this.temporada) WWEscena.temporada = this.temporada.escena;
      if (window.WWEscena) { WWEscena.montar($('esc-atras'), $('esc-frente'), 'bosque'); WWEscena.intro(() => setTimeout(() => this.magos.titulo.animar('happy', 900), 2300)); }
      if (window.WWVida) { WWVida.montar($('vida'), $('fondo')); this.pintarVida(); }   // la primera pantalla no pasa por mostrar(): sin esto la araña y la luna arrancaban dormidas
      const logo = document.querySelector('#p-titulo .logo-titulo');
      if (logo) $('inicio-logo').appendChild(logo.cloneNode(true));
      this.vidaTitulo();
      setTimeout(() => $('p-titulo').classList.remove('con-intro'), 5000);
      this.silaboVivo();
      $('version').textContent = 'v' + CONFIG.version;
      this.destellos();
      this.eventos();
      this.pwa();
      this.juice();
      this.compras();
      this.cuenta();
      this.atras();
      this.otraPestana();
      this.chipIdioma();
      // uso anónimo (game/js/metricas.js): una apertura por día, también si vuelve del segundo plano otro día
      const abrir = () => { const d = WW.claveDia(); if (d !== this._abierto && window.WWMetricas) { this._abierto = d; WWMetricas.marcar(d, CONFIG.version, null); } };
      abrir(); document.addEventListener('visibilitychange', () => { if (!document.hidden) abrir(); });
      // cargar diccionario sin congelar la pantalla de título
      setTimeout(() => {
        try {
          this.dic = new WW.Diccionario(window.WW_DICT || '', { idioma: window.WWI18n.idiomaDatos, comunes: window.WW_COMUNES, sinPlural: window.WW_SINPLURAL, lemas: window.WW_LEMAS });
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
        this.cuentaAlAbrir();
        if (window.WWDiag) WWDiag.etapa('titulo');
      }, 60);
    },

    pwa() {
      // Cada sistema se instala distinto: Chrome/Android/Edge avisan (beforeinstallprompt); iPhone no avisa (se explican
      // los pasos); dentro de Instagram, Facebook, TikTok… no se puede (hay que abrirlo en el navegador).
      const ua = navigator.userAgent;
      this.esIOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      this.esAndroid = /android/i.test(ua);
      const app = ua.match(/Instagram|FBAN|FBAV|FB_IAB|TikTok|musical_ly|LinkedInApp|Snapchat|Line\/|Twitter|MicroMessenger/i);
      this.enApp = app ? ({ fban: 'Facebook', fbav: 'Facebook', fb_iab: 'Facebook', musical_ly: 'TikTok', linkedinapp: 'LinkedIn', 'line/': 'LINE', micromessenger: 'WeChat' }[app[0].toLowerCase()] || app[0]) : null;
      this.instalada = !!(navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches));
      window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); this.instalarEvento = e; this.pintarInstalar(); });
      window.addEventListener('appinstalled', () => {
        this.instalarEvento = null; this.instalada = true; this.pintarInstalar();
        this.toast('📲 ¡Word Wizard instalado!');
      });
      this.pintarInstalar();
      if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) {
        navigator.serviceWorker.register('sw.js?datos=' + encodeURIComponent(WWI18n.datos)).then((reg) => {
          reg.addEventListener('updatefound', () => {
            const nuevo = reg.installing;
            if (!nuevo) return;
            nuevo.addEventListener('statechange', () => {
              if (nuevo.state === 'installed' && navigator.serviceWorker.controller) this.versionNueva();
            });
          });
          // el iPhone casi nunca relanza la app instalada (la "despierta"): se busca versión nueva al volver y cada 30 minutos
          const buscar = () => { reg.update().catch(() => {}); };
          document.addEventListener('visibilitychange', () => { if (!document.hidden) buscar(); });
          setInterval(buscar, 30 * 60 * 1000);
        }).catch(() => {});
      }
    },

    /**
     * Comentarios: una carita, el texto y "Enviar" (llega a la base: node tools/reportes.js).
     * WhatsApp queda como segunda opción, para quien prefiera hablar directo.
     */
    comentario() {
      const caras = [['😍', 'Me encanta'], ['🙂', 'Me gusta'], ['😐', 'Más o menos'], ['🙁', 'No me gusta']];
      this.modal(`<h3>¿QUÉ TE PARECIÓ?</h3><p>Contame lo que quieras: qué te gustó, qué no se entendió, si algo se rompió. Lo leo todo.</p>
        <div class="fb-caras" id="fb-caras">${caras.map(([c, t]) => `<button class="fb-cara" data-c="${c}" title="${t}" aria-label="${t}">${c}</button>`).join('')}</div>
        <textarea class="modal-input" id="fb-texto" rows="5" style="border-radius:14px;resize:vertical;min-height:110px" placeholder="Escribí acá..."></textarea>
        <div class="fila" style="margin-top:12px"><button class="btn btn-primario" id="fb-enviar">Enviar</button></div>
        <p class="fb-otra"><a id="fb-wa" href="https://wa.me/" target="_blank" rel="noopener">o mandalo por WhatsApp</a></p>`, [
        { texto: 'Cerrar', clase: 'btn-secundario' },
      ]);
      let cara = '';
      $('fb-caras').addEventListener('click', (e) => {
        const b = e.target.closest('.fb-cara'); if (!b) return;
        cara = cara === b.dataset.c ? '' : b.dataset.c; Audio.click();
        $('fb-caras').querySelectorAll('.fb-cara').forEach((x) => x.classList.toggle('on', x.dataset.c === cara));
      });
      const ta = $('fb-texto'), wa = $('fb-wa');
      const actualizar = () => { const m = this.mensajeComentario(); wa.href = 'https://wa.me/?text=' + encodeURIComponent(m || ''); };
      ta.addEventListener('input', actualizar); actualizar();
      wa.addEventListener('click', (e) => { if (!this.mensajeComentario()) { e.preventDefault(); this.toast('Escribí algo primero'); } else this.toast('¡Gracias! 🙌'); });
      $('fb-enviar').addEventListener('click', async () => {
        const t = (ta.value || '').trim();
        if (!t && !cara) { this.toast('Escribí algo o elegí una carita'); return; }
        const b = $('fb-enviar'); b.disabled = true; b.textContent = 'Enviando…';
        const p = Estado.perfil, reg = (p && p.registro) || {}, dias = Object.keys(reg);
        const ok = window.WWReportes ? await WWReportes.comentario((cara ? cara + ' ' : '') + (t || '(sin texto)'), {
          cara, nivel: p && p.nivel, partidas: p && p.stats.partidas, mejorPiso: p && p.arcade.mejorPiso, racha: p && Estado.rachaVigente(this.hoy),
          diasJugados: dias.length, minPorDia: dias.length ? Math.round(dias.reduce((s, k) => s + reg[k].seg, 0) / dias.length / 60) : 0,
          desde: p && p.creado.slice(0, 10), pantalla: this.pantalla,
        }) : false;
        Audio.mision();
        $('modal').classList.add('oculto');
        this.toast(ok ? '¡Gracias! Ya me llegó 🙌' : 'Quedó guardado: se manda cuando haya conexión 🙌', 'logro');
      });
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

    /** Pasos para instalar en iPhone/iPad (Compartir → Agregar a inicio), con los dibujos de los botones de Safari. */
    instalarIOS() {
      const L = '#16262c';
      const compartir = `<svg class="ios-ic" viewBox="0 0 24 24"><path d="M8 9 H6 V21 H18 V9 H16" fill="none" stroke="#5aa2ff" stroke-width="2" stroke-linejoin="round"/><path d="M12 3 V14 M8 7 L12 3 L16 7" fill="none" stroke="#5aa2ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      const agregar = `<svg class="ios-ic" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="${L}" stroke-width="2"/><path d="M12 8 V16 M8 12 H16" stroke="${L}" stroke-width="2" stroke-linecap="round"/></svg>`;
      this.modal(`<h3>INSTALAR WORD WIZARD</h3><div class="modal-silabo" data-pose="happy"></div><p>Queda como una app, con su ícono, en pantalla completa y anda sin internet.</p>
        <ol class="ios-pasos"><li><span>Tocá <b>Compartir</b></span>${compartir}</li><li><span>Elegí <b>Agregar a inicio</b></span>${agregar}</li><li><span>Tocá <b>Agregar</b>, arriba a la derecha</span></li></ol>
        <p class="modal-nota">Compartir está abajo en el iPhone y arriba en el iPad. Si no lo ves, tocá los tres puntitos (•••).</p>`, [{ texto: '¡Listo!', clase: 'btn-primario' }]);
    },

    /** ¿Cómo se instala acá? 'aviso' (Chrome/Android/Edge), 'ios', 'app' (dentro de Instagram…), 'menu' (otro navegador del celular) o null. */
    modoInstalar() {
      if (this.instalada || window.WW_ARTIFACT) return null;
      if (this.enApp) return 'app';
      if (this.instalarEvento) return 'aviso';
      if (this.esIOS) return 'ios';
      if (this.esAndroid) return 'menu';
      return null;   // compu sin aviso: no se ofrece
    },
    pintarInstalar() {
      const si = !!this.modoInstalar();
      $('btn-instalar').classList.toggle('oculto', !si);
      $('aj-instalar').classList.toggle('oculto', !si);
    },

    /** Dentro de Instagram, Facebook, TikTok…: no se puede instalar; hay que abrirlo en el navegador. */
    instalarEnApp() {
      const url = location.origin + location.pathname;
      const nav = this.esIOS ? 'Safari' : 'Chrome';
      this.modal(`<h3>ABRILO EN ${nav.toUpperCase()}</h3><div class="modal-silabo" data-pose="happy"></div><p>Estás dentro de ${esc(this.enApp)}: desde acá no se puede instalar.</p>
        <ol class="ios-pasos"><li><span>Tocá los tres puntitos (••• o ⋮), arriba</span></li><li><span>Elegí <b>Abrir en ${nav}</b></span></li><li><span>Ahí tocá <b>Instalar</b></span></li></ol>
        <p class="modal-nota">${esc(url.replace(/^https?:\/\//, ''))}</p>`, [
        { texto: 'Copiar el link', clase: 'btn-secundario', accion: () => this.copiar(url) },
        { texto: '¡Listo!', clase: 'btn-primario' },
      ]);
    },
    /** Otro navegador del celular (Firefox, Samsung sin aviso…): desde su menú. */
    instalarMenu() {
      this.modal(`<h3>INSTALAR WORD WIZARD</h3><div class="modal-silabo" data-pose="happy"></div><p>Queda como una app, con su ícono, en pantalla completa y anda sin internet.</p>
        <ol class="ios-pasos"><li><span>Abrí el menú del navegador (⋮ o ☰)</span></li><li><span>Tocá <b>Instalar app</b> o <b>Agregar a pantalla principal</b></span></li></ol>`, [{ texto: '¡Listo!', clase: 'btn-primario' }]);
    },

    /** Después de una partida, ofrece instalar: desde la primera, como mucho 3 veces y con 2 días entre una y otra. */
    ofrecerInstalar() {
      if (!this.modoInstalar()) return;
      let o = { veces: 0, ultima: 0 };
      try { o = JSON.parse(localStorage.getItem('ww.instalar') || localStorage.getItem('ww.ios.instalar') || 'null') || o; } catch (e) { /* sin almacenamiento */ }
      if (o.veces >= 3 || Date.now() - o.ultima < 2 * 864e5) return;
      setTimeout(() => {
        const modo = this.modoInstalar();
        if (!modo || this.pantalla !== 'p-resultado' || document.querySelector('#modal:not(.oculto)')) return;
        o.veces += 1; o.ultima = Date.now();
        try { localStorage.setItem('ww.instalar', JSON.stringify(o)); } catch (e) { /* sin almacenamiento */ }
        const donde = this.esIOS ? 'en el iPhone' : this.esAndroid ? 'en el celular' : 'en la compu';
        this.modal(`<h3>¿LO INSTALÁS?</h3><div class="modal-silabo" data-pose="happy"></div><p>Word Wizard se puede tener como app ${donde}: con su ícono, en pantalla completa y sin internet. Así no te perdés el desafío de mañana.</p>`, [
          { texto: 'Ahora no', clase: 'btn-secundario' },
          { texto: modo === 'aviso' ? 'Instalar' : 'Cómo se hace', clase: 'btn-primario', accion: () => this.instalar() },
        ]);
      }, 2600);
    },

    instalar() {
      const modo = this.modoInstalar();
      if (!modo) return;
      Audio.click();
      if (modo === 'app') return this.instalarEnApp();
      if (modo === 'ios') return this.instalarIOS();
      if (modo === 'menu') return this.instalarMenu();
      this.instalarEvento.prompt();
      this.instalarEvento.userChoice.finally(() => { this.instalarEvento = null; this.pintarInstalar(); });
    },

    /** Para recomendarlo en persona: QR grande y el link para compartir. */
    invitar() {
      const url = 'https://wordwizard.capralabsgames.com/';
      const pintarQR = () => {
        const q = window.qrcode(0, 'M'); q.addData(url); q.make();
        const n = q.getModuleCount(); let d = '';
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) d += `M${x} ${y}h1v1h-1z`;
        const caja = document.querySelector('.qr-caja');
        if (caja) caja.innerHTML = `<svg viewBox="-2 -2 ${n + 4} ${n + 4}" shape-rendering="crispEdges"><rect x="-2" y="-2" width="${n + 4}" height="${n + 4}" fill="#f3f6ee"/><path d="${d}" fill="#16262c"/></svg>`;
      };
      this.modal('<h3>INVITAR A JUGAR</h3><p>Que lo escaneen con la cámara del celular.</p><div class="qr-caja"></div><p class="qr-link">wordwizard.capralabsgames.com</p>', [
        { texto: 'Compartir', clase: 'btn-secundario', accion: () => { if (navigator.share) navigator.share({ title: 'Word Wizard', text: WWI18n.t('Probá Word Wizard, un juego de palabras:'), url }).catch(() => {}); else this.copiar(url); } },
        { texto: 'Listo', clase: 'btn-primario' },
      ]);
      if (window.qrcode) return pintarQR();
      const sc = document.createElement('script'); sc.src = 'js/qr.js?v=' + CONFIG.version; sc.onload = pintarQR; document.head.appendChild(sc);
    },

    /**
     * El inicio (v2.40, lab/mago-unico.html, opción A elegida por Owen el 15/10): un solo mago por dispositivo, en una
     * tarjeta con su cuenta a la vista, y "Jugar". Antes había una lista de magos y "Ya tengo cuenta" siempre a la
     * vista, y parecía que la sesión se perdía (docs/AUDITORIA-CUENTAS.md). Sin mago: el nombre o "Entrar con mi
     * cuenta". Con varios (dispositivos de antes de la v2.40): se elige uno.
     */
    renderPerfiles() {
      const nombres = Object.keys(Estado.todos());
      const p = nombres.length === 1 ? (Estado.perfil && Estado.perfil.nombre === nombres[0] ? Estado.perfil : Estado.cargar(nombres[0])) : null;
      const jugar = $('btn-jugar');
      $('titulo-mago').classList.toggle('oculto', !p);
      jugar.classList.toggle('oculto', !p);
      $('form-nombre').classList.toggle('oculto', nombres.length > 0);
      if (p) {
        this.pintarTarjetaTitulo(p);
        jugar.onclick = () => { Audio.despertar(); Audio.click(); this.entrar(p.nombre); };
      }
      this.pintarCuentaTitulo();
      // después de la entrada del logo y de Silabo (si no, el cartel tapa la intro a medio dibujar)
      if (nombres.length > 1) setTimeout(() => this.elegirMago(), $('p-titulo').classList.contains('con-intro') ? 3300 : 300);
    },
    /** La tarjeta del mago en el inicio: nivel, nombre y dónde está guardado (o el botón para guardarlo). */
    pintarTarjetaTitulo(p) {
      const clave = p.creado || p.nombre, cuentas = !!(window.WWCuenta && WWCuenta.activo());
      const c = cuentas ? WWCuenta.de(clave) : null;
      const nube = '<svg class="tm-nube" viewBox="0 0 18 12" aria-hidden="true"><path d="M5 11h9a3.4 3.4 0 0 0 .6-6.7A4.6 4.6 0 0 0 5.8 3.2 3.9 3.9 0 0 0 5 11z"/></svg>';
      let linea, boton = '';
      if (c && c.perdida) { linea = `<small class="vencida">${nube}<span>Volvé a entrar para guardar</span></small>`; boton = '☁ Entrar'; }
      else if (c && c.email) linea = `<small class="con">${nube}<span>Guardado en </span><span data-no-t>${esc(c.email)}</span></small>`;
      else if (c) linea = `<small class="con">${nube}<span>Guardado en tu cuenta</span></small>`;
      else if (cuentas) { linea = '<small><span>Tu progreso no está guardado</span></small>'; boton = '☁ Guardar'; }
      else linea = `<small><span>${WW.tituloNivel(p.nivel)}</span></small>`;
      const t = $('titulo-mago');
      t.innerHTML = `<span class="tm-nivel">${p.nivel || 1}</span><span class="tm-datos"><b data-no-t>${esc(p.nombre)}</b>${linea}</span>${boton ? `<button class="tm-boton">${boton}</button>` : ''}`;
      const b = t.querySelector('.tm-boton');
      if (b) b.addEventListener('click', () => { Audio.despertar(); this.entrarCuenta(clave); });
    },

    /**
     * Dispositivos de antes de la v2.40 con varios magos: se elige uno, una sola vez (lab/mago-unico.html, opción Y).
     * Los que no se eligen salen del dispositivo: los que tienen cuenta siguen en su cuenta (se guarda lo último y se
     * cierra su sesión acá); los que no, se pierden (el cartel lo avisa). Todos dejan una copia escondida por 30 días
     * (Estado.apartar), solo para soporte.
     */
    elegirMago() {
      const todos = Estado.todos(), nombres = Object.keys(todos);
      if (nombres.length < 2 || this._vuelta || this.pantalla !== 'p-titulo' || !$('modal').classList.contains('oculto')) return;
      const cuentaDe = (n) => (window.WWCuenta ? WWCuenta.de(todos[n].creado || n) : null);
      // primero el último que se usó; si no, el de más nivel
      const ultimo = Estado.cargar();
      nombres.sort((a, b) => (todos[b].nivel || 1) - (todos[a].nivel || 1) || a.localeCompare(b));
      let sel = ultimo && todos[ultimo.nombre] ? ultimo.nombre : nombres[0];
      this.modal(`<h3>ELEGÍ TU MAGO</h3><p>Ahora cada dispositivo tiene un solo mago. ¿Con cuál seguís?</p>
        <div class="elegir-mago">${nombres.map((n) => {
          const c = cuentaDe(n);
          return `<button data-i="${nombres.indexOf(n)}"><span class="tm-nivel">${todos[n].nivel || 1}</span><span class="tm-datos"><b data-no-t>${esc(n)}</b>${c ? `<small class="con"><span data-no-t>☁ ${esc(c.email || '')}</span></small>` : '<small>Sin cuenta</small>'}</span></button>`;
        }).join('')}</div><p class="elegir-nota" data-no-t></p>`, [
        { texto: 'Seguir', clase: 'btn-primario', accion: () => this.quedarseCon(sel) },
      ]);
      const caja = $('modal-caja');
      // "Kensi y Prueba" / "Kensi and Prueba"
      const lista = (l) => { try { return new Intl.ListFormat(WWI18n.idioma, { type: 'conjunction' }).format(l); } catch (e) { return l.join(', '); } };
      const pintar = () => {
        caja.querySelectorAll('.elegir-mago button').forEach((b) => b.classList.toggle('on', nombres[b.dataset.i] === sel));
        const sin = nombres.filter((n) => n !== sel && !cuentaDe(n));
        const nota = caja.querySelector('.elegir-nota');
        nota.classList.toggle('aviso', sin.length > 0);
        nota.textContent = sin.length ? WWI18n.t(sin.length > 1 ? 'Se borran {n}: no tienen cuenta.' : 'Se borra {n}: no tiene cuenta.', { n: lista(sin) }) : WWI18n.t('Los otros siguen en su cuenta.');
        const b = caja.querySelector('.fila .btn');
        b.dataset.noT = '1'; b.textContent = WWI18n.t('Seguir con {n}', { n: sel });   // ya traducidos con WWI18n.t
      };
      caja.querySelectorAll('.elegir-mago button').forEach((b) => b.addEventListener('click', () => { Audio.click(); sel = nombres[b.dataset.i]; pintar(); }));
      pintar();
    },
    quedarseCon(elegido) {
      const todos = Estado.todos();
      for (const n of Object.keys(todos)) {
        if (n === elegido) continue;
        const p = todos[n], clave = p.creado || n;
        if (window.WWCuenta && WWCuenta.de(clave)) {
          // con cuenta: se sube lo último y se cierra su sesión acá (el mago queda en su cuenta)
          const copia = JSON.parse(JSON.stringify(p));
          WWCuenta.sincronizar(clave, copia).catch(() => null).then(() => WWCuenta.salir(clave));
        }
        Estado.apartar(n);
      }
      const p = Estado.cargar(elegido);
      // las compras de la cuenta de otro mago no quedan prendidas para este (las suyas vuelven al sincronizar)
      if (window.WWCompras && !(window.WWCuenta && WWCuenta.de(p.creado || p.nombre))) WWCompras.olvidarCuenta();
      this.renderPerfiles();
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
      this.sincronizarCuenta();
      // v2.30: hasta la v2.29 la Torre solo se mandaba al cerrar la subida; quien la dejó a la mitad no figuraba.
      // Una vez por mago se manda lo que ya tiene (la base no deja bajar un récord, así que repetir no hace daño).
      const sub = p.subida && p.subida.puntajeTotal || 0;
      if (Ranking.activo() && !p.arcade.torreEnviada && (p.arcade.mejorPuntaje > 0 || sub > 0)) {
        Ranking.enviarTorre({ clave: this.claveNube(), nombre: p.nombre, puntaje: Math.max(p.arcade.mejorPuntaje, sub), piso: p.arcade.mejorPiso, jefes: Math.floor(p.arcade.mejorPiso / 5) });
        p.arcade.torreEnviada = true; Estado.guardar();
      }
    },

    // ============================================================ navegación
    /**
     * Hay una versión nueva instalada. Nunca se recarga delante del jugador: la próxima vez que abre el juego ya arranca
     * con la nueva, y si la app quedó viva en segundo plano, se aplica al volver después de un rato (10 minutos o más),
     * que es cuando igual se espera que arranque de cero. En plena partida, nunca.
     */
    versionNueva() {
      this._versionNueva = true;
      if (this._vigilaVersion) return;
      this._vigilaVersion = true;
      let oculta = 0;
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) { oculta = Date.now(); return; }
        if (this._versionNueva && oculta && Date.now() - oculta > 10 * 60000 && this.pantalla !== 'p-juego') location.reload();
      });
    },

    mostrar(id) {
      document.querySelectorAll('.pantalla').forEach((s) => s.classList.toggle('activa', s.id === id));
      this.pantalla = id;
      if (id === 'p-practica') { this.pintarArchivo(); this.pintarPracticas(); }
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
      this.pintarTabs(id);
      const fondo = FONDOS[id];
      if (fondo && this.lugar !== fondo) this.ponerLugar({ id: fondo });
      else if (!fondo && FONDOS_BOSQUE.includes(id) && this.lugar && Object.values(FONDOS).includes(this.lugar)) this.ponerLugar(null);
      this.pintarVida();
    },

    /**
     * Botón "atrás" de Android (en la app de Play es el del sistema; en el navegador, el de atrás). Sin esto salía
     * de la app desde cualquier pantalla. Se deja una entrada "trampa" en el historial y cada atrás hace lo mismo que
     * la flecha de la pantalla; en el inicio, sale de verdad.
     */
    atras() {
      // Chrome saltea las entradas que se agregan sin que la persona toque nada (y el atrás salía de la app):
      // la trampa se pone (o se repone) recién con un toque o una tecla, que sí cuentan como gesto.
      const poner = () => {
        if (history.state && history.state.ww) return;
        try { history.pushState({ ww: 1 }, ''); } catch (e) { /* nada */ }
      };
      ['click', 'touchend', 'keydown'].forEach((ev) => addEventListener(ev, poner, true));
      addEventListener('popstate', () => {
        if (!this.volver()) history.back();
      });
    },
    /**
     * El juego abierto en dos lados del mismo dispositivo (la app de Play y una pestaña de Chrome comparten los datos):
     * cuando el otro guarda, este se recarga para no pisarlo con lo viejo que tiene en memoria. En plena partida, al terminar.
     */
    otraPestana() {
      addEventListener('storage', (e) => {
        if (e.key !== 'ww.perfiles.v1' || !Estado.perfil) return;
        let otro = null;
        try { otro = (JSON.parse(e.newValue || '{}') || {})[Estado.perfil.nombre]; } catch (er) { return; }
        if (!otro || JSON.stringify(otro) === JSON.stringify(Estado.perfil)) return;   // a este mago no le cambió nada
        // como mucho una recarga por minuto (que dos lados abiertos no se recarguen uno al otro sin parar)
        let ultima = 0; try { ultima = Number(sessionStorage.getItem('ww.recarga')) || 0; } catch (er) { /* nada */ }
        const ya = Date.now() - ultima > 60000 && (document.hidden || !(this.partida && !this.partida.terminada));
        if (!ya) { this._recargar = true; return; }
        try { sessionStorage.setItem('ww.recarga', String(Date.now())); } catch (er) { /* nada */ }
        location.reload();
      });
    },
    /** Hace lo que haría "volver" en la pantalla actual. false = ya estamos en el inicio (salir). */
    volver() {
      const m = $('modal');
      if (m && !m.classList.contains('oculto') && this.cerrarTraje()) return true;
      if (m && !m.classList.contains('oculto')) {
        // un aviso con un solo botón se cierra; si hay que elegir (reintentar o rendirse), atrás no decide por vos
        const caja = $('modal-caja'), bs = caja.querySelectorAll('.fila:last-child .btn');
        const salida = caja.querySelector('.modal-x') || caja.querySelector('.fila:last-child .btn[data-atras]');
        if (bs.length === 1) bs[0].click(); else if (salida) salida.click();
        return true;
      }
      const id = this.pantalla;
      if (id === 'p-juego') { this.pedirSalir(); return true; }
      if (id === 'p-titulo' || id === 'p-menu' || !id) return false;
      const v = document.querySelector('#' + id + ' .btn-volver');
      if (v) v.click(); else this.irMenu();
      return true;
    },

    pintarVida() { if (window.WWVida) WWVida.activar((this.pantalla === 'p-titulo' || this.pantalla === 'p-menu') && !this.lugar); },

    /** La barra de pestañas va en las pantallas principales; en la Torre, solo si no hay una subida en curso. */
    pintarTabs(id) {
      const subida = id === 'p-mapa' && this._torre && this._torre.pa && !this._torre.pa.arcade.cerrada;
      const con = ['p-menu', 'p-practica', 'p-rankings', 'p-mago', 'p-mapa'].includes(id) && !subida;
      $('tabbar').classList.toggle('oculto', !con);
      document.body.classList.toggle('con-tabbar', con);
      document.querySelectorAll('#tabbar [data-tab]').forEach((b) => b.classList.toggle('activa', b.dataset.tab === id));
    },

    verMisiones() {
      this.renderMisiones();
      const copia = $('misiones').cloneNode(true);
      copia.removeAttribute('id'); copia.querySelectorAll('[id]').forEach((e) => e.removeAttribute('id'));
      this.modal('<div class="modal-misiones"></div>', [{ texto: 'Listo', clase: 'btn-primario' }]);
      $('modal-caja').querySelector('.modal-misiones').appendChild(copia);
    },

    irMenu() {
      if (this._recargar) { this._recargar = false; try { sessionStorage.setItem('ww.recarga', String(Date.now())); } catch (e) { /* nada */ } location.reload(); return; }
      this.ponerLugar(null);
      const p = Estado.perfil;
      this.hoy = WW.claveDia();
      if (enCursoAca(p) && p.enCurso.fecha !== this.hoy && !p.diarios[K(p.enCurso.fecha)]) this.cerrarDiarioGuardado(p.enCurso);
      if (this.nivelPendiente) { const n = this.nivelPendiente; this.nivelPendiente = 0; setTimeout(() => this.anunciarNivel(n), 600); }
      this.pintarPerfil();
      this.mostrar('p-menu');
      this.momentosPase();
      this.momentoCuenta();
    },

    verMago() {
      this.ponerLugar(null);
      this.hoy = WW.claveDia();
      this.pintarPerfil();
      this.pintarMagoPanel();
      this.mostrar('p-mago');
    },

    // ------------------------------------------------ Mi mago: Mis cosas · Logros · Números (lab/baul.html, opción A)
    /** Silabo con el traje puesto, en la tarjeta de arriba. */
    pintarMagoTarjeta() {
      const c = $('mago-tarjeta'), p = Estado.perfil; if (!c || !p) return;
      const v = Magos.PALETAS[p.sombrero] || Magos.PALETAS.turquesa;
      c.innerHTML = window.Silabo.mago(Object.assign({}, window.Silabo.OFICIAL, { colores: v.c, adorno: v.adorno, estilo: v.estilo, etapa: Magos.etapaPorNivel(p.nivel) }));
    },
    pintarMagoPanel(tab) {
      const panel = $('mago-panel'), p = Estado.perfil; if (!panel || !p) return;
      this.magoTab = tab || this.magoTab || 'cosas';
      document.querySelectorAll('#mago-pestanas [data-mp]').forEach((b) => b.classList.toggle('on', b.dataset.mp === this.magoTab));
      this.pintarMagoTarjeta();
      if (this.magoTab === 'logros') { panel.innerHTML = `<p class="texto">${this.resumenLogros()}</p><div class="logros-grilla">${this.htmlLogros()}</div>`; return; }
      if (this.magoTab === 'numeros') { panel.innerHTML = `<div class="stats">${this.htmlEstadisticas()}</div>`; return; }
      // Mis cosas: los trajes (tocás y te lo ponés; lo que falta dice cómo se consigue) y las pociones que tenés
      const trajes = Object.entries(Magos.PALETAS).filter(([, v]) => v.nivel < 100 || v.especial);
      const mini = (v) => window.Silabo.mago(Object.assign({}, window.Silabo.OFICIAL, { colores: v.c, adorno: v.adorno, estilo: v.estilo }));
      const POC = [['pista', 'pista', 'Pistas'], ['tiempo', 'arena', 'Relojes'], ['ojo', 'ojo', 'Ojos'], ['escudo', 'escudo', 'Escudos'], ['vela', 'vela', 'Velas']];
      panel.innerHTML = `<h4 class="mis-cosas-cab">Trajes</h4>
        <div class="mis-trajes">${trajes.map(([k, v]) => {
          const tiene = this.tieneTraje(k);
          return `<button class="mi-traje ${tiene ? '' : 'bloq'} ${p.sombrero === k ? 'puesto' : ''}" data-k="${k}"><span class="mini-mago">${mini(v)}</span><b>${esc(v.nombre)}</b>${tiene ? '' : `<small>${v.especial ? v.especial.precio : 'NV ' + v.nivel}</small>`}</button>`;
        }).join('')}</div>
        <p class="mis-cosas-nota" id="mis-cosas-nota">Tocá un traje para ponértelo.</p>
        <h4 class="mis-cosas-cab">Pociones</h4>
        <div class="mis-pociones">${POC.map(([k, ic, n]) => `<span title="${n}">${WWIconos.html(ic)}<b>x${p.inventario[k] || 0}</b></span>`).join('')}</div>
        <button class="btn btn-secundario mis-cosas-tienda" id="mis-cosas-tienda">${WWIconos.html('moneda')} Conseguir más en la tienda</button>`;
      WWIconos.pintar(panel);
      $('mis-cosas-tienda').addEventListener('click', () => { Audio.click(); this.abrirTienda(); });
      panel.querySelectorAll('.mi-traje').forEach((b) => b.addEventListener('click', () => {
        const k = b.dataset.k, v = Magos.PALETAS[k], nota = $('mis-cosas-nota');
        if (this.tieneTraje(k)) {
          if (p.sombrero === k) { Audio.click(); nota.textContent = `Ya tenés puesto ${v.nombre}.`; return; }
          this.ponerTraje(k);
          this.pintarMagoPanel();
          $('mis-cosas-nota').textContent = `¡Te pusiste ${v.nombre}!`;
          return;
        }
        Audio.click();
        nota.innerHTML = `<b>${esc(v.nombre)}</b>: ${v.especial ? 'se consigue en la tienda.' : `llega solo en el nivel ${v.nivel}, o lo adelantás con monedas.`} <a href="#" id="mis-cosas-ver">Ver en la tienda ›</a>`;
        $('mis-cosas-ver').addEventListener('click', (e) => { e.preventDefault(); this.verEnTienda(k); });
      }));
    },
    /** Abre la tienda directo en ese traje (en grande, con su botón de comprar). */
    verEnTienda(k) {
      this.abrirTienda();
      setTimeout(() => {
        const fila = document.querySelector(`#tienda .tienda-item[data-k="${k}"]`);
        if (fila) { fila.scrollIntoView({ block: 'center' }); this.verTraje(k, fila); }
      }, 60);
    },

    /** Datos del mago en el inicio (barra de arriba, botón del desafío) y en Mi mago. */
    pintarPerfil() {
      const p = Estado.perfil;
      $('hud-nombre').textContent = p.nombre;
      const pase = this.tienePase();
      $('hud-titulo').textContent = WW.tituloNivel(p.nivel);
      $('hud-nivel').textContent = p.nivel;
      $('hud-yo').classList.toggle('con-pase', pase);
      document.body.classList.toggle('con-pase', pase);
      this.pintarNube();
      $('hud-monedas').textContent = p.monedas;
      $('menu-nombre').textContent = p.nombre;
      $('menu-titulo').textContent = WW.tituloNivel(p.nivel);
      this.pintarXp('menu-xp-fill', 'menu-xp-txt', p.xp);
      $('menu-monedas').textContent = p.monedas;
      $('menu-racha').textContent = Estado.rachaVigente(this.hoy);
      const nv = p.inventario.vela || 0;
      $('menu-velas').innerHTML = nv ? WWIconos.html('vela') + (nv > 1 ? nv : '') : '';
      $('menu-logros').textContent = `${Object.keys(p.logros).length}/${Logros.LOGROS.length}`;
      const n = WW.numeroDia();
      const jugado = p.diarios[K(this.hoy)];
      const enCurso = enCursoAca(p) && p.enCurso.fecha === this.hoy && !jugado;
      $('btn-diario-titulo').textContent = jugado ? 'Desafío de hoy ✓' : enCurso ? 'Seguir el desafío' : 'Jugar el desafío';
      $('btn-diario').classList.toggle('hecho', !!jugado);
      $('btn-diario-sub').textContent = jugado ? `#${n} · ${jugado.rango} · ${jugado.puntos} pts` : enCurso ? `#${n} · en curso, ¡volvé rápido!` : `Desafío #${n} · 3 minutos`;
      $('btn-diario-estado').textContent = enCurso ? 'EN CURSO' : '';
      this.renderMisiones();
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
      // iOS solo deja arrancar el audio en touchend/click (no en pointerdown) y lo vuelve a frenar tras una llamada o
      // el bloqueo: se escucha en cada toque hasta que el contexto corre, y otra vez si se interrumpe
      const destrabar = () => { if (Audio.necesitaToque()) Audio.despertar(); };
      for (const ev of ['touchend', 'click', 'keydown']) document.addEventListener(ev, destrabar, { passive: true, capture: true });

      $('form-nombre').addEventListener('submit', (e) => {
        e.preventDefault();
        const n = $('input-nombre').value.trim();
        if (!n || Object.keys(Estado.todos()).length) return;   // un solo mago por dispositivo
        Audio.despertar(); Audio.click();
        $('input-nombre').value = '';
        this.entrar(n);
      });

      $('btn-diario').addEventListener('click', () => { Audio.click(); this.jugarDiario(); });
      $('btn-arcade').addEventListener('click', () => { Audio.click(); this.entrarTorre(); });
      $('mapa-jugar').addEventListener('click', () => {
        const t = this._torre; if (!t || $('mapa-jugar').disabled) return;
        Audio.click();
        if (t.pa) this.nuevaPartida('arcade', { piso: t.sig, continuar: true, usadas: t.pa.arcade.usadas });
        else this.nuevaPartida('arcade');
      });
      $('mapa-tienda').addEventListener('click', () => { Audio.click(); this.abrirTienda(); });
      this.abrirTienda = () => {
        this.modal(`<h3>TIENDA</h3><p class="tienda-saldo">TENÉS ${Estado.perfil.monedas} ${WWIconos.html('moneda')}</p><div class="tienda" id="tienda"></div>`, [{ texto: 'Listo', clase: 'btn-primario', accion: () => { this.pintarPerfil(); if (this.pantalla === 'p-mago') this.pintarMagoPanel(); } }]);
        this.renderTienda();
      };
      $('mapa-salir').addEventListener('click', () => {
        Audio.click();
        const t = this._torre;
        if (!t || !t.pa || t.pa.arcade.cerrada) return this.irMenu();
        this.modal(`<h3>¿BAJAR DE LA TORRE?</h3><p>Tu subida queda guardada en el piso ${t.pa.arcade.piso}: la seguís cuando quieras.</p>`, [
          { texto: 'Guardar y salir', clase: 'btn-primario', accion: () => { this.guardarSubida(t.pa.arcade); this.irMenu(); } },
          { texto: 'Seguir subiendo', clase: 'btn-secundario' },
          { texto: 'Terminar la subida', clase: 'btn-peligro', accion: () => this.cerrarArcade(t.pa) },
        ]);
      });
      $('btn-practica').addEventListener('click', () => { Audio.click(); this.mostrar('p-practica'); });
      // el reloj de Práctica se recuerda (apagado = sin fin)
      const ponerReloj = (on) => {
        $('practica-reloj').checked = on;
        document.querySelectorAll('.modo-op').forEach((b) => { const sel = (b.dataset.reloj === '1') === on; b.classList.toggle('sel', sel); b.setAttribute('aria-checked', sel); });
      };
      try { ponerReloj(localStorage.getItem('ww.practica.reloj') === '1'); } catch (e) { /* sin almacenamiento */ }
      document.querySelectorAll('.modo-op').forEach((b) => b.addEventListener('click', () => {
        Audio.click(); const on = b.dataset.reloj === '1'; ponerReloj(on);
        try { localStorage.setItem('ww.practica.reloj', on ? '1' : '0'); } catch (e) { /* sin almacenamiento */ }
      }));
      $('btn-rankings').addEventListener('click', () => { Audio.click(); this.verRankings(this.rankTab || 'hoy'); });
      $('btn-stats').addEventListener('click', () => { Audio.click(); this.verEstadisticas(); });
      $('btn-logros').addEventListener('click', () => { Audio.click(); this.verLogros(); });
      document.querySelectorAll('#mago-pestanas [data-mp]').forEach((b) => b.addEventListener('click', () => { Audio.click(); this.pintarMagoPanel(b.dataset.mp); }));
      $('btn-ayuda').addEventListener('click', () => { Audio.click(); this.tutorial(); });
      $('btn-ajustes').addEventListener('click', () => { Audio.click(); this.verAjustes(); });
      $('btn-instalar').addEventListener('click', () => this.instalar());
      for (const id of ['btn-musica-menu', 'btn-musica-juego']) $(id).addEventListener('click', () => this.alternarMusica());
      $('btn-comentario').addEventListener('click', () => { Audio.click(); this.comentario(); });
      $('chip-racha').addEventListener('click', () => { Audio.click(); this.verVela(); });
      if (typeof Audio.vigilarVisibilidad === "function") Audio.vigilarVisibilidad();
      $('aj-instalar').addEventListener('click', () => this.instalar());
      $('aj-invitar').addEventListener('click', () => { Audio.click(); this.invitar(); });
      document.querySelectorAll('.btn-volver').forEach((b) => b.addEventListener('click', () => { Audio.click(); if (b.dataset.volver === 'p-mago') this.verMago(); else this.irMenu(); }));
      $('tab-inicio').addEventListener('click', () => { Audio.click(); this.irMenu(); });
      $('tab-mago').addEventListener('click', () => { Audio.click(); this.verMago(); });
      $('hud-yo').addEventListener('click', () => { Audio.click(); this.verMago(); });
      $('btn-misiones').addEventListener('click', () => { Audio.click(); this.verMisiones(); });
      $('btn-tienda').addEventListener('click', () => { Audio.click(); this.abrirTienda(); });

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
        if (e.target.closest('.borrar-todo')) { this.borrarTodo(); return; }
        const l = e.target.closest('.letra-actual');
        if (l) this.quitarLetra(Number(l.dataset.pos));
      });
      // Borrar: un toque saca la última letra; mantenerlo apretado las saca todas (también la ✕ de la palabra)
      let tBorrar = null, largo = false;
      const soltar = () => { clearTimeout(tBorrar); tBorrar = null; };
      $('btn-borrar').addEventListener('pointerdown', () => { largo = false; soltar(); tBorrar = setTimeout(() => { largo = true; this.borrarTodo(); }, 450); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => $('btn-borrar').addEventListener(ev, soltar));
      $('btn-borrar').addEventListener('click', () => { if (largo) { largo = false; return; } this.quitarLetra(); });
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
        else if (r.modo === 'archivo') { this.ponerLugar({ id: FONDOS['p-practica'] }); this.mostrar('p-practica'); }
        else this.irMenu();
      });
      $('btn-res-menu').addEventListener('click', () => { Audio.click(); this.irMenu(); });

      // rankings
      document.querySelectorAll('#tabs-ranking .tab').forEach((t) => t.addEventListener('click', () => { Audio.click(); this.verRankings(t.dataset.tab); }));

      // ajustes
      // el selector aparece cuando hay más de un idioma listo
      $('aj-idioma').closest('.idioma-fila').classList.toggle('oculto', window.WWI18n.disponibles.length < 2);
      $('aj-idioma').querySelectorAll('option').forEach((o) => { o.hidden = !window.WWI18n.disponibles.includes(o.value); });
      $('aj-idioma').value = window.WWI18n.idioma;
      // privacidad y términos en el idioma del juego
      const PAGINAS = { en: ['privacy.html', 'terms.html'], pt: ['privacidade.html', 'termos.html'] }[window.WWI18n.idioma];
      if (PAGINAS) document.querySelectorAll('#p-ajustes a[href="privacidad.html"], #p-ajustes a[href="terminos.html"]').forEach((a) => { a.href = a.getAttribute('href') === 'privacidad.html' ? PAGINAS[0] : PAGINAS[1]; });
      $('aj-idioma').addEventListener('change', (e) => { Audio.click(); Estado.guardar(); window.WWI18n.cambiar(e.target.value); });
      $('aj-recordatorio').addEventListener('change', (e) => { Audio.click(); this.cambiarRecordatorio(e.target.value === '' ? null : Number(e.target.value)); });
      $('aj-sonido').addEventListener('change', (e) => { Estado.perfil.ajustes.sonido = e.target.checked; Audio.setSonido(e.target.checked); Estado.guardar(); Audio.click(); });
      $('aj-musica').addEventListener('change', (e) => { Estado.perfil.ajustes.musica = e.target.checked; Audio.setMusica(e.target.checked); Estado.guardar(); this.pintarMusica(); });
      $('aj-letra').addEventListener('change', (e) => { Audio.click(); Letra.guardar(Number(e.target.value)); });
      $('aj-vibracion').addEventListener('change', (e) => { Estado.perfil.ajustes.vibracion = e.target.checked; Estado.guardar(); });
      $('aj-grilla').addEventListener('change', (e) => { Estado.perfil.ajustes.grilla = e.target.checked; Estado.guardar(); });
      $('aj-nombre').addEventListener('click', () => this.cambiarNombre());
      $('aj-tutorial').addEventListener('click', () => { Audio.click(); this.tutorial(); });
      $('aj-exportar').addEventListener('click', () => this.exportar());
      $('aj-borrar').addEventListener('click', () => {
        if (this.tieneCuenta()) return this.borrarCuenta();
        this.modal(`<h3>¿BORRAR A ${esc(Estado.perfil.nombre).toUpperCase()}?</h3><p>Se pierde todo el progreso de este mago en este dispositivo${Ranking.activo() ? ' y sus resultados en el ranking mundial' : ''}.</p>`, [
          { texto: 'Cancelar', clase: 'btn-secundario' },
          { texto: 'Borrar', clase: 'btn-peligro', accion: () => { if (Ranking.activo()) Ranking.borrar(this.claveNube()); Estado.borrar(Estado.perfil.nombre); this.renderPerfiles(); this.mostrar('p-titulo'); } },
        ]);
      });
      $('btn-cuenta-entrar').addEventListener('click', () => { Audio.despertar(); this.entrarCuenta(null); });

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
        d.className = 'mision' + (x.hecha ? ' hecha' : '') + (x.temporada ? ' de-temporada' : '');
        const pct = Math.min(100, (x.progreso / x.meta) * 100);
        d.innerHTML = `<span class="mision-icono">${iconoMision(x)}</span><div class="mision-info">${x.temporada ? '<small class="mision-tag">De temporada · +1 flor</small>' : ''}<span class="mision-texto">${esc(x.texto)}</span><div class="mision-barra"><div style="width:${pct}%"></div></div></div><span class="mision-n">${x.hecha ? '✓' : `${Math.min(x.progreso, x.meta)}/${x.meta}`}</span>`;
        cont.appendChild(d);
      }
      const comunes = m.lista.filter((x) => !x.temporada), hechas = comunes.filter((x) => x.hecha).length;
      $('misiones-puntos').innerHTML = m.lista.map((x) => `<i class="${x.hecha ? 'ok' : ''}${x.temporada ? ' flor' : ''}"></i>`).join('');
      $('misiones-estado').innerHTML = hechas === comunes.length ? '¡TODAS!' : `${hechas}/${comunes.length} · ${WWIconos.html('moneda')}${WW.RECOMPENSA_MISION.monedas} c/u`;
      const t = WW.temporadaDe(new Date()), pie = $('misiones-temporada');
      if (pie) {
        pie.classList.toggle('oculto', !t);
        if (t) {
          const f = this.floresTemporada(), dias = Math.max(0, Math.round((new Date(t.hasta + 'T12:00:00') - new Date(this.hoy + 'T12:00:00')) / 864e5));
          pie.innerHTML = `<b>${esc(t.nombre)}</b><div class="mision-barra"><div style="width:${Math.min(100, f / t.flores * 100)}%"></div></div><small>${f >= t.flores ? '¡Completaste la primavera!' : `${f}/${t.flores} flores · ${dias === 0 ? 'último día' : dias === 1 ? 'queda 1 día' : `quedan ${dias} días`}`}</small>`;
        }
      }
      Estado.guardar();
    },

    floresTemporada() {
      const t = WW.temporadaDe(new Date()), p = Estado.perfil;
      return t && p.temporadas && p.temporadas[t.id] ? p.temporadas[t.id].flores || 0 : 0;
    },
    /** Misión de temporada cumplida: una flor; con todas, el premio (una sola vez). */
    sumarFlor() {
      const t = WW.temporadaDe(new Date()), p = Estado.perfil;
      if (!t) return;
      const reg = (p.temporadas = p.temporadas || {})[t.id] = p.temporadas[t.id] || { flores: 0, premio: false };
      reg.flores += 1;
      setTimeout(() => { Audio.mision(); this.toast(`<span>${FLOR}</span><div><b>Flor de ceibo</b><br><small>${reg.flores}/${t.flores} de la ${esc(t.nombre)}</small></div>`, 'logro'); }, 400);
      if (reg.flores >= t.flores && !reg.premio) {
        reg.premio = true;
        Estado.sumarMonedas(t.premio);
        setTimeout(() => this.toast(`<span>${FLOR}</span><div><b>¡Completaste la primavera!</b><br><small>+${t.premio} ${WWIconos.html('moneda')}</small></div>`, 'logro'), 1800);
      }
    },

    /** Registra progreso de misiones. `valor` suma, o es el máximo alcanzado si la misión es de tipo máximo. */
    mision(evento, valor) {
      const p = Estado.perfil;
      const m = Estado.misionesHoy(this.hoy);
      let cambio = false;
      for (const x of m.lista) {
        if (x.hecha || x.evento !== evento) continue;
        x.progreso = x.maximo ? Math.max(x.progreso, valor) : x.progreso + (valor || 1);
        if (x.progreso >= x.meta && x.temporada) {
          x.hecha = true; cambio = true;
          this.sumarFlor();
        } else if (x.progreso >= x.meta) {
          x.hecha = true; cambio = true;
          p.stats.misiones = (p.stats.misiones || 0) + 1;
          Estado.sumarMonedas(WW.RECOMPENSA_MISION.monedas);
          Estado.sumarXp(WW.RECOMPENSA_MISION.xp);
          setTimeout(() => { Audio.mision(); this.toast(`<span>${iconoMision(x)}</span><div><b>Misión cumplida</b><br><small>${esc(x.texto)} · +${WW.RECOMPENSA_MISION.monedas} ${WWIconos.html('moneda')} +${WW.RECOMPENSA_MISION.xp} XP</small></div>`, 'logro'); }, 400);
        }
      }
      if (cambio && !m.bonus && m.lista.filter((x) => !x.temporada).every((x) => x.hecha)) {
        m.bonus = true;
        Estado.sumarMonedas(WW.BONUS_TODAS_MISIONES);
        setTimeout(() => this.toast(`<span>🎉</span><div><b>¡Las tres misiones!</b><br><small>Bonus +${WW.BONUS_TODAS_MISIONES} ${WWIconos.html('moneda')}</small></div>`, 'logro'), 1500);
      }
      if (cambio) { this.anunciarLogros(Logros.evaluar(p, { tipo: 'mision' })); Estado.guardar(); }
    },

    // ============================================================ diario en curso (reanudar o cerrar)
    revisarEnCurso() {
      const p = Estado.perfil;
      const c = enCursoAca(p);
      if (!c) return;
      if (p.diarios[K(c.fecha)]) { p.enCurso = null; Estado.guardar(); return; }
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
      const nucleo = this.dic.nucleo(this.dic.derivables(c.base), c.base);
      const totalPuntos = this.dic.totalPosible(nucleo, c.base);
      const fams = new Set();
      const base = c.encontradas.reduce((t, w) => t + this.dic.puntos(w, c.base, fams), 0);
      const pct = totalPuntos ? (base / totalPuntos) * 100 : 0;
      const rango = WW.rangoPorPct(pct);
      p.diarios[K(c.fecha)] = { numero: c.numero, palabra: c.base, puntos: c.puntos, pct: Math.round(pct * 10) / 10, rango: rango.nombre, encontradas: c.encontradas.slice(), total: nucleo.size, totalPuntos, combo: c.combo || 0, fecha: c.fecha };
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
      p.enCurso = { fecha: this.hoy, idioma: IDIOMA_DATOS, base: pa.base, numero: pa.numero, encontradas: pa.encontradas.slice(), deadline: pa.deadline, puntos: pa.puntos, combo: pa.mejorCombo };
      Estado.guardar();
    },

    // ============================================================ partidas
    jugarDiario() {
      const p = Estado.perfil;
      this.hoy = WW.claveDia();
      const hecho = p.diarios[K(this.hoy)];
      if (hecho) { this.mostrarResultadoGuardado(hecho); return; }
      if (enCursoAca(p) && p.enCurso.fecha !== this.hoy && !p.diarios[K(p.enCurso.fecha)]) this.cerrarDiarioGuardado(p.enCurso);
      if (enCursoAca(p) && p.enCurso.fecha === this.hoy) {
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
      if (modo === 'archivo') {
        const { numero, desafio } = WW.palabraDelDia(this.pool, opts.fecha);
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
      if (modo === 'practica' && !opts.tutorial) {
        if (this.practicasQuedan() <= 0) { this.mostrar('p-practica'); return this.avisoPracticas(); }
        this.practicasHoy().n += 1; Estado.guardar();
      }
      if (this.partida && this.partida.timer) clearInterval(this.partida.timer);
      const piso = modo === 'arcade' ? (opts.piso || 1) : 0;
      const jefe = modo === 'arcade' && WW.esPisoJefe(piso);
      let base, numero, ref;
      if (opts.reanudar) { base = opts.reanudar.base; numero = opts.reanudar.numero; }
      else ({ base, numero, ref } = this.elegirBase(modo, Object.assign({}, opts, { piso, jefe })));
      const derivables = this.dic.derivables(base);
      const nucleo = this.dic.nucleo(derivables, base);   // las extra valen, pero no se exigen
      const totalPuntos = this.dic.totalPosible(nucleo, base);
      const fichas = base.split('').map((l) => ({ l, usada: false }));
      let tiempo = null;
      if (modo === 'diario' || modo === 'archivo') tiempo = CONFIG.diario.tiempo;
      else if (modo === 'arcade') tiempo = jefe ? CONFIG.arcade.tiempoJefe : CONFIG.arcade.tiempo;
      else if (opts.reloj) tiempo = CONFIG.practica.tiempo;

      const anterior = this.partida && this.partida.modo === 'arcade' && modo === 'arcade' && opts.continuar ? this.partida.arcade : null;
      let objetivo = 0;
      if (modo === 'arcade') {
        // el objetivo sale del total típico del tramo, no del de la palabra que tocó
        // crece más despacio y con techo: más arriba la dificultad la ponen las palabras (docs/ECONOMIA.md)
        objetivo = Math.round((ref || totalPuntos) * Math.min(0.27, 0.085 + 0.0095 * piso));
        if (jefe) objetivo += 8;
        objetivo = Math.max(12, Math.min(Math.round(totalPuntos * 0.5), objetivo));
      }

      this.partida = {
        modo, opts, base, numero, derivables, nucleo, total: nucleo.size, nEnc: 0, extras: 0, totalPuntos,
        fichas, orden: WW.mezclar(fichas.map((_, i) => i)), seleccion: [],
        encontradas: [], encontradasSet: new Set(), familias: new Set(), puntos: 0, puntosBase: 0, puntosPiso: 0,
        combo: 0, mejorCombo: 0, ultimoAcierto: 0,
        tiempoTotal: tiempo, deadline: tiempo ? Date.now() + tiempo * 1000 : null, restante: tiempo, timer: null,
        inicio: Date.now(), terminada: false, pistas: [], ojos: new Set(), escudo: false,
        rangoIdx: 0, monedasGanadas: 0, mejorPalabra: '',
        arcade: modo === 'arcade' ? (anterior || { piso: 1, vidas: CONFIG.arcade.vidas, puntajeTotal: 0, palabrasTotal: 0, usadas: [], monedas: 0, jefes: 0 }) : null,
        objetivo, jefe, nombreJefe: jefe ? WW.nombreJefe(piso) : '',
      };
      const pa = this.partida;
      if (pa.arcade) { pa.arcade.piso = piso; pa.arcade.usadas.push(base); this.guardarSubida(pa.arcade, piso); }
      const lugar = modo === 'arcade' ? WW_LUGARES.dePiso(piso) : modo === 'practica' || modo === 'archivo' ? { id: FONDOS['p-practica'] } : null;
      const lugarNuevo = lugar && (piso === 1 || WW_LUGARES.dePiso(piso - 1).id !== lugar.id) && !opts.reintento;
      this.ponerLugar(lugar);
      if (lugarNuevo && !jefe && modo === 'arcade') setTimeout(() => this.banner(lugar.icono, lugar.nombre, 'Pisos ' + lugar.rango), 250);
      this.magos.jefe.setEtapa(2);
      if (opts.reanudar) {
        const r = opts.reanudar;
        pa.deadline = r.deadline; pa.restante = Math.ceil((r.deadline - Date.now()) / 1000);
        for (const w of r.encontradas) { pa.encontradas.push(w); pa.encontradasSet.add(w); pa.puntosBase += this.dic.puntos(w, base, pa.familias); if (nucleo.has(w)) pa.nEnc++; else pa.extras++; }
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
        this.globo(modo === 'arcade' ? `Piso ${piso}: llegá a ${objetivo} pts` : modo === 'diario' ? (opts.reanudar ? '¡Seguimos! Dale que queda poco' : `Desafío #${numero}. ¡Suerte!`) : modo === 'archivo' ? `Desafío #${numero} del archivo. ¡Suerte!` : 'Sin apuro. ¡A buscar!');
        this.magos.juego.animar('happy', 600);
      }
      if (modo === 'arcade' && piso === 1) this.mision('piso', 1);
      if (modo === 'diario') this.guardarEnCurso();
      if (tiempo) pa.timer = setInterval(() => this.tic(), 250);
      this.tic();
    },

    renderJuego() {
      const pa = this.partida, p = Estado.perfil;
      $('hud-modo').textContent = pa.modo === 'diario' ? `DESAFÍO #${pa.numero}` : pa.modo === 'archivo' ? `ARCHIVO #${pa.numero}` : pa.modo === 'arcade' ? (pa.jefe ? `JEFE · PISO ${pa.arcade.piso}` : `TORRE · PISO ${pa.arcade.piso}`) : 'PRÁCTICA';
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
      const bt = $('btn-terminar'); bt.textContent = 'Terminar'; bt.classList.remove('btn-subir'); bt.classList.toggle('oculto', pa.modo === 'arcade');
      $('mago-jefe').classList.remove('vencido');
      const marcas = $('barra-marcas');
      marcas.innerHTML = '';
      if (pa.modo !== 'arcade') for (const r of WW.RANGOS) { if (r.pct > 0 && r.pct < 100) { const i = document.createElement('i'); i.style.left = r.pct + '%'; marcas.appendChild(i); } }
      this.magos.juego.setPaleta(p.sombrero);
    },

    renderFichas() {
      const pa = this.partida, cont = $('fichas');
      cont.innerHTML = '';
      // dos filas de fichas grandes (7 → 4 + 3, 8 → 4 + 4, 9 → 5 + 4): para dedos de verdad (lab/controles.html)
      const n = pa.orden.length;
      cont.style.setProperty('--cols', n > 5 ? Math.ceil(n / 2) : n);
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
      if (!pa.seleccion.length) { cont.innerHTML = `<span class="placeholder">${T('Tocá las letras o escribí')}</span>`; return; }
      pa.seleccion.forEach((idx, pos) => {
        const s = document.createElement('span');
        s.className = 'letra-actual'; s.dataset.pos = pos; s.textContent = pa.fichas[idx].l.toUpperCase();
        cont.appendChild(s);
      });
      if (pa.seleccion.length >= 2) cont.insertAdjacentHTML('beforeend', `<button class="borrar-todo" type="button" aria-label="${T('Borrar todo')}" title="${T('Borrar todo')}">✕</button>`);
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
        c.className = 'chip-palabra' + (w === pa.base ? ' completa' : !pa.nucleo.has(w) ? ' extra' : w.length >= 6 ? ' larga' : '') + (pa.ojos.has(w) ? ' ojo' : '') + (w === this._ultimaNueva ? ' nueva' : '');
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
      for (const w of pa.nucleo) tot[w.length] = (tot[w.length] || 0) + 1;
      for (const w of pa.encontradas) if (pa.nucleo.has(w)) enc[w.length] = (enc[w.length] || 0) + 1;
      cont.innerHTML = Object.keys(tot).map(Number).sort((a, b) => a - b).map((L) => {
        const e = enc[L] || 0, t = tot[L];
        return `<span class="${e >= t ? 'lista' : ''}">${L}: <b>${e}</b>/${t}</span>`;
      }).join('') + (pa.extras ? `<span class="grilla-extra">+${pa.extras} extra</span>` : '');
    },

    renderProgreso() {
      const pa = this.partida;
      if (pa.modo === 'arcade') {
        $('barra-rango').classList.toggle('extra', !!pa.superado);
        if (pa.superado) {
          $('barra-rango').classList.remove('hp');
          $('barra-rango-fill').style.width = '100%';
          $('rango-icono').textContent = '⭐';
          $('rango-nombre').textContent = 'PUNTOS EXTRA';
          $('progreso-txt').textContent = '+' + (pa.puntosPiso - pa.objetivo);
          return;
        }
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
      $('progreso-txt').textContent = `${pa.nEnc}/${pa.total}`;
    },

    renderPoderes() {
      const pa = this.partida, p = Estado.perfil;
      for (const b of $('poderes').querySelectorAll('.poder')) {
        const k = b.dataset.poder;
        const n = $(`poder-${k}-n`);
        let hab = true, txt = '';
        if (pa.modo === 'diario' || pa.modo === 'archivo') { hab = false; txt = '—'; }
        else if (pa.modo === 'practica') {
          if (k === 'pista' || k === 'ojo') txt = 'LIBRE';
          else { hab = false; txt = '—'; }
          if (k === 'tiempo' && pa.tiempoTotal) { hab = true; txt = 'LIBRE'; }
        } else {
          const inv = p.inventario[k] || 0;
          txt = inv > 0 ? `x${inv}` : `${WWIconos.html('moneda')}${CONFIG.precios[k]}`;
          hab = inv > 0 || p.monedas >= CONFIG.precios[k];
          if (k === 'escudo' && pa.escudo) { txt = 'ON'; hab = false; }
          else if (((pa.usados && pa.usados[k]) || 0) >= CONFIG.limites[k]) { txt = 'USADO'; hab = false; }
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
      // con el objetivo de la Torre cumplido, los últimos segundos son de festejo, no de apuro
      const apuro = seg <= 10 && seg > 0 && !pa.superado;
      $('hud-tiempo').classList.toggle('urgente', apuro);
      Audio.setTempo(apuro); this.magos.juego.nervioso(apuro);
      const roja = apuro;
      if (roja !== !!pa.vinetaRoja) { pa.vinetaRoja = roja; this.vineta(roja ? 'roja' : ''); }
      const fill = $('barra-tiempo-fill');
      fill.style.width = (rest / pa.tiempoTotal * 100) + '%';
      fill.classList.toggle('urgente', apuro);
      if (rest <= 0) { if (pa.superado) this.pisoSuperado('tiempo'); else this.terminar('tiempo'); }
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

    /** Saca todas las letras de la palabra que se está armando (pedido de los testers, 14/10). */
    borrarTodo() {
      const pa = this.partida;
      if (!pa || pa.terminada || pa.bloqueo || !pa.seleccion.length) return;
      Audio.click();
      this.limpiarSeleccion();
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
      else this.fallo(r.codigo, r.palabra);
    },

    /** La primera vez que un plural o una conjugación vale la mitad, Silabo lo explica (una sola vez por mago). */
    avisoFamilia(w) {
      const p = Estado.perfil;
      if (!p || (p.vistos && p.vistos.familia)) return;
      p.vistos = Object.assign({}, p.vistos, { familia: true }); Estado.guardar();
      setTimeout(() => this.globo('Plurales y conjugaciones de una palabra que ya tenés valen la mitad', 'wow'), 700);
    },

    acierto(w, revelada) {
      const pa = this.partida, p = Estado.perfil;
      const ahora = Date.now();
      const entera = WW.puntosPalabra(w, pa.base);
      const base = this.dic.puntos(w, pa.base, pa.familias);
      if (base < entera) this.avisoFamilia(w);
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
      const extra = !pa.nucleo.has(w);
      if (extra) pa.extras++; else pa.nEnc++;
      if (revelada) pa.ojos.add(w);
      if (!pa.mejorPalabra || base > WW.puntosPalabra(pa.mejorPalabra, pa.base)) pa.mejorPalabra = w;

      this._ayudaNovato = false;
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
      if (pa.jefe && !pa.superado) {
        this.magos.juego.animar('cast', 700);
        this.rayo(this.magos.juego.puntaVarita(), this.centro($('mago-jefe')), colorRayo, () => {
          Audio.golpe(); this.sacudir(w.length >= 6); this.vineta('flash-rojo'); this.magos.jefe.animar('sad', 700);
          this.particulas($('mago-jefe'), colorRayo, 12);
        });
        this.globo(`${azar(MENSAJES.jefeGolpe)} −${pts} HP`, w.length >= 6 ? 'wow' : 'ok');
      } else if (w === pa.base) { Audio.completa(); this.vineta('flash-oro'); this.banner('💎', 'PALABRA COMPLETA', '+' + pts + ' puntos', 'oro'); this.globo('¡PALABRA COMPLETA! +' + pts, 'wow'); this.magos.juego.animar('happy', 1200); }
      else if (extra && !revelada) { Audio.acierto(w.length); this.globo(`${T('¡Palabra extra!')} +${pts}`, 'wow'); this.magos.juego.animar('cast', 900); }
      else if (w.length >= 6) { Audio.acierto(w.length); this.globo(`${azar(MENSAJES.largo)} +${pts}`, 'wow'); this.magos.juego.animar('cast', 900); }
      else { Audio.acierto(w.length); this.globo(`${azar(MENSAJES.ok)} +${pts}`, 'ok'); this.magos.juego.animar('cast', 600); }
      if (pa.combo >= 3 && !revelada) {
        const c = $('combo'); c.textContent = `COMBO x${pa.combo}` + (mult > 1 ? ` · ×${String(mult).replace('.', ',')}` : ''); c.classList.toggle('fuego', pa.combo >= 5);
        c.classList.remove('pum'); void c.offsetWidth; c.classList.add('pum'); Audio.combo(pa.combo);
      }
      this.flotante(`+${pts}`);
      if (!pa.jefe || pa.superado) setTimeout(() => this.rayo(this.magos.juego.puntaVarita(), this.centro($('hud-puntos')), colorRayo, () => this.particulas($('hud-puntos'), colorRayo, 6)), 90);

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

      // Torre: al llegar al objetivo no se corta; el reloj sigue y lo que venga suma como extra
      if (pa.modo === 'arcade' && !pa.superado && pa.puntosPiso >= pa.objetivo) this.objetivoLogrado();
      if (pa.nEnc >= pa.total) { this.congelarReloj(pa); setTimeout(() => (pa.modo === 'arcade' ? this.pisoSuperado('completa') : this.terminar('completo')), 900); }
    },

    fallo(codigo, palabra) {
      const pa = this.partida, p = Estado.perfil;
      if (codigo === 'desconocida' && palabra) this.ofrecerAvisoPalabra(palabra);
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

    /**
     * Una palabra que el juego no conoce: un aviso chiquito para mandarla a revisar (llega a la base como comentario).
     * Solo de 4 letras o más, una vez por palabra y como mucho 3 avisos por partida, para no molestar.
     */
    ofrecerAvisoPalabra(w) {
      const pa = this.partida;
      if (!pa || w.length < 4 || !window.WWReportes) return;
      pa.avisadas = pa.avisadas || new Set();
      if (pa.avisadas.has(w) || pa.avisadas.size >= 3) return;
      pa.avisadas.add(w);
      this.toast(`¿${esc(w.toUpperCase())} existe? Tocá y la revisamos`, 'accion', () => {
        WWReportes.comentario('Palabra que falta: ' + w, { palabra: w, base: pa.base, modo: pa.modo, idioma: (window.WWI18n && WWI18n.idioma) || 'es' });
        this.toast('¡Gracias! La vamos a revisar 🙌');
      });
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
      if (accion) { t.addEventListener('click', () => { t.remove(); accion(); }); t.style.animationDuration = '12s'; }
      const cont = $('toasts');
      while (cont.children.length >= 3) cont.firstChild.remove();
      cont.appendChild(t);
      setTimeout(() => t.remove(), accion ? 12100 : 3100);
    },

    anunciarLogros(nuevos) {
      if (!nuevos || !nuevos.length) return;
      nuevos.forEach((l, i) => setTimeout(() => { Audio.logro(); this.toast(`<span class="toast-logro">${iconoLogro(l)}</span><div><b>Logro: ${l.nombre}</b><br><small>${l.desc}</small></div>`, 'logro'); }, 600 + i * 900));
      Estado.sumarMonedas(5 * nuevos.length); Estado.guardar();
    },

    // ------------------------------------------------------------ poderes
    usarPoder(k) {
      const pa = this.partida, p = Estado.perfil;
      if (!pa || pa.terminada || pa.modo === 'diario' || pa.modo === 'archivo') return;
      if (pa.modo === 'arcade') {
        if (k === 'escudo' && pa.escudo) return;
        pa.usados = pa.usados || {};
        if ((pa.usados[k] || 0) >= CONFIG.limites[k]) { this.globo(k === 'pista' ? 'Ya usaste las 2 pistas de este piso' : 'Ese poder ya lo usaste en este piso', 'mal'); return; }
        if ((p.inventario[k] || 0) > 0) p.inventario[k] -= 1;
        else if (p.monedas >= CONFIG.precios[k]) { Estado.sumarMonedas(-CONFIG.precios[k]); Audio.moneda(); }
        else { this.globo('Te faltan monedas', 'mal'); return; }
      }
      if (pa.modo === 'arcade') pa.usados[k] = (pa.usados[k] || 0) + 1;
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
      return Array.from(pa.nucleo).filter((w) => !pa.encontradasSet.has(w));
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
      if (pa.superado) return this.pisoSuperado('subir');
      const aviso = pa.modo === 'diario' ? 'El reloj sigue corriendo aunque salgas. Podés volver desde el menú si queda tiempo.' : pa.modo === 'archivo' ? 'Si salís, este desafío del archivo no se guarda.' : pa.modo === 'arcade' ? 'Tu subida queda guardada, pero este piso cuenta como intento: perdés una vida (si es la última, te la guardo).' : 'La práctica no se guarda.';
      this.modal(`<h3>¿SALIR?</h3><p>${aviso}</p>`, [
        { texto: 'Seguir jugando', clase: 'btn-secundario' },
        { texto: 'Salir', clase: 'btn-peligro', accion: () => { if (pa.modo === 'practica' || pa.modo === 'archivo') this.abandonarPractica(); else if (pa.modo === 'diario') this.salirDiario(); else this.dejarPiso(pa); } },
      ]);
    },

    salirDiario() {
      const pa = this.partida;
      if (!pa || pa.terminada) return;   // el reloj llegó a cero con el "¿Salir?" abierto: ya se terminó
      this.guardarEnCurso();
      pa.terminada = true; clearInterval(pa.timer);
      if (window.WWMetricas) WWMetricas.marcar(WW.claveDia(), CONFIG.version, { arcade: 'torre' }[pa.modo] || pa.modo);
      this.limpiarEfectos();
      this.irMenu();
    },

    pedirTerminar() {
      const pa = this.partida;
      if (!pa || pa.terminada) return;
      if (pa.superado) return this.pisoSuperado('subir');
      if (pa.modo === 'practica') return this.terminar('manual');
      this.modal(`<h3>¿TERMINAR AHORA?</h3><p>Se cierra con ${pa.puntos} puntos y ${pa.encontradas.length} palabras.</p>`, [
        { texto: 'Seguir', clase: 'btn-secundario' },
        { texto: 'Terminar', clase: 'btn-primario', accion: () => this.terminar('manual') },
      ]);
    },

    abandonarPractica() {
      const pa = this.partida;
      if (!pa || pa.terminada) return;
      pa.terminada = true; clearInterval(pa.timer);
      this.limpiarEfectos();
      Estado.guardar();
      this.irMenu();
    },

    /**
     * Medición del ritmo de progreso: por día, minutos jugados, partidas, nivel, monedas y piso máximo.
     * Queda en el perfil (últimos 120 días) y se ve en Estadísticas → "Tu ritmo"; los testers lo pueden mandar en una captura.
     */
    anotarTiempo(pa) {
      const p = Estado.perfil, seg = Math.round((Date.now() - pa.inicio) / 1000);
      p.stats.segundos = (p.stats.segundos || 0) + seg;
      const reg = p.registro || (p.registro = {});
      const d = reg[this.hoy] || (reg[this.hoy] = { seg: 0, partidas: 0, piso: 0 });
      d.seg += seg; d.partidas += 1; d.nivel = p.nivel; d.monedas = p.monedas;
      if (pa.arcade) d.piso = Math.max(d.piso, pa.arcade.piso);
      const ks = Object.keys(reg).sort();
      while (ks.length > 120) delete reg[ks.shift()];
    },

    /**
     * Archivo de desafíos (en Práctica): los días anteriores, del más nuevo al más viejo.
     * Los últimos CONFIG.archivoGratis son gratis; los demás, con el Pase de Mago (por ahora, "pronto").
     */
    pintarArchivo() {
      const cont = $('archivo'); if (!cont || !Estado.perfil) return;
      const p = Estado.perfil, hoyN = WW.numeroDia();
      const filas = [];
      for (let n = hoyN - 1, i = 0; n >= 1 && i < CONFIG.archivoDias; n--, i++) {
        const fecha = new Date(); fecha.setDate(fecha.getDate() - (hoyN - n));
        const libre = i < CONFIG.archivoGratis || this.tienePase();
        const jugado = (p.archivo && p.archivo[n]) || p.diarios[K(WW.claveDia(fecha))];
        const r = jugado && WW.RANGOS.find((x) => x.nombre === jugado.rango);
        const dia = `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        filas.push(`<button class="archivo-fila${libre ? '' : ' bloqueado'}" data-n="${n}" data-dias="${hoyN - n}"><b>#${n}</b><span>${dia}${libre ? '' : '<small>guardado para el Pase de Mago</small>'}</span><em>${jugado ? `${r ? r.icono : ''} ${jugado.puntos} pts` : libre ? 'Jugar' : '<i class="sello-pase"></i>'}</em></button>`);
      }
      cont.innerHTML = filas.join('') || '<p class="texto">Todavía no hay días anteriores: el archivo empieza mañana.</p>';
      cont.onclick = (e) => {
        const b = e.target.closest('.archivo-fila'); if (!b) return;
        Audio.click();
        if (b.classList.contains('bloqueado')) return this.avisoPase();
        const fecha = new Date(); fecha.setDate(fecha.getDate() - Number(b.dataset.dias));
        this.nuevaPartida('archivo', { fecha });
      };
    },

    /**
     * Compras de Play (game/js/compras.js): son del celular (de la cuenta de Google), no de un mago.
     * Al abrir y al volver a la app se le pregunta a Play qué tiene; si cambió, se repinta lo que depende del Pase.
     */
    compras() {
      if (!window.WWCompras) return;
      const mirar = () => WWCompras.restaurar(this.idNube()).then((cambio) => { if (cambio) this.repintarPase(); this.revisarPase(); });
      WWCompras.disponible().then((si) => {
        this.playBilling = si;
        if (!si) return;
        mirar();
        document.addEventListener('visibilitychange', () => { if (!document.hidden) mirar(); });
      });
    },
    idNube() { try { return Estado.perfil ? Ranking.miId(this.claveNube()) : null; } catch (e) { return null; } },
    repintarPase() {
      if (!Estado.perfil) return;
      const pant = document.querySelector('.pantalla:not(.oculto)');
      if (pant && pant.id === 'p-tienda') this.renderTienda();
      if ($('archivo')) this.pintarArchivo();
      this.pintarPracticas();
      this.pintarPerfil();
    },

    // ------------------------------------------------ recorrido del Pase (lab/premium.html, elegido por Owen el 12/10/2026)
    /** Lo que el perfil recuerda del Pase: si lo vio activo, qué trajes de temporada ya le avisamos y los avisos de venta. */
    pase() { const p = Estado.perfil; p.pase = p.pase || { visto: false, trajes: {}, cancelAviso: null }; p.ventas = p.ventas || { dia: null, no: {} }; return p.pase; },

    /**
     * Avisos de venta: como mucho uno por día; nunca a quien tiene el Pase, ni en las primeras partidas, ni donde no
     * se puede comprar; dos "Ahora no" a un mismo aviso lo callan una semana.
     */
    puedeVender(id) {
      const p = Estado.perfil; if (!p || this.tienePase() || !this.playBilling) return false;
      this.pase();
      if ((p.stats.partidas || 0) < 3 || p.ventas.dia === this.hoy) return false;
      const n = p.ventas.no[id];
      return !(n && n.hasta && n.hasta > this.hoy);
    },
    vendio(id) { this.pase(); Estado.perfil.ventas.dia = this.hoy; Estado.guardar(); },
    ahoraNo(id) {
      this.pase();
      const no = Estado.perfil.ventas.no, n = no[id] || { veces: 0 };
      n.veces++;
      if (n.veces >= 2) { const d = new Date(this.hoy + 'T12:00:00'); d.setDate(d.getDate() + 7); n.hasta = d.toISOString().slice(0, 10); n.veces = 0; }
      no[id] = n; Estado.guardar();
    },

    /** Al volver al inicio: la tarjeta "¿te está gustando?" (D) o el traje nuevo de temporada para quien tiene el Pase (G). */
    momentosPase() {
      const p = Estado.perfil; if (!p) return;
      const ps = this.pase();
      setTimeout(() => {
        if (this.pantalla !== 'p-menu' || !$('modal').classList.contains('oculto')) return;
        if (this.tienePase()) {
          const k = CONFIG.trajeTemporada, v = k && Magos.PALETAS[k];
          if (v && !ps.trajes[k]) {
            ps.trajes[k] = true; Estado.guardar();
            this.modal(`<h3>TE GUARDÉ EL TRAJE ${esc(v.nombre.toUpperCase())}</h3><div class="modal-silabo" data-pose="happy" data-paleta="${k}"></div><p>Viene con tu Pase, por la temporada.</p>`, [
              { texto: 'Después', clase: 'btn-secundario' },
              { texto: 'Ponérmelo', clase: 'btn-primario', accion: () => this.ponerTraje(k) },
            ]);
          }
          return;
        }
        if (!ps.gusta && Estado.rachaVigente(this.hoy) >= 3 && this.puedeVender('gusta')) {
          ps.gusta = true; this.vendio('gusta');
          this.modal(`<h3>¡${Estado.rachaVigente(this.hoy)} DÍAS SEGUIDOS!</h3><div class="modal-silabo" data-pose="happy" data-paleta="${CONFIG.trajeTemporada || 'turquesa'}"></div><p>Word Wizard lo hace una sola persona. Si te gusta, con el <b>Pase de Mago</b> la ayudás a seguir y te llevás práctica sin límite.</p>`, [
            { texto: 'Ahora no', clase: 'btn-secundario', accion: () => this.ahoraNo('gusta') },
            { texto: 'Ver el Pase', clase: 'btn-primario', accion: () => this.avisoPase() },
          ]);
        }
      }, 900);
    },

    /** Después de preguntarle a Play: si canceló, hasta cuándo sigue (una vez); si se terminó, qué conserva (H). */
    revisarPase() {
      const p = Estado.perfil; if (!p || !window.WWCompras) return;
      const ps = this.pase(), e = WWCompras.estadoPase();
      if (e || this.tienePase()) {
        if (!ps.visto) { ps.visto = true; Estado.guardar(); }
        if (e && e.cancelada && e.expira && ps.cancelAviso !== e.expira) {
          ps.cancelAviso = e.expira; Estado.guardar();
          const f = new Date(e.expira), dia = `${String(f.getDate()).padStart(2, '0')}/${String(f.getMonth() + 1).padStart(2, '0')}`;
          this.toast(`Tu Pase sigue hasta el ${dia}. Si querés retomarlo, está en Google Play.`);
        }
        return;
      }
      if (ps.visto && this.playBilling) {
        ps.visto = false; ps.cancelAviso = null; Estado.guardar();
        this.repintarPase();
        this.modal(`<h3>TU PASE TERMINÓ</h3><div class="modal-silabo"></div><p>Gracias por estos meses: <b>tus trajes y tu progreso siguen siendo tuyos.</b></p><p>Vuelven las ${CONFIG.practicasGratis} prácticas por día y los últimos ${CONFIG.archivoGratis} días del archivo.</p>`, [
          { texto: 'Entendido', clase: 'btn-secundario' },
          { texto: 'Volver al Pase', clase: 'btn-primario', accion: () => this.avisoPase() },
        ]);
      }
    },

    /** F · Bienvenida: fiesta, Silabo con el traje de temporada y lo que se destrabó, cada cosa con su botón. */
    bienvenidaPase() {
      const ps = this.pase(), k = CONFIG.trajeTemporada, v = k && Magos.PALETAS[k];
      ps.visto = true; if (k) ps.trajes[k] = true; Estado.guardar();
      Audio.logro(); this.confeti(80);
      const item = (t, b, acc) => `<button class="pase-bienv" data-acc="${acc}">${t}<em>${b}</em></button>`;
      this.modal(`<h3>¡YA TENÉS EL PASE DE MAGO!</h3><div class="modal-silabo" data-pose="happy" data-paleta="${k || 'turquesa'}"></div><p>Gracias por darme una mano. Mirá lo que se abrió:</p>
        <div class="pase-bienv-grilla">${item('Práctica sin límite', 'Practicar ▸', 'practica')}${item('Todo el archivo', 'Ver días ▸', 'archivo')}${v ? item(`Traje ${esc(v.nombre)}`, 'Ponérmelo ✓', 'traje') : ''}${item('Tu sello del Pase', 'En tu mago ★', 'sello')}</div>`, [{ texto: '¡Vamos!', clase: 'btn-primario' }]);
      $('modal-caja').querySelectorAll('.pase-bienv').forEach((b) => b.addEventListener('click', () => {
        const a = b.dataset.acc;
        if (a === 'traje') { this.ponerTraje(k); b.querySelector('em').textContent = 'Puesto ✓'; return; }
        if (a === 'sello') { Audio.click(); return; }
        $('modal').classList.add('oculto'); Audio.click();
        this.mostrar('p-practica');
        if (a === 'archivo') setTimeout(() => { const ar = $('archivo'); if (ar) ar.scrollIntoView({ behavior: 'smooth' }); }, 300);
      }));
    },
    ponerTraje(k) {
      const p = Estado.perfil; if (!p || !Magos.PALETAS[k]) return;
      Audio.click(); p.sombrero = k; Estado.guardar();
      for (const m of ['titulo', 'menu', 'juego', 'mapa']) this.magos[m].setPaleta(k);
      this.pintarMagoTarjeta();
    },

    /** Pase de Mago activo (mensual o anual): lo dice Play (WWCompras); perfil.derechos queda por compatibilidad. */
    tienePase() {
      if (window.WWCompras && WWCompras.tienePase()) return true;
      const d = Estado.perfil && Estado.perfil.derechos;
      return !!(d && (d.pase_mensual || d.pase_anual));
    },

    /** Cobro de Play; al volver, agradece y repinta. */
    async comprar(sku, nombre) {
      const r = await WWCompras.comprar(sku, this.idNube());
      if (r === 'ok') {
        this.repintarPase();
        if (WWCompras.PASE.includes(sku)) return this.bienvenidaPase();
        this.modal(`<h3>¡GRACIAS!</h3><div class="modal-silabo" data-pose="happy"></div><p>${esc(nombre)} ya es tuyo. ¡Me encanta cómo te queda! 💚</p>`, [{ texto: '¡Vamos!', clase: 'btn-primario' }]);
      } else if (r === 'error') {
        this.toast('No se pudo completar la compra. No se te cobró nada.');
      }
    },

    avisoCompra(v) {
      const k = Object.keys(Magos.PALETAS).find((x) => Magos.PALETAS[x] === v);
      const texto = v.especial.apoyo ? 'Gracias por querer darme una mano. 💚' : 'Un traje para lucirte: no da ninguna ventaja.';
      if (!this.playBilling) {
        return this.modal(`<h3>${esc(v.nombre.toUpperCase())}</h3><div class="modal-silabo" data-paleta="${k}"></div><p>${texto}</p><p>Muy pronto, desde la app de Android (Google Play).</p>`, [{ texto: 'Dale', clase: 'btn-primario' }]);
      }
      WWCompras.precios([v.especial.sku]).then((pr) => {
        const precio = (pr[v.especial.sku] || {}).precio;
        this.modal(`<h3>${esc(v.nombre.toUpperCase())}</h3><div class="modal-silabo" data-paleta="${k}"></div><p>${texto}</p>`, [
          { texto: 'Ahora no', clase: 'btn-secundario' },
          { texto: precio ? 'Comprar · ' + precio : 'Comprar', clase: 'btn-primario', accion: () => this.comprar(v.especial.sku, v.nombre) },
        ]);
      });
    },

    /**
     * La pantalla del Pase (variante B de lab/pase.html, elegida por Owen el 12/10/2026): lo que incluye en cuatro
     * fichas, Silabo con el traje de la temporada y dos tarjetas de precio (la anual marcada).
     */
    avisoPase() {
      const ficha = (ic, t) => `<div><i class="ic" data-ic="${ic}"></i>${t}</div>`;
      const incluye = `<div class="pase-inc">${ficha('vela', 'Práctica sin límite')}${ficha('calendario', 'Todo el archivo')}${ficha('torre', 'Historias nuevas')}${ficha('estrella', 'Traje de temporada')}</div>`;
      const gratis = `<p class="pase-nota">Gratis para siempre: el desafío del día, la Torre Arcana, ${CONFIG.practicasGratis} prácticas por día y los últimos ${CONFIG.archivoGratis} días del archivo.</p>`;
      const cabeza = `<h3>PASE DE MAGO</h3><div class="modal-silabo" data-pose="happy" data-paleta="${CONFIG.trajeTemporada}"></div>`;
      if (this.tienePase()) {
        return this.modal(`${cabeza}<p>Tu Pase está activo. ¡Gracias por darme una mano! 💚</p>${incluye}<p class="pase-nota">Lo manejás (o lo cancelás) desde Google Play → Pagos y suscripciones.</p>`, [{ texto: '¡Genial!', clase: 'btn-primario' }]);
      }
      if (!this.playBilling) {
        return this.modal(`${cabeza}<p>Con el <b>Pase de Mago</b> practicás sin límite, abrís todo el archivo y te llevás el traje de cada temporada. Y me ayudás a seguir creciendo.</p>${incluye}<p>Muy pronto, desde la app de Android (Google Play).</p>${gratis}`, [{ texto: '¡Genial!', clase: 'btn-primario' }]);
      }
      WWCompras.precios(WWCompras.PASE).then((pr) => {
        const m = pr.pase_mensual, a = pr.pase_anual;
        // "meses de regalo": lo que se ahorra con el anual contra 12 mensuales, con los precios de Play de ese país
        const regalo = m && a && m.moneda === a.moneda ? Math.round(12 - a.valor / m.valor) : 0;
        const porMes = a ? WWCompras.formato(Number.isInteger(a.valor) ? Math.round(a.valor / 12) : Math.round(a.valor / 12 * 100) / 100, a.moneda) : '';
        const planes = `<div class="pase-planes">
          <button class="pase-plan" data-sku="pase_mensual"><small>Por mes</small><b>${m ? m.precio : '—'}</b><span>cancelás cuando quieras</span></button>
          <button class="pase-plan sel" data-sku="pase_anual">${regalo >= 2 ? `<em class="pase-cinta">${regalo} meses de regalo</em>` : ''}<small>Por año</small><b>${a ? a.precio : '—'}</b><span>${porMes ? `${porMes} por mes` : ''}</span></button>
        </div>`;
        let sku = 'pase_anual';
        this.modal(`${cabeza}<p>Con el <b>Pase de Mago</b> practicás sin límite, abrís todo el archivo y te llevás el traje de cada temporada. Y me ayudás a seguir creciendo.</p>${incluye}${planes}${gratis}<p class="pase-nota">Se renueva solo; lo cancelás cuando quieras desde Google Play.</p>`, [
          { texto: 'Ahora no', clase: 'btn-secundario' },
          { texto: 'Sacar el Pase anual', clase: 'btn-primario', accion: () => this.comprar(sku, 'El Pase de Mago') },
        ]);
        const caja = $('modal-caja'), boton = caja.querySelector('.fila:last-child .btn-primario');
        caja.querySelectorAll('.pase-plan').forEach((b) => b.addEventListener('click', () => {
          Audio.click(); sku = b.dataset.sku;
          caja.querySelectorAll('.pase-plan').forEach((x) => x.classList.toggle('sel', x === b));
          boton.textContent = window.WWI18n.t(sku === 'pase_anual' ? 'Sacar el Pase anual' : 'Sacar el Pase mensual');
        }));
      });
    },

    /** Recordatorio diario (game/js/recordatorio.js). hora null = apagar. */
    async cambiarRecordatorio(hora) {
      const R = window.WWRecordatorio; if (!R) return;
      const sel = $('aj-recordatorio');
      if (hora === null) { await R.apagar(); this.toast('Recordatorio apagado.'); return; }
      const r = await R.prender(hora);
      if (r === 'ok') this.toast(`Listo: si un día no jugaste el desafío, te aviso a las ${hora} h.`);
      else {
        if (sel) sel.value = R.estado().on ? String(R.estado().hora) : '';
        if (r === 'instalar') this.toast('En iPhone, los avisos llegan con el juego instalado en la pantalla de inicio.');
        else if (r === 'denegado') this.toast('El celular no dejó mandar avisos. Activalos para Word Wizard en los ajustes del celular.');
        else this.toast('No se pudo prender el recordatorio. Probá de nuevo más tarde.');
      }
    },
    /** Después del primer desafío del día, una sola vez: ¿te aviso mañana? */
    ofrecerRecordatorio() {
      const R = window.WWRecordatorio;
      if (!R || !R.disponible() || R.pideInstalar() || R.estado().on || R.estado().preguntado) return;
      if (window.Notification && Notification.permission === 'denied') return;
      setTimeout(() => {
        if (this.pantalla !== 'p-resultado' || !$('modal').classList.contains('oculto')) return;   // si hay otro aviso, otro día
        R.marcarPreguntado();
        this.modal(`<h3>¿TE AVISO MAÑANA?</h3><div class="modal-silabo" data-pose="happy"></div><p>Si un día todavía no jugaste el desafío, te mando <b>un solo aviso</b> a la tarde para que no se corte tu racha. Lo cambiás o lo apagás en Ajustes.</p>`, [
          { texto: 'No, gracias', clase: 'btn-secundario' },
          { texto: 'Sí, a las 19 h', clase: 'btn-primario', accion: () => this.cambiarRecordatorio(R.HORA_DEF) },
        ]);
      }, 2600);
    },

    /** Prácticas jugadas hoy (las gratis son CONFIG.practicasGratis; con el Pase no hay límite). */
    practicasHoy() {
      const p = Estado.perfil;
      if (!p.practicasHoy || p.practicasHoy.fecha !== this.hoy) p.practicasHoy = { fecha: this.hoy, n: 0 };
      return p.practicasHoy;
    },
    esTester() { try { return localStorage.getItem('ww.tester') === '1'; } catch (e) { return false; } },
    limitePracticas() { return this.esTester() ? CONFIG.practicasTester : CONFIG.practicasGratis; },
    practicasQuedan() { return this.tienePase() ? Infinity : Math.max(0, this.limitePracticas() - this.practicasHoy().n); },
    pintarPracticas() {
      const q = this.practicasQuedan(), el = $('practica-quedan');
      if (!el) return;
      el.classList.toggle('agotadas', q === 0);
      el.innerHTML = (q === Infinity ? '<i class="sello-pase"></i> Práctica sin límite con tu Pase de Mago'
        : q === 0 ? 'Ya jugaste las prácticas de hoy. Mañana hay más.'
        : q === 1 ? 'Te queda 1 práctica hoy' : `Te quedan ${q} prácticas hoy`)
        + (q === Infinity ? '' : '<button class="chip-pase" type="button"><i class="sello-pase"></i>∞ con el Pase de Mago</button>');
      const ch = el.querySelector('.chip-pase');
      if (ch) ch.onclick = () => { Audio.click(); this.avisoPase(); };
    },
    /** Sin prácticas: el desafío del día, el archivo y la Torre siguen; el Pase da práctica sin límite. */
    avisoPracticas() {
      this.modal(`<h3>¡QUÉ RACHA!</h3><div class="modal-silabo" data-pose="sad"></div><p>Ya jugaste tus <b>${this.limitePracticas()} prácticas</b> de hoy. Mañana hay más.</p><p>Mientras tanto: el <b>desafío del día</b>, el archivo y la <b>Torre</b>. Con el <b>Pase de Mago</b> seguimos todo lo que quieras.</p>`, [
        { texto: 'Mañana sigo', clase: 'btn-secundario' },
        { texto: 'Ver el Pase', clase: 'btn-primario', accion: () => this.avisoPase() },
      ]);
    },

    /** Lo que la Torre ya dio hoy en monedas (el tope es CONFIG.topeTorre). */
    torreHoy() {
      const p = Estado.perfil;
      if (!p.torreHoy || p.torreHoy.fecha !== this.hoy) p.torreHoy = { fecha: this.hoy, monedas: 0 };
      return p.torreHoy;
    },

    /** Torre: se llegó al objetivo del piso. El piso ya está ganado, pero el reloj sigue: cada palabra más suma. */
    objetivoLogrado() {
      const pa = this.partida;
      pa.superado = true;
      this.limpiarEfectos();
      if (pa.jefe) {
        Audio.victoria(); this.sacudir(true); this.vineta('flash-oro');
        this.banner('⚔️', pa.nombreJefe.toUpperCase(), 'Jefe vencido', 'oro');
        this.magos.jefe.animar('sad', 2500);
        setTimeout(() => $('mago-jefe').classList.add('vencido'), 1200);
        this.confeti(80);
      } else {
        Audio.nivel(); this.vineta('flash-oro');
        this.banner('🎯', '¡OBJETIVO!', 'El piso es tuyo', 'oro');
        this.confeti(35);
      }
      this.magos.juego.animar('happy', 1400);
      setTimeout(() => { if (this.partida === pa && !pa.terminada) this.globo('¡Piso ganado! Lo que sumes ahora es extra', 'wow'); }, 1300);
      const b = $('btn-terminar');
      b.textContent = 'Subir ▲';
      b.classList.remove('oculto'); b.classList.add('btn-subir');
      this.renderProgreso(); this.renderPoderes();
    },

    /** Cierre del piso: por tiempo (con el objetivo cumplido), porque tocó "Subir" o porque encontró todas. */
    pisoSuperado(motivo) {
      const pa = this.partida, p = Estado.perfil;
      if (pa.terminada) return;
      pa.terminada = true; clearInterval(pa.timer);
      this.limpiarSeleccion();
      const rest = motivo === 'tiempo' || !pa.deadline ? 0 : Math.max(0, Math.round((pa.deadline - Date.now()) / 1000));
      const extra = Math.max(0, pa.puntosPiso - pa.objetivo);
      let bonusMonedas = 2 + Math.floor(rest / 15) + Math.floor(extra / 12);
      const bonusPiso = pa.arcade.piso * 10, bonusTiempo = Math.floor(rest / 3);
      let bonusPts = bonusPiso + bonusTiempo;
      if (pa.jefe) { bonusMonedas += 10; bonusPts += 40; pa.arcade.jefes += 1; p.arcade.jefes = (p.arcade.jefes || 0) + 1; p.arcade.checkpoint = Math.max(p.arcade.checkpoint || 0, pa.arcade.piso); }
      // tope diario de monedas de la Torre
      const hoyTorre = this.torreHoy();
      const ganadas = bonusMonedas;
      bonusMonedas = Math.max(0, Math.min(bonusMonedas, CONFIG.topeTorre - hoyTorre.monedas));
      hoyTorre.monedas += bonusMonedas;
      const topeAlcanzado = bonusMonedas < ganadas;
      Estado.sumarMonedas(bonusMonedas); pa.arcade.monedas += bonusMonedas; pa.monedasGanadas += bonusMonedas;
      pa.arcade.puntajeTotal += pa.puntos + bonusPts;
      pa.arcade.palabrasTotal += pa.encontradas.length;
      p.arcade.mejorPiso = Math.max(p.arcade.mejorPiso, pa.arcade.piso);
      // al ranking en cada piso pasado (antes solo al terminar la subida: quien la dejaba guardada a la mitad no aparecía)
      if (Ranking.activo()) Ranking.enviarTorre({ clave: this.claveNube(), nombre: p.nombre, puntaje: Math.max(p.arcade.mejorPuntaje, pa.arcade.puntajeTotal), piso: p.arcade.mejorPiso, jefes: Math.floor(p.arcade.mejorPiso / 5) });
      this.anotarTiempo(pa);
      this.guardarSubida(pa.arcade);
      this.limpiarEfectos();
      if (motivo === 'tiempo') { Audio.campana(); this.globo('¡Tiempo! Piso cerrado', 'wow'); }
      else if (motivo === 'completa') { Audio.victoria(); this.confeti(60); }
      this.magos.juego.animar('happy', 1500);
      const sig = pa.arcade.piso + 1;
      this.mision('piso', sig);
      this.anunciarLogros(Logros.evaluar(p, { tipo: 'piso' }));
      const info = { pa, bonusPts, bonusMonedas, rest, extra, bonusPiso, bonusTiempo, topeAlcanzado };
      this._tModalPiso = setTimeout(() => this.resumenPiso(info), motivo === 'subir' ? 350 : 1100);
    },

    /** Resumen del piso ganado: las cuentas aparecen de a una y el jugador decide cuándo seguir. */
    resumenPiso(info) {
      const { pa } = info;
      if (this.partida !== pa || pa.arcade.cerrada) return;
      const fila = (txt, val, clase) => `<li class="${clase || ''}"><span>${txt}</span><b>${val}</b></li>`;
      const filas = [
        fila(pa.jefe ? 'Daño al jefe' : 'Objetivo', `${pa.objetivo} pts ✓`),
        info.extra ? fila('Puntos extra', '+' + info.extra, 'extra') : '',
        fila('Palabras', pa.encontradas.length),
        fila('Bonus del piso', '+' + (info.bonusPiso + (pa.jefe ? 40 : 0))),
        info.bonusTiempo ? fila('Tiempo sobrante', `+${info.bonusTiempo} (${info.rest} s)`) : '',
        fila(info.topeAlcanzado ? 'Monedas (tope del día)' : 'Monedas', `+${info.bonusMonedas} ${WWIconos.html('moneda')}`),
        fila('Total de la subida', pa.arcade.puntajeTotal + ' pts', 'total'),
      ].filter(Boolean).join('');
      const titulo = pa.jefe ? `¡${esc(pa.nombreJefe.toUpperCase())} VENCIDO!` : `¡PISO ${pa.arcade.piso} SUPERADO!`;
      // las palabras del piso: las que hiciste y las que te faltaron (pedido de los testers, 14/10)
      this.modal(`<h3>${titulo}</h3><div class="modal-silabo" data-pose="happy"></div><ul class="resumen-piso">${filas}</ul>
        <button class="btn-link-cuenta" id="piso-ver">Ver las palabras del piso</button>
        <div id="piso-palabras" class="res-palabras piso-palabras oculto">${this.htmlPalabras({ base: pa.base, encontradas: pa.encontradas, nucleo: pa.nucleo })}</div>`, [
        { texto: `Seguir al piso ${pa.arcade.piso + 1}`, clase: 'btn-primario', accion: () => this.verTorre(info) },
      ]);
      $('piso-ver').addEventListener('click', () => {
        Audio.click(); const l = $('piso-palabras'); l.classList.toggle('oculto');
        $('piso-ver').textContent = l.classList.contains('oculto') ? 'Ver las palabras del piso' : 'Ocultar las palabras';
      });
      const lis = document.querySelectorAll('.resumen-piso li');
      lis.forEach((li, i) => { li.style.animationDelay = (250 + i * 260) + 'ms'; });
      lis.forEach((li, i) => setTimeout(() => Audio.tecla(), 250 + i * 260));
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
      // trajes de Silabo: llegan solos con el nivel, o se adelantan con monedas (solo se ven distinto, no dan ventaja)
      const cab = document.createElement('h4'); cab.className = 'tienda-cab'; cab.textContent = 'Trajes de Silabo'; cont.appendChild(cab);
      for (const [k, v] of Object.entries(Magos.PALETAS)) {
        if (v.especial || v.nivel <= 1 || v.nivel > 100) continue;
        const tiene = this.tieneTraje(k), precio = PRECIO_TRAJE(v.nivel);
        const d = document.createElement('div');
        d.className = 'tienda-item traje' + (tiene ? ' tiene' : ''); d.dataset.k = k;
        d.innerHTML = `<span class="mini-mago">${window.Silabo.mago(Object.assign({}, window.Silabo.OFICIAL, { colores: v.c, adorno: v.adorno, estilo: v.estilo }))}</span><div><b>${esc(v.nombre)}</b> <small>${tiene ? (p.sombrero === k ? 'Lo tenés puesto' : 'Ya es tuyo') : `Gratis en el nivel ${v.nivel}`}</small></div><button class="btn ${tiene ? 'btn-secundario' : 'btn-primario'}">${tiene ? (p.sombrero === k ? '✓' : 'Usar') : `${WWIconos.html('moneda')}${precio}`}</button>`;
        const b = d.querySelector('button');
        d.addEventListener('click', (e) => { if (!e.target.closest('button')) this.verTraje(k, d); });
        if (!tiene) b.disabled = p.monedas < precio;
        if (tiene && p.sombrero === k) b.disabled = true;
        b.addEventListener('click', () => {
          if (!tiene) {
            if (p.monedas < precio) return;
            Estado.sumarMonedas(-precio);
            p.trajes = Object.assign({}, p.trajes, { [k]: true });
            Audio.logro(); this.confeti(30);
          } else Audio.click();
          p.sombrero = k; Estado.guardar();
          for (const m of ['titulo', 'menu', 'juego', 'mapa']) this.magos[m].setPaleta(k);
          const saldo = document.querySelector('.tienda-saldo'); if (saldo) saldo.innerHTML = `TENÉS ${p.monedas} ${WWIconos.html('moneda')}`;
          this.renderTienda();
        });
        cont.appendChild(d);
      }
      // especiales y apoyo: pagos desde la app de Play (todavía no: "pronto"). Nunca dan ventaja.
      const cabE = document.createElement('h4'); cabE.className = 'tienda-cab'; cabE.textContent = 'Especiales'; cont.appendChild(cabE);
      for (const [k, v] of Object.entries(Magos.PALETAS)) {
        if (!v.especial) continue;
        const tiene = this.tieneTraje(k);
        const d = document.createElement('div');
        d.className = 'tienda-item traje especial' + (tiene ? ' tiene' : '') + (v.especial.apoyo ? ' apoyo' : ''); d.dataset.k = k;
        const sub = (v.especial.apoyo ? 'Invitale un mate a Silabo: para quien quiera bancar el juego' : `Temporada: ${v.especial.temporada}`)
          + (k === CONFIG.trajeTemporada && !tiene ? '<span class="chip-pase chico"><i class="sello-pase"></i>Incluido en el Pase</span>' : '');
        d.innerHTML = `<span class="mini-mago">${window.Silabo.mago(Object.assign({}, window.Silabo.OFICIAL, { colores: v.c, adorno: v.adorno, estilo: v.estilo }))}</span><div><b>${esc(v.nombre)}</b> <small>${tiene ? (p.sombrero === k ? 'Lo tenés puesto' : 'Ya es tuyo') : sub}</small></div><button class="btn ${tiene ? 'btn-secundario' : 'btn-primario'}">${tiene ? (p.sombrero === k ? '✓' : 'Usar') : v.especial.precio}</button>`;
        const b = d.querySelector('button');
        d.addEventListener('click', (e) => { if (!e.target.closest('button')) this.verTraje(k, d); });
        if (tiene && p.sombrero === k) b.disabled = true;
        b.addEventListener('click', () => {
          Audio.click();
          if (!tiene) return this.avisoCompra(v);
          p.sombrero = k; Estado.guardar();
          for (const mg of ['titulo', 'menu', 'juego', 'mapa']) this.magos[mg].setPaleta(k);
          this.renderTienda();
        });
        cont.appendChild(d);
      }
      const pase = document.createElement('button'); pase.className = 'tienda-pase';
      pase.innerHTML = `<b>Pase de Mago</b><small>Práctica sin límite, todo el archivo, historias nuevas y el traje de cada temporada</small><em>${this.tienePase() ? 'activo ✓' : 'ver'}</em>`;
      pase.addEventListener('click', () => { Audio.click(); this.avisoPase(); });
      cont.insertBefore(pase, cont.firstChild);
    },

    /**
     * El traje en grande, encima de la tienda: Silabo vivo con ese traje, qué trae y el mismo botón de la fila
     * (comprar, usar). "Volver" o el atrás de Android lo cierran y queda la tienda como estaba.
     */
    verTraje(k, fila) {
      const v = Magos.PALETAS[k], caja = $('modal-caja'), p = Estado.perfil;
      if (!v || !caja) return;
      Audio.click();
      this.cerrarTraje();
      const bFila = fila.querySelector('button');
      const etiqueta = fila.querySelector('small') ? fila.querySelector('small').textContent : '';
      const capa = document.createElement('div');
      capa.className = 'vista-traje';
      capa.innerHTML = `<div class="vista-traje-escena"><div class="vista-traje-mago"></div></div>
        <h3>${esc(v.nombre.toUpperCase())}</h3><p class="vista-traje-sub">${esc(etiqueta)}</p>${v.desc ? `<p>${esc(v.desc)}</p>` : ''}
        <div class="fila"><button class="btn btn-secundario" data-volver>Volver</button><button class="btn btn-primario" data-accion></button></div>`;
      const acc = capa.querySelector('[data-accion]');
      acc.innerHTML = bFila.innerHTML === '✓' ? '✓' : bFila.innerHTML;
      acc.disabled = bFila.disabled;
      if (bFila.classList.contains('btn-secundario')) acc.classList.replace('btn-primario', 'btn-secundario');
      acc.addEventListener('click', () => { this.cerrarTraje(); bFila.click(); });
      capa.querySelector('[data-volver]').addEventListener('click', () => { Audio.click(); this.cerrarTraje(); });
      caja.appendChild(capa);
      caja.scrollTop = 0;
      const mg = new Magos.Mago(capa.querySelector('.vista-traje-mago'), { paleta: k, etapa: Magos.etapaPorNivel(Math.max(p.nivel, 10)) });
      mg.chispas(14, .5, .3);
      WWIconos.pintar(capa);
    },
    cerrarTraje() { const c = document.querySelector('#modal-caja .vista-traje'); if (c) { c.remove(); return true; } return false; },

    /** Un traje es del jugador si llegó al nivel o si lo compró con monedas. */
    tieneTraje(k) {
      const p = Estado.perfil, v = Magos.PALETAS[k];
      if (!v) return false;
      if (v.especial) return !!((p.trajes && p.trajes[k]) || (p.derechos && p.derechos[v.especial.sku]) || (window.WWCompras && WWCompras.tiene(v.especial.sku)));
      return v.nivel < 100 && (p.nivel >= v.nivel || !!(p.trajes && p.trajes[k]));
    },

    terminar(motivo) {
      const pa = this.partida, p = Estado.perfil;
      if (!pa || pa.terminada) return;
      pa.terminada = true; clearInterval(pa.timer);
      this.limpiarSeleccion();
      this.limpiarEfectos();
      if (motivo === 'tiempo') { Audio.tiempoAgotado(); this.sacudir(true); }
      this.anotarTiempo(pa);

      // --- arcade: ¿queda vida?
      if (pa.modo === 'arcade' && motivo !== 'abandono') {
        pa.arcade.vidas -= 1;
        pa.arcade.puntajeTotal += pa.puntos;
        pa.arcade.palabrasTotal += pa.encontradas.length;
        this.guardarSubida(pa.arcade);
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
      if (window.WWMetricas) WWMetricas.marcar(WW.claveDia(), CONFIG.version, pa.modo);   // para el tablero ("qué juegan")

      // --- diario / práctica
      const pct = pa.totalPuntos ? (pa.puntosBase / pa.totalPuntos) * 100 : 0;
      const rango = WW.rangoPorPct(pct);
      const rangoIdx = WW.RANGOS.indexOf(rango);
      let xp = 0, monedas = 0;
      if (pa.modo === 'diario') {
        xp = Math.round(pa.puntos * 1.5 + rangoIdx * 10);
        monedas = pa.encontradas.length + rangoIdx * 4;
        p.diarios[K(this.hoy)] = { numero: pa.numero, palabra: pa.base, puntos: pa.puntos, pct: Math.round(pct * 10) / 10, rango: rango.nombre, encontradas: pa.encontradas.slice(), total: pa.total, totalPuntos: pa.totalPuntos, combo: pa.mejorCombo, fecha: this.hoy };
        p.enCurso = null;
        const velasUsadas = Estado.registrarRacha(this.hoy);
        if (velasUsadas) setTimeout(() => this.toast(`${WWIconos.html('vela')}<div><b>La vela salvó tu racha</b><br><small>Se ${velasUsadas > 1 ? `consumieron ${velasUsadas} velas` : 'consumió una vela'}. Racha: ${p.racha} días</small></div>`, 'logro'), 1200);
        this.mision('diario', 1);
        if (window.WWRecordatorio) { WWRecordatorio.jugo(this.hoy, p.racha); this.ofrecerRecordatorio(); }
        if (Ranking.activo()) Ranking.enviarDiario({ clave: this.claveNube(), fecha: this.hoy, numero: pa.numero, nombre: p.nombre, puntos: pa.puntos, palabras: pa.encontradas.length, rango: rango.nombre });
      } else if (pa.modo === 'archivo') {
        xp = Math.round(pa.puntos * 0.75);
        monedas = Math.floor(pa.encontradas.length / 3);
        p.archivo = p.archivo || {};
        const previo = p.archivo[pa.numero];
        if (!previo || pa.puntos > previo.puntos) p.archivo[pa.numero] = { puntos: pa.puntos, pct: Math.round(pct * 10) / 10, rango: rango.nombre, fecha: this.hoy };
        this.mision('practica', 1);
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
      const nuevos = Logros.evaluar(p, { tipo: 'fin', encontradas: pa.nEnc - [...pa.ojos].filter((w) => pa.nucleo.has(w)).length, total: pa.total, modo: pa.modo });
      if (nuevos.length) Estado.sumarMonedas(5 * nuevos.length);
      Estado.guardar();

      this.resultadoActual = { modo: pa.modo, opts: pa.opts, base: pa.base, numero: pa.numero, puntos: pa.puntos, encontradas: pa.encontradas, nucleo: pa.nucleo, nEnc: pa.nEnc, extras: pa.extras, total: pa.total, totalPuntos: pa.totalPuntos, pct, rango, xp, monedas, nivel, nuevos, mejorPalabra: pa.mejorPalabra, combo: pa.mejorCombo, derivables: pa.derivables, motivo };
      this.mostrarResultado(this.resultadoActual);
    },

    cerrarArcade(pa) {
      const p = Estado.perfil;
      const a = pa.arcade;
      if (a.cerrada) return;
      a.cerrada = true; clearTimeout(this._tModalPiso);
      if (window.WWMetricas) WWMetricas.marcar(WW.claveDia(), CONFIG.version, 'torre');
      p.subida = null;
      // 0,45 (era 0,8): desde la v2.16 se sube más alto en la Torre; así el nivel no se acelera (docs/ECONOMIA.md)
      const xp = Math.round(a.puntajeTotal * 0.45 + a.piso * 8);
      const esRecord = a.puntajeTotal > p.arcade.mejorPuntaje;
      p.arcade.mejorPuntaje = Math.max(p.arcade.mejorPuntaje, a.puntajeTotal);
      // el mejor piso es el último SUPERADO (lo anota pisoSuperado): el piso donde se perdió no cuenta, ni su jefe
      p.arcade.partidas += 1;
      if (Ranking.activo()) Ranking.enviarTorre({ clave: this.claveNube(), nombre: p.nombre, puntaje: p.arcade.mejorPuntaje, piso: p.arcade.mejorPiso, jefes: Math.floor(p.arcade.mejorPiso / 5) });
      p.arcade.historial.unshift({ fecha: this.hoy, puntos: a.puntajeTotal, piso: a.piso, jefes: a.jefes });
      p.arcade.historial = p.arcade.historial.slice(0, 20);
      p.stats.partidas += 1;
      Estado.sumarXp(xp);
      const nivel = { antes: this.nivelSesion || p.nivel, despues: p.nivel, subio: p.nivel > (this.nivelSesion || p.nivel) };
      const nuevos = Logros.evaluar(p, { tipo: 'fin', encontradas: pa.nEnc - [...pa.ojos].filter((w) => pa.nucleo.has(w)).length, total: pa.total, modo: 'arcade' });
      if (nuevos.length) Estado.sumarMonedas(5 * nuevos.length);
      Estado.guardar();
      this.resultadoActual = { modo: 'arcade', base: pa.base, puntos: a.puntajeTotal, encontradas: pa.encontradas, nucleo: pa.nucleo, nEnc: pa.nEnc, extras: pa.extras, total: pa.total, totalPuntos: pa.totalPuntos, piso: a.piso, jefes: a.jefes, palabrasTotal: a.palabrasTotal, xp, monedas: a.monedas, nivel, nuevos, mejorPalabra: pa.mejorPalabra, combo: pa.mejorCombo, derivables: pa.derivables, esRecord };
      this.mostrarResultado(this.resultadoActual);
    },

    mostrarResultado(r) {
      const p = Estado.perfil;
      this.prepararTarjeta(r);
      const esArcade = r.modo === 'arcade';
      $('res-titulo').textContent = esArcade ? (r.esRecord ? '¡NUEVO RÉCORD!' : 'FIN DE LA SUBIDA') : r.motivo === 'completo' ? '¡TODAS!' : r.modo === 'diario' ? `DESAFÍO #${r.numero}` : r.modo === 'archivo' ? `ARCHIVO #${r.numero}` : 'PRÁCTICA';
      if (esArcade) $('res-rango-icono').innerHTML = WWIconos.html('torre'); else $('res-rango-icono').textContent = r.rango.icono;
      { const mr = this.magos.resultado, bien = r.motivo === 'completo' || r.esRecord || (esArcade ? r.piso >= 3 : (r.pct || 0) >= 35);
        mr.setPaleta(p.sombrero); mr.setNivel(p.nivel);
        setTimeout(() => { mr.animar(bien ? 'happy' : 'sad', bien ? 2200 : 1600); if (bien) Audio.risita(); }, 500); }
      $('res-rango-sub').textContent = esArcade ? (r.jefes ? `${r.jefes} jefe${r.jefes > 1 ? 's' : ''} vencido${r.jefes > 1 ? 's' : ''}` : 'Llegaste al') : 'Rango';
      $('res-rango-nombre').textContent = esArcade ? `PISO ${r.piso}` : r.rango.nombre;
      $('res-puntos').textContent = '0'; setTimeout(() => this.tween($('res-puntos'), r.puntos, 900), 200);
      $('res-palabras-n').textContent = esArcade ? r.palabrasTotal : `${r.nEnc}/${r.total}` + (r.extras ? ` +${r.extras}` : '');
      $('res-mejor').textContent = r.mejorPalabra ? r.mejorPalabra.toUpperCase() : '—';
      // palabras largas: letra más chica para que no se corten en dos renglones dentro de la placa
      $('res-mejor').dataset.largo = r.mejorPalabra && r.mejorPalabra.length > 10 ? '2' : r.mejorPalabra && r.mejorPalabra.length > 8 ? '1' : '';
      $('res-combo').textContent = `x${r.combo || 0}`;
      $('res-xp-mas').textContent = `+${r.xp} XP`;
      $('res-monedas').innerHTML = `${WWIconos.html('moneda')} +${r.monedas}` + (r.nuevos && r.nuevos.length ? ` (+${5 * r.nuevos.length} por logros)` : '');
      this.pintarXp('res-xp-fill', 'res-xp-txt', Math.max(0, p.xp - r.xp), r.nivel ? r.nivel.antes : undefined);
      setTimeout(() => this.pintarXp('res-xp-fill', 'res-xp-txt', p.xp), 400);
      const lg = $('res-logros'); lg.innerHTML = '';
      for (const l of (r.nuevos || [])) {
        const d = document.createElement('div'); d.className = 'res-logro';
        d.innerHTML = `<span>${iconoLogro(l)}</span><div><b>${l.nombre}</b><small>${l.desc}</small></div>`; lg.appendChild(d);
      }
      $('btn-compartir').classList.toggle('oculto', r.modo === 'practica' || r.modo === 'archivo');
      $('btn-otra').innerHTML = esArcade ? WWIconos.html('repetir') + ' Otra subida' : r.modo === 'practica' ? WWIconos.html('repetir') + ' Otra palabra' : r.modo === 'archivo' ? WWIconos.html('calendario') + ' Otro del archivo' : WWIconos.html('calendario') + ' Mañana hay más';
      $('btn-otra').disabled = r.modo === 'diario';
      this.renderResPalabras(r);
      $('res-palabras').classList.add('oculto');
      this.mostrar('p-resultado');
      this.ofrecerInstalar();
      if (r.modo === 'diario' || r.motivo === 'completo') Audio.rango();
      if (r.esRecord || r.motivo === 'completo' || (r.rango && WW.RANGOS.indexOf(r.rango) >= 4)) setTimeout(() => this.confeti(80), 300);
      if (r.nivel && r.nivel.subio) setTimeout(() => { if (this.pantalla === 'p-resultado') this.anunciarNivel(r.nivel.despues); else this.nivelPendiente = r.nivel.despues; }, 900);
    },

    renderResPalabras(r) { $('res-palabras').innerHTML = this.htmlPalabras(r); },
    /** Todas las palabras de una base por largo: las encontradas, las que faltaron (apagadas) y las extra. */
    htmlPalabras(r) {
      const enc = new Set(r.encontradas);
      const nucleo = r.nucleo || this.dic.nucleo(this.dic.derivables(r.base), r.base);
      const todas = Array.from(nucleo);
      const extras = r.encontradas.filter((w) => !nucleo.has(w)).sort();
      const porLargo = {};
      for (const w of todas) (porLargo[w.length] || (porLargo[w.length] = [])).push(w);
      let html = `<h4>BASE: ${r.base.toUpperCase()}</h4>`;
      for (const L of Object.keys(porLargo).map(Number).sort((a, b) => b - a)) {
        const ws = porLargo[L].sort();
        html += `<h4>${L} LETRAS · ${ws.filter((w) => enc.has(w)).length}/${ws.length}</h4><div class="lista-chips">` +
          ws.map((w) => `<span class="chip-palabra ${enc.has(w) ? (w === r.base ? 'completa' : '') : 'falta'}">${w}</span>`).join('') + '</div>';
      }
      if (extras.length) html += `<h4>${T('PALABRAS EXTRA')} · ${extras.length}</h4><div class="lista-chips">` + extras.map((w) => `<span class="chip-palabra extra">${w}</span>`).join('') + '</div>';
      return html;
    },

    mostrarResultadoGuardado(d) {
      const rango = WW.rangoPorPct(d.pct);
      const nucleo = this.dic.nucleo(this.dic.derivables(d.palabra), d.palabra);
      const nEnc = d.encontradas.filter((w) => nucleo.has(w)).length;
      this.resultadoActual = { modo: 'diario', base: d.palabra, numero: d.numero, puntos: d.puntos, encontradas: d.encontradas, nucleo, nEnc, extras: d.encontradas.length - nEnc, total: nucleo.size, totalPuntos: d.totalPuntos, pct: d.pct, rango, xp: 0, monedas: 0, nuevos: [], mejorPalabra: d.encontradas.slice().sort((a, b) => b.length - a.length)[0] || '', combo: d.combo, guardado: true };
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
      this.modal(`<h3>¡NIVEL ${n}!</h3><div class="modal-silabo" data-pose="happy"></div><p>Ahora sos <b>${WW.tituloNivel(n)}</b>. +10 ${WWIconos.html('moneda')}</p>${crecio ? `<p>✨ <b>¡La varita de Silabo creció!</b> Ahora es una ${crecio.nombre.toLowerCase()}.</p>` : ''}${nuevoSombrero ? `<p>Desbloqueaste el traje <b>${nuevoSombrero[1].nombre}</b>. Ya está en Mi mago → Mis cosas.</p>` : ''}`,
        nuevoSombrero ? [
          { texto: 'Ver mis cosas', clase: 'btn-secundario', accion: () => { this.magoTab = 'cosas'; this.verMago(); } },
          { texto: 'Ponérmelo ahora', clase: 'btn-primario', accion: () => { this.ponerTraje(nuevoSombrero[0]); this.toast(`¡Te pusiste ${nuevoSombrero[1].nombre}!`); } },
        ] : [{ texto: '¡Genial!', clase: 'btn-primario' }]);
      Estado.sumarMonedas(10); Estado.guardar();
    },

    compartir() {
      const r = this.resultadoActual;
      if (!r) return;
      const url = /^https?:/.test(location.protocol) ? '\n' + location.origin + location.pathname : '';
      let texto;
      if (r.modo === 'arcade') {
        const Lc = LOCAL || {};
        texto = `🗼 Word Wizard · ${Lc.torre}\n🏁 ${Lc.piso} ${r.piso} · ${r.puntos} pts · ${r.palabrasTotal} ${Lc.palabras}${r.jefes ? ` · ${Lc.jefe(r.jefes)} ⚔️` : ''}\n${Lc.reto}${url}`;
      } else {
        const idx = WW.RANGOS.indexOf(r.rango);
        const barra = WW.RANGOS.slice(1).map((_, i) => (i < idx ? '🟩' : '⬛')).join('');
        const racha = Estado.rachaVigente(this.hoy);
        texto = `🧙 Word Wizard #${r.numero} · ${r.rango.icono} ${T(r.rango.nombre)}\n⭐ ${r.puntos} pts · ${r.nEnc}/${r.total} ${T('palabras')}\n${barra}${racha > 1 ? ` ${LOCAL.racha} ${racha}🔥` : ''}${url}`;
      }
      Audio.click();
      const img = this._tarjeta && this._tarjeta.r === r ? this._tarjeta.blob : null;
      if (img) {
        const archivo = new File([img], 'word-wizard.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [archivo] }) && !window.WW_ARTIFACT) {
          navigator.share({ files: [archivo], text: texto }).catch((e) => { if (e && e.name !== 'AbortError') this.verTarjeta(img, texto); });
          return;
        }
        return this.verTarjeta(img, texto);
      }
      if (navigator.share && !window.WW_ARTIFACT) navigator.share({ text: texto }).catch(() => this.copiar(texto));
      else this.copiar(texto);
    },

    /** Datos de la tarjeta para compartir (sin las palabras: no hay spoilers del desafío). */
    datosTarjeta(r) {
      const Lc = LOCAL || {};
      return {
        modo: r.modo, numero: r.numero, puntos: r.puntos, piso: r.piso, jefes: r.jefes, palabrasTotal: r.palabrasTotal,
        rango: r.rango ? { icono: r.rango.icono, nombre: T(r.rango.nombre) } : null, rangoIdx: r.rango ? WW.RANGOS.indexOf(r.rango) : 0,
        nEnc: r.nEnc, total: r.total, combo: r.combo, racha: Estado.rachaVigente(this.hoy),
        textos: { torre: Lc.torre, piso: Lc.piso, palabras: Lc.palabras, reto: Lc.reto, racha: Lc.racha,
          desafio: T('Desafío'), puntos: T('puntos'), pts: 'pts', combo: T('mejor combo'), jefes: T('jefes'), llegue: T('Llegué hasta el') },
      };
    },

    /** Se arma apenas aparece el resultado: al tocar Compartir la imagen ya está (iOS exige compartir enseguida del toque). */
    prepararTarjeta(r) {
      this._tarjeta = null;
      if (!window.WWTarjeta || r.modo === 'practica') return;
      const pedido = { r, blob: null };
      this._tarjeta = pedido;
      WWTarjeta.crear(this.datosTarjeta(r)).then((b) => { pedido.blob = b; }).catch(() => {});
    },

    /** Sin compartir nativo (compu): la imagen para guardar y el texto para copiar. */
    verTarjeta(blob, texto) {
      const url = URL.createObjectURL(blob);
      this.modal(`<h3>TU RESULTADO</h3><img class="tarjeta-vista" src="${url}" alt=""><p class="tarjeta-ayuda">Guardá la imagen y mandala por donde quieras.</p>`, [
        { texto: 'Copiar texto', clase: 'btn-secundario', accion: () => this.copiar(texto) },
        { texto: 'Guardar imagen', clase: 'btn-primario', accion: () => { const a = document.createElement('a'); a.href = url; a.download = 'word-wizard.png'; document.body.appendChild(a); a.click(); a.remove(); } },
      ]);
    },

    copiar(texto) {
      const ok = () => this.toast('📋 Copiado. ¡Pegalo donde quieras!');
      const mostrar = () => this.modal(`<h3>TU RESULTADO</h3><pre style="text-align:left;white-space:pre-wrap">${esc(texto)}</pre>`, [{ texto: 'Cerrar', clase: 'btn-secundario' }]);
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texto).then(ok, mostrar);
      else mostrar();
    },

    // ============================================================ rankings / estadísticas / logros / ajustes
    /**
     * Rankings (variante B de lab/rankings.html, elegida por Owen el 12/10/2026): un solo ranking, mundial, con
     * Hoy · Semana · Torre. Arriba el podio y abajo "cerca tuyo" (los 2 de adelante y los 2 de atrás), así nadie
     * queda solo ni perdido en el puesto 300. "Este celular" aparece solo si en el celular juegan 2 magos o más.
     * Sin la nube (compu de desarrollo), se ve lo del celular.
     */
    verRankings(tab) {
      tab = { mundo: 'hoy', diario: 'hoy', magos: 'hoy' }[tab] || tab || 'hoy';
      const todos = Estado.todos();
      $('tab-local').classList.toggle('oculto', Object.keys(todos).length < 2);
      document.querySelectorAll('#tabs-ranking .tab').forEach((t) => t.classList.toggle('activa', t.dataset.tab === tab));
      this.rankTab = tab;
      if (tab !== 'local' && Ranking.activo()) return this.verMundo(tab);
      const yo = Estado.perfil.nombre, cont = $('ranking-contenido');
      let filas;
      if (tab === 'torre') {
        filas = Object.values(todos).filter((p) => p.arcade && p.arcade.mejorPuntaje > 0).map((p) => ({ nombre: p.nombre, valor: p.arcade.mejorPuntaje, sub: `piso ${p.arcade.mejorPiso} · ${p.arcade.jefes || 0} ${(p.arcade.jefes || 0) === 1 ? 'jefe' : 'jefes'}`, unidad: 'PTS', yo: p.nombre === yo }));
      } else {
        filas = Object.values(todos).filter((p) => p.diarios && p.diarios[K(this.hoy)]).map((p) => ({ nombre: p.nombre, valor: p.diarios[K(this.hoy)].puntos, sub: `${p.diarios[K(this.hoy)].rango} · ${p.diarios[K(this.hoy)].encontradas.length} palabras`, unidad: 'PTS', yo: p.nombre === yo }));
      }
      $('ranking-nota').textContent = tab === 'local' ? 'Los magos de este celular, hoy.' : 'Rankings de este dispositivo.';
      this.pintarRanking(cont, filas, tab === 'torre' ? 'Todavía no hay registros.' : 'Nadie jugó el desafío de hoy todavía.');
      if (!$('p-rankings').classList.contains('activa')) this.mostrar('p-rankings');
    },

    /** Clave del mago para la nube: no cambia si se renombra. */
    claveNube() { const p = Estado.perfil; return p.creado || p.nombre; },

    verMundo(sub) {
      this.mundoSub = sub;
      const cont = $('ranking-contenido');
      cont.innerHTML = '<div class="rank-vacio">Cargando ranking mundial…</div>';
      $('ranking-nota').textContent = { hoy: 'Desafío de hoy, en todo el mundo.', semana: 'Puntos del desafío sumados desde el lunes.', torre: 'La mejor subida a la Torre Arcana de cada mago.' }[sub];
      if (!$('p-rankings').classList.contains('activa')) this.mostrar('p-rankings');
      const mio = Ranking.miId(this.claveNube());
      const lunes = (() => { const d = new Date(this.hoy + 'T12:00:00'); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.toISOString().slice(0, 10); })();
      // la lista entera (hasta 500): con eso se sabe tu puesto sin tocar la base
      const pedido = sub === 'hoy' ? Ranking.topDiario(this.hoy, 500) : sub === 'semana' ? Ranking.topSemanal(lunes, 500) : Ranking.topTorre(500);
      pedido.then((rows) => {
        if (this.mundoSub !== sub || this.rankTab !== sub) return;
        if (rows === null) { cont.innerHTML = '<div class="rank-vacio">Sin conexión. El ranking mundial necesita internet.</div>'; return; }
        const filas = rows.map((r) => sub === 'torre'
          ? { nombre: r.nombre, valor: r.mejor_puntaje, sub: `piso ${r.mejor_piso} · ${r.jefes} ${r.jefes === 1 ? 'jefe' : 'jefes'}`, unidad: 'PTS', yo: r.usuario === mio }
          : sub === 'semana'
            ? { nombre: r.nombre, valor: r.puntos, sub: `${r.dias} ${r.dias === 1 ? 'día' : 'días'}`, unidad: 'PTS', yo: r.usuario === mio }
            : { nombre: r.nombre, valor: r.puntos, sub: `${r.rango} · ${r.palabras} palabras`, unidad: 'PTS', yo: r.usuario === mio });
        this.pintarPodio(cont, filas, sub);
      });
    },

    /** Podio arriba y "cerca tuyo" abajo. Si no estás en la lista, la sigue desde el 4.º y te dice cómo entrar. */
    pintarPodio(cont, filas, sub) {
      filas.sort((a, b) => b.valor - a.valor);
      if (!filas.length) { cont.innerHTML = `<div class="rank-vacio">${sub === 'torre' ? 'Nadie subió la Torre todavía. ¡Estrenala!' : 'Nadie jugó todavía. ¡Sé el primero!'}</div>`; return; }
      const total = filas.length, yo = filas.findIndex((f) => f.yo);
      const sello = this.tienePase() ? '<i class="sello-pase"></i>' : '';
      const fila = (f, i) => `<div class="rank-fila${f.yo ? ' yo' : ''}"><span class="rank-pos">${i + 1}</span><div class="rank-nombre">${esc(f.nombre)}${f.yo ? sello : ''}<small>${esc(f.sub)}</small></div><div class="rank-valor">${f.valor}<small>${f.unidad}</small></div></div>`;
      let html = '';
      if (total >= 3) {
        const pod = (i, c) => `<div class="rk-pod ${c}${filas[i].yo ? ' yo' : ''}"><i class="rk-medalla">${['🥇', '🥈', '🥉'][i]}</i><b>${esc(filas[i].nombre)}${filas[i].yo ? sello : ''}</b><span>${filas[i].valor}</span></div>`;
        html += `<div class="rk-podio">${pod(1, 'p2')}${pod(0, 'p1')}${pod(2, 'p3')}</div>`;
      }
      const desde = total >= 3 ? 3 : 0;
      let idx = [];
      if (yo < 0 || yo <= 7) for (let i = desde; i < Math.min(total, Math.max(8, yo + 3)); i++) idx.push(i);
      else idx = [yo - 2, yo - 1, yo, yo + 1, yo + 2].filter((i) => i >= desde && i < total);
      if (idx.length && idx[0] > desde) html += '<div class="rk-corte">• • •</div>';
      html += idx.map((i) => fila(filas[i], i)).join('');
      if (yo >= 0) {
        const pct = total > 1 ? Math.round((total - 1 - yo) / (total - 1) * 100) : 100;
        const frase = yo === 0 ? (sub === 'hoy' ? '¡Vas primero hoy!' : sub === 'semana' ? '¡Vas primero esta semana!' : '¡Sos el mejor de la Torre!')
          : sub === 'hoy' ? `Le ganaste al ${pct} % de los magos de hoy` : `Puesto ${yo + 1} de ${total} magos`;
        html += `<div class="rk-frase">${frase}</div>`;
      } else {
        html += `<div class="rk-frase">${sub === 'torre' ? 'Subí la Torre para entrar al ranking.' : sub === 'semana' ? 'Jugá el desafío para entrar al ranking de la semana.' : 'Jugá el desafío de hoy para entrar al ranking.'}</div>`;
      }
      cont.innerHTML = html;
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
      $('stats-contenido').innerHTML = this.htmlEstadisticas();
      this.mostrar('p-stats');
    },
    htmlEstadisticas() {
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
        </div>${this.panelRitmo(num)}`;
      if (diarios.length) {
        html += `<div class="stats-panel"><h3>📜 Últimos desafíos</h3><div class="hist">${diarios.slice(-14).reverse().map((d) => `<div class="hist-fila"><span class="hist-fecha">${(d.fecha || '').slice(5).replace('-', '/')}</span><span class="hist-palabra">${d.palabra.toUpperCase()}</span><span class="hist-rango">${(WW.RANGOS.find((r) => r.nombre === d.rango) || {}).icono || ''} ${d.rango}</span><span class="hist-pts">${d.puntos} pts</span></div>`).join('')}</div></div>`;
      }
      return html;
    },

    verLogros() {
      $('logros-grilla').innerHTML = this.htmlLogros();
      $('logros-resumen').textContent = this.resumenLogros();
      this.mostrar('p-logros');
    },
    resumenLogros() { return `${Object.keys(Estado.perfil.logros).length} de ${Logros.LOGROS.length} logros. Cada uno da 5 monedas.`; },
    htmlLogros() {
      const p = Estado.perfil;
      return Logros.LOGROS.map((l) => { const ok = !!p.logros[l.id]; return `<div class="logro${ok ? '' : ' bloqueado'}"><span>${iconoLogro(l, !ok)}</span><b>${l.nombre}</b><small>${l.desc}</small></div>`; }).join('');
    },

    // ============================================================ cuenta (game/js/cuenta.js, docs/LOGIN.md)
    // Opcional: sin cuenta se juega igual. Con cuenta (Google o código por mail) el progreso queda guardado y se
    // sincroniza entre dispositivos; el ranking y las compras pasan a ser de la cuenta.
    cuenta() {
      if (!window.WWCuenta) return;
      const ocupado = () => !!(this.partida && !this.partida.terminada);
      Estado.alGuardar = () => {
        if (!Estado.perfil) return;
        const clave = this.claveNube();
        WWCuenta.programar(clave, () => Estado.perfil, ocupado, (nuevo) => this.aplicarNube(clave, nuevo));
      };
      document.addEventListener('visibilitychange', () => {
        if (!Estado.perfil) return;
        if (document.hidden) WWCuenta.vaciar(this.claveNube(), Estado.perfil);
        else if (!ocupado()) this.sincronizarCuenta();
      });
      this._vuelta = WWCuenta.alVolver();   // vuelve de la pantalla de Google: se termina cuando el título esté listo
      WWCuenta.alEstado((clave, estado, subio) => { if (Estado.perfil && clave === this.claveNube()) this.pintarNube(estado, subio); });
    },

    /**
     * Marca de cuenta (lab/cuenta.html, opción C elegida por Owen el 14/10): una nube al final del chip de arriba.
     * Menta guardado, gris sin señal, coral si hay que volver a entrar. Cuando sube algo, el subtítulo dice
     * "☁ Guardado" un ratito y vuelve al título de nivel; sin señal o con la sesión vencida, el subtítulo lo avisa.
     */
    pintarNube(estado, subio) {
      const hud = $('hud-yo'); if (!hud || !Estado.perfil) return;
      const c = this.tieneCuenta() && WWCuenta.de(this.claveNube());
      if (estado) this._nube = estado;
      if (c && c.perdida) this._nube = 'vencida';
      let n = hud.querySelector('.hud-nube');
      if (!c) { if (n) n.remove(); hud.classList.remove('nube-guardando', 'nube-pendiente', 'nube-vencida'); return; }
      if (!n) { n = document.createElement('span'); n.className = 'hud-nube'; n.innerHTML = '<svg viewBox="0 0 18 12" aria-hidden="true"><path d="M5 11h9a3.4 3.4 0 0 0 .6-6.7A4.6 4.6 0 0 0 5.8 3.2 3.9 3.9 0 0 0 5 11z"/></svg>'; hud.appendChild(n); }
      const e = this._nube || 'guardado';
      for (const k of ['guardando', 'pendiente', 'vencida']) hud.classList.toggle('nube-' + k, e === k);
      const t = $('hud-titulo'), titulo = WW.tituloNivel(Estado.perfil.nivel);
      clearTimeout(this._tNube);
      if (e === 'pendiente') t.innerHTML = '<span class="hud-estado pendiente">☁ Sin señal</span>';
      else if (e === 'vencida') t.innerHTML = '<span class="hud-estado vencida">! Volvé a entrar</span>';
      else if (e === 'guardado' && subio) {
        t.innerHTML = '<span class="hud-estado">☁ Guardado</span>';
        this._tNube = setTimeout(() => { $('hud-titulo').textContent = WW.tituloNivel(Estado.perfil.nivel); }, 2200);
      } else if (e !== 'guardando') t.textContent = titulo;
    },
    tieneCuenta() { return !!(window.WWCuenta && Estado.perfil && WWCuenta.de(this.claveNube())); },

    /**
     * "Entrar con mi cuenta" en el título: solo en un dispositivo sin mago (la compu nueva, otro celu, después de salir
     * de la cuenta) y si las cuentas andan. Con mago, guardarlo o volver a entrar se hace desde su tarjeta.
     */
    pintarCuentaTitulo() {
      const b = $('btn-cuenta-entrar'); if (!b) return;
      b.classList.toggle('oculto', !(window.WWCuenta && WWCuenta.activo() && !Object.keys(Estado.todos()).length));
    },
    /** Al abrir el título: si volvió de Google, termina de entrar. */
    cuentaAlAbrir() {
      const v = this._vuelta; this._vuelta = null;
      if (!v) return;
      if (v.canje) { v.canje.then((r) => { this._vuelta = r; this.cuentaAlAbrir(); }); return; }   // PKCE: primero se canjea el ?code=
      const p = v.clave && Object.values(Estado.todos()).find((x) => x.creado === v.clave);
      if (v.error && p && v.modo === 'vincular') {
        // Google a veces vuelve dos veces: la primera vincula y la segunda trae el error. Se pregunta antes de avisar.
        Estado.cargar(p.nombre);
        WWCuenta.revisarVinculo(v.clave).then((ok) => {
          if (ok) return this.cuentaLista(ok.sesion, v.clave, null, true);
          this._vuelta = Object.assign({}, v, { modo: 'revisado' }); this.cuentaAlAbrir();
        });
        return;
      }
      if (v.error) {
        // ese Google ya tiene su propia cuenta (la armó en otro dispositivo): se puede entrar a esa
        if (v.yaExiste && p) {
          Estado.cargar(p.nombre);
          this.modal(`<h3>ESE GOOGLE YA TIENE CUENTA</h3><div class="modal-silabo"></div><p>Esa cuenta de Google ya tiene un mago guardado.</p><p>Podés entrar a esa cuenta: te muestro los dos magos y elegís. No se borra ninguno.</p>`, [
            { texto: 'Ahora no', clase: 'btn-secundario' },
            { texto: 'Entrar a esa cuenta', clase: 'btn-primario', accion: () => WWCuenta.google(v.clave, true) },
          ]);
        } else this.toast('No se pudo entrar con Google. Probá de nuevo.');
        // para entender qué pasó (llega a la base: node tools/reportes.js)
        if (window.WWReportes) WWReportes.error('Cuenta: ' + String(v.error).slice(0, 200), { codigo: v.codigo, modo: v.modo, yaExiste: v.yaExiste });
        return;
      }
      if (p) Estado.cargar(p.nombre); else Estado.salir();
      this.cuentaLista(v.sesion, p ? v.clave : null, v.secreto, v.vinculo);
    },

    /** Trae lo de la nube y lo junta con lo de acá (al entrar, al volver a la app). También las compras de la cuenta. */
    async sincronizarCuenta() {
      if (!this.tieneCuenta()) return;
      const clave = this.claveNube();
      await WWCuenta.sincronizar(clave, Estado.perfil, { aplicar: (nuevo) => this.aplicarNube(clave, nuevo) });
      if (!Estado.perfil || this.claveNube() !== clave) return;
      const lista = await WWCuenta.compras(clave);
      if (window.WWCompras && WWCompras.desdeCuenta(lista)) this.repintarPase();
    },
    /** Lo junto con la nube se aplica solo si sigue el mismo mago y no hay partida en curso (si no, se junta la próxima vez). */
    aplicarNube(clave, nuevo) {
      if (!Estado.perfil || this.claveNube() !== clave || (this.partida && !this.partida.terminada)) return false;
      this.aplicarPerfil(nuevo);
      return true;
    },
    /** El perfil que vino de la nube pasa a ser el de acá, sin cambiar de pantalla. */
    aplicarPerfil(nuevo) {
      const p = Estado.perfil, nombre = p.nombre;
      for (const k of Object.keys(p)) delete p[k];
      Object.assign(p, nuevo, { nombre });   // el nombre es de cada dispositivo (es la clave del mago acá)
      Estado.guardar();
      for (const k of ['titulo', 'menu', 'juego', 'resultado', 'mapa']) { this.magos[k].setPaleta(Estado.perfil.sombrero); this.magos[k].setNivel(Estado.perfil.nivel); }
      if (this.pantalla === 'p-menu') this.pintarPerfil();
      if (this.pantalla === 'p-ajustes') this.verAjustes();
    },

    /** Silabo ofrece guardar el progreso: con el Pase, o después de unas partidas; como mucho 3 veces, una por semana. */
    momentoCuenta() {
      const p = Estado.perfil;
      if (!p || !window.WWCuenta || !WWCuenta.activo() || this.tieneCuenta()) return;
      const v = p.vistos && p.vistos.cuenta || { veces: 0, dia: null };
      const dias = v.dia ? (new Date(this.hoy) - new Date(v.dia)) / 864e5 : 99;
      const pase = this.tienePase();
      if (v.veces >= 3 || dias < 7 || (!pase && p.stats.partidas < 6) || (p.ventas && p.ventas.dia === this.hoy)) return;
      setTimeout(() => {
        if (this.pantalla !== 'p-menu' || !$('modal').classList.contains('oculto') || this.tieneCuenta()) return;
        p.vistos = Object.assign({}, p.vistos, { cuenta: { veces: v.veces + 1, dia: this.hoy } }); Estado.guardar();
        const racha = Estado.rachaVigente(this.hoy);
        this.modal(`<h3>¿TE GUARDO EL PROGRESO?</h3><div class="modal-silabo" data-pose="happy"></div>
          <p>${pase ? 'Tenés el Pase de Mago.' : `Ya vas por el nivel ${p.nivel}${racha >= 2 ? ` con ${racha} días de racha` : ''}.`}</p>
          <p>Con una cuenta no lo perdés si cambiás de celular, y seguís jugando en la compu.</p>`, [
          { texto: 'Ahora no', clase: 'btn-secundario' },
          { texto: 'Guardar mi progreso', clase: 'btn-primario', accion: () => this.entrarCuenta(this.claveNube()) },
        ]);
      }, 1500);
    },

    /** Pantalla para entrar: Google o código por mail. clave = el mago de acá que se guarda (null: traer uno de la cuenta). */
    entrarCuenta(clave) {
      Audio.click();
      if (!window.WWCuenta || !WWCuenta.activo()) { this.toast('Las cuentas necesitan conexión a internet.'); return; }
      const guardar = !!clave;
      this.modal(`<h3>${guardar ? 'GUARDÁ TU PROGRESO' : 'ENTRÁ CON TU CUENTA'}</h3><div class="modal-silabo"></div>
        <p>${guardar ? 'Así no lo perdés y seguís en la compu o en otro celular.' : 'Traigo tu mago con todo lo que hiciste.'}</p>
        <div class="cuenta-entrar">
          ${WWCuenta.metodo('google') ? '' : '<!--'}<button class="btn btn-google" id="cu-google"><svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg><span>Seguir con Google</span></button>${WWCuenta.metodo('google') ? '' : '-->'}
          ${WWCuenta.metodo('google') && WWCuenta.metodo('mail') ? '<div class="cuenta-o"><span>o con tu mail</span></div>' : ''}
          ${WWCuenta.metodo('mail') ? '' : '<!--'}<input class="modal-input" id="cu-mail" type="email" inputmode="email" autocomplete="email" placeholder="tu@mail.com" maxlength="120">
          <button class="btn btn-primario" id="cu-mandar">Mandame un código</button>${WWCuenta.metodo('mail') ? '' : '-->'}
          <p class="cuenta-nota">Tu mail solo sirve para reconocer tu cuenta. Nada de publicidad.</p>
        </div>`, [], { cerrar: true });
      if ($('cu-google')) $('cu-google').addEventListener('click', () => { Audio.click(); $('cu-google').disabled = true; WWCuenta.google(clave); });
      const mandar = async () => {
        const mail = $('cu-mail').value, b = $('cu-mandar');
        b.disabled = true; b.textContent = 'Mandando…';
        const r = await WWCuenta.pedirCodigo(mail, clave);
        if (r === 'ok') return this.pedirCodigoCuenta(clave, mail.trim().toLowerCase());
        b.disabled = false; b.textContent = 'Mandame un código';
        this.toast(r === 'mail' ? 'Revisá el mail: parece que está mal escrito.' : r === 'espera' ? 'Para pedir otro código esperá un minuto.' : 'No se pudo mandar el código. Probá de nuevo.');
      };
      if (!$('cu-mandar')) return;
      $('cu-mandar').addEventListener('click', () => { Audio.click(); mandar(); });
      $('cu-mail').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); mandar(); } });
    },
    pedirCodigoCuenta(clave, mail) {
      this.modal(`<h3>REVISÁ TU MAIL</h3><div class="modal-silabo" data-pose="happy"></div>
        <p>Te mandé un código (o un link para tocar) a</p><p class="cuenta-mail">${esc(mail)}</p>
        <input class="modal-input cuenta-codigo" id="cu-codigo" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="10" placeholder="······">
        <button class="btn btn-primario" id="cu-verificar">Entrar</button>
        <p class="cuenta-nota">¿No llegó? Mirá en spam o <a href="#" id="cu-otra">pedí otro</a>.</p>`, [], { cerrar: true });
      setTimeout(() => { const i = $('cu-codigo'); if (i) i.focus(); }, 150);
      // un código se usa una sola vez: si ya se está mandando (el envío solo al pegar + el botón), no se manda de nuevo
      let verificando = false, tCod = null;
      const verificar = async () => {
        clearTimeout(tCod);
        if (verificando) return;
        const b = $('cu-verificar'), cod = $('cu-codigo').value;
        if (cod.replace(/\D/g, '').length < 6) return this.toast('El código tiene 6 números.');
        verificando = true; b.disabled = true; b.textContent = 'Entrando…';
        const r = await WWCuenta.verificar(mail, cod);
        if (r.sesion) { $('modal').classList.add('oculto'); return this.cuentaLista(r.sesion, clave, r.secreto, r.vinculo); }
        verificando = false; b.disabled = false; b.textContent = 'Entrar';
        this.toast(r.error === 'codigo' ? 'Ese código no anda o ya venció. Fijate o pedí otro.' : 'No se pudo entrar. Probá de nuevo.');
      };
      $('cu-verificar').addEventListener('click', () => { Audio.click(); verificar(); });
      // entra solo cuando dejó de escribir (por si el código viniera más largo que 6)
      $('cu-codigo').addEventListener('input', (e) => { clearTimeout(tCod); if (e.target.value.replace(/\D/g, '').length >= 6) tCod = setTimeout(verificar, 700); });
      $('cu-otra').addEventListener('click', (e) => { e.preventDefault(); this.entrarCuenta(clave); setTimeout(() => { const i = $('cu-mail'); if (i) i.value = mail; }, 50); });
    },

    /**
     * Ya entró (con Google o con el código): se reclama lo del mago anónimo y se decide qué mago queda.
     *  · el mago de acá y la cuenta vacía → la cuenta guarda este mago
     *  · la cuenta ya tiene un mago → si es el mismo, se juntan; si es otro, elige con cuál seguir
     *  · sin mago de acá (entró desde el título) → se trae el de la cuenta, o se crea uno nuevo si está vacía
     */
    async cuentaLista(sesion, clave, secreto, vinculo) {
      this.toast('☁️ Entrando…');
      let r;
      try { r = await WWCuenta.completar(sesion, secreto); } catch (e) { this.toast('No se pudo entrar. Probá de nuevo.'); return; }
      const { cuenta, nube } = r;
      const local = clave && Estado.perfil && this.claveNube() === clave ? Estado.perfil : null;
      const listo = (nombre, msj) => {
        this.toast(msj);
        if (this.pantalla === 'p-titulo' || !Estado.perfil || Estado.perfil.nombre !== nombre) { this.renderPerfiles(); this.entrar(nombre); }
        else if (this.pantalla === 'p-ajustes') this.verAjustes();
        this.sincronizarCuenta();
      };
      // un solo mago por dispositivo (v2.40): si se trae el de la cuenta, el de acá sale (con su copia de 30 días)
      const canjear = () => WWCuenta.canjear(sesion, secreto);
      const traer = (soltarLocal) => {
        canjear();
        if (soltarLocal && local) { Ranking.olvidar(clave); if (local.creado !== nube.datos.creado) Estado.apartar(local.nombre); }
        // si ese mismo mago ya está en este dispositivo (volvió a entrar desde el título), se junta: lo jugado acá no se pierde
        const todos = Estado.todos(), mismo = Object.values(todos).find((m) => m && m.creado && m.creado === nube.datos.creado);
        const datos = mismo ? Object.assign(Estado.fusionar(WWCuenta.baseDe(mismo.creado), mismo, nube.datos), { creado: mismo.creado }) : nube.datos;
        const p = Estado.instalar(datos);
        WWCuenta.vincular(p.creado, sesion, cuenta);
        WWCuenta.adoptar(p.creado, nube);
        listo(p.nombre, `☁️ ¡Hola de nuevo, ${esc(p.nombre)}!`);
      };
      const guardarLocal = async (rev) => {
        await canjear();
        WWCuenta.vincular(clave, sesion, cuenta);
        try { await WWCuenta.empezar(clave, local, rev); } catch (e) { /* se reintenta en la próxima sincronización */ }
        listo(local.nombre, '☁️ Listo: tu progreso queda guardado en tu cuenta.');
      };
      if (local) {
        // vinculado: es la MISMA cuenta que el mago ya usaba (mismo id), así que la nube está vacía o es suya
        if (vinculo || !nube) return guardarLocal(nube ? nube.rev : 0);
        if (nube.datos.creado === local.creado) { canjear(); WWCuenta.vincular(clave, sesion, cuenta); return listo(local.nombre, '☁️ Volviste a entrar.'); }
        const n = nube.datos;
        this.modal(`<h3>TU CUENTA YA TIENE UN MAGO</h3><div class="modal-silabo"></div>
          <p>En la cuenta está <b>${esc(n.nombre)}</b> (nivel ${Number(n.nivel) || 1}). Acá tenés a <b>${esc(local.nombre)}</b> (nivel ${local.nivel}).</p>
          <p>¿Con cuál seguís? Si traés el de la cuenta, el de acá sale de este dispositivo. Si guardás el de acá, la cuenta guarda una copia del otro.</p>`, [
          { texto: `Traer a ${n.nombre}`, clase: 'btn-primario', accion: () => traer(true) },
          { texto: `Guardar a ${local.nombre}`, clase: 'btn-secundario', accion: () => guardarLocal(nube.rev) },
          { texto: 'Cancelar', clase: 'btn-secundario', atras: true, accion: () => this.cerrarSesionSuelta(sesion) },
        ]);
        return;
      }
      if (nube) return traer(false);
      // la cuenta está vacía y acá no hay mago: lo más probable es que el mago esté en otro dispositivo sin guardar
      this.modal(`<h3>TU CUENTA ESTÁ VACÍA</h3><div class="modal-silabo"></div><p>Todavía no guardaste ningún mago en esta cuenta.</p>
        <p>Si ya jugás en otro dispositivo (el celu, por ejemplo), entrá ahí primero: <b>Ajustes → Guardar mi progreso</b>. Después volvé acá y tocá "Entrar con mi cuenta".</p>`, [
        { texto: 'Entendido', clase: 'btn-primario', accion: () => this.cerrarSesionSuelta(sesion) },
        { texto: 'Empezar uno nuevo', clase: 'btn-secundario', accion: () => { canjear(); this.crearEnCuenta(sesion, cuenta, listo); } },
      ]);
    },
    /** Se entró a una cuenta pero no se usa: se cierra esa sesión (no queda guardada en ningún mago). */
    cerrarSesionSuelta(sesion) { try { fetch(`${Ranking.CONFIG.url}/auth/v1/logout?scope=local`, { method: 'POST', headers: { apikey: Ranking.CONFIG.key, Authorization: 'Bearer ' + sesion.token } }); } catch (e) { /* nada */ } },
    crearEnCuenta(sesion, cuenta, listo) {
      this.modal(`<h3>¿CÓMO SE LLAMA TU MAGO?</h3><div class="modal-silabo"></div><p>Armemos tu mago nuevo.</p>
        <input class="modal-input" id="cu-nombre" type="text" maxlength="16" placeholder="Tu nombre">`, [
        { texto: 'Crear', clase: 'btn-primario', accion: async () => {
          const nom = ($('cu-nombre') && $('cu-nombre').value.trim()) || 'Mago';
          const p = Estado.crear(Estado.todos()[nom] ? nom.slice(0, 13) + ' 2' : nom);
          if (!p) return;
          WWCuenta.vincular(p.creado, sesion, cuenta);
          try { await WWCuenta.empezar(p.creado, p, 0); } catch (e) { /* se reintenta */ }
          listo(p.nombre, '☁️ ¡Listo! Tu mago queda guardado en tu cuenta.');
        } },
      ]);
    },

    /** Ajustes → Tu cuenta. */
    pintarCuenta() {
      const caja = $('aj-cuenta'); if (!caja) return;
      const ok = window.WWCuenta && WWCuenta.activo();
      caja.classList.toggle('oculto', !ok);
      $('aj-borrar').textContent = 'Borrar este mago';
      if (!ok) return;
      const c = WWCuenta.de(this.claveNube());
      if (!c) {
        caja.innerHTML = `<div class="cuenta-caja"><b>☁️ Guardá tu progreso</b><small>Entrá con Google o con tu mail para no perderlo y jugar en otros dispositivos.</small>
          <button class="btn btn-primario" id="aj-cuenta-entrar">Guardar mi progreso</button></div>`;
        $('aj-cuenta-entrar').addEventListener('click', () => this.entrarCuenta(this.claveNube()));
        return;
      }
      $('aj-borrar').textContent = 'Borrar mi cuenta';
      caja.innerHTML = `<div class="cuenta-caja con-cuenta"><b>☁️ Tu cuenta</b>
        <small class="cuenta-quien">${c.proveedor === 'google' ? 'Google' : 'Mail'} · <span data-no-t>${esc(c.email)}</span></small>
        ${c.perdida ? '<small class="cuenta-aviso">Tu sesión venció: volvé a entrar para seguir guardando.</small><button class="btn btn-primario" id="aj-cuenta-volver">Volver a entrar</button>' : '<small>Tu progreso se guarda solo.</small>'}
        <button class="btn btn-secundario" id="aj-cuenta-salir">Salir de la cuenta</button></div>`;
      if ($('aj-cuenta-volver')) $('aj-cuenta-volver').addEventListener('click', () => this.entrarCuenta(this.claveNube()));
      $('aj-cuenta-salir').addEventListener('click', () => this.salirCuenta());
    },

    salirCuenta() {
      Audio.click();
      const p = Estado.perfil, clave = this.claveNube();
      this.modal(`<h3>¿SALIR DE LA CUENTA?</h3><p><b>${esc(p.nombre)}</b> se va de este dispositivo. Queda guardado en tu cuenta: lo recuperás entrando de nuevo.</p>`, [
        { texto: 'Cancelar', clase: 'btn-secundario' },
        { texto: 'Sí, salir', clase: 'btn-peligro', accion: async () => {
          this.toast('☁️ Guardando…');
          const r = await WWCuenta.sincronizar(clave, Estado.perfil);
          if (!r) { this.toast('Sin conexión: si salís ahora se pierde lo último. Probá en un rato.'); return; }
          await WWCuenta.salir(clave);
          if (window.WWCompras) WWCompras.olvidarCuenta();
          Estado.borrar(p.nombre); this.renderPerfiles(); this.mostrar('p-titulo');
          this.toast('Saliste de la cuenta. Tu mago te espera ahí.');
        } },
      ]);
    },

    borrarCuenta() {
      const p = Estado.perfil, clave = this.claveNube();
      this.modal(`<h3>¿BORRAR TU CUENTA?</h3><p>Se borra <b>${esc(p.nombre)}</b> con todo su progreso, en este y en todos tus dispositivos, y sus resultados en el ranking. No se puede deshacer.</p>
        <p class="cuenta-nota">Si tenés el Pase de Mago, la suscripción se cancela aparte, desde Google Play.</p>`, [
        { texto: 'Cancelar', clase: 'btn-secundario' },
        { texto: 'Borrar todo', clase: 'btn-peligro', accion: async () => {
          if (!(await WWCuenta.borrar(clave))) { this.toast('Sin conexión: no se pudo borrar. Probá de nuevo.'); return; }
          if (window.WWCompras) WWCompras.olvidarCuenta();
          Estado.borrar(p.nombre); this.renderPerfiles(); this.mostrar('p-titulo');
          this.toast('Tu cuenta se borró.');
        } },
      ]);
    },

    verAjustes() {
      const p = Estado.perfil;
      this.pintarCuenta();
      if (window.WWRecordatorio) {
        $('aj-recordatorio-fila').classList.toggle('oculto', !WWRecordatorio.disponible());
        const e = WWRecordatorio.estado(); $('aj-recordatorio').value = e.on ? String(e.hora) : '';
      }
      $('aj-sonido').checked = p.ajustes.sonido;
      $('aj-musica').checked = p.ajustes.musica;
      $('aj-vibracion').checked = p.ajustes.vibracion;
      $('aj-letra').value = String(Letra.factor());
      $('aj-grilla').checked = p.ajustes.grilla !== false;
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

    /** "Tu ritmo": días desde que empezó, días jugados, minutos por día y la curva de nivel (para medir el progreso). */
    panelRitmo(num) {
      const p = Estado.perfil, reg = p.registro || {}, dias = Object.keys(reg).sort();
      if (!dias.length) return '';
      const desde = Math.max(1, Math.round((new Date(this.hoy) - new Date(p.creado.slice(0, 10))) / 86400000) + 1);
      const min = Math.round(dias.reduce((a, k) => a + reg[k].seg, 0) / dias.length / 60);
      const ult = dias.slice(-10);
      const maxSeg = Math.max(...ult.map((k) => reg[k].seg), 60);
      const barras = ult.map((k) => `<div class="ritmo-dia" title="${k}"><i style="height:${Math.max(6, reg[k].seg / maxSeg * 100)}%"></i><b>${reg[k].nivel || ''}</b><small>${k.slice(8)}</small></div>`).join('');
      return `<div class="stats-panel"><h3>⏱️ Tu ritmo</h3>
          <div class="stats-grilla">${num(desde, 'días desde que empezaste')}${num(dias.length, 'días jugados')}${num(min + ' min', 'por día jugado')}</div>
          <div class="ritmo">${barras}</div><small class="ritmo-nota">Minutos de cada día y el nivel con que lo terminaste.</small>
        </div>`;
    },

    // ============================================================ tutorial
    /** Cómo jugar: carrusel que se desliza con el dedo (o con las flechas). alTerminar: al tocar "¡A jugar!". */
    tutorial(alTerminar) {
      const I = (n) => WWIconos.html(n);
      const fichas = (txt, clase) => `<div class="ej">${txt.split('').map((l) => `<span class="${clase || ''}">${l}</span>`).join('')}</div>`;
      const fila = (ic, b, t) => `<div class="tut-fila">${I(ic)}<div><b>${b}</b><small>${t}</small></div></div>`;
      const pasos = [
        { t: '¡HOLA! SOY SILABO', h: `<div class="tut-mago tut-saluda">${window.Silabo.mago(window.Silabo.OFICIAL)}</div><p>Soy el mago de las palabras. Te doy las letras de una palabra y vos armás todas las que puedas.</p>` },
        { t: 'ARMÁ PALABRAS', h: `${fichas(LOCAL.base)}<div class="tut-flecha">↓</div><div class="tut-arma">${LOCAL.arma.split('').map((l, i) => `<span style="--i:${i}">${l}</span>`).join('')}<em style="--i:4">✓</em></div><p>Tocá las letras y mandá con <b>Enviar</b>. Mínimo 3 letras, cada una las veces que aparece. ${LOCAL.ejemplos.map((w) => `<b data-no-t>${w}</b>`).join(', ')}… <span data-no-t>${LOCAL.y}</span> <b data-no-t>${LOCAL.base.toLowerCase()}</b>.</p>` },
        { t: 'MÁS LARGAS, MÁS PUNTOS', h: `<div class="tut-puntos"><span><b>3</b> letras <i>1</i></span><span><b>5</b> letras <i>4</i></span><span><b>7</b> letras <i>10</i></span><span class="oro">la palabra entera <i>+15</i></span></div><p>Si acertás seguido armás <b>combo</b>: desde la tercera, cada palabra vale más, hasta ×2.</p>` },
        { t: 'TRES FORMAS DE JUGAR', h: `<div class="tut-filas">${fila('calendario', 'Desafío diario', 'La misma palabra para todos, 3 minutos, una vez por día.')}${fila('torre', 'Torre Arcana', 'Subí piso por piso, vencé jefes y juntá monedas.')}${fila('vela', 'Práctica', 'Sin reloj y con pistas, para aprender.')}</div>` },
        { t: 'PODERES Y PISTAS', h: `<div class="tut-filas">${fila('pista', 'Pista', 'Te muestra cómo empieza una palabra que falta.')}${fila('arena', 'Reloj de arena', 'Suma 20 segundos.')}${fila('ojo', 'Ojo arcano', 'Revela una palabra entera (vale la mitad).')}${fila('escudo', 'Escudo', 'Un error no te corta el combo.')}</div><p>Están abajo de las letras. En la práctica son gratis; en la Torre se pagan con monedas. En el desafío del día no hay: es parejo para todos.</p>` },
        { t: 'VOLVÉ CADA DÍA', h: `<div class="tut-filas">${fila('llama', 'Racha', 'Jugá el desafío todos los días.')}${fila('vela', 'Vela de racha', 'Si un día faltás, salva tu racha.')}${fila('estrella', 'Misiones', 'Tres por día, con monedas de premio.')}</div><button class="link-reglas" id="tut-reglas">Ver las reglas completas</button>` },
      ];
      const n = pasos.length;
      this.modal(`<div class="carrusel" id="carrusel"><div class="carrusel-pista" id="carrusel-pista">${pasos.map((s) => `<section class="carrusel-paso"><h3>${s.t}</h3><div class="tutorial-paso">${s.h}</div></section>`).join('')}</div></div>
        <div class="puntitos" id="tut-puntos">${pasos.map((_, j) => `<i class="${j ? '' : 'on'}"></i>`).join('')}</div>
        <div class="fila tut-botones"><button class="btn btn-secundario" id="tut-saltar">Saltar</button><button class="btn btn-primario" id="tut-sig">Siguiente</button></div>`, []);
      const caja = $('modal-caja'), car = $('carrusel'), pista = $('carrusel-pista');
      caja.classList.add('con-carrusel');
      let i = 0;
      const ancho = () => car.clientWidth || 1;
      const poner = (px) => { pista.style.transform = `translate3d(${px}px,0,0)`; };
      const ir = (k, animar, ms) => {
        i = Math.max(0, Math.min(n - 1, k));
        pista.style.transition = animar === false ? 'none' : ms ? `transform ${ms}ms cubic-bezier(.22,.9,.3,1)` : '';
        poner(-i * ancho());
        $('tut-puntos').querySelectorAll('i').forEach((d, j) => d.classList.toggle('on', j === i));
        $('tut-sig').textContent = i === n - 1 ? '¡A jugar!' : 'Siguiente';
        $('tut-saltar').style.visibility = i === n - 1 ? 'hidden' : '';
        pista.querySelectorAll('.carrusel-paso').forEach((p, j) => p.classList.toggle('activo', j === i));
      };
      const cerrar = (jugar) => {
        $('modal').classList.add('oculto'); caja.classList.remove('con-carrusel');
        document.removeEventListener('keydown', teclas);
        removeEventListener('pointerup', soltar); removeEventListener('pointercancel', soltar); removeEventListener('resize', reubicar);
        if (jugar && alTerminar) alTerminar();
      };
      const teclas = (e) => { if (e.key === 'ArrowRight') ir(i + 1); else if (e.key === 'ArrowLeft') ir(i - 1); };
      document.addEventListener('keydown', teclas);
      $('tut-sig').addEventListener('click', () => { Audio.click(); if (i === n - 1) cerrar(true); else ir(i + 1); });
      $('tut-saltar').addEventListener('click', () => { Audio.click(); cerrar(true); });
      $('tut-reglas').addEventListener('click', () => { Audio.click(); cerrar(false); if (!alTerminar) this.mostrar('p-ayuda'); else alTerminar(); });
      // arrastre con el dedo: la pista sigue al dedo (un cuadro por refresco de pantalla) y al soltar sigue la inercia
      let x0 = 0, y0 = 0, dx = 0, arrastrando = false, horizontal = null, cuadro = 0, muestras = [];
      const pintar = () => {
        cuadro = 0;
        // en los extremos ofrece resistencia, como una goma
        const fuera = (i === 0 && dx > 0) || (i === n - 1 && dx < 0);
        const d = fuera ? Math.sign(dx) * ancho() * .3 * (1 - Math.exp(-Math.abs(dx) / (ancho() * .5))) : dx;
        poner(-i * ancho() + d);
      };
      car.addEventListener('pointerdown', (e) => {
        if (e.target.closest('button')) return;
        x0 = e.clientX; y0 = e.clientY; dx = 0; arrastrando = true; horizontal = null;
        muestras = [{ x: e.clientX, t: e.timeStamp }];
      });
      car.addEventListener('pointermove', (e) => {
        if (!arrastrando) return;
        dx = e.clientX - x0;
        // generoso con el pulgar: alcanza con que vaya más o menos de costado
        if (horizontal === null && (Math.abs(dx) > 6 || Math.abs(e.clientY - y0) > 10)) {
          horizontal = Math.abs(dx) >= Math.abs(e.clientY - y0) * .6;
          if (horizontal) { x0 = e.clientX - Math.sign(dx) * 2; dx = e.clientX - x0; pista.style.transition = 'none'; try { car.setPointerCapture(e.pointerId); } catch (err) { /* ya soltó */ } }
        }
        if (!horizontal) return;
        muestras.push({ x: e.clientX, t: e.timeStamp });
        if (muestras.length > 12) muestras.shift();
        if (!cuadro) cuadro = requestAnimationFrame(pintar);
      });
      const soltar = () => {
        if (!arrastrando) return; arrastrando = false;
        if (cuadro) { cancelAnimationFrame(cuadro); cuadro = 0; }
        if (!horizontal) return;
        // velocidad de los últimos 100 ms (px/ms): un golpe corto y rápido también pasa de página
        const b = muestras[muestras.length - 1];
        const recientes = muestras.filter((m) => b.t - m.t <= 100);
        const a = recientes.length >= 2 ? recientes[0] : muestras[Math.max(0, muestras.length - 2)];
        const v = b.t > a.t ? (b.x - a.x) / (b.t - a.t) : 0;
        let k = i;
        if (dx < -ancho() * .2 || v < -.35) k = i + 1;
        else if (dx > ancho() * .2 || v > .35) k = i - 1;
        k = Math.max(0, Math.min(n - 1, k));
        // lo que falta recorrer define la duración: con un golpe rápido, llega rápido
        const resta = Math.abs(-k * ancho() - (-i * ancho() + dx));
        const ms = Math.round(Math.max(160, Math.min(380, resta / Math.max(.8, Math.abs(v)) * 1.6)));
        if (k !== i || Math.abs(dx) > 20) Audio.click();
        ir(k, true, ms);
      };
      // se escucha en la ventana: el dedo puede soltarse fuera del carrusel
      addEventListener('pointerup', soltar);
      addEventListener('pointercancel', soltar);
      car.addEventListener('lostpointercapture', soltar);
      // si gira el celular, el paso queda en su lugar
      const reubicar = () => ir(i, false);
      addEventListener('resize', reubicar);
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
      this.pintarVida();
    },

    /** Luciérnagas del bosque (o cristales, letras, nieve, motas según el lugar). Siguen al puntero. */
    luciernagas() {
      const cv = $('luces'); if (!cv || !cv.getContext) return;
      const ctx = cv.getContext('2d');
      let W = 0, H = 0; const dpr = Math.min(2, window.devicePixelRatio || 1);
      const medir = () => { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
      medir(); addEventListener('resize', medir);
      const LETRAS = LOCAL.letras;
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
      // en celulares, menos papelitos: cada uno es una animación aparte
      const tope = matchMedia('(pointer: coarse)').matches ? 40 : 120;
      for (let i = 0; i < Math.min(n || 60, tope); i++) {
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
        if (window.WWEscena && !e.target.closest('button, input, textarea, a, label, select, .ficha, .mago, .modal-caja, .tarjeta-jugador, .misiones, .encontradas, .palabra-actual, .hud, .hud-inicio, .tabbar, .ranking, .stats, .logros-grilla, .ajustes, .ayuda')) {
          if (window.WWVida) WWVida.tocar(e.clientX, e.clientY);
          WWEscena.tocar(e.clientX);   // sin sonido: repetido en cada toque molestaba
        }
      }, { passive: true });
      document.addEventListener('keydown', () => { this.ultimaAccion = Date.now(); this._consejoDado = false; const m = activo(); if (m && m.estado === 'dormido') m.despertar(); });
      for (const k of ['titulo', 'menu', 'juego']) {
        this.magos[k].cont.addEventListener('contextmenu', (e) => e.preventDefault());   // iOS/Android: sin menú al dejarlo apretado
        this.magos[k].cont.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          Audio.despertar();
          const m = this.magos[k];
          const cosquillas = () => {
            const r = m.toque();
            ({ risa: () => Audio.risita(), giro: () => Audio.wiii(), estornudo: () => Audio.achis(), sombrerazo: () => Audio.boing(), despierta: () => Audio.boing() })[r]();
            if (k === 'juego') this.globo(azar(MENSAJES.toque[r]), 'ok');
            if (Estado.perfil) { Estado.perfil.stats.cosquillas = (Estado.perfil.stats.cosquillas || 0) + 1; }
          };
          if (k === 'juego' || !window.WWVida) return cosquillas();
          // en el título y el inicio, si lo dejás apretado hace un conjuro: mariposas que salen del sombrero
          let conjuro = false;
          const t = setTimeout(() => {
            conjuro = true;
            const sombrero = m.cont.querySelector('.sombrero'), r = (sombrero || m.cont).getBoundingClientRect();
            if (m.estado === 'dormido') m.despertar();
            m.animar('cast', 1200);
            WWVida.conjuro(r.left + r.width / 2, r.top);
          }, 450);
          const soltar = () => {
            clearTimeout(t); removeEventListener('pointerup', soltar); removeEventListener('pointercancel', soltar);
            if (!conjuro) cosquillas();
          };
          addEventListener('pointerup', soltar); addEventListener('pointercancel', soltar);
        });
      }
      setInterval(() => {
        if (document.hidden) return;
        const quieto = Date.now() - this.ultimaAccion, m = activo();
        if (!m) return;
        if ((this.pantalla === 'p-titulo' || this.pantalla === 'p-menu') && quieto > 30000 && m.estado === 'idle') { m.dormir(); Audio.ronquido(); }
        const pa = this.partida;
        // primer minuto: a quien todavía no encontró 3 palabras, Silabo le sugiere una corta si se traba (gratis)
        const novato = Estado.perfil && Estado.perfil.stats.palabras < 3;
        if (this.pantalla === 'p-juego' && pa && !pa.terminada && !pa.jefe && novato && quieto > 10000 && !this._ayudaNovato) {
          this._ayudaNovato = true; this._consejoDado = true;
          this.ayudaNovato(pa); m.animar('saludo', 900);
          return;
        }
        if (this.pantalla === 'p-juego' && pa && !pa.terminada && !pa.jefe && quieto > 15000 && !this._consejoDado) {
          this._consejoDado = true;
          this.globo(azar(MENSAJES.consejo)); m.animar('saludo', 900);
          const fs = $('fichas').querySelectorAll('.ficha:not(.usada)');
          if (fs.length) { const r = fs[Math.floor(Math.random() * fs.length)].getBoundingClientRect(); m.mirar(r.left + r.width / 2, r.top); }
        }
      }, 2000);
    },

    /** Sugerencia para el que recién empieza: una palabra corta que falta, las dos primeras letras y sus fichas brillando. */
    ayudaNovato(pa) {
      const faltan = [...pa.nucleo].filter((w) => !pa.encontradasSet.has(w) && w !== pa.base).sort((x, y) => x.length - y.length);
      const w = faltan.find((x) => x.length === 4) || faltan[0];
      if (!w) return;
      this.globo(T('Una ayudita: probá con {w}', { w: (w.slice(0, 2) + '_'.repeat(w.length - 2)).toUpperCase() }), 'ok');
      // las fichas de esa palabra, en orden, brillan un rato
      const usadas = new Set();
      for (const l of w) {
        const i = pa.fichas.findIndex((f, k) => f.l === l && !usadas.has(k));
        if (i < 0) continue;
        usadas.add(i);
        const el = $('fichas').querySelector(`[data-idx="${i}"]`);
        if (el) { el.classList.remove('sugerida'); void el.offsetWidth; el.classList.add('sugerida'); setTimeout(() => el.classList.remove('sugerida'), 2600); }
      }
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
    /** Foto de la subida en el perfil, para seguirla otro día. enPiso: el piso que se está jugando ahora. */
    guardarSubida(a, enPiso) {
      const p = Estado.perfil;
      p.subida = { piso: a.piso, vidas: a.vidas, puntajeTotal: a.puntajeTotal, palabrasTotal: a.palabrasTotal, usadas: a.usadas.slice(-60), monedas: a.monedas, jefes: a.jefes, desde: a.desde || 1, enPiso: enPiso || null, fecha: this.hoy };
      Estado.guardar();
    },

    /** Partida "de mentira" para volver al mapa con una subida guardada (o desde un checkpoint). */
    partidaTorre(arcade, retomada) {
      const base = arcade.usadas[arcade.usadas.length - 1] || '';
      const nucleo = base ? this.dic.nucleo(this.dic.derivables(base), base) : new Set();
      this.nivelSesion = Estado.perfil.nivel;
      this.partida = { modo: 'arcade', opts: {}, base, nucleo, total: nucleo.size, totalPuntos: base ? this.dic.totalPosible(nucleo, base) : 0, familias: new Set(), encontradas: [], encontradasSet: new Set(), nEnc: 0, extras: 0, puntos: 0, terminada: true, jefe: false, nombreJefe: '', arcade, retomada };
      return this.partida;
    },

    /** Botón de la Torre: retoma la subida guardada, ofrece el último checkpoint o arranca de cero. */
    entrarTorre() {
      const p = Estado.perfil, s = p.subida;
      if (s && s.vidas > 0) {
        const arcade = { piso: s.piso, vidas: s.vidas, puntajeTotal: s.puntajeTotal, palabrasTotal: s.palabrasTotal, usadas: s.usadas || [], monedas: s.monedas || 0, jefes: s.jefes || 0, desde: s.desde || 1 };
        let aviso = '';
        // se cerró la app a mitad de un piso: ese intento cuenta, pero nunca se lleva la última vida
        if (s.enPiso) {
          if (arcade.vidas > 1) { arcade.vidas -= 1; aviso = `El piso ${s.enPiso} que dejaste a medias contó como intento.`; }
          arcade.piso = s.enPiso - 1;
        }
        const pa = this.partidaTorre(arcade, 'guardada');
        pa.avisoVida = aviso;
        this.guardarSubida(arcade);
        return this.verTorre({ pa });
      }
      // quien venció jefes antes de la v2.19 no tiene checkpoint anotado: sale de su mejor piso
      const cp = p.arcade.checkpoint || (p.arcade.mejorPiso > 5 ? Math.floor((p.arcade.mejorPiso - 1) / 5) * 5 : 0);
      if (!cp) return this.verTorre();
      this.modal(`<h3>LA TORRE ARCANA</h3><div class="modal-silabo" data-pose="happy"></div><p>¿Desde dónde subís?</p><p>Último jefe vencido: <b>${esc(WW.nombreJefe(cp))}</b></p><p class="modal-nota">El puntaje de la subida cuenta desde donde arranques.</p>`, [
        { texto: `Desde el piso ${cp + 1}`, clase: 'btn-primario', accion: () => {
          const pa = this.partidaTorre({ piso: cp, vidas: CONFIG.arcade.vidas, puntajeTotal: 0, palabrasTotal: 0, usadas: [], monedas: 0, jefes: 0, desde: cp + 1 }, 'checkpoint');
          this.verTorre({ pa });
        } },
        { texto: 'Desde el piso 1', clase: 'btn-secundario', accion: () => this.verTorre() },
      ], { cerrar: true });
    },

    /** Salir a mitad de un piso: cuenta como intento (sin sacar la última vida) y la subida queda guardada. */
    dejarPiso(pa) {
      if (pa.terminada) return;
      pa.terminada = true; clearInterval(pa.timer);
      this.limpiarSeleccion(); this.limpiarEfectos();
      this.anotarTiempo(pa);
      const a = pa.arcade;
      if (a.vidas > 1) a.vidas -= 1;
      a.puntajeTotal += pa.puntos;
      a.palabrasTotal += pa.encontradas.length;
      a.piso -= 1;   // el piso que se dejó se vuelve a jugar
      this.guardarSubida(a);
      this.irMenu();
    },

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
      $('mapa-info').innerHTML = pa && pa.retomada
        ? `<b>${pa.retomada === 'checkpoint' ? `Arrancás después de ${esc(WW.nombreJefe(hecho))}` : 'Seguís tu subida'}</b><small>${pa.retomada === 'checkpoint' ? 'Vidas llenas y puntaje desde cero.' : `Llevás ${pa.arcade.puntajeTotal} pts en esta subida`}</small>${pa.avisoVida ? `<small>${pa.avisoVida}</small>` : ''}${jefeSig}`
        : pa
        ? `<b>${pa.jefe ? `¡${esc(pa.nombreJefe)} vencido!` : `¡Piso ${hecho} superado!`}</b><small>Llevás ${pa.arcade.puntajeTotal} pts en esta subida</small>${jefeSig}`
        : `<b>Subí lo más alto que puedas</b><small>Cada piso es una palabra con un objetivo de puntos. Tenés 3 vidas y cada 5 pisos hay un jefe.${p.arcade.mejorPiso ? ` Tu mejor marca: piso ${p.arcade.mejorPiso}.` : ''}</small>`;
      const hoyT = this.torreHoy();
      $('mapa-info').insertAdjacentHTML('beforeend', `<small class="mapa-tope">${WWIconos.html('moneda')} La Torre te dio ${hoyT.monedas} de ${CONFIG.topeTorre} monedas hoy${hoyT.monedas >= CONFIG.topeTorre ? ' · mañana hay más' : ''}</small>`);
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
      if (hecho === CAP && !pa.retomada) {
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
    /** opc.cerrar: suma una X arriba (para avisos donde hay que elegir pero también se puede no elegir nada). */
    modal(html, botones, opc) {
      const m = $('modal'), caja = $('modal-caja');
      caja.innerHTML = html + '<div class="fila"></div>';
      const fila = caja.querySelector('.fila:last-child');
      if (opc && opc.cerrar) {
        const x = document.createElement('button');
        x.className = 'modal-x'; x.setAttribute('aria-label', 'Cerrar'); x.innerHTML = '&times;';
        x.addEventListener('click', () => { Audio.click(); m.classList.add('oculto'); if (typeof opc.cerrar === 'function') opc.cerrar(); });
        caja.appendChild(x);
      }
      for (const b of botones || []) {
        const el = document.createElement('button');
        el.className = 'btn ' + (b.clase || 'btn-secundario'); el.textContent = b.texto;
        // "Ahora no", "Cancelar"...: lo que hace el atrás de Android
        if (b.atras || (!b.accion && (botones || []).length > 1)) el.dataset.atras = '1';
        el.addEventListener('click', () => { Audio.click(); m.classList.add('oculto'); if (b.accion) b.accion(); });
        fila.appendChild(el);
      }
      m.classList.remove('oculto');
      const hs = caja.querySelector('.modal-silabo');
      if (hs) {
        const p = Estado.perfil, mg = new Magos.Mago(hs, { paleta: hs.dataset.paleta || (p ? p.sombrero : 'turquesa'), etapa: p ? Magos.etapaPorNivel(p.nivel) : 0 });
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
