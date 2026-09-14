/* BAYOL CELL — ambient orb seguro, visible y desacoplado del arranque */
(function(){
  'use strict';
  if (window.__bcAmbientOrbSafe) return;
  window.__bcAmbientOrbSafe = true;

  function boot(){
    try {
      var app = document.getElementById('app');
      if (!app || document.getElementById('bcAmbientOrbSafe')) return;

      var style = document.createElement('style');
      style.id = 'bcAmbientOrbSafeStyle';
      style.textContent = [
        '#bcAmbientOrbSafe{',
        'position:fixed;inset:60px 0 0 250px;overflow:hidden;',
        'pointer-events:none!important;user-select:none!important;',
        'z-index:1;contain:layout paint style;isolation:isolate;',
        'opacity:.88;transition:opacity .25s ease;',
        '}',
        '#bcAmbientOrbSafe .bc-ambient-orb{',
        'position:absolute;border-radius:999px;filter:blur(52px);',
        'will-change:transform,opacity;transform:translate3d(0,0,0);',
        'backface-visibility:hidden;-webkit-backface-visibility:hidden;',
        '}',
        '#bcAmbientOrbSafe .bc-ambient-orb--navy{',
        'width:min(56vw,760px);height:min(56vw,760px);',
        'left:-20%;top:-22%;background:rgba(20,33,61,.24);',
        'animation:bcAmbientNavy 18s ease-in-out infinite alternate;',
        '}',
        '#bcAmbientOrbSafe .bc-ambient-orb--orange{',
        'width:min(48vw,650px);height:min(48vw,650px);',
        'right:-16%;bottom:-20%;background:rgba(255,107,53,.23);',
        'animation:bcAmbientOrange 21s ease-in-out infinite alternate;',
        '}',
        '#bcAmbientOrbSafe .bc-ambient-orb--blue{',
        'width:min(34vw,470px);height:min(34vw,470px);',
        'left:44%;top:36%;background:rgba(41,72,120,.18);',
        'animation:bcAmbientBlue 16s ease-in-out infinite alternate;',
        '}',
        '@keyframes bcAmbientNavy{',
        '0%{transform:translate3d(-2vw,-1vh,0) scale(1);opacity:.70}',
        '100%{transform:translate3d(13vw,9vh,0) scale(1.16);opacity:.98}',
        '}',
        '@keyframes bcAmbientOrange{',
        '0%{transform:translate3d(2vw,2vh,0) scale(1.02);opacity:.72}',
        '100%{transform:translate3d(-12vw,-9vh,0) scale(1.18);opacity:.98}',
        '}',
        '@keyframes bcAmbientBlue{',
        '0%{transform:translate3d(-5vw,4vh,0) scale(.94);opacity:.54}',
        '100%{transform:translate3d(7vw,-7vh,0) scale(1.12);opacity:.86}',
        '}',
        '@media (max-width:1024px){',
        '#bcAmbientOrbSafe{inset:54px 0 0 0;opacity:.74}',
        '#bcAmbientOrbSafe .bc-ambient-orb{filter:blur(46px)}',
        '#bcAmbientOrbSafe .bc-ambient-orb--navy{width:90vw;height:90vw;left:-42%;top:-15%}',
        '#bcAmbientOrbSafe .bc-ambient-orb--orange{width:82vw;height:82vw;right:-38%;bottom:-15%}',
        '#bcAmbientOrbSafe .bc-ambient-orb--blue{width:64vw;height:64vw;left:35%;top:40%}',
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
      app.insertBefore(layer, app.firstChild || null);

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
