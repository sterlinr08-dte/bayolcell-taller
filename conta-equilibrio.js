/* Contabilidad → «Punto de equilibrio» por tienda y General (dueño, 6-nov-2026).
 * El dueño anota a mano los gastos fijos de cada tienda y los comunes de la empresa;
 * las ventas y el costo salen de Info Plus (RPC estado_mensual_cat). Se guarda en conta_equilibrio
 * (una fila por mes y tienda; codlocalidad 0 = gastos comunes).
 * Capa aislada: envuelve contaTab() para sumar la pestaña sin tocar taller-app.js.
 * Apagar: localStorage.bc_pe_off='1'. API: window.BayolEquilibrio. */
(function () {
  'use strict';
  if (window.BayolEquilibrio) return;
  try { if (localStorage.getItem('bc_pe_off') === '1') return; } catch (e) {}

  var TIENDAS = [
    { cod: 1, nombre: 'Santiago', domingo: false },
    { cod: 4, nombre: 'Moca', domingo: false },
    { cod: 7, nombre: 'Navarrete', domingo: true }
  ];
  // Auditoría 6-nov: regalía 8.33 % (las vacaciones ya van en el sueldo); intereses y capital separados;
  // depreciación y prestaciones; incentivos y piezas de reparación como variables; tarjeta solo sobre lo cobrado con tarjeta.
  var FIJOS_TIENDA = ['Alquiler', 'Luz (Edenorte)', 'Agua', 'Internet y teléfono', 'Nómina de la tienda (sueldos)',
    'TSS patronal', 'Provisión de regalía', 'Prestaciones (cesantía y preaviso)', 'Depreciación (equipos y mobiliario)',
    'Seguridad y alarma', 'Mantenimiento y limpieza', 'Otros gastos de la tienda'];
  var FIJOS_COMUNES = ['Contadora', 'Info Plus', 'Hexnode / MDM', 'WhatsApp / Zernio', 'Supabase y hosting', 'Publicidad fija',
    'Intereses de préstamos', 'Seguros', 'Sueldo del dueño y administración', 'Otros gastos comunes'];
  var VARIABLES = [
    { k: 'comision_pct', t: 'Comisión de vendedores', def: 1 },
    { k: 'incentivos_pct', t: 'Incentivos de técnicos', def: 0 },
    { k: 'piezas_pct', t: 'Piezas usadas en reparaciones', def: 0 },
    { k: 'garantias_pct', t: 'Garantías y mermas', def: 1 },
    { k: 'otros_pct', t: 'Otros variables', def: 0 }
  ];
  var TARJETA_DEF = { tarjeta_pct: 3, tarjeta_parte: 50 };
  var TSS_PCT = 16.29, PROV_PCT = 8.33;

  var st = { mes: null, tab: 'general', filas: {}, ventas: {}, ventasAnt: {}, cn: {}, cargando: false, sucio: false };

  function $(id) { return document.getElementById(id); }
  function esc(s) { return (typeof escapeHtml === 'function') ? escapeHtml(s) : String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function plata(n) { return (typeof money === 'function') ? money(n) : 'RD$ ' + Number(n || 0).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function pct(n) { return (isFinite(n) ? (Math.round(n * 1000) / 10).toLocaleString('es-DO', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '—') + ' %'; }
  function num(v) { var n = parseFloat(String(v == null ? '' : v).replace(/[^0-9.]/g, '')); return isFinite(n) && n > 0 ? n : 0; }
  function aviso(msg, tipo) { if (typeof toast === 'function') toast(msg, tipo); }
  function sb() { try { return supabaseClient; } catch (e) { return null; } }
  // Mismo criterio que la regla de la base (app_puede_contabilidad): admin, dueño o permiso de Contabilidad.
  function puede() { try { return (typeof isAdminUser === 'function' && isAdminUser()) || (typeof esDueno === 'function' && esDueno()) || (typeof tienePermiso === 'function' && tienePermiso('contabilidad_ver')); } catch (e) { return false; } }

  // ---------- fechas y días hábiles ----------
  function mesHoy() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
  function periodo(mes) { var d = new Date(mes + '-01T00:00:00'); d.setMonth(d.getMonth() + 1); return { ini: mes + '-01', fin: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-01' }; }
  // 'pasado' | 'actual' | 'futuro'
  function estadoMes(mes) { var h = mesHoy(); return mes < h ? 'pasado' : (mes > h ? 'futuro' : 'actual'); }
  function contarDias(mes, domingo, hastaHoy) {
    var p = mes.split('-'), y = +p[0], m = +p[1] - 1, ult = new Date(y, m + 1, 0).getDate();
    var hoy = new Date(), tope = ult;
    if (hastaHoy) {
      if (hoy.getFullYear() < y || (hoy.getFullYear() === y && hoy.getMonth() < m)) return 0;
      if (hoy.getFullYear() === y && hoy.getMonth() === m) tope = hoy.getDate();
    }
    var n = 0;
    for (var d = 1; d <= tope; d++) { var dow = new Date(y, m, d).getDay(); if (dow !== 0 || domingo) n++; }
    return n;
  }

  function diasHastaAyer(mes, domingo) {
    var n = contarDias(mes, domingo, true);
    if (estadoMes(mes) !== 'actual') return n;
    var dow = new Date().getDay();
    return (dow !== 0 || domingo) ? Math.max(0, n - 1) : n;
  }
  function mesAnterior(mes) { var d = new Date(mes + '-01T00:00:00'); d.setMonth(d.getMonth() - 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }

  // ---------- filas ----------
  function filaVacia(cod) {
    var lista = cod === 0 ? FIJOS_COMUNES : FIJOS_TIENDA, t = TIENDAS.filter(function (x) { return x.cod === cod; })[0];
    var vars = { tarjeta_pct: TARJETA_DEF.tarjeta_pct, tarjeta_parte: TARJETA_DEF.tarjeta_parte }; VARIABLES.forEach(function (v) { vars[v.k] = v.def; });
    return {
      mes: st.mes + '-01', codlocalidad: cod,
      gastos: lista.map(function (c) { return { concepto: c, monto: '' }; }),
      // Comunes: base del reparto (mes anterior), % de ventas con ITBIS (hoy 0: el dueño confirmó el 6-nov que no llevan) y abono a capital.
      variables: cod === 0 ? { base: 'anterior', itbis_pct: 0, capital: 0 } : vars,
      dias_habiles: cod === 0 ? null : contarDias(st.mes, t && t.domingo, false),
      incluye_itbis: false, reparto: 'venta', reparto_pct: {}, notas: '', _nueva: true
    };
  }
  function fila(cod) { if (!st.filas[cod]) st.filas[cod] = filaVacia(cod); return st.filas[cod]; }
  function totalFijos(cod) { return (fila(cod).gastos || []).reduce(function (s, g) { return s + num(g.monto); }, 0); }
  function faltanMontos(cod) { return (fila(cod).gastos || []).filter(function (g) { return String(g.monto).trim() === ''; }).length; }
  function itbisPct() { var v = fila(0).variables || {}; return Math.min(100, num(v.itbis_pct)) / 100; }
  function pctVariables(cod) {
    var v = fila(cod).variables || {};
    var tarj = (v.tarjeta_pct == null ? TARJETA_DEF.tarjeta_pct : num(v.tarjeta_pct)) * (v.tarjeta_parte == null ? TARJETA_DEF.tarjeta_parte : num(v.tarjeta_parte)) / 100;
    // El banco cobra sobre el total con ITBIS.
    tarj = tarj * (1 + 0.18 * itbisPct());
    return (VARIABLES.reduce(function (s, x) { return s + num(v[x.k]); }, 0) + tarj) / 100;
  }

  // ---------- préstamos ----------
  // Lista en fila(0).variables.prestamos = [{ banco, interes, capital }]. Los intereses son gasto (van en la fila
  // «Intereses de préstamos», que se llena sola); el capital no es gasto pero sale de la caja.
  function prestamos() { var v = fila(0).variables || {}; return Array.isArray(v.prestamos) ? v.prestamos : null; }
  function capitalPrestamos() {
    var l = prestamos(); if (l && l.length) return l.reduce(function (s, p) { return s + num(p.capital); }, 0);
    return num((fila(0).variables || {}).capital);
  }
  function filaIntereses() {
    var gs = fila(0).gastos; for (var i = 0; i < gs.length; i++) if (/pr[ée]stamo/i.test(gs[i].concepto)) return i;
    return -1;
  }
  function sincronizarIntereses() {
    var l = prestamos() || [], gs = fila(0).gastos, i = filaIntereses();
    if (!l.length) return;
    var tot = Math.round(l.reduce(function (s, p) { return s + num(p.interes); }, 0) * 100) / 100;
    if (i < 0) { gs.push({ concepto: 'Intereses de préstamos', monto: tot }); return; }
    gs[i].concepto = 'Intereses de préstamos'; gs[i].monto = tot;
  }
  // Venta para que alcance el efectivo: gastos fijos (con intereses) + capital, entre la contribución.
  function cajaNecesaria(x, quedan) {
    x.peCaja = (x.capital > 0 && x.mc > 0) ? (x.ft + x.capital) / x.mc : null;
    x.faltaCaja = x.peCaja != null ? Math.max(0, x.peCaja - x.vn) : null;
    x.diaCaja = x.faltaCaja != null && x.faltaCaja > 0 && quedan > 0 ? x.faltaCaja / quedan : null;
  }

  // Meta del mes (dueño, 07-nov): el sistema sugiere lo que cubre gastos y cuota completa del préstamo
  // (redondeado a mil hacia arriba); el dueño la acepta o la cambia y queda fija en variables.meta de la tienda.
  function metaDe(x, meta, quedan) {
    var base = x.peCaja != null ? x.peCaja : x.pe;
    x.metaSug = base != null && base > 0 ? Math.ceil(base / 1000) * 1000 : null;
    x.meta = meta || 0;
    x.metaAvance = x.meta > 0 ? x.vn / x.meta : null;
    x.metaFalta = x.meta > 0 ? Math.max(0, x.meta - x.vn) : null;
    x.metaDia = x.metaFalta && quedan > 0 ? x.metaFalta / quedan : null;
  }

  // ---------- cálculo ----------
  function calcular() {
    var com = fila(0), g18 = itbisPct(), itbis = g18 > 0, GC = totalFijos(0), em = estadoMes(st.mes);
    var cv = com.variables || {}, base = cv.base || 'anterior', capital = capitalPrestamos();
    // Días: los transcurridos nunca pasan de los del mes; hoy cuenta como día que queda para vender.
    function fraccion(x) { return em === 'actual' && x.diasMes > 0 ? Math.min(1, x.diasPas / x.diasMes) : 1; }
    function proyectar(x) {
      if (em === 'pasado') x.diasPas = x.diasMes; else if (em === 'futuro') x.diasPas = 0;
      x.diasPas = Math.min(x.diasPas, x.diasMes);
      // Hoy cuenta como día que queda (no como pasado) para la venta diaria necesaria.
      var quedan = em === 'actual' ? Math.max(1, x.diasMes - x.diasAyer) : 0;
      x.diaNecesario = x.falta != null && x.falta > 0 && quedan > 0 ? x.falta / quedan : null;
      x.ritmo = x.diasPas > 0 ? x.vn / x.diasPas : 0;
      x.proy = em === 'actual' && x.diasPas > 0 ? Math.max(x.vn, x.ritmo * x.diasMes) : x.vn;
    }
    var tiendas = TIENDAS.map(function (t) {
      var v = st.ventas[t.cod] || { venta: 0, costo: 0 };
      var vn = v.venta / (1 + 0.18 * g18), c = v.costo;
      var mb = vn > 0 ? (vn - c) / vn : 0, mc = mb - pctVariables(t.cod);
      return { t: t, venta: v.venta, vn: vn, costo: c, mb: mb, mc: mc, gf: totalFijos(t.cod), faltan: faltanMontos(t.cod),
        diasMes: num(fila(t.cod).dias_habiles) || contarDias(st.mes, t.domingo, false), diasPas: contarDias(st.mes, t.domingo, true),
        diasAyer: diasHastaAyer(st.mes, t.domingo), ventaAnt: (st.ventasAnt[t.cod] || { venta: 0 }).venta / (1 + 0.18 * g18) };
    });
    var sumVN = tiendas.reduce(function (s, x) { return s + x.vn; }, 0);
    var sumAnt = tiendas.reduce(function (s, x) { return s + x.ventaAnt; }, 0);
    tiendas.forEach(function (x) {
      var parte;
      if (com.reparto === 'manual') parte = num((com.reparto_pct || {})[x.t.cod]) / 100;
      else if (com.reparto === 'venta' && base === 'anterior' && sumAnt > 0) parte = x.ventaAnt / sumAnt;
      else if (com.reparto === 'venta' && base !== 'anterior' && sumVN > 0) parte = x.vn / sumVN;
      else parte = 1 / TIENDAS.length;
      x.partePct = parte; x.gc = GC * parte; x.ft = x.gf + x.gc;
      x.pe = (x.mc > 0 && x.ft > 0) ? x.ft / x.mc : null;
      x.peDia = x.pe != null && x.diasMes > 0 ? x.pe / x.diasMes : null;
      x.falta = x.pe != null ? Math.max(0, x.pe - x.vn) : null;
      proyectar(x);
      x.alcanzado = x.pe != null && x.pe > 0 ? x.vn / x.pe : null;
      // Aporte de la tienda: lo que deja sin cargarle los gastos comunes (para decidir sobre una tienda).
      x.aporte = em === 'futuro' ? null : x.vn * x.mc - x.gf * fraccion(x);
      // Resultado: en el mes en curso se comparan los gastos de los días ya transcurridos, no los del mes entero.
      x.resultado = em === 'futuro' ? null : x.vn * x.mc - x.ft * fraccion(x);
      x.resultadoProy = x.proy * x.mc - x.ft;
      x.seguridad = x.pe != null && x.vn > 0 ? (x.vn - x.pe) / x.vn : null;
      // Cuota completa del préstamo: la tienda carga su parte del capital, igual que los gastos comunes.
      x.capital = capital * parte;
      cajaNecesaria(x, em === 'actual' ? Math.max(1, x.diasMes - x.diasAyer) : 0);
      metaDe(x, num((fila(x.t.cod).variables || {}).meta), em === 'actual' ? Math.max(1, x.diasMes - x.diasAyer) : 0);
    });
    var contrib = tiendas.reduce(function (s, x) { return s + x.vn * x.mc; }, 0);
    var sumGF = tiendas.reduce(function (s, x) { return s + x.gf; }, 0);
    var sumCosto = tiendas.reduce(function (s, x) { return s + x.costo; }, 0);
    var sumProy = tiendas.reduce(function (s, x) { return s + x.proy; }, 0);
    var contribProy = tiendas.reduce(function (s, x) { return s + x.proy * x.mc; }, 0);
    var mcComb = sumVN > 0 ? contrib / sumVN : 0;
    var fijosTot = sumGF + GC;
    // General: los días son los de la tienda que más días abre (Navarrete abre domingos).
    var diasMesG = Math.max.apply(null, tiendas.map(function (x) { return x.diasMes; }));
    var diasPasG = Math.max.apply(null, tiendas.map(function (x) { return x.diasPas; }));
    var diasAyerG = Math.max.apply(null, tiendas.map(function (x) { return x.diasAyer; }));
    var fracG = em === 'actual' && diasMesG > 0 ? Math.min(1, diasPasG / diasMesG) : 1;
    var diasLS = contarDias(st.mes, false, false);
    var peG = (mcComb > 0 && fijosTot > 0) ? fijosTot / mcComb : null;
    var g = {
      vn: sumVN, mb: sumVN > 0 ? (sumVN - sumCosto) / sumVN : 0, mc: mcComb, gf: sumGF, gc: GC, ft: fijosTot, partePct: 1,
      pe: peG, peDia: peG != null && diasLS > 0 ? peG / diasLS : null, peDiaTxt: 'por día de lunes a sábado',
      falta: peG != null ? Math.max(0, peG - sumVN) : null, alcanzado: peG != null && peG > 0 ? sumVN / peG : null,
      proy: sumProy, resultado: em === 'futuro' ? null : contrib - fijosTot * fracG, resultadoProy: contribProy - fijosTot,
      seguridad: peG != null && sumVN > 0 ? (sumVN - peG) / sumVN : null, capital: capital,
      faltan: faltanMontos(0) + tiendas.reduce(function (s, x) { return s + x.faltan; }, 0), diasMes: diasMesG, diasPas: diasPasG
    };
    var quedanG = em === 'actual' ? Math.max(1, diasMesG - diasAyerG) : 0;
    g.diaNecesario = g.falta != null && g.falta > 0 && quedanG > 0 ? g.falta / quedanG : null;
    cajaNecesaria(g, quedanG);
    // General: la meta es la suma de las metas fijadas en las tiendas.
    metaDe(g, tiendas.reduce(function (s, x) { return s + x.meta; }, 0), quedanG);
    g.metaSug = tiendas.reduce(function (s, x) { return s + (x.metaSug || 0); }, 0);
    g.metasFaltan = tiendas.filter(function (x) { return !x.meta; }).length;
    var repSuma = TIENDAS.reduce(function (a, t) { return a + num((com.reparto_pct || {})[t.cod]); }, 0);
    var repMal = com.reparto === 'manual' && Math.abs(repSuma - 100) > 0.01;
    var errVentas = TIENDAS.some(function (t) { return st.ventas[t.cod] && st.ventas[t.cod].error; });
    return { tiendas: tiendas, g: g, itbis: itbis, g18: g18, em: em, repMal: repMal, repSuma: repSuma, errVentas: errVentas,
      base: base, sinAnt: com.reparto === 'venta' && base === 'anterior' && sumAnt <= 0, cn: st.cn || {} };
  }

  // ---------- datos ----------
  async function cargar() {
    var cli = sb(); if (!cli) return;
    st.cargando = true; st.errorTabla = false; pintar();
    var token = st.token = (st.token || 0) + 1;
    var p = periodo(st.mes);
    try {
      var r = await cli.from('conta_equilibrio').select('*').eq('mes', p.ini);
      if (r.error) throw r.error;
      if (token !== st.token) return;
      st.filas = {};
      (r.data || []).forEach(function (f) { st.filas[f.codlocalidad] = f; });
    } catch (e) {
      if (typeof logError === 'function') logError('equilibrio cargar', e);
      st.errorTabla = true;
    }
    var ventas = {}, ventasAnt = {}, cn = {}, pa = periodo(mesAnterior(st.mes));
    async function leer(per, cod) {
      var rv = await cli.rpc('estado_mensual_cat', { p_ini: per.ini, p_fin: per.fin, p_localidad: cod });
      if (rv.error) throw rv.error;
      var v = 0, c = 0; (rv.data || []).forEach(function (x) { v += Number(x.venta) || 0; c += Number(x.costo) || 0; });
      return { venta: v, costo: c };
    }
    await Promise.all(TIENDAS.map(async function (t) {
      try { ventas[t.cod] = await leer(p, t.cod); }
      catch (e) { ventas[t.cod] = { venta: 0, costo: 0, error: true }; if (typeof logError === 'function') logError('equilibrio ventas', e); }
      try { ventasAnt[t.cod] = await leer(pa, t.cod); } catch (e) { ventasAnt[t.cod] = { venta: 0, costo: 0 }; }
    }));
    // Notas de crédito (CN): solo se cuentan para el aviso. La resta la hace estado_mensual_cat (07-nov, auditoría).
    try {
      var rc = await cli.from('infoplus_ventas').select('monto_venta,monto_costo,codlocalidad,factura_id')
        .like('factura_id', 'CN%').gte('fecha', p.ini).lt('fecha', p.fin);
      if (rc.error) throw rc.error;
      (rc.data || []).forEach(function (x) {
        var k = x.codlocalidad; if (!cn[k]) cn[k] = { venta: 0, costo: 0, n: 0, facturas: {} };
        cn[k].venta += Number(x.monto_venta) || 0; cn[k].costo += Number(x.monto_costo) || 0; cn[k].facturas[x.factura_id] = 1;
      });
      Object.keys(cn).forEach(function (k) {
        cn[k].n = Object.keys(cn[k].facturas).length;
        // 07-nov-2026 (auditoría): ya NO se restan aquí. estado_mensual_cat las resta desde la migración
        // 20261106201708 (CN en negativo); restarlas también aquí las quitaba dos veces (Navarrete oct −RD$102,000).
      });
    } catch (e) { if (typeof logError === 'function') logError('equilibrio notas de crédito', e); }
    if (token !== st.token) return;
    st.ventas = ventas; st.ventasAnt = ventasAnt; st.cn = cn; st.cargando = false; st.sucio = false;
    pintar();
  }

  async function guardar(cod) {
    var cli = sb(); if (!cli) return;
    var lista = cod == null ? [0].concat(TIENDAS.map(function (t) { return t.cod; })) : [cod];
    var quien = (typeof sessionUser !== 'undefined' && sessionUser) ? sessionUser.nombre : 'Sistema';
    var filas = lista.map(function (c) {
      var f = fila(c);
      return { mes: st.mes + '-01', codlocalidad: c, gastos: f.gastos, variables: f.variables || {}, dias_habiles: f.dias_habiles == null || f.dias_habiles === '' ? null : num(f.dias_habiles),
        incluye_itbis: c === 0 ? num((f.variables || {}).itbis_pct) > 0 : false, reparto: f.reparto || 'venta', reparto_pct: f.reparto_pct || {}, notas: f.notas || '', actualizado_por: quien };
    });
    var com = fila(0);
    if (com.reparto === 'manual') {
      var s = TIENDAS.reduce(function (a, t) { return a + num((com.reparto_pct || {})[t.cod]); }, 0);
      if (Math.abs(s - 100) > 0.01) { aviso('El reparto manual de gastos comunes debe sumar 100 %.', 'error'); return; }
    }
    var btn = $('peBtnGuardar'); if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ti ti-loader"></i> Guardando…'; }
    try {
      var r = await cli.from('conta_equilibrio').upsert(filas, { onConflict: 'mes,codlocalidad' }).select('*');
      if (r.error) throw r.error;
      (r.data || []).forEach(function (f) { st.filas[f.codlocalidad] = f; });
      st.sucio = false;
      aviso('Gastos del mes guardados.');
    } catch (e) {
      if (typeof logError === 'function') logError('equilibrio guardar', e);
      aviso('No se pudo guardar: ' + ((e && e.message) || e), 'error');
    }
    pintar();
  }

  async function copiarMesAnterior() {
    var cli = sb(); if (!cli) return;
    var d = new Date(st.mes + '-01T00:00:00'); d.setMonth(d.getMonth() - 1);
    var ant = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-01';
    try {
      var r = await cli.from('conta_equilibrio').select('*').eq('mes', ant);
      if (r.error) throw r.error;
      if (!r.data || !r.data.length) { aviso('El mes anterior no tiene gastos guardados.', 'error'); return; }
      var ok = true;
      if (typeof confirmar === 'function') ok = await confirmar('¿Copiar los gastos del mes anterior a este mes?\n\nSe reemplazan los montos escritos en pantalla. Revise y guarde después.');
      if (!ok) return;
      r.data.forEach(function (f) {
        var t = TIENDAS.filter(function (x) { return x.cod === f.codlocalidad; })[0];
        st.filas[f.codlocalidad] = { mes: st.mes + '-01', codlocalidad: f.codlocalidad, gastos: f.gastos || [], variables: f.variables || {},
          dias_habiles: f.codlocalidad === 0 ? null : contarDias(st.mes, t && t.domingo, false), incluye_itbis: !!f.incluye_itbis,
          reparto: f.reparto || 'venta', reparto_pct: f.reparto_pct || {}, notas: f.notas || '' };
      });
      st.sucio = true; aviso('Copiado. Revise los montos y toque Guardar.');
      pintar();
    } catch (e) { aviso('No se pudo copiar: ' + ((e && e.message) || e), 'error'); }
  }

  // ---------- edición ----------
  function editMonto(cod, i, v) { fila(cod).gastos[i].monto = v === '' ? '' : num(v); st.sucio = true; refrescarCalculo(); }
  function editConcepto(cod, i, v) { fila(cod).gastos[i].concepto = v; st.sucio = true; }
  function agregarConcepto(cod) { fila(cod).gastos.push({ concepto: '', monto: '' }); st.sucio = true; pintar(); setTimeout(function () { var el = document.querySelector('#peGastos input[data-i="' + (fila(cod).gastos.length - 1) + '"]'); if (el) el.focus(); }, 30); }
  function quitarConcepto(cod, i) { fila(cod).gastos.splice(i, 1); st.sucio = true; pintar(); }
  function editVar(cod, k, v) { fila(cod).variables = fila(cod).variables || {}; fila(cod).variables[k] = num(v); st.sucio = true; refrescarCalculo(); }
  function editDias(cod, v) { fila(cod).dias_habiles = v === '' ? null : Math.min(31, Math.round(num(v))); st.sucio = true; refrescarCalculo(); }
  function editComun(k, v) {
    var c = fila(0); c.variables = c.variables || {};
    if (k === 'reparto') {
      if (v === 'anterior' || v === 'actual') { c.reparto = 'venta'; c.variables.base = v; } else c.reparto = v;
    } else if (k === 'itbis_pct') { c.variables.itbis_pct = Math.min(100, num(v)); st.sucio = true; refrescarCalculo(); return; }
    else if (k === 'capital') { c.variables.capital = num(v); st.sucio = true; refrescarCalculo(); return; }
    st.sucio = true; pintar();
  }
  function editMeta(cod, v) { var f = fila(cod); f.variables = f.variables || {}; f.variables.meta = v === '' ? 0 : num(v); st.sucio = true; refrescarCalculo(); }
  function usarMetaSugerida(cod) {
    var x = calcular().tiendas.filter(function (y) { return y.t.cod === cod; })[0];
    if (!x || !x.metaSug) { aviso('Anote primero los gastos para poder sugerir la meta.', 'error'); return; }
    var f = fila(cod); f.variables = f.variables || {}; f.variables.meta = x.metaSug; st.sucio = true; pintar();
  }
  function listaPrestamos() { var c = fila(0); c.variables = c.variables || {}; if (!Array.isArray(c.variables.prestamos)) c.variables.prestamos = []; return c.variables.prestamos; }
  function editPrestamo(i, k, v) {
    var l = listaPrestamos(); if (!l[i]) return;
    l[i][k] = k === 'banco' ? String(v).slice(0, 60) : (v === '' ? '' : num(v));
    if (k !== 'banco') { sincronizarIntereses(); fila(0).variables.capital = capitalPrestamos(); }
    st.sucio = true;
    if (k === 'banco') return;
    var t = $('pePrestTot'); if (t) t.innerHTML = htmlTotPrestamos();
    var gi = filaIntereses(), el = gi >= 0 && document.querySelector('#peGastos input[data-i="' + gi + '"]'); if (el) el.value = num(fila(0).gastos[gi].monto) || '';
    refrescarCalculo();
  }
  function agregarPrestamo() {
    var l = listaPrestamos(), c = fila(0).variables;
    // El primer renglón se lleva lo que ya estaba escrito (capital suelto e intereses de la lista de gastos).
    if (!l.length) { var gi = filaIntereses(); l.push({ banco: '', interes: gi >= 0 ? (num(fila(0).gastos[gi].monto) || '') : '', capital: num(c.capital) || '' }); }
    else l.push({ banco: '', interes: '', capital: '' });
    sincronizarIntereses(); c.capital = capitalPrestamos(); st.sucio = true; pintar();
    setTimeout(function () { var el = document.querySelector('#pePrest input[data-p="' + (l.length - 1) + '"]'); if (el) el.focus(); }, 30);
  }
  function quitarPrestamo(i) {
    var l = listaPrestamos(); l.splice(i, 1);
    if (l.length) sincronizarIntereses(); else { var gi = filaIntereses(); if (gi >= 0) fila(0).gastos[gi].monto = ''; }
    fila(0).variables.capital = capitalPrestamos(); st.sucio = true; pintar();
  }
  function editRepartoPct(cod, v) { var c = fila(0); c.reparto_pct = c.reparto_pct || {}; c.reparto_pct[cod] = num(v); st.sucio = true; refrescarCalculo(); }
  function sugerirNomina(cod) {
    var f = fila(cod), nom = 0;
    f.gastos.forEach(function (g) { if (/^n[óo]mina/i.test(g.concepto)) nom += num(g.monto); });
    if (!nom) { aviso('Escriba primero el monto de la nómina de la tienda.', 'error'); return; }
    f.gastos.forEach(function (g) {
      if (/^tss/i.test(g.concepto)) g.monto = Math.round(nom * TSS_PCT) / 100;
      if (/^provisi[óo]n/i.test(g.concepto)) g.monto = Math.round(nom * PROV_PCT) / 100;
    });
    st.sucio = true; pintar();
  }

  // ---------- pintar ----------
  function kpi(t, v, color, sub) {
    return '<div class="pe-kpi"><small>' + esc(t) + '</small><b' + (color ? ' style="color:' + color + '"' : '') + '>' + v + '</b>' + (sub ? '<span>' + sub + '</span>' : '') + '</div>';
  }
  function colorRes(n) { return n >= 0 ? 'var(--fin-ok, #15803d)' : 'var(--fin-danger, #b91c1c)'; }
  function barra(a) { var p = a == null ? 0 : Math.max(0, Math.min(1, a)); return '<div class="pe-barra"><i style="width:' + (p * 100).toFixed(1) + '%;background:' + (p >= 1 ? '#16a34a' : '#e4572e') + '"></i></div>'; }

  function htmlResumen(x, nombre, esGeneral, c) {
    var itbis = c.itbis, avisos = [];
    if (c.errVentas) avisos.push('No se pudieron leer las ventas de Info Plus. Toque Actualizar.');
    else if (c.em === 'futuro') avisos.push('Este mes todavía no empieza. Puede ir anotando los gastos.');
    else if (x.vn <= 0) avisos.push('No hay ventas registradas en Info Plus para este mes. Verifique la sincronización o el mes elegido.');
    if (x.ft <= 0) avisos.push('Anote los gastos fijos para calcular el punto de equilibrio.');
    if (c.repMal) avisos.push('El reparto manual de gastos comunes suma ' + c.repSuma + ' %. Debe sumar 100 %.');
    if (x.mc <= 0 && x.vn > 0) avisos.push('Con el margen actual ' + (esGeneral ? 'el negocio' : 'esta tienda') + ' no cubre sus gastos variables. Revise los precios, el costo o los porcentajes de gastos variables.');
    if (x.faltan > 0) avisos.push('Hay ' + x.faltan + ' concepto(s) de gastos fijos sin monto. El punto de equilibrio puede salir más bajo de lo real.');
    if (x.pe != null && x.vn >= x.pe && x.vn > 0) avisos.push('Ya ' + (esGeneral ? 'se cubrieron' : 'cubrió') + ' los gastos del mes. Lo que se venda de aquí en adelante, menos el costo y los gastos variables, es ganancia.');
    else if (c.em === 'actual' && x.pe != null && x.proy < x.pe && x.diaNecesario != null) avisos.push('Al ritmo actual cerraría el mes por debajo del punto de equilibrio. Necesita vender ' + plata(x.diaNecesario) + ' por día hábil.');
    if (itbis) avisos.push('Se quita el ITBIS al ' + Math.round(c.g18 * 100) + ' % de las ventas.');
    if (c.sinAnt) avisos.push('El mes anterior no tiene ventas: los gastos comunes se reparten en partes iguales.');
    var cnx = esGeneral ? Object.keys(c.cn).reduce(function (a, k) { a.n += c.cn[k].n; a.v += c.cn[k].venta; return a; }, { n: 0, v: 0 }) : (c.cn[x.t && x.t.cod] ? { n: c.cn[x.t.cod].n, v: c.cn[x.t.cod].venta } : null);
    if (cnx && cnx.n) avisos.push('Incluye ' + cnx.n + ' nota(s) de crédito (devoluciones) por ' + plata(cnx.v) + ', ya restadas de la venta.');
    return '<div class="pe-res">' +
      '<div class="pe-res-h"><b>' + esc(nombre) + '</b><span>' + (x.alcanzado != null ? pct(x.alcanzado) + ' del punto de equilibrio' : 'Sin punto de equilibrio') + '</span></div>' +
      barra(x.alcanzado) +
      htmlMeta(x, esGeneral) +
      '<div class="pe-kpis">' +
        kpi('Debe vender en el mes', x.pe != null ? plata(x.pe) : '—', '#0f172a', x.peDia != null ? plata(x.peDia) + ' ' + (x.peDiaTxt || 'por día') : '') +
        kpi('Lleva vendido', plata(x.vn), null, 'Margen ' + pct(x.mb) + ' · contribución ' + pct(x.mc)) +
        // En ganancia: lo que debe dejar la venta después del costo y los gastos variables, y lo que lleva.
        kpi('Ganancia que necesita', plata(x.ft), null, 'Lleva ' + '<b style="color:' + colorRes(x.vn * x.mc - x.ft) + '">' + plata(Math.max(0, x.vn * x.mc)) + '</b> (venta − costo − variables)') +
        kpi('Le falta', x.falta != null ? plata(x.falta) : '—', x.falta ? '#b45309' : '#15803d', x.diaNecesario != null ? plata(x.diaNecesario) + ' por día que queda' : '') +
        kpi('Gastos fijos', plata(x.ft), null, esGeneral ? 'Propios de las tiendas ' + plata(x.gf) + ' · comunes ' + plata(x.gc) : 'Propios ' + plata(x.gf) + ' · comunes ' + plata(x.gc) + ' (' + pct(x.partePct) + ')') +
        kpi(c.em === 'pasado' ? 'Resultado del mes' : 'Resultado a la fecha', x.resultado == null ? '—' : plata(x.resultado), x.resultado == null ? null : colorRes(x.resultado),
          x.resultado == null ? '' : (x.resultado >= 0 ? 'Ganancia' : 'Pérdida') + (c.em === 'actual' ? ' · con los gastos de los días transcurridos' : '')) +
        (!esGeneral ? kpi('Aporte de la tienda', x.aporte == null ? '—' : plata(x.aporte), x.aporte == null ? null : colorRes(x.aporte), 'Sin gastos comunes. Sirve para decidir sobre la tienda.') : '') +
        kpi('Margen de seguridad', x.seguridad == null ? '—' : pct(x.seguridad), x.seguridad == null ? null : colorRes(x.seguridad), x.seguridad == null ? '' : (x.seguridad >= 0 ? 'Lo que puede bajar la venta sin perder' : 'Por debajo del punto de equilibrio')) +
        (x.capital > 0 && x.peCaja != null ? kpi('Para pagar también la cuota del préstamo', plata(x.peCaja),
          x.faltaCaja ? '#b45309' : '#15803d',
          (x.faltaCaja ? 'Le falta <b>' + plata(x.faltaCaja) + '</b>' + (x.diaCaja != null ? ' · ' + plata(x.diaCaja) + ' por día que queda' : '') : 'Ya alcanza para la cuota completa') +
          '<br>Capital ' + plata(x.capital) + (esGeneral ? '' : ' (' + pct(x.partePct) + ' de ' + plata(c.g.capital) + ')') + ' · no es gasto, pero sale de la caja') : '') +
        (c.em === 'actual' ? kpi('Proyección a fin de mes', plata(x.proy), null, 'Resultado ' + '<b style="color:' + colorRes(x.resultadoProy) + '">' + plata(x.resultadoProy) + '</b>') : '') +
      '</div>' +
      (avisos.length ? '<ul class="pe-avisos">' + avisos.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ul>' : '') +
      '<p class="pe-nota">Estimado con las ventas y el costo de Info Plus, antes del impuesto sobre la renta. No sustituye el estado de la contadora.</p>' +
    '</div>';
  }

  function htmlMeta(x, esGeneral) {
    var sug = x.metaSug ? plata(x.metaSug) : '—';
    var cab = '<div class="pe-meta-h"><b>Meta de venta del mes</b>' + (x.meta > 0 ? '<span>' + pct(x.metaAvance) + ' logrado</span>' : '') + '</div>';
    var cuerpo;
    if (esGeneral) {
      cuerpo = x.meta > 0
        ? '<div class="pe-meta-n">' + plata(x.meta) + '</div>' + barra(x.metaAvance) +
          '<p class="pe-meta-s">Lleva ' + plata(x.vn) + (x.metaFalta ? ' · le falta <b>' + plata(x.metaFalta) + '</b>' + (x.metaDia ? ' · ' + plata(x.metaDia) + ' por día' : '') : ' · <b>meta cumplida</b>') +
          (x.metasFaltan ? '<br>Falta fijar la meta en ' + x.metasFaltan + ' tienda(s).' : '') + '</p>'
        : '<p class="pe-meta-s">Fije la meta en cada tienda. Sugerida para todo el negocio: <b>' + plata(x.metaSug || 0) + '</b>.</p>';
    } else {
      var cod = x.t.cod;
      cuerpo = '<div class="pe-meta-f"><input inputmode="decimal" aria-label="Meta de venta del mes" placeholder="Escriba la meta" value="' + (x.meta || '') + '" onchange="BayolEquilibrio._mt(' + cod + ',this.value)">' +
        (x.metaSug && x.metaSug !== x.meta ? '<button class="btn btn-light" onclick="BayolEquilibrio._ms(' + cod + ')">Usar sugerida ' + sug + '</button>' : '') + '</div>' +
        (x.meta > 0 ? barra(x.metaAvance) + '<p class="pe-meta-s">Lleva ' + plata(x.vn) + (x.metaFalta ? ' · le falta <b>' + plata(x.metaFalta) + '</b>' + (x.metaDia ? ' · ' + plata(x.metaDia) + ' por día que queda' : '') : ' · <b>meta cumplida</b>') + '</p>' : '') +
        '<p class="pe-nota">Sugerida: ' + sug + ', lo que cubre los gastos' + (x.capital > 0 ? ' y su parte de la cuota del préstamo' : '') + '. Se guarda con «Guardar gastos del mes».</p>';
    }
    return '<div class="pe-meta">' + cab + cuerpo + '</div>';
  }

  function htmlGastos(cod) {
    var f = fila(cod), esTienda = cod !== 0, lp = !esTienda && (prestamos() || []).length, gi = lp ? filaIntereses() : -1;
    var filas = f.gastos.map(function (g, i) {
      // Con la lista de préstamos, los intereses se llenan solos: no se escriben a mano.
      if (i === gi) return '<div class="pe-g"><input class="pe-g-c" value="' + esc(g.concepto) + '" readonly aria-label="Concepto"><input class="pe-g-m" data-i="' + i + '" value="' + (num(g.monto) || '') + '" readonly title="Se llena solo con la lista de préstamos" aria-label="Intereses de préstamos, se llena solo"><span class="pe-auto" title="Se llena solo con la lista de préstamos"><i class="ti ti-lock"></i></span></div>';
      return '<div class="pe-g">' +
        '<input class="pe-g-c" value="' + esc(g.concepto) + '" placeholder="Concepto" onchange="BayolEquilibrio._c(' + cod + ',' + i + ',this.value)" aria-label="Concepto">' +
        '<input class="pe-g-m" data-i="' + i + '" inputmode="decimal" value="' + (g.monto === '' || g.monto == null ? '' : num(g.monto)) + '" placeholder="0.00" oninput="BayolEquilibrio._m(' + cod + ',' + i + ',this.value)" aria-label="Monto de ' + esc(g.concepto) + '">' +
        '<button class="pe-x" title="Quitar" aria-label="Quitar" onclick="BayolEquilibrio._q(' + cod + ',' + i + ')"><i class="ti ti-x"></i></button>' +
      '</div>';
    }).join('');
    var vars = '';
    if (esTienda) {
      var fv = f.variables || {};
      var tp = fv.tarjeta_pct == null ? TARJETA_DEF.tarjeta_pct : num(fv.tarjeta_pct), tq = fv.tarjeta_parte == null ? TARJETA_DEF.tarjeta_parte : num(fv.tarjeta_parte);
      vars = '<h4>Gastos variables (% de la venta)</h4><div class="pe-vars">' + VARIABLES.map(function (v) {
        return '<label><span>' + esc(v.t) + '</span><input inputmode="decimal" value="' + num(fv[v.k]) + '" oninput="BayolEquilibrio._v(' + cod + ',\'' + v.k + '\',this.value)"><i>%</i></label>';
      }).join('') +
        '<label><span>Comisión del banco por tarjeta</span><input inputmode="decimal" value="' + tp + '" oninput="BayolEquilibrio._v(' + cod + ',\'tarjeta_pct\',this.value)"><i>%</i></label>' +
        '<label><span>Parte de la venta cobrada con tarjeta</span><input inputmode="decimal" value="' + tq + '" oninput="BayolEquilibrio._v(' + cod + ',\'tarjeta_parte\',this.value)"><i>%</i></label>' +
      '</div>' +
      '<p class="pe-nota">Si las comisiones de los vendedores ya van en la nómina, ponga 0 % en «Comisión de vendedores» para no contarlas dos veces.</p>' +
      '<label class="pe-dias"><span>Días hábiles del mes</span><input inputmode="numeric" maxlength="2" value="' + (f.dias_habiles == null ? '' : f.dias_habiles) + '" oninput="BayolEquilibrio._d(' + cod + ',this.value)"></label>';
    } else {
      var rp = f.reparto_pct || {};
      var cvv = f.variables || {}, sel = f.reparto === 'venta' ? (cvv.base === 'actual' ? 'actual' : 'anterior') : f.reparto;
      vars = htmlPrestamos(cvv) +
        '<h4>Cómo repartir los gastos comunes</h4>' +
        '<div class="pe-rep">' +
          ['anterior', 'actual', 'iguales', 'manual'].map(function (k) {
            var t = { anterior: 'Según la venta del mes anterior (recomendado)', actual: 'Según la venta de este mes', iguales: 'Partes iguales', manual: 'Porcentaje manual' }[k];
            return '<label><input type="radio" name="peRep" ' + (sel === k ? 'checked' : '') + ' onchange="BayolEquilibrio._r(\'reparto\',\'' + k + '\')"> ' + t + '</label>';
          }).join('') +
        '</div>' +
        (f.reparto === 'manual' ? '<div class="pe-vars">' + TIENDAS.map(function (t) {
          return '<label><span>' + t.nombre + '</span><input inputmode="decimal" value="' + num(rp[t.cod]) + '" oninput="BayolEquilibrio._rp(' + t.cod + ',this.value)"><i>%</i></label>';
        }).join('') + '</div>' : '') +
        '<label class="pe-dias"><span>Parte de las ventas que lleva ITBIS</span><input inputmode="decimal" value="' + num(cvv.itbis_pct) + '" oninput="BayolEquilibrio._r(\'itbis_pct\',this.value)"></label>' +
        '<p class="pe-nota">Hoy las ventas no llevan ITBIS (0 %). Si empiezan a cobrarlo, escriba qué parte de las ventas lo lleva.</p>';
    }
    return '<div class="pe-card">' +
      '<div class="pe-card-h"><h4>' + (esTienda ? 'Gastos fijos de la tienda' : 'Gastos comunes de la empresa') + '</h4><b id="peTotFijos">' + plata(totalFijos(cod)) + '</b></div>' +
      '<div id="peGastos">' + filas + '</div>' +
      '<div class="pe-acc">' +
        '<button class="btn btn-light" onclick="BayolEquilibrio._a(' + cod + ')"><i class="ti ti-plus"></i> Agregar concepto</button>' +
        (esTienda ? '<button class="btn btn-light" onclick="BayolEquilibrio._n(' + cod + ')" title="TSS 16.29 % y regalía 8.33 % de la nómina"><i class="ti ti-calculator"></i> Calcular TSS y regalía</button>' : '') +
      '</div>' + vars +
    '</div>';
  }

  function htmlTotPrestamos() {
    var l = prestamos() || [], i = l.reduce(function (s, p) { return s + num(p.interes); }, 0), k = l.reduce(function (s, p) { return s + num(p.capital); }, 0);
    return '<span>Intereses <b>' + plata(i) + '</b></span><span>Capital <b>' + plata(k) + '</b></span><span>Cuota del mes <b>' + plata(i + k) + '</b></span>';
  }
  function htmlPrestamos(cvv) {
    var l = prestamos() || [];
    var filas = l.map(function (p, i) {
      return '<div class="pe-p">' +
        '<input class="pe-p-b" data-p="' + i + '" value="' + esc(p.banco || '') + '" placeholder="Banco o prestamista" aria-label="Banco del préstamo ' + (i + 1) + '" oninput="BayolEquilibrio._pb(' + i + ',\'banco\',this.value)">' +
        '<label><span>Intereses</span><input inputmode="decimal" value="' + (p.interes === '' || p.interes == null ? '' : num(p.interes)) + '" placeholder="0.00" oninput="BayolEquilibrio._pb(' + i + ',\'interes\',this.value)"></label>' +
        '<label><span>Capital</span><input inputmode="decimal" value="' + (p.capital === '' || p.capital == null ? '' : num(p.capital)) + '" placeholder="0.00" oninput="BayolEquilibrio._pb(' + i + ',\'capital\',this.value)"></label>' +
        '<button class="pe-x" title="Quitar préstamo" aria-label="Quitar préstamo ' + (i + 1) + '" onclick="BayolEquilibrio._pq(' + i + ')"><i class="ti ti-x"></i></button>' +
      '</div>';
    }).join('');
    var suelto = !l.length && num(cvv.capital) > 0 ? '<p class="pe-nota">Capital anotado antes: ' + plata(num(cvv.capital)) + '. Al agregar el primer préstamo se pasa a la lista.</p>' : '';
    return '<div class="pe-prest" id="pePrest"><h4>Préstamos (cuota de este mes)</h4>' + filas + suelto +
      (l.length ? '<div class="pe-p-tot" id="pePrestTot">' + htmlTotPrestamos() + '</div>' : '') +
      '<div class="pe-acc"><button class="btn btn-light" onclick="BayolEquilibrio._pa()"><i class="ti ti-plus"></i> Agregar préstamo</button></div>' +
      '<p class="pe-nota">Los intereses son gasto y pasan solos a «Intereses de préstamos». El capital no es gasto, pero sale de la caja: por eso se muestra aparte cuánto vender para pagar la cuota completa.</p></div>';
  }

  function htmlTablaGeneral(c) {
    return '<div class="pe-card"><h4>Por tienda</h4><div class="table-wrap"><table class="pe-tabla"><thead><tr><th>Tienda</th><th>Vendido</th><th>Margen</th><th>Contribución</th><th>Fijos (+ comunes)</th><th>Debe vender</th><th>Avance</th><th>Aporte (sin comunes)</th><th>' + (c.em === 'pasado' ? 'Resultado del mes' : 'Resultado a la fecha') + '</th></tr></thead><tbody>' +
      c.tiendas.map(function (x) {
        return '<tr tabindex="0" onclick="BayolEquilibrio.tab(' + x.t.cod + ')" onkeydown="if(event.key===\'Enter\')BayolEquilibrio.tab(' + x.t.cod + ')" style="cursor:pointer"><td data-label="Tienda"><b>' + esc(x.t.nombre) + '</b></td><td data-label="Vendido">' + plata(x.vn) + '</td><td data-label="Margen">' + pct(x.mb) + '</td><td data-label="Contribución">' + pct(x.mc) + '</td><td data-label="Fijos">' + plata(x.ft) + '</td><td data-label="Debe vender">' + (x.pe != null ? plata(x.pe) : '—') + '</td><td data-label="Avance">' + (x.alcanzado != null ? pct(x.alcanzado) : '—') + '</td><td data-label="Aporte" style="color:' + (x.aporte == null ? 'inherit' : colorRes(x.aporte)) + ';font-weight:700">' + (x.aporte == null ? '—' : plata(x.aporte)) + '</td><td data-label="Resultado" style="color:' + (x.resultado == null ? 'inherit' : colorRes(x.resultado)) + ';font-weight:700">' + (x.resultado == null ? '—' : plata(x.resultado)) + '</td></tr>';
      }).join('') +
      '</tbody></table></div><p class="pe-nota">El punto de equilibrio General usa el margen de todo el negocio junto; por eso no es la suma de las tiendas.</p></div>';
  }

  function refrescarCalculo() {
    var tot = $('peTotFijos'); if (tot && st.tab !== 'general') tot.textContent = plata(totalFijos(st.tab === 'comunes' ? 0 : st.tab));
    var box = $('peResumen'); if (!box) return;
    var c = calcular();
    if (st.tab === 'general' || st.tab === 'comunes') box.innerHTML = htmlResumen(c.g, 'Todas las tiendas', true, c);
    else { var x = c.tiendas.filter(function (y) { return y.t.cod === st.tab; })[0]; box.innerHTML = htmlResumen(x, x.t.nombre, false, c); }
    var est = $('peEstado'); if (est) est.textContent = st.sucio ? 'Cambios sin guardar' : '';
  }

  function pintar() {
    var cont = $('pe_contenido'); if (!cont) return;
    if (!puede()) { cont.innerHTML = '<p class="pe-vacio">Necesita permiso de Contabilidad para ver el punto de equilibrio.</p>'; return; }
    if (st.cargando) { cont.innerHTML = '<p class="pe-vacio"><i class="ti ti-loader"></i> Cargando ventas de Info Plus…</p>'; return; }
    if (st.errorTabla) { cont.innerHTML = '<p class="pe-vacio">No se pudieron cargar los gastos guardados. Toque Actualizar.</p>'; return; }
    var tabs = [{ k: 'general', t: 'General' }].concat(TIENDAS.map(function (t) { return { k: t.cod, t: t.nombre }; }), [{ k: 'comunes', t: 'Gastos comunes' }]);
    var c = calcular();
    var cuerpo;
    if (st.tab === 'general') cuerpo = '<div id="peResumen">' + htmlResumen(c.g, 'Todas las tiendas', true, c) + '</div>' + htmlTablaGeneral(c);
    else if (st.tab === 'comunes') cuerpo = '<div class="pe-grid"><div>' + htmlGastos(0) + '</div><div id="peResumen">' + htmlResumen(c.g, 'Todas las tiendas', true, c) + '</div></div>';
    else {
      var x = c.tiendas.filter(function (y) { return y.t.cod === st.tab; })[0];
      cuerpo = '<div class="pe-grid"><div>' + htmlGastos(st.tab) + '</div><div id="peResumen">' + htmlResumen(x, x.t.nombre, false, c) + '</div></div>';
    }
    cont.innerHTML =
      '<div class="pe-tabs" role="tablist">' + tabs.map(function (t) {
        return '<button role="tab" aria-selected="' + (st.tab === t.k) + '" class="pe-tab' + (st.tab === t.k ? ' on' : '') + '" onclick="BayolEquilibrio.tab(' + (typeof t.k === 'number' ? t.k : '\'' + t.k + '\'') + ')">' + esc(t.t) + '</button>';
      }).join('') + '</div>' + cuerpo +
      '<div class="pe-pie"><span id="peEstado">' + (st.sucio ? 'Cambios sin guardar' : '') + '</span>' +
        '<button class="btn btn-light" onclick="BayolEquilibrio.copiar()"><i class="ti ti-copy"></i> Copiar del mes anterior</button>' +
        '<button id="peBtnGuardar" class="btn btn-blue" onclick="BayolEquilibrio.guardar()"><i class="ti ti-device-floppy"></i> Guardar gastos del mes</button>' +
      '</div>';
  }

  // ---------- estilos ----------
  function estilos() {
    if ($('peEstilos')) return;
    var s = document.createElement('style'); s.id = 'peEstilos';
    s.textContent = [
      '#conta-equilibrio .pe-vacio{color:var(--text-muted);text-align:center;padding:24px}',
      '#conta-equilibrio .pe-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:4px 0 12px}',
      '#conta-equilibrio .pe-tab{min-height:44px;padding:0 16px;border-radius:999px;border:1px solid #e2e8f0;background:#fff;font-size:14px;font-weight:600;color:#334155;cursor:pointer}',
      '#conta-equilibrio .pe-tab.on{background:#e4572e;border-color:#e4572e;color:#fff}',
      '#conta-equilibrio .pe-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:14px;align-items:start}',
      '@media (max-width:900px){#conta-equilibrio .pe-grid{grid-template-columns:1fr}}',
      '@media (max-width:480px){#conta-equilibrio .pe-g{grid-template-columns:minmax(0,1fr) 44px;}#conta-equilibrio .pe-g-c{grid-column:1 / -1}#conta-equilibrio .pe-g-m{grid-column:1}}',
      '#conta-equilibrio .pe-card,#conta-equilibrio .pe-res{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:14px;margin-bottom:12px;box-shadow:0 6px 18px -14px rgba(15,23,42,.35)}',
      '#conta-equilibrio .pe-card h4{margin:12px 0 8px;font-size:14px;color:#0f172a}',
      '#conta-equilibrio .pe-card-h{display:flex;justify-content:space-between;align-items:center;gap:8px}',
      '#conta-equilibrio .pe-card-h h4{margin:0}',
      '#conta-equilibrio .pe-card-h b{font-size:17px;font-variant-numeric:tabular-nums}',
      '#conta-equilibrio .pe-g{display:grid;grid-template-columns:minmax(0,1fr) 150px 44px;gap:6px;margin:6px 0}',
      '#conta-equilibrio .pe-g input,#conta-equilibrio .pe-vars input,#conta-equilibrio .pe-dias input{height:48px;font-size:16px;border:1px solid #d8dee9;border-radius:10px;padding:0 10px;min-width:0;background:#fff}',
      '#conta-equilibrio .pe-g-m{text-align:right;font-variant-numeric:tabular-nums}',
      '#conta-equilibrio .pe-g input[readonly]{background:#f8fafc;color:#475569}',
      '#conta-equilibrio .pe-auto{width:44px;height:48px;display:grid;place-items:center;color:#94a3b8}',
      '#conta-equilibrio .pe-meta{border:1px solid #fde4d8;background:#fff8f4;border-radius:12px;padding:12px;margin:10px 0}',
      '#conta-equilibrio .pe-meta-h{display:flex;justify-content:space-between;align-items:baseline;gap:8px;font-size:14px;color:#0f172a}',
      '#conta-equilibrio .pe-meta-h span{font-size:13px;color:#b45309;font-weight:700}',
      '#conta-equilibrio .pe-meta-n{font-size:22px;font-weight:800;font-variant-numeric:tabular-nums;margin:4px 0}',
      '#conta-equilibrio .pe-meta-s{font-size:13px;color:#475569;margin:6px 0 0}',
      '#conta-equilibrio .pe-meta-f{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}',
      '#conta-equilibrio .pe-meta-f input{flex:1 1 160px;height:48px;font-size:16px;border:1px solid #d8dee9;border-radius:10px;padding:0 10px;text-align:right;font-variant-numeric:tabular-nums;background:#fff;min-width:0}',
      '#conta-equilibrio .pe-meta-f .btn{min-height:48px;font-size:14px}',
      '#conta-equilibrio .pe-prest{margin-top:14px;padding-top:4px;border-top:1px solid #eef2f7}',
      '#conta-equilibrio .pe-p{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr) minmax(0,1fr) 44px;gap:6px;align-items:end;margin:6px 0}',
      '#conta-equilibrio .pe-p label{display:flex;flex-direction:column;gap:2px;font-size:13px;color:#64748b;min-width:0}',
      '#conta-equilibrio .pe-p input{height:48px;font-size:16px;border:1px solid #d8dee9;border-radius:10px;padding:0 10px;min-width:0;width:100%;box-sizing:border-box;background:#fff}',
      '#conta-equilibrio .pe-p label input{text-align:right;font-variant-numeric:tabular-nums}',
      '@media (max-width:480px){#conta-equilibrio .pe-p{grid-template-columns:minmax(0,1fr) minmax(0,1fr) 44px}#conta-equilibrio .pe-p-b{grid-column:1 / -1}}',
      '#conta-equilibrio .pe-p-tot{display:flex;flex-wrap:wrap;gap:6px 14px;justify-content:flex-end;font-size:13px;color:#475569;margin:8px 0 0}',
      '#conta-equilibrio .pe-p-tot b{color:#0f172a;font-variant-numeric:tabular-nums}',
      '#conta-equilibrio .pe-x{width:44px;height:48px;border:1px solid #e2e8f0;border-radius:10px;background:#fff;color:#64748b;cursor:pointer}',
      '#conta-equilibrio .pe-acc{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}',
      '#conta-equilibrio .pe-acc .btn,#conta-equilibrio .pe-pie .btn{min-height:44px;font-size:14px}',
      '#conta-equilibrio .pe-vars{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px}',
      '#conta-equilibrio .pe-vars label,#conta-equilibrio .pe-dias{display:grid;grid-template-columns:minmax(0,1fr) 80px 18px;align-items:center;gap:6px;font-size:13px;color:#334155}',
      '#conta-equilibrio .pe-dias{grid-template-columns:minmax(0,1fr) 80px;margin-top:10px}',
      '#conta-equilibrio .pe-vars input,#conta-equilibrio .pe-dias input{text-align:right}',
      '#conta-equilibrio .pe-rep{display:flex;flex-direction:column;gap:2px}',
      '#conta-equilibrio .pe-rep label,#conta-equilibrio .pe-itbis{display:flex;align-items:center;gap:8px;min-height:44px;font-size:14px;cursor:pointer}',
      '#conta-equilibrio .pe-rep input,#conta-equilibrio .pe-itbis input{width:20px;height:20px}',
      '#conta-equilibrio .pe-res-h{display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap}',
      '#conta-equilibrio .pe-res-h b{font-size:17px}',
      '#conta-equilibrio .pe-res-h span{font-size:13px;color:#475569}',
      '#conta-equilibrio .pe-barra{height:10px;border-radius:999px;background:#f1f5f9;overflow:hidden;margin:8px 0 12px}',
      '#conta-equilibrio .pe-barra i{display:block;height:100%;border-radius:999px;transition:width .25s}',
      '#conta-equilibrio .pe-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px}',
      '#conta-equilibrio .pe-kpi{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:9px 11px;display:flex;flex-direction:column;gap:2px}',
      '#conta-equilibrio .pe-kpi small{font-size:13px;color:#475569}',
      '#conta-equilibrio .pe-kpi b{font-size:18px;font-variant-numeric:tabular-nums}',
      '#conta-equilibrio .pe-kpi span{font-size:13px;color:#475569}',
      '#conta-equilibrio .pe-avisos{margin:10px 0 0;padding-left:18px;font-size:13px;color:#7c2d12}',
      '#conta-equilibrio .pe-avisos li{margin:3px 0}',
      '#conta-equilibrio .pe-nota{margin:8px 0 0;font-size:13px;color:#475569}',
      '#conta-equilibrio .pe-tabla{width:100%;font-size:13px;font-variant-numeric:tabular-nums}',
      '#conta-equilibrio .pe-tabla tbody tr:hover{background:#fff7ed}',
      '#conta-equilibrio .pe-pie{display:flex;justify-content:flex-end;align-items:center;gap:8px;flex-wrap:wrap;margin-top:6px}',
      '#conta-equilibrio .pe-pie span{font-size:13px;color:#b45309;margin-right:auto}',
      '@media (prefers-reduced-motion:reduce){#conta-equilibrio .pe-barra i{transition:none}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  // ---------- pestaña ----------
  function asegurarPestana() {
    var barra = $('contaTabMensual') && $('contaTabMensual').parentElement;
    if (!barra || $('contaTabPE')) return;
    var b = document.createElement('button');
    b.id = 'contaTabPE'; b.className = 'btn btn-light'; b.style.fontSize = '13px'; b.style.minHeight = '44px';
    b.innerHTML = '<i class="ti ti-scale"></i> Punto de equilibrio';
    b.onclick = function () { window.contaTab('equilibrio'); };
    barra.insertBefore(b, $('contaTabMensual').nextSibling);
    var mensual = $('conta-mensual');
    var div = document.createElement('div'); div.id = 'conta-equilibrio'; div.style.display = 'none';
    div.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:4px;">' +
        '<h3 style="margin:0;"><i class="ti ti-scale" style="color:#e4572e;"></i> Punto de equilibrio por tienda ' +
        '<button onclick="BayolEquilibrio.ayuda()" title="Ayuda" aria-label="Ayuda" style="background:none;border:none;cursor:pointer;color:#475569;font-size:15px;vertical-align:middle;padding:0 3px;min-width:44px;min-height:44px;"><i class="ti ti-info-circle"></i></button></h3>' +
        '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;"><input type="month" id="pe_mes" style="height:48px;font-size:16px;" onchange="BayolEquilibrio.mes(this.value)">' +
        '<button class="btn btn-light" style="min-height:44px;font-size:14px;" onclick="BayolEquilibrio.recargar()"><i class="ti ti-refresh"></i> Actualizar</button></div>' +
      '</div>' +
      '<div id="pe_contenido"></div>';
    if (mensual && mensual.parentNode) mensual.parentNode.insertBefore(div, mensual.nextSibling);
  }
  function mostrarBoton() { var b = $('contaTabPE'); if (b) b.style.display = puede() ? '' : 'none'; }

  function abrir() {
    asegurarPestana(); estilos();
    var pe = $('conta-equilibrio'); if (pe) pe.style.display = '';
    var b = $('contaTabPE'); if (b) b.className = 'btn btn-blue';
    var m = $('pe_mes'); if (!st.mes) st.mes = mesHoy(); if (m) m.value = st.mes;
    if (st.sucio || st.cargando) pintar(); else cargar();
  }
  function cerrar() { var pe = $('conta-equilibrio'); if (pe) pe.style.display = 'none'; var b = $('contaTabPE'); if (b) b.className = 'btn btn-light'; }

  function envolver() {
    if (typeof window.contaTab !== 'function' || window.contaTab._pe) return false;
    var orig = window.contaTab;
    var nuevo = function (name) {
      asegurarPestana(); mostrarBoton();
      if (name === 'equilibrio') {
        if (!puede()) { name = 'mensual'; }
        else {
          orig('__ninguna__');
          try { localStorage.setItem('bayol_subtab_conta', 'equilibrio'); } catch (e) {}
          abrir(); return;
        }
      }
      cerrar();
      return orig.call(this, name);
    };
    nuevo._pe = true;
    window.contaTab = nuevo;
    return true;
  }

  function ayuda() {
    var html = '<p><b>¿Para qué sirve?</b> Le indica cuánto debe vender cada tienda para cubrir sus gastos del mes.</p>' +
      '<ul style="padding-left:18px;margin:6px 0;"><li>Usted anota a mano los gastos fijos de cada tienda y los gastos comunes de la empresa.</li>' +
      '<li>Las ventas y el costo salen solos de Info Plus.</li>' +
      '<li>Los gastos comunes se reparten entre las tiendas según lo que vende cada una (o como usted elija).</li>' +
      '<li>«General» suma las tres tiendas y los gastos comunes.</li></ul>' +
      '<p>Los montos son de referencia; la contadora confirma las cifras formales.</p>';
    if (typeof abrirAyuda === 'function') abrirAyuda('Punto de equilibrio', html); else alert(html.replace(/<[^>]+>/g, ' '));
  }

  window.BayolEquilibrio = {
    tab: function (k) { if (k !== 'general' && k !== 'comunes' && !TIENDAS.some(function (t) { return t.cod === k; })) return; st.tab = k; pintar(); },
    mes: function (v) {
      if (!v) return;
      var seguir = function () { st.mes = v; st.filas = {}; var m = $('pe_mes'); if (m) m.value = v; cargar(); };
      if (st.sucio && typeof confirmar === 'function') confirmar('Hay cambios sin guardar. ¿Cambiar de mes y perderlos?').then(function (ok) { if (ok) seguir(); else { var m = $('pe_mes'); if (m) m.value = st.mes; } });
      else seguir();
    },
    recargar: function () {
      if (st.sucio && typeof confirmar === 'function') { confirmar('Hay cambios sin guardar. ¿Actualizar y perderlos?').then(function (ok) { if (ok) cargar(); }); return; }
      cargar();
    },
    guardar: function () { guardar(null); },
    copiar: copiarMesAnterior,
    ayuda: ayuda,
    calcular: calcular,
    _estado: function () { return st; },
    _m: editMonto, _c: editConcepto, _a: agregarConcepto, _q: quitarConcepto, _v: editVar, _d: editDias, _r: editComun, _rp: editRepartoPct, _n: sugerirNomina, _pb: editPrestamo, _pa: agregarPrestamo, _pq: quitarPrestamo, _mt: editMeta, _ms: usarMetaSugerida
  };

  function iniciar() {
    if (!envolver()) { setTimeout(iniciar, 300); return; }
    asegurarPestana(); mostrarBoton();
    var v = $('v-contabilidad');
    if (v && v.classList.contains('active')) { try { if (localStorage.getItem('bayol_subtab_conta') === 'equilibrio') window.contaTab('equilibrio'); } catch (e) {} }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
