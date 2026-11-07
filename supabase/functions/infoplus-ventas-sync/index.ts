import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function fmt(d: Date): string { return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`; }
function iso(s: string): string { const [y, m, d] = s.split("-").map(Number); return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`; }

// Sincroniza FACTURAS (ventas) de Info Plus a infoplus_ventas, agregadas por (FacturaID|ProductoID).
// Incluye codlocalidad (tienda: 1=Santiago, 4=Moca, 7=Navarrete) y codempleado.
// IMPORTANTE: .trim() a INFOPLUS_BASE y INFOPLUS_CLAVE (el secret puede traer salto de linea).
// v19 (6-nov-2026, dueño «hazlas todas»): quita de la copia las líneas que Info Plus ya no devuelve en el rango
// (facturas anuladas o líneas corregidas), con respaldo en infoplus_ventas_borradas. Freno: no borra si Info Plus
// devolvió 0 líneas o si faltarían más del 10 % de las líneas del rango. body.dias = días hacia atrás (por defecto 7).
// v20 (07-nov-2026): exige el token de Vault (x-sync-token) y limita el rango a 62 días.
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const json = (obj: unknown, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });

  const sbUrl = Deno.env.get("SUPABASE_URL");
  const svc = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const headers = { apikey: svc!, Authorization: `Bearer ${svc}`, "Content-Type": "application/json" };
  const log = async (row: Record<string, unknown>) => {
    try { await fetch(`${sbUrl}/rest/v1/infoplus_ventas_log`, { method: "POST", headers: { ...headers, Prefer: "return=minimal" }, body: JSON.stringify(row) }); } catch (_e) { /* */ }
  };

  // v20 (07-nov-2026, auditoría): solo las tareas programadas, con el token de Vault en «x-sync-token».
  // Antes cualquiera con la clave pública podía lanzarla y ver el total vendido.
  const token = req.headers.get("x-sync-token") || "";
  const okTok = token.length >= 32 ? await fetch(`${sbUrl}/rest/v1/rpc/app_token_valido`, { method: "POST", headers, body: JSON.stringify({ p_nombre: "ventas_sync_token", p_token: token }) }).then((r) => r.ok ? r.json() : false).catch(() => false) : false;
  if (okTok !== true) return json({ ok: false, error: "no autorizado" }, 401);

  try {
    const body = await req.json().catch(() => ({} as any));
    let desde = body?.desde as string | undefined;
    let hasta = body?.hasta as string | undefined;
    const dias = Math.min(62, Math.max(1, Number(body?.dias) || 7));
    if (!hasta) hasta = fmt(new Date());
    if (!desde) { const d = new Date(); d.setUTCDate(d.getUTCDate() - dias); desde = fmt(d); }
    // Rango máximo 62 días (la limpieza compara todo el rango).
    if ((Date.parse(iso(hasta!)) - Date.parse(iso(desde!))) / 86400000 > 62 || Date.parse(iso(hasta!)) < Date.parse(iso(desde!))) return json({ ok: false, error: "rango invalido (max 62 dias)" }, 400);

    const basedatos = (Deno.env.get("INFOPLUS_BASE") || "bayol").trim();
    const clave = (Deno.env.get("INFOPLUS_CLAVE") || "").trim();
    const url = `https://apicliente.infoplusplatinum.com/api/factura?basedatos=${encodeURIComponent(basedatos)}&clave=${encodeURIComponent(clave)}&fechainicial=${encodeURIComponent(desde!)}&fechafinal=${encodeURIComponent(hasta!)}`;

    let r: Response;
    try { r = await fetch(url); } catch (e) { await log({ ok: false, desde, hasta, error: "fetch: " + String(e) }); return json({ ok: false, error: String(e) }); }
    if (!r.ok) { const t = await r.text().catch(() => ""); await log({ ok: false, desde, hasta, error: `HTTP ${r.status}: ${t.slice(0, 200).replace(clave, "***")}` }); return json({ ok: false, error: `HTTP ${r.status}` }); }
    let data: any; try { data = JSON.parse(await r.text()); } catch (e) { await log({ ok: false, desde, hasta, error: "json: " + String(e) }); return json({ ok: false, error: "Respuesta no JSON" }); }
    const arr = (data && (data.data || data.Data)) || (Array.isArray(data) ? data : []);
    if (!Array.isArray(arr)) { await log({ ok: false, desde, hasta, error: "sin data" }); return json({ ok: false, error: "Info Plus no devolvio data" }); }

    const ahora = new Date().toISOString();
    const mapa = new Map<string, any>();
    for (const it of arr) {
      const fid = String(it.FacturaID ?? "").trim();
      if (!fid) continue;
      const pid = it.ProductoID == null ? "" : String(it.ProductoID).trim();
      const key = fid + "|" + pid;
      const cant = Number(it.CantidadProducto) || 0;
      const precio = Number(it.PrecioVenta) || 0;
      const costo = Number(it.MontoCostos) || 0;
      let row = mapa.get(key);
      if (!row) {
        row = { id: key, factura_id: fid, producto_id: pid || null, fecha: it.FechaFactura || null, cliente_cuenta: it.CuentaDeFactura ?? null, categoria: it.CategoriaProducto ?? null, cantidad: 0, monto_venta: 0, monto_costo: 0, direccion: it.DireccionEntrega ?? null, codlocalidad: it.codlocalidad == null ? null : Number(it.codlocalidad), codempleado: it.codempleado == null ? null : String(it.codempleado), actualizado_en: ahora };
        mapa.set(key, row);
      }
      row.cantidad += cant;
      row.monto_venta += precio * cant;
      row.monto_costo += costo;
    }
    const filas = Array.from(mapa.values()).map((f) => ({ ...f, monto_venta: Math.round(f.monto_venta * 100) / 100, monto_costo: Math.round(f.monto_costo * 100) / 100 }));

    let saved = 0;
    for (let i = 0; i < filas.length; i += 400) {
      const lote = filas.slice(i, i + 400);
      const up = await fetch(`${sbUrl}/rest/v1/infoplus_ventas?on_conflict=id`, { method: "POST", headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(lote) });
      if (!up.ok) { const t = await up.text(); await log({ ok: false, desde, hasta, error: `Guardar ${up.status}: ${t.slice(0, 200)}` }); return json({ ok: false, error: t.slice(0, 200), guardados: saved }); }
      saved += lote.length;
    }

    // ---- Quitar lo que Info Plus ya no tiene (anulado o corregido) dentro del mismo rango de fechas ----
    let quitadas = 0, montoQuitado = 0, freno = "";
    try {
      const ids = new Set(filas.map((f) => f.id));
      const ex: any[] = [];
      for (let off = 0; ; off += 1000) {
        const q = await fetch(`${sbUrl}/rest/v1/infoplus_ventas?select=*&fecha=gte.${iso(desde!)}&fecha=lte.${iso(hasta!)}&order=id&limit=1000&offset=${off}`, { headers });
        if (!q.ok) throw new Error("leer copia " + q.status);
        const lote = await q.json();
        ex.push(...lote);
        if (lote.length < 1000) break;
      }
      const sobran = ex.filter((x) => !ids.has(x.id));
      if (!filas.length) freno = "Info Plus devolvio 0 lineas";
      else if (ex.length && sobran.length > ex.length * 0.10) freno = `faltarian ${sobran.length} de ${ex.length} lineas (mas del 10 %)`;
      else if (sobran.length) {
        for (let i = 0; i < sobran.length; i += 200) {
          const lote = sobran.slice(i, i + 200);
          const b = await fetch(`${sbUrl}/rest/v1/infoplus_ventas_borradas`, { method: "POST", headers: { ...headers, Prefer: "return=minimal" }, body: JSON.stringify(lote.map((f) => ({ fila: f }))) });
          if (!b.ok) throw new Error("respaldo " + b.status);
          const lista = lote.map((f) => '"' + String(f.id).replace(/"/g, '\\"') + '"').join(",");
          const d = await fetch(`${sbUrl}/rest/v1/infoplus_ventas?id=in.(${encodeURIComponent(lista)})`, { method: "DELETE", headers: { ...headers, Prefer: "return=minimal" } });
          if (!d.ok) throw new Error("borrar " + d.status);
          quitadas += lote.length;
          montoQuitado += lote.reduce((s, f) => s + (Number(f.monto_venta) || 0), 0);
        }
      }
    } catch (e) { freno = "limpieza: " + String(e); }

    const facturas = new Set(filas.map((f) => f.factura_id)).size;
    const monto = Math.round(filas.reduce((s, f) => s + f.monto_venta, 0) * 100) / 100;
    montoQuitado = Math.round(montoQuitado * 100) / 100;
    await log({ ok: true, desde, hasta, facturas, lineas: saved, monto, error: (quitadas ? `quitadas ${quitadas} lineas (${montoQuitado}) que ya no estan en Info Plus` : "") + (freno ? ` · sin limpieza: ${freno}` : "") || null });
    return json({ ok: true, desde, hasta, facturas, lineas: saved, monto, quitadas, monto_quitado: montoQuitado, freno: freno || null });
  } catch (e) {
    await log({ ok: false, error: String(e) });
    return json({ ok: false, error: String(e) });
  }
});
