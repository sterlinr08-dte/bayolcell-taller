/* BAYOL CELL · Estado real de la impresora antes y después de imprimir (dueño, 2-nov-2026: «no quiere imprimir desde la PC,
   solo simula que imprime»).
   Diagnóstico: QZ Tray sí entregaba el trabajo a la impresora de tickets correcta (firmas en qz-firmar a las 9:50–10:00) y el
   aviso decía «impresa en …», pero Windows lo dejaba en la cola (impresora sin conexión, en pausa, sin papel…). El aviso no
   miraba la impresora.
   Esta capa envuelve qzImprimirHtml, qzImprimirHtmlComoImagen y qzImprimirRaw (taller-app.js) sin tocarlas:
   · ANTES: le pregunta a la impresora cómo está (QZ: printers.startListening + getStatus, ≤ 1.5 s). Si está sin conexión,
     en pausa, sin papel, atascada, con la tapa abierta o con error, NO manda el trabajo y avisa en rojo qué pasa y qué hacer.
     Devuelve false: quien llama sigue su camino de siempre (la prefactura abre la ventana para elegir otra impresora).
   · DESPUÉS: vigila el trabajo 20 s. Si Windows lo marca con error, sin papel, bloqueado o sin conexión, avisa en rojo
     «No salió» aunque ya haya salido el aviso verde.
   · Si QZ no informa el estado (versión vieja, impresora que no lo da) no cambia nada: imprime como antes.
   Apagar: localStorage.bc_impest_off = '1' o window.BC_IMPEST = false. */
(function () {
  'use strict';
  try { if (localStorage.getItem('bc_impest_off') === '1' || window.BC_IMPEST === false) return; } catch (e) {}

  var MALOS = {
    OFFLINE: 'está sin conexión (apagada o desconectada)',
    NOT_AVAILABLE: 'no está disponible (apagada o desconectada)',
    PAUSED: 'está en pausa en Windows',
    PAPER_OUT: 'no tiene papel',
    PAPER_JAM: 'tiene el papel atascado',
    PAPER_PROBLEM: 'tiene un problema con el papel',
    DOOR_OPEN: 'tiene la tapa abierta',
    USER_INTERVENTION: 'necesita que alguien la revise',
    OUTPUT_BIN_FULL: 'tiene la bandeja llena',
    NO_TONER: 'no tiene tinta',
    ERROR: 'tiene un error',
    PENDING_DELETION: 'se está quitando de Windows'
  };
  var MALOS_TRABAJO = {
    ERROR: 'dio error', OFFLINE: 'la impresora está sin conexión', PAPEROUT: 'la impresora no tiene papel', PAPER_OUT: 'la impresora no tiene papel',
    BLOCKED: 'quedó bloqueado', USER_INTERVENTION: 'la impresora necesita que alguien la revise', PAUSED: 'quedó en pausa',
    DELETED: 'se borró de la cola', RESTART: 'se reinició'
  };
  var CONSEJO = 'Revise que esté encendida, con papel y con el cable puesto. En Windows: Impresoras y escáneres → la impresora → Abrir cola → ' +
    'Impresora → quite «Pausar la impresión» y «Usar impresora sin conexión» y cancele lo que esté esperando.';

  function hay() {
    try { return typeof qz !== 'undefined' && qz && qz.printers && typeof qz.printers.getStatus === 'function' &&
      typeof qz.printers.startListening === 'function' && typeof qz.printers.setPrinterCallbacks === 'function' && qz.websocket.isActive(); } catch (e) { return false; }
  }
  function aviso(txt) { try { toast(txt, 'error'); } catch (e) { try { console.warn(txt); } catch (e2) {} } }

  // ---- Un solo receptor de eventos de QZ, repartido entre quienes esperan ----
  var oyentes = [], escuchando = {};
  function repartir(evt) {
    var lista = Array.isArray(evt) ? evt : [evt];
    lista.forEach(function (e) { if (e) oyentes.slice().forEach(function (f) { try { f(e); } catch (er) {} }); });
  }
  var instalado = false;
  function instalar() { if (instalado) return; instalado = true; try { qz.printers.setPrinterCallbacks(repartir); } catch (e) { instalado = false; } }
  function escuchar(nombre) {
    if (escuchando[nombre]) return escuchando[nombre];
    escuchando[nombre] = Promise.resolve().then(function () { return qz.printers.startListening(nombre, { jobData: false }); })
      .catch(function () { escuchando[nombre] = null; throw new Error('sin_estado'); });
    return escuchando[nombre];
  }
  function mismo(a, b) { return String(a || '').toLowerCase() === String(b || '').toLowerCase(); }
  function codigo(e) { return String(e.statusText || e.statusCode || '').toUpperCase().replace(/\s+/g, '_'); }

  /** Pregunta el estado. Resuelve { malo: 'texto' } si hay un problema, {} si está bien o si QZ no lo informa. */
  function revisar(nombre) {
    if (!nombre || !hay()) return Promise.resolve({});
    instalar();
    return new Promise(function (fin) {
      var vistos = [], listo = false;
      function oir(e) {
        if ((e.eventType && e.eventType !== 'PRINTER') || !mismo(e.printerName, nombre)) return;
        vistos.push(codigo(e));
      }
      function cerrar() {
        if (listo) return; listo = true;
        oyentes = oyentes.filter(function (f) { return f !== oir; });
        var malo = null;
        for (var i = 0; i < vistos.length && !malo; i++) if (MALOS[vistos[i]]) malo = MALOS[vistos[i]];
        fin(malo ? { malo: malo, codigos: vistos } : { codigos: vistos });
      }
      oyentes.push(oir);
      escuchar(nombre).then(function () { return qz.printers.getStatus(); })
        .then(function () { setTimeout(cerrar, 600); }, cerrar);
      setTimeout(cerrar, 1500);
    });
  }

  /** Vigila el trabajo recién mandado: si Windows lo marca con un problema, avisa que no salió. */
  function vigilar(nombre) {
    if (!nombre || !hay() || !escuchando[nombre]) return;
    var avisado = false, desde = Date.now();
    function oir(e) {
      // Solo el estado del TRABAJO: el estado de la impresora lo mira revisar() antes del próximo envío.
      if (avisado || e.eventType !== 'JOB' || !mismo(e.printerName, nombre) || Date.now() - desde > 20000) return;
      var malo = MALOS_TRABAJO[codigo(e)];
      if (!malo && /^(ERROR|FATAL)$/i.test(e.severity || '')) malo = 'dio error';
      if (!malo) return;
      avisado = true;
      aviso('No salió el papel: el trabajo ' + malo + '. ' + CONSEJO);
    }
    oyentes.push(oir);
    setTimeout(function () { oyentes = oyentes.filter(function (f) { return f !== oir; }); }, 20000);
  }

  function nombrePara(tipo) {
    try { return tipo === 'tickets' ? qzImpresoraTickets() : qzImpresoraLabels(); } catch (e) { return ''; }
  }

  // ---- Envolver las tres funciones de impresión por QZ (los argumentos no cambian) ----
  function envolver(nombreFn, posTipo) {
    var orig = window[nombreFn];
    if (typeof orig !== 'function' || orig._bcImpEst) return;
    var nueva = function () {
      var args = arguments, impresora = nombrePara(args[posTipo]);
      return revisar(impresora).then(function (r) {
        if (r.malo) {
          aviso('No se imprimió: la impresora ' + impresora + ' ' + r.malo + '. ' + CONSEJO);
          return false;
        }
        return Promise.resolve(orig.apply(this, args)).then(function (ok) { if (ok) vigilar(impresora); return ok; });
      });
    };
    nueva._bcImpEst = true;
    window[nombreFn] = nueva;
  }
  function armar() {
    envolver('qzImprimirHtml', 4);            // (html, anchoMm, altoMm, copias, tipo)
    envolver('qzImprimirHtmlComoImagen', 4);  // (elemento, anchoMm, altoMm, copias, tipo)
    envolver('qzImprimirRaw', 1);             // (comandos, tipo)
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', armar); else armar();
  window.bcImpresoraEstado = { revisar: revisar, armar: armar };
})();
