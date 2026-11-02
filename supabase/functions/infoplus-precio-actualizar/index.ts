import "jsr:@supabase/functions-js/edge-runtime.d.ts";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
// Actualiza los precios de un articulo en Info Plus (POST /api/articulo).
// Body: { codarticulo:int, precios:[{codnivelprecio:int, contado?, credito?, minimo?}] }
// Dagoberto: el endpoint SOLO modifica los campos que se envian -> se omiten los campos no provistos
// (asi cambiar el Precio no toca el Minimo). Redacta la clave en la respuesta.
// Autorizacion: SOLO admin (igual que el editor de precios en la app, isAdminUser()). Sin esto,
// cualquier cuenta con sesion podia cambiar los precios de venta reales llamando esta funcion directo.
// 2-nov-2026 (dueño): Info Plus no deja LEER el mínimo (bitácoras 2026-10-20-0930/0945). Cuando el cambio sale bien, se
// guarda aquí mismo en infoplus_articulos (niveles = contado, niveles_min = mínimo, fusionando con lo que ya había) para que
// la prefactura no deje bajar el precio de ese mínimo.
const SB_URL = Deno.env.get("SUPABASE_URL");
const SB_SVC = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SB_ANON = Deno.env.get("SUPABASE_ANON_KEY") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZraHdkdmp0b3dyaGtocWF2bnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMzIwMzUsImV4cCI6MjA5NDkwODAzNX0.t1Vb8peJbT_9F7S3UajxvqklVl3fLm8nytZT02UIzPI";
async function esAdmin(req: Request) {
  const auth = req.headers.get("Authorization") || "";
  if (!auth) return false;
  try {
    const r = await fetch(`${SB_URL}/rest/v1/rpc/app_is_admin`, { method: "POST", headers: { "Content-Type": "application/json", apikey: SB_ANON, Authorization: auth }, body: "{}" });
    if (!r.ok) return false;
    return (await r.json()) === true;
  } catch (_e) { return false; }
}
// deno-lint-ignore no-explicit-any
async function guardarCopia(codarticulo: number, precios: any[]): Promise<boolean> {
  if (!SB_SVC) return false;
  const h = { apikey: SB_SVC, Authorization: `Bearer ${SB_SVC}`, "Content-Type": "application/json" };
  const filtro = `${SB_URL}/rest/v1/infoplus_articulos?codigo=eq.${encodeURIComponent(String(codarticulo))}`;
  try {
    const r = await fetch(filtro + "&select=niveles,niveles_min", { headers: h });
    const filas = r.ok ? await r.json() : [];
    if (!Array.isArray(filas) || !filas.length) return false;
    const niveles = { ...(filas[0].niveles || {}) }, mins = { ...(filas[0].niveles_min || {}) };
    for (const p of precios) {
      const k = String(p.codnivelprecio);
      if (p.contado != null) niveles[k] = p.contado;
      if (p.minimo != null) mins[k] = p.minimo;
    }
    const u = await fetch(filtro, { method: "PATCH", headers: { ...h, Prefer: "return=minimal" }, body: JSON.stringify({ niveles, niveles_min: mins }) });
    return u.ok;
  } catch (_e) { return false; }
}
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const json = (o: unknown, s = 200) => new Response(JSON.stringify(o, null, 2), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
  if (!(await esAdmin(req))) return json({ ok: false, error: "Solo un administrador puede cambiar precios en Info Plus." }, 403);
  const host = "https://apicliente.infoplusplatinum.com/api";
  const basedatos = (Deno.env.get("INFOPLUS_BASE") || "bayol").trim();
  const clave = (Deno.env.get("INFOPLUS_CLAVE") || "").trim();
  if (!clave) return json({ ok: false, error: "No hay INFOPLUS_CLAVE configurada" }, 400);
  const redact = (s: string) => s.split(clave).join("***").split(encodeURIComponent(clave)).join("***");
  let body: any = {}; try { body = await req.json(); } catch (_e) {}
  const codarticulo = parseInt(String(body?.codarticulo ?? "").replace(/[^0-9]/g, ""), 10);
  const precios = Array.isArray(body?.precios) ? body.precios : [];
  if (!codarticulo) return json({ ok: false, error: "Falta codarticulo" }, 400);
  if (!precios.length) return json({ ok: false, error: "Falta 'precios' (lista de niveles)" }, 400);
  const has = (v: unknown) => v !== undefined && v !== null && v !== "";
  const modelo = {
    codarticulo,
    precios: precios.map((p: any) => {
      const o: Record<string, number> = { codnivelprecio: parseInt(String(p.codnivelprecio), 10) || 1 };
      if (has(p.contado)) o.contado = Number(p.contado) || 0;
      if (has(p.credito)) o.credito = Number(p.credito) || 0;
      if (has(p.minimo)) o.minimo = Number(p.minimo) || 0;
      return o;
    }),
  };
  const qs = `basedatos=${encodeURIComponent(basedatos)}&clave=${encodeURIComponent(clave)}`;
  const url = `${host}/articulo?${qs}`;
  try {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(modelo) });
    const txt = await r.text();
    let data: any = null; try { data = JSON.parse(txt); } catch (_e) {}
    const okFinal = r.ok && !(data && data.status && data.status !== 200);
    const copia = okFinal ? await guardarCopia(codarticulo, modelo.precios) : false;
    return json({ ok: okFinal, status: r.status, enviado: modelo, copia_local: copia, respuesta: data !== null ? data : redact(txt) });
  } catch (e) { return json({ ok: false, error: redact(String(e)) }); }
});
