import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
// 20-oct-2026 — PRUEBA TEMPORAL de SOLO LECTURA (solo GET) para encontrar en Info Plus los IMEI por almacén.
// Dueño: «tienes acceso a varias API, primero consulta con cada API». Regla: cada empleada solo ve los IMEI de su almacén.
// Seguridad:
// · Solo la puede usar el ADMINISTRADOR con su sesión (verify_jwt + app_is_admin()). No devuelve datos de Info Plus.
// · Nunca escribe en Info Plus y nunca guarda la clave (se reemplaza por *** antes de guardar).
// · El resumen va a public.infoplus_diagnostico (RLS: solo el administrador lo puede leer; anon sin permisos).
// · Corre como máximo una vez cada 15 minutos (freno contra abuso). Se retira al terminar la prueba.
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Content-Type': 'application/json' };

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const usuario = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') || '' } } });
  const { data: esAdmin, error: eAdm } = await usuario.rpc('app_is_admin');
  if (eAdm || esAdmin !== true) return new Response(JSON.stringify({ ok: false, error: 'solo administrador' }), { status: 403, headers: cors });
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: ult } = await sb.from('infoplus_diagnostico').select('creado_en').order('creado_en', { ascending: false }).limit(1);
  if (ult && ult[0] && Date.now() - new Date(ult[0].creado_en).getTime() < 15 * 60 * 1000) {
    return new Response(JSON.stringify({ ok: false, error: 'espere 15 minutos' }), { status: 429, headers: cors });
  }
  const BASE = (Deno.env.get('INFOPLUS_BASE') || 'bayol').trim();
  const CLAVE = (Deno.env.get('INFOPLUS_CLAVE') || '').trim();
  const API = 'https://apicliente.infoplusplatinum.com/api/';
  const limpiar = (s: string) => CLAVE ? s.split(CLAVE).join('***') : s;
  const filas: any[] = [];

  async function probar(ruta: string, consulta: string) {
    const url = `${API}${ruta}?basedatos=${encodeURIComponent(BASE)}&clave=${encodeURIComponent(CLAVE)}${consulta ? '&' + consulta : ''}`;
    let status = 0, txt = '';
    try { const r = await fetch(url, { method: 'GET' }); status = r.status; txt = await r.text(); } catch (e) { txt = 'ERROR ' + String(e); }
    txt = limpiar(txt);
    let campos = '';
    try {
      const j = JSON.parse(txt);
      const arr = Array.isArray(j) ? j : (j && (j.data || j.Data || j.content || j.Content));
      const uno = Array.isArray(arr) ? arr[0] : (arr && typeof arr === 'object' ? arr : null);
      const raiz = (!Array.isArray(j) && j && typeof j === 'object') ? 'raiz:' + Object.keys(j).join(',') : '';
      const item = (uno && typeof uno === 'object') ? 'item:' + Object.keys(uno).join(',') : '';
      // un nivel más: listas dentro del primer item (por ejemplo «seriales», «detalle»)
      const sub = (uno && typeof uno === 'object') ? Object.entries(uno).filter(([, v]) => Array.isArray(v) && (v as any[])[0] && typeof (v as any[])[0] === 'object').map(([k, v]) => k + '[' + Object.keys((v as any[])[0]).join(',') + ']').join(' ') : '';
      campos = [raiz, item, sub].filter(Boolean).join(' | ');
    } catch (_e) { /* no es JSON */ }
    const imeis = (txt.match(/\b\d{15}\b/g) || []).length;
    filas.push({ ruta, consulta, status, largo: txt.length, imeis_detectados: imeis, campos: campos.slice(0, 900), muestra: txt.slice(0, 1200) });
    return txt;
  }

  const F = 'fechainicial=2026-10-1&fechafinal=2026-10-20';
  // Todas las rutas GET de la ayuda que pueden tener inventario, almacenes o IMEI (no se tocan nómina, bancos ni contabilidad)
  await probar('Almacen', '');
  await probar('InventarioActual', '');
  await probar('Inventario', '');
  await probar('TransaccionInventario', F);
  await probar('Articulo', '');
  await probar('RecepcionCompra', F);
  await probar('Compra', F);
  await probar('Factura', F);
  await probar('Prefactura', F);
  await probar('Prefactura', F + '&entregada=false');
  await probar('NotaCredito', F);
  await probar('OrdenCompra', F);
  await probar('Cotizacion', F);

  // Un celular con existencia (Navarrete 7, Santiago 1, Taller 6)
  let cod = '', alm = '';
  for (const c of ['2639', '1916', '1170', '2064', '1143', '1614']) {
    for (const a of ['7', '1', '6']) {
      const txt = await probar('ListaArticulos', `CodArticulo=${c}&Codalmacen=${a}`);
      const cant = Number((txt.match(/"cantidad"\s*:\s*(-?\d+(\.\d+)?)/i) || [])[1] || 0);
      if (cant > 0) { cod = c; alm = a; break; }
    }
    if (cod) break;
  }
  if (!cod) { cod = '2639'; alm = '6'; }
  await probar('ListaArticulos', `listacorta=false&CodArticulo=${cod}&Codalmacen=${alm}`);
  // ListaArticulos?tipo=… (devuelve ListaSerieModel, la lista de series)
  for (const t of [cod, `${cod}|${alm}`, alm, 'SERIE', 'SERIES', 'SERIAL', 'IMEI', 'DISPONIBLE', 'EXISTENCIA', 'TODOS', 'A', 'D', 'E', 'I', 'C', 'P', 'V', '1']) {
    await probar('ListaArticulos', `tipo=${encodeURIComponent(t)}`);
  }
  for (const t of [cod, 'SERIE', 'IMEI', 'A', '1']) await probar('ListaArticulos', `tipo=${encodeURIComponent(t)}&CodArticulo=${cod}&Codalmacen=${alm}`);

  const { error } = await sb.from('infoplus_diagnostico').insert(filas.map(f => ({ ...f, consulta: limpiar(f.consulta) })));
  return new Response(JSON.stringify({ ok: !error, pruebas: filas.length }), { headers: cors });
});
