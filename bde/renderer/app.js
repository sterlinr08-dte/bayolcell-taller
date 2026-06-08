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
const TITULOS = { lector:'Lector de dispositivo', panic:'Analizador de Panic Log', ia:'Diagnóstico IA', termica:'Cámara térmica', microscopio:'Microscopio' };
function vista(v, btn) {
  document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  ['lector','panic','ia','termica','microscopio'].forEach(x => document.getElementById('v-'+x).classList.toggle('hidden', x !== v));
  document.getElementById('tbTitle').textContent = TITULOS[v] || '';
  if (v === 'termica') prepararTermica();
  if (v === 'microscopio') prepararMicro();
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
