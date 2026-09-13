/* BAYOL CELL — Redes UI polish v2: barras segmentadas continuas */
(() => {
  'use strict';
  if (window.__bcSocialPolishV2) return;
  window.__bcSocialPolishV2 = true;

  const $ = (s, r=document) => r.querySelector(s);
  const norm = (v) => String(v || '').replace(/\s+/g, ' ').trim().toLowerCase();

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

  function markReady(){
    document.documentElement.classList.add('bc-social-polish-v2');
    dedupeRedesTabs();
    polishLabels();
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
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();