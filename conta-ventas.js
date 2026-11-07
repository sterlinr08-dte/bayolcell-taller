/* Contabilidad → «Reportes de ventas» (dueño, 07-nov-2026).
 * Por tienda y mes: venta total contra la meta, celulares vendidos (detalle / mayor), ventas al detalle (nivel de precio 1)
 * y al por mayor (niveles 2 y 3), y reparaciones (facturas con «Servicio técnico»). Datos: RPC reporte_ventas_detalle
 * (protegida con app_puede_contabilidad). Las metas se fijan en «Punto de equilibrio» (conta_equilibrio.variables.meta).
 * Capa aislada: envuelve contaTab() sin tocar taller-app.js. Apagar: localStorage.bc_rv_off='1'. API: window.BayolVentas. */
(function () {
  'use strict';
  if (window.BayolVentas) return;
  try { if (localStorage.getItem('bc_rv_off') === '1') return; } catch (e) {}

  var TIENDAS = [{ cod: 1, nombre: 'Santiago' }, { cod: 4, nombre: 'Moca' }, { cod: 7, nombre: 'Navarrete' }];
  var st = { mes: null, filas: [], metas: {}, cargando: false, error: '', tienda: 'todas' };

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function plata(n) { return (typeof money === 'function') ? money(n) : 'RD$ ' + Number(n || 0).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function ent(n) { return Number(n || 0).toLocaleString('es-DO', { maximumFractionDigits: 0 }); }
  function pct(n) { return isFinite(n) ? (Math.round(n * 1000) / 10).toLocaleString('es-DO', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %' : '—'; }
  function n(v) { return Number(v) || 0; }
  function sb() { try { return supabaseClient; } catch (e) { return null; } }
  function puede() { try { return (typeof isAdminUser === 'function' && isAdminUser()) || (typeof esDueno === 'function' && esDueno()) || (typeof tienePermiso === 'function' && tienePermiso('contabilidad_ver')); } catch (e) { return false; } }
  function mesHoy() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
  function periodo(mes) { var d = new Date(mes + '-01T00:00:00'); d.setMonth(d.getMonth() + 1); return { ini: mes + '-01', fin: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-01' }; }

  async function cargar() {
    var cli = sb(); if (!cli) return;
    st.cargando = true; st.error = ''; pintar();
    var tok = st.tok = (st.tok || 0) + 1, p = periodo(st.mes);
    try {
      var r = await cli.rpc('reporte_ventas_detalle', { p_ini: p.ini, p_fin: p.fin });
      if (r.error) throw r.error;
      var m = await cli.from('conta_equilibrio').select('codlocalidad,variables').eq('mes', p.ini);
      if (tok !== st.tok) return;
      st.filas = r.data || []; st.metas = {};
      (m.data || []).forEach(function (f) { st.metas[f.codlocalidad] = n((f.variables || {}).meta); });
    } catch (e) {
      if (tok !== st.tok) return;
      st.error = /permiso/i.test((e && e.message) || '') ? 'Necesita permiso de Contabilidad.' : 'No se pudieron leer las ventas. Toque Actualizar.';
      if (typeof logError === 'function') logError('reportes ventas', e);
    }
    st.cargando = false; pintar();
  }

  // Suma las filas de las tiendas (o devuelve una sola).
  function datos(cod) {
    var lista = st.filas.filter(function (f) { return cod === 'todas' ? true : n(f.codlocalidad) === cod; });
    var k = ['venta_total', 'cel_unid', 'cel_venta', 'cel_detalle', 'cel_mayor', 'detalle_venta', 'detalle_fact', 'mayor_venta', 'mayor_fact', 'taller_venta', 'rep_n', 'rep_mano_obra', 'rep_piezas'];
    var o = {}; k.forEach(function (c) { o[c] = lista.reduce(function (s, f) { return s + n(f[c]); }, 0); });
    var base = lista.reduce(function (s, f) { return s + n(f.detalle_venta) + n(f.mayor_venta); }, 0);
    o.pct_por_precio = base > 0 ? lista.reduce(function (s, f) { return s + n(f.pct_por_precio) * (n(f.detalle_venta) + n(f.mayor_venta)); }, 0) / base / 100 : null;
    o.meta = cod === 'todas' ? TIENDAS.reduce(function (s, t) { return s + n(st.metas[t.cod]); }, 0) : n(st.metas[cod]);
    o.sinMeta = cod === 'todas' ? TIENDAS.filter(function (t) { return !n(st.metas[t.cod]); }).length : (o.meta ? 0 : 1);
    return o;
  }

  function barra(a, color) { var p = a == null ? 0 : Math.max(0, Math.min(1, a)); return '<div class="rv-barra"><i style="width:' + (p * 100).toFixed(1) + '%;background:' + (color || (p >= 1 ? '#16a34a' : '#e4572e')) + '"></i></div>'; }
  function tarjeta(icono, titulo, valor, sub, extra) {
    return '<div class="rv-card"><small><i class="ti ' + icono + '"></i> ' + esc(titulo) + '</small><b>' + valor + '</b>' + (sub ? '<span>' + sub + '</span>' : '') + (extra || '') + '</div>';
  }

  function htmlResumen(d) {
    var dm = d.detalle_venta + d.mayor_venta, pd = dm > 0 ? d.detalle_venta / dm : 0;
    var meta = d.meta > 0
      ? tarjeta('ti-target', 'Venta del mes contra la meta', plata(d.venta_total), pct(d.venta_total / d.meta) + ' de ' + plata(d.meta) + (d.venta_total < d.meta ? ' · faltan ' + plata(d.meta - d.venta_total) : ' · <b>meta cumplida</b>') + (d.sinMeta && st.tienda === 'todas' ? '<br>' + d.sinMeta + ' tienda(s) sin meta' : ''), barra(d.venta_total / d.meta))
      : tarjeta('ti-target', 'Venta del mes', plata(d.venta_total), 'Sin meta. Fíjela en «Punto de equilibrio», en cada tienda.');
    return '<div class="rv-grid">' + meta +
      tarjeta('ti-device-mobile', 'Celulares vendidos', ent(d.cel_unid), plata(d.cel_venta) + '<br>Detalle ' + ent(d.cel_detalle) + ' · por mayor ' + ent(d.cel_mayor)) +
      tarjeta('ti-arrows-split-2', 'Detalle y por mayor', pct(pd) + ' detalle',
        'Detalle (nivel 1): <b>' + plata(d.detalle_venta) + '</b> · ' + ent(d.detalle_fact) + ' fact.<br>Por mayor (niveles 2 y 3): <b>' + plata(d.mayor_venta) + '</b> · ' + ent(d.mayor_fact) + ' fact.',
        barra(pd, '#2563eb')) +
      tarjeta('ti-tool', 'Reparaciones', ent(d.rep_n), 'Mano de obra ' + plata(d.rep_mano_obra) + '<br>Piezas en esas facturas ' + plata(d.rep_piezas)) +
    '</div>';
  }

  function htmlTabla() {
    var filas = TIENDAS.map(function (t) {
      var d = datos(t.cod);
      return '<tr tabindex="0" onclick="BayolVentas.tienda(' + t.cod + ')" onkeydown="if(event.key===\'Enter\')BayolVentas.tienda(' + t.cod + ')">' +
        '<td data-label="Tienda"><b>' + t.nombre + '</b></td>' +
        '<td data-label="Venta">' + plata(d.venta_total) + '</td>' +
        '<td data-label="Meta">' + (d.meta ? pct(d.venta_total / d.meta) + ' de ' + plata(d.meta) : '—') + '</td>' +
        '<td data-label="Celulares">' + ent(d.cel_unid) + '</td>' +
        '<td data-label="Detalle">' + plata(d.detalle_venta) + '</td>' +
        '<td data-label="Por mayor">' + plata(d.mayor_venta) + '</td>' +
        '<td data-label="Taller y servicios">' + plata(d.taller_venta) + '</td>' +
        '<td data-label="Reparaciones">' + ent(d.rep_n) + '</td></tr>';
    }).join('');
    return '<div class="rv-box"><h4>Por tienda</h4><div class="table-wrap"><table class="rv-tabla"><thead><tr><th>Tienda</th><th>Venta</th><th>Meta</th><th>Celulares</th><th>Detalle</th><th>Por mayor</th><th>Taller y servicios</th><th>Reparaciones</th></tr></thead><tbody>' + filas + '</tbody></table></div>' +
      '<p class="rv-nota">Venta = detalle + por mayor + taller y servicios (envíos, recargas, servicio técnico). Ya restadas las devoluciones.</p></div>';
  }

  function pintar() {
    var c = $('rv_contenido'); if (!c) return;
    if (!puede()) { c.innerHTML = '<p class="rv-vacio">Necesita permiso de Contabilidad.</p>'; return; }
    if (st.cargando) { c.innerHTML = '<p class="rv-vacio"><i class="ti ti-loader"></i> Cargando ventas de Info Plus…</p>'; return; }
    if (st.error) { c.innerHTML = '<p class="rv-vacio">' + esc(st.error) + '</p>'; return; }
    var tabs = [{ k: 'todas', t: 'Todas' }].concat(TIENDAS.map(function (t) { return { k: t.cod, t: t.nombre }; }));
    var d = datos(st.tienda);
    c.innerHTML = '<div class="rv-tabs" role="tablist">' + tabs.map(function (t) {
        return '<button role="tab" aria-selected="' + (st.tienda === t.k) + '" class="rv-tab' + (st.tienda === t.k ? ' on' : '') + '" onclick="BayolVentas.tienda(' + (t.k === 'todas' ? '\'todas\'' : t.k) + ')">' + t.t + '</button>';
      }).join('') + '</div>' +
      htmlResumen(d) +
      (st.tienda === 'todas' ? htmlTabla() : '') +
      '<p class="rv-nota">' + (d.pct_por_precio != null ? 'El ' + pct(d.pct_por_precio) + ' de lo vendido se clasificó por el nivel de precio cobrado; el resto (precio negociado) por el cliente: «Contado» = detalle, cliente con ficha = por mayor. ' : '') +
      'Celulares: solo artículos que empiezan con «CELULAR» (sin tablets, motos ni cargadores). Reparación: factura con «Servicio técnico».</p>';
  }

  function estilos() {
    if ($('rvEstilos')) return;
    var s = document.createElement('style'); s.id = 'rvEstilos';
    s.textContent = [
      '#conta-ventas .rv-vacio{color:var(--text-muted);text-align:center;padding:24px}',
      '#conta-ventas .rv-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:4px 0 12px}',
      '#conta-ventas .rv-tab{min-height:44px;padding:0 16px;border-radius:999px;border:1px solid #e2e8f0;background:#fff;font-size:14px;font-weight:600;color:#334155;cursor:pointer}',
      '#conta-ventas .rv-tab.on{background:#e4572e;border-color:#e4572e;color:#fff}',
      '#conta-ventas .rv-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-bottom:12px}',
      '#conta-ventas .rv-card,#conta-ventas .rv-box{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:14px;box-shadow:0 6px 18px -14px rgba(15,23,42,.35)}',
      '#conta-ventas .rv-card small{display:block;font-size:13px;color:#64748b;font-weight:600}',
      '#conta-ventas .rv-card b{display:block;font-size:24px;color:#0f172a;font-variant-numeric:tabular-nums;margin:4px 0}',
      '#conta-ventas .rv-card span{display:block;font-size:13px;color:#475569;line-height:1.5}',
      '#conta-ventas .rv-card span b{display:inline;font-size:13px;margin:0}',
      '#conta-ventas .rv-barra{height:8px;border-radius:99px;background:#f1f5f9;overflow:hidden;margin-top:8px}',
      '#conta-ventas .rv-barra i{display:block;height:100%;border-radius:99px}',
      '#conta-ventas .rv-box h4{margin:0 0 8px;font-size:14px}',
      '#conta-ventas .rv-tabla{width:100%;border-collapse:collapse;font-size:14px;font-variant-numeric:tabular-nums}',
      '#conta-ventas .rv-tabla th,#conta-ventas .rv-tabla td{padding:12px 8px;border-bottom:1px solid #eef2f7;text-align:right;white-space:nowrap}',
      '#conta-ventas .rv-tabla th:first-child,#conta-ventas .rv-tabla td:first-child{text-align:left}',
      '#conta-ventas .rv-tabla tbody tr{cursor:pointer;height:52px}',
      '#conta-ventas .rv-tabla tbody tr:hover{background:#f8fafc}',
      '@media (max-width:700px){#conta-ventas .rv-tabla thead{display:none}#conta-ventas .rv-tabla tbody tr{display:block;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:8px;padding:4px 10px;height:auto}#conta-ventas .rv-tabla,#conta-ventas .rv-tabla tbody{display:block}#conta-ventas .rv-tabla td{display:flex;justify-content:space-between;gap:8px;border:0;padding:8px 0;min-height:28px}#conta-ventas .rv-tabla td::before{content:attr(data-label);color:#64748b;font-size:13px}}',
      '#conta-ventas .rv-nota{font-size:13px;color:#64748b;margin:10px 0 0;line-height:1.5}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function asegurarPestana() {
    var barra = $('contaTabMensual') && $('contaTabMensual').parentElement;
    if (!barra || $('contaTabRV')) return;
    var b = document.createElement('button');
    b.id = 'contaTabRV'; b.className = 'btn btn-light'; b.style.fontSize = '13px'; b.style.minHeight = '44px';
    b.innerHTML = '<i class="ti ti-chart-bar"></i> Reportes de ventas';
    b.onclick = function () { window.contaTab('ventas'); };
    var ref = $('contaTabPE') || $('contaTabMensual');
    barra.insertBefore(b, ref.nextSibling);
    var mensual = $('conta-mensual');
    var div = document.createElement('div'); div.id = 'conta-ventas'; div.style.display = 'none';
    div.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:4px;">' +
        '<h3 style="margin:0;"><i class="ti ti-chart-bar" style="color:#e4572e;"></i> Reportes de ventas</h3>' +
        '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;"><input type="month" id="rv_mes" aria-label="Mes" style="height:48px;font-size:16px;" onchange="BayolVentas.mes(this.value)">' +
        '<button class="btn btn-light" style="min-height:44px;font-size:14px;" onclick="BayolVentas.recargar()"><i class="ti ti-refresh"></i> Actualizar</button></div>' +
      '</div><div id="rv_contenido"></div>';
    if (mensual && mensual.parentNode) mensual.parentNode.insertBefore(div, mensual.nextSibling);
  }
  function mostrarBoton() { var b = $('contaTabRV'); if (b) b.style.display = puede() ? '' : 'none'; }
  function abrir() {
    asegurarPestana(); estilos();
    var v = $('conta-ventas'); if (v) v.style.display = '';
    var b = $('contaTabRV'); if (b) b.className = 'btn btn-blue';
    if (!st.mes) st.mes = mesHoy();
    var m = $('rv_mes'); if (m) m.value = st.mes;
    cargar();
  }
  function cerrar() { var v = $('conta-ventas'); if (v) v.style.display = 'none'; var b = $('contaTabRV'); if (b) b.className = 'btn btn-light'; }
  function envolver() {
    if (typeof window.contaTab !== 'function' || window.contaTab._rv) return false;
    var orig = window.contaTab;
    var nuevo = function (name) {
      asegurarPestana(); mostrarBoton();
      if (name === 'ventas' && puede()) {
        orig('__ninguna__');
        try { localStorage.setItem('bayol_subtab_conta', 'ventas'); } catch (e) {}
        abrir(); return;
      }
      cerrar();
      return orig.call(this, name === 'ventas' ? 'mensual' : name);
    };
    nuevo._rv = true; nuevo._pe = orig._pe;
    window.contaTab = nuevo;
    return true;
  }

  window.BayolVentas = {
    mes: function (v) { if (v) { st.mes = v; cargar(); } },
    recargar: cargar,
    tienda: function (k) { if (k !== 'todas' && !TIENDAS.some(function (t) { return t.cod === k; })) return; st.tienda = k; pintar(); },
    _estado: function () { return st; }, _pintar: pintar, _estilos: estilos
  };

  function iniciar() {
    if (!envolver()) { setTimeout(iniciar, 300); return; }
    asegurarPestana(); mostrarBoton();
    var v = $('v-contabilidad');
    if (v && v.classList.contains('active')) { try { if (localStorage.getItem('bayol_subtab_conta') === 'ventas') window.contaTab('ventas'); } catch (e) {} }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
