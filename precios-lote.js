/* BAYOL CELL · Precios en lote (nivel 1) — dueño, 10-nov-2026: «Haz los cambios de precios en nivel 1 en Infoplus».
   Solo administradores. Se pega o se carga una lista «código precio», se revisa y se guarda con un toque.
   Usa la misma Edge Function del editor de un artículo (infoplus-precio-actualizar, que exige admin):
   manda SOLO contado y crédito del nivel 1; el mínimo y los niveles 2 y 3 no se tocan.
   Apagar: localStorage.bc_precios_lote_off='1'. */
(function () {
  if (window.BayolPreciosLote) return;
  var off = false; try { off = localStorage.getItem('bc_precios_lote_off') === '1'; } catch (e) {}
  // Lista del cambio de glass de iPhone (dueño, 10-nov-2026). Los artículos compartidos (13/13 Pro, 12/12 Pro, XR/11)
  // traen el precio más alto que dio el dueño; se puede cambiar antes de guardar.
  var GLASS_IPHONE = [
    ['2785', 8990], ['2924', 7990], ['2784', 5990], ['2782', 6990], ['2923', 5490], ['2781', 5990], ['2779', 5990],
    ['2778', 4490, '13 y 13 Pro comparten artículo: usted dio 4,490 y 3,490'],
    ['2746', 4990],
    ['2776', 3490, '12 y 12 Pro comparten artículo: usted dio 3,490 y 2,990'],
    ['2743', 2490],
    ['2775', 1990, 'XR y 11 comparten artículo: usted dio 1,990 y 1,500'],
    ['2813', 1490], ['2742', 1500],
    ['2786', 10000], ['2787', 11000], ['2925', 11000], ['2788', 12000]
  ];
  var st = { filas: [], guardando: false };
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function plata(n) { return 'RD$ ' + Math.round(Number(n) || 0).toLocaleString('en-US'); }
  function admin() { try { return typeof isAdminUser === 'function' && isAdminUser(); } catch (e) { return false; } }
  function art(c) { try { return typeof _findInfoplusArt === 'function' ? _findInfoplusArt(c) : null; } catch (e) { return null; } }
  function hoy(a) { var n = a && a.niveles && a.niveles['1']; return Number(n != null ? n : (a && a.precio)) || 0; }

  // «2785 8990», «2785 - $8,990.00», «2785;8990» → [código, precio]
  function leer(texto) {
    return String(texto || '').split(/\n+/).map(function (l) {
      var m = l.replace(/RD\$|\$/gi, ' ').match(/^\s*(\d{1,7})\D+([\d.,]+)/); if (!m) return null;
      var p = Number(m[2].replace(/,/g, '')); return p > 0 ? [m[1], p] : null;
    }).filter(Boolean);
  }
  function armar(lista) {
    st.filas = lista.map(function (x) { var a = art(x[0]); return { cod: x[0], nuevo: x[1], nota: x[2] || '', a: a, hoy: hoy(a), estado: '' }; });
    pintar();
  }
  function estilos() {
    if ($('plEstilos')) return;
    var s = document.createElement('style'); s.id = 'plEstilos';
    s.textContent = [
      '#plModal{position:fixed;inset:0;z-index:1200;background:rgba(15,23,42,.45);display:flex;align-items:center;justify-content:center;padding:12px}',
      '#plModal .pl-box{background:#fff;border-radius:18px;width:100%;max-width:880px;max-height:calc(100dvh - 24px);display:flex;flex-direction:column;overflow:hidden;font-size:15px}',
      '#plModal .pl-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px 16px;border-bottom:1px solid #e2e8f0}',
      '#plModal .pl-head h3{margin:0;font-size:17px}',
      '#plModal .pl-x{width:44px;height:44px;border:0;border-radius:12px;background:#f1f5f9;font-size:18px;cursor:pointer}',
      '#plModal .pl-body{flex:1;min-height:0;overflow:auto;padding:12px 16px}',
      '#plModal .pl-acc{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}',
      '#plModal .pl-acc .btn{min-height:44px}',
      '#plModal textarea{width:100%;box-sizing:border-box;min-height:90px;font:15px/1.4 ui-monospace,monospace;padding:10px;border:1px solid #cbd5e1;border-radius:12px}',
      '#plModal table{width:100%;border-collapse:collapse;margin-top:10px}',
      '#plModal th,#plModal td{padding:8px 6px;border-bottom:1px solid #eef2f7;text-align:left;vertical-align:middle}',
      '#plModal th{font-size:12px;color:#64748b;font-weight:600}',
      '#plModal td.n{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}',
      '#plModal td input{width:110px;height:44px;font-size:16px;text-align:right;padding:0 8px;border:1px solid #cbd5e1;border-radius:10px;box-sizing:border-box}',
      '#plModal .sube{color:#15803d}#plModal .baja{color:#b91c1c}',
      '#plModal .pl-nota{display:block;font-size:12px;color:#b45309;margin-top:2px}',
      '#plModal .pl-err{color:#b91c1c;font-size:12px}',
      '#plModal .pl-ok{color:#15803d;font-weight:700}',
      '#plModal .pl-foot{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;padding:10px 16px;border-top:1px solid #e2e8f0;background:#f8fafc}',
      '#plModal .pl-foot .btn{min-height:54px;font-size:16px;padding:0 20px}',
      '@media (max-width:640px){#plModal td.d{display:none}#plModal th.d{display:none}}'
    ].join('\n');
    document.head.appendChild(s);
  }
  function pintar() {
    var b = $('plTabla'); if (!b) return;
    var listos = st.filas.filter(function (f) { return f.a && f.nuevo > 0 && f.nuevo !== f.hoy && f.estado !== 'ok'; }).length;
    b.innerHTML = !st.filas.length ? '<p style="color:#64748b;margin:10px 0">Pegue la lista arriba o toque «Cargar glass iPhone».</p>' :
      '<table><thead><tr><th>Código</th><th class="d">Artículo</th><th class="n">Hoy</th><th class="n">Nuevo</th><th class="n">Cambio</th><th></th></tr></thead><tbody>' +
      st.filas.map(function (f, i) {
        var d = f.nuevo - f.hoy, cls = d > 0 ? 'sube' : d < 0 ? 'baja' : '';
        var est = !f.a ? '<span class="pl-err">No está en el catálogo</span>' : f.estado === 'ok' ? '<span class="pl-ok">✓ Guardado</span>' : f.estado ? '<span class="pl-err">' + esc(f.estado) + '</span>' : (d === 0 ? 'Igual' : '');
        return '<tr><td>' + esc(f.cod) + '</td><td class="d">' + esc(f.a ? f.a.descripcion : '') + (f.nota ? '<span class="pl-nota">⚠️ ' + esc(f.nota) + '</span>' : '') + '</td>' +
          '<td class="n">' + (f.a ? plata(f.hoy) : '—') + '</td>' +
          '<td class="n"><input inputmode="decimal" aria-label="Precio nuevo ' + esc(f.cod) + '" value="' + f.nuevo + '" oninput="BayolPreciosLote._ed(' + i + ',this.value)"' + (f.estado === 'ok' ? ' disabled' : '') + '></td>' +
          '<td class="n ' + cls + '">' + (f.a && d ? (d > 0 ? '+' : '−') + plata(Math.abs(d)).replace('RD$ ', '') : '') + '</td><td>' + est + '</td></tr>';
      }).join('') + '</tbody></table>';
    var g = $('plGuardar'); if (g) { g.disabled = !listos || st.guardando; g.innerHTML = st.guardando ? '<i class="ti ti-loader"></i> Guardando…' : '<i class="ti ti-device-floppy"></i> Guardar ' + listos + ' en Info Plus'; }
  }
  async function guardar() {
    if (!admin() || st.guardando) return;
    var lista = st.filas.filter(function (f) { return f.a && f.nuevo > 0 && f.nuevo !== f.hoy && f.estado !== 'ok'; });
    if (!lista.length) return;
    var ok = typeof confirmar === 'function' ? await confirmar('Se cambia el precio de nivel 1 (Cliente Final, contado y crédito) de ' + lista.length + ' artículos en Info Plus.\n\nEl mínimo y los niveles 2 y 3 no se tocan.\n\n¿Confirma?') : true;
    if (!ok) return;
    st.guardando = true; pintar();
    var bien = 0;
    for (var i = 0; i < lista.length; i++) {
      var f = lista[i];
      try {
        var r = await supabaseClient.functions.invoke('infoplus-precio-actualizar', { body: { codarticulo: f.cod, precios: [{ codnivelprecio: 1, contado: f.nuevo, credito: f.nuevo }] } });
        if (r.error) throw r.error;
        if (r.data && r.data.ok) {
          f.estado = 'ok'; bien++;
          var nv = Object.assign({}, f.a.niveles || {}); nv['1'] = f.nuevo; f.a.niveles = nv; f.a.precio = f.nuevo;
        } else f.estado = 'Info Plus no lo aceptó';
      } catch (e) { f.estado = 'No se pudo guardar'; try { logError('precios lote ' + f.cod, e); } catch (_e) {} }
      pintar();
    }
    st.guardando = false; pintar();
    if (typeof toast === 'function') toast(bien === lista.length ? '✅ ' + bien + ' precios guardados en Info Plus.' : bien + ' de ' + lista.length + ' guardados. Revise los marcados.', bien === lista.length ? 'success' : 'error');
    if (typeof renderBuscadorArticulos === 'function' && $('modalBuscadorArt')) renderBuscadorArticulos();
  }
  async function abrir() {
    if (off) return;
    if (!admin()) { if (typeof toast === 'function') toast('Solo un administrador puede cambiar precios.', 'error'); return; }
    try { if (typeof _ensureInfoplusArticulos === 'function') await _ensureInfoplusArticulos(); } catch (e) {}
    estilos();
    var m = $('plModal'); if (m) m.remove();
    m = document.createElement('div'); m.id = 'plModal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-label', 'Precios en lote');
    m.innerHTML = '<div class="pl-box"><div class="pl-head"><h3><i class="ti ti-list-numbers"></i> Precios en lote · nivel 1</h3><button class="pl-x" aria-label="Cerrar" onclick="BayolPreciosLote.cerrar()">✕</button></div>' +
      '<div class="pl-body"><div class="pl-acc"><button class="btn btn-light" onclick="BayolPreciosLote.glass()"><i class="ti ti-device-mobile"></i> Cargar glass iPhone</button></div>' +
      '<textarea id="plTexto" placeholder="Una línea por artículo: código y precio. Ej.: 2785 8990" oninput="BayolPreciosLote._texto(this.value)"></textarea>' +
      '<div id="plTabla"></div></div>' +
      '<div class="pl-foot"><span style="font-size:13px;color:#64748b">Solo cambia contado y crédito del nivel 1. Mínimo y niveles 2 y 3 quedan igual.</span><button class="btn btn-blue" id="plGuardar" onclick="BayolPreciosLote.guardar()" disabled>Guardar</button></div></div>';
    m.addEventListener('click', function (e) { if (e.target === m && !st.guardando) cerrar(); });
    document.body.appendChild(m);
    st.filas = []; pintar();
  }
  function cerrar() { if (st.guardando) return; var m = $('plModal'); if (m) m.remove(); }
  window.BayolPreciosLote = {
    abrir: abrir, cerrar: cerrar, guardar: guardar,
    glass: function () { var t = $('plTexto'); if (t) t.value = GLASS_IPHONE.map(function (x) { return x[0] + ' ' + x[1]; }).join('\n'); armar(GLASS_IPHONE); },
    _texto: function (v) { armar(leer(v)); },
    _ed: function (i, v) { var f = st.filas[i]; if (!f) return; f.nuevo = Number(String(v).replace(/[^\d.]/g, '')) || 0; f.estado = ''; pintar(); },
    _leer: leer
  };
})();
