/* BAYOL CELL · taller · «Que se sienta instantáneo» (14 oct 2026).
 * Sacado de las referencias compartidas (docs/REFERENCIAS-DISENO.md): «¿Por qué Raycast se siente instantáneo?»
 * y la biblioteca de patrones de designmotionhq (Doherty Threshold, Loading States, Undo UX, Command Palette,
 * Autosave / Error States). Todo rehecho aquí en JavaScript normal; no se copió código de nadie.
 *  1) Línea de carga fina arriba: aparece solo si una consulta a la base tarda más de 300 ms (en vez de ruedas que
 *     tapan la pantalla). Nunca borra lo que ya se ve.
 *  2) Ventanas con el fondo DESENFOCADO, no oscurecido: detrás se sigue viendo dónde estabas.
 *  3) Buscador de pantallas y acciones con Ctrl+K (⌘K en Mac): escribe «reac», Enter y estás en Reacondicionados.
 *     Barra de abajo que dice qué hace cada tecla. Lo último que usaste sale primero.
 *  4) «Deshacer» 5 segundos al archivar un chat de WhatsApp (nunca en pagos ni en nada de dinero).
 *  5) Aviso honesto de conexión: si se va el internet o el servidor no contesta, una franja lo dice («lo que guardes
 *     ahora no se guardará»); cuando vuelve, avisa que ya se puede seguir.
 * Capa aislada: no cambia ids, onclick ni datos. «Reducir movimiento» = sin animaciones. API: window.BayolRapidez
 */
(function(){'use strict';
if (window.BayolRapidez) return;
var VERSION = '20261014q1';
var quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function sinTildes(s){ return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
var esPC = function(){ return matchMedia('(min-width: 1025px)').matches; };

var css = [
/* 1 · línea de carga */
'#bcrzLinea{position:fixed;left:0;right:0;top:0;height:2px;z-index:100000;pointer-events:none;opacity:0;transition:opacity .2s ease}',
'#bcrzLinea.on{opacity:1}',
'#bcrzLinea::before{content:"";position:absolute;top:0;bottom:0;left:0;width:38%;border-radius:2px;background:linear-gradient(90deg,rgba(255,107,53,0),#FF6B35 40%,#D65225);animation:bcrzCorre 1.1s cubic-bezier(.45,0,.2,1) infinite}',
'@keyframes bcrzCorre{from{transform:translateX(-100%)}to{transform:translateX(280%)}}',
/* 2 · fondo desenfocado (no las alertas de confirmar, que oscurecen a propósito) */
'html body .modal-backdrop,html body #app .modal-backdrop{background:rgba(241,245,249,.38)!important;-webkit-backdrop-filter:blur(10px) saturate(1.15)!important;backdrop-filter:blur(10px) saturate(1.15)!important}',
'@media (prefers-reduced-transparency:reduce){html body .modal-backdrop,html body #app .modal-backdrop{background:rgba(15,23,42,.55)!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}}',
/* 3 · paleta Ctrl+K */
'#bcrzPaleta{position:fixed;inset:0;z-index:99990;display:flex;align-items:flex-start;justify-content:center;padding:12vh 16px 16px;background:rgba(241,245,249,.35);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}',
'#bcrzPaleta .bcrz-caja{width:min(620px,100%);background:#fff;border-radius:16px;border:1px solid rgba(15,23,42,.1);box-shadow:0 30px 80px -24px rgba(15,23,42,.45);overflow:hidden;display:flex;flex-direction:column;max-height:70vh;animation:bcrzEntra .16s ease-out}',
'@keyframes bcrzEntra{from{opacity:0;transform:translateY(-6px) scale(.985)}to{opacity:1;transform:none}}',
'#bcrzPaleta .bcrz-busca{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid #eef2f7}',
'#bcrzPaleta .bcrz-busca i{font-size:20px;color:#475569}',
'#bcrzPaleta input{flex:1;border:0!important;outline:0!important;box-shadow:none!important;background:transparent!important;font:500 16px/1.3 inherit;color:#0f172a;padding:2px 0!important}',
'#bcrzPaleta .bcrz-lista{overflow-y:auto;padding:6px}',
'#bcrzPaleta .bcrz-sec{font-size:11.5px;font-weight:700;color:#475569;padding:8px 10px 4px;letter-spacing:.02em}',
'#bcrzPaleta .bcrz-op{display:flex;align-items:center;gap:10px;width:100%;min-height:42px;padding:8px 10px;border:0;border-radius:10px;background:transparent;font:500 14px/1.2 inherit;color:#0f172a;text-align:left;cursor:pointer}',
'#bcrzPaleta .bcrz-op i{font-size:18px;color:#475569;width:22px;text-align:center}',
'#bcrzPaleta .bcrz-op.hl{background:#fff1ea}',
'#bcrzPaleta .bcrz-op.hl i{color:#D65225}',
'#bcrzPaleta .bcrz-op small{margin-left:auto;font-size:12px;color:#475569;font-weight:500}',
'#bcrzPaleta .bcrz-vacio{padding:18px;text-align:center;color:#475569;font-size:13px}',
'#bcrzPaleta .bcrz-pie{display:flex;gap:14px;justify-content:flex-end;flex-wrap:wrap;padding:9px 14px;border-top:1px solid #eef2f7;background:#f8fafc;font-size:12px;color:#475569}',
'#bcrzPaleta kbd{display:inline-block;min-width:20px;padding:1px 6px;border:1px solid #cbd5e1;border-bottom-width:2px;border-radius:6px;background:#fff;font:600 11px/1.5 inherit;color:#334155;text-align:center;margin-right:4px}',
/* 4 · deshacer */
'#bcrzDeshacer{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);width:max-content;z-index:100001;display:flex;align-items:center;gap:12px;padding:10px 10px 10px 16px;border-radius:14px;background:#0f172a;color:#fff;font:600 14px/1.2 inherit;box-shadow:0 16px 40px -16px rgba(15,23,42,.6);max-width:calc(100% - 32px);animation:bcrzSube .2s ease-out}',
'@keyframes bcrzSube{from{opacity:0;transform:translate(-50%,8px)}to{opacity:1;transform:translate(-50%,0)}}',
'#bcrzDeshacer button{min-height:40px;padding:0 14px;border:0;border-radius:10px;background:#FF6B35;color:#fff;font:700 13.5px inherit;cursor:pointer}',
'#bcrzDeshacer .bcrz-seg{font-variant-numeric:tabular-nums;color:#cbd5e1;font-weight:500}',
/* 5 · conexión */
'#bcrzRed{position:fixed;left:50%;top:10px;transform:translateX(-50%);width:max-content;z-index:100002;display:flex;align-items:center;gap:8px;padding:9px 14px;border-radius:12px;font:600 13px/1.3 inherit;box-shadow:0 12px 30px -14px rgba(15,23,42,.5);max-width:calc(100% - 32px)}',
'#bcrzRed.mal{background:#7f1d1d;color:#fff}',
'#bcrzRed.bien{background:#14532d;color:#fff}',
'#bcrzRed i{font-size:18px}',
'@media (prefers-reduced-motion:reduce){#bcrzLinea::before{animation:none;width:100%;opacity:.7}#bcrzPaleta .bcrz-caja,#bcrzDeshacer{animation:none}}',
'@media print{#bcrzLinea,#bcrzPaleta,#bcrzDeshacer,#bcrzRed{display:none!important}}'
].join('\n');
var st = document.createElement('style'); st.id = 'bcRapidezCSS'; st.textContent = css; document.head.appendChild(st);

/* ---------- 1 · Línea de carga + 5 · conexión (un solo envoltorio de fetch) ---------- */
var linea = document.createElement('div'); linea.id = 'bcrzLinea'; linea.setAttribute('aria-hidden', 'true');
document.body.appendChild(linea);
var pendientes = 0, tLinea = null;
function lineaMas(){ pendientes++; if (pendientes === 1) { clearTimeout(tLinea); tLinea = setTimeout(function(){ if (pendientes > 0) linea.classList.add('on'); }, 300); } }
function lineaMenos(){ pendientes = Math.max(0, pendientes - 1); if (!pendientes) { clearTimeout(tLinea); linea.classList.remove('on'); } }
var servidorCaido = false;
var origFetch = window.fetch;
if (typeof origFetch === 'function') {
  window.fetch = function(input, init){
    var url = ''; try { url = typeof input === 'string' ? input : (input && input.url) || ''; } catch(_){}
    var nuestro = /supabase\.co\//.test(url) && !/\/auth\/v1\/token/.test(url);
    if (!nuestro) return origFetch.apply(this, arguments);
    lineaMas();
    return origFetch.apply(this, arguments).then(function(r){
      lineaMenos(); if (servidorCaido) { servidorCaido = false; avisoRed(navigator.onLine === false ? 'mal' : 'bien'); } return r;
    }, function(err){
      lineaMenos();
      if (err && err.name !== 'AbortError') { servidorCaido = true; avisoRed('mal'); }
      throw err;
    });
  };
}
var tRed = null;
function avisoRed(estado){
  var el = document.getElementById('bcrzRed');
  if (!el) { el = document.createElement('div'); el.id = 'bcrzRed'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); document.body.appendChild(el); }
  clearTimeout(tRed);
  if (estado === 'mal') {
    el.className = 'mal';
    el.innerHTML = '<i class="ti ti-wifi-off"></i> ' + (navigator.onLine === false ? 'Sin internet.' : 'El servidor no contesta.') + ' Lo que guardes ahora no se guardará.';
  } else {
    el.className = 'bien';
    el.innerHTML = '<i class="ti ti-wifi"></i> Conexión de vuelta. Ya puedes seguir.';
    tRed = setTimeout(function(){ if (el.className === 'bien') el.remove(); }, 2600);
  }
}
window.addEventListener('offline', function(){ avisoRed('mal'); });
window.addEventListener('online', function(){ servidorCaido = false; avisoRed('bien'); });

/* ---------- 3 · Paleta Ctrl+K ---------- */
var RECIENTES = 'bcrz_recientes';
function leerRecientes(){ try { return JSON.parse(localStorage.getItem(RECIENTES) || '[]'); } catch(_) { return []; } }
function guardarReciente(clave){ try { var r = leerRecientes().filter(function(x){ return x !== clave; }); r.unshift(clave); localStorage.setItem(RECIENTES, JSON.stringify(r.slice(0, 6))); } catch(_){} }
function visible(el){ return !!(el && el.getClientRects().length && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden'); }
function opciones(){
  var ops = [], vistos = {};
  // Pantallas: las mismas del menú lateral, solo las que este usuario puede ver (las que el menú muestra).
  document.querySelectorAll('#sidebar [onclick*="nav("]').forEach(function(b){
    var m = (b.getAttribute('onclick') || '').match(/nav\(\s*['"]([^'"]+)['"]/); if (!m || vistos[m[1]]) return;
    if (b.style.display === 'none' || (b.closest('[style*="display:none"],[style*="display: none"]'))) return;
    var nombre = (b.getAttribute('title') || b.textContent || '').replace(/\s+/g, ' ').trim(); if (!nombre) return;
    var ic = b.querySelector('i.ti'); var icono = ic ? (Array.prototype.find.call(ic.classList, function(c){ return /^ti-/.test(c); }) || 'ti-point') : 'ti-point';
    vistos[m[1]] = 1;
    ops.push({ clave: 'nav:' + m[1], nombre: nombre, icono: icono, tipo: 'Ir a', correr: function(){ try { nav(m[1], b); } catch(_){ try { b.click(); } catch(__){} } } });
  });
  if (typeof window.abrirBuscadorArticulos === 'function') ops.push({ clave: 'act:articulos', nombre: 'Buscar artículo en Info Plus', icono: 'ti-search', tipo: 'Acción', correr: function(){ abrirBuscadorArticulos(null, function(){}); } });
  if (typeof window.loadAll === 'function') ops.push({ clave: 'act:recargar', nombre: 'Actualizar los datos', icono: 'ti-refresh', tipo: 'Acción', correr: async function(){ try { await loadAll(); if (typeof renderAll === 'function') renderAll(); toast('Datos actualizados.'); } catch(_){} } });
  return ops;
}
var pal = null;
function abrirPaleta(){
  if (document.getElementById('bcrzPaleta')) return;
  var todas = opciones(); if (!todas.length) return;
  var previo = document.activeElement;
  var box = document.createElement('div'); box.id = 'bcrzPaleta'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Ir a una pantalla o acción');
  box.innerHTML = '<div class="bcrz-caja"><div class="bcrz-busca"><i class="ti ti-command"></i><input type="text" placeholder="¿Qué quieres abrir? Ej.: reacond, CRM, recepción…" aria-label="Buscar pantalla o acción" autocomplete="off" spellcheck="false" data-bcbp-no></div>' +
    '<div class="bcrz-lista" role="listbox"></div>' +
    '<div class="bcrz-pie"><span><kbd>↑</kbd><kbd>↓</kbd>Moverse</span><span><kbd>Enter</kbd>Abrir</span><span><kbd>Esc</kbd>Cerrar</span></div></div>';
  document.body.appendChild(box);
  pal = { box: box, todas: todas, filtradas: [], hl: 0, previo: previo };
  var inp = box.querySelector('input');
  inp.oninput = function(){ pal.hl = 0; pintar(inp.value); };
  inp.onkeydown = function(e){
    if (e.key === 'ArrowDown') { e.preventDefault(); mover(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); mover(-1); }
    else if (e.key === 'Enter') { e.preventDefault(); elegir(pal.hl); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cerrarPaleta(); }
  };
  box.addEventListener('mousedown', function(e){ if (e.target === box) cerrarPaleta(); });
  pintar('');
  setTimeout(function(){ inp.focus(); }, 0);
}
function pintar(q){
  var t = sinTildes(q).trim(), rec = leerRecientes();
  var lista = pal.todas.map(function(o){
    var n = sinTildes(o.nombre), p = !t ? 1 : (n.indexOf(t) === 0 ? 3 : (n.split(/\s+/).some(function(w){ return w.indexOf(t) === 0; }) ? 2 : (n.indexOf(t) >= 0 ? 1 : 0)));
    var r = rec.indexOf(o.clave); return { o: o, p: p, r: r < 0 ? 99 : r };
  }).filter(function(x){ return x.p > 0; }).sort(function(a, b){ return (b.p - a.p) || (a.r - b.r); }).map(function(x){ return x.o; });
  pal.filtradas = lista;
  var cont = pal.box.querySelector('.bcrz-lista');
  if (!lista.length) { cont.innerHTML = '<div class="bcrz-vacio">No hay nada con «' + esc(q) + '».</div>'; return; }
  var html = '', secAnt = '';
  lista.forEach(function(o, i){
    var sec = (!t && rec.indexOf(o.clave) >= 0) ? 'Usado hace poco' : (o.tipo === 'Ir a' ? 'Pantallas' : 'Acciones');
    if (sec !== secAnt) { html += '<div class="bcrz-sec">' + sec + '</div>'; secAnt = sec; }
    html += '<button type="button" class="bcrz-op' + (i === pal.hl ? ' hl' : '') + '" role="option" aria-selected="' + (i === pal.hl) + '" data-i="' + i + '"><i class="ti ' + esc(o.icono) + '"></i>' + esc(o.nombre) + '<small>' + esc(o.tipo) + '</small></button>';
  });
  cont.innerHTML = html;
  cont.querySelectorAll('.bcrz-op').forEach(function(b){
    b.onclick = function(){ elegir(+b.getAttribute('data-i')); };
    b.onmousemove = function(){ var i = +b.getAttribute('data-i'); if (i !== pal.hl) { pal.hl = i; marcar(); } };
  });
}
function marcar(){ pal.box.querySelectorAll('.bcrz-op').forEach(function(b){ var on = +b.getAttribute('data-i') === pal.hl; b.classList.toggle('hl', on); b.setAttribute('aria-selected', on); if (on) b.scrollIntoView({ block: 'nearest' }); }); }
function mover(d){ if (!pal.filtradas.length) return; pal.hl = (pal.hl + d + pal.filtradas.length) % pal.filtradas.length; marcar(); }
function elegir(i){ var o = pal.filtradas[i]; if (!o) return; guardarReciente(o.clave); cerrarPaleta(true); try { o.correr(); } catch(e){ console.warn('[rapidez]', e); } }
function cerrarPaleta(sinFoco){ if (!pal) return; var prev = pal.previo; pal.box.remove(); pal = null; if (!sinFoco && prev && prev.focus) try { prev.focus(); } catch(_){} }
function hayVentana(){
  return !!document.querySelector('.modal-backdrop.active, #modalGenerico, #modalConfirm, #modalPrompt, #modalBuscadorArt, #modalFichaEquipo');
}
document.addEventListener('keydown', function(e){
  if (!(e.key === 'k' || e.key === 'K') || !(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return;
  if (document.getElementById('bcrzPaleta')) { e.preventDefault(); cerrarPaleta(); return; }
  var app = document.getElementById('app'); if (!app || !visible(app)) return; // sin sesión no
  if (hayVentana()) return; // dentro de una ventana, Ctrl+K es de esa ventana (ej. buscador de artículos)
  e.preventDefault(); abrirPaleta();
}, true);

/* ---------- 4 · Deshacer al archivar un chat ---------- */
var tDes = null;
function ofrecerDeshacer(texto, accion){
  var prev = document.getElementById('bcrzDeshacer'); if (prev) prev.remove();
  clearTimeout(tDes);
  var el = document.createElement('div'); el.id = 'bcrzDeshacer'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
  var seg = 5;
  el.innerHTML = '<span>' + esc(texto) + ' <span class="bcrz-seg">· ' + seg + ' s</span></span><button type="button">Deshacer</button>';
  document.body.appendChild(el);
  var callarToast = function(){ try { var t0 = document.getElementById('toast'); if (t0) t0.style.display = 'none'; } catch(_){} }; // el aviso de «Deshacer» ya dice lo mismo
  callarToast(); setTimeout(callarToast, 500); setTimeout(callarToast, 1200);
  var s = el.querySelector('.bcrz-seg');
  var tick = function(){ seg--; if (seg <= 0) { el.remove(); return; } s.textContent = '· ' + seg + ' s'; tDes = setTimeout(tick, 1000); };
  tDes = setTimeout(tick, 1000);
  el.querySelector('button').onclick = function(){ clearTimeout(tDes); el.remove(); try { accion(); } catch(_){} };
}
function envolverArchivar(){
  if (typeof window._bcWaChatAccion !== 'function' || window._bcWaChatAccion._bcrz) return false;
  var orig = window._bcWaChatAccion;
  var nuevo = function(accion, id){
    var antes = null;
    if (accion === 'archivar') {
      try { var lista = _waHilos || []; var hid = id || (typeof _waHiloId !== 'undefined' ? _waHiloId : null); antes = lista.find(function(h){ return h.id === hid; }) || null; if (antes) antes = { id: antes.id, estado: antes.estado }; } catch(_){}
    }
    var r = orig.apply(this, arguments);
    if (antes && antes.estado !== 'archivado') ofrecerDeshacer('Chat archivado', function(){ window._bcWaChatAccion('archivar', antes.id); });
    return r;
  };
  nuevo._bcrz = true;
  window._bcWaChatAccion = nuevo;
  return true;
}
// El CRM carga su parte de WhatsApp al entrar; se revisa cada 1,5 s (barato) por si aparece o se vuelve a crear.
envolverArchivar(); setInterval(envolverArchivar, 1500);

window.BayolRapidez = { version: VERSION, paleta: abrirPaleta, deshacer: ofrecerDeshacer, aviso: avisoRed, pendientes: function(){ return pendientes; } };
})();
