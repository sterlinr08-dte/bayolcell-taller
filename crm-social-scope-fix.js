/* BAYOL CELL — Redes: navegación inteligente de 2 barras */
(() => {
  'use strict';
  if (window.__bcSocialScopeFix) return;
  window.__bcSocialScopeFix = true;

  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  // Supabase and Zernio calls must never leave the inbox on an endless
  // spinner.  A timeout only changes the UI state; it does not expose any
  // credential or cancel a server-side import that may still be running.
  const withTimeout = (promise, ms=12000) => {
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('La solicitud tardó demasiado')), ms);
    });
    return Promise.race([Promise.resolve(promise), timeout]).finally(() => clearTimeout(timer));
  };
  const state = {
    visible: false,
    channel: 'instagram',
    view: 'all',
    unreadOnly: false,
    refreshTimer: null,
    originalCrmLineaTab: null,
    meta: {
      whatsapp: { count: null, account: 'Mensajes', ready: true },
      instagram: { count: null, account: '', ready: true },
      facebook: { count: null, account: 'Pendiente', ready: false },
      tiktok: { count: null, account: 'Pendiente', ready: false }
    }
  };

  const CHANNELS = {
    whatsapp: { label:'WhatsApp', icon:'ti-brand-whatsapp' },
    instagram: { label:'Instagram', icon:'ti-brand-instagram' },
    facebook: { label:'Facebook', icon:'ti-brand-facebook' },
    tiktok: { label:'TikTok', icon:'ti-brand-tiktok' }
  };

  function ensureTikTokPanel(){
    const view=$('#v-crmLinea');
    if(!view || $('#bcSocialTikTokPanel')) return;
    const panel=document.createElement('section');
    panel.id='bcSocialTikTokPanel';
    panel.innerHTML=`
      <div class="bc-tt-placeholder">
        <div class="bc-tt-box">
          <div class="bc-tt-icon"><i class="ti ti-brand-tiktok"></i></div>
          <h3>TikTok preparado para integración</h3>
          <p>La interfaz ya reserva TikTok dentro de Redes. Las acciones de comentarios e inbox se habilitarán únicamente cuando exista una integración oficial y autorizada para BAYOL CELL.</p>
          <span class="bc-tt-state"><i class="ti ti-clock"></i> Integración backend pendiente</span>
        </div>
      </div>`;
    view.appendChild(panel);
  }

  function ensureFacebookPanel(){
    const panel=$('#bcSocialFacebookPanel');
    if(!panel || panel.dataset.fbReady==='1') return;
    panel.innerHTML=`<div class="bc-social-generic-shell" data-social-generic="facebook">
      <aside class="bc-social-generic-list">
        <div class="bc-social-generic-head"><div class="bc-social-generic-account"><span class="bc-social-generic-logo fb"><i class="ti ti-brand-facebook"></i></span><span><b>Facebook Messenger</b><small id="bcFbAccountSub">Conectando cuenta…</small></span><em id="bcFbStatus">Conectando</em></div><label class="bc-social-generic-search"><i class="ti ti-search"></i><input id="bcFbSearch" type="search" placeholder="Buscar conversación…"></label></div>
        <div class="bc-social-generic-threads" id="bcFbThreads"><div class="bc-social-loading"><span class="bc-social-spin"></span>Cargando conversaciones…</div></div>
      </aside>
      <section class="bc-social-generic-chat" id="bcFbChat"><div class="bc-ig-empty"><div><i class="ti ti-brand-facebook"></i><b>Selecciona una conversación</b><span>Los mensajes de Messenger aparecerán aquí.</span></div></div></section>
    </div>`;
    panel.dataset.fbReady='1';
    panel.addEventListener('click',e=>{ const row=e.target.closest('[data-fb-thread]'); if(row) openFacebookThread(row.dataset.fbThread); });
    $('#bcFbSearch')?.addEventListener('input',e=>{ const q=String(e.target.value||'').toLowerCase(); $$('#bcFbThreads [data-fb-thread]').forEach(r=>{r.hidden=q && !r.textContent.toLowerCase().includes(q);}); });
  }

  async function loadFacebookThreads(){
    const client=typeof supabaseClient!=='undefined'?supabaseClient:window.supabaseClient;
    const host=$('#bcFbThreads');
    if(!client?.from || !host) return;
    if(host.dataset.fbLoading==='1'){host.dataset.fbReload='1';return;}
    host.dataset.fbLoading='1';
    try{
      host.innerHTML='<div class="bc-social-loading"><span class="bc-social-spin"></span>Comprobando Facebook…</div>';
      const actor=typeof sessionUser!=='undefined'?sessionUser:window.sessionUser;
      const sucursalId=actor?.sucursal_id||actor?.sucursalId;
      let accountQuery=client.from('social_cuentas').select('id,username,display_name,estado').eq('plataforma','facebook').eq('activo',true);
      if(sucursalId) accountQuery=accountQuery.eq('sucursal_id',sucursalId);
      const {data:account,error:accountError}=await withTimeout(accountQuery.order('actualizado_en',{ascending:false}).limit(1).maybeSingle(),12000);
      if(accountError) throw accountError;
      if(!account){
        state.meta.facebook.ready=false;
        state.meta.facebook.account='Sin cuenta';
        syncHeaderState();
        host.innerHTML='<div class="bc-social-empty-state"><i class="ti ti-brand-facebook"></i><b>Facebook no está vinculado</b><span>Conecta la página BayolCell en Zernio.</span></div>';
        return;
      }
      const sub=$('#bcFbAccountSub'); if(sub) sub.textContent=account.display_name||account.username||'BayolCell';
      const status=$('#bcFbStatus'); if(status){status.textContent='Conectado';status.className='on';}
      state.meta.facebook.ready=true;
      state.meta.facebook.account=account.display_name||account.username||'BayolCell';
      syncHeaderState();
      const {data:threads,error}=await withTimeout(client.from('social_hilos').select('id,participant_name,participant_username,ultimo_mensaje_preview,ultimo_mensaje_at,no_leidos_count,estado').eq('cuenta_id',account.id).order('actualizado_en',{ascending:false}).limit(100),12000);
      if(error) throw error;
      if(!threads?.length){host.innerHTML='<div class="bc-social-empty-state"><i class="ti ti-message-circle"></i><b>Sin conversaciones todavía</b><span>La importación inicial de Zernio puede tardar unos segundos.</span></div>';return;}
      host.innerHTML=threads.map(t=>{const name=t.participant_name||t.participant_username||'Contacto de Facebook';const initials=name.split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();return `<button type="button" class="bc-social-generic-thread${t.no_leidos_count?' unread':''}" data-fb-thread="${t.id}"><span class="bc-social-generic-avatar">${escapeHtml(initials)}</span><span class="bc-social-generic-thread-copy"><b>${escapeHtml(name)}</b><small>${escapeHtml(t.ultimo_mensaje_preview||'Sin mensajes')}</small></span>${t.no_leidos_count?`<em>${t.no_leidos_count}</em>`:''}</button>`;}).join('');
    }catch(e){
      state.meta.facebook.ready=false;
      syncHeaderState();
      host.innerHTML='<div class="bc-social-error"><i class="ti ti-alert-triangle"></i><b>No se pudo cargar Facebook</b><span>La conexión tardó demasiado o la sesión no tiene acceso a esta sucursal.</span><button type="button" id="bcFbRetry">Reintentar</button></div>';
      $('#bcFbRetry')?.addEventListener('click',()=>{ accountSyncStarted=false; loadFacebookThreads(); syncConnectedAccounts(); });
    }finally{
      host.dataset.fbLoading='0';
      if(host.dataset.fbReload==='1'){
        delete host.dataset.fbReload;
        if(state.visible && state.channel==='facebook') loadFacebookThreads();
      }
    }
  }

  let facebookMessageGeneration=0;
  let facebookSelectedThread=null;
  async function openFacebookThread(id){
    const client=typeof supabaseClient!=='undefined'?supabaseClient:window.supabaseClient; const chat=$('#bcFbChat'); if(!client?.from||!chat)return;
    const generation=++facebookMessageGeneration;
    facebookSelectedThread=id;
    const current=()=>generation===facebookMessageGeneration && facebookSelectedThread===id && state.visible && state.channel==='facebook';
    chat.innerHTML='<div class="bc-social-loading"><span class="bc-social-spin"></span>Cargando mensajes…</div>';
    try{
    const {data:thread,error:threadError}=await withTimeout(client.from('social_hilos').select('id,participant_name,participant_username').eq('id',id).maybeSingle(),12000);
    if(!current())return;
    if(threadError)throw threadError;
    if(!thread)throw new Error('Conversación no disponible.');
    const {data:rows,error:messagesError}=await withTimeout(client.from('social_mensajes').select('id,direccion,cuerpo,tipo_contenido,media_url,estado,creado_en').eq('hilo_id',id).order('creado_en',{ascending:false}).order('id',{ascending:false}).limit(500),12000);
    if(!current())return;
    if(messagesError)throw messagesError;
    const messages=(rows||[]).reverse();
    const name=thread.participant_name||thread.participant_username||'Contacto de Facebook';
    chat.innerHTML=`<div class="bc-social-generic-chat-head"><span class="bc-social-generic-avatar">${escapeHtml(name.slice(0,2).toUpperCase())}</span><div><b>${escapeHtml(name)}</b><small>${escapeHtml(thread.participant_username||'Messenger')}</small></div><span class="bc-social-generic-channel">Facebook</span></div><div class="bc-social-generic-messages" id="bcFbMessages">${(messages||[]).map(m=>`<div class="bc-social-generic-message ${m.direccion==='out'?'out':'in'}"><div>${escapeHtml(m.cuerpo|| (m.media_url?'Adjunto':'Mensaje sin texto'))}</div><small>${new Date(m.creado_en).toLocaleString('es-DO',{dateStyle:'short',timeStyle:'short'})} · ${m.estado||''}</small></div>`).join('')||'<div class="bc-ig-empty"><div><b>Sin mensajes</b></div></div>'}</div><form class="bc-social-generic-composer" id="bcFbComposer"><textarea id="bcFbText" rows="1" placeholder="Escribe un mensaje…"></textarea><button type="submit" aria-label="Enviar"><i class="ti ti-send"></i></button></form>`;
    const messagesEl=$('#bcFbMessages'); if(messagesEl)messagesEl.scrollTop=messagesEl.scrollHeight;
    $('#bcFbComposer')?.addEventListener('submit',async e=>{
      e.preventDefault();const ta=$('#bcFbText'),text=String(ta?.value||'').trim();
      const btn=e.currentTarget.querySelector('button');if(!text||btn.disabled)return;
      btn.disabled=true;
      try{
        const {data,error}=await withTimeout(client.functions.invoke('social-enviar',{body:{hiloId:id,text}}),22000);
        if(error)throw error;
        if(data?.ok!==true)throw new Error('No se confirmó el envío.');
        ta.value='';
        if(current())await openFacebookThread(id);
        await loadFacebookThreads();
      }catch(err){alert('No se confirmó el envío. Revisa la conversación antes de reenviar; el mensaje podría haber salido.');}
      finally{btn.disabled=false;}
    });
    }catch(error){
      if(!current())return;
      chat.innerHTML='<div class="bc-social-error"><b>No se pudieron cargar los mensajes</b><span>Comprueba la conexión y vuelve a intentarlo.</span><button type="button" id="bcFbRetryMessages">Reintentar</button></div>';
      $('#bcFbRetryMessages')?.addEventListener('click',()=>openFacebookThread(id));
    }
  }

  function ensureContextPanel(){
    const view=$('#v-crmLinea');
    if(!view || $('#bcSocialContextPanel')) return;
    const panel=document.createElement('section');
    panel.id='bcSocialContextPanel';
    panel.innerHTML='<div class="bc-social-context-card"></div>';
    view.appendChild(panel);
  }

  function ensureHeader(){
    const head=$('#bcSocialHubHead');
    if(!head) return false;
    ensureTikTokPanel();
    ensureFacebookPanel();
    ensureContextPanel();

    $('#v-crmLinea')?.classList.add('bc-unified-nav');
    $('#bcSocialBackRow')?.remove();
    head.innerHTML=`
      <div class="bc-smart-platforms" id="bcSmartPlatforms" role="tablist" aria-label="Red social">
        ${Object.entries(CHANNELS).map(([key,c])=>`
          <button type="button" class="bc-smart-platform" data-smart-channel="${key}" role="tab" aria-selected="false">
            <span class="bc-smart-platform-icon"><i class="ti ${c.icon}"></i></span>
            <span class="bc-smart-platform-copy">
              <b>${c.label}</b>
              <small id="bcSmartAccount-${key}">${key==='instagram'?'Cargando cuenta…':'Pendiente de integración'}</small>
            </span>
            <span class="bc-smart-count" id="bcSmartCount-${key}" hidden>—</span>
          </button>`).join('')}
      </div>
      <div class="bc-smart-interactions">
        <div class="bc-smart-interaction-track" id="bcSmartInteractionNav" role="tablist" aria-label="Tipo de interacción"></div>
        <span class="bc-smart-divider" aria-hidden="true"></span>
        <button type="button" class="bc-smart-filter" id="bcSmartFilterBtn" aria-expanded="false">
          <i class="ti ti-filter"></i><span>Filtros</span><i class="ti ti-chevron-down"></i>
        </button>
        <div class="bc-smart-filter-pop" id="bcSmartFilterPop" hidden>
          <label><input type="checkbox" id="bcSmartUnreadOnly"> <span>Solo sin leer</span></label>
          <button type="button" id="bcSmartClearFilters">Limpiar filtros</button>
          <small>Los filtros se aplican a los datos reales disponibles del canal.</small>
        </div>
      </div>`;

    head.classList.add('bc-smart-ready');
    head.setAttribute('aria-label','Redes sociales: WhatsApp, Instagram, Facebook y TikTok');
    bindHeader();
    renderInteractionNav();
    syncHeaderState();
    return true;
  }

  function interactionItems(channel){
    const base = [
      {key:'all', label:'Todos', sub:'Todas las interacciones', icon:'ti-layout-grid'},
      {key:'messages', label:'Mensajes', sub: channel==='facebook' ? 'Messenger' : 'DM y respuestas', icon:'ti-send'},
      {key:'comments', label:'Comentarios', sub:'Publicaciones y Reels', icon:'ti-message-circle'}
    ];
    if(channel==='instagram') base.push({key:'mentions', label:'Menciones', sub:'Historias y etiquetas', icon:'ti-at'});
    return base;
  }

  function knownCount(channel, view){
    if(channel==='instagram'){
      if(view==='all' || view==='messages') return state.meta.instagram.count;
      return null;
    }
    return null;
  }

  function renderInteractionNav(){
    const host=$('#bcSmartInteractionNav');
    if(!host) return;
    const allowed=interactionItems(state.channel);
    if(!allowed.some(x=>x.key===state.view)) state.view='all';
    host.innerHTML=allowed.map(item=>{
      const count=knownCount(state.channel,item.key);
      const pending=(state.channel!=='instagram') || (state.channel==='instagram' && ['comments','mentions'].includes(item.key));
      return `
        <button type="button" class="bc-smart-interaction${state.view===item.key?' on':''}" data-smart-view="${item.key}" role="tab" aria-selected="${state.view===item.key}">
          <span class="bc-smart-interaction-icon"><i class="ti ${item.icon}"></i></span>
          <span class="bc-smart-interaction-copy"><b>${item.label}</b><small>${item.sub}</small></span>
          ${count!=null ? `<span class="bc-smart-mini-count">${count}</span>` : (pending ? '<span class="bc-smart-pending-dot" title="Integración pendiente"></span>' : '')}
        </button>`;
    }).join('');
  }

  function syncHeaderState(){
    $$('.bc-smart-platform').forEach(btn=>{
      const on=btn.dataset.smartChannel===state.channel;
      btn.classList.toggle('on',on);
      btn.setAttribute('aria-selected',String(on));
    });
    Object.keys(CHANNELS).forEach(ch=>{
      const meta=state.meta[ch];
      const account=$(`#bcSmartAccount-${ch}`);
      const count=$(`#bcSmartCount-${ch}`);
      if(account) account.textContent=meta.account || (meta.ready?'Conectado':'Pendiente de integración');
      if(count){
        if(meta.count==null){
          count.hidden=true;
        }else{
          count.hidden=false;
          count.textContent=String(meta.count);
        }
      }
    });
  }

  function bindHeader(){
    const head=$('#bcSocialHubHead');
    if(!head || head.dataset.smartBound==='1') return;
    head.dataset.smartBound='1';

    head.addEventListener('click',e=>{
      const channelBtn=e.target.closest('[data-smart-channel]');
      if(channelBtn){
        selectChannel(channelBtn.dataset.smartChannel);
        return;
      }
      const viewBtn=e.target.closest('[data-smart-view]');
      if(viewBtn){
        selectView(viewBtn.dataset.smartView);
        return;
      }
      if(e.target.closest('#bcSmartFilterBtn')){
        toggleFilters();
        return;
      }
      if(e.target.closest('#bcSmartClearFilters')){
        state.unreadOnly=false;
        const input=$('#bcSmartUnreadOnly');
        if(input) input.checked=false;
        applyFilters();
      }
    });

    head.addEventListener('change',e=>{
      if(e.target?.id==='bcSmartUnreadOnly'){
        state.unreadOnly=!!e.target.checked;
        applyFilters();
      }
    });

    document.addEventListener('click',e=>{
      const pop=$('#bcSmartFilterPop');
      const btn=$('#bcSmartFilterBtn');
      if(!pop || pop.hidden) return;
      if(!e.target.closest('#bcSmartFilterPop') && !e.target.closest('#bcSmartFilterBtn')){
        pop.hidden=true;
        btn?.setAttribute('aria-expanded','false');
      }
    },true);
  }

  function toggleFilters(){
    const pop=$('#bcSmartFilterPop');
    const btn=$('#bcSmartFilterBtn');
    if(!pop || !btn) return;
    pop.hidden=!pop.hidden;
    btn.setAttribute('aria-expanded',String(!pop.hidden));
  }

  function selectChannel(channel){
    if(!CHANNELS[channel]) return;
    if(channel==='whatsapp'){ window.crmLineaTab('mensajes'); return; }
    if(!state.visible){showSocial(channel);return;}
    state.channel=channel;
    state.view='all';
    renderInteractionNav();
    syncHeaderState();
    showCurrentContent();
    if(channel==='facebook') loadFacebookThreads();
    scheduleRefresh();
  }

  function selectView(view){
    if(!interactionItems(state.channel).some(x=>x.key===view)) return;
    state.view=view;
    renderInteractionNav();
    showCurrentContent();
    if(state.channel==='facebook' && ['all','messages'].includes(view)) loadFacebookThreads();
  }

  function contextInfo(){
    const ch=CHANNELS[state.channel]?.label || state.channel;
    const configs={
      instagram:{
        comments:{
          icon:'ti-message-circle',
          title:'Comentarios de Instagram',
          text:'Aquí se mostrarán comentarios de publicaciones y Reels, con publicación de origen, estado, tiempo sin responder, agente y acceso a conversación privada relacionada.',
          chips:['Publicación de origen','Responder público','Enviar a DM','Convertir en lead']
        },
        mentions:{
          icon:'ti-at',
          title:'Menciones de Instagram',
          text:'Aquí se mostrarán menciones, historias y etiquetas cuando el webhook y permisos correspondientes estén conectados.',
          chips:['Historia / mención','Responder','Asignar agente','Convertir en lead']
        }
      },
      facebook:{
        all:{
          icon:'ti-brand-facebook',
          title:'Actividad de Facebook',
          text:'Esta vista reunirá Messenger y comentarios de Facebook sin mezclar ni duplicar interacciones.',
          chips:['Messenger','Comentarios','Private Reply','Leads']
        },
        messages:{
          icon:'ti-brand-messenger',
          title:'Facebook Messenger',
          text:'Bandeja privada preparada para conversaciones de Messenger. Se habilitará cuando la página, webhooks y envío estén conectados.',
          chips:['Conversaciones','No leídos','Asignación','Notas']
        },
        comments:{
          icon:'ti-message-circle',
          title:'Comentarios de Facebook',
          text:'Comentarios públicos con contexto de publicación, respuesta pública y Private Reply cuando Meta lo permita.',
          chips:['Publicación','Responder público','Private Reply','Lead']
        }
      },
      tiktok:{
        all:{
          icon:'ti-brand-tiktok',
          title:'Actividad de TikTok',
          text:'La vista está preparada para integrar únicamente las capacidades oficiales y autorizadas disponibles para BAYOL CELL.',
          chips:['Comentarios','Inbox cuando aplique','Asignación','Leads']
        },
        messages:{
          icon:'ti-send',
          title:'TikTok Inbox',
          text:'Reservado para mensajes privados si la integración oficial aprobada para la cuenta permite recibirlos y responderlos.',
          chips:['Inbox','No leídos','Asignación']
        },
        comments:{
          icon:'ti-message-circle',
          title:'Comentarios de TikTok',
          text:'Reservado para comentarios y respuestas cuando la API autorizada permita administrar esas interacciones.',
          chips:['Video de origen','Comentario','Respuesta','Lead']
        }
      }
    };
    return configs[state.channel]?.[state.view] || {
      icon: CHANNELS[state.channel]?.icon || 'ti-message-circle',
      title:`${ch} · ${state.view}`,
      text:'Esta sección se habilitará con datos reales del canal.',
      chips:[]
    };
  }

  function renderContext(){
    const panel=$('#bcSocialContextPanel');
    const card=$('.bc-social-context-card',panel);
    if(!panel || !card) return;
    const info=contextInfo();
    const meta=state.meta[state.channel];
    card.innerHTML=`
      <div class="bc-context-icon"><i class="ti ${info.icon}"></i></div>
      <div class="bc-context-copy">
        <div class="bc-context-kicker">${CHANNELS[state.channel]?.label || ''}</div>
        <h3>${info.title}</h3>
        <p>${info.text}</p>
        <div class="bc-context-chips">${(info.chips||[]).map(x=>`<span>${x}</span>`).join('')}</div>
        <div class="bc-context-status ${meta?.ready && state.channel==='instagram' ? 'partial' : 'pending'}">
          <i class="ti ${meta?.ready && state.channel==='instagram' ? 'ti-progress-check' : 'ti-clock'}"></i>
          ${meta?.ready && state.channel==='instagram' ? 'Canal conectado · módulo específico pendiente' : 'Integración backend pendiente'}
        </div>
      </div>`;
  }

  function showCurrentContent(){
    const view=$('#v-crmLinea');
    const ig=$('#bcSocialInstagramPanel');
    const fb=$('#bcSocialFacebookPanel');
    const tt=$('#bcSocialTikTokPanel');
    const ctx=$('#bcSocialContextPanel');
    if(!view || !ig || !fb || !tt || !ctx) return;

    ig.style.display='none';
    fb.style.display='none';
    tt.style.display='none';
    ctx.style.display='none';

    if(state.channel==='instagram' && (state.view==='all' || state.view==='messages')){
      ig.style.display='';
      view.dataset.socialChannel='instagram';
      window.BayolSocialHub?.switchChannel?.('instagram');
      setTimeout(applyFilters,60);
    }else if(state.channel==='facebook' && ['all','messages'].includes(state.view)){
      // Both inbox tabs share the real Messenger panel.
      fb.style.display='flex';
      view.dataset.socialChannel='facebook';
    }else if(state.channel==='tiktok' && state.view==='all'){
      tt.style.display='flex';
      view.dataset.socialChannel='tiktok';
    }else{
      ctx.style.display='flex';
      renderContext();
      view.dataset.socialChannel=state.channel;
    }
    view.classList.remove('bc-ig-chat-open');
  }

  function applyFilters(){
    if(state.channel!=='instagram' || !['all','messages'].includes(state.view)) return;
    $$('.bc-ig-thread').forEach(row=>{
      const hasUnread=!!row.querySelector('.bc-ig-unread');
      row.hidden=state.unreadOnly && !hasUnread;
    });
  }

  function ensureRedesTab(){
    const track=$('#v-crmLinea .crm-tabs-track');
    if(!track) return false;
    let btn=$('#crmLineaTabSocial');
    if(!btn){
      btn=document.createElement('button');
      btn.id='crmLineaTabSocial';
      btn.className='crm-tab-seg';
      btn.type='button';
      btn.innerHTML='<i class="ti ti-brand-meta"></i> Redes';
      btn.addEventListener('click',()=>showSocial(state.channel==='whatsapp'?'instagram':state.channel));
      track.appendChild(btn);
    }
    return true;
  }

  function setTabs(social){
    const wa=$('#crmLineaTabWa'), leads=$('#crmLineaTabLeads'), socialBtn=$('#crmLineaTabSocial');
    if(social){
      if(wa) wa.className='crm-tab-seg';
      if(leads) leads.className='crm-tab-seg';
      if(socialBtn) socialBtn.className='crm-tab-seg on pill-hundido';
    }else if(socialBtn){
      socialBtn.className='crm-tab-seg';
    }
  }

  function showSocial(channel='instagram'){
    const view=$('#v-crmLinea');
    const head=$('#bcSocialHubHead');
    if(!view || !head) return;
    state.visible=true;
    if(channel==='whatsapp'){ window.crmLineaTab('mensajes'); return; }
    if(CHANNELS[channel]) state.channel=channel;
    const nativeRedes=$('#crmLinea-redes'); if(nativeRedes) nativeRedes.style.display='none';
    view.classList.add('bc-social-mode');
    const wa=$('#crmLinea-mensajes'), leads=$('#crmLinea-leads');
    if(wa) wa.style.display='none';
    if(leads) leads.style.display='none';
    head.style.display='';
    syncConnectedAccounts();
    setTabs(true);
    renderInteractionNav();
    syncHeaderState();
    showCurrentContent();
    if(state.channel==='facebook' && ['all','messages'].includes(state.view)) loadFacebookThreads();
    scheduleRefresh();
  }

  // The account list can briefly lag behind a page that was just connected.
  // If the list endpoint is unavailable, use the already registered account
  // in Supabase so Facebook history can still be imported without exposing
  // the Zernio key in the browser.
  async function importFacebookHistory(client, sucursalId, accountId){
    if(!client?.from || !client?.functions?.invoke || !sucursalId) return null;
    let id=accountId||null;
    if(!id){
      try{
        const {data}=await withTimeout(client.from('social_cuentas').select('zernio_account_id').eq('sucursal_id',sucursalId).eq('plataforma','facebook').eq('activo',true).order('actualizado_en',{ascending:false}).limit(1).maybeSingle(),10000);
        id=data?.zernio_account_id||null;
      }catch(e){ console.warn('[social] no se pudo resolver la cuenta Facebook registrada',e); }
    }
    if(!id) return null;
    try{
      const result=await withTimeout(client.functions.invoke('social-importar-historial',{body:{accountId:id,sucursalId}}),25000);
      if(result?.error) throw result.error;
      return result?.data||null;
    }catch(e){ console.warn('[social] importación de historial Facebook no disponible',e); return null; }
    finally{ if(state.visible && state.channel==='facebook') loadFacebookThreads(); }
  }

  async function resolveSocialSucursalId(client, actor){
    const direct=actor?.sucursal_id||actor?.sucursalId;
    if(direct) return direct;
    // Owner/admin users may not carry a branch on their CRM profile. Resolve
    // it from the already registered Facebook account so the protected import
    // function still receives the correct tenant scope.
    try{
      const {data}=await withTimeout(client.from('social_cuentas').select('sucursal_id').eq('plataforma','facebook').eq('activo',true).order('actualizado_en',{ascending:false}).limit(1).maybeSingle(),8000);
      return data?.sucursal_id||null;
    }catch(e){ console.warn('[social] no se pudo resolver la sucursal de redes',e); return null; }
  }

  // Consulta los IDs reales de Zernio desde una Edge Function protegida.
  // Nunca se expone la API key en el navegador; la función solo devuelve
  // metadatos públicos de las cuentas y las registra en social_cuentas.
  let accountSyncStarted = false;
  async function syncConnectedAccounts(){
    if(accountSyncStarted) return;
    const client = typeof supabaseClient !== 'undefined' ? supabaseClient : window.supabaseClient;
    const actor = typeof sessionUser !== 'undefined' ? sessionUser : window.sessionUser;
    const sucursalId = await resolveSocialSucursalId(client,actor);
    if(!client?.functions?.invoke || !sucursalId) return;
    accountSyncStarted = true;
    try{
      const {data,error}=await withTimeout(client.functions.invoke('social-sincronizar-cuentas',{body:{sync:true,sucursalId}}),18000);
      if(error || !data?.ok){
        console.warn('[social] Zernio rechazó la sincronización',error || data);
        state.meta.facebook.account='Permiso pendiente';
        state.meta.tiktok.account='Permiso pendiente';
        state.meta.facebook.ready=false;
        state.meta.tiktok.ready=false;
        syncHeaderState();
        await importFacebookHistory(client,sucursalId);
        if(state.channel==='facebook') loadFacebookThreads();
        return;
      }
      (data.accounts||[]).forEach(a=>{
        const ch=a.platform;
        if(!state.meta[ch]) return;
        state.meta[ch].ready=!!a.isActive;
        state.meta[ch].account=a.username || a.displayName || 'Conectado';
      });
      syncHeaderState();
      if(state.visible) showCurrentContent();
      const fb=data.accounts?.find(a=>a.platform==='facebook');
      const imported=await importFacebookHistory(client,sucursalId,fb?._id);
      // Meta replay is asynchronous. A second sweep catches conversations
      // that were not visible during the first listing call.
      if(imported && Number(imported.threads||0)===0){
        setTimeout(()=>{ if(state.visible && state.channel==='facebook') importFacebookHistory(client,sucursalId,fb?._id); },10000);
      }
    }catch(e){
      accountSyncStarted=false;
      console.warn('[social] sync de cuentas no disponible',e);
      state.meta.facebook.ready=false;
      state.meta.tiktok.ready=false;
      syncHeaderState();
      await importFacebookHistory(client,sucursalId);
      if(state.channel==='facebook') loadFacebookThreads();
    }
  }

  function hideSocial(){
    state.visible=false;
    state.channel='whatsapp';
    if(window.BayolSocialHub) window.BayolSocialHub.state.channel='whatsapp';
    const view=$('#v-crmLinea');
    if(view){
      view.classList.remove('bc-social-mode','bc-ig-chat-open');
      view.dataset.socialChannel='whatsapp';
    }
    const head=$('#bcSocialHubHead');
    if(head) head.style.display='';
    ['#bcSocialInstagramPanel','#bcSocialFacebookPanel','#bcSocialTikTokPanel','#bcSocialContextPanel'].forEach(id=>{
      const el=$(id); if(el) el.style.display='none';
    });
    setTabs(false);
    syncHeaderState();
  }

  function patchTabs(){
    if(window.__bcSocialTabsPatched || typeof window.crmLineaTab!=='function') return;
    state.originalCrmLineaTab=window.crmLineaTab;
    window.crmLineaTab=async function(){
      if(arguments[0]==='redes'){ showSocial('instagram'); return; }
      hideSocial();
      return state.originalCrmLineaTab.apply(this,arguments);
    };
    window.__bcSocialTabsPatched=true;
  }

  async function refreshSmartData(){
    const client=typeof supabaseClient !== 'undefined' ? supabaseClient : window.supabaseClient;
    if(!state.visible || !client) return;
    if(state.channel==='facebook' && ['all','messages'].includes(state.view)) await loadFacebookThreads();
    try{
      const {data:accounts,error:aErr}=await client.from('instagram_cuentas').select('id,instagram_username,nombre').eq('activo',true).limit(10);
      if(!aErr && accounts?.length){
        const account=accounts[0];
        state.meta.instagram.account=account.instagram_username ? `@${account.instagram_username}` : (account.nombre || 'Conectado');
        const {data:threads,error:tErr}=await client.from('instagram_hilos').select('id,no_leidos_count').eq('cuenta_id',account.id).eq('estado','abierto').limit(5000);
        if(!tErr) state.meta.instagram.count=(threads||[]).reduce((sum,h)=>sum+Number(h.no_leidos_count||0),0);
      }else if(!aErr){
        state.meta.instagram.account='Sin cuenta disponible';
        state.meta.instagram.count=0;
      }
    }catch{}

    syncHeaderState();
    renderInteractionNav();
    applyFilters();
  }

  function scheduleRefresh(){
    clearTimeout(state.refreshTimer);
    state.refreshTimer=setTimeout(refreshSmartData,120);
  }

  function observeInbox(){
    const host=$('#bcIgThreads');
    if(!host || host.dataset.smartObserved==='1') return;
    host.dataset.smartObserved='1';
    new MutationObserver(()=>applyFilters()).observe(host,{childList:true,subtree:true});
  }

  function finalize(){
    if(!ensureHeader() || !ensureRedesTab()) return false;
    patchTabs();
    hideSocial();
    observeInbox();

    const view=$('#v-crmLinea');
    if(view && !view.dataset.socialScopeObserved){
      view.dataset.socialScopeObserved='1';
      new MutationObserver(()=>{
        if(view.classList.contains('active') && state.visible) scheduleRefresh();
      }).observe(view,{attributes:true,attributeFilter:['class']});
    }

    window.BayolSocialNetworks={
      show:showSocial,
      hide:hideSocial,
      selectChannel,
      selectView,
      get channel(){return state.channel;},
      get view(){return state.view;},
      refresh:refreshSmartData,
      version:'20260912d'
    };
    return true;
  }

  function start(){
    if(finalize()) return;
    const mo=new MutationObserver(()=>{
      if(finalize()) mo.disconnect();
    });
    mo.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(()=>mo.disconnect(),30000);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
