/* BAYOL CELL · Ventana «Imprimir label» pro + avisos animados (dueño, 3-nov-2026).
   El dueño eligió:
   · Ventana A «Pro»: la etiqueta se ve GRANDE y real (papel con sombra), «Ajustar medidas» plegado, copias con − y +,
     botón «Imprimir» grande y encabezado blanco limpio. Solo cambia #modalLabelDiag (la vista previa se agranda con
     zoom; lo que se imprime NO cambia: se arma aparte con las mismas medidas).
   · Avisos «isla» abajo al centro: suben suave, ícono por tipo (✓ verde, ⚠ rojo, ℹ azul), barrita del tiempo que falta,
     se pausan con el ratón, un toque los cierra y bajan suave. No los tapa el botón del PDF de la esquina.
   Capa aislada: no cambia ids, onclick ni datos. Apagar: localStorage.bc_label_pro_off='1' (ventana) y
   localStorage.bc_avisos_pro_off='1' (avisos). «Reducir movimiento» = sin deslizar, solo aparece. */
(function () {
  'use strict';
  if (window.BayolLabelPro) return;
  var apagado = function (k) { try { return localStorage.getItem(k) === '1'; } catch (e) { return false; } };
  var EASE = 'cubic-bezier(.22,1,.36,1)';
  var css = [
    /* ---------- Ventana ---------- */
    '#modalLabelDiag.bclp .modal-box{max-width:560px!important;border-radius:20px!important;overflow:hidden}',
    '#modalLabelDiag.bclp .modal-header{background:#fff!important;color:#0f172a!important;border-bottom:1px solid #eef2f7!important;padding:14px 16px 14px 20px!important;border-radius:20px 20px 0 0!important}',
    '#modalLabelDiag.bclp .modal-header h3{text-transform:none!important;letter-spacing:0!important;font-size:17px!important;font-weight:800!important;display:flex;align-items:center;gap:8px;color:#0f172a!important}',
    '#modalLabelDiag.bclp .modal-header h3 i{color:#D65225;font-size:20px}',
    '#modalLabelDiag.bclp .modal-close{width:46px!important;height:46px!important;min-width:46px;border-radius:12px!important;background:#f1f5f9!important;color:#334155!important;border:0!important;font-size:16px!important;display:flex;align-items:center;justify-content:center;transition:background .16s ease,transform .16s ' + EASE + '}',
    '#modalLabelDiag.bclp .modal-close:hover{background:#e2e8f0!important}',
    '#modalLabelDiag.bclp .modal-close:active{transform:scale(.94)}',
    '#modalLabelDiag.bclp .modal-body{background:linear-gradient(180deg,#f8fafc,#eef2f7)!important;padding:24px 20px 16px!important}',
    '#modalLabelDiag.bclp #labelDiagPreview{gap:16px!important;max-height:56vh!important;padding:6px 4px 10px}',
    '#modalLabelDiag.bclp #labelDiagPreview>*{zoom:var(--bclp-z,2);background:#fff;border-radius:2.5px;box-shadow:0 .4px 1px rgba(15,23,42,.18),0 5px 12px -4px rgba(15,23,42,.28);flex:none}',
    '#modalLabelDiag.bclp #labelDiagInfo{margin:12px 0 0!important;font-size:13px!important;color:#475569!important;font-weight:600}',
    '#modalLabelDiag.bclp .bclp-ajustes{margin-top:14px;border:1px solid #e2e8f0;border-radius:14px;background:#fff}',
    '#modalLabelDiag.bclp .bclp-ajustes>summary{list-style:none;cursor:pointer;min-height:48px;display:flex;align-items:center;gap:8px;padding:0 14px;font:700 14px/1.2 inherit;color:#0f172a;border-radius:14px}',
    '#modalLabelDiag.bclp .bclp-ajustes>summary::-webkit-details-marker{display:none}',
    '#modalLabelDiag.bclp .bclp-ajustes>summary .ti-chevron-right{transition:transform .2s ' + EASE + ';color:#64748b}',
    '#modalLabelDiag.bclp .bclp-ajustes[open]>summary .ti-chevron-right{transform:rotate(90deg)}',
    '#modalLabelDiag.bclp .bclp-ajustes>summary small{margin-left:auto;font-weight:600;color:#64748b;font-size:12.5px}',
    '#modalLabelDiag.bclp .bclp-ajustes>summary:hover{background:#f8fafc}',
    '#modalLabelDiag.bclp #labelCalibPanel{border:0!important;margin:0!important;padding:4px 14px 14px!important;border-radius:0 0 14px 14px!important;background:transparent!important}',
    '#modalLabelDiag.bclp #labelCalibPanel>div:first-child{display:none!important}',
    '#modalLabelDiag.bclp #labelCalibPanel>div:last-child{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px!important;align-items:end!important}',
    '#modalLabelDiag.bclp #labelCalibPanel>div:last-child>div{width:auto!important}',
    '#modalLabelDiag.bclp #labelCalibPanel label{display:block;font-size:13px!important;color:#334155!important;font-weight:600;margin:0 0 6px}',
    '#modalLabelDiag.bclp #labelCalibPanel input,#modalLabelDiag.bclp #labelCalibPanel select{min-height:48px!important;height:48px;font-size:16px!important;border-radius:12px!important;padding:0 10px!important}',
    '#modalLabelDiag.bclp #labelCalibPanel button{min-height:48px!important;font-size:14px!important;border-radius:12px!important;padding:0 12px!important;grid-column:span 2}',
    '#modalLabelDiag.bclp .modal-footer{padding:14px 20px 18px!important;gap:12px!important;align-items:center;background:#fff;border-top:1px solid #eef2f7}',
    '#modalLabelDiag.bclp .modal-footer>div:first-child label{font-size:14px!important;font-weight:600;color:#334155}',
    '#modalLabelDiag.bclp .bclp-cop{display:inline-flex;align-items:center;border:1px solid #e2e8f0;border-radius:14px;background:#f8fafc;overflow:hidden}',
    '#modalLabelDiag.bclp .bclp-cop button{width:46px;height:50px;border:0;background:transparent;font:700 20px/1 inherit;color:#0f172a;cursor:pointer;transition:background .14s ease}',
    '#modalLabelDiag.bclp .bclp-cop button:hover{background:#eef2f7}',
    '#modalLabelDiag.bclp .bclp-cop button:active{background:#e2e8f0}',
    '#modalLabelDiag.bclp .bclp-cop button:disabled{opacity:.35;cursor:default}',
    '#modalLabelDiag.bclp #diag_copias{width:52px!important;height:50px;min-height:50px!important;border:0!important;background:transparent!important;text-align:center;font-size:16px!important;font-weight:800!important;padding:0!important;-moz-appearance:textfield;box-shadow:none!important}',
    '#modalLabelDiag.bclp #diag_copias::-webkit-inner-spin-button,#modalLabelDiag.bclp #diag_copias::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}',
    '#modalLabelDiag.bclp .modal-footer .btn-light{min-height:48px;border-radius:14px!important;font-size:15px!important}',
    '#modalLabelDiag.bclp .bclp-imp{min-height:57px!important;padding:0 26px!important;border-radius:16px!important;font-size:16px!important;font-weight:800!important;display:inline-flex;align-items:center;gap:8px;background:linear-gradient(180deg,#ff7a45,#D65225)!important;color:#fff!important;border:0!important;box-shadow:0 10px 22px -10px rgba(214,82,37,.75),inset 0 1px 0 rgba(255,255,255,.25)!important;transition:transform .16s ' + EASE + ',box-shadow .16s ease,filter .16s ease}',
    '#modalLabelDiag.bclp .bclp-imp:hover{filter:brightness(1.05)}',
    '#modalLabelDiag.bclp .bclp-imp:active{transform:scale(.97)}',
    '#modalLabelDiag.bclp .bclp-imp i{font-size:20px}',
    '#modalLabelDiag.bclp.active .modal-box{animation:bclpEntra .26s ' + EASE + ' both}',
    '@keyframes bclpEntra{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:none}}',
    '@media (max-width:600px){#modalLabelDiag.bclp .modal-body{padding:18px 14px 12px!important}#modalLabelDiag.bclp .modal-footer{padding:12px 14px calc(14px + env(safe-area-inset-bottom))!important}#modalLabelDiag.bclp .modal-footer{flex-wrap:nowrap!important;flex-direction:row!important;align-items:center!important}#modalLabelDiag.bclp .modal-footer>div:first-child{order:0;width:auto!important;flex:none!important}#modalLabelDiag.bclp .modal-footer>.bclp-imp{order:1;width:auto!important}#modalLabelDiag.bclp .modal-footer>div:first-child{margin-right:0!important}#modalLabelDiag.bclp .modal-footer>div:first-child label{display:none}#modalLabelDiag.bclp .modal-footer .btn-light{display:none}#modalLabelDiag.bclp .bclp-imp{flex:1;justify-content:center;padding:0 14px!important}}',
    /* ---------- Avisos (isla) ---------- */
    'html.bct #toast{left:50%!important;right:auto!important;bottom:calc(22px + env(safe-area-inset-bottom))!important;transform:translate(-50%,18px) scale(.96);opacity:0;display:none;align-items:center;gap:12px;width:max-content;max-width:min(560px,calc(100vw - 32px));min-height:52px;padding:10px 18px 12px 12px!important;border-radius:18px!important;background:rgba(15,23,42,.92)!important;color:#fff!important;-webkit-backdrop-filter:blur(14px) saturate(1.3);backdrop-filter:blur(14px) saturate(1.3);border:1px solid rgba(255,255,255,.1)!important;box-shadow:0 18px 40px -16px rgba(15,23,42,.65)!important;font:600 14px/1.35 inherit!important;text-align:left!important;overflow:hidden;cursor:pointer;z-index:100000!important;transition:transform .26s ' + EASE + ',opacity .2s ease}',
    'html.bct #toast.bct-on{display:flex!important}',
    'html.bct #toast.bct-ver{opacity:1;transform:translate(-50%,0) scale(1)}',
    'html.bct #toast.bct-sale{opacity:0;transform:translate(-50%,12px) scale(.97);transition:transform .18s ease-in,opacity .16s ease-in}',
    'html.bct #toast .bct-ico{flex:none;width:30px;height:30px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;background:rgba(56,189,248,.18);color:#7dd3fc}',
    'html.bct #toast.bct-ok .bct-ico{background:rgba(34,197,94,.2);color:#4ade80}',
    'html.bct #toast.bct-mal .bct-ico{background:rgba(255,255,255,.18);color:#fff}',
    'html.bct #toast.bct-mal{background:rgba(185,28,28,.95)!important}',
    'html.bct #toast .bct-txt{min-width:0}',
    'html.bct #toast .bct-barra{position:absolute;left:0;right:0;bottom:0;height:3px;background:rgba(255,255,255,.12)}',
    'html.bct #toast .bct-barra>i{display:block;height:100%;width:100%;transform-origin:left;background:#38bdf8;animation:bctBarra linear forwards}',
    'html.bct #toast.bct-ok .bct-barra>i{background:#4ade80}',
    'html.bct #toast.bct-mal .bct-barra>i{background:rgba(255,255,255,.75)}',
    'html.bct #toast:hover .bct-barra>i{animation-play-state:paused}',
    '@keyframes bctBarra{from{transform:scaleX(1)}to{transform:scaleX(0)}}',
    'html.bct #toast.bct-ver .bct-ico{animation:bctIco .42s ' + EASE + ' .05s both}',
    '@keyframes bctIco{from{transform:scale(.4) rotate(-20deg);opacity:0}to{transform:none;opacity:1}}',
    '@media (max-width:600px){html.bct #toast{width:calc(100vw - 24px)!important;max-width:none}}',
    '@media (prefers-reduced-motion:reduce){html.bct #toast,html.bct #toast.bct-ver,html.bct #toast.bct-sale{transform:translate(-50%,0)!important;transition:opacity .15s linear}html.bct #toast.bct-ver .bct-ico{animation:none}#modalLabelDiag.bclp.active .modal-box{animation:none}}',
    '@media print{html.bct #toast{display:none!important}}'
  ].join('\n');
  var st = document.createElement('style'); st.id = 'bcLabelProCSS'; st.textContent = css; document.head.appendChild(st);

  /* ================= Ventana ================= */
  function armarVentana() {
    if (apagado('bc_label_pro_off')) return false;
    var m = document.getElementById('modalLabelDiag');
    if (!m || m.classList.contains('bclp')) return !!m;
    var panel = document.getElementById('labelCalibPanel'), info = document.getElementById('labelDiagInfo');
    var cop = document.getElementById('diag_copias');
    if (!panel || !info || !cop) return false;
    m.classList.add('bclp');
    // «Ajustar medidas» plegado debajo de la etiqueta
    var det = document.createElement('details'); det.className = 'bclp-ajustes';
    det.innerHTML = '<summary><i class="ti ti-chevron-right"></i><i class="ti ti-adjustments"></i> Ajustar medidas <small></small></summary>';
    info.parentNode.insertBefore(det, info.nextSibling);
    det.appendChild(panel);
    // Copias con − y +
    var caja = document.createElement('span'); caja.className = 'bclp-cop';
    var menos = document.createElement('button'); menos.type = 'button'; menos.textContent = '−'; menos.setAttribute('aria-label', 'Una copia menos');
    var mas = document.createElement('button'); mas.type = 'button'; mas.textContent = '+'; mas.setAttribute('aria-label', 'Una copia más');
    cop.parentNode.insertBefore(caja, cop); caja.appendChild(menos); caja.appendChild(cop); caja.appendChild(mas);
    var lbl = cop.closest('div') && cop.closest('div').querySelector('label'); if (lbl) lbl.textContent = 'Copias';
    var fijar = function (n) { var v = Math.max(1, Math.min(50, n | 0)); cop.value = v; menos.disabled = v <= 1; mas.disabled = v >= 50; };
    menos.onclick = function () { fijar((parseInt(cop.value, 10) || 1) - 1); };
    mas.onclick = function () { fijar((parseInt(cop.value, 10) || 1) + 1); };
    cop.addEventListener('input', function () { menos.disabled = (parseInt(cop.value, 10) || 1) <= 1; });
    // Botón principal
    var imp = m.querySelector('.modal-footer button[onclick*="confirmarImprimirLabelDiag"]');
    if (imp) { imp.classList.add('bclp-imp'); imp.innerHTML = '<i class="ti ti-printer"></i> Imprimir'; }
    // Enter = imprimir (si no está escribiendo en un ajuste)
    m.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && imp && m.classList.contains('active') && !(e.target && e.target.closest && e.target.closest('#labelCalibPanel, select, button'))) { e.preventDefault(); imp.click(); }
    });
    // Al abrir / al recalibrar: títulos cortos, tamaño grande de la vista previa y medidas en el resumen
    var titulo = document.getElementById('modalLabelTitulo'), prev = document.getElementById('labelDiagPreview');
    var ajustar = function () {
      if (!m.classList.contains('active')) return;
      fijar(parseInt(cop.value, 10) || 1);
      if (titulo) {
        var t = titulo.textContent;
        if (/^Vista Previa del Label$/i.test(t)) titulo.textContent = 'Imprimir label';
        else { var k = t.match(/^Vista Previa · (\d+) Labels?$/i); if (k) titulo.textContent = 'Imprimir ' + k[1] + ' labels'; }
      }
      var it = info.textContent;
      if (/^Se imprimirá 1 label$/i.test(it)) info.textContent = '1 label';
      var w = 51, h = 25, f = '';
      try { w = parseInt(localStorage.getItem('bayol_dlbl_w') || '51', 10); h = parseInt(localStorage.getItem('bayol_dlbl_h') || '25', 10); } catch (e) {}
      var primero = prev && prev.firstElementChild;
      if (primero) { var fs = parseFloat(primero.style.fontSize); if (fs) f = ' · letra ' + (Math.round(fs * 2) / 2) + ' px'; }
      var sm = det.querySelector('summary small'); if (sm) sm.textContent = w + ' × ' + h + ' mm' + f;
      if (prev) {
        var disp = Math.max(200, (prev.clientWidth || m.querySelector('.modal-body').clientWidth || 480) - 16);
        var rot = 0; try { rot = parseInt(localStorage.getItem('bayol_dlbl_rot') || '0', 10); } catch (e) {}
        var anchoPx = ((rot === 90 || rot === 270) ? h : w) * 3.7795;
        var z = Math.max(1, Math.min(1.7, disp / anchoPx)); // dueño 3-nov: «quedó muy grande» → tope 1.7 (antes 2.6)
        prev.style.setProperty('--bclp-z', (Math.floor(z * 20) / 20).toFixed(2));
      }
    };
    new MutationObserver(function () { requestAnimationFrame(ajustar); }).observe(m, { attributes: true, attributeFilter: ['class'] });
    if (prev) new MutationObserver(function () { requestAnimationFrame(ajustar); }).observe(prev, { childList: true });
    if (titulo) new MutationObserver(function () { requestAnimationFrame(ajustar); }).observe(titulo, { childList: true, characterData: true, subtree: true });
    window.addEventListener('resize', function () { requestAnimationFrame(ajustar); });
    ajustar();
    return true;
  }

  /* ================= Avisos ================= */
  var ICO = { ok: 'ti-check', mal: 'ti-alert-triangle', info: 'ti-info-circle' };
  var RE_OK = /(guardad|enviad|listo|cread|actualizad|registrad|copiad|impres[ao]|marcad|asignad|despachad|aplicad|borrad|eliminad|✅|✓|🖨)/i;
  var RE_MAL = /^(⚠|❌|error|no se |no imprim|no salió|no hay|falta|sin conexión|debe |seleccione|ingrese|escriba)/i;
  function limpiar(msg) { return String(msg == null ? '' : msg).replace(/^\s*(✅|✓|🖨️|🖨|⚠️|⚠|❌|ℹ️)\s*/u, ''); }
  function envolverAvisos() {
    if (apagado('bc_avisos_pro_off')) return true;
    if (typeof window.toast !== 'function') return false;
    if (window.toast.__bct) return true;
    var orig = window.toast;
    var nuevo = function (msg, tipo) {
      var r = orig.apply(this, arguments);
      try { pintar(msg, tipo); } catch (e) {}
      return r;
    };
    nuevo.__bct = true;
    try { window.toast = nuevo; } catch (e) { return false; }
    document.documentElement.classList.add('bct');
    return true;
  }
  function pintar(msg, tipo) {
    var t = document.getElementById('toast'); if (!t) return;
    var texto = limpiar(msg);
    var k = tipo === 'error' ? 'mal' : tipo === 'success' ? 'ok' : (RE_MAL.test(String(msg || '').trim()) ? 'mal' : (RE_OK.test(String(msg || '')) ? 'ok' : 'info'));
    var ms = k === 'mal' ? (texto.length > 70 ? 6500 : 4500) : (texto.length > 70 ? 4500 : 3000);
    clearTimeout(t._timer); clearTimeout(t._bctT); clearTimeout(t._bctFin);
    t.style.background = ''; t.style.color = ''; t.style.display = '';
    t.setAttribute('role', k === 'mal' ? 'alert' : 'status'); t.setAttribute('aria-live', k === 'mal' ? 'assertive' : 'polite');
    t.className = 'toast bct-on bct-' + k;
    t.innerHTML = '<span class="bct-ico"><i class="ti ' + ICO[k] + '"></i></span><span class="bct-txt"></span><span class="bct-barra"><i></i></span>';
    t.querySelector('.bct-txt').textContent = texto;
    t.querySelector('.bct-barra>i').style.animationDuration = ms + 'ms';
    void t.offsetWidth; // para que la entrada se anime también si ya estaba visible
    t.classList.add('bct-ver');
    var restante = ms, desde = Date.now();
    var irse = function () {
      t.classList.remove('bct-ver'); t.classList.add('bct-sale');
      t._bctFin = setTimeout(function () { t.className = 'toast'; t.innerHTML = ''; t.style.display = 'none'; }, 200);
    };
    t._bctT = setTimeout(irse, restante);
    t.onmouseenter = function () { clearTimeout(t._bctT); restante -= Date.now() - desde; };
    t.onmouseleave = function () { desde = Date.now(); clearTimeout(t._bctT); t._bctT = setTimeout(irse, Math.max(600, restante)); };
    t.onclick = function () { clearTimeout(t._bctT); irse(); };
  }

  function iniciar() {
    var n = 0, iv = setInterval(function () { var a = armarVentana(), b = envolverAvisos(); if ((a && b) || ++n > 40) clearInterval(iv); }, 250);
    armarVentana(); envolverAvisos();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
  window.BayolLabelPro = { armarVentana: armarVentana, pintar: pintar };
})();
