/* conta-base.js — base común de Contabilidad: Punto de equilibrio (conta-equilibrio.js) y Ventas (conta-ventas.js).
 * Paso 3 de la auditoría untangle (dueño, 08-nov-2026): lo que estaba copiado en los dos archivos vive aquí una sola vez,
 * y los dos dependen de esta base en vez de depender uno del otro. Se carga ANTES que los dos. API: window.BayolConta. */
(function () {
  'use strict';
  if (window.BayolConta) return;

  // Tiendas de Info Plus (código de localidad). domingo = abre los domingos.
  var TIENDAS = [
    { cod: 1, nombre: 'Santiago', domingo: false },
    { cod: 4, nombre: 'Moca', domingo: false },
    { cod: 7, nombre: 'Navarrete', domingo: true }
  ];
  // «Santiago, Moca y Navarrete»
  function nombresTiendas() {
    var n = TIENDAS.map(function (t) { return t.nombre; });
    return n.length > 1 ? n.slice(0, -1).join(', ') + ' y ' + n[n.length - 1] : n.join('');
  }
  var NUMEROS = ['cero', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez'];
  // «las tres tiendas»
  function lasTiendas() { return 'las ' + (NUMEROS[TIENDAS.length] || TIENDAS.length) + ' tiendas'; }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function plata(n) { return (typeof money === 'function') ? money(n) : 'RD$ ' + Number(n || 0).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function pct(n) { return isFinite(n) ? (Math.round(n * 1000) / 10).toLocaleString('es-DO', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %' : '—'; }
  function sb() { try { return supabaseClient; } catch (e) { return null; } }
  // Mismo criterio que la regla de la base (app_puede_contabilidad): admin, dueño o permiso de Contabilidad.
  function puede() { try { return (typeof isAdminUser === 'function' && isAdminUser()) || (typeof esDueno === 'function' && esDueno()) || (typeof tienePermiso === 'function' && tienePermiso('contabilidad_ver')); } catch (e) { return false; } }

  // Meses como 'AAAA-MM'.
  function sumarMes(mes, d) { var p = mes.split('-'), dt = new Date(+p[0], +p[1] - 1 + d, 1); return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0'); }
  function mesAnterior(mes) { return sumarMes(mes, -1); }
  // Rango para consultas: desde el día 1 (incluido) hasta el día 1 del mes siguiente (sin incluir).
  function periodo(mes) { return { ini: mes + '-01', fin: sumarMes(mes, 1) + '-01' }; }

  // Animaciones suaves (dueño, 07-nov-2026): las tarjetas entran en cascada y los anillos y barras crecen desde cero.
  // Solo al cambiar de pestaña, de mes o de quincena. Con «reducir movimiento» no se anima nada.
  function animar(cont) {
    try { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch (e) {}
    var piezas = cont.querySelectorAll('.pe-res-h, .pe-kpi, .pe-meta, .pe-per, .pe-pt, .pe-rk, .pe-card, .rv-card, .rv-box');
    Array.prototype.forEach.call(piezas, function (el, i) { el.style.setProperty('--pe-d', Math.min(i, 14) * 28 + 'ms'); el.classList.add('pe-in'); });
    var arcos = cont.querySelectorAll('.pe-ring circle:last-child'), barras = cont.querySelectorAll('.pe-barra i, .pe-trk > i, .pe-vq-b i, .rv-barra i');
    var finA = [], finB = [];
    Array.prototype.forEach.call(arcos, function (c) { finA.push(c.getAttribute('stroke-dasharray')); var t = (finA[finA.length - 1] || '0 0').split(' ')[1]; c.setAttribute('stroke-dasharray', '0 ' + t); });
    Array.prototype.forEach.call(barras, function (b) { finB.push(b.style.width); b.style.width = '0%'; });
    void cont.offsetWidth;
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      Array.prototype.forEach.call(arcos, function (c, i) { c.setAttribute('stroke-dasharray', finA[i]); });
      Array.prototype.forEach.call(barras, function (b, i) { b.style.width = finB[i]; });
    }); });
    setTimeout(function () { Array.prototype.forEach.call(piezas, function (el) { el.classList.remove('pe-in'); }); }, 1200);
  }

  window.BayolConta = {
    TIENDAS: TIENDAS, nombresTiendas: nombresTiendas, lasTiendas: lasTiendas,
    esc: esc, plata: plata, pct: pct, sb: sb, puede: puede,
    sumarMes: sumarMes, mesAnterior: mesAnterior, periodo: periodo, animar: animar
  };
})();
