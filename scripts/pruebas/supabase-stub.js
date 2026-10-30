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

  // Raspa y gana (29-oct-2026): simulación de las RPC raspa_* (misma lógica que la migración 20261029200000, SIN base real).
  const RG = D.raspa = { juegos: [], topes: { '1582': 10, '1021': 10, '1662': 10, '1121': 10, '1843': 10, '1541': 10, '1085': 5, '1795': 5, '1539': 0, '1540': 0, '1161': 0, '1186': 0, '2637': 0 }, sorteo: null, actor: 'Michelle' };
  const rgTel = t => { const d = String(t || '').replace(/\D/g, ''); return d.length >= 10 ? d.slice(-10) : null; };
  const rgVig = j => j.estado === 'jugado' && new Date(j.vence_en) < new Date() ? 'vencido' : j.estado;
  const rgFila = j => ({ codigo: j.codigo, estado: rgVig(j), premio: j.premio || null, telefono: j.telefono || null, vence_en: j.vence_en || null, codprefactura: j.codprefactura, usado_en: j.usado_en || null, usado_por: j.usado_por || null, usado_codprefactura: j.usado_codprefactura || null, factura_id: j.factura_id || null });
  function rgRpc(n, a) {
    a = a || {};
    const por = (k, v) => RG.juegos.find(j => String(j[k]) === String(v));
    if (n === 'raspa_topes') return (a.p_cods || []).map(c => ({ cod: String(c), tope: RG.topes[String(c)] != null ? RG.topes[String(c)] : 0 }));
    if (n === 'raspa_emitir') {
      const p = (D.tablas.recepcion_prefacturas || []).find(x => String(x.codprefactura) === String(a.p_codprefactura));
      if (!p) return { ok: false, motivo: 'sin_prefactura' };
      if (Number(p.total || 0) < 500) return { ok: false, motivo: 'menor_500' };
      let j = por('codprefactura', a.p_codprefactura);
      if (!j) { j = { token: Array.from({ length: 36 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join(''), codigo: 'BC-' + Array.from({ length: 4 }, () => 'ACDEFGHJKMNPQRTUVWXY34679'[Math.floor(Math.random() * 25)]).join(''), codprefactura: String(a.p_codprefactura), total_compra: Number(p.total), estado: 'pendiente' }; RG.juegos.push(j); }
      return { ok: true, codigo: j.codigo, token: j.token, estado: j.estado };
    }
    if (n === 'raspa_activar') {
      const j = por('codigo', String(a.p_codigo || '').trim().toUpperCase()), f = String(a.p_factura || '').trim().toUpperCase();
      if (!j) return { ok: false, motivo: 'no_existe' };
      if (j.estado !== 'pendiente') return { ok: false, motivo: 'ya_' + j.estado };
      if (f.length < 4) return { ok: false, motivo: 'falta_factura' };
      if (RG.juegos.some(x => x.factura_id === f)) return { ok: false, motivo: 'factura_usada' };
      Object.assign(j, { estado: 'activo', factura_id: f, activado_modo: 'manual' }); return { ok: true };
    }
    if (n === 'raspa_ver') { const j = por('token', a.p_token); if (!j) return { ok: false, estado: 'no_existe' }; return { ok: true, estado: rgVig(j), codigo: j.codigo, premio: j.premio || null, vence_en: j.vence_en || null }; }
    if (n === 'raspa_jugar') {
      const tel = rgTel(a.p_telefono); if (!tel) return { ok: false, motivo: 'telefono' };
      const j = por('token', a.p_token); if (!j) return { ok: false, motivo: 'no_existe' };
      if (j.estado === 'jugado' || j.estado === 'usado') return { ok: true, premio: j.premio, codigo: j.codigo, vence_en: j.vence_en, estado: j.estado };
      if (j.estado !== 'activo') return { ok: false, motivo: j.estado };
      Object.assign(j, { estado: 'jugado', premio: RG.sorteo || '5', telefono: tel, jugado_en: new Date().toISOString(), vence_en: new Date(Date.now() + 30 * 86400000).toISOString() });
      return { ok: true, premio: j.premio, codigo: j.codigo, vence_en: j.vence_en, estado: j.estado };
    }
    if (n === 'raspa_buscar') {
      const raw = String(a.p_q || ''), q = raw.trim().toUpperCase(), tel = rgTel(raw), m = raw.match(/t=([0-9a-fA-F]{20,})/), tok = m ? m[1].toLowerCase() : null;
      return RG.juegos.filter(j => j.codigo === q || (tok && j.token === tok) || j.token === raw.trim().toLowerCase() || (tel && j.telefono === tel && rgVig(j) === 'jugado')).map(rgFila);
    }
    if (n === 'raspa_canjear') {
      const j = por('codigo', String(a.p_codigo || '').trim().toUpperCase()), num = String(a.p_codprefactura);
      if (!j) return { ok: false, motivo: 'no_existe' };
      if (j.estado === 'usado') return j.usado_codprefactura === num ? { ok: true, ya: true } : { ok: false, motivo: 'usado', usado_codprefactura: j.usado_codprefactura, usado_en: j.usado_en, usado_por: j.usado_por };
      if (j.estado !== 'jugado') return { ok: false, motivo: j.estado };
      if (rgVig(j) === 'vencido') return { ok: false, motivo: 'vencido' };
      if (j.codprefactura === num) return { ok: false, motivo: 'misma_compra' };
      Object.assign(j, { estado: 'usado', usado_en: new Date().toISOString(), usado_por: RG.actor, usado_codprefactura: num }); return { ok: true };
    }
    if (n === 'raspa_deshacer_canje') { const j = por('codigo', String(a.p_codigo || '').trim().toUpperCase()); if (!j || j.estado !== 'usado') return { ok: false }; Object.assign(j, { estado: 'jugado', usado_en: null, usado_por: null, usado_codprefactura: null }); return { ok: true }; }
    return undefined;
  }
  const client = {
    from: builder,
    rpc: (n, args) => {
      if (/^raspa_/.test(n)) { const r = rgRpc(n, args); return Promise.resolve(r === undefined ? { data: null, error: { message: 'función desconocida' } } : { data: r, error: null }); }
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
