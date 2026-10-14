/**
 * Word Wizard — cuenta con Google o con un código por mail (opcional) y progreso sincronizado entre dispositivos.
 *
 * Cada mago ya tenía una cuenta anónima para el ranking (ranking.js, guardada por mago en 'ww.nube'). Entrar con
 * Google o mail le da una cuenta permanente: lo que hizo con la anónima (ranking, compras) pasa a la cuenta
 * (preparar_fusion / fusionar en la base) y su perfil se guarda en la tabla progreso. Sin conexión o sin cuenta,
 * el juego anda igual que siempre: la nube es un respaldo, nunca un requisito.
 *
 * Sincronizar: la base guarda el perfil con un número de revisión. Cada dispositivo recuerda la última revisión que
 * vio y cómo era el perfil en ese momento ('ww.cuenta.sinc'). Si la nube sigue en esa revisión, se sube lo de acá;
 * si otro dispositivo guardó en el medio, se juntan las dos versiones (Estado.fusionar) y se sube el resultado.
 * Base, reglas y pasos para configurar Google y el mail: supabase/migrations/20261013120000_cuentas.sql, docs/LOGIN.md.
 */
(function () {
  'use strict';

  const R = () => window.WWRanking;
  const LS_SINC = 'ww.cuenta.sinc', LS_PENDIENTE = 'ww.cuenta.pendiente';

  function leer(k, def) { try { return JSON.parse(localStorage.getItem(k)) || def; } catch (e) { return def; } }
  function escribir(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } }
  const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  // Cada forma de entrar se prende cuando está configurada en Supabase (docs/LOGIN.md): Google necesita el cliente de
  // Google Cloud; el mail, el SMTP propio (el de Supabase solo le manda a los dueños del proyecto).
  // Para probar antes de prenderlas: localStorage 'ww.cuenta.prueba' = '1'.
  const METODOS = { google: false, mail: false };
  // también con el link ?cuentas=prueba (queda guardado en ese dispositivo; ?cuentas=no lo saca)
  const prueba = (() => {
    try {
      const p = new URLSearchParams(location.search).get('cuentas');
      if (p === 'prueba') localStorage.setItem('ww.cuenta.prueba', '1');
      if (p === 'no') localStorage.removeItem('ww.cuenta.prueba');
      return localStorage.getItem('ww.cuenta.prueba') === '1';
    } catch (e) { return false; }
  })();
  const metodo = (m) => METODOS[m] || prueba;
  function activo() { return !!(R() && R().activo()) && (metodo('google') || metodo('mail')); }
  /** {email, proveedor, perdida} si ese mago tiene cuenta, o null. */
  function de(clave) { const s = R() && R().sesiones()[clave]; return s && s.cuenta ? Object.assign({ perdida: !!s.perdida }, s.cuenta) : null; }
  /** ¿Algún mago de este dispositivo tiene cuenta? (para no ofrecer "ya tengo cuenta" de más) */
  function hayAlguna() { const t = R() ? R().sesiones() : {}; return Object.keys(t).some((k) => t[k].cuenta); }

  async function api(ruta, opciones, token) {
    const C = R().CONFIG;
    const h = { apikey: C.key, 'Content-Type': 'application/json' };
    if (token) h.Authorization = 'Bearer ' + token;
    const res = await fetch(`${C.url}${ruta}`, Object.assign({}, opciones, { headers: Object.assign(h, opciones && opciones.headers) }));
    const texto = await res.text();
    let j = null; try { j = texto ? JSON.parse(texto) : null; } catch (e) { j = null; }
    return { ok: res.ok, status: res.status, j };
  }
  const sesionDe = (j) => j && j.access_token ? { token: j.access_token, refresh: j.refresh_token, vence: (j.expires_at || (Date.now() / 1000 + (j.expires_in || 3600))) * 1000, id: j.user && j.user.id } : null;

  // ------------------------------------------------------------ entrar
  /** El secreto con que la cuenta nueva reclama lo que hizo el mago anónimo (null si no tenía cuenta anónima). */
  async function prepararFusion(clave) {
    const s0 = clave && R().sesiones()[clave];
    if (!s0 || s0.cuenta) return null;
    try {
      const s = await R().sesion(clave);
      const r = await api('/rest/v1/rpc/preparar_fusion', { method: 'POST', body: '{}' }, s.token);
      return r.ok && typeof r.j === 'string' ? r.j : null;
    } catch (e) { return null; }
  }

  // Dos maneras de entrar:
  //  · VINCULAR (lo normal): el mago de este dispositivo ya tiene su cuenta anónima; se le agrega Google o el mail a
  //    esa MISMA cuenta. El id no cambia: su ranking, sus compras y su historia siguen siendo de él sin mover nada.
  //  · ENTRAR: cuando no hay mago acá (otro dispositivo) o ese Google / ese mail ya es de otra cuenta. Se entra a la
  //    cuenta existente y, si había un mago anónimo, lo suyo se pasa con preparar_fusion / fusionar.
  const vuelta = () => location.origin + location.pathname;
  // un mago de acá sin cuenta (si nunca mandó nada al ranking, R().sesion le crea su cuenta anónima en el momento)
  const anonima = (clave) => { if (!clave) return false; const s = R().sesiones()[clave]; return !s || !s.cuenta; };

  /** Va a la pantalla de Google; al volver, la página arranca de nuevo y App llama a alVolver(). entrar: no vincular. */
  async function google(clave, entrar) {
    if (!entrar && anonima(clave)) {
      try {
        const s = await R().sesion(clave);
        const r = await api(`/auth/v1/user/identities/authorize?provider=google&skip_http_redirect=true&redirect_to=${encodeURIComponent(vuelta())}`, { method: 'GET' }, s.token);
        if (r.ok && r.j && r.j.url) {
          escribir(LS_PENDIENTE, { clave, modo: 'vincular', id: s.id, t: Date.now() });
          location.href = r.j.url;
          return;
        }
      } catch (e) { /* sin señal o sin vincular habilitado: se entra con fusión */ }
    }
    const secreto = await prepararFusion(clave);
    escribir(LS_PENDIENTE, { clave: clave || null, modo: 'entrar', secreto, t: Date.now() });
    location.href = `${R().CONFIG.url}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(vuelta())}`;
  }

  /**
   * Manda el mail: trae un código de 6 números y también un link (si lo toca en este mismo navegador, vuelve con la
   * sesión como Google). 'ok', 'mail' (no sirve), 'espera' (pidió muchos seguidos) o 'error'.
   * Con mago anónimo, el mail se le agrega a su misma cuenta (cambio de mail); si ese mail ya es de otra cuenta, se entra.
   */
  async function pedirCodigo(email, clave) {
    const m = String(email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m)) return 'mail';
    const destino = encodeURIComponent(vuelta());
    try {
      if (anonima(clave)) {
        const s = await R().sesion(clave);
        const r = await api('/auth/v1/user?redirect_to=' + destino, { method: 'PUT', body: JSON.stringify({ email: m }) }, s.token);
        if (r.ok) { escribir(LS_PENDIENTE, { clave, modo: 'vincular', id: s.id, email: m, t: Date.now() }); return 'ok'; }
        if (r.status === 429) return 'espera';
        if (r.status === 400) return 'mail';
        // 422: ese mail ya tiene cuenta → se entra a esa cuenta (abajo)
      }
      const p = leer(LS_PENDIENTE, null);
      const secreto = p && p.modo === 'entrar' && p.clave === (clave || null) && p.secreto && Date.now() - p.t < 864e5 ? p.secreto : await prepararFusion(clave);
      escribir(LS_PENDIENTE, { clave: clave || null, modo: 'entrar', secreto, email: m, t: Date.now() });
      const r = await api('/auth/v1/otp?redirect_to=' + destino, { method: 'POST', body: JSON.stringify({ email: m, create_user: true }) });
      return r.ok ? 'ok' : r.status === 429 ? 'espera' : r.status === 400 || r.status === 422 ? 'mail' : 'error';
    } catch (e) { return 'error'; }
  }

  /** Con el código del mail: devuelve {sesion, clave, secreto, vinculo} o un error ('codigo' si está mal o venció, 'error'). */
  async function verificar(email, codigo) {
    const p = leer(LS_PENDIENTE, null) || {};
    const vinc = p.modo === 'vincular';
    try {
      const r = await api('/auth/v1/verify', { method: 'POST', body: JSON.stringify({ type: vinc ? 'email_change' : 'email', email: String(email).trim().toLowerCase(), token: String(codigo).replace(/\D/g, '') }) });
      const s = r.ok && sesionDe(r.j);
      if (!s) return { error: r.status >= 400 && r.status < 500 ? 'codigo' : 'error' };
      escribir(LS_PENDIENTE, null);
      return { sesion: s, clave: p.clave || null, secreto: p.secreto || null, vinculo: vinc };
    } catch (e) { return { error: 'error' }; }
  }

  /**
   * Si la página vuelve de Google (o del link del mail): {sesion, clave, secreto, vinculo}, o {error, yaExiste, clave}
   * si Google no dejó (yaExiste: ese Google ya es de otra cuenta). Limpia la dirección.
   */
  function alVolver() {
    const h = location.hash.slice(1), b = location.search.slice(1);
    const q = new URLSearchParams(/access_token=|error/.test(h) ? h : b);
    if (!q.get('access_token') && !q.get('error') && !q.get('error_description')) return null;
    try { history.replaceState(null, '', location.pathname); } catch (e) { /* nada */ }
    const pend = leer(LS_PENDIENTE, null) || {};
    escribir(LS_PENDIENTE, null);
    if (!q.get('access_token')) {
      const cod = q.get('error_code') || '';
      return { error: q.get('error_description') || q.get('error'), yaExiste: /identity_already_exists|already linked|already exists/i.test(cod + ' ' + q.get('error_description')), clave: pend.clave || null };
    }
    const s = sesionDe({ access_token: q.get('access_token'), refresh_token: q.get('refresh_token'), expires_at: Number(q.get('expires_at')) || 0, expires_in: Number(q.get('expires_in')) || 3600 });
    return s ? { sesion: s, clave: pend.clave || null, secreto: pend.secreto || null, vinculo: pend.modo === 'vincular' } : null;
  }

  /**
   * Termina de entrar: averigua quién es, reclama lo del mago anónimo (si había) y trae el progreso de la nube.
   * Devuelve {cuenta, nube} — nube = {datos, rev} o null si la cuenta todavía no tiene un mago guardado.
   */
  async function completar(sesion, secreto) {
    const u = await api('/auth/v1/user', { method: 'GET' }, sesion.token);
    if (!u.ok || !u.j || !u.j.id) throw new Error('sin usuario');
    sesion.id = u.j.id;
    const proveedor = (u.j.app_metadata && u.j.app_metadata.provider) || 'email';
    const cuenta = { email: u.j.email || '', proveedor: proveedor === 'google' ? 'google' : 'email' };
    if (secreto) { try { await api('/rest/v1/rpc/fusionar', { method: 'POST', body: JSON.stringify({ secreto_: secreto }) }, sesion.token); } catch (e) { /* lo del anónimo queda donde estaba */ } }
    const nube = await bajarCon(sesion.token);
    return { cuenta, nube };
  }

  /** Deja la sesión permanente como la sesión de ese mago (desde acá, el ranking y las compras van con la cuenta). */
  function vincular(clave, sesion, cuenta, nombrePublico) {
    R().guardarSesion(clave, Object.assign({}, sesion, { cuenta, perdida: false, nombre: nombrePublico || null }));
  }

  // ------------------------------------------------------------ progreso en la nube
  async function bajarCon(token) {
    const r = await api('/rest/v1/progreso?select=datos,rev', { method: 'GET' }, token);
    if (!r.ok) throw new Error('no se pudo leer');
    return r.j && r.j[0] ? { datos: r.j[0].datos, rev: r.j[0].rev } : null;
  }
  const sinc = (clave) => leer(LS_SINC, {})[clave] || null;
  function anotarSinc(clave, rev, base) { const t = leer(LS_SINC, {}); if (rev == null) delete t[clave]; else t[clave] = { rev, base }; escribir(LS_SINC, t); }

  /** Sube el perfil como revisión nueva, si la nube sigue en `rev` (0 = todavía no hay nada). true si se pudo. */
  async function subir(token, perfil, rev, keepalive) {
    const cuerpo = JSON.stringify(rev ? { datos: perfil, rev: rev + 1 } : { datos: perfil });
    const op = keepalive && cuerpo.length < 60000 ? { keepalive: true } : {};
    const r = rev
      ? await api(`/rest/v1/progreso?rev=eq.${rev}`, Object.assign({ method: 'PATCH', body: cuerpo, headers: { Prefer: 'return=representation' } }, op), token)
      : await api('/rest/v1/progreso', Object.assign({ method: 'POST', body: cuerpo, headers: { Prefer: 'return=representation' } }, op), token);
    return r.ok && Array.isArray(r.j) && r.j.length === 1;
  }

  /** Arranca el sincronizado de un mago recién vinculado: la nube queda igual a este perfil. */
  async function empezar(clave, perfil, nubeRev) {
    const s = await R().sesion(clave);
    if (!(await subir(s.token, perfil, nubeRev || 0))) throw new Error('no se pudo guardar');
    anotarSinc(clave, (nubeRev || 0) + 1, perfil);
  }
  /** El perfil de la nube pasa a ser el de este dispositivo (ya instalado con Estado.instalar). */
  function adoptar(clave, nube) { anotarSinc(clave, nube.rev, nube.datos); }

  let enCurso = null;
  /**
   * Sincroniza el mago: devuelve {perfil} si cambió acá (hay que aplicarlo), {} si no, o null si no se pudo.
   * soloSubir: durante una partida no se toca el perfil de acá; si otro dispositivo guardó en el medio, se espera.
   */
  function sincronizar(clave, perfil, opc) {
    if (!activo() || !de(clave) || enCurso) return Promise.resolve(null);
    opc = opc || {};
    enCurso = (async () => {
      const s = await R().sesion(clave);
      for (let intento = 0; intento < 3; intento++) {
        const est = sinc(clave);
        const nube = await bajarCon(s.token);
        if (!nube) { if (await subir(s.token, perfil, 0, opc.keepalive)) { anotarSinc(clave, 1, perfil); return {}; } continue; }
        if (est && nube.rev === est.rev) {
          if (igual(perfil, est.base)) return {};
          if (await subir(s.token, perfil, nube.rev, opc.keepalive)) { anotarSinc(clave, nube.rev + 1, perfil); return {}; }
          continue;
        }
        if (opc.soloSubir) return {};
        const junto = est ? window.WWEstado.fusionar(est.base, perfil, nube.datos) : window.WWEstado.fusionar(nube.datos, perfil, nube.datos);
        junto.nombre = perfil.nombre; junto.creado = perfil.creado;
        if (igual(junto, nube.datos)) { anotarSinc(clave, nube.rev, junto); return { perfil: junto }; }
        if (await subir(s.token, junto, nube.rev)) { anotarSinc(clave, nube.rev + 1, junto); return { perfil: junto }; }
      }
      return null;
    })().catch(() => null).finally(() => { enCurso = null; });
    return enCurso;
  }

  let tSubir = null;
  /** Después de guardar: sube en un rato (agrupa muchos guardados seguidos en una sola subida). */
  function programar(clave, perfilFn, ocupado) {
    if (!activo() || !de(clave)) return;
    clearTimeout(tSubir);
    tSubir = setTimeout(() => { tSubir = null; const p = perfilFn(); if (p) sincronizar(clave, p, { soloSubir: ocupado() }); }, 20000);
  }
  /** Al cerrar o mandar la app al fondo: sube ya lo pendiente. */
  function vaciar(clave, perfil) {
    if (!tSubir || !perfil) return;
    clearTimeout(tSubir); tSubir = null;
    sincronizar(clave, perfil, { soloSubir: true, keepalive: true });
  }

  // ------------------------------------------------------------ compras de la cuenta
  /** [{sku, expira}] de lo que la cuenta compró en Play y sigue vigente (para tenerlo en la compu y otros celulares). */
  async function compras(clave) {
    if (!activo() || !de(clave)) return null;
    try {
      const s = await R().sesion(clave);
      const r = await api('/rest/v1/rpc/mis_compras', { method: 'POST', body: '{}' }, s.token);
      return r.ok && Array.isArray(r.j) ? r.j.map((x) => ({ sku: x.sku, expira: x.expira ? Date.parse(x.expira) : 0 })) : null;
    } catch (e) { return null; }
  }

  // ------------------------------------------------------------ salir y borrar
  /** Cierra la sesión en este dispositivo (el progreso sigue en la cuenta). */
  async function salir(clave) {
    const s = R().sesiones()[clave];
    if (s && s.token) { try { await api('/auth/v1/logout?scope=local', { method: 'POST', body: '{}' }, s.token); } catch (e) { /* sin señal: igual se olvida acá */ } }
    R().olvidar(clave);
    anotarSinc(clave, null);
  }
  /** Borra la cuenta y todo lo suyo en la nube (progreso, ranking, nombre). false si no se pudo (sin señal). */
  async function borrar(clave) {
    const ok = await R().borrar(clave);
    if (ok) anotarSinc(clave, null);
    return ok;
  }

  window.WWCuenta = { activo, metodo, de, hayAlguna, preparar: prepararFusion, google, pedirCodigo, verificar, alVolver, completar, vincular, empezar, adoptar, sincronizar, programar, vaciar, compras, salir, borrar };
})();
