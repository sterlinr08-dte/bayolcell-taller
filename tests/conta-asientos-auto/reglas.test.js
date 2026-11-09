// Prueba de las reglas de asientos automáticos (sin navegador)
global.localStorage = { getItem: k => k === 'bc_asientos_auto' ? '1' : null };
global.document = { readyState: 'loading', addEventListener() {}, getElementById() { return null; } };
global.window = global;
require('../../conta-asientos-auto.js');
const A = global.BayolAsientosAuto;
const datos = {
  periodos: [{ id: 'p1', titulo: '1ª quincena nov', fecha_inicio: '2026-11-01', fecha_fin: '2026-11-15', fecha_pago: '2026-11-15' }],
  empleados: [{ id: 'e1', departamento: 'Santiago' }, { id: 'e2', departamento: 'Tienda Navarrete' }, { id: 'e3', departamento: null }],
  lineas: [
    // total = quin + inc − ars − afp − cxc − dd  (igual que la nómina)
    { periodo_id: 'p1', empleado_id: 'e1', salario_quincenal: 15000, incentivos: 2000, ars: 456, afp: 430.5, cuentas_por_cobrar: 1000, dias_descontado: 500, total: 14613.5 },
    { periodo_id: 'p1', empleado_id: 'e2', salario_quincenal: 12000, incentivos: 0, ars: 364.8, afp: 344.4, cuentas_por_cobrar: 0, dias_descontado: 0, total: 11290.8 },
    { periodo_id: 'p1', empleado_id: 'e3', salario_quincenal: 10000, incentivos: 0, ars: 0, afp: 0, cuentas_por_cobrar: 0, dias_descontado: 0, total: 10000 },
  ],
  abonos: [{ id: 'a1', cxp_id: 'f1', fecha: '2026-11-05', monto: 25000, metodo: 'Transferencia' }, { id: 'a2', cxp_id: 'f2', fecha: '2026-11-07', monto: 3000, metodo: 'Efectivo' }],
  facturas: [{ id: 'f1', factura: 'B0100001', proveedor: 'Suplidor A', origen: 'infoplus' }, { id: 'f2', factura: 'X-9', proveedor: 'Suplidor B', origen: 'manual', _enRango: true }],
};
const r = A.construir(datos, { nomina: true, patronal: true, regalia: true, cxp: true, cuentaAdelantos: '110201' });
let ok = true; const exp = (c, m) => { if (!c) { ok = false; console.log('FALLA', m); } };
r.asientos.forEach(a => { const d = a.lineas.reduce((s, l) => s + l.debe, 0), h = a.lineas.reduce((s, l) => s + l.haber, 0); exp(Math.abs(d - h) < 0.005, 'no cuadra ' + a.descripcion); console.log(a.fecha, a.sucursal.padEnd(9), a.referencia, a.descripcion.padEnd(48), d.toFixed(2)); });
const de = s => r.asientos.filter(a => a.descripcion.startsWith(s));
exp(de('Nómina').length === 3, '3 nóminas (Santiago, Navarrete, General)');
const st = de('Nómina').find(a => a.sucursal === 'Santiago'), L = c => (st.lineas.find(l => l.cuenta_codigo === c) || {});
exp(L('6101').debe === 14500 && L('6103').debe === 2000 && L('2103').haber === 886.5 && L('110201').haber === 1000 && L('110103').haber === 14613.5, 'líneas de Santiago');
exp(de('Aporte patronal').length === 2, 'patronal solo para los 2 con ley');
const pat = de('Aporte patronal').find(a => a.sucursal === 'Santiago'); exp(pat.lineas[0].debe === 2293.5 && pat.lineas[1].debe === 150, 'patronal 15.29 % + 1 %');
exp(de('Regalía').find(a => a.sucursal === 'Santiago').total === 1207.85, 'regalía 8.33 % de 14,500');
exp(de('Pago a').length === 2 && de('Pago a')[1].lineas[1].cuenta_codigo === '110101' && de('Pago a')[0].lineas[1].cuenta_codigo === '110103', 'pagos: efectivo a caja, transferencia a banco');
exp(r.avisos.some(t => /1 empleado sin tienda/.test(t)) && r.avisos.some(t => /1 factura manual/.test(t)), 'avisos');
const solo = A.construir(datos, { nomina: true }); exp(solo.asientos.length === 3, 'solo nómina');
console.log('avisos:', r.avisos, '\n' + (ok ? 'TODO BIEN' : 'HAY FALLAS'));
