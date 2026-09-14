/* BAYOL CELL — UI interaction effects: Gooey Nav, Emoji Reaction, Magnetic Button */
(() => {
  'use strict';
  if (window.__bcInteractionFx) return;
  window.__bcInteractionFx = true;

  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const finePointer = () => matchMedia('(pointer:fine)').matches;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (n,min,max) => Math.max(min,Math.min(max,n));

  function setupGooey(container, itemSelector){
    if (!container || container.dataset.bcGooey === '1') return;
    container.dataset.bcGooey='1';
    container.classList.add('bc-gooey-nav');
    const blob=document.createElement('span');
    blob.className='bc-gooey-blob';
    blob.setAttribute('aria-hidden','true');
    container.prepend(blob);

    const move=()=>{
      const items=$$(itemSelector,container);
      const active=items.find(el=>el.classList.contains('on') || el.getAttribute('aria-selected')==='true') || items[0];
      if(!active){blob.classList.remove('show');return;}
      const x=active.offsetLeft;
      const y=active.offsetTop;
      blob.style.width=active.offsetWidth+'px';
      blob.style.height=active.offsetHeight+'px';
      blob.style.transform=`translate3d(${x}px,${y}px,0)`;
      blob.dataset.channel=active.dataset.smartChannel || '';
      blob.classList.add('show');
    };

    const mo=new MutationObserver(move);
    mo.observe(container,{subtree:true,childList:true,attributes:true,attributeFilter:['class','aria-selected']});
    container.addEventListener('click',()=>requestAnimationFrame(move));
    container.addEventListener('scroll',move,{passive:true});
    window.addEventListener('resize',move,{passive:true});
    requestAnimationFrame(move);
  }

  function setupGooeyAll(){
    setupGooey($('#bcSmartPlatforms'), '.bc-smart-platform');
    setupGooey($('#bcSmartInteractionNav'), '.bc-smart-interaction');
    setupGooey($('#v-crmLinea .crm-tabs-track'), '.crm-tab-seg');
  }

  let longPressTimer=null;
  let longPressTarget=null;
  function clearLongPress(){clearTimeout(longPressTimer);longPressTimer=null;longPressTarget=null;}
  function openFacebookReaction(bubble, x, y){
    const row=bubble?.closest('.bc-fb-row');
    const menu=row?.querySelector('.bc-fb-message-menu');
    if(!menu) return;
    menu.click();
    requestAnimationFrame(()=>{
      const box=$('#bcFbMessageActions');
      if(!box || box.hidden) return;
      box.classList.add('bc-reaction-mode');
      const rect=bubble.getBoundingClientRect();
      const cx=Number.isFinite(x)?x:(rect.left+rect.width/2);
      const top=Number.isFinite(y)?y:rect.top;
      box.style.left=clamp(cx-132,10,window.innerWidth-274)+'px';
      box.style.top=clamp(top-58,10,window.innerHeight-78)+'px';
    });
  }

  function bindReactionGestures(){
    if(document.documentElement.dataset.bcReactionBound==='1') return;
    document.documentElement.dataset.bcReactionBound='1';

    document.addEventListener('pointerdown',e=>{
      const bubble=e.target.closest('.bc-fb-bubble');
      if(!bubble || e.button!==0) return;
      if(finePointer()) return;
      longPressTarget=bubble;
      const x=e.clientX,y=e.clientY;
      longPressTimer=setTimeout(()=>{
        if(longPressTarget===bubble){
          try{navigator.vibrate?.(18);}catch{}
          openFacebookReaction(bubble,x,y);
        }
        clearLongPress();
      },420);
    },true);
    ['pointerup','pointercancel','pointermove'].forEach(type=>document.addEventListener(type,clearLongPress,true));

    document.addEventListener('dblclick',e=>{
      const bubble=e.target.closest('.bc-fb-bubble');
      if(bubble) openFacebookReaction(bubble,e.clientX,e.clientY);
    },true);
    document.addEventListener('contextmenu',e=>{
      const bubble=e.target.closest('.bc-fb-bubble');
      if(!bubble) return;
      e.preventDefault();
      openFacebookReaction(bubble,e.clientX,e.clientY);
    },true);
    document.addEventListener('click',e=>{
      const box=$('#bcFbMessageActions.bc-reaction-mode');
      if(!box) return;
      if(e.target.closest('#bcFbMessageActions button')) setTimeout(()=>box.classList.remove('bc-reaction-mode'),0);
      else if(!e.target.closest('.bc-fb-bubble')) box.classList.remove('bc-reaction-mode');
    },true);
  }

  function magnetize(btn){
    if(!btn || btn.dataset.bcMagnetic==='1') return;
    btn.dataset.bcMagnetic='1';
    btn.classList.add('bc-magnetic');
    const reset=()=>{btn.style.setProperty('--bc-mag-x','0px');btn.style.setProperty('--bc-mag-y','0px');};
    btn.addEventListener('pointermove',e=>{
      if(!finePointer() || reduced()) return;
      const r=btn.getBoundingClientRect();
      const dx=(e.clientX-(r.left+r.width/2))/(r.width/2 || 1);
      const dy=(e.clientY-(r.top+r.height/2))/(r.height/2 || 1);
      btn.style.setProperty('--bc-mag-x',(clamp(dx,-1,1)*7).toFixed(2)+'px');
      btn.style.setProperty('--bc-mag-y',(clamp(dy,-1,1)*5).toFixed(2)+'px');
    });
    btn.addEventListener('pointerleave',reset);
    btn.addEventListener('blur',reset);
    btn.addEventListener('pointerdown',()=>{
      btn.classList.remove('bc-magnetic-hit');
      void btn.offsetWidth;
      btn.classList.add('bc-magnetic-hit');
      setTimeout(()=>btn.classList.remove('bc-magnetic-hit'),360);
    });
  }

  function setupMagnetic(){
    $$('#bcIgSend,#bcFbSend,[data-bayol-magnetic]').forEach(magnetize);
  }

  function refresh(){setupGooeyAll();setupMagnetic();}

  let timer=null;
  const mo=new MutationObserver(()=>{
    clearTimeout(timer);
    timer=setTimeout(refresh,35);
  });
  mo.observe(document.documentElement,{childList:true,subtree:true});
  bindReactionGestures();
  refresh();

  window.BayolInteractionFX={refresh,version:'20260913a'};
})();
