/* BAYOL CELL — Redes: navegación inteligente de 2 barras */
(() => {
  'use strict';
  if (window.__bcSocialScopeFix) return;
  window.__bcSocialScopeFix = true;

  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const state = {
    visible: false,
    channel: 'instagram',
    view: 'all',
    unreadOnly: false,
    refreshTimer: null,
    originalCrmLineaTab: null,
    meta: {
      whatsapp: { count: null, account: 'Mensajes', ready: true },
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
    scheduleRefresh();
  }

  function selectView(view){
    if(!interactionItems(state.channel).some(x=>x.key===view)) return;
    state.view=view;
    renderInteractionNav();
    showCurrentContent();
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
    setTabs(true);
    renderInteractionNav();
    syncHeaderState();
    showCurrentContent();
    scheduleRefresh();
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