/* taller-esim.js · Prueba de eSIM en el reacondicionado (26-nov-2026).
   Dueño: reel de GuiReparos → «A1, hazlo smart». Se instala el eSIM GRATIS de BetterRoaming (1GLOBAL/Truphone):
   si el iPhone llega a la pantalla de activar el plan (o sale la línea «1GLOBAL»), el eSIM del equipo funciona.
   Código público tomado del QR oficial de betterroaming.com/esim-installation (leído el 26-nov-2026).
   Guarda el resultado en equipos_refurbish.esim_prueba (ok | falla | bloqueado) + quién y cuándo, y una fila en el historial.
   Smart: dice «No lleva eSIM» en modelos viejos; avisa al pasar a Listo para venta sin probar; recuerda borrar el eSIM.
   Apagar: localStorage.setItem('bc_esim_off','1'). */
(function () {
  'use strict';
  if (window.__bcEsim) return;
  window.__bcEsim = true;
  try { if (localStorage.getItem('bc_esim_off') === '1') return; } catch (e) {}

  var SMDP = 'rsp.truphone.com', CODIGO = 'QRF-BETTERROAMING-PMRDGIR2EARDCMRCPU';
  var LPA = 'LPA:1$' + SMDP + '$' + CODIGO;
  var LINK = 'https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=' + LPA;
  var esc = function (s) { return (typeof escapeHtml === 'function') ? escapeHtml(String(s == null ? '' : s)) : String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var aviso = function (m, t) { try { toast(m, t); } catch (e) {} };
  var eqDe = function (id) { try { return (cache.refurb || []).find(function (r) { return r.id === id; }); } catch (e) { return null; } };

  // ¿El modelo lleva eSIM? true / false / null (no se sabe: se deja probar).
  // iPhone XR, XS y del 11 en adelante, SE 2 (2020) y SE 3 (2022). iPhone X, 8 y anteriores, y SE 1, no.
  function llevaEsim(modelo) {
    var m = String(modelo || '').toLowerCase().replace(/\s+/g, ' ');
    if (!/iphone/.test(m)) return null;
    if (/\bx[rs]\b|xs ?max/.test(m)) return true;
    var n = m.match(/iphone ?(\d{1,2})(?!\d)/); // «IPHONE 8G PLUS» = 8; «16e» = 16
    if (n) { var v = +n[1]; if (v >= 11) return true; if (v <= 8) return false; }
    if (/\bse\b/.test(m)) { if (/20(20|22)|\b(2|3)(ra|da|nd|rd)?\b|gen/.test(m)) return true; if (/20(16)|\b1(ra|st)?\b/.test(m)) return false; return null; }
    if (/iphone ?x\b/.test(m)) return false;
    return null;
  }
  window.bcEsimLleva = llevaEsim;

  var EST = {
    ok: { t: 'eSIM funciona', ic: 'ti-circle-check', c: '#166534', bg: '#dcfce7' },
    falla: { t: 'eSIM no funciona', ic: 'ti-circle-x', c: '#991b1b', bg: '#fee2e2' },
    bloqueado: { t: 'Bloqueado de compañía', ic: 'ti-lock', c: '#92400e', bg: '#fef3c7' }
  };
  function cuando(f) { try { return new Date(f).toLocaleString('es-DO', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }); } catch (e) { return ''; } }
  function pastilla(eq) {
    var e = EST[eq && eq.esim_prueba];
    if (e) return '<span class="bces-pill" style="background:' + e.bg + ';color:' + e.c + '"><i class="ti ' + e.ic + '"></i> ' + e.t + '</span>';
    if (llevaEsim(eq && eq.modelo) === false) return '<span class="bces-pill" style="background:#f1f5f9;color:#475569"><i class="ti ti-minus"></i> No lleva eSIM</span>';
    return '<span class="bces-pill" style="background:#e0f2fe;color:#075985"><i class="ti ti-question-mark"></i> eSIM sin probar</span>';
  }
  window.bcEsimPastilla = pastilla;

  try {
    if (typeof AYUDAS !== 'undefined') AYUDAS.esim = { titulo: 'Prueba de eSIM', html: '\
      <ul style="padding-left:18px; margin:6px 0;">\
        <li>Se instala un eSIM <b>gratis</b> de BetterRoaming (1GLOBAL). No se paga nada si no se compra un plan.</li>\
        <li>Si el iPhone llega a la pantalla de <b>activar el plan</b> o sale la línea <b>1GLOBAL</b> en Ajustes › Celular, el eSIM funciona.</li>\
        <li>Si dice que el eSIM no es compatible o no avanza: revise que el equipo esté <b>liberado</b>. Si está bloqueado de compañía, marque «Bloqueado».</li>\
        <li>Después, <b>borre el eSIM</b>: Ajustes › Celular › 1GLOBAL › Eliminar eSIM. El equipo se vende limpio.</li>\
        <li>No llevan eSIM: iPhone X, 8 y anteriores, y SE de 1.ª generación. Los iPhone de China tampoco.</li>\
      </ul>' };
  } catch (e) {}

  var css = document.createElement('style');
  css.id = 'bcEsimCSS';
  css.textContent =
    '.bces-pill{display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:700;border-radius:10px;padding:3px 9px;white-space:nowrap}' +
    '.bces-fila{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:10px;padding-top:10px;border-top:1px solid #e2e8f0}' +
    '.bces-fila .bces-tx{flex:1;min-width:160px;font-size:13px;color:#334155}' +
    '.bces-fila .bces-tx small{display:block;color:#64748b;font-size:12px;margin-top:2px}' +
    '.bces-btn{min-height:44px;padding:0 14px;border-radius:12px;border:1px solid #cbd5e1;background:#fff;font-size:14px;font-weight:700;color:#0f172a;cursor:pointer;display:inline-flex;align-items:center;gap:6px}' +
    '#bcEsim .modal-box{max-width:560px;width:calc(100vw - 24px);max-height:calc(100dvh - 24px);display:flex;flex-direction:column}' +
    '#bcEsim .es-body{flex:1;overflow:auto;padding:14px 18px}' +
    '#bcEsim .es-eq{font-size:13px;color:#475569;margin-bottom:12px}' +
    '#bcEsim .es-eq b{color:#0f172a}' +
    '#bcEsim .es-grid{display:grid;grid-template-columns:200px 1fr;gap:16px;align-items:start}' +
    '#bcEsim .es-qr{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:10px;width:200px;height:200px;box-sizing:border-box;display:flex;align-items:center;justify-content:center}' +
    '#bcEsim .es-qr img,#bcEsim .es-qr canvas{width:178px!important;height:178px!important}' +
    '#bcEsim ol{margin:0;padding-left:20px;font-size:14px;color:#334155;line-height:1.45}' +
    '#bcEsim ol li{margin-bottom:6px}' +
    '#bcEsim .es-link{margin-top:8px;font-size:13px;color:#475569}' +
    '#bcEsim .es-link a{display:inline-flex;align-items:center;gap:6px;min-height:44px;font-weight:700;color:#0369a1}' +
    '#bcEsim .es-man{margin-top:6px;display:flex;gap:6px;flex-wrap:wrap}' +
    '#bcEsim .es-man button{min-height:44px;font-size:13px;border:1px dashed #94a3b8;background:#f8fafc;border-radius:10px;padding:0 10px;cursor:pointer;color:#334155;text-align:left}' +
    '#bcEsim .es-prev{margin-top:12px;font-size:13px}' +
    '#bcEsim .es-res{display:grid;grid-template-columns:1fr;gap:8px;padding:12px 18px;border-top:1px solid #e2e8f0}' +
    '#bcEsim .es-res button{min-height:48px;border-radius:14px;font-size:15px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;border:1px solid transparent}' +
    '#bcEsim .es-ok{min-height:54px!important;background:#16a34a;color:#fff}' +
    '#bcEsim .es-no{background:#fff;color:#991b1b;border-color:#fecaca!important}' +
    '#bcEsim .es-bl{background:#fff;color:#92400e;border-color:#fde68a!important}' +
    '#bcEsim .es-dos{display:grid;grid-template-columns:1fr 1fr;gap:8px}' +
    '#bcEsim .es-res button:disabled{opacity:.55;cursor:default}' +
    '@media (max-width:520px){#bcEsim .es-grid{grid-template-columns:1fr}#bcEsim .es-qr{margin:0 auto}#bcEsim .modal-box{width:100vw;max-height:100dvh;border-radius:0}}';
  (document.head || document.documentElement).appendChild(css);

  var abierto = null, ocupado = false, alTerminar = null, alCancelar = null;

  async function copiar(txt) {
    try { await navigator.clipboard.writeText(txt); aviso('📋 Copiado'); }
    catch (e) { try { var t = document.createElement('textarea'); t.value = txt; t.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); aviso('📋 Copiado'); } catch (x) { aviso('No se pudo copiar', 'error'); } }
  }
  window.bcEsimCopiar = function (q) { copiar(q === 'smdp' ? SMDP : CODIGO); };

  // Ventana de la prueba. siguiente(): se llama al guardar (para seguir con «Listo para venta»).
  window.abrirPruebaEsim = function (equipoId, siguiente, cancelar) {
    var eq = eqDe(equipoId); if (!eq) return aviso('Equipo no encontrado.', 'error');
    abierto = equipoId; alTerminar = typeof siguiente === 'function' ? siguiente : null; alCancelar = typeof cancelar === 'function' ? cancelar : null;
    var prev = document.getElementById('bcEsim'); if (prev) prev.remove();
    var lleva = llevaEsim(eq.modelo);
    var previo = EST[eq.esim_prueba] ? '<div class="es-prev">' + pastilla(eq) + ' <span style="color:#64748b">' + esc(cuando(eq.esim_prueba_en)) + (eq.esim_prueba_por ? ' · ' + esc(eq.esim_prueba_por) : '') + '</span></div>' : '';
    var box = document.createElement('div');
    box.className = 'modal-backdrop active'; box.id = 'bcEsim'; box.style.zIndex = '700';
    box.onclick = function (ev) { if (ev.target === box) cerrar(); };
    box.innerHTML = '<div class="modal-box"><div class="modal-header" style="display:flex;align-items:center;gap:8px"><h3 style="margin:0;flex:1"><i class="ti ti-sim"></i> Prueba de eSIM</h3>' +
      (typeof _iAyuda === 'function' ? _iAyuda('esim') : '') + '</div><div class="es-body">' +
      '<div class="es-eq"><b>' + esc(eq.modelo || 'Equipo') + '</b>' + (eq.imei ? ' · IMEI ' + esc(eq.imei) : '') + (eq.color ? ' · ' + esc(eq.color) : '') + '</div>' +
      (lleva === false ? '<div class="es-prev" style="margin:0 0 12px"><span class="bces-pill" style="background:#fef3c7;color:#92400e"><i class="ti ti-alert-triangle"></i> Este modelo no lleva eSIM</span></div>' : '') +
      '<div class="es-grid"><div class="es-qr" id="bcEsimQR"></div><div><ol>' +
      (/iphone/i.test(eq.modelo || '') || lleva !== null
        ? '<li>En el equipo: <b>Ajustes › Celular › Agregar eSIM › Usar código QR</b>.</li>'
        : '<li>En el equipo: <b>Ajustes › Conexiones › Administrador de SIM › Agregar eSIM</b> y escanear.</li>') +
      '<li>Lea este QR.</li>' +
      '<li>Si llega a <b>activar el plan</b> o sale la línea <b>1GLOBAL</b>, funciona.</li>' +
      '<li>Bórrelo: <b>Ajustes › Celular › 1GLOBAL › Eliminar eSIM</b>.</li></ol>' +
      '<div class="es-link"><a href="' + esc(LINK) + '" target="_blank" rel="noopener"><i class="ti ti-download"></i> Instalar en este iPhone</a> · iOS 17.4 o más nuevo</div>' +
      '<div class="es-man"><button type="button" onclick="bcEsimCopiar(\'smdp\')" title="Copiar">SM-DP+ ' + SMDP + '</button><button type="button" onclick="bcEsimCopiar(\'cod\')" title="Copiar">Código ' + CODIGO + '</button></div>' +
      previo + '</div></div></div>' +
      '<div class="es-res"><button type="button" class="es-ok" onclick="bcEsimGuardar(\'ok\')"><i class="ti ti-circle-check"></i> Funciona · ya lo borré</button>' +
      '<div class="es-dos"><button type="button" class="es-no" onclick="bcEsimGuardar(\'falla\')"><i class="ti ti-circle-x"></i> No funciona</button>' +
      '<button type="button" class="es-bl" onclick="bcEsimGuardar(\'bloqueado\')"><i class="ti ti-lock"></i> Bloqueado</button></div>' +
      '<button type="button" class="btn btn-light" style="min-height:44px" onclick="bcEsimCerrar()">' + (alTerminar ? 'Seguir sin probar' : 'Cerrar') + '</button></div></div>';
    document.body.appendChild(box);
    try { if (typeof QRCode === 'function') new QRCode(document.getElementById('bcEsimQR'), { text: LPA, width: 178, height: 178, correctLevel: QRCode.CorrectLevel.M }); else throw 0; }
    catch (e) { var q = document.getElementById('bcEsimQR'); if (q) q.innerHTML = '<span style="font-size:12px;color:#64748b;text-align:center">Use el código de abajo</span>'; }
  };
  function cerrar(seguir) {
    if (ocupado) return;
    var b = document.getElementById('bcEsim'); if (b) b.remove();
    var f = alTerminar, c = alCancelar; abierto = null; alTerminar = null; alCancelar = null;
    if (seguir && f) f(); else if (c) c();
  }
  window.bcEsimCerrar = function () { cerrar(true); };

  window.bcEsimGuardar = async function (res) {
    if (ocupado || !abierto) return;
    var eq = eqDe(abierto); if (!eq) return;
    if (res === 'falla' && typeof confirmar === 'function' && !await confirmar('¿El equipo está liberado?\n\nSi está bloqueado de compañía, el eSIM no instala aunque funcione. En ese caso marque «Bloqueado».', { ok: 'Sí, está liberado', peligro: false })) return;
    ocupado = true;
    document.querySelectorAll('#bcEsim .es-res button').forEach(function (b) { b.disabled = true; });
    var por = (typeof sessionUser !== 'undefined' && sessionUser && sessionUser.nombre) || 'Usuario', ahora = new Date().toISOString();
    try {
      var r = await supabaseClient.from('equipos_refurbish').update({ esim_prueba: res, esim_prueba_en: ahora, esim_prueba_por: por }).eq('id', eq.id);
      if (r.error) throw r.error;
      eq.esim_prueba = res; eq.esim_prueba_en = ahora; eq.esim_prueba_por = por;
      try { if (typeof _histInsert === 'function') await _histInsert([{ equipo_id: eq.id, estado_anterior: eq.estado_evaluacion || null, estado_nuevo: eq.estado_evaluacion || null, accion: 'Prueba de eSIM: ' + EST[res].t, usuario: por }]); } catch (e) {}
      aviso(res === 'ok' ? '✅ eSIM funciona' : res === 'falla' ? 'Anotado: eSIM no funciona' : 'Anotado: bloqueado de compañía', res === 'ok' ? undefined : 'error');
      ocupado = false;
      pintarFila(eq.id);
      cerrar(res === 'ok' || res === 'bloqueado' ? true : false);
    } catch (e) {
      ocupado = false;
      document.querySelectorAll('#bcEsim .es-res button').forEach(function (b) { b.disabled = false; });
      try { logError('Prueba de eSIM', e); } catch (x) {}
      aviso('No se pudo guardar. ' + ((typeof getFriendlyError === 'function') ? getFriendlyError(e) : ''), 'error');
    }
  };

  // Fila «eSIM» dentro de la ventana de Evaluación.
  function pintarFila(equipoId) {
    var info = document.getElementById('evalEquipoInfo'); if (!info) return;
    var id = equipoId || (document.getElementById('eval_equipo_id') || {}).value; var eq = eqDe(id); if (!eq) return;
    var fila = document.getElementById('bcEsimFila');
    if (!fila) { fila = document.createElement('div'); fila.id = 'bcEsimFila'; fila.className = 'bces-fila'; info.appendChild(fila); }
    var lleva = llevaEsim(eq.modelo);
    var sub = EST[eq.esim_prueba] ? esc(cuando(eq.esim_prueba_en)) + (eq.esim_prueba_por ? ' · ' + esc(eq.esim_prueba_por) : '') : (lleva === false ? 'No hace falta probarlo' : 'Antes de pasarlo a Listo para venta');
    fila.innerHTML = '<div class="bces-tx">' + pastilla(eq) + '<small>' + sub + '</small></div>' +
      (lleva === false && !eq.esim_prueba ? '' : '<button type="button" class="bces-btn" onclick="abrirPruebaEsim(\'' + eq.id + '\')"><i class="ti ti-sim"></i> ' + (eq.esim_prueba ? 'Repetir' : 'Probar eSIM') + '</button>');
  }
  window.bcEsimPintarFila = pintarFila;

  // Pide la prueba antes de pasar a Listo para venta (aviso, no bloqueo).
  function envolverListo(nombre, idx) {
    var orig = window[nombre]; if (typeof orig !== 'function' || orig.__bcEsim) return false;
    var f = function () {
      var args = arguments, self = this, eq = eqDe(args[idx || 0]);
      // Solo se pide en los iPhone que sí llevan eSIM; en Samsung y otros la prueba queda opcional.
      if (!eq || eq.esim_prueba || llevaEsim(eq.modelo) !== true) return orig.apply(self, args);
      return new Promise(function (resolve) {
        window.abrirPruebaEsim(eq.id, function () { resolve(orig.apply(self, args)); }, function () { resolve(undefined); });
        var titulo = document.querySelector('#bcEsim h3'); if (titulo) titulo.innerHTML = '<i class="ti ti-sim"></i> Antes de Listo: pruebe el eSIM';
      });
    };
    f.__bcEsim = true; window[nombre] = f; return true;
  }
  function instalar() {
    var listo = true;
    ['aprobarTerminado', 'marcarEquipoListo', 'marcarListoVentaDirecto'].forEach(function (n) { if (typeof window[n] === 'function') envolverListo(n, 0); else listo = false; });
    var ev = window.abrirModalEvaluacion;
    if (typeof ev === 'function' && !ev.__bcEsim) {
      var g = async function (equipoId) { var r = await ev.apply(this, arguments); try { var v = document.getElementById('bcEsimFila'); if (v) v.remove(); pintarFila(equipoId); } catch (e) {} return r; };
      g.__bcEsim = true; window.abrirModalEvaluacion = g;
    } else if (typeof ev !== 'function') listo = false;
    return listo;
  }
  var n = 0;
  (function esperar() { if (!instalar() && n++ < 120) setTimeout(esperar, 500); })();
})();
