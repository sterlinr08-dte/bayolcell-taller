/* Captura guiada de gastos. Los montos siguen viviendo en conta_equilibrio.gastos.
 * No escribe ventas, costos ni Info Plus. bc_captura_off='1' devuelve la captura anterior. */
(function () {
  'use strict';
  try { if (localStorage.getItem('bc_captura_off') === '1') return; } catch (_) {}
  var B = window.BayolConta;
  if (!B) return;
  var esc = B.esc, estados = { confirmado: 'Confirmado', estimado: 'Estimado', revisar: 'Por revisar' };
  var bucket = 'conta-comprobantes', ocupados = new Set();
  function api() { return window.BayolEquilibrio; }
  function st() { return api()._estado(); }
  function actor() { try { return sessionUser.nombre || 'Personal'; } catch (_) { return 'Personal'; } }
  function cantidad(g) { return g.monto !== '' && g.monto != null && Number.isFinite(Number(g.monto)) && Number(g.monto) >= 0; }
  function estado(g) { return !cantidad(g) ? 'pendiente' : (g.captura && estados[g.captura.estado] ? g.captura.estado : 'revisar'); }
  function tocar(g, invalidar) {
    var m = g.captura || (g.captura = {});
    if (invalidar || !estados[m.estado]) m.estado = 'revisar';
    m.por = actor(); m.fecha = new Date().toISOString(); st().sucio = true;
  }
  function gasto(cod, i) { return st().filas[cod].gastos[i]; }
  function ayuda(g) {
    var t = String(g.concepto || '').toLowerCase();
    if (/n[oó]mina/.test(t)) return 'Solo sueldos de esta tienda y de este mes. Comisiones e incentivos van aparte.';
    if (/comisi/.test(t)) return 'Revise que no esté incluida también en la nómina o en el porcentaje de comisión.';
    if (/incentiv/.test(t)) return 'Anote solo lo correspondiente a este mes, sin repetirlo en nómina.';
    if (/pr[eé]stamo|inter[eé]s/.test(t)) return 'Use la lista de préstamos. Si no conoce el desglose, deje la cuota total por revisar.';
    if (/itbis|impuesto|tss|regal[ií]a|provisi|prestacion|depreci/.test(t)) return 'Adjunte el soporte y deje la clasificación a la contadora.';
    if (/repuesto|pieza|mercanc/.test(t)) return 'Las compras de inventario no son gasto automático. Revise que Info Plus no incluya ya ese costo.';
    return 'Monto correspondiente al mes seleccionado. Un cero confirmado significa que este mes no hubo gasto.';
  }
  function resumen(filas) {
    var r = { total: 0, confirmados: 0, estimados: 0, revisar: 0, pendientes: 0, sinSoporte: 0, montoConfirmado: 0, montoEstimado: 0 };
    (filas || []).forEach(function (f) { (f.gastos || []).forEach(function (g) {
      var e = estado(g); r.total++;
      if (e === 'confirmado') { r.confirmados++; r.montoConfirmado += Number(g.monto); }
      else if (e === 'estimado') { r.estimados++; r.montoEstimado += Number(g.monto); }
      else if (e === 'pendiente') r.pendientes++; else r.revisar++;
      if (cantidad(g) && Number(g.monto) > 0 && !(g.captura && ((g.captura.archivos || []).length || (g.captura.nota || '').trim()))) r.sinSoporte++;
    }); });
    r.listo = r.total > 0 && r.confirmados === r.total && !r.sinSoporte;
    return r;
  }
  function filasActuales() { return [0].concat(B.TIENDAS.map(function (t) { return t.cod; })).map(function (c) { return st().filas[c]; }).filter(Boolean); }
  function avance() {
    var r = resumen(filasActuales()), n = r.total ? Math.round(r.confirmados * 100 / r.total) : 0;
    return '<section class="pc-avance" aria-label="Avance de captura"><div class="pc-enc"><div><span class="pc-eyebrow">Gastos del mes</span><h3>' + (r.listo ? 'Listo para revisión contable' : 'Equilibrio provisional') + '</h3></div><b>' + r.confirmados + ' / ' + r.total + '</b></div>' +
      '<progress max="100" value="' + n + '" aria-label="Gastos confirmados">' + n + '%</progress>' +
      '<div class="pc-cifras"><span><b>' + r.pendientes + '</b> Sin monto</span><span><b>' + r.estimados + '</b> Estimados</span><span><b>' + r.revisar + '</b> Por revisar</span><span><b>' + r.sinSoporte + '</b> Sin soporte</span></div>' +
      '<details><summary>Guía para llenar</summary><p>Las ventas y su costo llegan de Info Plus. Registre los gastos una sola vez: por tienda o en Gastos comunes. Lo vacío está pendiente; escriba 0 y confírmelo si no hubo gasto.</p><p>Adjunte un comprobante o explique el soporte en una nota. La contadora revisa impuestos, préstamos y clasificaciones antes del cierre.</p></details></section>';
  }
  function render(g, cod, i, campos) {
    var m = g.captura || {}, e = estado(g), id = 'pc_' + cod + '_' + i;
    var archivos = (m.archivos || []).map(function (a, j) { return '<button type="button" class="pc-file" data-pc-ver="' + j + '" title="Ver comprobante">' + esc(a.nombre) + '</button>'; }).join('');
    return '<article class="pc-gasto" data-pc-cod="' + cod + '" data-pc-i="' + i + '">' + campos +
      '<div class="pc-controles"><label for="' + id + '_estado">Estado<select id="' + id + '_estado" data-pc-estado aria-label="Estado de ' + esc(g.concepto) + '">' +
      (!cantidad(g) ? '<option value="pendiente">Sin monto</option>' : '') + Object.keys(estados).map(function (k) { return '<option value="' + k + '"' + (e === k ? ' selected' : '') + '>' + estados[k] + '</option>'; }).join('') + '</select></label>' +
      '<label class="pc-adjuntar">Comprobante<span class="pc-upload"><span>Adjuntar foto o PDF</span><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" data-pc-adjuntar aria-label="Adjuntar comprobante de ' + esc(g.concepto) + '"></span></label></div>' +
      '<div class="pc-files">' + archivos + '</div><details' + (m.nota ? ' open' : '') + '><summary>Nota y ayuda</summary><p>' + esc(ayuda(g)) + '</p><label for="' + id + '_nota">Nota<textarea id="' + id + '_nota" data-pc-nota maxlength="400" placeholder="Soporte o dato pendiente">' + esc(m.nota || '') + '</textarea></label></details>' +
      (m.por ? '<p class="pc-autor">Registró ' + esc(m.por) + (m.fecha ? ' · ' + esc(new Date(m.fecha).toLocaleDateString('es-DO')) : '') + '</p>' : '') + '</article>';
  }
  function actualizarAvance() {
    var el = document.getElementById('pcAvance'); if (el) el.innerHTML = avance();
    var dirty = document.getElementById('peEstado'); if (dirty) dirty.textContent = st().sucio ? 'Cambios sin guardar' : '';
  }
  function aviso(s, tipo) { if (typeof toast === 'function') toast(s, tipo); }
  function repintar() { api()._pintar(); }
  async function adjuntar(file, cod, i) {
    if (!file) return;
    var g = gasto(cod, i), mes = st().mes, key = mes + ':' + cod + ':' + i;
    if (ocupados.has(key)) return;
    var tipos = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' };
    if (!tipos[file.type] || !file.size || file.size > 8 * 1024 * 1024) { aviso('Use una foto o PDF de hasta 8 MB.', 'error'); return; }
    if (((g.captura || {}).archivos || []).length >= 3) { aviso('Máximo 3 comprobantes por gasto.', 'error'); return; }
    var cli = B.sb(); if (!cli || !B.puede()) return;
    ocupados.add(key);
    try {
      var ruta = mes + '/' + cod + '/' + crypto.randomUUID() + '.' + tipos[file.type];
      var r = await cli.storage.from(bucket).upload(ruta, file, { contentType: file.type, upsert: false });
      if (r.error) throw r.error;
      // No colocar un documento en otro mes o en otro concepto tras cambiar de pantalla.
      if (st().mes !== mes || gasto(cod, i) !== g) { aviso('Archivo cargado. Vuelva al mes y adjúntelo de nuevo.', 'error'); return; }
      tocar(g, false); if (!Array.isArray(g.captura.archivos)) g.captura.archivos = [];
      g.captura.archivos.push({ ruta: ruta, nombre: file.name.slice(0, 120), tipo: file.type });
      aviso('Comprobante adjunto. Guarde el mes.'); repintar();
    } catch (_) { aviso('No se pudo adjuntar. Intente de nuevo.', 'error'); }
    finally { ocupados.delete(key); }
  }
  async function ver(cod, i, j) {
    var a = ((gasto(cod, i).captura || {}).archivos || [])[j]; if (!a) return;
    if (!new RegExp('^' + st().mes + '/' + cod + '/[a-f0-9-]+\\.(jpg|png|webp|pdf)$').test(a.ruta)) { aviso('Comprobante no válido.', 'error'); return; }
    var win = window.open('about:blank', '_blank'); if (win) win.opener = null;
    try {
      var r = await B.sb().storage.from(bucket).createSignedUrl(a.ruta, 60);
      if (r.error || !r.data || !r.data.signedUrl) throw new Error();
      var u = new URL(r.data.signedUrl); if (u.protocol !== 'https:') throw new Error();
      if (win) win.location.replace(u.href); else aviso('Permita abrir el comprobante.', 'error');
    } catch (_) { if (win) win.close(); aviso('No se pudo abrir el comprobante.', 'error'); }
  }
  document.addEventListener('change', function (ev) {
    var el = ev.target, row = el.closest && el.closest('.pc-gasto'); if (!row || !B.puede()) return;
    var cod = Number(row.dataset.pcCod), i = Number(row.dataset.pcI), g = gasto(cod, i);
    if (el.matches('[data-pc-estado]')) {
      if (!cantidad(g) || !estados[el.value]) { aviso('Escriba el monto, incluso si es 0.', 'error'); repintar(); return; }
      tocar(g, false); g.captura.estado = el.value; repintar();
    } else if (el.matches('[data-pc-nota]')) { tocar(g, false); g.captura.nota = el.value.trim().slice(0, 400); actualizarAvance(); api()._refrescar(); }
    else if (el.matches('[data-pc-adjuntar]')) adjuntar(el.files[0], cod, i);
  });
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest && ev.target.closest('[data-pc-ver]'); if (!el || !B.puede()) return;
    var row = el.closest('.pc-gasto'); ver(Number(row.dataset.pcCod), Number(row.dataset.pcI), Number(el.dataset.pcVer));
  });
  function copiar(filas) {
    filas.forEach(function (f) { (f.gastos || []).forEach(function (g) {
      // Los documentos de octubre no prueban gastos de noviembre.
      g.captura = { estado: cantidad(g) ? 'estimado' : 'revisar', por: actor(), fecha: new Date().toISOString(), archivos: [], nota: '' };
    }); });
  }
  async function guardar(cli, filas) {
    if (ocupados.size) throw new Error('Espere a que termine el comprobante.');
    var versiones = {};
    filas.forEach(function (f) { var old = st().filas[f.codlocalidad]; versiones[f.codlocalidad] = old && old.actualizado_en || null; });
    var r = await cli.rpc('conta_equilibrio_guardar_captura', { p_mes: st().mes + '-01', p_filas: filas, p_versiones: versiones });
    if (r.error) {
      if (r.error.code === '40001' || r.error.code === '23505') throw new Error('Otra persona cambió este mes. Actualice antes de guardar.');
      throw new Error('No se pudo guardar la captura. Revise la conexión y la configuración.');
    }
    return r;
  }
  window.BayolCaptura = { render: render, avance: avance, resumen: resumen, estado: estado, tocar: tocar, actualizar: actualizarAvance,
    copiar: copiar, guardar: guardar, tienePendientes: function () { return !resumen(filasActuales()).listo; }, ocupado: function () { return ocupados.size > 0; } };
})();
