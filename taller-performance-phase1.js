/* BAYOL CELL — runtime de rendimiento Fase 1 (2026-09-16)
   Alcance: reducir trabajo automático sin cambiar lógica de negocio ni datos.
   - El poller de respaldo pasa de 60 s a 5 min; Realtime sigue siendo la vía principal.
   - Realtime global solo dispara loadAll() por tablas que realmente forman parte de loadAll().
   - Se instrumenta loadAll() para medir duración/llamadas sin enviar telemetría externa.
*/
(function(){
  'use strict';
  if(window.__bcPerfPhase1) return;
  window.__bcPerfPhase1 = true;

  const VERSION = '20260916.1';
  const BACKUP_POLL_MS = 5 * 60 * 1000;
  const CORE_TABLES = new Set([
    'ordenes_reparacion','clientes','equipos','piezas_inventario','activos_taller',
    'equipos_refurbish','proveedores','refurb_lotes','articulos','tecnicos','usuarios',
    'orden_piezas','tareas_trabajo','equipo_piezas_pedidas','fallas_comunes',
    'config_taller','orden_notas'
  ]);

  const state = window.BayolPerformance = window.BayolPerformance || {};
  state.version = VERSION;
  state.backupPollMs = BACKUP_POLL_MS;
  state.loadAll = state.loadAll || { calls:0, totalMs:0, lastMs:0, maxMs:0, lastAt:0 };
  state.realtime = state.realtime || { passed:0, ignored:0, ignoredByTable:{} };

  function now(){ return (window.performance && performance.now) ? performance.now() : Date.now(); }

  function hasSession(){
    try { return typeof sessionUser !== 'undefined' && !!sessionUser; }
    catch(_e){ return false; }
  }

  function modalOpen(){
    try { return typeof hayModalAbierto === 'function' && hayModalAbierto(); }
    catch(_e){ return false; }
  }

  function loadInFlight(){
    try { return typeof _loadAllInFlight !== 'undefined' ? _loadAllInFlight : 0; }
    catch(_e){ return 0; }
  }

  function installLoadAllMetrics(){
    const original = window.loadAll;
    if(typeof original !== 'function' || original.__bcPerfWrapped) return;

    async function measuredLoadAll(){
      const started = now();
      state.loadAll.calls++;
      try {
        return await original.apply(this, arguments);
      } finally {
        const elapsed = Math.max(0, now() - started);
        state.loadAll.lastMs = Math.round(elapsed * 10) / 10;
        state.loadAll.totalMs = Math.round((state.loadAll.totalMs + elapsed) * 10) / 10;
        state.loadAll.maxMs = Math.max(state.loadAll.maxMs || 0, state.loadAll.lastMs);
        state.loadAll.lastAt = Date.now();
      }
    }
    measuredLoadAll.__bcPerfWrapped = true;
    measuredLoadAll.__bcPerfOriginal = original;
    window.loadAll = measuredLoadAll;
  }

  function installRealtimeAllowlist(){
    const original = window.onCambioRealtime;
    if(typeof original !== 'function' || original.__bcPerfWrapped) return;

    function filteredRealtime(payload){
      const table = payload && payload.table ? String(payload.table) : '';
      if(table && !CORE_TABLES.has(table)){
        state.realtime.ignored++;
        state.realtime.ignoredByTable[table] = (state.realtime.ignoredByTable[table] || 0) + 1;
        return;
      }
      state.realtime.passed++;
      return original.apply(this, arguments);
    }
    filteredRealtime.__bcPerfWrapped = true;
    filteredRealtime.__bcPerfOriginal = original;
    window.onCambioRealtime = filteredRealtime;
  }

  function safeBackupRefresh(){
    try {
      if(document.hidden || !hasSession() || modalOpen() || loadInFlight() > 0) return;
      if(typeof window.loadAll === 'function') window.loadAll();
    } catch(_e){}
  }

  function installBackupPoller(){
    const original = window.startAppRefurbPoller;
    if(typeof original !== 'function' || original.__bcPerfWrapped) return;

    function optimizedPoller(){
      if(!hasSession()) return;
      try {
        if(typeof refreshTimer !== 'undefined' && refreshTimer) clearInterval(refreshTimer);
        refreshTimer = setInterval(safeBackupRefresh, BACKUP_POLL_MS);
        state.pollerInstalled = true;
        state.pollerInstalledAt = Date.now();
        try { if(typeof iniciarRealtime === 'function') iniciarRealtime(); } catch(_e){}
      } catch(e) {
        state.pollerFallback = true;
        try { return original.apply(this, arguments); } catch(_e){}
      }
    }
    optimizedPoller.__bcPerfWrapped = true;
    optimizedPoller.__bcPerfOriginal = original;
    window.startAppRefurbPoller = optimizedPoller;

    // Si startApp ya alcanzó a crear el poller de 60 s antes de cargar esta capa,
    // lo sustituimos ahora. Si todavía no hay sesión, startApp llamará esta versión luego.
    if(hasSession()) optimizedPoller();
  }

  function installResumeSafety(){
    if(window.__bcPerfResumeSafety) return;
    window.__bcPerfResumeSafety = true;
    document.addEventListener('visibilitychange', function(){
      if(document.hidden || !hasSession()) return;
      const last = state.loadAll.lastAt || 0;
      if(last && (Date.now() - last) < BACKUP_POLL_MS) return;
      setTimeout(safeBackupRefresh, 250);
    }, {passive:true});
  }

  function install(){
    installLoadAllMetrics();
    installRealtimeAllowlist();
    installBackupPoller();
    installResumeSafety();
  }

  install();
  // Reintentos baratos por si la sesión/restauración termina unos milisegundos después.
  setTimeout(install, 250);
  setTimeout(install, 1200);

  state.getSnapshot = function(){
    return {
      version: state.version,
      backupPollMs: state.backupPollMs,
      loadAll: Object.assign({}, state.loadAll),
      realtime: {
        passed: state.realtime.passed,
        ignored: state.realtime.ignored,
        ignoredByTable: Object.assign({}, state.realtime.ignoredByTable)
      },
      pollerInstalled: !!state.pollerInstalled
    };
  };
})();
