// 24-oct-2026 · Pestaña «Solicitudes» del CRM (crm-solicitudes.js). Datos inventados; no toca Supabase real.
// Correr: node scripts/pruebas/servidor.cjs &  y luego  node scripts/pruebas/solicitudes-crm.cjs [carpeta-capturas]
const { chromium } = require('playwright'); const fs = require('fs'); const B = __dirname; const SHOTS = process.argv[2] || '';
(async () => { const b = await chromium.launch(); let fallos = 0;
 for (const W of [390, 1280]) { const ctx = await b.newContext({ viewport: { width: W, height: W < 500 ? 844 : 900 } });
  await ctx.route(/supabase-js|googleapis|gstatic|unpkg|cdnjs/, r => { const u = r.request().url(); if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') }); r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  await p.addInitScript(() => { try { localStorage.setItem('bayol_subtab_crmlinea', 'mensajes'); } catch (e) {} });
  await p.goto('http://127.0.0.1:8788/taller.html?f=' + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3500);
  const r = await p.evaluate(async (W) => {
    const out = {}; const w = ms => new Promise(r => setTimeout(r, ms));
    sessionUser = { id: '11111111-1111-4111-8111-111111111111', nombre: 'Admin', usuario: 'admin', rol: 'admin', _tipo: 'usuario' }; document.body.classList.add('logged-in'); document.getElementById('app').style.display = 'block'; document.getElementById('login').style.display = 'none'; document.getElementById('appLoader').style.display = 'none';
    out.capa = window.__bcSolicitudes || 'NO CARGÓ';
    const h = (n) => new Date(Date.now() - n * 3600000).toISOString();
    const fila = (o) => Object.assign({ estado: 'respondido', canal: 'web', linea_id: 'l1', hilo_id: 'h3', seguimiento: 'recibida', seguimiento_historial: [], vence_en: null }, o);
    __BD.tablas.fin_solicitudes_whatsapp = [
      fila({ id: 's7', numero: 7, sucursal_id: 'suc-sti', sucursal_nombre: 'Santiago', enviado_por_nombre: 'Loribel Ventura', equipo: 'iPhone 13 128GB', precio: 38500, telefono: '18095551234', creado_en: h(2), respondido_en: h(1), datos: { nombres: 'Juan Pérez', cedula: '00112345678', telefono: '8095551234', provincia: 'Santiago', municipio: 'Santiago', sector: 'Los Jardines', calle: '5', casa: '12', equipo: 'iPhone 13 128GB', precio: 'RD$ 38,500.00', plazo: '12', referencia: 'Santiago · Loribel Ventura · iPhone 13 128GB RD$ 38,500.00' } }),
      fila({ id: 's6', numero: 6, sucursal_nombre: 'Moca', enviado_por_nombre: 'Carlos Peña', equipo: 'Samsung A55 256GB', precio: 24900, creado_en: h(30), respondido_en: h(29), seguimiento: 'banco', seguimiento_historial: [{ paso: 'banco', en: h(28), por: 'Carlos Peña' }], datos: { nombres: 'María Rodríguez', cedula: '03104567891', telefono: '8297001122', equipo: 'Samsung A55 256GB', precio: 'RD$ 24,900.00', plazo: '18' } }),
      fila({ id: 's5', numero: 5, sucursal_nombre: 'Navarrete', enviado_por_nombre: 'Yudelka Reyes', equipo: 'Redmi Note 14', precio: 11500, creado_en: h(50), respondido_en: h(49), seguimiento: 'aprobada', datos: { nombres: 'Pedro Jiménez', cedula: '40222334456', telefono: '8493339988', equipo: 'Redmi Note 14', precio: 'RD$ 11,500.00', plazo: '6' } }),
      fila({ id: 's4', numero: 4, sucursal_nombre: 'Santiago', enviado_por_nombre: 'Loribel Ventura', equipo: 'Televisor LG 55"', precio: 31000, creado_en: h(90), respondido_en: h(89), seguimiento: 'entregada', datos: { nombres: 'Rosa Martínez', cedula: '03155566677', equipo: 'Televisor LG 55"', precio: 'RD$ 31,000.00', plazo: '12' } }),
      fila({ id: 's8', numero: 8, estado: 'enviado', sucursal_nombre: 'Santiago', enviado_por_nombre: 'Loribel Ventura', equipo: 'iPhone 15', precio: 52000, telefono: '18294440000', creado_en: h(0.5), vence_en: new Date(Date.now() + 86400000).toISOString(), datos: null }),
      fila({ id: 's9', numero: 9, estado: 'enviado', sucursal_nombre: 'Moca', equipo: 'Vencida', precio: 1, creado_en: h(300), vence_en: h(100), datos: null }),
    ];
    const llamadas = []; const rpc0 = supabaseClient.rpc;
    supabaseClient.rpc = (n, a) => { if (n === 'fin_solicitud_seguimiento') { llamadas.push(a); const s = __BD.tablas.fin_solicitudes_whatsapp.find(x => x.id === a.p_id); s.seguimiento_historial = (s.seguimiento_historial || []).concat([{ paso: a.p_seguimiento, de: s.seguimiento, en: new Date().toISOString(), por: 'Admin' }]); s.seguimiento = a.p_seguimiento; return Promise.resolve({ data: Object.assign({}, s), error: null }); } return rpc0(n, a); };
    nav('crmLinea'); await w(1500);
    if (typeof _crmLineaActualId === 'undefined' || !_crmLineaActualId) { seleccionarLineaCRM('l1', 'Santiago', 'Reparación'); await w(1500); }
    const tab = document.getElementById('crmLineaTabSolicitudes');
    out.tab = !!tab; out.tabTexto = tab ? tab.textContent.trim() : ''; out.tabAlto = tab ? Math.round(tab.getBoundingClientRect().height) : 0; out.tabAncho = tab ? Math.round(tab.getBoundingClientRect().width) : 0;
    out.tabsRecortadas = [...document.querySelectorAll('#v-crmLinea .crm-tab-seg')].filter(b => b.scrollWidth > b.clientWidth + 1).map(b => b.textContent.trim());
    tab.click(); await w(700);
    const panel = document.getElementById('crmLinea-solicitudes');
    out.panelVisible = panel && getComputedStyle(panel).display !== 'none';
    out.mensajesOculto = getComputedStyle(document.getElementById('crmLinea-mensajes')).display === 'none';
    out.tabOn = tab.classList.contains('on');
    out.badge = document.getElementById('crmSolTabBadge').textContent;
    out.filas = panel.querySelectorAll('.bcsol-fila').length; // 5 (la vencida no sale)
    out.sub = (panel.querySelector('.bcsol-sub') || {}).textContent || '';
    out.chipsMin = Math.min(...[...panel.querySelectorAll('.bcsol-chip')].map(c => Math.round(c.getBoundingClientRect().height)));
    out.buscaAlto = Math.round(panel.querySelector('.bcsol-busca input').getBoundingClientRect().height); out.buscaLetra = parseFloat(getComputedStyle(panel.querySelector('.bcsol-busca input')).fontSize);
    out.mayusculas = [...panel.querySelectorAll('.bcsol-chip,.bcsol-sub,.bcsol-pill')].some(e => getComputedStyle(e).textTransform === 'uppercase');
    // Filtros
    panel.querySelector('[data-bcsol-suc="Moca"]').click(); await w(80); out.filtroMoca = panel.querySelectorAll('.bcsol-fila').length;
    panel.querySelector('[data-bcsol-suc="Todas"]').click(); await w(80);
    panel.querySelector('[data-bcsol-est="banco"]').click(); await w(80); out.filtroBanco = panel.querySelectorAll('.bcsol-fila').length;
    panel.querySelector('[data-bcsol-est="todas"]').click(); await w(80);
    const inp = panel.querySelector('.bcsol-busca input'); inp.value = '001-1234567'; inp.dispatchEvent(new Event('input', { bubbles: true })); await w(80); out.buscarCedula = panel.querySelectorAll('.bcsol-fila').length;
    const inp2 = panel.querySelector('.bcsol-busca input'); inp2.value = ''; inp2.dispatchEvent(new Event('input', { bubbles: true })); await w(80);
    out._shotLista = true;
    return out;
  }, W);
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/solicitudes-lista-${W}.png` });
  const r2 = await p.evaluate(async () => {
    const out = {}; const w = ms => new Promise(r => setTimeout(r, ms));
    const panel = document.getElementById('crmLinea-solicitudes');
    panel.querySelector('[data-bcsol-id="s7"]').click(); await w(450);
    const hoja = document.querySelector('.bcsol-hoja');
    out.hojaAbierta = hoja && hoja.classList.contains('on');
    out.titulo = hoja.querySelector('#bcsolTit').textContent;
    out.cedula = hoja.textContent.includes('001-1234567-8'); out.filasCortadas = [...hoja.querySelectorAll('.bcsol-rec')].filter(x => x.scrollHeight > x.clientHeight + 1).length; out.cerrarIcono = !!hoja.querySelector('.x svg'); out.tel = hoja.textContent.includes('809-555-1234');
    out.botonesMin = Math.min(...[...hoja.querySelectorAll('button')].map(b => Math.round(b.getBoundingClientRect().height)));
    out.pasos = [...hoja.querySelectorAll('.bcsol-paso')].map(b => b.getAttribute('data-bcsol-paso'));
    return out;
  });
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/solicitudes-ficha-${W}.png` });
  const r3 = await p.evaluate(async () => {
    const out = {}; const w = ms => new Promise(r => setTimeout(r, ms));
    const hoja = document.querySelector('.bcsol-hoja');
    hoja.querySelector('[data-bcsol-paso="banco"]').click(); await w(300);
    hoja.querySelector('[data-bcsol-paso="aprobada"]').click(); await w(300);
    out.estadoFinal = __BD.tablas.fin_solicitudes_whatsapp.find(x => x.id === 's7').seguimiento;
    // Cancelar otra solicitud (la No. 5) directo desde «Recibida»/«Aprobada», sin pasar por el banco
    const hoja2 = hoja; window._bcsolVer('s5'); await w(400); hoja2.querySelector('[data-bcsol-paso="cancelada"]').click(); await w(300);
    out.cancelada = __BD.tablas.fin_solicitudes_whatsapp.find(x => x.id === 's5').seguimiento;
    window._bcsolVer('s7'); await w(400);
    out.historial = __BD.tablas.fin_solicitudes_whatsapp.find(x => x.id === 's7').seguimiento_historial.length;
    out.avisoTexto = (hoja.querySelector('.bcsol-msg') || {}).textContent || '';
    out.botonAviso = !!hoja.querySelector('[data-bcsol-act="avisar"]');
    out.badgeTras = document.getElementById('crmSolTabBadge').textContent;
    hoja.querySelector('[data-bcsol-act="avisar"]').click(); for (let i = 0; i < 60 && !((document.getElementById('waTexto') || {}).value); i++) await w(200);
    out.hilosCargados = typeof _waHilos !== 'undefined' ? _waHilos.length : -1; out.lineaActual = typeof _crmLineaActualId !== 'undefined' ? _crmLineaActualId : null;
    out.chatAbierto = typeof _waHiloId !== 'undefined' ? _waHiloId : null;
    out.cajaTexto = (document.getElementById('waTexto') || {}).value || '';
    out.tabMensajesOn = document.getElementById('crmLineaTabWa').classList.contains('on');
    out.panelSolOculto = getComputedStyle(document.getElementById('crmLinea-solicitudes')).display === 'none';
    // Tarjeta del chat con «Ver seguimiento»
    const html = window._waBurbujaMedia({ id: 'mx', direccion: 'in', tipo_contenido: 'flow_respuesta', meta: { flow: { solicitud_id: 's6', datos: { nombres: 'María', cedula: '03104567891', equipo: 'A55', precio: 'RD$ 24,900.00' } } } });
    out.verEnTarjeta = /data-bcsol-ver="s6"/.test(html);
    const d = document.createElement('div'); d.innerHTML = html; document.body.appendChild(d);
    d.querySelector('[data-bcsol-ver]').click(); await w(500);
    out.verAbre = document.querySelector('.bcsol-hoja').classList.contains('on') && document.querySelector('#bcsolTit').textContent.includes('6');
    d.remove();
    return out;
  });
  const R = Object.assign({}, r, r2, r3);
  const ok = R.capa !== 'NO CARGÓ' && R.tab && R.tabTexto.startsWith('Solicitudes') && R.tabsRecortadas.length === 0 && R.panelVisible && R.mensajesOculto && R.tabOn && R.badge === '2' && R.filas === 5 &&
    R.chipsMin >= 44 && R.buscaAlto >= 48 && R.buscaLetra >= 16 && !R.mayusculas && R.filtroMoca === 1 && R.filtroBanco === 1 && R.buscarCedula === 1 &&
    R.pasos.join() === 'recibida,banco,aprobada,entregada,no_aprobada,cancelada' && R.cancelada === 'cancelada' && R.hojaAbierta && R.filasCortadas === 0 && R.cerrarIcono && R.titulo === 'Solicitud No. 7' && R.cedula && R.tel && R.botonesMin >= 44 &&
    R.estadoFinal === 'aprobada' && R.historial === 2 && R.botonAviso && /aprobó su solicitud del iPhone 13/.test(R.avisoTexto) && R.badgeTras === '1' &&
    R.chatAbierto === 'h3' && /aprobó/.test(R.cajaTexto) && R.tabMensajesOn && R.panelSolOculto && R.verEnTarjeta && R.verAbre;
  if (!ok) fallos++;
  console.log(W, ok ? 'OK' : 'FALLO', JSON.stringify(R), 'errores', errs.filter(e => !/net::|Failed/.test(e)));
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/solicitudes-chat-${W}.png` });
  await ctx.close(); }
 await b.close(); process.exit(fallos ? 1 : 0); })();
