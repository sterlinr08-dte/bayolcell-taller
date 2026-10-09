/* BAYOL CELL · Menú lateral compacto (9 oct 2026). Pedido del dueño: «que la barra lateral se oculte
   automáticamente y solo se queden los íconos para ahorrar espacio».
   · Computadora (≥1025 px): la barra queda en 76 px (solo íconos). Se abre flotando sobre el contenido al pasar
     el ratón (o al entrar con Tab) y se cierra al salir o al elegir una opción. No mueve el contenido.
   · Botón «Fijar menú» (chincheta en la cabecera de la barra): la deja abierta como antes; se recuerda en este
     navegador (localStorage bc_menu_fijo).
   · Celular/tableta: sin cambios (sigue el menú que sale con el botón de las tres rayas).
   Capa aislada: no cambia ids ni onclick. Estilos en taller-sidebar-mini.css. API: window.BayolMenuMini. */
(function(){
  'use strict';
  if(window.BayolMenuMini) return;
  var VERSION='20261009m1', CLAVE='bc_menu_fijo';
  var html=document.documentElement;
  var escritorio=window.matchMedia ? window.matchMedia('(min-width:1025px)') : {matches:true};
  var tAbrir=0, tCerrar=0, bloqueadoHastaSalir=false;

  (function(){
    if(document.getElementById('bcMenuMiniCss')) return;
    var l=document.createElement('link'); l.id='bcMenuMiniCss'; l.rel='stylesheet';
    l.href='taller-sidebar-mini.css?v='+VERSION; (document.head||html).appendChild(l);
  })();

  function leerFijo(){ try{ return localStorage.getItem(CLAVE)==='1'; }catch(e){ return false; } }
  function guardarFijo(v){ try{ localStorage.setItem(CLAVE, v ? '1' : '0'); }catch(e){} }
  function barra(){ return document.getElementById('sidebar'); }

  function abrir(){ var s=barra(); if(s && html.classList.contains('bcm-mini')) s.classList.add('bcm-abierta'); }
  function cerrar(){ var s=barra(); if(s) s.classList.remove('bcm-abierta'); }

  function pintarPin(){
    var b=document.getElementById('bcmPin'); if(!b) return;
    var fijo=!html.classList.contains('bcm-mini');
    b.innerHTML='<i class="ti '+(fijo ? 'ti-pinned-off' : 'ti-pin')+'"></i>';
    var txt=fijo ? 'Ocultar menú automáticamente (solo íconos)' : 'Fijar menú abierto';
    b.title=txt; b.setAttribute('aria-label', txt); b.setAttribute('aria-pressed', String(fijo));
  }

  function aplicar(){
    var mini=escritorio.matches && !leerFijo();
    html.classList.toggle('bcm-mini', mini);
    if(!mini) cerrar();
    pintarPin();
    try{ window.dispatchEvent(new Event('resize')); }catch(e){} // la cápsula del menú se recoloca
  }

  function fijar(v){ guardarFijo(!!v); aplicar(); }

  function montar(){
    var s=barra(); if(!s || s.dataset.bcmListo) return !!s;
    s.dataset.bcmListo='1';
    // Nombre de cada opción como globo al pasar (útil también con la barra cerrada)
    s.querySelectorAll('.nav button').forEach(function(b){
      if(!b.title){ var sp=b.querySelector('span'); if(sp && sp.textContent.trim()) b.title=sp.textContent.trim(); }
    });
    // Botón fijar (en la cabecera; el clic no debe disparar el «ir al inicio» del logo)
    var marca=s.querySelector('.side-brand');
    if(marca && !document.getElementById('bcmPin')){
      var pin=document.createElement('button'); pin.type='button'; pin.id='bcmPin'; pin.className='bcm-pin';
      pin.addEventListener('click', function(ev){ ev.stopPropagation(); fijar(html.classList.contains('bcm-mini')); });
      marca.appendChild(pin);
    }
    s.addEventListener('mouseenter', function(){
      clearTimeout(tCerrar); if(bloqueadoHastaSalir) return;
      clearTimeout(tAbrir); tAbrir=setTimeout(abrir, 110);
    });
    s.addEventListener('mouseleave', function(){
      clearTimeout(tAbrir); bloqueadoHastaSalir=false;
      clearTimeout(tCerrar); tCerrar=setTimeout(cerrar, 260);
    });
    s.addEventListener('focusin', function(){ clearTimeout(tCerrar); abrir(); });
    s.addEventListener('focusout', function(ev){
      if(ev.relatedTarget && s.contains(ev.relatedTarget)) return;
      clearTimeout(tCerrar); tCerrar=setTimeout(cerrar, 120);
    });
    // Al elegir una opción del menú se cierra enseguida (no se reabre hasta salir y volver a entrar)
    s.addEventListener('click', function(ev){
      if(!html.classList.contains('bcm-mini')) return;
      var b=ev.target.closest && ev.target.closest('.nav button');
      if(b){ clearTimeout(tAbrir); bloqueadoHastaSalir=true; cerrar(); try{ b.blur(); }catch(e){} }
    });
    aplicar();
    return true;
  }

  if(escritorio.addEventListener) escritorio.addEventListener('change', aplicar);
  else if(escritorio.addListener) escritorio.addListener(aplicar);
  document.addEventListener('keydown', function(ev){ if(ev.key==='Escape') { var s=barra(); if(s && s.contains(document.activeElement)) { cerrar(); try{ document.activeElement.blur(); }catch(e){} } } });

  function arrancar(){ if(!montar()){ var n=0, t=setInterval(function(){ if(montar() || ++n>40) clearInterval(t); }, 250); } }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', arrancar); else arrancar();

  window.BayolMenuMini={ version:VERSION, fijar:fijar, abrir:abrir, cerrar:cerrar,
    estado:function(){ var s=barra(); return { mini:html.classList.contains('bcm-mini'), abierta:!!(s && s.classList.contains('bcm-abierta')), fijo:leerFijo() }; } };
})();
