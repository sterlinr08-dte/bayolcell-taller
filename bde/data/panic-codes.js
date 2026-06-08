// MÓDULO 2 — BASE DE CÓDIGOS DE PANIC (sección 4.3 de la especificación)
// Mapa código de panic -> modelos -> bus/zona -> acción. Se usa para un primer
// análisis local instantáneo antes de consultar a la IA.
(function (g) {
  const PANIC_DB = [
    { match: /i2c0.*(hang|stuck|CheckBusStatus|SCL)/i, codigo: 'i2c0 hang / SCL stuck low',
      modelos: ['iPhone 6', '6+', '6 Plus', 'iPhone X', 'iPhone 8', '8+', '8 Plus'],
      zona: 'Bus I2C0: cámara, conector de batería, puerto de carga, Touch IC',
      accion: 'Revisar flex de carga y conector de batería (J6400). Verificar continuidad SCL. Touch IC U2401/U2402.' },
    { match: /i2c1.*(hang|stuck)/i, codigo: 'i2c1 hang',
      modelos: ['iPhone 7', '7+', '7 Plus'],
      zona: 'Bus I2C1: cámaras frontal/trasera, sensores',
      accion: 'Revisar conectores de cámara frontal y trasera.' },
    { match: /i2c2.*(hang|stuck)/i, codigo: 'i2c2 hang',
      modelos: ['iPhone 6S', '6SP', 'iPhone 7', '7+', 'iPhone 8', 'iPhone X', 'XS Max', 'XR', 'iPhone 12'],
      zona: 'Bus I2C2: vibrador, conector de carga (J3100/J3300), micrófono, Audio IC',
      accion: 'Revisar flex/conector de carga y micrófono trasero. Posible Audio IC.' },
    { match: /i2c3.*(hang|stuck)/i, codigo: 'i2c3 hang',
      modelos: ['iPhone 7', '7+', 'iPhone 8', '8+'],
      zona: 'Bus I2C3: flex de carga, conector de pantalla, backlight IC',
      accion: 'Revisar flex dock, pantalla o backlight driver.' },
    { match: /thermalmonitord.*prs0|missing sensor.*prs0/i, codigo: 'watchdog timeout — missing sensor prs0',
      modelos: ['iPhone 11', '12', '13'],
      zona: 'Sensor de presión en flex de carga (dock flex)',
      accion: 'Reemplazar flex de carga completa.' },
    { match: /thermalmonitord.*mic[12]|missing sensor.*mic/i, codigo: 'watchdog timeout — missing sensor mic1/mic2',
      modelos: ['iPhone 8', '9', '10', '11', '12', '13', '14', '15'],
      zona: 'Micrófonos en flex de carga',
      accion: 'Reemplazar flex de carga o micrófono.' },
    { match: /thermalmonitord.*TG0B|missing sensor.*TG0B/i, codigo: 'watchdog timeout — missing sensor TG0B',
      modelos: ['iPhone X', '11', '12', '13', '14', '15'],
      zona: 'Sensor térmico de batería',
      accion: 'Revisar conector de batería / batería dañada.' },
    { match: /AOP.*DATA ABORT|DATA ABORT/i, codigo: 'AOP DATA ABORT',
      modelos: ['iPhone XS', 'XR', '11', '12', '13', '14', '15'],
      zona: 'CPU virtual welding — inestabilidad del sandwich board',
      accion: 'Microsoldadura en interposer CPU — falla grave de placa.' },
    { match: /SoC Hot|CPU.*overheat|Apple SoC Hot/i, codigo: 'Apple SoC Hot — CPU overheating',
      modelos: ['Todos'],
      zona: 'CPU sobrecalentada — tapa superior mal soldada',
      accion: 'Reballing de CPU o reflow de disipador.' },
    { match: /NAND.*(timeout|error)|flash storage error|ANS/i, codigo: 'NAND timeout / flash storage error',
      modelos: ['Todos'],
      zona: 'Chip NAND de almacenamiento',
      accion: 'Reballing NAND o reemplazo.' },
    { match: /baseband.*(PCIe|completion timeout)|baseband/i, codigo: 'baseband PCIe completion timeout',
      modelos: ['Todos'],
      zona: 'Módulo baseband — antena celular',
      accion: 'IC baseband — revisar antena y conector.' },
    { match: /SEP.*(fault|panic)/i, codigo: 'SEP fault',
      modelos: ['iPhone X', '11', '12', '13', '14', '15'],
      zona: 'Secure Enclave Processor — Touch/Face ID',
      accion: 'Falla en SEP — generalmente requiere donor board.' },
    { match: /assertion failed.*kernel|kernel.*assertion/i, codigo: 'assertion failed — kernel',
      modelos: ['iPhone 13', '14', '15'],
      zona: 'Sensor array no responde',
      accion: 'Ver código específico en la tabla de assertion codes.' }
  ];

  // Busca el panicString en la base y devuelve la mejor coincidencia (o null)
  function matchPanic(panicString) {
    if (!panicString) return null;
    for (const row of PANIC_DB) {
      if (row.match.test(panicString)) return row;
    }
    return null;
  }

  g.PANIC_DB = PANIC_DB;
  g.matchPanic = matchPanic;
})(typeof window !== 'undefined' ? window : global);
