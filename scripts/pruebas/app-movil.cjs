// 27-oct-2026 · App del celular de los empleados (modo «Solo Prefactura y CRM» + taller-app-movil.js). Datos inventados.
// Correr: node scripts/pruebas/servidor.cjs &  y luego  node scripts/pruebas/app-movil.cjs [carpeta-capturas]
const { chromium } = require('playwright'); const fs = require('fs'); const B = __dirname; const SHOTS = process.argv[2] || '';
(async () => { const b = await chromium.launch(); let fallos = 0;
 for (const W of [390, 1280]) { const ctx = await b.newContext({ viewport: { width: W, height: W < 500 ? 844 : 900 } });
  await ctx.route(/supabase-js|googleapis|gstatic|unpkg|cdnjs/, r => { const u = r.request().url(); if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') }); r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
  const p = await ctx.newPage(); const errs = [];
  // Teléfono que todavía no ha decidido los avisos: «default» → al tocar «Activar avisos», «granted».
  await p.addInitScript(() => {
    let perm = 'default'; window.__permPedido = 0;
    Object.defineProperty(Notification, 'permission', { get: () => perm });
    Notification.requestPermission = async () => { window.__permPedido++; perm = 'granted'; return perm; };
    const fake = { endpoint: 'https://fcm.googleapis.com/fcm/send/prueba123', toJSON() { return { endpoint: this.endpoint, keys: { p256dh: 'BPk', auth: 'aut' } }; } };
    window.__subs = 0; let tiene = false;
    PushManager.prototype.getSubscription = async () => tiene ? fake : null;
    PushManager.prototype.subscribe = async (o) => { window.__subs++; window.__appKeyLen = o.applicationServerKey.length; tiene = true; return fake; };
  }); p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  await p.goto('http://127.0.0.1:8788/taller.html?f=' + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3500);
  if (SHOTS) { await p.evaluate(async () => { sessionUser = { id: 'x', nombre: 'Empleada', usuario: 'e', rol: 'servicio', _tipo: 'tecnico', _permisos: { solo_movil: true, recepcion_ver: true, whatsapp_ver: true } }; document.body.classList.add('logged-in'); document.getElementById('app').style.display = 'block'; document.getElementById('login').style.display = 'none'; document.getElementById('appLoader').style.display = 'none'; applyAccessControls(); }); await p.waitForTimeout(2600); await p.screenshot({ path: `${SHOTS}/app-movil-crm-${W}.png` }); }
  const r = await p.evaluate(async () => {
    const out = {}; const w = ms => new Promise(r => setTimeout(r, ms));
    out.sw = !!(await navigator.serviceWorker.getRegistration());
    sessionUser = { id: '22222222-2222-4222-8222-222222222222', nombre: 'Empleada', usuario: 'empleada', rol: 'servicio', _tipo: 'tecnico', _permisos: { solo_movil: true, recepcion_ver: true, whatsapp_ver: true, whatsapp_solo_sucursal: true } };
    document.body.classList.add('logged-in'); document.getElementById('app').style.display = 'block'; document.getElementById('login').style.display = 'none'; document.getElementById('appLoader').style.display = 'none';
    applyAccessControls(); await w(900);
    const vis = [...document.querySelectorAll('.nav button')].filter(b => b.style.display !== 'none' && b.id).map(b => b.id).sort();
    out.menu = vis.join(',');
    out.enCrm = document.getElementById('v-crmLinea').classList.contains('active');
    out.claseModo = document.body.classList.contains('bc-solo-movil');
    out.permisoListado = PERMISOS_DEF.some(g => g.items.some(i => i.id === 'solo_movil'));
    // Píldora de avisos (en Chromium: permiso «default» → «Activar avisos»)
    await w(1800);
    const pil = document.getElementById('bcMovilAvisos');
    out.pildora = !!pil; out.pilTexto = pil ? pil.textContent.trim() : '';
    out.pilBotones = pil ? Math.min(...[...pil.querySelectorAll('button')].map(x => Math.round(x.getBoundingClientRect().height))) : 0;
    out.pilAncho = pil ? Math.round(pil.getBoundingClientRect().width) : 0;
    out.scrollX = document.documentElement.scrollWidth > innerWidth + 1;
    // Tocar «Activar avisos»: pide permiso, se suscribe con la clave pública y guarda a nombre de la persona
    const llamadas = []; const rpc0 = supabaseClient.rpc;
    supabaseClient.rpc = (n, a) => { if (n === 'push_clave_publica') return Promise.resolve({ data: 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U', error: null }); if (n === 'push_suscribir') { llamadas.push(a); return Promise.resolve({ data: true, error: null }); } return rpc0(n, a); };
    pil && pil.querySelector('.bcm-si') && pil.querySelector('.bcm-si').click(); await w(800);
    out.permPedido = window.__permPedido; out.subs = window.__subs; out.appKeyLen = window.__appKeyLen;
    out.guardo = llamadas.length === 1 && llamadas[0].p_endpoint.startsWith('https://') && llamadas[0].p_p256dh === 'BPk' && /navegador|app/.test(llamadas[0].p_equipo);
    out.pilSeFue = !document.getElementById('bcMovilAvisos');
    supabaseClient.rpc = rpc0;
    // Prefactura sigue disponible
    nav('recepcion'); await w(600); out.enPref = document.getElementById('v-recepcion').classList.contains('active');
    nav('crmLinea'); await w(400);
    // Ocultar la píldora: no vuelve
    out.ocultaSeQueda = !document.getElementById('bcMovilAvisos'); // ya activados: no vuelve a salir
    // Abrir un chat desde un aviso: hilo inexistente → aviso amable, sin errores
    await window.bcMovilAbrirHilo('00000000-0000-4000-8000-000000000000'); out.abrirSinError = true;
    // Un rol normal (sin solo_movil) no cambia
    sessionUser._permisos = { recepcion_ver: true, whatsapp_ver: true, ordenes_ver: true }; document.body.classList.remove('bc-solo-movil'); applyAccessControls(); await w(300);
    out.normalVeOrdenes = document.getElementById('menu-ordenes').style.display !== 'none';
    out.normalSinClase = !document.body.classList.contains('bc-solo-movil');
    return out;
  });
  const ok = { sw: r.sw, menu: r.menu === 'menu-crm,menu-recepcion', enCrm: r.enCrm, claseModo: r.claseModo, permisoListado: r.permisoListado, pildora: r.pildora && /Activar avisos/.test(r.pilTexto), pil44: r.pilBotones >= 44, pidePermiso: r.permPedido === 1, seSuscribe: r.subs === 1 && r.appKeyLen === 65, guardaEnBase: r.guardo, pildoraSeVa: r.pilSeFue, sinScrollX: !r.scrollX, enPref: r.enPref, ocultaSeQueda: r.ocultaSeQueda, abrirSinError: r.abrirSinError, normalVeOrdenes: r.normalVeOrdenes, normalSinClase: r.normalSinClase, sinErrores: errs.length === 0 };
  for (const [k, v] of Object.entries(ok)) { if (!v) fallos++; console.log(`${W}px ${v ? '✔' : '✘'} ${k}`); }
  if (!ok.pildora) console.log('   píldora:', r.pildora, r.pilTexto); if (!ok.menu) console.log('   menú visto:', r.menu); if (errs.length) console.log('   errores:', errs);
  await ctx.close(); }
 await b.close(); console.log(fallos ? `FALLOS: ${fallos}` : 'TODO BIEN'); process.exit(fallos ? 1 : 0);
})();
