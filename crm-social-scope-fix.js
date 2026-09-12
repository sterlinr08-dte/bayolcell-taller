/* BAYOL CELL — alcance de Redes: Instagram + Facebook + TikTok */
(() => {
  'use strict';
  if (window.__bcSocialScopeFix) return;
  window.__bcSocialScopeFix = true;

  const $ = (s,r=document) => r.querySelector(s);
  let socialVisible = false;
  let socialChannel = 'instagram';
  let originalCrmLineaTab = null;
  let refreshTimer = null;

  function ensureTikTokUi(head){
    const channels=head.querySelector('.bc-social-channels');
    if(channels && !channels.querySelector('[data-channel="tiktok"]')){
      const btn=document.createElement('button');
      btn.className='bc-social-channel';
      btn.dataset.channel='tiktok';
      btn.dataset.ready='0';
      btn.type='button';
      btn.innerHTML='<span class="bc-dot"></span><i class="ti ti-brand-tiktok"></i>TikTok';
      channels.appendChild(btn);
    }

    const kpis=head.querySelector('.bc-social-kpis');
    if(kpis && !$('#bcKpiTiktok')){
      const card=document.createElement('div');
      card.className='bc-social-kpi';
      card.dataset.tone='tt';
      card.innerHTML='<div class="bc-social-kpi-icon"><i class="ti ti-brand-tiktok"></i></div><div class="bc-social-kpi-num" id="bcKpiTiktok">—</div><div class="bc-social-kpi-label">TikTok sin leer</div>';
      const leads=$('#bcKpiLeads')?.closest('.bc-social-kpi');
      if(leads) kpis.insertBefore(card,leads);
      else kpis.appendChild(card);
    }

    const view=$('#v-crmLinea');
    if(view && !$('#bcSocialTikTokPanel')){
      const panel=document.createElement('section');
      panel.id='bcSocialTikTokPanel';
      panel.innerHTML=`
        <div class="bc-tt-placeholder">
          <div class="bc-tt-box">
            <div class="bc-tt-icon"><i class="ti ti-brand-tiktok"></i></div>
            <h3>TikTok preparado para integración</h3>
            <p>El CRM ya reserva TikTok como tercer canal de Redes. En este repositorio todavía no existe backend conectado para cuenta, conversaciones, webhook o envío, por eso no se muestran funciones simuladas.</p>
            <div class="bc-tt-list">
              <div class="bc-tt-item"><b>Cuenta TikTok</b><span>Conectar la cuenta autorizada y asociarla a la sucursal correspondiente.</span></div>
              <div class="bc-tt-item"><b>Bandeja</b><span>Crear almacenamiento real de conversaciones y mensajes con permisos por usuario/sucursal.</span></div>
              <div class="bc-tt-item"><b>Webhook + respuesta</b><span>Agregar recepción de eventos y envío solo cuando la integración oficial disponible lo permita.</span></div>
            </div>
            <span class="bc-tt-state"><i class="ti ti-clock"></i> Integración backend pendiente</span>
          </div>
        </div>`;
      view.appendChild(panel);
    }
  }

  function rewriteHeader(){
    const head=$('#bcSocialHubHead');
    if(!head) return false;

    const title=head.querySelector('.bc-social-title');
    const sub=head.querySelector('.bc-social-sub');
    if(title) title.textContent='Instagram, Facebook y TikTok';
    if(sub) sub.textContent='Bandeja de redes sociales separada del WhatsApp operativo.';

    const waButton=head.querySelector('[data-channel="whatsapp"]');
    if(waButton) waButton.remove();

    const waKpi=$('#bcKpiWa')?.closest('.bc-social-kpi');
    if(waKpi){
      waKpi.dataset.tone='fb';
      const icon=waKpi.querySelector('i');
      const num=waKpi.querySelector('.bc-social-kpi-num');
      const label=waKpi.querySelector('.bc-social-kpi-label');
      if(icon) icon.className='ti ti-brand-facebook';
      if(num){num.id='bcKpiFb';num.textContent='—';}
      if(label) label.textContent='Facebook sin leer';
    }

    ensureTikTokUi(head);

    const leadsLabel=$('#bcKpiLeads')?.parentElement?.querySelector('.bc-social-kpi-label');
    if(leadsLabel) leadsLabel.textContent='Leads de redes';

    const channelsLabel=$('#bcKpiChannels')?.parentElement?.querySelector('.bc-social-kpi-label');
    if(channelsLabel) channelsLabel.textContent='Redes conectadas';

    return true;
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
      btn.addEventListener('click',()=>showSocial(socialChannel));
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
    const ig=$('#bcSocialInstagramPanel');
    const fb=$('#bcSocialFacebookPanel');
    const tt=$('#bcSocialTikTokPanel');
    if(!view || !head || !ig || !fb || !tt) return;

    socialVisible=true;
    socialChannel=['instagram','facebook','tiktok'].includes(channel)?channel:'instagram';
    view.classList.add('bc-social-mode');
    view.classList.remove('bc-ig-chat-open');
    const wa=$('#crmLinea-mensajes'), leads=$('#crmLinea-leads');
    if(wa) wa.style.display='none';
    if(leads) leads.style.display='none';
    head.style.display='';
    ig.style.display=socialChannel==='instagram'?'':'none';
    fb.style.display=socialChannel==='facebook'?'':'none';
    tt.style.display=socialChannel==='tiktok'?'':'none';
    setTabs(true);

    head.querySelectorAll('[data-channel]').forEach(b=>b.classList.toggle('on',b.dataset.channel===socialChannel));
    if(socialChannel!=='tiktok' && window.BayolSocialHub?.switchChannel){
      window.BayolSocialHub.switchChannel(socialChannel);
    }else{
      view.dataset.socialChannel='tiktok';
    }
    scheduleSocialKpis();
  }

  function hideSocial(){
    socialVisible=false;
    const view=$('#v-crmLinea');
    if(view){
      view.classList.remove('bc-social-mode','bc-ig-chat-open');
      view.dataset.socialChannel='whatsapp';
    }
    const head=$('#bcSocialHubHead'),ig=$('#bcSocialInstagramPanel'),fb=$('#bcSocialFacebookPanel'),tt=$('#bcSocialTikTokPanel');
    if(head) head.style.display='none';
    if(ig) ig.style.display='none';
    if(fb) fb.style.display='none';
    if(tt) tt.style.display='none';
    setTabs(false);
  }

  function patchTabs(){
    if(window.__bcSocialTabsPatched || typeof window.crmLineaTab!=='function') return;
    originalCrmLineaTab=window.crmLineaTab;
    window.crmLineaTab=async function(name){
      hideSocial();
      return originalCrmLineaTab.apply(this,arguments);
    };
    window.__bcSocialTabsPatched=true;
  }

  function patchChannelClicks(){
    const head=$('#bcSocialHubHead');
    if(!head || head.dataset.scopeFixed==='1') return;
    head.dataset.scopeFixed='1';
    head.addEventListener('click',(e)=>{
      const b=e.target.closest('[data-channel]');
      if(!b) return;
      const ch=b.dataset.channel;
      if(!['instagram','facebook','tiktok'].includes(ch)) return;
      socialChannel=ch;
      if(socialVisible) setTimeout(()=>showSocial(ch),0);
    },true);
  }

  async function refreshSocialKpis(){
    if(!socialVisible || !window.supabaseClient) return;
    const client=window.supabaseClient;
    try{
      const {count}=await client.from('leads').select('id',{count:'exact',head:true})
        .in('canal',['instagram','facebook'])
        .in('etapa',['nuevo','contactado','cotizado']);
      const el=$('#bcKpiLeads');
      if(el) el.textContent=String(count??0);
    }catch{}

    try{
      const {count}=await client.from('instagram_cuentas').select('id',{count:'exact',head:true}).eq('activo',true);
      const el=$('#bcKpiChannels');
      if(el) el.textContent=`${(count||0)>0?1:0}/3`;
    }catch{}

    const fb=$('#bcKpiFb');
    const tt=$('#bcKpiTiktok');
    if(fb) fb.textContent='—';
    if(tt) tt.textContent='—';
  }

  function scheduleSocialKpis(){
    clearTimeout(refreshTimer);
    refreshTimer=setTimeout(refreshSocialKpis,120);
  }

  function finalize(){
    if(!rewriteHeader() || !ensureRedesTab()) return false;
    patchTabs();
    patchChannelClicks();
    hideSocial();

    const view=$('#v-crmLinea');
    if(view && !view.dataset.socialScopeObserved){
      view.dataset.socialScopeObserved='1';
      new MutationObserver(()=>{
        if(view.classList.contains('active') && socialVisible) scheduleSocialKpis();
      }).observe(view,{attributes:true,attributeFilter:['class']});
    }

    window.BayolSocialNetworks={
      show:showSocial,
      hide:hideSocial,
      get channel(){return socialChannel;},
      refresh:refreshSocialKpis,
      version:'20260912c'
    };
    return true;
  }

  function start(){
    if(finalize()) return;
    const mo=new MutationObserver(()=>{if(finalize())mo.disconnect();});
    mo.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(()=>mo.disconnect(),30000);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
