/* BAYOL CELL — Facebook CRM refresh stability hotfix (2026-09-16)
   Problema observado en iPhone: ráfagas de Realtime disparan loadFacebookThreads()
   repetidamente. Esa función sustituye la lista por "Comprobando Facebook…"
   antes de cada lectura, provocando parpadeo lista -> spinner -> lista.

   Esta capa no modifica mensajes, permisos ni datos. Mantiene la última bandeja
   estable visible durante refrescos silenciosos y coalesce los reloads que llegan
   mientras una lectura ya está en curso.
*/
(function(){
  'use strict';
  if(window.__bcFbRefreshStability) return;
  window.__bcFbRefreshStability = true;

  const VERSION = '20260916.1';
  const QUIET_MS = 850;
  const state = window.BayolFacebookRefreshStability = window.BayolFacebookRefreshStability || {
    version: VERSION,
    cachedHtml: '',
    cachedScrollTop: 0,
    host: null,
    observer: null,
    pendingRefresh: false,
    quietTimer: null,
    maskedSpinners: 0,
    coalescedReloads: 0,
    stableSnapshots: 0
  };

  function facebookVisible(){
    try {
      const root = document.getElementById('v-crmLinea');
      const panel = document.getElementById('bcSocialFacebookPanel');
      if(!root || !panel) return false;
      if(!root.classList.contains('active') || !root.classList.contains('bc-social-mode')) return false;
      if(root.dataset.socialChannel !== 'facebook') return false;
      return panel.style.display !== 'none';
    } catch(_e) { return false; }
  }

  function isLoadingView(host){
    if(!host) return false;
    const loading = host.querySelector('.bc-social-loading');
    if(!loading) return false;
    return /Comprobando Facebook|Cargando conversaciones/i.test(loading.textContent || '');
  }

  function isStableView(host){
    if(!host || isLoadingView(host)) return false;
    return !!(
      host.querySelector('[data-fb-thread]') ||
      host.querySelector('.bc-social-empty-state') ||
      host.querySelector('.bc-social-error')
    );
  }

  function snapshot(host){
    if(!isStableView(host)) return;
    state.cachedHtml = host.innerHTML;
    state.cachedScrollTop = host.scrollTop || 0;
    state.stableSnapshots++;
  }

  function restoreStable(host){
    if(!state.cachedHtml || !facebookVisible()) return false;
    const wantedScroll = state.cachedScrollTop || 0;
    host.innerHTML = state.cachedHtml;
    host.scrollTop = wantedScroll;
    requestAnimationFrame(function(){
      try { if(host === state.host) host.scrollTop = wantedScroll; } catch(_e) {}
    });
    state.maskedSpinners++;
    return true;
  }

  function requestOneRefreshAfterQuiet(){
    state.pendingRefresh = true;
    if(state.quietTimer) clearTimeout(state.quietTimer);
    state.quietTimer = setTimeout(function run(){
      state.quietTimer = null;
      const host = state.host;
      if(!state.pendingRefresh || !facebookVisible() || !host) return;
      if(host.dataset.fbLoading === '1'){
        state.quietTimer = setTimeout(run, 350);
        return;
      }
      state.pendingRefresh = false;
      try {
        if(window.BayolSocialNetworks && typeof window.BayolSocialNetworks.refresh === 'function'){
          window.BayolSocialNetworks.refresh();
        }
      } catch(_e) {}
    }, QUIET_MS);
  }

  function onMutations(mutations){
    const host = state.host;
    if(!host) return;

    // Si otra llamada llega mientras Facebook ya está cargando, el código base
    // marca data-fb-reload=1 para repetir la consulta al terminar. En ráfagas de
    // Realtime esto encadena reload tras reload. Consumimos esa marca y dejamos
    // un único refresco diferido cuando la ráfaga se calme.
    if(host.dataset.fbLoading === '1' && host.dataset.fbReload === '1'){
      delete host.dataset.fbReload;
      state.coalescedReloads++;
      requestOneRefreshAfterQuiet();
    }

    if(isLoadingView(host)){
      restoreStable(host);
      return;
    }

    if(isStableView(host)) snapshot(host);

    // Si la carga terminó y había eventos agrupados, el temporizador anterior
    // hará una única lectura más. No se fuerza nada aquí para evitar bucles.
    if(host.dataset.fbLoading === '0' && state.pendingRefresh && !state.quietTimer){
      requestOneRefreshAfterQuiet();
    }
  }

  function attach(){
    const host = document.getElementById('bcFbThreads');
    if(!host){ setTimeout(attach, 180); return; }
    if(state.host === host && state.observer) return;

    try { state.observer?.disconnect(); } catch(_e) {}
    state.host = host;
    snapshot(host);

    state.observer = new MutationObserver(onMutations);
    state.observer.observe(host, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-fb-loading','data-fb-reload']
    });
  }

  // #bcFbThreads se crea de forma diferida al entrar a Redes. Además puede ser
  // reconstruido por cambios de vista, por eso vigilamos únicamente hasta tener
  // un host válido y revalidamos cuando cambia la estructura del CRM.
  attach();
  const root = document.getElementById('v-crmLinea');
  if(root){
    const rootObserver = new MutationObserver(function(){
      const current = document.getElementById('bcFbThreads');
      if(current && current !== state.host) attach();
    });
    rootObserver.observe(root, {childList:true, subtree:true});
    state.rootObserver = rootObserver;
  }

  state.getSnapshot = function(){
    return {
      version: VERSION,
      maskedSpinners: state.maskedSpinners,
      coalescedReloads: state.coalescedReloads,
      stableSnapshots: state.stableSnapshots,
      pendingRefresh: !!state.pendingRefresh,
      loading: state.host?.dataset?.fbLoading === '1'
    };
  };
})();
