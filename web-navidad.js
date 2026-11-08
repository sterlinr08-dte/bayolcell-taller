/* web-navidad.js — efectos de Navidad en bayolcell.com (08-nov-2026). Solo corre si el <head> puso html.bc-navidad.
   Santa con sus renos cruzando la portada, luna, estrellas, luces, nieve, gorro en el logo, regalos y destellos al tocar.
   Todo es decoración encima de la página: no cambia precios, botones ni pedidos. */
(function () {
  'use strict';
  var R = document.documentElement;
  if (!R.classList.contains('bc-navidad')) return;
  var quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function reno(x, lider) {
    return '<g transform="translate(' + x + ' 0)"><ellipse cx="18" cy="24" rx="13" ry="6"/><path d="M27 21 L33 11 L37 13 L31 25Z"/>' +
      '<ellipse cx="37" cy="11" rx="5" ry="3.2" transform="rotate(-15 37 11)"/>' +
      '<path d="M35 8 l-4 -7 M33 4 l-5 -1 M37 8 l1 -7 M38 4 l4 -3" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
      '<path d="M27 27 L37 32 M24 28 L31 36 M9 27 L0 31 M12 28 L4 36" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path d="M5 22 l-4 -3 l1 5z"/>' + (lider ? '<circle cx="42" cy="12" r="2.6" fill="#ef4444"/>' : '') + '</g>';
  }
  var TRINEO = '<svg viewBox="0 0 300 54" fill="currentColor" aria-hidden="true"><g transform="translate(0 4)"><circle cx="22" cy="16" r="9"/>' +
    '<path d="M8 26 h48 q10 0 12 -14 l5 0 q-1 20 -20 22 h-42 q-5 0 -5 -5z"/>' +
    '<path d="M4 40 h62 q8 0 10 -8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>' +
    '<path d="M14 34 v6 M50 34 v6" stroke="currentColor" stroke-width="1.6"/><circle cx="40" cy="15" r="8"/><circle cx="44" cy="5" r="4.4"/>' +
    '<path d="M40 3 L50 -2 L49 4Z"/><circle cx="51" cy="-2" r="1.8" fill="#fff"/>' +
    '<path d="M73 22 L112 26" stroke="currentColor" stroke-width=".8" opacity=".75"/></g>' +
    '<g transform="translate(108 2)">' + reno(0) + reno(48) + reno(96, true) + '</g></svg>';
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
      var movil = innerWidth < 860, w = movil ? Math.min(440, innerWidth * 1.1) : 620;
      tr.style.setProperty('--w', w + 'px');
      tr.style.setProperty('--t', (movil ? 8 : 11) + 's');
      var top = esc.getBoundingClientRect().top - hero.getBoundingClientRect().top - (movil ? 96 : 118);
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
