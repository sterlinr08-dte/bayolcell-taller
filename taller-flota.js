/* taller-flota.js — Tarjetas estilo «FleetTrack» (ref. Orbix Studio, 14-oct-2026)
 * Reacondicionados (equipos del lote) y Órdenes de Servicio.
 * - Estilos de las tarjetas .bcf-* que arma taller-app.js (renderEquipoReacondCard / _ordCardHTML).
 * - Filtros de estado del MISMO color que la etiqueta de cada tarjeta (el rojo solo para problemas).
 * - Fotos del catálogo web (catalogo_items) para ponerle cara a cada equipo.
 * Capa aislada: no cambia ids, onclick ni datos. API: window.BayolFlota
 */
(function(){
'use strict';
if (window.BayolFlota) return;
var VERSION = '20261015c1';

/* ---------- Estilos ---------- */
var CSS = `
.bcf-card,.bcf-kpi,.bcf-fchip{
  --bcf-bg:#f1f5f9;--bcf-fg:#475569;--bcf-dot:#94a3b8;
}
[data-tono="azul"],.bcf-t-azul{--bcf-bg:#e0edff;--bcf-fg:#1d4ed8;--bcf-dot:#3b82f6;}
[data-tono="naranja"],.bcf-t-naranja{--bcf-bg:#ffedd5;--bcf-fg:#c2410c;--bcf-dot:#FF6B35;}
[data-tono="amarillo"],.bcf-t-amarillo{--bcf-bg:#fef3c7;--bcf-fg:#a16207;--bcf-dot:#eab308;}
[data-tono="morado"],.bcf-t-morado{--bcf-bg:#f3e8ff;--bcf-fg:#7e22ce;--bcf-dot:#a855f7;}
[data-tono="verde"],.bcf-t-verde{--bcf-bg:#dcfce7;--bcf-fg:#15803d;--bcf-dot:#22c55e;}
[data-tono="teal"],.bcf-t-teal{--bcf-bg:#ccfbf1;--bcf-fg:#0f766e;--bcf-dot:#14b8a6;}
[data-tono="rojo"],.bcf-t-rojo{--bcf-bg:#fee2e2;--bcf-fg:#b91c1c;--bcf-dot:#ef4444;}
[data-tono="gris"],.bcf-t-gris{--bcf-bg:#f1f5f9;--bcf-fg:#475569;--bcf-dot:#94a3b8;}

#reacondEquiposLista,.bcf-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:14px;align-items:start;}
.bcf-card{position:relative;display:flex;flex-direction:column;gap:12px;background:#fff;border:1px solid #e6e9ef;border-radius:18px;padding:16px;
  box-shadow:0 1px 2px rgba(15,23,42,.04),0 10px 24px -18px rgba(15,23,42,.25);cursor:pointer;min-width:0;
  transition:border-color .18s ease,box-shadow .18s ease,transform .18s ease;}
.bcf-ord{cursor:default;}
@media (hover:hover){.bcf-card:hover{border-color:#ffc9b3;box-shadow:0 2px 4px rgba(15,23,42,.05),0 16px 30px -18px rgba(214,82,37,.35);transform:translateY(-2px);}}
.bcf-card:focus-visible{outline:2px solid #FF6B35;outline-offset:2px;}
.bcf-card.bcf-sel{border:2px solid #FF6B35;padding:15px;box-shadow:0 0 0 4px rgba(255,107,53,.12),0 16px 30px -20px rgba(214,82,37,.45);}
.bcf-h{display:flex;align-items:flex-start;gap:10px;}
.bcf-chk{width:20px!important;height:20px!important;margin:2px 0 0!important;flex:none;accent-color:#FF6B35;cursor:pointer;}
.bcf-tit{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;}
.bcf-tit b{font-size:15px;font-weight:750;color:#0f172a;line-height:1.25;letter-spacing:-.01em;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;}
.bcf-sub{margin-top:-8px;font-size:12px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums;}
.bcf-tit span{font-size:12px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums;}
.bcf-tag,.bcf-chip{flex:none;display:inline-flex;align-items:center;gap:6px;height:26px;padding:0 10px;border-radius:999px;background:var(--bcf-bg);color:var(--bcf-fg);font-size:12px;font-weight:650;white-space:nowrap;}
.bcf-tag::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--bcf-dot);}
.bcf-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:-4px;}
.bcf-chip{height:24px;font-size:11.5px;}
.bcf-media{height:128px;border-radius:14px;background:radial-gradient(70% 80% at 50% 60%,#ffffff 0%,#f1f4f8 100%);display:flex;align-items:center;justify-content:center;overflow:hidden;}
.bcf-media img{max-height:116px;max-width:88%;object-fit:contain;filter:drop-shadow(0 12px 12px rgba(15,23,42,.18));transition:transform .35s cubic-bezier(.2,.8,.2,1);}
@media (hover:hover){.bcf-card:hover .bcf-media img{transform:scale(1.04);}}
.bcf-sinfoto{display:flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:18px;background:#fff;box-shadow:0 6px 16px -10px rgba(15,23,42,.35);color:#94a3b8;}
.bcf-sinfoto i{font-size:30px;}
.bcf-sinfoto svg{fill:#64748b;max-width:46px;height:auto;}
.bcf-falla{font-size:12.5px;color:#334155;background:#f8fafc;border-radius:10px;padding:8px 10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.bcf-falla i{color:#94a3b8;}
.bcf-per{display:flex;align-items:center;gap:10px;padding-bottom:12px;border-bottom:1px solid #f1f5f9;}
.bcf-av{flex:none;width:36px;height:36px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:12.5px;font-weight:750;color:#fff;letter-spacing:.02em;}
.bcf-av-0{background:#FF6B35}.bcf-av-1{background:#0f766e}.bcf-av-2{background:#1d4ed8}.bcf-av-3{background:#7e22ce}.bcf-av-4{background:#334155}.bcf-av-5{background:#b45309}
.bcf-av-vacio{background:#f1f5f9;color:#94a3b8;border:1px dashed #cbd5e1;}
.bcf-per-txt{display:flex;flex-direction:column;min-width:0;}
.bcf-per-txt small{font-size:11.5px;color:#64748b;}
.bcf-per-txt b{font-size:13.5px;font-weight:650;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.bcf-upd{margin-left:auto;font-size:11.5px;color:#64748b;text-align:right;}
.bcf-prog-top{display:flex;justify-content:space-between;font-size:12px;color:#64748b;font-variant-numeric:tabular-nums;}
.bcf-prog-top span:first-child{color:#0f172a;font-weight:600;}
.bcf-track{position:relative;height:8px;margin-top:20px;border-radius:999px;
  background:repeating-linear-gradient(135deg,#e2e8f0 0 3px,transparent 3px 7px);box-shadow:inset 0 0 0 1px #e8ecf2;}
.bcf-fill{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:linear-gradient(90deg,#ff8a5c,#FF6B35);transition:width .5s cubic-bezier(.2,.8,.2,1);}
.bcf-ico{position:absolute;top:-21px;transform:translateX(-60%);color:#D65225;font-size:17px;line-height:1;}
.bcf-track-alerta .bcf-fill{background:linear-gradient(90deg,#f87171,#dc2626);}
.bcf-track-alerta .bcf-ico{color:#dc2626;}
.bcf-f{display:flex;justify-content:space-between;gap:8px;font-size:12.5px;color:#0f172a;font-weight:550;}
.bcf-f span{display:inline-flex;align-items:center;gap:5px;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.bcf-f i{color:#94a3b8;font-size:15px;}
.bcf-color{display:inline-flex;align-items:center;gap:5px;min-width:0;max-width:40%;border:0;background:transparent;padding:4px 6px;margin:-4px -6px;border-radius:8px;font:inherit;font-size:12.5px;font-weight:550;color:#0f172a;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.bcf-color:hover{background:#fff1ea;color:#c2410c;}
.bcf-color .ti{color:#94a3b8;font-size:15px;}
.bcf-cdot{flex:none;width:12px;height:12px;border-radius:50%;border:1px solid rgba(0,0,0,.2);display:inline-block;}
.bcf-nota{font-size:12px;color:#475569;background:#f8fafc;border-radius:10px;padding:7px 10px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;}
.bcf-acc{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding-top:2px;}
.bcf-acc-sp{flex:1;}
.bcf-ib{width:38px;height:38px;border-radius:11px;border:1px solid #e6e9ef;background:#fff;color:#475569;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;font-size:17px;transition:background .15s,border-color .15s,color .15s,transform .12s;}
.bcf-ib:hover{border-color:#ffc9b3;color:#D65225;background:#fff7f3;}
.bcf-ib:active,.bcf-fchip:active,.bcf-kpi:active{transform:scale(.96);}
.bcf-abrir{display:inline-flex;align-items:center;gap:2px;font-size:12.5px;font-weight:650;color:#D65225;}
.bcf-btn-salida{padding:8px 12px!important;font-size:12.5px!important;background:#15803d!important;border-color:#15803d!important;}
.bcf-btn-sec{padding:8px 12px!important;font-size:12.5px!important;}
.bcf-clave{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:#475569;}

/* Filtros de estado: mismo color que la etiqueta de la tarjeta */
.bcf-fchips{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding:2px 2px 12px;margin:0 0 4px;}
.bcf-fchips::-webkit-scrollbar{display:none;}
.bcf-fchip{flex:none;display:inline-flex;align-items:center;gap:7px;height:38px;padding:0 14px;border-radius:12px;border:1px solid #e6e9ef;background:#fff;color:#334155;font-size:13px;font-weight:600;cursor:pointer;transition:background .15s,border-color .15s,color .15s,transform .12s;}
.bcf-fchip small{font-size:11.5px;color:#94a3b8;font-weight:600;font-variant-numeric:tabular-nums;}
.bcf-fchip .bcf-dot{width:8px;height:8px;border-radius:50%;background:var(--bcf-dot);}
.bcf-fchip:hover{border-color:#cbd5e1;}
.bcf-fchip.on{background:var(--bcf-bg);border-color:var(--bcf-dot);color:var(--bcf-fg);}
.bcf-fchip.on small{color:var(--bcf-fg);}
.bcf-fchip[data-tono="gris"].on:not(:has(.bcf-dot)){background:#fff1ea;border-color:#FF6B35;color:#D65225;}

/* Cuadros de resumen */
.bcf-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin:0 0 14px;}
.bcf-kpi{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:16px;border:1px solid #e6e9ef;background:#fff;cursor:pointer;text-align:left;font:inherit;
  box-shadow:0 1px 2px rgba(15,23,42,.04);transition:border-color .15s,box-shadow .15s,transform .12s;}
.bcf-kpi:hover{border-color:#cbd5e1;}
.bcf-kpi.on{border:2px solid var(--bcf-dot);padding:11px 13px;}
.bcf-kpi-ico{flex:none;width:44px;height:44px;border-radius:12px;background:var(--bcf-bg);color:var(--bcf-fg);display:flex;align-items:center;justify-content:center;font-size:21px;}
.bcf-kpi-txt{display:flex;flex-direction:column;min-width:0;}
.bcf-kpi-txt small{font-size:12px;color:#64748b;}
.bcf-kpi-txt b{font-size:24px;font-weight:800;color:#0f172a;line-height:1.1;font-variant-numeric:tabular-nums;}
.bcf-panel .bcf-tools{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:12px;}
.bcf-panel .bcf-tools h3{margin:0;}
.bcf-busq{min-width:240px;max-width:360px;flex:1;height:40px;padding:0 14px;border:1px solid #e2e8f0;border-radius:12px;font-size:13.5px;}
.bcf-vacio{grid-column:1/-1;text-align:center;color:#64748b;padding:28px 10px;font-size:13.5px;}

/* Reacondicionados: los cuadros de etapas del lote, con el mismo color que su filtro */
#v-refurb .reacond-detail-kpis .reacond-kpi-card{background:#fff!important;border:1px solid #e6e9ef!important;border-radius:16px!important;box-shadow:0 1px 2px rgba(15,23,42,.04)!important;position:relative;text-align:left!important;padding:12px 14px 12px 30px!important;}
#v-refurb .reacond-detail-kpis .reacond-kpi-card::before{content:"";position:absolute;left:14px;top:50%;width:9px;height:9px;margin-top:-5px;border-radius:50%;background:var(--bcf-dot);}
#v-refurb .reacond-detail-kpis .reacond-kpi-card > div{color:var(--bcf-fg)!important;}
#v-refurb .reacond-detail-kpis .reacond-kpi-card > div:first-child{color:#0f172a!important;font-size:24px!important;font-weight:800!important;}
#v-refurb .reacond-detail-kpis .reacond-kpi-card.is-filtered{border:2px solid var(--bcf-dot)!important;background:var(--bcf-bg)!important;}
#kpiCardPendiente{--bcf-bg:#f1f5f9;--bcf-fg:#475569;--bcf-dot:#94a3b8;}
#kpiCardDiagnostico{--bcf-bg:#e0edff;--bcf-fg:#1d4ed8;--bcf-dot:#3b82f6;}
#kpiCardProceso{--bcf-bg:#ffedd5;--bcf-fg:#c2410c;--bcf-dot:#FF6B35;}
#kpiCardCalidad{--bcf-bg:#f3e8ff;--bcf-fg:#7e22ce;--bcf-dot:#a855f7;}
#kpiCardListoV{--bcf-bg:#dcfce7;--bcf-fg:#15803d;--bcf-dot:#22c55e;}
#kpiCardDespachado{--bcf-bg:#ccfbf1;--bcf-fg:#0f766e;--bcf-dot:#14b8a6;}
#v-refurb #reacondFiltroEstado.bcf-oculto{display:none!important;}

@media (max-width:640px){
  #reacondEquiposLista,.bcf-grid{grid-template-columns:1fr;gap:12px;}
  .bcf-kpis{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}
  .bcf-kpi{padding:10px 12px;gap:10px;}
  .bcf-kpi-ico{width:38px;height:38px;font-size:19px;}
  .bcf-kpi-txt b{font-size:21px;}
  .bcf-busq{min-width:0;max-width:none;width:100%;}
  .bcf-media{height:116px;}
}
@media (prefers-reduced-motion:reduce){.bcf-card,.bcf-media img,.bcf-fill,.bcf-ib,.bcf-fchip,.bcf-kpi{transition:none!important;}.bcf-card:hover{transform:none!important;}}
@media print{.bcf-acc,.bcf-chk{display:none!important;}}
`;
function ponerCSS(){
  if (document.getElementById('bcfCSS')) return;
  var st = document.createElement('style'); st.id = 'bcfCSS'; st.textContent = CSS;
  document.head.appendChild(st);
}

/* ---------- Fotos del catálogo web ---------- */
var _cargandoFotos = false, _fotosListas = false;
function norm(s){ return typeof window._bcfNorm === 'function' ? window._bcfNorm(s) : String(s||'').toLowerCase().trim(); }
function cliente(){ try { return supabaseClient; } catch(_) { return null; } }
function cargarFotos(){
  if (_fotosListas || _cargandoFotos) return;
  var sb = cliente(); if (!sb) return;
  _cargandoFotos = true;
  sb.from('catalogo_items').select('codigo,nombre_publico,foto_url').not('foto_url', 'is', null).then(function(r){
    _cargandoFotos = false;
    if (r.error || !Array.isArray(r.data)) return;
    var m = { code: {}, name: {}, keys: [] };
    r.data.forEach(function(it){
      if (!it.foto_url) return;
      if (it.codigo != null) m.code[String(it.codigo)] = it.foto_url;
      var k = norm(it.nombre_publico);
      if (k && !m.name[k]) { m.name[k] = it.foto_url; m.keys.push(k); }
    });
    window._bcfFotos = m; _fotosListas = true;
    repintar();
  }, function(){ _cargandoFotos = false; });
}
function vistaActiva(id){ var v = document.getElementById(id); return !!(v && v.classList.contains('active')); }
function repintar(){
  try { if (vistaActiva('v-refurb') && typeof reacondLoteAbiertoId !== 'undefined' && reacondLoteAbiertoId && typeof window.renderDetalleLoteReacond === 'function') window.renderDetalleLoteReacond(); } catch(e){}
  try { if (vistaActiva('v-ordenes') && typeof window.renderOrders === 'function') window.renderOrders(); } catch(e){}
}

/* ---------- Reacondicionados: filtros de color sobre la lista del lote ---------- */
var FILTROS_REACOND = [
  ['', 'Todas', 'gris'],
  ['recibido', 'Recibido', 'gris'],
  ['diagnostico', 'Diagnóstico', 'azul'],
  ['reparacion', 'En reparación', 'naranja'],
  ['control_calidad', 'Control calidad', 'morado'],
  ['listo_venta', 'Listo', 'verde'],
  ['despachado', 'Despachado', 'teal']
];
function pintarChipsReacond(){
  var lista = document.getElementById('reacondEquiposLista'); if (!lista) return;
  var sel = document.getElementById('reacondFiltroEstado');
  var cont = document.getElementById('bcfReacondChips');
  if (!cont) {
    cont = document.createElement('div'); cont.id = 'bcfReacondChips'; cont.className = 'bcf-fchips';
    cont.setAttribute('role', 'group'); cont.setAttribute('aria-label', 'Filtrar equipos por etapa');
    lista.parentNode.insertBefore(cont, lista);
  }
  if (sel) sel.classList.add('bcf-oculto');
  var loteId; try { loteId = reacondLoteAbiertoId; } catch(_) { loteId = null; }
  var c0; try { c0 = cache; } catch(_) { c0 = null; }
  var equipos = ((c0 && c0.refurb) || []).filter(function(r){ return r.lote_id === loteId; });
  var actual = sel ? sel.value : '';
  var pasa = typeof window._reacondEquipoPasaEstado === 'function' ? window._reacondEquipoPasaEstado : function(){ return true; };
  cont.innerHTML = FILTROS_REACOND.map(function(f){
    var n = equipos.filter(function(e){ return pasa(e, f[0]); }).length;
    if (f[0] && !n && actual !== f[0]) return '';
    var on = actual === f[0];
    return '<button type="button" class="bcf-fchip' + (on ? ' on' : '') + '" data-tono="' + f[2] + '" aria-pressed="' + on + '" data-f="' + f[0] + '">' +
      (f[0] ? '<i class="bcf-dot"></i>' : '') + f[1] + ' <small>' + n + '</small></button>';
  }).join('');
}
document.addEventListener('click', function(ev){
  var b = ev.target.closest && ev.target.closest('#bcfReacondChips .bcf-fchip'); if (!b) return;
  var sel = document.getElementById('reacondFiltroEstado'); if (!sel) return;
  var f = b.getAttribute('data-f') || '';
  sel.value = (f && sel.value === f) ? '' : f;
  if (typeof window.renderDetalleLoteReacond === 'function') window.renderDetalleLoteReacond();
});

/* ---------- Enganches ---------- */
function envolver(){
  if (typeof window.renderDetalleLoteReacond === 'function' && !window.renderDetalleLoteReacond.__bcf) {
    var orig = window.renderDetalleLoteReacond;
    var w = function(){ cargarFotos(); var r = orig.apply(this, arguments); try { pintarChipsReacond(); } catch(e){ console.warn('[flota] chips', e); } return r; };
    w.__bcf = true; window.renderDetalleLoteReacond = w;
  }
  if (typeof window.renderOrders === 'function' && !window.renderOrders.__bcf) {
    var origO = window.renderOrders;
    var wo = function(){ cargarFotos(); return origO.apply(this, arguments); };
    wo.__bcf = true; window.renderOrders = wo;
  }
}
ponerCSS(); envolver();
// Si la vista ya estaba abierta, la repinta con el estilo nuevo.
setTimeout(function(){ envolver(); repintar(); }, 0);

window.BayolFlota = { version: VERSION, fotos: cargarFotos, repintar: repintar };
})();
