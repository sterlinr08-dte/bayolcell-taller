/* BAYOL CELL — Redes UI polish v2: barras segmentadas continuas */
(() => {
  'use strict';
  if (window.__bcSocialPolishV2) return;
  window.__bcSocialPolishV2 = true;

  const $ = (s, r=document) => r.querySelector(s);
  const norm = (v) => String(v || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const MOBILE_SCROLL_FIX_ID = 'bcCrmMobileScrollFix';
  let fitRaf = 0;

  function wireCanonicalRedesButton(btn){
    if (!btn) return null;
    btn.id = 'crmLineaTabSocial';
    btn.type = 'button';
    btn.removeAttribute('onclick');
    btn.setAttribute('aria-label','Abrir Redes Sociales');
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const api = window.BayolSocialNetworks;
      if (api?.show) api.show(api.channel==='whatsapp'?'instagram':(api.channel || 'instagram'));
    });
    return btn;
  }

  function dedupeRedesTabs(){
    const track = $('#v-crmLinea .crm-tabs-track');
    if (!track) return false;
    const candidates = Array.from(track.querySelectorAll('button')).filter(b => norm(b.textContent) === 'redes');
    if (!candidates.length) return false;

    if (candidates.length === 1) {
      const only = candidates[0];
      if (!only.id) only.id = 'crmLineaTabSocial';
      return true;
    }

    // Conserva la primera posición visual y elimina listeners heredados al clonar.
    const original = candidates[0];
    const clean = original.cloneNode(true);
    original.replaceWith(clean);
    wireCanonicalRedesButton(clean);

    candidates.slice(1).forEach(btn => {
      try { btn.remove(); } catch {}
    });
    return true;
  }

  function polishLabels(){
    const head = $('#bcSocialHubHead');
    if (!head) return false;
    const ig = $('#bcSmartAccount-instagram');
    const fb = $('#bcSmartAccount-facebook');
    const tt = $('#bcSmartAccount-tiktok');
    if (fb && /pendiente/i.test(fb.textContent || '') && fb.textContent !== 'Pendiente de conexión') fb.textContent = 'Pendiente de conexión';
    if (tt && /pendiente/i.test(tt.textContent || '')) tt.textContent = 'Sin mensajería por API';
    if (ig && /cargando/i.test(ig.textContent || '')) ig.textContent = '@bayolcell';
    return true;
  }

  /*
   * 16 sept 2026 — corrección del bug visto en Safari iPhone:
   * las listas largas de Instagram/Facebook hacían crecer #v-crmLinea y
   * Safari terminaba desplazando TODO el documento. Al bajar, desaparecían
   * la barra CRM y las dos barras de Redes. La vista social ahora mide el
   * espacio real que queda en visualViewport y SOLO las listas internas
   * pueden desplazarse. No toca envío, Realtime, teclado ni datos.
   */
  function installMobileScrollFix(){
    if (document.getElementById(MOBILE_SCROLL_FIX_ID)) return;
    const style = document.createElement('style');
    style.id = MOBILE_SCROLL_FIX_ID;
    style.textContent = `
      @media (max-width:1024px){
        #v-crmLinea.bc-social-mode.active{
          display:flex!important;
          flex-direction:column!important;
          min-height:0!important;
          height:var(--bc-crm-mobile-height,calc(100dvh - 64px))!important;
          max-height:var(--bc-crm-mobile-height,calc(100dvh - 64px))!important;
          overflow:hidden!important;
          overscroll-behavior:none!important;
        }
        #v-crmLinea.bc-social-mode.active #bcSocialHubHead{
          flex:0 0 auto!important;
        }
        #v-crmLinea.bc-social-mode.active :is(#bcSocialInstagramPanel,#bcSocialFacebookPanel,#bcSocialTikTokPanel,#bcSocialContextPanel){
          flex:1 1 auto!important;
          min-height:0!important;
          overflow:hidden!important;
        }
        #v-crmLinea.bc-social-mode.active #bcSocialFacebookPanel:not(.bc-fb-open){
          height:auto!important;
          max-height:none!important;
        }
        #v-crmLinea.bc-social-mode.active #bcSocialFacebookPanel.bc-fb-open{
          height:var(--fb-shell-height,100%)!important;
          max-height:100%!important;
          flex:0 0 auto!important;
        }
        #v-crmLinea.bc-social-mode.active .bc-ig-shell,
        #v-crmLinea.bc-social-mode.active #bcSocialFacebookPanel:not(.bc-fb-open) .bc-social-generic-shell,
        #v-crmLinea.bc-social-mode.active #bcSocialContextPanel.bc-fbc-active .bc-fbc-shell{
          height:100%!important;
          min-height:0!important;
          max-height:100%!important;
          overflow:hidden!important;
        }
        #v-crmLinea.bc-social-mode.active .bc-ig-list,
        #v-crmLinea.bc-social-mode.active #bcSocialFacebookPanel:not(.bc-fb-open) .bc-social-generic-list,
        #v-crmLinea.bc-social-mode.active .bc-fbc-posts,
        #v-crmLinea.bc-social-mode.active .bc-fbc-comments{
          min-height:0!important;
          overflow:hidden!important;
        }
        #v-crmLinea.bc-social-mode.active :is(.bc-ig-threads,.bc-social-generic-threads,.bc-fbc-posts-list,.bc-fbc-comments-body){
          min-height:0!important;
          overflow-y:auto!important;
          -webkit-overflow-scrolling:touch!important;
          overscroll-behavior-y:contain!important;
        }
      }
      @media (max-width:760px){
        #v-crmLinea.bc-social-mode.active #bcSocialContextPanel.bc-fbc-active .bc-fbc-shell{
          flex-direction:column!important;
        }
        #v-crmLinea.bc-social-mode.active #bcSocialContextPanel.bc-fbc-active .bc-fbc-posts{
          width:100%!important;
          flex:0 0 38%!important;
          min-height:0!important;
          max-height:38%!important;
        }
        #v-crmLinea.bc-social-mode.active #bcSocialContextPanel.bc-fbc-active .bc-fbc-comments{
          flex:1 1 auto!important;
          min-height:0!important;
        }
        #v-crmLinea.bc-social-mode.active #bcSocialFacebookPanel:not(.bc-fb-open) .bc-social-generic-list{
          flex:1 1 auto!important;
          min-height:0!important;
          max-height:none!important;
        }
        #v-crmLinea.bc-social-mode.active #bcSocialFacebookPanel:not(.bc-fb-open) .bc-social-generic-shell{
          min-height:0!important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function fitMobileSocialViewport(){
    const root = $('#v-crmLinea');
    if (!root) return;
    const mobile = window.matchMedia('(max-width:1024px)').matches;
    const socialActive = mobile && root.classList.contains('active') && root.classList.contains('bc-social-mode');
    if (!socialActive) {
      root.style.removeProperty('--bc-crm-mobile-height');
      return;
    }

    const vv = window.visualViewport;
    const viewportBottom = vv ? (vv.height + Math.max(0, vv.offsetTop || 0)) : window.innerHeight;
    const rect = root.getBoundingClientRect();
    const topInsideViewport = Math.max(0, rect.top);
    const available = Math.max(280, Math.floor(viewportBottom - topInsideViewport - 4));
    root.style.setProperty('--bc-crm-mobile-height', available + 'px');
  }

  function scheduleFit(){
    if (fitRaf) cancelAnimationFrame(fitRaf);
    fitRaf = requestAnimationFrame(() => {
      fitRaf = 0;
      fitMobileSocialViewport();
    });
  }

  function markReady(){
    document.documentElement.classList.add('bc-social-polish-v2');
    installMobileScrollFix();
    dedupeRedesTabs();
    polishLabels();
    scheduleFit();
  }

  function start(){
    markReady();
    const root = $('#v-crmLinea') || document.documentElement;
    let t = null;
    const mo = new MutationObserver(() => {
      clearTimeout(t);
      t = setTimeout(markReady, 30);
    });
    mo.observe(root,{childList:true,subtree:true});
    setTimeout(() => mo.disconnect(), 120000);

    if (root !== document.documentElement) {
      const attrMo = new MutationObserver(scheduleFit);
      attrMo.observe(root,{attributes:true,attributeFilter:['class','data-social-channel']});
      root.addEventListener('click', () => {
        scheduleFit();
        setTimeout(scheduleFit, 90);
        setTimeout(scheduleFit, 260);
      }, true);
    }

    window.visualViewport?.addEventListener('resize', scheduleFit);
    window.visualViewport?.addEventListener('scroll', scheduleFit);
    window.addEventListener('resize', scheduleFit);
    window.addEventListener('orientationchange', () => setTimeout(scheduleFit, 120));
    window.addEventListener('pageshow', scheduleFit);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();