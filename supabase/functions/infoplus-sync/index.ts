import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Sincroniza la existencia de TODOS los almacenes de Info Plus por articulo
// (codalmacen 1,3,4,5,6,7) + precio/costo/descripcion.
// existencia (entero) = TALLER (codalmacen 6). existencias (jsonb) = {almacen: cantidad}.
// Registra cada corrida en infoplus_sync_log (ok/error) para la alerta de fallos.
// 19-oct-2026: el almacen 7 (Navarrete, abierto el 24-ago-2026; confirmado por el dueño) se agrega siempre,
// aunque el secreto INFOPLUS_ALMACENES no lo traiga.
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const json = (obj: unknown, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });

  const sbUrl = Deno.env.get("SUPABASE_URL");
  const svc = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const headers = { apikey: svc!, Authorization: `Bearer ${svc}`, "Content-Type": "application/json" };

  const logRun = async (row: Record<string, unknown>) => {
    try {
      await fetch(`${sbUrl}/rest/v1/infoplus_sync_log`, {
        method: "POST", headers: { ...headers, Prefer: "return=minimal" }, body: JSON.stringify(row),
      });
    } catch (_e) { /* no romper la sync por el log */ }
  };

  try {
    const base = "https://apicliente.infoplusplatinum.com/api/listaarticulos";
    // .trim() para evitar el bug conocido de la clave guardada con espacios/saltos de linea.
    // La clave vive SOLO como secreto (INFOPLUS_CLAVE); nunca en el codigo.
    const basedatos = (Deno.env.get("INFOPLUS_BASE") || "bayol").trim();
    const clave = (Deno.env.get("INFOPLUS_CLAVE") || "").trim();
    if (!clave) {
      const errMsg = "Falta el secreto INFOPLUS_CLAVE (no esta configurado en Supabase).";
      await logRun({ ok: false, error: errMsg });
      return json({ ok: false, error: errMsg });
    }
    const almacenes = Array.from(new Set((Deno.env.get("INFOPLUS_ALMACENES") || "1,3,4,5,6").split(",").map((s) => s.trim()).filter(Boolean).concat(["7"])));
    const ahora = new Date().toISOString();

    const mapa = new Map<string, any>();
    const porAlmacen: Record<string, number> = {};
    // Diagnostico: guarda la respuesta cruda de Info Plus cuando un almacen no trae articulos
    // (NO contiene la clave: es solo el cuerpo de respuesta de Info Plus).
    const diag: any[] = [];
    for (const alm of almacenes) {
      const url = `${base}?basedatos=${encodeURIComponent(basedatos)}&clave=${encodeURIComponent(clave)}&codarticulo=&codalmacen=${encodeURIComponent(alm)}`;
      let r: Response;
      try { r = await fetch(url); } catch (e) { diag.push({ alm, fetchError: String(e).slice(0, 120) }); continue; }
      const bodyText = await r.text().catch(() => "");
      if (!r.ok) { diag.push({ alm, status: r.status, sample: bodyText.slice(0, 160) }); continue; }
      let data: any; try { data = JSON.parse(bodyText); } catch (_e) { diag.push({ alm, status: r.status, parseError: true, sample: bodyText.slice(0, 160) }); continue; }
      const arr = (data && (data.data || data.Data || data.articulos)) || (Array.isArray(data) ? data : []);
      if (!Array.isArray(arr)) { diag.push({ alm, status: r.status, sample: bodyText.slice(0, 160) }); continue; }
      if (arr.length === 0) { diag.push({ alm, status: r.status, vacio: true, sample: bodyText.slice(0, 160) }); }
      let u = 0;
      for (const a of arr) {
        const codigo = String(a.codigo ?? "").trim();
        if (!codigo) continue;
        const cant = Math.round(Number(a.cantidad ?? 0)) || 0;
        let row = mapa.get(codigo);
        if (!row) { row = { codigo, descripcion: null, referencia: null, referencia_fabrica: null, precio: null, precio_especial: null, costo: null, existencias: {} as Record<string, number>, actualizado_en: ahora }; mapa.set(codigo, row); }
        if (a.descripcion != null) row.descripcion = a.descripcion;
        if (a.referencia != null) row.referencia = a.referencia;
        if (a.referenciafabrica != null) row.referencia_fabrica = a.referenciafabrica;
        if (a.precio != null) row.precio = Number(a.precio);
        if (a.precioespecial != null) row.precio_especial = Number(a.precioespecial);
        if (a.costo != null) row.costo = Number(a.costo);
        if (cant > 0) { row.existencias[alm] = Math.max(row.existencias[alm] || 0, cant); u += cant; }
      }
      porAlmacen[alm] = u;
    }

    if (!mapa.size) {
      // Adjuntar la respuesta real de Info Plus al mensaje de error para confirmar la causa
      const muestra = (diag.find((d) => d.sample)?.sample) || (diag.find((d) => d.fetchError)?.fetchError) || "";
      const errMsg = ("Info Plus no devolvio articulos en ningun almacen." + (muestra ? " | Respuesta Info Plus: " + muestra : "")).slice(0, 300);
      await logRun({ ok: false, error: errMsg, por_almacen: porAlmacen });
      return json({ ok: false, error: errMsg, diag });
    }
    const filas = Array.from(mapa.values()).map((r) => ({ ...r, existencia: r.existencias["6"] || 0 }));

    // Reiniciar existencia y existencias (lo que ya no este queda en 0/{})
    const reset = await fetch(`${sbUrl}/rest/v1/infoplus_articulos?codigo=not.is.null`, {
      method: "PATCH", headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify({ existencia: 0, existencias: {} }),
    });
    if (!reset.ok) {
      const t = await reset.text();
      await logRun({ ok: false, error: "Error al reiniciar (" + reset.status + "): " + t.slice(0, 200), por_almacen: porAlmacen });
      return json({ ok: false, error: "Error al reiniciar (" + reset.status + "): " + t.slice(0, 200) });
    }

    let total = 0;
    for (let i = 0; i < filas.length; i += 400) {
      const lote = filas.slice(i, i + 400);
      const up = await fetch(`${sbUrl}/rest/v1/infoplus_articulos?on_conflict=codigo`, {
        method: "POST", headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(lote),
      });
      if (!up.ok) {
        const t = await up.text();
        await logRun({ ok: false, error: "Error al guardar (" + up.status + "): " + t.slice(0, 200), total, por_almacen: porAlmacen });
        return json({ ok: false, error: "Error al guardar (" + up.status + "): " + t.slice(0, 200), guardados: total });
      }
      total += lote.length;
    }
    const unidadesTaller = filas.reduce((s, f) => s + (f.existencia || 0), 0);
    await logRun({ ok: true, total, unidades: unidadesTaller, por_almacen: porAlmacen });
    return json({ ok: true, total, unidades: unidadesTaller, por_almacen: porAlmacen, nota: "Existencia de todos los almacenes + precio/costo sincronizados." });
  } catch (e) {
    await logRun({ ok: false, error: String(e) });
    return json({ ok: false, error: String(e) });
  }
});
