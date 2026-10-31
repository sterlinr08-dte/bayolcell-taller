/* taller-reacond-proceso.js · 26-oct-2026 · Reacondicionados: candados del proceso en el navegador (capa aislada).
 * Cierra huecos que quedaron de la auditoría (bitácora 2026-10-24-0130) sin tocar taller-app.js:
 *  1. «Cerrar salida» solo para equipos ya Despachados (antes cerraba un equipo en Listo y se saltaba el descuento de piezas).
 *  2. «Registrar salida» no repite un equipo ya Despachado y avisa si el equipo no está en Listo para venta.
 *  3. «Despachar teléfonos» (Info Plus) revisa en la base, ANTES de mover nada en Info Plus, que ningún equipo esté ya
 *     Despachado y pide confirmación si alguno no está en Listo para venta (el documento de Info Plus no se deshace).
 *  4. «Pasar a → Listo para venta» en bloque no se salta las tareas abiertas ni las piezas pendientes (R05).
 *  5. «Reabrir salida», «Quitar equipo» y «Eliminar lote» piden confirmación con el detalle de lo que se pierde;
 *     «Eliminar lote» ya no sigue si la base no dejó borrar los equipos.
 *  6. Los avisos de error largos se quedan en pantalla el tiempo de leerlos y se cierran al tocarlos.
 * Apagar: localStorage.bc_reacond_proceso_off = '1'  ·  <html class="bc-reacond-proceso-off">  ·  window.BC_REACOND_PROCESO = false
 */
(function(){
  'use strict';
  var V = 'p1';
  try {
    if (window.BC_REACOND_PROCESO === false) return;
    if (localStorage.getItem('bc_reacond_proceso_off') === '1') return;
  } catch(_){}
  if (document.documentElement.classList.contains('bc-reacond-proceso-off')) return;

  var ESTADO_TXT = { pendiente: 'Recibido', en_evaluacion: 'En evaluación', evaluado: 'Diagnóstico listo', en_proceso: 'En reparación',
    tecnico_recibio: 'En reparación', espera_pieza: 'Esperando pieza', reasignado: 'En reparación', reparacion_externa: 'Reparación externa',
    listo_revision: 'Control de calidad', listo_venta: 'Listo para venta', vendido: 'Despachado' };
  function txtEstado(e){ var s = (e && e.estado_evaluacion) || 'pendiente'; return ESTADO_TXT[s] || s; }
  function refurb(){ try { return (cache && cache.refurb) || []; } catch(_){ return []; } }
  function piezas(){ try { return (cache && cache.piezasReacond) || []; } catch(_){ return []; } }
  function eqPorId(id){ return refurb().find(function(r){ return r.id === id; }); }
  function esAdmin(){ try { return !!isAdminUser(); } catch(_){ return false; } }
  function aviso(m){ try { toast(m); } catch(_){} }
  function error(m){ try { toastError(m); } catch(_){ try { toast(m, 'error'); } catch(__){} } }
  function nombre(e){ return ((e && (e.modelo || '')) + (e && e.imei ? ' · ' + e.imei : '')).trim() || 'Equipo'; }
  function descontadas(ids){
    var s = {}; ids.forEach(function(i){ s[i] = 1; });
    return piezas().filter(function(p){ return s[p.equipo_id] && (Number(p.infoplus_desc_cant) || 0) > 0; });
  }
  // Envuelve una función global sin perder su nombre; si no existe todavía, reintenta un rato (carga diferida).
  function envolver(nombreFn, fabrica){
    var n = 0;
    (function intento(){
      var orig = window[nombreFn];
      if (typeof orig === 'function' && !orig.__bcRp) {
        var nuevo = fabrica(orig); nuevo.__bcRp = true; nuevo.__orig = orig;
        try { window[nombreFn] = nuevo; } catch(_){}
        return;
      }
      if (typeof orig !== 'function' && ++n < 40) setTimeout(intento, 250);
    })();
  }
  // Llama a la función original saltando su primera confirmación (la capa ya preguntó con más detalle).
  async function sinSegundaConfirmacion(orig, ctx, args){
    var c = window.confirmar;
    window.confirmar = async function(){ window.confirmar = c; return true; };
    try { return await orig.apply(ctx, args); }
    finally { window.confirmar = c; }
  }

  /* 1 · Cerrar salida solo si ya está Despachado */
  envolver('marcarEquipoCompletado', function(orig){
    return async function(equipoId){
      var e = eqPorId(equipoId);
      if (e && e.estado_evaluacion !== 'vendido') {
        return error('Primero registre la salida');
      }
      return orig.apply(this, arguments);
    };
  });

  /* 2 · Registrar salida: no repetir y avisar si no está en Listo */
  envolver('marcarDespachado', function(orig){
    return async function(equipoId){
      var e = eqPorId(equipoId);
      if (e && e.estado_evaluacion === 'vendido') return aviso('Este equipo ya está Despachado.');
      if (e && e.estado_evaluacion !== 'listo_venta') {
        if (!esAdmin()) return error('Solo equipos en Listo');
        if (!await confirmar('«' + nombre(e) + '» está en «' + txtEstado(e) + '», no en Listo para venta.\n\nSi registra la salida se salta el control de calidad. ¿Continuar?', { ok: 'Registrar salida' })) return;
        return sinSegundaConfirmacion(orig, this, arguments);
      }
      return orig.apply(this, arguments);
    };
  });

  /* 3 · Despacho a Info Plus: revisar la base antes de mover nada */
  envolver('_despTelConfirmar', function(orig){
    return async function(){
      var ctx = null; try { ctx = _despTelCtx; } catch(_){}
      var lista = (ctx && ctx.lista) || [];
      var ids = [];
      lista.forEach(function(g){ (g.equipos || []).forEach(function(e){ if (e && e.id) ids.push(e.id); }); });
      if (ids.length) {
        var filas = null;
        try {
          var r = await supabaseClient.from('equipos_refurbish').select('id, estado_evaluacion, modelo, imei').in('id', ids);
          if (r.error) throw r.error;
          filas = r.data || [];
        } catch(err) {
          try { logError('Despacho: revisar estados', err); } catch(_){}
          error('No se pudo comprobar el estado de los equipos antes de despachar. No se movió nada en Info Plus. ' + (typeof getFriendlyError === 'function' ? getFriendlyError(err) : ''));
          return { ok: false, error: 'sin_verificar' };
        }
        var ya = filas.filter(function(f){ return f.estado_evaluacion === 'vendido'; });
        if (ya.length) {
          error('No se despachó: ' + ya.length + ' equipo(s) ya están Despachados (' + ya.slice(0, 5).map(function(f){ return f.imei || f.modelo || f.id; }).join(', ') + (ya.length > 5 ? '…' : '') + '). Quítelos de la lista para no repetir el documento en Info Plus.');
          return { ok: false, error: 'ya_despachado' };
        }
        var fuera = filas.filter(function(f){ return f.estado_evaluacion !== 'listo_venta'; });
        if (fuera.length) {
          var det = fuera.slice(0, 5).map(function(f){ return '• ' + (f.modelo || '') + ' ' + (f.imei || '') + ' (' + txtEstado(f) + ')'; }).join('\n');
          if (!await confirmar(fuera.length + ' equipo(s) no están en Listo para venta:\n' + det + (fuera.length > 5 ? '\n…' : '') + '\n\nEl documento de Info Plus no se deshace desde aquí. ¿Despacharlos de todos modos?', { ok: 'Despachar' })) return { ok: false, error: 'cancelado' };
        }
      }
      return orig.apply(this, arguments);
    };
  });

  /* 4 · «Pasar a → Listo para venta» en bloque respeta tareas y piezas */
  envolver('_reacondPasarA', function(orig){
    return async function(destino){
      if (destino === 'listo_venta') {
        var sel = []; try { sel = Array.from(_reacondSel || []); } catch(_){}
        var conPiezas = [], conTareas = [];
        sel.forEach(function(id){
          var e = eqPorId(id); if (!e) return;
          try { if (_reacondTienePiezasPendientes(piezas().filter(function(p){ return p.equipo_id === id; }))) conPiezas.push(e); } catch(_){}
          try { if (fallasPendientesDe('equipo', id) > 0) conTareas.push(e); } catch(_){}
        });
        if (conPiezas.length || conTareas.length) {
          var m = document.getElementById('reacondPasarMenu'); if (m) m.style.display = 'none';
          var partes = [];
          if (conPiezas.length) partes.push(conPiezas.length + ' con piezas pendientes');
          if (conTareas.length) partes.push(conTareas.length + ' con tareas sin terminar');
          var ej = (conPiezas[0] || conTareas[0]);
          return error('No se movió nada: ' + partes.join(' y ') + ' (por ejemplo «' + nombre(ej) + '»). Resuélvalas o use «Listo para venta» en la ficha de cada equipo.');
        }
      }
      return orig.apply(this, arguments);
    };
  });

  /* 5a · Reabrir salida: confirmar */
  envolver('_reacondRegresarDespachado', function(orig){
    return async function(){
      var n = 0;
      try { n = refurb().filter(function(r){ return _reacondSelCosto.has(r.id) && r.estado_evaluacion === 'vendido' && r.completado; }).length; } catch(_){}
      if (n && !await confirmar('¿Reabrir ' + n + ' salida(s) cerrada(s)?\n\nLos equipos vuelven a Despachado sin cerrar.', { peligro: false, ok: 'Reabrir' })) return;
      return orig.apply(this, arguments);
    };
  });

  /* 5b · Quitar un equipo del lote: confirmación con el detalle */
  envolver('eliminarEquipoLote', function(orig){
    return async function(equipoId){
      var e = eqPorId(equipoId);
      if (!e) return orig.apply(this, arguments);
      var extra = [];
      if (e.estado_evaluacion === 'vendido') extra.push('Ya está Despachado' + (e.completado ? ' y con la salida cerrada' : '') + '.');
      else if (e.estado_evaluacion && e.estado_evaluacion !== 'pendiente') extra.push('Está en «' + txtEstado(e) + '».');
      var d = descontadas([equipoId]);
      if (d.length) extra.push(d.length + ' pieza(s) ya descontada(s) en Info Plus: borrar el equipo no las devuelve.');
      var msg = '¿Quitar «' + nombre(e) + '» del lote?' + (extra.length ? '\n\n' + extra.join('\n') : '') + '\n\nNo se puede deshacer.';
      if (!await confirmar(msg, { ok: 'Quitar equipo' })) return;
      return sinSegundaConfirmacion(orig, this, arguments);
    };
  });

  /* 5c · Eliminar lote: detalle + no seguir si la base no borró los equipos */
  envolver('eliminarLote', function(orig){
    return async function(loteId){
      var lote = null; try { lote = (cache.lotes || []).find(function(l){ return l.id === loteId; }); } catch(_){}
      if (!lote) return orig.apply(this, arguments);
      var eqs = refurb().filter(function(r){ return r.lote_id === loteId; });
      var desp = eqs.filter(function(r){ return r.estado_evaluacion === 'vendido'; }).length;
      var enTaller = eqs.length - desp;
      var d = descontadas(eqs.map(function(r){ return r.id; }));
      var msg = '¿Eliminar el lote ' + (lote.codigo_lote || '') + '?';
      if (eqs.length) {
        msg += '\n\nSe eliminan ' + eqs.length + ' equipo(s): ' + enTaller + ' en el taller y ' + desp + ' Despachado(s).';
        if (d.length) msg += '\n' + d.length + ' pieza(s) ya descontada(s) en Info Plus no se devuelven solas.';
        msg += '\n\nNo se puede deshacer.';
      }
      if (!await confirmar(msg, { ok: 'Eliminar lote' })) return;
      try {
        if (eqs.length) {
          var r1 = await supabaseClient.from('equipos_refurbish').delete().eq('lote_id', loteId);
          if (r1.error) throw r1.error;
        }
        var r2 = await supabaseClient.from('refurb_lotes').delete().eq('id', loteId);
        if (r2.error) throw r2.error;
        aviso('Lote eliminado.');
        try { if (loteActualId === loteId) volverDetalleProveedor(); } catch(_){}
        await loadAll();
      } catch(err) {
        try { logError('Eliminar lote', err); } catch(_){}
        error('No se eliminó el lote. ' + (typeof getFriendlyError === 'function' ? getFriendlyError(err) : (err && err.message) || ''));
        try { await loadAll(); } catch(_){}
      }
    };
  });

  /* 6 · Avisos de error largos: tiempo de lectura, tocar para cerrar, anunciados al lector de pantalla */
  (function(){
    var t = document.getElementById('toast');
    if (t && !t.__bcRp) {
      t.__bcRp = true;
      t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite');
      t.addEventListener('click', function(){ clearTimeout(t._timer); t.style.display = 'none'; });
    }
    envolver('toast', function(orig){
      return function(msg, tipo){
        var r = orig.apply(this, arguments);
        var el = document.getElementById('toast');
        if (el) {
          el.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
          var largo = String(msg || '').length;
          if (tipo === 'error' && largo > 80) {
            clearTimeout(el._timer);
            el._timer = setTimeout(function(){ el.style.display = 'none'; }, Math.min(15000, Math.max(6000, largo * 55)));
          }
        }
        return r;
      };
    });
  })();

  window.BayolReacondProceso = { version: V };
})();
