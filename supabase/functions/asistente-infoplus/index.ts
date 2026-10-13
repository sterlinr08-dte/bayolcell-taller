// asistente-infoplus — puente de SOLO LECTURA de Info Plus para el asistente de WhatsApp del dueño (OpenClaw).
// Pedido del dueño (13-oct-2026): «solo lectura». No existe ninguna acción que escriba en Info Plus ni en la base:
// solo SELECT a las copias del taller (infoplus_articulos, infoplus_ventas) y GET a listaarticulos para la existencia en vivo.
// La clave de Info Plus vive en los secrets del servidor; el asistente NUNCA la ve.
// Acceso: cabecera `x-asistente-token`. Aquí solo se guarda el SHA-256 del token; para revocar, se cambia este hash.
// Los costos y niveles 2/3 se devuelven porque el dueño los consulta en su chat privado; el asistente tiene la regla
// de no mandarlos nunca a un grupo.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const TOKEN_SHA256 = "6431e3a3e6d7df4776a8247047182cbd2647b92e1ffb89a24ecf43587d5fd4fb";
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const ALMACENES: Record<string, string> = { "1": "Oficina Santiago", "3": "Garantía China", "4": "Moca", "5": "Almacén 2do nivel", "6": "Taller" };
const LOCALIDADES: Record<string, string> = { "1": "Santiago", "4": "Moca", "7": "Localidad 7" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });
const sha = async (t: string) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)))].map((x) => x.toString(16).padStart(2, "0")).join("");
const fechaOk = (s: unknown) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
const hoyRD = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santo_Domingo" }).format(new Date());

function articulo(a: any) {
  const ex: Record<string, number> = {};
  let total = 0;
  for (const [k, v] of Object.entries(a.existencias || {})) { const n = Number(v) || 0; if (n) { ex[ALMACENES[k] || `Almacén ${k}`] = n; total += n; } }
  const nv = a.niveles || {};
  return {
    codigo: a.codigo, descripcion: String(a.descripcion || "").replace(/\s+/g, " ").trim(), marca: a.marca || null,
    existencia_total: total, existencia_por_almacen: ex,
    precio_cliente: Number(nv["1"] ?? a.precio) || null, precio_por_mayor: Number(nv["2"]) || null, precio_extremo: Number(nv["3"]) || null,
    costo: Number(a.costo) || null, copia_actualizada: a.actualizado_en,
  };
}

async function buscar(q: string) {
  const limpio = q.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9 ]+/g, " ").trim().slice(0, 60);
  if (limpio.length < 2) return { ok: false, error: "Escribe al menos 2 letras o el código." };
  const sel = "codigo, descripcion, marca, existencias, niveles, precio, costo, actualizado_en";
  if (/^\d+$/.test(limpio)) {
    const { data } = await db.from("infoplus_articulos").select(sel).eq("codigo", limpio).limit(1);
    if (data && data.length) return { ok: true, resultados: data.map(articulo) };
  }
  let qq = db.from("infoplus_articulos").select(sel).limit(15);
  for (const w of limpio.split(/\s+/).slice(0, 6)) qq = qq.ilike("descripcion", `%${w}%`);
  const { data, error } = await qq;
  if (error) throw error;
  return { ok: true, resultados: (data || []).map(articulo), nota: (data || []).length === 15 ? "Hay más resultados; sé más específico." : undefined };
}

async function existenciaVivo(codigo: string) {
  const cod = String(codigo || "").replace(/\D/g, "");
  if (!cod) return { ok: false, error: "Falta el código del artículo." };
  const BASE = (Deno.env.get("INFOPLUS_BASE") || "bayol").trim();
  const CLAVE = (Deno.env.get("INFOPLUS_CLAVE") || "").trim();
  const out: Record<string, number> = {};
  await Promise.all(Object.keys(ALMACENES).map(async (alm) => {
    try {
      const r = await fetch(`https://apicliente.infoplusplatinum.com/api/listaarticulos?basedatos=${encodeURIComponent(BASE)}&clave=${encodeURIComponent(CLAVE)}&codarticulo=${cod}&codalmacen=${alm}`);
      const d = JSON.parse(await r.text());
      const arr = (d && (d.data || d.Data)) || (Array.isArray(d) ? d : []);
      const it = Array.isArray(arr) ? arr.find((a: any) => String(a.codigo) === cod) : null;
      out[ALMACENES[alm]] = it ? Math.round(Number(it.cantidad) || 0) : 0;
    } catch (_e) { out[ALMACENES[alm]] = -1; }
  }));
  return { ok: true, codigo: cod, existencia_en_vivo: out, nota: "-1 = no se pudo leer ese almacén ahora." };
}

async function ventas(desde: string, hasta: string, sucursal?: string) {
  if (!fechaOk(desde) || !fechaOk(hasta)) return { ok: false, error: "Fechas en formato AAAA-MM-DD." };
  if ((Date.parse(hasta) - Date.parse(desde)) / 86400000 > 62) return { ok: false, error: "Máximo 62 días por consulta." };
  const loc = sucursal ? Object.entries(LOCALIDADES).find(([, n]) => n.toLowerCase() === String(sucursal).toLowerCase())?.[0] : undefined;
  const filas: any[] = [];
  for (let desdeFila = 0; desdeFila < 50000; desdeFila += 1000) {
    let q = db.from("infoplus_ventas").select("factura_id, producto_id, fecha, cantidad, monto_venta, monto_costo, codlocalidad").gte("fecha", desde).lte("fecha", hasta).range(desdeFila, desdeFila + 999);
    if (loc) q = q.eq("codlocalidad", Number(loc));
    const { data, error } = await q;
    if (error) throw error;
    filas.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  const por: Record<string, { facturas: Set<string>; venta: number; costo: number }> = {};
  const prod: Record<string, { cant: number; venta: number }> = {};
  for (const f of filas) {
    const s = LOCALIDADES[String(f.codlocalidad)] || "Sin sucursal";
    por[s] ??= { facturas: new Set(), venta: 0, costo: 0 };
    por[s].facturas.add(f.factura_id); por[s].venta += Number(f.monto_venta) || 0; por[s].costo += Number(f.monto_costo) || 0;
    const p = String(f.producto_id); prod[p] ??= { cant: 0, venta: 0 }; prod[p].cant += Number(f.cantidad) || 0; prod[p].venta += Number(f.monto_venta) || 0;
  }
  const top = Object.entries(prod).sort((a, b) => b[1].venta - a[1].venta).slice(0, 10);
  const { data: noms } = top.length ? await db.from("infoplus_articulos").select("codigo, descripcion").in("codigo", top.map(([c]) => c)) : { data: [] as any[] };
  const nom = Object.fromEntries((noms || []).map((n: any) => [n.codigo, String(n.descripcion).replace(/\s+/g, " ").trim()]));
  const r2 = (n: number) => Math.round(n * 100) / 100;
  return {
    ok: true, desde, hasta, sucursal: sucursal || "todas",
    por_sucursal: Object.fromEntries(Object.entries(por).map(([s, v]) => [s, { facturas: v.facturas.size, venta: r2(v.venta), costo: r2(v.costo), ganancia_bruta: r2(v.venta - v.costo) }])),
    mas_vendidos: top.map(([c, v]) => ({ codigo: c, descripcion: nom[c] || null, cantidad: v.cant, venta: r2(v.venta) })),
    nota: "Ventas copiadas de Info Plus cada hora; lo de hoy puede tener hasta 1 hora de atraso.",
  };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "Usa POST." }, 405);
  const token = req.headers.get("x-asistente-token") || "";
  if (!token || (await sha(token)) !== TOKEN_SHA256) return json({ ok: false, error: "no autorizado" }, 401);
  try {
    const b = await req.json().catch(() => ({}));
    switch (b?.accion) {
      case "buscar": return json(await buscar(String(b.q || "")));
      case "existencia_vivo": return json(await existenciaVivo(String(b.codigo || "")));
      case "ventas": { const h = hoyRD(); return json(await ventas(b.desde || h, b.hasta || h, b.sucursal)); }
      default: return json({ ok: false, error: "Acciones: buscar {q}, existencia_vivo {codigo}, ventas {desde, hasta, sucursal?}. Solo lectura." }, 400);
    }
  } catch (e) {
    console.error("asistente-infoplus:", e instanceof Error ? e.message : String(e));
    return json({ ok: false, error: "No se pudo consultar ahora." }, 500);
  }
});
