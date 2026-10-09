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

  function activo() { return !!(CONFIG.url && CONFIG.key); }

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

  async function sesion(clave) {
    const todas = leer(LS_SESIONES, {});
    let s = todas[clave];
    if (s && s.vence > Date.now() + 60000) return s;
    let nueva = s && s.refresh ? await auth('token?grant_type=refresh_token', { refresh_token: s.refresh }) : null;
    if (!nueva) nueva = await auth('signup', {});           // primera vez, o la sesión se perdió
    if (!nueva) throw new Error('sin sesión');
    s = Object.assign({}, nueva, { nombre: nueva.id === (s && s.id) ? s.nombre : null });
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
        try { listo = await mandar(item); } catch (e) { break; }   // sin conexión: se reintenta después
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

  window.WWRanking = { CONFIG, activo, enviarDiario, enviarTorre, topDiario, topSemanal, topTorre, miId, borrar, nombreOk, vaciarCola };
})();
