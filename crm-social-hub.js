/* BAYOL CELL — CRM Social Hub
   Capa aditiva para unificar visualmente WhatsApp + Instagram + Facebook.
   - WhatsApp conserva intactos sus IDs, handlers y flujo existente.
   - Instagram usa tablas reales + Edge Function instagram-enviar.
   - Facebook se muestra como integración pendiente; no se simulan acciones.
*/
(() => {
  'use strict';
  if (window.BayolSocialHub) return;

  const VERSION = '20260921-igback1';
  const state = {
    channel: 'whatsapp',
    mounted: false,
    account: null,
    threads: [],
    selected: null,
    messages: [],
    search: '',
    realtime: null,
    refreshTimer: null,
    messageGeneration: 0,
    threadsGeneration: 0,
    busySend: false
  };

  const $ = (s, r=document) => r.querySelector(s);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const initials = (v) => String(v || 'IG').trim().split(/\s+/).slice(0,2).map(x => x[0]?.toUpperCase() || '').join('') || 'IG';
  const fmtTime = (v) => {
    if (!v) return '';
    try {
      const d = new Date(v), now = new Date();
      const same = d.toDateString() === now.toDateString();
      return same
        ? d.toLocaleTimeString('es-DO',{hour:'2-digit',minute:'2-digit'})
        : d.toLocaleDateString('es-DO',{day:'2-digit',month:'2-digit'});
    } catch { return ''; }
  };
  const notify = (msg, type='info') => {
    try {
      if (type === 'error' && typeof window.toastError === 'function') return window.toastError(msg);
      if (typeof window.toast === 'function') return window.toast(msg, type === 'error' ? 'error' : undefined);
    } catch {}
    console[type === 'error' ? 'error' : 'log'](msg);
  };
  // The host declares a global lexical const; it is not a window property.
  const sb = () => typeof supabaseClient !== 'undefined' ? supabaseClient : window.supabaseClient;
  async function instagramQuery(query){
    let timer;
    try { return await Promise.race([query, new Promise((_,reject)=>{
      timer=setTimeout(()=>reject(new Error('La conexión tardó demasiado. Vuelve a intentarlo.')),15000);
    })]); } finally { clearTimeout(timer); }
  }

  function ensureCss(){
    if ($('#bcSocialHubCss')) return;
    const l = document.createElement('link');
    l.id = 'bcSocialHubCss';
    l.rel = 'stylesheet';
    l.href = `crm-social-hub.css?v=${VERSION}`;
    document.head.appendChild(l);
  }

  let igViewportFitRaf=0;
  function fitInstagramPanelToViewport(){
    if(state.channel!=='instagram') return;
    const view=$('#v-crmLinea');
    const panel=$('#bcSocialInstagramPanel');
    if(!view || !panel || !view.classList.contains('active')) return;

    const vv=window.visualViewport;
    const viewportTop=vv ? vv.offsetTop : 0;
    const viewportHeight=vv ? vv.height : window.innerHeight;
    const rect=panel.getBoundingClientRect();
    const topInsideViewport=Math.max(0, rect.top - viewportTop);
    const reserve=window.innerWidth<=720 ? 6 : 10;
    const available=Math.max(160, Math.floor(viewportHeight - topInsideViewport - reserve));

    panel.style.setProperty('height', available+'px', 'important');
    panel.style.setProperty('max-height', available+'px', 'important');
    panel.style.setProperty('--bc-ig-viewport-height', available+'px');

    const shell=panel.querySelector('.bc-ig-shell');
    const chat=panel.querySelector('.bc-ig-chat');
    if(shell){
      shell.style.setProperty('height','100%','important');
      shell.style.setProperty('max-height','100%','important');
      shell.style.setProperty('min-height','0','important');
    }
    if(chat){
      chat.style.setProperty('height','100%','important');
      chat.style.setProperty('max-height','100%','important');
      chat.style.setProperty('min-height','0','important');
    }
  }

  function scheduleInstagramViewportFit(){
    cancelAnimationFrame(igViewportFitRaf);
    igViewportFitRaf=requestAnimationFrame(fitInstagramPanelToViewport);
  }

  function installInstagramViewportFit(){
    if(window.__bcInstagramViewportFitInstalled) return;
    window.__bcInstagramViewportFitInstalled=true;
    window.addEventListener('resize',scheduleInstagramViewportFit,{passive:true});
    window.addEventListener('orientationchange',()=>setTimeout(scheduleInstagramViewportFit,120),{passive:true});
    if(window.visualViewport){
      window.visualViewport.addEventListener('resize',scheduleInstagramViewportFit,{passive:true});
      window.visualViewport.addEventListener('scroll',scheduleInstagramViewportFit,{passive:true});
    }
    document.addEventListener('focusin',e=>{
      if(e.target?.closest?.('#bcIgComposer')) setTimeout(scheduleInstagramViewportFit,40);
    },true);
    document.addEventListener('focusout',e=>{
      if(e.target?.closest?.('#bcIgComposer')) setTimeout(scheduleInstagramViewportFit,120);
    },true);
  }

  function mount(){
    if (state.mounted) return true;
    const view = $('#v-crmLinea');
    if (!view) return false;
    ensureCss();

    const head = document.createElement('section');
    head.id = 'bcSocialHubHead';
    head.innerHTML = `
      <div class="bc-social-title-row">
        <div class="bc-social-title-copy">
          <div class="bc-social-eyebrow">BAYOL CELL</div>
          <div class="bc-social-title">CRM · Canales</div>
          <div class="bc-social-sub">Mensajería centralizada con datos reales de cada canal conectado.</div>
        </div>
        <div class="bc-social-channels" role="tablist" aria-label="Canales del CRM">
          <button class="bc-social-channel on" data-channel="whatsapp" data-ready="1" type="button"><span class="bc-dot"></span><i class="ti ti-brand-whatsapp"></i>WhatsApp</button>
          <button class="bc-social-channel" data-channel="instagram" data-ready="1" type="button"><span class="bc-dot"></span><i class="ti ti-brand-instagram"></i>Instagram</button>
          <button class="bc-social-channel" data-channel="facebook" data-ready="0" type="button"><span class="bc-dot"></span><i class="ti ti-brand-facebook"></i>Facebook</button>
        </div>
      </div>
      <div class="bc-social-kpis">
        <div class="bc-social-kpi" data-tone="wa"><div class="bc-social-kpi-icon"><i class="ti ti-brand-whatsapp"></i></div><div class="bc-social-kpi-num" id="bcKpiWa">—</div><div class="bc-social-kpi-label">WhatsApp pendientes</div></div>
        <div class="bc-social-kpi" data-tone="ig"><div class="bc-social-kpi-icon"><i class="ti ti-brand-instagram"></i></div><div class="bc-social-kpi-num" id="bcKpiIg">—</div><div class="bc-social-kpi-label">Instagram sin leer</div></div>
        <div class="bc-social-kpi" data-tone="lead"><div class="bc-social-kpi-icon"><i class="ti ti-user-plus"></i></div><div class="bc-social-kpi-num" id="bcKpiLeads">—</div><div class="bc-social-kpi-label">Leads abiertos</div></div>
        <div class="bc-social-kpi" data-tone="all"><div class="bc-social-kpi-icon"><i class="ti ti-plug-connected"></i></div><div class="bc-social-kpi-num" id="bcKpiChannels">—</div><div class="bc-social-kpi-label">Canales conectados</div></div>
      </div>`;

    const ig = document.createElement('section');
    ig.id = 'bcSocialInstagramPanel';
    ig.innerHTML = `
      <div class="bc-ig-shell">
        <aside class="bc-ig-list">
          <div class="bc-ig-list-head">
            <div class="bc-ig-account">
              <div class="bc-ig-logo"><i class="ti ti-brand-instagram"></i></div>
              <div class="bc-ig-account-copy"><div class="bc-ig-account-name" id="bcIgAccountName">Instagram</div><div class="bc-ig-account-sub" id="bcIgAccountSub">Cargando cuenta…</div></div>
              <span class="bc-ig-status" id="bcIgStatus">Conectado</span>
            </div>
            <div class="bc-ig-search"><i class="ti ti-search"></i><input id="bcIgSearch" type="search" placeholder="Buscar conversación…"></div>
            <div class="bc-ig-capabilities">
              <span class="bc-ig-cap on">Direct</span>
              <span class="bc-ig-cap pending" title="No hay backend de comentarios conectado todavía">Comentarios · pendiente</span>
              <span class="bc-ig-cap pending" title="No hay backend de menciones conectado todavía">Menciones · pendiente</span>
            </div>
          </div>
          <div class="bc-ig-threads" id="bcIgThreads"><div class="bc-social-loading"><span class="bc-social-spin"></span>Cargando conversaciones…</div></div>
        </aside>
        <section class="bc-ig-chat" id="bcIgChat">
          <div class="bc-ig-empty"><div><i class="ti ti-brand-instagram"></i><b>Selecciona una conversación</b><span>Los mensajes de Instagram Direct aparecerán aquí. Esta vista usa los hilos reales guardados en Supabase.</span></div></div>
        </section>
      </div>`;

    const fb = document.createElement('section');
    fb.id = 'bcSocialFacebookPanel';
    fb.innerHTML = `
      <div class="bc-fb-placeholder">
        <div class="bc-fb-box">
          <div class="bc-fb-icon"><i class="ti ti-brand-facebook"></i></div>
          <h3>Facebook listo para la siguiente fase</h3>
          <p>La interfaz ya reserva Facebook como canal del CRM, pero no voy a mostrar funciones falsas. En este proyecto todavía faltan la cuenta, los hilos/mensajes y las funciones de webhook/envío equivalentes a Instagram.</p>
          <div class="bc-fb-list">
            <div class="bc-fb-item"><b>Cuenta / Página</b><span>Registrar la página de Meta y su cuenta Zernio.</span></div>
            <div class="bc-fb-item"><b>Messenger</b><span>Crear almacenamiento de hilos y mensajes con RLS.</span></div>
            <div class="bc-fb-item"><b>Webhook + envío</b><span>Recibir y responder mensajes reales desde el CRM.</span></div>
          </div>
          <span class="bc-fb-state"><i class="ti ti-clock"></i> Integración backend pendiente</span>
        </div>
      </div>`;

    const title = $('#crmLineaTituloTxt', view);
    if (title?.nextSibling) view.insertBefore(head, title.nextSibling);
    else view.prepend(head);
    view.appendChild(ig);
    view.appendChild(fb);
    view.dataset.socialChannel = 'whatsapp';

    head.addEventListener('click', (e) => {
      const b = e.target.closest('[data-channel]');
      if (b) switchChannel(b.dataset.channel);
    });
    $('#bcIgSearch')?.addEventListener('input', (e) => {
      state.search = String(e.target.value || '').trim().toLowerCase();
      renderThreads();
    });

    state.mounted = true;
    bindActivation();
    refreshAll();
    return true;
  }

  function bindActivation(){
    const view = $('#v-crmLinea');
    if (!view) return;
    const mo = new MutationObserver(() => {
      if (view.classList.contains('active')) scheduleRefresh();
    });
    mo.observe(view,{attributes:true,attributeFilter:['class']});
    document.addEventListener('click', (e) => {
      if (e.target.closest('#menu-crm')) setTimeout(() => { mount(); refreshAll(); }, 80);
    }, true);
  }

  function switchChannel(channel){
    if (!['whatsapp','instagram','facebook'].includes(channel)) return;
    state.channel = channel;
    const view = $('#v-crmLinea');
    if (!view) return;
    view.dataset.socialChannel = channel;
    view.classList.remove('bc-ig-chat-open');
    document.querySelectorAll('#bcSocialHubHead .bc-social-channel').forEach(b => b.classList.toggle('on', b.dataset.channel === channel));
    if (channel === 'instagram') {
      installInstagramViewportFit();
      setTimeout(scheduleInstagramViewportFit,0);
      setTimeout(scheduleInstagramViewportFit,80);
      setTimeout(scheduleInstagramViewportFit,240);
      loadInstagram(true);
    } else if (channel === 'whatsapp') {
      try {
        const tab = localStorage.getItem('bayol_subtab_crmlinea') || 'mensajes';
        if (typeof window.crmLineaTab === 'function') window.crmLineaTab(tab);
      } catch {}
      scheduleRefresh();
    } else scheduleRefresh();
  }

  function scheduleRefresh(){
    clearTimeout(state.refreshTimer);
    state.refreshTimer = setTimeout(() => refreshAll(), 140);
  }

  async function refreshAll(){
    if (!state.mounted || !sb()) return;
    await Promise.allSettled([refreshKpis(), state.channel === 'instagram' ? loadInstagram(false) : Promise.resolve()]);
  }

  async function refreshKpis(){
    const client = sb();
    if (!client) return;
    let waPending = null, igUnread = null, leads = null, channels = 0;
    try {
      if (Array.isArray(window._waHilos)) {
        waPending = window._waHilos.filter(h => {
          try { return typeof window._crmEsPendiente === 'function' ? window._crmEsPendiente(h) : (Number(h.no_leidos_count||0) > 0); }
          catch { return Number(h.no_leidos_count||0) > 0; }
        }).length;
      } else {
        const {data} = await client.from('whatsapp_hilos').select('id,no_leidos_count,ultimo_inbound_at,ultima_respuesta_humana_at').eq('estado','abierto').limit(5000);
        waPending = (data || []).filter(h => Number(h.no_leidos_count||0) > 0).length;
      }
    } catch {}
    try {
      const {data} = await client.from('instagram_hilos').select('id,no_leidos_count').eq('estado','abierto').limit(5000);
      igUnread = (data || []).reduce((n,h)=>n+Number(h.no_leidos_count||0),0);
    } catch {}
    try {
      const {count} = await client.from('leads').select('id',{count:'exact',head:true}).in('etapa',['nuevo','contactado','cotizado']);
      leads = count ?? 0;
    } catch {}
    try {
      const [{count:waCount},{count:igCount}] = await Promise.all([
        client.from('whatsapp_lineas').select('id',{count:'exact',head:true}).eq('activo',true),
        client.from('instagram_cuentas').select('id',{count:'exact',head:true}).eq('activo',true)
      ]);
      if ((waCount||0) > 0) channels++;
      if ((igCount||0) > 0) channels++;
    } catch {}
    const put=(id,v)=>{ const el=$(id); if(el) el.textContent = v == null ? '—' : String(v); };
    put('#bcKpiWa',waPending); put('#bcKpiIg',igUnread); put('#bcKpiLeads',leads); put('#bcKpiChannels',`${channels}/3`);
  }

  async function loadInstagram(force, options={}){
    const refreshSelected = options.refreshSelected !== false;
    const client = sb();
    const list = $('#bcIgThreads');
    if (!list) return;
    // Guarda de reentrancia (mismo patrón que loadMessages/messageGeneration):
    // si dos loadInstagram() se solapan (ej. entrar al chat mientras Realtime
    // dispara otro refresh), la llamada más vieja no debe pisar el estado
    // después de que una más nueva ya haya empezado o terminado.
    const gen = ++state.threadsGeneration;
    if (force && !state.threads.length) list.innerHTML = '<div class="bc-social-loading"><span class="bc-social-spin"></span>Cargando conversaciones…</div>';
    try {
      if(!client) throw new Error('No se pudo iniciar la conexión. Recarga el CRM.');
      let q = client.from('instagram_cuentas').select('*').eq('activo',true).order('creado_en',{ascending:true}).limit(10);
      const ownBranch = window.sessionUser?.sucursal_id || null;
      if (ownBranch) q = q.eq('sucursal_id',ownBranch);
      const {data:accounts,error:aErr}=await instagramQuery(q);
      if (aErr) throw aErr;
      if (gen !== state.threadsGeneration) return;
      state.account = (accounts || [])[0] || null;
      const name = $('#bcIgAccountName'), sub = $('#bcIgAccountSub'), status = $('#bcIgStatus');
      if (!state.account) {
        if(name) name.textContent='Instagram';
        if(sub) sub.textContent='Sin cuenta disponible para este usuario';
        if(status){status.textContent='Sin acceso';status.style.color='#b54708';status.style.background='#fffaeb';status.style.borderColor='#fedf89';}
        state.threads=[]; renderThreads();
        renderIgEmpty('Sin cuenta disponible','No existe una cuenta de Instagram activa accesible para tu usuario o sucursal.');
        return;
      }
      if(name) name.textContent = state.account.instagram_username ? `@${state.account.instagram_username}` : (state.account.nombre || 'Instagram');
      if(sub) sub.textContent = state.account.login_method === 'facebook_login' ? 'Conectado mediante Facebook Login' : 'Conectado mediante Instagram Login';
      if(status){status.textContent='Conectado';status.removeAttribute('style');}
      const {data:threads,error:hErr}=await instagramQuery(client.from('instagram_hilos').select('*').eq('cuenta_id',state.account.id).eq('estado','abierto').order('ultimo_mensaje_at',{ascending:false,nullsFirst:false}).limit(300));
      if (hErr) throw hErr;
      if (gen !== state.threadsGeneration) return;
      let visibles = threads || [];
      // Mismo candado que WhatsApp/Leads (ver CLAUDE.md): un empleado no-admin
      // solo ve lo que tiene asignado a él o lo que todavia no tiene dueño.
      // Sin esto, cualquier empleado veia las 120+ conversaciones de todos.
      try {
        if (typeof window.isAdminUser === 'function' && !window.isAdminUser()
            && typeof window._crmMiIdentidad === 'function' && typeof window._crmMismoAsignado === 'function') {
          const yo = window._crmMiIdentidad();
          visibles = visibles.filter(h => !h.asignado_id || window._crmMismoAsignado(h, yo));
        }
      } catch(e) { console.error('CRM Social Instagram: filtro de asignacion fallo', e); }
      state.threads = visibles;
      if (state.selected) {
        const fresh = state.threads.find(x => x.id === state.selected.id);
        if (fresh) state.selected = fresh;
      }
      if(!igActualizarListaIncremental()) renderThreads();
      setupRealtime();
      if (state.selected && refreshSelected) await loadMessages(state.selected.id,false);
    } catch(e) {
      if (gen !== state.threadsGeneration) return;
      console.error('CRM Social Instagram',e);
      if(list) list.innerHTML = `<div class="bc-ig-empty"><div><i class="ti ti-alert-circle"></i><b>No se pudo cargar Instagram</b><span>${esc(e.message || 'Error inesperado.')}</span><button type="button" class="btn btn-light" id="bcIgRetry">Reintentar</button></div></div>`;
      $('#bcIgRetry')?.addEventListener('click',()=>loadInstagram(true));
      const status=$('#bcIgStatus'); if(status) status.textContent='Sin conexión';
    } finally { if(client && gen === state.threadsGeneration) refreshKpis(); }
  }

  function renderThreads(){
    const host = $('#bcIgThreads');
    if (!host) return;
    const q = state.search;
    const items = state.threads.filter(h => !q || `${h.nombre_perfil||''} ${h.participant_username||''} ${h.ultimo_mensaje_preview||''}`.toLowerCase().includes(q));
    if (!items.length) {
      host.innerHTML = `<div class="bc-ig-empty"><div><i class="ti ti-messages-off"></i><b>${state.threads.length ? 'Sin coincidencias' : 'Todavía no hay conversaciones'}</b><span>${state.threads.length ? 'Prueba con otro nombre o texto.' : 'Cuando llegue un mensaje real de Instagram Direct, el webhook creará el hilo y aparecerá aquí.'}</span></div></div>`;
      return;
    }
    host.innerHTML = items.map(h => {
      const nm = h.nombre_perfil || h.participant_username || 'Cliente de Instagram';
      const unread = Number(h.no_leidos_count||0);
      return `<button class="bc-ig-thread ${state.selected?.id===h.id?'on':''}" data-id="${esc(h.id)}" type="button"><span class="bc-ig-avatar">${esc(initials(nm))}</span><span class="bc-ig-thread-main"><span class="bc-ig-thread-top"><span class="bc-ig-thread-name">${esc(nm)}</span><span class="bc-ig-thread-time">${esc(fmtTime(h.ultimo_mensaje_at))}</span></span><span class="bc-ig-thread-preview">${esc(h.ultimo_mensaje_preview || 'Sin vista previa')}</span></span>${unread ? `<span class="bc-ig-unread">${unread>99?'99+':unread}</span>` : ''}</button>`;
    }).join('');
    host.querySelectorAll('.bc-ig-thread').forEach(b => b.addEventListener('click',()=>openThread(b.dataset.id)));
  }

  async function openThread(id){
    const h = state.threads.find(x => x.id === id);
    if (!h) return;
    state.selected = h; renderThreads(); $('#v-crmLinea')?.classList.add('bc-ig-chat-open');
    scheduleInstagramViewportFit();
    await loadMessages(id,true);
    scheduleInstagramViewportFit();
    try {
      if (Number(h.no_leidos_count||0) > 0) {
        const {error} = await sb().from('instagram_hilos').update({no_leidos_count:0}).eq('id',id);
        if (!error) { h.no_leidos_count=0; renderThreads(); refreshKpis(); }
      }
    } catch {}
  }

  function renderIgEmpty(title,text){
    const chat=$('#bcIgChat');
    if(chat) chat.innerHTML=`<div class="bc-ig-empty"><div><i class="ti ti-brand-instagram"></i><b>${esc(title)}</b><span>${esc(text)}</span></div></div>`;
  }

  async function signedMedia(m){
    if (!m.media_path) return null;
    try {
      const {data,error}=await instagramQuery(sb().storage.from('instagram-media').createSignedUrl(m.media_path,3600));
      if(error) return null;
      return data?.signedUrl || null;
    } catch { return null; }
  }

  async function loadMessages(id,showLoading){
    const chat=$('#bcIgChat'); if(!chat) return;
    const h=state.threads.find(x=>x.id===id) || state.selected; if(!h) return;
    const generation=++state.messageGeneration;
    if(showLoading) chat.innerHTML='<div class="bc-social-loading"><span class="bc-social-spin"></span>Cargando mensajes…</div>';
    try{
      const {data,error}=await instagramQuery(sb().from('instagram_mensajes').select('*').eq('hilo_id',id).order('creado_en',{ascending:false}).limit(500));
      if(error) throw error;
      if(generation!==state.messageGeneration || state.selected?.id!==id) return;
      state.messages=(data||[]).reverse();
      if(!igActualizarChatIncremental()) renderChat(h,{});
      // Attachments cannot hold the conversation or composer in a loading state.
      const pending=state.messages.filter(m=>m.media_path).slice(-40);
      async function worker(){
        while(pending.length){
          const m=pending.shift(); const url=await signedMedia(m);
          if(generation!==state.messageGeneration || state.selected?.id!==id) return;
          const slot=document.getElementById('bcIgMedia-'+m.id);
          if(slot) slot.innerHTML=url?mediaMarkup(m,url):'<span>Adjunto no disponible</span>';
        }
      }
      Promise.all(Array.from({length:4},worker)).catch(()=>{});
    }catch(e){
      if(generation!==state.messageGeneration || state.selected?.id!==id) return;
      chat.innerHTML=`<div class="bc-ig-empty"><div><i class="ti ti-alert-circle"></i><b>No se pudieron cargar los mensajes</b><span>${esc(e.message||'Error inesperado.')}</span><button type="button" id="bcIgRetryMessages" class="btn btn-light">Reintentar</button></div></div>`;
      $('#bcIgRetryMessages')?.addEventListener('click',()=>loadMessages(id,true));
    }
  }

  function mediaMarkup(m,url){
    if(m.media_path && !url) return `<span id="bcIgMedia-${esc(m.id)}">Cargando adjunto…</span>`;
    const type=String(m.tipo_contenido||'text').toLowerCase();
    if(url && ['imagen','image'].includes(type)) return `<a href="${esc(url)}" target="_blank" rel="noopener"><img class="bc-ig-media-img" src="${esc(url)}" alt="Imagen de Instagram"></a>`;
    if(url) return `<a class="bc-ig-media-link" href="${esc(url)}" target="_blank" rel="noopener"><i class="ti ti-paperclip"></i>Abrir ${esc(type||'archivo')}</a>`;
    if(type!=='text' && !m.cuerpo) return `<span class="bc-ig-media-link"><i class="ti ti-paperclip"></i>${esc(type)}</span>`;
    return '';
  }

  function renderChat(h,mediaUrls={}){
    const chat=$('#bcIgChat'); if(!chat) return;
    const oldInput=$('#bcIgText'), oldScroll=$('#bcIgMessages');
    const same=chat.dataset.hilo===h.id;
    const draft=same?oldInput?.value||'':'';
    const focused=same && document.activeElement===oldInput;
    const caret=oldInput?.selectionStart;
    const top=same?oldScroll?.scrollTop:0;
    const bottom=!same || !oldScroll || oldScroll.scrollHeight-oldScroll.clientHeight-oldScroll.scrollTop<80;
    chat.dataset.hilo=h.id;
    const nm=h.nombre_perfil || h.participant_username || 'Cliente de Instagram';
    const user=h.participant_username ? `@${h.participant_username}` : 'Instagram Direct';
    // Menú de mensaje (15 sept 2026): Copiar/Reenviar, igual que ya tiene
    // Facebook -- Instagram NO tiene reacciones aquí porque Zernio no
    // expone esa acción para Instagram (solo hay endpoint de reacciones
    // para Facebook); reaccionar quedaría simulado, así que se deja fuera.
    const rows=state.messages.map(m=>`<div class="bc-ig-msg-row ${m.direccion==='out'?'out':'in'}" data-igmsgid="${esc(m.id)}"><div class="bc-ig-msg">${mediaMarkup(m,mediaUrls[m.id])}${m.cuerpo ? `<div>${esc(m.cuerpo).replace(/\n/g,'<br>')}</div>` : ''}<span class="bc-ig-msg-time">${esc(fmtTime(m.creado_en))}${m.direccion==='out' ? ` · ${esc(m.estado||'enviado')}` : ''}</span>${m.cuerpo ? `<button type="button" class="bc-ig-msg-menu" data-igmenu="${esc(m.id)}" aria-label="Acciones del mensaje"><i class="ti ti-chevron-down"></i></button>` : ''}</div></div>`).join('');
    // Asignarme/Reasignar (15 sept 2026): mismo helper que ya usa WhatsApp
    // (_crmAsignarHTML, definido en taller.html) -- así "asignado a mí" /
    // "sin dueño" queda visible igual en los 3 canales, y un empleado
    // finalmente puede reclamar una conversación de Instagram sin depender
    // de un admin. _igRefrescarAsignacion (abajo) repinta este chat + la
    // lista una vez que la asignación quedó guardada.
    const asignarHtml=typeof window._crmAsignarHTML==='function' ? window._crmAsignarHTML('instagram_hilos', h, '_igRefrescarAsignacion') : '';
    chat.innerHTML=`<div class="bc-ig-chat-head"><button class="bc-ig-back" id="bcIgBack" type="button" aria-label="Volver"><i class="ti ti-chevron-left"></i></button><span class="bc-ig-avatar">${esc(initials(nm))}</span><div class="bc-ig-chat-title"><b>${esc(nm)}</b><span>${esc(user)}</span></div><span class="bc-ig-chat-badge">Instagram Direct</span></div>${asignarHtml ? `<div style="padding:6px 14px; background:#faf5ff; border-bottom:1px solid #f3e8ff;">${asignarHtml}</div>` : ''}<div id="bcIgMessageActions" class="bc-ig-pop" hidden></div><div id="bcIgForwardBox" class="bc-ig-pop bc-ig-forward-box" hidden><div style="padding:2px 4px 6px;font-size:11px;font-weight:700;color:#4a3560;">Reenviar a…</div><input id="bcIgForwardSearch" type="search" placeholder="Buscar conversación…" style="width:100%;box-sizing:border-box;border:1px solid #ead7f3;border-radius:8px;padding:6px 8px;font-size:12.5px;margin-bottom:6px;"><div id="bcIgForwardList" style="max-height:220px;overflow:auto;"></div><button type="button" id="bcIgForwardClose" style="width:100%;margin-top:4px;">Cerrar</button></div><div class="bc-ig-messages" id="bcIgMessages" style="position:relative;">${rows || '<div class="bc-ig-empty"><div><b>Sin mensajes</b><span>Este hilo todavía no tiene mensajes guardados.</span></div></div>'}</div><button type="button" class="bc-social-jump" id="bcIgJump" aria-label="Ir al último mensaje"><i class="ti ti-arrow-down"></i><span>Últimos mensajes</span></button><form class="bc-ig-composer" id="bcIgComposer"><button type="button" class="bc-ig-location" id="bcIgLocation" aria-label="Enviar ubicación" title="Enviar ubicación de la tienda" style="background:none;border:none;cursor:pointer;padding:6px;color:#64748b;font-size:18px;flex:none;"><i class="ti ti-map-pin"></i></button><textarea id="bcIgText" rows="1" placeholder="Escribe un mensaje…" ${h.zernio_conversation_id?'':'disabled'}></textarea><button class="bc-ig-send" id="bcIgSend" type="submit" ${h.zernio_conversation_id?'':'disabled'} aria-label="Enviar"><i class="ti ti-arrow-up"></i></button></form>`;
    window.__bcIgSelectedId=h.id;
    $('#bcIgBack')?.addEventListener('click',()=>{state.selected=null;window.__bcIgSelectedId=null;$('#v-crmLinea')?.classList.remove('bc-ig-chat-open');renderThreads();});
    $('#bcIgComposer')?.addEventListener('submit',sendInstagram);
    $('#bcIgLocation')?.addEventListener('click',function(){if(typeof window._crmMostrarMenuUbicacion==='function')window._crmMostrarMenuUbicacion('instagram-hub',this);});
    chat.querySelectorAll('[data-igmenu]').forEach(btn=>btn.addEventListener('click',(e)=>{e.stopPropagation();igMessageMenu(btn.dataset.igmenu);}));
    $('#bcIgForwardClose')?.addEventListener('click',()=>{$('#bcIgForwardBox').hidden=true;});
    $('#bcIgForwardSearch')?.addEventListener('input',(e)=>igPaintForwardList(e.target.value));
    const ta=$('#bcIgText');
    if(ta){ta.value=draft;if(focused){ta.focus({preventScroll:true});if(caret!=null)ta.setSelectionRange(caret,caret);}}
    ta?.addEventListener('input',()=>{ta.style.height='auto';ta.style.height=Math.min(ta.scrollHeight,112)+'px';});
    ta?.addEventListener('keydown',(e)=>{if(e.key==='Enter' && !e.shiftKey && window.innerWidth>1024){e.preventDefault();sendInstagram(e);}});
    // Smart scroll: si el empleado esta leyendo mensajes viejos hacia arriba,
    // no lo saltamos al fondo solo -- aparece un boton para ir a lo ultimo.
    const scroller=$('#bcIgMessages'), jump=$('#bcIgJump');
    const cercaDelFondo=()=>!scroller || scroller.scrollHeight-scroller.clientHeight-scroller.scrollTop<80;
    const actualizarJump=()=>{ if(jump) jump.classList.toggle('mostrar', !cercaDelFondo()); };
    scroller?.addEventListener('scroll',actualizarJump);
    jump?.addEventListener('click',()=>{ if(scroller) scroller.scrollTop=scroller.scrollHeight; actualizarJump(); });
    requestAnimationFrame(()=>{if(scroller)scroller.scrollTop=bottom?scroller.scrollHeight:top; actualizarJump();});
    scheduleInstagramViewportFit();
  }

  async function sendInstagram(e){
    e?.preventDefault?.();
    if(state.busySend || !state.selected) return;
    const ta=$('#bcIgText'), btn=$('#bcIgSend'); const text=String(ta?.value||'').trim(); if(!text) return;
    state.busySend=true;
    if(btn){btn.disabled=true;btn.innerHTML='<span class="bc-social-spin"></span>';}
    try{
      const {data,error}=await sb().functions.invoke('instagram-enviar',{body:{hilo_id:state.selected.id,mensaje:text}});
      if(error) throw error;
      if(data?.ok===false) throw new Error(data.mensaje||data.error||'Instagram rechazó el envío.');
      if(ta){ta.value='';ta.style.height='auto';}
      if(btn){btn.classList.add('bc-sent-ok');setTimeout(()=>btn.classList.remove('bc-sent-ok'),350);}
      await loadInstagram(false,{refreshSelected:true}); notify('Mensaje de Instagram enviado.');
    }catch(err){ console.error('instagram-enviar',err); notify(err.message||'No se pudo enviar el mensaje de Instagram.','error'); }
    finally{state.busySend=false;if(btn){btn.disabled=!state.selected?.zernio_conversation_id;btn.innerHTML='<i class="ti ti-arrow-up"></i>';}ta?.focus?.();}
  }

  // Menú de mensaje + Reenviar (15 sept 2026, misma idea que ya tiene
  // Facebook/crm-facebook-chat.js): Instagram no deja citar/responder un
  // mensaje puntual (Meta lo rechaza -- ver instagram-enviar/index.ts, "Meta
  // rechaza reply_to... silently ignored"), así que "Reenviar" es lo mismo
  // que hace WhatsApp: mandar el mismo texto como mensaje nuevo a otra
  // conversación, vía el mismo instagram-enviar de siempre.
  let igForwardMsg=null, igForwardThreads=null;
  function igMessageMenu(id){
    const m=state.messages.find(x=>x.id===id); if(!m) return;
    const box=$('#bcIgMessageActions'); if(!box) return;
    box.hidden=false;
    box.innerHTML=`<button type="button" data-igcopy>Copiar texto</button><button type="button" data-igforward>Reenviar</button><button type="button" data-igclose>Cerrar</button>`;
    box.onclick=async (e)=>{
      const btn=e.target.closest('button'); if(!btn) return;
      if(btn.hasAttribute('data-igclose')){box.hidden=true;return;}
      if(btn.hasAttribute('data-igforward')){box.hidden=true;igForwardMessage(m);return;}
      try{ await navigator.clipboard.writeText(m.cuerpo||''); notify('Texto copiado.'); }catch{ notify('No se pudo copiar.','error'); }
      box.hidden=true;
    };
  }
  async function igLoadForwardThreads(){
    if(igForwardThreads) return igForwardThreads;
    try{
      const {data,error}=await instagramQuery(sb().from('instagram_hilos').select('id,nombre_perfil,participant_username').eq('cuenta_id',state.account?.id).neq('id',state.selected?.id).order('ultimo_mensaje_at',{ascending:false}).limit(200));
      if(error) throw error;
      igForwardThreads=data||[];
    }catch{ igForwardThreads=[]; }
    return igForwardThreads;
  }
  async function igPaintForwardList(q){
    const list=$('#bcIgForwardList'); if(!list) return;
    list.innerHTML='<div style="padding:8px;color:#94a3b8;font-size:12px;">Buscando…</div>';
    const threads=await igLoadForwardThreads();
    const filtro=String(q||'').trim().toLowerCase();
    const filtrados=threads.filter(t=>!filtro || (t.nombre_perfil||'').toLowerCase().includes(filtro) || (t.participant_username||'').toLowerCase().includes(filtro));
    list.innerHTML=filtrados.length ? filtrados.map(t=>`<button type="button" data-igforward-to="${esc(t.id)}" style="display:block;width:100%;text-align:left;border:0;background:none;padding:8px 6px;font-size:12.5px;cursor:pointer;border-bottom:1px solid #f3ecf9;color:#4a3560;">${esc(t.nombre_perfil||t.participant_username||'Cliente de Instagram')}</button>`).join('') : '<div style="padding:8px 6px;color:#94a3b8;font-size:12px;">Sin conversaciones que coincidan.</div>';
    list.querySelectorAll('[data-igforward-to]').forEach(btn=>btn.addEventListener('click',()=>igForwardTo(btn.dataset.igforwardTo)));
  }
  async function igForwardMessage(m){
    if(!m.cuerpo){ notify('Por ahora solo se pueden reenviar mensajes de texto.','error'); return; }
    igForwardMsg=m; igForwardThreads=null;
    const box=$('#bcIgForwardBox'); if(!box) return;
    box.hidden=false;
    const s=$('#bcIgForwardSearch'); if(s) s.value='';
    await igPaintForwardList('');
  }
  async function igForwardTo(destinoId){
    if(!igForwardMsg) return;
    const box=$('#bcIgForwardBox');
    try{
      const {data,error}=await sb().functions.invoke('instagram-enviar',{body:{hilo_id:destinoId,mensaje:igForwardMsg.cuerpo}});
      if(error) throw error;
      if(data?.ok===false) throw new Error(data.mensaje||data.error||'Instagram rechazó el envío.');
      notify('Mensaje reenviado.');
    }catch(err){ notify(err.message||'No se pudo reenviar.','error'); }
    finally{ if(box) box.hidden=true; igForwardMsg=null; }
  }

  function igActualizarChatIncremental(){
    const chat=$('#bcIgMessages');
    if(!chat || !state.selected) return false;
    const rendered=new Set();
    chat.querySelectorAll('[data-igmsgid]').forEach(el=>rendered.add(el.dataset.igmsgid));
    if(!rendered.size) return false;
    state.messages.forEach(m=>{
      if(m.direccion!=='out' || !rendered.has(m.id)) return;
      const row=chat.querySelector(`[data-igmsgid="${m.id}"]`);
      if(!row) return;
      const time=row.querySelector('.bc-ig-msg-time');
      if(time) time.textContent=fmtTime(m.creado_en)+(m.direccion==='out'?' · '+(m.estado||'enviado'):'');
    });
    const newMsgs=state.messages.filter(m=>m.id && !rendered.has(m.id));
    if(newMsgs.length){
      const pegado=chat.scrollHeight-chat.clientHeight-chat.scrollTop<80;
      const html=newMsgs.map(m=>`<div class="bc-ig-msg-row ${m.direccion==='out'?'out':'in'}" data-igmsgid="${esc(m.id)}"><div class="bc-ig-msg">${mediaMarkup(m)}${m.cuerpo ? `<div>${esc(m.cuerpo).replace(/\n/g,'<br>')}</div>` : ''}<span class="bc-ig-msg-time">${esc(fmtTime(m.creado_en))}${m.direccion==='out' ? ` · ${esc(m.estado||'enviado')}` : ''}</span>${m.cuerpo ? `<button type="button" class="bc-ig-msg-menu" data-igmenu="${esc(m.id)}" aria-label="Acciones del mensaje"><i class="ti ti-chevron-down"></i></button>` : ''}</div></div>`).join('');
      chat.insertAdjacentHTML('beforeend',html);
      chat.querySelectorAll('[data-igmenu]').forEach(btn=>{if(!btn._bcWired){btn._bcWired=true;btn.addEventListener('click',(e)=>{e.stopPropagation();igMessageMenu(btn.dataset.igmenu);});}});
      const pending=newMsgs.filter(m=>m.media_path);
      (async()=>{for(const m of pending){const url=await signedMedia(m);const slot=document.getElementById('bcIgMedia-'+m.id);if(slot)slot.innerHTML=url?mediaMarkup(m,url):'<span>Adjunto no disponible</span>';}})();
      if(pegado){chat.scrollTop=chat.scrollHeight;requestAnimationFrame(()=>{chat.scrollTop=chat.scrollHeight;});}
    }
    return true;
  }

  function igActualizarListaIncremental(){
    const host=$('#bcIgThreads');
    if(!host || !host.children.length) return false;
    const botones=host.querySelectorAll('[data-id]');
    if(!botones.length) return false;
    const q=state.search;
    const items=state.threads.filter(h=>!q||`${h.nombre_perfil||''} ${h.participant_username||''} ${h.ultimo_mensaje_preview||''}`.toLowerCase().includes(q));
    const idsActuales=new Set();
    botones.forEach(el=>idsActuales.add(el.dataset.id));
    const idsNuevos=new Set(items.map(h=>h.id));
    if(idsActuales.size!==idsNuevos.size) return false;
    let rebuild=false;
    idsNuevos.forEach(id=>{if(!idsActuales.has(id))rebuild=true;});
    if(rebuild) return false;
    items.forEach(h=>{
      const btn=host.querySelector(`[data-id="${h.id}"]`);
      if(!btn) return;
      const unread=Number(h.no_leidos_count||0);
      btn.classList.toggle('on',state.selected?.id===h.id);
      btn.classList.toggle('unread',!!unread);
      const time=btn.querySelector('.bc-ig-thread-time');
      if(time) time.textContent=fmtTime(h.ultimo_mensaje_at);
      const preview=btn.querySelector('.bc-ig-thread-preview');
      if(preview) preview.textContent=h.ultimo_mensaje_preview||'Sin vista previa';
      const badge=btn.querySelector('.bc-ig-unread');
      if(badge && !unread) badge.remove();
      else if(!badge && unread) btn.insertAdjacentHTML('beforeend',`<span class="bc-ig-unread">${unread>99?'99+':unread}</span>`);
      else if(badge && unread) badge.textContent=unread>99?'99+':unread;
    });
    const order=items.map(h=>h.id);
    const actual=Array.from(host.querySelectorAll('[data-id]'));
    let needsReorder=false;
    for(let i=0;i<order.length;i++){if(!actual[i]||actual[i].dataset.id!==order[i]){needsReorder=true;break;}}
    if(needsReorder) order.forEach(id=>{const el=host.querySelector(`[data-id="${id}"]`);if(el)host.appendChild(el);});
    return true;
  }

  let igRealtimeNeedsChat=false;
  let igRealtimeRunning=false;
  let igRealtimeQueued=false;

  function setupRealtime(){
    if(state.realtime || !sb()) return;
    try{
      state.realtime = sb().channel('bc-social-instagram')
        .on('postgres_changes',{event:'*',schema:'public',table:'instagram_hilos'},()=>scheduleIgRealtime(false))
        .on('postgres_changes',{event:'*',schema:'public',table:'instagram_mensajes'},payload=>{
          const selectedId=state.selected?.id;
          const changedId=payload.new?.hilo_id || payload.old?.hilo_id;
          scheduleIgRealtime(!!selectedId && changedId===selectedId);
        }).subscribe();
    }catch(e){console.warn('Realtime Instagram no disponible',e);}
  }

  async function flushIgRealtime(){
    if(igRealtimeRunning){igRealtimeQueued=true;return;}
    igRealtimeRunning=true;
    try{
      do{
        igRealtimeQueued=false;
        const refreshSelected=igRealtimeNeedsChat;
        igRealtimeNeedsChat=false;
        await loadInstagram(false,{refreshSelected});
      }while(igRealtimeQueued || igRealtimeNeedsChat);
    }finally{
      igRealtimeRunning=false;
    }
  }

  function scheduleIgRealtime(openChat=false){
    igRealtimeNeedsChat = igRealtimeNeedsChat || !!openChat;
    clearTimeout(window.__bcIgRealtimeTimer);
    window.__bcIgRealtimeTimer=setTimeout(()=>{
      window.__bcIgRealtimeTimer=null;
      if(igRealtimeRunning){igRealtimeQueued=true;return;}
      flushIgRealtime().catch(e=>console.warn('Realtime Instagram refresh falló',e));
    },450);
  }

  function start(){
    ensureCss();
    installInstagramViewportFit();
    if (!mount()) {
      const mo = new MutationObserver(() => { if (mount()) mo.disconnect(); });
      mo.observe(document.documentElement,{childList:true,subtree:true});
      setTimeout(()=>mo.disconnect(),30000);
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
  window.BayolSocialHub={switchChannel,refresh:refreshAll,state,version:VERSION};
  window.__bcIgReload=function(opts){ return loadInstagram(false, opts||{refreshSelected:true}); };
  // Llamado por _crmAsignarHTML (taller.html) despues de Asignarme/Reasignar
  // en un hilo de Instagram -- refreshAll() vuelve a traer los hilos (con el
  // asignado_id ya actualizado) y repinta la lista y el chat abierto.
  window._igRefrescarAsignacion=function(){ refreshAll(); };
})();
