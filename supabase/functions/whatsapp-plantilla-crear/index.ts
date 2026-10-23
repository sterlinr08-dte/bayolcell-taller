import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
// 22-oct-2026 · Dueño: «SOMETE LA PROPUESTA A». Somete a Meta (vía Zernio, POST /v1/whatsapp/templates) SOLO una de
// las plantillas fijas de abajo (body.cual: 'seguimiento' por defecto, o 'prefactura'), en la cuenta de cada línea
// activa. No acepta otro contenido. Uso único: exige una llave cuyo SHA-256 esté vigente en `_plantilla_llaves`
// (RLS sin políticas; la escribe solo quien administra la base).
// 22-oct-2026 (noche) · «bayolcell_prefactura»: la prefactura del taller enviada por WhatsApp cuando el cliente no ha
// escrito en 24 h. Variables: 1 nombre, 2 número, 3 sucursal, 4 total.
const PLANTILLA_PREFACTURA = {
  name: "bayolcell_prefactura",
  category: "UTILITY",
  language: "es",
  components: [
    { type: "body", text: "Hola {{1}}. Le enviamos su prefactura Nº {{2}} de BAYOL CELL, sucursal {{3}}, por {{4}}. Gracias por preferirnos.", example: { body_text: [["Juan Pérez", "118932", "Santiago", "RD$ 11,691.00"]] } },
    { type: "footer", text: "BAYOL CELL · Santiago, Moca y Navarrete" },
  ],
};
const PLANTILLA = {
  name: "bayolcell_seguimiento_consulta",
  category: "UTILITY",
  language: "es",
  components: [
    { type: "body", text: "Buenas, {{1}}. Le saluda BAYOL CELL, sucursal {{2}}. Recibimos su consulta y le daremos seguimiento por este medio. ¿En qué le podemos servir?", example: { body_text: [["Juan Pérez", "Santiago"]] } },
    { type: "footer", text: "BAYOL CELL · Santiago, Moca y Navarrete" },
  ],
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false }, 405);
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const llave = (req.headers.get("x-llave") || "").trim();
  if (llave.length < 32) return json({ ok: false, error: "No autorizado." }, 401);
  const h = hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(llave)));
  const { data: ok } = await db.from("_plantilla_llaves").select("hash").eq("hash", h).gt("vence", new Date().toISOString()).maybeSingle();
  if (!ok) return json({ ok: false, error: "No autorizado." }, 401);
  const body = await req.json().catch(() => ({}));
  const cual = String(body?.cual ?? "seguimiento");
  const plantilla = cual === "prefactura" ? PLANTILLA_PREFACTURA : PLANTILLA;
  const KEY = (Deno.env.get("ZERNIO_API_KEY") || "").trim();
  const { data: lineas } = await db.from("whatsapp_lineas").select("nombre, whatsapp_numero, zernio_account_id").eq("activo", true);
  const cuentas = [...new Map((lineas || []).filter((l: any) => l.zernio_account_id).map((l: any) => [l.zernio_account_id, `${l.nombre} ${l.whatsapp_numero || ""}`.trim()])).entries()];
  const res: any[] = [];
  for (const [accountId, linea] of cuentas) {
    try {
      const r = await fetch("https://zernio.com/api/v1/whatsapp/templates", {
        method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, ...plantilla }), signal: AbortSignal.timeout(20000),
      });
      const d = await r.json().catch(() => null);
      res.push({ linea, status: r.status, ok: !!d?.success, estado: d?.template?.status ?? null, error: d?.error ?? d?.message ?? null, codigo: d?.code ?? null });
    } catch (e) { res.push({ linea, ok: false, error: String((e as any)?.message || e).slice(0, 120) }); }
  }
  return json({ ok: true, plantilla: plantilla.name, resultados: res });
});
