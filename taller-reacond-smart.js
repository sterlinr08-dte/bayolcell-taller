/* BAYOL CELL · taller · Reacondicionados «smart» (14 oct 2026, pedido del dueño: «que el proceso sea más rápido y eficiente»).
 *  1) Tablero de atascados: arriba de la lista de lotes, 4 tarjetas con lo que lleva días parado
 *     (evaluados sin técnico · reparación de más de 7 días · esperando control de calidad · listos sin despachar).
 *  2) Colas rápidas:
 *     - «Repartir evaluados»: sugiere el técnico (menos carga + experiencia con ese modelo) y asigna todo de una vez.
 *     - «Revisar terminados»: control de calidad uno tras otro (Aprobar / Devolver al técnico / Saltar).
 *  3) Despachar listos en bloque: marcar todos los Listo de uno o varios lotes como Despachado, moviéndolos en
 *     Info Plus con el despacho de siempre (por modelo, costo promedio, con IMEI) o solo en el taller.
 * Capa aislada: no cambia ids, onclick ni la lógica de siempre; usa las mismas tablas y los mismos pasos
 * (equipos_refurbish + equipo_historial + asignarFallasSinDueno + _descontarPiezasAlCompletar + despacharTelefonosSeleccionados).
 * 24-oct-2026 (auditoría R02/R04): el envoltorio de _despTelConfirmar ya NO marca equipos por su cuenta; el cierre en el
 * taller lo hace _despTelConfirmar (taller-app.js) con los IDs realmente enviados y devuelve { ok, documento, ids }.
 * Aquí solo se descuentan las piezas pendientes de esos ids (como marcarDespachado) y se refresca la vista.
 * Solo administración (o permiso piezas_aprobar_extra). API: window.BayolReacondSmart
 */
(function(){'use strict';
if (window.BayolReacondSmart) return;
var VERSION = '20261024r1'; // 24-oct-2026 (auditoría R02/R04): el despacho de Info Plus ya cierra los equipos en taller-app.js
var REPARACION = ['en_proceso','tecnico_recibio','espera_pieza','reasignado','reparacion_externa'];
var DIAS_LENTO = 7;
function esc(s){ return (typeof escapeHtml === 'function') ? escapeHtml(s == null ? '' : String(s)) : String(s == null ? '' : s); }
function ok(m){ try { toast(m); } catch(_){} }
function mal(m){ try { toastError(m); } catch(_){} }
function sb(){ try { return supabaseClient; } catch(_) { return null; } }
function puede(){ try { return isAdminUser() || tienePermiso('piezas_aprobar_extra'); } catch(_) { return false; } }
function puedeDespachar(){ try { return isAdminUser() || tienePermiso('estado_despachar'); } catch(_) { return false; } }
function usuario(){ try { return (sessionUser && sessionUser.nombre) || 'Admin'; } catch(_) { return 'Admin'; } }
function modelo(e){ try { return _modeloRep(e) || e.modelo || 'Equipo'; } catch(_) { return e.modelo || 'Equipo'; } }
function nomTec(id){ try { return id ? nombreEmpleado(id) : ''; } catch(_) { return ''; } }
function lotes(){ try { return cache.lotes || []; } catch(_) { return []; } }
function equipos(){
  try {
    var enReacond = {}; lotes().forEach(function(l){ if (l.enviado_reacond === true) enReacond[l.id] = l; });
    return (cache.refurb || []).filter(function(e){ return enReacond[e.lote_id]; });
  } catch(_) { return []; }
}
function loteDe(e){ var l = lotes().find(function(x){ return x.id === e.lote_id; }); return l ? (l.codigo_lote || l.nombre || 'Lote') : 'Lote'; }
function tecnicos(){
  try {
    var act = (cache.tecnicos || []).filter(function(t){ return t.activo; });
    var tec = act.filter(function(t){ return t.tipo_empleado === 'tecnico'; });
    return tec.length ? tec : act;
  } catch(_) { return []; }
}

/* ---------- Días que lleva el equipo en su paso actual ---------- */
var ult = {}; var ultT = 0;
async function cargarUltimoCambio(ids){
  if (!ids.length || !sb()) return;
  if (Date.now() - ultT < 60000 && ids.every(function(id){ return id in ult; })) return;
  for (var i = 0; i < ids.length; i += 80) {
    var parte = ids.slice(i, i + 80);
    try {
      var r = await sb().from('equipo_historial').select('equipo_id, fecha').in('equipo_id', parte).order('fecha', { ascending: false });
      parte.forEach(function(id){ ult[id] = null; });
      (r.data || []).forEach(function(h){ if (!ult[h.equipo_id]) ult[h.equipo_id] = h.fecha; });
    } catch(_){}
  }
  ultT = Date.now();
}
function dias(e){
  var f = ult[e.id];
  if (!f) {
    if (e.estado_evaluacion === 'listo_venta') f = e.fecha_terminado;
    else if (REPARACION.indexOf(e.estado_evaluacion) >= 0) f = e.fecha_reasignacion || e.fecha_asignacion;
    f = f || e.creado_en;
  }
  var d = f ? Math.floor((Date.now() - new Date(f).getTime()) / 86400000) : 0;
  return d > 0 ? d : 0;
}
function diasTxt(d){ return d === 0 ? 'hoy' : d === 1 ? '1 día' : d + ' días'; }

function grupos(){
  var E = equipos();
  return {
    sinTec: E.filter(function(e){ return e.estado_evaluacion === 'evaluado' && !e.tecnico_asignado_id; }),
    lentos: E.filter(function(e){ return REPARACION.indexOf(e.estado_evaluacion) >= 0 && dias(e) > DIAS_LENTO; }),
    revision: E.filter(function(e){ return e.estado_evaluacion === 'listo_revision'; }),
    listos: E.filter(function(e){ return e.estado_evaluacion === 'listo_venta' && !e.completado; })
  };
}
function porDias(a, b){ return dias(b) - dias(a); }

/* ---------- Estilos ---------- */
var css = [
'.rss-wrap{margin:0 0 14px}',
'.rss-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin:0 2px 8px;flex-wrap:wrap}',
'.rss-tit{font-weight:800;font-size:14px;color:#0f172a;display:flex;align-items:center;gap:6px}',
'.rss-tit i{color:#0891b2}',
'.rss-sub{font-size:12px;color:#475569}',
'.rss-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}',
'@media (max-width:1100px){.rss-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}',
'@media (max-width:480px){.rss-grid{grid-template-columns:1fr}}',
'.rss-card{position:relative;text-align:left;background:#fff;border:1px solid rgba(15,23,42,.08);border-radius:14px;padding:12px 14px 12px 16px;box-shadow:0 6px 20px -16px rgba(15,23,42,.5);cursor:pointer;font:inherit;color:#0f172a;transition:transform .15s ease,box-shadow .15s ease;min-height:44px;overflow:hidden}',
'.rss-card:hover,.rss-card:focus-visible{transform:translateY(-1px);box-shadow:0 10px 26px -16px rgba(15,23,42,.55);outline:none}',
'.rss-card::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--rss-c,#16a34a)}',
'.rss-card.verde{--rss-c:#16a34a}.rss-card.ambar{--rss-c:#d97706}.rss-card.rojo{--rss-c:#dc2626}',
'.rss-n{font-size:26px;font-weight:850;line-height:1;font-variant-numeric:tabular-nums}',
'.rss-lbl{font-size:13px;font-weight:700;margin-top:4px}',
'.rss-det{font-size:12px;color:#475569;margin-top:2px}',
'.rss-acc{display:inline-flex;align-items:center;gap:5px;margin-top:8px;font-size:12.5px;font-weight:700;color:var(--rss-c)}',
'.rss-card.verde .rss-acc{color:#475569}',
/* modales */
'.rss-lista{display:flex;flex-direction:column;gap:6px}',
'.rss-fila{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;padding:8px 10px;border:1px solid #e2e8f0;border-radius:10px;background:#fff}',
'.rss-fila.click{cursor:pointer}.rss-fila.click:hover{background:#f8fafc}',
'.rss-m{font-weight:700;font-size:13.5px;color:#0f172a}',
'.rss-s{font-size:12px;color:#475569}',
'.rss-dias{font-size:12px;font-weight:700;color:#475569;white-space:nowrap}',
'.rss-dias.rojo{color:#b91c1c}',
'.rss-fila select{padding:7px 8px;border:1px solid #cbd5e1;border-radius:8px;font-size:12.5px;max-width:190px}',
'.rss-sug{font-size:10.5px;font-weight:800;color:#0891b2;margin-left:4px}',
'.rss-chips{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 10px}',
'.rss-chip{font-size:12px;padding:4px 10px;border-radius:999px;background:#f1f5f9;color:#334155;font-weight:600}',
'.rss-grupo{font-weight:800;font-size:12.5px;color:#334155;margin:10px 2px 4px;display:flex;align-items:center;gap:8px}',
'.rss-chk{width:20px;height:20px;accent-color:#0891b2}',
'.rss-rev{border:1px solid #e2e8f0;border-radius:14px;padding:14px}',
'.rss-rev h4{margin:0 0 2px;font-size:17px}',
'.rss-kv{display:grid;grid-template-columns:110px 1fr;gap:4px 10px;font-size:13px;margin:10px 0}',
'.rss-kv b{color:#475569;font-weight:600}',
'.rss-tags{display:flex;flex-wrap:wrap;gap:6px}',
'.rss-tag{font-size:12px;padding:3px 9px;border-radius:999px;background:#fef3c7;color:#92400e;font-weight:600}',
'.rss-tag.pz{background:#e0f2fe;color:#075985}',
'.rss-prog{font-size:12px;color:#475569;font-weight:700}',
'.rss-acciones{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}',
'.rss-acciones .btn{min-height:44px;justify-content:center}',
'.rss-vacio{text-align:center;color:#475569;font-size:13px;padding:24px 10px}',
'@media (prefers-reduced-motion:reduce){.rss-card{transition:none}.rss-card:hover{transform:none}}'
].join('\n');
var st = document.createElement('style'); st.id = 'rssReacondSmartCSS'; st.textContent = css; document.head.appendChild(st);

/* ---------- 1 · Tablero de atascados ---------- */
var pintando = false;
async function pintarTablero(){
  var lista = document.getElementById('reacondListaLotes'); if (!lista) return;
  var tabs = lista.querySelector('.reacond-tabs-scroll'); if (!tabs) return;
  var cont = document.getElementById('rssTablero');
  if (!puede()) { if (cont) cont.remove(); return; }
  if (!cont) { cont = document.createElement('div'); cont.id = 'rssTablero'; cont.className = 'rss-wrap'; tabs.parentNode.insertBefore(cont, tabs); }
  if (pintando) return; pintando = true;
  try {
    var E = equipos();
    var ids = E.filter(function(e){ return ['evaluado','listo_revision','listo_venta'].indexOf(e.estado_evaluacion) >= 0 || REPARACION.indexOf(e.estado_evaluacion) >= 0; }).map(function(e){ return e.id; });
    await cargarUltimoCambio(ids);
    var g = grupos();
    var viejo = function(arr){ return arr.reduce(function(m, e){ return Math.max(m, dias(e)); }, 0); };
    var color = function(arr, ambar, rojo){ if (!arr.length) return 'verde'; var v = viejo(arr); return v > rojo ? 'rojo' : 'ambar'; };
    var tarjeta = function(clave, arr, lbl, accion, icono, ambar, rojo, vacio){
      var c = color(arr, ambar, rojo);
      var det = arr.length ? ('El más viejo: ' + diasTxt(viejo(arr))) : vacio;
      return '<button type="button" class="rss-card ' + c + '" data-rss="' + clave + '"><div class="rss-n">' + arr.length + '</div><div class="rss-lbl">' + lbl + '</div><div class="rss-det">' + det + '</div>' +
        (arr.length ? '<div class="rss-acc"><i class="ti ' + icono + '"></i> ' + accion + '</div>' : '') + '</button>';
    };
    var total = g.sinTec.length + g.lentos.length + g.revision.length + g.listos.length;
    cont.innerHTML = '<div class="rss-head"><span class="rss-tit"><i class="ti ti-traffic-lights"></i> Lo que está parado</span><span class="rss-sub">' + (total ? 'Toque una tarjeta para resolverlo' : 'Todo al día') + '</span></div>' +
      '<div class="rss-grid">' +
      tarjeta('sinTec', g.sinTec, 'Evaluados sin técnico', 'Repartir', 'ti-users', 1, 3, 'Ninguno esperando') +
      tarjeta('lentos', g.lentos, 'En reparación +' + DIAS_LENTO + ' días', 'Ver cuáles', 'ti-clock-exclamation', 7, 14, 'Ninguno atrasado') +
      tarjeta('revision', g.revision, 'Esperando control de calidad', 'Revisar uno por uno', 'ti-shield-check', 1, 3, 'Nada por revisar') +
      tarjeta('listos', g.listos, 'Listos sin despachar', 'Despachar en bloque', 'ti-truck-delivery', 3, 7, 'Nada por despachar') +
      '</div>';
    cont.querySelectorAll('.rss-card').forEach(function(b){ b.onclick = function(){
      var k = b.getAttribute('data-rss'); var g2 = grupos();
      if (!g2[k] || !g2[k].length) return;
      if (k === 'sinTec') abrirRepartir(); else if (k === 'lentos') abrirLentos(); else if (k === 'revision') abrirRevision(); else abrirDespacho();
    }; });
  } catch(e) { console.warn('[reacond-smart] tablero', e); }
  finally { pintando = false; }
}

/* ---------- Ventana (mismo patrón .modal-backdrop del taller) ---------- */
function ventana(id, titulo, cuerpo, pie, ancho){
  var prev = document.getElementById(id); if (prev) prev.remove();
  var box = document.createElement('div');
  box.className = 'modal-backdrop active'; box.id = id; box.style.zIndex = '600';
  box.innerHTML = '<div class="modal-box" style="max-width:' + (ancho || 680) + 'px;">' +
    '<div class="modal-header"><h3 style="margin:0;">' + titulo + '</h3><button class="modal-close" type="button" aria-label="Cerrar">✕</button></div>' +
    '<div class="modal-body">' + cuerpo + '</div>' + (pie ? '<div class="modal-footer">' + pie + '</div>' : '') + '</div>';
  document.body.appendChild(box);
  box.querySelector('.modal-close').onclick = function(){ cerrar(id); };
  return box;
}
function cerrar(id){ var b = document.getElementById(id); if (b) b.remove(); }
async function refrescar(){
  try { if (typeof loadAll === 'function') await loadAll(); } catch(_){}
  ultT = 0;
  try { if (typeof cargarLotesReacond === 'function') cargarLotesReacond(); } catch(_){}
  try { if (typeof reacondLoteAbiertoId !== 'undefined' && reacondLoteAbiertoId && typeof renderDetalleLoteReacond === 'function') renderDetalleLoteReacond(); } catch(_){}
}

/* ---------- 2a · Repartir evaluados ---------- */
function cargaActual(){
  var c = {}; tecnicos().forEach(function(t){ c[t.id] = 0; });
  try { (cache.refurb || []).forEach(function(e){ if (e.tecnico_asignado_id in c && REPARACION.indexOf(e.estado_evaluacion) >= 0) c[e.tecnico_asignado_id]++; }); } catch(_){}
  return c;
}
function experiencia(tecId, mod){
  var m = String(mod || '').toLowerCase(); if (!m) return 0;
  try { return (cache.refurb || []).filter(function(e){ return e.tecnico_asignado_id === tecId && String(e.modelo || '').toLowerCase() === m && ['listo_venta','vendido'].indexOf(e.estado_evaluacion) >= 0; }).length; } catch(_) { return 0; }
}
// Menos carga primero; si la diferencia es poca, gana quien más ha reparado ese mismo modelo.
function sugerir(lista){
  var carga = cargaActual(), T = tecnicos(), out = {};
  lista.forEach(function(e){
    var mejor = null, pm = Infinity;
    T.forEach(function(t){ var p = carga[t.id] - Math.min(experiencia(t.id, e.modelo), 5) * 0.4; if (p < pm) { pm = p; mejor = t; } });
    if (mejor) { out[e.id] = mejor.id; carga[mejor.id]++; }
  });
  return out;
}
function abrirRepartir(){
  var lista = grupos().sinTec.slice().sort(porDias);
  if (!lista.length) return ok('Todos tienen técnico');
  var T = tecnicos(), sug = sugerir(lista), carga = cargaActual();
  var chips = T.map(function(t){ return '<span class="rss-chip">' + esc(t.nombre) + ': ' + carga[t.id] + ' en reparación</span>'; }).join('');
  var filas = lista.map(function(e){
    var opts = '<option value="">— No asignar —</option>' + T.map(function(t){ return '<option value="' + t.id + '"' + (sug[e.id] === t.id ? ' selected' : '') + '>' + esc(t.nombre) + (sug[e.id] === t.id ? ' (sugerido)' : '') + '</option>'; }).join('');
    var d = dias(e);
    return '<div class="rss-fila"><input type="checkbox" class="rss-chk" data-id="' + e.id + '" checked aria-label="Incluir"><div><div class="rss-m">' + esc(modelo(e)) + '</div><div class="rss-s">' + esc(e.imei || 'Sin IMEI') + ' · ' + esc(loteDe(e)) + ' · <span class="rss-dias' + (d > 3 ? ' rojo' : '') + '">' + diasTxt(d) + ' esperando</span></div></div>' +
      '<select data-id="' + e.id + '" aria-label="Técnico">' + opts + '</select></div>';
  }).join('');
  var b = ventana('rssRepartir', '<i class="ti ti-users"></i> Repartir evaluados (' + lista.length + ')',
    '<div class="rss-chips">' + chips + '</div><p class="rss-s" style="margin:0 0 10px;">El sistema sugiere al técnico con menos trabajo; si están parejos, al que más ha reparado ese modelo. Puede cambiarlo en cada equipo.</p><div class="rss-lista">' + filas + '</div>',
    '<button class="btn btn-light" type="button" data-x>Cancelar</button><button class="btn btn-blue" type="button" data-ok><i class="ti ti-check"></i> Asignar <span data-n>' + lista.length + '</span> equipo(s)</button>', 720);
  var contar = function(){ var n = 0; b.querySelectorAll('.rss-fila').forEach(function(f){ if (f.querySelector('.rss-chk').checked && f.querySelector('select').value) n++; }); b.querySelector('[data-n]').textContent = n; };
  b.querySelectorAll('.rss-chk, .rss-fila select').forEach(function(x){ x.onchange = contar; });
  b.querySelector('[data-x]').onclick = function(){ cerrar('rssRepartir'); };
  b.querySelector('[data-ok]').onclick = function(){ asignarRepartidos(b, this); };
  contar();
}
async function asignarRepartidos(b, btn){
  var porTec = {};
  b.querySelectorAll('.rss-fila').forEach(function(f){
    var id = f.querySelector('.rss-chk').getAttribute('data-id'), t = f.querySelector('select').value;
    if (f.querySelector('.rss-chk').checked && t) (porTec[t] = porTec[t] || []).push(id);
  });
  var tecs = Object.keys(porTec); if (!tecs.length) return mal('Falta el técnico');
  var resumen = tecs.map(function(t){ return '• ' + nomTec(t) + ': ' + porTec[t].length; }).join('\n');
  if (!await confirmar('¿Asignar así?\n\n' + resumen + '\n\nPasarán a «En proceso».', { peligro: false, ok: 'Asignar' })) return;
  var orig = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<i class="ti ti-loader"></i> Asignando…';
  var hechos = 0;
  try {
    for (var i = 0; i < tecs.length; i++) {
      var t = tecs[i], ids = porTec[t], nombre = nomTec(t) || 'técnico';
      var r = await sb().from('equipos_refurbish').update({ tecnico_asignado_id: t, fecha_asignacion: new Date().toISOString(), estado_evaluacion: 'en_proceso' }).in('id', ids);
      if (r.error) throw r.error;
      try { await sb().from('equipo_historial').insert(ids.map(function(id){ return { equipo_id: id, estado_anterior: 'evaluado', estado_nuevo: 'en_proceso', accion: 'Asignado a ' + nombre + ' (repartir evaluados)', usuario: usuario() }; })); } catch(_){}
      for (var k = 0; k < ids.length; k++) { try { await asignarFallasSinDueno('equipo', ids[k], t); } catch(_){} }
      hechos += ids.length;
    }
    ok(hechos + ' equipo(s) asignado(s).');
    cerrar('rssRepartir');
    await refrescar();
  } catch(e) {
    try { logError('Repartir evaluados', e); } catch(_){}
    mal((hechos ? hechos + ' asignado(s), pero falló el resto: ' : '') + (typeof getFriendlyError === 'function' ? getFriendlyError(e) : e.message));
    if (hechos) await refrescar();
  } finally { btn.disabled = false; btn.innerHTML = orig; }
}

/* ---------- Reparación lenta (solo ver) ---------- */
function abrirLentos(){
  var lista = grupos().lentos.slice().sort(porDias);
  if (!lista.length) return ok('Nada atrasado.');
  var est = function(s){ try { return (obtenerEtiquetaEstado(s) || {}).text || s; } catch(_) { return s; } };
  var filas = lista.map(function(e){
    return '<div class="rss-fila click" data-id="' + e.id + '" role="button" tabindex="0"><i class="ti ti-device-mobile" style="color:#475569;"></i><div><div class="rss-m">' + esc(modelo(e)) + '</div><div class="rss-s">' + esc(nomTec(e.tecnico_asignado_id) || 'Sin técnico') + ' · ' + esc(est(e.estado_evaluacion)) + ' · ' + esc(loteDe(e)) + '</div></div><span class="rss-dias rojo">' + diasTxt(dias(e)) + '</span></div>';
  }).join('');
  var b = ventana('rssLentos', '<i class="ti ti-clock-exclamation"></i> En reparación más de ' + DIAS_LENTO + ' días (' + lista.length + ')', '<p class="rss-s" style="margin:0 0 10px;">Ordenados del más viejo al más nuevo. Toque uno para abrir su panel.</p><div class="rss-lista">' + filas + '</div>', '', 640);
  b.querySelectorAll('.rss-fila').forEach(function(f){ var abrir = function(){ cerrar('rssLentos'); try { abrirPanelProceso(f.getAttribute('data-id')); } catch(_){} }; f.onclick = abrir; f.onkeydown = function(ev){ if (ev.key === 'Enter') abrir(); }; });
}

/* ---------- 2b · Revisar terminados uno por uno ---------- */
var rev = null;
function abrirRevision(){
  var lista = grupos().revision.slice().sort(porDias);
  if (!lista.length) return ok('Nada en control');
  rev = { ids: lista.map(function(e){ return e.id; }), i: 0, aprobados: 0, devueltos: 0, cambio: false };
  pintarRevision();
}
async function pintarRevision(){
  if (!rev) return;
  if (rev.i >= rev.ids.length) {
    ventana('rssRevision', '<i class="ti ti-shield-check"></i> Control de calidad', '<div class="rss-vacio"><i class="ti ti-circle-check" style="font-size:34px;color:#16a34a;"></i><div style="font-weight:800;font-size:15px;color:#0f172a;margin-top:6px;">Revisión terminada</div><div>' + rev.aprobados + ' aprobado(s) · ' + rev.devueltos + ' devuelto(s) · ' + (rev.ids.length - rev.aprobados - rev.devueltos) + ' saltado(s)</div></div>', '<button class="btn btn-blue" type="button" data-fin>Listo</button>', 520)
      .querySelector('[data-fin]').onclick = terminarRevision;
    return;
  }
  var id = rev.ids[rev.i];
  var e = (cache.refurb || []).find(function(x){ return x.id === id; });
  if (!e || e.estado_evaluacion !== 'listo_revision') { rev.i++; return pintarRevision(); }
  var b = ventana('rssRevision', '<i class="ti ti-shield-check"></i> Control de calidad <span class="rss-prog">· ' + (rev.i + 1) + ' de ' + rev.ids.length + '</span>',
    '<div class="rss-rev"><h4>' + esc(modelo(e)) + '</h4><div class="rss-s">' + esc(e.imei || 'Sin IMEI') + '</div>' +
    '<div class="rss-kv"><b>Técnico</b><span>' + esc(nomTec(e.tecnico_asignado_id) || '—') + '</span><b>Lote</b><span>' + esc(loteDe(e)) + '</span><b>Esperando</b><span>' + diasTxt(dias(e)) + '</span>' + (e.veces_devuelto ? '<b>Devuelto antes</b><span>' + e.veces_devuelto + ' vez/veces</span>' : '') + '</div>' +
    '<div class="rss-s" style="font-weight:700;margin-bottom:4px;">Fallas y piezas</div><div class="rss-tags" data-tags><span class="rss-s">Cargando…</span></div>' +
    (e.notas_diagnostico ? '<div class="rss-s" style="margin-top:10px;white-space:pre-line;">' + esc(String(e.notas_diagnostico).slice(-400)) + '</div>' : '') + '</div>',
    '<div style="display:flex;flex-direction:column;gap:8px;width:100%;"><div class="rss-acciones"><button class="btn btn-success" type="button" data-a="aprobar"><i class="ti ti-check"></i> Aprobar → Listo</button><button class="btn btn-light" type="button" data-a="devolver" style="color:#b45309;"><i class="ti ti-arrow-back-up"></i> Devolver al técnico</button></div>' +
    '<div class="rss-acciones"><button class="btn btn-light" type="button" data-a="ver"><i class="ti ti-eye"></i> Ver equipo completo</button><button class="btn btn-light" type="button" data-a="saltar"><i class="ti ti-player-skip-forward"></i> Saltar</button></div></div>', 560);
  b.querySelector('.modal-close').onclick = terminarRevision;
  b.querySelectorAll('[data-a]').forEach(function(x){ x.onclick = function(){ accionRevision(x.getAttribute('data-a'), e, x); }; });
  try {
    var r = await Promise.all([
      sb().from('equipo_fallas').select('falla_nombre').eq('equipo_id', id),
      sb().from('equipo_piezas_pedidas').select('pieza_nombre, cantidad').eq('equipo_id', id)
    ]);
    var tags = (r[0].data || []).map(function(f){ return '<span class="rss-tag">' + esc(f.falla_nombre || 'Falla') + '</span>'; })
      .concat((r[1].data || []).map(function(p){ return '<span class="rss-tag pz"><i class="ti ti-package"></i> ' + esc(p.pieza_nombre || 'Pieza') + (Number(p.cantidad) > 1 ? ' ×' + p.cantidad : '') + '</span>'; }));
    var t = b.querySelector('[data-tags]'); if (t) t.innerHTML = tags.length ? tags.join('') : '<span class="rss-s">Sin fallas ni piezas registradas</span>';
  } catch(_){ var t2 = b.querySelector('[data-tags]'); if (t2) t2.innerHTML = '<span class="rss-s">No se pudieron cargar</span>'; }
}
async function accionRevision(a, e, btn){
  if (a === 'saltar') { rev.i++; return pintarRevision(); }
  if (a === 'ver') { var id = e.id; terminarRevision(); try { abrirPanelProceso(id); } catch(_){} return; }
  btn.disabled = true;
  try {
    if (a === 'aprobar') {
      var r = await sb().from('equipos_refurbish').update({ estado_evaluacion: 'listo_venta', fecha_terminado: new Date().toISOString() }).eq('id', e.id);
      if (r.error) throw r.error;
      try { await sb().from('equipo_historial').insert([{ equipo_id: e.id, estado_anterior: 'listo_revision', estado_nuevo: 'listo_venta', accion: 'Aprobado por admin → Listo para venta (revisión rápida)', usuario: usuario() }]); } catch(_){}
      e.estado_evaluacion = 'listo_venta'; e.fecha_terminado = new Date().toISOString();
      rev.aprobados++; rev.cambio = true; ok('Aprobado: ' + modelo(e));
    } else if (a === 'devolver') {
      var motivo = await pedirTexto('Indique qué le falta. El técnico lo verá en las notas del equipo.', { placeholder: 'Ej.: la cámara frontal no enfoca', multilinea: true });
      if (motivo === null) { btn.disabled = false; return; }
      motivo = motivo.trim(); if (!motivo) { btn.disabled = false; return mal('¿Qué le falta?'); }
      var prev = e.notas_diagnostico || '';
      var upd = { estado_evaluacion: 'en_proceso', veces_devuelto: (Number(e.veces_devuelto) || 0) + 1, notas_diagnostico: prev + (prev ? '\n\n' : '') + '[Control de calidad] ' + motivo };
      var r2 = await sb().from('equipos_refurbish').update(upd).eq('id', e.id);
      if (r2.error) throw r2.error;
      try { await sb().from('equipo_historial').insert([{ equipo_id: e.id, estado_anterior: 'listo_revision', estado_nuevo: 'en_proceso', accion: 'Devuelto al técnico por control de calidad', notas: motivo, usuario: usuario() }]); } catch(_){}
      Object.assign(e, upd);
      rev.devueltos++; rev.cambio = true; ok('Devuelto a ' + (nomTec(e.tecnico_asignado_id) || 'el técnico') + '.');
    }
    rev.i++; pintarRevision();
  } catch(err) {
    btn.disabled = false;
    try { logError('Revisión rápida', err); } catch(_){}
    mal(typeof getFriendlyError === 'function' ? getFriendlyError(err) : err.message);
  }
}
function terminarRevision(){ var hubo = rev && rev.cambio; rev = null; cerrar('rssRevision'); if (hubo) refrescar(); }

/* ---------- 3 · Despachar listos en bloque ---------- */
var pendienteIP = null; // equipos a marcar como Despachado cuando el despacho de Info Plus salga bien
function abrirDespacho(){
  if (!puedeDespachar()) return mal('Sin permiso');
  pendienteIP = null;
  var lista = grupos().listos;
  if (!lista.length) return ok('Nada listo para despachar');
  var porLote = {};
  lista.forEach(function(e){ (porLote[e.lote_id] = porLote[e.lote_id] || []).push(e); });
  var cuerpo = Object.keys(porLote).map(function(lid){
    var arr = porLote[lid].slice().sort(function(a, b){ return modelo(a).localeCompare(modelo(b)); });
    return '<div class="rss-grupo"><input type="checkbox" class="rss-chk" data-lote="' + lid + '" checked aria-label="Todo el lote"> Lote ' + esc(loteDe(arr[0])) + ' <span class="rss-s">(' + arr.length + ')</span></div>' +
      arr.map(function(e){
        var sinCod = !(e.articulo_codigo != null && String(e.articulo_codigo).trim());
        return '<div class="rss-fila"><input type="checkbox" class="rss-chk" data-id="' + e.id + '" data-de="' + lid + '" checked aria-label="Incluir"><div><div class="rss-m">' + esc(modelo(e)) + '</div><div class="rss-s">' + esc(e.imei || 'Sin IMEI') + (sinCod ? ' · <span style="color:#b91c1c;font-weight:700;">sin código Info Plus</span>' : ' · Cód. ' + esc(e.articulo_codigo)) + '</div></div><span class="rss-dias' + (dias(e) > 7 ? ' rojo' : '') + '">' + diasTxt(dias(e)) + '</span></div>';
      }).join('');
  }).join('');
  var admin = false; try { admin = isAdminUser(); } catch(_){}
  var b = ventana('rssDespacho', '<i class="ti ti-truck-delivery"></i> Despachar listos en bloque',
    '<p class="rss-s" style="margin:0 0 8px;">Marque los equipos que salen del taller. <b>Si todavía no los movió en Info Plus</b>, use «Mover en Info Plus»: se hace un solo documento por modelo, con costo promedio y sus IMEI. <b>Si ya los movió</b>, use «Solo marcar despachados».</p><div class="rss-lista">' + cuerpo + '</div>',
    '<span class="rss-s" style="margin-right:auto;"><b data-n>0</b> marcado(s)</span><button class="btn btn-light" type="button" data-solo><i class="ti ti-check"></i> Solo marcar despachados</button>' +
    (admin ? '<button class="btn btn-blue" type="button" data-ip><i class="ti ti-truck-delivery"></i> Mover en Info Plus</button>' : ''), 720);
  var marcados = function(){ return Array.prototype.slice.call(b.querySelectorAll('.rss-chk[data-id]')).filter(function(c){ return c.checked; }).map(function(c){ return c.getAttribute('data-id'); }); };
  var contar = function(){
    b.querySelector('[data-n]').textContent = marcados().length;
    b.querySelectorAll('.rss-chk[data-lote]').forEach(function(l){
      var hijos = b.querySelectorAll('.rss-chk[data-de="' + l.getAttribute('data-lote') + '"]'), n = 0;
      hijos.forEach(function(h){ if (h.checked) n++; });
      l.checked = n === hijos.length; l.indeterminate = n > 0 && n < hijos.length;
    });
  };
  b.querySelectorAll('.rss-chk[data-lote]').forEach(function(l){ l.onchange = function(){ b.querySelectorAll('.rss-chk[data-de="' + l.getAttribute('data-lote') + '"]').forEach(function(h){ h.checked = l.checked; }); contar(); }; });
  b.querySelectorAll('.rss-chk[data-id]').forEach(function(c){ c.onchange = contar; });
  b.querySelector('[data-solo]').onclick = async function(){
    var ids = marcados(); if (!ids.length) return mal('Marque al menos un equipo.');
    if (!await confirmar('¿Marcar ' + ids.length + ' equipo(s) como Despachado SOLO en el taller?\n\nUse esta opción si ya los movió en Info Plus. Las piezas pendientes se descuentan como siempre.', { peligro: false, ok: 'Marcar despachados' })) return;
    cerrar('rssDespacho'); await marcarDespachados(ids, 'en bloque');
  };
  var ip = b.querySelector('[data-ip]');
  if (ip) ip.onclick = function(){
    var ids = marcados(); if (!ids.length) return mal('Marque al menos un equipo.');
    var conCod = ids.filter(function(id){ var e = (cache.refurb || []).find(function(x){ return x.id === id; }); return e && e.articulo_codigo != null && String(e.articulo_codigo).trim(); });
    if (!conCod.length) return mal('Ninguno de los marcados tiene código de Info Plus.');
    pendienteIP = { ids: conCod };
    cerrar('rssDespacho');
    try { _reacondSel = new Set(conCod); despacharTelefonosSeleccionados(); vigilarCierreIP(); }
    catch(e) { pendienteIP = null; mal('No se pudo abrir el despacho de Info Plus.'); }
  };
  contar();
}
async function marcarDespachados(ids, como){
  if (!ids.length) return;
  try {
    var ahora = new Date().toISOString();
    var r = await sb().from('equipos_refurbish').update({ estado_evaluacion: 'vendido', fecha_despacho: ahora }).in('id', ids);
    if (r.error) throw r.error;
    try { await sb().from('equipo_historial').insert(ids.map(function(id){ return { equipo_id: id, estado_anterior: 'listo_venta', estado_nuevo: 'vendido', accion: 'Salida registrada → Despachado (' + como + ')', usuario: usuario() }; })); } catch(_){}
    ok('Despachando ' + ids.length + ' equipo(s)… descontando piezas pendientes.');
    var piezas = 0;
    for (var i = 0; i < ids.length; i++) { try { var d = await _descontarPiezasAlCompletar(ids[i]); piezas += (d && d.n) || 0; } catch(_){} }
    ok(ids.length + ' equipo(s) despachado(s)' + (piezas ? '. ' + piezas + ' pieza(s) descontada(s) de Info Plus.' : '.'));
  } catch(e) {
    try { logError('Despachar en bloque', e); } catch(_){}
    mal(typeof getFriendlyError === 'function' ? getFriendlyError(e) : e.message);
  }
  await refrescar();
}
// 24-oct-2026 (auditoría R02): si la ventana de Info Plus (#modalDespTel) se cierra o cancela sin despachar
// (botón Cancelar, X, o la quita otro flujo), pendienteIP se limpia; antes quedaba vivo y un despacho posterior
// marcaba los IDs viejos.
function vigilarCierreIP(){
  var m = document.getElementById('modalDespTel');
  if (!m || typeof MutationObserver !== 'function') return;
  var obs = new MutationObserver(function(){
    if (document.body.contains(m)) return;
    obs.disconnect();
    pendienteIP = null;
  });
  obs.observe(document.body, { childList: true, subtree: true });
}
// 24-oct-2026 (auditoría R02/R04): el despacho de Info Plus de siempre ya cierra en el taller los equipos realmente
// enviados (lo hace _despTelConfirmar en taller-app.js y devuelve { ok, documento, ids }). Este envoltorio ya no
// marca nada ni usa la selección original (pend.ids): solo, cuando se vino del asistente y salió bien, descuenta las
// piezas pendientes de los ids devueltos (igual que marcarDespachado) y refresca. pendienteIP se limpia tras
// cualquier resultado.
if (typeof window._despTelConfirmar === 'function') {
  var origDesp = window._despTelConfirmar;
  window._despTelConfirmar = async function(){
    var pend = pendienteIP;
    var res = null;
    try { res = await origDesp.apply(this, arguments); }
    finally {
      // Resultado final (éxito) o ventana ya cerrada → se olvida la selección del asistente. Si solo se canceló el
      // diálogo de confirmación o Info Plus rechazó y la ventana sigue abierta, se conserva para el reintento.
      if ((res && res.ok) || !document.getElementById('modalDespTel')) pendienteIP = null;
    }
    if (pend && res && res.ok && Array.isArray(res.ids) && res.ids.length) {
      try { _reacondSel = new Set(); } catch(_){}
      var piezas = 0;
      for (var i = 0; i < res.ids.length; i++) { try { var d = await _descontarPiezasAlCompletar(res.ids[i]); piezas += (d && d.n) || 0; } catch(e){ try { logError('Descontar piezas tras despacho IP', e); } catch(_){} } }
      if (piezas) ok(piezas + ' pieza(s) pendiente(s) descontada(s) de Info Plus (despacho Nº ' + (res.documento || '?') + ').');
      await refrescar();
    }
    return res;
  };
}

/* ---------- Enganche: repintar el tablero cuando se pinta la lista de lotes ---------- */
if (typeof window.cargarLotesReacond === 'function') {
  var origCargar = window.cargarLotesReacond;
  window.cargarLotesReacond = function(){
    var r = origCargar.apply(this, arguments);
    try { pintarTablero(); } catch(_){}
    return r;
  };
}

window.BayolReacondSmart = { version: VERSION, tablero: pintarTablero, repartir: abrirRepartir, revisar: abrirRevision, despachar: abrirDespacho, lentos: abrirLentos, sugerir: sugerir };
})();
