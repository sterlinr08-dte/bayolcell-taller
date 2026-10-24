const { chromium } = require('/opt/node22/lib/node_modules/playwright'); const fs = require('fs'); const S = __dirname, B = S; // stub y servidor viven en esta misma carpeta
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route(/supabase-js|googleapis|gstatic|unpkg|jsdelivr|cdnjs/, r => { const u = r.request().url(); if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') }); r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  await p.goto('http://127.0.0.1:8788/taller.html?f=' + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3500);
  p.on('framenavigated', f => console.log('NAVEGO a', f.url().slice(0,80))); p.on('crash', () => console.log('CRASH')); p.on('console', m => { if (/error|Error/.test(m.text())) console.log('CONSOLA', m.text().slice(0, 160)); });
  const R = await p.evaluate(async () => {
    const out = {}; window.__out = out; const sleep = ms => new Promise(r => setTimeout(r, ms));
    sessionUser = { id: 'u1', nombre: 'Admin', usuario: 'admin', rol: 'admin', _tipo: 'usuario' }; document.body.classList.add('logged-in');
    document.getElementById('app').style.display = 'block'; document.getElementById('login').style.display = 'none'; document.getElementById('appLoader').style.display = 'none';
    document.querySelectorAll('.view.active').forEach(x => x.classList.remove('active')); document.getElementById('v-recepcion').classList.add('active');
    try { _rpInit(); } catch (e) {}
    const toasts = []; toast = (m, t) => toasts.push((t === 'error' ? 'ERR: ' : 'OK: ') + m); toastError = m => toasts.push('ERR: ' + m);
    confirmar = async () => false; logError = () => {};
    const BD = window.__BD; BD.tablas.recepcion_prefacturas = []; BD.tablas.clientes = []; BD.tablas.ordenes_reparacion = []; BD.tablas.equipos = [];
    let num = 118990, invocaciones = [], fallarHistorial = false, demora = 0;
    supabaseClient.functions.invoke = async (fn, { body }) => { invocaciones.push({ fn, body: JSON.parse(JSON.stringify(body)) }); if (demora) await sleep(demora); if (fn === 'infoplus-prefactura-crear') return { data: { ok: true, data: { message: 'Se ha creado correctamente', data: [{ codprefactura: String(body.codprefactura || ++num) }] } } }; return { data: { ok: true } }; };
    const fromReal = supabaseClient.from.bind(supabaseClient);
    supabaseClient.from = t => { const q = fromReal(t); if (t === 'recepcion_prefacturas' && fallarHistorial) { q.then = (res, rej) => Promise.resolve({ data: null, error: { message: 'red caída' } }).then(res, rej); } return q; };
    const g = id => document.getElementById(id); const set = (id, v) => { const el = g(id); if (el) el.value = v; };
    const nuevo = (tel) => { _rpState = { items: [{ cod: 1017, desc: 'TAPA TRASERA PHONE 12 PRO', precio: 300, cant: 1 }], descMonto: 0, codcliente: '1', infoNombre: 'CLIENTE DE CONTADO', codprefactura: null, localId: null, soloPrefactura: true, estado: 'pendiente', nivel: 1 }; _rpUltima = null; set('c_nombre', 'DIONIS'); set('c_whatsapp', tel || ''); set('c_cedula', ''); };
    _rpEnviarWhatsApp = async () => { out.waLlamado = (out.waLlamado || 0) + 1; };

    window.__ctx = { BD, g, set, nuevo, toasts, getInv: () => invocaciones, setInv: v => { invocaciones = v; }, setFallar: v => { fallarHistorial = v; }, setDemora: v => { demora = v; }, sleep };
    return 'setup';
  });
  console.log('setup', R);
  const T = async (nombre, fn) => { try { const r = await p.evaluate(fn); console.log(nombre, JSON.stringify(r)); } catch (e) { console.log(nombre, 'FALLO', e.message.slice(0, 120)); } };
  await T('T1', async () => { const { BD, nuevo, toasts, getInv, setInv } = window.__ctx; const out = {};
    // T1 doble clic
    nuevo(''); setInv([]); toasts.length = 0;
    await Promise.all([_rpGuardar(false), _rpGuardar(false)]);
    out.T1 = { invocaciones: getInv().filter(i => i.fn === 'infoplus-prefactura-crear').length, filas: BD.tablas.recepcion_prefacturas.length, avisoDoble: toasts.some(t => /Ya se está guardando/.test(t)) };
    return out; });
  await T('T2', async () => { const { BD, nuevo, toasts, getInv, setInv, setFallar } = window.__ctx; const out = {};

    // T2 falla el historial → sin éxito falso, pendiente recordado; reintento actualiza sin duplicar
    nuevo(''); setInv([]); toasts.length = 0; localStorage.removeItem('bc_pf_pendientes'); setFallar(true);
    await _rpGuardar(false);
    const numCreado = _rpState.codprefactura;
    out.T2a = { estado: _rpState.estado, exitoFalso: toasts.some(t => /^OK: ✅/.test(t)), avisoError: toasts.some(t => /NO quedó guardada/.test(t)), pendiente: JSON.parse(localStorage.getItem('bc_pf_pendientes') || '[]'), filas: BD.tablas.recepcion_prefacturas.length, botones: [...document.querySelectorAll('#v-recepcion [onclick^="_rpGuardar("]')].map(x => x.disabled) };
    setFallar(false); toasts.length = 0; setInv([]);
    await _rpGuardar(false);
    out.T2b = { estado: _rpState.estado, mismoNum: _rpState.codprefactura === numCreado, invocacionConNum: getInv()[0] && getInv()[0].body.codprefactura, filas: BD.tablas.recepcion_prefacturas.length, pendiente: JSON.parse(localStorage.getItem('bc_pf_pendientes') || '[]'), exito: toasts.some(t => /actualizada/.test(t)) };
    return out; });
  await T('T3', async () => { const { BD, nuevo, set, setDemora, sleep } = window.__ctx; const out = {};

    // T3 cambios durante el envío: el historial guarda la foto
    nuevo('8095551111'); setDemora(300); const pr = _rpGuardar(false); await sleep(50); set('c_whatsapp', '8099999999'); _rpState.items.push({ cod: 2, desc: 'OTRO', precio: 1, cant: 1 }); await pr; setDemora(0);
    const fila = BD.tablas.recepcion_prefacturas[BD.tablas.recepcion_prefacturas.length - 1];
    out.T3 = { codDespues: _rpState && _rpState.codprefactura, telGuardado: fila.telefono_visible, itemsGuardados: fila.items.length, waAuto: window.__out.waLlamado };
    return out; });
  await T('T4', async () => { const out = {}; out.T4cod0 = _rpState && _rpState.codprefactura;

    // T4 PDF: 'blob' no imprime y devuelve Blob; validación del adjunto
    let abrio = 0; window.open = () => { abrio++; return null; }; let qz = 0; _qzConectado = true; qzImprimirHtml = async () => { qz++; return true; }; localStorage.setItem('bayol_qz_tickets', 'X');
    _prefUltima = _rpUltima; const r4 = await imprimirPrefactura('blob');
    out.T4a = { tipo: r4 === null ? 'null (sin jsPDF en el banco)' : (r4 instanceof Blob ? 'Blob' : typeof r4), abrioVentana: abrio, qz };
    // validación: PDF falso (true) debe rechazarse; PDF bueno pasa
    const subidos = []; _waSubirAdjunto = async f => { subidos.push([f.name, f.type, f.size]); return { url: 'u', path: 'p' }; };
    supabaseClient.rpc = async (n) => n === 'whatsapp_lineas_directorio' ? { data: [{ id: 'l1', nombre: 'Reparación', sucursal_nombre: 'Santiago' }] } : { data: { ok: true, abierto: true, id: 'h1' } };
    const waReal = Object.getOwnPropertyDescriptor(window, '_rpEnviarWhatsApp'); // ya reemplazada; probamos _rpPdfBlob + validación por separado
    _rpState.codprefactura = _rpUltima.num; out.T4pre = { cod: _rpState && _rpState.codprefactura, ultima: _rpUltima && _rpUltima.num }; window.bcPfPdfBlob = async () => true; let pdf1 = await _rpPdfBlob(); out.T4b = { pdfFalso: pdf1 === true ? 'true (debe rechazarse en el envío)' : String(pdf1) };
    const bueno = new Blob(['%PDF-1.4\n' + 'x'.repeat(2000)], { type: 'application/pdf' }); window.bcPfPdfBlob = async () => bueno;
    const pdf2 = await _rpPdfBlob(); if (!pdf2) return out; const cab = String.fromCharCode.apply(null, new Uint8Array(await pdf2.slice(0, 5).arrayBuffer())); out.T4c = { esBlob: pdf2 instanceof Blob, cabecera: cab, tam: pdf2.size };
    return out; });
  await T('T5', async () => { const { g } = window.__ctx; const out = {};

    // T5 cargar otra prefactura: no arrastra el teléfono
    _rpAplicarCargaPref({ id: 'a', codprefactura: '1', items: [], nombre_visible: 'A', telefono_visible: '8091112222', documento_visible: '001', codlocalidad: '7' });
    _rpAplicarCargaPref({ id: 'b', codprefactura: '2', items: [], nombre_visible: 'B' });
    out.T5 = { tel: g('c_whatsapp').value, ced: g('c_cedula').value, nombre: g('c_nombre').value };
    return out; });
  await T('T6', async () => { const out = {};

    // T6 reimprimir la seleccionada
    _rpState.codprefactura = '222'; _rpState.items = [{ cod: 1, desc: 'X', precio: 10, cant: 1 }]; _rpUltima = { num: '111', model: {}, ref: {} }; window.imprimirPrefactura = () => true;
    await _rpImprimir(); out.T6 = { imprime: _prefUltima && _prefUltima.num };
    return out; });
  await T('T7', async () => { const out = {};

    // T7 tope de descuento al quitar un artículo
    _rpState = { items: [{ cod: 1, desc: 'A', precio: 500, cant: 1 }, { cod: 2, desc: 'B', precio: 500, cant: 1 }], descMonto: 100, codcliente: '1', nivel: 1, estado: 'pendiente' };
    const antes = _rpProblemasFactura().length; _rpState.items.splice(1, 1); const despues = _rpProblemasFactura();
    out.T7 = { antes, despues: despues.length, msg: (despues[0] || '').slice(0, 60) };
    return out; });
  await T('T8', async () => { const { BD, g, set } = window.__ctx; const out = {};

    // T8 técnico en la orden y espera de la creación
    val = id => (g(id)?.value || '').trim(); getChecked = () => ''; buildAccessPayload = () => null; buildAccountSummary = () => null; hasSensitiveAccessData = () => false; window.loadAll = async () => {}; window.nav = () => {}; window.limpiarRecepcion = () => {}; requireSupabaseOk = () => {};
    if (!g('rxTecnico')) { const s = document.createElement('select'); s.id = 'rxTecnico'; document.getElementById('v-recepcion').appendChild(s); }
    g('rxTecnico').innerHTML = '<option value="tec-77">Michelle</option>'; g('rxTecnico').value = 'tec-77';
    set('c_nombre', 'DIONIS'); set('c_whatsapp', '8095551111'); set('e_modelo', 'IPHONE 12'); set('e_marca', 'APPLE'); set('e_imei', '351111111111111');
    document.documentElement.classList.add('bc-pf'); _rpState = { items: [], codcliente: '1', estado: 'pendiente', nivel: 1 };
    const { toasts } = window.__ctx; toasts.length = 0; window.__stack = ''; logError = (c, e) => { window.__stack = c + ' :: ' + String(e && e.stack).slice(0, 400); }; const res8 = await guardarRecepcion(false); out.T8toasts = toasts.slice(-3); out.T8stack = window.__stack;
    out.T8 = { devolvio: !!res8, tecnico: BD.tablas.ordenes_reparacion[0] && BD.tablas.ordenes_reparacion[0].tecnico_asignado_id };
    return out; });
  console.log('errores', errs);
  await b.close(); })();
