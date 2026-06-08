// MÓDULO 1 — LECTOR DE DISPOSITIVO (USB)
// Ejecuta libimobiledevice (ideviceinfo / idevicecrashreport) para leer el
// iPhone conectado SIN jailbreak y extraer datos + panic logs automáticamente.
const { execFile } = require('child_process');
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

  // 3) Dominio batería
  const bat = await run('ideviceinfo', ['-u', udid, '-q', 'com.apple.mobile.battery'], 15000);
  const bateria = parseKV(bat.stdout);

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

  return { ok: true, udid, info, bateria, panics };
}

module.exports = { checkTools, leerDispositivo };
