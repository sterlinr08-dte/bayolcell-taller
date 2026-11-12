/* BAYOL CELL · taller · Reacondicionados «Costado» (12-nov-2026, dueño: reel de Moxen `DfnsWJABIDo`, «haz 1 y 2»).
 * Tocar un teléfono del lote abre su ficha AL COSTADO, sin tapar la lista:
 *   · PC (≥ 1100 px): panel fijo a la derecha; la lista se encoge y sigue a la vista.
 *   · Celular / tableta: hoja que sube desde abajo, con fondo para cerrar.
 *   · ↓ / J = siguiente · ↑ / K = anterior · Esc = cerrar (el foco vuelve a la fila).
 * Lo que muestra sale de la misma fila (modelo, IMEI, estado, técnico, costo: así respeta los permisos) más fallas,
 * piezas, tareas e historial del equipo. «Abrir equipo» hace exactamente lo que hacía tocar la fila (la ventana de
 * siempre). Las casillas, «Abrir» y los demás botones de la fila no cambian.
 * Funciones (dueño, 12-nov: «las nueve»): 1 siguiente paso · 2 marcar tareas (un toque hace y deshace) · 3 asignar técnico
 * (el sugerido primero) · 4 poner color · 5 copiar IMEI · 6 imprimir label · 7 historial completo · 8 editar evaluación ·
 * 9 seguir de corrido (al terminar un paso pasa al siguiente teléfono; se apaga con la casilla «Seguir»).
 * Ninguna escribe por su cuenta salvo marcar tareas: las demás llaman a las MISMAS funciones del sistema
 * (cambiarEstadoProceso, aprobarTerminado, marcarDespachado, confirmarAsignarTecnico…), con sus candados y su historial.
 * No toca taller-app.js. Apagar: localStorage.bc_reacond_costado_off = '1'  ·  window.BC_REACOND_COSTADO = false
 */
(function(){'use strict';
if (window.BayolReacondCostado) return;
try { if (window.BC_REACOND_COSTADO === false || localStorage.getItem('bc_reacond_costado_off') === '1') return; } catch(_){}
var VERSION = '20261112c3';
var pintado = '';        // estado del equipo cuando se pintó el panel (para repintar si cambia por fuera)
var ocupado = false;     // hay una acción en curso (no cerrar ni repetir)
var abierto = null;      // id del equipo abierto
var filaFoco = null;     // fila desde la que se abrió (para devolver el foco)
var memo = {};           // id → { t, fallas, hist }

function esc(s){ return (typeof escapeHtml === 'function') ? escapeHtml(s == null ? '' : String(s)) : String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]; }); }
function sb(){ try { return supabaseClient; } catch(_) { return null; } }
function lista(){ return document.getElementById('reacondEquiposLista'); }
function filas(){ var l = lista(); return l ? Array.prototype.slice.call(l.querySelectorAll('.bcf-card')) : []; }
function idDe(card){
  var k = card.querySelector('.bcf-chk'), s = (k && k.getAttribute('onclick')) || card.getAttribute('onclick') || '';
  var m = s.match(/_reacondToggleSel\('([^']+)'/) || s.match(/\('([^']+)'\)/);
  return m ? m[1] : '';
}
function txt(el){ return el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : ''; }
function ancho(){ return window.innerWidth >= 1100; }
function fecha(f){ try { return new Date(f).toLocaleDateString('es-DO', { day: 'numeric', month: 'short' }); } catch(_) { return ''; } }

function estilos(){
  if (document.getElementById('rcsStyles')) return;
  var st = document.createElement('style'); st.id = 'rcsStyles'; st.textContent =
  '#rcsPanel{position:fixed;z-index:95;background:#fff;color:#0f172a;display:flex;flex-direction:column;box-shadow:-12px 0 40px rgba(15,23,42,.14);border-left:1px solid rgba(15,23,42,.08);transition:transform 180ms cubic-bezier(.23,1,.32,1);}' +
  '#rcsPanel{top:0;right:0;bottom:0;width:400px;transform:translateX(102%);padding-bottom:env(safe-area-inset-bottom,0px);}' +
  '#rcsPanel.on{transform:none;}' +
  '#rcsFondo{position:fixed;inset:0;z-index:94;background:rgba(15,23,42,.35);opacity:0;pointer-events:none;transition:opacity 180ms ease;}' +
  '.rcs-h{display:flex;align-items:center;gap:8px;padding:12px 12px 10px 16px;border-bottom:1px solid rgba(15,23,42,.08);flex:none;}' +
  '.rcs-h b{font-size:17px;line-height:1.2;flex:1;min-width:0;overflow-wrap:anywhere;}' +
  '.rcs-ib{width:44px;height:44px;border-radius:50%;border:0;background:#f1f5f9;color:#334155;font-size:18px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;flex:none;}' +
  '.rcs-ib:active{transform:scale(.94);}.rcs-ib[disabled]{opacity:.35;cursor:default;}' +
  '.rcs-b{flex:1;overflow:auto;padding:12px 16px;display:flex;flex-direction:column;gap:14px;-webkit-overflow-scrolling:touch;}' +
  '.rcs-top{display:flex;gap:12px;align-items:center;}' +
  '.rcs-img{width:64px;height:64px;border-radius:14px;background:#f1f5f9;flex:none;overflow:hidden;display:flex;align-items:center;justify-content:center;}.rcs-img > *{max-width:100%;max-height:100%;object-fit:contain;}' +
  '.rcs-sub{font-size:13px;color:#64748b;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}' +
  '.rcs-kv{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;}' +
  '.rcs-kv div{border:1px solid rgba(15,23,42,.08);border-radius:12px;padding:8px 10px;min-width:0;}' +
  '.rcs-kv small{display:block;font-size:11px;color:#64748b;}.rcs-kv span{font-size:14px;font-weight:700;overflow-wrap:anywhere;font-variant-numeric:tabular-nums;}' +
  '.rcs-t{font-size:12px;font-weight:800;color:#64748b;margin:0 0 6px;}' +
  '.rcs-tags{display:flex;flex-wrap:wrap;gap:6px;}' +
  '.rcs-tag{font-size:12.5px;font-weight:600;padding:5px 10px;border-radius:999px;background:#f1f5f9;color:#334155;}' +
  '.rcs-tag.pz{background:#ecfeff;color:#0e7490;}.rcs-tag.ok{background:#f0fdf4;color:#15803d;}.rcs-tag.pe{background:#fef3c7;color:#b45309;}' +
  '.rcs-nota{font-size:13px;color:#334155;background:#f8fafc;border-radius:12px;padding:8px 10px;overflow-wrap:anywhere;}' +
  '.rcs-vacio{font-size:13px;color:#94a3b8;}' +
  '.rcs-hist{display:flex;flex-direction:column;gap:6px;font-size:13px;}.rcs-hist div{display:flex;gap:8px;}.rcs-hist time{color:#94a3b8;flex:none;width:52px;font-variant-numeric:tabular-nums;}' +
  '.rcs-f{flex:none;padding:10px 16px 12px;border-top:1px solid rgba(15,23,42,.08);display:flex;flex-direction:column;gap:8px;}' +
  '.rcs-f2{display:flex;gap:8px;align-items:center;}' +
  '.rcs-paso{width:100%;min-height:54px;border:0;border-radius:14px;background:linear-gradient(135deg,#ff6b35,#e4572e);color:#fff;font-weight:800;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;padding:0 14px;}' +
  '.rcs-paso:active,.rcs-abrir:active,.rcs-ac:active,button.rcs-tag:active{transform:scale(.97);}' +
  '.rcs-paso[disabled],.rcs-ac[disabled],button.rcs-tag[disabled]{opacity:.55;cursor:default;}' +
  '.rcs-paso[hidden]{display:none;}' +
  '.rcs-abrir{flex:1;min-height:44px;border:1px solid rgba(15,23,42,.12);border-radius:12px;background:#fff;color:#0f172a;font-weight:700;font-size:14px;cursor:pointer;}' +
  '.rcs-seg{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 10px;border-radius:12px;font-size:13px;font-weight:600;color:#334155;cursor:pointer;white-space:nowrap;}' +
  '#rcsPanel .rcs-seg input{width:22px !important;height:22px !important;min-width:0 !important;min-height:0 !important;flex:none;accent-color:#e4572e;margin:0;border-radius:6px;}' +
  '#rcsAcs:empty,#rcsAsig:empty{display:none;}' +
  '#rcsPanel button,#rcsPanel label{touch-action:manipulation;-webkit-tap-highlight-color:transparent;}' +
  '#rcsPanel button:focus-visible,#rcsPanel .rcs-seg:focus-within{outline:3px solid #2563eb;outline-offset:2px;}' +
  '.rcs-b{overscroll-behavior:contain;}#rcsPanel .ti{pointer-events:none;}' +
  '@media (hover:hover){.rcs-ib:not([disabled]):hover{background:#e2e8f0;}.rcs-ac:not([disabled]):hover,.rcs-abrir:not([disabled]):hover{background:#f8fafc;border-color:rgba(15,23,42,.24);}.rcs-paso:not([disabled]):hover{filter:brightness(1.05);}button.rcs-tag:not([disabled]):hover{filter:brightness(.96);}}' +
  '@media (min-width:1100px){html.rcs-abierto .toast{right:432px !important;}}' +
  '@media (max-width:1099.98px){html.rcs-abierto .toast{bottom:auto !important;top:calc(12px + env(safe-area-inset-top,0px)) !important;}}' +
  '.rcs-acs{display:flex;flex-wrap:wrap;gap:8px;}' +
  '.rcs-ac{min-height:44px;padding:0 12px;border-radius:12px;border:1px solid rgba(15,23,42,.12);background:#fff;color:#0f172a;font-size:13.5px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}' +
  '.rcs-ac b{font-weight:700;}.rcs-ac em{font-style:normal;font-size:11px;font-weight:700;color:#b45309;background:#fef3c7;border-radius:999px;padding:2px 7px;}' +
  'button.rcs-tag{border:0;min-height:44px;padding:0 14px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-family:inherit;}' +
  '.rcs-th{display:flex;align-items:center;justify-content:space-between;gap:8px;}.rcs-th .rcs-t{margin:0;}' +
  '.rcs-aviso{font-size:12.5px;color:#b45309;margin:0;text-align:center;}' +
  '.rcs-tecla{font-size:11.5px;color:#94a3b8;white-space:nowrap;}' +
  '#reacondEquiposLista .bcf-card.rcs-act{box-shadow:0 0 0 2px #2563eb !important;background:rgba(59,130,246,.06) !important;}' +
  '@media (min-width:1100px){html.rcs-abierto #app #v-refurb{padding-right:412px;transition:padding-right 180ms cubic-bezier(.23,1,.32,1);}}' +
  '@media (max-width:1099.98px){#rcsPanel{top:auto;left:0;right:0;bottom:0;width:auto;max-height:86vh;border-left:0;border-radius:20px 20px 0 0;transform:translateY(102%);box-shadow:0 -12px 40px rgba(15,23,42,.18);}' +
    '#rcsPanel::before{content:"";width:40px;height:4px;border-radius:2px;background:#cbd5e1;align-self:center;margin-top:8px;flex:none;}' +
    'html.rcs-abierto #rcsFondo{opacity:1;pointer-events:auto;}.rcs-tecla{display:none;}.rcs-seg{flex:none;}}' +
  '@media (prefers-reduced-motion:reduce){#rcsPanel,#rcsFondo,html.rcs-abierto #app #v-refurb{transition:none;}}';
  document.head.appendChild(st);
}

function panel(){
  var p = document.getElementById('rcsPanel'); if (p) return p;
  estilos();
  var f = document.createElement('div'); f.id = 'rcsFondo'; f.onclick = cerrar; document.body.appendChild(f);
  p = document.createElement('aside'); p.id = 'rcsPanel'; p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'Ficha del equipo'); p.tabIndex = -1;
  p.innerHTML = '<div class="rcs-h"><b id="rcsTit"></b><button type="button" class="rcs-ib" data-ant aria-label="Anterior"><i aria-hidden="true" class="ti ti-chevron-up"></i></button><button type="button" class="rcs-ib" data-sig aria-label="Siguiente"><i aria-hidden="true" class="ti ti-chevron-down"></i></button><button type="button" class="rcs-ib" data-x aria-label="Cerrar"><i aria-hidden="true" class="ti ti-x"></i></button></div>' +
    '<div class="rcs-b" id="rcsCuerpo"></div>' +
    '<div class="rcs-f"><p class="rcs-aviso" id="rcsAviso" role="status" aria-live="polite" hidden></p><button type="button" class="rcs-paso" id="rcsPaso" hidden></button>' +
    '<div class="rcs-f2"><button type="button" class="rcs-abrir" id="rcsAbrir">Abrir equipo</button><label class="rcs-seg" title="Al terminar un paso, pasa al siguiente teléfono"><input type="checkbox" id="rcsSeguir"> Seguir</label><span class="rcs-tecla">↑ ↓ · Esc</span></div></div>';
  document.body.appendChild(p); try { p.inert = true; } catch(_){}
  p.querySelector('[data-x]').onclick = cerrar;
  p.querySelector('[data-ant]').onclick = function(){ mover(-1); };
  p.querySelector('[data-sig]').onclick = function(){ mover(1); };
  var sg = p.querySelector('#rcsSeguir'); sg.checked = seguir();
  sg.onchange = function(){ try { localStorage.setItem('bc_reacond_costado_seguir', sg.checked ? '1' : '0'); } catch(_){} };
  p.querySelector('#rcsPaso').onclick = function(){ if (abierto) darPaso(abierto); };
  p.querySelector('#rcsCuerpo').addEventListener('click', function(ev){
    var b = ev.target.closest && ev.target.closest('[data-ac],[data-tarea],[data-tec]'); if (!b || !abierto || b.disabled) return;
    if (b.hasAttribute('data-tarea')) return void tarea(abierto, b.getAttribute('data-tarea'));
    if (b.hasAttribute('data-tec')) return void hacer(abierto, function(){ return asignar(abierto, b.getAttribute('data-tec')); });
    accion(abierto, b.getAttribute('data-ac'));
  });
  p.querySelector('#rcsAbrir').onclick = function(){
    var c = filaDe(abierto); cerrar(true);
    if (c) { var b = c.querySelector('.bcf-abrir'); _paso = true; try { (b || c).click(); } finally { _paso = false; } }
  };
  return p;
}
var _paso = false; // deja pasar el clic de «Abrir equipo» hacia la ventana de siempre
function filaDe(id){ return filas().find(function(c){ return idDe(c) === id; }) || null; }

function abrir(card){
  var id = idDe(card); if (!id) return false;
  var p = panel(); var e0 = eq(id); pintado = e0 ? (e0.estado_evaluacion || 'pendiente') : '';
  filas().forEach(function(c){ c.classList.toggle('rcs-act', c === card); });
  if (!abierto) filaFoco = card;
  abierto = id;
  var F = filas(), i = F.indexOf(card);
  p.querySelector('[data-ant]').disabled = i <= 0; p.querySelector('[data-sig]').disabled = i >= F.length - 1;
  p.querySelector('#rcsTit').textContent = txt(card.querySelector('.bcf-tit')) || 'Equipo';
  var med = card.querySelector('.bcf-media'), tag = card.querySelector('.bcf-tag');
  var tec = txt(card.querySelector('.bcf-per-txt b'));
  var pie = Array.prototype.slice.call(card.querySelectorAll('.bcf-f > *')).map(txt).filter(Boolean);
  var chips = Array.prototype.slice.call(card.querySelectorAll('.bcf-chip')).map(txt).filter(Boolean), nota = txt(card.querySelector('.bcf-nota'));
  var kv = [['Estado', txt(tag)], ['Técnico', tec || 'Sin asignar']];
  Array.prototype.slice.call(card.querySelectorAll('.rcu-res > div')).forEach(function(d){ var v = txt(d.querySelector('b')); if (v) kv.push([txt(d.querySelector('small')) || 'Dato', v]); });
  pie.forEach(function(t, k){ kv.push([['Capacidad', 'Color', 'En este paso'][k] || 'Dato', t]); });
  document.getElementById('rcsCuerpo').innerHTML =
    '<div class="rcs-top"><div class="rcs-img">' + (med && med.innerHTML.trim() ? med.innerHTML : '<i aria-hidden="true" class="ti ti-device-mobile"></i>') + '</div><div style="min-width:0"><div class="rcs-sub">' + esc(txt(card.querySelector('.bcf-sub'))) + '</div></div></div>' +
    '<div class="rcs-acs" id="rcsAcs"></div><div id="rcsAsig"></div>' +
    '<div class="rcs-kv">' + kv.map(function(x){ return '<div><small>' + esc(x[0]) + '</small><span>' + esc(x[1]) + '</span></div>'; }).join('') + '</div>' +
    (chips.length ? '<div class="rcs-tags">' + chips.map(function(t){ return '<span class="rcs-tag pe">' + esc(t) + '</span>'; }).join('') + '</div>' : '') +
    (nota ? '<div class="rcs-nota">' + esc(nota) + '</div>' : '') +
    '<div><p class="rcs-t">Fallas</p><div class="rcs-tags" id="rcsFallas"><span class="rcs-vacio">Cargando…</span></div></div>' +
    '<div><p class="rcs-t">Piezas</p><div class="rcs-tags" id="rcsPiezas"></div></div>' +
    '<div><p class="rcs-t">Tareas</p><div class="rcs-tags" id="rcsTareas"></div></div>' +
    '<div><div class="rcs-th"><p class="rcs-t">Últimos movimientos</p><button type="button" class="rcs-ac" data-ac="historial">Ver todo</button></div><div class="rcs-hist" id="rcsHist"><span class="rcs-vacio">Cargando…</span></div></div>';
  pintarLocal(id);
  try { p.inert = false; } catch(_){}
  document.documentElement.classList.add('rcs-abierto');
  requestAnimationFrame(function(){ p.classList.add('on'); });
  try { card.scrollIntoView({ block: 'nearest' }); } catch(_){}
  cargar(id);
  return true;
}
function pintarLocal(id){
  var pz = [], ta = [];
  try { pz = (cache.piezasReacond || []).filter(function(x){ return x.equipo_id === id && ['devuelta', 'rechazada'].indexOf(x.estado) < 0; }); } catch(_){}
  try { ta = (cache.tareas || []).filter(function(x){ return x.tipo === 'equipo' && x.ref_id === id; }); } catch(_){}
  var P = document.getElementById('rcsPiezas'), T = document.getElementById('rcsTareas');
  if (P) P.innerHTML = pz.length ? pz.map(function(x){ return '<span class="rcs-tag pz">' + esc(x.pieza_nombre || 'Pieza') + (Number(x.cantidad) > 1 ? ' ×' + x.cantidad : '') + '</span>'; }).join('') : '<span class="rcs-vacio">Ninguna</span>';
  var e = eq(id), st = e ? (e.estado_evaluacion || 'pendiente') : '', fijo = !e || st === 'listo_venta' || st === 'vendido';
  if (T) T.innerHTML = ta.length ? ta.map(function(x){ var h = x.estado === 'hecha', c = 'rcs-tag ' + (h ? 'ok' : 'pe'), t = (h ? '<i aria-hidden="true" class="ti ti-check"></i>' : '<i aria-hidden="true" class="ti ti-circle"></i>') + esc(x.descripcion || 'Tarea');
    return (fijo || !puedeTarea(x)) ? '<span class="' + c + '">' + t + '</span>' : '<button type="button" class="' + c + '" data-tarea="' + esc(x.id) + '" aria-pressed="' + h + '" title="' + (h ? 'Tocar para reabrir' : 'Tocar para marcar hecha') + '">' + t + '</button>'; }).join('') : '<span class="rcs-vacio">Ninguna</span>';
  pintarAcciones(id, ta);
}
/* ───────── Funciones desde el panel ───────── */
function eq(id){ try { return (cache.refurb || []).find(function(r){ return r.id === id; }) || null; } catch(_) { return null; } }
function G(n){ try { return typeof window[n] === 'function' ? window[n] : null; } catch(_) { return null; } }
function aviso(m, t){ try { toast(m, t); } catch(_){} }
function admin(){ try { return !!isAdminUser(); } catch(_) { return false; } }
function perm(k){ try { return admin() || !!tienePermiso(k); } catch(_) { return false; } }
function yo(){ try { return (sessionUser && sessionUser.id) || ''; } catch(_) { return ''; } }
function puedeTarea(t){ return admin() || (!!t && !!t.tecnico_id && t.tecnico_id === yo()); } // igual que la ventana del proceso
function dialogo(){ return !!(document.getElementById('modalConfirm') || document.getElementById('modalPrompt') || document.querySelector('.modal-backdrop.active')); }
function seguir(){ try { return localStorage.getItem('bc_reacond_costado_seguir') !== '0'; } catch(_) { return true; } }
function pasoDe(e){
  var s = (e && e.estado_evaluacion) || 'pendiente';
  if (s === 'pendiente') return { k: 'evaluar', txt: 'Empezar diagnóstico', ico: 'ti-stethoscope' };
  if (s === 'en_evaluacion') return { k: 'evaluar', txt: 'Seguir diagnóstico', ico: 'ti-stethoscope' };
  if (s === 'evaluado') return { k: 'asignar', txt: 'Asignar técnico', ico: 'ti-user-check' };
  if (s === 'en_proceso') return { k: 'recibio', txt: 'Técnico recibió', ico: 'ti-package' };
  // Reasignado: lo recibe solo el técnico nuevo, con decisión de piezas (recibirEquipoReasignado). Aquí no hay atajo: «Abrir equipo».
  if (s === 'reasignado') return null;
  if (s === 'reparacion_externa') return { k: 'recibio', txt: 'Volvió de reparación externa', ico: 'ti-rotate' };
  if (s === 'tecnico_recibio' || s === 'espera_pieza') return { k: 'calidad', txt: 'Enviar a calidad', ico: 'ti-shield-check' };
  if (s === 'listo_revision') return perm('piezas_aprobar_extra') ? { k: 'aprobar', txt: 'Aprobar calidad', ico: 'ti-circle-check' } : null;
  if (s === 'listo_venta') return perm('estado_despachar') ? { k: 'despachar', txt: 'Registrar salida', ico: 'ti-truck-delivery' } : null;
  return null;
}
function tecnicosAct(){ try { return (cache.tecnicos || []).filter(function(t){ return t.activo; }); } catch(_) { return []; } }
function sugerido(e){ try { var s = window.BayolReacondSmart && BayolReacondSmart.sugerir ? BayolReacondSmart.sugerir([e]) : null; return (s && s[e.id]) || ''; } catch(_) { return ''; } }
function pintarAcciones(id, ta){
  var e = eq(id), A = document.getElementById('rcsAcs'), S = document.getElementById('rcsAsig'), B = document.getElementById('rcsPaso'), V = document.getElementById('rcsAviso');
  if (!A || !B) return;
  var st = e ? (e.estado_evaluacion || 'pendiente') : '', ac = [];
  if (e && e.imei) ac.push(['imei', 'ti-copy', 'Copiar IMEI']);
  if (e && G('abrirColoresLote')) ac.push(['color', 'ti-palette', 'Color']);
  if (e && (st === 'listo_venta' || st === 'vendido') && G('imprimirLabelEquipo')) ac.push(['label', 'ti-printer', 'Label']);
  if (e && st === 'evaluado' && G('continuarEvaluacion')) ac.push(['evaluacion', 'ti-pencil', 'Editar evaluación']);
  A.innerHTML = ac.map(function(x){ return '<button type="button" class="rcs-ac" data-ac="' + x[0] + '"><i aria-hidden="true" class="ti ' + x[1] + '"></i>' + x[2] + '</button>'; }).join('');
  var p = e ? pasoDe(e) : null, txtB = p ? p.txt : '', sug = '';
  if (S) S.innerHTML = '';
  if (p && p.k === 'asignar') {
    var T = tecnicosAct(); sug = sugerido(e); var ts = T.find(function(t){ return t.id === sug; });
    if (ts) txtB = 'Asignar a ' + String(ts.nombre || '').split(' ').slice(0, 2).join(' ');
    var otros = T.filter(function(t){ return t.id !== sug; });
    if (S && otros.length) S.innerHTML = '<p class="rcs-t">' + (ts ? 'O asignar a' : 'Asignar a') + '</p><div class="rcs-acs">' + otros.map(function(t){ return '<button type="button" class="rcs-ac" data-tec="' + esc(t.id) + '"><i aria-hidden="true" class="ti ti-user"></i>' + esc(t.nombre) + '</button>'; }).join('') + '</div>';
    if (!ts && !otros.length) p = null;
    else if (!ts) { B.hidden = true; B.removeAttribute('data-tec'); if (V) V.hidden = true; return; }
  }
  B.hidden = !p; if (!p) { if (V) V.hidden = true; return; }
  B.innerHTML = '<i aria-hidden="true" class="ti ' + p.ico + '"></i><span>' + esc(txtB) + '</span>';
  B.setAttribute('data-k', p.k); if (sug) B.setAttribute('data-tec', sug); else B.removeAttribute('data-tec');
  var pend = (ta || []).filter(function(x){ return x.estado !== 'hecha'; }).length;
  if (V) { V.hidden = !(p.k === 'calidad' && pend > 0); V.textContent = pend === 1 ? 'Falta 1 tarea' : 'Faltan ' + pend + ' tareas'; }
}
/* Corre una acción y deja el panel al día. Si el equipo cambió de estado y «Seguir» está marcado, pasa al siguiente. */
async function hacer(id, f){
  if (ocupado) return; ocupado = true;
  var e0 = eq(id), antes = e0 ? e0.estado_evaluacion : null, F = filas(), i = F.indexOf(filaDe(id)), sigId = F[i + 1] ? idDe(F[i + 1]) : '';
  var P = document.getElementById('rcsPanel'), bts = P ? P.querySelectorAll('.rcs-paso, .rcs-ac, button.rcs-tag, .rcs-ib, .rcs-abrir') : [];
  Array.prototype.forEach.call(bts, function(b){ b.disabled = true; });
  try { await f(); } catch(err) { aviso('No se pudo completar', 'error'); try { console.error('[costado]', err); } catch(_){} }
  finally { ocupado = false; Array.prototype.forEach.call(bts, function(b){ b.disabled = false; }); }
  delete memo[id];
  if (abierto !== id) return;
  var e1 = eq(id), cambio = !!e1 && e1.estado_evaluacion !== antes, sg = seguir();
  var dest = (cambio && sg && sigId && filaDe(sigId)) || filaDe(id) || (sg && sigId && filaDe(sigId)) || null;
  if (!dest) return cerrar(true);
  var otro = idDe(dest) !== id;
  abrir(dest);
  // Cambió de teléfono: el botón principal descansa un momento para que un segundo toque (o el Enter de la pistola) no caiga en el siguiente.
  if (otro) { var B = document.getElementById('rcsPaso'); if (B) { B.disabled = true; try { B.blur(); } catch(_){} setTimeout(function(){ B.disabled = false; }, 700); } }
}
/* cambiarEstadoProceso reabre la ventana del proceso al terminar. Desde el panel no hace falta: se evita SOLO para este equipo
   y solo mientras dura ese cambio; cualquier otra llamada (otro equipo, buscador, avisos) pasa igual que siempre. */
async function cambiar(id, estado){
  var f = G('cambiarEstadoProceso'); if (!f) return;
  var orig = null; try { orig = window.abrirPanelProceso; if (orig) window.abrirPanelProceso = function(x){ return x === id ? Promise.resolve() : orig.apply(this, arguments); }; } catch(_){}
  try { await f(id, estado); } finally { try { if (orig) window.abrirPanelProceso = orig; } catch(_){} }
}
function darPaso(id){
  var e = eq(id), p = e ? pasoDe(e) : null, B = document.getElementById('rcsPaso'); if (ocupado) return;
  // El equipo cambió por fuera (otra sesión, botones de la fila): se repinta y NO se ejecuta un paso distinto al que decía el botón.
  if (!p || !B || B.hidden || B.getAttribute('data-k') !== p.k) { var c0 = filaDe(id); if (c0) abrir(c0); return aviso('El equipo cambió. Revise el paso.', 'error'); }
  if (p.k === 'evaluar') { var f = G(e.estado_evaluacion === 'en_evaluacion' ? 'continuarEvaluacion' : 'empezarEvaluacion'); cerrar(true); if (f) f(id); return; }
  if (p.k === 'asignar') { var tec = B && B.getAttribute('data-tec'); if (!tec) return; return hacer(id, function(){ return asignar(id, tec); }); }
  if (p.k === 'recibio') return hacer(id, function(){ return cambiar(id, 'tecnico_recibio'); });
  if (p.k === 'calidad') return hacer(id, function(){ return cambiar(id, 'listo_revision'); });
  if (p.k === 'aprobar') return hacer(id, function(){ return G('aprobarTerminado')(id); });
  if (p.k === 'despachar') return hacer(id, function(){ return G('marcarDespachado')(id); });
}
/* Asigna con la función de siempre (confirmarAsignarTecnico): cambia el estado, deja historial y pasa las fallas al técnico. */
async function asignar(id, tecId){
  var ab = G('abrirModalAsignarTecnico'), ok = G('confirmarAsignarTecnico'), set = G('smartSelectSetValue'), get = G('smartSelectGetValue');
  if (!ab || !ok || !set || !get) return aviso('No se pudo asignar', 'error');
  var e = eq(id); if (!e || e.estado_evaluacion !== 'evaluado') return aviso('Solo equipos diagnosticados', 'error');
  ab(id); var m = document.getElementById('modalAsignarTecnico'); if (m) m.classList.remove('active');
  set('ss-asign-tecnico', tecId);
  if (get('ss-asign-tecnico') !== tecId) return aviso('No se pudo asignar', 'error');
  await ok();
}
/* Un toque marca la tarea hecha; otro la reabre. Mismo permiso que la ventana del proceso (su técnico o el admin) y los mismos
   campos de estado; a diferencia de completarTarea, no pide nota ni pregunta «¿finalizar?» (para eso está «Abrir equipo»). */
function tarea(id, tid){
  return hacer(id, async function(){
    var t = (cache.tareas || []).find(function(x){ return x.id === tid; }); if (!t || !sb()) return;
    if (!puedeTarea(t)) return aviso('Solo su técnico o el administrador', 'error');
    var e = eq(id), st = e ? e.estado_evaluacion : ''; if (!e || st === 'listo_venta' || st === 'vendido') return aviso('Equipo ya terminado', 'error');
    var h = t.estado === 'hecha';
    // Solo cambia si sigue como se ve en pantalla; si no cambió ninguna fila (otra sesión, permisos), no dice «hecha».
    var r = await sb().from('tareas_trabajo').update(h ? { estado: 'pendiente', fecha_completada: null } : { estado: 'hecha', fecha_completada: new Date().toISOString() }).eq('id', tid).eq('estado', t.estado).select('id');
    if (r && r.error) throw r.error;
    var la0 = G('loadAll');
    if (!r || !r.data || !r.data.length) { aviso('No se cambió. Actualizando…', 'error'); if (la0) await la0(); return; }
    aviso(h ? 'Tarea reabierta' : 'Tarea hecha');
    var la = G('loadAll'); if (la) await la();
    try { if (reacondLoteAbiertoId && G('renderDetalleLoteReacond')) renderDetalleLoteReacond(); } catch(_){}
  });
}
function accion(id, k){
  var e = eq(id); if (!e) return;
  if (k === 'imei') { var v = String(e.imei || ''); var fin = function(){ aviso('IMEI copiado'); };
    try { if (navigator.clipboard && navigator.clipboard.writeText) return void navigator.clipboard.writeText(v).then(fin, function(){ copiaVieja(v); fin(); }); } catch(_){}
    copiaVieja(v); return fin(); }
  var f = G({ color: 'abrirColoresLote', label: 'imprimirLabelEquipo', evaluacion: 'continuarEvaluacion', historial: 'verHistorialEquipoReacond' }[k]);
  if (f) f(id);
}
function copiaVieja(v){ try { var t = document.createElement('textarea'); t.value = v; t.style.cssText = 'position:fixed;opacity:0;'; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); } catch(_){} }
async function cargar(id){
  var m = memo[id];
  if (!m || Date.now() - m.t > 60000) {
    m = { t: Date.now(), fallas: null, hist: null };
    if (sb()) {
      try {
        var r = await Promise.all([
          sb().from('equipo_fallas').select('falla_corto, falla_nombre').eq('equipo_id', id),
          sb().from('equipo_historial').select('accion, fecha, usuario').eq('equipo_id', id).order('fecha', { ascending: false }).limit(5)
        ]);
        m.fallas = r[0].error ? null : (r[0].data || []); m.hist = r[1].error ? null : (r[1].data || []);
      } catch(_){}
    }
    memo[id] = m;
  }
  if (abierto !== id) return;
  var F = document.getElementById('rcsFallas'), H = document.getElementById('rcsHist');
  if (F) F.innerHTML = m.fallas === null ? '<span class="rcs-vacio">No se pudo cargar</span>' : (m.fallas.length ? m.fallas.map(function(f){ return '<span class="rcs-tag">' + esc(f.falla_corto || f.falla_nombre || 'Falla') + '</span>'; }).join('') : '<span class="rcs-vacio">Ninguna</span>');
  if (H) H.innerHTML = m.hist === null ? '<span class="rcs-vacio">No se pudo cargar</span>' : (m.hist.length ? m.hist.map(function(h){ return '<div><time>' + esc(fecha(h.fecha)) + '</time><span>' + esc(h.accion || '') + (h.usuario ? ' · ' + esc(String(h.usuario).split(' ')[0]) : '') + '</span></div>'; }).join('') : '<span class="rcs-vacio">Sin movimientos</span>');
}
function mover(d){
  if (!abierto || ocupado || dialogo()) return;
  var F = filas(), i = F.indexOf(filaDe(abierto)), n = F[i + d];
  if (n) abrir(n);
}
function cerrar(sinFoco){
  var p = document.getElementById('rcsPanel'); if (!abierto || ocupado) return;
  abierto = null;
  if (p) { p.classList.remove('on'); try { p.inert = true; } catch(_){} } // cerrado: fuera del foco y del lector de pantalla
  document.documentElement.classList.remove('rcs-abierto');
  filas().forEach(function(c){ c.classList.remove('rcs-act'); });
  if (sinFoco !== true && filaFoco && document.body.contains(filaFoco)) { try { filaFoco.focus({ preventScroll: true }); } catch(_){} }
  filaFoco = null;
}

/* Tocar la fila (no sus botones, casilla ni enlaces) abre el costado en vez de la ventana. */
document.addEventListener('click', function(ev){
  if (_paso) return;
  var l = lista(); if (!l || !l.contains(ev.target)) return;
  var card = ev.target.closest && ev.target.closest('.bcf-card'); if (!card) return;
  if (ev.target.closest('button, a, input, label, select, .bcf-acc, .bcf-chk-wrap')) return;
  // No se corta el clic a las demás capas (menús que se cierran al tocar fuera): solo se apaga el onclick de la fila para este toque.
  var oc = card.onclick; card.onclick = null; setTimeout(function(){ if (document.body.contains(card)) card.onclick = oc; }, 0);
  if (!ocupado && !abrir(card)) card.onclick = oc;
}, true);
document.addEventListener('keydown', function(ev){
  if (!abierto) return;
  var t = ev.target, enCampo = t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
  if (ocupado || dialogo()) return;
  if (ev.key === 'Escape') { ev.preventDefault(); cerrar(); return; }
  if (enCampo || (t && t.isContentEditable) || ev.ctrlKey || ev.metaKey || ev.altKey) return;
  if (ev.key === 'ArrowDown' || ev.key === 'j' || ev.key === 'J') { ev.preventDefault(); mover(1); }
  else if (ev.key === 'ArrowUp' || ev.key === 'k' || ev.key === 'K') { ev.preventDefault(); mover(-1); }
});
/* Si la lista se vuelve a pintar (otra página, otro lote, salir del módulo) y el equipo ya no está, se cierra solo. */
try { new MutationObserver(function(){ if (!abierto || ocupado) return; var c = filaDe(abierto); if (!c || !c.offsetParent) return cerrar(true); var e = eq(abierto), st = e ? (e.estado_evaluacion || 'pendiente') : ''; if (st !== pintado) abrir(c); else if (!c.classList.contains('rcs-act')) c.classList.add('rcs-act'); }).observe(document.body, { childList: true, subtree: true }); } catch(_){}

window.BayolReacondCostado = { version: VERSION, paso: darPaso, tarea: tarea, asignar: function(id, tec){ return hacer(id, function(){ return asignar(id, tec); }); }, abrir: function(id){ var c = filaDe(id); return c ? abrir(c) : false; }, cerrar: cerrar, abierto: function(){ return abierto; } };
})();
