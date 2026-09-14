/* BAYOL CELL — ambient orb seguro y desacoplado del arranque */
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
        'opacity:.72;transition:opacity .25s ease;',
        '}',
        '#bcAmbientOrbSafe .bc-ambient-orb{',
        'position:absolute;border-radius:999px;filter:blur(70px);',
        'will-change:transform,opacity;transform:translate3d(0,0,0);',
        '}',
        '#bcAmbientOrbSafe .bc-ambient-orb--navy{',
        'width:min(44vw,620px);height:min(44vw,620px);',
        'left:-16%;top:-18%;background:rgba(41,72,120,.16);',
        'animation:bcAmbientNavy 24s ease-in-out infinite alternate;',
        '}',
        '#bcAmbientOrbSafe .bc-ambient-orb--orange{',
        'width:min(38vw,520px);height:min(38vw,520px);',
        'right:-12%;bottom:-16%;background:rgba(255,107,53,.14);',
        'animation:bcAmbientOrange 28s ease-in-out infinite alternate;',
        '}',
        '@keyframes bcAmbientNavy{',
        '0%{transform:translate3d(0,0,0) scale(1);opacity:.72}',
        '100%{transform:translate3d(9vw,6vh,0) scale(1.12);opacity:.92}',
        '}',
        '@keyframes bcAmbientOrange{',
        '0%{transform:translate3d(0,0,0) scale(1.02);opacity:.68}',
        '100%{transform:translate3d(-8vw,-5vh,0) scale(1.15);opacity:.9}',
        '}',
        '@media (max-width:1024px){',
        '#bcAmbientOrbSafe{inset:54px 0 0 0;opacity:.58}',
        '#bcAmbientOrbSafe .bc-ambient-orb{filter:blur(56px)}',
        '#bcAmbientOrbSafe .bc-ambient-orb--navy{width:72vw;height:72vw;left:-34%;top:-12%}',
        '#bcAmbientOrbSafe .bc-ambient-orb--orange{width:68vw;height:68vw;right:-30%;bottom:-12%}',
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
      layer.innerHTML = '<span class="bc-ambient-orb bc-ambient-orb--navy"></span><span class="bc-ambient-orb bc-ambient-orb--orange"></span>';
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
