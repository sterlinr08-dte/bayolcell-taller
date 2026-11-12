/* BAYOL CELL · taller · Reacondicionados «pistola» + flujo corto (12-nov-2026, dueño: «1, 2 y 3» de la auditoría de agilidad).
 * Auditoría (bitácora 2026-11-12 …auditoria-reacond-agilidad): los 8 pasos los pasa una sola cuenta, seguidos y al final;
 * «Técnico recibió» y «Control de calidad» duran menos de 10 s. Esta capa deja el día a día en 4 movimientos:
 *     Evaluado → En reparación (con técnico) → Listo para venta → Despachado
 * y los hace en lote escaneando el QR del label (el QR trae el IMEI de 15 dígitos; la pistola lo escribe y manda Enter).
 *  · Evaluado            → «Entregar a técnico» (hace falta elegir el técnico; se sugiere el de menos carga).
 *  · En reparación / espera de pieza / reparación externa / calidad → «Terminado» = Listo para venta en un paso.
 *  · Listo para venta    → «Despachar»: abre la ventana de siempre («Despachar listos en bloque») con solo esos marcados.
 *  · Recibido / En evaluación → no se mueve aquí: primero hay que evaluarlo (se abre su ficha).
 * No cambia taller-app.js ni las otras capas: usa las mismas tablas y los mismos pasos (equipos_refurbish + equipo_historial
 * + asignarFallasSinDueno). Los candados del servidor siguen mandando (trg_refurb_guardia / fase 3): quien no es administrador
 * no puede pasar a Listo un equipo con tareas o piezas pendientes; aquí solo se avisa cuántas tiene.
 * Solo administración o permiso piezas_aprobar_extra (igual que el tablero «Lo que está parado»).
 * 12-nov-2026 (dueño: «primero elijo el técnico que le voy a asignar el grupo de celulares»): arriba se elige el técnico
 * del grupo y todos los «Entregar a técnico» que se pasen van a él (los ya escaneados también). Cada fila se puede cambiar.
 * Si no se elige, sigue como antes: se sugiere el de menos carga.
 * 12-nov-2026 (dueño: «en la hoja que se va a imprimir salgan los diagnósticos que tiene cada equipo, así el técnico ve el
 * listado con sus fallas»): al aplicar, si hubo «Entregar a técnico», se ofrece la HOJA DE ENTREGA por técnico: equipo, IMEI,
 * lote, fallas del diagnóstico (equipo_fallas) con casilla para marcar y nota, y firmas. Solo lee para imprimir.
 * 12-nov-2026 (dueño): el botón y la ventana se llaman «Asignar equipo»; el técnico se elige con «Seleccionar técnico»,
 * que despliega la lista al tocarlo y se recoge al elegir.
 * Apagar: localStorage.bc_reacond_pistola_off = '1'  ·  window.BC_REACOND_PISTOLA = false
 */
(function(){'use strict';
if (window.BayolReacondPistola) return;
try { if (window.BC_REACOND_PISTOLA === false || localStorage.getItem('bc_reacond_pistola_off') === '1') return; } catch(_){}
var VERSION = '20261112k4';
var REPARACION = ['en_proceso','tecnico_recibio','espera_pieza','reasignado','reparacion_externa'];
var TXT = { pendiente:'Recibido', en_evaluacion:'En evaluación', evaluado:'Evaluado', en_proceso:'En reparación', tecnico_recibio:'En reparación',
  espera_pieza:'Esperando pieza', reasignado:'En reparación', reparacion_externa:'Reparación externa', listo_revision:'Control de calidad',
  listo_venta:'Listo para venta', vendido:'Despachado' };

function esc(s){ return (typeof escapeHtml === 'function') ? escapeHtml(s == null ? '' : String(s)) : String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]; }); }
function ok(m){ try { toast(m); } catch(_){} }
function mal(m){ try { toastError(m); } catch(_){ try { toast(m, 'error'); } catch(__){} } }
function sb(){ try { return supabaseClient; } catch(_) { return null; } }
function puede(){ try { return isAdminUser() || tienePermiso('piezas_aprobar_extra'); } catch(_) { return false; } }
function usuario(){ try { return (sessionUser && sessionUser.nombre) || 'Admin'; } catch(_) { return 'Admin'; } }
function modelo(e){ try { return _modeloRep(e) || e.modelo || 'Equipo'; } catch(_) { return e.modelo || 'Equipo'; } }
function nomTec(id){ try { return id ? nombreEmpleado(id) : ''; } catch(_) { return ''; } }
function refurb(){ try { return cache.refurb || []; } catch(_) { return []; } }
function tecnicos(){
  try {
    var act = (cache.tecnicos || []).filter(function(t){ return t.activo; });
    var tec = act.filter(function(t){ return t.tipo_empleado === 'tecnico'; });
    return tec.length ? tec : act;
  } catch(_) { return []; }
}
function soloNum(s){ return String(s == null ? '' : s).replace(/\D/g, ''); }

/* Dos modos (12-nov-2026, el dueño pidió ver ambos):
   · 'corto'    → Evaluado → En reparación → Listo para venta → Despachado (salta «Técnico recibió» y «Calidad»).
   · 'completo' → no salta nada: En reparación → Técnico recibió → Control de calidad → Listo para venta.
   Por defecto 'completo' (decisión del dueño). Para el corto: window.BC_REACOND_PISTOLA_MODO='corto' o localStorage.bc_reacond_pistola_modo='corto'. */
function modo(){
  var m = ''; try { m = window.BC_REACOND_PISTOLA_MODO || localStorage.getItem('bc_reacond_pistola_modo') || ''; } catch(_){}
  return m === 'corto' ? 'corto' : 'completo'; // el dueño eligió «la A» (12-nov-2026): por defecto no se salta ningún paso
}
var DESTINO = { listo: 'listo_venta', recibio: 'tecnico_recibio', calidad: 'listo_revision', aprobar: 'listo_venta' };
var HIST = { listo: 'Terminado → Listo para venta (pistola, flujo corto)', recibio: 'Técnico recibió el equipo (pistola)', calidad: 'Enviado a control de calidad (pistola)', aprobar: 'Aprobado en control de calidad → Listo para venta (pistola)' };
/* Qué paso le toca a un equipo según su estado. */
function paso(e){
  var s = e.estado_evaluacion || 'pendiente';
  if (s === 'evaluado') return { k: 'asignar', txt: 'Entregar a técnico', a: 'En reparación' };
  if (s === 'listo_venta' && !e.completado) return { k: 'despachar', txt: 'Despachar', a: 'Despachado' };
  if (s === 'pendiente' || s === 'en_evaluacion') return { k: 'evaluar', txt: 'Falta evaluar', a: '' };
  if (modo() === 'completo') {
    if (s === 'en_proceso' || s === 'reasignado') return { k: 'recibio', txt: 'Técnico recibió', a: 'Técnico recibió' };
    if (s === 'tecnico_recibio' || s === 'espera_pieza' || s === 'reparacion_externa') return { k: 'calidad', txt: 'A calidad', a: 'Control de calidad' };
    if (s === 'listo_revision') return { k: 'aprobar', txt: 'Aprobar calidad', a: 'Listo para venta' };
  } else if (REPARACION.indexOf(s) >= 0 || s === 'listo_revision') return { k: 'listo', txt: 'Terminado', a: 'Listo para venta' };
  return { k: 'nada', txt: 'Ya despachado', a: '' };
}

/* Buscar por IMEI completo (15) o por los últimos dígitos (5 o más) si solo hay uno. Si el IMEI está repetido, gana el que
   sigue en el taller y se avisa. */
function buscar(texto){
  var d = soloNum(texto); if (d.length < 5) return { error: 'Escriba al menos 5 números' };
  var R = refurb().filter(function(e){ var im = soloNum(e.imei); return im && (d.length >= 15 ? im === d.slice(0, 15) : im.slice(-d.length) === d); });
  if (!R.length) return { error: 'No está en Reacondicionados' };
  var vivos = R.filter(function(e){ return e.estado_evaluacion !== 'vendido' && !e.completado; });
  var lista = vivos.length ? vivos : R;
  var imeis = {}; lista.forEach(function(e){ imeis[soloNum(e.imei)] = 1; });
  if (Object.keys(imeis).length > 1) return { error: 'Varios equipos terminan en ' + d + ': escanee el QR' };
  lista.sort(function(a, b){ return new Date(b.actualizado_en || b.creado_en || 0) - new Date(a.actualizado_en || a.creado_en || 0); });
  return { e: lista[0], repetido: lista.length > 1 };
}

var S = null; // estado de la ventana: { filas:[{e, paso, tec, avisos}], pend:{} }

function estilos(){
  if (document.getElementById('rpkStyles')) return;
  var st = document.createElement('style'); st.id = 'rpkStyles'; st.textContent =
  '.rpk-btn{display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:0 14px;border-radius:10px;border:1px solid #1d4ed8;background:#1d4ed8;color:#fff;font-weight:700;font-size:13.5px;cursor:pointer;margin-left:auto;}' +
  '.rpk-btn:active{transform:scale(.97);}' +
  '.rpk-box{max-width:720px;width:94%;}' +
  '.rpk-in{width:100%;height:48px !important;min-height:48px;font-size:16px !important;padding:0 12px;border:2px solid #1d4ed8;border-radius:10px;box-sizing:border-box;font-family:ui-monospace,Menlo,Consolas,monospace;}' +
  '.rpk-ayuda{font-size:12.5px;color:#64748b;margin:6px 0 10px;}' +
  '.rpk-lista{display:flex;flex-direction:column;gap:6px;max-height:46vh;overflow:auto;}' +
  '.rpk-fila{display:grid;grid-template-columns:minmax(0,1fr) auto 44px;gap:8px;align-items:center;border:1px solid #e2e8f0;border-radius:10px;padding:8px 10px;background:#fff;}' +
  '.rpk-fila.no{background:#f8fafc;opacity:.85;}' +
  '.rpk-m{font-weight:700;font-size:14px;color:#0f172a;overflow-wrap:anywhere;}' +
  '.rpk-s{font-size:12px;color:#64748b;overflow-wrap:anywhere;}' +
  '.rpk-av{color:#b45309;font-weight:700;}' +
  '.rpk-paso{font-size:12.5px;font-weight:800;padding:5px 9px;border-radius:999px;white-space:nowrap;background:#dbeafe;color:#1e3a8a;}' +
  '.rpk-paso.listo,.rpk-paso.aprobar{background:#dcfce7;color:#166534;}.rpk-paso.calidad{background:#ede9fe;color:#5b21b6;}.rpk-paso.despachar{background:#fef3c7;color:#92400e;}.rpk-paso.evaluar,.rpk-paso.nada{background:#e2e8f0;color:#475569;}' +
  '.rpk-x{width:44px;height:44px;border:0;background:transparent;color:#64748b;font-size:18px;cursor:pointer;border-radius:8px;}' +
  '.rpk-tec{height:44px;font-size:14px;border:1px solid #cbd5e1;border-radius:8px;padding:0 8px;max-width:150px;}' +
  '.rpk-grupo{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 10px;}' +
  '#rpkVentana .rpk-sel{width:100%;height:48px !important;min-height:48px !important;display:flex;align-items:center;gap:8px;padding:0 14px;border-radius:10px;border:1.5px solid #cbd5e1;background:#fff;color:#0f172a;font-size:15px;font-weight:700;cursor:pointer;text-align:left;touch-action:manipulation;}' +
  '.rpk-sel span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}.rpk-sel small{font-weight:600;color:#64748b;font-size:12.5px;}' +
  '.rpk-sel.on{border-color:#1d4ed8;background:#eff6ff;color:#1e3a8a;}.rpk-sel .ti-chevron-down{transition:transform 160ms ease;}.rpk-sel[aria-expanded="true"] .ti-chevron-down{transform:rotate(180deg);}' +
  '.rpk-sel:focus-visible{outline:3px solid #93c5fd;outline-offset:2px;}' +
  '.rpk-op{display:flex;flex-wrap:wrap;gap:8px;width:100%;}.rpk-op[hidden]{display:none;}' +
  '.rpk-chip{min-height:44px;padding:0 14px;border-radius:999px;border:1.5px solid #cbd5e1;background:#fff;color:#0f172a;font-size:14px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;touch-action:manipulation;}' +
  '.rpk-chip small{font-size:11.5px;font-weight:600;color:#64748b;}' +
  '.rpk-chip.on{background:#1d4ed8;border-color:#1d4ed8;color:#fff;}.rpk-chip.on small{color:#dbeafe;}' +
  '.rpk-chip:active{transform:scale(.97);}.rpk-chip:focus-visible{outline:3px solid #93c5fd;outline-offset:2px;}' +
  '.rpk-vacio{border:1px dashed #cbd5e1;border-radius:10px;padding:18px;text-align:center;color:#64748b;font-size:13.5px;}' +
  '.rpk-res{display:flex;gap:6px;flex-wrap:wrap;font-size:12.5px;color:#334155;margin-right:auto;align-items:center;}' +
  '.rpk-res b{font-variant-numeric:tabular-nums;}' +
  '.rpk-ok{min-height:54px;padding:0 20px;font-size:15px;font-weight:800;white-space:nowrap;flex:none;}' +
  '@media (max-width:560px){.rpk-fila{grid-template-columns:minmax(0,1fr) 44px;}.rpk-fila .rpk-der{grid-column:1 / -1;grid-row:2;display:flex;gap:8px;align-items:center;flex-wrap:wrap;}.rpk-fila .rpk-x{grid-column:2;grid-row:1;}}' +
  '@media (min-width:561px){.rpk-der{display:flex;gap:8px;align-items:center;}}';
  document.head.appendChild(st);
}

function abrir(){
  if (!puede()) return mal('Sin permiso');
  estilos();
  var prev = document.getElementById('rpkVentana'); if (prev) prev.remove();
  S = { filas: [], pend: {}, tecGrupo: '', abierta: false };
  var box = document.createElement('div');
  box.className = 'modal-backdrop active'; box.id = 'rpkVentana'; box.style.zIndex = '600';
  box.innerHTML = '<div class="modal-box rpk-box"><div class="modal-header"><h3 style="margin:0;"><i class="ti ti-scan"></i> Asignar equipo</h3><button class="modal-close" type="button" aria-label="Cerrar">✕</button></div>' +
    '<div class="modal-body"><div class="rpk-grupo" id="rpkGrupo"></div><input id="rpkIn" class="rpk-in" inputmode="numeric" autocomplete="off" placeholder="QR del label o IMEI" aria-label="IMEI">' +
    '<div class="rpk-ayuda">Cada equipo avanza a su paso siguiente' + (modo() === 'completo' ? ', sin saltar ninguno' : '') + '. Sirven también los últimos 5 números.</div>' +
    '<div id="rpkLista" class="rpk-lista"></div></div>' +
    '<div class="modal-footer"><span class="rpk-res" id="rpkRes"></span><button class="btn btn-light" type="button" data-cerrar style="min-height:44px;">Cerrar</button><button class="btn btn-blue rpk-ok" type="button" id="rpkAplicar" disabled>Aplicar</button></div></div>';
  document.body.appendChild(box);
  box.querySelector('.modal-close').onclick = cerrar; box.querySelector('[data-cerrar]').onclick = cerrar;
  var inp = box.querySelector('#rpkIn');
  inp.addEventListener('keydown', function(ev){ if (ev.key === 'Enter') { ev.preventDefault(); leer(inp.value); inp.value = ''; } });
  inp.addEventListener('paste', function(ev){
    var t = (ev.clipboardData && ev.clipboardData.getData('text')) || ''; if (!/[\n,;\t ]/.test(t.trim())) return;
    ev.preventDefault(); t.split(/[\s,;]+/).forEach(function(x){ if (soloNum(x).length >= 5) leer(x, true); }); pintar();
  });
  box.querySelector('#rpkAplicar').onclick = aplicar;
  pintarGrupo(); pintar(); setTimeout(function(){ try { inp.focus(); } catch(_){} }, 60);
}
/* Técnico del grupo: un toque lo elige (y lo pone en todos los «Entregar a técnico»); otro toque lo quita. */
function cargaDe(){
  var c = {}; try { refurb().forEach(function(e){ if (e.tecnico_asignado_id && REPARACION.indexOf(e.estado_evaluacion) >= 0) c[e.tecnico_asignado_id] = (c[e.tecnico_asignado_id] || 0) + 1; }); } catch(_){}
  return c;
}
function pintarGrupo(){
  var G = document.getElementById('rpkGrupo'); if (!G || !S) return;
  var T = tecnicos(), c = cargaDe();
  if (!T.length) { G.innerHTML = ''; return; }
  var elegido = T.find(function(t){ return t.id === S.tecGrupo; });
  G.innerHTML = '<button type="button" class="rpk-sel' + (elegido ? ' on' : '') + '" id="rpkSel" aria-expanded="' + !!S.abierta + '" aria-controls="rpkOp"><i class="ti ti-user" aria-hidden="true"></i><span>' +
    (elegido ? 'Técnico: ' + esc(elegido.nombre || 'Técnico') : 'Seleccionar técnico') + '</span>' + '<i class="ti ti-chevron-down" aria-hidden="true"></i></button>' +
    '<div class="rpk-op" id="rpkOp" role="group" aria-label="Técnicos"' + (S.abierta ? '' : ' hidden') + '>' + T.map(function(t){
    var on = t.id === S.tecGrupo, n = c[t.id] || 0;
    return '<button type="button" class="rpk-chip' + (on ? ' on' : '') + '" data-grupo="' + esc(t.id) + '" aria-pressed="' + on + '">' + (on ? '<i class="ti ti-check" aria-hidden="true"></i>' : '') +
      esc((t.nombre || 'Técnico').split(' ').slice(0, 2).join(' ')) + ' <small>' + n + ' en reparación</small></button>';
  }).join('') + '</div>';
  G.querySelector('#rpkSel').onclick = function(){ S.abierta = !S.abierta; pintarGrupo(); if (S.abierta) { var on = G.querySelector('.rpk-chip.on') || G.querySelector('.rpk-chip'); if (on) try { on.focus(); } catch(_){} } };
  G.querySelectorAll('[data-grupo]').forEach(function(b){ b.onclick = function(){
    var id = b.getAttribute('data-grupo'); S.tecGrupo = S.tecGrupo === id ? '' : id;
    S.abierta = !S.tecGrupo; // al elegir se recoge; si lo quitó, queda abierta para elegir otro
    if (S.tecGrupo) S.filas.forEach(function(f){ if (f.paso.k === 'asignar') f.tec = S.tecGrupo; });
    else S.filas.forEach(function(f){ if (f.paso.k === 'asignar') f.tec = sugeridoDe(f.e); });
    pintarGrupo(); pintar(); enfocar();
  }; });
}
function sugeridoDe(e){
  var t = e.tecnico_asignado_id || '';
  if (!t) { try { var sug = window.BayolReacondSmart && window.BayolReacondSmart.sugerir([e]); if (sug && sug[e.id]) t = sug[e.id]; } catch(_){} }
  return t;
}
function cerrar(){ var b = document.getElementById('rpkVentana'); if (b) b.remove(); S = null; }

function leer(texto, sinPintar){
  if (!S || !String(texto || '').trim()) return;
  var r = buscar(texto);
  if (r.error) { mal(r.error + (soloNum(texto) ? ' · ' + soloNum(texto).slice(-6) : '')); return; }
  if (S.filas.some(function(f){ return f.e.id === r.e.id; })) { ok('Ya está en la lista'); return; }
  var p = paso(r.e), fila = { e: r.e, paso: p, tec: '', repetido: !!r.repetido };
  if (p.k === 'asignar') fila.tec = S.tecGrupo || sugeridoDe(r.e);
  S.filas.unshift(fila);
  if (p.k === 'listo' || p.k === 'calidad' || p.k === 'aprobar') cargarPendientes([r.e.id]);
  if (!sinPintar) pintar();
}

/* Tareas y piezas sin cerrar de los equipos que van a «Terminado» (solo para avisar; el servidor decide). */
async function cargarPendientes(ids){
  if (!sb() || !ids.length) return;
  try {
    var r = await Promise.all([
      sb().from('tareas_trabajo').select('ref_id, estado').eq('tipo', 'equipo').in('ref_id', ids),
      sb().from('equipo_piezas_pedidas').select('equipo_id, estado, pieza_id, agregada_por_tecnico').in('equipo_id', ids)
    ]);
    ids.forEach(function(id){ if (S) S.pend[id] = { t: 0, p: 0 }; });
    (r[0].data || []).forEach(function(t){ if (S && S.pend[t.ref_id] && (t.estado || '') !== 'hecha') S.pend[t.ref_id].t++; });
    (r[1].data || []).forEach(function(p){ if (S && S.pend[p.equipo_id] && (p.agregada_por_tecnico || p.pieza_id) && ['pendiente','extra_pendiente','aprobada','entregada'].indexOf(p.estado) >= 0) S.pend[p.equipo_id].p++; });
    pintar();
  } catch(_){}
}

function pintar(){
  if (!S) return;
  var L = document.getElementById('rpkLista'); if (!L) return;
  var T = tecnicos();
  L.innerHTML = S.filas.length ? S.filas.map(function(f, i){
    var e = f.e, p = f.paso, pe = S.pend[e.id], av = [];
    if (f.repetido) av.push('IMEI repetido');
    if (pe && pe.t) av.push(pe.t + ' tarea' + (pe.t > 1 ? 's' : '') + ' sin marcar');
    if (pe && pe.p) av.push(pe.p + ' pieza' + (pe.p > 1 ? 's' : '') + ' pendiente' + (pe.p > 1 ? 's' : ''));
    var sel = p.k === 'asignar' ? '<select class="rpk-tec" data-tec="' + i + '" aria-label="Técnico"><option value="">Técnico…</option>' +
      T.map(function(t){ return '<option value="' + esc(t.id) + '"' + (t.id === f.tec ? ' selected' : '') + '>' + esc((t.nombre || '').split(' ')[0] || 'Técnico') + '</option>'; }).join('') + '</select>' : '';
    return '<div class="rpk-fila' + (p.k === 'evaluar' || p.k === 'nada' ? ' no' : '') + '"><div><div class="rpk-m">' + esc(modelo(e)) + '</div>' +
      '<div class="rpk-s">' + esc(e.imei || 'Sin IMEI') + ' · ' + esc(TXT[e.estado_evaluacion] || e.estado_evaluacion || '') + (p.a ? ' → ' + esc(p.a) : '') +
      (av.length ? ' · <span class="rpk-av">' + esc(av.join(' · ')) + '</span>' : '') + '</div></div>' +
      '<div class="rpk-der">' + sel + '<span class="rpk-paso ' + p.k + '">' + esc(p.txt) + '</span></div>' +
      '<button type="button" class="rpk-x" data-quitar="' + i + '" aria-label="Quitar">✕</button></div>';
  }).join('') : '<div class="rpk-vacio">' + (S.tecGrupo ? 'Escanee el primer equipo para ' + esc((nomTec(S.tecGrupo) || '').split(' ')[0] || 'el técnico') + '.' : 'Toque «Seleccionar técnico» y pase los equipos.') + '</div>';
  L.querySelectorAll('[data-quitar]').forEach(function(b){ b.onclick = function(){ S.filas.splice(Number(b.getAttribute('data-quitar')), 1); pintar(); enfocar(); }; });
  L.querySelectorAll('[data-tec]').forEach(function(s){ s.onchange = function(){ S.filas[Number(s.getAttribute('data-tec'))].tec = s.value; resumen(); }; });
  resumen();
}
function enfocar(){ var i = document.getElementById('rpkIn'); if (i) try { i.focus(); } catch(_){} }
function grupos(){
  var g = { asignar: [], listo: [], recibio: [], calidad: [], aprobar: [], despachar: [], evaluar: [], nada: [] };
  S.filas.forEach(function(f){ g[f.paso.k].push(f); });
  return g;
}
function resumen(){
  var g = grupos(), r = document.getElementById('rpkRes'), b = document.getElementById('rpkAplicar'); if (!r || !b) return;
  var partes = [];
  if (g.asignar.length) partes.push('<span><b>' + g.asignar.length + '</b> a técnico</span>');
  if (g.listo.length) partes.push('<span><b>' + g.listo.length + '</b> terminados</span>');
  if (g.recibio.length) partes.push('<span><b>' + g.recibio.length + '</b> recibidos</span>');
  if (g.calidad.length) partes.push('<span><b>' + g.calidad.length + '</b> a calidad</span>');
  if (g.aprobar.length) partes.push('<span><b>' + g.aprobar.length + '</b> aprobados</span>');
  if (g.despachar.length) partes.push('<span><b>' + g.despachar.length + '</b> por despachar</span>');
  if (g.evaluar.length) partes.push('<span><b>' + g.evaluar.length + '</b> sin evaluar</span>');
  r.innerHTML = partes.join(' · ');
  var n = g.asignar.length + g.listo.length + g.recibio.length + g.calidad.length + g.aprobar.length + g.despachar.length;
  b.disabled = !n; b.textContent = n ? 'Aplicar ' + n : 'Aplicar';
}

async function aplicar(){
  if (!S) return;
  var g = grupos(), btn = document.getElementById('rpkAplicar');
  var sinTec = g.asignar.filter(function(f){ return !f.tec; });
  if (sinTec.length) return mal('Falta el técnico en ' + sinTec.length + ' equipo' + (sinTec.length > 1 ? 's' : ''));
  btn.disabled = true; var orig = btn.textContent; btn.textContent = 'Aplicando…';
  var hechos = { a: 0, l: 0 }, fallo = '';
  try {
    // 1 · Evaluado → En reparación, por técnico
    var porTec = {}; g.asignar.forEach(function(f){ (porTec[f.tec] = porTec[f.tec] || []).push(f.e.id); });
    var tecs = Object.keys(porTec);
    for (var i = 0; i < tecs.length; i++) {
      var t = tecs[i], ids = porTec[t], nombre = nomTec(t) || 'técnico';
      var r = await sb().from('equipos_refurbish').update({ tecnico_asignado_id: t, fecha_asignacion: new Date().toISOString(), estado_evaluacion: 'en_proceso' }).in('id', ids);
      if (r.error) throw r.error;
      try { await sb().from('equipo_historial').insert(ids.map(function(id){ return { equipo_id: id, estado_anterior: 'evaluado', estado_nuevo: 'en_proceso', accion: 'Asignado a ' + nombre + ' (pistola)', usuario: usuario() }; })); } catch(_){}
      for (var k = 0; k < ids.length; k++) { try { await asignarFallasSinDueno('equipo', ids[k], t); } catch(_){} }
      hechos.a += ids.length;
    }
    // 2 · Pasos de un solo estado (Terminado, Técnico recibió, A calidad, Aprobar). Uno por uno: si el servidor frena uno, siguen los demás.
    var frenados = [], mov = g.listo.concat(g.recibio, g.calidad, g.aprobar);
    for (var j = 0; j < mov.length; j++) {
      var e = mov[j].e, kk = mov[j].paso.k, dest = DESTINO[kk], upd = { estado_evaluacion: dest };
      if (dest === 'listo_venta') upd.fecha_terminado = new Date().toISOString();
      var r2 = await sb().from('equipos_refurbish').update(upd).eq('id', e.id);
      if (r2.error) { frenados.push(modelo(e) + ': ' + (r2.error.message || 'no se pudo')); continue; }
      try { await sb().from('equipo_historial').insert([{ equipo_id: e.id, estado_anterior: e.estado_evaluacion, estado_nuevo: dest, accion: HIST[kk], usuario: usuario() }]); } catch(_){}
      hechos.l++;
    }
    if (frenados.length) fallo = frenados.length + ' no pasaron. ' + frenados[0];
  } catch(err) {
    try { logError('Pasar con pistola', err); } catch(_){}
    fallo = (typeof getFriendlyError === 'function' ? getFriendlyError(err) : (err && err.message)) || 'No se pudo aplicar';
  }
  var idsDesp = g.despachar.map(function(f){ return f.e.id; });
  var msg = [];
  if (hechos.a) msg.push(hechos.a + ' a técnico');
  if (hechos.l) msg.push(hechos.l + (modo() === 'completo' ? ' avanzaron' : ' listos'));
  if (msg.length) ok(msg.join(' · '));
  if (fallo) mal(fallo);
  var entregados = {}; if (hechos.a) g.asignar.slice().reverse().forEach(function(f){ (entregados[f.tec] = entregados[f.tec] || []).push(f.e.id); });
  cerrar();
  if (hechos.a || hechos.l) await refrescar();
  if (idsDesp.length) despachar(idsDesp);
  else if (hechos.a) ofrecerHoja(entregados);
}

async function refrescar(){
  try { if (typeof loadAll === 'function') await loadAll(); } catch(_){}
  try { if (typeof cargarLotesReacond === 'function') cargarLotesReacond(); } catch(_){}
  try { if (typeof reacondLoteAbiertoId !== 'undefined' && reacondLoteAbiertoId && typeof renderDetalleLoteReacond === 'function') renderDetalleLoteReacond(); } catch(_){}
}

/* ───────── Hoja de entrega al técnico (con las fallas del diagnóstico) ───────── */
function ofrecerHoja(porTec){
  var tecs = Object.keys(porTec || {}); if (!tecs.length) return;
  estilos();
  var n = tecs.reduce(function(a, t){ return a + porTec[t].length; }, 0);
  var quien = tecs.map(function(t){ return (nomTec(t) || 'Técnico').split(' ')[0]; }).join(', ');
  var box = document.createElement('div'); box.className = 'modal-backdrop active'; box.id = 'rpkHoja'; box.style.zIndex = '600';
  box.innerHTML = '<div class="modal-box" style="max-width:440px;width:92%;"><div class="modal-header"><h3 style="margin:0;"><i class="ti ti-printer"></i> Hoja de entrega</h3><button class="modal-close" type="button" aria-label="Cerrar">✕</button></div>' +
    '<div class="modal-body"><p style="margin:0;font-size:15px;">' + n + ' equipo' + (n > 1 ? 's' : '') + ' entregado' + (n > 1 ? 's' : '') + ' a <b>' + esc(quien) + '</b>.</p>' +
    '<p class="rpk-ayuda" style="margin-top:6px;">La hoja lleva cada equipo con las fallas de su diagnóstico, para que el técnico las marque al repararlas, y las firmas.</p></div>' +
    '<div class="modal-footer"><button class="btn btn-light" type="button" data-x style="min-height:44px;">Ahora no</button><button class="btn btn-blue rpk-ok" type="button" data-imp><i class="ti ti-printer"></i> Imprimir hoja</button></div></div>';
  document.body.appendChild(box);
  var fuera = function(){ box.remove(); };
  box.querySelector('.modal-close').onclick = fuera; box.querySelector('[data-x]').onclick = fuera;
  box.querySelector('[data-imp]').onclick = function(){ fuera(); imprimirHoja(porTec); };
  setTimeout(function(){ try { box.querySelector('[data-imp]').focus(); } catch(_){} }, 60);
}
function loteDe(e){ try { var l = (cache.lotes || []).find(function(x){ return x.id === e.lote_id; }); return l ? (l.codigo_lote || l.nombre || '') : ''; } catch(_) { return ''; } }
function capDe(e){ var c = String(e.capacidad || '').trim(); return c && modelo(e).toUpperCase().indexOf(c.toUpperCase()) < 0 ? c : ''; } // sin repetir «128GB»
function colorDe(e){ var c = String(e.color || '').trim(); return (c && !/\d+\s*(gb|tb)|ram/i.test(c)) ? c : ''; }
async function fallasDe(ids){
  var out = {}; ids.forEach(function(id){ out[id] = null; });
  if (!sb() || !ids.length) return out;
  try {
    var r = await sb().from('equipo_fallas').select('equipo_id, falla_nombre, falla_corto, nota, adicional, creado_en').in('equipo_id', ids);
    if (r.error) throw r.error;
    ids.forEach(function(id){ out[id] = []; });
    (r.data || []).slice().sort(function(a, b){ return String(a.creado_en || '').localeCompare(String(b.creado_en || '')); })
      .forEach(function(f){ if (out[f.equipo_id]) out[f.equipo_id].push(f); });
  } catch(_){}
  return out;
}
/* La ventana se abre en el mismo toque (si no, el navegador la bloquea) y se llena cuando llegan las fallas. */
async function imprimirHoja(porTec){
  var w = null; try { w = window.open('', '_blank'); } catch(_){}
  if (!w) return mal('Permita las ventanas emergentes para imprimir');
  try { w.document.write('<p style="font:16px Arial;padding:24px">Preparando la hoja…</p>'); } catch(_){}
  var tecs = Object.keys(porTec), todos = [];
  tecs.forEach(function(t){ todos = todos.concat(porTec[t]); });
  var F = await fallasDe(todos), R = refurb();
  var tienda = 'BAYOL CELL'; try { tienda = (cache.configTaller && cache.configTaller.nombre) || tienda; } catch(_){}
  var ahora = new Date().toLocaleString('es-DO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  var paginas = tecs.map(function(t, ti){
    var eqs = porTec[t].map(function(id){ return R.find(function(e){ return e.id === id; }); }).filter(Boolean);
    var porModelo = {}; eqs.forEach(function(e){ var m = modelo(e) + (capDe(e) ? ' ' + capDe(e) : ''); porModelo[m] = (porModelo[m] || 0) + 1; });
    var totFallas = 0;
    var filas = eqs.map(function(e, i){
      var fs = F[e.id], nota = String(e.notas_diagnostico || '').trim(), datos = [capDe(e), colorDe(e), loteDe(e) ? 'Lote ' + loteDe(e) : ''].filter(Boolean).join(' · ');
      var lista;
      if (fs === null) lista = '<div class="sin">No se pudieron cargar las fallas</div>';
      else if (!fs.length) lista = '<div class="sin">Sin fallas anotadas</div>';
      else { totFallas += fs.length; lista = '<ul>' + fs.map(function(f){ return '<li><span class="cj"></span>' + esc(f.falla_nombre || f.falla_corto || 'Falla') + (f.adicional ? ' <em>(agregada)</em>' : '') + (f.nota ? '<div class="fn">' + esc(f.nota) + '</div>' : '') + '</li>'; }).join('') + '</ul>'; }
      return '<tr><td class="n">' + (i + 1) + '</td><td><b>' + esc(modelo(e)) + '</b>' + (datos ? '<div class="d">' + esc(datos) + '</div>' : '') + '<div class="imei">' + esc(e.imei || 'Sin IMEI') + '</div></td>' +
        '<td>' + lista + (nota ? '<div class="nota"><b>Nota:</b> ' + esc(nota) + '</div>' : '') + '</td><td class="rc"><span class="cj g"></span></td></tr>';
    }).join('');
    var nom = nomTec(t) || 'Técnico';
    return '<section' + (ti ? ' class="pb"' : '') + '><header><div><h1>' + esc(tienda) + '</h1><h2>Hoja de entrega a técnico · Reacondicionados</h2></div><div class="fe">' + esc(ahora) + '</div></header>' +
      '<div class="cab"><div><small>Técnico</small><b>' + esc(nom) + '</b></div><div><small>Entregado por</small><b>' + esc(usuario()) + '</b></div><div><small>Equipos</small><b>' + eqs.length + '</b></div><div><small>Fallas a reparar</small><b>' + totFallas + '</b></div></div>' +
      '<div class="res">' + Object.keys(porModelo).map(function(m){ return '<span>' + porModelo[m] + ' × ' + esc(m) + '</span>'; }).join('') + '</div>' +
      '<table><thead><tr><th class="n">#</th><th style="width:34%">Equipo e IMEI</th><th>Fallas del diagnóstico (marque al reparar)</th><th class="rc">Recibido</th></tr></thead><tbody>' + filas + '</tbody></table>' +
      '<div class="firma"><div>Entregado por</div><div>Recibido por (' + esc(nom) + ')</div></div></section>';
  }).join('');
  var html = '<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Hoja de entrega</title><style>' +
    '@page{size:letter;margin:12mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;margin:0;padding:16px;font-size:12.5px}' +
    'header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0f172a;padding-bottom:6px}h1{font-size:19px;margin:0}h2{font-size:13px;margin:2px 0 0;color:#334155;font-weight:600}.fe{font-size:12px;color:#334155}' +
    '.cab{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0 6px}.cab div{border:1px solid #cbd5e1;border-radius:6px;padding:5px 8px}.cab small{display:block;font-size:10.5px;color:#475569}.cab b{font-size:14px}' +
    '.res{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px}.res span{border:1px solid #cbd5e1;border-radius:999px;padding:2px 9px;font-size:11.5px}' +
    'table{width:100%;border-collapse:collapse}th,td{border:1px solid #94a3b8;padding:6px 7px;vertical-align:top;text-align:left}th{background:#e2e8f0;font-size:11.5px}tr{page-break-inside:avoid}' +
    '.n{width:26px;text-align:center}.rc{width:62px;text-align:center}.d{font-size:11px;color:#334155;margin-top:1px}.imei{font-family:Consolas,Menlo,monospace;font-size:12.5px;margin-top:3px;letter-spacing:.3px}' +
    'ul{list-style:none;margin:0;padding:0}li{margin:0 0 4px;padding-left:20px;position:relative}li .cj{position:absolute;left:0;top:1px}em{color:#475569;font-size:11px}.fn{font-size:11px;color:#334155}' +
    '.cj{display:inline-block;width:13px;height:13px;border:1.3px solid #0f172a;border-radius:2px}.cj.g{width:18px;height:18px;margin-top:2px}.sin{color:#64748b;font-style:italic}.nota{margin-top:4px;font-size:11.5px;border-top:1px dashed #cbd5e1;padding-top:3px}' +
    '.firma{margin-top:40px;display:flex;gap:40px}.firma div{flex:1;border-top:1px solid #0f172a;padding-top:5px;text-align:center;font-size:12px}.pb{page-break-before:always}' +
    '</style></head><body>' + paginas + '<script>window.onload=function(){setTimeout(function(){window.print();},250);};<\/script></body></html>';
  try { w.document.open(); w.document.write(html); w.document.close(); w.focus(); } catch(_) { mal('No se pudo preparar la hoja'); }
}

/* Despachar: se usa la ventana de siempre («Despachar listos en bloque») y se dejan marcados solo los escaneados. */
function despachar(ids){
  var smart = window.BayolReacondSmart;
  if (!smart || typeof smart.despachar !== 'function') return mal('Use «Despachar en bloque» del tablero');
  try { smart.despachar(); } catch(_) { return mal('No se pudo abrir el despacho'); }
  var b = document.getElementById('rssDespacho'); if (!b) return;
  var set = {}; ids.forEach(function(id){ set[id] = 1; });
  var cajas = b.querySelectorAll('.rss-chk[data-id]'), ultima = null;
  cajas.forEach(function(c){ c.checked = !!set[c.getAttribute('data-id')]; ultima = c; });
  if (ultima) { try { ultima.onchange(); } catch(_){} }
  var primera = b.querySelector('.rss-chk[data-id]:checked');
  if (primera) { try { primera.scrollIntoView({ block: 'center' }); } catch(_){} }
}

/* Botón en el tablero «Lo que está parado» (lo pinta taller-reacond-smart.js y lo vuelve a pintar cada vez). */
function ponerBoton(){
  if (!puede()) return;
  var head = document.querySelector('#rssTablero .rss-head'); if (!head || head.querySelector('.rpk-btn')) return;
  estilos();
  var b = document.createElement('button'); b.type = 'button'; b.className = 'rpk-btn';
  b.innerHTML = '<i class="ti ti-scan"></i> Asignar equipo';
  b.onclick = abrir;
  head.style.display = 'flex'; head.style.alignItems = 'center'; head.style.flexWrap = 'wrap'; head.style.gap = '8px';
  head.appendChild(b);
}
function vigilar(){
  try {
    new MutationObserver(function(){ ponerBoton(); }).observe(document.body, { childList: true, subtree: true });
    ponerBoton();
  } catch(_){}
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', vigilar); else vigilar();

window.BayolReacondPistola = { version: VERSION, abrir: abrir, paso: paso, buscar: buscar, modo: modo, hoja: imprimirHoja, ofrecerHoja: ofrecerHoja };
})();
