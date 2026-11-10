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
  var B = window.BayolConta; if (!B) return;   // conta-base.js (base común, 08-nov-2026)

  var TIENDAS = B.TIENDAS;
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
  // Claves fijas de los gastos que el sistema llena solo (C4 de untangle, 08-nov-2026). Antes se reconocían por el texto
  // del concepto: si alguien lo renombraba, el cálculo dejaba de llenarlo sin avisar. La clave se guarda con el gasto;
  // para lo guardado antes se deduce una vez del texto (mismas reglas de siempre).
  var CLAVES = [
    { k: 'nomina', re: /^n[óo]mina/i },
    { k: 'tss', re: /^tss/i },
    { k: 'regalia', re: /^provisi[óo]n/i },
    { k: 'intereses', re: /pr[ée]stamo/i, solo: 0 }
  ];
  function claveDe(g, cod) {
    if (g.clave) return g.clave;
    for (var i = 0; i < CLAVES.length; i++) if ((CLAVES[i].solo == null || CLAVES[i].solo === cod) && CLAVES[i].re.test(g.concepto || '')) return CLAVES[i].k;
    return '';
  }
  function ponerClaves(cod, gastos) { (gastos || []).forEach(function (g) { var k = claveDe(g, cod); if (k) g.clave = k; }); return gastos; }

  var st = { mes: null, tab: 'general', filas: {}, ventas: {}, ventasAnt: {}, cn: {}, cargando: false, sucio: false };

  function $(id) { return document.getElementById(id); }
  var esc = B.esc, plata = B.plata, pct = B.pct, sb = B.sb, puede = B.puede, periodo = B.periodo, sumarMes = B.sumarMes, mesAnterior = B.mesAnterior, animarEntrada = B.animar;
  function num(v) { var n = parseFloat(String(v == null ? '' : v).replace(/[^0-9.]/g, '')); return isFinite(n) && n > 0 ? n : 0; }
  function aviso(msg, tipo) { if (typeof toast === 'function') toast(msg, tipo); }

  // ---------- fechas y días hábiles ----------
  function mesHoy() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
  // 'pasado' | 'actual' | 'futuro'
  function estadoMes(mes) { var h = mesHoy(); return mes < h ? 'pasado' : (mes > h ? 'futuro' : 'actual'); }
  // Un solo calendario de días hábiles (paso 2 de untangle, 08-nov-2026). Todo cuenta con diasRango:
  // un día es hábil si no es domingo, o si la tienda abre domingos.
  function f2(n) { return String(n).padStart(2, '0'); }
  function ultimoDia(mes) { var p = mes.split('-'); return new Date(+p[0], +p[1], 0).getDate(); }
  function diasRango(mes, domingo, d1, d2) {
    var p = mes.split('-'), y = +p[0], m = +p[1] - 1, n = 0;
    for (var d = d1; d <= d2; d++) { var dow = new Date(y, m, d).getDay(); if (dow !== 0 || domingo) n++; }
    return n;
  }
  // Día del mes que va «hoy» para ese mes: 0 si el mes no ha empezado, el último día si ya pasó.
  function diaDeHoy(mes) { var em = estadoMes(mes); return em === 'futuro' ? 0 : em === 'pasado' ? ultimoDia(mes) : new Date().getDate(); }
  // Días hábiles del mes completo, o hasta hoy incluido (hastaHoy).
  function contarDias(mes, domingo, hastaHoy) { return diasRango(mes, domingo, 1, hastaHoy ? diaDeHoy(mes) : ultimoDia(mes)); }
  // Días hábiles ya terminados: en el mes en curso, hasta ayer.
  function diasHastaAyer(mes, domingo) { return diasRango(mes, domingo, 1, estadoMes(mes) === 'actual' ? diaDeHoy(mes) - 1 : diaDeHoy(mes)); }
  // Días hábiles por defecto de una tienda (si nadie los cambió a mano).
  function diasDefecto(mes, t) { return contarDias(mes, t && t.domingo, false); }
  // Días que quedan para vender en el mes en curso (hoy cuenta), al menos 1; 0 si el mes no está en curso.
  function diasQuedan(diasMes, diasAyer) { return estadoMes(st.mes) === 'actual' ? Math.max(1, diasMes - diasAyer) : 0; }

  // ---------- filas ----------
  function filaVacia(cod) {
    var lista = cod === 0 ? FIJOS_COMUNES : FIJOS_TIENDA, t = TIENDAS.filter(function (x) { return x.cod === cod; })[0];
    var vars = { tarjeta_pct: TARJETA_DEF.tarjeta_pct, tarjeta_parte: TARJETA_DEF.tarjeta_parte }; VARIABLES.forEach(function (v) { vars[v.k] = v.def; });
    return {
      mes: st.mes + '-01', codlocalidad: cod,
      gastos: ponerClaves(cod, lista.map(function (c) { return { concepto: c, monto: '' }; })),
      // Comunes: base del reparto (mes anterior), % de ventas con ITBIS (hoy 0: el dueño confirmó el 6-nov que no llevan) y abono a capital.
      variables: cod === 0 ? { base: 'anterior', itbis_pct: 0, capital: 0 } : vars,
      dias_habiles: cod === 0 ? null : diasDefecto(st.mes, t),
      incluye_itbis: false, reparto: 'venta', reparto_pct: {}, notas: '', _nueva: true
    };
  }
  function fila(cod) { if (!st.filas[cod]) st.filas[cod] = filaVacia(cod); return st.filas[cod]; }
  function totalFijos(cod) { return (fila(cod).gastos || []).reduce(function (s, g) { return s + num(g.monto); }, 0); }
  function faltanMontos(cod) { return (fila(cod).gastos || []).filter(function (g) { return String(g.monto).trim() === ''; }).length; }
  // Factor del ITBIS sobre la parte de las ventas que lo lleva (g18 = fracción de 0 a 1).
  function factorItbis(g18) { return 1 + 0.18 * g18; }
  function itbisPct() { var v = fila(0).variables || {}; return Math.min(100, num(v.itbis_pct)) / 100; }
  function pctVariables(cod) {
    var v = fila(cod).variables || {};
    var tarj = (v.tarjeta_pct == null ? TARJETA_DEF.tarjeta_pct : num(v.tarjeta_pct)) * (v.tarjeta_parte == null ? TARJETA_DEF.tarjeta_parte : num(v.tarjeta_parte)) / 100;
    // El banco cobra sobre el total con ITBIS.
    tarj = tarj * factorItbis(itbisPct());
    return (VARIABLES.reduce(function (s, x) { return s + num(v[x.k]); }, 0) + tarj) / 100;
  }

  // ---------- préstamos ----------
  // Lista en fila(0).variables.prestamos = [{ banco, interes, capital }]. Los intereses son gasto (van en la fila
  // «Intereses de préstamos», que se llena sola); el capital no es gasto pero sale de la caja.
  function prestamos() { var v = fila(0).variables || {}; return Array.isArray(v.prestamos) ? v.prestamos : null; }
  // «Cuota total» (dueño, 08-nov-2026): se puede anotar la cuota completa sin separar. Mientras tanto toda la cuota
  // cuenta como gasto (igual que antes) y se avisa; cuando haya desglose se pasa a «Separado» (intereses + capital).
  function esTotal(p) { return p && p.modo === 'total'; }
  function interesDe(p) { return esTotal(p) ? num(p.cuota) : num(p.interes); }
  function capitalDe(p) { return esTotal(p) ? 0 : num(p.capital); }
  function hayCuotaTotal() { return (prestamos() || []).some(function (p) { return esTotal(p) && num(p.cuota) > 0; }); }
  function capitalPrestamos() {
    var l = prestamos(); if (l && l.length) return l.reduce(function (s, p) { return s + capitalDe(p); }, 0);
    return num((fila(0).variables || {}).capital);
  }
  function filaIntereses() {
    var gs = fila(0).gastos; for (var i = 0; i < gs.length; i++) if (claveDe(gs[i], 0) === 'intereses') return i;
    return -1;
  }
  function sincronizarIntereses() {
    var l = prestamos() || [], gs = fila(0).gastos, i = filaIntereses();
    if (!l.length) return;
    var tot = Math.round(l.reduce(function (s, p) { return s + interesDe(p); }, 0) * 100) / 100;
    if (i < 0) { gs.push({ concepto: 'Intereses de préstamos', monto: tot, clave: 'intereses' }); return; }
    if (window.BayolCaptura && (num(gs[i].monto) !== tot || gs[i].concepto !== 'Intereses de préstamos')) window.BayolCaptura.tocar(gs[i], true);
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

  // Reparto manual de gastos comunes: suma de los % de las tiendas, y si cuadra en 100 %.
  function sumaReparto(com) { return TIENDAS.reduce(function (a, t) { return a + num((com.reparto_pct || {})[t.cod]); }, 0); }
  function repartoCuadra(com) { return Math.abs(sumaReparto(com) - 100) <= 0.01; }

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
      x.quedan = diasQuedan(x.diasMes, x.diasAyer);
      x.diaNecesario = x.falta != null && x.falta > 0 && x.quedan > 0 ? x.falta / x.quedan : null;
      x.ritmo = x.diasPas > 0 ? x.vn / x.diasPas : 0;
      x.proy = em === 'actual' && x.diasPas > 0 ? Math.max(x.vn, x.ritmo * x.diasMes) : x.vn;
    }
    var tiendas = TIENDAS.map(function (t) {
      var v = st.ventas[t.cod] || { venta: 0, costo: 0 };
      var vn = v.venta / factorItbis(g18), c = v.costo;
      var mb = vn > 0 ? (vn - c) / vn : 0, mc = mb - pctVariables(t.cod);
      return { t: t, venta: v.venta, vn: vn, costo: c, mb: mb, mc: mc, gf: totalFijos(t.cod), faltan: faltanMontos(t.cod),
        diasMes: num(fila(t.cod).dias_habiles) || diasDefecto(st.mes, t), diasPas: contarDias(st.mes, t.domingo, true),
        diasAyer: diasHastaAyer(st.mes, t.domingo), ventaAnt: (st.ventasAnt[t.cod] || { venta: 0 }).venta / factorItbis(g18) };
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
      cajaNecesaria(x, x.quedan);
      metaDe(x, num((fila(x.t.cod).variables || {}).meta), x.quedan);
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
    var peG = (mcComb > 0 && fijosTot > 0) ? fijosTot / mcComb : null;
    var g = {
      vn: sumVN, mb: sumVN > 0 ? (sumVN - sumCosto) / sumVN : 0, mc: mcComb, gf: sumGF, gc: GC, ft: fijosTot, partePct: 1,
      // Dueño, 08-nov-2026 (opción B): la General cuenta los días con domingos de Navarrete, igual que «le falta por día».
      pe: peG, peDia: peG != null && diasMesG > 0 ? peG / diasMesG : null, peDiaTxt: 'por día (incluye domingos)',
      falta: peG != null ? Math.max(0, peG - sumVN) : null, alcanzado: peG != null && peG > 0 ? sumVN / peG : null,
      proy: sumProy, resultado: em === 'futuro' ? null : contrib - fijosTot * fracG, resultadoProy: contribProy - fijosTot,
      seguridad: peG != null && sumVN > 0 ? (sumVN - peG) / sumVN : null, capital: capital,
      faltan: faltanMontos(0) + tiendas.reduce(function (s, x) { return s + x.faltan; }, 0), diasMes: diasMesG, diasPas: diasPasG
    };
    var quedanG = diasQuedan(diasMesG, diasAyerG); g.quedan = quedanG;
    g.diaNecesario = g.falta != null && g.falta > 0 && quedanG > 0 ? g.falta / quedanG : null;
    cajaNecesaria(g, quedanG);
    // General: la meta es la suma de las metas fijadas en las tiendas.
    metaDe(g, tiendas.reduce(function (s, x) { return s + x.meta; }, 0), quedanG);
    g.metaSug = tiendas.reduce(function (s, x) { return s + (x.metaSug || 0); }, 0);
    g.metasFaltan = tiendas.filter(function (x) { return !x.meta; }).length;
    var repSuma = sumaReparto(com), repMal = com.reparto === 'manual' && !repartoCuadra(com);
    var errVentas = TIENDAS.some(function (t) { return st.ventas[t.cod] && st.ventas[t.cod].error; });
    var usaAnt = com.reparto === 'venta' && base === 'anterior';
    var errAnt = usaAnt && TIENDAS.some(function (t) { return st.ventasAnt[t.cod] && st.ventasAnt[t.cod].error; });
    return { tiendas: tiendas, g: g, itbis: itbis, g18: g18, em: em, repMal: repMal, repSuma: repSuma, errVentas: errVentas,
      base: base, sinAnt: usaAnt && !errAnt && sumAnt <= 0, errAnt: errAnt, errDiario: !!st.errDiario, errCN: !!st.errCN, cn: st.cn || {} };
  }

  // ---------- carga que no parpadea (dueño, 10-nov-2026; referencia Moxen «Demora») ----------
  // Menos de 0,3 s: no se enseña nada. Desde 0,3 s: esqueleto, al menos 0,5 s. A los 4 s: «Sigue tardando» + Cancelar.
  // A los 15 s: se corta y ofrece Reintentar. Apagar: localStorage.bc_pe_demora_off='1' (vuelve el «Cargando…» de antes).
  var DEMORA = { nada: 300, minimo: 500, lento: 4000, corte: 15000 };
  var dm = { fase: 'nada', t: [], tEsq: 0 };
  function demoraOn() { try { return localStorage.getItem('bc_pe_demora_off') !== '1'; } catch (e) { return true; } }
  function demoraLimpiar() { dm.t.forEach(clearTimeout); dm.t = []; }
  function demoraIniciar(token) {
    demoraLimpiar(); dm.fase = 'nada'; dm.tEsq = 0;
    if (!demoraOn()) { dm.fase = 'viejo'; return; }
    var si = function (fn) { return function () { if (token === st.token && st.cargando) fn(); }; };
    dm.t.push(setTimeout(si(function () { dm.fase = 'esq'; dm.tEsq = Date.now(); pintar(); }), DEMORA.nada));
    dm.t.push(setTimeout(si(function () { dm.fase = 'lento'; pintar(); }), DEMORA.lento));
    dm.t.push(setTimeout(si(function () { detenerCarga('No cargó en 15 segundos.'); }), DEMORA.corte));
  }
  function demoraEsperar() {
    var f = dm.tEsq ? DEMORA.minimo - (Date.now() - dm.tEsq) : 0;
    return f > 0 ? new Promise(function (r) { setTimeout(r, f); }) : Promise.resolve();
  }
  function detenerCarga(msg) { st.token = (st.token || 0) + 1; demoraLimpiar(); st.cargando = false; st.cargaMsg = msg; pintar(); }
  function cancelarCarga() { if (st.cargando) detenerCarga('Carga cancelada.'); }
  function htmlEsqueleto() {
    var b = function (w, h) { return '<i class="pe-esq-b" style="width:' + w + ';height:' + (h || 14) + 'px"></i>'; };
    var fila = '<div class="pe-esq-fila">' + b('34%') + b('100%', 10) + '</div>';
    return '<div class="pe-esq" role="status" aria-live="polite" aria-label="Cargando punto de equilibrio">' +
      '<div class="pe-esq-aviso" hidden><span>Sigue tardando…</span><button type="button" class="btn btn-light" onclick="BayolEquilibrio.cancelarCarga()">Cancelar</button></div>' +
      '<div class="pe-esq-tabs">' + b('86px', 40) + b('96px', 40) + b('96px', 40) + b('110px', 40) + '</div>' +
      '<div class="pe-esq-kpis">' + [0, 1, 2, 3].map(function () { return '<div class="pe-esq-caja">' + b('60%', 11) + b('80%', 24) + '</div>'; }).join('') + '</div>' +
      '<div class="pe-esq-caja">' + b('38%', 16) + fila + fila + fila + '</div>' +
      '<div class="pe-esq-caja">' + b('44%', 16) + fila + fila + fila + fila + '</div>' +
      '</div>';
  }
  function pintarCarga(cont) {
    if (dm.fase === 'viejo') { cont.innerHTML = '<p class="pe-vacio"><i class="ti ti-loader"></i> Cargando ventas de Info Plus…</p>'; return; }
    cont.setAttribute('aria-busy', 'true');
    if (dm.fase === 'nada') { if (cont.querySelector('.pe-carga-msg, .pe-vacio')) cont.innerHTML = ''; return; }
    if (!cont.querySelector('.pe-esq')) cont.innerHTML = htmlEsqueleto();
    var a = cont.querySelector('.pe-esq-aviso'); if (a) a.hidden = dm.fase !== 'lento';
  }

  // ---------- datos ----------
  async function cargar() {
    var cli = sb(); if (!cli) return;
    var token = st.token = (st.token || 0) + 1;
    st.cargando = true; st.errorTabla = false; st.cargaMsg = null; demoraIniciar(token); pintar();
    var p = periodo(st.mes);
    try {
      var r = await cli.from('conta_equilibrio').select('*').eq('mes', p.ini);
      if (r.error) throw r.error;
      if (token !== st.token) return;
      st.filas = {};
      (r.data || []).forEach(function (f) { ponerClaves(f.codlocalidad, f.gastos); st.filas[f.codlocalidad] = f; });
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
    // Cantidad de ventas (facturas sin notas de crédito) por tienda, para «faltan N ventas» (dueño, 09-nov-2026).
    // Si falla, solo se oculta ese dato: el equilibrio no depende de él.
    var facturas = null;
    try {
      var rf = await Promise.all([p, pa].map(function (per) { return cli.rpc('facturas_por_tienda', { p_ini: per.ini, p_fin: per.fin }); }));
      if (rf[0].error || rf[1].error) throw rf[0].error || rf[1].error;
      facturas = { mes: {}, ant: {} };
      rf[0].data.forEach(function (r) { facturas.mes[r.codlocalidad] = Number(r.facturas) || 0; });
      rf[1].data.forEach(function (r) { facturas.ant[r.codlocalidad] = Number(r.facturas) || 0; });
    } catch (e) { if (typeof logError === 'function') logError('equilibrio facturas', e); }
    await demoraEsperar();
    if (token !== st.token) return;
    demoraLimpiar();
    st.facturas = facturas;
    st.diario = diario; st.errDiario = errDiario; st.errCN = errCN;
    st.ventas = ventas; st.ventasAnt = ventasAnt; st.cn = cn; st.cargando = false; st.sucio = false; st.animar = true;
    pintar();
  }

  async function guardar(cod) {
    if (st.guardando) return;
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
      if (!repartoCuadra(com)) { aviso('El reparto manual de gastos comunes debe sumar 100 %.', 'error'); return; }
    }
    st.guardando = true;
    var vista = $('conta-equilibrio'); if (vista) vista.querySelectorAll('button,input,select,textarea').forEach(function (el) { el.disabled = true; });
    var btn = $('peBtnGuardar'); if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ti ti-loader"></i> Guardando…'; }
    try {
      var r = window.BayolCaptura ? await window.BayolCaptura.guardar(cli, filas) : await cli.from('conta_equilibrio').upsert(filas, { onConflict: 'mes,codlocalidad' }).select('*');
      if (r.error) throw r.error;
      (r.data || []).forEach(function (f) { ponerClaves(f.codlocalidad, f.gastos); st.filas[f.codlocalidad] = f; });
      st.sucio = false;
      aviso('Gastos del mes guardados.');
    } catch (e) {
      if (typeof logError === 'function') logError('equilibrio guardar', e);
      aviso('No se pudo guardar: ' + ((e && e.message) || e), 'error');
    }
    st.guardando = false;
    pintar();
  }

  async function copiarMesAnterior() {
    if (st.guardando || (window.BayolCaptura && window.BayolCaptura.ocupado())) { aviso('Espere a que termine el guardado o el comprobante.', 'error'); return; }
    var cli = sb(); if (!cli) return;
    var mesDestino = st.mes, ant = mesAnterior(st.mes) + '-01';
    try {
      var r = await cli.from('conta_equilibrio').select('*').eq('mes', ant);
      if (r.error) throw r.error;
      if (!r.data || !r.data.length) { aviso('El mes anterior no tiene gastos guardados.', 'error'); return; }
      var ok = true;
      if (typeof confirmar === 'function') ok = await confirmar('¿Copiar los gastos del mes anterior a este mes?\n\nSe reemplazan los montos escritos en pantalla. Revise y guarde después.');
      if (!ok || st.mes !== mesDestino) return;
      r.data.forEach(function (f) {
        var t = TIENDAS.filter(function (x) { return x.cod === f.codlocalidad; })[0];
        st.filas[f.codlocalidad] = { actualizado_en: (st.filas[f.codlocalidad] || {}).actualizado_en || null, mes: st.mes + '-01', codlocalidad: f.codlocalidad, gastos: ponerClaves(f.codlocalidad, f.gastos || []), variables: f.variables || {},
          dias_habiles: f.codlocalidad === 0 ? null : diasDefecto(st.mes, t), incluye_itbis: !!f.incluye_itbis,
          reparto: f.reparto || 'venta', reparto_pct: f.reparto_pct || {}, notas: f.notas || '' };
      });
      if (window.BayolCaptura) window.BayolCaptura.copiar(r.data.map(function (f) { return st.filas[f.codlocalidad]; }));
      st.sucio = true; aviso('Copiado. Revise los montos y toque Guardar.');
      pintar();
    } catch (e) { aviso('No se pudo copiar: ' + ((e && e.message) || e), 'error'); }
  }

  // ---------- edición ----------
  function editMonto(cod, i, v) { if (window.BayolCaptura) window.BayolCaptura.tocar(fila(cod).gastos[i], true); fila(cod).gastos[i].monto = v === '' ? '' : num(v); st.sucio = true; refrescarCalculo(); }
  function editConcepto(cod, i, v) { fila(cod).gastos[i].concepto = v; if (window.BayolCaptura) window.BayolCaptura.tocar(fila(cod).gastos[i], true); st.sucio = true; if (window.BayolCaptura) pintar(); }
  function agregarConcepto(cod) { fila(cod).gastos.push({ concepto: '', monto: '' }); st.sucio = true; pintar(); var el = document.querySelector('#peGastos input[data-i="' + (fila(cod).gastos.length - 1) + '"]'); if (el) el.focus(); }
  function quitarConcepto(cod, i) { if (window.BayolCaptura && window.BayolCaptura.ocupado()) { aviso('Espere al comprobante.', 'error'); return; } fila(cod).gastos.splice(i, 1); st.sucio = true; pintar(); }
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
  function modoPrestamo(i, modo) {
    var l = listaPrestamos(), p = l[i]; if (!p || (modo === 'total') === esTotal(p)) return;
    if (modo === 'total') { if (!(num(p.cuota) > 0)) p.cuota = (num(p.interes) + num(p.capital)) || ''; p.modo = 'total'; }
    else { if (!(num(p.interes) > 0) && !(num(p.capital) > 0) && num(p.cuota) > 0) p.interes = num(p.cuota); p.modo = 'separado'; }
    sincronizarIntereses(); fila(0).variables.capital = capitalPrestamos(); st.sucio = true; pintar();
    var el = document.querySelector('#pePrest .pe-p:nth-of-type(' + (i + 1) + ') label input'); if (el) el.focus();
  }
  function editPrestamo(i, k, v) {
    var l = listaPrestamos(); if (!l[i]) return;
    l[i][k] = k === 'banco' ? String(v).slice(0, 60) : (v === '' ? '' : num(v));
    if (k !== 'banco') { sincronizarIntereses(); fila(0).variables.capital = capitalPrestamos(); }
    st.sucio = true;
    if (k === 'banco') return;
    var t = $('pePrestTot'); if (t) t.innerHTML = htmlTotPrestamos();
    var gi = filaIntereses(), el = gi >= 0 && document.querySelector('#peGastos input[data-i="' + gi + '"]'); if (el) el.value = fila(0).gastos[gi].monto === '' ? '' : num(fila(0).gastos[gi].monto);
    refrescarCalculo();
  }
  function agregarPrestamo() {
    var l = listaPrestamos(), c = fila(0).variables;
    // El primer renglón se lleva lo que ya estaba escrito (capital suelto e intereses de la lista de gastos).
    if (!l.length) {
      var gi = filaIntereses(), previo = gi >= 0 ? num(fila(0).gastos[gi].monto) : 0;
      // Si lo anotado antes es la cuota completa sin capital aparte, entra como «Cuota total» (caso de octubre 2026).
      if (previo > 0 && !(num(c.capital) > 0)) l.push({ banco: '', modo: 'total', cuota: previo, interes: '', capital: '' });
      else l.push({ banco: '', interes: previo || '', capital: num(c.capital) || '' });
    }
    else l.push({ banco: '', interes: '', capital: '' });
    sincronizarIntereses(); c.capital = capitalPrestamos(); st.sucio = true; pintar();
    var el = document.querySelector('#pePrest input[data-p="' + (l.length - 1) + '"]'); if (el) el.focus();
  }
  function quitarPrestamo(i) {
    var l = listaPrestamos(); l.splice(i, 1);
    if (l.length) sincronizarIntereses(); else { var gi = filaIntereses(); if (gi >= 0) { fila(0).gastos[gi].monto = ''; if (window.BayolCaptura) window.BayolCaptura.tocar(fila(0).gastos[gi], true); } }
    fila(0).variables.capital = capitalPrestamos(); st.sucio = true; pintar();
  }
  function editRepartoPct(cod, v) { var c = fila(0); c.reparto_pct = c.reparto_pct || {}; c.reparto_pct[cod] = num(v); st.sucio = true; refrescarCalculo(); }
  function sugerirNomina(cod) {
    var f = fila(cod), nom = 0;
    f.gastos.forEach(function (g) { if (claveDe(g, cod) === 'nomina') nom += num(g.monto); });
    if (!nom) { aviso('Escriba primero el monto de la nómina de la tienda.', 'error'); return; }
    f.gastos.forEach(function (g) {
      var k = claveDe(g, cod);
      if (window.BayolCaptura && (k === 'tss' || k === 'regalia')) window.BayolCaptura.tocar(g, true);
      if (k === 'tss') g.monto = Math.round(nom * TSS_PCT) / 100;
      if (k === 'regalia') g.monto = Math.round(nom * PROV_PCT) / 100;
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
  // ---------- «Faltan N ventas» y gráfica «El cruce» (dueño, 09-nov-2026, idea de un reel) ----------
  // Venta promedio = lo vendido ÷ cantidad de facturas. Al empezar el mes (menos de 20 facturas) usa el mes anterior.
  // Venta promedio por factura de un grupo de tiendas. Al empezar el mes (menos de 20 facturas) usa el mes anterior.
  function promVenta(tiendas) {
    var F = st.facturas; if (!F) return 0;
    var vn = 0, n = 0, va = 0, na = 0;
    tiendas.forEach(function (x) { vn += x.vn; n += F.mes[x.t.cod] || 0; va += x.ventaAnt || 0; na += F.ant[x.t.cod] || 0; });
    return n >= 20 && vn > 0 ? vn / n : (na > 0 && va > 0 ? va / na : (n > 0 && vn > 0 ? vn / n : 0));
  }
  function ventasQueFaltan(tiendas, falta) {
    if (!(falta > 0)) return null;
    var prom = promVenta(tiendas); if (!(prom > 0)) return null;
    return { n: Math.ceil(falta / prom), prom: prom };
  }
  // Venta de un día (aaaa-mm-dd) de un grupo de tiendas, ajustada a la venta del cálculo (ITBIS y devoluciones).
  function ventaDia(tiendas, x, fecha) {
    var cods = tiendas.map(function (t) { return t.t.cod; }), dia = 0, mes = 0;
    (st.diario || []).forEach(function (r) {
      if (cods.indexOf(Number(r.codlocalidad)) < 0) return;
      var v = Number(r.venta) || 0; if (r.fecha.slice(0, 7) === st.mes) mes += v; if (r.fecha === fecha) dia += v;
    });
    var vn = tiendas.reduce(function (a, t) { return a + t.vn; }, 0);
    return mes > 0 && vn > 0 ? dia * vn / mes : dia;
  }
  function hoyISO() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  // ---------- Píldoras, tarjeta «Hoy» y rangos (dueño, 09-nov-2026, ideas de la plantilla Halvi) ----------
  function htmlPildoras(tiendas, x, c) {
    var F = st.facturas, n = F ? tiendas.reduce(function (a, t) { return a + (F.mes[t.t.cod] || 0); }, 0) : null, prom = promVenta(tiendas);
    function pil(ic, v, t, col) { return '<div class="pe-pil"><i class="ti ti-' + ic + '"' + (col ? ' style="background:' + col + ';color:#fff"' : '') + '></i><div><b>' + v + '</b><small>' + t + '</small></div></div>'; }
    return '<div class="pe-pils">' +
      (c.em === 'actual' ? pil('bolt', corto(ventaDia(tiendas, x, hoyISO())), 'Hoy', '#e4572e') : pil('cash', corto(x.vn), 'Vendido', '#e4572e')) +
      (n != null ? pil('receipt', n.toLocaleString('es-DO'), 'Facturas') : '') +
      (prom > 0 ? pil('scale', corto(prom), 'Promedio') : '') +
      pil('percentage', pct(x.mb), 'Margen') + '</div>';
  }
  function htmlHoy(tiendas, c) {
    if (c.em !== 'actual' || !tiendas.length) return '';
    var n = tiendas.length, i = ((st.hoyIdx || 0) % n + n) % n, t = tiendas[i];
    // La meta de hoy es la misma de «Meta por periodo» (la fijada por el dueño); sin meta, lo que pide el equilibrio.
    var ph = t.meta > 0 ? periodoDe(periodosMeta([t]), 'hoy') : null;
    var obj = ph && ph.meta > 0 ? ph.meta : (t.falta > 0 && t.diaNecesario != null ? t.diaNecesario : (t.peDia || 0));
    var v = ph && ph.meta > 0 && ph.vendido != null ? ph.vendido : ventaDia([t], t, hoyISO());
    var falta = Math.max(0, obj - v), a = obj > 0 ? Math.min(1, v / obj) : 0, prom = promVenta([t]);
    var flechas = n > 1 ? '<div class="pe-hoy-n"><button type="button" aria-label="Tienda anterior" onclick="BayolEquilibrio._hoy(-1)"><i class="ti ti-chevron-left"></i></button><button type="button" aria-label="Tienda siguiente" onclick="BayolEquilibrio._hoy(1)"><i class="ti ti-chevron-right"></i></button>' +
      '<span class="pe-hoy-d">' + tiendas.map(function (z, j) { return '<s' + (j === i ? ' class="on"' : '') + '></s>'; }).join('') + '</span></div>' : '';
    return '<div class="pe-hoy"><div class="pe-hoy-h"><b>Hoy · ' + esc(t.t.nombre) + '</b><span>' + (obj > 0 ? 'Meta ' + corto(obj) : '') + '</span></div>' +
      '<div class="pe-hoy-v">' + corto(v) + '</div>' +
      '<div class="pe-hoy-b"><i style="width:' + (a * 100).toFixed(1) + '%"></i></div>' +
      '<p>' + (obj <= 0 ? 'Sin meta' : falta > 0 ? 'Falta <b>' + corto(falta) + '</b>' + (prom > 0 ? ' · ≈ ' + Math.ceil(falta / prom) + ' ventas' : '') : '<b>✓ Meta de hoy cumplida</b>') + '</p>' + flechas + '</div>';
  }
  function htmlRangos(tiendas, x, c) {
    var va = 0, ca = 0, na = 0, F = st.facturas;
    tiendas.forEach(function (t) { var a = st.ventasAnt[t.t.cod]; if (a && !a.error) { va += t.ventaAnt || 0; ca += a.costo || 0; } if (F) na += F.ant[t.t.cod] || 0; });
    var filas = [];
    if (va > 0 && x.vn > 0) { var mA = (va - ca) / va; filas.push({ t: 'Margen', v: x.mb, lo: mA - 0.03, hi: mA + 0.03, txt: pct(x.mb), ref: 'mes pasado ' + pct(mA) }); }
    var prom = promVenta(tiendas);
    if (na > 0 && va > 0 && prom > 0) { var pA = va / na; filas.push({ t: 'Venta promedio', v: prom, lo: pA * 0.9, hi: pA * 1.1, txt: corto(prom), ref: 'mes pasado ' + corto(pA) }); }
    if (!filas.length) return '';
    return '<div class="pe-rng"><div class="pe-cruce-h"><b>Contra el mes pasado</b></div>' + filas.map(function (f) {
      var min = Math.min(f.lo, f.v) , max = Math.max(f.hi, f.v), pad = (max - min) * 0.25 || Math.abs(f.v) * 0.1 || 1; min -= pad; max += pad;
      function P(v) { return ((v - min) / (max - min) * 100).toFixed(1); }
      var est = f.v < f.lo ? 'Bajo' : f.v > f.hi ? 'Alto' : 'Normal', col = est === 'Bajo' ? '#dc2626' : est === 'Alto' ? '#15803d' : '#475569';
      return '<div class="pe-rng-f"><div class="pe-rng-h"><div><b>' + f.t + '</b><small>' + f.txt + ' · ' + f.ref + '</small></div><span class="pe-chip ' + (est === 'Bajo' ? 'mal' : est === 'Alto' ? 'ok' : '') + '">' + est + '</span></div>' +
        '<div class="pe-rng-b"><s style="left:' + P(f.lo) + '%;width:' + (P(f.hi) - P(f.lo)).toFixed(1) + '%"></s><i style="left:' + P(f.v) + '%;background:' + col + '"></i></div></div>';
    }).join('') + '</div>';
  }
  // ---------- «Su semana» (dueño, 09-nov-2026, idea de la plantilla Halvi) ----------
  // Últimos 7 días hasta hoy (o hasta el último día del mes si ya pasó): días pasados rayados, hoy en rojo y la meta
  // del día punteada (lo que hay que vender por día para cubrir los gastos). Arriba: hoy, promedio, mejor día y
  // contra los 7 días anteriores. Ajustado a la venta del cálculo igual que «El cruce».
  function htmlSemana(tiendas, x, c) {
    if (c.em === 'futuro' || !st.diario || !st.diario.length) return '';
    var cods = tiendas.map(function (t) { return t.t.cod; }), por = {};
    st.diario.forEach(function (r) { if (cods.indexOf(Number(r.codlocalidad)) >= 0) por[r.fecha] = (por[r.fecha] || 0) + (Number(r.venta) || 0); });
    var p = st.mes.split('-'), y = +p[0], m = +p[1] - 1, ult = new Date(y, m + 1, 0).getDate();
    var fin = new Date(y, m, Math.min(diaDeHoy(st.mes) || ult, ult));
    function f(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
    var crudoMes = 0; Object.keys(por).forEach(function (k) { if (k.slice(0, 7) === st.mes) crudoMes += por[k]; });
    var k = crudoMes > 0 && x.vn > 0 ? x.vn / crudoMes : 1;
    var dias = [], prev = 0;
    for (var i = 13; i >= 0; i--) { var d = new Date(fin); d.setDate(fin.getDate() - i); var v = (por[f(d)] || 0) * k; if (i >= 7) prev += v; else dias.push({ d: d, v: v }); }
    var sem = dias.reduce(function (a, b) { return a + b.v; }, 0);
    if (!(sem > 0)) return '';
    var hoy = dias[6].v, abiertos = dias.filter(function (z) { return z.v > 0; }), prom = abiertos.length ? sem / abiertos.length : 0;
    var mejor = dias.reduce(function (a, b) { return b.v > a.v ? b : a; }, dias[0]), vs = prev > 0 ? sem / prev - 1 : null;
    var meta = x.peDia || 0, maxV = Math.max(meta, mejor.v) * 1.12 || 1;
    var DN = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'], esHoy = c.em === 'actual';
    function corto(n) { return n >= 1e6 ? (n / 1e6).toFixed(1).replace('.0', '') + ' M' : n >= 1e3 ? Math.round(n / 1e3) + ' mil' : String(Math.round(n)); }
    var barras = dias.map(function (z, j) {
      var h = Math.max(2, Math.round(z.v / maxV * 100)), ult7 = j === 6;
      return '<div class="pe-sm-c' + (ult7 ? ' hoy' : '') + (z.v >= meta && meta > 0 ? ' ok' : '') + '" title="' + esc(DN[z.d.getDay()] + ' ' + z.d.getDate() + ': ' + plata(z.v)) + '"><i style="height:' + h + '%"></i><span>' + (ult7 && esHoy ? 'Hoy' : DN[z.d.getDay()]) + '</span></div>';
    }).join('');
    function cifra(t, v, col) { return '<div><small>' + t + '</small><b' + (col ? ' style="color:' + col + '"' : '') + '>' + v + '</b></div>'; }
    return '<div class="pe-sem"><div class="pe-cruce-h"><b>Su semana</b></div>' +
      '<div class="pe-sm-n">' + cifra(esHoy ? 'Hoy' : 'Último día', 'RD$ ' + corto(hoy), hoy >= meta && meta > 0 ? '#15803d' : '#e4572e') + cifra('Promedio', 'RD$ ' + corto(prom)) + cifra('Mejor día', 'RD$ ' + corto(mejor.v)) +
        cifra('vs 7 días antes', vs == null ? '—' : (vs >= 0 ? '+' : '−') + Math.abs(vs * 100).toFixed(1) + ' %', vs == null ? null : vs >= 0 ? '#15803d' : '#dc2626') + '</div>' +
      '<div class="pe-sm-g">' + (meta > 0 ? '<div class="pe-sm-meta" style="bottom:calc(20px + ' + (Math.min(100, meta / maxV * 100) * 1.1).toFixed(1) + 'px)"><em>' + esc('Meta ' + corto(meta)) + '</em></div>' : '') + barras + '</div></div>';
  }
  function htmlCruce(tiendas, x, c) {
    if (c.em === 'futuro' || x.pe == null || !(x.pe > 0)) return '';
    var p = st.mes.split('-'), y = +p[0], m = +p[1] - 1, ult = new Date(y, m + 1, 0).getDate(), ini = st.mes + '-01';
    var cods = tiendas.map(function (t) { return t.t.cod; }), dia = [];
    for (var d = 0; d <= ult; d++) dia.push(0);
    (st.diario || []).forEach(function (r) { if (cods.indexOf(Number(r.codlocalidad)) >= 0 && r.fecha >= ini && r.fecha.slice(0, 7) === st.mes) dia[+r.fecha.slice(8, 10)] += Number(r.venta) || 0; });
    var hoy = diaDeHoy(st.mes), crudo = 0, acum = [0];
    for (d = 1; d <= hoy; d++) { crudo += dia[d]; acum.push(crudo); }
    if (!(crudo > 0)) return '';
    // Se ajusta a la venta del cálculo (ITBIS, notas de crédito) para que la línea termine donde dice «Lleva vendido».
    var k = x.vn / crudo; acum = acum.map(function (v) { return v * k; });
    var cruce = null; for (d = 1; d <= hoy; d++) if (acum[d] >= x.pe) { cruce = d; break; }
    var proy = c.em === 'actual' && hoy < ult ? Math.max(x.proy, acum[hoy]) : null, cruceP = null;
    if (cruce == null && proy != null && proy >= x.pe) { var r = (proy - acum[hoy]) / (ult - hoy); cruceP = hoy + Math.ceil((x.pe - acum[hoy]) / (r || 1)); }
    var W = 320, H = 140, L = 8, R = 8, T = 22, Bm = 24, maxV = Math.max(x.pe, acum[hoy], proy || 0) * 1.1;
    function X(d) { return L + (W - L - R) * d / ult; } function Y(v) { return T + (H - T - Bm) * (1 - v / maxV); }
    var pts = acum.map(function (v, d) { return X(d).toFixed(1) + ',' + Y(v).toFixed(1); }).join(' ');
    var dc = cruce || cruceP, msg;
    if (cruce) msg = '<b style="color:#15803d">✓ Gana desde el día ' + cruce + '</b>';
    else if (cruceP && cruceP <= ult) msg = 'Ganaría desde el <b>día ' + cruceP + '</b>';
    else if (c.em === 'actual') msg = '<b style="color:#b45309">Al ritmo actual no llega</b>';
    else msg = '<b style="color:#b45309">No cubrió los gastos</b>';
    return '<div class="pe-cruce"><div class="pe-cruce-h"><b>El cruce</b></div>' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Venta acumulada del mes contra el punto de equilibrio">' +
      '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(x.pe).toFixed(1) + '" y2="' + Y(x.pe).toFixed(1) + '" stroke="#e4572e" stroke-width="2" stroke-dasharray="6 4"/>' +
      '<text x="' + (W - R) + '" y="' + (Y(x.pe) - 6).toFixed(1) + '" text-anchor="end" font-size="10" fill="#c2410c">Equilibrio ' + esc(plata(x.pe)) + '</text>' +
      (hoy > 0 && hoy < ult ? '<line x1="' + X(hoy).toFixed(1) + '" x2="' + X(hoy).toFixed(1) + '" y1="' + T + '" y2="' + (H - Bm) + '" stroke="#cbd5e1" stroke-dasharray="2 3"/>' : '') +
      (proy != null ? '<line x1="' + X(hoy).toFixed(1) + '" y1="' + Y(acum[hoy]).toFixed(1) + '" x2="' + X(ult).toFixed(1) + '" y2="' + Y(proy).toFixed(1) + '" stroke="#2563eb" stroke-width="2" stroke-dasharray="4 4" opacity=".6"/>' : '') +
      '<polyline points="' + pts + '" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linejoin="round"/>' +
      (dc && dc <= ult ? '<circle cx="' + X(dc).toFixed(1) + '" cy="' + Y(x.pe).toFixed(1) + '" r="5" fill="' + (cruce ? '#16a34a' : '#fff') + '" stroke="#16a34a" stroke-width="2"/>' : '') +
      '<text x="' + L + '" y="' + (H - 6) + '" font-size="10" fill="#64748b">Día 1</text>' +
      (hoy > 0 && hoy < ult ? '<text x="' + X(hoy).toFixed(1) + '" y="' + (H - 6) + '" font-size="10" fill="#64748b" text-anchor="middle">Hoy</text>' : '') +
      '<text x="' + (W - R) + '" y="' + (H - 6) + '" font-size="10" fill="#64748b" text-anchor="end">Día ' + ult + '</text></svg>' +
      '<p class="pe-cruce-m">' + msg + '</p><p class="pe-cruce-l"><i style="background:#2563eb"></i>Vendido <i style="background:#e4572e"></i>Equilibrio</p></div>';
  }
  function htmlResumen(x, nombre, esGeneral, c) {
    var itbis = c.itbis, avisos = [];
    if (window.BayolCaptura && window.BayolCaptura.tienePendientes()) avisos.push('Provisional: faltan gastos por confirmar');
    if (c.errVentas) { /* lo dice el recuadro «Faltan datos» */ }
    else if (c.em === 'futuro') avisos.push('Mes futuro: anote los gastos');
    else if (x.vn <= 0) avisos.push('Sin ventas en Info Plus este mes');
    if (x.ft <= 0) avisos.push('Faltan los gastos fijos');
    if (c.repMal) avisos.push('Reparto en ' + c.repSuma + ' %: debe sumar 100 %');
    if (x.mc <= 0 && x.vn > 0) avisos.push('El margen no cubre los gastos variables');
    if (x.faltan > 0) avisos.push(x.faltan + (x.faltan === 1 ? ' gasto sin monto' : ' gastos sin monto'));
    if ((!window.BayolCaptura || !window.BayolCaptura.tienePendientes()) && x.pe != null && x.vn >= x.pe && x.vn > 0) avisos.push('Gastos cubiertos: lo demás es ganancia');
    else if (c.em === 'actual' && x.pe != null && x.proy < x.pe && x.diaNecesario != null) avisos.push('Al ritmo actual no llega: ' + plata(x.diaNecesario) + ' por día');
    if (itbis) avisos.push('Ventas sin ITBIS (' + Math.round(c.g18 * 100) + ' %)');
    if (hayCuotaTotal()) avisos.push('Préstamos con cuota total: equilibrio más alto');
    if (c.sinAnt) avisos.push('Mes anterior sin ventas: comunes en partes iguales');
    var cnx = esGeneral ? Object.keys(c.cn).reduce(function (a, k) { a.n += c.cn[k].n; a.v += c.cn[k].venta; return a; }, { n: 0, v: 0 }) : (c.cn[x.t && x.t.cod] ? { n: c.cn[x.t.cod].n, v: c.cn[x.t.cod].venta } : null);
    if (cnx && cnx.n) avisos.push(cnx.n + (cnx.n === 1 ? ' devolución restada' : ' devoluciones restadas') + ' · ' + plata(cnx.v));
    var fv = ventasQueFaltan(esGeneral ? c.tiendas : [x], x.falta);
    return '<div class="pe-res">' +
      '<div class="pe-res-h"><b>' + esc(nombre) + '</b><span>' + (x.alcanzado != null ? pct(x.alcanzado) + ' del punto de equilibrio' : 'Sin punto de equilibrio') + '</span></div>' +
      barra(x.alcanzado) +
      htmlPildoras(esGeneral ? c.tiendas : [x], x, c) + htmlHoy(esGeneral ? c.tiendas : [x], c) +
      htmlErrores(c) +
      htmlMeta(x, esGeneral) +
      htmlPeriodos(esGeneral ? c.tiendas : [x], esGeneral) + (esGeneral ? '' : htmlVendedores(x)) +
      '<div class="pe-kpis">' +
        kpi('Debe vender', x.pe != null ? plata(x.pe) : '—', '#0f172a', x.peDia != null ? plata(x.peDia) + ' por día' : '') +
        kpi('Vendido', plata(x.vn), null, 'Margen ' + pct(x.mb)) +
        // En ganancia: lo que debe dejar la venta después del costo y los gastos variables, y lo que lleva.
        kpi('Ganancia necesaria', plata(x.ft), null, 'Lleva ' + '<b style="color:' + colorRes(x.vn * x.mc - x.ft) + '">' + plata(Math.max(0, x.vn * x.mc)) + '</b>') +
        kpi('Falta', x.falta != null ? plata(x.falta) : '—', x.falta ? '#b45309' : '#15803d', (x.diaNecesario != null ? plata(x.diaNecesario) + ' por día' : '') + (fv ? (x.diaNecesario != null ? '<br>' : '') + '≈ <b>' + fv.n.toLocaleString('es-DO') + ' ventas</b>' : '')) +
        kpi('Gastos fijos', plata(x.ft), null, 'Propios ' + plata(x.gf) + ' · comunes ' + plata(x.gc)) +
        kpi(window.BayolCaptura && window.BayolCaptura.tienePendientes() ? 'Resultado provisional' : (c.em === 'pasado' ? 'Resultado del mes' : 'Resultado a la fecha'), x.resultado == null ? '—' : plata(x.resultado), x.resultado == null ? null : colorRes(x.resultado),
          x.resultado == null ? '' : (window.BayolCaptura && window.BayolCaptura.tienePendientes() ? 'Con los gastos anotados' : (x.resultado >= 0 ? 'Ganancia' : 'Pérdida'))) +
        (!esGeneral ? kpi('Aporte de la tienda', x.aporte == null ? '—' : plata(x.aporte), x.aporte == null ? null : colorRes(x.aporte), 'Sin gastos comunes') : '') +
        kpi('Margen de seguridad', x.seguridad == null ? '—' : pct(x.seguridad), x.seguridad == null ? null : colorRes(x.seguridad), x.seguridad == null ? '' : (x.seguridad >= 0 ? 'Puede bajar sin perder' : 'Bajo el equilibrio')) +
        (x.capital > 0 && x.peCaja != null ? kpi('Con cuota del préstamo', plata(x.peCaja),
          x.faltaCaja ? '#b45309' : '#15803d',
          (x.faltaCaja ? 'Falta <b>' + plata(x.faltaCaja) + '</b>' + (x.diaCaja != null ? ' · ' + plata(x.diaCaja) + ' por día' : '') : 'Cuota cubierta') +
          '<br>Capital ' + plata(x.capital)) : '') +
        (c.em === 'actual' ? kpi('Proyección', plata(x.proy), null, 'Resultado ' + '<b style="color:' + colorRes(x.resultadoProy) + '">' + plata(x.resultadoProy) + '</b>') : '') +
      '</div>' + htmlSemana(esGeneral ? c.tiendas : [x], x, c) + htmlRangos(esGeneral ? c.tiendas : [x], x, c) + htmlCruce(esGeneral ? c.tiendas : [x], x, c) +
      (avisos.length ? '<ul class="pe-avisos">' + avisos.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ul>' : '') +
      '<p class="pe-nota">Estimado antes del ISR · No sustituye a la contadora</p>' +
    '</div>';
  }

  function htmlMeta(x, esGeneral) {
    var sug = x.metaSug ? plata(x.metaSug) : '—';
    var cab = '<div class="pe-meta-h"><b>Meta de venta del mes</b>' + (x.meta > 0 ? '<span>' + pct(x.metaAvance) + ' logrado</span>' : '') + '</div>';
    var cuerpo;
    if (esGeneral) {
      cuerpo = x.meta > 0
        ? '<div class="pe-meta-n">' + plata(x.meta) + '</div>' + barra(x.metaAvance) +
          '<p class="pe-meta-s">Lleva ' + plata(x.vn) + (x.metaFalta ? ' · falta <b>' + plata(x.metaFalta) + '</b>' + (x.metaDia ? ' · ' + plata(x.metaDia) + ' por día' : '') : ' · <b>meta cumplida</b>') +
          (x.metasFaltan ? '<br>Falta fijar la meta en ' + x.metasFaltan + ' tienda(s).' : '') + '</p>'
        : '<p class="pe-meta-s">Fije la meta en cada tienda. Sugerida para todo el negocio: <b>' + plata(x.metaSug || 0) + '</b>.</p>';
    } else {
      var cod = x.t.cod;
      cuerpo = '<div class="pe-meta-f"><input inputmode="decimal" aria-label="Meta de venta del mes" placeholder="Escriba la meta" value="' + (x.meta || '') + '" onchange="BayolEquilibrio._mt(' + cod + ',this.value)">' +
        (x.metaSug && x.metaSug !== x.meta ? '<button class="btn btn-light" onclick="BayolEquilibrio._ms(' + cod + ')">Usar sugerida ' + sug + '</button>' : '') + '</div>' +
        (x.meta > 0 ? barra(x.metaAvance) + '<p class="pe-meta-s">Lleva ' + plata(x.vn) + (x.metaFalta ? ' · falta <b>' + plata(x.metaFalta) + '</b>' + (x.metaDia ? ' · ' + plata(x.metaDia) + ' por día' : '') : ' · <b>meta cumplida</b>') + '</p>' : '') +
        '';
    }
    return '<div class="pe-meta">' + cab + cuerpo + '</div>';
  }

  // ---------- metas por periodo y por vendedor (dueño, 07-nov-2026) ----------
  // La meta del mes de cada tienda (la fija el dueño) se reparte por días hábiles del calendario: diaria, semanal y
  // quincenal (1–15 y 16–fin). La de cada vendedor = meta de la quincena × su %. El % sale solo de lo que vendió el
  // mes anterior en esa tienda; el dueño lo puede cambiar (variables.vend_pct).
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
    // Cada periodo es un dato con clave, etiqueta y detalle (C6 de untangle, 08-nov-2026). Antes la tarjeta volvía a leer
    // la etiqueta y el detalle desde el texto del nombre, y las quincenas se buscaban por sus días.
    // «nombre» queda armado igual que siempre, para el reporte y el Excel.
    function per(clave, etiqueta, detalle, d1, d2, actual, metaDia) {
      var mt = metaDia != null ? metaDia : meta(d1, d2);
      var v = metaDia != null || em === 'futuro' || (em === 'actual' && d1 > dHoy) ? null : vendido(cods, mes + '-' + f2(d1), mes + '-' + f2(d2));
      return { clave: clave, etiqueta: etiqueta, detalle: detalle, nombre: etiqueta + (detalle ? ' (' + detalle + ')' : ''),
        d1: d1, d2: d2, meta: mt, vendido: v, avance: mt > 0 && v != null ? v / mt : null, actual: !!actual };
    }
    var out = [];
    if (em === 'actual') {
      var dow = hoy.getDay(), lun = dHoy - ((dow + 6) % 7), dom = lun + 6;
      out.push(per('hoy', 'Hoy', hoy.toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric' }), dHoy, dHoy, true));
      out.push(per('semana', 'Esta semana', Math.max(1, lun) + ' al ' + Math.min(ult, dom), Math.max(1, lun), Math.min(ult, dom), true));
    } else {
      // Mes pasado o futuro: la meta de un día hábil como referencia.
      out.push(per('dia', 'Un día hábil', '', 1, 1, false, tiendas.reduce(function (s, x) { var tot = diasRango(mes, x.t.domingo, 1, ult); return s + (x.meta > 0 && tot ? x.meta / tot : 0); }, 0)));
    }
    out.push(per('q1', '1ª quincena', '1 al 15', 1, 15, dHoy != null && dHoy <= 15));
    out.push(per('q2', '2ª quincena', '16 al ' + ult, 16, ult, dHoy != null && dHoy > 15));
    out.push(per('mes', 'Mes completo', '', 1, ult));
    return out;
  }
  function periodoDe(lista, clave) { for (var i = 0; i < lista.length; i++) if (lista[i].clave === clave) return lista[i]; return null; }
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
    var q1 = periodoDe(per, 'q1'), q2 = periodoDe(per, 'q2');
    var tarjetas = em === 'actual' ? [periodoDe(per, 'hoy'), periodoDe(per, 'semana'), q1.actual ? q1 : q2, periodoDe(per, 'mes')] : [periodoDe(per, 'dia'), q1, q2, periodoDe(per, 'mes')];
    var etiqueta = function (r) { return r.etiqueta; }, detalle = function (r) { return r.detalle; };
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
      '<p class="pe-nota">Por días hábiles' + (esGeneral ? '' : (tiendas[0].t.domingo ? ' con domingos' : ' (lun–sáb)')) + '</p></section>';
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
    var per = periodosMeta([x]), q1 = periodoDe(per, 'q1'), q2 = periodoDe(per, 'q2');
    var em = estadoMes(st.mes), q = st.vendQ === 2 ? q2 : st.vendQ === 1 ? q1 : (em === 'actual' && q2.actual ? q2 : q1);
    var ult = q2.d2, hoy = new Date(), dHoy = em === 'actual' ? hoy.getDate() : (em === 'pasado' ? ult + 1 : 0);
    var tot = diasRango(st.mes, x.t.domingo, q.d1, q.d2);
    var hechos = dHoy <= q.d1 ? 0 : diasRango(st.mes, x.t.domingo, q.d1, Math.min(q.d2, dHoy - 1));   // hasta ayer
    var quedan = dHoy > q.d2 ? 0 : diasRango(st.mes, x.t.domingo, Math.max(q.d1, dHoy), q.d2);       // hoy incluido
    return { q: q, q1: q1, q2: q2, ideal: tot ? hechos / tot : 0, quedan: quedan, futura: dHoy <= q.d1 && em !== 'pasado' && !(em === 'actual' && dHoy === q.d1) };
  }
  // Cuadritos de hoy por vendedor: 6 cuadros que se llenan con lo vendido hoy contra lo que necesita por día.
  function cuadrosHoy(cod) {
    return function (f, V) {
      if (estadoMes(st.mes) !== 'actual' || V.futura || !V.quedan) return '';
      var necesita = Math.max(0, f.mt - f.v + 0) / V.quedan, hoy = vendido([cod], hoyISO(), hoyISO(), f.e.cod);
      if (!(necesita > 0)) return '';
      var llenos = Math.min(6, Math.floor(hoy / necesita * 6));
      return '<div class="pe-cua" title="Hoy ' + esc(plata(hoy)) + ' de ' + esc(plata(necesita)) + '"><span>' + Array.from({ length: 6 }, function (_, k) { return '<i' + (k < llenos ? ' class="on"' : '') + '></i>'; }).join('') + '</span><small>Hoy ' + corto(hoy) + ' de ' + corto(necesita) + '</small></div>';
    };
  }
  function htmlVendedores(x) {
    if (!(x.meta > 0)) return '';
    var cuadros = cuadrosHoy(x.t.cod);
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
          '<div class="pe-rk-f"><span>' + pie + '</span>' + chip + '</div>' + cuadros(f, V) + '</div></li>';
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
      '<p class="pe-nota">Raya negra: donde debería ir hoy' + (x.t.domingo ? ' (con domingos)' : '') + '</p></section>';
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
      function envolver(html) { return window.BayolCaptura ? window.BayolCaptura.render(g, cod, i, html) : html; }
      // Con la lista de préstamos, los intereses se llenan solos: no se escriben a mano.
      if (i === gi) return envolver('<div class="pe-g"><input class="pe-g-c" value="' + esc(g.concepto) + '" readonly aria-label="Concepto"><input class="pe-g-m" data-i="' + i + '" value="' + (g.monto === '' || g.monto == null ? '' : num(g.monto)) + '" readonly title="Se llena solo con la lista de préstamos" aria-label="Intereses de préstamos, se llena solo"><span class="pe-auto" title="Se llena solo con la lista de préstamos"><i class="ti ti-lock"></i></span></div>');
      return envolver('<div class="pe-g">' +
        '<input class="pe-g-c" value="' + esc(g.concepto) + '" placeholder="Concepto" onchange="BayolEquilibrio._c(' + cod + ',' + i + ',this.value)" aria-label="Concepto">' +
        '<input class="pe-g-m" data-i="' + i + '" inputmode="decimal" value="' + (g.monto === '' || g.monto == null ? '' : num(g.monto)) + '" placeholder="0.00" oninput="BayolEquilibrio._m(' + cod + ',' + i + ',this.value)" aria-label="Monto de ' + esc(g.concepto) + '">' +
        '<button class="pe-x" title="Quitar" aria-label="Quitar" onclick="BayolEquilibrio._q(' + cod + ',' + i + ')"><span aria-hidden="true">×</span></button>' +
      '</div>');
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
      '</div>' + (window.BayolCaptura ? '<details class="pc-ajustes"><summary>Ajustes contables</summary>' + vars + '</details>' : vars) +
    '</div>';
  }

  function htmlTotPrestamos() {
    var l = prestamos() || [], sep = l.filter(function (p) { return !esTotal(p); }), tot = l.filter(esTotal);
    var i = sep.reduce(function (s, p) { return s + num(p.interes); }, 0), k = sep.reduce(function (s, p) { return s + num(p.capital); }, 0), t = tot.reduce(function (s, p) { return s + num(p.cuota); }, 0);
    return (sep.length ? '<span>Intereses <b>' + plata(i) + '</b></span><span>Capital <b>' + plata(k) + '</b></span>' : '') +
      (tot.length ? '<span>Sin separar <b>' + plata(t) + '</b></span>' : '') + '<span>Cuota del mes <b>' + plata(i + k + t) + '</b></span>';
  }
  function htmlPrestamos(cvv) {
    var l = prestamos() || [];
    var filas = l.map(function (p, i) {
      var tot = esTotal(p), v = function (x) { return x === '' || x == null ? '' : num(x); };
      return '<div class="pe-p' + (tot ? ' pe-p-total' : '') + '">' +
        '<div class="pe-qseg pe-p-modo" role="group" aria-label="Cómo se anota el préstamo ' + (i + 1) + '">' +
          '<button type="button" class="' + (tot ? '' : 'on') + '" aria-pressed="' + !tot + '" onclick="BayolEquilibrio._pm(' + i + ',\'separado\')">Intereses y capital</button>' +
          '<button type="button" class="' + (tot ? 'on' : '') + '" aria-pressed="' + tot + '" onclick="BayolEquilibrio._pm(' + i + ',\'total\')">Cuota total</button></div>' +
        '<input class="pe-p-b" data-p="' + i + '" value="' + esc(p.banco || '') + '" placeholder="Banco o prestamista" aria-label="Banco del préstamo ' + (i + 1) + '" oninput="BayolEquilibrio._pb(' + i + ',\'banco\',this.value)">' +
        (tot
          ? '<label class="pe-p-cuota"><span>Cuota total del mes</span><input inputmode="decimal" value="' + v(p.cuota) + '" placeholder="0.00" oninput="BayolEquilibrio._pb(' + i + ',\'cuota\',this.value)"></label>'
          : '<label><span>Intereses</span><input inputmode="decimal" value="' + v(p.interes) + '" placeholder="0.00" oninput="BayolEquilibrio._pb(' + i + ',\'interes\',this.value)"></label>' +
            '<label><span>Capital</span><input inputmode="decimal" value="' + v(p.capital) + '" placeholder="0.00" oninput="BayolEquilibrio._pb(' + i + ',\'capital\',this.value)"></label>') +
        '<button class="pe-x" title="Quitar préstamo" aria-label="Quitar préstamo ' + (i + 1) + '" onclick="BayolEquilibrio._pq(' + i + ')"><i class="ti ti-x"></i></button>' +
      '</div>';
    }).join('');
    var suelto = !l.length && num(cvv.capital) > 0 ? '<p class="pe-nota">Capital anotado antes: ' + plata(num(cvv.capital)) + '. Al agregar el primer préstamo se pasa a la lista.</p>' : '';
    return '<div class="pe-prest" id="pePrest"><h4>Préstamos (cuota de este mes)</h4>' + filas + suelto +
      (l.length ? '<div class="pe-p-tot" id="pePrestTot">' + htmlTotPrestamos() + '</div>' : '') +
      '<div class="pe-acc"><button class="btn btn-light" onclick="BayolEquilibrio._pa()"><i class="ti ti-plus"></i> Agregar préstamo</button></div>' +
      '<p class="pe-nota">Los intereses son gasto y pasan solos a «Intereses de préstamos». El capital no es gasto, pero sale de la caja: por eso se muestra aparte cuánto vender para pagar la cuota completa.' +
      (hayCuotaTotal() ? ' <b>Con «Cuota total», toda la cuota cuenta como gasto hasta que la separe en intereses y capital.</b>' : '') + '</p></div>';
  }

  function htmlTablaGeneral(c) {
    return '<div class="pe-card"><h4>Por tienda</h4><div class="table-wrap"><table class="pe-tabla"><thead><tr><th>Tienda</th><th>Vendido</th><th>Margen</th><th>Contribución</th><th>Fijos (+ comunes)</th><th>Debe vender</th><th>Avance</th><th>Aporte (sin comunes)</th><th>' + (c.em === 'pasado' ? 'Resultado del mes' : 'Resultado a la fecha') + '</th></tr></thead><tbody>' +
      c.tiendas.map(function (x) {
        return '<tr tabindex="0" onclick="BayolEquilibrio.tab(' + x.t.cod + ')" onkeydown="if(event.key===\'Enter\')BayolEquilibrio.tab(' + x.t.cod + ')" style="cursor:pointer"><td data-label="Tienda"><b>' + esc(x.t.nombre) + '</b></td><td data-label="Vendido">' + plata(x.vn) + '</td><td data-label="Margen">' + pct(x.mb) + '</td><td data-label="Contribución">' + pct(x.mc) + '</td><td data-label="Fijos">' + plata(x.ft) + '</td><td data-label="Debe vender">' + (x.pe != null ? plata(x.pe) : '—') + '</td><td data-label="Avance">' + (x.alcanzado != null ? pct(x.alcanzado) : '—') + '</td><td data-label="Aporte" style="color:' + (x.aporte == null ? 'inherit' : colorRes(x.aporte)) + ';font-weight:700">' + (x.aporte == null ? '—' : plata(x.aporte)) + '</td><td data-label="Resultado" style="color:' + (x.resultado == null ? 'inherit' : colorRes(x.resultado)) + ';font-weight:700">' + (x.resultado == null ? '—' : plata(x.resultado)) + '</td></tr>';
      }).join('') +
      '</tbody></table></div><p class="pe-nota">El punto de equilibrio General usa el margen de todo el negocio junto; por eso no es la suma de las tiendas.</p></div>';
  }

  function refrescarCalculo() {
    if (window.BayolCaptura) {
      window.BayolCaptura.actualizar();
      document.querySelectorAll('.pc-gasto').forEach(function (el) { var f = fila(Number(el.dataset.pcCod)), g = f.gastos[Number(el.dataset.pcI)], sel = el.querySelector('[data-pc-estado]'); if (!sel || !g) return; var e = window.BayolCaptura.estado(g); if (e === 'pendiente' && !sel.querySelector('option[value=pendiente]')) sel.insertAdjacentHTML('afterbegin', '<option value="pendiente">Sin monto</option>'); sel.value = e; });
    }
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

  // Animaciones suaves: viven en conta-base.js (BayolConta.animar).

  function pintar() {
    var mt = $('peMesTxt'); if (mt) mt.textContent = etiquetaMes(st.mes);
    var cont = $('pe_contenido'); if (!cont) return;
    if (!puede()) { cont.innerHTML = '<p class="pe-vacio">Necesita permiso de Contabilidad para ver el punto de equilibrio.</p>'; return; }
    if (st.cargando) { pintarCarga(cont); return; }
    cont.removeAttribute('aria-busy');
    if (st.cargaMsg) { cont.innerHTML = '<div class="pe-vacio pe-carga-msg" role="alert"><p>' + esc(st.cargaMsg) + '</p><button type="button" class="btn btn-blue" onclick="BayolEquilibrio.recargar()"><i class="ti ti-refresh"></i> Reintentar</button></div>'; return; }
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
      }).join('') + '</div>' + (window.BayolCaptura ? '<div id="pcAvance">' + window.BayolCaptura.avance() + '</div>' : '') + cuerpo +
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
    var g = c.g, quedan = g.quedan;
    var V = function (cod) { return ventas ? window.BayolVentas.datos(cod, ventas, metasMes()) : null; };
    // Resumen en frases.
    var res = [], provisional = window.BayolCaptura && window.BayolCaptura.tienePendientes();
    if (window.BayolCaptura) { var captura = window.BayolCaptura.resumen([0].concat(TIENDAS.map(function (t) { return t.cod; })).map(fila)); res.push((provisional ? 'Equilibrio provisional' : 'Captura lista para revisión contable') + ': ' + captura.confirmados + ' de ' + captura.total + ' gastos confirmados; ' + captura.pendientes + ' sin monto, ' + captura.estimados + ' estimados y ' + captura.revisar + ' por revisar.'); }
    var corte = c.em === 'actual' ? 'al ' + new Date().toLocaleDateString('es-DO', { day: 'numeric', month: 'long' }) : (c.em === 'pasado' ? 'del mes completo' : '');
    if (g.pe != null) {
      res.push('En ' + nombreMes(st.mes).toLowerCase() + ' (' + corte + ') ' + B.lasTiendas() + ' llevan vendido ' + plata(g.vn) + ', el ' + pct(g.alcanzado) + ' de lo que necesitan para cubrir los gastos del mes (' + plata(g.pe) + ').');
      if (g.falta > 0) res.push('Para cubrir los gastos falta vender ' + plata(g.falta) + (g.diaNecesario ? ': ' + plata(g.diaNecesario) + ' por día en los ' + quedan + ' días que quedan.' : '.'));
      else if (!provisional) res.push('Los gastos del mes ya están cubiertos: lo que se venda de aquí en adelante, menos el costo y los gastos variables, es ganancia.');
    } else res.push('Todavía no se puede calcular el punto de equilibrio: faltan gastos o ventas del mes.');
    if (g.capital > 0 && g.peCaja != null) res.push('Para pagar también la cuota completa de los préstamos (capital ' + plata(g.capital) + ', que no es gasto pero sale de la caja) hay que vender ' + plata(g.peCaja) + (g.faltaCaja > 0 ? '; faltan ' + plata(g.faltaCaja) + (g.diaCaja ? ' (' + plata(g.diaCaja) + ' por día)' : '') + '.' : '; ya se alcanzó.'));
    if (g.meta > 0) res.push('La meta de venta del mes suma ' + plata(g.meta) + ' y va al ' + pct(g.metaAvance) + (g.metasFaltan ? ' (falta fijar la meta en ' + g.metasFaltan + ' tienda(s)).' : '.'));
    if (g.resultado != null) res.push((provisional ? 'Resultado provisional' : (g.resultado >= 0 ? 'Ganancia' : 'Pérdida')) + ' a la fecha: ' + plata(provisional ? g.resultado : Math.abs(g.resultado)) + (c.em === 'actual' ? ', comparando con los gastos de los días transcurridos. Al ritmo actual cerraría el mes en ' + plata(g.proy) + ' de venta y un resultado de ' + plata(g.resultadoProy) + '.' : '.'));
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
    c.tiendas.forEach(function (x) { if (!provisional && x.alcanzado != null && x.alcanzado >= 1) con.push(x.t.nombre + ' ya cubrió sus gastos del mes.'); });
    if (ventas) {
      var tv = V('todas'), dm = tv.detalle_venta + tv.mayor_venta;
      if (dm > 0) con.push('El ' + pct(tv.mayor_venta / dm) + ' de la venta de productos fue al por mayor y el ' + pct(tv.detalle_venta / dm) + ' al detalle. Se vendieron ' + entero(tv.cel_unid) + ' celulares y se cobraron ' + entero(tv.rep_n) + ' reparaciones.');
      window.BayolVentas.TIENDAS.forEach(function (t) { var d = V(t.cod); if (d.venta_total > 0 && d.rep_n < 3) con.push(t.nombre + ' tiene muy pocas reparaciones registradas (' + entero(d.rep_n) + '). Confirme que las facturas de reparación lleven «Servicio técnico».'); });
    }
    if (g.metasFaltan === TIENDAS.length) con.push('Fije la meta de venta en cada tienda para poder medir el avance.');
    if (g.faltan > 0) con.push('Hay ' + g.faltan + ' gasto(s) sin monto: el punto de equilibrio puede salir más bajo de lo real.');
    var comunes = (fila(0).gastos || []).filter(function (x) { return num(x.monto) > 0; }).map(function (x) { return { c: x.concepto, m: num(x.monto) }; });
    var prest = (prestamos() || []).map(function (p) { return { b: (p.banco || 'Préstamo') + (esTotal(p) ? ' (cuota total, sin separar)' : ''), i: interesDe(p), k: capitalDe(p) }; });
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
      '<div class="cab"><img src="' + e(logo) + '" alt="" onerror="this.style.display=\'none\'"><div><h1>Punto de equilibrio · ' + e(nombreMes(st.mes)) + '</h1><p>Bayol Cell · ' + e(B.nombresTiendas()) + ' · ' + e(c.em === 'actual' ? 'Datos ' + R.corte + ' (mes en curso)' : c.em === 'pasado' ? 'Mes completo' : 'Mes futuro') + '</p></div></div>' +
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
      var per = periodosMeta([x]), q1 = periodoDe(per, 'q1'), q2 = periodoDe(per, 'q2');
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
      hoja('Resumen', [['Punto de equilibrio · ' + nombreMes(st.mes)], ['Bayol Cell · ' + (c.em === 'actual' ? 'Datos ' + R.corte : c.em === 'pasado' ? 'Mes completo' : 'Mes futuro')], []]
        .concat(R.res.map(function (x) { return [x]; })).concat([[], ['Conclusiones']]).concat(R.con.map(function (x) { return ['• ' + x]; })), [120], {});
      hoja('Tiendas', [['Tienda', 'Meta', 'Vendido', '% de la meta', 'Debe vender (equilibrio)', '% del equilibrio', 'Le falta', 'Por día que queda', 'Para pagar también la cuota', 'Margen', 'Contribución', 'Resultado a la fecha', 'Aporte (sin comunes)', 'Proyección de venta']]
        .concat(c.tiendas.map(function (x) { return [x.t.nombre, r2(x.meta || null), r2(x.vn), p1(x.metaAvance), r2(x.pe), p1(x.alcanzado), r2(x.falta), r2(x.diaNecesario), r2(x.peCaja), p1(x.mb), p1(x.mc), r2(x.resultado), r2(x.aporte), r2(x.proy)]; }))
        .concat([['Todas', r2(g.meta || null), r2(g.vn), p1(g.metaAvance), r2(g.pe), p1(g.alcanzado), r2(g.falta), r2(g.diaNecesario), r2(g.peCaja), p1(g.mb), p1(g.mc), r2(g.resultado), '', r2(g.proy)]]),
        [12, 14, 14, 11, 18, 12, 14, 14, 18, 9, 11, 16, 16, 16], { B: RD, C: RD, D: PC, E: RD, F: PC, G: RD, H: RD, I: RD, J: PC, K: PC, L: RD, M: RD, N: RD });
      var gfil = [['Tienda / concepto', 'Monto']];
      [0].concat(TIENDAS.map(function (t) { return t.cod; })).forEach(function (cod) {
        var nom = cod === 0 ? 'Gastos comunes' : TIENDAS.filter(function (t) { return t.cod === cod; })[0].nombre;
        gfil.push([nom.toUpperCase(), '']);
        (fila(cod).gastos || []).forEach(function (x) { gfil.push(['   ' + x.concepto, x.monto === '' || x.monto == null ? '' : num(x.monto)]); });
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
      if (window.BayolCaptura) {
        var cf = [['Mes', 'Tienda', 'Concepto', 'Monto', 'Estado', 'Nota', 'Registró', 'Fecha', 'Comprobantes']];
        [0].concat(TIENDAS.map(function (t) { return t.cod; })).forEach(function (cod) { var nombre = cod === 0 ? 'Gastos comunes' : TIENDAS.find(function (t) { return t.cod === cod; }).nombre; fila(cod).gastos.forEach(function (g) { var m = g.captura || {}; cf.push([st.mes, nombre, g.concepto, g.monto === '' || g.monto == null ? '' : num(g.monto), window.BayolCaptura.estado(g), m.nota || '', m.por || '', m.fecha || '', (m.archivos || []).map(function (a) { return a.nombre; }).join('; ')]); }); });
        hoja('Captura', cf, [12, 18, 36, 16, 16, 45, 24, 24, 36], { D: RD });
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
      '#conta-equilibrio .pe-carga-msg p{margin:0 0 12px;font-size:16px;color:#0f172a}',
      '#conta-equilibrio .pe-carga-msg .btn{min-height:48px;padding:0 20px;font-size:16px}',
      '#conta-equilibrio .pe-esq{display:grid;gap:12px}',
      '#conta-equilibrio .pe-esq-b{display:block;border-radius:8px;background:linear-gradient(90deg,#e8edf4 25%,#f4f7fb 37%,#e8edf4 63%);background-size:400% 100%;animation:peEsq 1.4s ease infinite}',
      '#conta-equilibrio .pe-esq-tabs{display:flex;gap:6px;flex-wrap:wrap}',
      '#conta-equilibrio .pe-esq-tabs .pe-esq-b{border-radius:999px}',
      '#conta-equilibrio .pe-esq-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}',
      '#conta-equilibrio .pe-esq-caja{display:grid;gap:12px;border:1px solid #e2e8f0;border-radius:16px;padding:14px;background:#fff}',
      '#conta-equilibrio .pe-esq-fila{display:grid;gap:8px}',
      '#conta-equilibrio .pe-esq-aviso{display:flex;align-items:center;justify-content:center;gap:12px;padding:6px 0;font-size:15px;color:#475569}',
      '#conta-equilibrio .pe-esq-aviso[hidden]{display:none}',
      '#conta-equilibrio .pe-esq-aviso .btn{min-height:44px;padding:0 18px}',
      '@keyframes peEsq{0%{background-position:100% 50%}100%{background-position:0 50%}}',
      '@media (max-width:560px){#conta-equilibrio .pe-esq-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}',
      '@media (prefers-reduced-motion:reduce){#conta-equilibrio .pe-esq-b{animation:none}}',
      '#conta-equilibrio .pe-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:4px 0 12px}',
      '#conta-equilibrio .pe-tab{min-height:44px;padding:0 16px;border-radius:999px;border:1px solid #e2e8f0;background:#fff;font-size:14px;font-weight:600;color:#334155;cursor:pointer}',
      '#conta-equilibrio .pe-tab.on{background:#e4572e;border-color:#e4572e;color:#fff}',
      '#conta-equilibrio .pe-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:14px;align-items:start}',
      '@media (max-width:900px){#conta-equilibrio .pe-grid{grid-template-columns:minmax(0,1fr)}}',
      '@media (max-width:480px){#conta-equilibrio .pe-g{grid-template-columns:minmax(0,1fr) 44px;}#conta-equilibrio .pe-g-c{grid-column:1 / -1}#conta-equilibrio .pe-g-m{grid-column:1;width:100%}}',
      '#conta-equilibrio .pe-card,#conta-equilibrio .pe-res{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:14px;margin-bottom:12px;box-shadow:0 6px 18px -14px rgba(15,23,42,.35)}',
      '#conta-equilibrio .pe-card h4{margin:12px 0 8px;font-size:14px;color:#0f172a}',
      '#conta-equilibrio .pe-card-h{display:flex;justify-content:space-between;align-items:center;gap:8px}',
      '#conta-equilibrio .pe-card-h h4{margin:0}',
      '#conta-equilibrio .pe-card-h b{font-size:17px;font-variant-numeric:tabular-nums}',
      '#conta-equilibrio .pe-pils{display:flex;gap:8px;overflow-x:auto;padding:2px 0 10px;margin:4px 0;scrollbar-width:none}#conta-equilibrio .pe-pil{flex:0 0 auto;display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:8px 12px 8px 8px}#conta-equilibrio .pe-pil>i{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#f1f5f9;color:#334155;font-size:17px}#conta-equilibrio .pe-pil b{display:block;font-size:15px;font-variant-numeric:tabular-nums;white-space:nowrap}#conta-equilibrio .pe-pil small{font-size:11px;color:#64748b}',
      '#conta-equilibrio .pe-hoy{background:#111827;color:#fff;border-radius:18px;padding:16px;margin:4px 0 12px}#conta-equilibrio .pe-hoy-h{display:flex;justify-content:space-between;gap:8px;font-size:14px}#conta-equilibrio .pe-hoy-h span{color:#cbd5e1;font-size:12px;border:1px solid #475569;border-radius:999px;padding:2px 8px}#conta-equilibrio .pe-hoy-v{font-size:28px;font-weight:800;margin:6px 0;font-variant-numeric:tabular-nums}#conta-equilibrio .pe-hoy-b{height:6px;border-radius:6px;background:#374151;overflow:hidden}#conta-equilibrio .pe-hoy-b i{display:block;height:100%;background:#e4572e;border-radius:6px}#conta-equilibrio .pe-hoy p{margin:8px 0 0;font-size:13px;color:#e2e8f0}#conta-equilibrio .pe-hoy-n{display:flex;align-items:center;gap:8px;margin-top:10px}#conta-equilibrio .pe-hoy-n button{width:44px;height:44px;border-radius:50%;border:1px solid #4b5563;background:transparent;color:#fff;font-size:18px;cursor:pointer}#conta-equilibrio .pe-hoy-d{display:flex;gap:4px;margin-left:4px}#conta-equilibrio .pe-hoy-d s{width:6px;height:6px;border-radius:3px;background:#4b5563;text-decoration:none}#conta-equilibrio .pe-hoy-d s.on{width:18px;background:#e4572e}',
      '#conta-equilibrio .pe-rng{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:14px;margin:12px 0}#conta-equilibrio .pe-rng-f{margin-top:12px}#conta-equilibrio .pe-rng-h{display:flex;justify-content:space-between;align-items:center;gap:8px}#conta-equilibrio .pe-rng-h b{display:block;font-size:14px}#conta-equilibrio .pe-rng-h small{font-size:12px;color:#64748b}#conta-equilibrio .pe-rng-b{position:relative;height:6px;border-radius:6px;background:#f1f5f9;margin:10px 4px 4px}#conta-equilibrio .pe-rng-b s{position:absolute;top:0;height:100%;background:#cbd5e1;border-radius:6px}#conta-equilibrio .pe-rng-b i{position:absolute;top:50%;width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px #cbd5e1;transform:translate(-50%,-50%)}',
      '#conta-equilibrio .pe-cua{display:flex;align-items:center;gap:8px;margin-top:6px}#conta-equilibrio .pe-cua span{display:flex;gap:3px}#conta-equilibrio .pe-cua i{width:16px;height:12px;border-radius:3px;background:repeating-linear-gradient(135deg,#e2e8f0 0 2px,#f8fafc 2px 4px);border:1px solid #e2e8f0}#conta-equilibrio .pe-cua i.on{background:#e4572e;border-color:#e4572e}#conta-equilibrio .pe-cua small{font-size:11px;color:#64748b}',
      '#conta-equilibrio .pe-sem{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:14px;margin:12px 0}#conta-equilibrio .pe-sm-n{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin:8px 0 12px}#conta-equilibrio .pe-sm-n small{display:block;font-size:11px;color:#64748b}#conta-equilibrio .pe-sm-n b{font-size:15px;font-variant-numeric:tabular-nums;white-space:nowrap}',
      '#conta-equilibrio .pe-sm-g{position:relative;display:grid;grid-template-columns:repeat(7,1fr);gap:6px;height:130px;padding-bottom:20px;box-sizing:border-box}#conta-equilibrio .pe-sm-c{position:relative;display:flex;align-items:flex-end;justify-content:center;height:100%}#conta-equilibrio .pe-sm-c i{display:block;width:100%;max-width:34px;border-radius:8px 8px 4px 4px;background:repeating-linear-gradient(135deg,#e2e8f0 0 3px,#f8fafc 3px 6px);border:1px solid #e2e8f0}#conta-equilibrio .pe-sm-c.ok i{border-color:#bbf7d0}#conta-equilibrio .pe-sm-c.hoy i{background:#e4572e;border-color:#e4572e}#conta-equilibrio .pe-sm-c span{position:absolute;bottom:-20px;font-size:11px;color:#64748b}#conta-equilibrio .pe-sm-c.hoy span{color:#0f172a;font-weight:700}',
      '#conta-equilibrio .pe-sm-meta{position:absolute;left:0;right:0;border-top:1.5px dashed #94a3b8;z-index:1;pointer-events:none}#conta-equilibrio .pe-sm-meta em{position:absolute;right:0;top:-18px;font-style:normal;font-size:11px;font-weight:700;background:#334155;color:#fff;border-radius:6px;padding:1px 6px}',
      '@media (max-width:420px){#conta-equilibrio .pe-sm-n{grid-template-columns:repeat(2,minmax(0,1fr))}}',
      '#conta-equilibrio .pe-cruce{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:14px;margin:12px 0}#conta-equilibrio .pe-cruce-h{display:flex;justify-content:space-between;align-items:baseline;gap:8px}#conta-equilibrio .pe-cruce-h b{font-size:15px}#conta-equilibrio .pe-cruce-h span{font-size:12px;color:#64748b}#conta-equilibrio .pe-cruce svg{width:100%;max-width:420px;height:auto;display:block;margin:6px auto 0}#conta-equilibrio .pe-cruce-m{font-size:14px;margin:6px 0 2px;color:#0f172a}#conta-equilibrio .pe-cruce-l{font-size:12px;color:#64748b;margin:0;display:flex;align-items:center;gap:6px;flex-wrap:wrap}#conta-equilibrio .pe-cruce-l i{display:inline-block;width:14px;height:3px;border-radius:2px;margin-left:6px}',
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
      '@media (prefers-reduced-motion:reduce){#conta-equilibrio .pe-ring circle{transition:none}}',
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
      '#conta-equilibrio .pe-p-modo{grid-column:1 / -1;margin:0}',
      '#conta-equilibrio .pe-p-total .pe-p-cuota{grid-column:span 2}',
      '#conta-equilibrio .pe-p label{display:flex;flex-direction:column;gap:2px;font-size:13px;color:#64748b;min-width:0}',
      '#conta-equilibrio .pe-p input{height:48px;font-size:16px;border:1px solid #d8dee9;border-radius:10px;padding:0 10px;min-width:0;width:100%;box-sizing:border-box;background:#fff}',
      '#conta-equilibrio .pe-p label input{text-align:right;font-variant-numeric:tabular-nums}',
      '@media (max-width:480px){#conta-equilibrio .pe-p{grid-template-columns:minmax(0,1fr) minmax(0,1fr) 44px}#conta-equilibrio .pe-p-b{grid-column:1 / -1}#conta-equilibrio .pe-p-total .pe-p-cuota{grid-column:1 / 3}}',
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
      '#conta-equilibrio .pe-rep label{display:flex;align-items:center;gap:8px;min-height:44px;font-size:14px;cursor:pointer}',
      '#conta-equilibrio .pe-rep input{width:20px;height:20px}',
      '#conta-equilibrio .pe-res-h{display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap}',
      '#conta-equilibrio .pe-res-h b{font-size:17px}',
      '#conta-equilibrio .pe-res-h span{font-size:13px;color:#475569}',
      '#conta-equilibrio .pe-barra{height:10px;border-radius:999px;background:#f1f5f9;overflow:hidden;margin:8px 0 12px}',
      '#conta-equilibrio .pe-barra i{display:block;height:100%;border-radius:999px;transition:width 600ms cubic-bezier(.22,1,.36,1)}',
      '@keyframes peEntra{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}',
      '#conta-equilibrio .pe-in{animation:peEntra 420ms cubic-bezier(.22,1,.36,1) both;animation-delay:var(--pe-d,0ms)}',
      '#conta-equilibrio .pe-ring circle:last-child{transition:stroke-dasharray 700ms cubic-bezier(.22,1,.36,1)}',
      '#conta-equilibrio .pe-trk>i{transition:width 650ms cubic-bezier(.22,1,.36,1)!important}',
      '#conta-equilibrio .pe-tab,#conta-equilibrio .pe-qseg button{transition:background 220ms ease,color 220ms ease,box-shadow 220ms ease,transform 100ms ease-out}',
      '@media (prefers-reduced-motion:reduce){#conta-equilibrio .pe-in{animation:none}#conta-equilibrio .pe-ring circle:last-child,#conta-equilibrio .pe-barra i,#conta-equilibrio .pe-trk>i{transition:none!important}}',
      '#conta-equilibrio .pe-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px}',
      '#conta-equilibrio .pe-kpi{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:9px 11px;display:flex;flex-direction:column;gap:2px}',
      '#conta-equilibrio .pe-kpi small{font-size:13px;color:#475569}',
      '#conta-equilibrio .pe-kpi b{font-size:18px;font-variant-numeric:tabular-nums}',
      '#conta-equilibrio .pe-kpi span{font-size:13px;color:#475569}',
      '#conta-equilibrio .pe-kpi span b{font-size:inherit}',
      '@media (max-width:560px){#conta-equilibrio .pe-kpis{grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}#conta-equilibrio .pe-kpi{padding:8px 9px;border-radius:10px}#conta-equilibrio .pe-kpi small{font-size:12px}#conta-equilibrio .pe-kpi b{font-size:15px;overflow-wrap:anywhere}#conta-equilibrio .pe-kpi span{font-size:12px;line-height:1.35}}',
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
        '<div class="pe-bar"><div class="pe-mes" id="peMes">' +
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
    if (!st.mes) st.mes = mesHoy();
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
      '<li>«General» suma ' + B.lasTiendas() + ' y los gastos comunes.</li></ul>' +
      '<p>Los montos son de referencia; la contadora confirma las cifras formales.</p>';
    if (typeof abrirAyuda === 'function') abrirAyuda('Punto de equilibrio', html); else alert(html.replace(/<[^>]+>/g, ' '));
  }

  window.BayolEquilibrio = {
    tab: function (k) { if (k === 'ventas' && !window.BayolVentas) k = 'general'; if (k !== 'general' && k !== 'comunes' && k !== 'ventas' && !TIENDAS.some(function (t) { return t.cod === k; })) return; st.tab = k; st.animar = true; pintar(); },
    mes: function (v) {
      if (!v || st.guardando) return;
      if (window.BayolCaptura && window.BayolCaptura.ocupado()) { aviso('Espere al comprobante.', 'error'); return; }
      var seguir = function () { st.mes = v; st.filas = {}; cargar(); };
      if (st.sucio && typeof confirmar === 'function') confirmar('Hay cambios sin guardar. ¿Cambiar de mes y perderlos?').then(function (ok) { if (ok) seguir(); });
      else seguir();
    },
    cancelarCarga: cancelarCarga,
    recargar: function () {
      if (st.guardando || (window.BayolCaptura && window.BayolCaptura.ocupado())) { aviso('Espere al comprobante o al guardado.', 'error'); return; }
      if (window.BayolVentas && window.BayolVentas.olvidar) window.BayolVentas.olvidar();
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
    _pintar: pintar,
    _refrescar: refrescarCalculo,
    _m: editMonto, _c: editConcepto, _a: agregarConcepto, _q: quitarConcepto, _v: editVar, _d: editDias, _r: editComun, _rp: editRepartoPct, _n: sugerirNomina, _pb: editPrestamo, _pm: modoPrestamo, _pa: agregarPrestamo, _pq: quitarPrestamo, _mt: editMeta, _ms: usarMetaSugerida, _mp: mesPaso, _ma: abrirMeses, _vp: editVendPct, _vq: function (n) { st.vendQ = n; st.animar = true; pintar(); }, _hoy: function (d) { st.hoyIdx = (st.hoyIdx || 0) + d; pintar(); }, _vs: hojaVend, _vc: cerrarHoja, _anim: animarEntrada, _vm: editVendMonto, _vr: repartirVend
  };

  var avisoNeg = 0;
  function sinNegativos(e) {
    var el = e.target;
    if (!el || el.tagName !== 'INPUT' || el.getAttribute('inputmode') !== 'decimal' || el.value.indexOf('-') < 0) return;
    if (!el.closest('#conta-equilibrio, #peVendSheet')) return;
    el.value = el.value.replace(/-/g, '');
    if (Date.now() - avisoNeg > 4000) { avisoNeg = Date.now(); aviso('Solo números positivos.', 'error'); }
  }
  // Fase de captura: se limpia el campo antes de que lo lea su propio oninput / onchange.
  document.addEventListener('input', sinNegativos, true);

  function iniciar() {
    if (!envolver()) { setTimeout(iniciar, 300); return; }
    asegurarPestana(); mostrarBoton();
    var v = $('v-contabilidad');
    if (v && v.classList.contains('active')) { try { if (localStorage.getItem('bayol_subtab_conta') === 'equilibrio') window.contaTab('equilibrio'); } catch (e) {} }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
