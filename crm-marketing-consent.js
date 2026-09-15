/* BAYOL CELL CRM extensions loader */
(function(){
  'use strict';
  if(window.__bcCrmExtensionsLoader)return;
  window.__bcCrmExtensionsLoader=true;

  var V='20260915-hotfix15';
  var AMBIENT='20260914-hotfix2';
  var SURFACE='20260914-clean1';
  var MIDNIGHT='20260914-midnight1';
  var surfaceCss=null;
  var midnightCss=null;

  // Loader premium: conserva la lógica de cierre original de taller.html y
  // sustituye únicamente la presentación del aro/logo giratorio.
  function instalarLoaderPremium(){
    try{
      var loader=document.getElementById('appLoader');
      if(!loader||document.getElementById('bcLoaderPremiumStyle'))return;

      var style=document.createElement('style');
      style.id='bcLoaderPremiumStyle';
      style.textContent=[
        '#appLoader{flex-direction:column!important;gap:0!important;perspective:none!important;',
        'background:radial-gradient(58% 48% at 18% 12%,rgba(0,71,171,.62),transparent 70%),',
        'radial-gradient(46% 40% at 84% 84%,rgba(255,107,53,.13),transparent 72%),',
        'linear-gradient(135deg,#0047AB 0%,#17345f 42%,#1A1A2E 100%)!important;',
        'transition:opacity .34s ease,visibility .34s ease!important;}',
        '#appLoader .ldr-logo{order:1!important;position:relative!important;width:154px!important;max-width:46vw!important;',
        'height:auto!important;animation:bcLoaderLogoPulse 2.35s ease-in-out infinite!important;',
        'filter:drop-shadow(0 16px 30px rgba(0,0,0,.28)) drop-shadow(0 0 18px rgba(95,168,255,.18))!important;}',
        '#appLoader .bc-loader-copy{order:2!important;margin-top:18px!important;text-align:center!important;',
        'font-family:"Plus Jakarta Sans",system-ui,sans-serif!important;pointer-events:none!important;}',
        '#appLoader .bc-loader-title{display:block!important;color:#fff!important;font-size:18px!important;',
        'line-height:1.25!important;font-weight:800!important;letter-spacing:-.02em!important;}',
        '#appLoader .bc-loader-status{display:block!important;margin-top:7px!important;color:rgba(255,255,255,.68)!important;',
        'font-size:12px!important;font-weight:600!important;letter-spacing:.01em!important;}',
        '#appLoader .ldr-ring{order:3!important;position:relative!important;width:min(244px,64vw)!important;height:5px!important;',
        'max-width:none!important;max-height:none!important;margin-top:18px!important;border:0!important;border-radius:999px!important;',
        'background:rgba(255,255,255,.16)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.08)!important;',
        'animation:none!important;overflow:hidden!important;transform:none!important;}',
        '#appLoader .ldr-ring::after{content:"";position:absolute;inset:0 auto 0 0;width:42%;border-radius:999px;',
        'background:linear-gradient(90deg,#FF6B35 0%,#fff 50%,#5FA8FF 100%);',
        'box-shadow:0 0 16px rgba(95,168,255,.34);animation:bcLoaderProgress 1.22s cubic-bezier(.45,0,.25,1) infinite;}',
        '@keyframes bcLoaderLogoPulse{0%,100%{transform:translateY(0) scale(1);opacity:1}',
        '50%{transform:translateY(-2px) scale(1.024);opacity:.97}}',
        '@keyframes bcLoaderProgress{0%{transform:translateX(-125%)}100%{transform:translateX(340%)}}',
        '@media(max-width:640px){#appLoader .ldr-logo{width:136px!important}#appLoader .bc-loader-title{font-size:17px!important}',
        '#appLoader .ldr-ring{width:min(224px,66vw)!important}}',
        '@media(prefers-reduced-motion:reduce){#appLoader .ldr-logo{animation:none!important}',
        '#appLoader .ldr-ring::after{animation:none!important;transform:none!important;width:68%!important}}'
      ].join('');
      document.head.appendChild(style);

      var copy=document.createElement('div');
      copy.className='bc-loader-copy';
      copy.innerHTML='<strong class="bc-loader-title">Cargando sistema…</strong><span class="bc-loader-status">Preparando tu espacio de trabajo</span>';
      loader.appendChild(copy);
      loader.setAttribute('aria-label','Cargando sistema BAYOL CELL');
    }catch(e){}
  }
  instalarLoaderPremium();

  // Capas finales del Taller. Se reafirman al final para ganar la cascada del CRM.
  try{
    surfaceCss=document.createElement('link');
    surfaceCss.rel='stylesheet';
    surfaceCss.href='taller-surface-cleanup.css?v='+SURFACE;
    document.head.appendChild(surfaceCss);
  }catch(e){}
  try{
    midnightCss=document.createElement('link');
    midnightCss.rel='stylesheet';
    midnightCss.href='taller-midnight-motion.css?v='+MIDNIGHT;
    document.head.appendChild(midnightCss);
  }catch(e){}
  function reafirmarCapasVisuales(){
    try{if(surfaceCss&&surfaceCss.parentNode)document.head.appendChild(surfaceCss);}catch(e){}
    try{if(midnightCss&&midnightCss.parentNode)document.head.appendChild(midnightCss);}catch(e){}
  }

  // El botón de actualizar hace una recarga completa, pero la experiencia
  // vuelve al mismo punto: página, pestaña, listas, historial y borrador.
  function guardarPosicionAntesDeActualizar(){
    var scrolls={};
    document.querySelectorAll('[id]').forEach(function(el){
      if(el.scrollTop>0 && el.scrollHeight>el.clientHeight) scrolls[el.id]=el.scrollTop;
    });
    var active=document.activeElement;
    var snap={x:window.scrollX||0,y:window.scrollY||0,scrolls:scrolls,
      nav:localStorage.getItem('bayol_nav_actual')||'',subtab:localStorage.getItem('bayol_subtab_crmlinea')||'',
      input:active && /^(INPUT|TEXTAREA)$/.test(active.tagName) && active.id ? {id:active.id,value:active.value,start:active.selectionStart,end:active.selectionEnd}:null};
    try{sessionStorage.setItem('bayol_refresh_position',JSON.stringify(snap));}catch(e){}
  }
  function restaurarPosicionDespuesDeActualizar(){
    var raw;try{raw=sessionStorage.getItem('bayol_refresh_position');sessionStorage.removeItem('bayol_refresh_position');}catch(e){return;}
    if(!raw)return;
    var snap;try{snap=JSON.parse(raw);}catch(e){return;}
    var restore=function(){
      window.scrollTo(snap.x||0,snap.y||0);
      Object.keys(snap.scrolls||{}).forEach(function(id){var el=document.getElementById(id);if(el)el.scrollTop=snap.scrolls[id];});
      var d=snap.input,input=d&&document.getElementById(d.id);
      if(input && d.value!=null){input.value=d.value;if(d.start!=null){try{input.setSelectionRange(d.start,d.end==null?d.start:d.end);}catch(e){}}}
    };
    [150,500,1200,2200].forEach(function(ms){setTimeout(restore,ms);});
  }
  var _renderOriginal=window.renderCrmLinea;
  if(typeof _renderOriginal==='function' && !window.__bcFullReloadRefresh){
    window.__bcFullReloadRefresh=true;
    window.renderCrmLinea=function(btn){
      if(btn){guardarPosicionAntesDeActualizar();setTimeout(function(){window.location.reload();},80);return Promise.resolve();}
      return _renderOriginal.apply(this,arguments);
    };
  }
  restaurarPosicionDespuesDeActualizar();
  var legacy=document.createElement('script');
  legacy.src='crm-marketing-consent-legacy.js?v='+V;
  legacy.onload=function(){
    var scopeCss=document.createElement('link');
    scopeCss.rel='stylesheet';
    scopeCss.href='crm-social-scope-fix.css?v='+V;
    document.head.appendChild(scopeCss);
    var facebookCss=document.createElement('link');
    facebookCss.rel='stylesheet';
    facebookCss.href='crm-facebook-chat.css?v='+V;
    document.head.appendChild(facebookCss);

    var polishCss=document.createElement('link');
    polishCss.rel='stylesheet';
    polishCss.href='crm-social-polish-v2.css?v='+V;
    polishCss.onload=function(){reafirmarCapasVisuales();};
    document.head.appendChild(polishCss);

    var effectsCss=document.createElement('link');
    effectsCss.rel='stylesheet';
    effectsCss.href='crm-social-effects.css?v='+V;
    effectsCss.onload=function(){reafirmarCapasVisuales();};
    document.head.appendChild(effectsCss);
    setTimeout(reafirmarCapasVisuales,300);

    var hub=document.createElement('script');
    hub.src='crm-social-hub.js?v='+V;
    hub.onload=function(){
      var scope=document.createElement('script');
      scope.src='crm-social-scope-fix.js?v='+V;
      scope.onload=function(){
        var polish=document.createElement('script');
        polish.src='crm-social-polish-v2.js?v='+V;
        polish.onload=function(){reafirmarCapasVisuales();};
        document.head.appendChild(polish);
      };
      var facebook=document.createElement('script');
      facebook.src='crm-facebook-chat.js?v='+V;
      facebook.onload=function(){document.head.appendChild(scope);};
      facebook.onerror=function(){document.head.appendChild(scope);};
      document.head.appendChild(facebook);
    };
    document.head.appendChild(hub);

    var messages=document.createElement('script');
    messages.src='crm-message-loading.js?v='+V;
    document.head.appendChild(messages);
  };
  document.head.appendChild(legacy);

  // Decorativo y completamente desacoplado: se solicita DESPUÉS de window.load.
  function cargarAmbientOrbSeguro(){
    try{
      if(window.__bcAmbientOrbRequested)return;
      window.__bcAmbientOrbRequested=true;
      var ambient=document.createElement('script');
      ambient.async=true;
      ambient.src='taller-ambient-orb-safe.js?v='+AMBIENT;
      ambient.onerror=function(){};
      document.head.appendChild(ambient);
    }catch(e){}
  }

  // Microinteracción de navegación: si falla, los botones/tabs siguen operando normal.
  function cargarNavigationMotionSeguro(){
    try{
      if(window.__bcNavigationMotionRequested)return;
      window.__bcNavigationMotionRequested=true;
      var motion=document.createElement('script');
      motion.async=true;
      motion.src='taller-navigation-motion.js?v='+MIDNIGHT;
      motion.onerror=function(){};
      document.head.appendChild(motion);
    }catch(e){}
  }

  function programarVisual(){
    try{setTimeout(cargarAmbientOrbSeguro,1200);}catch(e){}
    try{setTimeout(cargarNavigationMotionSeguro,1350);}catch(e){}
    try{setTimeout(reafirmarCapasVisuales,1800);}catch(e){}
  }
  if(document.readyState==='complete')programarVisual();
  else window.addEventListener('load',programarVisual,{once:true,passive:true});
})();
