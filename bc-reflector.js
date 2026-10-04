/* BAYOL CELL · EFECTOS REFLECTOR (4 oct 2026) — réplica de los de NEXUS PRO (parches-glass-pointer.js,
   parches-brillo-fijo.js y parches-vidrio-global.js, video «Glassy Navbar UI»), adaptada al taller y a la web.
   Solo visual: agrega elementos decorativos (aria-hidden, sin eventos) y nunca cambia clics, datos ni navegación.
   · Taller (taller.html): barra = .top-bar, acento naranja; menú lateral con rayita vertical en la cápsula.
   · Web (index.html): barra = <header>, acento rojo.
   Con «reducir movimiento» no hace nada. Dibujo en bc-reflector.css. */
(function(){
  'use strict';
  if(window.__bcReflector)return;
  window.__bcReflector=true;
  var mq=function(q){return !!(window.matchMedia&&window.matchMedia(q).matches);};
  if(mq('(prefers-reduced-motion: reduce)'))return;
  var FINO=mq('(hover: hover) and (pointer: fine)');
  var TALLER=!!document.getElementById('sidebar')||/taller\.html/.test(location.pathname);
  var BAR_SEL=TALLER?'.top-bar':'body > header';
  document.documentElement.classList.add(TALLER?'bcr-taller':'bcr-web');

  // CSS
  (function(){
    if(document.getElementById('bcReflectorCss'))return;
    var l=document.createElement('link');l.id='bcReflectorCss';l.rel='stylesheet';
    var s=document.currentScript&&document.currentScript.src||'';
    var v=(/[?&]v=([^&]+)/.exec(s)||[])[1]||'1';
    l.href='bc-reflector.css?v='+v;document.head.appendChild(l);
  })();

  // ¿El fondo detrás de este elemento es oscuro? (para elegir luz blanca o luz del acento)
  var RE_RGB=/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/;
  function oscuro(el){
    var n=el,k=0;
    while(n&&n.nodeType===1&&k<25){
      var cs=getComputedStyle(n),m=RE_RGB.exec(cs.backgroundColor||'');
      if(m&&(m[4]===undefined||+m[4]>=0.45))return (0.2126*m[1]+0.7152*m[2]+0.0722*m[3])/255<0.5;
      if(/gradient/.test(cs.backgroundImage||'')){m=RE_RGB.exec(cs.backgroundImage);if(m&&(m[4]===undefined||+m[4]>=0.45))return (0.2126*m[1]+0.7152*m[2]+0.0722*m[3])/255<0.5;}
      n=n.parentElement;k++;
    }
    return !TALLER; // web: fondo negro; taller: contenido claro
  }

  /* ════ 1 · BARRA SUPERIOR: reflejo que sigue al puntero + luz que se desliza y se queda fija ════ */
  (function(){
    var BOTON='button,[role="button"],a';
    var bar=null,glide=null,item=null,fijo=null,raf=0,lastX=0,visible=false;
    function preparar(b){
      if(b.__bcrBar)return;b.__bcrBar=true;
      b.classList.add('bcr-bar');
      if(getComputedStyle(b).position==='static')b.style.position='relative';
      glide=document.createElement('span');glide.className='bc-glide';glide.setAttribute('aria-hidden','true');
      b.insertBefore(glide,b.firstChild);
    }
    function tomar(b){
      if(b===bar)return;
      if(bar)bar.classList.remove('bcr-activa','bcr-fijo');
      bar=b;if(bar){preparar(bar);glide=bar.querySelector(':scope > .bc-glide');}
      visible=false;
    }
    function botonDe(t){
      if(!t||!t.closest||!bar)return null;
      var x=t.closest(BOTON);
      if(!x||!bar.contains(x)||x===bar)return null;
      if(x.closest('.menu-movil,#menuMovil'))return null; // menú desplegable del celular (web): no es la barra
      var r=x.getBoundingClientRect();
      return (r.width>=16&&r.height>=16&&r.height<=64)?x:null;
    }
    function fijoVivo(){
      if(!fijo)return null;
      if(!bar||!bar.contains(fijo)){fijo=null;return null;}
      var r=fijo.getBoundingClientRect();
      return (r.width<16||r.height<16)?null:fijo;
    }
    function paint(){
      raf=0;if(!bar)return;
      var br=bar.getBoundingClientRect();if(br.width<1)return;
      var x=lastX,en=item||fijoVivo();
      bar.classList.toggle('bcr-fijo',!!fijoVivo());
      if(en&&glide){
        var r=en.getBoundingClientRect(),rad=parseFloat(getComputedStyle(en).borderTopLeftRadius)||10;
        if(!visible)glide.classList.add('sin');
        glide.style.setProperty('--g-x',(r.left-br.left).toFixed(1)+'px');
        glide.style.setProperty('--g-w',r.width.toFixed(1)+'px');
        glide.style.setProperty('--g-y',(r.top-br.top).toFixed(1)+'px');
        glide.style.setProperty('--g-h',r.height.toFixed(1)+'px');
        glide.style.setProperty('--g-r',Math.min(rad,r.height/2).toFixed(1)+'px');
        if(!visible){void glide.offsetWidth;glide.classList.remove('sin');}
        glide.classList.add('on');visible=true;glide.classList.toggle('fijo',en===fijo);
        x=r.left+r.width/2;
      }else{
        if(glide)glide.classList.remove('on','fijo');
        visible=false;if(!item)x=br.left+br.width/2;
      }
      bar.style.setProperty('--bcr-x',Math.max(0,Math.min(100,(x-br.left)/br.width*100)).toFixed(1)+'%');
    }
    function pedir(){if(!raf)raf=requestAnimationFrame(paint);}
    function iniciar(){
      var b=document.querySelector(BAR_SEL);if(!b)return false;
      tomar(b);pedir();return true;
    }
    if(FINO){
      document.addEventListener('pointermove',function(ev){
        if(ev.pointerType&&ev.pointerType!=='mouse')return;
        var t=ev.target&&ev.target.closest?ev.target.closest(BAR_SEL):null;
        if(t&&!(ev.target.closest('.menu-movil,#menuMovil'))){tomar(t);bar.classList.add('bcr-activa');item=botonDe(ev.target);lastX=ev.clientX;pedir();}
        else if(bar&&(item||bar.classList.contains('bcr-activa'))){bar.classList.remove('bcr-activa');item=null;pedir();}
      },{passive:true});
      var salir=function(){if(bar){bar.classList.remove('bcr-activa');item=null;pedir();}};
      document.addEventListener('pointerleave',salir,{passive:true});
      window.addEventListener('blur',salir,{passive:true});
    }
    document.addEventListener('click',function(ev){
      var t=ev.target&&ev.target.closest?ev.target.closest(BAR_SEL):null;if(!t)return;
      tomar(t);var b=botonDe(ev.target);if(!b)return;
      fijo=b;if(!FINO)item=null;pedir();
    },true);
    window.addEventListener('resize',pedir,{passive:true});
    var intentos=0,tIni=setInterval(function(){if(iniciar()||++intentos>20)clearInterval(tIni);},500);
    iniciar();
  })();

  /* ════ 2 · BRILLO FIJO en lo elegido (pestañas, filtros, chips, opciones) ════ */
  (function(){
    var SEL='.on,.active,.activo,.selected,.is-active,.tab-active,[aria-selected="true"],[aria-pressed="true"],[aria-current="page"]';
    var CONTROL='button,a,[role="button"],[role="tab"],[role="option"],[onclick],.chip,.tab,.btn,[class*="tab"],[class*="chip"],[class*="pill"],[class*="seg"],[class*="filtro"]';
    // Nunca: campos, interruptores, ventanas/paneles, capas de efectos, tablas, el menú lateral (lo lleva la cápsula),
    // las filas y burbujas del chat, la barra superior (tiene su propia luz) ni lo que se imprime.
    var NO='input,textarea,select,[contenteditable="true"],[role="switch"],[class*="switch"],[class*="toggle"],.bc-vidrio,.bc-glide,.bcr-bar,'+
      'iframe,video,canvas,tr,td,th,dialog,[role="dialog"],[class*="backdrop"],[class*="sheet"],[class*="drawer"],[class*="toast"],'+
      '#sidebar,.wa-list-scroll,.wa-bubble-wrap,.wa-row,.wa-brow,.no-reflector';
    var marcados=[],raf=0;
    var vueltas=typeof WeakMap!=='undefined'?new WeakMap():null;
    function apto(el){
      if(!el||!el.matches||el.closest(NO))return false;
      if(!el.matches(CONTROL))return false;
      var r=el.getBoundingClientRect();
      return !(r.width<24||r.height<18||r.height>76||r.width>560);
    }
    function marcar(el){
      var m=el.querySelector(':scope > bcr-luz.bc-marca');
      if(!m){
        if(vueltas){var n=(vueltas.get(el)||0)+1;vueltas.set(el,n);if(n>40)return null;}
        m=document.createElement('bcr-luz');m.className='bc-marca';m.setAttribute('aria-hidden','true');
        if(getComputedStyle(el).position==='static'){el.style.position='relative';el.setAttribute('data-bcr-pos','1');}
        m.classList.toggle('claro',!oscuro(el)); // el fondo se mide una sola vez (rendimiento)
        el.appendChild(m);
      }
      return el;
    }
    function desmarcar(el){
      var m=el.querySelector(':scope > bcr-luz.bc-marca');if(m)m.remove();
      if(el.getAttribute('data-bcr-pos')){el.style.position='';el.removeAttribute('data-bcr-pos');}
    }
    function revisar(){
      raf=0;
      var nuevos=[],lista=document.querySelectorAll(SEL),x;
      for(var i=0;i<lista.length&&nuevos.length<60;i++){if(apto(lista[i])&&(x=marcar(lista[i])))nuevos.push(x);}
      for(var j=0;j<marcados.length;j++){if(nuevos.indexOf(marcados[j])<0)desmarcar(marcados[j]);}
      marcados=nuevos;
    }
    function pedir(){if(!raf)raf=requestAnimationFrame(revisar);}
    function propio(n){return n&&n.nodeType===1&&(n.tagName==='BCR-LUZ'||n.classList.contains('bc-vidrio')||n.classList.contains('bc-glide'));}
    function iniciar(){
      pedir();
      new MutationObserver(function(rs){
        for(var i=0;i<rs.length;i++){
          var r=rs[i];
          if(r.type==='attributes'){if(!propio(r.target))return pedir();continue;}
          var k,n;
          for(k=0;k<r.addedNodes.length;k++){n=r.addedNodes[k];if(n.nodeType===1&&!propio(n))return pedir();}
          for(k=0;k<r.removedNodes.length;k++){n=r.removedNodes[k];if(n.nodeType===1&&!propio(n))return pedir();}
        }
      }).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','aria-selected','aria-pressed','aria-current']});
      window.addEventListener('resize',pedir,{passive:true});
      setInterval(function(){if(!document.hidden)pedir();},2000);
      document.addEventListener('transitionend',function(e){if(!propio(e.target))pedir();},true);
    }
    if(document.body)iniciar();else document.addEventListener('DOMContentLoaded',iniciar);
  })();

  /* ════ 3 · LUZ DE VIDRIO en todo lo que se señala o se toca ════ */
  (function(){
    if(!FINO&&navigator.deviceMemory&&navigator.deviceMemory<=2)return; // celulares muy limitados: nada
    var TOCABLE='button,a[href],[role="button"],[role="tab"],[role="menuitem"],[role="option"],summary,select,label[for],.btn,.chip,[onclick],[tabindex="0"]';
    var NO=(FINO?BAR_SEL+',':'')+'input,textarea,[contenteditable="true"],iframe,video,canvas,.wa-bubble-wrap,.wa-brow,.no-reflector';
    var GRUPO='nav,[role="tablist"],[role="menu"],[role="listbox"],[role="toolbar"],ul,ol,.nav,thead,tbody,form';
    var FILA='[class*="Card"],[class*="card"],[class*="row"],[class*="Row"],[class*="item"],[class*="fila"]';
    var capa=null,actual=null,raf=0,visible=false,prev=null,mx=0,my=0,tScroll=0,escribiendo=false,tSalir=0,apagadoEn=0;
    function crear(){
      if(capa&&document.body.contains(capa))return capa;
      capa=document.createElement('div');capa.className='bc-vidrio';capa.setAttribute('aria-hidden','true');
      document.body.appendChild(capa);return capa;
    }
    function objetivo(t){
      if(!t||!t.closest||t.closest(NO))return null;
      var el=t.closest(TOCABLE);
      if(!el||el===document.body||el===document.documentElement)return null;
      if(el.disabled||el.getAttribute('aria-disabled')==='true')return null;
      var card=el.parentElement&&el.parentElement.closest(FILA);
      if(card&&card!==el&&card.contains(el)&&!card.closest(NO)&&(el.parentElement===card||el.parentElement.parentElement===card)){
        var rc=card.getBoundingClientRect(),re=el.getBoundingClientRect(),hermanos=0,ch=el.parentElement.children;
        for(var i=0;i<ch.length;i++){if(ch[i]!==el&&ch[i].matches&&ch[i].matches(TOCABLE))hermanos++;}
        if(rc.height>=40&&rc.height<=260&&rc.width<=window.innerWidth&&(re.width*re.height>=0.35*rc.width*rc.height||hermanos===0))el=card;
      }
      var r=el.getBoundingClientRect();
      if(r.width<14||r.height<14||r.height>260||r.width>window.innerWidth)return null;
      if(r.height>120&&!/card|row|item|fila/i.test(el.className||'')&&el.tagName!=='TR')return null;
      return el;
    }
    function objetivoTactil(t){
      var el=objetivo(t);if(el)return el;
      if(!t||!t.closest||t.closest(NO))return null;
      var f=t.closest(FILA);if(!f||f===document.body)return null;
      var r=f.getBoundingClientRect();
      if(r.height<40||r.height>260||r.width>window.innerWidth)return null;
      return f.querySelector('[role="button"],[onclick],a[href]')?f:null;
    }
    function grupoDe(el){var g=el.parentElement&&el.parentElement.closest(GRUPO);return g||el.parentElement;}
    function vecinos(a,b){
      if(!a||!b||!document.documentElement.contains(a))return false;
      var ra=a.getBoundingClientRect(),rb=b.getBoundingClientRect();
      var d=Math.hypot((ra.left+ra.width/2)-(rb.left+rb.width/2),(ra.top+ra.height/2)-(rb.top+rb.height/2));
      return d<Math.max(320,(ra.height+rb.height)*1.3)&&(a.parentElement===b.parentElement||grupoDe(a)===grupoDe(b));
    }
    function recorte(el,r){
      var top=0,left=0,right=window.innerWidth,bottom=window.innerHeight,p=el.parentElement,n=0;
      while(p&&p!==document.body&&n<12){
        var cs=getComputedStyle(p);
        if(/(auto|scroll|hidden|clip)/.test(cs.overflowY+cs.overflowX)){
          var q=p.getBoundingClientRect();
          top=Math.max(top,q.top);left=Math.max(left,q.left);right=Math.min(right,q.right);bottom=Math.min(bottom,q.bottom);
        }
        p=p.parentElement;n++;
      }
      return 'inset('+Math.max(0,top-r.top).toFixed(1)+'px '+Math.max(0,r.right-right).toFixed(1)+'px '+Math.max(0,r.bottom-bottom).toFixed(1)+'px '+Math.max(0,left-r.left).toFixed(1)+'px)';
    }
    function tinte(cs){
      var m=RE_RGB.exec(cs.backgroundColor||'');
      if(!m||(m[4]!==undefined&&+m[4]<0.35))m=RE_RGB.exec(cs.backgroundImage||'')||m;
      if(!m)return '';
      var r=+m[1],g=+m[2],b=+m[3],a=m[4]===undefined?1:+m[4];
      if(a<0.35)return '';
      if(Math.max(r,g,b)-Math.min(r,g,b)<60)return ''; // grises: sin tinte
      return Math.min(255,r+40)+','+Math.min(255,g+40)+','+Math.min(255,b+40);
    }
    function esActivo(el){
      return el.classList.contains('on')||el.classList.contains('active')||el.classList.contains('activo')||
        el.getAttribute('aria-current')==='page'||el.getAttribute('aria-selected')==='true'||el.getAttribute('aria-pressed')==='true';
    }
    function iman(r){
      if(!capa||!r)return;
      var cx=r.left+r.width/2,cy=r.top+r.height/2;
      var dx=Math.max(-1,Math.min(1,(mx-cx)/(r.width/2||1))),dy=Math.max(-1,Math.min(1,(my-cy)/(r.height/2||1)));
      capa.style.setProperty('--v-dx',(dx*Math.min(3,r.width*0.04)).toFixed(2)+'px');
      capa.style.setProperty('--v-dy',(dy*Math.min(2,r.height*0.04)).toFixed(2)+'px');
      capa.style.setProperty('--v-mx',(Math.max(0,Math.min(100,(mx-r.left)/r.width*100))).toFixed(1)+'%');
    }
    function colocar(el,deslizar){
      var c=crear(),r=el.getBoundingClientRect(),cs=getComputedStyle(el);
      var rad=parseFloat(cs.borderTopLeftRadius)||0;
      if(rad<6)rad=Math.min(10,r.height/2);
      if(rad>r.height/2)rad=r.height/2;
      if(!deslizar)c.classList.add('sin');
      c.style.setProperty('--v-x',r.left.toFixed(1)+'px');
      c.style.setProperty('--v-y',r.top.toFixed(1)+'px');
      c.style.setProperty('--v-w',r.width.toFixed(1)+'px');
      c.style.setProperty('--v-h',r.height.toFixed(1)+'px');
      c.style.setProperty('--v-r',rad.toFixed(1)+'px');
      c.style.clipPath=recorte(el,r);
      var t=tinte(cs);
      if(t){c.style.setProperty('--v-tinte',t);c.classList.add('tinte');}else c.classList.remove('tinte');
      c.classList.toggle('oscuro',!t&&oscuro(el));
      c.classList.toggle('alto',r.height>56);
      c.classList.toggle('actual',esActivo(el));
      iman(r);
      if(!deslizar){void c.offsetWidth;c.classList.remove('sin');}
    }
    function pintar(){
      raf=0;if(!actual)return;
      if(!document.documentElement.contains(actual)){apagar();return;}
      var r=actual.getBoundingClientRect();if(r.width<1){apagar();return;}
      var reciente=visible||(Date.now()-apagadoEn<450);
      var deslizar=reciente&&prev&&prev!==actual&&vecinos(prev,actual);
      if(prev===actual&&visible){iman(r);return;}
      colocar(actual,deslizar);crear().classList.add('on');visible=true;prev=actual;
    }
    function apagar(){if(capa)capa.classList.remove('on','press');visible=false;actual=null;prev=null;}
    function programar(){if(!raf)raf=requestAnimationFrame(pintar);}
    function onda(ev,el){
      if(!capa||!el)return;
      var r=el.getBoundingClientRect();
      capa.style.setProperty('--v-ox',(ev.clientX-r.left).toFixed(1)+'px');
      capa.style.setProperty('--v-oy',(ev.clientY-r.top).toFixed(1)+'px');
      capa.classList.remove('onda');void capa.offsetWidth;capa.classList.add('onda');
    }
    document.addEventListener('visibilitychange',function(){if(document.hidden)apagar();});
    window.addEventListener('blur',apagar,{passive:true});
    if(FINO){
      document.addEventListener('pointermove',function(ev){
        if(ev.pointerType&&ev.pointerType!=='mouse')return;
        mx=ev.clientX;my=ev.clientY;
        if(escribiendo){escribiendo=false;if(capa)capa.classList.remove('quieto');}
        var el=objetivo(ev.target);
        if(el===actual){if(el)programar();return;}
        if(!el){
          actual=null;
          if(!tSalir)tSalir=setTimeout(function(){tSalir=0;if(!actual){if(capa)capa.classList.remove('on');visible=false;apagadoEn=Date.now();}},140);
          return;
        }
        if(tSalir){clearTimeout(tSalir);tSalir=0;}
        actual=el;programar();
      },{passive:true});
      document.addEventListener('pointerdown',function(ev){
        if(ev.pointerType&&ev.pointerType!=='mouse')return;
        if(actual&&capa){capa.classList.add('press');onda(ev,actual);}
      },{passive:true});
      document.addEventListener('pointerup',function(){if(capa)capa.classList.remove('press');},{passive:true});
      document.addEventListener('pointerleave',apagar,{passive:true});
      window.addEventListener('scroll',function(){
        if(!capa)return;
        capa.classList.add('quieto');clearTimeout(tScroll);
        tScroll=setTimeout(function(){
          capa.classList.remove('quieto');
          actual=objetivo(document.elementFromPoint(mx,my));visible=false;prev=null;
          if(actual)programar();else capa.classList.remove('on');
        },140);
      },{passive:true,capture:true});
      window.addEventListener('resize',function(){if(actual){visible=false;programar();}},{passive:true});
      document.addEventListener('keydown',function(ev){
        if(ev.key==='Tab')return;
        if(capa&&!escribiendo){escribiendo=true;capa.classList.add('quieto');}
      },true);
      document.addEventListener('focusin',function(ev){
        var el=ev.target;
        try{if(!el.matches(':focus-visible'))return;}catch(e){return;}
        var o=objetivo(el);if(!o)return;
        escribiendo=false;if(capa)capa.classList.remove('quieto');
        var r=o.getBoundingClientRect();mx=r.left+r.width/2;my=r.top+r.height/2;
        actual=o;programar();
      },true);
      document.addEventListener('click',function(){setTimeout(function(){if(actual&&!document.documentElement.contains(actual))apagar();},60);},{passive:true,capture:true});
    }else{
      // Táctil: solo un destello breve sobre lo que se toca (botón, enlace, pestaña). La capa es fija a la pantalla, así
      // que en cuanto el dedo arrastra o la página se desplaza se apaga al instante: nunca se queda pegada encima del
      // contenido mientras se baja (pasaba en el iPhone). Tampoco sigue al dedo por las listas.
      var px=0,py=0,tocando=false,tFade=0,tMax=0;
      function ocultar(){clearTimeout(tFade);clearTimeout(tMax);tocando=false;if(capa)capa.classList.remove('on','onda','press');visible=false;prev=null;actual=null;}
      function fade(ms){clearTimeout(tFade);tFade=setTimeout(function(){if(capa){capa.classList.remove('on');visible=false;prev=null;actual=null;}},ms);}
      document.addEventListener('pointerdown',function(ev){
        if(ev.pointerType==='mouse')return;
        var el=objetivo(ev.target);
        px=ev.clientX;py=ev.clientY;
        if(!el){ocultar();return;}
        tocando=true;mx=px;my=py;
        colocar(el,false);crear().classList.add('on');visible=true;prev=el;actual=el;
        onda(ev,el);clearTimeout(tFade);
        clearTimeout(tMax);tMax=setTimeout(ocultar,900);   // tope: nunca más de un instante en pantalla
      },{passive:true});
      document.addEventListener('touchmove',function(ev){
        var t=ev.touches&&ev.touches[0];if(!t||!visible)return;
        if(Math.abs(t.clientX-px)>8||Math.abs(t.clientY-py)>8)ocultar();   // empezó a arrastrar: no es un toque
      },{passive:true});
      function soltar(){if(!tocando)return;tocando=false;fade(260);}
      document.addEventListener('pointerup',soltar,{passive:true});
      document.addEventListener('touchend',soltar,{passive:true});
      document.addEventListener('pointercancel',ocultar,{passive:true});
      document.addEventListener('touchcancel',ocultar,{passive:true});
      window.addEventListener('scroll',function(){if(visible)ocultar();},{passive:true,capture:true});
    }
  })();

  window.BayolReflector={version:'20261004r2'};
})();
