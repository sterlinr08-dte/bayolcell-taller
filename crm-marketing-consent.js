/* BAYOL CELL CRM extensions loader */
(function(){
  'use strict';
  if(window.__bcCrmExtensionsLoader)return;
  window.__bcCrmExtensionsLoader=true;
  var legacy=document.createElement('script');
  legacy.src='crm-marketing-consent-legacy.js?v=20260912a';
  legacy.onload=function(){
    var hub=document.createElement('script');
    hub.src='crm-social-hub.js?v=20260912a';
    document.head.appendChild(hub);
  };
  document.head.appendChild(legacy);
})();
