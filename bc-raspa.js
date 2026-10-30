/* bc-raspa.js — «Raspa y gana» en la Prefactura (dueño, 29-oct-2026). Bitácora 2026-10-29-2332-claude-raspa-pantallas.
   · Píldora «Premio Raspa y gana» en la barra de acciones rápidas (.bcpf-qs de taller-prefactura.js).
   · Ventana: busca por código (BC-XXXX), QR (dirección con ?t=) o teléfono → raspa_buscar. Muestra el premio y, línea por línea,
     el % que aplica = mínimo(premio, tope del artículo de raspa_topes) o «No aplica». «Aplicar a esta prefactura» pone descPct
     en esas líneas o, si es accesorio gratis, agrega la línea 1582 (templado) o 1021 (cable tipo C Samsung) con 100 %.
   · El premio puede pasar del tope general de descuento (_rpDescMaxPct): _rpProblemasFactura se envuelve para no contar el
     descuento del premio dentro de ese tope (el resto del descuento sigue con el tope de siempre).
   · Al guardar con éxito en Info Plus (_rpGuardar envuelto), raspa_canjear(código, Nº). Si falla, aviso que no se cierra solo.
   · «Activar con factura» para un código pendiente (raspa_activar). «Deshacer canje» solo para el administrador.
   · Info Plus: todo el descuento viaja en la cabecera como un solo % (taller-app.js, _rpArmarModelo); las líneas van con 0.
   Apagar: localStorage bc_raspa_off = '1' o window.BC_RASPA = false. */
(function () {
  'use strict';
  try { if (window.BC_RASPA === false || localStorage.getItem('bc_raspa_off') === '1') return; } catch (e) {}
  var doc = document;
  var REGALOS = [{ cod: '1582', nombre: 'Templado cristal', alt: 'TEMPLADO CRISTAL VARIADO' }, { cod: '1021', nombre: 'Cable USB tipo C Samsung', alt: 'CABLE USB TIPO C SAMSUNG' }];

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function plata(n) { try { return money(n); } catch (e) { return 'RD$ ' + (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); } }
  function st() { try { return (typeof _rpState !== 'undefined' && _rpState) || null; } catch (e) { return null; } }
  function aviso(m, t) { try { toast(m, t); } catch (e) {} }
  function admin() { try { return typeof isAdminUser === 'function' && !!isAdminUser(); } catch (e) { return false; } }
  function sb() { return (typeof supabaseClient !== 'undefined' && supabaseClient) || null; }
  function rpc(n, a) { var c = sb(); if (!c) return Promise.resolve({ data: null, error: { message: 'Sin conexión' } }); return Promise.resolve(c.rpc(n, a)).catch(function (e) { return { data: null, error: e || { message: 'Sin conexión' } }; }); }
  function fecha(iso) { if (!iso) return ''; try { return new Date(iso).toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Santo_Domingo' }); } catch (e) { return String(iso).slice(0, 10); } }
  function tel(t) { var d = String(t || '').replace(/\D/g, ''); return d.length === 10 ? d.slice(0, 3) + '-' + d.slice(3, 6) + '-' + d.slice(6) : (t || ''); }
  function premioTxt(p) { return p === 'regalo' ? 'Accesorio gratis' : (String(p) + ' %'); }
  function bruto(it) { return Math.round(Number(it.precio || 0) * Number(it.cant || 0) * 100) / 100; }
  function repintar() { try { _rpRenderCart(); } catch (e) {} try { _rpRenderResumen(); } catch (e) {} }

  // ---------- Ventana ----------
  var W = null, ultimoFoco = null, sel = null, topes = {}, regaloElegido = '1582';
  function cerrar() { if (!W) return; W.remove(); W = null; doc.removeEventListener('keydown', teclas, true); try { ultimoFoco && ultimoFoco.focus(); } catch (e) {} }
  function teclas(e) {
    if (!W) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cerrar(); return; }
    if (e.key === 'Tab') {
      var f = [].filter.call(W.querySelectorAll('button:not([disabled]),input:not([disabled]),a[href],[tabindex="0"]'), function (x) { return x.offsetParent !== null; });
      if (!f.length) return; var a = f[0], z = f[f.length - 1];
      if (e.shiftKey && doc.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && doc.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  }
  function abrir() {
    if (W) return;
    ultimoFoco = doc.activeElement; sel = null;
    W = doc.createElement('div'); W.id = 'bcRg'; W.className = 'bcrg-fondo';
    W.innerHTML = '<div class="bcrg-win" role="dialog" aria-modal="true" aria-labelledby="bcRgTit">' +
      '<div class="bcrg-top"><span class="bcrg-ic" aria-hidden="true"><i class="ti ti-gift"></i></span><h3 id="bcRgTit">Premio Raspa y gana</h3>' +
      '<button type="button" class="bcrg-x" aria-label="Cerrar"><i class="ti ti-x" aria-hidden="true"></i></button></div>' +
      '<div class="bcrg-cuerpo"><div id="bcRgAplicado"></div>' +
      '<form class="bcrg-buscar" novalidate><div class="bcrg-campo"><label for="bcRgQ">Código, QR o teléfono</label>' +
      '<div class="bcrg-fila"><input id="bcRgQ" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="BC-7K4P, escanee el QR o 809-000-0000" enterkeyhint="search">' +
      '<button type="submit" class="bcrg-b2">Buscar</button></div><div class="bcrg-ayuda" id="bcRgAyuda"></div></div></form>' +
      '<div id="bcRgRes" aria-live="polite"></div></div></div>';
    doc.body.appendChild(W);
    W.addEventListener('click', function (e) { if (e.target === W || e.target.closest('.bcrg-x')) cerrar(); });
    W.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); buscar(); });
    W.querySelector('#bcRgRes').addEventListener('click', clicRes);
    doc.addEventListener('keydown', teclas, true);
    pintarAplicado();
    setTimeout(function () { var q = doc.getElementById('bcRgQ'); if (q) q.focus(); }, 30);
  }
  function res(html) { var r = W && W.querySelector('#bcRgRes'); if (r) r.innerHTML = html; }
  function ayuda(t, err) { var a = W && W.querySelector('#bcRgAyuda'); if (a) { a.textContent = t || ''; a.classList.toggle('err', !!err); } }
  function chip(cls, t) { return '<span class="bcrg-chip ' + cls + '"><i aria-hidden="true"></i>' + esc(t) + '</span>'; }

  function pintarAplicado() {
    var box = W && W.querySelector('#bcRgAplicado'); if (!box) return;
    var s = st(), r = s && s.raspa;
    box.innerHTML = r ? '<div class="bcrg-apl">' + chip('ok', 'Aplicado') + '<div class="t"><b>' + esc(r.codigo) + ' · ' + esc(premioTxt(r.premio)) + '</b>' +
      '<span>Se marca como usado al guardar la prefactura en Info Plus.</span></div><button type="button" class="bcrg-b2" data-acc="quitar">Quitar premio</button></div>' : '';
    var q = box.querySelector('[data-acc="quitar"]'); if (q) q.onclick = function () { quitarPremio(true); pintarAplicado(); if (sel) pintarSel(); };
  }

  function buscar() {
    var q = (doc.getElementById('bcRgQ').value || '').trim();
    if (q.length < 4) { ayuda('Escriba el código, escanee el QR o escriba el teléfono.', true); return; }
    ayuda(''); res('<div class="bcrg-carga">Buscando…</div>');
    rpc('raspa_buscar', { p_q: q }).then(function (r) {
      if (!W) return;
      if (r.error) { res(''); ayuda('No se pudo buscar. Revise la conexión e intente de nuevo.', true); return; }
      var filas = Array.isArray(r.data) ? r.data : [];
      if (!filas.length) { res('<div class="bcrg-vacio">No se encontró ningún premio.</div>'); return; }
      if (filas.length === 1) { elegir(filas[0]); return; }
      res('<div class="bcrg-sub">Premios vigentes de ese teléfono</div><div class="bcrg-lista">' + filas.map(function (f, i) {
        return '<button type="button" class="bcrg-item" data-i="' + i + '"><b>' + esc(f.codigo) + '</b><span>' + esc(premioTxt(f.premio)) + '</span><em>Vence ' + esc(fecha(f.vence_en)) + '</em></button>';
      }).join('') + '</div>');
      W._filas = filas;
    });
  }
  function clicRes(e) {
    var it = e.target.closest('.bcrg-item'); if (it && W._filas) { elegir(W._filas[Number(it.dataset.i)]); return; }
    var rg = e.target.closest('[data-reg]'); if (rg) { regaloElegido = rg.dataset.reg; pintarSel(); return; }
    var a = e.target.closest('[data-acc]'); if (!a || a.disabled) return;
    var acc = a.dataset.acc;
    if (acc === 'aplicar') aplicar();
    else if (acc === 'activar') activar(a);
    else if (acc === 'deshacer') deshacer(a);
    else if (acc === 'volver') { sel = null; res(''); var q = doc.getElementById('bcRgQ'); if (q) q.focus(); }
  }
  function elegir(f) {
    sel = f;
    var s = st(), items = (s && s.items) || [];
    if (f.estado === 'jugado' && f.premio !== 'regalo') {
      var cods = items.filter(function (x) { return x.raspa !== 'regalo'; }).map(function (x) { return String(x.cod); }).filter(function (c, i, a) { return a.indexOf(c) === i && !(c in topes); });
      if (cods.length) {
        res('<div class="bcrg-carga">Revisando los artículos…</div>');
        rpc('raspa_topes', { p_cods: cods }).then(function (r) {
          (Array.isArray(r.data) ? r.data : []).forEach(function (t) { topes[String(t.cod)] = Number(t.tope) || 0; });
          if (W && sel === f) pintarSel();
        });
        return;
      }
    }
    pintarSel();
  }
  // Qué cambia en cada línea con el premio de %.
  function plan(f) {
    var s = st(), p = Number(f.premio) || 0;
    return ((s && s.items) || []).map(function (it, i) {
      if (it.raspa === 'regalo') return null;
      var tope = topes[String(it.cod)], prev = Number(it.raspa === 'pct' ? it.raspaPrev || 0 : it.descPct || 0);
      if (tope == null) return { i: i, it: it, pct: 0, txt: 'Sin datos', ahorro: 0 };
      var pct = Math.min(p, tope);
      if (pct <= 0) return { i: i, it: it, pct: 0, txt: 'No aplica', ahorro: 0 };
      if (prev >= pct) return { i: i, it: it, pct: 0, txt: 'Ya tiene ' + prev + ' %', ahorro: 0 };
      return { i: i, it: it, pct: pct, prev: prev, txt: pct + ' %', ahorro: Math.round(bruto(it) * (pct - prev)) / 100 };
    }).filter(Boolean);
  }
  function bloqueo() {
    var s = st();
    if (!s) return 'Abra una prefactura primero.';
    if (s.estado === 'facturada') return 'Esta prefactura ya fue facturada.';
    if (s.codprefactura) return 'La prefactura Nº ' + s.codprefactura + ' ya está en Info Plus y no cambia el descuento. Aplique el premio en una prefactura nueva, antes de guardar.';
    if (s.raspa) return 'Ya hay un premio aplicado (' + s.raspa.codigo + '). Quítelo para aplicar otro.';
    return '';
  }
  function pintarSel() {
    var f = sel; if (!f || !W) return;
    var s = st(), cab = '<div class="bcrg-prem"><div class="g">' + esc(premioTxt(f.premio || '')) + '</div><div class="m"><b>' + esc(f.codigo) + '</b>' +
      '<span>' + [f.telefono ? 'Tel. ' + esc(tel(f.telefono)) : '', f.vence_en ? 'Vence ' + esc(fecha(f.vence_en)) : '', f.codprefactura ? 'Compra Nº ' + esc(f.codprefactura) : ''].filter(Boolean).join(' · ') + '</span></div></div>';
    var volver = '<button type="button" class="bcrg-b2 bcrg-volver" data-acc="volver">Buscar otro</button>';
    if (f.estado === 'usado') {
      return res(chip('err', 'Ya usado') + cab + '<p class="bcrg-p">Se usó en la prefactura Nº <b>' + esc(f.usado_codprefactura || '—') + '</b> el ' + esc(fecha(f.usado_en)) + (f.usado_por ? ', por ' + esc(f.usado_por) : '') + '.</p>' +
        '<div class="bcrg-acc">' + (admin() ? '<button type="button" class="bcrg-b2" data-acc="deshacer">Deshacer canje</button>' : '') + volver + '</div>');
    }
    if (f.estado === 'vencido') return res(chip('err', 'Vencido') + cab + '<p class="bcrg-p">Venció el ' + esc(fecha(f.vence_en)) + '. Ya no se puede usar.</p><div class="bcrg-acc">' + volver + '</div>');
    if (f.estado === 'anulado') return res(chip('err', 'Anulado') + cab + '<div class="bcrg-acc">' + volver + '</div>');
    if (f.estado === 'activo') return res(chip('aviso', 'Sin raspar') + cab + '<p class="bcrg-p">El cliente todavía no ha raspado. Pídale que escanee el QR del recibo y raspe; después vuelva a buscar.</p><div class="bcrg-acc">' + volver + '</div>');
    if (f.estado === 'pendiente') {
      return res(chip('aviso', 'Pendiente de pago') + cab + '<p class="bcrg-p">Se activa al pagar la compra Nº ' + esc(f.codprefactura || '') + ' en caja. Si ya se pagó, escriba el Nº de factura de Info Plus.</p>' +
        '<div class="bcrg-campo"><label for="bcRgFac">Nº de factura</label><div class="bcrg-fila"><input id="bcRgFac" autocomplete="off" inputmode="text" placeholder="Ej. FAC-12345">' +
        '<button type="button" class="bcrg-b2" data-acc="activar">Activar con factura</button></div><div class="bcrg-ayuda" id="bcRgFacAy"></div></div><div class="bcrg-acc">' + volver + '</div>');
    }
    // jugado (vigente)
    if (s && s.codprefactura && String(f.codprefactura) === String(s.codprefactura)) {
      return res(chip('err', 'Es de esta misma compra') + cab + '<p class="bcrg-p">El premio se usa en otra compra, no en la que lo generó.</p><div class="bcrg-acc">' + volver + '</div>');
    }
    var bl = bloqueo(), cuerpo = '', puede = !bl, ahorro = 0;
    if (f.premio === 'regalo') {
      cuerpo = '<div class="bcrg-sub">Accesorio que escoge el cliente</div><div class="bcrg-regs" role="radiogroup" aria-label="Accesorio de regalo">' + REGALOS.map(function (r) {
        var a = art(r.cod), on = regaloElegido === r.cod, stock = existencia(a);
        return '<button type="button" role="radio" aria-checked="' + on + '" class="bcrg-reg' + (on ? ' on' : '') + '" data-reg="' + r.cod + '"><span class="ck" aria-hidden="true"></span>' +
          '<span class="t"><b>' + esc(r.nombre) + '</b><em>Cód. ' + r.cod + (a ? ' · ' + esc(plata(precio(a))) : '') + (stock === 0 ? ' · Sin existencia' : '') + '</em></span></button>';
      }).join('') + '</div>';
      var ae = art(regaloElegido); ahorro = ae ? precio(ae) : 0;
      if (!ae) { puede = false; bl = bl || 'El artículo ' + regaloElegido + ' no está en el catálogo cargado. Busque el artículo una vez y vuelva a intentarlo.'; }
      else if (existencia(ae) === 0) { puede = false; bl = bl || 'No hay existencia de este accesorio en el almacén. Escoja el otro.'; }
    } else {
      var pl = plan(f), items = (s && s.items) || [];
      if (!items.length) { puede = false; bl = bl || 'Agregue primero los artículos de la compra.'; }
      ahorro = pl.reduce(function (a, x) { return a + x.ahorro; }, 0);
      cuerpo = items.length ? '<div class="bcrg-sub">A qué se aplica</div><div class="bcrg-lin">' + pl.map(function (x) {
        return '<div class="r' + (x.pct ? '' : ' no') + '"><span class="d"><b>' + esc(x.it.desc) + '</b><em>Cód. ' + esc(x.it.cod) + '</em></span><span class="p">' + esc(x.txt) + '</span><span class="a">' + (x.ahorro ? '− ' + esc(plata(x.ahorro)) : '') + '</span></div>';
      }).join('') + '</div>' : '';
      if (items.length && !(ahorro > 0)) { puede = false; bl = bl || 'El premio no aplica a ningún artículo de esta prefactura.'; }
    }
    res(chip('ok', 'Vigente') + cab + cuerpo +
      (ahorro > 0 ? '<div class="bcrg-tot"><span>Ahorro del cliente</span><b>' + esc(plata(ahorro)) + '</b></div>' : '') +
      (bl ? '<p class="bcrg-p bcrg-blq">' + esc(bl) + '</p>' : '') +
      '<div class="bcrg-acc"><button type="button" class="bcrg-b1" data-acc="aplicar"' + (puede ? '' : ' disabled') + '>Aplicar a esta prefactura</button>' + volver + '</div>');
  }
  function art(cod) { try { return typeof _findInfoplusArt === 'function' ? _findInfoplusArt(cod) : null; } catch (e) { return null; } }
  function precio(a) { try { var it = { niveles: a.niveles || null, precio: Number(a.precio || 0) }; return typeof _rpNivelPrecio === 'function' ? _rpNivelPrecio(it) : it.precio; } catch (e) { return Number(a.precio || 0); } }
  function existencia(a) { if (!a) return null; try { return typeof _rpStockItem === 'function' ? _rpStockItem({ cod: a.codigo }) : null; } catch (e) { return null; } }

  function aplicar() {
    var f = sel, s = st(); if (!f || !s) return;
    var bl = bloqueo(); if (bl) { aviso(bl, 'error'); return; }
    var ahorro = 0;
    if (f.premio === 'regalo') {
      var a = art(regaloElegido); if (!a) return;
      var it = { cod: a.codigo, desc: String(a.descripcion || '').trim() || (REGALOS.filter(function (r) { return r.cod === regaloElegido; })[0] || {}).alt, niveles: a.niveles || null, precio: Number(a.precio || 0), cant: 1, descPct: 100, raspa: 'regalo' };
      it.precio = precio(a); ahorro = it.precio;
      s.items.push(it);
    } else {
      plan(f).forEach(function (x) {
        if (!x.pct) return;
        var li = s.items[x.i]; if (li.raspa !== 'pct') li.raspaPrev = Number(li.descPct || 0);
        li.descPct = x.pct; li.raspa = 'pct'; ahorro += x.ahorro;
      });
    }
    s.raspa = { codigo: f.codigo, premio: f.premio, ahorro: Math.round(ahorro * 100) / 100, regalo: f.premio === 'regalo' ? regaloElegido : null };
    repintar();
    var tot = 0; try { tot = _rpTotales(s.items).total; } catch (e) {}
    aviso('Premio ' + f.codigo + ' aplicado. Se marca como usado al guardar la prefactura.');
    pintarAplicado(); pintarSel();
    if (f.premio === 'regalo' && tot <= 0) aviso('La prefactura queda en RD$ 0.00. Info Plus podría no aceptarla: agregue la compra del cliente.', 'error');
  }
  function quitarPremio(avisar) {
    var s = st(); if (!s || !s.raspa) return;
    var cod = s.raspa.codigo;
    s.items = s.items.filter(function (it) { return it.raspa !== 'regalo'; });
    s.items.forEach(function (it) { if (it.raspa === 'pct') { it.descPct = Number(it.raspaPrev || 0); delete it.raspa; delete it.raspaPrev; } });
    delete s.raspa; repintar();
    if (avisar) aviso('Se quitó el premio ' + cod + '.');
  }
  // Si el premio se queda sin líneas (se borraron o se cambió su descuento a mano), deja de estar aplicado.
  function revisarPremio() {
    var s = st(); if (!s || !s.raspa) return;
    var quedan = (s.items || []).some(function (it) { return it.raspa === 'pct' || it.raspa === 'regalo'; });
    if (!quedan) { var c = s.raspa.codigo; delete s.raspa; aviso('Se quitó el premio ' + c + ': ya no queda en ninguna línea.'); if (W) pintarAplicado(); }
  }
  function activar(btn) {
    var f = sel, inp = doc.getElementById('bcRgFac'), ay = doc.getElementById('bcRgFacAy'); if (!f || !inp) return;
    var fac = (inp.value || '').trim();
    if (fac.length < 4) { ay.textContent = 'Escriba el Nº de factura de Info Plus.'; ay.classList.add('err'); inp.focus(); return; }
    btn.disabled = true; btn.textContent = 'Activando…';
    rpc('raspa_activar', { p_codigo: f.codigo, p_factura: fac }).then(function (r) {
      btn.disabled = false; btn.textContent = 'Activar con factura';
      var d = r && r.data;
      if (d && d.ok) { aviso('Premio ' + f.codigo + ' activado. El cliente ya puede raspar.'); f.estado = 'activo'; f.factura_id = fac; pintarSel(); return; }
      var M = { factura_usada: 'Esa factura ya activó otro premio.', falta_factura: 'Escriba el Nº de factura de Info Plus.', no_existe: 'El código no existe.' };
      var m = d && d.motivo; ay.classList.add('err');
      ay.textContent = r.error ? 'No se pudo activar. Revise la conexión.' : (M[m] || (m && /^ya_/.test(m) ? 'Este premio ya no está pendiente.' : 'No se pudo activar.'));
    });
  }
  function deshacer(btn) {
    var f = sel; if (!f) return;
    btn.disabled = true;
    rpc('raspa_deshacer_canje', { p_codigo: f.codigo }).then(function (r) {
      btn.disabled = false;
      if (r && r.data && r.data.ok) { aviso('Canje de ' + f.codigo + ' deshecho: vuelve a estar vigente.'); f.estado = 'jugado'; f.usado_en = f.usado_por = f.usado_codprefactura = null; pintarSel(); }
      else aviso('No se pudo deshacer el canje.', 'error');
    });
  }

  // ---------- Canje al guardar en Info Plus ----------
  function avisoFijo(m) { try { if (typeof confirmar === 'function') return confirmar(m, { ok: 'Entendido', cancel: 'Cerrar' }); } catch (e) {} aviso(m, 'error'); }
  function canjear(codigo, num) {
    return rpc('raspa_canjear', { p_codigo: codigo, p_codprefactura: String(num) }).then(function (r) {
      var d = r && r.data;
      if (d && d.ok) { aviso('Premio ' + codigo + ' marcado como usado en la prefactura Nº ' + num + '.'); return true; }
      var m = d && d.motivo, base = 'La prefactura Nº ' + num + ' se guardó con el premio ' + codigo + ', pero el premio NO quedó marcado como usado';
      var M = {
        usado: base + ': ya se había usado en la prefactura Nº ' + ((d && d.usado_codprefactura) || '—') + '. Cobre sin el premio o anule la Nº ' + num + ' en Info Plus.',
        vencido: base + ': está vencido. Cobre sin el premio o anule la Nº ' + num + ' en Info Plus.',
        misma_compra: base + ': es de esta misma compra. Cobre sin el premio o anule la Nº ' + num + ' en Info Plus.'
      };
      avisoFijo(M[m] || (base + (r && r.error ? '. Revise la conexión y búsquelo otra vez en «Premio Raspa y gana».' : (m ? ' (' + m + ').' : '.'))));
      return false;
    });
  }

  // ---------- Ganchos sobre las funciones de la Prefactura (taller-app.js) ----------
  function enganchar() {
    var listo = true;
    if (typeof window._rpProblemasFactura === 'function' && !window._rpProblemasFactura._bcrg) {
      var oP = window._rpProblemasFactura;
      var nP = function () {
        var probs = oP.apply(this, arguments), s = st();
        if (!s || !s.raspa || !probs.length) return probs;
        try {
          // Descuento sin el premio: líneas del premio con su % anterior; el accesorio de regalo fuera de la cuenta.
          var sin = s.items.filter(function (it) { return it.raspa !== 'regalo'; }).map(function (it) { var c = Object.assign({}, it); if (it.raspa === 'pct') c.descPct = Number(it.raspaPrev || 0); return c; });
          var t = _rpTotales(sin, Number(s.descMonto || 0)), tope = _rpDescMaxPct();
          if (!(t.subtotal > 0 && t.descuento > t.subtotal * tope / 100 + 0.005)) probs = probs.filter(function (p) { return !/supera el tope/.test(p); });
        } catch (e) {}
        return probs;
      };
      nP._bcrg = true; window._rpProblemasFactura = nP;
    } else if (typeof window._rpProblemasFactura !== 'function') listo = false;
    if (typeof window._rpDescPct === 'function' && !window._rpDescPct._bcrg) {
      var oD = window._rpDescPct;
      var nD = function (i) { var s = st(), it = s && s.items[i]; if (it && it.raspa === 'pct') { delete it.raspa; delete it.raspaPrev; } if (it && it.raspa === 'regalo') { aviso('El accesorio de regalo va con 100 %. Para quitarlo, quite el premio.', 'error'); repintar(); return; } var r = oD.apply(this, arguments); revisarPremio(); return r; };
      nD._bcrg = true; window._rpDescPct = nD;
    }
    if (typeof window._rpQuitar === 'function' && !window._rpQuitar._bcrg) {
      var oQ = window._rpQuitar;
      var nQ = function () { var r = oQ.apply(this, arguments); revisarPremio(); return r; };
      nQ._bcrg = true; window._rpQuitar = nQ;
    }
    if (typeof window._rpCant === 'function' && !window._rpCant._bcrg) {
      var oC = window._rpCant;
      var nC = function (i, v) { var s = st(), it = s && s.items[i]; if (it && it.raspa === 'regalo' && Number(v) !== 1) { aviso('El accesorio de regalo es uno solo. Agregue el otro como artículo aparte.', 'error'); repintar(); return; } return oC.apply(this, arguments); };
      nC._bcrg = true; window._rpCant = nC;
    }
    if (typeof window._rpGuardar === 'function' && !window._rpGuardar._bcrg) {
      var oG = window._rpGuardar;
      var nG = async function () {
        var s0 = st(), rg = s0 && s0.raspa ? s0.raspa : null;
        var r = await oG.apply(this, arguments);
        try {
          var s = st();
          // Solo si Info Plus la guardó (misma prefactura, sincronizada, con Nº) y el premio sigue aplicado.
          if (rg && s === s0 && s.raspa === rg && !rg.canjeado && s.estado === 'sincronizada' && s.codprefactura) {
            rg.canjeado = await canjear(rg.codigo, s.codprefactura);
          }
        } catch (e) {}
        return r;
      };
      nG._bcrg = true; window._rpGuardar = nG;
    } else if (typeof window._rpGuardar !== 'function') listo = false;
    return listo;
  }

  // ---------- Píldora en la barra de acciones rápidas ----------
  function ponerPildora() {
    var qs = doc.querySelector('#v-recepcion .bcpf-qs'); if (!qs) return false;
    if (qs.querySelector('.bcrg-pild')) return true;
    var b = doc.createElement('button'); b.type = 'button'; b.className = 'bcpf-q bcrg-pild';
    b.innerHTML = '<i class="ti ti-gift" aria-hidden="true"></i><span>Premio Raspa y gana</span>';
    b.addEventListener('click', abrir);
    qs.appendChild(b); return true;
  }
  function arrancar() { var a = enganchar(), b = ponerPildora(); return a && b; }
  if (!arrancar()) {
    var mo = new MutationObserver(function () { if (arrancar()) mo.disconnect(); });
    mo.observe(doc.documentElement, { childList: true, subtree: true });
    setTimeout(function () { mo.disconnect(); enganchar(); ponerPildora(); }, 30000);
  }
  window.bcRaspa = { abrir: abrir, cerrar: cerrar, quitar: quitarPremio, canjear: canjear }; // para pruebas
})();
