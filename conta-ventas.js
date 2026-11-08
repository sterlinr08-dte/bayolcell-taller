/* Contabilidad → Punto de equilibrio → pestaña «Ventas» (dueño, 07-nov-2026; dentro de Punto de equilibrio desde el 07-nov).
 * Por tienda y mes: venta total contra la meta, celulares vendidos (detalle / mayor), ventas al detalle (nivel de precio 1)
 * y al por mayor (niveles 2 y 3), y reparaciones (facturas con «Servicio técnico»). Datos: RPC reporte_ventas_detalle
 * (protegida con app_puede_contabilidad). Las metas se fijan en «Punto de equilibrio» (conta_equilibrio.variables.meta).
 * La monta conta-equilibrio.js (BayolVentas.montar) y la usa para su reporte e Excel (BayolVentas.cargarMes / datos).
 * Apagar: localStorage.bc_rv_off='1'. API: window.BayolVentas. */
(function () {
  'use strict';
  if (window.BayolVentas) return;
  try { if (localStorage.getItem('bc_rv_off') === '1') return; } catch (e) {}
  var B = window.BayolConta; if (!B) return;   // conta-base.js (base común, 08-nov-2026)

  var TIENDAS = B.TIENDAS;
  var st = { mes: null, filas: [], metas: {}, cargando: false, error: '', tienda: 'todas', el: null, cache: {} };
  function $c() { return st.el && document.body.contains(st.el) ? st.el : null; }

  function $(id) { return document.getElementById(id); }
  var esc = B.esc, plata = B.plata, pct = B.pct, sb = B.sb, puede = B.puede, periodo = B.periodo;
  function ent(n) { return Number(n || 0).toLocaleString('es-DO', { maximumFractionDigits: 0 }); }
  function n(v) { return Number(v) || 0; }

  // Lee el reporte del mes (con caché por mes; forzar = volver a leer).
  async function cargarMes(mes, forzar) {
    if (!forzar && st.cache[mes]) return st.cache[mes];
    var cli = sb(); if (!cli) throw new Error('Sin conexión');
    var p = periodo(mes);
    var r = await cli.rpc('reporte_ventas_detalle', { p_ini: p.ini, p_fin: p.fin });
    if (r.error) throw r.error;
    st.cache[mes] = r.data || [];
    return st.cache[mes];
  }
  async function cargar(forzar) {
    st.cargando = true; st.error = ''; pintar();
    var tok = st.tok = (st.tok || 0) + 1;
    try {
      var f = await cargarMes(st.mes, forzar);
      if (tok !== st.tok) return;
      st.filas = f;
    } catch (e) {
      if (tok !== st.tok) return;
      st.error = /permiso/i.test((e && e.message) || '') ? 'Necesita permiso de Contabilidad.' : 'No se pudieron leer las ventas. Toque Actualizar.';
      if (typeof logError === 'function') logError('reportes ventas', e);
    }
    st.cargando = false; st.animar = true; pintar();
  }
  // Monta la pestaña dentro de un contenedor. metas = { codlocalidad: monto } (las de Punto de equilibrio).
  function montar(el, mes, metas, forzar) {
    estilos(); st.el = el; st.metas = metas || {};
    if (mes !== st.mes || forzar || !st.cache[mes]) { st.mes = mes; cargar(forzar); } else { st.filas = st.cache[mes]; pintar(); }
  }

  // Suma las filas de las tiendas (o devuelve una sola).
  function datos(cod, filas, metas) {
    filas = filas || st.filas; metas = metas || st.metas;
    var lista = filas.filter(function (f) { return cod === 'todas' ? true : n(f.codlocalidad) === cod; });
    var k = ['venta_total', 'cel_unid', 'cel_venta', 'cel_detalle', 'cel_mayor', 'detalle_venta', 'detalle_fact', 'mayor_venta', 'mayor_fact', 'taller_venta', 'rep_n', 'rep_mano_obra', 'rep_piezas'];
    var o = {}; k.forEach(function (c) { o[c] = lista.reduce(function (s, f) { return s + n(f[c]); }, 0); });
    var base = lista.reduce(function (s, f) { return s + n(f.detalle_venta) + n(f.mayor_venta); }, 0);
    o.pct_por_precio = base > 0 ? lista.reduce(function (s, f) { return s + n(f.pct_por_precio) * (n(f.detalle_venta) + n(f.mayor_venta)); }, 0) / base / 100 : null;
    o.meta = cod === 'todas' ? TIENDAS.reduce(function (s, t) { return s + n(metas[t.cod]); }, 0) : n(metas[cod]);
    o.sinMeta = cod === 'todas' ? TIENDAS.filter(function (t) { return !n(metas[t.cod]); }).length : (o.meta ? 0 : 1);
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
      : tarjeta('ti-target', 'Venta del mes', plata(d.venta_total), 'Sin meta. Fíjela en la pestaña de cada tienda.');
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
    var c = $c(); if (!c) return;
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
    // Animación suave al llegar los datos o cambiar de tienda (la pone conta-equilibrio.js).
    if (st.animar) { st.animar = false; B.animar(c); }
  }

  function estilos() {
    if ($('rvEstilos')) return;
    var s = document.createElement('style'); s.id = 'rvEstilos';
    s.textContent = [
      '.rv-wrap .rv-vacio{color:var(--text-muted);text-align:center;padding:24px}',
      '.rv-wrap .rv-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:4px 0 12px}',
      '.rv-wrap .rv-tab{min-height:44px;padding:0 16px;border-radius:999px;border:1px solid #e2e8f0;background:#fff;font-size:14px;font-weight:600;color:#334155;cursor:pointer}',
      '.rv-wrap .rv-tab.on{background:#e4572e;border-color:#e4572e;color:#fff}',
      '.rv-wrap .rv-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-bottom:12px}',
      '.rv-wrap .rv-card,.rv-wrap .rv-box{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:14px;box-shadow:0 6px 18px -14px rgba(15,23,42,.35)}',
      '.rv-wrap .rv-card small{display:block;font-size:13px;color:#64748b;font-weight:600}',
      '.rv-wrap .rv-card b{display:block;font-size:24px;color:#0f172a;font-variant-numeric:tabular-nums;margin:4px 0}',
      '.rv-wrap .rv-card span{display:block;font-size:13px;color:#475569;line-height:1.5}',
      '.rv-wrap .rv-card span b{display:inline;font-size:13px;margin:0}',
      '.rv-wrap .rv-barra{height:8px;border-radius:99px;background:#f1f5f9;overflow:hidden;margin-top:8px}',
      '.rv-wrap .rv-barra i{display:block;height:100%;border-radius:99px;transition:width 650ms cubic-bezier(.22,1,.36,1)}',
      '.rv-wrap .rv-box h4{margin:0 0 8px;font-size:14px}',
      '.rv-wrap .rv-tabla{width:100%;border-collapse:collapse;font-size:14px;font-variant-numeric:tabular-nums}',
      '.rv-wrap .rv-tabla th,.rv-wrap .rv-tabla td{padding:12px 8px;border-bottom:1px solid #eef2f7;text-align:right;white-space:nowrap}',
      '.rv-wrap .rv-tabla th:first-child,.rv-wrap .rv-tabla td:first-child{text-align:left}',
      '.rv-wrap .rv-tabla tbody tr{cursor:pointer;height:52px}',
      '.rv-wrap .rv-tabla tbody tr:hover{background:#f8fafc}',
      '@media (max-width:700px){.rv-wrap .rv-tabla thead{display:none}.rv-wrap .rv-tabla tbody tr{display:block;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:8px;padding:4px 10px;height:auto}.rv-wrap .rv-tabla,.rv-wrap .rv-tabla tbody{display:block}.rv-wrap .rv-tabla td{display:flex;justify-content:space-between;gap:8px;border:0;padding:8px 0;min-height:28px}.rv-wrap .rv-tabla td::before{content:attr(data-label);color:#64748b;font-size:13px}}',
      '.rv-wrap .rv-nota{font-size:13px;color:#64748b;margin:10px 0 0;line-height:1.5}'
    ].join('\n');
    document.head.appendChild(s);
  }

  window.BayolVentas = {
    montar: montar, cargarMes: cargarMes, datos: datos, TIENDAS: TIENDAS,
    recargar: function () { st.cache = {}; cargar(true); },
    // Olvida lo ya leído, sin volver a leer ahora (lo usa «Actualizar» del Punto de equilibrio).
    olvidar: function () { st.cache = {}; },
    tienda: function (k) { if (k !== 'todas' && !TIENDAS.some(function (t) { return t.cod === k; })) return; st.tienda = k; st.animar = true; pintar(); },
    _estado: function () { return st; }
  };
})();
