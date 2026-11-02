import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// Sincroniza los niveles de precio (codnivelprecio 1/2/3) por articulo -> infoplus_articulos.niveles (jsonb {1,2,3}).
// 2-nov-2026 (dueño: el empleado puede subir el precio y bajarlo solo hasta el mínimo): guarda también el MÍNIMO de cada
// nivel en infoplus_articulos.niveles_min. La respuesta trae `claves_precio` (los nombres de campo que manda Info Plus en
// cada precio, sin valores) para comprobar el nombre del mínimo.
// Lee listaarticulos?...&detallado=true&todos=true. Dedupe por codnivelprecio (ultimo gana).
const CAMPOS_MIN = ["minimo", "preciominimo", "precio_minimo", "preciomin", "min"];
function minimoDe(p: Record<string, unknown>): number | null {
  for (const k of Object.keys(p)) {
    if (CAMPOS_MIN.includes(k.toLowerCase())) { const n = Number(p[k]); return isFinite(n) && n > 0 ? n : null; }
  }
  return null;
}
Deno.serve(async (req: Request) => {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Content-Type': 'application/json' };
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const BASE = (Deno.env.get('INFOPLUS_BASE') || 'bayol').trim();
  const CLAVE = (Deno.env.get('INFOPLUS_CLAVE') || '').trim();
  const sbUrl = Deno.env.get('SUPABASE_URL');
  const svc = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const h = { apikey: svc!, Authorization: `Bearer ${svc}`, 'Content-Type': 'application/json' };
  try {
    if (!CLAVE) return new Response(JSON.stringify({ ok: false, error: 'Falta INFOPLUS_CLAVE' }), { headers: cors });
    const url = `https://apicliente.infoplusplatinum.com/api/listaarticulos?basedatos=${encodeURIComponent(BASE)}&clave=${encodeURIComponent(CLAVE)}&codarticulo=&codalmacen=1&detallado=true&todos=true`;
    const r = await fetch(url); const txt = await r.text();
    let data: any; try { data = JSON.parse(txt); } catch { return new Response(JSON.stringify({ ok: false, error: 'Respuesta no valida' }), { headers: cors }); }
    const arr = (data && (data.data || data.Data)) || (Array.isArray(data) ? data : []);
    if (!Array.isArray(arr) || !arr.length) return new Response(JSON.stringify({ ok: false, error: 'Info Plus no devolvio articulos', msg: data?.message }), { headers: cors });
    const claves = new Set<string>();
    const rows = arr.map((a: any) => {
      const niveles: Record<string, number> = {}, mins: Record<string, number> = {};
      (a.precios || []).forEach((p: any) => {
        if (!p || p.codnivelprecio == null) return;
        Object.keys(p).forEach((k) => claves.add(k));
        niveles[String(p.codnivelprecio)] = Number(p.precio) || 0;
        const m = minimoDe(p); if (m != null) mins[String(p.codnivelprecio)] = m;
      });
      return { codigo: String(a.codarticulo ?? a.codigo ?? '').trim(), niveles, niveles_min: Object.keys(mins).length ? mins : null };
    }).filter((x: any) => x.codigo);
    // Si Info Plus no manda ningún mínimo (hoy no lo manda), NO se toca niveles_min: así no se borran los mínimos que
    // guarda infoplus-precio-actualizar al editar precios desde el sistema.
    if (!rows.some((x: any) => x.niveles_min)) rows.forEach((x: any) => { delete x.niveles_min; });
    let total = 0;
    for (let i = 0; i < rows.length; i += 500) {
      const lote = rows.slice(i, i + 500);
      const up = await fetch(`${sbUrl}/rest/v1/infoplus_articulos?on_conflict=codigo`, { method: 'POST', headers: { ...h, Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(lote) });
      if (!up.ok) { const t = await up.text(); return new Response(JSON.stringify({ ok: false, error: 'Error guardando (' + up.status + '): ' + t.slice(0, 160), guardados: total }), { headers: cors }); }
      total += lote.length;
    }
    const con3 = rows.filter((x: any) => Object.keys(x.niveles).length >= 2).length;
    const conMin = rows.filter((x: any) => x.niveles_min).length; // 0 = Info Plus no lo envía
    return new Response(JSON.stringify({ ok: true, total, con_multinivel: con3, con_minimo: conMin, claves_precio: [...claves].sort() }), { headers: cors });
  } catch (e) { return new Response(JSON.stringify({ ok: false, error: String((e as any)?.message || e).slice(0, 160) }), { headers: cors }); }
});
