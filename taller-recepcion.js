/* BAYOL CELL · Recepción organizada (19-oct-2026, pedido del dueño: «organizar la ventana de recepción y prefactura»).
   Decisiones del dueño: orden según el trabajo, prefactura siempre a la vista, Herramientas rápidas se quedan arriba.
   · Orden: 1 Cliente → 2 Equipo → 3 Falla y diagnóstico (con «Fallas del equipo» y «Seguridad del dispositivo» dentro)
     → 4 Artículos y servicios → 5 Datos adicionales (plegado, con un resumen de lo elegido).
   · Celular/tablet: barra fija abajo con el total, «Guardar» y «Guardar e imprimir» (tocan los mismos botones de la
     prefactura, así que la lógica es la de siempre); «Ver detalle» baja a la prefactura. Se oculta mientras se escribe.
   · Solo mueve elementos que ya existen (mismos id, mismos onclick). No toca _rpGuardar ni Info Plus.
   · Capa reversible: sin html.bc-rx no hace nada. Apagar: BC_RX=false, o localStorage bc_rx_off='1' en un equipo. */
(function () {
  'use strict';
  var doc = document;
  if (!doc.documentElement.classList.contains('bc-rx')) return;

  function q(sel, root) { return (root || doc).querySelector(sel); }
  function txt(el) { return el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : ''; }

  function organizar() {
    var v = doc.getElementById('v-recepcion');
    if (!v || v.dataset.bcRx === '1') return !!v;
    var cols = q('.rx-cols', v);
    var cards = cols ? Array.prototype.slice.call(cols.children).filter(function (c) { return c.classList.contains('rx-card'); }) : [];
    if (cards.length < 4) return false;
    var cli = cards[0], equ = cards[1], adi = cards[2], fal = cards[3];
    var art = cols.parentElement && Array.prototype.slice.call(cols.parentElement.children).filter(function (c) { return c !== cols && c.classList.contains('rx-card'); })[0];
    if (!art) return false;
    v.dataset.bcRx = '1';

    cli.classList.add('bcrx-cli'); equ.classList.add('bcrx-equ'); fal.classList.add('bcrx-fal');
    art.classList.add('bcrx-art'); adi.classList.add('bcrx-adi');

    // 3 · Falla y diagnóstico: título nuevo y, dentro, las fallas marcables y la seguridad del dispositivo
    var hf = q('.rx-head', fal);
    if (hf) { var n = hf.childNodes; for (var i = 0; i < n.length; i++) { if (n[i].nodeType === 3 && /Diagn/.test(n[i].nodeValue)) { n[i].nodeValue = ' Falla y diagnóstico'; break; } } }
    var bodyF = q('.rx-body', fal);
    var seg = q('.rx-seg', v);
    var chk = doc.getElementById('checksFisico');
    var fallasCard = chk ? chk.closest('.card') : null;
    [fallasCard, seg].forEach(function (c) { if (c && bodyF) { c.classList.add('bcrx-dentro'); bodyF.appendChild(c); } });

    // 5 · Datos adicionales: va después de Artículos y queda plegado con un resumen
    art.parentNode.insertBefore(adi, art.nextSibling);
    adi.classList.add('bcrx-plegada');
    var ha = q('.rx-head', adi);
    if (ha) {
      var res = doc.createElement('span'); res.className = 'bcrx-resumen'; ha.insertBefore(res, q('.rx-num', ha));
      ha.setAttribute('role', 'button'); ha.setAttribute('tabindex', '0'); ha.setAttribute('aria-expanded', 'false');
      var alternar = function () { var p = adi.classList.toggle('bcrx-plegada'); ha.setAttribute('aria-expanded', p ? 'false' : 'true'); };
      ha.addEventListener('click', alternar);
      ha.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alternar(); } });
      var pintar = function () {
        var sel = function (id) { var s = doc.getElementById(id); return s && s.selectedIndex >= 0 ? txt(s.options[s.selectedIndex]) : ''; };
        var tec = sel('rxTecnico').replace(/^[—–-]\s*|\s*[—–-]$/g, '');
        if (/^sin asignar$/i.test(tec)) tec = 'Sin técnico';
        var partes = [tec, sel('o_prioridad'), sel('rxAlmacen'), sel('rxVendedor')].filter(Boolean);
        res.textContent = partes.join(' · ');
      };
      adi.addEventListener('change', pintar); pintar(); setTimeout(pintar, 1500);
    }

    // Números de los pasos
    [[cli, 1], [equ, 2], [fal, 3], [art, 4], [adi, 5]].forEach(function (p) { var b = q('.rx-num', p[0]); if (b) b.textContent = p[1]; });

    barra(v);
    return true;
  }

  // Barra fija de la prefactura (celular y tablet)
  function barra(v) {
    var res = doc.getElementById('rxResumen'); if (!res) return;
    var b = doc.createElement('div'); b.className = 'bcrx-barra'; b.setAttribute('role', 'region'); b.setAttribute('aria-label', 'Prefactura');
    b.innerHTML = '<button type="button" class="bcrx-total" aria-label="Ver el detalle de la prefactura"><span class="bcrx-total-lbl">Total</span><b class="bcrx-total-num">RD$ 0.00</b><span class="bcrx-ver">Ver detalle</span></button>' +
      '<div class="bcrx-acc"><button type="button" class="bcrx-g">Guardar</button><button type="button" class="bcrx-gi" aria-label="Guardar e imprimir">Imprimir</button></div>' +
      '<div class="bcrx-nota" hidden></div>';
    v.appendChild(b); v.classList.add('bcrx-con-barra');
    var num = q('.bcrx-total-num', b), acc = q('.bcrx-acc', b), nota = q('.bcrx-nota', b);
    function copiar() {
      var filas = res.querySelectorAll('.rx-sum-row'), tot = null;
      for (var i = 0; i < filas.length; i++) { if (txt(filas[i].firstElementChild) === 'Total') tot = filas[i]; }
      num.textContent = tot ? txt(tot.lastElementChild) || 'RD$ 0.00' : 'RD$ 0.00';
      var g = res.querySelector('.rx-btn-red');
      acc.hidden = !g; nota.hidden = !!g;
      if (!g) nota.textContent = 'Ya facturada';
    }
    new MutationObserver(copiar).observe(res, { childList: true, subtree: true, characterData: true });
    copiar();
    q('.bcrx-g', b).addEventListener('click', function () { var x = res.querySelector('.rx-btn-red'); if (x) x.click(); });
    q('.bcrx-gi', b).addEventListener('click', function () { var x = res.querySelector('.rx-btn-dark'); if (x) x.click(); });
    q('.bcrx-total', b).addEventListener('click', function () {
      var side = q('.rx-side', v); if (!side) return;
      var r = matchMedia('(prefers-reduced-motion: reduce)').matches;
      side.scrollIntoView({ behavior: r ? 'auto' : 'smooth', block: 'start' });
    });
    // Mientras se escribe (teclado del celular abierto) la barra se esconde para no tapar el campo
    v.addEventListener('focusin', function (e) { if (e.target.matches('input,textarea,select')) b.classList.add('bcrx-oculta'); });
    v.addEventListener('focusout', function () { setTimeout(function () { var a = doc.activeElement; if (!a || !v.contains(a) || !a.matches('input,textarea,select')) b.classList.remove('bcrx-oculta'); }, 60); });
  }

  if (!organizar()) {
    var mo = new MutationObserver(function () { if (organizar()) mo.disconnect(); });
    mo.observe(doc.documentElement, { childList: true, subtree: true });
    setTimeout(function () { mo.disconnect(); }, 20000);
  }
})();
