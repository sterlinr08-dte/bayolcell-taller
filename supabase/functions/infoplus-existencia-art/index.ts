import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// Existencia EN VIVO por almacén de un artículo. Lee listaarticulos por cada almacén. Devuelve {existencias:{alm:cant}}.
// 19-oct-2026: se agregó el almacén 7 (Navarrete, abierto el 24-ago-2026; confirmado por el dueño).
Deno.serve(async (req: Request) => {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Content-Type': 'application/json' };
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const BASE = (Deno.env.get('INFOPLUS_BASE') || 'bayol').trim();
  const CLAVE = (Deno.env.get('INFOPLUS_CLAVE') || '').trim();
  try {
    const body = await req.json().catch(() => ({}));
    const cod = String(body.codarticulo ?? '').trim();
    if (!cod) return new Response(JSON.stringify({ ok: false, error: 'falta codarticulo' }), { headers: cors });
    const almacenes = ['1', '3', '4', '5', '6', '7'];
    const existencias: Record<string, number> = {};
    await Promise.all(almacenes.map(async (alm) => {
      try {
        const url = `https://apicliente.infoplusplatinum.com/api/listaarticulos?basedatos=${encodeURIComponent(BASE)}&clave=${encodeURIComponent(CLAVE)}&codarticulo=${encodeURIComponent(cod)}&codalmacen=${alm}`;
        const r = await fetch(url); const txt = await r.text();
        const data = JSON.parse(txt);
        const arr = (data && (data.data || data.Data)) || (Array.isArray(data) ? data : []);
        const item = Array.isArray(arr) ? arr.find((a: any) => String(a.codigo) === cod) : null;
        existencias[alm] = item ? Math.round(Number(item.cantidad) || 0) : 0;
      } catch (_e) { existencias[alm] = 0; }
    }));
    return new Response(JSON.stringify({ ok: true, codarticulo: cod, existencias }), { headers: cors });
  } catch (e) { return new Response(JSON.stringify({ ok: false, error: String((e as any)?.message || e).slice(0, 120) }), { headers: cors }); }
});
