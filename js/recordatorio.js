/**
 * Word Wizard — recordatorio diario (notificación push), opcional y apagado de entrada.
 * Se prende en Ajustes (o cuando el juego lo ofrece una vez, después del primer desafío). Un aviso por día a la hora
 * elegida, solo si ese día todavía no jugaste el desafío. El servidor (supabase/functions/recordatorio) solo "toca"
 * el celular; el texto lo arma sw.js con lo que este módulo deja en la caché 'ww-recordatorio'.
 * Anda en Android (Chrome y la app de Play) y en iPhone solo con el juego instalado en la pantalla de inicio.
 */
(function () {
  'use strict';

  // clave pública VAPID (la privada está solo en los secretos de Supabase y en .env.vapid, fuera de git)
  const VAPID = 'BOXo27wAr6HhU3HitwrgKJCY_m0J9Tyr2DfWFlFF8sXSBt4voQYK7ObCSdGdEI5LdA1IQsYkd4P0LJUteOjAAHY';
  const LS = 'ww.recordatorio';
  const HORA_DEF = 19;

  const leer = () => { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { return {}; } };
  const escribir = (d) => { try { localStorage.setItem(LS, JSON.stringify(d)); } catch (e) { /* nada */ } };
  const idioma = () => (window.WWI18n && window.WWI18n.idioma) || 'es';

  function disponible() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return false;
    if (!/^https:|^http:\/\/localhost/.test(location.href)) return false;
    return true;
  }
  /** En iPhone hay que tener el juego instalado (pantalla de inicio) para recibir avisos. */
  function pideInstalar() {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    return ios && !navigator.standalone && !(window.matchMedia && matchMedia('(display-mode: standalone)').matches);
  }

  async function rpc(fn, args) {
    const R = window.WWRanking;
    if (!R || !R.CONFIG.url) return false;
    try {
      const res = await fetch(`${R.CONFIG.url}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: R.CONFIG.key, 'Content-Type': 'application/json' }, body: JSON.stringify(args) });
      return res.ok;
    } catch (e) { return false; }
  }

  const b64aBytes = (s) => { const p = '='.repeat((4 - s.length % 4) % 4), b = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(b, (c) => c.charCodeAt(0)); };

  async function suscripcion(crear) {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub && crear) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64aBytes(VAPID) });
    return sub;
  }

  /** Datos para el texto del aviso (los lee sw.js): idioma, racha y último día jugado. */
  async function guardarDatos(extra) {
    const d = Object.assign(leer().datos || {}, extra || {}, { idioma: idioma() });
    const r = leer(); r.datos = d; escribir(r);
    try { const c = await caches.open('ww-recordatorio'); await c.put('./recordatorio.json', new Response(JSON.stringify(d), { headers: { 'Content-Type': 'application/json' } })); } catch (e) { /* sin caché */ }
  }

  /** Prende (o cambia la hora). Devuelve 'ok', 'denegado', 'instalar' o 'error'. Llamar desde un toque. */
  async function prender(hora) {
    if (!disponible()) return 'error';
    if (pideInstalar()) return 'instalar';
    const permiso = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    if (permiso !== 'granted') return 'denegado';
    try {
      const sub = await suscripcion(true);
      const h = Number.isInteger(hora) ? hora : HORA_DEF;
      const zona = (Intl.DateTimeFormat().resolvedOptions().timeZone) || '';
      const ok = await rpc('push_guardar', { p_endpoint: sub.endpoint, p_zona: zona, p_hora: h, p_idioma: idioma() });
      if (!ok) return 'error';
      const r = leer(); r.on = true; r.hora = h; r.preguntado = true; escribir(r);
      await guardarDatos();
      return 'ok';
    } catch (e) { return 'error'; }
  }

  async function apagar() {
    const r = leer(); r.on = false; r.preguntado = true; escribir(r);
    try { const sub = await suscripcion(false); if (sub) { await rpc('push_borrar', { p_endpoint: sub.endpoint }); await sub.unsubscribe(); } } catch (e) { /* nada */ }
  }

  /** Jugó el desafío de hoy: ese día no se avisa, y el próximo aviso usa la racha nueva. */
  async function jugo(fecha, racha) {
    await guardarDatos({ ultimoDiario: fecha, racha: racha || 0 });
    if (!leer().on || !disponible()) return;
    try { const sub = await suscripcion(false); if (sub) await rpc('push_jugo', { p_endpoint: sub.endpoint, p_fecha: fecha }); } catch (e) { /* nada */ }
  }

  const estado = () => { const r = leer(); return { on: !!r.on && disponible() && (!('Notification' in window) || Notification.permission === 'granted'), hora: Number.isInteger(r.hora) ? r.hora : HORA_DEF, preguntado: !!r.preguntado }; };
  function marcarPreguntado() { const r = leer(); r.preguntado = true; escribir(r); }

  window.WWRecordatorio = { disponible, pideInstalar, prender, apagar, jugo, estado, marcarPreguntado, HORA_DEF };
})();
