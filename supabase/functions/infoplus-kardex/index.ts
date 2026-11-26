import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
// 26-nov-2026 · Kárdex del artículo (dueño: «las dos»). SOLO LECTURA: GET /TransaccionInventario de Info Plus (cada entrada y
// salida con su documento: CO venta, DA despacho, AI ajuste, C compra, OT orden de servicio, NC devolución) filtrado por un
// código. Solo admin o técnico activo. No devuelve costos ni la clave. Rango máximo 365 días, en tramos de 31 días.
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Content-Type': 'application/json' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: cors });
const fmt = (d: Date) => `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ ok: false }, 405);
  const URL_SB = Deno.env.get('SUPABASE_URL')!;
  const usuario = createClient(URL_SB, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') || '' } } });
  const { data: u } = await usuario.auth.getUser();
  if (!u || !u.user) return json({ ok: false, error: 'sin sesión' }, 401);
  const { data: esAdmin } = await usuario.rpc('app_is_admin');
  let puede = esAdmin === true;
  if (!puede) { const { data: esTec } = await usuario.rpc('app_actor_es_tecnico_activo'); puede = esTec === true; }
  if (!puede) return json({ ok: false, error: 'sin permiso' }, 403);

  const b = await req.json().catch(() => ({}));
  const cod = String(b.codproducto ?? '').replace(/\D/g, '');
  if (!cod) return json({ ok: false, error: 'falta el código' }, 400);
  const dias = Math.min(365, Math.max(1, parseInt(String(b.dias ?? 90), 10) || 90));
  const BASE = (Deno.env.get('INFOPLUS_BASE') || 'bayol').trim(), CLAVE = (Deno.env.get('INFOPLUS_CLAVE') || '').trim();
  const hoy = new Date(); const ini = new Date(hoy.getTime() - dias * 86400000);
  const movs: any[] = []; let fallos = 0;
  for (let t = ini.getTime(); t <= hoy.getTime(); t += 31 * 86400000) {
    const d = new Date(t), h = new Date(Math.min(t + 30 * 86400000, hoy.getTime()));
    try {
      const r = await fetch(`https://apicliente.infoplusplatinum.com/api/TransaccionInventario?basedatos=${encodeURIComponent(BASE)}&clave=${encodeURIComponent(CLAVE)}&fechainicial=${fmt(d)}&fechafinal=${fmt(h)}`);
      const j = JSON.parse(await r.text()); const l: any[] = Array.isArray(j?.data) ? j.data : [];
      for (const x of l) if (String(x?.CodProducto ?? '').replace(/\D/g, '') === cod) movs.push({
        f: x.FechaTransaccion ?? null, tipo: x.TipoTransaccionesInventario ?? '', entrada: String(x.Origen ?? '') === 'Entrada',
        alm: Number(x.CodigoAlmacen) || null, almacen: String(x.Almacen ?? '').trim(), doc: String(x.Documento ?? '').trim(), cant: Number(x.Cantidad) || 0 });
    } catch (_e) { fallos++; }
  }
  movs.sort((a, c) => String(c.f).localeCompare(String(a.f)) || String(c.doc).localeCompare(String(a.doc)));
  return json({ ok: fallos === 0 || movs.length > 0, codproducto: cod, dias, movimientos: movs, tramos_fallidos: fallos });
});
