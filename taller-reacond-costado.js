/* BAYOL CELL · taller · Reacondicionados «Costado» (12-nov-2026, dueño: reel de Moxen `DfnsWJABIDo`, «haz 1 y 2»).
 * Tocar un teléfono del lote abre su ficha AL COSTADO, sin tapar la lista:
 *   · PC (≥ 1100 px): panel fijo a la derecha; la lista se encoge y sigue a la vista.
 *   · Celular / tableta: hoja que sube desde abajo, con fondo para cerrar.
 *   · ↓ / J = siguiente · ↑ / K = anterior · Esc = cerrar (el foco vuelve a la fila).
 * Solo lee: lo que muestra sale de la misma fila (modelo, IMEI, estado, técnico, costo: así respeta los permisos) más
 * fallas, piezas, tareas e historial del equipo. El botón «Abrir equipo» hace exactamente lo que hacía tocar la fila
 * (la ventana de siempre). Las casillas, «Abrir» y los demás botones de la fila no cambian.
 * No toca taller-app.js. Apagar: localStorage.bc_reacond_costado_off = '1'  ·  window.BC_REACOND_COSTADO = false
 */
(function(){'use strict';
if (window.BayolReacondCostado) return;
try { if (window.BC_REACOND_COSTADO === false || localStorage.getItem('bc_reacond_costado_off') === '1') return; } catch(_){}
var VERSION = '20261112c1';
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
  '#rcsPanel{position:fixed;z-index:560;background:#fff;color:#0f172a;display:flex;flex-direction:column;box-shadow:-12px 0 40px rgba(15,23,42,.14);border-left:1px solid rgba(15,23,42,.08);transition:transform 180ms cubic-bezier(.23,1,.32,1);}' +
  '#rcsPanel{top:0;right:0;bottom:0;width:400px;transform:translateX(102%);padding-bottom:env(safe-area-inset-bottom,0px);}' +
  '#rcsPanel.on{transform:none;}' +
  '#rcsFondo{position:fixed;inset:0;z-index:555;background:rgba(15,23,42,.35);opacity:0;pointer-events:none;transition:opacity 180ms ease;}' +
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
  '.rcs-f{flex:none;padding:10px 16px 12px;border-top:1px solid rgba(15,23,42,.08);display:flex;gap:8px;align-items:center;}' +
  '.rcs-abrir{flex:1;min-height:54px;border:0;border-radius:14px;background:linear-gradient(135deg,#ff6b35,#e4572e);color:#fff;font-weight:800;font-size:15px;cursor:pointer;}' +
  '.rcs-abrir:active{transform:scale(.97);}' +
  '.rcs-tecla{font-size:11.5px;color:#94a3b8;white-space:nowrap;}' +
  '#reacondEquiposLista .bcf-card.rcs-act{box-shadow:0 0 0 2px #2563eb !important;background:rgba(59,130,246,.06) !important;}' +
  '@media (min-width:1100px){html.rcs-abierto #app #v-refurb{padding-right:412px;transition:padding-right 180ms cubic-bezier(.23,1,.32,1);}}' +
  '@media (max-width:1099.98px){#rcsPanel{top:auto;left:0;right:0;bottom:0;width:auto;max-height:86vh;border-left:0;border-radius:20px 20px 0 0;transform:translateY(102%);box-shadow:0 -12px 40px rgba(15,23,42,.18);}' +
    '#rcsPanel::before{content:"";width:40px;height:4px;border-radius:2px;background:#cbd5e1;align-self:center;margin-top:8px;flex:none;}' +
    'html.rcs-abierto #rcsFondo{opacity:1;pointer-events:auto;}.rcs-tecla{display:none;}}' +
  '@media (prefers-reduced-motion:reduce){#rcsPanel,#rcsFondo,html.rcs-abierto #app #v-refurb{transition:none;}}';
  document.head.appendChild(st);
}

function panel(){
  var p = document.getElementById('rcsPanel'); if (p) return p;
  estilos();
  var f = document.createElement('div'); f.id = 'rcsFondo'; f.onclick = cerrar; document.body.appendChild(f);
  p = document.createElement('aside'); p.id = 'rcsPanel'; p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'Ficha del equipo'); p.tabIndex = -1;
  p.innerHTML = '<div class="rcs-h"><b id="rcsTit"></b><button type="button" class="rcs-ib" data-ant aria-label="Anterior"><i class="ti ti-chevron-up"></i></button><button type="button" class="rcs-ib" data-sig aria-label="Siguiente"><i class="ti ti-chevron-down"></i></button><button type="button" class="rcs-ib" data-x aria-label="Cerrar"><i class="ti ti-x"></i></button></div>' +
    '<div class="rcs-b" id="rcsCuerpo"></div>' +
    '<div class="rcs-f"><button type="button" class="rcs-abrir" id="rcsAbrir">Abrir equipo</button><span class="rcs-tecla">↑ ↓ pasar · Esc cerrar</span></div>';
  document.body.appendChild(p);
  p.querySelector('[data-x]').onclick = cerrar;
  p.querySelector('[data-ant]').onclick = function(){ mover(-1); };
  p.querySelector('[data-sig]').onclick = function(){ mover(1); };
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
  var p = panel();
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
    '<div class="rcs-top"><div class="rcs-img">' + (med && med.innerHTML.trim() ? med.innerHTML : '<i class="ti ti-device-mobile"></i>') + '</div><div style="min-width:0"><div class="rcs-sub">' + esc(txt(card.querySelector('.bcf-sub'))) + '</div></div></div>' +
    '<div class="rcs-kv">' + kv.map(function(x){ return '<div><small>' + esc(x[0]) + '</small><span>' + esc(x[1]) + '</span></div>'; }).join('') + '</div>' +
    (chips.length ? '<div class="rcs-tags">' + chips.map(function(t){ return '<span class="rcs-tag pe">' + esc(t) + '</span>'; }).join('') + '</div>' : '') +
    (nota ? '<div class="rcs-nota">' + esc(nota) + '</div>' : '') +
    '<div><p class="rcs-t">Fallas</p><div class="rcs-tags" id="rcsFallas"><span class="rcs-vacio">Cargando…</span></div></div>' +
    '<div><p class="rcs-t">Piezas</p><div class="rcs-tags" id="rcsPiezas"></div></div>' +
    '<div><p class="rcs-t">Tareas</p><div class="rcs-tags" id="rcsTareas"></div></div>' +
    '<div><p class="rcs-t">Últimos movimientos</p><div class="rcs-hist" id="rcsHist"><span class="rcs-vacio">Cargando…</span></div></div>';
  pintarLocal(id);
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
  if (T) T.innerHTML = ta.length ? ta.map(function(x){ var h = x.estado === 'hecha'; return '<span class="rcs-tag ' + (h ? 'ok' : 'pe') + '">' + (h ? '✓ ' : '') + esc(x.descripcion || 'Tarea') + '</span>'; }).join('') : '<span class="rcs-vacio">Ninguna</span>';
}
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
  if (!abierto) return;
  var F = filas(), i = F.indexOf(filaDe(abierto)), n = F[i + d];
  if (n) abrir(n);
}
function cerrar(sinFoco){
  var p = document.getElementById('rcsPanel'); if (!abierto) return;
  abierto = null;
  if (p) p.classList.remove('on');
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
  try { if (document.documentElement.classList.contains('bc-lote-arrastrando')) return; } catch(_){}
  if (abrir(card)) { ev.preventDefault(); ev.stopPropagation(); }
}, true);
document.addEventListener('keydown', function(ev){
  if (!abierto) return;
  var t = ev.target, enCampo = t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
  if (ev.key === 'Escape') { if (document.querySelector('.modal-backdrop.active')) return; ev.preventDefault(); cerrar(); return; }
  if (enCampo || ev.ctrlKey || ev.metaKey || ev.altKey) return;
  if (document.querySelector('.modal-backdrop.active')) return;
  if (ev.key === 'ArrowDown' || ev.key === 'j' || ev.key === 'J') { ev.preventDefault(); mover(1); }
  else if (ev.key === 'ArrowUp' || ev.key === 'k' || ev.key === 'K') { ev.preventDefault(); mover(-1); }
});
/* Si la lista se vuelve a pintar (otra página, otro lote, salir del módulo) y el equipo ya no está, se cierra solo. */
try { new MutationObserver(function(){ if (!abierto) return; var c = filaDe(abierto); if (!c || !c.offsetParent) cerrar(true); else c.classList.add('rcs-act'); }).observe(document.body, { childList: true, subtree: true }); } catch(_){}

window.BayolReacondCostado = { version: VERSION, abrir: function(id){ var c = filaDe(id); return c ? abrir(c) : false; }, cerrar: cerrar, abierto: function(){ return abierto; } };
})();
