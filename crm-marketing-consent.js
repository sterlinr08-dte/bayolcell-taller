/* BAYOL CELL CRM extensions loader */
(function(){
  'use strict';
  if(window.__bcCrmExtensionsLoader)return;
  window.__bcCrmExtensionsLoader=true;

  var legacy=document.createElement('script');
  legacy.src='crm-marketing-consent-legacy.js?v=20260912d';
  legacy.onload=function(){
    var scopeCss=document.createElement('link');
    scopeCss.rel='stylesheet';
    scopeCss.href='crm-social-scope-fix.css?v=20260912d';
    document.head.appendChild(scopeCss);

    var hub=document.createElement('script');
    hub.src='crm-social-hub.js?v=20260912d';
    hub.onload=function(){
      var scope=document.createElement('script');
      scope.src='crm-social-scope-fix.js?v=20260912d';
      document.head.appendChild(scope);
    };
    document.head.appendChild(hub);
  };
  document.head.appendChild(legacy);
})();
