// BAYOL DIAGNOSTIC ENGINE — Lógica de la interfaz (Fase 2)
const CFG = window.BDE_CONFIG;
const sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
});

let sesionTecnico = null;     // datos del técnico logueado
let ultimaLectura = null;     // resultado de la última lectura USB
const SINTOMAS = ['Pantalla negra','Bootloop','No enciende','No carga','Se reinicia solo',
  'Sin señal','No responde el touch','Mojado','No Face ID','Sobrecalienta','Sin sonido','Cámara falla'];

// ---------------- LOGIN ----------------
async function doLogin() {
  const u = document.getElementById('lgUser').value.trim().toLowerCase();
  const p = document.getElementById('lgPass').value;
  const msg = document.getElementById('loginMsg');
  const btn = document.getElementById('lgBtn');
  if (!u || !p) { msg.textContent = 'Escribe usuario y contraseña.'; return; }
  msg.textContent = ''; btn.disabled = true; btn.innerHTML = '<span class="spin"></span>';
  try {
    const email = u.includes('@') ? u : (u + '@' + CFG.AUTH_DOMAIN);
    const { data, error } = await sb.auth.signInWithPassword({ email, password: p });
    if (error) throw error;
    // Datos básicos del técnico (para mostrar nombre/rol)
    const refId = data.user?.user_metadata?.ref_id || null;
    let nombre = u, rol = 'técnico';
    if (refId) {
      const { data: t } = await sb.from('tecnicos').select('nombre,rol,activo').eq('id', refId).maybeSingle();
      if (t) {
        if (t.activo === false) { await sb.auth.signOut(); throw new Error('Tu usuario está inactivo.'); }
        nombre = t.nombre || u; rol = t.rol || rol;
      }
    }
    sesionTecnico = { usuario: u, nombre, rol };
    iniciarApp();
  } catch (e) {
    msg.textContent = traducirError(e.message || 'No se pudo entrar.');
  } finally {
    btn.disabled = false; btn.textContent = 'Entrar';
  }
}

function traducirError(m) {
  if (/invalid login|credentials/i.test(m)) return 'Usuario o contraseña incorrectos.';
  if (/network|fetch/i.test(m)) return 'Sin conexión a internet.';
  return m;
}

async function logout() {
  await sb.auth.signOut();
  location.reload();
}

function iniciarApp() {
  document.getElementById('login').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('sfUser').textContent = sesionTecnico.nombre;
  document.getElementById('sfRol').textContent = sesionTecnico.rol;
  // Render chips de síntomas
  const cont = document.getElementById('ia_chips');
  cont.innerHTML = SINTOMAS.map(s => `<span class="chip" onclick="this.classList.toggle('on')">${s}</span>`).join('');
  verificarHerramientas();
}

// ---------------- NAVEGACIÓN ----------------
const TITULOS = { lector:'Lector de dispositivo', panic:'Analizador de Panic Log', ia:'Diagnóstico IA', bateria:'Batería', pantalla:'Pantalla', herramientas:'Herramientas iPhone', termica:'Cámara térmica', microscopio:'Microscopio', esquematicos:'Esquemáticos (REEFOX)', conocimiento:'Base de conocimiento', mantenimiento:'Mantenimiento' };
function vista(v, btn) {
  document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  ['lector','panic','ia','bateria','pantalla','herramientas','termica','microscopio','esquematicos','conocimiento','mantenimiento'].forEach(x => document.getElementById('v-'+x).classList.toggle('hidden', x !== v));
  document.getElementById('tbTitle').textContent = TITULOS[v] || '';
  if (v === 'bateria' && ultimaLectura) pintarBateria(ultimaLectura.info, ultimaLectura.bateria);
  if (v === 'pantalla') prepararPantalla();
  if (v === 'termica') prepararTermica();
  if (v === 'microscopio') prepararMicro();
  if (v === 'esquematicos') prepararEsquematicos();
  if (v === 'conocimiento') cargarConocimiento();
  if (v === 'mantenimiento') { const e=document.getElementById('mtVersion'); if(e) e.textContent = CFG.APP_VERSION || '—'; }
}

// ---------------- HERRAMIENTAS (libimobiledevice) ----------------
async function verificarHerramientas() {
  const led = document.getElementById('ledTools'), txt = document.getElementById('toolsTxt');
  const banner = document.getElementById('demoBanner');
  if (!window.bde) {
    led.className = 'led'; txt.textContent = 'Lector USB no disponible (modo navegador)';
    banner.classList.remove('hidden');
    banner.innerHTML = '⚠️ Estás viendo la app en un navegador. La lectura por USB solo funciona en la app de escritorio instalada. Usa el <b>Modo demostración</b>.';
    document.getElementById('btnLeer').disabled = true;
    return;
  }
  const r = await window.bde.checkTools();
  if (r.ok) { led.className = 'led on'; txt.textContent = 'libimobiledevice OK'; }
  else {
    led.className = 'led'; txt.textContent = 'libimobiledevice no instalado';
    banner.classList.remove('hidden');
    banner.innerHTML = '⚠️ No se encontró <b>libimobiledevice</b> en esta PC. Sigue el README para instalarlo, o usa el <b>Modo demostración</b> mientras tanto.';
  }
}

// ---------------- LECTURA DEL DISPOSITIVO ----------------
async function leerDispositivo() {
  const led = document.getElementById('ledDev'), txt = document.getElementById('devTxt');
  const btn = document.getElementById('btnLeer');
  led.className = 'led busy'; txt.textContent = 'Leyendo…';
  btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Leyendo…';
  try {
    const r = await window.bde.leerDispositivo();
    if (!r.ok) {
      led.className = 'led'; txt.textContent = 'Sin dispositivo';
      alert(r.mensaje || 'No se pudo leer el dispositivo.');
      return;
    }
    procesarLectura(r);
  } finally {
    btn.disabled = false; btn.textContent = 'Leer de nuevo';
  }
}

function leerDemo() {
  procesarLectura({
    ok: true, udid: 'DEMO-0000',
    info: { ProductType:'iPhone13,2', ProductVersion:'16.3.1', SerialNumber:'F2LX12ABCD',
      InternationalMobileEquipmentIdentity:'356789104567890', ActivationState:'Activated',
      DeviceName:'iPhone de Cliente', ChipID:'0x8101' },
    bateria: { BatteryVoltage:'3180', CycleCount:'912', DesignCapacity:'2815',
      NominalChargeCapacity:'1880', ExternalChargeCapable:'true' },
    panics: [{ archivo:'panic-full-2026-06-08-143022.ips',
      panicString:'panic(cpu 0): i2c0 CheckBusStatus SCL stuck low\nthermalmonitord watchdog', raw:'(demo)' }],
    demo: true
  });
}

const MODELOS = { 'iPhone13,2':'iPhone 12', 'iPhone10,3':'iPhone X', 'iPhone14,2':'iPhone 13 Pro',
  'iPhone12,1':'iPhone 11', 'iPhone15,2':'iPhone 14 Pro', 'iPhone14,5':'iPhone 13' };

function procesarLectura(r) {
  ultimaLectura = r;
  const led = document.getElementById('ledDev'), txt = document.getElementById('devTxt');
  led.className = 'led on'; txt.textContent = (r.demo ? 'DEMO' : 'Conectado');
  document.getElementById('lectorInicio').classList.add('hidden');
  const cont = document.getElementById('lectorResultado');
  cont.classList.remove('hidden');

  const i = r.info || {}, b = r.bateria || {};
  const modelo = MODELOS[i.ProductType] || i.ProductType || '—';
  const eval_ = window.evaluarBateria(b);

  let html = '';
  if (r.demo) html += '<div class="demo-banner">🧪 Datos de demostración (no es un dispositivo real).</div>';

  // Datos generales
  html += '<div class="card"><h3><span class="ic">📱</span> Datos del dispositivo</h3><div class="row">';
  html += campo('Modelo', modelo + (i.ProductType ? ' ('+i.ProductType+')' : ''));
  html += campo('iOS', i.ProductVersion);
  html += campo('IMEI', i.InternationalMobileEquipmentIdentity);
  html += campo('Serie', i.SerialNumber);
  html += campo('Activación', i.ActivationState);
  html += campo('Chip', i.ChipID);
  html += '</div></div>';

  // Batería
  html += '<div class="card"><h3><span class="ic">🔋</span> Batería</h3><div class="row">';
  html += campo('Voltaje', eval_.voltaje != null ? eval_.voltaje+' mV' : '—');
  html += campo('Ciclos', eval_.ciclos != null ? eval_.ciclos : '—');
  html += campo('Salud', eval_.saludPct != null ? eval_.saludPct+'%' : '—');
  html += campo('Capacidad', (eval_.nominalCap||'—')+' / '+(eval_.designCap||'—')+' mAh');
  html += '</div>';
  if (eval_.alertas.length) {
    html += '<div style="margin-top:12px">';
    eval_.alertas.forEach(a => { html += alerta(a.nivel, a.titulo, a.causa); });
    html += '</div>';
  } else {
    html += alerta('info','Batería sin alertas','Los valores eléctricos están dentro de rango.');
  }
  html += '</div>';

  // Panic logs
  html += '<div class="card"><h3><span class="ic">📋</span> Panic logs ('+(r.panics?.length||0)+')</h3>';
  if (r.panics && r.panics.length) {
    r.panics.forEach(p => {
      const m = window.matchPanic(p.panicString);
      html += '<div style="margin-bottom:12px"><b style="font-size:12px;color:#666">'+p.archivo+'</b>';
      html += '<div class="panic-box">'+escapar(p.panicString||'(sin panicString)')+'</div>';
      if (m) html += alerta('critico', m.codigo, m.zona + ' — ' + m.accion);
      html += '</div>';
    });
  } else {
    html += '<p class="muted" style="text-align:left">No se encontraron panic logs en el dispositivo.</p>';
  }
  html += '</div>';

  // Acción
  html += '<div class="card"><button class="btn" onclick="pasarAIA()">🧠 Continuar al Diagnóstico IA con estos datos</button></div>';

  cont.innerHTML = html;

  // Pre-cargar la vista de panic
  pintarPanicDesdeLectura(r);
}

function campo(l, v){ return '<div class="field"><label>'+l+'</label><b>'+(v||'—')+'</b></div>'; }
function alerta(nivel, t, sub){ return '<div class="alert '+nivel+'"><div><div class="t">'+escapar(t)+'</div><div>'+escapar(sub||'')+'</div></div></div>'; }
function escapar(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ---------------- PANIC ----------------
function pintarPanicDesdeLectura(r) {
  const cont = document.getElementById('panicResultado');
  if (!r.panics || !r.panics.length) { cont.innerHTML=''; return; }
  let html = '';
  r.panics.forEach(p => {
    const m = window.matchPanic(p.panicString);
    html += '<div class="card"><b style="font-size:12px;color:#666">'+p.archivo+'</b>';
    html += '<div class="panic-box">'+escapar(p.panicString||'')+'</div>';
    if (m) html += alerta('critico', m.codigo, m.zona+' — '+m.accion);
    else html += alerta('info','Código no catalogado','Se enviará a la IA para análisis profundo.');
    html += '</div>';
  });
  cont.innerHTML = html;
  if (r.panics[0]) document.getElementById('panicManual').value = r.panics[0].panicString || '';
}

// Carga un archivo .ips/.txt, extrae el panicString y lo analiza
function cargarPanicArchivo(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  const nom = document.getElementById('panicFileNombre');
  if (nom) nom.textContent = file.name;
  const reader = new FileReader();
  reader.onload = (e) => {
    const txt = String(e.target.result || '');
    let panicString = '';
    try {
      const nl = txt.indexOf('\n');
      const body = JSON.parse(txt.slice(nl + 1));
      panicString = body.panicString || body.panicStringStr || '';
    } catch (_) {}
    if (!panicString) {
      const m = txt.match(/"panicString"\s*:\s*"([\s\S]*?)"\s*[,}]/);
      if (m) panicString = m[1].replace(/\\n/g, '\n');
    }
    document.getElementById('panicManual').value = panicString || txt.slice(0, 8000);
    analizarPanicManual();
  };
  reader.readAsText(file);
  input.value = '';
}

function analizarPanicManual() {
  const txt = document.getElementById('panicManual').value.trim();
  const cont = document.getElementById('panicResultado');
  if (!txt) { cont.innerHTML = ''; return; }
  const m = window.matchPanic(txt);
  let html = '<div class="card"><div class="panic-box">'+escapar(txt.slice(0,4000))+'</div>';
  if (m) html += alerta('critico', m.codigo, m.zona+' — '+m.accion);
  else html += alerta('info','Código no catalogado','Usa el Diagnóstico IA para un análisis profundo.');
  html += '</div>';
  cont.innerHTML = html;
}

// ---------------- HISTORIAL DE PANIC ----------------
async function guardarPanicHist(btn) {
  const panic_string = (document.getElementById('panicManual').value || '').trim();
  if (!panic_string) { alert('No hay panic log para guardar.'); return; }
  const i = (ultimaLectura && ultimaLectura.info) || {};
  const modelo = document.getElementById('ia_modelo').value.trim() || MODELOS[i.ProductType] || i.ProductType || '';
  const m = window.matchPanic(panic_string);
  btn.disabled = true; const o = btn.textContent; btn.textContent = 'Guardando…';
  try {
    const { error } = await sb.from('panic_logs').insert({
      modelo, ios_version: i.ProductVersion || document.getElementById('ia_ios').value.trim() || null,
      imei: i.InternationalMobileEquipmentIdentity || null, udid: ultimaLectura ? ultimaLectura.udid : null,
      panic_code: m ? m.codigo : null, panic_string, raw: panic_string.slice(0, 20000)
    });
    if (error) throw error;
    btn.textContent = '✅ Guardado';
    if (!document.getElementById('panicHist').classList.contains('hidden')) cargarPanicHist();
    setTimeout(() => { btn.disabled = false; btn.textContent = o; }, 1500);
  } catch (e) { btn.disabled = false; btn.textContent = o; alert('No se pudo guardar: ' + (e.message || '')); }
}
function togglePanicHist() {
  const c = document.getElementById('panicHist');
  const mostrar = c.classList.contains('hidden');
  c.classList.toggle('hidden', !mostrar);
  if (mostrar) cargarPanicHist();
}
async function cargarPanicHist() {
  const c = document.getElementById('panicHist');
  c.innerHTML = '<span class="spin"></span> Cargando…';
  try {
    const { data, error } = await sb.from('panic_logs')
      .select('id,created_at,modelo,panic_code,panic_string').order('created_at', { ascending: false }).limit(50);
    if (error) throw error;
    if (!data || !data.length) { c.innerHTML = '<p class="muted" style="text-align:left">Aún no hay panic guardados.</p>'; return; }
    window._panicHist = {};
    let html = '<table style="width:100%;border-collapse:collapse;font-size:13px">'
      + '<tr style="text-align:left;color:#888"><th style="padding:6px">Fecha</th><th>Modelo</th><th>Código</th><th></th></tr>';
    data.forEach(r => {
      window._panicHist[r.id] = r;
      const f = new Date(r.created_at).toLocaleString('es-DO', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
      html += '<tr style="border-top:1px solid #eee"><td style="padding:6px">'+f+'</td><td>'+escapar(r.modelo||'—')+'</td><td>'+escapar(r.panic_code||'—')+'</td>'
        + '<td style="text-align:right"><button class="btn sec" style="padding:5px 9px;font-size:12px" onclick="verPanicHist(\''+r.id+'\')">Ver</button> '
        + '<button class="btn sec" style="padding:5px 9px;font-size:12px" onclick="borrarPanicHist(\''+r.id+'\')">🗑</button></td></tr>';
    });
    html += '</table>';
    c.innerHTML = html;
  } catch (e) { c.innerHTML = '<p style="color:#cc0000">Error al cargar: '+escapar(e.message||'')+'</p>'; }
}
function verPanicHist(id) {
  const r = (window._panicHist || {})[id]; if (!r) return;
  document.getElementById('panicManual').value = r.panic_string || '';
  if (r.modelo) document.getElementById('ia_modelo').value = r.modelo;
  analizarPanicManual();
}
async function borrarPanicHist(id) {
  if (!confirm('¿Eliminar este panic del historial?')) return;
  try {
    const { error } = await sb.from('panic_logs').delete().eq('id', id);
    if (error) throw error;
    cargarPanicHist();
  } catch (e) { alert('No se pudo eliminar: ' + (e.message || '')); }
}

// ---------------- PASO A LA IA ----------------
function pasarAIA() {
  if (ultimaLectura) {
    const i = ultimaLectura.info||{}, b = ultimaLectura.bateria||{};
    document.getElementById('ia_modelo').value = MODELOS[i.ProductType] || i.ProductType || '';
    document.getElementById('ia_ios').value = i.ProductVersion || '';
    const ev = window.evaluarBateria(b);
    document.getElementById('ia_bateria').value =
      [ev.voltaje?ev.voltaje+' mV':null, ev.ciclos?ev.ciclos+' ciclos':null, ev.saludPct?ev.saludPct+'% salud':null].filter(Boolean).join(' / ');
    document.getElementById('ia_panic').value = (ultimaLectura.panics&&ultimaLectura.panics[0])?ultimaLectura.panics[0].panicString:'';
  }
  vista('ia', document.getElementById('m-ia'));
}

// ---------------- DIAGNÓSTICO IA ----------------
async function diagnosticarIA() {
  const btn = document.getElementById('btnIA');
  const out = document.getElementById('iaResultado');
  const sintomas = Array.from(document.querySelectorAll('#ia_chips .chip.on')).map(c => c.textContent);
  const extra = document.getElementById('ia_extra').value.trim();
  if (extra) sintomas.push(extra);
  const body = {
    modelo: document.getElementById('ia_modelo').value.trim(),
    ios_version: document.getElementById('ia_ios').value.trim(),
    bateria: document.getElementById('ia_bateria').value.trim(),
    consumo: document.getElementById('ia_consumo').value.trim(),
    panic_log: document.getElementById('ia_panic').value.trim(),
    sintomas,
    historial: document.getElementById('ia_historial').value.trim()
  };
  if (!body.modelo && !sintomas.length && !body.panic_log) {
    out.innerHTML = '<span style="color:#cc0000">Escribe al menos el modelo, un síntoma o un panic log.</span>'; return;
  }
  btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Analizando…';
  out.innerHTML = '<span class="spin"></span> La IA está analizando el caso…';
  try {
    const { data, error } = await sb.functions.invoke(CFG.EDGE_FUNCTION, { body });
    if (error) throw error;
    if (!data || !data.ok) throw new Error(data && data.error ? data.error : 'La IA no devolvió respuesta.');
    window._ultimoDiag = { body, diagnostico: data.diagnostico };
    out.innerHTML = '<div class="ia-box">'+escapar(data.diagnostico)+'</div>'
      + '<button class="btn" style="margin-top:12px" onclick="guardarDiagnostico(this)">💾 Guardar diagnóstico</button>';
  } catch (e) {
    let m = e.message || 'Error desconocido';
    if (/permis|denied|forbidden|jwt|auth/i.test(m)) m = 'No tienes permiso para usar el Diagnóstico IA, o tu sesión expiró. Pídele acceso al administrador.';
    out.innerHTML = '<div class="alert critico"><div><div class="t">No se pudo diagnosticar</div><div>'+escapar(m)+'</div></div></div>';
  } finally {
    btn.disabled = false; btn.textContent = '⚡ Diagnosticar con IA';
  }
}

async function guardarDiagnostico(btn) {
  if (!window._ultimoDiag) return;
  btn.disabled = true; btn.textContent = 'Guardando…';
  const d = window._ultimoDiag;
  try {
    const { error } = await sb.from('diagnosticos').insert({
      modelo: d.body.modelo, ios_version: d.body.ios_version,
      panic_log_raw: d.body.panic_log, sintomas: d.body.sintomas,
      ia_diagnostico: d.diagnostico
    });
    if (error) throw error;
    btn.textContent = '✅ Guardado';
  } catch (e) {
    btn.disabled = false; btn.textContent = '💾 Reintentar guardar';
    alert('No se pudo guardar: ' + (e.message||''));
  }
}

// ---------------- BATERÍA ----------------
let _batActual = null; // { info, bateria, eval }

async function leerBateria(btn) {
  if (!window.bde || !window.bde.leerDispositivo) { alert('Leer la batería solo funciona en la app de escritorio.'); return; }
  btn.disabled = true; const o = btn.textContent; btn.innerHTML = '<span class="spin"></span> Leyendo…';
  try {
    const r = await window.bde.leerDispositivo();
    if (!r.ok) { document.getElementById('batResultado').innerHTML = '<div class="alert alerta"><div>'+escapar(r.mensaje||'No se pudo leer.')+'</div></div>'; return; }
    ultimaLectura = r;
    pintarBateria(r.info, r.bateria);
  } finally { btn.disabled = false; btn.textContent = o; }
}

function leerBateriaDemo() {
  pintarBateria(
    { ProductType:'iPhone13,2', InternationalMobileEquipmentIdentity:'356789104567890', ProductVersion:'16.3.1' },
    { BatteryVoltage:'3980', CycleCount:'612', DesignCapacity:'2815', NominalChargeCapacity:'2360', ExternalChargeCapable:'true' }
  );
}

function _semaforo(valor, verde, amarillo, inv) {
  if (valor == null) return ['#94a3b8','—'];
  let ok = inv ? valor <= verde : valor >= verde;
  let med = inv ? valor <= amarillo : valor >= amarillo;
  if (ok) return ['#16a34a','🟢'];
  if (med) return ['#d97706','🟡'];
  return ['#dc2626','🔴'];
}

function pintarBateria(info, bat) {
  info = info || {}; bat = bat || {};
  const ev = window.evaluarBateria(bat);
  _batActual = { info, bateria: bat, eval: ev };
  document.getElementById('btnBatAntes').disabled = false;
  document.getElementById('btnBatDespues').disabled = false;

  const sSalud = _semaforo(ev.saludPct, 85, 80, false);
  const sCiclos = _semaforo(ev.ciclos, 400, 800, true);
  const vOk = ev.voltaje != null && ev.voltaje >= 3200 && ev.voltaje <= 4350;

  const card = (label, valor, color, emoji) =>
    '<div class="field" style="border-left:4px solid '+color+'"><label>'+label+'</label><b>'+(emoji?emoji+' ':'')+valor+'</b></div>';

  let html = '<div class="row">';
  html += card('Salud', (ev.saludPct!=null?ev.saludPct+'%':'—'), sSalud[0], sSalud[1]);
  html += card('Ciclos', (ev.ciclos!=null?ev.ciclos:'—'), sCiclos[0], sCiclos[1]);
  html += card('Voltaje', (ev.voltaje!=null?ev.voltaje+' mV':'—'), vOk?'#16a34a':'#dc2626', vOk?'🟢':'🔴');
  html += card('Capacidad', (ev.nominalCap||'—')+' / '+(ev.designCap||'—')+' mAh', '#64748b', '');
  html += '</div>';

  // Detección
  if (ev.saludPct == null) {
    html += '<div class="alert critico" style="margin-top:10px"><div><div class="t">⚠️ No se pudo leer la salud de la batería</div><div>Puede ser una <b>pieza no reconocida</b> o el "Mensaje importante de la batería". Aquí es donde entra tu <b>JC V1SE</b> para reprogramarla.</div></div></div>';
  } else if (ev.alertas.length) {
    ev.alertas.forEach(a => { html += '<div class="alert '+a.nivel+'" style="margin-top:8px"><div><div class="t">'+escapar(a.titulo)+'</div><div>'+escapar(a.causa)+'</div></div></div>'; });
  } else if (ev.saludPct < 80) {
    html += '<div class="alert alerta" style="margin-top:10px"><div><div class="t">Batería degradada ('+ev.saludPct+'%)</div><div>Recomendado reemplazar. Si vas a reprogramar con el JC, registra antes/después.</div></div></div>';
  } else {
    html += '<div class="alert info" style="margin-top:10px"><div><div class="t">Batería en buen estado</div><div>Salud '+ev.saludPct+'% · '+(ev.ciclos!=null?ev.ciclos+' ciclos':'')+'</div></div></div>';
  }
  document.getElementById('batResultado').innerHTML = html;
  cargarHistorialBateria();
}

async function guardarBateria(momento, btn) {
  if (!_batActual) return;
  const i = _batActual.info, ev = _batActual.eval;
  btn.disabled = true; const o = btn.textContent; btn.textContent = 'Guardando…';
  try {
    const { error } = await sb.from('bateria_registros').insert({
      modelo: MODELOS[i.ProductType] || i.ProductType || null,
      imei: i.InternationalMobileEquipmentIdentity || null,
      udid: ultimaLectura ? ultimaLectura.udid : null,
      salud_pct: ev.saludPct, ciclos: ev.ciclos, voltaje: ev.voltaje,
      nominal_mah: ev.nominalCap, design_mah: ev.designCap, momento
    });
    if (error) throw error;
    btn.textContent = '✅ Guardado';
    cargarHistorialBateria();
    setTimeout(() => { btn.disabled = false; btn.textContent = o; }, 1500);
  } catch (e) { btn.disabled = false; btn.textContent = o; alert('No se pudo guardar: ' + (e.message||'')); }
}

async function cargarHistorialBateria() {
  const cont = document.getElementById('batHistorial');
  if (!cont) return;
  const imei = _batActual && _batActual.info ? _batActual.info.InternationalMobileEquipmentIdentity : null;
  try {
    let q = sb.from('bateria_registros').select('created_at,momento,salud_pct,ciclos,voltaje').order('created_at', { ascending: false }).limit(10);
    if (imei) q = q.eq('imei', imei);
    const { data, error } = await q;
    if (error) throw error;
    if (!data || !data.length) { cont.innerHTML = '<span class="muted">Sin registros de este equipo todavía.</span>'; return; }
    cont.innerHTML = '<table style="width:100%;border-collapse:collapse;font-size:12.5px">'
      + '<tr style="text-align:left;color:#888"><th style="padding:4px">Fecha</th><th>Momento</th><th>Salud</th><th>Ciclos</th></tr>'
      + data.map(r => { const f = new Date(r.created_at).toLocaleString('es-DO',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
          const m = r.momento==='antes'?'🟠 Antes':(r.momento==='despues'?'🟢 Después':'Lectura');
          return '<tr style="border-top:1px solid #eee"><td style="padding:4px">'+f+'</td><td>'+m+'</td><td>'+(r.salud_pct!=null?r.salud_pct+'%':'—')+'</td><td>'+(r.ciclos!=null?r.ciclos:'—')+'</td></tr>'; }).join('')
      + '</table>';
  } catch (e) { cont.innerHTML = '<span style="color:#cc0000">Error al cargar historial.</span>'; }
}

// ---------------- HERRAMIENTAS IPHONE ----------------
let _fichaInfo = null;
const REGION_MAP = { 'LL':'EE.UU.', 'ZP':'Hong Kong / Asia', 'ZA':'Singapur', 'CH':'China', 'LZ':'Latinoamérica', 'BR':'Brasil', 'J':'Japón', 'TA':'Taiwán', 'X':'Australia', 'B':'Reino Unido/Irlanda', 'C':'Canadá', 'E':'México', 'AE':'Emiratos', 'IP':'España' };
function _regionNombre(ri) {
  if (!ri) return '';
  const code = ri.split('/')[0];
  for (const k of Object.keys(REGION_MAP).sort((a,b)=>b.length-a.length)) { if (code.startsWith(k)) return REGION_MAP[k]; }
  return '';
}
function _gb(bytes) { const n = parseInt(bytes,10); return isNaN(n) ? null : Math.round(n / (1024*1024*1024)); }

async function leerFicha(btn) {
  if (!window.bde || !window.bde.infoIphone) { alert('Solo funciona en la app de escritorio instalada.'); return; }
  const msg = document.getElementById('hToolMsg');
  btn.disabled = true; const o = btn.textContent; btn.innerHTML = '<span class="spin"></span> Leyendo…';
  msg.textContent = '';
  try {
    const r = await window.bde.infoIphone();
    if (!r.ok) {
      msg.innerHTML = '<span style="color:#cc0000">' + ({no_instalado:'Falta libimobiledevice.', sin_dispositivo:'No hay iPhone conectado (desbloquéalo y dale "Confiar").', sin_trust:'El iPhone no confía en esta PC. Dale "Confiar".'}[r.motivo] || 'No se pudo leer.') + '</span>';
      return;
    }
    _fichaInfo = r;
    pintarFicha(r);
  } finally { btn.disabled = false; btn.textContent = o; }
}

function pintarFicha(r) {
  const i = r.info || {}, d = r.disk || {};
  const modelo = MODELOS[i.ProductType] || i.ProductType || '—';
  const totalGb = _gb(d.TotalDiskCapacity), freeGb = _gb(d.TotalDataAvailable);
  const fila = (l, v) => v ? `<div class="field"><label>${l}</label><b>${escapar(v)}</b></div>` : '';
  let html = '<div class="row">';
  html += fila('Modelo', modelo + (i.ProductType ? ' ('+i.ProductType+')' : ''));
  html += fila('iOS', i.ProductVersion);
  html += fila('Capacidad', totalGb ? totalGb+' GB' : (i.HardwareModel||''));
  html += fila('Almacenamiento libre', freeGb != null ? freeGb+' GB libres' : '');
  html += fila('Región', (i.RegionInfo||'') + (_regionNombre(i.RegionInfo) ? ' · '+_regionNombre(i.RegionInfo) : ''));
  html += fila('IMEI', i.InternationalMobileEquipmentIdentity);
  html += fila('IMEI 2', i.InternationalMobileEquipmentIdentity2);
  html += fila('Serie', i.SerialNumber);
  html += fila('Módem (Baseband)', i.BasebandVersion);
  html += fila('Activación', i.ActivationState);
  html += fila('MAC WiFi', i.WiFiAddress);
  html += fila('MAC Bluetooth', i.BluetoothAddress);
  html += fila('Nombre', i.DeviceName);
  html += '</div>';
  if (i.ActivationState && i.ActivationState !== 'Activated') {
    html += '<div class="alert alerta" style="margin-top:10px"><div>Estado de activación: <b>'+escapar(i.ActivationState)+'</b>. Verifica iCloud / bloqueo de activación antes de comprar.</div></div>';
  }
  document.getElementById('fichaTec').innerHTML = html;
  document.getElementById('btnImprimirFicha').classList.remove('hidden');

  // Carrier / IMEI
  const operador = i['kCTPostponementInfoServiceProvider'] || i.CarrierBundleName || '';
  let cbox = '<div class="row">';
  cbox += fila('Región del equipo', (i.RegionInfo||'—') + (_regionNombre(i.RegionInfo)?' · '+_regionNombre(i.RegionInfo):''));
  if (operador) cbox += fila('Operador (SIM actual)', operador);
  cbox += fila('IMEI', i.InternationalMobileEquipmentIdentity || '—');
  cbox += '</div>';
  document.getElementById('carrierBox').innerHTML = cbox;
  if (i.InternationalMobileEquipmentIdentity) document.getElementById('btnImei').classList.remove('hidden');
}

async function accDispositivo(accion) {
  const msg = document.getElementById('hToolMsg');
  if (!window.bde || !window.bde.deviceAccion) { alert('Solo en la app de escritorio.'); return; }
  if (accion === 'shutdown' && !confirm('¿Apagar el iPhone conectado?')) return;
  msg.innerHTML = '<span class="spin"></span> Enviando orden…';
  const r = await window.bde.deviceAccion(accion);
  msg.innerHTML = r.ok ? '✅ Orden enviada (' + (accion==='restart'?'reiniciar':'apagar') + ').' : '⚠️ ' + (r.motivo==='sin_dispositivo'?'No hay iPhone conectado.':'No se pudo.');
}

async function accSalirRecovery() {
  const msg = document.getElementById('hToolMsg');
  msg.innerHTML = '<span class="spin"></span> Intentando salir de Recovery…';
  const r = await window.bde.salirRecovery();
  msg.innerHTML = r.ok ? '✅ Listo, debería reiniciar normal.' : (r.motivo==='no_tool' ? '⚠️ Falta la herramienta "irecovery" en esta PC para esta función.' : '⚠️ No se pudo (¿está en modo Recovery?).');
}

async function accCaptura() {
  const msg = document.getElementById('hToolMsg');
  msg.innerHTML = '<span class="spin"></span> Tomando captura…';
  const r = await window.bde.captura();
  if (r.ok) msg.innerHTML = '✅ Captura guardada. <a href="#" onclick="window.bde.abrirArchivo(\''+r.file.replace(/\\/g,'\\\\')+'\');return false;">Ver archivo</a>';
  else if (r.motivo === 'sin_dispositivo') msg.innerHTML = '⚠️ No hay iPhone conectado.';
  else msg.innerHTML = '⚠️ No se pudo (en iOS nuevos puede requerir imagen de desarrollador).';
}

async function accApps() {
  const msg = document.getElementById('hToolMsg');
  msg.innerHTML = '<span class="spin"></span> Leyendo apps…';
  const r = await window.bde.appsLista();
  if (r.ok) {
    document.getElementById('appsCard').classList.remove('hidden');
    document.getElementById('appsBox').textContent = r.salida || '(sin datos)';
    msg.innerHTML = '✅ Apps listadas abajo.';
  } else msg.innerHTML = r.motivo==='no_tool' ? '⚠️ Falta "ideviceinstaller" en esta PC.' : '⚠️ No hay iPhone conectado.';
}

function verificarImei() {
  const imei = _fichaInfo && _fichaInfo.info ? _fichaInfo.info.InternationalMobileEquipmentIdentity : '';
  if (imei) window.open('https://www.imei.info/?imei=' + encodeURIComponent(imei), '_blank');
}

function imprimirFicha() {
  const cont = document.getElementById('fichaTec');
  const w = window.open('', '_blank');
  w.document.write('<html><head><title>Ficha técnica</title></head><body style="font-family:Arial;padding:20px"><h2>BAYOL CELL — Ficha técnica</h2>' + cont.innerHTML.replace(/class="[^"]*"/g,'') + '<p style="margin-top:20px;color:#888">' + new Date().toLocaleString('es-DO') + '</p></body></html>');
  w.document.close(); w.print();
}

// ---------------- PANTALLA (cambio + True Tone, con JC) ----------------
function prepararPantalla() {
  if (ultimaLectura && ultimaLectura.info) {
    const i = ultimaLectura.info;
    if (!document.getElementById('pt_modelo').value) document.getElementById('pt_modelo').value = MODELOS[i.ProductType] || i.ProductType || '';
    if (!document.getElementById('pt_imei').value) document.getElementById('pt_imei').value = i.InternationalMobileEquipmentIdentity || '';
  }
  cargarHistorialPantalla();
}

async function guardarPantalla(btn) {
  const modelo = document.getElementById('pt_modelo').value.trim();
  const imei = document.getElementById('pt_imei').value.trim() || null;
  if (!modelo) { alert('Pon al menos el modelo.'); return; }
  btn.disabled = true; const o = btn.textContent; btn.textContent = 'Guardando…';
  try {
    const { error } = await sb.from('pantalla_registros').insert({
      modelo, imei, udid: ultimaLectura ? ultimaLectura.udid : null,
      tipo_pantalla: document.getElementById('pt_tipo').value,
      true_tone: document.getElementById('pt_truetone').checked,
      mensaje_pantalla: !document.getElementById('pt_sinmensaje').checked, // marca = ya no hay mensaje
      brillo_auto: document.getElementById('pt_brillo').checked,
      multitactil_ok: document.getElementById('pt_tactil').checked
    });
    if (error) throw error;
    btn.textContent = '✅ Guardado';
    cargarHistorialPantalla();
    setTimeout(() => { btn.disabled = false; btn.textContent = o; }, 1500);
  } catch (e) { btn.disabled = false; btn.textContent = o; alert('No se pudo guardar: ' + (e.message||'')); }
}

async function cargarHistorialPantalla() {
  const cont = document.getElementById('ptHistorial');
  if (!cont) return;
  const imei = document.getElementById('pt_imei').value.trim();
  try {
    let q = sb.from('pantalla_registros').select('created_at,modelo,tipo_pantalla,true_tone,mensaje_pantalla,brillo_auto').order('created_at', { ascending: false }).limit(10);
    if (imei) q = q.eq('imei', imei);
    const { data, error } = await q;
    if (error) throw error;
    if (!data || !data.length) { cont.innerHTML = '<span class="muted">Sin registros todavía.</span>'; return; }
    cont.innerHTML = data.map(r => {
      const f = new Date(r.created_at).toLocaleString('es-DO', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
      const chk = (b) => b ? '✅' : '❌';
      return '<div style="border-top:1px solid #eee;padding:6px 0;font-size:12.5px">'
        + '<b>'+escapar(r.modelo||'—')+'</b> · '+escapar(r.tipo_pantalla||'')+' <span class="muted">('+f+')</span><br>'
        + 'True Tone '+chk(r.true_tone)+' · Sin mensaje '+chk(!r.mensaje_pantalla)+' · Brillo auto '+chk(r.brillo_auto)
        + '</div>';
    }).join('');
  } catch (e) { cont.innerHTML = '<span style="color:#cc0000">Error al cargar historial.</span>'; }
}

// ---------------- CÁMARA TÉRMICA (Fase 3) ----------------
let termStream = null;
let termImgB64 = null;       // imagen capturada (data URL)
let termPreparada = false;
const UMBRALES = [
  ['CPU / SoC (A-series)', 'Normal 30–65° · Alerta 65–80° · Crítico >80°'],
  ['PMIC (gestión energía)', 'Normal 25–55° · Alerta 55–75° · Crítico >75°'],
  ['Audio IC', 'Normal 25–50° · Alerta 50–70° · Crítico >70°'],
  ['Tristar / Hydra IC', 'Normal 25–45° · Alerta 45–65° · Crítico >65°'],
  ['Capacitores SMD', 'Normal 20–40° · Alerta 40–60° · Crítico >60°'],
  ['NAND Flash', 'Normal 25–55° · Alerta 55–70° · Crítico >70°'],
  ['Baseband IC', 'Normal 25–50° · Alerta 50–70° · Crítico >70°'],
  ['Touch IC', 'Normal 25–45° · Alerta 45–65° · Crítico >65°']
];

async function prepararTermica() {
  if (termPreparada) return;
  termPreparada = true;
  // Tabla de umbrales
  document.getElementById('termUmbrales').innerHTML =
    UMBRALES.map(u => '<div class="field"><label>'+u[0]+'</label><b style="font-size:12px">'+u[1]+'</b></div>').join('');
  // Lista de cámaras
  try {
    // Pedir permiso una vez para poder ver los nombres de las cámaras
    const tmp = await navigator.mediaDevices.getUserMedia({ video: true });
    tmp.getTracks().forEach(t => t.stop());
    const devs = await navigator.mediaDevices.enumerateDevices();
    const cams = devs.filter(d => d.kind === 'videoinput');
    const sel = document.getElementById('termCam');
    sel.innerHTML = cams.map((c, i) => '<option value="'+c.deviceId+'">'+(c.label || ('Cámara '+(i+1)))+'</option>').join('')
      || '<option value="">No se detectaron cámaras</option>';
  } catch (e) {
    document.getElementById('termHint').textContent = 'No se pudo acceder a las cámaras: ' + (e.message||'') + '. Conecta la cámara térmica y dale permiso.';
  }
}

async function iniciarCamaraTermica() {
  detenerCamaraTermica();
  const id = document.getElementById('termCam').value;
  try {
    termStream = await navigator.mediaDevices.getUserMedia({
      video: id ? { deviceId: { exact: id } } : true
    });
    document.getElementById('termVideo').srcObject = termStream;
  } catch (e) {
    alert('No se pudo iniciar la cámara: ' + (e.message||''));
  }
}

function detenerCamaraTermica() {
  if (termStream) { termStream.getTracks().forEach(t => t.stop()); termStream = null; }
  const v = document.getElementById('termVideo');
  if (v) v.srcObject = null;
}

function capturarTermica() {
  const v = document.getElementById('termVideo');
  if (!v.srcObject) { alert('Primero inicia la cámara o sube una imagen.'); return; }
  const c = document.getElementById('termCanvas');
  c.width = v.videoWidth || 640; c.height = v.videoHeight || 480;
  c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
  termImgB64 = c.toDataURL('image/jpeg', 0.9);
  mostrarCapturaTermica();
}

function cargarImagenTermica(input) {
  const f = input.files && input.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = e => { termImgB64 = String(e.target.result); mostrarCapturaTermica(); };
  r.readAsDataURL(f);
  input.value = '';
}

function mostrarCapturaTermica() {
  document.getElementById('termCaptura').classList.remove('hidden');
  document.getElementById('termImg').src = termImgB64;
  document.getElementById('termBtnIA').disabled = false;
  document.getElementById('termBtnGuardar').disabled = false;
  document.getElementById('termResultado').innerHTML = 'Imagen lista. Presiona “Analizar con IA”.';
}

async function analizarTermica() {
  if (!termImgB64) return;
  const btn = document.getElementById('termBtnIA');
  const out = document.getElementById('termResultado');
  btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Analizando…';
  out.innerHTML = '<span class="spin"></span> La IA está analizando la imagen térmica…';
  try {
    const modelo = document.getElementById('ia_modelo').value.trim() ||
      (ultimaLectura && (MODELOS[ultimaLectura.info?.ProductType] || ultimaLectura.info?.ProductType)) || '';
    const { data, error } = await sb.functions.invoke(CFG.EDGE_TERMICO, {
      body: { imagen_base64: termImgB64, modelo, contexto: document.getElementById('ia_historial').value.trim() }
    });
    if (error) throw error;
    if (!data || !data.ok) throw new Error(data && data.error ? data.error : 'La IA no respondió.');
    window._ultimoTermico = data.analisis;
    out.innerHTML = '<div class="ia-box">'+escapar(data.analisis)+'</div>';
  } catch (e) {
    let m = e.message || 'Error';
    if (/permis|denied|jwt|auth/i.test(m)) m = 'No tienes permiso o tu sesión expiró.';
    out.innerHTML = '<div class="alert critico"><div><div class="t">No se pudo analizar</div><div>'+escapar(m)+'</div></div></div>';
  } finally {
    btn.disabled = false; btn.textContent = '🧠 Analizar con IA';
  }
}

async function guardarTermica() {
  if (!termImgB64) return;
  const btn = document.getElementById('termBtnGuardar');
  btn.disabled = true; btn.textContent = 'Guardando…';
  try {
    // data URL -> Blob
    const resp = await fetch(termImgB64); const blob = await resp.blob();
    const nombre = 'termica/' + Date.now() + '.jpg';
    const up = await sb.storage.from(CFG.STORAGE_BUCKET).upload(nombre, blob, { contentType: 'image/jpeg', upsert: false });
    if (up.error) throw up.error;
    const modelo = document.getElementById('ia_modelo').value.trim() || '';
    const { error } = await sb.from('diagnostico_imagenes').insert({
      tipo: 'termica', storage_path: nombre, modelo,
      analisis_ia: window._ultimoTermico || null
    });
    if (error) throw error;
    btn.textContent = '✅ Guardado';
  } catch (e) {
    btn.disabled = false; btn.textContent = '💾 Reintentar guardar';
    alert('No se pudo guardar: ' + (e.message||''));
  }
}

// ---------------- MICROSCOPIO (Fase 4) ----------------
let micStream = null;
let micImgB64 = null;
let micPreparado = false;

async function prepararMicro() {
  if (micPreparado) return;
  micPreparado = true;
  try {
    const tmp = await navigator.mediaDevices.getUserMedia({ video: true });
    tmp.getTracks().forEach(t => t.stop());
    const devs = await navigator.mediaDevices.enumerateDevices();
    const cams = devs.filter(d => d.kind === 'videoinput');
    const sel = document.getElementById('micCam');
    sel.innerHTML = cams.map((c, i) => '<option value="'+c.deviceId+'">'+(c.label || ('Cámara '+(i+1)))+'</option>').join('')
      || '<option value="">No se detectaron cámaras</option>';
  } catch (e) { /* sin permiso aún */ }
}

async function iniciarMicroscopio() {
  detenerMicroscopio();
  const id = document.getElementById('micCam').value;
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ video: id ? { deviceId: { exact: id } } : true });
    document.getElementById('micVideo').srcObject = micStream;
  } catch (e) { alert('No se pudo iniciar el microscopio: ' + (e.message||'')); }
}

function detenerMicroscopio() {
  if (micStream) { micStream.getTracks().forEach(t => t.stop()); micStream = null; }
  const v = document.getElementById('micVideo'); if (v) v.srcObject = null;
}

function capturarMicro() {
  const v = document.getElementById('micVideo');
  if (!v.srcObject) { alert('Primero inicia el microscopio o sube una imagen.'); return; }
  const c = document.getElementById('micCanvas');
  c.width = v.videoWidth || 640; c.height = v.videoHeight || 480;
  c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
  micImgB64 = c.toDataURL('image/jpeg', 0.92);
  mostrarCapturaMicro();
}

function cargarImagenMicro(input) {
  const f = input.files && input.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = e => { micImgB64 = String(e.target.result); mostrarCapturaMicro(); };
  r.readAsDataURL(f); input.value = '';
}

function mostrarCapturaMicro() {
  document.getElementById('micCaptura').classList.remove('hidden');
  document.getElementById('micImg').src = micImgB64;
  document.getElementById('micBtnIA').disabled = false;
  document.getElementById('micBtnGuardar').disabled = false;
  document.getElementById('micResultado').innerHTML = 'Imagen lista. Presiona “Analizar con IA”.';
}

async function analizarMicro() {
  if (!micImgB64) return;
  const btn = document.getElementById('micBtnIA'), out = document.getElementById('micResultado');
  btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Analizando…';
  out.innerHTML = '<span class="spin"></span> La IA está revisando la imagen del microscopio…';
  try {
    const modelo = document.getElementById('ia_modelo').value.trim() ||
      (ultimaLectura && (MODELOS[ultimaLectura.info?.ProductType] || ultimaLectura.info?.ProductType)) || '';
    const { data, error } = await sb.functions.invoke(CFG.EDGE_VISUAL, {
      body: { imagen_base64: micImgB64, modelo, contexto: document.getElementById('ia_historial').value.trim() }
    });
    if (error) throw error;
    if (!data || !data.ok) throw new Error(data && data.error ? data.error : 'La IA no respondió.');
    window._ultimoMicro = data.analisis;
    out.innerHTML = '<div class="ia-box">'+escapar(data.analisis)+'</div>';
  } catch (e) {
    let m = e.message || 'Error';
    if (/permis|denied|jwt|auth/i.test(m)) m = 'No tienes permiso o tu sesión expiró.';
    out.innerHTML = '<div class="alert critico"><div><div class="t">No se pudo analizar</div><div>'+escapar(m)+'</div></div></div>';
  } finally { btn.disabled = false; btn.textContent = '🧠 Analizar con IA'; }
}

async function guardarMicro() {
  if (!micImgB64) return;
  const btn = document.getElementById('micBtnGuardar');
  btn.disabled = true; btn.textContent = 'Guardando…';
  try {
    const resp = await fetch(micImgB64); const blob = await resp.blob();
    const nombre = 'microscopio/' + Date.now() + '.jpg';
    const up = await sb.storage.from(CFG.STORAGE_BUCKET).upload(nombre, blob, { contentType: 'image/jpeg', upsert: false });
    if (up.error) throw up.error;
    const modelo = document.getElementById('ia_modelo').value.trim() || '';
    const { error } = await sb.from('diagnostico_imagenes').insert({
      tipo: 'microscopio', storage_path: nombre, modelo, analisis_ia: window._ultimoMicro || null
    });
    if (error) throw error;
    btn.textContent = '✅ Guardado';
  } catch (e) {
    btn.disabled = false; btn.textContent = '💾 Reintentar guardar';
    alert('No se pudo guardar: ' + (e.message||''));
  }
}

// ---------------- ESQUEMÁTICOS REEFOX (Fase 5) ----------------
let reefoxCargado = false;

function prepararEsquematicos() {
  const wv = document.getElementById('reefoxView');
  if (wv && !reefoxCargado) {
    wv.src = CFG.REEFOX_URL;
    reefoxCargado = true;
  }
  renderComponentesDetectados();
}

function reefoxRecargar() {
  const wv = document.getElementById('reefoxView');
  try { wv.reload(); } catch (e) { wv.src = CFG.REEFOX_URL; }
}

function reefoxAbrirFuera() {
  window.open(CFG.REEFOX_URL, '_blank');
}

// Saca referencias de componentes (U2, J3300, PP_VCC, C12...) del último diagnóstico/panic
function extraerComponentes(texto) {
  if (!texto) return [];
  const out = new Set();
  const re = /\b(U\d{2,5}|J\d{3,5}|FL\d{2,4}|L\d{3,4}|C\d{3,4}|R\d{3,4}|Q\d{3,4}|PP[_A-Z0-9]{2,}|PMIC|Tristar|Tigris|Hydra|Audio IC|Touch IC|baseband|NAND|SEP)\b/gi;
  let m;
  while ((m = re.exec(texto)) !== null) { out.add(m[1]); if (out.size >= 24) break; }
  return Array.from(out);
}

function renderComponentesDetectados() {
  const cont = document.getElementById('reefoxComponentes');
  if (!cont) return;
  const fuente = [(window._ultimoDiag && window._ultimoDiag.diagnostico) || '',
                  document.getElementById('ia_panic') ? document.getElementById('ia_panic').value : ''].join('\n');
  const comps = extraerComponentes(fuente);
  if (!comps.length) {
    cont.innerHTML = '<span class="muted">— Aún no hay componentes. Haz un diagnóstico y aquí saldrán para buscarlos en REEFOX.</span>';
    return;
  }
  cont.innerHTML = comps.map(c => '<span class="chip" title="Copiar" onclick="copiarComponente(this,\''+c.replace(/'/g,"")+'\')">'+escapar(c)+'</span>').join('');
}

function copiarComponente(el, texto) {
  try {
    navigator.clipboard.writeText(texto);
    const orig = el.textContent;
    el.textContent = '✓ ' + texto;
    el.classList.add('on');
    setTimeout(() => { el.textContent = orig; el.classList.remove('on'); }, 1200);
  } catch (e) { /* nada */ }
}

// ---------------- CAPTURA DE PANTALLA (para el programa de REEFOX) ----------------
let _capTarget = null;
async function capturarPantalla(target) {
  _capTarget = target;
  if (!window.bde || !window.bde.getSources) { alert('La captura de pantalla solo funciona en la app de escritorio instalada.'); return; }
  try {
    const sources = await window.bde.getSources();
    const list = document.getElementById('srcList');
    list.innerHTML = sources.map(s =>
      '<button class="btn sec" style="display:block;width:100%;text-align:left;margin-bottom:6px" onclick="capturarDeFuente(\''+s.id+'\')">'+escapar(s.name)+'</button>'
    ).join('') || '<p class="muted">No se encontraron ventanas.</p>';
    document.getElementById('srcPicker').classList.remove('hidden');
  } catch (e) { alert('No se pudo listar las ventanas: ' + (e.message||'')); }
}

async function capturarDeFuente(id) {
  document.getElementById('srcPicker').classList.add('hidden');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: id, maxWidth: 1920, maxHeight: 1080 } }
    });
    const video = document.createElement('video');
    video.srcObject = stream; await video.play();
    await new Promise(r => setTimeout(r, 300));
    const c = document.createElement('canvas');
    c.width = video.videoWidth || 1280; c.height = video.videoHeight || 720;
    c.getContext('2d').drawImage(video, 0, 0, c.width, c.height);
    const data = c.toDataURL('image/jpeg', 0.92);
    stream.getTracks().forEach(t => t.stop());
    if (_capTarget === 'termica') { termImgB64 = data; mostrarCapturaTermica(); vista('termica', document.getElementById('m-termica')); }
    else { micImgB64 = data; mostrarCapturaMicro(); vista('microscopio', document.getElementById('m-microscopio')); }
  } catch (e) { alert('No se pudo capturar la pantalla: ' + (e.message||'')); }
}

// ---------------- BASE DE CONOCIMIENTO (Fase 6) ----------------
async function cargarConocimiento() {
  // Prellenar el formulario con el último diagnóstico si está vacío
  if (!document.getElementById('co_modelo').value) {
    document.getElementById('co_modelo').value = document.getElementById('ia_modelo').value || '';
    document.getElementById('co_panic').value = (window.matchPanic && document.getElementById('ia_panic').value)
      ? ((window.matchPanic(document.getElementById('ia_panic').value) || {}).codigo || '') : '';
  }
  const lista = document.getElementById('conoLista');
  lista.innerHTML = '<span class="spin"></span> Cargando…';
  try {
    const { data, error } = await sb.from('conocimiento_casos')
      .select('*').order('veces_confirmado', { ascending: false }).order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    renderConoStats(data || []);
    if (!data || !data.length) { lista.innerHTML = '<p class="muted" style="text-align:left">Aún no hay casos. Registra el primero al terminar una reparación.</p>'; return; }
    window._conoCasos = {};
    let html = '';
    data.forEach(c => {
      window._conoCasos[c.id] = c;
      const ok = c.exitoso ? '✅' : '❌';
      html += '<div style="border:1px solid #eee;border-radius:10px;padding:10px;margin-bottom:8px">'
        + '<div style="display:flex;justify-content:space-between;gap:8px"><b>'+escapar(c.modelo||'—')+'</b>'
        + '<span class="muted">'+ok+' · confirmado '+(c.veces_confirmado||1)+'×</span></div>'
        + (c.panic_code ? '<div style="font-size:12px;color:#888">'+escapar(c.panic_code)+'</div>' : '')
        + (c.sintomas && c.sintomas.length ? '<div style="font-size:12px">Síntomas: '+escapar(c.sintomas.join(', '))+'</div>' : '')
        + '<div style="font-size:13px;margin-top:4px">'+escapar(c.solucion||'')+'</div>'
        + '<div style="text-align:right"><button class="btn sec" style="padding:4px 8px;font-size:11px" onclick="borrarCaso(\''+c.id+'\')">🗑</button></div>'
        + '</div>';
    });
    lista.innerHTML = html;
  } catch (e) { lista.innerHTML = '<p style="color:#cc0000">Error: '+escapar(e.message||'')+'</p>'; }
}

function renderConoStats(casos) {
  const cont = document.getElementById('conoStats');
  const total = casos.length;
  const exitosos = casos.filter(c => c.exitoso).length;
  const pct = total ? Math.round((exitosos/total)*100) : 0;
  const porModelo = {};
  casos.forEach(c => { if (c.modelo) porModelo[c.modelo] = (porModelo[c.modelo]||0)+1; });
  const topModelo = Object.entries(porModelo).sort((a,b)=>b[1]-a[1])[0];
  cont.innerHTML =
    '<div class="field"><label>Casos guardados</label><b>'+total+'</b></div>'
    + '<div class="field"><label>Tasa de éxito</label><b>'+pct+'%</b></div>'
    + '<div class="field"><label>Modelo más frecuente</label><b>'+(topModelo?escapar(topModelo[0])+' ('+topModelo[1]+')':'—')+'</b></div>';
}

async function registrarCaso() {
  const modelo = document.getElementById('co_modelo').value.trim();
  const panic_code = document.getElementById('co_panic').value.trim() || null;
  const sintomas = document.getElementById('co_sintomas').value.split(',').map(s=>s.trim()).filter(Boolean);
  const solucion = document.getElementById('co_solucion').value.trim();
  const exitoso = document.getElementById('co_exitoso').value === 'true';
  const tiempo_minutos = parseInt(document.getElementById('co_tiempo').value, 10) || null;
  const piezas = document.getElementById('co_piezas').value.split(',').map(s=>s.trim()).filter(Boolean);
  if (!modelo || !solucion) { alert('Pon al menos el modelo y la solución aplicada.'); return; }
  const btn = document.getElementById('co_btn'); btn.disabled = true; const o = btn.textContent; btn.textContent = 'Guardando…';
  try {
    // ¿Existe ya un caso igual? (mismo modelo + código + solución) -> se confirma
    let q = sb.from('conocimiento_casos').select('id,veces_confirmado').eq('modelo', modelo).eq('solucion', solucion);
    q = panic_code ? q.eq('panic_code', panic_code) : q.is('panic_code', null);
    const { data: ex } = await q.maybeSingle();
    if (ex) {
      const { error } = await sb.from('conocimiento_casos').update({ veces_confirmado: (ex.veces_confirmado||1)+1, exitoso }).eq('id', ex.id);
      if (error) throw error;
      btn.textContent = '✅ Caso confirmado (+1)';
    } else {
      const { error } = await sb.from('conocimiento_casos').insert({
        modelo, panic_code, sintomas, solucion, exitoso, tiempo_minutos, piezas_usadas: piezas
      });
      if (error) throw error;
      btn.textContent = '✅ Caso guardado';
    }
    document.getElementById('co_solucion').value = '';
    document.getElementById('co_piezas').value = '';
    cargarConocimiento();
    setTimeout(() => { btn.disabled = false; btn.textContent = o; }, 1500);
  } catch (e) { btn.disabled = false; btn.textContent = o; alert('No se pudo guardar: ' + (e.message||'')); }
}

async function borrarCaso(id) {
  if (!confirm('¿Eliminar este caso de la base de conocimiento?')) return;
  try { const { error } = await sb.from('conocimiento_casos').delete().eq('id', id); if (error) throw error; cargarConocimiento(); }
  catch (e) { alert('No se pudo eliminar: ' + (e.message||'')); }
}

// ---------------- MANTENIMIENTO (actualizar / versión anterior / backup) ----------------
async function actualizarApp(btn) {
  const out = document.getElementById('mtUpd');
  btn.disabled = true; const o = btn.textContent; btn.textContent = 'Buscando…';
  out.innerHTML = '<span class="spin"></span> Buscando última versión…';
  try {
    const r = await fetch('https://api.github.com/repos/' + CFG.REPO + '/releases/latest');
    const d = await r.json();
    const asset = (d.assets || []).find(a => /\.exe$/i.test(a.name));
    const fecha = d.published_at ? new Date(d.published_at).toLocaleString('es-DO') : '';
    if (asset) {
      out.innerHTML = '<div class="alert info"><div><div class="t">Última versión disponible</div>'
        + '<div>Publicada: ' + escapar(fecha) + '</div></div></div>'
        + '<button class="btn" style="margin-top:8px" onclick="window.open(\'' + asset.browser_download_url + '\',\'_blank\')">⬇ Descargar e instalar ahora</button>'
        + '<p class="muted" style="text-align:left;margin-top:6px">Al terminar de descargar, abre el archivo, instala encima y vuelve a abrir la app.</p>';
    } else {
      out.innerHTML = '<button class="btn" onclick="window.open(\'https://github.com/' + CFG.REPO + '/releases/latest\',\'_blank\')">⬇ Abrir descarga</button>';
    }
  } catch (e) {
    out.innerHTML = '<div class="alert critico"><div>No se pudo verificar. <a href="#" onclick="window.open(\'https://github.com/' + CFG.REPO + '/releases/latest\',\'_blank\');return false;">Abrir descarga manual</a></div></div>';
  } finally { btn.disabled = false; btn.textContent = o; }
}

function versionAnterior() {
  window.open('https://github.com/' + CFG.REPO + '/releases', '_blank');
}

// Tablas a respaldar (datos del negocio)
const BACKUP_TABLAS = ['clientes','equipos','ordenes_reparacion','orden_piezas','orden_piezas_usadas','orden_notas','orden_historial',
  'tareas_trabajo','equipo_fallas','equipo_piezas_pedidas','equipo_devoluciones','equipo_historial','equipos_refurbish',
  'refurb_lotes','refurb_evaluaciones','refurb_bitacora','refurb_ventas','costos_refurb',
  'tecnicos','usuarios','roles','roles_taller','proveedores','articulos','piezas_inventario','movimientos_inventario',
  'fallas','falla_categorias','fallas_comunes','catalogo_categorias','catalogo_marcas','activos_taller','config_taller','control_calidad',
  'financiamientos','financiamiento_pagos','fin_clientes','fin_referencias','fin_solicitudes','fin_planes','fin_config','fin_documentos',
  'conta_cuentas','conta_categorias','conta_asientos','conta_asiento_lineas','conta_movimientos',
  'conocimiento_casos','diagnosticos','diagnostico_imagenes','panic_logs','infoplus_articulos','web_visitas'];

async function _fetchAll(tabla) {
  let desde = 0, paso = 1000, todo = [];
  while (true) {
    const { data, error } = await sb.from(tabla).select('*').range(desde, desde + paso - 1);
    if (error) throw error;
    todo = todo.concat(data || []);
    if (!data || data.length < paso) break;
    desde += paso;
  }
  return todo;
}

async function backupDatos(btn) {
  const out = document.getElementById('mtBackup');
  if (!sesionTecnico || sesionTecnico.rol !== 'admin') {
    out.innerHTML = '<div class="alert alerta"><div>El backup completo es solo para el administrador. Entra con el usuario admin.</div></div>';
    return;
  }
  btn.disabled = true; const o = btn.textContent; btn.textContent = 'Respaldando…';
  const backup = { _meta: { fecha: new Date().toISOString(), version: CFG.APP_VERSION, por: sesionTecnico.nombre }, tablas: {} };
  let hechas = 0, fallidas = [];
  for (const tabla of BACKUP_TABLAS) {
    out.innerHTML = '<span class="spin"></span> Respaldando ' + tabla + '… (' + hechas + '/' + BACKUP_TABLAS.length + ')';
    try { backup.tablas[tabla] = await _fetchAll(tabla); hechas++; }
    catch (e) { fallidas.push(tabla); }
  }
  try {
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'bayol-backup-' + new Date().toISOString().slice(0,10) + '.json';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    const total = Object.values(backup.tablas).reduce((s,arr) => s + (arr ? arr.length : 0), 0);
    out.innerHTML = '<div class="alert info"><div><div class="t">✅ Backup descargado</div>'
      + '<div>' + hechas + ' tablas · ' + total + ' registros' + (fallidas.length ? ' · (sin acceso: ' + fallidas.join(', ') + ')' : '') + '</div></div></div>';
  } catch (e) { out.innerHTML = '<div class="alert critico"><div>No se pudo crear el archivo: ' + escapar(e.message||'') + '</div></div>'; }
  finally { btn.disabled = false; btn.textContent = o; }
}

// ---------------- BACKUP DEL IPHONE ----------------
let _opSubscrito = false;
function _opLog(line) {
  const el = document.getElementById('opProgreso');
  if (!el) return;
  el.classList.remove('hidden');
  el.textContent += line + '\n';
  el.scrollTop = el.scrollHeight;
}
function _subOp() {
  if (_opSubscrito || !window.bde || !window.bde.onOpProgress) return;
  window.bde.onOpProgress(_opLog); _opSubscrito = true;
}

async function backupIphone(btn) {
  if (!window.bde || !window.bde.iphoneBackup) { alert('El backup del iPhone solo funciona en la app de escritorio instalada.'); return; }
  _subOp();
  const el = document.getElementById('opProgreso'); el.classList.remove('hidden'); el.textContent = '';
  btn.disabled = true; const o = btn.textContent; btn.textContent = 'Respaldando…';
  try {
    const r = await window.bde.iphoneBackup();
    if (r.ok) _opLog('✅ Backup completo. Carpeta: ' + r.dir);
    else if (r.motivo === 'no_instalado') _opLog('⚠️ Falta libimobiledevice en la PC.');
    else if (r.motivo === 'sin_dispositivo') _opLog('⚠️ No hay iPhone conectado (desbloquéalo y dale "Confiar").');
    else _opLog('❌ No se completó el backup (código ' + r.code + '). Si el iPhone pide clave de cifrado de copias, revísalo.');
  } catch (e) { _opLog('❌ Error: ' + (e.message || '')); }
  finally { btn.disabled = false; btn.textContent = o; }
}

async function restaurarIphone(btn) {
  if (!window.bde || !window.bde.iphoneRestore) { alert('Solo funciona en la app de escritorio instalada.'); return; }
  if (!confirm('⚠️ Restaurar SOBREESCRIBE los datos del iPhone con el último backup guardado. Úsalo solo en el MISMO equipo. ¿Continuar?')) return;
  _subOp();
  const el = document.getElementById('opProgreso'); el.classList.remove('hidden'); el.textContent = '';
  btn.disabled = true; const o = btn.textContent; btn.textContent = 'Restaurando…';
  try {
    const r = await window.bde.iphoneRestore();
    _opLog(r.ok ? '✅ Restauración completa.' : '❌ No se completó (código ' + r.code + ').');
  } catch (e) { _opLog('❌ Error: ' + (e.message || '')); }
  finally { btn.disabled = false; btn.textContent = o; }
}

async function abrirCarpetaBackups() {
  if (window.bde && window.bde.openBackups) await window.bde.openBackups();
  else alert('Solo en la app de escritorio.');
}

// Si ya hay sesión activa al abrir, entrar directo
(async () => {
  const { data } = await sb.auth.getSession();
  if (data && data.session) {
    const u = data.session.user;
    const refId = u.user_metadata?.ref_id;
    let nombre = (u.email||'').split('@')[0], rol = 'técnico';
    if (refId) {
      const { data: t } = await sb.from('tecnicos').select('nombre,rol').eq('id', refId).maybeSingle();
      if (t) { nombre = t.nombre||nombre; rol = t.rol||rol; }
    }
    sesionTecnico = { usuario: nombre, nombre, rol };
    iniciarApp();
  }
})();
