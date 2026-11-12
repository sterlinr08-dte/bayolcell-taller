// 12-nov-2026 · «Curvo» (bc-curvo.js): mismas pantallas con esquinas más redondas en todo el sistema.
// Correr: PUERTO=8788 node scripts/pruebas/servidor.cjs &  y luego  node scripts/pruebas/curvo.cjs
const { chromium } = require('playwright'); const fs = require('fs'); const B = __dirname; const PUERTO = process.env.PUERTO || 8788;
(async () => { const b = await chromium.launch(); let fallos = 0; const med = {};
 const c = (n, ok, d) => { console.log((ok ? 'OK   ' : 'FALLO') + ' ' + n + (d !== undefined ? ' · ' + JSON.stringify(d) : '')); if (!ok) fallos++; };
 for (const off of [true, false]) for (const W of [390, 1280]) {
  const ctx = await b.newContext({ viewport: { width: W, height: W < 500 ? 844 : 900 } });
  await ctx.addInitScript(o => { try { if (o) localStorage.setItem('bc_curvo_off', '1'); else localStorage.removeItem('bc_curvo_off'); } catch (e) {} }, off);
  await ctx.route('**/*', r => { const u = r.request().url(); if (u.startsWith('http://127.0.0.1')) return r.continue(); if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(B + '/supabase-stub.js', 'utf8') }); r.fulfill({ status: 200, contentType: /css/.test(u) ? 'text/css' : 'application/javascript', body: '' }); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  await p.goto(`http://127.0.0.1:${PUERTO}/taller.html?f=` + Date.now(), { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(3000);
  const m = await p.evaluate(() => { document.body.classList.add('logged-in'); document.getElementById('app').style.display = 'block'; document.getElementById('login').style.display = 'none';
    const mk = (tag, cls, st) => { const e = document.createElement(tag); if (cls) e.className = cls; if (st) e.setAttribute('style', st); if (tag === 'input') e.type = cls === 'ck' ? 'checkbox' : 'text'; document.getElementById('app').appendChild(e); return e; };
    const r = e => getComputedStyle(e).borderTopLeftRadius, o = {};
    o.card = r(mk('div', 'card')); o.btn = r(mk('button', 'btn')); o.input = r(mk('input', '')); o.kpi = r(mk('div', 'kpi-box')); const mb = mk('div', 'modal-box'); o.modal = r(mb);
    o.inline8 = r(mk('div', '', 'border-radius:8px;height:20px')); o.inlineFin = r(mk('div', '', 'height:20px;border-radius: 12px')); const dos = mk('div', '', 'border-radius:12px 12px 0 0;height:20px'); o.dos = getComputedStyle(dos).borderRadius;
    o.pildora = r(mk('div', '', 'border-radius:999px;height:20px')); o.ck = r(mk('input', 'ck')); o.clase = document.documentElement.classList.contains('bc-curvo'); const sb = document.querySelector('aside.sidebar'), q = sb.getBoundingClientRect(); o.barra = [Math.round(q.left), Math.round(q.top), Math.round(innerHeight - q.bottom), getComputedStyle(sb).borderTopLeftRadius]; o.api = !!window.BayolCurvo;
    // Una capa que agrega estilos después también se redondea
    const st = document.createElement('style'); st.textContent = '.zz-tarde{border-radius:10px}'; document.head.appendChild(st); const t = mk('div', 'zz-tarde');
    return new Promise(res => setTimeout(() => { o.tarde = r(t); const d = document.documentElement; o.sw = d.scrollWidth - d.clientWidth; res(o); }, 600)); });
  med[(off ? 'antes' : 'curvo') + W] = m; const t = `[${W}${off ? ' apagada' : ''}]`;
  const nuevo = v => { const x = parseFloat(v); return (x < 4 || x >= 100 ? x : x <= 6 ? 10 : x <= 9 ? 14 : x <= 12 ? 18 : x <= 16 ? 24 : x <= 22 ? 28 : Math.max(x, 32)) + 'px'; }, a = med['antes' + W];
  if (off) c(`${t} apagada: la capa no entra y nada cambia`, !m.clase && !m.api && m.inline8 === '8px' && m.tarde === '10px', [m.card, m.btn, m.input]);
  else { c(`${t} tarjeta, botón, campo, cifra y ventana suben según la tabla`, m.clase && ['card', 'btn', 'input', 'kpi', 'modal'].every(k => m[k] === nuevo(a[k]) && parseFloat(m[k]) > parseFloat(a[k])), ['card', 'btn', 'input', 'kpi', 'modal'].map(k => a[k] + '→' + m[k]));
    c(`${t} estilos dentro de la etiqueta: 8→14 y 12→18; «12px 12px 0 0» no se toca`, m.inline8 === '14px' && m.inlineFin === '18px' && m.dos === '12px 12px 0px 0px', [m.inline8, m.inlineFin, m.dos]);
    c(`${t} píldoras y casillas quedan igual; lo agregado después también se curva (10→18)`, m.pildora === '999px' && m.ck === med['antes' + W].ck && m.tarde === '18px', [m.pildora, m.ck, m.tarde]);
    c(`${t} barra lateral curva y flotando` , m.barra[3] === '28px' && (W < 500 ? m.barra[1] === 10 && m.barra[2] === 10 : m.barra[0] === 12 && m.barra[1] === 12 && m.barra[2] === 12), m.barra);
    c(`${t} sin barra de lado`, m.sw <= 0, m.sw); }
  c(`${t} sin errores`, errs.length === 0, errs); await ctx.close(); }
 await b.close(); console.log(fallos ? `\n${fallos} FALLO(S)` : '\nTodo OK'); process.exit(fallos ? 1 : 0);
})();
