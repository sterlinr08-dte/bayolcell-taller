/* BAYOL CELL — Social CRM refresh stability (2026-09-16)
   Corrige parpadeos y saltos de scroll producidos por refrescos repetidos.
   Facebook: coalesce ráfagas Realtime y evita lista -> spinner -> lista.
   Instagram: conserva lista/scroll durante repintados Realtime.
   Comentarios FB/IG/TikTok: conserva scroll y evita loaders de pantalla completa
   cuando ya existe contenido estable para la misma vista.
   No modifica mensajes, permisos, asignaciones ni datos.
*/
(function(){
  'use strict';
  if(window.__bcFbRefreshStability) return;
  window.__bcFbRefreshStability = true;
  window.__bcSocialRefreshStability = true;

  const VERSION = '20260916.2';
  const QUIET_MS = 900;
  const state = window.BayolSocialRefreshStability = window.BayolSocialRefreshStability || {
    version: VERSION,
    facebook: { cachedHtml:'', scrollTop:0, host:null, observer:null, pending:false, timer:null, masked:0, coalesced:0, snapshots:0 },
    instagram: { cachedHtml:'', scrollTop:0, host:null, observer:null, masked:0, snapshots:0, restores:0 },
    context: { key:'', cachedHtml:'', host:null, observer:null, masked:0, snapshots:0 },
    scrolls: new Map(),
    rootObserver: null
  };
  window.BayolFacebookRefreshStability = state.facebook;

  function root(){ return document.getElementById('v-crmLinea'); }
  function activeChannel(){ return root()?.dataset?.socialChannel || window.BayolSocialNetworks?.channel || ''; }
  function activeView(){ return window.BayolSocialNetworks?.view || 'all'; }
  function socialVisible(channel){
    try{
      const r=root();
      if(!r || !r.classList.contains('active') || !r.classList.contains('bc-social-mode')) return false;
      return activeChannel()===channel;
    }catch(_e){ return false; }
  }
  function loadingOnly(host){
    if(!host) return false;
    const loader=host.querySelector('.bc-social-loading');
    if(!loader) return false;
    const stable=host.querySelector('[data-fb-thread],.bc-ig-thread,.bc-social-empty-state,.bc-social-error,.bc-fbc-post,.bc-fbc-comment,.bc-fbc-comments-head');
    return !stable;
  }
  function restoreScroll(el, value){
    if(!el || !Number.isFinite(value)) return;
    const v=Math.max(0,value);
    el.scrollTop=v;
    requestAnimationFrame(()=>{ try{ if(el.isConnected) el.scrollTop=v; }catch(_e){} });
    setTimeout(()=>{ try{ if(el.isConnected) el.scrollTop=v; }catch(_e){} },40);
  }

  function fbStable(host){
    return !!host && !loadingOnly(host) && !!host.querySelector('[data-fb-thread],.bc-social-empty-state,.bc-social-error');
  }
  function fbSnapshot(){
    const s=state.facebook, host=s.host;
    if(!fbStable(host)) return;
    s.cachedHtml=host.innerHTML;
    s.scrollTop=host.scrollTop||0;
    s.snapshots++;
  }
  function fbRestore(){
    const s=state.facebook, host=s.host;
    if(!host || !s.cachedHtml || !socialVisible('facebook')) return false;
    host.innerHTML=s.cachedHtml;
    restoreScroll(host,s.scrollTop);
    s.masked++;
    return true;
  }
  function fbOneRefreshAfterQuiet(){
    const s=state.facebook;
    s.pending=true;
    if(s.timer) clearTimeout(s.timer);
    s.timer=setTimeout(function run(){
      s.timer=null;
      const host=s.host;
      if(!s.pending || !socialVisible('facebook') || !host) return;
      if(host.dataset.fbLoading==='1'){
        s.timer=setTimeout(run,350);
        return;
      }
      s.pending=false;
      try{ window.BayolSocialNetworks?.refresh?.(); }catch(_e){}
    },QUIET_MS);
  }
  function fbMutated(){
    const s=state.facebook, host=s.host;
    if(!host) return;
    if(host.dataset.fbLoading==='1' && host.dataset.fbReload==='1'){
      delete host.dataset.fbReload;
      s.coalesced++;
      fbOneRefreshAfterQuiet();
    }
    if(loadingOnly(host)){
      fbRestore();
      return;
    }
    if(fbStable(host)) fbSnapshot();
    if(host.dataset.fbLoading==='0' && s.pending && !s.timer) fbOneRefreshAfterQuiet();
  }
  function attachFacebook(){
    const s=state.facebook, host=document.getElementById('bcFbThreads');
    if(!host || (s.host===host && s.observer)) return;
    try{s.observer?.disconnect();}catch(_e){}
    s.host=host;
    host.addEventListener('scroll',()=>{s.scrollTop=host.scrollTop||0;},{passive:true});
    fbSnapshot();
    s.observer=new MutationObserver(fbMutated);
    s.observer.observe(host,{childList:true,subtree:true,attributes:true,attributeFilter:['data-fb-loading','data-fb-reload']});
  }

  function igStable(host){
    return !!host && !loadingOnly(host) && !!host.querySelector('.bc-ig-thread,.bc-ig-empty');
  }
  function igSnapshot(){
    const s=state.instagram, host=s.host;
    if(!igStable(host)) return;
    s.cachedHtml=host.innerHTML;
    s.snapshots++;
  }
  function igRestoreLoading(){
    const s=state.instagram, host=s.host;
    if(!host || !s.cachedHtml || !socialVisible('instagram')) return false;
    host.innerHTML=s.cachedHtml;
    restoreScroll(host,s.scrollTop);
    s.masked++;
    return true;
  }
  function igMutated(){
    const s=state.instagram, host=s.host;
    if(!host) return;
    if(loadingOnly(host)){
      igRestoreLoading();
      return;
    }
    if(igStable(host)){
      const wanted=s.scrollTop||0;
      igSnapshot();
      if(socialVisible('instagram') && wanted>0){
        restoreScroll(host,wanted);
        s.restores++;
      }
    }
  }
  function attachInstagram(){
    const s=state.instagram, host=document.getElementById('bcIgThreads');
    if(!host || (s.host===host && s.observer)) return;
    try{s.observer?.disconnect();}catch(_e){}
    s.host=host;
    s.scrollTop=host.scrollTop||0;
    host.addEventListener('scroll',()=>{s.scrollTop=host.scrollTop||0;},{passive:true});
    igSnapshot();
    s.observer=new MutationObserver(igMutated);
    s.observer.observe(host,{childList:true,subtree:true});
  }

  function contextKey(){ return `${activeChannel()}:${activeView()}`; }
  function contextStable(host){
    return !!host && !loadingOnly(host) && !!host.querySelector('.bc-fbc-post,.bc-fbc-comment,.bc-fbc-comments-head,.bc-social-empty-state,.bc-social-error');
  }
  function contextSnapshot(){
    const s=state.context, host=s.host;
    if(!contextStable(host)) return;
    s.key=contextKey();
    s.cachedHtml=host.innerHTML;
    s.snapshots++;
  }
  function contextMutated(){
    const s=state.context, host=s.host;
    if(!host) return;
    const key=contextKey();
    if(loadingOnly(host) && s.cachedHtml && s.key===key){
      host.innerHTML=s.cachedHtml;
      s.masked++;
      return;
    }
    if(contextStable(host)) contextSnapshot();
    wireNestedScrollers();
  }
  function attachContext(){
    const s=state.context, host=document.getElementById('bcSocialContextPanel');
    if(!host || (s.host===host && s.observer)) return;
    try{s.observer?.disconnect();}catch(_e){}
    s.host=host;
    contextSnapshot();
    s.observer=new MutationObserver(contextMutated);
    s.observer.observe(host,{childList:true,subtree:true});
    wireNestedScrollers();
  }
  function wireNestedScrollers(){
    document.querySelectorAll('#bcSocialContextPanel .bc-fbc-posts-list,#bcSocialContextPanel .bc-fbc-comments-body').forEach(el=>{
      if(el.dataset.bcScrollStable==='1') return;
      el.dataset.bcScrollStable='1';
      const key=()=>`${contextKey()}:${el.classList.contains('bc-fbc-posts-list')?'posts':'comments'}`;
      const saved=state.scrolls.get(key());
      if(Number.isFinite(saved)) restoreScroll(el,saved);
      el.addEventListener('scroll',()=>state.scrolls.set(key(),el.scrollTop||0),{passive:true});
      new MutationObserver(()=>{
        const v=state.scrolls.get(key());
        if(Number.isFinite(v) && v>0) restoreScroll(el,v);
      }).observe(el,{childList:true,subtree:true});
    });
  }

  function attachAll(){
    attachFacebook();
    attachInstagram();
    attachContext();
    wireNestedScrollers();
  }

  attachAll();
  const r=root();
  if(r){
    state.rootObserver=new MutationObserver(attachAll);
    state.rootObserver.observe(r,{childList:true,subtree:true,attributes:true,attributeFilter:['data-social-channel','class']});
  }else{
    const wait=new MutationObserver(()=>{
      if(root()){
        wait.disconnect();
        attachAll();
        state.rootObserver=new MutationObserver(attachAll);
        state.rootObserver.observe(root(),{childList:true,subtree:true,attributes:true,attributeFilter:['data-social-channel','class']});
      }
    });
    wait.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(()=>wait.disconnect(),30000);
  }

  state.getSnapshot=function(){
    return {
      version:VERSION,
      facebook:{maskedSpinners:state.facebook.masked,coalescedReloads:state.facebook.coalesced,stableSnapshots:state.facebook.snapshots,pendingRefresh:!!state.facebook.pending},
      instagram:{maskedSpinners:state.instagram.masked,scrollRestores:state.instagram.restores,stableSnapshots:state.instagram.snapshots},
      context:{maskedSpinners:state.context.masked,stableSnapshots:state.context.snapshots,key:state.context.key},
      channel:activeChannel(),view:activeView()
    };
  };
  state.facebook.getSnapshot=state.getSnapshot;
})();
