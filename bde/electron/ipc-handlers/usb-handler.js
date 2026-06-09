// MÓDULO 1 — LECTOR DE DISPOSITIVO (USB)
// Ejecuta libimobiledevice (ideviceinfo / idevicecrashreport) para leer el
// iPhone conectado SIN jailbreak y extraer datos + panic logs automáticamente.
const { execFile, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Carpeta donde se incluyen los binarios de libimobiledevice para Windows.
// En desarrollo: bde/bin   |   En producción (instalado): resources/bin
function binDir() {
  if (process.resourcesPath && fs.existsSync(path.join(process.resourcesPath, 'bin'))) {
    return path.join(process.resourcesPath, 'bin');
  }
  return path.join(__dirname, '..', '..', 'bin');
}

// Resuelve la ruta de una herramienta: primero la versión incluida, si no, la del PATH del sistema.
function tool(name) {
  const exe = process.platform === 'win32' ? name + '.exe' : name;
  const local = path.join(binDir(), exe);
  if (fs.existsSync(local)) return local;
  return exe; // confía en que esté en el PATH (ej. instalada con scoop/iTunes)
}

function run(name, args, timeout = 30000) {
  return new Promise((resolve) => {
    execFile(tool(name), args, { timeout, windowsHide: true }, (err, stdout, stderr) => {
      resolve({ err, stdout: (stdout || '').toString(), stderr: (stderr || '').toString() });
    });
  });
}

// Convierte la salida "Clave: Valor" de ideviceinfo en un objeto
function parseKV(text) {
  const out = {};
  text.split(/\r?\n/).forEach((line) => {
    const i = line.indexOf(':');
    if (i > 0) out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  });
  return out;
}

// ¿Está instalado libimobiledevice?
async function checkTools() {
  const r = await run('ideviceinfo', ['-h'], 8000);
  // -h imprime ayuda; si el binario no existe, err.code === 'ENOENT'
  if (r.err && (r.err.code === 'ENOENT' || /not recognized|no such file/i.test(r.stderr))) {
    return { ok: false, motivo: 'no_instalado' };
  }
  return { ok: true };
}

// Extrae el panicString de un archivo .ips de panic
function leerPanicIps(file) {
  let txt = '';
  try { txt = fs.readFileSync(file, 'utf8'); } catch (e) { return null; }
  let panicString = '';
  // Los .ips suelen tener: primera línea = cabecera JSON, resto = cuerpo JSON
  try {
    const nl = txt.indexOf('\n');
    const body = JSON.parse(txt.slice(nl + 1));
    panicString = body.panicString || body.panicStringStr || '';
  } catch (e) { /* sigue con regex */ }
  if (!panicString) {
    const m = txt.match(/"panicString"\s*:\s*"([\s\S]*?)"\s*[,}]/);
    if (m) panicString = m[1].replace(/\\n/g, '\n');
  }
  return {
    archivo: path.basename(file),
    panicString: panicString || '',
    raw: txt.slice(0, 20000)
  };
}

// Devuelve el UDID del iPhone conectado ahora (o null). Rápido, para auto-detección.
async function dispositivoActual() {
  try { return await _udidConectado(); } catch (e) { return null; }
}

// Lee TODO el dispositivo: info general + batería + panic logs
async function leerDispositivo() {
  const check = await checkTools();
  if (!check.ok) {
    return { ok: false, motivo: 'no_instalado',
      mensaje: 'No se encontró libimobiledevice. Instálalo en la PC (ver README) o usa el Modo demostración.' };
  }

  // 1) ¿Hay un dispositivo conectado?
  const list = await run('idevice_id', ['-l'], 10000);
  const udid = (list.stdout || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean)[0];
  if (!udid) {
    return { ok: false, motivo: 'sin_dispositivo',
      mensaje: 'No se detectó ningún iPhone. Conéctalo por USB y desbloquéalo (dale "Confiar" si aparece).' };
  }

  // 2) Info general
  const gen = await run('ideviceinfo', ['-u', udid], 25000);
  if (gen.err && /pairing|trust|lockdown/i.test(gen.stderr)) {
    return { ok: false, motivo: 'sin_trust',
      mensaje: 'El iPhone no ha confiado en esta PC. Desbloquéalo y toca "Confiar" en la pantalla del teléfono.' };
  }
  const info = parseKV(gen.stdout);

  // 3) Dominio batería (carga/estado) + IORegistry (ciclos/salud/capacidad)
  const bat = await run('ideviceinfo', ['-u', udid, '-q', 'com.apple.mobile.battery'], 15000);
  const bateria = parseKV(bat.stdout);
  Object.assign(bateria, await _ioBateria(udid));

  // 3b) Almacenamiento (para la pantalla de Inicio)
  const disk = parseKV((await run('ideviceinfo', ['-u', udid, '-q', 'com.apple.disk_usage'], 15000)).stdout);

  // 4) Panic logs
  const crashDir = path.join(os.tmpdir(), 'bayol_crash_' + udid);
  try { fs.mkdirSync(crashDir, { recursive: true }); } catch (e) {}
  await run('idevicecrashreport', ['-u', udid, '-k', crashDir], 40000);
  const panics = [];
  try {
    const walk = (dir) => {
      for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        const st = fs.statSync(full);
        if (st.isDirectory()) walk(full);
        else if (/^panic-full.*\.ips$/i.test(name)) {
          const p = leerPanicIps(full);
          if (p) panics.push(p);
        }
      }
    };
    walk(crashDir);
  } catch (e) {}

  return { ok: true, udid, info, bateria, disk, panics };
}

// ---- Backup / restauración del iPhone (idevicebackup2) ----
function backupsBase() {
  return path.join(os.homedir(), 'Documents', 'BAYOL Backups');
}

// Ejecuta un comando y manda cada línea de salida a onLine (para mostrar progreso)
function runStream(name, args, onLine) {
  return new Promise((resolve) => {
    let proc;
    try { proc = spawn(tool(name), args, { windowsHide: true }); }
    catch (e) { onLine('ERROR: ' + e.message); return resolve(-1); }
    let buf = '';
    const handle = (chunk) => {
      buf += chunk.toString();
      let i;
      while ((i = buf.indexOf('\n')) >= 0) { const l = buf.slice(0, i).trim(); if (l) onLine(l); buf = buf.slice(i + 1); }
    };
    proc.stdout.on('data', handle);
    proc.stderr.on('data', handle);
    proc.on('error', (e) => { onLine('ERROR: ' + e.message); resolve(-1); });
    proc.on('close', (code) => { if (buf.trim()) onLine(buf.trim()); resolve(code); });
  });
}

async function _udidConectado() {
  const list = await run('idevice_id', ['-l'], 10000);
  return (list.stdout || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean)[0] || null;
}

async function iphoneBackup(onLine) {
  if (!(await checkTools()).ok) return { ok: false, motivo: 'no_instalado' };
  const udid = await _udidConectado();
  if (!udid) return { ok: false, motivo: 'sin_dispositivo' };
  const dir = backupsBase();
  try { fs.mkdirSync(dir, { recursive: true }); } catch (e) {}
  onLine('Iniciando backup del iPhone (' + udid + ')…');
  onLine('Carpeta: ' + dir);
  const code = await runStream('idevicebackup2', ['-u', udid, 'backup', '--full', dir], onLine);
  if (code === 0) return { ok: true, dir: path.join(dir, udid) };
  return { ok: false, motivo: 'fallo', code };
}

async function iphoneRestore(onLine) {
  if (!(await checkTools()).ok) return { ok: false, motivo: 'no_instalado' };
  const udid = await _udidConectado();
  if (!udid) return { ok: false, motivo: 'sin_dispositivo' };
  const dir = backupsBase();
  onLine('Restaurando backup al iPhone (' + udid + ')… NO desconectes el equipo.');
  const code = await runStream('idevicebackup2', ['-u', udid, 'restore', '--system', '--settings', dir], onLine);
  if (code === 0) return { ok: true };
  return { ok: false, motivo: 'fallo', code };
}

// Lee ciclos/salud/capacidad de la batería del IORegistry (como 3uTools).
// El dominio com.apple.mobile.battery NO trae estos datos; el IORegistry sí.
async function _ioBateria(udid) {
  const r = await run('idevicediagnostics', ['-u', udid, 'ioregistry', 'IOPMPowerSource'], 20000);
  const txt = r.stdout || '';
  const gi = (k) => { const m = txt.match(new RegExp('<key>' + k + '<\\/key>\\s*<integer>(\\d+)<\\/integer>')); return m ? m[1] : null; };
  const out = {};
  const cyc = gi('CycleCount'); if (cyc) out.CycleCount = cyc;
  const des = gi('DesignCapacity'); if (des) out.DesignCapacity = des;
  const nom = gi('NominalChargeCapacity') || gi('AppleRawMaxCapacity'); if (nom) out.NominalChargeCapacity = nom;
  const volt = gi('Voltage'); if (volt) out.BatteryVoltage = volt;
  const temp = gi('Temperature'); if (temp) out.Temperature = temp; // centi-°C (ej 3012 = 30.12°C)
  const cur = gi('CurrentCapacity'); if (cur) out.CurrentCapacity = cur; // % actual
  return out;
}

// ---- Herramientas iPhone (ficha técnica completa + acciones) ----
async function infoCompleta() {
  if (!(await checkTools()).ok) return { ok: false, motivo: 'no_instalado' };
  const udid = await _udidConectado();
  if (!udid) return { ok: false, motivo: 'sin_dispositivo' };
  const gen = await run('ideviceinfo', ['-u', udid], 25000);
  if (gen.err && /pairing|trust|lockdown/i.test(gen.stderr)) return { ok: false, motivo: 'sin_trust' };
  const info = parseKV(gen.stdout);
  const disk = parseKV((await run('ideviceinfo', ['-u', udid, '-q', 'com.apple.disk_usage'], 15000)).stdout);
  const bat = parseKV((await run('ideviceinfo', ['-u', udid, '-q', 'com.apple.mobile.battery'], 15000)).stdout);
  Object.assign(bat, await _ioBateria(udid));
  return { ok: true, udid, info, disk, bateria: bat };
}

async function deviceAccion(accion) {
  const udid = await _udidConectado();
  if (!udid) return { ok: false, motivo: 'sin_dispositivo' };
  if (accion === 'restart') { await run('idevicediagnostics', ['-u', udid, 'restart'], 15000); return { ok: true }; }
  if (accion === 'shutdown') { await run('idevicediagnostics', ['-u', udid, 'shutdown'], 15000); return { ok: true }; }
  return { ok: false };
}

async function salirRecovery() {
  const r = await run('irecovery', ['-n'], 15000);
  if (r.err && (r.err.code === 'ENOENT' || /not recognized/i.test(r.stderr))) return { ok: false, motivo: 'no_tool' };
  return { ok: true };
}

async function captura() {
  const udid = await _udidConectado();
  if (!udid) return { ok: false, motivo: 'sin_dispositivo' };
  const dir = path.join(backupsBase(), 'capturas');
  try { fs.mkdirSync(dir, { recursive: true }); } catch (e) {}
  const file = path.join(dir, 'iphone_' + Date.now() + '.png');
  const r = await run('idevicescreenshot', ['-u', udid, file], 30000);
  if (r.err) return { ok: false, motivo: 'fallo', detalle: (r.stderr || '').slice(0, 300) };
  return { ok: true, file };
}

async function appsLista() {
  const udid = await _udidConectado();
  if (!udid) return { ok: false, motivo: 'sin_dispositivo' };
  const r = await run('ideviceinstaller', ['-u', udid, 'list'], 30000);
  if (r.err && (r.err.code === 'ENOENT' || /not recognized/i.test(r.stderr))) return { ok: false, motivo: 'no_tool' };
  return { ok: true, salida: (r.stdout || '') };
}

module.exports = { checkTools, leerDispositivo, dispositivoActual, backupsBase, iphoneBackup, iphoneRestore, infoCompleta, deviceAccion, salirRecovery, captura, appsLista };
