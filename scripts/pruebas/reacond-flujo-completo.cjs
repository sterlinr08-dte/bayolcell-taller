// Reacondicionados de punta a punta (26-oct-2026), banco local con Supabase simulado.
// Recorre: crear lote → evaluar (fallas y piezas) → tareas → asignar técnico → pedir/entregar/recibir pieza → reparar
// → control de calidad → Listo → despacho (descuento Info Plus simulado) → devolución y segundo ciclo, más un equipo que
// pasa directo a Listo y otro que se despacha en bloque. Al final revisa la coherencia de estado, historial y costo.
// Las RPC del servidor se simulan aquí con la misma regla que la base (supabase/migrations/20261024130000_*).
// Uso: node scripts/pruebas/servidor.cjs &  luego  node scripts/pruebas/reacond-flujo-completo.cjs [carpeta-capturas]
//      (PUERTO=8808 para otro puerto; por defecto 8788).
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
const PUERTO = process.env.PUERTO || '8788';
const CAPT = process.argv[2] || '';
const STUB = fs.readFileSync(path.join(__dirname, 'supabase-stub.js'), 'utf8')
  // El stub general ignora .not(); aquí se hace real para que el costo y el descuento lean como la base.
  .replace("b.maybeSingle = ", "b.not = (c, op, v) => chain(() => { if (op === 'is') st.filtros.push(r => !(r[c] == v)); else if (op === 'in') { const vals = String(v).replace(/[()\"]/g, '').split(','); st.filtros.push(r => !vals.includes(String(r[c]))); } }); b.maybeSingle = ");

(async () => {
  const b = await chromium.launch(); let fallos = 0;
  for (const W of [390, 1280]) {
    const ctx = await b.newContext({ viewport: { width: W, height: 900 } });
    await ctx.route(/supabase-js|googleapis|gstatic|unpkg|cdnjs/, r => { const u = r.request().url(); if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: STUB }); r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message.slice(0, 200)));
    await p.goto(`http://127.0.0.1:${PUERTO}/taller.html?f=${Date.now()}`, { waitUntil: 'load', timeout: 120000 });
    await p.waitForTimeout(3000);

    // ---------- Preparación: sesión de admin, base simulada, RPC del servidor y espía de transiciones ----------
    await p.evaluate(() => {
      const T = window.__T = { pasos: [], trans: [], ip: [], confirmarNo: 0, textos: [] };
      const U = '11111111-1111-4111-8111-111111111111', TEC = '22222222-2222-4222-8222-222222222222';
      T.U = U; T.TEC = TEC;
      sessionUser = { id: U, nombre: 'Admin', usuario: 'admin', rol: 'admin', _tipo: 'usuario' };
      document.body.classList.add('logged-in'); document.getElementById('app').style.display = 'block';
      document.getElementById('login').style.display = 'none'; document.getElementById('appLoader').style.display = 'none';
      const BD = window.__BD.tablas;
      BD.tecnicos = [{ id: TEC, nombre: 'Josiel', activo: true, rol: 'tecnico' }];
      BD.refurb_lotes = []; BD.equipos_refurbish = []; BD.equipo_piezas_pedidas = []; BD.equipo_fallas = []; BD.equipo_historial = []; BD.tareas_trabajo = []; BD.equipo_devoluciones = [];
      BD.piezas_inventario = [{ id: 'inv1', codigo: 'BAT11', nombre: 'Batería 11', cantidad: 4, costo: 900 }];
      const ahora = () => new Date().toISOString();
      const uid = () => ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => (c ^ Math.random() * 16 >> c / 4).toString(16));
      // Evidencia de transiciones, como el trigger refurb_transiciones de la base.
      const marcar = (row, nuevo, origen) => { if (row.estado_evaluacion !== nuevo) T.trans.push({ id: row.id, de: row.estado_evaluacion, a: nuevo, origen }); row.estado_evaluacion = nuevo; };
      const fromOrig = supabaseClient.from.bind(supabaseClient);
      supabaseClient.from = (t) => {
        const bl = fromOrig(t); if (t !== 'equipos_refurbish') return bl;
        const thenOrig = bl.then; bl.then = (res, rej) => {
          const antes = new Map(BD.equipos_refurbish.map(r => [r.id, r.estado_evaluacion]));
          return thenOrig.call(bl, (out) => { BD.equipos_refurbish.forEach(r => { const a = antes.get(r.id); if (antes.has(r.id) && a !== r.estado_evaluacion) T.trans.push({ id: r.id, de: a, a: r.estado_evaluacion, origen: 'cliente' }); }); return res ? res(out) : out; }, rej);
        };
        return bl;
      };
      const rpcOrig = supabaseClient.rpc.bind(supabaseClient);
      supabaseClient.rpc = async (n, a) => {
        a = a || {};
        if (n === 'reacond_crear_lote') {
          const cod = String(a.p_lote.codigo_lote || '').trim();
          if (BD.refurb_lotes.some(l => l.codigo_lote === cod)) return { data: null, error: { message: `Ya existe un lote con el código «${cod}». No se creó nada.` } };
          const imeis = new Set(BD.equipos_refurbish.map(e => e.imei).filter(Boolean));
          const rep = (a.p_equipos || []).find(e => e.imei && imeis.has(String(e.imei).trim()));
          if (rep) return { data: null, error: { message: `Hay un IMEI que ya existe en reacondicionados (${rep.imei}). No se creó el lote; corrija el IMEI y vuelva a intentar.` } };
          const L = { id: uid(), codigo_lote: cod, proveedor_id: a.p_lote.proveedor_id || null, fecha_compra: a.p_lote.fecha_compra, costo_total_lote: Number(a.p_lote.costo_total_lote) || 0, gastos_envio: Number(a.p_lote.gastos_envio) || 0, estado: a.p_lote.estado || 'Abierto', creado_en: ahora() };
          const eqs = (a.p_equipos || []).map(e => ({ id: uid(), lote_id: L.id, modelo: e.modelo || 'Equipo', articulo_codigo: e.articulo_codigo || null, imei: e.imei ? String(e.imei).trim() : null, marca: e.marca || null, capacidad: e.capacidad || null, color: e.color || null, costo_compra: Number(e.costo_compra) || 0, costo_repuestos: 0, estado_evaluacion: 'pendiente', veces_devuelto: 0, ciclo_actual: 1, completado: false, creado_en: ahora() }));
          if (!eqs.length) return { data: null, error: { message: 'El lote no trae equipos. No se creó nada.' } };
          L.cantidad_equipos = eqs.length; BD.refurb_lotes.push(L); BD.equipos_refurbish.push(...eqs);
          return { data: { ok: true, lote_id: L.id, equipos: eqs.length }, error: null };
        }
        if (n === 'reacond_guardar_evaluacion') {
          const eq = BD.equipos_refurbish.find(e => e.id === a.p_equipo); if (!eq) return { data: null, error: { message: 'El equipo no existe.' } };
          if (eq.estado_evaluacion === 'vendido') return { data: null, error: { message: 'Este equipo ya está Despachado; no se puede volver a evaluar.' } };
          BD.equipo_fallas = BD.equipo_fallas.filter(f => f.equipo_id !== eq.id).concat((a.p_fallas || []).map(f => Object.assign({ id: uid(), equipo_id: eq.id }, f)));
          BD.equipo_piezas_pedidas = BD.equipo_piezas_pedidas.filter(x => !(x.equipo_id === eq.id && (Number(x.infoplus_desc_cant) || 0) === 0))
            .concat((a.p_piezas || []).map(x => ({ id: uid(), equipo_id: eq.id, pieza_id: x.pieza_id || null, pieza_codigo: x.pieza_codigo || null, pieza_nombre: x.pieza_nombre, cantidad: Math.max(1, Number(x.cantidad) || 1), costo_unitario: Number(x.costo_unitario) || 0, estado: x.estado || 'pendiente', infoplus_desc_cant: 0, creado_en: ahora() })));
          const costo = BD.equipo_piezas_pedidas.filter(x => x.equipo_id === eq.id && !['devuelta', 'rechazada'].includes(x.estado)).reduce((s, x) => s + Math.max(1, Number(x.cantidad) || 1) * (Number(x.costo_unitario) || 0), 0);
          eq.notas_diagnostico = a.p_notas; eq.costo_repuestos = costo; marcar(eq, a.p_marcar_evaluado ? 'evaluado' : 'en_evaluacion', 'rpc');
          const cat = (a.p_catalogo || []).map(x => String(x).toLowerCase().trim()), nuevas = (a.p_tareas || []).map(x => String(x).toLowerCase().trim());
          BD.tareas_trabajo = BD.tareas_trabajo.filter(t => !(t.tipo === 'equipo' && t.ref_id === eq.id && t.estado !== 'hecha' && cat.includes(String(t.descripcion).toLowerCase().trim()) && !nuevas.includes(String(t.descripcion).toLowerCase().trim())));
          (a.p_tareas || []).forEach(x => { if (!BD.tareas_trabajo.some(t => t.tipo === 'equipo' && t.ref_id === eq.id && String(t.descripcion).toLowerCase().trim() === String(x).toLowerCase().trim())) BD.tareas_trabajo.push({ id: uid(), tipo: 'equipo', ref_id: eq.id, descripcion: String(x).trim(), tecnico_id: null, estado: 'pendiente', creado_en: ahora() }); });
          return { data: { ok: true, costo_repuestos: costo, estado: eq.estado_evaluacion }, error: null };
        }
        if (n === 'reacond_registrar_devolucion') {
          const eq = BD.equipos_refurbish.find(e => e.id === a.p_equipo);
          if (!eq || eq.estado_evaluacion !== 'vendido') return { data: null, error: { message: `Solo se puede devolver un equipo Despachado (este está en «${eq && eq.estado_evaluacion}»).` } };
          const veces = (eq.veces_devuelto || 0) + 1, ciclo = (eq.ciclo_actual || 1) + 1;
          const dv = { id: uid(), equipo_id: eq.id, motivo_devolucion: a.p_motivo, problemas_reportados: a.p_problemas, ciclo: veces, creado_en: ahora() }; BD.equipo_devoluciones.push(dv);
          Object.assign(eq, { tecnico_asignado_id: a.p_tecnico, fecha_asignacion: ahora(), fecha_terminado: null, completado: false, fecha_completado: null, fecha_despacho: null, veces_devuelto: veces, ciclo_actual: ciclo });
          marcar(eq, 'en_proceso', 'rpc');
          BD.equipo_historial.push({ id: uid(), equipo_id: eq.id, estado_anterior: 'vendido', estado_nuevo: 'en_proceso', accion: 'Equipo devuelto', notas: 'Motivo: ' + a.p_motivo, usuario: a.p_usuario, fecha: ahora() });
          return { data: { ok: true, devolucion_id: dv.id, veces_devuelto: veces, ciclo }, error: null };
        }
        if (n === 'reacond_ip_reservar') {
          const pz = BD.equipo_piezas_pedidas.find(x => x.id === a.p_pieza);
          if (pz && (Number(pz.infoplus_desc_cant) || 0) === 0) { pz.infoplus_desc_cant = -1; pz.infoplus_ref = a.p_ref; return { data: { ok: true, ganada: true, ref: a.p_ref }, error: null }; }
          return { data: { ok: true, ganada: false }, error: null };
        }
        if (n === 'reacond_ip_liberar') { const pz = BD.equipo_piezas_pedidas.find(x => x.id === a.p_pieza); const lib = !!(pz && pz.infoplus_desc_cant === -1); if (lib) pz.infoplus_desc_cant = 0; return { data: { ok: true, liberada: lib }, error: null }; }
        if (n === 'ajustar_stock_pieza') { const pz = BD.piezas_inventario.find(x => x.id === a.p_pieza_id); const antes = pz.cantidad; pz.cantidad = Math.max(0, antes + a.p_delta); return { data: { ok: true, antes, cantidad: pz.cantidad, truncado: antes + a.p_delta < 0 }, error: null }; }
        return rpcOrig(n, a);
      };
      // Ventanas del sistema: se responde «sí» salvo que la prueba pida un «no»; los textos salen de una cola.
      window.confirmar = async () => { if (T.confirmarNo > 0) { T.confirmarNo--; return false; } return true; };
      window.pedirTexto = async () => (T.textos.length ? T.textos.shift() : '');
      window.smartSelectGetValue = () => TEC;
      window._infoplusAjustePieza = async (cod, cant, pu, entrada, com) => { T.ip.push({ cod, cant, entrada, com }); return { ok: true, codajuste: 'AJ-' + T.ip.length }; };
      window._findInfoplusArt = () => ({ existencias: { '6': 5 } });
      cache.fallas = [{ id: 'f1', nombre: 'Pantalla rota', nombre_corto: 'Pantalla', categoria_id: 'c1' }, { id: 'f2', nombre: 'Batería baja', nombre_corto: 'Batería', categoria_id: 'c1' }];
      cache.fallaCategorias = [{ id: 'c1', nombre: 'Hardware' }];
      T.toast = () => ((document.getElementById('toast') || {}).textContent || '').trim();
      T.paso = (nombre, ok, detalle) => { T.pasos.push({ nombre, ok: !!ok, detalle: detalle === undefined ? '' : detalle }); };
      T.eq = (id) => BD.equipos_refurbish.find(e => e.id === id);
      T.hist = (id) => BD.equipo_historial.filter(h => h.equipo_id === id);
    });

    // ---------- 1. Crear lote desde manifiesto ----------
    await p.evaluate(async () => {
      const T = window.__T, BD = window.__BD.tablas;
      _manifData = { tasa: 58, phones: [
        { modelo: 'iPhone 11', imei: '351111111111111', marca: 'Apple', memoria: '64GB', color: 'Negro', rd: 10000, usd: 172 },
        { modelo: 'iPhone 12', imei: '352222222222222', marca: 'Apple', memoria: '128GB', color: 'Azul', rd: 14000, usd: 241 },
        { modelo: 'iPhone 13', imei: '353333333333333', marca: 'Apple', memoria: '128GB', color: 'Rojo', rd: 18000, usd: 310 }], modelos: {} };
      ['manifProv', 'manifLote', 'manifFecha', 'manifFlete'].forEach(id => { if (!document.getElementById(id)) { const i = document.createElement('input'); i.id = id; document.body.appendChild(i); } });
      document.getElementById('manifLote').value = 'LOTE-E2E'; document.getElementById('manifFlete').value = '1500';
      window.abrirLoteReacond = window.abrirLoteReacond; // se usa la real
      await crearLoteDesdeManifiesto();
      const L = BD.refurb_lotes[0];
      T.L = L && L.id; T.E = BD.equipos_refurbish.map(e => e.id);
      T.paso('1 Crear lote', L && BD.equipos_refurbish.length === 3 && L.cantidad_equipos === 3 && BD.equipos_refurbish.every(e => e.estado_evaluacion === 'pendiente'), { lote: L && L.codigo_lote, equipos: BD.equipos_refurbish.length, envio: L && L.gastos_envio, toast: T.toast() });
      // Repetir el mismo código: no debe crear nada
      await crearLoteDesdeManifiesto();
      T.paso('1b Lote repetido no duplica', BD.refurb_lotes.length === 1 && BD.equipos_refurbish.length === 3, T.toast());
      await loadAll();
    });
    // Vista del lote (captura «antes» del recorrido)
    await p.evaluate(() => { try { nav('refurb'); } catch (e) {} });
    await p.waitForTimeout(400);
    await p.evaluate(() => { abrirLoteReacond(window.__T.L); const f = document.getElementById('reacondFiltroEstado'); if (f) f.value = ''; renderDetalleLoteReacond(); });
    await p.waitForTimeout(500);
    const tarjetas0 = await p.evaluate(() => [...document.querySelectorAll('#reacondDetalleLote .bcf-card')].map(c => c.querySelector('.bcf-tag')?.textContent.trim()));
    if (CAPT) await p.screenshot({ path: path.join(CAPT, `flujo-${W}-1-lote.png`), fullPage: false });

    // ---------- 2-9. Recorrido del equipo 1 ----------
    const r = await p.evaluate(async (tarjetas0) => {
      const T = window.__T, BD = window.__BD.tablas; const [E1, E2, E3] = T.E;
      T.paso('1c Tarjetas del lote', tarjetas0.length === 3 && tarjetas0.every(t => t === 'Recibido'), tarjetas0);
      // 2. Empezar evaluación
      const h0 = T.hist(E1).length;
      await empezarEvaluacion(E1);
      const c1 = (cache.refurb.find(e => e.id === E1) || {}).estado_evaluacion;
      T.paso('2 Empezar evaluación', T.eq(E1).estado_evaluacion === 'en_evaluacion', { base: T.eq(E1).estado_evaluacion, cache: c1, historial: T.hist(E1).length - h0 });
      // 3. Guardar evaluación con 2 fallas y 1 pieza de Info Plus
      _evalState.fallasSeleccionadas = new Set(['f1', 'f2']); _evalState.fallasNotas = { f1: 'rajada' };
      _evalState.piezasSeleccionadas.push({ pieza_codigo: 'P100', pieza_nombre: 'Pantalla 11', cantidad: 1, costo_unitario: 2500, infoplus_desc_cant: 0 });
      document.getElementById('eval_notas').value = 'Pantalla y batería';
      await guardarEvaluacion(true);
      const tareas1 = BD.tareas_trabajo.filter(t => t.ref_id === E1);
      T.paso('3 Evaluación guardada', T.eq(E1).estado_evaluacion === 'evaluado' && BD.equipo_fallas.filter(f => f.equipo_id === E1).length === 2 && tareas1.length === 2 && T.eq(E1).costo_repuestos === 2500, { estado: T.eq(E1).estado_evaluacion, tareas: tareas1.map(t => t.descripcion), costo: T.eq(E1).costo_repuestos, toast: T.toast() });
      // 4. Asignar técnico
      abrirModalAsignarTecnico(E1); document.getElementById('asign_notas').value = 'Prioridad';
      await confirmarAsignarTecnico();
      const hAsig = T.hist(E1).slice(-1)[0] || {};
      T.paso('4 Asignar técnico', T.eq(E1).estado_evaluacion === 'en_proceso' && T.eq(E1).tecnico_asignado_id === T.TEC && BD.tareas_trabajo.filter(t => t.ref_id === E1).every(t => t.tecnico_id === T.TEC), { estado: T.eq(E1).estado_evaluacion, historial: hAsig.estado_anterior + '→' + hAsig.estado_nuevo });
      // 5. Técnico recibe y pide una pieza; espera pieza
      await cambiarEstadoProceso(E1, 'tecnico_recibio');
      await solicitarPiezaDeFalla(E1, encodeURIComponent('Batería 11'));
      const pzT = BD.equipo_piezas_pedidas.find(x => x.equipo_id === E1 && x.agregada_por_tecnico);
      if (pzT) pzT.pieza_id = 'inv1';
      await cambiarEstadoProceso(E1, 'espera_pieza');
      T.paso('5 Pedir pieza', !!pzT && pzT.estado === 'pendiente' && T.eq(E1).estado_evaluacion === 'espera_pieza', { pieza: pzT && pzT.estado, estado: T.eq(E1).estado_evaluacion });
      // 5b. Con pieza pendiente no puede ir a calidad
      await cambiarEstadoProceso(E1, 'tecnico_recibio');
      await cambiarEstadoProceso(E1, 'listo_revision');
      T.paso('5b Candado de pieza pendiente', T.eq(E1).estado_evaluacion === 'tecnico_recibio' && /piezas pendientes/.test(T.toast()), T.toast());
      // 6. Entregar y recibir pieza (stock baja una vez aunque se toque dos veces)
      await marcarPiezaEntregada(pzT.id);
      await marcarPiezaRecibida(pzT.id); await marcarPiezaRecibida(pzT.id);
      T.paso('6 Entregar y recibir pieza', pzT.estado === 'recibida' && BD.piezas_inventario[0].cantidad === 3, { pieza: pzT.estado, stock: BD.piezas_inventario[0].cantidad });
      // 7. Tareas: con tareas abiertas el admin puede negarse a forzar
      T.confirmarNo = 1; await cambiarEstadoProceso(E1, 'listo_revision');
      T.paso('7 Candado de tareas abiertas', T.eq(E1).estado_evaluacion === 'tecnico_recibio', T.eq(E1).estado_evaluacion);
      const ts = BD.tareas_trabajo.filter(t => t.ref_id === E1);
      for (const t of ts) await completarTarea(t.id, 'equipo', E1);
      T.paso('7b Tareas hechas → calidad', ts.every(t => t.estado === 'hecha') && T.eq(E1).estado_evaluacion === 'listo_revision', { tareas: ts.map(t => t.estado), estado: T.eq(E1).estado_evaluacion });
      // 8. Control de calidad → Listo
      await aprobarTerminado(E1);
      T.paso('8 Calidad → Listo', T.eq(E1).estado_evaluacion === 'listo_venta' && !!T.eq(E1).fecha_terminado, { estado: T.eq(E1).estado_evaluacion, fecha_terminado: !!T.eq(E1).fecha_terminado });
      // 9. Despacho (doble clic): una sola salida, una sola baja en Info Plus
      const ip0 = T.ip.length;
      await Promise.all([marcarDespachado(E1), marcarDespachado(E1)]);
      const hDesp = T.hist(E1).filter(h => h.estado_nuevo === 'vendido').length;
      const pzIP = BD.equipo_piezas_pedidas.find(x => x.equipo_id === E1 && x.pieza_codigo === 'P100');
      T.paso('9 Despacho (doble clic)', T.eq(E1).estado_evaluacion === 'vendido' && !!T.eq(E1).fecha_despacho && T.ip.length - ip0 === 1 && hDesp === 1 && pzIP.infoplus_desc_cant === 1, { estado: T.eq(E1).estado_evaluacion, bajasIP: T.ip.length - ip0, historialSalida: hDesp, pieza: pzIP && pzIP.infoplus_desc_cant });
      // 9b. Despachar otra vez un equipo ya despachado: no debe hacer nada
      const h9 = T.hist(E1).length; await marcarDespachado(E1);
      T.paso('9b Re-despacho bloqueado', T.hist(E1).length === h9 && T.ip.length - ip0 === 1, { historialNuevo: T.hist(E1).length - h9, toast: T.toast() });
      // 10. Devolución → segundo ciclo con trabajo pendiente
      document.getElementById('dev_equipo_id').value = E1; document.getElementById('dev_motivo').value = 'No carga'; document.getElementById('dev_cliente').value = 'Tienda'; document.getElementById('dev_diagnostico').value = '';
      await guardarDevolucion();
      const eq1 = T.eq(E1);
      const pendC2 = BD.tareas_trabajo.filter(t => t.ref_id === E1 && t.estado !== 'hecha');
      T.paso('10 Devolución (ciclo 2)', eq1.estado_evaluacion === 'en_proceso' && eq1.veces_devuelto === 1 && eq1.ciclo_actual === 2 && !eq1.fecha_despacho && !eq1.fecha_terminado, { estado: eq1.estado_evaluacion, veces: eq1.veces_devuelto, ciclo: eq1.ciclo_actual });
      T.paso('10b Ciclo 2 trae trabajo pendiente', pendC2.length >= 1 && pendC2.every(t => t.tecnico_id === T.TEC), pendC2.map(t => t.descripcion));
      // 10c. El ciclo 2 no puede ir a calidad sin cerrar la tarea de la devolución (técnico)
      sessionUser = { id: T.TEC, nombre: 'Josiel', rol: 'tecnico', _tipo: 'tecnico' };
      await loadAll(); await cambiarEstadoProceso(E1, 'tecnico_recibio'); await cambiarEstadoProceso(E1, 'listo_revision');
      T.paso('10c Ciclo 2 con candado de tarea', T.eq(E1).estado_evaluacion === 'tecnico_recibio', T.eq(E1).estado_evaluacion);
      sessionUser = { id: T.U, nombre: 'Admin', usuario: 'admin', rol: 'admin', _tipo: 'usuario' };
      for (const t of BD.tareas_trabajo.filter(t => t.ref_id === E1 && t.estado !== 'hecha')) await completarTarea(t.id, 'equipo', E1);
      await aprobarTerminado(E1);
      await marcarDespachado(E1);
      T.paso('10d Ciclo 2 cerrado sin repetir baja', T.eq(E1).estado_evaluacion === 'vendido' && T.ip.length - ip0 === 1, { estado: T.eq(E1).estado_evaluacion, bajasIP: T.ip.length - ip0 });

      // 11. Equipo 2: diagnóstico sin falla → directo a Listo
      await empezarEvaluacion(E2); document.getElementById('eval_notas').value = 'Funciona bien'; _evalState.fallasSeleccionadas = new Set(); await guardarEvaluacion(true);
      await marcarListoVentaDirecto(E2);
      T.paso('11 Directo a Listo', T.eq(E2).estado_evaluacion === 'listo_venta' && !!T.eq(E2).fecha_terminado, { estado: T.eq(E2).estado_evaluacion, fecha_terminado: !!T.eq(E2).fecha_terminado });
      // 11b. Editar la evaluación de un equipo que ya está en Listo no debe regresarlo
      await continuarEvaluacion(E2); await guardarEvaluacion(true);
      T.paso('11b Editar evaluación no regresa el estado', T.eq(E2).estado_evaluacion === 'listo_venta', { estado: T.eq(E2).estado_evaluacion, toast: T.toast() });
      // 12. Despacho en bloque de E2
      _reacondSel = new Set([E2]); await _reacondPasarA('vendido');
      T.paso('12 Salida en bloque', T.eq(E2).estado_evaluacion === 'vendido' && !!T.eq(E2).fecha_despacho, T.eq(E2).estado_evaluacion);
      // 13. Equipo 3: el masivo no deja saltar etapas
      _reacondSel = new Set([E3]); await _reacondPasarA('vendido');
      T.paso('13 Bloque no salta etapas', T.eq(E3).estado_evaluacion === 'pendiente' && /No se puede mover/.test(T.toast()), T.toast());

      // ---------- Coherencia final ----------
      // a) Cada cambio de estado tiene su renglón en el historial con el estado anterior correcto.
      const faltan = [];
      [E1, E2].forEach(id => {
        const tr = T.trans.filter(x => x.id === id); const hs = T.hist(id).slice();
        tr.forEach(x => { const i = hs.findIndex(h => h.estado_anterior === x.de && h.estado_nuevo === x.a); if (i < 0) faltan.push(`${id === E1 ? 'E1' : 'E2'} ${x.de}→${x.a}`); else hs.splice(i, 1); });
      });
      T.paso('C1 Historial completo y con estado anterior real', !faltan.length, faltan);
      // b) Costo de repuestos = suma de piezas válidas
      const suma = (id) => BD.equipo_piezas_pedidas.filter(x => x.equipo_id === id && !['devuelta', 'rechazada'].includes(x.estado)).reduce((s, x) => s + (Number(x.cantidad) || 1) * (Number(x.costo_unitario) || 0), 0);
      T.paso('C2 Costo de repuestos cuadra', [E1, E2].every(id => Number(T.eq(id).costo_repuestos || 0) === suma(id)), [E1, E2].map(id => [T.eq(id).costo_repuestos, suma(id)]));
      // c) Costo final = compra + flete + piezas, y el flete del lote se reparte completo
      await loadAll();
      const fletes = T.E.map(id => calcularFleteEquipo(cache.refurb.find(e => e.id === id)));
      const totalFlete = Math.round(fletes.reduce((s, x) => s + x, 0));
      const c = _costoEquipoRep(cache.refurb.find(e => e.id === E1));
      T.paso('C3 Costo final y flete', totalFlete === 1500 && Math.round(c.fin) === Math.round(c.compra + c.flete + c.piezas), { flete: totalFlete, costoE1: c });
      return { pasos: T.pasos, trans: T.trans.length, historial: BD.equipo_historial.length };
    }, tarjetas0);

    // Vista del lote al final (captura «después»)
    await p.evaluate(() => { const T = window.__T; try { cerrarPanelProceso(); } catch (e) {} document.querySelectorAll('.modal-backdrop.active,.modal.active').forEach(m => m.classList.remove('active')); const tt = document.getElementById('toast'); if (tt) tt.classList.remove('show'); abrirLoteReacond(T.L); const f = document.getElementById('reacondFiltroEstado'); if (f) f.value = ''; renderDetalleLoteReacond(); });
    await p.waitForTimeout(500);
    const medidas = await p.evaluate(() => {
      const cards = [...document.querySelectorAll('#reacondDetalleLote .bcf-card')];
      const btns = [...document.querySelectorAll('#reacondDetalleLote .bcf-card button')].filter(b => b.offsetParent).map(b => Math.round(b.getBoundingClientRect().height));
      return { tarjetas: cards.map(c => c.querySelector('.bcf-tag')?.textContent.trim()), botonMin: btns.length ? Math.min(...btns) : null, anchoDoc: document.documentElement.scrollWidth };
    });
    if (CAPT) await p.screenshot({ path: path.join(CAPT, `flujo-${W}-2-final.png`), fullPage: false });
    const malos = r.pasos.filter(x => !x.ok);
    const errJs = errs.filter(e => !/net::|Failed/.test(e));
    if (malos.length || errJs.length) fallos++;
    console.log(`\n== ${W} px: ${r.pasos.length - malos.length}/${r.pasos.length} pasos bien · transiciones ${r.trans} · historial ${r.historial} · tarjetas ${JSON.stringify(medidas)}`);
    r.pasos.forEach(x => console.log((x.ok ? '  ok   ' : '  FALLA ') + x.nombre + (x.ok ? '' : '  ' + JSON.stringify(x.detalle))));
    if (errJs.length) console.log('  errores JS:', errJs);
    await ctx.close();
  }
  await b.close(); process.exit(fallos ? 1 : 0);
})();
