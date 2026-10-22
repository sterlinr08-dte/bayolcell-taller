import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
// 20-oct-2026 · IMEI de un artículo EN UN ALMACÉN, para la ventana IMEI de la Prefactura.
// Regla del dueño: «7 almacenes, 7 iPhone, uno en cada almacén: la empleada del almacén 1 solo ve el IMEI del iPhone que
// está en el almacén 1; no le pueden salir los de los almacenes 7, 6, 5 y 4». Sin botón: sale al prefacturar.
// · Solo usuarios con sesión (verify_jwt + getUser). Solo GET a Info Plus; nunca escribe allá ni devuelve la clave.
// 22-oct-2026 · Dagoberto (Info Plus): «Ponle tipo=listaserie». Probado en vivo: `ListaArticulos?tipo=listaserie` devuelve
// TODAS las series disponibles como { descripcion, serie, localidad } (sin código de artículo ni de almacén; ignora otros
// filtros). Por eso se compara:
//   · artículo: la descripción de Info Plus del código pedido (tabla infoplus_articulos), sin espacios dobles ni mayúsculas;
//   · almacén: el NOMBRE de la localidad («OFICINA SANTIAGO») contra el nombre del almacén pedido.
// Si el nombre de la localidad no se reconoce, NO se muestra ese IMEI (se anota en infoplus_diagnostico para ajustar).
const LISTA_ACTIVA = false;
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Content-Type': 'application/json' };
// Nombres de cada almacén como pueden venir de Info Plus (ya normalizados con norm()).
const ALMACENES: Record<string, string[]> = {
  '1': ['OFICINA SANTIAGO', 'SANTIAGO'],
  '3': ['GARANTIA CHINA'],
  '4': ['MOCA'],
  '5': ['2DO NIVEL', 'SEGUNDO NIVEL'],
  '6': ['TALLER'],
  '7': ['NAVARRETE'],
};
const norm = (s: unknown) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
  .replace(/\b(LOCALIDAD|ALMACEN)\b/g, ' ').replace(/\s+/g, ' ').trim();
const normDesc = (s: unknown) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const URL_SB = Deno.env.get('SUPABASE_URL')!;
  const usuario = createClient(URL_SB, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') || '' } } });
  const { data: u } = await usuario.auth.getUser();
  if (!u || !u.user) return new Response(JSON.stringify({ ok: false, error: 'sin sesión' }), { status: 401, headers: cors });
  const body = await req.json().catch(() => ({}));
  const c = String(body.codarticulo ?? '').replace(/\D/g, '');
  const a = String(body.codalmacen ?? '').replace(/\D/g, '');
  if (!c || !ALMACENES[a]) return new Response(JSON.stringify({ ok: false, error: 'faltan artículo o almacén' }), { status: 400, headers: cors });
  // 22-oct-2026 · APAGADA por el dueño («sí, apágala») hasta que Info Plus agregue los filtros de artículo y almacén a
  // listaserie (Dagoberto: «hay que agregar esos filtros»). Hoy trae IMEI de otros almacenes. La ventana pide escanear o
  // escribir el IMEI, como antes. Para volver a prenderla: LISTA_ACTIVA = true.
  if (!LISTA_ACTIVA) return new Response(JSON.stringify({ ok: true, imeis: [], fuente: false, apagada: true }), { headers: cors });

  const BASE = (Deno.env.get('INFOPLUS_BASE') || 'bayol').trim();
  const CLAVE = (Deno.env.get('INFOPLUS_CLAVE') || '').trim();
  const limpiar = (s: string) => CLAVE ? s.split(CLAVE).join('***') : s;
  const sb = createClient(URL_SB, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // Descripción del artículo en Info Plus.
  const { data: art } = await sb.from('infoplus_articulos').select('descripcion').eq('codigo', c).maybeSingle();
  const desc = normDesc(art?.descripcion);
  if (!desc) return new Response(JSON.stringify({ ok: true, imeis: [], fuente: true, motivo: 'articulo_sin_descripcion' }), { headers: cors });

  const url = `https://apicliente.infoplusplatinum.com/api/ListaArticulos?basedatos=${encodeURIComponent(BASE)}&clave=${encodeURIComponent(CLAVE)}&tipo=listaserie`;
  let status = 0, txt = '', lista: any[] = [];
  try { const r = await fetch(url); status = r.status; txt = await r.text(); const j = JSON.parse(txt); lista = Array.isArray(j?.data) ? j.data : []; }
  catch (_e) { lista = []; }
  if (!lista.length) {
    await anotar(sb, { ruta: 'listaserie', consulta: `art=${c} alm=${a}`, status, largo: txt.length, campos: 'sin lista', muestra: limpiar(txt).slice(0, 600) });
    return new Response(JSON.stringify({ ok: true, imeis: [], fuente: true }), { headers: cors });
  }

  // 22-oct-2026 · Se probó separar por almacén con 21 variantes (codalmacen, Codalmacen, CodAlmacen, almacen, localidad,
  // codlocalidad, CodLocalidad, idalmacen con 1 y 6; CodArticulo, articulo, localidad=OFICINA SANTIAGO): listaserie las
  // ignora todas y devuelve siempre las mismas 77 series. Ver bitácora 2026-10-22-1040.
  const nombres = ALMACENES[a];
  const delArticulo = lista.filter((x) => normDesc(x?.descripcion) === desc && String(x?.serie ?? '').trim());
  const imeis = [...new Set(delArticulo.filter((x) => nombres.includes(norm(x?.localidad))).map((x) => String(x.serie).trim()))];
  // Localidades que no se reconocen: no se muestran; se anotan (una vez cada 10 min) para agregarlas al mapa de arriba.
  const conocidas = new Set(Object.values(ALMACENES).flat());
  const raras = [...new Set(lista.map((x) => norm(x?.localidad)).filter((n) => n && !conocidas.has(n)))];
  if (raras.length) await anotar(sb, { ruta: 'listaserie', consulta: `art=${c} alm=${a}`, status, largo: txt.length, campos: 'localidades sin almacén: ' + raras.join(' | ').slice(0, 300), muestra: '' });
  return new Response(JSON.stringify({ ok: true, imeis, fuente: true, del_articulo: delArticulo.length }), { headers: cors });
});

async function anotar(sb: any, fila: Record<string, unknown>) {
  const { data: ult } = await sb.from('infoplus_diagnostico').select('creado_en').eq('ruta', 'listaserie').order('creado_en', { ascending: false }).limit(1);
  if (ult && ult[0] && Date.now() - new Date(ult[0].creado_en).getTime() < 10 * 60 * 1000) return;
  await sb.from('infoplus_diagnostico').insert({ imeis_detectados: 0, ...fila });
}
