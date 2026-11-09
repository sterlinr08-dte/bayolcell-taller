/* BAYOL CELL · Prefactura compacta (dueño, 09-nov-2026: «1+2, 3+4, 5+6 y 7»). Estilos en bc-prefactura-compacta.css.
   Solo MUEVE y decora lo que ya pinta taller-prefactura.js (mismos id, mismas funciones). No toca Info Plus, la base
   ni los cálculos: precio, descuento, cantidad y Guardar siguen llamando a _rpPrecio, _rpDescPct, _rpCant y _rpGuardar.
   1) Celular: Precio · Almacén · Vendedor quedan en una píldora («Cliente final · Santiago · Esterlin»). Un toque la abre.
      Se abre sola si falta el almacén o el vendedor.
   2) WhatsApp primero (el cliente se busca por su número): al llegar a 10 cifras se llenan nombre y cédula si ya existe.
      En el celular la cédula queda detrás de «+ Cédula» (sale sola si ya tiene).
   3) Artículos en 2 filas en el celular: nombre e importe arriba; precio, cantidad y «%» abajo. El descuento por línea
      sale al tocar «%» (o solo, si la línea ya tiene descuento).
   4) «Buscar artículo» arriba; los accesos rápidos debajo.
   5) Nombres de los artículos sin MAYÚSCULAS («Bateria Samsung A12»). Solo en pantalla: a Info Plus va el nombre original.
   6) «Nueva» sale de la fila de «Enviar cuentas de pago» y «Pedir reseña» y va arriba, junto al Nº (sigue preguntando).
   7) PC (≥ 1440 px, con la columna «Resumen»): WhatsApp, nombre y cédula pasan al Resumen, junto al total.
   Apagar: BC_PFC=false o localStorage bc_pfc_off='1'. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  if (!root.classList.contains('bc-pfc')) return;
  function q(s, r) { return (r || doc).querySelector(s); }
  function qa(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }
  function el(tag, cls, html) { var e = doc.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function val(id) { var e = doc.getElementById(id); return e ? String(e.value || '').trim() : ''; }

  /* ---------- 5 · Nombres sin MAYÚSCULAS ---------- */
  var MENOR = { de: 1, del: 1, la: 1, el: 1, los: 1, las: 1, para: 1, con: 1, y: 1, en: 1, a: 1, por: 1, sin: 1, o: 1 };
  var FIJO = { IPHONE: 'iPhone', IPAD: 'iPad', AIRPODS: 'AirPods', MAGSAFE: 'MagSafe', MACBOOK: 'MacBook', IWATCH: 'iWatch', WIFI: 'WiFi', TYPE: 'Type' };
  function bonito(s) {
    s = String(s || '');
    var i = 0;
    return s.replace(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]+/g, function (w) {
      var pos = i++;
      if (FIJO[w]) return FIJO[w];
      if (/[a-zñáéíóúü]/.test(w)) return w; // palabra que ya trae minúsculas («Con aviso»): se deja
      if (/\d/.test(w) || w.length <= 3 && !MENOR[w.toLowerCase()]) return w; // A12, 5G, 128GB, USB, SIM, LCD, ZTE
      var m = w.toLowerCase();
      if (pos > 0 && MENOR[m]) return m;
      return m.charAt(0).toUpperCase() + m.slice(1);
    });
  }
  window.bcPfcBonito = bonito;

  var R = { v: null, abiertosDc: {} };

  /* ---------- 1 · Píldora Precio · Almacén · Vendedor ---------- */
  function txtSel(id, corto) {
    var s = doc.getElementById(id); if (!s || !s.value) return '';
    var o = s.options[s.selectedIndex]; var t = o ? o.textContent.trim() : '';
    t = t.replace(/\s*\(.*?\)\s*/g, ' ').trim();
    t = t.replace(/^(Localidad|Oficina|Almacén)\s+/i, ''); // «Oficina Santiago» → «Santiago», para que quepa el vendedor
    if (corto) t = t.split(/\s+/)[0];
    return bonito(t);
  }
  function pintarCond() {
    if (!R.cond) return;
    var faltan = !val('rxAlmacen') || !val('rxVendedor');
    var niv = txtSel('rxNivel'); niv = niv ? niv.charAt(0) + niv.slice(1).toLowerCase() : ''; // «Cliente final», «Por mayor»
    var partes = [niv, txtSel('rxAlmacen'), txtSel('rxVendedor', true) || 'Sin vendedor'].filter(Boolean);
    var t = partes.join(' · ');
    if (R.condTx.textContent !== t) R.condTx.textContent = t;
    R.cond.classList.toggle('falta', faltan);
    // Se abre sola mientras falte el almacén o el vendedor, y se vuelve a cerrar sola cuando ya están.
    if (faltan && !R.franja.classList.contains('pfc-abierta') && !R.cond.dataset.cerrada) { R.cond.dataset.auto = '1'; abrirCond(true); }
    else if (!faltan && R.cond.dataset.auto) { delete R.cond.dataset.auto; abrirCond(false); }
  }
  function abrirCond(si) {
    R.franja.classList.toggle('pfc-abierta', si);
    R.cond.setAttribute('aria-expanded', si ? 'true' : 'false');
  }
  function montarCond(v) {
    var franja = q('.bcpf-franja', v); if (!franja || q('.pfc-cond', franja)) return;
    var cli = q('.pcol', franja); if (!cli) return;
    R.franja = franja;
    R.cond = el('button', 'pfc-cond', '<span class="pfc-cond-t"></span><i class="ti ti-chevron-down" aria-hidden="true"></i>');
    R.cond.type = 'button'; R.cond.setAttribute('aria-label', 'Precio, almacén y vendedor'); R.cond.setAttribute('aria-expanded', 'false');
    R.condTx = q('.pfc-cond-t', R.cond);
    R.cond.addEventListener('click', function () {
      var abre = !franja.classList.contains('pfc-abierta');
      delete R.cond.dataset.auto;
      if (!abre) R.cond.dataset.cerrada = '1'; else delete R.cond.dataset.cerrada;
      abrirCond(abre);
    });
    cli.appendChild(R.cond);
    ['rxNivel', 'rxAlmacen', 'rxVendedor'].forEach(function (id) {
      var s = doc.getElementById(id); if (s) s.addEventListener('change', function () { setTimeout(pintarCond, 0); });
    });
    pintarCond();
  }

  /* ---------- 2 · WhatsApp primero y «+ Cédula» ---------- */
  function montarCli(v) {
    var cd = q('.bcpf-clidatos', v), wa = doc.getElementById('c_whatsapp');
    if (!cd || !wa || cd.dataset.pfc === '1') return;
    cd.dataset.pfc = '1'; R.cli = cd;
    var fila = wa.closest('.bcpf-campos > div'); if (fila) fila.classList.add('pfc-wa');
    var ultimo = '';
    wa.addEventListener('input', function () {
      var d = wa.value.replace(/\D/g, '');
      if (d.length >= 10 && d !== ultimo) { ultimo = d; try { chequearClienteExistente(); } catch (e) {} pintarCed(); }
    });
    var ced = doc.getElementById('c_cedula');
    var b = el('button', 'pfc-ced-btn', '+ Cédula'); b.type = 'button';
    b.addEventListener('click', function () { cd.classList.add('pfc-ced-on'); if (ced) ced.focus(); });
    var campos = q('.bcpf-campos', cd); if (campos) campos.appendChild(b);
    R.cedBtn = b;
    pintarCed();
  }
  function pintarCed() { if (R.cli && val('c_cedula')) R.cli.classList.add('pfc-ced-on'); }

  /* ---------- 3 · Artículos en 2 filas + 5 · nombres ---------- */
  function decorar() {
    var c = doc.getElementById('rxArticulos'); if (!c) return;
    qa('.bcpf-it', c).forEach(function (it, i) {
      if (it.dataset.pfc === '1') return; it.dataset.pfc = '1';
      var nb = q('.dnb', it); if (nb) { var o = nb.textContent; var b = bonito(o); if (b !== o) { nb.textContent = b; nb.setAttribute('data-orig', o); } }
      var l2 = q('.l2', it), dc = q('.dc', it), cod = (q('.nc', it) || {}).textContent || String(i);
      if (!l2 || !dc) return;
      var tiene = Number(String(dc.value).replace(/[^0-9.]/g, '')) > 0;
      if (!tiene && !R.abiertosDc[cod]) it.classList.add('pfc-sindc');
      var p = el('button', 'pfc-pct', '%'); p.type = 'button'; p.setAttribute('aria-label', 'Descuento de esta línea');
      p.addEventListener('click', function () {
        R.abiertosDc[cod] = 1; it.classList.remove('pfc-sindc');
        try { dc.focus(); dc.select(); } catch (e) {}
      });
      l2.appendChild(p);
    });
  }

  /* ---------- 4 · Buscador arriba ---------- */
  function montarBusc(v) {
    var fila = q('.bcpf-rapidos', v), busc = q('.bcpf-busc', v);
    if (!fila || !busc || busc.nextElementSibling === fila) return;
    busc.parentNode.insertBefore(fila, busc.nextSibling);
  }

  /* ---------- 6 · «Nueva» arriba ---------- */
  function montarNueva(v) {
    var dhr = q('.bcpf-dh .dhr', v); if (!dhr || q('.pfc-nueva', dhr)) return;
    var vieja = qa('.bcpf-qs .bcpf-q', v).filter(function (b) { return /^\s*Nueva\s*$/.test(b.textContent); })[0];
    if (!vieja) return;
    var b = el('button', 'pfc-nueva', '<i class="ti ti-plus" aria-hidden="true"></i><span>Nueva</span>'); b.type = 'button';
    b.setAttribute('aria-label', 'Prefactura nueva');
    b.addEventListener('click', function () { vieja.click(); }); // la misma función de siempre: pregunta si hay algo sin guardar
    vieja.classList.add('pfc-oculto');
    dhr.appendChild(b); // en PC al final, después de la fecha; en el celular el CSS la sube junto a «BAYOL CELL»
  }

  /* ---------- 7 · PC: cliente en el Resumen ---------- */
  var casa = null;
  function moverCli() {
    var cd = R.cli; if (!cd) return;
    var aside = q('#v-recepcion .bcpro-res');
    var dos = root.classList.contains('bc-pfpro-2c') && aside && aside.isConnected;
    if (dos) {
      if (cd.parentNode === aside) return;
      if (!casa) casa = { p: cd.parentNode, s: cd.nextSibling };
      var h = q('h3', aside); aside.insertBefore(cd, h ? h.nextSibling : aside.firstChild);
      cd.classList.add('pfc-en-res');
    } else if (casa && cd.parentNode !== casa.p) {
      casa.p.insertBefore(cd, casa.s && casa.s.parentNode === casa.p ? casa.s : null);
      cd.classList.remove('pfc-en-res');
    }
  }

  /* ---------- Arranque ---------- */
  function montar() {
    var v = doc.getElementById('v-recepcion');
    if (!v || v.dataset.bcPf !== '1') return false;
    R.v = v; v.classList.add('pfc');
    montarCond(v); montarCli(v); montarBusc(v); montarNueva(v); decorar(); moverCli();
    var c = doc.getElementById('rxArticulos');
    if (c && typeof MutationObserver === 'function') new MutationObserver(decorar).observe(c, { childList: true });
    return true;
  }
  function tic() {
    if (!R.v) return;
    if (R.v.classList.contains('active')) { pintarCond(); pintarCed(); montarBusc(R.v); montarNueva(R.v); }
    moverCli();
  }
  var n = 0, t = setInterval(function () { if (montar() || ++n > 240) { clearInterval(t); if (R.v) setInterval(tic, 1200); } }, 250);
  var MQ = window.matchMedia ? window.matchMedia('(min-width: 1440px)') : null;
  if (MQ) { var f = function () { setTimeout(moverCli, 0); }; if (MQ.addEventListener) MQ.addEventListener('change', f); else if (MQ.addListener) MQ.addListener(f); }
  window.BayolPfc = { bonito: bonito, decorar: decorar, moverCli: moverCli, _R: R };
})();
