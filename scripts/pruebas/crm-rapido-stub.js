// Simulador de Supabase para crm-rapido.cjs (10-nov-2026). Como supabase-stub.js, pero con orden, límite y rango, espera
// configurable por tabla (window.__LAT / window.__LAT_POR), bitácora de consultas (window.__Q, con la función que la pidió)
// y tiempo real simulado (window.__rt). Datos inventados: window.__CRM_CFG = { hilos, msgs, lat }. No toca nada real.
(function(){
  const now = Date.now();
  const CFG = window.__CRM_CFG || { hilos: 300, msgs: 500, lat: 0 };
  const D = window.__BD = { tablas: {}, canales: [], canalesTotal: 0, removidos: 0 };
  const Q = window.__Q = [];
  const hilos = [], mensajes = [];
  for (let i = 0; i < CFG.hilos; i++) {
    const id = 'h' + (i + 1);
    const t = now - i * 600000;
    hilos.push({ id, linea_id: 'l1', nombre_perfil: 'Cliente ' + (i + 1), telefono_e164: '+1809555' + String(1000 + i), creado_en: new Date(t - 86400000).toISOString(), ultimo_mensaje_at: new Date(t).toISOString(), ultimo_inbound_at: new Date(t).toISOString(), ultima_respuesta_humana_at: i % 3 ? new Date(t - 60000).toISOString() : null, ultimo_mensaje_preview: 'Mensaje de prueba ' + (i + 1), no_leidos_count: i % 4 === 0 ? 2 : 0, asignado_id: null, asignado_tipo: null, cliente_id: null, etiquetas: (i % 9 === 0 ? ['e1'] : []), fijado_en: (i === 70 || i === 150 ? new Date(t).toISOString() : null), estado: (i >= 280 ? 'archivado' : 'abierto'), silenciado: false });
    const n = i === 0 ? CFG.msgs : 14;
    for (let k = 0; k < n; k++) {
      const m = { id: id + 'm' + k, hilo_id: id, direccion: k % 2 ? 'out' : 'in', tipo_contenido: 'text', cuerpo: 'Texto ' + k + ' del chat ' + (i + 1) + (k % 7 === 0 ? ' con un poco más de contenido para que la burbuja ocupe dos líneas en el teléfono 809-555-1234' : ''), estado: k % 2 ? 'read' : null, wa_message_id: 'wamid.' + id + '.' + k, creado_en: new Date(t - (n - k) * 60000).toISOString() };
      if (i === 0 && k % 10 === 3) { m.tipo_contenido = 'imagen'; m.media_path = 'l1/' + id + '/img' + k + '.jpg'; m.cuerpo = null; }
      if (i === 0 && k % 25 === 5) { m.tipo_contenido = 'audio'; m.media_path = 'l1/' + id + '/aud' + k + '.ogg'; m.cuerpo = null; }
      mensajes.push(m);
    }
  }
  D.tablas.whatsapp_hilos = hilos; D.tablas.whatsapp_mensajes = mensajes;
  D.tablas.whatsapp_etiquetas = [{ id: 'e1', nombre: 'Garantía', color: '#16a34a', orden: 1 }, { id: 'e2', nombre: 'Financiamiento', color: '#2563eb', orden: 2 }];
  D.tablas.sucursales = [{ id: 's1', nombre: 'Santiago', whatsapp_lineas: [{ id: 'l1', nombre: 'Reparación', activo: true, oculta_crm: false }] }];
  D.tablas.whatsapp_lineas = [{ id: 'l1', nombre: 'Reparación', whatsapp_numero: '18095550000', activo: true, conectada: true, sucursal: 'Santiago' }];
  const lat = (tabla) => { const o = window.__LAT_POR || {}; const ms = o[tabla] != null ? o[tabla] : (window.__LAT != null ? window.__LAT : CFG.lat); return new Promise(r => ms ? setTimeout(r, ms) : r()); };
  function pila() { try { return (new Error().stack || '').split('\n').slice(1).filter(l => !/stub-aud|at pila|at builder|Object\.from /.test(l)).filter(l => !/supabase-js/.test(l)).slice(0, 9).map(l => { const m = l.match(/at (?:async )?(\S+)? ?\(?(?:https?:\/\/[^/]+\/)?([^?:)]+)(?:\?[^:]*)?:(\d+):\d+\)?/); return m ? ((m[1] && !/^https?:/.test(m[1]) ? m[1] + '@' : '') + m[2] + ':' + m[3]) : l.trim().slice(0, 60); }).join(' < '); } catch (e) { return ''; } }
  function builder(tabla) {
    const st = { pila: pila(), filtros: [], head: false, count: null, op: 'select', cambios: null, uno: false, orden: [], lim: null, rango: null, cols: '*', desc: [] };
    const b = {};
    const chain = (f) => { f(); return b; };
    b.select = (cols, opt) => chain(() => { if (st.op === 'select') st.cols = cols || '*'; if (opt && opt.head) st.head = true; if (opt && opt.count) st.count = true; });
    b.eq = (c, v) => chain(() => { st.desc.push(c + '='); st.filtros.push(r => String(r[c]) === String(v)); });
    const S = x => Array.isArray(x) ? JSON.stringify(x) : String(x);
    b.neq = (c, v) => chain(() => st.filtros.push(r => S(r[c]) !== String(v)));
    b.in = (c, vs) => chain(() => { st.desc.push(c + ' in'); st.filtros.push(r => vs.map(String).includes(String(r[c]))); });
    b.is = (c, v) => chain(() => st.filtros.push(r => r[c] == v));
    b.lt = (c, v) => chain(() => { st.desc.push(c + '<'); st.filtros.push(r => r[c] < v); });
    b.gt = (c, v) => chain(() => { st.desc.push(c + '>'); st.filtros.push(r => r[c] > v); });
    b.gte = (c, v) => chain(() => st.filtros.push(r => r[c] >= v));
    b.lte = (c, v) => chain(() => st.filtros.push(r => r[c] <= v));
    b.ilike = (c, v) => chain(() => { st.desc.push(c + ' ilike ' + v); const p = String(v).replace(/%/g, '').toLowerCase(); st.filtros.push(r => String(r[c] || '').toLowerCase().includes(p)); });
    b.like = b.ilike;
    b.order = (c, o) => chain(() => st.orden.push([c, !(o && o.ascending === false)]));
    b.limit = (n) => chain(() => { st.lim = n; });
    b.range = (a, z) => chain(() => { st.rango = [a, z]; });
    const term = (t) => { t = t.trim(); let m;
      if ((m = t.match(/^and\((.*)\)$/))) { const ps = m[1].split(',').map(term); return r => ps.every(f => f(r)); }
      if ((m = t.match(/^(\w+)\.not\.is\.null$/))) return r => r[m[1]] != null;
      if ((m = t.match(/^(\w+)\.is\.null$/))) return r => r[m[1]] == null;
      if ((m = t.match(/^(\w+)\.eq\.(.*)$/))) return r => String(r[m[1]]) === m[2];
      if ((m = t.match(/^(\w+)\.ilike\.(.*)$/))) { const p = m[2].replace(/[%*]/g, '').toLowerCase(); return r => String(r[m[1]] || '').toLowerCase().includes(p); }
      return () => false; };
    const partir = (s) => { const out = []; let d = 0, cur = ''; for (const ch of s) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && d === 0) { out.push(cur); cur = ''; } else cur += ch; } if (cur) out.push(cur); return out; };
    b.or = (expr) => chain(() => { st.desc.push('or(' + expr + ')'); const ps = partir(String(expr)).map(term); st.filtros.push(r => ps.some(f => f(r))); });
    b.not = (c, op, v) => chain(() => { st.desc.push('not ' + c + ' ' + op); if (op === 'is' && v === null) st.filtros.push(r => r[c] != null); else if (op === 'like' || op === 'ilike') { const p = String(v).replace(/%/g, '').toLowerCase(); st.filtros.push(r => !String(r[c] || '').toLowerCase().includes(p)); } else if (op === 'eq') st.filtros.push(r => String(r[c]) !== String(v)); });
    ['contains', 'textSearch', 'match', 'filter', 'abortSignal', 'returns'].forEach(m => { b[m] = () => b; });
    b.maybeSingle = () => chain(() => { st.uno = true; }); b.single = b.maybeSingle;
    b.update = (c) => chain(() => { st.op = 'update'; st.cambios = c; });
    b.insert = (c) => chain(() => { st.op = 'insert'; st.cambios = c; });
    b.upsert = b.insert; b.delete = () => chain(() => { st.op = 'delete'; });
    b.then = (res, rej) => {
      const reg = { pila: st.pila, t: performance.now(), tabla, op: st.op, cols: st.cols, filtros: st.desc.join(','), lim: st.lim, rango: st.rango, head: st.head, count: st.count, filas: null };
      Q.push(reg);
      return lat(tabla).then(() => {
        let rows = (D.tablas[tabla] || []).filter(r => st.filtros.every(f => f(r)));
        const total = rows.length;
        let out;
        if (st.op === 'update') { rows.forEach(r => Object.assign(r, st.cambios)); out = { data: rows, error: null }; }
        else if (st.op === 'insert') { const arr = Array.isArray(st.cambios) ? st.cambios : [st.cambios]; arr.forEach(x => { if (!x.id) x.id = 'n' + Math.random().toString(36).slice(2); (D.tablas[tabla] = D.tablas[tabla] || []).push(x); }); out = { data: arr, error: null }; }
        else if (st.op === 'delete') { D.tablas[tabla] = (D.tablas[tabla] || []).filter(r => !rows.includes(r)); out = { data: rows, error: null }; }
        else if (st.head) out = { data: null, count: total, error: null };
        else {
          rows = rows.slice();
          for (let i = st.orden.length - 1; i >= 0; i--) { const [c, asc] = st.orden[i]; rows.sort((a, z) => { const x = a[c], y = z[c]; if (x == null && y == null) return 0; if (x == null) return 1; if (y == null) return -1; return (x < y ? -1 : x > y ? 1 : 0) * (asc ? 1 : -1); }); }
          if (st.rango) rows = rows.slice(st.rango[0], st.rango[1] + 1);
          if (st.lim != null) rows = rows.slice(0, st.lim);
          out = { data: st.uno ? (rows[0] || null) : rows.map(r => Object.assign({}, r, tabla === 'whatsapp_hilos' ? { whatsapp_lineas: { nombre: 'Reparación' } } : null)), error: null, count: total };
        }
        reg.filas = Array.isArray(out.data) ? out.data.length : (out.data ? 1 : 0);
        reg.ms = Math.round(performance.now() - reg.t);
        return out;
      }).then(res, rej);
    };
    return b;
  }
  const client = {
    from: builder,
    rpc: (n, args) => {
      const reg = { pila: pila(), t: performance.now(), tabla: 'rpc:' + n, op: 'rpc' }; Q.push(reg);
      return lat('rpc').then(() => {
        if (n === 'app_sesion_vigente' || n === 'app_sesion_cerrar') return { data: true, error: null };
        if (n === 'crm_no_leidos_count') return { data: 7, error: null };
        return { data: n === 'whatsapp_lineas_directorio' ? [{ id: 'l1', nombre: 'Reparación', numero: '18095550000', sucursal: 'Santiago' }] : null, error: null };
      });
    },
    auth: { getSession: async () => ({ data: { session: { access_token: 'x', user: { id: 'u1' } } } }), getUser: async () => ({ data: { user: { id: 'u1' } } }), onAuthStateChange() { return { data: { subscription: { unsubscribe() {} } } }; }, signOut: async () => ({}) },
    storage: { from: () => ({ createSignedUrl: (p) => { const reg = { pila: pila(), t: performance.now(), tabla: 'storage:signedUrl', op: 'sign' }; Q.push(reg); return lat('storage').then(() => ({ data: { signedUrl: 'assets/taller/taller-apple-touch-icon.png?p=' + encodeURIComponent(p) } })); }, createSignedUrls: (ps) => { Q.push({ t: performance.now(), tabla: 'storage:signedUrls', op: 'sign' }); return lat('storage').then(() => ({ data: ps.map(p => ({ path: p, signedUrl: 'assets/taller/taller-apple-touch-icon.png?p=' + encodeURIComponent(p) })) })); } }) },
    channel: (nombre) => { const ch = { nombre, cbs: [], on(t, f, cb) { ch.cbs.push({ f, cb }); return ch; }, subscribe(cb) { try { cb && cb('SUBSCRIBED'); } catch (e) {} return ch; }, unsubscribe() { D.canales = D.canales.filter(c => c !== ch); return Promise.resolve('ok'); }, send() { return Promise.resolve('ok'); }, track() { return Promise.resolve('ok'); } }; D.canales.push(ch); D.canalesTotal++; return ch; },
    removeChannel: (ch) => { D.canales = D.canales.filter(c => c !== ch); D.removidos++; return Promise.resolve('ok'); },
    getChannels: () => D.canales,
    functions: { invoke: async (n) => { Q.push({ t: performance.now(), tabla: 'fn:' + n, op: 'invoke' }); await lat('fn'); return { data: { ok: true } }; } }
  };
  window.supabase = { createClient: () => client };
  window.__rt = function (tabla, evento, nuevo, viejo) {
    let n = 0;
    D.canales.filter(c => /^crm-linea-/.test(c.nombre)).forEach(canal => canal.cbs.forEach(({ f, cb }) => { if (f.table === tabla && (f.event === '*' || f.event === evento)) { cb({ eventType: evento, new: nuevo || {}, old: viejo || {}, table: tabla }); n++; } }));
    return n;
  };
})();
