import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Devuelve la lista de clientes de Info Plus (GET /cliente). Trim a base/clave; redacta la clave en errores.
// Nota (19-oct-2026): Info Plus solo manda codcliente, nombre, cedula, rnc, telefono, fechacreacion y direccion;
// NO trae el nivel de precio del cliente (se verificó con v15). El taller asume «cliente con código = por mayor».
Deno.serve(async (req: Request) => {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Content-Type': 'application/json' };
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const BASE = (Deno.env.get('INFOPLUS_BASE') || '').trim();
  const CLAVE = (Deno.env.get('INFOPLUS_CLAVE') || '').trim();
  const redact = (s: string) => { let o = s || ''; if (CLAVE) o = o.split(CLAVE).join('***'); return o; };
  try {
    const url = `https://apicliente.infoplusplatinum.com/api/cliente?basedatos=${encodeURIComponent(BASE)}&clave=${encodeURIComponent(CLAVE)}`;
    const r = await fetch(url);
    const txt = redact(await r.text());
    let data: any; try { data = JSON.parse(txt); } catch { return new Response(JSON.stringify({ ok: false, error: 'Respuesta no válida de Info Plus.' }), { headers: cors }); }
    if (data && typeof data.message === 'string' && data.status && data.status !== 200) {
      return new Response(JSON.stringify({ ok: false, error: String(data.message).slice(0, 160) }), { headers: cors });
    }
    const arr = (data && (data.data || data.Data)) || (Array.isArray(data) ? data : []);
    const clientes = (Array.isArray(arr) ? arr : []).map((c: any) => ({
      codcliente: String(c.codcliente ?? '').trim(),
      nombre: String(c.nombre ?? '').trim(),
      cedula: String(c.cedula ?? '').trim(),
      rnc: String(c.rnc ?? '').trim(),
      telefono: String(c.telefono ?? '').trim()
    })).filter((c: any) => c.codcliente);
    return new Response(JSON.stringify({ ok: true, clientes }), { headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: redact(String((e as any)?.message || e)) }), { status: 500, headers: cors });
  }
});
