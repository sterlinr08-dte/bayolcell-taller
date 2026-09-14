/* BAYOL CELL — ambient orb seguro, visible y desacoplado del arranque */
(function(){
  'use strict';
  if (window.__bcAmbientOrbSafe) return;
  window.__bcAmbientOrbSafe = true;

  function boot(){
    try {
      var app = document.getElementById('app');
      var host = app && app.querySelector('.content');
      if (!app || !host || document.getElementById('bcAmbientOrbSafe')) return;

      var style = document.createElement('style');
      style.id = 'bcAmbientOrbSafeStyle';
      style.textContent = [
        '#app .content{position:relative!important;isolation:isolate!important;}',
        '#app .content>.view{position:relative;z-index:1;}',
        '#bcAmbientOrbSafe{',
        'position:fixed;top:60px;right:0;bottom:0;left:250px;overflow:hidden;',
        'pointer-events:none!important;user-select:none!important;',
        'z-index:0;contain:layout paint style;isolation:isolate;',
        'opacity:.94;transition:opacity .25s ease;',
        '}',
        '#bcAmbientOrbSafe .bc-ambient-orb{',
        'position:absolute;border-radius:999px;filter:blur(44px);',
        'will-change:transform,opacity;transform:translate3d(0,0,0);',
        'backface-visibility:hidden;-webkit-backface-visibility:hidden;',
        '}',
        '#bcAmbientOrbSafe .bc-ambient-orb--navy{',
        'width:min(60vw,820px);height:min(60vw,820px);',
        'left:-22%;top:-24%;background:rgba(20,33,61,.30);',
        'animation:bcAmbientNavy 17s ease-in-out infinite alternate;',
        '}',
        '#bcAmbientOrbSafe .bc-ambient-orb--orange{',
        'width:min(52vw,700px);height:min(52vw,700px);',
        'right:-18%;top:42%;background:rgba(255,107,53,.28);',
        'animation:bcAmbientOrange 20s ease-in-out infinite alternate;',
        '}',
        '#bcAmbientOrbSafe .bc-ambient-orb--blue{',
        'width:min(38vw,520px);height:min(38vw,520px);',
        'left:42%;top:24%;background:rgba(41,72,120,.22);',
        'animation:bcAmbientBlue 15s ease-in-out infinite alternate;',
        '}',
        '@keyframes bcAmbientNavy{',
        '0%{transform:translate3d(-2vw,-1vh,0) scale(1);opacity:.72}',
        '100%{transform:translate3d(14vw,10vh,0) scale(1.18);opacity:1}',
        '}',
        '@keyframes bcAmbientOrange{',
        '0%{transform:translate3d(3vw,3vh,0) scale(1.02);opacity:.74}',
        '100%{transform:translate3d(-13vw,-10vh,0) scale(1.20);opacity:1}',
        '}',
        '@keyframes bcAmbientBlue{',
        '0%{transform:translate3d(-6vw,5vh,0) scale(.94);opacity:.58}',
        '100%{transform:translate3d(8vw,-8vh,0) scale(1.14);opacity:.90}',
        '}',
        '@media (max-width:1024px){',
        '#bcAmbientOrbSafe{top:54px;right:0;bottom:0;left:0;opacity:.82}',
        '#bcAmbientOrbSafe .bc-ambient-orb{filter:blur(40px)}',
        '#bcAmbientOrbSafe .bc-ambient-orb--navy{width:96vw;height:96vw;left:-44%;top:-14%}',
        '#bcAmbientOrbSafe .bc-ambient-orb--orange{width:88vw;height:88vw;right:-40%;top:52%}',
        '#bcAmbientOrbSafe .bc-ambient-orb--blue{width:70vw;height:70vw;left:32%;top:28%}',
        '}',
        '@media (prefers-reduced-motion:reduce){',
        '#bcAmbientOrbSafe .bc-ambient-orb{animation:none!important;will-change:auto!important}',
        '}',
        'body.bc-page-hidden #bcAmbientOrbSafe .bc-ambient-orb{animation-play-state:paused!important}',
        '#bcAmbientOrbSafe[hidden]{display:none!important}'
      ].join('');
      document.head.appendChild(style);

      var layer = document.createElement('div');
      layer.id = 'bcAmbientOrbSafe';
      layer.setAttribute('aria-hidden','true');
      layer.innerHTML = '<span class="bc-ambient-orb bc-ambient-orb--navy"></span><span class="bc-ambient-orb bc-ambient-orb--orange"></span><span class="bc-ambient-orb bc-ambient-orb--blue"></span>';
      host.insertBefore(layer, host.firstChild || null);

      function syncVisibility(){
        try {
          document.body.classList.toggle('bc-page-hidden', document.hidden);
        } catch (_) {}
      }
      document.addEventListener('visibilitychange', syncVisibility, {passive:true});
      syncVisibility();
    } catch (_) {
      /* Decorativo: cualquier fallo se ignora para no afectar el sistema. */
    }
  }

  function schedule(){
    try { setTimeout(boot, 900); } catch (_) {}
  }

  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, {once:true, passive:true});
})();
