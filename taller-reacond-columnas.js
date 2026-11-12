/* BAYOL CELL · taller · Reacondicionados «Columnas» (12-nov-2026; dueño: idea del reel «Glassy Dashboard V31», vio la muestra
 * y dijo «como está pero todo curvo como se ve en el video»).
 * Dentro de un lote, los teléfonos se ven por columnas, una por paso: Recibido → Diagnosticado → En reparación → Calidad →
 * Listo → Despachado. Cada columna dice cuántos tiene (y cuánto suman, solo el administrador). Arriba, 5 cifras del lote:
 * en el taller, movidos hoy (comparado con ayer), días promedio en reparación, listos sin despachar y lo invertido (admin).
 * Botón «Lista / Columnas» para volver a la lista de siempre (se recuerda en ese equipo: bc_reacond_vista).
 * Las tarjetas son las MISMAS de la lista (renderEquipoReacondCard), en tamaño compacto: tocar una abre su ficha al costado
 * (taller-reacond-costado.js) con sus funciones; la casilla, los permisos y los datos no cambian. Respeta los filtros y la
 * búsqueda del lote; en columnas no hay páginas (se ven todos). Solo cambia cómo se ve.
 * Apagar: localStorage.bc_reacond_columnas_off = '1'  ·  window.BC_REACOND_COLUMNAS = false
 */
(function(){'use strict';
if (window.BayolReacondColumnas) return;
try { if (window.BC_REACOND_COLUMNAS === false || localStorage.getItem('bc_reacond_columnas_off') === '1') return; } catch(_){}
var VERSION = '20261112c';
var COLS = [
  ['Recibido', ['pendiente', 'en_evaluacion'], '#94a3b8'],
  ['Diagnosticado', ['evaluado'], '#3b82f6'],
  ['En reparación', ['en_proceso', 'tecnico_recibio', 'espera_pieza', 'reasignado', 'reparacion_externa'], '#f97316'],
  ['Calidad', ['listo_revision'], '#8b5cf6'],
  ['Listo', ['listo_venta'], '#16a34a'],
  ['Despachado', ['vendido'], '#0d9488']
];
var MAX = 8;                 // tarjetas a la vista por columna; «+N más» abre el resto
var abiertas = {};           // columnas que el usuario abrió completas
var hoyCache = { lote: '', t: 0, v: null };

function esc(s){ return (typeof escapeHtml === 'function') ? escapeHtml(s == null ? '' : String(s)) : String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]; }); }
function admin(){ try { return !!isAdminUser(); } catch(_) { return false; } }
function vista(){ try { return localStorage.getItem('bc_reacond_vista') === 'lista' ? 'lista' : 'columnas'; } catch(_) { return 'columnas'; } }
function ponerVista(v){ try { localStorage.setItem('bc_reacond_vista', v); } catch(_){} }
function plata(n){ return 'RD$ ' + Math.round(Number(n) || 0).toLocaleString('en-US'); }
function costoDe(e){ var f = 0; try { f = calcularFleteEquipo(e); } catch(_){} return (Number(e.costo_compra) || 0) + (Number(e.costo_repuestos) || 0) + (Number(f) || 0); }
function suma(arr){ return arr.reduce(function(s, e){ return s + costoDe(e); }, 0); }
function dias(f){ var t = new Date(f || 0).getTime(); return t ? Math.max(0, Math.floor((Date.now() - t) / 86400000)) : 0; }
function loteId(){ try { return reacondLoteAbiertoId || ''; } catch(_) { return ''; } }
function visibles(){ try { return (_reacondVisibleEquipos || []).slice(); } catch(_) { return []; } }
function sb(){ try { return supabaseClient; } catch(_) { return null; } }

function estilos(){
  if (document.getElementById('rcoStyles')) return;
  var R = 'html body #app #v-refurb #reacondEquiposLista.rco-on';
  var st = document.createElement('style'); st.id = 'rcoStyles'; st.textContent =
  '.rco-vista{display:inline-flex;gap:4px;padding:4px;border-radius:999px;background:rgba(241,245,249,.9);border:1px solid rgba(15,23,42,.08);margin:0 0 12px;}' +
  '.rco-vista button{min-height:40px;padding:0 16px;border-radius:999px;border:0;background:transparent;color:#475569;font-weight:700;font-size:14px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;touch-action:manipulation;}' +
  '.rco-vista button[aria-pressed="true"]{background:#fff;color:#0f172a;box-shadow:0 2px 8px rgba(15,23,42,.10);}' +
  '.rco-vista button:focus-visible{outline:3px solid #93c5fd;outline-offset:2px;}' +
  R + '{display:block !important;grid-template-columns:none !important;}' +
  '.rco-res{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin:0 0 14px;}' +
  '.rco-res>div{background:linear-gradient(180deg,rgba(255,255,255,.92),rgba(255,255,255,.72));-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.9);box-shadow:0 10px 30px -18px rgba(15,23,42,.35),inset 0 1px 0 #fff;border-radius:26px;padding:14px 18px;min-width:0;}' +
  '.rco-res small{display:block;font-size:12.5px;color:#64748b;font-weight:600;}.rco-res b{display:block;font-size:24px;font-weight:800;color:#0f172a;font-variant-numeric:tabular-nums;line-height:1.25;overflow-wrap:anywhere;}' +
  '.rco-res em{font-style:normal;font-size:12px;font-weight:700;color:#64748b;}.rco-res em.up{color:#16a34a;}.rco-res em.dn{color:#dc2626;}' +
  '.rco{display:grid;grid-template-columns:repeat(6,minmax(176px,1fr));gap:12px;align-items:start;overflow-x:auto;overscroll-behavior-x:contain;scroll-snap-type:x proximity;padding:2px 2px 10px;}.rco-col{scroll-snap-align:start;}' +
  '.rco-col{background:linear-gradient(180deg,rgba(241,245,249,.85),rgba(241,245,249,.6));-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.85);box-shadow:inset 0 1px 0 rgba(255,255,255,.9);border-radius:28px;padding:10px;display:flex;flex-direction:column;gap:8px;min-width:0;}' +
  '.rco-h{display:flex;align-items:center;gap:7px;padding:6px 6px 8px;}' +
  '.rco-h i{width:10px;height:10px;border-radius:50%;flex:none;box-shadow:0 0 0 4px rgba(255,255,255,.8);}' +
  '.rco-h b{font-size:13.5px;font-weight:800;color:#0f172a;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
  '.rco-h small{flex:none;font-weight:800;color:#0f172a;background:#fff;border-radius:999px;padding:2px 10px;font-size:12.5px;box-shadow:0 2px 6px rgba(15,23,42,.08);}' +
  '.rco-h span{display:block;width:100%;font-size:12.5px;color:#64748b;font-weight:700;font-variant-numeric:tabular-nums;margin-top:-2px;}' +
  '.rco-hw{display:flex;flex-wrap:wrap;align-items:center;}' +
  '.rco-vacio{font-size:12.5px;color:#94a3b8;text-align:center;padding:14px 0;border:1.5px dashed rgba(148,163,184,.45);border-radius:20px;}' +
  '.rco-mas{min-height:44px;border-radius:999px;border:0;background:rgba(255,255,255,.85);color:#1d4ed8;font-weight:800;font-size:13px;cursor:pointer;}' +
  // tarjeta propia, curva y limpia; adentro va escondida la tarjeta de siempre (la ficha al costado y «Abrir» la usan)
  '.rco-card{position:relative;display:flex;flex-direction:column;gap:3px;padding:12px 14px;border-radius:22px;background:rgba(255,255,255,.97);border:1px solid rgba(15,23,42,.06);box-shadow:0 6px 18px -12px rgba(15,23,42,.35);cursor:pointer;min-width:0;text-align:left;transition:transform 160ms cubic-bezier(.23,1,.32,1),box-shadow 160ms ease;outline:none;}' +
  '.rco-card:hover{transform:translateY(-2px);box-shadow:0 12px 24px -14px rgba(15,23,42,.45);}' +
  '.rco-card:focus-visible{box-shadow:0 0 0 3px #93c5fd;}.rco-card.rcs-act{box-shadow:0 0 0 2px #2563eb,0 12px 24px -14px rgba(37,99,235,.5);}' +
  '.rco-m{font-size:13.5px;font-weight:800;line-height:1.25;color:#0f172a;overflow-wrap:anywhere;}' +
  '.rco-s{font-size:11.5px;color:#64748b;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
  '.rco-ch{display:flex;flex-wrap:wrap;gap:4px;margin-top:2px;}.rco-ch span{font-size:10.5px;font-weight:800;padding:2px 9px;border-radius:999px;background:#f1f5f9;color:#334155;}' +
  '.rco-ch span.rojo{background:#fee2e2;color:#b91c1c;}.rco-ch span.amarillo{background:#fef3c7;color:#92400e;}.rco-ch span.azul{background:#dbeafe;color:#1e40af;}' +
  '.rco-f{display:flex;align-items:center;gap:7px;margin-top:5px;min-width:0;}' +
  '.rco-av{width:24px;height:24px;border-radius:50%;flex:none;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#fff;font-size:10px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;}' +
  '.rco-av.no{background:#e2e8f0;color:#64748b;}' +
  '.rco-t{font-size:12px;font-weight:700;color:#334155;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;}' +
  '.rco-d{font-size:11.5px;font-weight:700;color:#64748b;white-space:nowrap;}.rco-card.rco-viejo .rco-d{color:#b91c1c;}' +
  R + ' .rco-orig{display:none !important;}' +
  '@media (max-width:900px){.rco-res{grid-template-columns:repeat(2,minmax(0,1fr));}.rco-res>div:last-child:nth-child(odd){grid-column:1/-1;}' +
    '.rco{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;padding:2px 2px 10px;gap:10px;}.rco-col{flex:0 0 82%;scroll-snap-align:start;}}' +
  '@media (prefers-reduced-motion:reduce){.rco-card{transition:none;}}' +
  '@media (prefers-reduced-transparency:reduce){.rco-res>div,.rco-col{-webkit-backdrop-filter:none;backdrop-filter:none;background:#f8fafc;}}';
  document.head.appendChild(st);
}

/* Botón «Lista / Columnas» arriba de la lista del lote */
function ponerSelector(){
  var L = document.getElementById('reacondEquiposLista'); if (!L) return;
  var b = document.getElementById('rcoVista');
  if (!b) {
    b = document.createElement('div'); b.id = 'rcoVista'; b.className = 'rco-vista'; b.setAttribute('role', 'group'); b.setAttribute('aria-label', 'Cómo ver los equipos');
    b.innerHTML = '<button type="button" data-v="lista"><i class="ti ti-list" aria-hidden="true"></i>Lista</button><button type="button" data-v="columnas"><i class="ti ti-layout-columns" aria-hidden="true"></i>Columnas</button>';
    b.addEventListener('click', function(ev){ var x = ev.target.closest && ev.target.closest('[data-v]'); if (!x) return; ponerVista(x.getAttribute('data-v')); try { renderDetalleLoteReacond(); } catch(_){} });
    L.parentNode.insertBefore(b, L);
  }
  var v = vista(); b.querySelectorAll('[data-v]').forEach(function(x){ x.setAttribute('aria-pressed', x.getAttribute('data-v') === v ? 'true' : 'false'); });
}

/* Después de que el sistema pinta la lista (con sus filtros), se rearma en columnas. */
function pintar(){
  var L = document.getElementById('reacondEquiposLista'); if (!L) return;
  estilos(); ponerSelector();
  var pg = document.getElementById('reacondEquiposPagination');
  if (vista() !== 'columnas' || !L.querySelector('.bcf-card')) { L.classList.remove('rco-on'); if (pg) pg.style.display = ''; return; }
  var id = loteId(), lote = [], E = visibles();
  try { lote = (cache.refurb || []).filter(function(r){ return r.lote_id === id; }); } catch(_){}
  if (!E.length) return;
  var num = {}; lote.forEach(function(e, i){ num[e.id] = i + 1; });
  var ad = admin();
  var dentro = E.filter(function(e){ return e.estado_evaluacion !== 'vendido'; });
  var rep = E.filter(function(e){ return COLS[2][1].indexOf(e.estado_evaluacion) >= 0; });
  var prom = rep.length ? Math.round(rep.reduce(function(s, e){ return s + dias(e.fecha_asignacion || e.creado_en); }, 0) / rep.length) : 0;
  var listos = E.filter(function(e){ return e.estado_evaluacion === 'listo_venta'; });
  var tiles = [
    '<div><small>En el taller</small><b>' + dentro.length + '</b><em>de ' + E.length + (E.length === lote.length ? ' del lote' : ' a la vista') + '</em></div>',
    '<div id="rcoHoy"><small>Movidos hoy</small><b>…</b><em>&nbsp;</em></div>',
    '<div><small>Días en reparación</small><b>' + prom + '</b><em>promedio de ' + rep.length + '</em></div>',
    '<div><small>Listos sin despachar</small><b>' + listos.length + '</b><em class="' + (listos.length ? 'dn' : '') + '">' + (ad && listos.length ? plata(suma(listos)) : (listos.length ? 'por despachar' : 'al día')) + '</em></div>'
  ];
  if (ad) tiles.push('<div><small>Invertido en el taller</small><b>' + plata(suma(dentro)) + '</b><em>sin contar lo despachado</em></div>');
  var cols = COLS.map(function(c, ci){
    var arr = E.filter(function(e){ return c[1].indexOf(e.estado_evaluacion || 'pendiente') >= 0; });
    var ver = abiertas[ci] ? arr : arr.slice(0, MAX);
    return '<section class="rco-col" aria-label="' + esc(c[0]) + ': ' + arr.length + '"><div class="rco-h rco-hw"><i style="background:' + c[2] + '"></i><b>' + esc(c[0]) + '</b><small>' + arr.length + '</small>' +
      (ad ? '<span>' + plata(suma(arr)) + '</span>' : '') + '</div>' +
      (arr.length ? ver.map(function(e){ return tarjeta(e, num[e.id] || 0); }).join('') : '<div class="rco-vacio">Ninguno</div>') +
      (arr.length > ver.length ? '<button type="button" class="rco-mas" data-col="' + ci + '">+' + (arr.length - ver.length) + ' más</button>' : '') + '</section>';
  }).join('');
  L.classList.add('rco-on');
  L.innerHTML = '<div class="rco-res" style="--n:' + tiles.length + '">' + tiles.join('') + '</div><div class="rco">' + cols + '</div>';
  if (pg) pg.style.display = 'none';
  L.querySelectorAll('.rco-card').forEach(function(card){
    // Sin la ficha al costado, tocar la tarjeta hace lo de siempre (la ventana del equipo)
    card.addEventListener('click', function(ev){ if (ev.target.closest('.rco-orig')) return;
      // La ficha al costado ya lo atendió (se abre antes, en la captura del clic): no abrir además la ventana.
      try { var C = window.BayolReacondCostado; if (C && C.abierto && C.abierto() === card.getAttribute('data-eq')) return; } catch(_){}
      var o = card.querySelector('.rco-orig .bcf-abrir') || card.querySelector('.rco-orig .bcf-card'); if (o) o.click(); });
    card.addEventListener('keydown', function(ev){ if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); card.click(); } });
  });
  L.querySelectorAll('.rco-mas').forEach(function(b){ b.onclick = function(ev){ ev.stopPropagation(); abiertas[b.getAttribute('data-col')] = true; pintar(); }; });
  try { if (typeof pintarChipsReacond === 'function') pintarChipsReacond(); } catch(_){}
  hoy(E);
}
/* «Movidos hoy»: cambios registrados en el historial hoy y ayer (hora de RD) para los equipos a la vista. */
async function hoy(E){
  var box = document.getElementById('rcoHoy'); if (!box) return;
  var ids = E.map(function(e){ return e.id; }), clave = loteId() + ':' + ids.length;
  var poner = function(v){ var b = document.getElementById('rcoHoy'); if (!b) return; if (!v) { b.querySelector('b').textContent = '—'; b.querySelector('em').innerHTML = '&nbsp;'; return; }
    var d = v.hoy - v.ayer; b.querySelector('b').textContent = v.hoy; var em = b.querySelector('em'); em.className = d > 0 ? 'up' : d < 0 ? 'dn' : ''; em.textContent = d > 0 ? '↑ ' + d + ' más que ayer' : d < 0 ? '↓ ' + (-d) + ' menos que ayer' : 'igual que ayer'; };
  if (hoyCache.lote === clave && Date.now() - hoyCache.t < 60000) return poner(hoyCache.v);
  if (!sb() || !ids.length) return poner(null);
  var rd = new Date(Date.now() - 4 * 3600000); rd.setUTCHours(0, 0, 0, 0);
  var iniHoy = new Date(rd.getTime() + 4 * 3600000), iniAyer = new Date(iniHoy.getTime() - 86400000);
  try {
    var filas = [];
    for (var i = 0; i < ids.length; i += 150) {
      var r = await sb().from('equipo_historial').select('equipo_id, fecha').in('equipo_id', ids.slice(i, i + 150)).gte('fecha', iniAyer.toISOString());
      if (r.error) throw r.error; filas = filas.concat(r.data || []);
    }
    var v = { hoy: 0, ayer: 0 };
    filas.forEach(function(h){ var t = new Date(h.fecha).getTime(); if (t >= iniHoy.getTime()) v.hoy++; else if (t >= iniAyer.getTime()) v.ayer++; });
    hoyCache = { lote: clave, t: Date.now(), v: v }; poner(v);
  } catch(_) { poner(null); }
}

/* Tarjeta compacta: los datos salen de la MISMA tarjeta de la lista (que va escondida adentro). */
function tarjeta(e, n){
  var html = ''; try { html = renderEquipoReacondCard(e, n); } catch(_){}
  var t = document.createElement('template'); t.innerHTML = html; var o = t.content.querySelector('.bcf-card');
  var tx = function(sel){ var x = o && o.querySelector(sel); return x ? (x.textContent || '').replace(/\s+/g, ' ').trim() : ''; };
  var mod = (tx('.bcf-tit') || e.modelo || 'Equipo').replace(/^CELULAR\s+/i, ''), cap = String(e.capacidad || '');
  if (cap && mod.toUpperCase().indexOf(cap.toUpperCase()) < 0) mod += ' ' + cap;
  var tec = ''; try { tec = e.tecnico_asignado_id ? (nombreEmpleado(e.tecnico_asignado_id) || '') : ''; } catch(_){}
  var ini = tec ? tec.split(' ').filter(Boolean).slice(0, 2).map(function(x){ return x[0]; }).join('') : '';
  var pie = o ? o.querySelectorAll('.bcf-f > *') : [], dias = pie.length ? (pie[pie.length - 1].textContent || '').trim() : '';
  var chips = o ? Array.prototype.slice.call(o.querySelectorAll('.bcf-chip')).map(function(c){ var k = (c.className.match(/bcf-t-(\w+)/) || [])[1] || ''; return '<span class="' + esc(k) + '">' + esc(c.textContent.trim()) + '</span>'; }).join('') : '';
  var viejo = o && o.classList.contains('bcf-alerta');
  var color = ''; try { color = _eqColorReal(e); } catch(_) { color = ''; }
  return '<div class="rco-card' + (viejo ? ' rco-viejo' : '') + '" data-eq="' + esc(e.id) + '" tabindex="0" role="button" aria-label="' + esc(mod + ', IMEI ' + (e.imei || '')) + '">' +
    '<b class="rco-m">' + esc(mod) + '</b><span class="rco-s">#' + n + ' · IMEI …' + esc(String(e.imei || '').slice(-5)) + (color ? ' · ' + esc(color) : '') + '</span>' +
    (chips ? '<div class="rco-ch">' + chips + '</div>' : '') +
    '<div class="rco-f"><span class="rco-av' + (tec ? '' : ' no') + '">' + (ini ? esc(ini) : '—') + '</span><span class="rco-t">' + esc(tec ? tec.split(' ').slice(0, 2).join(' ') : 'Sin técnico') + '</span><span class="rco-d">' + esc(dias) + '</span></div>' +
    '<div class="rco-orig" aria-hidden="true">' + html + '</div></div>';
}

function envolver(){
  var o = window.renderDetalleLoteReacond; if (typeof o !== 'function' || o.__rco) return;
  var w = function(){ var r = o.apply(this, arguments); try { pintar(); } catch(e){ try { console.warn('[columnas]', e); } catch(_){} } return r; };
  w.__rco = true; w.__rcu = o.__rcu; w.__bcf = o.__bcf; window.renderDetalleLoteReacond = w;
}
envolver();
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', envolver);
setTimeout(envolver, 1500); setTimeout(envolver, 5000); // otras capas se cargan después y envuelven también

window.BayolReacondColumnas = { version: VERSION, pintar: pintar, vista: vista };
})();
