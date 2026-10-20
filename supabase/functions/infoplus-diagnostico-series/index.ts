import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
// 20-oct-2026 — PRUEBA TEMPORAL de SOLO LECTURA (solo GET) para encontrar en Info Plus los IMEI por almacén.
// Dueño: «los IMEI por almacén… que solamente me salgan los de ese artículo que están en ese almacén» (eligió la opción 2:
// probar con una función privada que solo pueda usar el administrador con su sesión).
// · verify_jwt + comprobación app_is_admin() con la sesión de quien llama: nadie más la puede usar.
// · Nunca escribe en Info Plus ni devuelve la clave (se reemplaza por *** en todo lo que se guarda).
// · Guarda el resumen en public.infoplus_diagnostico (RLS: solo admin). Se retira al terminar.
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Content-Type': 'application/json' };

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const URL_SB = Deno.env.get('SUPABASE_URL')!;
  const auth = req.headers.get('Authorization') || '';
  const usuario = createClient(URL_SB, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
  const { data: esAdmin, error: eAdm } = await usuario.rpc('app_is_admin');
  if (eAdm || esAdmin !== true) return new Response(JSON.stringify({ ok: false, error: 'solo administrador' }), { status: 403, headers: cors });

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
      const uno = Array.isArray(arr) ? arr[0] : (arr && typeof arr === 'object' ? arr : j);
      if (uno && typeof uno === 'object') campos = Object.keys(uno).join(',');
      if (!Array.isArray(j) && j && typeof j === 'object') campos = 'raiz:' + Object.keys(j).join(',') + (campos ? ' | item:' + campos : '');
    } catch (_e) { /* no es JSON */ }
    const imeis = (txt.match(/\b\d{15}\b/g) || []).length;
    const fila = { ruta, consulta, status, largo: txt.length, imeis_detectados: imeis, campos: campos.slice(0, 600), muestra: txt.slice(0, 900) };
    filas.push(fila);
    return { txt, fila };
  }

  // 1) Rutas de inventario que la ayuda lista y no estaban probadas a fondo
  await probar('InventarioActual', '');
  await probar('Inventario', '');
  await probar('TransaccionInventario', 'fechainicial=2026-10-1&fechafinal=2026-10-20');
  await probar('Articulo', '');

  // 2) Un celular con existencia: se busca entre los más comprados, en Navarrete (7), Santiago (1) y Taller (6)
  let cod = '', alm = '';
  for (const c of ['2639', '1916', '1170', '2064', '1143', '1614']) {
    for (const a of ['7', '1', '6']) {
      const { txt } = await probar('ListaArticulos', `CodArticulo=${c}&Codalmacen=${a}`);
      const cant = Number((txt.match(/"cantidad"\s*:\s*(-?\d+(\.\d+)?)/i) || [])[1] || 0);
      if (cant > 0) { cod = c; alm = a; break; }
    }
    if (cod) break;
  }
  if (!cod) { cod = '2639'; alm = '6'; }

  // 3) ListaArticulos?tipo=… (devuelve ListaSerieModel) con valores nuevos, solos y con artículo/almacén
  const tipos = [cod, `${cod}|${alm}`, `${alm}`, 'SERIE', 'SERIES', 'SERIAL', 'IMEI', 'DISPONIBLE', 'DISPONIBLES', 'EXISTENCIA', 'TODOS', 'A', 'D', 'E', 'I', 'C', 'P', 'V', '1'];
  for (const t of tipos) await probar('ListaArticulos', `tipo=${encodeURIComponent(t)}`);
  for (const t of [cod, 'SERIE', 'IMEI', 'DISPONIBLE', 'A', '1']) await probar('ListaArticulos', `tipo=${encodeURIComponent(t)}&CodArticulo=${cod}&Codalmacen=${alm}`);
  for (const t of [cod, '1']) await probar('ListaArticulos', `tipo=${encodeURIComponent(t)}&codarticulo=${cod}&codalmacen=${alm}&codlocalidad=${alm}`);

  const servicio = createClient(URL_SB, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { error: eIns } = await servicio.from('infoplus_diagnostico').insert(filas.map(f => ({ ...f, consulta: limpiar(f.consulta) })));
  return new Response(JSON.stringify({ ok: !eIns, pruebas: filas.length, articulo: cod, almacen: alm, guardado: !eIns, error: eIns ? String(eIns.message).slice(0, 120) : null }), { headers: cors });
});
