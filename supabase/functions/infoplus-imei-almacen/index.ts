import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
// 20-oct-2026 · IMEI de un artículo EN UN ALMACÉN, para la ventana IMEI de la Prefactura.
// Regla del dueño: «7 almacenes, 7 iPhone, uno en cada almacén: la empleada del almacén 1 solo ve el IMEI del iPhone que
// está en el almacén 1; no le pueden salir los de los almacenes 7, 6, 5 y 4». Sin botón: sale al prefacturar.
// · Solo usuarios con sesión (verify_jwt + getUser). Solo GET a Info Plus; nunca escribe allá ni devuelve la clave.
// · Info Plus no documenta qué ruta da las series por almacén: se prueban las candidatas y la primera que responda con
//   registros que digan EXPLÍCITAMENTE el artículo y el almacén queda guardada como fuente (infoplus_diagnostico, ruta
//   'FUENTE_OK'). Si ninguna lo dice, se devuelve una lista vacía: NUNCA se muestran IMEI sin confirmar el almacén.
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Content-Type': 'application/json' };
const ALMACENES = ['1', '3', '4', '5', '6', '7'];
const CANDIDATAS = [
  'ListaArticulos|tipo={c}&CodArticulo={c}&Codalmacen={a}',
  'ListaArticulos|tipo={a}&CodArticulo={c}&Codalmacen={a}',
  'ListaArticulos|tipo=SERIE&CodArticulo={c}&Codalmacen={a}',
  'ListaArticulos|tipo=IMEI&CodArticulo={c}&Codalmacen={a}',
  'ListaArticulos|tipo=1&CodArticulo={c}&Codalmacen={a}',
  'ListaArticulos|tipo={c}',
  'ListaArticulos|tipo=A',
  'InventarioActual|',
];

const ART = /^(cod)?(art(iculo)?|producto|codproducto|codarticulo|articulo|codigo)$/i;
const ALM = /^(cod)?(almacen|alm|localidad|codlocalidad|codalmacen|bodega)$/i;
// Recorre el JSON: un IMEI cuenta solo si en su objeto (o en uno que lo contiene) el artículo Y el almacén coinciden.
function extraer(nodo: any, c: string, a: string, ctx: { art: boolean | null; alm: boolean | null }, out: Set<string>, vio: { art: boolean; alm: boolean }) {
  if (Array.isArray(nodo)) { for (const x of nodo) extraer(x, c, a, ctx, out, vio); return; }
  if (!nodo || typeof nodo !== 'object') return;
  const aqui = { art: ctx.art, alm: ctx.alm };
  for (const [k, v] of Object.entries(nodo)) {
    if (v === null || typeof v === 'object') continue;
    if (ART.test(k)) { vio.art = true; aqui.art = String(v).trim() === c; }
    if (ALM.test(k)) { vio.alm = true; aqui.alm = String(v).trim() === a; }
  }
  if (aqui.art === true && aqui.alm === true) {
    for (const v of Object.values(nodo)) if (typeof v === 'string' || typeof v === 'number') { const m = String(v).trim(); if (/^\d{15}$/.test(m)) out.add(m); }
  }
  for (const v of Object.values(nodo)) if (v && typeof v === 'object') extraer(v, c, a, aqui, out, vio);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const URL_SB = Deno.env.get('SUPABASE_URL')!;
  const usuario = createClient(URL_SB, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') || '' } } });
  const { data: u } = await usuario.auth.getUser();
  if (!u || !u.user) return new Response(JSON.stringify({ ok: false, error: 'sin sesión' }), { status: 401, headers: cors });
  const body = await req.json().catch(() => ({}));
  const c = String(body.codarticulo ?? '').replace(/\D/g, '');
  const a = String(body.codalmacen ?? '').replace(/\D/g, '');
  if (!c || !ALMACENES.includes(a)) return new Response(JSON.stringify({ ok: false, error: 'faltan artículo o almacén' }), { status: 400, headers: cors });

  const BASE = (Deno.env.get('INFOPLUS_BASE') || 'bayol').trim();
  const CLAVE = (Deno.env.get('INFOPLUS_CLAVE') || '').trim();
  const limpiar = (s: string) => CLAVE ? s.split(CLAVE).join('***') : s;
  const sb = createClient(URL_SB, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  async function consultar(tpl: string) {
    const [ruta, q] = tpl.split('|');
    const qq = (q || '').split('{c}').join(c).split('{a}').join(a);
    const url = `https://apicliente.infoplusplatinum.com/api/${ruta}?basedatos=${encodeURIComponent(BASE)}&clave=${encodeURIComponent(CLAVE)}${qq ? '&' + qq : ''}`;
    let status = 0, txt = '';
    try { const r = await fetch(url); status = r.status; txt = await r.text(); } catch (e) { txt = 'ERROR ' + String(e); }
    const out = new Set<string>(); const vio = { art: false, alm: false };
    try { extraer(JSON.parse(txt), c, a, { art: null, alm: null }, out, vio); } catch (_e) { /* no es JSON */ }
    return { ruta, qq, status, txt: limpiar(txt), imeis: [...out], vio };
  }

  // ¿Ya se sabe cuál ruta sirve?
  const { data: f } = await sb.from('infoplus_diagnostico').select('consulta').eq('ruta', 'FUENTE_OK').order('creado_en', { ascending: false }).limit(1);
  if (f && f[0] && f[0].consulta) {
    const r = await consultar(f[0].consulta);
    return new Response(JSON.stringify({ ok: true, imeis: r.imeis, fuente: true }), { headers: cors });
  }
  // Todavía no: se prueban las candidatas (solo lectura) y se anota lo que respondió cada una.
  // Como máximo una ronda cada 10 minutos, para no cargar Info Plus mientras no aparezca la ruta buena.
  const { data: ult } = await sb.from('infoplus_diagnostico').select('creado_en').order('creado_en', { ascending: false }).limit(1);
  if (ult && ult[0] && Date.now() - new Date(ult[0].creado_en).getTime() < 10 * 60 * 1000) {
    return new Response(JSON.stringify({ ok: true, imeis: [], fuente: false }), { headers: cors });
  }
  for (const tpl of CANDIDATAS) {
    const r = await consultar(tpl);
    await sb.from('infoplus_diagnostico').insert({ ruta: r.ruta, consulta: limpiar(r.qq), status: r.status, largo: r.txt.length,
      imeis_detectados: (r.txt.match(/\b\d{15}\b/g) || []).length, campos: `articulo:${r.vio.art} almacen:${r.vio.alm} imeis_confirmados:${r.imeis.length}`, muestra: r.txt.slice(0, 1200) });
    if (r.vio.art && r.vio.alm && r.status === 200 && r.imeis.length) {
      await sb.from('infoplus_diagnostico').insert({ ruta: 'FUENTE_OK', consulta: tpl, status: 200, imeis_detectados: r.imeis.length, campos: 'ruta que da los IMEI por artículo y almacén' });
      return new Response(JSON.stringify({ ok: true, imeis: r.imeis, fuente: true }), { headers: cors });
    }
  }
  return new Response(JSON.stringify({ ok: true, imeis: [], fuente: false }), { headers: cors });
});
