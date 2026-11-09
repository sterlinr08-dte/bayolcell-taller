/* Asientos automáticos de nómina y pagos a proveedores (dueño, 09-nov-2026: «preparar, pero no conectar todavía»).
 *
 * ESCONDIDO: solo aparece con localStorage.bc_asientos_auto = '1'. Sin eso este archivo no hace nada.
 *
 * Qué genera (siempre con vista previa antes de guardar):
 *  - AUTO-NOM · Nómina: un asiento por periodo guardado y por tienda.
 *      Debe  6101 Sueldos (quincena − días descontados) · 6103 Incentivos
 *      Haber 2103 Retenciones (ARS + AFP del empleado) · cuenta de adelantos (lo cobrado al empleado) · 110103 Bancos (neto pagado)
 *  - AUTO-NOM · Aporte patronal (opcional): Debe 6104 TSS 15.29 % + 6105 Infotep 1 % · Haber 2103. Solo empleados con descuentos de ley.
 *  - AUTO-NOM · Regalía (opcional): Debe 6106 8.33 % · Haber 2104 Sueldos por pagar.
 *  - AUTO-CXP · Pagos a proveedores: un asiento por abono. Debe 2101 · Haber 110101 (efectivo) o 110103 (lo demás).
 *
 * La tienda del empleado sale de su «Departamento» en RRHH (Santiago, Moca o Navarrete); vacío = General (gastos comunes).
 * Volver a generar el mismo rango reemplaza los asientos AUTO-NOM / AUTO-CXP de ese rango: no duplica.
 * Los porcentajes son los mismos del Punto de equilibrio (TSS 16.29 % y regalía 8.33 %).
 */
(function () {
  'use strict';
  function encendido() { try { return localStorage.getItem('bc_asientos_auto') === '1'; } catch (e) { return false; } }
  if (!encendido()) return;

  var REF_NOM = 'AUTO-NOM', REF_CXP = 'AUTO-CXP';
  var PCT = { tss: 15.29, infotep: 1, regalia: 8.33 };
  var TIENDAS = ['Santiago', 'Moca', 'Navarrete'];
  var st = { asientos: [], avisos: [], cargando: false };

  function r2(n) { return Math.round((Number(n) || 0) * 100) / 100; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function plata(n) { return 'RD$ ' + r2(n).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function nombreCuenta(cod) { try { if (typeof _aipCuentaNombre === 'function') return _aipCuentaNombre(cod); } catch (e) {} return cod; }
  function tiendaDe(depto) { var d = String(depto || '').toLowerCase(); for (var i = 0; i < TIENDAS.length; i++) if (d.indexOf(TIENDAS[i].toLowerCase()) >= 0) return TIENDAS[i]; return 'General'; }
  function linea(cod, debe, haber) { return { cuenta_codigo: cod, cuenta_nombre: nombreCuenta(cod), debe: r2(debe), haber: r2(haber) }; }
  function cuadra(a) { var d = 0, h = 0; a.lineas.forEach(function (l) { d += l.debe; h += l.haber; }); a.total = r2(d); return Math.abs(d - h) < 0.01 && d > 0; }

  // ---- Reglas (puras: reciben datos y devuelven asientos + avisos) ----
  // datos = { periodos, lineas, empleados, abonos, facturas }; op = { nomina, patronal, regalia, cxp, cuentaAdelantos }
  function construir(datos, op) {
    var out = [], avisos = [];
    var deptoDe = {}; (datos.empleados || []).forEach(function (e) { deptoDe[e.id] = e.departamento; });
    if (op.nomina || op.patronal || op.regalia) {
      var sinTienda = {};
      (datos.periodos || []).forEach(function (p) {
        var fecha = p.fecha_pago || p.fecha_fin, grupos = {};
        (datos.lineas || []).filter(function (l) { return l.periodo_id === p.id; }).forEach(function (l) {
          var t = tiendaDe(deptoDe[l.empleado_id]); if (t === 'General') sinTienda[l.empleado_id || l.nombre] = 1;
          var g = grupos[t] || (grupos[t] = { sueldo: 0, inc: 0, ret: 0, cxc: 0, neto: 0, baseLey: 0, n: 0 });
          var quin = Number(l.salario_quincenal) || 0, dd = Number(l.dias_descontado) || 0, ret = (Number(l.ars) || 0) + (Number(l.afp) || 0);
          g.sueldo += quin - dd; g.inc += Number(l.incentivos) || 0; g.ret += ret; g.cxc += Number(l.cuentas_por_cobrar) || 0; g.neto += Number(l.total) || 0;
          if (ret > 0) g.baseLey += quin; g.n++;
        });
        Object.keys(grupos).sort().forEach(function (t) {
          var g = grupos[t], titulo = (p.titulo || 'Nómina') + ' · ' + t;
          function meter(desc, lineas) {
            var a = { fecha: fecha, sucursal: t, referencia: REF_NOM, descripcion: desc, lineas: lineas.filter(function (l) { return l.debe > 0 || l.haber > 0; }) };
            if (cuadra(a)) out.push(a); else avisos.push('No cuadra: ' + desc);
          }
          if (op.nomina) meter('Nómina · ' + titulo + ' (' + g.n + ')', [linea('6101', g.sueldo, 0), linea('6103', g.inc, 0), linea('2103', 0, g.ret), linea(op.cuentaAdelantos || '110201', 0, g.cxc), linea('110103', 0, g.neto)]);
          if (op.patronal && g.baseLey > 0) { var tss = r2(g.baseLey * PCT.tss / 100), inf = r2(g.baseLey * PCT.infotep / 100); meter('Aporte patronal · ' + titulo, [linea('6104', tss, 0), linea('6105', inf, 0), linea('2103', 0, tss + inf)]); }
          if (op.regalia && g.sueldo > 0) { var rg = r2(g.sueldo * PCT.regalia / 100); meter('Regalía · ' + titulo, [linea('6106', rg, 0), linea('2104', 0, rg)]); }
        });
      });
      var ns = Object.keys(sinTienda).length;
      if (ns) avisos.push(ns + (ns === 1 ? ' empleado sin tienda: va a General' : ' empleados sin tienda: van a General'));
      if (!(datos.periodos || []).length) avisos.push('Sin nóminas guardadas en el rango');
    }
    if (op.cxp) {
      var fac = {}; (datos.facturas || []).forEach(function (f) { fac[f.id] = f; });
      (datos.abonos || []).forEach(function (ab) {
        var f = fac[ab.cxp_id] || {}, m = r2(ab.monto); if (!(m > 0)) return;
        var caja = /efectivo/i.test(ab.metodo || '') ? '110101' : '110103';
        var a = { fecha: ab.fecha, sucursal: 'General', referencia: REF_CXP, descripcion: 'Pago a ' + (f.proveedor || 'proveedor') + (f.factura ? ' · ' + f.factura : ''), lineas: [linea('2101', m, 0), linea(caja, 0, m)] };
        if (cuadra(a)) out.push(a);
      });
      var man = (datos.facturas || []).filter(function (f) { return f.origen === 'manual' && f._enRango; }).length;
      if (man) avisos.push(man + (man === 1 ? ' factura manual sin asiento' : ' facturas manuales sin asiento'));
    }
    out.sort(function (a, b) { return a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0; });
    return { asientos: out, avisos: avisos };
  }

  // ---- Datos ----
  function rango() {
    var d = document.getElementById('aa_desde').value, h = document.getElementById('aa_hasta').value || d;
    if (!d) return null; if (h < d) h = d;
    var p = h.split('-'), ult = new Date(+p[0], +p[1], 0).getDate();
    return { ini: d + '-01', fin: h + '-' + String(ult).padStart(2, '0') };
  }
  function opciones() {
    function on(id) { var e = document.getElementById(id); return !!(e && e.checked); }
    return { nomina: on('aa_nom'), patronal: on('aa_pat'), regalia: on('aa_reg'), cxp: on('aa_cxp'), cuentaAdelantos: (document.getElementById('aa_cta') || {}).value || '110201' };
  }
  async function leer(r, op) {
    var cli = window.supabaseClient || (typeof supabaseClient !== 'undefined' ? supabaseClient : null), d = { periodos: [], lineas: [], empleados: [], abonos: [], facturas: [] };
    function ok(x) { if (x.error) throw x.error; return x.data || []; }
    if (op.nomina || op.patronal || op.regalia) {
      var per = ok(await cli.from('nomina_periodos').select('id,titulo,fecha_inicio,fecha_fin,fecha_pago,estado').gte('fecha_fin', r.ini).lte('fecha_inicio', r.fin));
      d.periodos = per.filter(function (p) { var f = p.fecha_pago || p.fecha_fin; return f >= r.ini && f <= r.fin; });
      if (d.periodos.length) {
        d.lineas = ok(await cli.from('nomina_lineas').select('periodo_id,empleado_id,nombre,salario_quincenal,ars,afp,incentivos,cuentas_por_cobrar,dias_descontado,total').in('periodo_id', d.periodos.map(function (p) { return p.id; })));
        d.empleados = ok(await cli.from('nomina_empleados').select('id,departamento'));
      }
    }
    if (op.cxp) {
      d.abonos = ok(await cli.from('cxp_abonos').select('id,cxp_id,fecha,monto,metodo').gte('fecha', r.ini).lte('fecha', r.fin));
      var fs = ok(await cli.from('cuentas_por_pagar').select('id,factura,proveedor,origen,fecha'));
      fs.forEach(function (f) { f._enRango = f.fecha >= r.ini && f.fecha <= r.fin; }); d.facturas = fs;
    }
    return d;
  }

  // ---- Pantalla ----
  function aviso(m, t) { if (typeof toast === 'function') toast(m, t); }
  function pintar() {
    var box = document.getElementById('aa_vista'), btn = document.getElementById('aa_gen'); if (!box) return;
    if (st.cargando) { box.innerHTML = '<p class="aa-nota">Calculando…</p>'; btn.disabled = true; return; }
    var a = st.asientos, tot = a.reduce(function (s, x) { return s + x.total; }, 0);
    box.innerHTML = (st.avisos.length ? '<ul class="aa-avisos">' + st.avisos.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' : '') +
      (a.length ? '<p class="aa-res"><b>' + a.length + '</b> ' + (a.length === 1 ? 'asiento' : 'asientos') + ' · ' + plata(tot) + '</p>' +
        a.map(function (x) {
          return '<details class="aa-as"><summary><span><b>' + esc(x.descripcion) + '</b><small>' + esc(x.fecha) + ' · ' + esc(x.sucursal) + '</small></span><em>' + plata(x.total) + '</em></summary>' +
            '<table>' + x.lineas.map(function (l) { return '<tr><td>' + esc(l.cuenta_codigo) + ' ' + esc(l.cuenta_nombre) + '</td><td>' + (l.debe ? plata(l.debe) : '') + '</td><td>' + (l.haber ? plata(l.haber) : '') + '</td></tr>'; }).join('') + '</table></details>';
        }).join('') : (st.visto ? '<p class="aa-nota">Nada que generar</p>' : ''));
    btn.disabled = !a.length; btn.textContent = a.length ? 'Generar ' + a.length + (a.length === 1 ? ' asiento' : ' asientos') : 'Generar';
  }
  async function ver() {
    var r = rango(); if (!r) { aviso('Elija el mes', 'error'); return; }
    st.cargando = true; st.asientos = []; st.avisos = []; pintar();
    try { var res = construir(await leer(r, opciones()), opciones()); st.asientos = res.asientos; st.avisos = res.avisos; }
    catch (e) { st.avisos = ['No se pudo leer. Intente de nuevo.']; if (typeof logError === 'function') logError('asientos auto', e); }
    st.cargando = false; st.visto = true; pintar();
  }
  async function generar() {
    var r = rango(), a = st.asientos; if (!r || !a.length) return;
    if (typeof _aipInsertarAsientos !== 'function') { aviso('Falta el libro diario', 'error'); return; }
    if (typeof confirmar === 'function' && !await confirmar('Se reemplazan los asientos automáticos de nómina y pagos de ese rango.\n\n¿Generar ' + a.length + '?')) return;
    var btn = document.getElementById('aa_gen'); btn.disabled = true; btn.textContent = 'Generando…';
    try {
      var op = opciones(), n = 0;
      if (op.nomina || op.patronal || op.regalia) n += await _aipInsertarAsientos(a.filter(function (x) { return x.referencia === REF_NOM; }), REF_NOM, r.ini, r.fin);
      if (op.cxp) n += await _aipInsertarAsientos(a.filter(function (x) { return x.referencia === REF_CXP; }), REF_CXP, r.ini, r.fin);
      aviso(n + (n === 1 ? ' asiento generado' : ' asientos generados')); cerrar();
      if (typeof renderLibroDiario === 'function') renderLibroDiario();
    } catch (e) { if (typeof logError === 'function') logError('asientos auto generar', e); aviso('No se pudo generar. Intente de nuevo.', 'error'); pintar(); }
  }
  function cerrar() { var m = document.getElementById('modalAsientosAuto'); if (m) m.classList.remove('active'); }
  function abrir() {
    var m = document.getElementById('modalAsientosAuto');
    if (!m) {
      m = document.createElement('div'); m.id = 'modalAsientosAuto'; m.className = 'modal-backdrop'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
      var ctas = ((typeof _cuentasCache !== 'undefined' && _cuentasCache) || []).filter(function (c) { return c.permite_movimiento && c.activa && /^11/.test(c.codigo); });
      m.innerHTML = '<div class="modal-box aa-box"><div class="modal-header"><h3><i class="ti ti-wand" aria-hidden="true"></i> Asientos automáticos</h3><button class="modal-close" aria-label="Cerrar" data-aa="cerrar">✕</button></div>' +
        '<div class="modal-body">' +
          '<div class="aa-fechas"><label>Desde<input type="month" id="aa_desde"></label><label>Hasta<input type="month" id="aa_hasta"></label></div>' +
          '<div class="aa-ops">' +
            '<label><input type="checkbox" id="aa_nom" checked><span>Nómina</span></label>' +
            '<label><input type="checkbox" id="aa_pat" checked><span>Aporte patronal 16.29 %</span></label>' +
            '<label><input type="checkbox" id="aa_reg" checked><span>Regalía 8.33 %</span></label>' +
            '<label><input type="checkbox" id="aa_cxp" checked><span>Pagos a proveedores</span></label>' +
          '</div>' +
          '<label class="aa-cta">Adelantos a empleados<select id="aa_cta">' + (ctas.length ? ctas : [{ codigo: '110201', nombre: 'Clientes' }]).map(function (c) { return '<option value="' + esc(c.codigo) + '"' + (c.codigo === '110201' ? ' selected' : '') + '>' + esc(c.codigo + ' ' + c.nombre) + '</option>'; }).join('') + '</select></label>' +
          '<button type="button" class="btn btn-light aa-ver" data-aa="ver"><i class="ti ti-eye" aria-hidden="true"></i> Ver asientos</button>' +
          '<div id="aa_vista" aria-live="polite"></div>' +
        '</div><div class="aa-pie"><button type="button" class="btn btn-blue" id="aa_gen" data-aa="generar" disabled>Generar</button></div></div>';
      document.body.appendChild(m);
      m.addEventListener('click', function (e) {
        var b = e.target.closest('[data-aa]'); if (e.target === m) return cerrar(); if (!b) return;
        var k = b.getAttribute('data-aa'); if (k === 'cerrar') cerrar(); else if (k === 'ver') ver(); else if (k === 'generar') generar();
      });
      m.addEventListener('change', function (e) { if (e.target.matches('input,select')) { st.asientos = []; st.avisos = []; st.visto = false; pintar(); } });
      var d = new Date(), mes = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      document.getElementById('aa_desde').value = mes; document.getElementById('aa_hasta').value = mes;
    }
    st.asientos = []; st.avisos = []; st.visto = false; pintar(); m.classList.add('active');
  }

  function estilos() {
    if (document.getElementById('aaCss')) return;
    var s = document.createElement('style'); s.id = 'aaCss';
    s.textContent = [
      '#modalAsientosAuto .aa-box{max-width:640px;width:100%}',
      '#modalAsientosAuto .aa-fechas{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px}#modalAsientosAuto .aa-fechas label{min-width:0}',
      '#modalAsientosAuto .modal-header h3{text-transform:none;letter-spacing:0}',
      '#modalAsientosAuto label{display:flex;flex-direction:column;gap:6px;font-size:13px;color:#475569;text-transform:none;letter-spacing:0}',
      '#modalAsientosAuto input[type=month],#modalAsientosAuto select{min-width:0;height:48px;font-size:16px;border:1px solid #cbd5e1;border-radius:12px;padding:0 10px;background:#fff;color:#0f172a;width:100%;box-sizing:border-box}',
      '#modalAsientosAuto .aa-ops{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0}',
      '#modalAsientosAuto .aa-ops label{flex-direction:row;align-items:center;gap:10px;min-height:48px;padding:0 12px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;font-size:14px;color:#0f172a;cursor:pointer}',
      '#modalAsientosAuto .aa-ops input{width:20px;height:20px;flex:none}',
      '#modalAsientosAuto .aa-ver{width:100%;min-height:48px;margin:12px 0}',
      '#modalAsientosAuto .aa-res{font-size:14px;margin:8px 0}',
      '#modalAsientosAuto .aa-nota{font-size:13px;color:#64748b}',
      '#modalAsientosAuto .aa-avisos{margin:0 0 8px;padding:8px 12px 8px 28px;background:#fffbeb;border:1px solid #fde68a;border-radius:12px;font-size:13px;color:#92400e}',
      '#modalAsientosAuto .aa-as{border:1px solid #e2e8f0;border-radius:12px;margin:6px 0;background:#fff}',
      '#modalAsientosAuto .aa-as summary{display:flex;justify-content:space-between;align-items:center;gap:10px;min-height:48px;padding:6px 12px;cursor:pointer;list-style:none}',
      '#modalAsientosAuto .aa-as summary span{display:flex;flex-direction:column;min-width:0}#modalAsientosAuto .aa-as summary b{font-size:14px;overflow-wrap:anywhere}#modalAsientosAuto .aa-as summary small{font-size:12px;color:#64748b}',
      '#modalAsientosAuto .aa-as summary em{font-style:normal;font-weight:700;font-size:14px;white-space:nowrap;font-variant-numeric:tabular-nums}',
      '#modalAsientosAuto .aa-as table{width:100%;font-size:12.5px;border-top:1px solid #e2e8f0}#modalAsientosAuto .aa-as td{padding:4px 12px}#modalAsientosAuto .aa-as td+td{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}',
      '#modalAsientosAuto .aa-pie{padding:12px 16px;border-top:1px solid #e2e8f0}#modalAsientosAuto .aa-pie button{width:100%;min-height:54px;font-size:16px;font-weight:700}',
      '#modalAsientosAuto .modal-close{min-width:44px;min-height:44px}',
      '@media (max-width:480px){#modalAsientosAuto .aa-ops{grid-template-columns:1fr}}'
    ].join('');
    document.head.appendChild(s);
  }
  function boton() {
    if (document.getElementById('aaBtn')) return true;
    var ref = document.querySelector('#conta-asientos button[onclick="abrirAutoIPC()"]'); if (!ref) return false;
    var b = document.createElement('button'); b.id = 'aaBtn'; b.className = 'btn btn-light'; b.style.fontSize = '12px'; b.title = 'Asientos de nómina y pagos a proveedores';
    b.innerHTML = '<i class="ti ti-wand"></i> Nómina y pagos'; b.addEventListener('click', abrir); ref.insertAdjacentElement('afterend', b);
    return true;
  }
  function iniciar() { estilos(); if (!boton()) setTimeout(iniciar, 400); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();

  window.BayolAsientosAuto = { construir: construir, abrir: abrir, _estado: function () { return st; } };
})();
