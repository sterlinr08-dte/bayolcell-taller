/* BAYOL CELL · Pistola de códigos → IMEI para asignar equipos a un técnico (dueño, 3-nov-2026:
   «que la pistola lea solo los IMEI para asignarlo a los técnicos»).
   En la ventana «Asignar equipos a un técnico» (Reacondicionados → lote) aparece «Escanear IMEI»:
   · La pistola escribe como un teclado muy rápido y termina con Enter. Se toma SOLO un IMEI: 15 dígitos que pasan la
     prueba de Luhn (la de todos los IMEI). Cualquier otro código (serie, UPC de la caja, modelo) se ignora con aviso.
   · El IMEI encontrado en el lote se MARCA para asignar (la misma casilla de la lista); escanearlo otra vez lo quita.
   · Avisa si no es del lote, si todavía no está evaluado o si ya lo tiene otro técnico.
   · Funciona aunque el cursor esté en otro lado de la ventana (detecta la escritura rápida de la pistola).
   Capa aislada: no cambia ids, onclick ni datos; asignar sigue siendo el mismo botón «Asignar».
   Apagar: localStorage.bc_pistola_off = '1'. */
(function () {
  'use strict';
  if (window.BayolPistolaImei) return;
  try { if (localStorage.getItem('bc_pistola_off') === '1') return; } catch (e) {}

  function luhn(s) {
    var suma = 0;
    for (var i = 0; i < s.length; i++) {
      var d = s.charCodeAt(s.length - 1 - i) - 48;
      if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
      suma += d;
    }
    return suma % 10 === 0;
  }
  /** Saca el IMEI de lo que leyó la pistola. Devuelve '' si no hay un IMEI válido. */
  function sacarImei(txt) {
    var runs = String(txt || '').match(/\d+/g) || []; // solo números de exactamente 15 cifras
    for (var i = 0; i < runs.length; i++) {
      var r = runs[i];
      if (r.length === 15 && luhn(r)) return r;
    }
    return '';
  }
  function digitos(v) { return String(v || '').replace(/\D/g, ''); }
  function nombreTec(id) { try { var t = (cache.tecnicos || []).find(function (x) { return x.id === id; }); return t ? t.nombre : 'otro técnico'; } catch (e) { return 'otro técnico'; } }
  function aviso(t, k) { try { toast(t, k); } catch (e) {} }

  var css = [
    '#bcpiCaja{margin:2px 0 14px;padding:12px;border:1.5px dashed #f59e0b;border-radius:14px;background:#fffbeb}',
    '#bcpiCaja label{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:#92400e;margin:0 0 8px}',
    '#bcpiCaja input{width:100%;min-height:48px;font-size:16px!important;font-weight:700;letter-spacing:.04em;border-radius:12px!important;border:1px solid #fcd34d!important;background:#fff!important;padding:0 14px!important;font-variant-numeric:tabular-nums}',
    '#bcpiCaja input:focus{outline:3px solid rgba(245,158,11,.35);outline-offset:1px}',
    '#bcpiCaja.bcpi-ok{animation:bcpiOk .5s ease}',
    '#bcpiCaja.bcpi-mal{animation:bcpiMal .38s ease}',
    '@keyframes bcpiOk{30%{background:#dcfce7;border-color:#22c55e}}',
    '@keyframes bcpiMal{20%{transform:translateX(-5px)}40%{transform:translateX(5px)}60%{transform:translateX(-3px)}80%{transform:translateX(2px)}}',
    '#bcpiUlt{margin-top:8px;font-size:13px;color:#475569;min-height:18px}',
    '#bcpiUlt b{color:#0f172a}',
    '@media (prefers-reduced-motion:reduce){#bcpiCaja.bcpi-ok,#bcpiCaja.bcpi-mal{animation:none}}'
  ].join('\n');
  var st = document.createElement('style'); st.id = 'bcPistolaCSS'; st.textContent = css; document.head.appendChild(st);

  var caja = null, inp = null, ult = null, modal = null;
  function marcar(clase) { if (!caja) return; caja.classList.remove('bcpi-ok', 'bcpi-mal'); void caja.offsetWidth; caja.classList.add(clase); }
  function procesar(texto) {
    var imei = sacarImei(texto);
    if (!imei) { marcar('bcpi-mal'); aviso('No es un IMEI: ' + String(texto).slice(0, 24), 'error'); return; }
    var loteId = (typeof reacondLoteAbiertoId !== 'undefined') ? reacondLoteAbiertoId : null;
    var todos = (cache.refurb || []);
    var eq = todos.find(function (r) { return r.lote_id === loteId && (digitos(r.imei) === imei || digitos(r.imei2) === imei); });
    if (!eq) {
      var otro = todos.find(function (r) { return digitos(r.imei) === imei || digitos(r.imei2) === imei; });
      marcar('bcpi-mal'); aviso(otro ? 'Ese IMEI es de otro lote.' : 'IMEI no está en el sistema.', 'error'); return;
    }
    if (eq.tecnico_asignado_id) { marcar('bcpi-mal'); aviso('Ya lo tiene ' + nombreTec(eq.tecnico_asignado_id) + '.', 'error'); return; }
    if (eq.estado_evaluacion !== 'evaluado') { marcar('bcpi-mal'); aviso('Aún no está evaluado.', 'error'); return; }
    var quitar = _reacondSel.has(eq.id);
    if (quitar) _reacondSel.delete(eq.id); else _reacondSel.add(eq.id);
    try { _asignloteRefrescar(); } catch (e) {}
    try { if (typeof renderDetalleLoteReacond === 'function') renderDetalleLoteReacond(); } catch (e) {}
    marcar(quitar ? 'bcpi-mal' : 'bcpi-ok');
    var modelo = (eq.modelo || 'Equipo').toString();
    if (ult) ult.innerHTML = (quitar ? 'Quitado: ' : '✓ ') + '<b></b> · …' + imei.slice(-4);
    if (ult) ult.querySelector('b').textContent = modelo;
    var n = (typeof _equiposEvaluadosDisponibles === 'function') ? _equiposEvaluadosDisponibles().filter(function (e) { return _reacondSel.has(e.id); }).length : _reacondSel.size;
    aviso((quitar ? 'Quitado. ' : '✓ Marcado. ') + n + ' para asignar.', quitar ? undefined : 'success');
  }

  function armar() {
    modal = document.getElementById('modalAsignarLote');
    if (!modal || document.getElementById('bcpiCaja')) return !!modal;
    var nota = document.getElementById('asignlote_nota');
    var antes = nota && nota.closest('.form-row');
    if (!antes) return false;
    caja = document.createElement('div'); caja.id = 'bcpiCaja';
    caja.innerHTML = '<label for="bcpiInput"><i class="ti ti-barcode"></i> Escanear IMEI</label>' +
      '<input id="bcpiInput" type="text" inputmode="numeric" autocomplete="off" placeholder="Pase la pistola por el IMEI">' +
      '<div id="bcpiUlt"></div>';
    antes.parentNode.insertBefore(caja, antes);
    inp = caja.querySelector('input'); ult = caja.querySelector('#bcpiUlt');
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); var v = inp.value; inp.value = ''; if (v.trim()) procesar(v); }
    });
    // La pistola teclea muy rápido: si escribe con el cursor en otro lado de la ventana, se lleva al campo.
    var buf = '', ultT = 0;
    document.addEventListener('keydown', function (e) {
      if (!modal.classList.contains('active') || e.target === inp) return;
      var t = Date.now(), rapido = (t - ultT) < 40; ultT = t;
      if (e.key === 'Enter') { if (buf.length >= 12) { e.preventDefault(); e.stopPropagation(); var v = buf; buf = ''; procesar(v); limpiarFoco(e.target, v); } else buf = ''; return; }
      if (e.key && e.key.length === 1) { buf = rapido ? buf + e.key : e.key; } else buf = '';
    }, true);
    function limpiarFoco(el, v) {
      // quita lo que la pistola alcanzó a escribir en otro campo (por ejemplo el buscador de técnico)
      try { if (el && 'value' in el && el.value && el.value.indexOf(v.slice(-6)) >= 0) { el.value = el.value.replace(v, '').replace(v.slice(1), ''); el.dispatchEvent(new Event('input', { bubbles: true })); } } catch (e) {}
    }
    new MutationObserver(function () {
      if (modal.classList.contains('active')) { if (ult) ult.textContent = ''; setTimeout(function () { try { inp.focus({ preventScroll: true }); } catch (e) {} }, 120); }
    }).observe(modal, { attributes: true, attributeFilter: ['class'] });
    return true;
  }
  function iniciar() { var n = 0, iv = setInterval(function () { if (armar() || ++n > 40) clearInterval(iv); }, 250); armar(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
  window.BayolPistolaImei = { sacarImei: sacarImei, procesar: procesar };
})();
