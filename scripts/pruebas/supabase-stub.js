// Supabase simulado para el banco del CRM (solo pruebas locales)
(function(){
  const now = Date.now();
  const D = window.__BD = { tablas: {}, canales: [] };
  const hilos = []; const mensajes = [];
  for (let i = 0; i < 25; i++) {
    const id = 'h' + (i + 1);
    hilos.push({ id, linea_id: 'l1', nombre_perfil: 'Cliente ' + (i + 1), telefono_e164: '+1809555' + String(1000 + i), ultimo_mensaje_at: new Date(now - i * 3600000).toISOString(), ultimo_mensaje_preview: 'Mensaje de prueba ' + (i + 1), no_leidos_count: i % 4 === 0 ? 2 : 0, ultimo_inbound_at: new Date(now - i * 3600000).toISOString(), asignado_id: null, archivado: false, whatsapp_lineas: { nombre: 'Reparación' } });
    for (let k = 0; k < 14; k++) mensajes.push({ id: id + 'm' + k, hilo_id: id, direccion: k % 2 ? 'out' : 'in', tipo: 'text', cuerpo: 'Texto ' + k + ' del chat ' + (i + 1), estado: k % 2 ? 'read' : null, creado_en: new Date(now - i * 3600000 - (14 - k) * 60000).toISOString(), media_path: null });
  }
  mensajes.push({ id: 'h12tel', hilo_id: 'h12', direccion: 'out', tipo: 'text', cuerpo: 'escribe a ese numero 809-707-2493 la chica te brindara el servicio', estado: 'read', creado_en: new Date(now - 11 * 3600000).toISOString() });
  mensajes.push({ id: 'h12card', hilo_id: 'h12', direccion: 'out', tipo: 'text', tipo_contenido: 'contacto', cuerpo: JSON.stringify({ nombre: 'Michel Reparación', telefono: '+1 (809) 707-2493' }), estado: 'read', creado_en: new Date(now - 11 * 3600000 + 1000).toISOString() });
  D.tablas.whatsapp_hilos = hilos; D.tablas.whatsapp_mensajes = mensajes;
  D.tablas.whatsapp_lineas = [{ id: 'l1', nombre: 'Reparación', whatsapp_numero: '18095550000', activo: true, conectada: true, sucursal: 'Santiago' }];
  function builder(tabla) {
    const st = { filtros: [], head: false, count: null, op: 'select', cambios: null, uno: false };
    const b = {};
    const chain = (f) => { f(); return b; };
    b.select = (cols, opt) => chain(() => { if (opt && opt.head) st.head = true; if (opt && opt.count) st.count = true; });
    b.eq = (c, v) => chain(() => st.filtros.push(r => String(r[c]) === String(v)));
    b.neq = (c, v) => chain(() => st.filtros.push(r => String(r[c]) !== String(v)));
    b.in = (c, vs) => chain(() => st.filtros.push(r => vs.map(String).includes(String(r[c]))));
    b.is = (c, v) => chain(() => st.filtros.push(r => r[c] == v));
    ['order', 'limit', 'range', 'gte', 'lte', 'gt', 'lt', 'ilike', 'like', 'or', 'not', 'contains', 'textSearch', 'match', 'filter'].forEach(m => { b[m] = () => b; });
    b.maybeSingle = () => chain(() => { st.uno = true; }); b.single = b.maybeSingle;
    b.update = (c) => chain(() => { st.op = 'update'; st.cambios = c; });
    b.insert = (c) => chain(() => { st.op = 'insert'; st.cambios = c; });
    b.upsert = b.insert; b.delete = () => chain(() => { st.op = 'delete'; });
    b.then = (res, rej) => {
      const rows = (D.tablas[tabla] || []).filter(r => st.filtros.every(f => f(r)));
      let out;
      if (st.op === 'update') { rows.forEach(r => Object.assign(r, st.cambios)); out = { data: rows, error: null }; }
      else if (st.op === 'insert') { const arr = Array.isArray(st.cambios) ? st.cambios : [st.cambios]; arr.forEach(x => { if (!x.id) x.id = 'n' + Math.random().toString(36).slice(2); (D.tablas[tabla] = D.tablas[tabla] || []).push(x); }); out = { data: arr, error: null }; }
      else if (st.op === 'delete') { D.tablas[tabla] = (D.tablas[tabla] || []).filter(r => !rows.includes(r)); out = { data: rows, error: null }; }
      else if (st.head) out = { data: null, count: rows.length, error: null };
      else out = { data: st.uno ? (rows[0] || null) : rows.map(r => Object.assign({}, r)), error: null, count: rows.length };
      return Promise.resolve(out).then(res, rej);
    };
    return b;
  }
  const client = {
    from: builder,
    rpc: (n, args) => {
      if (n === 'app_sesiones_listar') return Promise.resolve({ data: [
        { id: 's1', nombre: 'Esterlin', tipo: 'usuario', user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36', ip: '148.101.77.220', vista_en: new Date().toISOString(), es_actual: true, es_mia: true },
        { id: 's2', nombre: 'Esterlin', tipo: 'usuario', user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1', ip: '190.80.12.9', vista_en: new Date(Date.now() - 2 * 3600000).toISOString(), es_actual: false, es_mia: true },
        { id: 's3', nombre: 'Michelle', tipo: 'tecnico', user_agent: 'Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36', ip: '181.36.4.77', vista_en: new Date(Date.now() - 40 * 60000).toISOString(), es_actual: false, es_mia: false },
        { id: 's4', nombre: 'Loribel', tipo: 'tecnico', user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36 Edg/128.0', ip: '148.101.77.220', vista_en: new Date(Date.now() - 9 * 86400000).toISOString(), es_actual: false, es_mia: false }
      ], error: null });
      if (n === 'app_sesion_cerrar') return Promise.resolve({ data: true, error: null });
      if (n === 'app_sesion_vigente') return Promise.resolve({ data: true, error: null });
      return Promise.resolve({ data: n === 'whatsapp_lineas_directorio' ? [{ id: 'l1', nombre: 'Reparación', numero: '18095550000', sucursal: 'Santiago' }] : null, error: null });
    },
    auth: { getSession: async () => ({ data: { session: { access_token: 'x', user: { id: 'u1' } } } }), onAuthStateChange() { return { data: { subscription: { unsubscribe() {} } } }; }, signOut: async () => ({}) },
    storage: { from: () => ({ createSignedUrl: async (p) => ({ data: { signedUrl: 'about:blank#' + p } }) }) },
    channel: (nombre) => { const ch = { nombre, cbs: [], on(t, f, cb) { ch.cbs.push({ f, cb }); return ch; }, subscribe(cb) { try { cb && cb('SUBSCRIBED'); } catch (e) {} return ch; } }; D.canales.push(ch); return ch; },
    removeChannel: (ch) => { D.canales = D.canales.filter(c => c !== ch); },
    functions: { invoke: async () => ({ data: { ok: true } }) }
  };
  window.supabase = { createClient: () => client };
  // Disparar un evento de tiempo real como lo haría Supabase
  window.__rt = function (tabla, evento, nuevo, viejo) {
    const canal = D.canales.find(c => /^crm-linea-/.test(c.nombre)); if (!canal) return 'sin canal';
    let n = 0; canal.cbs.forEach(({ f, cb }) => { if (f.table === tabla && (f.event === '*' || f.event === evento)) { cb({ eventType: evento, new: nuevo || {}, old: viejo || {}, table: tabla }); n++; } });
    return n;
  };
})();
