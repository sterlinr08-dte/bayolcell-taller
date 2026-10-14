/* BAYOL CELL · taller · 3 mejoras tomadas de la lista de referencias (docs/REFERENCIAS-DISENO.md), 14 oct 2026.
 *  1) «Mantén presionado para borrar» (The Kitchen, «Hold to Confirm»): en la ventana confirmar() de borrar /
 *     eliminar / anular / quitar, el botón rojo hay que dejarlo presionado ~0,9 s. Un toque solo no borra.
 *  2) Embudo de Leads (beUI): arriba de la lista de Leads del CRM, cuántos clientes llegan a cada etapa
 *     (nuevo → contactado → cotizado → vendido) y cuántos se pierden. Tocar una etapa la filtra.
 *  3) Logos de marcas (Simple Icons, licencia CC0): Apple, Samsung, Xiaomi, Motorola… junto al código en el
 *     buscador de artículos y en «Agregar equipo al lote». Los logos son marcas de sus dueños: solo nombran la marca.
 * Capa aislada: no cambia ids, onclick ni datos. API: window.BayolMejorasRef
 */
(function(){'use strict';
if (window.BayolMejorasRef) return;
var VERSION = '20261014m1';
var quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

var css = [
/* 1 · mantener presionado */
'#confOk.bch-hold{position:relative;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}',
'#confOk.bch-hold .bch-fill{position:absolute;inset:0;background:rgba(0,0,0,.22);transform:scaleX(0);transform-origin:left center;pointer-events:none}',
'#confOk.bch-hold.bch-on .bch-fill{transform:scaleX(1);transition:transform var(--bch-ms,900ms) linear}',
'#confOk.bch-hold .bch-txt{position:relative;display:inline-flex;align-items:center;gap:6px}',
'#confOk.bch-hold.bch-on{transform:scale(.97)}',
'#confOk.bch-hold.bch-aviso{animation:bchNo .36s ease}',
'@keyframes bchNo{25%{transform:translateX(-4px)}50%{transform:translateX(4px)}75%{transform:translateX(-2px)}}',
'.bch-nota{font-size:12.5px;color:#475569;text-align:center;margin:-6px 22px 0;line-height:1.4}',
/* 2 · embudo */
'.bce-card{background:#fff;border-radius:14px;box-shadow:0 6px 22px -14px rgba(15,23,42,.45);border:1px solid rgba(15,23,42,.08);padding:14px 14px 10px;margin-bottom:12px}',
'.bce-head{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:8px;flex-wrap:wrap}',
'.bce-tit{font-weight:800;font-size:14px;color:#0f172a;display:flex;align-items:center;gap:6px}',
'.bce-tit i{color:#475569}',
'.bce-res{font-size:12.5px;color:#475569}',
'.bce-res b{color:#15803d}',
'.bce-fila{display:grid;grid-template-columns:96px 1fr 74px;align-items:center;gap:10px;width:100%;min-height:40px;padding:4px 6px;margin:0 0 2px;border:0;background:transparent;border-radius:10px;cursor:pointer;font:inherit;text-align:left;color:#0f172a;transition:background .15s}',
'.bce-fila:hover,.bce-fila:focus-visible{background:#f1f5f9;outline:none}',
'.bce-fila.on{background:#f1f5f9;box-shadow:inset 0 0 0 1.5px #cbd5e1}',
'.bce-et{font-size:13px;font-weight:700}',
'.bce-et small{display:block;font-size:11.5px;font-weight:500;color:#475569}',
'.bce-pista{height:22px;display:flex;justify-content:center}',
'.bce-barra{height:100%;border-radius:7px;min-width:6px;transition:width .5s cubic-bezier(.2,.9,.25,1)}',
'.bce-num{text-align:right;font-size:13px;font-weight:800;font-variant-numeric:tabular-nums}',
'.bce-num small{display:block;font-size:11.5px;font-weight:500;color:#475569}',
'.bce-perd{border-top:1px dashed #e2e8f0;margin-top:6px;padding-top:6px}',
'@media (max-width:480px){.bce-fila{grid-template-columns:84px 1fr 64px;gap:8px}}',
/* 3 · logos */
'.bcl-logo{display:inline-block;vertical-align:-1px;fill:currentColor;color:#1d1d1f;flex:none}',
'.eq-mk .bcl-logo{color:#334155}',
'.bcl-par{display:inline-flex;align-items:center;gap:5px}',
'@media (prefers-reduced-motion:reduce){#confOk.bch-hold.bch-aviso{animation:none}.bce-barra{transition:none}}'
].join('\n');
var st = document.createElement('style'); st.id = 'bcMejorasRefCSS'; st.textContent = css; document.head.appendChild(st);

/* ---------- 1 · Mantener presionado para borrar ---------- */
var MS = 900;
var RE_PELIGRO = /^[\s¿⚠️]*(borrar|eliminar|anular|quitar|revertir|reversar|vaciar)\b/i;
function prepararConfirm(bg){
  if (!bg || bg._bch) return;
  var ok = bg.querySelector('#confOk'); if (!ok || !ok.classList.contains('btn-danger')) return;
  var msgEl = bg.querySelector('div[style*="white-space:pre-line"]');
  var msg = msgEl ? msgEl.textContent : '';
  var m = msg.match(RE_PELIGRO); if (!m) return;
  var accion = typeof ok.onclick === 'function' ? ok.onclick : null; if (!accion) return;
  bg._bch = true;
  var verbo = m[1].toLowerCase();
  ok.onclick = null;
  ok.classList.add('bch-hold');
  ok.style.setProperty('--bch-ms', MS + 'ms');
  ok.setAttribute('aria-label', 'Mantén presionado para ' + verbo);
  ok.innerHTML = '<span class="bch-fill"></span><span class="bch-txt"><i class="ti ti-hand-finger"></i> Mantén para ' + esc(verbo) + '</span>';
  var nota = document.createElement('div'); nota.className = 'bch-nota';
  nota.textContent = 'Para que no se ' + (verbo === 'quitar' ? 'quite' : verbo === 'anular' ? 'anule' : 'borre') + ' sin querer, deja el dedo sobre el botón rojo hasta que se llene.';
  var pie = ok.parentNode; if (pie && pie.parentNode) pie.parentNode.insertBefore(nota, pie);
  var timer = null, hecho = false;
  function empezar(e){
    if (hecho || timer) return;
    if (e && e.pointerId != null) { try { ok.setPointerCapture(e.pointerId); } catch(_){} }
    ok.classList.remove('bch-aviso'); void ok.offsetWidth; ok.classList.add('bch-on');
    timer = setTimeout(function(){
      timer = null; hecho = true;
      try { navigator.vibrate && navigator.vibrate(18); } catch(_){}
      accion.call(ok);
    }, MS);
  }
  function soltar(){
    if (!timer) return;
    clearTimeout(timer); timer = null;
    ok.classList.remove('bch-on');
    if (!quieto) { void ok.offsetWidth; ok.classList.add('bch-aviso'); }
    nota.style.color = '#b91c1c';
  }
  ok.addEventListener('pointerdown', function(e){ if (e.button > 0) return; e.preventDefault(); empezar(e); });
  ok.addEventListener('pointerup', soltar);
  ok.addEventListener('pointercancel', soltar);
  ok.addEventListener('lostpointercapture', soltar);
  ok.addEventListener('contextmenu', function(e){ e.preventDefault(); });
  ok.addEventListener('keydown', function(e){ if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); empezar(); } });
  ok.addEventListener('keyup', function(e){ if (e.key === 'Enter' || e.key === ' ') soltar(); });
}
new MutationObserver(function(muts){
  for (var i = 0; i < muts.length; i++) for (var j = 0; j < muts[i].addedNodes.length; j++) {
    var n = muts[i].addedNodes[j]; if (n.id === 'modalConfirm') prepararConfirm(n);
  }
}).observe(document.body, { childList: true });

/* ---------- 2 · Embudo de Leads ---------- */
var ORDEN = ['nuevo', 'contactado', 'cotizado', 'vendido'];
function leads(){ try { return Array.isArray(_leadsCache) ? _leadsCache : []; } catch(_) { return []; } }
function info(et){ try { return LEADS_ETAPA_INFO[et]; } catch(_) { return null; } }
function filtroActual(){ try { return _leadsFiltro; } catch(_) { return 'todos'; } }
function pintarEmbudo(){
  var filtros = document.getElementById('leadsFiltros'); if (!filtros) return;
  var cont = document.getElementById('bceEmbudo');
  if (!cont) { cont = document.createElement('div'); cont.id = 'bceEmbudo'; filtros.parentNode.insertBefore(cont, filtros); }
  var L = leads(), total = L.length;
  if (!total) { cont.innerHTML = ''; return; }
  var ahora = { nuevo: 0, contactado: 0, cotizado: 0, vendido: 0, perdido: 0 };
  L.forEach(function(l){ var e = ahora.hasOwnProperty(l.etapa) ? l.etapa : 'nuevo'; ahora[e]++; });
  var llegaron = ORDEN.map(function(et, k){ var s = 0; for (var x = k; x < ORDEN.length; x++) s += ahora[ORDEN[x]]; return k === 0 ? total : s; });
  var pct = function(n){ return Math.round(n * 100 / total); };
  var sel = filtroActual();
  var fila = function(et, n, aqui, ancho){
    var i = info(et) || { txt: et, color: '#475569', bg: '#e2e8f0' };
    return '<button type="button" class="bce-fila' + (sel === et ? ' on' : '') + '" data-et="' + et + '" title="Ver solo ' + esc(i.txt) + '">' +
      '<span class="bce-et">' + esc(i.txt) + '<small>' + aqui + ' ahora aquí</small></span>' +
      '<span class="bce-pista"><span class="bce-barra" style="width:' + ancho + '%;background:' + i.color + ';opacity:.85"></span></span>' +
      '<span class="bce-num">' + n + '<small>' + pct(n) + ' %</small></span></button>';
  };
  var vend = ahora.vendido, cerr = vend + ahora.perdido;
  var resumen = cerr ? 'De los que ya se cerraron, <b>' + Math.round(vend * 100 / cerr) + ' %</b> compró' : 'Todavía no hay leads cerrados';
  cont.innerHTML = '<div class="bce-card"><div class="bce-head"><span class="bce-tit"><i class="ti ti-filter"></i> Embudo de ventas · ' + total + ' lead' + (total === 1 ? '' : 's') + '</span><span class="bce-res">' + resumen + '</span></div>' +
    ORDEN.map(function(et, k){ return fila(et, llegaron[k], ahora[et], Math.max(4, pct(llegaron[k]))); }).join('') +
    '<div class="bce-perd">' + fila('perdido', ahora.perdido, ahora.perdido, Math.max(4, pct(ahora.perdido))) + '</div></div>';
  cont.querySelectorAll('.bce-fila').forEach(function(b){ b.onclick = function(){
    var et = b.getAttribute('data-et');
    try { _leadsFiltro = (filtroActual() === et) ? 'todos' : et; } catch(_) { return; }
    if (typeof window._pintarLeads === 'function') window._pintarLeads();
  }; });
}
if (typeof window._pintarLeads === 'function') {
  var origPintar = window._pintarLeads;
  window._pintarLeads = function(){
    var r = origPintar.apply(this, arguments);
    // De paso: los botones de filtro se quedaban marcando la etapa anterior al cambiar de filtro.
    try { if (typeof origFiltros === 'function') origFiltros(); } catch(_){}
    try { pintarEmbudo(); } catch(e){ console.warn('[mejoras] embudo', e); }
    return r;
  };
}
var origFiltros = typeof window._pintarLeadsFiltros === 'function' ? window._pintarLeadsFiltros : null;

/* ---------- 3 · Logos de marcas (Simple Icons, CC0) ---------- */
var LOGOS={"apple":["1.75 -0.48 20.51 24.96","M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701","Apple"],"samsung":["-0.48 9.69 24.96 4.63","M19.8166 10.2808l.0459 2.6934h-.023l-.7793-2.6934h-1.2837v3.3925h.8481l-.0458-2.785h.023l.8366 2.785h1.2264v-3.3925zm-16.149 0l-.6418 3.427h.9284l.4699-3.1175h.0229l.4585 3.1174h.9169l-.6304-3.4269zm5.1805 0l-.424 2.6132h-.023l-.424-2.6132H6.5788l-.0688 3.427h.8596l.023-3.0832h.0114l.573 3.0831h.8711l.5731-3.083h.023l.0228 3.083h.8596l-.0802-3.4269zm-7.2664 2.4527c.0343.0802.0229.1949.0114.2522-.0229.1146-.1031.2292-.3324.2292-.2177 0-.3438-.126-.3438-.3095v-.3323H0v.2636c0 .7679.6074.9971 1.2493.9971.6189 0 1.1346-.2178 1.2149-.7794.0458-.298.0114-.4928 0-.5616-.1605-.722-1.467-.9283-1.5588-1.3295-.0114-.0688-.0114-.1375 0-.1834.023-.1146.1032-.2292.3095-.2292.2063 0 .321.126.321.3095v.2063h.8595v-.2407c0-.745-.6762-.8596-1.1576-.8596-.6074 0-1.1117.2063-1.2034.7564-.023.149-.0344.2866.0114.4585.1376.7106 1.364.9169 1.5358 1.3524m11.152 0c.0343.0803.0228.1834.0114.2522-.023.1146-.1032.2292-.3324.2292-.2178 0-.3438-.126-.3438-.3095v-.3323h-.917v.2636c0 .7564.596.9857 1.2379.9857.6189 0 1.1232-.2063 1.2034-.7794.0459-.298.0115-.4814 0-.5616-.1375-.7106-1.4327-.9284-1.5243-1.318-.0115-.0688-.0115-.1376 0-.1835.0229-.1146.1031-.2292.3094-.2292.1948 0 .321.126.321.3095v.2063h.848v-.2407c0-.745-.6647-.8596-1.146-.8596-.6075 0-1.1004.1948-1.192.7564-.023.149-.023.2866.0114.4585.1376.7106 1.341.9054 1.513 1.3524m2.8882.4585c.2407 0 .3094-.1605.3323-.2522.0115-.0343.0115-.0917.0115-.126v-2.533h.871v2.4642c0 .0688 0 .1948-.0114.2292-.0573.6419-.5616.8482-1.192.8482-.6303 0-1.1346-.2063-1.192-.8482 0-.0344-.0114-.1604-.0114-.2292v-2.4642h.871v2.533c0 .0458 0 .0916.0115.126 0 .0917.0688.2522.3095.2522m7.1518-.0344c.2522 0 .3324-.1605.3553-.2522.0115-.0343.0115-.0917.0115-.126v-.4929h-.3553v-.5043H24v.917c0 .0687 0 .1145-.0115.2292-.0573.6303-.596.8481-1.2034.8481-.6075 0-1.1461-.2178-1.2034-.8481-.0115-.1147-.0115-.1605-.0115-.2293v-1.444c0-.0574.0115-.172.0115-.2293.0802-.6419.596-.8482 1.2034-.8482s1.1347.2063 1.2034.8482c.0115.1031.0115.2292.0115.2292v.1146h-.8596v-.1948s0-.0803-.0115-.1261c-.0114-.0802-.0802-.2521-.3438-.2521-.2521 0-.321.1604-.3438.2521-.0115.0458-.0115.1032-.0115.1605v1.5702c0 .0458 0 .0916.0115.126 0 .0917.0917.2522.3323.2522","Samsung"],"xiaomi":["-0.48 -0.48 24.96 24.96","M12 0C8.016 0 4.756.255 2.493 2.516.23 4.776 0 8.033 0 12.012c0 3.98.23 7.235 2.494 9.497C4.757 23.77 8.017 24 12 24c3.983 0 7.243-.23 9.506-2.491C23.77 19.247 24 15.99 24 12.012c0-3.984-.233-7.243-2.502-9.504C19.234.252 15.978 0 12 0zM4.906 7.405h5.624c1.47 0 3.007.068 3.764.827.746.746.827 2.233.83 3.676v4.54a.15.15 0 0 1-.152.147h-1.947a.15.15 0 0 1-.152-.148V11.83c-.002-.806-.048-1.634-.464-2.051-.358-.36-1.026-.441-1.72-.458H7.158a.15.15 0 0 0-.151.147v6.98a.15.15 0 0 1-.152.148H4.906a.15.15 0 0 1-.15-.148V7.554a.15.15 0 0 1 .15-.149zm12.131 0h1.949a.15.15 0 0 1 .15.15v8.892a.15.15 0 0 1-.15.148h-1.949a.15.15 0 0 1-.151-.148V7.554a.15.15 0 0 1 .151-.149zM8.92 10.948h2.046c.083 0 .15.066.15.147v5.352a.15.15 0 0 1-.15.148H8.92a.15.15 0 0 1-.152-.148v-5.352a.15.15 0 0 1 .152-.147Z","Xiaomi"],"motorola":["-0.48 -0.48 24.96 24.96","M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12C24.002 5.375 18.632.002 12.007 0H12zm7.327 18.065s-.581-2.627-1.528-4.197c-.514-.857-1.308-1.553-2.368-1.532-.745 0-1.399.423-2.2 1.553-.469.77-.882 1.573-1.235 2.403 0 0-.29-.675-.63-1.343a8.038 8.038 0 0 0-.605-1.049c-.804-1.13-1.455-1.539-2.2-1.553-1.049-.021-1.854.675-2.364 1.528-.948 1.574-1.528 4.197-1.528 4.197h-.864l4.606-15.12 3.56 11.804.024.021.024-.021 3.56-11.804 4.61 15.113h-.862z","Motorola"],"huawei":["-0.48 2.48 24.96 19.04","M3.67 6.14S1.82 7.91 1.72 9.78v.35c.08 1.51 1.22 2.4 1.22 2.4 1.83 1.79 6.26 4.04 7.3 4.55 0 0 .06.03.1-.01l.02-.04v-.04C7.52 10.8 3.67 6.14 3.67 6.14zM9.65 18.6c-.02-.08-.1-.08-.1-.08l-7.38.26c.8 1.43 2.15 2.53 3.56 2.2.96-.25 3.16-1.78 3.88-2.3.06-.05.04-.09.04-.09zm.08-.78C6.49 15.63.21 12.28.21 12.28c-.15.46-.2.9-.21 1.3v.07c0 1.07.4 1.82.4 1.82.8 1.69 2.34 2.2 2.34 2.2.7.3 1.4.31 1.4.31.12.02 4.4 0 5.54 0 .05 0 .08-.05.08-.05v-.06c0-.03-.03-.05-.03-.05zM9.06 3.19a3.42 3.42 0 00-2.57 3.15v.41c.03.6.16 1.05.16 1.05.66 2.9 3.86 7.65 4.55 8.65.05.05.1.03.1.03a.1.1 0 00.06-.1c1.06-10.6-1.11-13.42-1.11-13.42-.32.02-1.19.23-1.19.23zm8.299 2.27s-.49-1.8-2.44-2.28c0 0-.57-.14-1.17-.22 0 0-2.18 2.81-1.12 13.43.01.07.06.08.06.08.07.03.1-.03.1-.03.72-1.03 3.9-5.76 4.55-8.64 0 0 .36-1.4.02-2.34zm-2.92 13.07s-.07 0-.09.05c0 0-.01.07.03.1.7.51 2.85 2 3.88 2.3 0 0 .16.05.43.06h.14c.69-.02 1.9-.37 3-2.26l-7.4-.25zm7.83-8.41c.14-2.06-1.94-3.97-1.94-3.98 0 0-3.85 4.66-6.67 10.8 0 0-.03.08.02.13l.04.01h.06c1.06-.53 5.46-2.77 7.28-4.54 0 0 1.15-.93 1.21-2.42zm1.52 2.14s-6.28 3.37-9.52 5.55c0 0-.05.04-.03.11 0 0 .03.06.07.06 1.16 0 5.56 0 5.67-.02 0 0 .57-.02 1.27-.29 0 0 1.56-.5 2.37-2.27 0 0 .73-1.45.17-3.14z","Huawei"],"google":["-0.17 -0.48 24.35 24.96","M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z","Google"],"oneplus":["-0.48 -0.48 24.96 24.96","M0 3.74V24h20.26V12.428h-2.256v9.317H2.254V5.995h9.318V3.742zM18.004 0v3.74h-3.758v2.256h3.758v3.758h2.255V5.996H24V3.74h-3.758V0zm-6.45 18.756V8.862H9.562c0 .682-.228 1.189-.577 1.504-.367.297-.91.437-1.556.437h-.245v1.625h2.133v6.31h2.237z","OnePlus"],"oppo":["-0.48 8.67 24.96 6.67","M2.85 12.786h-.001C1.639 12.774.858 12.2.858 11.321s.781-1.452 1.99-1.465c1.21.013 1.992.588 1.992 1.465s-.782 1.453-1.99 1.465zm.034-3.638h-.073C1.156 9.175 0 10.068 0 11.32s1.156 2.147 2.811 2.174h.073c1.655-.027 2.811-.921 2.811-2.174S4.54 9.175 2.885 9.148zm18.27 3.638c-1.21-.012-1.992-.587-1.992-1.465s.782-1.452 1.991-1.465c1.21.013 1.991.588 1.991 1.465s-.781 1.453-1.99 1.465zm.035-3.638h-.073c-1.655.027-2.811.92-2.811 2.173s1.156 2.147 2.81 2.174h.074C22.844 13.468 24 12.574 24 11.32s-1.156-2.146-2.811-2.173zm-6.126 3.638c-1.21-.012-1.99-.587-1.99-1.465s.78-1.452 1.99-1.465c1.21.013 1.991.588 1.991 1.465s-.781 1.453-1.99 1.465zm.036-3.638h-.073c-.789.013-1.464.222-1.955.574v-.37h-.857v5.5h.857v-1.931c.49.351 1.166.56 1.954.574h.074c1.655-.027 2.81-.921 2.81-2.174s-1.155-2.146-2.81-2.173zm-6.144 3.638c-1.21-.012-1.99-.587-1.99-1.465s.78-1.452 1.99-1.465c1.21.013 1.991.588 1.991 1.465s-.781 1.453-1.99 1.465zm.037-3.638H8.92c-.789.013-1.464.222-1.955.574v-.37h-.856v5.5h.856v-1.931c.491.351 1.166.56 1.955.574a3.728 3.728 0 0 0 .073 0c1.655-.027 2.811-.921 2.811-2.174s-1.156-2.146-2.81-2.173z","OPPO"],"vivo":["-0.48 8.37 24.96 7.25","M19.604 14.101c-1.159 0-1.262-.95-1.262-1.24 0-.29.103-1.242 1.262-1.242h2.062c1.16 0 1.263.951 1.263 1.242 0 .29-.104 1.24-1.263 1.24m-2.062-3.527c-2.142 0-2.333 1.752-2.333 2.287 0 .535.19 2.286 2.333 2.286h2.062c2.143 0 2.334-1.751 2.334-2.286 0-.535-.19-2.287-2.334-2.287m-5.477.107c-.286 0-.345.05-.456.213-.11.164-2.022 3.082-2.022 3.082-.06.09-.126.126-.206.126-.08 0-.145-.036-.206-.126 0 0-1.912-2.918-2.022-3.082-.11-.164-.17-.213-.456-.213h-.668c-.154 0-.224.12-.127.267l2.283 3.467c.354.521.614.732 1.196.732s.842-.21 1.196-.732l2.284-3.467c.096-.146.026-.267-.128-.267m-8.876.284c0-.203.08-.284.283-.284h.505c.203 0 .283.08.283.283v3.9c0 .202-.08.283-.283.283h-.505c-.203 0-.283-.08-.283-.283zm-1.769-.285c-.287 0-.346.05-.456.213-.11.164-2.022 3.082-2.022 3.082-.061.09-.126.126-.206.126-.08 0-.145-.036-.206-.126 0 0-1.912-2.918-2.023-3.082-.11-.164-.169-.213-.455-.213H.175c-.171 0-.224.12-.127.267l2.283 3.467c.355.521.615.732 1.197.732.582 0 .842-.21 1.196-.732l2.283-3.467c.097-.146.044-.267-.127-.267m1.055-.893c-.165-.164-.165-.295 0-.46l.351-.351c.165-.165.296-.165.46 0l.352.351c.165.165.165.296 0 .46l-.352.352c-.164.165-.295.165-.46 0z","vivo"],"honor":["-0.48 9.21 24.96 5.58","M2.601 9.753v1.823H.807V9.753H0v4.498h.807v-1.874h1.794v1.874h.807V9.753h-.807Zm18.671.801h.898c.369 0 .667.297.667.662a.665.665 0 0 1-.667.663h-.898v-1.325Zm-.806-.801v4.498h.806v-2.002l1.68 2.002H24l-1.376-1.64a1.462 1.462 0 0 0-.444-2.858h-1.716.002Zm-7.63-.014v2.807l-1.959-2.807h-.644v4.498h.807v-2.82l1.968 2.82h.633V9.739h-.805Zm-7.532 2.26c0-.832.68-1.506 1.517-1.506A1.51 1.51 0 0 1 8.337 12c0 .832-.679 1.506-1.516 1.506-.403 0-.789-.159-1.073-.441A1.504 1.504 0 0 1 5.304 12v-.001ZM4.497 12c0 .933.566 1.774 1.434 2.132.869.357 1.868.16 2.533-.5.664-.66.863-1.653.503-2.515a2.324 2.324 0 0 0-2.146-1.425 2.316 2.316 0 0 0-2.323 2.307L4.497 12Zm11.04-.001a1.513 1.513 0 0 1 1.518-1.506c.838 0 1.516.675 1.516 1.507a1.513 1.513 0 0 1-1.518 1.506c-.402 0-.788-.159-1.072-.441a1.5 1.5 0 0 1-.444-1.066ZM14.73 12c0 .933.566 1.774 1.434 2.132.868.357 1.868.16 2.532-.5.665-.66.864-1.653.504-2.515a2.325 2.325 0 0 0-2.147-1.425 2.316 2.316 0 0 0-2.323 2.307V12Z","Honor"],"nokia":["-0.48 8.7 24.96 6.61","M16.59 9.348v5.304h.796V9.348Zm-8.497-.09c-1.55 0-2.752 1.127-2.752 2.742 0 1.687 1.202 2.742 2.752 2.742 1.55 0 2.754-1.055 2.751-2.742a2.72 2.72 0 0 0-2.751-2.742ZM10.05 12c0 1.195-.876 1.987-1.957 1.987-1.082 0-1.958-.792-1.958-1.987 0-1.174.876-1.987 1.958-1.987 1.08 0 1.957.813 1.957 1.987zM0 9.176v5.476h.812v-3.619l4.218 3.79v-1.135zM11.442 12l2.952 2.652h1.184L12.622 12l2.956-2.652h-1.184ZM24 14.652h-.875l-.64-1.175h-2.898l-.64 1.175h-.875l1.06-1.958h2.937l-1.465-2.72.432-.798Z","Nokia"],"lg":["-0.48 6.23 24.96 11.54","M14.522 14.078h3.27v1.33h-4.847v-6.83h1.577v5.5zm6.74-1.274h1.284v1.195c-.236.09-.698.18-1.137.18-1.42 0-1.893-.721-1.893-2.186 0-1.398.45-2.221 1.869-2.221.791 0 1.24.248 1.612.722l.982-.903c-.6-.855-1.646-1.114-2.629-1.114-2.208 0-3.368 1.205-3.368 3.504 0 2.288 1.047 3.528 3.358 3.528 1.06 0 2.096-.27 2.66-.665V11.53h-2.739v1.274zM5.291 6.709a5.29 5.29 0 1 1 0 10.582 5.291 5.291 0 1 1 0-10.582m3.16 8.457a4.445 4.445 0 0 0 1.31-3.161v-.242l-.22.001H6.596v.494h2.662l-.001.015a3.985 3.985 0 0 1-3.965 3.708 3.95 3.95 0 0 1-2.811-1.165 3.952 3.952 0 0 1-1.164-2.811c0-1.061.414-2.059 1.164-2.81a3.951 3.951 0 0 1 2.81-1.164l.252.003v-.495l-.251-.003a4.475 4.475 0 0 0-4.47 4.469c0 1.194.465 2.316 1.309 3.161a4.444 4.444 0 0 0 3.16 1.31 4.444 4.444 0 0 0 3.162-1.31m-2.91-1.297V9.644H5.04v4.72h1.556v-.495H5.543zm-1.265-3.552a.676.676 0 1 0-.675.674.676.676 0 0 0 .675-.674","LG"],"sony":["-0.48 9.41 24.96 5.18","M8.5505 9.8881c.921 0 1.6574.2303 2.2209.7423.3848.3485.5999.8454.5939 1.3665a1.9081 1.9081 0 0 1-.5939 1.3726c-.5272.4848-1.3483.7423-2.221.7423-.8725 0-1.6785-.2575-2.2148-.7423-.3908-.3485-.609-.8484-.603-1.3726 0-.518.2182-1.015.603-1.3665.5-.4545 1.3847-.7423 2.2149-.7423zm.003 3.6692c.4606 0 .8878-.1606 1.1878-.4575.2999-.2999.4332-.6605.4332-1.1029 0-.4242-.1484-.821-.4333-1.1029-.2938-.2908-.7332-.4545-1.1877-.4545s-.8938.1637-1.1907.4545c-.2848.2818-.4333.6787-.4333 1.103-.006.409.1485.806.4333 1.1029.2969.2939.7332.4575 1.1907.4575zm-4.8418-1.9665c.1605.0424.315.094.4666.1636a1.352 1.352 0 0 1 .3787.2576c.197.206.309.4817.306.7665a.9643.9643 0 0 1-.3787.7788 2.0662 2.0662 0 0 1-.709.3485 3.7231 3.7231 0 0 1-1.1938.1697c-.352 0-.5467-.0406-.8138-.0962l-.077-.016c-.294-.0666-.5817-.1575-.8575-.2787a.0695.0695 0 0 0-.0424-.0121c-.0454 0-.0818.0394-.0818.0848v.203H.1212v-1.4786h.5242a.7559.7559 0 0 0 .1363.418c.2121.2607.4394.3607.6575.4395.3666.1212.7514.1848 1.1362.1969.5526 0 .8756-.134.9455-.163l.009-.0037.0062-.0023c.0616-.0226.3119-.1143.3119-.3916 0-.2743-.2338-.334-.387-.373l-.022-.0058c-.1708-.046-.562-.0872-.9897-.1323l-.1526-.016c-.4848-.0515-.9696-.1273-1.1968-.1758-.4977-.1097-.6942-.2917-.816-.4045l-.0082-.0076A1.0192 1.0192 0 0 1 0 11.1608c0-.497.3394-.797.7575-.9817.4454-.2.9756-.288 1.4392-.288.8211.0031 1.4877.2697 1.727.394.097.0515.1455-.0121.1455-.0606v-.1484h.5272v1.2876h-.4727a.9056.9056 0 0 0-.2939-.4909 1.289 1.289 0 0 0-.297-.1787c-.3968-.1667-.821-.2515-1.2513-.2455-.4423 0-.8665.085-1.0786.2153-.1333.0818-.2.1848-.2.306 0 .1727.1454.2424.2182.2636.1967.0597.6328.103.972.1369.0736.0073.1426.0142.2036.0206.3272.0334 1.012.1243 1.315.2zm18.1673-.9966v-.4787H24v.4696h-.4757c-.1727 0-.2424.0334-.3727.1788l-1.4271 1.63a.098.098 0 0 0-.0182.0698v.7423a1.106 1.106 0 0 0 .0121.103.1496.1496 0 0 0 .1.0909.9368.9368 0 0 0 .1303.009h.4848v.4698h-2.5724v-.4697h.4606a.9343.9343 0 0 0 .1302-.0091.1627.1627 0 0 0 .1031-.091.5626.5626 0 0 0 .009-.1v-.7422c0-.0242 0-.0242-.0333-.0636a606.7592 606.7592 0 0 0-1.4119-1.6028c-.0758-.0788-.2061-.2061-.406-.2061h-.4576v-.4696h2.5876v.4696h-.3121c-.0697 0-.1182.0697-.0576.1455 0 0 .8696 1.0392.8787 1.0513.0091.0122.0152.0122.0273.003.0121-.009.8938-1.0453.8999-1.0543a.0912.0912 0 0 0-.0182-.1273.1095.1095 0 0 0-.0606-.0182zm-6.284-.0031h.4848c.2212 0 .2606.0848.2636.2909l.0273 1.5664-2.5815-2.324H11.944v.4697h.412c.297 0 .3182.1636.3182.309v2.2138c.0004.1285.0009.295-.1818.295h-.506v.4667h2.1634v-.4697h-.5273c-.212 0-.2211-.097-.2242-.303v-1.8816l2.9724 2.6511h.7575l-.0394-2.9966c.003-.218.0182-.2908.2424-.2908h.4726v-.4697H15.595Z","Sony"],"lenovo":["-0.48 7.52 24.96 8.97","M21.044 12.288c0 .5-.343.867-.815.867-.464 0-.827-.38-.827-.867 0-.51.343-.868.815-.868.464 0 .827.381.827.868zm-14.305-.92a.787.787 0 0 0-.651.307.991.991 0 0 0-.172.738l1.479-.614a.708.708 0 0 0-.656-.43zm6.963.052c-.472 0-.816.358-.816.868 0 .486.364.867.828.867.472 0 .815-.368.815-.867 0-.487-.363-.868-.827-.868zM24 7.997v8.006H0V7.997h24zM5.01 13.05H3.088V9.825H2.23v4.003h2.78v-.777zm1.137-.094l2.163-.897a1.667 1.667 0 0 0-.37-.86c-.284-.33-.704-.505-1.216-.505-.931 0-1.633.686-1.633 1.593 0 .93.704 1.593 1.726 1.593.572 0 1.158-.272 1.432-.589l-.535-.411c-.357.264-.56.326-.885.326-.292 0-.52-.09-.682-.25zm5.57-1.039c0-.709-.507-1.223-1.252-1.223a1.28 1.28 0 0 0-1.005.494v-.442h-.846v3.081h.846v-1.753c0-.316.245-.651.698-.651.35 0 .712.243.712.651v1.753h.847v-1.91zm3.647.37c0-.904-.725-1.593-1.65-1.593-.933 0-1.663.7-1.663 1.593 0 .903.726 1.592 1.651 1.592.932 0 1.662-.7 1.662-1.592zm2.066 1.54l1.268-3.081h-.967l-.765 2.099-.765-2.1h-.966l1.268 3.081h.927zm4.449-1.54c0-.904-.725-1.593-1.65-1.593-.932 0-1.662.7-1.662 1.593 0 .903.725 1.592 1.65 1.592.932 0 1.662-.7 1.662-1.592z","Lenovo"]};
var MARCAS = [
  ['apple', /\b(IPHONE|IPAD|APPLE|AIRPODS|MACBOOK)\b/], ['samsung', /\b(SAMSUNG|SAMS|GALAXY)\b/], ['xiaomi', /\b(XIAOMI|REDMI|POCO|POCOPHONE)\b/],
  ['motorola', /\b(MOTOROLA|MOTO)\b/], ['huawei', /\b(HUAWEI|HAWEI)\b/], ['honor', /\bHONOR\b/], ['google', /\b(PIXEL|GOOGLE)\b/],
  ['oneplus', /\b(ONEPLUS|ONE PLUS)\b/], ['oppo', /\bOPPO\b/], ['vivo', /\bVIVO\b/], ['nokia', /\bNOKIA\b/], ['lg', /\bLG\b/],
  ['sony', /\b(SONY|XPERIA)\b/], ['lenovo', /\bLENOVO\b/]
];
function marcaDe(texto){ var t = String(texto || '').toUpperCase(); for (var i = 0; i < MARCAS.length; i++) if (MARCAS[i][1].test(t)) return MARCAS[i][0]; return ''; }
function logoSVG(k, alto){
  var L = LOGOS[k]; if (!L) return '';
  var vb = L[0].split(' ').map(Number);
  if (vb[2] / vb[3] < 2) alto = Math.round(alto * 1.3); // logos cuadrados (Apple, Xiaomi…) un poco más grandes que las palabras (Samsung)
  var ancho = Math.round(alto * vb[2] / vb[3] * 10) / 10;
  return '<svg class="bcl-logo" viewBox="' + L[0] + '" width="' + ancho + '" height="' + alto + '" role="img" aria-label="' + esc(L[2]) + '"><title>' + esc(L[2]) + '</title><path d="' + L[1] + '"/></svg>';
}
// Logo en la etiqueta de marca: si el texto ya dice la marca, el logo la reemplaza; si no, va al lado.
function ponerLogo(html, claseMk, texto, marcaTxt){
  var k = marcaDe(texto); if (!k) return html;
  var abre = '<span class="' + claseMk + '">', p = html.indexOf(abre); if (p < 0) return html;
  var fin = html.indexOf('</span>', p); if (fin < 0) return html;
  var nombre = LOGOS[k][2].toUpperCase(), mt = String(marcaTxt || '').trim().toUpperCase();
  var dentro = (!mt || nombre.indexOf(mt) >= 0 || mt.indexOf(nombre) >= 0) ? logoSVG(k, 11) : '<span class="bcl-par">' + logoSVG(k, 11) + esc(marcaTxt) + '</span>';
  return html.slice(0, p + abre.length) + dentro + html.slice(fin);
}
if (typeof window._abCard === 'function') {
  var origAb = window._abCard;
  window._abCard = function(a){
    var html = origAb.apply(this, arguments);
    try { return a ? ponerLogo(html, 'mk', (a.descripcion || '') + ' ' + (a.marca || ''), a.marca) : html; } catch(_) { return html; }
  };
}
if (typeof window._eqCardRow === 'function') {
  var origEq = window._eqCardRow;
  window._eqCardRow = function(e){
    var html = origEq.apply(this, arguments);
    try {
      var ip = (e && e.articulo_codigo && typeof _findInfoplusArt === 'function') ? _findInfoplusArt(e.articulo_codigo) : null;
      var marca = (ip && ip.marca) || (e && e.marca) || '';
      return e ? ponerLogo(html, 'eq-mk', ((ip && ip.descripcion) || e.modelo || '') + ' ' + marca, marca) : html;
    } catch(_) { return html; }
  };
}

window.BayolMejorasRef = { version: VERSION, marcaDe: marcaDe, logo: logoSVG, embudo: pintarEmbudo };
})();
