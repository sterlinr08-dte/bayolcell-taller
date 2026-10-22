import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
// 20-oct-2026 · IMEI de un artículo EN UN ALMACÉN, para la ventana IMEI de la Prefactura.
// Regla del dueño: «7 almacenes, 7 iPhone, uno en cada almacén: la empleada del almacén 1 solo ve el IMEI del iPhone que
// está en el almacén 1; no le pueden salir los de los almacenes 7, 6, 5 y 4». Sin botón: sale al prefacturar.
// · Solo usuarios con sesión (verify_jwt + getUser). Solo GET a Info Plus; nunca escribe allá ni devuelve la clave.
// 22-oct-2026 · Dagoberto (Info Plus): «Ponle tipo=listaserie». Devuelve las series como { descripcion, serie, localidad }.
// 22-oct-2026 (tarde) · Dagoberto agregó los filtros `codalmacen` y `codarticulo` a listaserie (probado en vivo con curl:
// codalmacen=1 → 77 series, todas OFICINA SANTIAGO; =6 → 72 TALLER; =4 → 37 MOCA). Por eso ahora se pide:
//   1) listaserie&codarticulo=<c>&codalmacen=<a>; si vuelve vacío,
//   2) listaserie&codalmacen=<a> y se compara la descripción de Info Plus del artículo (tabla infoplus_articulos).
// En los dos casos se exige además que la localidad sea la del almacén pedido (por si el filtro la ignorara).
// 22-oct-2026 (noche) · Al revés: con el IMEI completo se busca el ARTÍCULO (body.imei + codalmacen). Orden:
//   1) infoplus_seriales (compras sincronizadas: imei → codproducto exacto);
//   2) listaserie del almacén pedido: la serie da la descripción → códigos de infoplus_articulos con esa descripción;
//      si hay varios, se prueba listaserie&codarticulo por cada uno y gana el que contiene la serie;
//   3) si no está en ese almacén, se mira en los demás para decir dónde está.
const LISTA_ACTIVA = true;
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
  const imei = String(body.imei ?? '').replace(/\D/g, '');
  if (imei && ALMACENES[a]) return await buscarPorImei(imei, a, URL_SB);
  // 22-oct-2026 (noche) · ¿Este artículo lleva IMEI/serie? Lo decide Info Plus, no la palabra «celular» del nombre.
  if (String(body.pregunta ?? '') === 'serial' && c) return await esSerializado(c, URL_SB);
  if (!c || !ALMACENES[a]) return new Response(JSON.stringify({ ok: false, error: 'faltan artículo o almacén' }), { status: 400, headers: cors });
  // 22-oct-2026 · Apagada en la mañana; el dueño eligió luego la «lista prudente» (opción B): se muestra solo si cuadra con
  // la existencia (ver abajo). Para apagarla del todo: LISTA_ACTIVA = false.
  if (!LISTA_ACTIVA) return new Response(JSON.stringify({ ok: true, imeis: [], fuente: false, apagada: true }), { headers: cors });

  const BASE = (Deno.env.get('INFOPLUS_BASE') || 'bayol').trim();
  const CLAVE = (Deno.env.get('INFOPLUS_CLAVE') || '').trim();
  const limpiar = (s: string) => CLAVE ? s.split(CLAVE).join('***') : s;
  const sb = createClient(URL_SB, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // Descripción del artículo en Info Plus.
  const { data: art } = await sb.from('infoplus_articulos').select('descripcion').eq('codigo', c).maybeSingle();
  const desc = normDesc(art?.descripcion);
  if (!desc) return new Response(JSON.stringify({ ok: true, imeis: [], fuente: true, motivo: 'articulo_sin_descripcion' }), { headers: cors });

  const base = `https://apicliente.infoplusplatinum.com/api/ListaArticulos?basedatos=${encodeURIComponent(BASE)}&clave=${encodeURIComponent(CLAVE)}&tipo=listaserie&codalmacen=${a}`;
  const pedir = async (u: string) => {
    let status = 0, txt = '', lista: any[] = [];
    try { const r = await fetch(u); status = r.status; txt = await r.text(); const j = JSON.parse(txt); lista = Array.isArray(j?.data) ? j.data : []; }
    catch (_e) { lista = []; }
    return { status, txt, lista };
  };
  // 1) Filtro por artículo y almacén (Dagoberto, 22-oct-2026). 2) Si no trae nada, solo por almacén y se compara la descripción.
  let modo = 'codarticulo';
  let { status, txt, lista } = await pedir(`${base}&codarticulo=${encodeURIComponent(c)}`);
  if (!lista.length) { modo = 'descripcion'; ({ status, txt, lista } = await pedir(base)); }
  if (!lista.length) {
    await anotar(sb, { ruta: 'listaserie', consulta: `art=${c} alm=${a}`, status, largo: txt.length, campos: 'sin lista', muestra: limpiar(txt).slice(0, 600) });
    return new Response(JSON.stringify({ ok: true, imeis: [], fuente: true }), { headers: cors });
  }

  const nombres = ALMACENES[a];
  const delArticulo = lista.filter((x) => normDesc(x?.descripcion) === desc && String(x?.serie ?? '').trim());
  const imeis = [...new Set(delArticulo.filter((x) => nombres.includes(norm(x?.localidad))).map((x) => String(x.serie).trim()))];

  // «Lista prudente» (dueño, 22-oct-2026, opción B): los IMEI se muestran solo si la cantidad de series que Info Plus lista
  // para este artículo en este almacén es exactamente su existencia en vivo (ListaArticulos?codarticulo&codalmacen).
  // Si no cuadra o falla la consulta: no se muestra nada (se escanea o escribe el IMEI).
  let existencia: number | null = null;
  try {
    const r = await fetch(`https://apicliente.infoplusplatinum.com/api/listaarticulos?basedatos=${encodeURIComponent(BASE)}&clave=${encodeURIComponent(CLAVE)}&codarticulo=${encodeURIComponent(c)}&codalmacen=${a}`);
    const d = JSON.parse(await r.text()); const arr = (d && (d.data || d.Data)) || [];
    const it = Array.isArray(arr) ? arr.find((z: any) => String(z.codigo) === c) : null;
    existencia = it ? Math.round(Number(it.cantidad) || 0) : 0;
  } catch (_e) { existencia = null; }
  if (existencia === null || imeis.length !== existencia) {
    return new Response(JSON.stringify({ ok: true, imeis: [], fuente: true, prudente: 'no_cuadra', modo, listadas: imeis.length, existencia }), { headers: cors });
  }
  // Localidades que no se reconocen: se anotan (una vez cada 10 min) para agregarlas al mapa de arriba.
  const conocidas = new Set(Object.values(ALMACENES).flat());
  const raras = [...new Set(lista.map((x) => norm(x?.localidad)).filter((n) => n && !conocidas.has(n)))];
  if (raras.length) await anotar(sb, { ruta: 'listaserie', consulta: `art=${c} alm=${a}`, status, largo: txt.length, campos: 'localidades sin almacén: ' + raras.join(' | ').slice(0, 300), muestra: '' });
  return new Response(JSON.stringify({ ok: true, imeis, fuente: true, modo, del_articulo: delArticulo.length }), { headers: cors });
});

async function anotar(sb: any, fila: Record<string, unknown>) {
  const { data: ult } = await sb.from('infoplus_diagnostico').select('creado_en').eq('ruta', 'listaserie').order('creado_en', { ascending: false }).limit(1);
  if (ult && ult[0] && Date.now() - new Date(ult[0].creado_en).getTime() < 10 * 60 * 1000) return;
  await sb.from('infoplus_diagnostico').insert({ imeis_detectados: 0, ...fila });
}

// ¿Lleva serie? (22-oct-2026, dueño: «el sistema tiene un error: cuando ve la palabra celular le asigna IMEI sin tener»).
// serial = true si Info Plus registró alguna serie del código: en las compras sincronizadas (infoplus_seriales) o en
// listaserie de cualquier almacén (filtro codarticulo; si el filtro se ignorara, se exige la misma descripción).
async function esSerializado(c: string, URL_SB: string): Promise<Response> {
  const sb = createClient(URL_SB, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const BASE = (Deno.env.get('INFOPLUS_BASE') || 'bayol').trim();
  const CLAVE = (Deno.env.get('INFOPLUS_CLAVE') || '').trim();
  const resp = (o: Record<string, unknown>) => new Response(JSON.stringify({ ok: true, codarticulo: c, ...o }), { headers: cors });
  const { count } = await sb.from('infoplus_seriales').select('imei', { count: 'exact', head: true }).eq('codproducto', c);
  if ((count || 0) > 0) return resp({ serial: true, fuente: 'compras', series: count });
  const { data: art } = await sb.from('infoplus_articulos').select('descripcion').eq('codigo', c).maybeSingle();
  const desc = normDesc(art?.descripcion);
  let fallo = false;
  const porAlm = await Promise.all(Object.keys(ALMACENES).map(async (alm) => {
    try {
      const r = await fetch(`https://apicliente.infoplusplatinum.com/api/ListaArticulos?basedatos=${encodeURIComponent(BASE)}&clave=${encodeURIComponent(CLAVE)}&tipo=listaserie&codalmacen=${alm}&codarticulo=${encodeURIComponent(c)}`);
      const j = JSON.parse(await r.text()); const l: any[] = Array.isArray(j?.data) ? j.data : [];
      return l.filter((x) => String(x?.serie ?? '').trim() && (!desc || normDesc(x?.descripcion) === desc)).length;
    } catch (_e) { fallo = true; return 0; }
  }));
  const total = porAlm.reduce((s, n) => s + n, 0);
  if (total > 0) return resp({ serial: true, fuente: 'listaserie', series: total });
  if (fallo) return new Response(JSON.stringify({ ok: false, error: 'No se pudo consultar Info Plus' }), { status: 502, headers: cors });
  return resp({ serial: false, fuente: 'ninguna' });
}

// IMEI completo → artículo (22-oct-2026, pedido del dueño: «si pongo el IMEI completo también funcione el artículo»).
async function buscarPorImei(imei: string, a: string, URL_SB: string): Promise<Response> {
  if (imei.length < 14 || imei.length > 17) return new Response(JSON.stringify({ ok: false, error: 'IMEI incompleto' }), { status: 400, headers: cors });
  const sb = createClient(URL_SB, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const BASE = (Deno.env.get('INFOPLUS_BASE') || 'bayol').trim();
  const CLAVE = (Deno.env.get('INFOPLUS_CLAVE') || '').trim();
  const resp = (o: Record<string, unknown>) => new Response(JSON.stringify({ ok: true, imei, ...o }), { headers: cors });
  const articulo = async (cod: string) => {
    const { data } = await sb.from('infoplus_articulos').select('codigo, descripcion').eq('codigo', cod).maybeSingle();
    return data;
  };
  // 1) Compras sincronizadas (infoplus_seriales): código exacto.
  const { data: ser } = await sb.from('infoplus_seriales').select('codproducto, producto').eq('imei', imei).maybeSingle();
  const codSer = String(ser?.codproducto ?? '').replace(/\D/g, '');
  if (codSer) {
    const art = await articulo(codSer);
    return resp({ codigo: codSer, descripcion: (art?.descripcion || ser?.producto || '').trim(), fuente: 'compras', en_catalogo: !!art });
  }
  // 2) listaserie del almacén pedido.
  const lista = async (alm: string, cod = '') => {
    try {
      const r = await fetch(`https://apicliente.infoplusplatinum.com/api/ListaArticulos?basedatos=${encodeURIComponent(BASE)}&clave=${encodeURIComponent(CLAVE)}&tipo=listaserie&codalmacen=${alm}${cod ? '&codarticulo=' + encodeURIComponent(cod) : ''}`);
      const j = JSON.parse(await r.text()); return Array.isArray(j?.data) ? j.data as any[] : [];
    } catch (_e) { return [] as any[]; }
  };
  const enSerie = (l: any[]) => l.find((x) => String(x?.serie ?? '').replace(/\D/g, '') === imei);
  let fila = enSerie(await lista(a));
  let localidadOtra = '';
  if (!fila) {
    // 3) ¿Está en otro almacén? (para decirlo, no para facturarlo desde aquí)
    const otros = Object.keys(ALMACENES).filter((k) => k !== a);
    const res = await Promise.all(otros.map(async (k) => ({ k, f: enSerie(await lista(k)) })));
    const hit = res.find((r) => r.f);
    if (hit) { localidadOtra = ALMACENES[hit.k][0]; fila = hit.f; }
  }
  if (!fila) return resp({ encontrado: false, motivo: 'imei_no_esta_en_info_plus' });
  const desc = normDesc(fila.descripcion);
  const { data: arts } = await sb.from('infoplus_articulos').select('codigo, descripcion').ilike('descripcion', '%' + desc.split(' ').join('%') + '%').limit(50);
  let cand = (arts || []).filter((x: any) => normDesc(x.descripcion) === desc).map((x: any) => ({ codigo: String(x.codigo), descripcion: String(x.descripcion || '').trim() }));
  if (cand.length > 1 && !localidadOtra) {
    // Varios códigos con el mismo nombre: gana el que Info Plus confirma con el filtro codarticulo.
    const conf = await Promise.all(cand.map(async (x) => ({ x, ok: !!enSerie(await lista(a, x.codigo)) })));
    const okList = conf.filter((r) => r.ok);
    if (okList.length === 1) cand = [okList[0].x];
  }
  if (cand.length === 1) return resp({ codigo: cand[0].codigo, descripcion: cand[0].descripcion, fuente: 'listaserie', localidad: normDesc(fila.localidad), en_otro_almacen: localidadOtra || undefined, en_catalogo: true });
  return resp({ encontrado: cand.length > 0, descripcion: String(fila.descripcion || '').trim(), candidatos: cand, fuente: 'listaserie', localidad: normDesc(fila.localidad), en_otro_almacen: localidadOtra || undefined });
}
