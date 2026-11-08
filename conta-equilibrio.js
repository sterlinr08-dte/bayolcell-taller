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
    var usaAnt = com.reparto === 'venta' && base === 'anterior';
    var errAnt = usaAnt && TIENDAS.some(function (t) { return st.ventasAnt[t.cod] && st.ventasAnt[t.cod].error; });
    return { tiendas: tiendas, g: g, itbis: itbis, g18: g18, em: em, repMal: repMal, repSuma: repSuma, errVentas: errVentas,
      base: base, sinAnt: usaAnt && !errAnt && sumAnt <= 0, errAnt: errAnt, errDiario: !!st.errDiario, errCN: !!st.errCN, cn: st.cn || {} };
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
    // Paso 1 de la auditoría untangle (dueño, 08-nov-2026): un fallo de lectura se marca y se avisa; nunca queda como 0 en silencio.
    var ventas = {}, ventasAnt = {}, cn = {}, errCN = false, errDiario = false, pa = periodo(mesAnterior(st.mes));
    async function leer(per, cod) {
      var rv = await cli.rpc('estado_mensual_cat', { p_ini: per.ini, p_fin: per.fin, p_localidad: cod });
      if (rv.error) throw rv.error;
      var v = 0, c = 0; (rv.data || []).forEach(function (x) { v += Number(x.venta) || 0; c += Number(x.costo) || 0; });
      return { venta: v, costo: c };
    }
    await Promise.all(TIENDAS.map(async function (t) {
      try { ventas[t.cod] = await leer(p, t.cod); }
      catch (e) { ventas[t.cod] = { venta: 0, costo: 0, error: true }; if (typeof logError === 'function') logError('equilibrio ventas', e); }
      try { ventasAnt[t.cod] = await leer(pa, t.cod); }
      catch (e) { ventasAnt[t.cod] = { venta: 0, costo: 0, error: true }; if (typeof logError === 'function') logError('equilibrio ventas mes anterior', e); }
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
    } catch (e) { errCN = true; if (typeof logError === 'function') logError('equilibrio notas de crédito', e); }
    // Venta por día y vendedor (mes anterior + este mes) para las metas diaria/semanal/quincenal (07-nov-2026).
    var diario = [];
    try {
      var rd = await cli.rpc('ventas_diarias_vendedor', { p_ini: pa.ini, p_fin: p.fin });
      if (rd.error) throw rd.error;
      diario = rd.data || [];
    } catch (e) { errDiario = true; if (typeof logError === 'function') logError('equilibrio ventas diarias', e); }
    if (token !== st.token) return;
    st.diario = diario; st.errDiario = errDiario; st.errCN = errCN;
    st.ventas = ventas; st.ventasAnt = ventasAnt; st.cn = cn; st.cargando = false; st.sucio = false; st.animar = true;
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

  function erroresCarga(c) {
    var e = [];
    if (c.errVentas) e.push('No se pudieron leer las ventas de Info Plus de este mes.');
    if (c.errAnt) e.push('No se pudo leer la venta de ' + nombreMes(mesAnterior(st.mes)).toLowerCase() + ': los gastos comunes se están repartiendo en partes iguales, de forma provisional.');
    if (c.errDiario) e.push('No se pudo leer la venta por día: las metas por periodo y de vendedores no muestran lo vendido.');
    if (c.errCN) e.push('No se pudieron leer las notas de crédito: la venta ya viene neta, solo falta el detalle de devoluciones.');
    return e;
  }
  function htmlErrores(c) {
    var e = erroresCarga(c); if (!e.length) return '';
    return '<div class="pe-errores" role="alert"><b>Faltan datos</b><ul>' + e.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
      '<button type="button" onclick="BayolEquilibrio.recargar()"><i class="ti ti-refresh"></i> Volver a intentar</button></div>';
  }
  function htmlResumen(x, nombre, esGeneral, c) {
    var itbis = c.itbis, avisos = [];
    if (c.errVentas) { /* lo dice el recuadro «Faltan datos» */ }
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
      htmlErrores(c) +
      htmlMeta(x, esGeneral) +
      htmlPeriodos(esGeneral ? c.tiendas : [x], esGeneral) + (esGeneral ? '' : htmlVendedores(x)) +
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

  // ---------- metas por periodo y por vendedor (dueño, 07-nov-2026) ----------
  // La meta del mes de cada tienda (la fija el dueño) se reparte por días hábiles del calendario: diaria, semanal y
  // quincenal (1–15 y 16–fin). La de cada vendedor = meta de la quincena × su %. El % sale solo de lo que vendió el
  // mes anterior en esa tienda; el dueño lo puede cambiar (variables.vend_pct).
  function f2(n) { return String(n).padStart(2, '0'); }
  function fISO(d) { return d.getFullYear() + '-' + f2(d.getMonth() + 1) + '-' + f2(d.getDate()); }
  function diasRango(mes, domingo, d1, d2) {
    var p = mes.split('-'), y = +p[0], m = +p[1] - 1, n = 0;
    for (var d = d1; d <= d2; d++) { var dow = new Date(y, m, d).getDay(); if (dow !== 0 || domingo) n++; }
    return n;
  }
  function vendido(cods, desde, hasta, emp) {
    return (st.diario || []).reduce(function (s, r) {
      if (cods.indexOf(Number(r.codlocalidad)) < 0 || r.fecha < desde || r.fecha > hasta) return s;
      if (emp != null && String(r.codempleado) !== String(emp)) return s;
      return s + (Number(r.venta) || 0);
    }, 0);
  }
  // Periodos del mes con su meta y lo vendido. tiendas = lista de objetos de calcular() (una o todas).
  function periodosMeta(tiendas) {
    var mes = st.mes, p = mes.split('-'), y = +p[0], m = +p[1] - 1, ult = new Date(y, m + 1, 0).getDate(), em = estadoMes(mes);
    var hoy = new Date(), dHoy = em === 'actual' ? hoy.getDate() : null;
    var cods = tiendas.map(function (x) { return x.t.cod; });
    function meta(d1, d2) {
      return tiendas.reduce(function (s, x) { var tot = diasRango(mes, x.t.domingo, 1, ult); return s + (x.meta > 0 && tot ? x.meta * diasRango(mes, x.t.domingo, d1, d2) / tot : 0); }, 0);
    }
    function fila(nombre, d1, d2, actual) {
      var mt = meta(d1, d2), v = (em === 'futuro' || (em === 'actual' && d1 > dHoy)) ? null : vendido(cods, mes + '-' + f2(d1), mes + '-' + f2(d2));
      return { nombre: nombre, d1: d1, d2: d2, meta: mt, vendido: v, avance: mt > 0 && v != null ? v / mt : null, actual: !!actual };
    }
    var out = [];
    if (em === 'actual') {
      var dow = hoy.getDay(), lun = dHoy - ((dow + 6) % 7), dom = lun + 6;
      out.push(fila('Hoy (' + hoy.toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric' }) + ')', dHoy, dHoy, true));
      out.push(fila('Esta semana (' + Math.max(1, lun) + ' al ' + Math.min(ult, dom) + ')', Math.max(1, lun), Math.min(ult, dom), true));
    } else {
      // Mes pasado o futuro: la meta de un día hábil como referencia.
      var r = fila('Un día hábil', 1, 1); r.meta = tiendas.reduce(function (s, x) { var tot = diasRango(mes, x.t.domingo, 1, ult); return s + (x.meta > 0 && tot ? x.meta / tot : 0); }, 0); r.vendido = null; r.avance = null; out.push(r);
    }
    out.push(fila('1ª quincena (1 al 15)', 1, 15, dHoy != null && dHoy <= 15));
    out.push(fila('2ª quincena (16 al ' + ult + ')', 16, ult, dHoy != null && dHoy > 15));
    out.push(fila('Mes completo', 1, ult));
    return out;
  }
  // Anillo de progreso (SVG): el arco crece hasta el % logrado; verde al cumplir.
  function anillo(a, tam, color) {
    var r = (tam - 8) / 2, c = 2 * Math.PI * r, p = a == null ? 0 : Math.max(0, Math.min(1, a));
    var col = color || (a == null ? '#cbd5e1' : (a >= 1 ? '#16a34a' : '#e4572e'));
    return '<svg class="pe-ring" width="' + tam + '" height="' + tam + '" viewBox="0 0 ' + tam + ' ' + tam + '" aria-hidden="true">' +
      '<circle cx="' + tam / 2 + '" cy="' + tam / 2 + '" r="' + r + '" fill="none" stroke="#eef2f7" stroke-width="7"/>' +
      '<circle cx="' + tam / 2 + '" cy="' + tam / 2 + '" r="' + r + '" fill="none" stroke="' + col + '" stroke-width="7" stroke-linecap="round" ' +
      'stroke-dasharray="' + (c * p).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 ' + tam / 2 + ' ' + tam / 2 + ')"/></svg>';
  }
  function pctC(a) { return a == null ? '—' : (a >= 1 ? Math.round(a * 100) : Math.round(a * 1000) / 10).toLocaleString('es-DO') + ' %'; }
  function corto(n) { n = Number(n) || 0; var a = Math.abs(n); return 'RD$ ' + (a >= 1e6 ? (n / 1e6).toLocaleString('es-DO', { maximumFractionDigits: 2 }) + ' M' : a >= 1e4 ? Math.round(n / 1000).toLocaleString('es-DO') + ' mil' : Math.round(n).toLocaleString('es-DO')); }
  function htmlPeriodos(tiendas, esGeneral) {
    if (!tiendas.some(function (x) { return x.meta > 0; })) return '';
    var per = periodosMeta(tiendas), em = estadoMes(st.mes);
    // Cuatro tarjetas: Hoy · Semana · Quincena (la en curso; la otra debajo) · Mes. En mes pasado/futuro: día hábil · 1ª · 2ª · mes.
    var q1 = per.filter(function (r) { return r.d1 === 1 && r.d2 === 15; })[0], q2 = per.filter(function (r) { return r.d1 === 16; })[0];
    var tarjetas = em === 'actual' ? [per[0], per[1], q1.actual ? q1 : q2, per[per.length - 1]] : [per[0], q1, q2, per[per.length - 1]];
    var etiqueta = function (r) { return r.nombre.replace(/\s*\(.*\)$/, ''); }, detalle = function (r) { var m = r.nombre.match(/\((.*)\)$/); return m ? m[1] : ''; };
    var html = tarjetas.map(function (r) {
      var falta = r.vendido != null && r.meta > 0 ? r.meta - r.vendido : null;
      return '<div class="pe-pt' + (r.actual ? ' on' : '') + '">' +
        '<div class="pe-pt-h"><span>' + esc(etiqueta(r)) + '</span><small>' + esc(detalle(r)) + '</small></div>' +
        '<div class="pe-pt-c">' + anillo(r.avance, 48) + '<b>' + pctC(r.avance) + '</b></div>' +
        '<div class="pe-pt-m">' + (r.vendido == null ? '<span>Meta</span><b>' + corto(r.meta) + '</b>' : '<span>Vendido</span><b>' + corto(r.vendido) + '</b><span>Meta</span><b>' + corto(r.meta) + '</b>') + '</div>' +
        '<div class="pe-pt-f">' + (falta == null ? (r.vendido == null && em === 'actual' ? 'Todavía no empieza' : '&nbsp;') : falta > 0 ? 'Faltan <b>' + corto(falta) + '</b>' : '<b class="ok">✓ Cumplida</b>') + '</div>' +
      '</div>';
    }).join('');
    var otra = em === 'actual' ? (q1.actual ? q2 : q1) : null;
    return '<section class="pe-per" aria-label="Meta por periodo"><header><h5>Meta por periodo</h5><span>' + (esGeneral ? 'Todas las tiendas' : esc(tiendas[0].t.nombre)) + '</span></header>' +
      '<div class="pe-pt-g">' + html + '</div>' +
      (otra ? '<p class="pe-pt-o">' + esc(otra.nombre) + ': meta ' + plata(otra.meta) + (otra.vendido != null ? ' · vendido ' + plata(otra.vendido) + ' (' + pct(otra.avance) + ')' : '') + '</p>' : '') +
      '<p class="pe-nota">Se reparte por días hábiles' + (esGeneral ? ' de cada tienda' : (tiendas[0].t.domingo ? ', con domingos' : ', de lunes a sábado')) + '. Ventas de Info Plus, ya restadas las devoluciones.</p></section>';
  }
  // Vendedores de una tienda con su % (guardado o según el mes anterior).
  // Códigos de Info Plus aclarados por el dueño (07-nov-2026). vende:false = no lleva meta de vendedor
  // (sus ventas siguen contando en el total de la tienda). Loribel tiene dos códigos: 249 y 750.
  var CODIGOS_IP = {
    '697': { nombre: 'Esther Reyes', vende: true },
    '750': { nombre: 'Loribel Ventura', vende: false },
    '249': { nombre: 'Loribel Ventura', vende: false },
    '6': { nombre: 'Yves', vende: false }
  };
  function vendedoresTienda(cod) {
    var mes = st.mes, ant = mesAnterior(mes), emps = {}, nombres = {};
    (st.diario || []).forEach(function (r) {
      if (Number(r.codlocalidad) !== cod) return;
      var info = CODIGOS_IP[String(r.codempleado)];
      if (info && !info.vende) return;
      if (info) r = Object.assign({}, r, { nombre: info.nombre });
      var k = String(r.codempleado); nombres[k] = nombres[k] || r.nombre;
      if (!emps[k]) emps[k] = { ant: 0, act: 0 };
      if (r.fecha.slice(0, 7) === ant) emps[k].ant += Number(r.venta) || 0; else emps[k].act += Number(r.venta) || 0;
    });
    var guard = (fila(cod).variables || {}).vend_pct || null;
    if (guard) Object.keys(guard).forEach(function (k) { if (!emps[k] && !(CODIGOS_IP[k] && !CODIGOS_IP[k].vende)) emps[k] = { ant: 0, act: 0 }; });
    var lista = Object.keys(emps).map(function (k) { return { cod: k, nombre: nombres[k] ? (CODIGOS_IP[k] ? CODIGOS_IP[k].nombre : String(nombres[k]).split(' ')[0]) : null, ant: Math.max(0, emps[k].ant), act: Math.max(0, emps[k].act) }; });
    var tAnt = lista.reduce(function (s, e) { return s + e.ant; }, 0), tAct = lista.reduce(function (s, e) { return s + e.act; }, 0);
    lista.forEach(function (e) {
      e.sug = tAnt > 0 ? e.ant / tAnt * 100 : (tAct > 0 ? e.act / tAct * 100 : 100 / (lista.length || 1));
      e.pct = guard ? num(guard[e.cod]) : Math.round(e.sug * 10) / 10;
    });
    // Sin % guardado, se esconden los que no vendieron nada (ni el mes anterior ni este).
    return lista.filter(function (e) { return guard ? (e.cod in guard || e.act > 0) : (e.ant > 0 || e.act > 0); })
      .sort(function (a, b) { return b.pct - a.pct || b.act - a.act; });
  }
  // Meta por vendedor: ranking (A) con ritmo (C) — dueño, 07-nov-2026. Se ordena por % logrado; la raya «hoy» marca
  // dónde debería ir para cumplir la quincena. Las metas (% o pesos) se editan en una hoja aparte (#peVendSheet).
  function quincenaVista(x) {
    var per = periodosMeta([x]), q1 = per.filter(function (r) { return r.d1 === 1 && r.d2 === 15; })[0], q2 = per.filter(function (r) { return r.d1 === 16; })[0];
    var em = estadoMes(st.mes), q = st.vendQ === 2 ? q2 : st.vendQ === 1 ? q1 : (em === 'actual' && q2.actual ? q2 : q1);
    var ult = q2.d2, hoy = new Date(), dHoy = em === 'actual' ? hoy.getDate() : (em === 'pasado' ? ult + 1 : 0);
    var tot = diasRango(st.mes, x.t.domingo, q.d1, q.d2);
    var hechos = dHoy <= q.d1 ? 0 : diasRango(st.mes, x.t.domingo, q.d1, Math.min(q.d2, dHoy - 1));   // hasta ayer
    var quedan = dHoy > q.d2 ? 0 : diasRango(st.mes, x.t.domingo, Math.max(q.d1, dHoy), q.d2);       // hoy incluido
    return { q: q, q1: q1, q2: q2, ideal: tot ? hechos / tot : 0, quedan: quedan, futura: dHoy <= q.d1 && em !== 'pasado' && !(em === 'actual' && dHoy === q.d1) };
  }
  function htmlVendedores(x) {
    if (!(x.meta > 0)) return '';
    var lista = vendedoresTienda(x.t.cod); if (!lista.length) return '';
    var V = quincenaVista(x), q = V.q, suma = lista.reduce(function (s, e) { return s + e.pct; }, 0), ok = Math.abs(suma - 100) <= 0.5;
    var filas = lista.map(function (e) {
      var mt = q.meta * e.pct / 100, v = V.futura ? 0 : vendido([x.t.cod], st.mes + '-' + f2(q.d1), st.mes + '-' + f2(q.d2), e.cod);
      return { e: e, mt: mt, v: v, a: mt > 0 ? v / mt : null };
    }).sort(function (a, b) { return (b.a || 0) - (a.a || 0); });
    var html = filas.map(function (f, i) {
      var e = f.e, nom = e.nombre ? String(e.nombre).toLowerCase().replace(/(^|\s)\S/g, function (c) { return c.toUpperCase(); }) : 'Código ' + e.cod;
      var ini = e.nombre ? nom.charAt(0) : String(e.cod).slice(0, 3), a = f.a, w = a == null ? 0 : Math.max(0, Math.min(1, a)) * 100;
      var esperado = f.mt * V.ideal, dif = f.v - esperado, falta = Math.max(0, f.mt - f.v);
      var chip = V.futura ? '<span class="pe-chip">Empieza el ' + q.d1 + '</span>'
        : a != null && a >= 1 ? '<span class="pe-chip ok">✓ Cumplida</span>'
        : V.quedan === 0 ? '<span class="pe-chip mal">Faltó ' + corto(falta) + '</span>'
        : dif >= 0 ? '<span class="pe-chip ok">Adelantada ' + corto(dif) + '</span>' : '<span class="pe-chip mal">Atrasada ' + corto(-dif) + '</span>';
      var pie = V.futura ? 'Meta ' + plata(f.mt)
        : (a != null && a >= 1) || V.quedan === 0 ? 'Lleva <b>' + corto(f.v) + '</b> de ' + corto(f.mt)
        : 'Lleva <b>' + corto(f.v) + '</b> · necesita <b>' + corto(falta / V.quedan) + '/día</b>';
      return '<li class="pe-rk"><span class="pe-rk-n">' + (i + 1) + '</span>' +
        '<span class="pe-rk-av' + (e.nombre ? '' : ' sin') + '">' + anillo(V.futura ? null : a, 52, V.futura ? null : ((a != null && a >= 1) || (V.quedan > 0 && dif >= 0) ? '#16a34a' : '#e4572e')) + '<i>' + esc(ini) + '</i></span>' +
        '<div class="pe-rk-c"><div class="pe-rk-h"><b>' + esc(nom) + '</b><span class="pe-rk-p">' + (V.futura ? '—' : pctC(a)) + '</span></div>' +
          '<div class="pe-trk" aria-hidden="true"><i style="width:' + w.toFixed(1) + '%;background:' + (a != null && a >= 1 ? '#16a34a' : (V.futura || dif >= 0 ? '#16a34a' : '#e4572e')) + '"></i>' +
            (V.futura || V.quedan === 0 ? '' : '<s style="left:' + (V.ideal * 100).toFixed(1) + '%"></s>') + '</div>' +
          '<div class="pe-rk-f"><span>' + pie + '</span>' + chip + '</div></div></li>';
    }).join('');
    var em = estadoMes(st.mes);
    return '<section class="pe-per" aria-label="Meta por vendedor"><header><h5>Meta por vendedor</h5>' +
        '<span>' + (V.futura ? 'todavía no empieza' : V.quedan ? 'quedan ' + V.quedan + ' día' + (V.quedan === 1 ? '' : 's') : 'quincena cerrada') + '</span></header>' +
      '<div class="pe-qseg" role="tablist">' + [V.q1, V.q2].map(function (r, i) {
        var on = r === q; return '<button type="button" role="tab" aria-selected="' + on + '" class="' + (on ? 'on' : '') + '" onclick="BayolEquilibrio._vq(' + (i + 1) + ')">' + (i ? '2ª quincena · 16 al ' + r.d2 : '1ª quincena · 1 al 15') + '</button>';
      }).join('') + '</div>' +
      (V.futura || !V.quedan ? '' : '<p class="pe-leyenda"><s></s> dónde debería ir hoy para cumplir</p>') +
      (ok ? '' : '<p class="pe-alerta">Las metas suman ' + (Math.round(suma * 10) / 10) + ' % de la tienda. Deben sumar 100 %.</p>') +
      '<ol class="pe-rkl">' + html + '</ol>' +
      '<div class="pe-acc"><button class="btn btn-light" onclick="BayolEquilibrio._vs(' + x.t.cod + ')"><i class="ti ti-adjustments"></i> Editar metas</button></div>' +
      '<p class="pe-nota">La raya negra marca dónde debería ir cada uno hoy para cumplir la quincena' + (x.t.domingo ? ' (cuenta los domingos)' : '') + '. Se ordena solo: el que va mejor, arriba.</p></section>';
  }
  // Hoja para editar las metas (% o pesos por mes) de los vendedores de una tienda.
  function htmlHojaVend(cod) {
    var x = calcular().tiendas.filter(function (y) { return y.t.cod === cod; })[0]; if (!x) return '';
    var lista = vendedoresTienda(cod), suma = lista.reduce(function (s, e) { return s + e.pct; }, 0), ok = Math.abs(suma - 100) <= 0.5;
    return '<div class="pe-sh-h"><b>Metas de ' + esc(x.t.nombre) + '</b><button type="button" aria-label="Cerrar" onclick="BayolEquilibrio._vc()"><i class="ti ti-x"></i></button></div>' +
      '<p class="pe-sh-s">Meta del mes de la tienda: <b>' + plata(x.meta) + '</b> · <span class="pe-suma' + (ok ? '' : ' mal') + '">' + (ok ? 'Suma 100 %' : 'Suma ' + (Math.round(suma * 10) / 10) + ' %') + '</span></p>' +
      '<ul class="pe-vl">' + lista.map(function (e) {
        var nom = e.nombre ? String(e.nombre).toLowerCase().replace(/(^|\s)\S/g, function (c) { return c.toUpperCase(); }) : 'Código ' + e.cod;
        return '<li class="pe-v"><div class="pe-v-h"><span class="pe-av' + (e.nombre ? '' : ' sin') + '" aria-hidden="true">' + esc(e.nombre ? nom.charAt(0) : String(e.cod).slice(0, 3)) + '</span>' +
          '<div class="pe-v-n"><b>' + esc(nom) + '</b><small>Mes anterior ' + pctC(e.sug / 100) + '</small></div>' +
          '<div class="pe-v-in"><label class="pe-v-p"><input inputmode="decimal" aria-label="Porcentaje de ' + esc(nom) + '" value="' + Math.round(e.pct * 100) / 100 + '" onchange="BayolEquilibrio._vp(' + cod + ',\'' + esc(e.cod) + '\',this.value)"><span>%</span></label>' +
          '<label class="pe-v-p pe-v-m"><span>RD$</span><input inputmode="decimal" aria-label="Meta del mes en pesos de ' + esc(nom) + '" value="' + Math.round(x.meta * e.pct / 100).toLocaleString('es-DO') + '" onchange="BayolEquilibrio._vm(' + cod + ',\'' + esc(e.cod) + '\',this.value)"><span>al mes</span></label></div></div></li>';
      }).join('') + '</ul>' +
      '<div class="pe-acc"><button class="btn btn-light" onclick="BayolEquilibrio._vr(' + cod + ')"><i class="ti ti-refresh"></i> Repartir según el mes anterior</button>' +
      '<button class="btn btn-blue" onclick="BayolEquilibrio._vc()">Listo</button></div>' +
      '<p class="pe-nota">Escriba el % o la meta del mes en pesos; el otro se calcula solo. Se guarda con «Guardar gastos del mes».</p>';
  }
  function hojaVend(cod) {
    st.vendSheet = cod;
    var fondo = $('peVendSheet');
    if (!fondo) {
      fondo = document.createElement('div'); fondo.id = 'peVendSheet'; fondo.className = 'pe-sh-f';
      fondo.innerHTML = '<div class="pe-sh" role="dialog" aria-modal="true" aria-label="Editar metas de vendedores"></div>';
      fondo.addEventListener('pointerdown', function (e) { if (e.target === fondo) cerrarHoja(); });
      document.addEventListener('keydown', escHoja, true);
      ($('conta-equilibrio') || document.body).appendChild(fondo);
      requestAnimationFrame(function () { fondo.classList.add('on'); });
    }
    fondo.firstChild.innerHTML = htmlHojaVend(cod);
  }
  function escHoja(e) { if (e.key === 'Escape') cerrarHoja(); }
  function cerrarHoja() {
    st.vendSheet = null; var f = $('peVendSheet'); document.removeEventListener('keydown', escHoja, true);
    if (f) { f.classList.remove('on'); setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 220); }
  }
  function editVendPct(cod, emp, v) {
    var f = fila(cod); f.variables = f.variables || {};
    if (!f.variables.vend_pct) { var o = {}; vendedoresTienda(cod).forEach(function (e) { o[e.cod] = e.pct; }); f.variables.vend_pct = o; }
    f.variables.vend_pct[emp] = Math.min(100, num(v)); st.sucio = true; pintar();
  }
  // Meta en pesos del vendedor (al mes): se guarda como % de la meta de la tienda.
  function editVendMonto(cod, emp, v) {
    var meta = num((fila(cod).variables || {}).meta);
    if (!meta) { aviso('Fije primero la meta del mes de la tienda.', 'error'); return; }
    editVendPct(cod, emp, Math.round(num(v) / meta * 1e6) / 1e4);
  }
  function repartirVend(cod) { var f = fila(cod); if (f.variables) delete f.variables.vend_pct; st.sucio = true; pintar(); }

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

  // ---------- selector de mes estilo iPhone (07-nov-2026): ‹ Noviembre 2026 › y tarjeta con los 12 meses ----------
  var MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  function etiquetaMes(mes) { var p = (mes || mesHoy()).split('-'); return MESES[+p[1] - 1] + ' ' + p[0]; }
  function sumarMes(mes, d) { var p = mes.split('-'), dt = new Date(+p[0], +p[1] - 1 + d, 1); return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0'); }
  function mesPaso(d) { cerrarMeses(); window.BayolEquilibrio.mes(sumarMes(st.mes || mesHoy(), d)); }
  function cerrarMeses() {
    var pop = $('peMesPop'); if (!pop) return;
    var b = $('peMesTxt'); if (b) b.setAttribute('aria-expanded', 'false');
    pop.classList.remove('on'); setTimeout(function () { if (pop.parentNode) pop.parentNode.removeChild(pop); }, 160);
    document.removeEventListener('pointerdown', fueraMeses, true); document.removeEventListener('keydown', escMeses, true);
  }
  function fueraMeses(e) { var w = $('peMes'); if (w && !w.contains(e.target)) cerrarMeses(); }
  function escMeses(e) { if (e.key === 'Escape') { cerrarMeses(); var b = $('peMesTxt'); if (b) b.focus(); } }
  function pintarMeses(pop, anio) {
    var sel = st.mes || mesHoy(), hoy = mesHoy();
    pop.innerHTML = '<div class="pe-mp-h"><button type="button" aria-label="Año anterior" data-y="-1"><i class="ti ti-chevron-left"></i></button><b>' + anio + '</b>' +
      '<button type="button" aria-label="Año siguiente" data-y="1"><i class="ti ti-chevron-right"></i></button></div><div class="pe-mp-g">' +
      MESES.map(function (n, i) {
        var v = anio + '-' + String(i + 1).padStart(2, '0');
        return '<button type="button" data-m="' + v + '" class="' + (v === sel ? 'on' : '') + (v === hoy ? ' hoy' : '') + '"' + (v === sel ? ' aria-current="true"' : '') + '>' + n.slice(0, 3) + '</button>';
      }).join('') + '</div><button type="button" class="pe-mp-hoy" data-m="' + hoy + '">Este mes</button>';
    pop.onclick = function (e) {
      var t = e.target.closest('button'); if (!t) return;
      if (t.getAttribute('data-y')) { pintarMeses(pop, anio + Number(t.getAttribute('data-y'))); return; }
      var v = t.getAttribute('data-m'); if (v) { cerrarMeses(); window.BayolEquilibrio.mes(v); }
    };
  }
  function abrirMeses() {
    if ($('peMesPop')) { cerrarMeses(); return; }
    var w = $('peMes'); if (!w) return;
    var pop = document.createElement('div'); pop.id = 'peMesPop'; pop.className = 'pe-mp'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Escoger mes');
    pintarMeses(pop, +(st.mes || mesHoy()).split('-')[0]);
    w.appendChild(pop); var b = $('peMesTxt'); if (b) b.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(function () { pop.classList.add('on'); var f = pop.querySelector('.pe-mp-g .on') || pop.querySelector('.pe-mp-g button'); if (f) f.focus(); });
    document.addEventListener('pointerdown', fueraMeses, true); document.addEventListener('keydown', escMeses, true);
  }

  // ---------- animaciones suaves (dueño, 07-nov-2026) ----------
  // Solo al cambiar de pestaña, de mes o de quincena (no al escribir): las tarjetas entran en cascada (opacidad y 8 px),
  // y los anillos y las barras crecen desde cero hasta su valor. Con «reducir movimiento» no se anima nada.
  function animarEntrada(cont) {
    try { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch (e) {}
    var piezas = cont.querySelectorAll('.pe-res-h, .pe-kpi, .pe-meta, .pe-per, .pe-pt, .pe-rk, .pe-card, .rv-card, .rv-box');
    Array.prototype.forEach.call(piezas, function (el, i) { el.style.setProperty('--pe-d', Math.min(i, 14) * 28 + 'ms'); el.classList.add('pe-in'); });
    // Anillos: dibujar desde 0. Barras: crecer desde 0.
    var arcos = cont.querySelectorAll('.pe-ring circle:last-child'), barras = cont.querySelectorAll('.pe-barra i, .pe-trk > i, .pe-vq-b i, .rv-barra i');
    var finA = [], finB = [];
    Array.prototype.forEach.call(arcos, function (c) { finA.push(c.getAttribute('stroke-dasharray')); var t = (finA[finA.length - 1] || '0 0').split(' ')[1]; c.setAttribute('stroke-dasharray', '0 ' + t); });
    Array.prototype.forEach.call(barras, function (b) { finB.push(b.style.width); b.style.width = '0%'; });
    void cont.offsetWidth;
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      Array.prototype.forEach.call(arcos, function (c, i) { c.setAttribute('stroke-dasharray', finA[i]); });
      Array.prototype.forEach.call(barras, function (b, i) { b.style.width = finB[i]; });
    }); });
    setTimeout(function () { Array.prototype.forEach.call(piezas, function (el) { el.classList.remove('pe-in'); }); }, 1200);
  }

  function pintar() {
    var mt = $('peMesTxt'); if (mt) mt.textContent = etiquetaMes(st.mes);
    var cont = $('pe_contenido'); if (!cont) return;
    if (!puede()) { cont.innerHTML = '<p class="pe-vacio">Necesita permiso de Contabilidad para ver el punto de equilibrio.</p>'; return; }
    if (st.cargando) { cont.innerHTML = '<p class="pe-vacio"><i class="ti ti-loader"></i> Cargando ventas de Info Plus…</p>'; return; }
    if (st.errorTabla) { cont.innerHTML = '<p class="pe-vacio">No se pudieron cargar los gastos guardados. Toque Actualizar.</p>'; return; }
    var tabs = [{ k: 'general', t: 'General' }].concat(TIENDAS.map(function (t) { return { k: t.cod, t: t.nombre }; }), window.BayolVentas ? [{ k: 'ventas', t: 'Ventas' }] : [], [{ k: 'comunes', t: 'Gastos comunes' }]);
    var c = calcular();
    var cuerpo;
    if (st.tab === 'general') cuerpo = '<div id="peResumen">' + htmlResumen(c.g, 'Todas las tiendas', true, c) + '</div>' + htmlTablaGeneral(c);
    else if (st.tab === 'ventas') cuerpo = '<div class="rv-wrap" id="rv_contenido"></div>';
    else if (st.tab === 'comunes') cuerpo = '<div class="pe-grid"><div>' + htmlGastos(0) + '</div><div id="peResumen">' + htmlResumen(c.g, 'Todas las tiendas', true, c) + '</div></div>';
    else {
      var x = c.tiendas.filter(function (y) { return y.t.cod === st.tab; })[0];
      cuerpo = '<div class="pe-grid"><div>' + htmlGastos(st.tab) + '</div><div id="peResumen">' + htmlResumen(x, x.t.nombre, false, c) + '</div></div>';
    }
    cont.innerHTML =
      '<div class="pe-tabs" role="tablist">' + tabs.map(function (t) {
        return '<button role="tab" aria-selected="' + (st.tab === t.k) + '" class="pe-tab' + (st.tab === t.k ? ' on' : '') + '" onclick="BayolEquilibrio.tab(' + (typeof t.k === 'number' ? t.k : '\'' + t.k + '\'') + ')">' + esc(t.t) + '</button>';
      }).join('') + '</div>' + cuerpo +
      (st.tab === 'ventas' ? '' : '<div class="pe-pie"><span id="peEstado">' + (st.sucio ? 'Cambios sin guardar' : '') + '</span>' +
        '<button class="btn btn-light" onclick="BayolEquilibrio.copiar()"><i class="ti ti-copy"></i> Copiar del mes anterior</button>' +
        '<button id="peBtnGuardar" class="btn btn-blue" onclick="BayolEquilibrio.guardar()"><i class="ti ti-device-floppy"></i> Guardar gastos del mes</button>' +
      '</div>');
    if (st.tab === 'ventas' && window.BayolVentas) window.BayolVentas.montar($('rv_contenido'), st.mes, metasMes());
    if (st.vendSheet && $('peVendSheet')) hojaVend(st.vendSheet);
    if (st.animar) { st.animar = false; animarEntrada(cont); }
  }
  function metasMes() { var m = {}; TIENDAS.forEach(function (t) { m[t.cod] = num((fila(t.cod).variables || {}).meta); }); return m; }

  // ---------- reporte del mes (imprimir / PDF) y Excel (dueño, 07-nov-2026, opción C) ----------
  function nombreMes(mes) { var d = new Date(mes + '-01T00:00:00'); var t = d.toLocaleDateString('es-DO', { month: 'long', year: 'numeric' }); return t.charAt(0).toUpperCase() + t.slice(1); }
  function entero(n) { return Number(n || 0).toLocaleString('es-DO', { maximumFractionDigits: 0 }); }
  // Junta todo lo que va en el reporte: cálculo, metas, gastos, préstamos y ventas.
  async function datosReporte() {
    var c = calcular(), ventas = null, errV = '';
    if (window.BayolVentas) { try { ventas = await window.BayolVentas.cargarMes(st.mes); } catch (e) { errV = 'No se pudieron leer las ventas detalladas.'; } }
    var g = c.g, quedan = c.em === 'actual' ? Math.max(1, g.diasMes - Math.max.apply(null, c.tiendas.map(function (x) { return x.diasAyer; }))) : 0;
    var V = function (cod) { return ventas ? window.BayolVentas.datos(cod, ventas, metasMes()) : null; };
    // Resumen en frases.
    var res = [];
    var corte = c.em === 'actual' ? 'al ' + new Date().toLocaleDateString('es-DO', { day: 'numeric', month: 'long' }) : (c.em === 'pasado' ? 'del mes completo' : '');
    if (g.pe != null) {
      res.push('En ' + nombreMes(st.mes).toLowerCase() + ' (' + corte + ') las tres tiendas llevan vendido ' + plata(g.vn) + ', el ' + pct(g.alcanzado) + ' de lo que necesitan para cubrir los gastos del mes (' + plata(g.pe) + ').');
      if (g.falta > 0) res.push('Para cubrir los gastos falta vender ' + plata(g.falta) + (g.diaNecesario ? ': ' + plata(g.diaNecesario) + ' por día en los ' + quedan + ' días que quedan.' : '.'));
      else res.push('Los gastos del mes ya están cubiertos: lo que se venda de aquí en adelante, menos el costo y los gastos variables, es ganancia.');
    } else res.push('Todavía no se puede calcular el punto de equilibrio: faltan gastos o ventas del mes.');
    if (g.capital > 0 && g.peCaja != null) res.push('Para pagar también la cuota completa de los préstamos (capital ' + plata(g.capital) + ', que no es gasto pero sale de la caja) hay que vender ' + plata(g.peCaja) + (g.faltaCaja > 0 ? '; faltan ' + plata(g.faltaCaja) + (g.diaCaja ? ' (' + plata(g.diaCaja) + ' por día)' : '') + '.' : '; ya se alcanzó.'));
    if (g.meta > 0) res.push('La meta de venta del mes suma ' + plata(g.meta) + ' y va al ' + pct(g.metaAvance) + (g.metasFaltan ? ' (falta fijar la meta en ' + g.metasFaltan + ' tienda(s)).' : '.'));
    if (g.resultado != null) res.push((g.resultado >= 0 ? 'Ganancia' : 'Pérdida') + ' a la fecha: ' + plata(Math.abs(g.resultado)) + (c.em === 'actual' ? ', comparando con los gastos de los días transcurridos. Al ritmo actual cerraría el mes en ' + plata(g.proy) + ' de venta y un resultado de ' + plata(g.resultadoProy) + '.' : '.'));
    // Conclusiones.
    var con = erroresCarga(c).map(function (t) { return 'Ojo: ' + t; });
    var conMeta = c.tiendas.filter(function (x) { return x.meta > 0; });
    if (conMeta.length) {
      var peor = conMeta.slice().sort(function (a, b) { return a.metaAvance - b.metaAvance; })[0];
      if (peor.metaFalta > 0) con.push(peor.t.nombre + ' es la tienda más atrasada frente a su meta (' + pct(peor.metaAvance) + '). Necesita ' + plata(peor.metaFalta) + (peor.metaDia ? ', unos ' + plata(peor.metaDia) + ' por día.' : '.'));
    } else {
      var atr = c.tiendas.filter(function (x) { return x.alcanzado != null; }).sort(function (a, b) { return a.alcanzado - b.alcanzado; })[0];
      if (atr && atr.falta > 0) con.push(atr.t.nombre + ' es la tienda más lejos de su punto de equilibrio (' + pct(atr.alcanzado) + '). Le faltan ' + plata(atr.falta) + (atr.diaNecesario ? ', ' + plata(atr.diaNecesario) + ' por día.' : '.'));
    }
    c.tiendas.forEach(function (x) { if (x.aporte != null && x.aporte < 0) con.push(x.t.nombre + ' no cubre ni sus propios gastos (aporte ' + plata(x.aporte) + '). Revise precios, costos o gastos de esa tienda.'); });
    c.tiendas.forEach(function (x) { if (x.alcanzado != null && x.alcanzado >= 1) con.push(x.t.nombre + ' ya cubrió sus gastos del mes.'); });
    if (ventas) {
      var tv = V('todas'), dm = tv.detalle_venta + tv.mayor_venta;
      if (dm > 0) con.push('El ' + pct(tv.mayor_venta / dm) + ' de la venta de productos fue al por mayor y el ' + pct(tv.detalle_venta / dm) + ' al detalle. Se vendieron ' + entero(tv.cel_unid) + ' celulares y se cobraron ' + entero(tv.rep_n) + ' reparaciones.');
      window.BayolVentas.TIENDAS.forEach(function (t) { var d = V(t.cod); if (d.venta_total > 0 && d.rep_n < 3) con.push(t.nombre + ' tiene muy pocas reparaciones registradas (' + entero(d.rep_n) + '). Confirme que las facturas de reparación lleven «Servicio técnico».'); });
    }
    if (g.metasFaltan === TIENDAS.length) con.push('Fije la meta de venta en cada tienda para poder medir el avance.');
    if (g.faltan > 0) con.push('Hay ' + g.faltan + ' gasto(s) sin monto: el punto de equilibrio puede salir más bajo de lo real.');
    var comunes = (fila(0).gastos || []).filter(function (x) { return num(x.monto) > 0; }).map(function (x) { return { c: x.concepto, m: num(x.monto) }; });
    var prest = (prestamos() || []).map(function (p) { return { b: p.banco || 'Préstamo', i: num(p.interes), k: num(p.capital) }; });
    return { c: c, g: g, V: V, ventas: ventas, errV: errV, res: res, con: con, comunes: comunes, prest: prest, corte: corte, quedan: quedan };
  }

  function htmlReporte(R) {
    var c = R.c, g = R.g, e = esc;
    var th = function (a) { return '<tr>' + a.map(function (x, i) { return '<th' + (i ? ' class="n"' : '') + '>' + x + '</th>'; }).join('') + '</tr>'; };
    var td = function (a, cls) { return '<tr' + (cls ? ' class="' + cls + '"' : '') + '>' + a.map(function (x, i) { return '<td' + (i ? ' class="n"' : '') + '>' + x + '</td>'; }).join('') + '</tr>'; };
    var color = function (v) { return v == null ? '—' : '<span style="color:' + (v >= 0 ? '#15803d' : '#b91c1c') + '">' + plata(v) + '</span>'; };
    var tiendas = c.tiendas.map(function (x) {
      return td([e(x.t.nombre), x.meta ? plata(x.meta) : '—', plata(x.vn), x.meta ? pct(x.metaAvance) : '—', x.pe != null ? plata(x.pe) : '—', x.falta != null ? plata(x.falta) : '—', x.diaNecesario ? plata(x.diaNecesario) : '—', pct(x.mb), color(x.resultado), color(x.aporte)]);
    }).join('') + td(['<b>Todas</b>', g.meta ? plata(g.meta) : '—', '<b>' + plata(g.vn) + '</b>', g.meta ? pct(g.metaAvance) : '—', g.pe != null ? plata(g.pe) : '—', g.falta != null ? plata(g.falta) : '—', g.diaNecesario ? plata(g.diaNecesario) : '—', pct(g.mb), color(g.resultado), '—'], 'tot');
    var gastos = c.tiendas.map(function (x) { return td([e(x.t.nombre), plata(x.gf), plata(x.gc) + ' (' + pct(x.partePct) + ')', plata(x.capital || 0), '<b>' + plata(x.ft + (x.capital || 0)) + '</b>']); }).join('') +
      td(['<b>Todas</b>', plata(g.gf), plata(g.gc), plata(g.capital || 0), '<b>' + plata(g.ft + (g.capital || 0)) + '</b>'], 'tot');
    var comunes = R.comunes.length ? '<table>' + th(['Gasto común', 'Monto']) + R.comunes.map(function (x) { return td([e(x.c), plata(x.m)]); }).join('') + td(['<b>Total</b>', '<b>' + plata(g.gc) + '</b>'], 'tot') + '</table>' : '';
    var prest = R.prest.length ? '<h3>Préstamos (cuota del mes)</h3><table>' + th(['Banco', 'Intereses (gasto)', 'Capital (sale de la caja)', 'Cuota']) +
      R.prest.map(function (p) { return td([e(p.b), plata(p.i), plata(p.k), plata(p.i + p.k)]); }).join('') +
      td(['<b>Total</b>', plata(R.prest.reduce(function (s, p) { return s + p.i; }, 0)), plata(R.prest.reduce(function (s, p) { return s + p.k; }, 0)), '<b>' + plata(R.prest.reduce(function (s, p) { return s + p.i + p.k; }, 0)) + '</b>'], 'tot') + '</table>' : '';
    var ventas = '';
    if (R.ventas) {
      var fv = function (nom, d) { return td([nom, plata(d.venta_total), entero(d.cel_unid) + ' <small>(' + entero(d.cel_detalle) + ' det. · ' + entero(d.cel_mayor) + ' may.)</small>', plata(d.detalle_venta), plata(d.mayor_venta), plata(d.taller_venta), entero(d.rep_n) + ' <small>(' + plata(d.rep_mano_obra) + ')</small>']); };
      ventas = '<h2>4. Ventas del mes</h2><table>' + th(['Tienda', 'Venta total', 'Celulares', 'Detalle (nivel 1)', 'Por mayor (niv. 2 y 3)', 'Taller y servicios', 'Reparaciones (mano de obra)']) +
        window.BayolVentas.TIENDAS.map(function (t) { return fv(e(t.nombre), R.V(t.cod)); }).join('') + fv('<b>Todas</b>', R.V('todas')).replace('<tr>', '<tr class="tot">') + '</table>' +
        '<p class="nota">Venta total = detalle + por mayor + taller y servicios, ya restadas las devoluciones. El nivel se toma del precio cobrado; si fue negociado, del cliente («Contado» = detalle). Celulares: artículos que empiezan con «CELULAR». Reparación: factura con «Servicio técnico».</p>';
    } else if (R.errV) ventas = '<h2>4. Ventas del mes</h2><p class="nota">' + e(R.errV) + '</p>';
    var logo = location.origin + location.pathname.replace(/[^/]*$/, '') + 'assets/logo-carga.webp';
    return ('<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Punto de equilibrio · ' + e(nombreMes(st.mes)) + '</title><style>' +
      '*{box-sizing:border-box}body{font-family:-apple-system,system-ui,"Segoe UI",Roboto,sans-serif;color:#0f172a;margin:0;background:#f1f5f9}' +
      '.hoja{max-width:900px;margin:0 auto;background:#fff;padding:28px 28px 40px}' +
      '.cab{display:flex;align-items:center;gap:14px;border-bottom:3px solid #e4572e;padding-bottom:12px;margin-bottom:18px}.cab img{width:52px;height:52px;object-fit:contain}' +
      '.cab h1{font-size:22px;margin:0}.cab p{margin:2px 0 0;color:#475569;font-size:14px}' +
      'h2{font-size:17px;margin:26px 0 10px;color:#e4572e}h3{font-size:15px;margin:18px 0 8px}' +
      '.res{background:#fff8f4;border:1px solid #fde4d8;border-radius:12px;padding:12px 16px}.res p{margin:6px 0;font-size:15px;line-height:1.5}' +
      'table{width:100%;border-collapse:collapse;font-size:13px;font-variant-numeric:tabular-nums;margin:6px 0}th{background:#f8fafc;text-align:left;font-weight:700;color:#334155}th,td{padding:8px 6px;border-bottom:1px solid #e2e8f0;vertical-align:top}' +
      '.n{text-align:right;white-space:nowrap}.tw table{min-width:560px}tr.tot td{background:#f8fafc;font-weight:600}small{color:#64748b}' +
      'ul{padding-left:20px}li{margin:6px 0;font-size:15px;line-height:1.5}.nota{font-size:12px;color:#64748b;line-height:1.5}' +
      '.acc{position:sticky;top:0;display:flex;gap:8px;justify-content:flex-end;padding:10px;background:#f1f5f9}.acc button{min-height:44px;padding:0 16px;font-size:15px;border-radius:10px;border:1px solid #cbd5e1;background:#fff;cursor:pointer}.acc .p{background:#e4572e;color:#fff;border-color:#e4572e}' +
      '.tw{overflow-x:auto}@media(max-width:640px){.hoja{padding:16px}table{font-size:12px}}' +
      '@media print{body{background:#fff}.acc{display:none}.tw{overflow:visible}.tw table{min-width:0}table{font-size:9.5px}th,td{padding:5px 3px}.n{white-space:normal}.hoja{padding:0;max-width:none}h2{break-after:avoid}table,tr{break-inside:avoid}@page{size:letter;margin:14mm}}' +
      '</style></head><body><div class="acc"><button onclick="window.close()">Cerrar</button><button class="p" onclick="window.print()">Imprimir o guardar PDF</button></div><div class="hoja">' +
      '<div class="cab"><img src="' + e(logo) + '" alt="" onerror="this.style.display=\'none\'"><div><h1>Punto de equilibrio · ' + e(nombreMes(st.mes)) + '</h1><p>Bayol Cell · Santiago, Moca y Navarrete · ' + e(c.em === 'actual' ? 'Datos ' + R.corte + ' (mes en curso)' : c.em === 'pasado' ? 'Mes cerrado' : 'Mes futuro') + '</p></div></div>' +
      '<h2>1. Resumen</h2><div class="res">' + R.res.map(function (x) { return '<p>' + e(x) + '</p>'; }).join('') + '</div>' +
      '<h2>2. Cada tienda</h2><table>' + th(['Tienda', 'Meta', 'Vendido', '% meta', 'Debe vender (equilibrio)', 'Le falta', 'Por día que queda', 'Margen', 'Resultado a la fecha', 'Aporte (sin comunes)']) + tiendas + '</table>' +
      '<p class="nota">«Debe vender» es la venta que cubre los gastos fijos propios y la parte de los comunes. «Aporte» es lo que deja la tienda sin cargarle los gastos comunes.</p>' +
      htmlMetasReporte(c) +
      '<h2>3. Gastos del mes</h2><table>' + th(['Tienda', 'Gastos propios', 'Parte de comunes', 'Parte del capital', 'Total a cubrir']) + gastos + '</table>' + comunes + prest +
      ventas +
      '<h2>' + (R.ventas || R.errV ? '5' : '4') + '. Conclusiones</h2><ul>' + (R.con.length ? R.con : ['Sin observaciones para este mes.']).map(function (x) { return '<li>' + e(x) + '</li>'; }).join('') + '</ul>' +
      '<p class="nota">Estimado con las ventas y el costo de Info Plus, antes del impuesto sobre la renta. No sustituye el estado de la contadora. Generado el ' + e(new Date().toLocaleString('es-DO')) + '</p>' +
      '</div></body></html>').replace(/<table>/g, '<div class="tw"><table>').replace(/<\/table>/g, '</table></div>');
  }

  // Metas por periodo y por vendedor para el reporte y el Excel.
  function datosMetas(c) {
    return c.tiendas.filter(function (x) { return x.meta > 0; }).map(function (x) {
      var per = periodosMeta([x]), q1 = per.filter(function (r) { return r.d1 === 1 && r.d2 === 15; })[0], q2 = per.filter(function (r) { return r.d1 === 16; })[0];
      var vend = vendedoresTienda(x.t.cod).map(function (e) {
        var v1 = q1.vendido == null ? null : vendido([x.t.cod], st.mes + '-01', st.mes + '-15', e.cod), v2 = q2.vendido == null ? null : vendido([x.t.cod], st.mes + '-16', st.mes + '-' + f2(q2.d2), e.cod);
        return { nombre: e.nombre || ('Vendedor ' + e.cod), cod: e.cod, pct: e.pct, m1: q1.meta * e.pct / 100, v1: v1, m2: q2.meta * e.pct / 100, v2: v2 };
      });
      return { x: x, per: per, vend: vend };
    });
  }
  function htmlMetasReporte(c) {
    var D = datosMetas(c); if (!D.length) return '';
    var e = esc;
    return '<h3>Metas por periodo y por vendedor</h3>' + D.map(function (d) {
      return '<p><b>' + e(d.x.t.nombre) + '</b> · meta del mes ' + plata(d.x.meta) + '</p><table><tr><th>Periodo</th><th class="n">Meta</th><th class="n">Vendido</th><th class="n">Logrado</th></tr>' +
        d.per.map(function (r) { return '<tr><td>' + e(r.nombre) + '</td><td class="n">' + plata(r.meta) + '</td><td class="n">' + (r.vendido == null ? '—' : plata(r.vendido)) + '</td><td class="n">' + (r.avance == null ? '—' : pct(r.avance)) + '</td></tr>'; }).join('') + '</table>' +
        (d.vend.length ? '<table><tr><th>Vendedor</th><th class="n">%</th><th class="n">Meta 1ª quincena</th><th class="n">Vendido</th><th class="n">Meta 2ª quincena</th><th class="n">Vendido</th></tr>' +
          d.vend.map(function (v) { return '<tr><td>' + e(v.nombre) + '</td><td class="n">' + v.pct + ' %</td><td class="n">' + plata(v.m1) + '</td><td class="n">' + (v.v1 == null ? '—' : plata(v.v1)) + '</td><td class="n">' + plata(v.m2) + '</td><td class="n">' + (v.v2 == null ? '—' : plata(v.v2)) + '</td></tr>'; }).join('') + '</table>' : '');
    }).join('');
  }

  async function reporteMes() {
    if (!st.mes) return;
    // La ventana se abre en el mismo toque (si no, el navegador la bloquea) y se llena después.
    var w = window.open('', '_blank');
    if (w) w.document.write('<p style="font-family:system-ui;padding:24px">Preparando el reporte…</p>');
    try {
      var html = htmlReporte(await datosReporte());
      if (!w || w.closed) { aviso('El navegador bloqueó la ventana del reporte. Permita ventanas emergentes e intente de nuevo.', 'error'); return; }
      w.document.open(); w.document.write(html); w.document.close();
    } catch (e) { if (w) w.close(); aviso('No se pudo preparar el reporte.', 'error'); if (typeof logError === 'function') logError('equilibrio reporte', e); }
  }

  function cargarXlsx() {
    return new Promise(function (ok, mal) {
      if (window.XLSX && window.XLSX.utils && window.XLSX.writeFile) return ok();
      var s = document.createElement('script'); s.src = 'https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js';
      s.onload = function () { ok(); }; s.onerror = function () { mal(new Error('No cargó el lector de Excel')); };
      document.head.appendChild(s);
    });
  }
  async function excelMes() {
    if (!st.mes) return;
    try {
      var R = await datosReporte(); await cargarXlsx();
      var X = window.XLSX, wb = X.utils.book_new(), c = R.c, g = R.g, r2 = function (v) { return v == null ? '' : Math.round(v * 100) / 100; }, p1 = function (v) { return v == null ? '' : Math.round(v * 1000) / 1000; };
      var hoja = function (nombre, filas, anchos, fmt) {
        var ws = X.utils.aoa_to_sheet(filas); ws['!cols'] = anchos.map(function (w) { return { wch: w }; });
        // Formato: pesos con 2 decimales y porcentajes (columnas indicadas en fmt).
        Object.keys(ws).forEach(function (k) { if (k[0] === '!') return; var cel = ws[k], col = k.replace(/[0-9]/g, ''); if (typeof cel.v === 'number' && fmt[col]) cel.z = fmt[col]; });
        X.utils.book_append_sheet(wb, ws, nombre);
      };
      var RD = '#,##0.00', PC = '0.0%';
      hoja('Resumen', [['Punto de equilibrio · ' + nombreMes(st.mes)], ['Bayol Cell · ' + (c.em === 'actual' ? 'Datos ' + R.corte : c.em === 'pasado' ? 'Mes cerrado' : 'Mes futuro')], []]
        .concat(R.res.map(function (x) { return [x]; })).concat([[], ['Conclusiones']]).concat(R.con.map(function (x) { return ['• ' + x]; })), [120], {});
      hoja('Tiendas', [['Tienda', 'Meta', 'Vendido', '% de la meta', 'Debe vender (equilibrio)', '% del equilibrio', 'Le falta', 'Por día que queda', 'Para pagar también la cuota', 'Margen', 'Contribución', 'Resultado a la fecha', 'Aporte (sin comunes)', 'Proyección de venta']]
        .concat(c.tiendas.map(function (x) { return [x.t.nombre, r2(x.meta || null), r2(x.vn), p1(x.metaAvance), r2(x.pe), p1(x.alcanzado), r2(x.falta), r2(x.diaNecesario), r2(x.peCaja), p1(x.mb), p1(x.mc), r2(x.resultado), r2(x.aporte), r2(x.proy)]; }))
        .concat([['Todas', r2(g.meta || null), r2(g.vn), p1(g.metaAvance), r2(g.pe), p1(g.alcanzado), r2(g.falta), r2(g.diaNecesario), r2(g.peCaja), p1(g.mb), p1(g.mc), r2(g.resultado), '', r2(g.proy)]]),
        [12, 14, 14, 11, 18, 12, 14, 14, 18, 9, 11, 16, 16, 16], { B: RD, C: RD, D: PC, E: RD, F: PC, G: RD, H: RD, I: RD, J: PC, K: PC, L: RD, M: RD, N: RD });
      var gfil = [['Tienda / concepto', 'Monto']];
      [0].concat(TIENDAS.map(function (t) { return t.cod; })).forEach(function (cod) {
        var nom = cod === 0 ? 'Gastos comunes' : TIENDAS.filter(function (t) { return t.cod === cod; })[0].nombre;
        gfil.push([nom.toUpperCase(), '']);
        (fila(cod).gastos || []).forEach(function (x) { gfil.push(['   ' + x.concepto, num(x.monto)]); });
        gfil.push(['   Total ' + nom, r2(totalFijos(cod))], []);
      });
      hoja('Gastos', gfil, [44, 16], { B: RD });
      if (R.prest.length) hoja('Préstamos', [['Banco', 'Intereses (gasto)', 'Capital (sale de la caja)', 'Cuota']].concat(R.prest.map(function (p) { return [p.b, p.i, p.k, r2(p.i + p.k)]; })), [30, 18, 22, 16], { B: RD, C: RD, D: RD });
      if (R.ventas) {
        var vf = function (nom, d) { return [nom, r2(d.venta_total), d.cel_unid, d.cel_detalle, d.cel_mayor, r2(d.cel_venta), r2(d.detalle_venta), d.detalle_fact, r2(d.mayor_venta), d.mayor_fact, r2(d.taller_venta), d.rep_n, r2(d.rep_mano_obra), r2(d.rep_piezas)]; };
        hoja('Ventas', [['Tienda', 'Venta total', 'Celulares', 'Cel. detalle', 'Cel. por mayor', 'Venta de celulares', 'Detalle (nivel 1)', 'Facturas detalle', 'Por mayor (niveles 2 y 3)', 'Facturas por mayor', 'Taller y servicios', 'Reparaciones', 'Mano de obra', 'Piezas en reparaciones']]
          .concat(window.BayolVentas.TIENDAS.map(function (t) { return vf(t.nombre, R.V(t.cod)); })).concat([vf('Todas', R.V('todas'))]),
          [12, 14, 10, 10, 12, 16, 16, 12, 18, 12, 14, 12, 14, 16], { B: RD, F: RD, G: RD, I: RD, K: RD, M: RD, N: RD });
      }
      var DM = datosMetas(c);
      if (DM.length) {
        var mf = [['Tienda', 'Periodo / vendedor', '%', 'Meta', 'Vendido', 'Logrado', 'Meta 2ª quincena', 'Vendido 2ª quincena']];
        DM.forEach(function (d) {
          d.per.forEach(function (r) { mf.push([d.x.t.nombre, r.nombre, '', r2(r.meta), r.vendido == null ? '' : r2(r.vendido), r.avance == null ? '' : p1(r.avance), '', '']); });
          d.vend.forEach(function (v) { mf.push([d.x.t.nombre, 'Vendedor: ' + v.nombre + ' (1ª quincena)', v.pct / 100, r2(v.m1), v.v1 == null ? '' : r2(v.v1), v.v1 == null || !v.m1 ? '' : p1(v.v1 / v.m1), r2(v.m2), v.v2 == null ? '' : r2(v.v2)]); });
          mf.push([]);
        });
        hoja('Metas', mf, [12, 40, 8, 16, 16, 10, 18, 18], { C: PC, D: RD, E: RD, F: PC, G: RD, H: RD });
      }
      X.writeFile(wb, 'Punto_de_equilibrio_' + st.mes + '_BayolCell.xlsx');
    } catch (e) { aviso('No se pudo preparar el Excel. Intente de nuevo.', 'error'); if (typeof logError === 'function') logError('equilibrio excel', e); }
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
      '@media (max-width:480px){#conta-equilibrio .pe-g{grid-template-columns:minmax(0,1fr) 44px;}#conta-equilibrio .pe-g-c{grid-column:1 / -1}#conta-equilibrio .pe-g-m{grid-column:1;width:100%}}',
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
      /* Estilo Apple (07-nov-2026): etiquetas normales, barra de acciones segmentada, pestañas en una fila, toque que hunde. */
      '#conta-equilibrio label span,#conta-equilibrio label,#conta-equilibrio .pe-v-p span{text-transform:none!important;letter-spacing:0!important}',
      '#conta-equilibrio .pe-vars label span,#conta-equilibrio .pe-dias span{font-weight:500;color:#334155;font-size:14px;line-height:1.3}',
      '#conta-equilibrio .pe-bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap}',
      '#conta-equilibrio .pe-mes{position:relative;display:flex;align-items:center;gap:2px;padding:3px;border-radius:14px;background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 2px rgba(15,23,42,.05)}',
      '#conta-equilibrio .pe-mes button{min-height:44px;border:0;background:transparent;border-radius:11px;cursor:pointer;color:#0f172a;font-family:inherit;transition:background 160ms ease,transform 100ms ease-out}',
      '#conta-equilibrio .pe-mes button:hover{background:#f1f5f9}',
      '#conta-equilibrio .pe-mes-a{width:44px;display:grid;place-items:center;font-size:20px;color:#e4572e!important}',
      '#conta-equilibrio .pe-mes-l{flex:1;min-width:150px;padding:0 10px;font-size:16px;font-weight:700;letter-spacing:-.01em;font-variant-numeric:tabular-nums}',
      '#conta-equilibrio .pe-mp{position:absolute;top:calc(100% + 8px);left:0;right:0;min-width:280px;z-index:30;padding:12px;border-radius:18px;background:rgba(255,255,255,.94);-webkit-backdrop-filter:blur(24px) saturate(180%);backdrop-filter:blur(24px) saturate(180%);border:1px solid rgba(15,23,42,.08);box-shadow:0 18px 44px -12px rgba(15,23,42,.35);opacity:0;transform:translateY(-4px) scale(.97);transform-origin:top center;transition:opacity 180ms cubic-bezier(.23,1,.32,1),transform 180ms cubic-bezier(.23,1,.32,1)}',
      '#conta-equilibrio .pe-mp.on{opacity:1;transform:none}',
      '#conta-equilibrio .pe-mp-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}#conta-equilibrio .pe-mp-h b{font-size:17px;letter-spacing:-.01em}',
      '#conta-equilibrio .pe-mp-h button{width:44px;height:44px;display:grid;place-items:center;font-size:20px;color:#e4572e}',
      '#conta-equilibrio .pe-mp-g{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}',
      '#conta-equilibrio .pe-mp-g button{min-height:48px;font-size:15px;font-weight:600;color:#334155}',
      '#conta-equilibrio .pe-mp-g button.hoy{box-shadow:inset 0 0 0 1.5px #fbd5c4}',
      '#conta-equilibrio .pe-mp-g button.on{background:#e4572e!important;color:#fff}',
      '#conta-equilibrio .pe-mp-hoy{width:100%;margin-top:8px;font-size:14px;font-weight:600;color:#e4572e!important}',
      '@media (prefers-reduced-motion:reduce){#conta-equilibrio .pe-mp{transition:opacity 120ms ease;transform:none}}',
      '#conta-equilibrio .pe-seg{display:flex;padding:3px;gap:3px;border-radius:14px;background:rgba(15,23,42,.06)}',
      '#conta-equilibrio .pe-seg button{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:44px;padding:0 14px;border:0;border-radius:11px;background:transparent;color:#0f172a;font:600 14px/1 inherit;font-family:inherit;cursor:pointer;transition:background 160ms ease,transform 100ms ease-out}',
      '#conta-equilibrio .pe-seg button:hover{background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(15,23,42,.08)}',
      '#conta-equilibrio .pe-seg button i{font-size:18px;color:#e4572e}',
      '@media (max-width:700px){#conta-equilibrio .pe-bar{width:100%}#conta-equilibrio .pe-mes{flex:1 1 100%}#conta-equilibrio .pe-seg{flex:1 1 100%}#conta-equilibrio .pe-seg button{flex:1;padding:0 6px}}',
      '#conta-equilibrio .pe-tabs{flex-wrap:nowrap;overflow-x:auto;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding:2px 2px 4px;margin-left:-2px;margin-right:-2px}',
      '#conta-equilibrio .pe-tabs::-webkit-scrollbar{display:none}',
      '#conta-equilibrio .pe-tab{flex:none;scroll-snap-align:start;transition:background 160ms ease,color 160ms ease,transform 100ms ease-out}',
      '#conta-equilibrio button:active,#conta-equilibrio .btn:active{transform:scale(.97)}',
      '#conta-equilibrio .pe-pie .btn.btn-blue{min-height:54px!important;height:auto;padding:0 22px;font-size:15px;border-radius:14px}',
      '@media (max-width:700px){#conta-equilibrio .pe-pie .btn{flex:1 1 100%;justify-content:center}}',
      '@media (prefers-reduced-motion:reduce){#conta-equilibrio button:active,#conta-equilibrio .btn:active{transform:none}}',
      '#conta-equilibrio .pe-v-m input{width:150px!important;padding:0 10px!important}',
      '@media (max-width:480px){#conta-equilibrio .pe-g{grid-template-columns:minmax(0,1fr) 44px}#conta-equilibrio .pe-g-c{grid-column:1 / -1}#conta-equilibrio .pe-g .pe-g-m{grid-column:1;width:100%!important;max-width:none!important}}',
      '@media (max-width:700px){#conta-equilibrio .pe-v-m input{width:auto!important}}',
      '#conta-equilibrio .pe-per{border:1px solid #e2e8f0;border-radius:16px;padding:14px;margin:12px 0;background:#fff;box-shadow:0 6px 18px -14px rgba(15,23,42,.35)}',
      '#conta-equilibrio .pe-per>header{display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap;margin-bottom:10px}',
      '#conta-equilibrio .pe-per h5{margin:0;font-size:15px;font-weight:700;letter-spacing:-.01em;color:#0f172a}',
      '#conta-equilibrio .pe-per>header>span{font-size:13px;color:#64748b}',
      '#conta-equilibrio .pe-pt-g{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}',
      '@media (max-width:1100px){#conta-equilibrio .pe-pt-g{grid-template-columns:repeat(2,minmax(0,1fr))}}',
      '#conta-equilibrio .pe-pt{border:1px solid #eef2f7;border-radius:14px;padding:12px;background:#f8fafc;display:flex;flex-direction:column;gap:8px;min-width:0}',
      '#conta-equilibrio .pe-pt.on{background:#fff8f4;border-color:#fbd5c4}',
      '#conta-equilibrio .pe-pt-h{display:flex;flex-direction:column;gap:1px}',
      '#conta-equilibrio .pe-pt-h span{font-size:13px;font-weight:700;color:#334155;text-transform:none}',
      '#conta-equilibrio .pe-pt-h small{font-size:13px;color:#94a3b8;min-height:1.2em}',
      '#conta-equilibrio .pe-pt-c{display:flex;align-items:center;gap:10px;min-width:0}',
      '#conta-equilibrio .pe-pt-c b{font-size:24px;line-height:1;letter-spacing:-.025em;color:#0f172a;font-variant-numeric:tabular-nums;white-space:nowrap}',
      '#conta-equilibrio .pe-pt-m{display:grid;grid-template-columns:auto 1fr;column-gap:8px;row-gap:2px;font-size:13px;font-variant-numeric:tabular-nums}',
      '#conta-equilibrio .pe-pt-m span{color:#64748b}#conta-equilibrio .pe-pt-m b{color:#0f172a;text-align:right;white-space:nowrap;font-weight:600}',
      '#conta-equilibrio .pe-ring{flex:none}#conta-equilibrio .pe-ring circle:last-child{transition:stroke-dasharray 500ms cubic-bezier(.23,1,.32,1)}',
      '#conta-equilibrio .pe-pt-f{font-size:13px;color:#64748b}#conta-equilibrio .pe-pt-f b{color:#b45309}#conta-equilibrio .pe-pt-f b.ok{color:#15803d}',
      '#conta-equilibrio .pe-pt-o{font-size:13px;color:#475569;margin:10px 0 0}',
      '#conta-equilibrio .pe-suma{font-size:13px;font-weight:600;color:#15803d}#conta-equilibrio .pe-suma.mal{color:#b91c1c}',
      '#conta-equilibrio .pe-vl{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}',
      '#conta-equilibrio .pe-v{border:1px solid #eef2f7;border-radius:14px;padding:12px;display:grid;grid-template-columns:1fr;gap:10px}',
      '@media (max-width:700px){#conta-equilibrio .pe-v{grid-template-columns:1fr}}',
      '#conta-equilibrio .pe-v-h{display:flex;align-items:center;gap:10px;min-width:0}',
      '#conta-equilibrio .pe-av{flex:none;width:44px;height:44px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:16px;color:#fff;background:linear-gradient(135deg,#f97316,#e4572e)}#conta-equilibrio .pe-av.sin{background:#e2e8f0;color:#475569;font-size:13px}',
      '#conta-equilibrio .pe-v-n{display:flex;flex-direction:column;min-width:0;flex:1}#conta-equilibrio .pe-v-n b{font-size:15px;color:#0f172a}#conta-equilibrio .pe-v-n small{font-size:13px;color:#64748b}',
      '#conta-equilibrio .pe-v-in{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;flex:none}',
      '@media (max-width:700px){#conta-equilibrio .pe-v-h{flex-wrap:wrap}#conta-equilibrio .pe-v-in{width:100%;flex-wrap:nowrap;justify-content:flex-start}#conta-equilibrio .pe-v-m{flex:1;min-width:0}#conta-equilibrio .pe-v-m input{flex:1;width:auto;min-width:0}#conta-equilibrio .pe-v-m span:last-child{display:none}}',
      '#conta-equilibrio .pe-v-p{display:flex;align-items:center;gap:4px;flex:none}#conta-equilibrio .pe-v-p span{color:#64748b;font-size:14px}',
      '#conta-equilibrio .pe-v-p input{width:76px;height:48px;font-size:16px;border:1px solid #d8dee9;border-radius:12px;padding:0 10px;text-align:right;font-variant-numeric:tabular-nums;background:#fff}',
      '#conta-equilibrio .pe-v-q{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
      '#conta-equilibrio .pe-vq{padding:8px 10px;border-radius:10px;background:#f8fafc;min-width:0}#conta-equilibrio .pe-vq.on{background:#fff8f4}',
      '#conta-equilibrio .pe-vq-l{display:block;font-size:13px;color:#64748b}#conta-equilibrio .pe-vq-v{display:block;font-size:18px;letter-spacing:-.02em;color:#0f172a;font-variant-numeric:tabular-nums;white-space:nowrap}',
      '#conta-equilibrio .pe-vq-b{height:6px;border-radius:99px;background:#e9eef5;overflow:hidden;margin:6px 0 4px}#conta-equilibrio .pe-vq-b i{display:block;height:100%;border-radius:99px;transition:width 500ms cubic-bezier(.23,1,.32,1)}',
      '#conta-equilibrio .pe-vq small{font-size:13px;color:#64748b;font-variant-numeric:tabular-nums;display:block}',
      '@media (prefers-reduced-motion:reduce){#conta-equilibrio .pe-ring circle,#conta-equilibrio .pe-vq-b i{transition:none}}',
      '#conta-equilibrio .pe-qseg{display:flex;padding:3px;gap:3px;border-radius:12px;background:rgba(15,23,42,.06);margin-bottom:6px}',
      '#conta-equilibrio .pe-qseg button{flex:1;min-height:44px;border:0;border-radius:10px;background:transparent;font:600 13px/1.2 inherit;font-family:inherit;color:#475569;cursor:pointer;transition:background 160ms ease,color 160ms ease}',
      '#conta-equilibrio .pe-qseg button.on{background:#fff;color:#0f172a;box-shadow:0 1px 3px rgba(15,23,42,.12)}',
      '#conta-equilibrio .pe-rkl{list-style:none;margin:0;padding:0}',
      '#conta-equilibrio .pe-rk{display:flex;align-items:center;gap:12px;padding:14px 2px;border-bottom:1px solid #f1f5f9}#conta-equilibrio .pe-rk:last-child{border-bottom:0}',
      '#conta-equilibrio .pe-rk-n{width:18px;flex:none;font-size:15px;font-weight:800;color:#94a3b8;text-align:center}',
      '#conta-equilibrio .pe-rk-av{position:relative;width:52px;height:52px;flex:none}#conta-equilibrio .pe-rk-av svg{position:absolute;inset:0}',
      '#conta-equilibrio .pe-rk-av i{position:absolute;inset:8px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-weight:800;font-size:15px;color:#fff;background:linear-gradient(135deg,#f97316,#e4572e)}',
      '#conta-equilibrio .pe-rk-av.sin i{background:#e2e8f0;color:#475569;font-size:12px}',
      '#conta-equilibrio .pe-rk-c{flex:1;min-width:0}',
      '#conta-equilibrio .pe-rk-h{display:flex;justify-content:space-between;align-items:baseline;gap:8px}#conta-equilibrio .pe-rk-h b{font-size:15px;color:#0f172a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '#conta-equilibrio .pe-rk-p{font-size:20px;font-weight:800;letter-spacing:-.02em;color:#0f172a;font-variant-numeric:tabular-nums}',
      '#conta-equilibrio .pe-trk{position:relative;height:10px;border-radius:99px;background:#eef2f7;margin:10px 0 8px}',
      '#conta-equilibrio .pe-trk>i{position:absolute;left:0;top:0;bottom:0;border-radius:99px;transition:width 500ms cubic-bezier(.23,1,.32,1)}',
      '#conta-equilibrio .pe-trk>s{position:absolute;top:-5px;bottom:-5px;width:2px;margin-left:-1px;background:#0f172a;border-radius:2px;text-decoration:none}',
      '#conta-equilibrio .pe-trk>s em{position:absolute;top:-16px;left:50%;transform:translateX(-50%);font-style:normal;font-size:11px;color:#475569}',
      '#conta-equilibrio .pe-rk-f{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;font-size:13px;color:#64748b;font-variant-numeric:tabular-nums}#conta-equilibrio .pe-rk-f b{color:#0f172a}',
      '#conta-equilibrio .pe-alerta{font-size:13px!important;line-height:1.4;font-weight:600;color:#b91c1c;margin:8px 2px 0}',
      '#conta-equilibrio .pe-leyenda{display:flex;align-items:center;gap:8px;font-size:13px;color:#64748b;margin:8px 2px 0}#conta-equilibrio .pe-leyenda s{display:inline-block;width:2px;height:14px;background:#0f172a;border-radius:2px}',
      '#conta-equilibrio .pe-sh .pe-v-in{display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px;width:100%}',
      '#conta-equilibrio .pe-sh .pe-v-h{flex-wrap:wrap}',
      '#conta-equilibrio .pe-sh .pe-v-p:first-child input{width:76px!important}',
      '#conta-equilibrio .pe-sh .pe-v-m{display:flex;min-width:0}#conta-equilibrio .pe-sh .pe-v-m input{flex:1;width:100%!important;min-width:0}#conta-equilibrio .pe-sh .pe-v-m span:last-child{display:none}',
      '#conta-equilibrio .pe-chip{display:inline-block;font-size:12px;font-weight:700;padding:4px 9px;border-radius:99px;background:#f1f5f9;color:#475569;white-space:nowrap}',
      '#conta-equilibrio .pe-chip.ok{background:#dcfce7;color:#15803d}#conta-equilibrio .pe-chip.mal{background:#fef3c7;color:#b45309}',
      '#conta-equilibrio .pe-sh-f{position:fixed;inset:0;z-index:1200;background:rgba(15,23,42,.35);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;opacity:0;transition:opacity 200ms ease}',
      '#conta-equilibrio .pe-sh-f.on{opacity:1}',
      '#conta-equilibrio .pe-sh{width:min(560px,100%);max-height:calc(100vh - 32px);overflow:auto;background:rgba(255,255,255,.96);border-radius:22px;padding:16px;box-shadow:0 24px 60px -16px rgba(15,23,42,.45);transform:translateY(12px) scale(.98);transition:transform 260ms cubic-bezier(.32,.72,0,1)}',
      '#conta-equilibrio .pe-sh-f.on .pe-sh{transform:none}',
      '@media (max-width:700px){#conta-equilibrio .pe-sh-f{align-items:flex-end;padding:0}#conta-equilibrio .pe-sh{border-radius:22px 22px 0 0;max-height:88vh;padding-bottom:calc(16px + env(safe-area-inset-bottom,0px));transform:translateY(100%)}}',
      '#conta-equilibrio .pe-sh-h{display:flex;justify-content:space-between;align-items:center}#conta-equilibrio .pe-sh-h b{font-size:17px;letter-spacing:-.01em}',
      '#conta-equilibrio .pe-sh-h button{width:44px;height:44px;border:0;border-radius:50%;background:#f1f5f9;font-size:18px;color:#475569;cursor:pointer}',
      '#conta-equilibrio .pe-sh-s{font-size:13px;color:#64748b;margin:4px 0 12px}',
      '#conta-equilibrio .pe-sh .pe-acc .btn-blue{margin-left:auto;min-height:44px;padding:0 22px}',
      '@media (prefers-reduced-motion:reduce){#conta-equilibrio .pe-sh,#conta-equilibrio .pe-trk>i{transition:none}#conta-equilibrio .pe-sh{transform:none!important}}',
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
      '#conta-equilibrio .pe-vars{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));column-gap:16px;row-gap:0}',
      '#conta-equilibrio .pe-vars label,#conta-equilibrio .pe-dias{display:grid;grid-template-columns:minmax(0,1fr) 84px 18px;align-items:center;gap:8px;font-size:14px;color:#334155;min-height:56px;border-bottom:1px solid #f1f5f9}',
      '#conta-equilibrio .pe-dias{grid-template-columns:minmax(0,1fr) 80px;margin-top:10px}',
      '#conta-equilibrio .pe-vars input,#conta-equilibrio .pe-dias input{text-align:right}',
      '#conta-equilibrio .pe-rep{display:flex;flex-direction:column;gap:2px}',
      '#conta-equilibrio .pe-rep label,#conta-equilibrio .pe-itbis{display:flex;align-items:center;gap:8px;min-height:44px;font-size:14px;cursor:pointer}',
      '#conta-equilibrio .pe-rep input,#conta-equilibrio .pe-itbis input{width:20px;height:20px}',
      '#conta-equilibrio .pe-res-h{display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap}',
      '#conta-equilibrio .pe-res-h b{font-size:17px}',
      '#conta-equilibrio .pe-res-h span{font-size:13px;color:#475569}',
      '#conta-equilibrio .pe-barra{height:10px;border-radius:999px;background:#f1f5f9;overflow:hidden;margin:8px 0 12px}',
      '#conta-equilibrio .pe-barra i{display:block;height:100%;border-radius:999px;transition:width 600ms cubic-bezier(.22,1,.36,1)}',
      '@keyframes peEntra{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}',
      '#conta-equilibrio .pe-in{animation:peEntra 420ms cubic-bezier(.22,1,.36,1) both;animation-delay:var(--pe-d,0ms)}',
      '#conta-equilibrio .pe-ring circle:last-child{transition:stroke-dasharray 700ms cubic-bezier(.22,1,.36,1)}',
      '#conta-equilibrio .pe-trk>i,#conta-equilibrio .pe-vq-b i{transition:width 650ms cubic-bezier(.22,1,.36,1)!important}',
      '#conta-equilibrio .pe-tab,#conta-equilibrio .pe-qseg button{transition:background 220ms ease,color 220ms ease,box-shadow 220ms ease,transform 100ms ease-out}',
      '@media (prefers-reduced-motion:reduce){#conta-equilibrio .pe-in{animation:none}#conta-equilibrio .pe-ring circle:last-child,#conta-equilibrio .pe-barra i,#conta-equilibrio .pe-trk>i{transition:none!important}}',
      '#conta-equilibrio .pe-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px}',
      '#conta-equilibrio .pe-kpi{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:9px 11px;display:flex;flex-direction:column;gap:2px}',
      '#conta-equilibrio .pe-kpi small{font-size:13px;color:#475569}',
      '#conta-equilibrio .pe-kpi b{font-size:18px;font-variant-numeric:tabular-nums}',
      '#conta-equilibrio .pe-kpi span{font-size:13px;color:#475569}',
      '#conta-equilibrio .pe-avisos{margin:10px 0 0;padding-left:18px;font-size:13px;color:#7c2d12}',
      '#conta-equilibrio .pe-errores{margin:12px 0;padding:12px 14px;border-radius:14px;background:#fef2f2;border:1px solid #fecaca;color:#991b1b;font-size:14px}',
      '#conta-equilibrio .pe-errores ul{margin:6px 0 10px;padding-left:18px}',
      '#conta-equilibrio .pe-errores li{margin:3px 0}',
      '#conta-equilibrio .pe-errores button{min-height:44px;padding:0 16px;border-radius:12px;border:1px solid #fca5a5;background:#fff;color:#991b1b;font-weight:600;font-size:14px;cursor:pointer}',
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
        '<div class="pe-bar"><div class="pe-mes" id="peMes"><input type="hidden" id="pe_mes">' +
          '<button type="button" class="pe-mes-a" aria-label="Mes anterior" onclick="BayolEquilibrio._mp(-1)"><i class="ti ti-chevron-left"></i></button>' +
          '<button type="button" class="pe-mes-l" id="peMesTxt" aria-haspopup="dialog" aria-expanded="false" onclick="BayolEquilibrio._ma()"></button>' +
          '<button type="button" class="pe-mes-a" aria-label="Mes siguiente" onclick="BayolEquilibrio._mp(1)"><i class="ti ti-chevron-right"></i></button>' +
        '</div>' +
        '<div class="pe-seg" role="group" aria-label="Acciones del mes">' +
          '<button type="button" onclick="BayolEquilibrio.recargar()"><i class="ti ti-refresh"></i><span>Actualizar</span></button>' +
          '<button type="button" onclick="BayolEquilibrio.reporte()"><i class="ti ti-file-text"></i><span>Reporte</span></button>' +
          '<button type="button" onclick="BayolEquilibrio.excel()"><i class="ti ti-file-spreadsheet"></i><span>Excel</span></button>' +
        '</div></div>' +
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
      if (name === 'ventas') { name = 'equilibrio'; st.tab = 'ventas'; }
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
    tab: function (k) { if (k === 'ventas' && !window.BayolVentas) k = 'general'; if (k !== 'general' && k !== 'comunes' && k !== 'ventas' && !TIENDAS.some(function (t) { return t.cod === k; })) return; st.tab = k; st.animar = true; pintar(); },
    mes: function (v) {
      if (!v) return;
      var seguir = function () { st.mes = v; st.filas = {}; var m = $('pe_mes'); if (m) m.value = v; cargar(); };
      if (st.sucio && typeof confirmar === 'function') confirmar('Hay cambios sin guardar. ¿Cambiar de mes y perderlos?').then(function (ok) { if (ok) seguir(); else { var m = $('pe_mes'); if (m) m.value = st.mes; } });
      else seguir();
    },
    recargar: function () {
      if (window.BayolVentas) window.BayolVentas._estado().cache = {};
      if (st.sucio && typeof confirmar === 'function') { confirmar('Hay cambios sin guardar. ¿Actualizar y perderlos?').then(function (ok) { if (ok) cargar(); }); return; }
      cargar();
    },
    guardar: function () { guardar(null); },
    copiar: copiarMesAnterior,
    reporte: function () { reporteMes(); },
    excel: function () { excelMes(); },
    ayuda: ayuda,
    calcular: calcular,
    _estado: function () { return st; },
    _m: editMonto, _c: editConcepto, _a: agregarConcepto, _q: quitarConcepto, _v: editVar, _d: editDias, _r: editComun, _rp: editRepartoPct, _n: sugerirNomina, _pb: editPrestamo, _pa: agregarPrestamo, _pq: quitarPrestamo, _mt: editMeta, _ms: usarMetaSugerida, _mp: mesPaso, _ma: abrirMeses, _vp: editVendPct, _vq: function (n) { st.vendQ = n; st.animar = true; pintar(); }, _vs: hojaVend, _vc: cerrarHoja, _anim: animarEntrada, _vm: editVendMonto, _vr: repartirVend
  };

  function iniciar() {
    if (!envolver()) { setTimeout(iniciar, 300); return; }
    asegurarPestana(); mostrarBoton();
    var v = $('v-contabilidad');
    if (v && v.classList.contains('active')) { try { if (localStorage.getItem('bayol_subtab_conta') === 'equilibrio') window.contaTab('equilibrio'); } catch (e) {} }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
