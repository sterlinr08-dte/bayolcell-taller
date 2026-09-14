/* BAYOL CELL CRM extensions loader */
(function(){
  'use strict';
  if(window.__bcCrmExtensionsLoader)return;
  window.__bcCrmExtensionsLoader=true;

  var V='20260913-hotfix1';
  var AMBIENT='20260914-safe3';
  var SURFACE='20260914-clean1';

  // Capa final del Taller: elimina el borde blanco/refractivo en todo el sistema.
  try{
    var surfaceCss=document.createElement('link');
    surfaceCss.rel='stylesheet';
    surfaceCss.href='taller-surface-cleanup.css?v='+SURFACE;
    document.head.appendChild(surfaceCss);
  }catch(e){}

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
    document.head.appendChild(polishCss);

    var effectsCss=document.createElement('link');
    effectsCss.rel='stylesheet';
    effectsCss.href='crm-social-effects.css?v='+V;
    document.head.appendChild(effectsCss);

    var hub=document.createElement('script');
    hub.src='crm-social-hub.js?v='+V;
    hub.onload=function(){
      var scope=document.createElement('script');
      scope.src='crm-social-scope-fix.js?v='+V;
      scope.onload=function(){
        var polish=document.createElement('script');
        polish.src='crm-social-polish-v2.js?v='+V;
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

  // Decorativo y completamente desacoplado: solo se solicita DESPUÉS de window.load.
  // Si el archivo falla o no existe, el taller no depende de él y sigue operando.
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
  function programarAmbient(){
    try{setTimeout(cargarAmbientOrbSeguro,1200);}catch(e){}
  }
  if(document.readyState==='complete')programarAmbient();
  else window.addEventListener('load',programarAmbient,{once:true,passive:true});
})();
