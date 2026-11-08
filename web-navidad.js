/* web-navidad.js — efectos de Navidad en bayolcell.com (08-nov-2026). Solo corre si el <head> puso html.bc-navidad.
   Santa con sus renos cruzando la portada, luna, estrellas, luces, nieve, gorro en el logo, regalos y destellos al tocar.
   Todo es decoración encima de la página: no cambia precios, botones ni pedidos. */
(function () {
  'use strict';
  var R = document.documentElement;
  if (!R.classList.contains('bc-navidad')) return;
  var quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Santa «como el real» (dueño, 08-nov-2026): traje rojo con piel blanca, barba, renos cafés con arnés y campana,
     astas de hueso, el de adelante con la nariz roja; trineo rojo con adornos dorados. */
  const C={cafe:'#8a5a32',cafeO:'#5e3b1f',vientre:'#d9b48a',hueso:'#e8dcc0',rojo:'#c81e1e',rojoO:'#8f1212',blanco:'#f8f6f0',oro:'#d6a64a',piel:'#f1c19a',negro:'#1c1410',saco:'#7a5634'};
  /* Galope (dueño, 08-nov-2026: «que los renos se muevan»): cada pata gira en su hombro o cadera
     y el cuerpo sube y baja. Con «reducir movimiento» no se anima. */
  function reno(x,y,s,lider,fase){
   const st=(d,w,c)=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
   const D=.56, b0=-(fase||0)*D;
   const gira=(px,py,a1,a2,extra)=>quieto?'':`<animateTransform attributeName="transform" type="rotate" values="${a1} ${px} ${py};${a2} ${px} ${py};${a1} ${px} ${py}" keyTimes="0;.5;1" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1" dur="${D}s" begin="${(b0-(extra||0)).toFixed(2)}s" repeatCount="indefinite"/>`;
   const pata=(a,b,w1,w2,c,h,piv)=>`<g>${st(a,w1,c)+st(b,w2,c)}<circle cx="${h[0]}" cy="${h[1]}" r="1.6" fill="${C.negro}"/>${gira(piv[0],piv[1],piv[2],piv[3],piv[4])}</g>`;
   const sube=quieto?'':`<animateTransform attributeName="transform" type="translate" values="0 0;0 -2.6;0 0" keyTimes="0;.5;1" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1" dur="${D}s" begin="${b0.toFixed(2)}s" repeatCount="indefinite"/>`;
   return `<g transform="translate(${x} ${y}) scale(${s})"><g>${sube}
   ${pata('M66 46 C71 51 75 54 81 56','M81 56 C83 59 82 61 79 62',3.2,2,C.cafeO,[79,62],[67,45,-22,18,.07])}
   ${pata('M35 47 C29 53 23 57 15 60','M15 60 C12 61 10 63 9 66',3.3,2,C.cafeO,[9,66],[34,46,18,-20,.07])}
   <path d="M21 37 C16 33 12 33 10 35 C13 37 16 39 21 40Z" fill="${C.blanco}"/>
   <path d="M20 38 C30 31 52 30 64 32 C68 27 71 21 74 16 C75 12 79 10 83 11 L92 15 C95 16 95 19 92 20 L84 20 C81 24 79 30 77 36 C76 44 70 48 60 49 C48 50 36 50 28 48 C20 47 16 43 20 38Z" fill="${C.cafe}"/>
   <path d="M30 47 C42 45 56 45 70 44 C66 48 60 49 52 49.5 C44 50 36 50 30 47Z" fill="${C.vientre}"/>
   <path d="M77 30 C78 24 80 21 83 20 L84 20 C81 24 79 30 77 36Z" fill="${C.vientre}"/>
   <path d="M86 15 L92 15 C95 16 95 19 92 20 L86 20Z" fill="${C.cafeO}" opacity=".5"/>
   <path d="M80 12 L75 6 L82 10Z" fill="${C.cafeO}"/>
   <circle cx="84.5" cy="14" r="1.1" fill="${C.negro}"/>
   ${st('M80 11 C78 4 74 0 67 -2 M75 3 C71 3 69 5 68 8 M78 6 C76 2 77 -1 80 -4',1.8,C.hueso)}
   ${st('M84 11 C86 4 90 0 97 -1 M88 4 C91 4 93 6 94 9 M86 6 C86 2 85 -1 83 -4',1.8,C.hueso)}
   ${pata('M71 44 C77 47 81 49 87 48','M87 48 C90 51 89 54 86 55',3.4,2.2,C.cafe,[86,55],[71,44,-24,20])}
   ${pata('M30 45 C22 49 14 51 6 51','M6 51 C3 52 1 54 0 57',3.6,2.2,C.cafe,[0,57],[31,45,20,-22])}
   ${st('M70 33 C73 38 75 42 76 44',3,C.rojo)}${st('M44 32 C45 38 46 44 46 49',2.4,C.rojo)}${st('M46 33 L72 34',2.2,C.rojo)}
   <circle cx="75" cy="44" r="2.2" fill="${C.oro}"/>
   ${lider?'<circle cx="93.5" cy="17.5" r="2.6" fill="#ef4444"/><circle cx="93.5" cy="17.5" r="5" fill="#ef4444" opacity=".25"/>':`<circle cx="93.6" cy="17.4" r="1.4" fill="${C.negro}"/>`}
   </g></g>`;}
  function trineo(){
   const st=(d,w,c)=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
   return `<g>
   <path d="M18 36 C12 28 15 9 27 7 C36 5 43 12 44 20 C45 28 43 34 41 36Z" fill="${C.saco}"/>
   <path d="M22 30 C20 22 22 14 28 11" fill="none" stroke="#5c3f24" stroke-width="1.2" opacity=".7"/>
   <path d="M24 8 C24 3 29 2 31 5 C30 7 27 8 24 8Z" fill="${C.saco}"/>${st('M24 8.5 L31 6.5',1.4,C.oro)}
   <rect x="30" y="1" width="7" height="6" rx="1" fill="#16a34a"/><rect x="33" y="1" width="1.4" height="6" fill="${C.oro}"/>
   <path d="M46 36 C45 24 49 17 58 17 C66 17 69 25 69 36Z" fill="${C.rojo}"/>
   <path d="M47 30 L69 30 L69 33 L47 33Z" fill="${C.negro}"/><rect x="55" y="29.5" width="5" height="4" rx=".6" fill="none" stroke="${C.oro}" stroke-width="1"/>
   ${st('M58 18 L58 29',2.6,C.blanco)}
   ${st('M64 24 C72 24 79 22 85 19',4.4,C.rojo)}${st('M80 20.7 L83 19.6',4.6,C.blanco)}<circle cx="87" cy="18.6" r="2.6" fill="${C.negro}"/>
   <circle cx="58" cy="10" r="5.8" fill="${C.piel}"/>
   <path d="M51.5 11 C51 19 55 24 58.5 25 C62 24 65.5 19 64.5 11 C62 13 60 14 58 14 C56 14 54 13 51.5 11Z" fill="${C.blanco}"/>
   <path d="M54.5 13.8 C56 12.6 57.4 12.8 58 13.6 C58.6 12.8 60 12.6 61.5 13.8 C60 15 58.8 14.8 58 14.2 C57.2 14.8 56 15 54.5 13.8Z" fill="#e9e5da"/>
   <circle cx="58.3" cy="11.6" r="1.4" fill="#e79a86"/><circle cx="56" cy="9.4" r=".8" fill="${C.negro}"/><circle cx="60.6" cy="9.4" r=".8" fill="${C.negro}"/>
   <path d="M52 7 C53 0 60 -2 65 2 C61 3 57 5 52 7Z" fill="${C.rojo}"/>
   ${st('M55 2.5 C49 -2.5 43 -1.5 39 2.5',3.2,C.rojo)}<circle cx="38" cy="3.6" r="2.9" fill="${C.blanco}"/>
   ${st('M51 7.6 L64.5 3.4',3,C.blanco)}
   <path d="M3 34 C1 25 3 18 9 16 C11 22 11 28 11 34Z" fill="${C.rojoO}"/>
   <path d="M3 34 L101 34 C101 31 104 27 111 28 C107 30 106 33 106 37 C105 52 93 60 77 60 L34 60 C14 60 3 50 3 34Z" fill="${C.rojo}"/>
   <path d="M3 34 L101 34 L101 37 L3.3 37Z" fill="${C.oro}"/>
   <path d="M14 46 C20 41 28 41 32 46 C36 51 44 51 48 46 C52 41 60 41 64 46 C68 51 76 51 80 46 C84 41 90 42 94 45" fill="none" stroke="${C.oro}" stroke-width="1.4" opacity=".9"/>
   <path d="M10 52 C18 58 26 57 34 57 L76 57 C88 57 96 52 100 44" fill="none" stroke="${C.rojoO}" stroke-width="2" opacity=".6"/>
   ${st('M0 70 L86 70 C100 70 108 63 108 54 C108 49 104 47 101 50',2.8,C.oro)}
   ${st('M24 60 L22 70 M70 60 L72 70',2.2,C.oro)}
   </g>`;}
  const RIENDA=`<path d="M86 19 Q150 42 210 43 M222 38 Q268 37 310 33 M322 28 Q368 26 410 23" fill="none" stroke="#7a4b23" stroke-width="1.1"/>`;
  var TRINEO=`<svg viewBox="-4 -16 470 92" aria-hidden="true">${RIENDA}${trineo()}${reno(140,10,0.95,false,0)}${reno(240,0,0.95,false,.33)}${reno(340,-10,0.95,true,.66)}</svg>`;
  function caja(c, l) {
    return '<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="3" y="14" width="34" height="24" rx="3" fill="' + c + '"/>' +
      '<rect x="1" y="9" width="38" height="8" rx="2" fill="' + c + '" style="filter:brightness(1.15)"/><rect x="17" y="9" width="6" height="29" fill="' + l + '"/>' +
      '<path d="M20 9 C12 0 6 4 10 8 Z M20 9 C28 0 34 4 30 8 Z" fill="' + l + '"/></svg>';
  }

  function encabezado() {
    var h = document.querySelector('header'); if (!h) return;
    var w = 1200, d = 'M0 0 H' + w + ' V4 ';
    for (var x = w; x > 0; x -= 18) d += 'Q' + (x - 9) + ' ' + (8 + (x * 7 % 6)) + ' ' + (x - 18) + ' 4 ';
    h.insertAdjacentHTML('beforeend', '<svg class="nv-techo" viewBox="0 0 1200 12" preserveAspectRatio="none" aria-hidden="true"><path d="' + d + 'Z" fill="#f8fafc"/></svg>');
    var cols = ['#ef4444', '#facc15', '#22c55e', '#38bdf8', '#f472b6'], n = innerWidth < 700 ? 14 : 34, s = '';
    for (var i = 0; i < n; i++) s += '<i style="color:' + cols[i % 5] + '"></i>';
    h.insertAdjacentHTML('beforeend', '<div class="nv-luces" aria-hidden="true">' + s + '</div>');
    var logo = h.querySelector('.logo'), wrap = h.querySelector('.wrap');
    if (logo && wrap) {
      wrap.insertAdjacentHTML('afterbegin', '<svg class="nv-gorro" viewBox="0 0 64 52" aria-hidden="true"><path d="M6 40 C14 12 38 2 54 10 C46 14 44 24 46 40 Z" fill="#dc2626"/><rect x="2" y="38" width="48" height="11" rx="5.5" fill="#fff"/><circle cx="56" cy="11" r="6" fill="#fff"/></svg>');
      var g = wrap.firstChild;
      g.style.left = (logo.offsetLeft - 10) + 'px';
      g.style.top = (logo.offsetTop - 12) + 'px';
    }
  }

  function portada() {
    var hero = document.querySelector('.hero'), esc = document.getElementById('hero-escena');
    if (!hero || !esc) return;
    esc.insertAdjacentHTML('beforeend', '<span class="nv-luna" aria-hidden="true"></span>' +
      '<span class="nv-regalos izq" aria-hidden="true">' + caja('#dc2626', '#facc15') + '<span style="--s:28px;display:block">' + caja('#16a34a', '#fef2f2') + '</span></span>' +
      '<span class="nv-regalos der" aria-hidden="true" style="--s:32px">' + caja('#facc15', '#dc2626') + '</span>');
    var cielo = document.createElement('div'); cielo.className = 'nv-cielo'; cielo.setAttribute('aria-hidden', 'true');
    var st = '';
    for (var i = 0; i < (innerWidth < 700 ? 10 : 22); i++)
      st += '<i class="nv-est" style="left:' + (Math.random() * 100).toFixed(1) + '%;top:' + (Math.random() * 55).toFixed(1) + '%;animation-delay:' + (Math.random() * 2.4).toFixed(2) + 's"></i>';
    cielo.innerHTML = st + '<div class="nv-trineo"><div class="nv-estela"></div>' + TRINEO + '</div>';
    hero.appendChild(cielo);
    var tr = cielo.querySelector('.nv-trineo');
    function ubicar() {
      var movil = innerWidth < 860, w = movil ? Math.min(520, innerWidth * 1.35) : 760;
      tr.style.setProperty('--w', w + 'px');
      tr.style.setProperty('--t', (movil ? 8 : 11) + 's');
      var top = esc.getBoundingClientRect().top - hero.getBoundingClientRect().top - w * 92 / 470 * (movil ? .95 : .8);
      tr.style.top = Math.max(28, top) + 'px';
    }
    ubicar();
    var t; addEventListener('resize', function () { clearTimeout(t); t = setTimeout(ubicar, 150); });
  }

  function nieve() {
    if (quieto) return;
    var cv = document.createElement('canvas'); cv.className = 'nv-copos'; cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cv);
    var x = cv.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1), W, H, F = [];
    function medir() { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; }
    medir(); addEventListener('resize', medir);
    var n = innerWidth < 700 ? 40 : 90;
    for (var i = 0; i < n; i++) F.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 2.4 + .8, v: Math.random() * .6 + .35, o: Math.random() * 6.3 });
    function paso(t) {
      x.clearRect(0, 0, cv.width, cv.height); x.fillStyle = '#fff';
      for (var i = 0; i < F.length; i++) {
        var f = F[i]; f.y += f.v; f.x += Math.sin(t / 1400 + f.o) * .35;
        if (f.y > H + 4) { f.y = -4; f.x = Math.random() * W; }
        x.globalAlpha = .55 + f.r / 8; x.beginPath(); x.arc(f.x * dpr, f.y * dpr, f.r * dpr, 0, 6.3); x.fill();
      }
      requestAnimationFrame(paso);
    }
    requestAnimationFrame(paso);
  }

  function destellos() {
    if (quieto) return;
    addEventListener('pointerdown', function (e) {
      for (var i = 0; i < 8; i++) {
        var s = document.createElement('span'), a = i / 8 * Math.PI * 2;
        s.className = 'nv-chispa'; s.setAttribute('aria-hidden', 'true'); s.textContent = i % 2 ? '❄' : '✦';
        s.style.left = e.clientX + 'px'; s.style.top = e.clientY + 'px';
        s.style.setProperty('--x', (Math.cos(a) * 46).toFixed(1) + 'px'); s.style.setProperty('--y', (Math.sin(a) * 46).toFixed(1) + 'px');
        document.body.appendChild(s); setTimeout(function (el) { el.remove(); }, 950, s);
      }
    }, { passive: true });
  }

  function iniciar() { try { encabezado(); portada(); nieve(); destellos(); } catch (e) { /* la decoración nunca rompe la página */ } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
