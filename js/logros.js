/**
 * Word Wizard — logros. Cada uno tiene una condición pura sobre el perfil y el
 * contexto del evento ({tipo:'palabra'|'fin'|'piso'|'mision', ...}).
 */
(function () {
  'use strict';

  const LOGROS = [
    { id: 'primera', icono: '🪄', nombre: 'Primer hechizo', desc: 'Encontrá tu primera palabra.', cond: (p) => p.stats.palabras >= 1 },
    { id: 'cien', icono: '📚', nombre: 'Biblioteca', desc: 'Encontrá 100 palabras en total.', cond: (p) => p.stats.palabras >= 100 },
    { id: 'quinientas', icono: '📜', nombre: 'Archivo arcano', desc: 'Encontrá 500 palabras en total.', cond: (p) => p.stats.palabras >= 500 },
    { id: 'mil', icono: '🏛️', nombre: 'Gran biblioteca', desc: 'Encontrá 1.000 palabras en total.', cond: (p) => p.stats.palabras >= 1000 },
    { id: 'completa', icono: '💎', nombre: 'Palabra completa', desc: 'Armá la palabra base entera.', cond: (p) => p.stats.completas >= 1 },
    { id: 'completa10', icono: '👑', nombre: 'Coleccionista', desc: 'Armá la palabra base entera 10 veces.', cond: (p) => p.stats.completas >= 10 },
    { id: 'siete', icono: '7️⃣', nombre: 'Siete letras', desc: 'Encontrá una palabra de 7 letras o más.', cond: (p) => p.stats.mejorLargo >= 7 },
    { id: 'nueve', icono: '9️⃣', nombre: 'Nueve letras', desc: 'Encontrá una palabra de 9 letras.', cond: (p) => p.stats.mejorLargo >= 9 },
    { id: 'veinte', icono: '🌪️', nombre: 'Torbellino', desc: '20 palabras en una sola partida.', cond: (p, c) => c.tipo === 'fin' && c.encontradas >= 20 },
    { id: 'treinta', icono: '🌊', nombre: 'Maremoto', desc: '30 palabras en una sola partida.', cond: (p, c) => c.tipo === 'fin' && c.encontradas >= 30 },
    { id: 'combo5', icono: '🔥', nombre: 'En llamas', desc: 'Combo de 5 aciertos seguidos.', cond: (p) => p.stats.mejorCombo >= 5 },
    { id: 'combo10', icono: '☄️', nombre: 'Meteoro', desc: 'Combo de 10 aciertos seguidos.', cond: (p) => p.stats.mejorCombo >= 10 },
    { id: 'diario1', icono: '📅', nombre: 'Rutina mágica', desc: 'Jugá tu primer desafío diario.', cond: (p) => Object.keys(p.diarios).length >= 1 },
    { id: 'diario7', icono: '🗓️', nombre: 'Una semana', desc: 'Jugá 7 desafíos diarios.', cond: (p) => Object.keys(p.diarios).length >= 7 },
    { id: 'diario30', icono: '📆', nombre: 'Un mes', desc: 'Jugá 30 desafíos diarios.', cond: (p) => Object.keys(p.diarios).length >= 30 },
    { id: 'racha3', icono: '🕯️', nombre: 'Tres velas', desc: 'Racha de 3 días seguidos.', cond: (p) => p.mejorRacha >= 3 },
    { id: 'racha7', icono: '🌙', nombre: 'Semana lunar', desc: 'Racha de 7 días seguidos.', cond: (p) => p.mejorRacha >= 7 },
    { id: 'racha30', icono: '🌕', nombre: 'Ciclo completo', desc: 'Racha de 30 días seguidos.', cond: (p) => p.mejorRacha >= 30 },
    { id: 'mago', icono: '🧙', nombre: 'Mago de verdad', desc: 'Llegá a rango Mago en un desafío diario.', cond: (p) => Object.values(p.diarios).some((d) => d.pct >= 28) },
    { id: 'archimago', icono: '⚡', nombre: 'Archimago', desc: 'Llegá a rango Archimago en un desafío diario.', cond: (p) => Object.values(p.diarios).some((d) => d.pct >= 40) },
    { id: 'leyenda', icono: '🌟', nombre: 'Leyenda', desc: 'Llegá a rango Leyenda en un desafío diario.', cond: (p) => Object.values(p.diarios).some((d) => d.pct >= 60) },
    { id: 'piso5', icono: '🗼', nombre: 'Quinto piso', desc: 'Llegá al piso 5 de la Torre Arcana.', cond: (p) => p.arcade.mejorPiso >= 5 },
    { id: 'piso10', icono: '🏰', nombre: 'Décimo piso', desc: 'Llegá al piso 10 de la Torre Arcana.', cond: (p) => p.arcade.mejorPiso >= 10 },
    { id: 'piso20', icono: '🌌', nombre: 'Tocar el cielo', desc: 'Llegá al piso 20 de la Torre Arcana.', cond: (p) => p.arcade.mejorPiso >= 20 },
    { id: 'jefe1', icono: '⚔️', nombre: 'Cazajefes', desc: 'Vencé a un jefe de la Torre.', cond: (p) => (p.arcade.jefes || 0) >= 1 },
    { id: 'jefe3', icono: '🛡️', nombre: 'Azote de la Torre', desc: 'Vencé a 3 jefes de la Torre.', cond: (p) => (p.arcade.jefes || 0) >= 3 },
    { id: 'nivel5', icono: '⭐', nombre: 'Nivel 5', desc: 'Alcanzá el nivel 5 de mago.', cond: (p) => p.nivel >= 5 },
    { id: 'nivel10', icono: '🌠', nombre: 'Nivel 10', desc: 'Alcanzá el nivel 10 de mago.', cond: (p) => p.nivel >= 10 },
    { id: 'nivel20', icono: '💫', nombre: 'Nivel 20', desc: 'Alcanzá el nivel 20 de mago.', cond: (p) => p.nivel >= 20 },
    { id: 'rico', icono: '💰', nombre: 'Tesoro', desc: 'Juntá 200 monedas.', cond: (p) => p.stats.monedasTotales >= 200 },
    { id: 'millonario', icono: '🏦', nombre: 'Banco arcano', desc: 'Juntá 1.000 monedas.', cond: (p) => p.stats.monedasTotales >= 1000 },
    { id: 'rapido', icono: '⏱️', nombre: 'Manos rápidas', desc: 'Encontrá una palabra en los primeros 3 segundos.', cond: (p, c) => c.tipo === 'palabra' && c.segundos <= 3 },
    { id: 'ultimo', icono: '🎯', nombre: 'Sobre la hora', desc: 'Acertá con menos de 2 segundos en el reloj.', cond: (p, c) => c.tipo === 'palabra' && c.restante != null && c.restante < 2 },
    { id: 'enie', icono: '🇦🇷', nombre: 'Con eñe', desc: 'Encontrá una palabra con ñ.', cond: (p, c) => c.tipo === 'palabra' && c.palabra.includes('ñ') },
    { id: 'practicante', icono: '🧘', nombre: 'Practicante', desc: 'Jugá 10 partidas de práctica.', cond: (p) => p.practica.partidas >= 10 },
    { id: 'misiones5', icono: '📋', nombre: 'Recadero', desc: 'Completá 5 misiones diarias.', cond: (p) => (p.stats.misiones || 0) >= 5 },
    { id: 'misiones25', icono: '🗂️', nombre: 'Cumplidor', desc: 'Completá 25 misiones diarias.', cond: (p) => (p.stats.misiones || 0) >= 25 },
    { id: 'perfecto', icono: '💯', nombre: 'Omnisciente', desc: 'Encontrá todas las palabras de una base.', cond: (p, c) => c.tipo === 'fin' && c.total > 0 && c.encontradas >= c.total },
  ];

  /** Devuelve los logros nuevos que se desbloquean con este evento. */
  function evaluar(perfil, contexto) {
    const nuevos = [];
    for (const l of LOGROS) {
      if (perfil.logros[l.id]) continue;
      let ok = false;
      try { ok = !!l.cond(perfil, contexto || {}); } catch (e) { ok = false; }
      if (ok) { perfil.logros[l.id] = new Date().toISOString(); nuevos.push(l); }
    }
    return nuevos;
  }

  window.WWLogros = { LOGROS, evaluar };
})();
