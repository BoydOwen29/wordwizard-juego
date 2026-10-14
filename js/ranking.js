/**
 * Word Wizard — ranking mundial con Supabase (REST, sin librerías).
 * Cada mago del dispositivo tiene su propia cuenta anónima, creada la primera vez que manda un resultado.
 * Si no hay conexión, los resultados quedan en cola y se mandan después. Sin CONFIG, el juego anda igual.
 * Tablas, reglas y vistas: supabase/migrations/. Explicación: docs/SUPABASE.md.
 */
(function () {
  'use strict';

  const CONFIG = {
    url: 'https://syvlvisokezsvkjfwalo.supabase.co',
    key: 'sb_publishable_vQ6qMxkyeKpOW0o3NgTWIg_WDcHmdvp',   // clave pública: la seguridad la dan las reglas de la base
  };
  const LS_SESIONES = 'ww.nube', LS_COLA = 'ww.nube.cola';
  // cada idioma tiene su propio desafío y su propia Torre: los rankings van separados
  const idioma = () => (window.WWI18n && window.WWI18n.idiomaDatos) || 'es';

  // desde la compu de desarrollo o un navegador automatizado (las pruebas de Playwright) no se manda nada:
  // antes de esto las pruebas llenaban el ranking de magos "Prueba". Para probarlo a propósito: localStorage 'ww.nube.local' = '1'.
  const PRUEBA = (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || navigator.webdriver) && (() => { try { return localStorage.getItem('ww.nube.local') !== '1'; } catch (e) { return true; } })();
  function activo() { return !!(CONFIG.url && CONFIG.key) && !PRUEBA; }

  function leer(k, def) { try { return JSON.parse(localStorage.getItem(k)) || def; } catch (e) { return def; } }
  function escribir(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } }

  // ------------------------------------------------------------ nombres
  // Misma lista que public.nombre_ok en la base.
  const FEAS = /(put[oa]|verga|mierda|pelotud|forro|culiad|conchatu|hdp|hijodeput|trolo|mogolic|retrasad|nazi|hitler|porno|garch|cogid|nigg|fuck|shit|bitch|pussy)/;
  const DE = 'áéíóúüñ0134578@$', A = 'aeiouunoieastbas';
  function nombreOk(n) {
    const t = String(n || '').trim();
    if (!t || t.length > 16) return false;
    const plano = [...t.toLowerCase()].map((c) => { const i = DE.indexOf(c); return i >= 0 ? A[i] : c; }).join('');
    return !FEAS.test(plano);
  }
  function nombrePublico(n, id) { const t = String(n || '').trim().slice(0, 16); return nombreOk(t) ? t : 'Mago ' + (id || '').slice(0, 4).toUpperCase(); }

  // ------------------------------------------------------------ sesiones (una cuenta anónima por mago)
  async function auth(ruta, cuerpo) {
    const res = await fetch(`${CONFIG.url}/auth/v1/${ruta}`, { method: 'POST', headers: { apikey: CONFIG.key, 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });
    if (!res.ok) return null;
    const j = await res.json();
    return { token: j.access_token, refresh: j.refresh_token, vence: (j.expires_at || 0) * 1000, id: j.user && j.user.id };
  }

  // Renovar la sesión gasta el "refresh token" (Supabase da uno nuevo y el viejo no sirve más). Si dos partes del juego
  // (o la app y una pestaña de Chrome) renovaban a la vez con el mismo, o la página se cerraba en el medio, la cuenta
  // quedaba "vencida" y había que volver a entrar (14/10). Por eso: una sola renovación por mago a la vez, con candado
  // entre pestañas (Web Locks), releyendo lo guardado adentro del candado; y "vencida" solo si Supabase dice que el
  // token no sirve (400/401/403/404). Sin señal o un error del servidor no hacen perder la cuenta: se reintenta después.
  const enCurso = {};
  const conCandado = (nombre, fn) => (navigator.locks && navigator.locks.request ? navigator.locks.request(nombre, fn) : fn());
  /** La sesión de ese mago, renovada si hace falta. opc.renovar: renovarla sí o sí y sin crear una anónima si no se puede. */
  function sesion(clave, opc) {
    const k = clave + (opc && opc.renovar ? ':r' : '');
    if (!enCurso[k]) enCurso[k] = conCandado('ww-sesion-' + clave, () => renovar(clave, opc || {})).finally(() => { delete enCurso[k]; });
    return enCurso[k];
  }
  // Si la app se abre y se cierra enseguida (un arranque fallido en Android), una renovación cortada en el medio quema
  // el token. Por eso no se renueva en los primeros segundos ni con la app en segundo plano: se espera.
  const ARRANQUE = Date.now();
  const esperarArranque = () => new Promise((listo) => {
    const ver = () => {
      const falta = 2500 - (Date.now() - ARRANQUE);
      if (falta > 0) return setTimeout(ver, falta);
      if (typeof document !== 'undefined' && document.hidden) return document.addEventListener('visibilitychange', function f() { if (!document.hidden) { document.removeEventListener('visibilitychange', f); listo(); } });
      listo();
    };
    ver();
  });
  async function renovar(clave, opc) {
    let s = leer(LS_SESIONES, {})[clave];
    if (s && !opc.renovar && s.vence > Date.now() + 60000) return s;   // otra pestaña ya la renovó
    if (s && s.refresh) { await esperarArranque(); s = leer(LS_SESIONES, {})[clave] || s; if (!opc.renovar && s.vence > Date.now() + 60000) return s; }
    let nueva = null;
    if (s && s.refresh) {
      const res = await fetch(`${CONFIG.url}/auth/v1/token?grant_type=refresh_token`, { method: 'POST', headers: { apikey: CONFIG.key, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: s.refresh }) });
      if (res.ok) {
        const j = await res.json();
        nueva = { token: j.access_token, refresh: j.refresh_token, vence: (j.expires_at || 0) * 1000, id: j.user && j.user.id };
      } else if (![400, 401, 403, 404].includes(res.status)) throw new Error('sin señal');
    }
    if (!nueva && opc.renovar) throw new Error('no se pudo renovar');
    // una cuenta con Google o mail (cuenta.js) nunca se reemplaza por una anónima: si la sesión venció del todo,
    // hay que volver a entrar (el juego lo avisa en Ajustes)
    if (!nueva && s && s.cuenta) { s.perdida = true; guardarSesion(clave, s); throw new Error('sesión vencida'); }
    if (!nueva) nueva = await auth('signup', {});           // primera vez, o la sesión se perdió
    if (!nueva) throw new Error('sin sesión');
    const mismo = s && nueva.id === s.id;
    s = Object.assign({}, mismo ? s : {}, nueva, { nombre: mismo ? s.nombre : null, perdida: false });
    const todas = leer(LS_SESIONES, {});
    todas[clave] = s;
    escribir(LS_SESIONES, todas);
    return s;
  }

  function guardarSesion(clave, s) { const todas = leer(LS_SESIONES, {}); todas[clave] = s; escribir(LS_SESIONES, todas); }

  async function rest(ruta, opciones, s) {
    const h = { apikey: CONFIG.key, 'Content-Type': 'application/json' };
    if (s) h.Authorization = 'Bearer ' + s.token;
    return fetch(`${CONFIG.url}/rest/v1/${ruta}`, Object.assign({}, opciones, { headers: Object.assign(h, opciones && opciones.headers) }));
  }

  async function asegurarNombre(clave, s, nombre) {
    const publico = nombrePublico(nombre, s.id);
    if (s.nombre === publico) return;
    const res = await rest('perfiles?on_conflict=id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify({ nombre: publico }) }, s);
    if (res.ok) { s.nombre = publico; guardarSesion(clave, s); }
  }

  // ------------------------------------------------------------ envíos (con cola si no hay señal)
  async function mandar(item) {
    const s = await sesion(item.clave);
    await asegurarNombre(item.clave, s, item.nombre);
    const d = item.datos;
    const res = item.tipo === 'diario'
      ? await rest('partidas_diario', { method: 'POST', body: JSON.stringify({ fecha: d.fecha, numero: d.numero, puntos: d.puntos, palabras: d.palabras, rango: d.rango, idioma: d.idioma || 'es' }) }, s)
      : await rest('torre?on_conflict=usuario,idioma', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify({ mejor_puntaje: d.puntaje, mejor_piso: d.piso, jefes: Math.min(d.jefes || 0, 100), idioma: d.idioma || 'es' }) }, s);
    // 409 = ya estaba cargada; otros 4xx = la base la rechaza (no tiene sentido reintentar)
    return res.ok || (res.status >= 400 && res.status < 500);
  }

  let vaciando = null;
  function vaciarCola() {
    if (!activo() || vaciando) return vaciando;
    vaciando = (async () => {
      for (const item of leer(LS_COLA, [])) {
        let listo = false;
        try { listo = await mandar(item); } catch (e) {
          // un mago con la sesión vencida no traba a los demás: lo suyo espera a que vuelva a entrar
          if (e && e.message === 'sesión vencida') continue;
          break;   // sin conexión: se reintenta después
        }
        if (listo) escribir(LS_COLA, leer(LS_COLA, []).filter((x) => x.uid !== item.uid));
      }
    })().finally(() => { vaciando = null; });
    return vaciando;
  }

  function encolar(tipo, clave, nombre, datos) {
    if (!activo()) return;
    const cola = leer(LS_COLA, []).filter((x) => !(tipo === 'torre' && x.tipo === 'torre' && x.clave === clave && (x.datos.idioma || 'es') === (datos.idioma || 'es')));
    cola.push({ uid: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), tipo, clave, nombre, datos });
    escribir(LS_COLA, cola.slice(-30));
    return vaciarCola();
  }

  /** r: {clave, nombre, fecha, numero, puntos, palabras, rango} */
  function enviarDiario(r) { return encolar('diario', r.clave, r.nombre, Object.assign({ idioma: idioma() }, r)); }
  /** r: {clave, nombre, puntaje, piso, jefes} — el mejor resultado de la Torre de ese mago */
  function enviarTorre(r) { return encolar('torre', r.clave, r.nombre, Object.assign({ idioma: idioma() }, r)); }

  // ------------------------------------------------------------ lecturas (públicas)
  async function leerVista(ruta) {
    if (!activo()) return null;
    try { const res = await rest(ruta); return res.ok ? await res.json() : null; } catch (e) { return null; }
  }
  const topDiario = (fecha, n) => leerVista(`ranking_diario?idioma=eq.${idioma()}&fecha=eq.${fecha}&select=usuario,nombre,puntos,palabras,rango&order=puntos.desc&limit=${n || 50}`);
  const topSemanal = (lunes, n) => leerVista(`ranking_semanal?idioma=eq.${idioma()}&semana=eq.${lunes}&select=usuario,nombre,puntos,dias&order=puntos.desc&limit=${n || 50}`);
  const topTorre = (n) => leerVista(`ranking_torre?idioma=eq.${idioma()}&select=usuario,nombre,mejor_puntaje,mejor_piso,jefes&order=mejor_puntaje.desc&limit=${n || 50}`);

  function miId(clave) { const s = leer(LS_SESIONES, {})[clave]; return s ? s.id : null; }

  /** Borra en la nube la cuenta de ese mago (si tenía) y lo que quedaba en cola. */
  async function borrar(clave) {
    escribir(LS_COLA, leer(LS_COLA, []).filter((x) => x.clave !== clave));
    const todas = leer(LS_SESIONES, {});
    if (!todas[clave] || !activo()) return true;
    try {
      const s = await sesion(clave);
      const res = await rest('rpc/borrar_mis_datos', { method: 'POST', body: '{}' }, s);
      if (!res.ok) return false;
    } catch (e) { return false; }
    delete todas[clave];
    escribir(LS_SESIONES, todas);
    return true;
  }

  if (activo()) {
    window.addEventListener('online', vaciarCola);
    setTimeout(vaciarCola, 4000);
  }

  // lo que usa cuenta.js (login con Google o mail sobre la misma sesión)
  const sesiones = () => leer(LS_SESIONES, {});
  /** Se olvida la sesión de ese mago en este dispositivo (salir de la cuenta) y lo que tenía en cola. */
  function olvidar(clave) { const t = sesiones(); delete t[clave]; escribir(LS_SESIONES, t); escribir(LS_COLA, leer(LS_COLA, []).filter((x) => x.clave !== clave)); }
  window.WWRanking = { CONFIG, activo, enviarDiario, enviarTorre, topDiario, topSemanal, topTorre, miId, borrar, nombreOk, vaciarCola, sesion, sesiones, guardarSesion, olvidar, rest, auth, nombrePublico };
})();
