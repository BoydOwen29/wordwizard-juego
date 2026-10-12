/**
 * Word Wizard — compras con Google Play (Pase de Mago y trajes especiales).
 * Solo andan dentro de la app de Android (TWA con Play Billing): ahí existe la Digital Goods API.
 * En la web, disponible() da false y el juego muestra "desde la app de Android".
 *
 * Lo que el jugador tiene lo dice Play (listPurchases), no la base: así una compra vuelve sola al reinstalar o
 * al cambiar de celular con la misma cuenta de Google, sin registro. Lo último que dijo Play queda en
 * localStorage para jugar sin conexión. Cada compra pasa por supabase/functions/validar-compra, que le pregunta
 * a Google si es real y la reconoce (si no se reconoce en 3 días, Google la devuelve). Detalle en docs/PASE.md.
 */
(function () {
  'use strict';

  const PLAY = 'https://play.google.com/billing';
  const PASE = ['pase_mensual', 'pase_anual'];
  const LS = 'ww.derechos';
  const SIN_SENAL = 4 * 864e5;   // sin poder preguntarle a Play, la suscripción sigue valiendo 4 días desde la última vez

  let servicio = null, listo = null;

  function leer() { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { return {}; } }
  function escribir(d) { try { localStorage.setItem(LS, JSON.stringify(d)); } catch (e) { /* sin almacenamiento */ } }

  function iniciar() {
    if (!listo) listo = (async () => {
      if (!('getDigitalGoodsService' in window)) return null;
      try { servicio = await window.getDigitalGoodsService(PLAY); } catch (e) { servicio = null; }
      return servicio;
    })();
    return listo;
  }

  async function disponible() { return !!(await iniciar()); }

  /** Un monto en la moneda del jugador, como lo escribe su celular ("$ 2.399", "US$ 1,99", "R$ 9,90"). */
  function formato(valor, moneda) {
    try { return new Intl.NumberFormat(navigator.language || 'es', { style: 'currency', currency: moneda, currencyDisplay: 'narrowSymbol', maximumFractionDigits: Number.isInteger(valor) ? 0 : 2 }).format(valor); } catch (e) { return moneda + ' ' + valor; }
  }

  /** {sku: {titulo, precio, valor, moneda}} con el precio de Play en la moneda del jugador. */
  async function precios(skus) {
    if (!(await iniciar())) return {};
    const out = {};
    try {
      for (const it of await servicio.getDetails(skus)) {
        const valor = Number(it.price.value);
        out[it.itemId] = { titulo: it.title, precio: formato(valor, it.price.currency), valor, moneda: it.price.currency };
      }
    } catch (e) { /* sin señal: sin precios */ }
    return out;
  }

  function tiene(sku) {
    const d = leer()[sku];
    return !!d && (!d.vence || d.vence > Date.now());
  }
  function tienePase() { return PASE.some(tiene); }

  async function validar(sku, token, usuario) {
    const R = window.WWRanking;
    if (!R || !R.CONFIG.url) return null;
    try {
      const res = await fetch(`${R.CONFIG.url}/functions/v1/validar-compra`, {
        method: 'POST', headers: { apikey: R.CONFIG.key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku, token, usuario: usuario || null }),
      });
      // solo un "valido" explícito de la función cuenta; cualquier otra cosa (sin señal, función caída) = no se pudo preguntar
      const j = await res.json().catch(() => null);
      return j && typeof j.valido === 'boolean' ? j : null;
    } catch (e) { return null; }
  }

  /** Lo que Play dice que tiene este celular. Reemplaza lo guardado (si canceló, se va) y valida cada compra. */
  async function restaurar(usuario) {
    if (!(await iniciar())) return false;
    let lista;
    try { lista = await servicio.listPurchases(); } catch (e) { return false; }
    const antes = leer(), d = {};
    for (const p of lista) {
      d[p.itemId] = { token: p.purchaseToken, vence: PASE.includes(p.itemId) ? Date.now() + SIN_SENAL : 0 };
    }
    escribir(d);
    for (const p of lista) {
      const r = await validar(p.itemId, p.purchaseToken, usuario);
      if (r && r.valido === false) { const x = leer(); delete x[p.itemId]; escribir(x); }
    }
    return JSON.stringify(Object.keys(antes).sort()) !== JSON.stringify(Object.keys(d).sort());
  }

  /** Abre el cobro de Play. Devuelve 'ok', 'cancelado' o 'error'. */
  async function comprar(sku, usuario) {
    if (!(await iniciar())) return 'error';
    let resp;
    try {
      const pedido = new PaymentRequest([{ supportedMethods: PLAY, data: { sku } }], { total: { label: 'Total', amount: { currency: 'USD', value: '0' } } });
      resp = await pedido.show();
    } catch (e) { return e && e.name === 'AbortError' ? 'cancelado' : 'error'; }
    const token = resp.details && resp.details.purchaseToken;
    const r = token ? await validar(sku, token, usuario) : { valido: false };
    if (r && r.valido === false) { try { await resp.complete('fail'); } catch (e) { /* ya cerró */ } return 'error'; }
    // sin señal con el servidor: la compra es de Play igual; se valida (y reconoce) en la próxima apertura
    const d = leer(); d[sku] = { token, vence: PASE.includes(sku) ? Date.now() + SIN_SENAL : 0 }; escribir(d);
    try { await resp.complete('success'); } catch (e) { /* ya cerró */ }
    return 'ok';
  }

  window.WWCompras = { PASE, iniciar, disponible, precios, formato, tiene, tienePase, restaurar, comprar };
})();
