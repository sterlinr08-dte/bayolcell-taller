/* BAYOL CELL · Sin internet (dueño, 1-nov-2026). Estilos en bc-sin-internet.css.
   Cuando el equipo se queda sin internet (evento «offline» o navigator.onLine=false al abrir) aparece SOLO el logo del
   wifi animado (dueño: «solamente el logo»): escanea, una raya roja lo tacha con sacudida y vuelve a buscar (bucle de 4 s).
   · Se quita solo cuando vuelve el internet; el aviso pequeño de taller-rapidez.js dice «Conexión de vuelta».
   · Tocar en cualquier parte (o Esc) lo cierra; si sigue sin internet queda el aviso pequeño de siempre.
   · Mientras la ventana está abierta se esconde el aviso rojo pequeño de taller-rapidez.js (una sola señal).
   · Con «reducir movimiento» se ve quieta, en el cuadro de «Sin conexión».
   · No toca guardar, datos ni Supabase. Apagar: BC_SIN=false o localStorage bc_sin_off='1'. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  if (!root.classList.contains('bc-sin') || window.__bcSinRed) return;
  window.__bcSinRed = true;

  var W = 240, H = 200, BX = W / 2, BY = 128;   // solo el logo: lienzo recortado alrededor del wifi
  var RADII = [26, 52, 77], A0 = -3 * Math.PI / 4, A1 = -Math.PI / 4;
  var CYAN = '#38C6FF', RED = '#FF4D6A', BG = '#13131C';
  var S0 = { x: BX - 58, y: BY - 86 }, S1 = { x: BX + 58, y: BY + 17 };
  var quieto = false;
  try { var mq = matchMedia('(prefers-reduced-motion: reduce)'); quieto = mq.matches; if (mq.addEventListener) mq.addEventListener('change', function (e) { quieto = e.matches; }); } catch (e) {}

  var caja = null, cv = null, ctx = null, dpr = 1, raf = 0, t0 = 0, cerradoPorUsuario = false, tQuitar = null;
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function lerp(a, b, u) { return a + (b - a) * u; }
  function blanco(a) { return 'rgba(255,255,255,' + a + ')'; }

  function cuadro(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
    var error = t >= 2.2, k = clamp((t - 3.6) / 0.3), entra = clamp((t - 2.2) / 0.1);
    var lit = 0, arcA = 0.16;
    if (!error) lit = Math.floor(t / 0.22) % 4;
    else if (t < 3.6) arcA = lerp(0.16, 0.28, entra);
    else arcA = lerp(0.28, 0.16, k);
    var punto = (error && t < 3.9) ? blanco(0.4) : CYAN;
    var sacudir = 0;
    if (error && t < 3.0) { var s = t - 2.2; sacudir = 13 * Math.sin(2 * Math.PI * 9 * s) * Math.exp(-6 * s); }
    var raya = 0;
    if (error) raya = t < 3.6 ? 1 - Math.pow(1 - clamp((t - 2.2) / 0.2), 3) : 1 - k;

    ctx.save(); ctx.translate(sacudir, 0);
    ctx.lineWidth = 11; ctx.lineCap = 'round';
    for (var i = 0; i < 3; i++) { ctx.strokeStyle = i < lit ? CYAN : blanco(arcA); ctx.beginPath(); ctx.arc(BX, BY, RADII[i], A0, A1); ctx.stroke(); }
    ctx.fillStyle = punto; ctx.beginPath(); ctx.arc(BX, BY, 7.5, 0, Math.PI * 2); ctx.fill();
    if (raya > 0) {
      var ex = lerp(S0.x, S1.x, raya), ey = lerp(S0.y, S1.y, raya);
      ctx.lineCap = 'round'; ctx.strokeStyle = BG; ctx.lineWidth = 24;
      ctx.beginPath(); ctx.moveTo(S0.x, S0.y); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.save(); ctx.shadowColor = 'rgba(255,77,106,0.7)'; ctx.shadowBlur = 17 * dpr;
      ctx.strokeStyle = RED; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(S0.x, S0.y); ctx.lineTo(ex, ey); ctx.stroke(); ctx.restore();
    }
    ctx.restore();
  }
  function bucle(now) { cuadro(((now - t0) / 1000) % 4); raf = requestAnimationFrame(bucle); }

  function armar() {
    if (caja) return;
    caja = doc.createElement('div'); caja.id = 'bcSinRed'; caja.hidden = true;
    caja.setAttribute('role', 'alertdialog'); caja.setAttribute('aria-modal', 'false'); caja.setAttribute('aria-label', 'Sin conexión a internet');
    caja.innerHTML = '<div class="bsr-card"><canvas aria-hidden="true"></canvas></div>';
    doc.body.appendChild(caja);
    cv = caja.querySelector('canvas'); ctx = cv.getContext('2d');
    caja.addEventListener('click', function () { cerradoPorUsuario = true; ocultar(); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && caja && !caja.hidden) { cerradoPorUsuario = true; ocultar(); } });
  }
  function medir() { dpr = Math.max(1, window.devicePixelRatio || 1); cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }

  function mostrar() {
    if (cerradoPorUsuario) return;
    armar(); clearTimeout(tQuitar);
    if (!caja.hidden && caja.classList.contains('on')) return;
    caja.hidden = false; medir();
    cancelAnimationFrame(raf);
    if (quieto) cuadro(2.6); else { t0 = performance.now(); raf = requestAnimationFrame(bucle); }
    void caja.offsetWidth; caja.classList.add('on'); root.classList.add('bc-sin-abierto');
  }
  function ocultar() {
    if (!caja || caja.hidden) return;
    caja.classList.remove('on'); root.classList.remove('bc-sin-abierto'); clearTimeout(tQuitar);
    tQuitar = setTimeout(function () { if (caja && !caja.classList.contains('on')) { caja.hidden = true; cancelAnimationFrame(raf); } }, 240);
  }

  window.addEventListener('offline', function () { cerradoPorUsuario = false; mostrar(); });
  window.addEventListener('online', function () { cerradoPorUsuario = false; ocultar(); });
  window.addEventListener('resize', function () { if (caja && !caja.hidden) { medir(); if (quieto) cuadro(2.6); } });
  function alAbrir() { if (navigator.onLine === false) mostrar(); }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', alAbrir); else alAbrir();
  window.bcSinInternet = { mostrar: function () { cerradoPorUsuario = false; mostrar(); }, ocultar: ocultar };
})();
