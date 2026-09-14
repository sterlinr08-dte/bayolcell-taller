/* BAYOL CELL — navigation pill motion (safe, scoped, no global DOM observer) */
(function(){
  'use strict';
  if(window.__bcNavigationMotion)return;
  window.__bcNavigationMotion=true;

  var records=[];
  var raf=0;

  function activeFor(host,itemSelector,activeSelector){
    try{return host.querySelector(activeSelector)||host.querySelector(itemSelector);}catch(_){return null;}
  }

  function place(rec, immediate){
    try{
      var host=rec.host;
      if(!host || !host.isConnected)return;
      var active=activeFor(host,rec.itemSelector,rec.activeSelector);
      if(!active || !active.isConnected){rec.pill.style.opacity='0';return;}
      var hr=host.getBoundingClientRect();
      var ar=active.getBoundingClientRect();
      if(!ar.width || !ar.height){rec.pill.style.opacity='0';return;}
      var x=ar.left-hr.left+host.scrollLeft;
      var y=ar.top-hr.top+host.scrollTop;
      if(immediate)rec.pill.style.transition='none';
      rec.pill.style.width=Math.round(ar.width)+'px';
      rec.pill.style.height=Math.round(ar.height)+'px';
      rec.pill.style.transform='translate3d('+Math.round(x)+'px,'+Math.round(y)+'px,0)';
      rec.pill.style.opacity='1';
      if(immediate){requestAnimationFrame(function(){try{rec.pill.style.transition='';}catch(_){}});}
    }catch(_){}
  }

  function schedule(rec){
    try{
      if(rec._raf)cancelAnimationFrame(rec._raf);
      rec._raf=requestAnimationFrame(function(){rec._raf=0;place(rec,false);});
    }catch(_){}
  }

  function attach(host,itemSelector,activeSelector,extraClass){
    try{
      if(!host || host.__bcMotionAttached)return;
      var items=Array.prototype.slice.call(host.querySelectorAll(itemSelector));
      if(!items.length)return;
      host.__bcMotionAttached=true;
      host.classList.add('bc-motion-host');
      if(extraClass)host.classList.add(extraClass);
      items.forEach(function(el){el.classList.add('bc-motion-item');});
      var pill=document.createElement('span');
      pill.className='bc-motion-pill';
      pill.setAttribute('aria-hidden','true');
      host.insertBefore(pill,host.firstChild||null);
      var rec={host:host,pill:pill,itemSelector:itemSelector,activeSelector:activeSelector,_raf:0};
      records.push(rec);

      host.addEventListener('click',function(){setTimeout(function(){schedule(rec);},0);},{passive:true});
      host.addEventListener('scroll',function(){schedule(rec);},{passive:true});

      if(window.MutationObserver){
        var mo=new MutationObserver(function(muts){
          for(var i=0;i<muts.length;i++){
            var t=muts[i].target;
            if(t && t.matches && t.matches(itemSelector)){schedule(rec);break;}
          }
        });
        mo.observe(host,{subtree:true,attributes:true,attributeFilter:['class','aria-selected','aria-pressed']});
        rec.mo=mo;
      }
      if(window.ResizeObserver){
        var ro=new ResizeObserver(function(){schedule(rec);});
        ro.observe(host);rec.ro=ro;
      }
      place(rec,true);
    }catch(_){}
  }

  function findAndAttach(){
    try{
      attach(document.querySelector('#app .nav'),'button','button.active','bc-sidebar-motion');
      attach(document.querySelector('#v-crmLinea .crm-tabs-track'),'.crm-tab-seg','.crm-tab-seg[aria-selected="true"],.crm-tab-seg.active','bc-crm-tabs-motion');
      attach(document.querySelector('#bcSmartPlatforms'),'.bc-smart-platform','.bc-smart-platform.on','bc-social-platform-motion');
      attach(document.querySelector('#bcSmartInteractionNav'),'.bc-smart-interaction','.bc-smart-interaction.on','bc-social-interaction-motion');
      attach(document.querySelector('#v-crmLinea .bc-smart-platforms'),'.bc-smart-platform','.bc-smart-platform.on','bc-social-platform-motion');
      attach(document.querySelector('#v-crmLinea .bc-smart-interaction-track'),'.bc-smart-interaction','.bc-smart-interaction.on','bc-social-interaction-motion');
      var tabs=document.querySelectorAll('#app .reacond-tabs-scroll');
      for(var i=0;i<tabs.length;i++)attach(tabs[i],'.tab-btn','.tab-btn.active','bc-reacond-tabs-motion');
      var mainTabs=document.querySelectorAll('#app .reacond-main-tabs,#app [data-reacond-main-tabs]');
      for(var j=0;j<mainTabs.length;j++)attach(mainTabs[j],'.reacond-main-tab','.reacond-main-tab.tab-active','bc-reacond-main-motion');
    }catch(_){}
  }

  function refreshAll(){
    findAndAttach();
    for(var i=0;i<records.length;i++)schedule(records[i]);
  }

  function boot(){
    try{
      findAndAttach();
      [400,1200,2600,5000].forEach(function(ms){setTimeout(findAndAttach,ms);});
      window.addEventListener('resize',function(){
        if(raf)cancelAnimationFrame(raf);
        raf=requestAnimationFrame(function(){raf=0;refreshAll();});
      },{passive:true});
      document.addEventListener('visibilitychange',function(){if(!document.hidden)refreshAll();},{passive:true});
      window.BayolNavigationMotion={refresh:refreshAll,version:'20260914a'};
    }catch(_){}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
