/* BAYOL CELL — WhatsApp CRM pagination runtime (Phase 2, 2026-09-16)
   Goals:
   - Keep the first inbox render small (60 conversations instead of the full line).
   - Keep the first chat render small (80 newest messages instead of full history).
   - Load more conversations near the bottom and older messages near the top.
   - Preserve existing realtime, optimistic sends, drafts, keyboard and scroll behavior.
   This file intentionally does not change schema or business logic.
*/
(function(){
  'use strict';
  if(window.__bcWaPaginationV2) return;
  window.__bcWaPaginationV2 = true;

  const THREAD_PAGE = 60;
  const MESSAGE_PAGE = 80;
  const SEARCH_LIMIT = 100;
  const VERSION = '20261110.1';

  const state = window.BayolWhatsAppPaging = window.BayolWhatsAppPaging || {};
  state.version = VERSION;
  state.thread = {
    lineId: null,
    offset: 0,
    total: null,
    hasMore: false,
    loading: false,
    generation: 0,
    baseIds: new Set(),
    searchExtraIds: new Set(),
    searchSeq: 0,
    searchTimer: null,
    loads: 0
  };
  state.messages = {
    hiloId: null,
    total: null,
    hasMore: false,
    loadingOlder: false,
    oldestCreatedAt: null,
    loadedReal: 0,
    olderLoads: 0
  };

  // 10-nov-2026 · Paquete «CRM rápido» (ver taller-app.js): se apaga con localStorage.bc_crm_rapido_off='1'.
  function rapido(){
    try { return typeof _crmRapidoOn === 'function' && _crmRapidoOn(); } catch(_e) { return false; }
  }
  const COUNT_REFRESH_MS = 5 * 60 * 1000;

  function currentLine(){
    try { return _crmLineaActualId || null; } catch(_e) { return null; }
  }

  function isAdmin(){
    try { return typeof isAdminUser === 'function' && isAdminUser(); } catch(_e) { return false; }
  }

  function currentIdentity(){
    try { return typeof _crmMiIdentidad === 'function' ? _crmMiIdentidad() : {tipo:null,id:null}; }
    catch(_e) { return {tipo:null,id:null}; }
  }

  function validUuid(v){
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v || ''));
  }

  function applyAssignmentScope(q){
    if(isAdmin()) return q;
    const me = currentIdentity();
    if(validUuid(me.id) && (me.tipo === 'usuario' || me.tipo === 'tecnico')) {
      return q.or(`asignado_id.is.null,and(asignado_id.eq.${me.id},asignado_tipo.eq.${me.tipo})`);
    }
    return q;
  }

  function clientAssignmentGuard(rows){
    if(isAdmin()) return rows || [];
    const me = currentIdentity();
    return (rows || []).filter(h => !h.asignado_id || (typeof _crmMismoAsignado === 'function' && _crmMismoAsignado(h, me)));
  }

  function threadTime(h){
    const t = h?.ultimo_mensaje_at || h?.creado_en || 0;
    const n = new Date(t).getTime();
    return Number.isFinite(n) ? n : 0;
  }

  function sortThreads(rows){
    return (rows || []).sort((a,b) => {
      const d = threadTime(b) - threadTime(a);
      return d || String(b?.id || '').localeCompare(String(a?.id || ''));
    });
  }

  function mergeThreads(base, incoming){
    const map = new Map();
    (base || []).forEach(h => { if(h?.id) map.set(h.id, h); });
    (incoming || []).forEach(h => { if(h?.id) map.set(h.id, Object.assign({}, map.get(h.id) || {}, h)); });
    return sortThreads(Array.from(map.values()));
  }

  function resetThreadState(lineId){
    const s = state.thread;
    s.lineId = lineId || null;
    s.offset = 0;
    s.total = null;
    s.countAt = 0;
    s.hasMore = false;
    s.loading = false;
    s.generation++;
    s.baseIds.clear();
    s.searchExtraIds.clear();
    s.searchSeq++;
    if(s.searchTimer) clearTimeout(s.searchTimer);
    s.searchTimer = null;
  }

  function clearSearchExtras(){
    const s = state.thread;
    if(!s.searchExtraIds.size) return;
    try { _waHilos = (_waHilos || []).filter(h => s.baseIds.has(h.id)); } catch(_e) {}
    s.searchExtraIds.clear();
  }

  async function queryThreadWindow(from, to, wantCount){
    const lineId = currentLine();
    if(!lineId) return { rows:[], count:0, error:null };
    let q = supabaseClient
      .from('whatsapp_hilos')
      .select('*, whatsapp_lineas(nombre)', wantCount ? {count:'exact'} : undefined)
      .eq('linea_id', lineId)
      .order('ultimo_mensaje_at', { ascending:false, nullsFirst:false })
      .order('id', { ascending:false })
      .range(from, to);
    q = applyAssignmentScope(q);
    const {data, error, count} = await q;
    return { rows: clientAssignmentGuard(data || []), count, error };
  }

  async function refreshThreadsPaged(){
    const lineId = currentLine();
    if(!lineId){
      resetThreadState(null);
      try { _waHilos = []; } catch(_e) {}
      return;
    }

    const s = state.thread;
    const lineChanged = s.lineId !== lineId;
    if(lineChanged) resetThreadState(lineId);
    if(s.loading) return;

    s.loading = true;
    const gen = ++s.generation;
    const target = Math.max(THREAD_PAGE, lineChanged ? THREAD_PAGE : (s.offset || THREAD_PAGE));
    // 10-nov-2026: el conteo exacto de conversaciones se pide al entrar a la línea y, después, como mucho cada
    // 5 minutos. Antes iba en cada refresco.
    const wantCount = !rapido() || lineChanged || s.total == null || !s.countAt || (Date.now() - s.countAt) > COUNT_REFRESH_MS;
    try {
      const r = await queryThreadWindow(0, target - 1, wantCount);
      if(gen !== s.generation || lineId !== currentLine()) return;
      if(r.error) throw r.error;

      clearSearchExtras();
      const rows = r.rows || [];
      try { _waHilos = sortThreads(rows.slice()); } catch(_e) {}
      s.baseIds = new Set(rows.map(h => h.id));
      s.offset = rows.length;
      if(wantCount && r.count != null) { s.total = r.count; s.countAt = Date.now(); }
      else if(!wantCount) s.total = rows.length < target ? rows.length : Math.max(s.total || 0, rows.length);
      if(s.total == null) s.total = Math.max(s.offset, s.total || 0);
      s.hasMore = s.total != null ? s.offset < s.total : rows.length === target;
      s.loads++;

      let q = '';
      try { q = String(_crmBusqueda || '').trim(); } catch(_e) {}
      if(q.length >= 2) scheduleRemoteSearch(q, 0);
    } catch(e) {
      try { logError('cargarHilosWhatsapp paginado', e); } catch(_e) {}
      try { toastError('Sin conexión · Reintentar'); } catch(_e) {}
    } finally {
      if(gen === s.generation) s.loading = false;
    }
  }

  async function loadMoreThreads(){
    const s = state.thread;
    const lineId = currentLine();
    if(!lineId || s.lineId !== lineId || s.loading || !s.hasMore) return false;
    s.loading = true;
    const gen = s.generation;
    const from = s.offset;
    try {
      const r = await queryThreadWindow(from, from + THREAD_PAGE - 1, false);
      if(gen !== s.generation || lineId !== currentLine()) return false;
      if(r.error) throw r.error;
      const rows = r.rows || [];
      const before = new Set((_waHilos || []).map(h => h.id));
      try { _waHilos = mergeThreads(_waHilos || [], rows); } catch(_e) {}
      rows.forEach(h => s.baseIds.add(h.id));
      s.offset += rows.length;
      if(s.total != null) s.hasMore = s.offset < s.total;
      else s.hasMore = rows.length === THREAD_PAGE;
      s.loads++;
      if(rows.length && typeof _pintarWhatsappLista === 'function') _pintarWhatsappLista();
      if(typeof _crmPintarCabecera === 'function') _crmPintarCabecera();
      return Array.from(s.baseIds).some(id => !before.has(id));
    } catch(e) {
      try { logError('_bcWaLoadMoreThreads', e); } catch(_e) {}
      return false;
    } finally {
      s.loading = false;
      updateThreadPagerUi();
    }
  }

  function buildSearchQuery(column, pattern){
    let q = supabaseClient
      .from('whatsapp_hilos')
      .select('*, whatsapp_lineas(nombre)')
      .eq('linea_id', currentLine())
      .ilike(column, `%${pattern}%`)
      .order('ultimo_mensaje_at', {ascending:false, nullsFirst:false})
      .order('id', {ascending:false})
      .limit(SEARCH_LIMIT);
    return applyAssignmentScope(q);
  }

  async function remoteSearchThreads(text){
    const s = state.thread;
    const lineId = currentLine();
    const term = String(text || '').trim();
    if(!lineId || term.length < 2) return;
    const seq = ++s.searchSeq;
    try {
      const [byName, byPhone] = await Promise.all([
        buildSearchQuery('nombre_perfil', term),
        buildSearchQuery('telefono_e164', term.replace(/\s+/g,''))
      ]);
      if(seq !== s.searchSeq || lineId !== currentLine()) return;
      let current = '';
      try { current = String(_crmBusqueda || '').trim(); } catch(_e) {}
      if(current !== term) return;
      if(byName.error) throw byName.error;
      if(byPhone.error) throw byPhone.error;
      const rows = clientAssignmentGuard([...(byName.data || []), ...(byPhone.data || [])]);
      const unique = mergeThreads([], rows);
      const extras = unique.filter(h => !s.baseIds.has(h.id));
      extras.forEach(h => s.searchExtraIds.add(h.id));
      try { _waHilos = mergeThreads(_waHilos || [], unique); } catch(_e) {}
      if(typeof _pintarWhatsappLista === 'function') _pintarWhatsappLista();
      if(typeof _crmPintarCabecera === 'function') _crmPintarCabecera();
    } catch(e) {
      try { logError('buscar WhatsApp paginado', e); } catch(_e) {}
    }
  }

  function scheduleRemoteSearch(text, delay){
    const s = state.thread;
    if(s.searchTimer) clearTimeout(s.searchTimer);
    const term = String(text || '').trim();
    if(term.length < 2) return;
    s.searchTimer = setTimeout(() => remoteSearchThreads(term), Math.max(0, delay == null ? 260 : delay));
  }

  function updateThreadPagerUi(){
    const cont = document.getElementById('waLista');
    if(!cont) return;
    const old = document.getElementById('bcWaThreadPager');
    if(old) old.remove();
    const s = state.thread;
    let search = '';
    try { search = String(_crmBusqueda || '').trim(); } catch(_e) {}
    if(!s.hasMore || search) return;

    const pager = document.createElement('div');
    pager.id = 'bcWaThreadPager';
    pager.style.cssText = 'padding:10px 12px 14px;text-align:center;';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-light btn-sm';
    btn.style.cssText = 'min-width:132px;justify-content:center;';
    btn.innerHTML = s.loading ? '<i class="ti ti-loader-2"></i> Cargando…' : '<i class="ti ti-chevron-down"></i> Cargar más';
    btn.disabled = !!s.loading;
    btn.addEventListener('click', () => loadMoreThreads());
    pager.appendChild(btn);
    cont.appendChild(pager);
  }

  let listScrollEl = null;
  function wireThreadScroll(){
    const cont = document.getElementById('waLista');
    if(!cont) return;
    updateThreadPagerUi();
    if(listScrollEl === cont) return;
    listScrollEl = cont;
    cont.addEventListener('scroll', function(){
      if(state.thread.loading || !state.thread.hasMore) return;
      let search = '';
      try { search = String(_crmBusqueda || '').trim(); } catch(_e) {}
      if(search) return;
      if(cont.scrollHeight - cont.scrollTop - cont.clientHeight < 320) loadMoreThreads();
    }, {passive:true});
  }

  function resetMessageState(hiloId){
    const s = state.messages;
    s.hiloId = hiloId || null;
    s.total = null;
    s.hasMore = false;
    s.loadingOlder = false;
    s.oldestCreatedAt = null;
    s.loadedReal = 0;
  }

  async function hydrateMedia(rows, token){
    if(rapido() && typeof _waSignedUrls === 'function'){
      // 10-nov-2026: una sola petición para todos los adjuntos de la página.
      const conAdjunto = (rows || []).filter(m => m && m.media_path);
      if(conAdjunto.length){
        let urls = null;
        try { urls = await _waSignedUrls(conAdjunto.map(m => m.media_path)); } catch(_e) { urls = null; }
        conAdjunto.forEach(m => { const u = urls ? urls.get(m.media_path) : null; m._mediaUrl = u || null; });
      }
      return token === _waCargaToken;
    }
    await Promise.all((rows || []).map(async m => {
      if(!m?.media_path) return;
      try { m._mediaUrl = await _waSignedUrl(m.media_path); } catch(_e) { m._mediaUrl = null; }
    }));
    return token === _waCargaToken;
  }

  function hydrateLater(rows, token, hiloId){
    let queue = (rows || []).filter(m => m && m.media_path && m._mediaUrl === undefined);
    if(!queue.length) return;
    let timer = null;
    const current = () => token === _waCargaToken && hiloId === _waHiloId;
    if(rapido() && typeof _waSignedUrls === 'function'){
      // 10-nov-2026: los enlaces se piden en UNA petición (antes uno por adjunto) y, al llegar, se cambia solo la
      // burbuja de cada adjunto (antes se repintaba el chat entero varias veces).
      if(typeof _waUrlEnCache === 'function') queue.forEach(m => { const u = _waUrlEnCache(m.media_path); if(u) m._mediaUrl = u; });
      queue = queue.filter(m => m._mediaUrl === undefined);
      if(!queue.length) return;
      _waSignedUrls(queue.map(m => m.media_path)).then(urls => {
        if(!current()) return;
        const ids = [];
        queue.forEach(m => {
          const u = urls.get(m.media_path) || null;
          m._mediaUrl = u;
          // El tiempo real puede haber cambiado el objeto del mensaje por una copia: se actualiza también esa.
          const vivo = (_waMensajes || []).find(x => x && x.id === m.id);
          if(vivo && vivo !== m && vivo.media_path === m.media_path) vivo._mediaUrl = u;
          ids.push(m.id);
        });
        const soloEsas = typeof _waRepintarBurbujas === 'function' && _waRepintarBurbujas(ids);
        if(!soloEsas && typeof _pintarWhatsappDetalle === 'function') _pintarWhatsappDetalle();
      }).catch(() => {});
      return;
    }
    const repaint = () => { clearTimeout(timer); timer = setTimeout(() => { if(current() && typeof _pintarWhatsappDetalle === 'function') _pintarWhatsappDetalle(); }, 120); };
    async function worker(){
      while(queue.length && current()){
        const m = queue.shift();
        try { m._mediaUrl = await _waSignedUrl(m.media_path); } catch(_e) { m._mediaUrl = null; }
        if(current()) repaint();
      }
    }
    Promise.all(Array.from({length:4}, worker)).catch(() => {});
  }

  function realMessages(rows){ return (rows || []).filter(m => !m?._optimista); }

  function mergeMessages(rowsA, rowsB){
    const map = new Map();
    [...(rowsA || []), ...(rowsB || [])].forEach(m => {
      if(!m?.id) return;
      const prev = map.get(m.id);
      map.set(m.id, Object.assign({}, prev || {}, m));
    });
    return Array.from(map.values()).sort((a,b) => {
      const d = new Date(a.creado_en).getTime() - new Date(b.creado_en).getTime();
      return d || String(a.id).localeCompare(String(b.id));
    });
  }

  function reconcileOptimistic(lista, hiloId){
    for(const [tempId, opt] of _waMensajesOptimistas) {
      if(opt.hilo_id !== hiloId) continue;
      const exists = opt.wa_message_id && lista.some(m => !m._optimista && m.wa_message_id === opt.wa_message_id);
      if(exists) _waMensajesOptimistas.delete(tempId);
      else if(!lista.some(m => m.id === opt.id)) lista.push(opt);
    }
    lista.sort((a,b) => new Date(a.creado_en) - new Date(b.creado_en));
    return lista;
  }

  async function refreshMessagesPaged(hiloId){
    const token = ++_waCargaToken;
    const s = state.messages;
    const sameHilo = s.hiloId === hiloId;
    let forceBottom = false;
    try { forceBottom = !!_waForzarScrollFondo; } catch(_e) {}
    const preserveOlder = sameHilo && !forceBottom && s.loadedReal > MESSAGE_PAGE;
    const fast = rapido();
    // 10-nov-2026: el conteo exacto de mensajes solo al abrir el chat; en los refrescos del mismo chat sobra.
    const wantCount = !fast || !sameHilo || forceBottom || s.total == null;
    if(!sameHilo || forceBottom) resetMessageState(hiloId);

    // 10-nov-2026: la sugerencia de IA se pide a la vez que los mensajes (antes, después) y ya no hace esperar al
    // chat: si llega más tarde, se pinta cuando llegue.
    const sugQuery = () => supabaseClient
      .from('whatsapp_ia_sugerencias')
      .select('id, texto_sugerido, razon, modelo_detectado, creado_en')
      .eq('hilo_id', hiloId)
      .eq('estado', 'pendiente')
      .order('creado_en', {ascending:true})
      .limit(1);
    let sugListo = null;
    const sugP = fast ? Promise.resolve(sugQuery()).then(r => (sugListo = r || {}), () => (sugListo = {})) : null;

    const {data, error, count} = await supabaseClient
      .from('whatsapp_mensajes')
      .select('*', wantCount ? {count:'exact'} : undefined)
      .eq('hilo_id', hiloId)
      .order('creado_en', {ascending:false})
      .order('id', {ascending:false})
      .limit(MESSAGE_PAGE);
    if(token !== _waCargaToken) return;
    if(error){
      try { logError('cargarMensajesHilo paginado', error); toastError('No cargaron los mensajes'); } catch(_e) {}
      if(fast){
        // 10-nov-2026: si el chat ya tenía sus mensajes en pantalla, un refresco fallido no los borra. Si no había
        // nada, el chat dice «No se pudo cargar · Reintentar» (antes: «Sin mensajes todavía.»).
        const delHilo = (_waMensajes || []).length && (_waMensajes || []).every(m => m && m.hilo_id === hiloId);
        if(!delHilo){ _waMensajes = []; window.__bcWaCarga = {hilo:hiloId, estado:'error'}; }
        return;
      }
      if(token === _waCargaToken && !preserveOlder) _waMensajes = [];
      return;
    }
    if(fast) window.__bcWaCarga = {hilo:hiloId, estado:'ok'};

    const latest = (data || []).slice().reverse();
    // Conserva las URLs ya firmadas (evita parpadeo al refrescar) y firma las nuevas EN SEGUNDO PLANO:
    // el texto de la conversación se pinta enseguida, los adjuntos aparecen cuando están listos.
    const prevUrl = new Map((_waMensajes || []).filter(m => m && m.id && m._mediaUrl !== undefined).map(m => [m.id, m._mediaUrl]));
    latest.forEach(m => { if(m.media_path && prevUrl.has(m.id)) m._mediaUrl = prevUrl.get(m.id); });
    let lista = preserveOlder ? mergeMessages(realMessages(_waMensajes || []), latest) : latest;
    lista = reconcileOptimistic(lista, hiloId);
    if(token !== _waCargaToken) return;
    _waMensajes = lista;

    hydrateLater(lista, token, hiloId);
    const reals = realMessages(lista);
    s.hiloId = hiloId;
    const hadMore = s.hasMore;
    s.total = (!wantCount || count == null) ? Math.max(s.total || 0, reals.length) : count;
    s.loadedReal = reals.length;
    s.oldestCreatedAt = reals.length ? reals[0].creado_en : null;
    if(wantCount) s.hasMore = s.total != null ? s.loadedReal < s.total : (data || []).length === MESSAGE_PAGE;
    // Sin conteo: si la página vino llena puede haber más arriba (al subir se comprueba); si no, está todo.
    else s.hasMore = preserveOlder ? hadMore : (data || []).length === MESSAGE_PAGE;

    if(!fast){
      const {data:sug} = await sugQuery();
      if(token !== _waCargaToken) return;
      _waSugerenciasIA = sug || [];
      return;
    }
    const firmaSug = list => JSON.stringify((list || []).map(x => x.id));
    if(sugListo){ _waSugerenciasIA = sugListo.data || []; return; }   // ya llegó: sale en el mismo pintado del chat
    sugP.then(() => {
      if(token !== _waCargaToken || hiloId !== _waHiloId) return;
      const antes = firmaSug(_waSugerenciasIA), nuevas = (sugListo && sugListo.data) || [];
      _waSugerenciasIA = nuevas;
      if(antes !== firmaSug(nuevas) && typeof _pintarWhatsappDetalle === 'function') _pintarWhatsappDetalle();
    });
  }

  async function loadOlderMessages(){
    const s = state.messages;
    const hiloId = _waHiloId;
    if(!hiloId || s.hiloId !== hiloId || s.loadingOlder || !s.hasMore || !s.oldestCreatedAt) return;
    s.loadingOlder = true;
    const token = _waCargaToken;
    const chatBefore = document.getElementById('waMessagesScroll');
    const oldHeight = chatBefore?.scrollHeight || 0;
    const oldTop = chatBefore?.scrollTop || 0;
    try {
      const {data, error} = await supabaseClient
        .from('whatsapp_mensajes')
        .select('*')
        .eq('hilo_id', hiloId)
        .lt('creado_en', s.oldestCreatedAt)
        .order('creado_en', {ascending:false})
        .order('id', {ascending:false})
        .limit(MESSAGE_PAGE);
      if(token !== _waCargaToken || hiloId !== _waHiloId) return;
      if(error) throw error;
      const older = (data || []).slice().reverse();
      if(!(await hydrateMedia(older, token)) || token !== _waCargaToken || hiloId !== _waHiloId) return;
      if(!older.length){ s.hasMore = false; return; }

      const merged = reconcileOptimistic(mergeMessages(older, _waMensajes || []), hiloId);
      _waMensajes = merged;
      const reals = realMessages(merged);
      s.loadedReal = reals.length;
      s.oldestCreatedAt = reals.length ? reals[0].creado_en : null;
      // 10-nov-2026: el total ya no se recuenta en cada refresco, así que al subir manda la página: llena = puede haber más.
      if(rapido()) { s.hasMore = older.length === MESSAGE_PAGE; if(s.total != null) s.total = Math.max(s.total, s.loadedReal); }
      else s.hasMore = s.total != null ? s.loadedReal < s.total : older.length === MESSAGE_PAGE;
      s.olderLoads++;

      if(typeof _pintarWhatsappDetalle === 'function') _pintarWhatsappDetalle();
      const restore = () => {
        const chat = document.getElementById('waMessagesScroll');
        if(!chat || hiloId !== _waHiloId) return;
        const delta = Math.max(0, chat.scrollHeight - oldHeight);
        chat.scrollTop = oldTop + delta;
      };
      requestAnimationFrame(restore);
      setTimeout(restore, 80);
    } catch(e) {
      try { logError('_bcWaLoadOlderMessages', e); } catch(_e) {}
    } finally {
      s.loadingOlder = false;
    }
  }

  let messageScrollEl = null;
  function wireMessageScroll(){
    const chat = document.getElementById('waMessagesScroll');
    if(!chat || messageScrollEl === chat) return;
    messageScrollEl = chat;
    chat.addEventListener('scroll', function(){
      // 10-nov-2026: al repintar, el contenedor viejo ya no está en la página pero aún recibe un último aviso de
      // desplazamiento con scrollTop 0; eso bajaba solo todo el historial al volver a un chat. Solo cuenta el vivo.
      if(!chat.isConnected) return;
      if(chat.scrollTop < 180 && state.messages.hasMore && !state.messages.loadingOlder) loadOlderMessages();
    }, {passive:true});
  }

  function formatMaybePlus(n){
    const s = state.thread;
    return s.hasMore ? `${n}+` : String(n);
  }

  function install(){
    if(typeof cargarHilosWhatsapp !== 'function' || typeof cargarMensajesHilo !== 'function') {
      setTimeout(install, 120);
      return;
    }
    if(window.__bcWaPaginationInstalled) return;
    window.__bcWaPaginationInstalled = true;

    cargarHilosWhatsapp = refreshThreadsPaged;
    cargarMensajesHilo = refreshMessagesPaged;

    if(typeof _pintarWhatsappLista === 'function') {
      const basePaintList = _pintarWhatsappLista;
      _pintarWhatsappLista = function(){
        const out = basePaintList.apply(this, arguments);
        wireThreadScroll();
        return out;
      };
    }

    if(typeof _pintarWhatsappDetalle === 'function') {
      const basePaintDetail = _pintarWhatsappDetalle;
      _pintarWhatsappDetalle = function(){
        const out = basePaintDetail.apply(this, arguments);
        wireMessageScroll();
        return out;
      };
    }

    if(typeof _crmPintarCabecera === 'function') {
      const baseHeader = _crmPintarCabecera;
      _crmPintarCabecera = function(){
        const out = baseHeader.apply(this, arguments);
        const chips = document.getElementById('crmChipsRow');
        if(chips && state.thread.lineId === currentLine()) {
          const buttons = chips.querySelectorAll('.crm-chip');
          const loaded = _waHilos || [];
          const total = state.thread.total != null ? state.thread.total : loaded.length;
          const unread = loaded.filter(h => h.no_leidos_count > 0).length;
          const pending = loaded.filter(h => typeof _crmEsPendiente === 'function' && _crmEsPendiente(h)).length;
          const vals = [String(total), formatMaybePlus(unread), formatMaybePlus(pending)];
          buttons.forEach((btn, i) => {
            const count = btn.querySelector('.cuenta');
            if(count && vals[i] != null) count.textContent = vals[i];
          });
        }
        updateThreadPagerUi();
        return out;
      };
    }

    if(typeof _crmBuscarCambio === 'function') {
      const baseSearchChange = _crmBuscarCambio;
      _crmBuscarCambio = function(v){
        const term = String(v || '').trim();
        if(!term) {
          state.thread.searchSeq++;
          if(state.thread.searchTimer) clearTimeout(state.thread.searchTimer);
          clearSearchExtras();
        }
        const out = baseSearchChange.apply(this, arguments);
        if(term.length >= 2) scheduleRemoteSearch(term, 260);
        return out;
      };
    }

    window._bcWaLoadMoreThreads = loadMoreThreads;
    window._bcWaLoadOlderMessages = loadOlderMessages;
    state.getSnapshot = function(){
      return {
        version: VERSION,
        threads: {
          lineId: state.thread.lineId,
          loaded: state.thread.baseIds.size,
          total: state.thread.total,
          hasMore: state.thread.hasMore,
          loads: state.thread.loads,
          searchExtras: state.thread.searchExtraIds.size
        },
        messages: {
          hiloId: state.messages.hiloId,
          loaded: state.messages.loadedReal,
          total: state.messages.total,
          hasMore: state.messages.hasMore,
          olderLoads: state.messages.olderLoads
        }
      };
    };
  }

  install();
})();
