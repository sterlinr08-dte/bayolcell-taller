/* BAYOL CELL · taller · 3 animaciones tomadas de beUI (14 oct 2026), rehechas en JavaScript normal.
 *  1) Números que cambian dígito por dígito en los KPI (.kpi-box strong, .inc-kpi-val).
 *  2) Botón Guardar/Registrar → «Guardando…» → «Listo ✓» (o vuelve normal si sale un error).
 *  3) Celular, CRM WhatsApp: deslizar un chat a la izquierda = Archivar, a la derecha = leído / no leído.
 * Capa aislada: no cambia ids, onclick ni datos. «Reducir movimiento» = sin animaciones 1 y 3.
 * API: window.BayolAnimaciones
 */
(function(){'use strict';
if (window.BayolAnimaciones) return;
var quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;

var css = [
'.bca-num{display:inline-flex;align-items:baseline;white-space:pre}',
'.bca-d{display:inline-block;overflow:hidden;vertical-align:baseline;height:1.15em;line-height:1.15em}',
'.bca-d>i{display:block;font-style:normal;animation:bcaSube .5s cubic-bezier(.2,.9,.25,1.15) both}',
'.bca-d.baja>i{animation-name:bcaBaja}',
'@keyframes bcaSube{from{transform:translateY(100%);opacity:0;filter:blur(2px)}to{transform:none;opacity:1;filter:none}}',
'@keyframes bcaBaja{from{transform:translateY(-100%);opacity:0;filter:blur(2px)}to{transform:none;opacity:1;filter:none}}',
/* 2 · botón */
'.bca-btn{position:relative!important;overflow:hidden!important}',
'.bca-btn::after{content:"";position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:6px;border-radius:inherit;font:inherit;font-weight:700;opacity:0;transform:scale(.92);transition:opacity .18s ease,transform .25s cubic-bezier(.2,.9,.25,1.2);pointer-events:none}',
'.bca-btn.bca-guardando::after{content:"Guardando…";opacity:1;transform:none;background:inherit;background-color:var(--bca-fondo,#334155);color:#fff}',
'.bca-btn.bca-listo::after{content:"✓  Listo";opacity:1;transform:none;background:#16a34a;color:#fff}',
'.bca-btn.bca-guardando{cursor:progress}',
'.bca-btn.bca-mal{animation:bcaNo .38s ease}',
'@keyframes bcaNo{20%{transform:translateX(-5px)}40%{transform:translateX(5px)}60%{transform:translateX(-3px)}80%{transform:translateX(2px)}}',
/* 3 · deslizar chat */
'.bca-swipe-fondo{position:absolute;inset:0;display:flex;align-items:center;justify-content:space-between;padding:0 22px;color:#fff;font:700 13px/1 system-ui,sans-serif;pointer-events:none;z-index:0}',
'.bca-swipe-fondo .izq,.bca-swipe-fondo .der{display:flex;align-items:center;gap:6px;opacity:.4;transition:opacity .15s,transform .15s}',
'.bca-swipe-fondo.on-izq .izq,.bca-swipe-fondo.on-der .der{opacity:1;transform:scale(1.08)}',
'.bca-swipe-fondo i{font-size:20px}',
'#waLista .wa-row.bca-arrastra{position:relative;z-index:1;transition:none!important;touch-action:pan-y}',
'#waLista .wa-row.bca-vuelve{transition:transform .28s cubic-bezier(.2,.9,.25,1.1)!important}',
'@media (prefers-reduced-motion:reduce){.bca-d>i{animation:none}.bca-btn::after{transition:none}}'
].join('\n');
var st = document.createElement('style'); st.id = 'bcaAnimacionesCSS'; st.textContent = css; document.head.appendChild(st);

/* ---------- 1 · Números que cambian dígito por dígito ---------- */
var SEL_NUM = '.kpi-box strong, .inc-kpi-val';
var propios = new WeakSet();
function animarNumero(el, viejo){
  var nuevo = el.textContent;
  if (!nuevo || nuevo === viejo || !/\d/.test(nuevo) || nuevo.length > 24) return;
  var vNum = parseFloat(String(viejo || '').replace(/[^\d.-]/g, '')), nNum = parseFloat(nuevo.replace(/[^\d.-]/g, ''));
  var baja = isFinite(vNum) && isFinite(nNum) && nNum < vNum;
  var v = String(viejo || ''), off = nuevo.length - v.length, cambio = 0;
  var html = '';
  for (var k = 0; k < nuevo.length; k++){
    var ch = nuevo[k], ant = v[k - off];
    var esc = ch === '<' ? '&lt;' : ch === '&' ? '&amp;' : ch;
    if (/\d/.test(ch) && ch !== ant){
      html += '<span class="bca-d' + (baja ? ' baja' : '') + '"><i style="animation-delay:' + (cambio++ * 45) + 'ms">' + esc + '</i></span>';
    } else html += esc;
  }
  if (!cambio) return;
  propios.add(el);
  el.innerHTML = html;
  setTimeout(function(){ if (el.textContent === nuevo){ propios.add(el); el.textContent = nuevo; } }, 900 + cambio * 45);
}
var ultimos = new WeakMap();
function vigilarNumeros(){
  if (quieto) return;
  document.querySelectorAll(SEL_NUM).forEach(function(el){ if (!ultimos.has(el)) ultimos.set(el, el.textContent); });
  new MutationObserver(function(muts){
    var vistos = new Set();
    muts.forEach(function(m){
      var el = m.target.nodeType === 3 ? m.target.parentElement : m.target;
      el = el && el.closest ? el.closest(SEL_NUM) : null;
      if (el) vistos.add(el);
      m.addedNodes && m.addedNodes.forEach(function(n){ if (n.nodeType === 1){ if (n.matches && n.matches(SEL_NUM)) ultimos.set(n, ''); n.querySelectorAll && n.querySelectorAll(SEL_NUM).forEach(function(x){ ultimos.set(x, ''); vistos.add(x); }); } });
    });
    vistos.forEach(function(el){
      if (propios.has(el)){ propios.delete(el); return; }
      var viejo = ultimos.get(el); var nuevo = el.textContent; ultimos.set(el, nuevo);
      if (viejo === undefined) return;
      animarNumero(el, viejo);
    });
  }).observe(document.body, { subtree: true, childList: true, characterData: true });
}

/* ---------- 2 · Botón Guardar → Guardando… → Listo ✓ ---------- */
var RE_GUARDAR = /(^|[\s;(])(_?[A-Za-z]*[Gg]uardar[A-Za-z]*|registrarAbonoFin|_ejecutarRegistroCompraIP|marcarDespachado)\s*\(/;
var RE_EXCLUIR = /abrir|toggle|cerrar|_nominaSalirGuardar/i;
var RE_OK = /✅|guardad|registrad|creado|actualizad|listo|pagad|despachad|correctamente|éxito/i;
var activo = null;
function terminar(btn, ok){
  if (!btn) return;
  clearTimeout(btn.__bcaT);
  btn.classList.remove('bca-guardando');
  if (ok){ btn.classList.add('bca-listo'); btn.__bcaT = setTimeout(function(){ btn.classList.remove('bca-listo'); }, 1400); }
  else if (ok === false){ btn.classList.remove('bca-mal'); void btn.offsetWidth; btn.classList.add('bca-mal'); setTimeout(function(){ btn.classList.remove('bca-mal'); }, 450); }
  if (activo === btn) activo = null;
}
function botonGuardar(){
  document.addEventListener('click', function(e){
    var btn = e.target.closest && e.target.closest('button[onclick]');
    if (!btn || btn.disabled) return;
    var oc = btn.getAttribute('onclick') || '';
    if (!RE_GUARDAR.test(oc) || RE_EXCLUIR.test(oc)) return;
    if (btn.closest('#v-crmLinea, .no-animar')) return;
    if (activo && activo !== btn) terminar(activo);
    var bg = getComputedStyle(btn).backgroundColor;
    btn.style.setProperty('--bca-fondo', bg && bg !== 'rgba(0, 0, 0, 0)' ? bg : '#334155');
    btn.classList.add('bca-btn', 'bca-guardando'); btn.classList.remove('bca-listo');
    activo = btn;
    btn.__bcaT = setTimeout(function(){ terminar(btn); }, 15000);
  }, true);
  // Se decide con el aviso (toast) que muestra la propia función al terminar.
  var envolver = function(){
    if (typeof window.toast !== 'function' || window.toast.__bca) return false;
    var orig = window.toast;
    var nuevo = function(msg, tipo){
      var r = orig.apply(this, arguments);
      if (activo){
        if (tipo === 'error') terminar(activo, false);
        else if (RE_OK.test(String(msg || '')) || tipo === 'success') terminar(activo, true);
        else terminar(activo);
      }
      return r;
    };
    nuevo.__bca = true;
    try { window.toast = nuevo; } catch(_){ return false; }
    return true;
  };
  if (!envolver()){ var n = 0, t = setInterval(function(){ if (envolver() || ++n > 40) clearInterval(t); }, 250); }
  // Si la ventana del botón se cierra (guardó y cerró), no hace falta más.
  setInterval(function(){ if (activo && !document.body.contains(activo)) activo = null; }, 1000);
}

/* ---------- 3 · Deslizar un chat (celular, CRM WhatsApp) ---------- */
function deslizarChats(){
  if (quieto) return;
  var movil = function(){ return matchMedia('(max-width:1024px)').matches && matchMedia('(pointer:coarse)').matches; };
  var s = null, UMBRAL = 84;
  document.addEventListener('touchstart', function(e){
    if (!movil() || e.touches.length !== 1) return;
    var row = e.target.closest && e.target.closest('#waLista .wa-row[data-hiloid]'); if (!row) return;
    s = { row: row, x0: e.touches[0].clientX, y0: e.touches[0].clientY, dx: 0, modo: null, fondo: null };
  }, { passive: true, capture: true });
  document.addEventListener('touchmove', function(e){
    if (!s) return;
    var t = e.touches[0], dx = t.clientX - s.x0, dy = t.clientY - s.y0;
    if (!s.modo){
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      s.modo = Math.abs(dx) > Math.abs(dy) * 1.3 ? 'lado' : 'scroll';
      if (s.modo === 'lado'){
        var noLeido = s.row.classList.contains('no-leido');
        var f = document.createElement('div'); f.className = 'bca-swipe-fondo';
        f.innerHTML = '<span class="der"><i class="ti ti-message-' + (noLeido ? 'check' : 'dots') + '"></i>' + (noLeido ? 'Leído' : 'No leído') + '</span><span class="izq">Archivar<i class="ti ti-archive"></i></span>';
        var cont = s.row.parentElement; var r = s.row.getBoundingClientRect(), rc = cont.getBoundingClientRect();
        f.style.cssText = 'position:absolute;left:' + (r.left - rc.left + cont.scrollLeft) + 'px;top:' + (r.top - rc.top + cont.scrollTop) + 'px;width:' + r.width + 'px;height:' + r.height + 'px;background:linear-gradient(90deg,#2563eb 0 50%,#008069 50%)';
        if (getComputedStyle(cont).position === 'static') cont.style.position = 'relative';
        cont.insertBefore(f, s.row); s.fondo = f;
        s.row.classList.add('bca-arrastra');
      }
    }
    if (s.modo !== 'lado') return;
    if (e.cancelable) e.preventDefault();
    s.dx = Math.max(-140, Math.min(140, dx));
    s.row.style.transform = 'translateX(' + s.dx + 'px)';
    s.fondo.style.background = s.dx < 0 ? '#008069' : '#2563eb';
    s.fondo.classList.toggle('on-izq', s.dx <= -UMBRAL);
    s.fondo.classList.toggle('on-der', s.dx >= UMBRAL);
  }, { passive: false, capture: true });
  var soltar = function(){
    if (!s) return;
    var d = s, id = d.row.getAttribute('data-hiloid');
    s = null;
    if (d.modo !== 'lado') return;
    d.row.__bcwaSinClick = true; setTimeout(function(){ d.row.__bcwaSinClick = false; }, 450);
    var accion = d.dx <= -UMBRAL ? 'archivar' : d.dx >= UMBRAL ? 'noLeido' : null;
    if (accion && navigator.vibrate) try { navigator.vibrate(10); } catch(_){}
    d.row.classList.add('bca-vuelve'); d.row.style.transform = accion === 'archivar' ? 'translateX(-110%)' : '';
    setTimeout(function(){
      d.row.classList.remove('bca-arrastra', 'bca-vuelve'); d.row.style.transform = '';
      if (d.fondo) d.fondo.remove();
      if (accion && typeof window._bcWaChatAccion === 'function') window._bcWaChatAccion(accion, id);
    }, 290);
  };
  document.addEventListener('touchend', soltar, true);
  document.addEventListener('touchcancel', soltar, true);
}

function iniciar(){ vigilarNumeros(); botonGuardar(); deslizarChats(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, { once: true }); else iniciar();
window.BayolAnimaciones = { version: '20261014a', animarNumero: animarNumero };
})();
