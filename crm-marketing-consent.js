/* BAYOL CELL CRM extensions loader */
(function(){
  'use strict';
  if(window.__bcCrmExtensionsLoader)return;
  window.__bcCrmExtensionsLoader=true;

  var V='20261023-u2';
  var SOCIAL_HUB='20261014-ig1';
  var PERF='20260929-f1';
  var FB_DIRECT='20260920-incr1';
  var GLASS='20260916-glass2';
  var AMBIENT='20260915-hotfix3';
  var SURFACE='20260914-clean1';
  var MIDNIGHT='20260929-f1';
  var surfaceCss=null;
  var midnightCss=null;
  var afinadoCss=null;
  var AFINADO='20261001-f3';

  function cargarPerformanceRuntime(){
    try{
      if(window.__bcPerformanceRuntimeRequested)return;
      window.__bcPerformanceRuntimeRequested=true;
      var perf=document.createElement('script');
      perf.async=false;
      perf.src='taller-performance-phase1.js?v='+PERF;
      perf.onerror=function(){window.__bcPerformanceRuntimeRequested=false;};
      document.head.appendChild(perf);
    }catch(e){}
  }
  cargarPerformanceRuntime();

  // Afinado Fase 2 (1 oct 2026): emojis de la interfaz -> íconos Tabler.
  try{
    if(!window.__bcIconosTallerReq){
      window.__bcIconosTallerReq=true;
      var ico=document.createElement('script');
      ico.async=false;
      ico.src='taller-iconos.js?v='+AFINADO;
      document.head.appendChild(ico);
    }
  }catch(e){}
  try{var avp=document.createElement('script');avp.async=false;avp.src='taller-pestana-avisos.js?v=20261018-nl1';document.head.appendChild(avp);}catch(e){} // Aviso en la pestaña: (N) sin leer + parpadeo con mensaje nuevo
  try{var bcr=document.createElement('script');bcr.async=false;bcr.src='bc-reflector.js?v=20261021r3';document.head.appendChild(bcr);}catch(e){} // Efectos reflector (réplica de NEXUS PRO): barra superior, brillo fijo, luz de vidrio
  try{var bcb=document.createElement('script');bcb.async=false;bcb.src='bc-busqueda.js?v=20261009b3';document.head.appendChild(bcb);}catch(e){} // Buscador «Premium» (réplica de NEXUS PRO): lupa que se estira a píldora en todos los buscadores

  try{var nav=document.createElement('script');nav.async=false;nav.src='taller-nav-apple.js?v=20261003-n1';document.head.appendChild(nav);}catch(e){} // Barra de navegación de ventanas estilo Apple (capa reversible)
  try{var bcm=document.createElement('script');bcm.async=false;bcm.src='taller-sidebar-mini.js?v=20261009m1';document.head.appendChild(bcm);}catch(e){} // Menú lateral compacto: solo íconos en la computadora, se abre al pasar el ratón
  try{var bca=document.createElement('script');bca.async=false;bca.src='taller-animaciones.js?v=20261014a';document.head.appendChild(bca);}catch(e){} // Animaciones de beUI: números de los KPI, botón Guardar → Listo ✓ y deslizar chats en el celular
  try{var bmr=document.createElement('script');bmr.async=false;bmr.src='taller-mejoras-ref.js?v=20261014m1';document.head.appendChild(bmr);}catch(e){} // Mantener presionado para borrar, embudo de Leads y logos de marcas (lista de referencias)
  try{var brs=document.createElement('script');brs.async=false;brs.src='taller-reacond-smart.js?v=20261024r1';document.head.appendChild(brs);}catch(e){}
  try{var bff=document.createElement('script');bff.async=false;bff.src='crm-flow-financiamiento.js?v=20261024-f9';document.head.appendChild(bff);}catch(e){} // Formulario nativo de WhatsApp para la solicitud de financiamiento (equipo y precio fijados por el empleado) // Reacondicionados smart: tablero de atascados, repartir evaluados, revisar terminados y despachar listos en bloque
  try{var brz=document.createElement('script');brz.async=false;brz.src='taller-rapidez.js?v=20261014q1';document.head.appendChild(brz);}catch(e){} // Que se sienta instantáneo: línea de carga, fondo desenfocado, Ctrl+K, deshacer archivar y aviso de conexión
  try{var bfl=document.createElement('script');bfl.async=false;bfl.src='taller-flota.js?v=20261024c3';document.head.appendChild(bfl);}catch(e){} // Tarjetas estilo FleetTrack en Reacondicionados y Órdenes: foto, técnico, barra de avance y filtros del color de la etiqueta

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
      copy.innerHTML='<strong class="bc-loader-title">Cargando sistema…</strong><span class="bc-loader-status">Preparando su espacio de trabajo</span>';
      loader.appendChild(copy);
      loader.setAttribute('aria-label','Cargando sistema BAYOL CELL');
    }catch(e){}
  }
  instalarLoaderPremium();

  // 23-oct-2026 (carga): estas 3 hojas ya vienen en el <head> de taller.html (ids bcSurfaceCss/bcMidnightCss/bcAfinadoCss).
  // Si faltaran (HTML viejo en caché), se crean como antes.
  function capaCss(id,href){var l=document.getElementById(id);if(l)return l;try{l=document.createElement('link');l.id=id;l.rel='stylesheet';l.href=href;document.head.appendChild(l);return l;}catch(e){return null;}}
  surfaceCss=capaCss('bcSurfaceCss','taller-surface-cleanup.css?v='+SURFACE);
  midnightCss=capaCss('bcMidnightCss','taller-midnight-motion.css?v='+MIDNIGHT);
  afinadoCss=capaCss('bcAfinadoCss','taller-afinado.css?v='+AFINADO);
  // Hojas que se agregan después (CRM): se colocan ANTES de las 3 capas para que estas sigan ganando la cascada,
  // sin tener que recolocarlas (recolocarlas las volvía a pedir y repintaba la pantalla).
  function colocarCss(link){try{if(surfaceCss&&surfaceCss.parentNode===document.head)document.head.insertBefore(link,surfaceCss);else document.head.appendChild(link);}catch(e){document.head.appendChild(link);}}
  function reafirmarCapasVisuales(){
    // Solo recoloca si alguna hoja quedó después de las 3 capas (hoy el CSS del CRM se inserta antes, así que casi nunca).
    try{
      var links=Array.prototype.slice.call(document.head.querySelectorAll('link[rel="stylesheet"]')),n=links.length;
      var ok=n>=3&&links[n-3]===surfaceCss&&links[n-2]===midnightCss&&links[n-1]===afinadoCss;
      if(ok)return;
      if(surfaceCss&&surfaceCss.parentNode)document.head.appendChild(surfaceCss);
      if(midnightCss&&midnightCss.parentNode)document.head.appendChild(midnightCss);
      if(afinadoCss&&afinadoCss.parentNode)document.head.appendChild(afinadoCss);
    }catch(e){}
  }

  function cargarExtensionesCrmSocial(){
    if(window.__bcCrmSocialExtensionsRequested)return;
    window.__bcCrmSocialExtensionsRequested=true;

    var scopeCss=document.createElement('link');
    scopeCss.rel='stylesheet';
    scopeCss.href='crm-social-scope-fix.css?v='+V;
    colocarCss(scopeCss);

    var facebookCss=document.createElement('link');
    facebookCss.rel='stylesheet';
    facebookCss.href='crm-facebook-chat.css?v='+V;
    colocarCss(facebookCss);

    var polishCss=document.createElement('link');
    polishCss.rel='stylesheet';
    polishCss.href='crm-social-polish-v2.css?v='+V;
    polishCss.onload=function(){reafirmarCapasVisuales();};
    colocarCss(polishCss);

    var glassCss=document.createElement('link');
    glassCss.rel='stylesheet';
    glassCss.href='crm-liquid-glass-transparent.css?v='+GLASS;
    colocarCss(glassCss);

    var effectsCss=document.createElement('link');
    effectsCss.rel='stylesheet';
    effectsCss.href='crm-social-effects.css?v='+V;
    effectsCss.onload=function(){reafirmarCapasVisuales();};
    colocarCss(effectsCss);
    setTimeout(reafirmarCapasVisuales,300);

    var hub=document.createElement('script');
    hub.src='crm-social-hub.js?v='+SOCIAL_HUB;
    hub.onload=function(){
      var scope=document.createElement('script');
      scope.src='crm-social-scope-fix.js?v='+V;
      scope.onload=function(){
        var direct=document.createElement('script');
        direct.src='crm-facebook-realtime-direct.js?v='+FB_DIRECT;
        direct.onerror=function(){console.warn('[CRM] control directo de Facebook no cargó');};
        document.head.appendChild(direct);

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

    // Fase 2 CRM: mismo diseño en WhatsApp/Instagram/Facebook + separadores de fecha.
    var unificado=document.createElement('script');
    unificado.src='crm-chat-unificado.js?v=20260929-f3';
    unificado.onerror=function(){console.warn('[CRM] No se pudo cargar el diseño unificado del chat.');};
    document.head.appendChild(unificado);

    // WhatsApp idéntico a WhatsApp Web / app (solo la pestaña WhatsApp). Va después del diseño unificado.
    var waIdentico=document.createElement('script');
    waIdentico.src='crm-wa-identico.js?v=20261022-w18';
    document.head.appendChild(waIdentico);

    // Automatizaciones estilo ManyChat (Fase 1: comentario → privado en Instagram/Facebook). Solo admin.
    var automat=document.createElement('script');
    automat.src='crm-automatizaciones.js?v=20261004-a3';
    automat.onerror=function(){console.warn('[CRM] No se pudo cargar Automatizaciones.');};
    document.head.appendChild(automat);

    var financing=document.createElement('script');
    financing.src='crm-financiamiento-quick-reply.js?v=20261022-r1';
    financing.onerror=function(){console.warn('[CRM] No se pudo cargar el atajo de financiamiento.');};
    document.head.appendChild(financing);
  }

  function armarCargaDiferidaCrm(){
    var root=document.getElementById('v-crmLinea');
    if(!root){ setTimeout(armarCargaDiferidaCrm,250); return; }
    if(root.classList.contains('active')){ cargarExtensionesCrmSocial(); return; }

    var mo=new MutationObserver(function(){
      if(root.classList.contains('active')){
        try{mo.disconnect();}catch(e){}
        cargarExtensionesCrmSocial();
      }
    });
    mo.observe(root,{attributes:true,attributeFilter:['class']});
    window.__bcCrmLazyActivationObserver=mo;
  }

  var legacy=document.createElement('script');
  legacy.src='crm-marketing-consent-legacy.js?v='+V;
  legacy.onload=armarCargaDiferidaCrm;
  document.head.appendChild(legacy);

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
