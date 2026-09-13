/* BAYOL CELL CRM extensions loader */
(function(){
  'use strict';
  if(window.__bcCrmExtensionsLoader)return;
  window.__bcCrmExtensionsLoader=true;

  var V='20260913-facebook-ui';
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
})();
