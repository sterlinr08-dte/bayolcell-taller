/* BAYOL CELL — Facebook Realtime direct control (2026-09-16)
   Corrige el ciclo de refrescos de Messenger sin observar/reconstruir el DOM.
   - Retira únicamente la suscripción Realtime antigua bc-social-facebook.
   - Instala una suscripción equivalente con debounce/coalescencia.
   - Refresca la lista por la API pública BayolSocialNetworks.refresh().
   - Si ya hay conversaciones visibles, mantiene la lista mientras llega la
     respuesta nueva y conserva la posición de scroll.
   - Si el chat abierto recibe mensajes, lo vuelve a abrir una sola vez al
     final de la ráfaga para mostrar el contenido nuevo.
*/
(function(){
  'use strict';
  if(window.__bcFacebookRealtimeDirect) return;
  window.__bcFacebookRealtimeDirect = true;

  const VERSION = '20260916.1';
  const DEBOUNCE_MS = 750;
  const state = window.BayolFacebookRealtimeDirect = window.BayolFacebookRealtimeDirect || {
    version: VERSION,
    removedLegacyChannels: 0,
    realtimeEvents: 0,
    refreshes: 0,
    coalescedEvents: 0,
    silentRefreshes: 0,
    lastListScroll: 0,
    selectedThreadId: null,
    stableChannel: null,
    timer: null,
    pendingOpenChat: false,
    originalRefresh: null,
    originalRender: null,
    installed: false
  };

  function client(){
    try { return typeof supabaseClient !== 'undefined' ? supabaseClient : window.supabaseClient; }
    catch(_e){ return window.supabaseClient; }
  }

  function root(){ return document.getElementById('v-crmLinea'); }
  function panel(){ return document.getElementById('bcSocialFacebookPanel'); }
  function listHost(){ return document.getElementById('bcFbThreads'); }

  function facebookActive(){
    const r=root();
    if(!r || !r.classList.contains('active') || !r.classList.contains('bc-social-mode')) return false;
    return r.dataset.socialChannel === 'facebook';
  }

  function facebookChatOpen(){
    return !!panel()?.classList.contains('bc-fb-open');
  }

  function stableListVisible(host){
    return !!host?.querySelector('[data-fb-thread],.bc-social-empty-state,.bc-social-error');
  }

  function rememberScroll(){
    const host=listHost();
    if(host) state.lastListScroll = Math.max(0, host.scrollTop || 0);
  }

  function wireListScroll(){
    const host=listHost();
    if(!host || host.dataset.bcFbDirectScroll === '1') return;
    host.dataset.bcFbDirectScroll = '1';
    state.lastListScroll = Math.max(0, host.scrollTop || 0);
    host.addEventListener('scroll', rememberScroll, {passive:true});
  }

  function restoreListScroll(){
    const host=listHost();
    if(!host || !Number.isFinite(state.lastListScroll)) return;
    const wanted=Math.max(0,state.lastListScroll);
    host.scrollTop=wanted;
    requestAnimationFrame(function(){
      try{ if(host.isConnected) host.scrollTop=wanted; }catch(_e){}
    });
  }

  function wrapSocialRefresh(){
    const api=window.BayolSocialNetworks;
    if(!api || typeof api.refresh !== 'function') return false;
    if(api.refresh.__bcFacebookDirectWrapped) return true;

    const original=api.refresh.bind(api);
    state.originalRefresh=original;

    async function stableRefresh(){
      const active=facebookActive();
      const host=listHost();
      const keep=active && host && stableListVisible(host);
      const html=keep ? host.innerHTML : '';
      if(keep) rememberScroll();

      let resultPromise;
      try{
        // refreshSmartData() ejecuta loadFacebookThreads() síncronamente hasta
        // su primer await. Por eso el spinner ya puede estar pintado justo al
        // regresar de esta llamada, y aquí podemos devolver la lista estable.
        resultPromise=original.apply(this,arguments);
        if(keep && host?.querySelector('.bc-social-loading')){
          host.innerHTML=html;
          restoreListScroll();
          state.silentRefreshes++;
        }
        const result=await resultPromise;
        if(keep && facebookActive()) restoreListScroll();
        return result;
      }catch(error){
        throw error;
      }
    }
    stableRefresh.__bcFacebookDirectWrapped=true;
    stableRefresh.__bcOriginal=original;
    api.refresh=stableRefresh;
    return true;
  }

  function wrapFacebookRender(){
    const api=window.BayolFacebookChat;
    if(!api || typeof api.render !== 'function') return false;
    if(api.render.__bcFacebookDirectWrapped) return true;
    const original=api.render;
    state.originalRender=original;
    function trackedRender(thread){
      if(thread?.id){
        state.selectedThreadId=String(thread.id);
        const chat=document.getElementById('bcFbChat');
        if(chat) chat.dataset.bcFacebookThread=String(thread.id);
      }
      return original.apply(this,arguments);
    }
    trackedRender.__bcFacebookDirectWrapped=true;
    trackedRender.__bcOriginal=original;
    api.render=trackedRender;
    return true;
  }

  function isLegacyFacebookChannel(channel){
    const topic=String(channel?.topic || channel?.name || '');
    return topic === 'realtime:bc-social-facebook' || topic === 'bc-social-facebook';
  }

  async function removeLegacyRealtime(){
    const c=client();
    if(!c?.getChannels || !c?.removeChannel) return;
    const channels=c.getChannels() || [];
    for(const ch of channels){
      if(!isLegacyFacebookChannel(ch)) continue;
      try{
        await c.removeChannel(ch);
        state.removedLegacyChannels++;
      }catch(_e){}
    }
  }

  function selectedThreadId(){
    const chat=document.getElementById('bcFbChat');
    return String(chat?.dataset?.bcFacebookThread || state.selectedThreadId || '');
  }

  async function reopenSelectedThread(id){
    if(!id || !facebookActive() || !facebookChatOpen()) return;
    const escaped=(window.CSS && CSS.escape) ? CSS.escape(String(id)) : String(id).replace(/["\\]/g,'\\$&');
    const row=document.querySelector('#bcFbThreads [data-fb-thread="'+escaped+'"]');
    if(row) row.click();
  }

  async function runRefresh(){
    state.timer=null;
    if(!facebookActive()){
      state.pendingOpenChat=false;
      return;
    }
    const openChat=state.pendingOpenChat;
    state.pendingOpenChat=false;
    const id=selectedThreadId();
    try{
      if(window.BayolSocialNetworks?.refresh){
        state.refreshes++;
        await window.BayolSocialNetworks.refresh();
      }
      if(openChat && id) await reopenSelectedThread(id);
    }catch(error){
      console.warn('[Facebook Realtime Direct] refresh no disponible',error);
    }
  }

  function schedule(openChat){
    state.realtimeEvents++;
    if(state.timer) state.coalescedEvents++;
    state.pendingOpenChat = state.pendingOpenChat || !!openChat;
    if(state.timer) clearTimeout(state.timer);
    state.timer=setTimeout(runRefresh,DEBOUNCE_MS);
  }

  function installStableRealtime(){
    const c=client();
    if(!c?.channel || state.stableChannel) return false;
    try{
      state.stableChannel=c.channel('bc-social-facebook-stable-v2')
        .on('postgres_changes',{event:'*',schema:'public',table:'social_hilos'},function(){
          schedule(false);
        })
        .on('postgres_changes',{event:'*',schema:'public',table:'social_mensajes'},function(payload){
          const id=selectedThreadId();
          const changed=String(payload?.new?.hilo_id || payload?.old?.hilo_id || '');
          schedule(!!id && changed===id && facebookChatOpen());
        })
        .subscribe();
      return true;
    }catch(error){
      state.stableChannel=null;
      console.warn('[Facebook Realtime Direct] no se pudo suscribir',error);
      return false;
    }
  }

  function install(){
    wrapSocialRefresh();
    wrapFacebookRender();
    wireListScroll();
    installStableRealtime();
    removeLegacyRealtime();
    state.installed=!!(window.BayolSocialNetworks && state.stableChannel);
  }

  install();
  const boot=setInterval(function(){
    install();
    // El canal antiguo se crea cuando Facebook carga por primera vez. La
    // variable lexical del módulo queda marcada y no se recrea después de
    // removeChannel(), por lo que basta con retirarlo cuando aparezca.
    removeLegacyRealtime();
  },500);
  setTimeout(function(){ clearInterval(boot); install(); },30000);

  document.addEventListener('click',function(event){
    if(event.target.closest('[data-channel="facebook"],#menu-crm')){
      setTimeout(function(){ install(); removeLegacyRealtime(); },120);
      setTimeout(function(){ install(); removeLegacyRealtime(); },900);
    }
  },true);

  document.addEventListener('visibilitychange',function(){
    if(!document.hidden) setTimeout(function(){ install(); removeLegacyRealtime(); },150);
  },{passive:true});

  state.getSnapshot=function(){
    return {
      version:VERSION,
      installed:!!state.installed,
      removedLegacyChannels:state.removedLegacyChannels,
      realtimeEvents:state.realtimeEvents,
      coalescedEvents:state.coalescedEvents,
      refreshes:state.refreshes,
      silentRefreshes:state.silentRefreshes,
      selectedThreadId:selectedThreadId(),
      facebookActive:facebookActive(),
      chatOpen:facebookChatOpen()
    };
  };
})();
