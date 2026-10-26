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
// 23-oct-2026 · «bayolcell_cuentas_pago»: las cuentas bancarias del negocio para que el cliente pague, cuando no ha escrito en
// 24 h. Variables: 1 nombre, 2 monto («RD$ 4,600.00» o «su compra»), 3 cuentas en UNA línea (Meta no admite saltos de línea
// dentro de una variable), separadas por « | ».
const PLANTILLA_CUENTAS = {
  name: "bayolcell_cuentas_pago",
  category: "UTILITY",
  language: "es",
  components: [
    { type: "body", text: "Hola {{1}}. Estas son las cuentas de BAYOL CELL para su pago de {{2}}: {{3}}. Cuando transfiera, envíenos el comprobante por este mismo chat. Gracias por preferirnos.", example: { body_text: [["Juan Pérez", "RD$ 4,600.00", "Banco Popular, cuenta de ahorros 123456789 a nombre de BAYOL CELL SRL | Banreservas, cuenta corriente 987654321 a nombre de BAYOL CELL SRL"]] } },
    { type: "footer", text: "BAYOL CELL · Santiago, Moca y Navarrete" },
  ],
};
// 26-oct-2026 · Dueño: «Vamos a ordenar mejor» → «Si». «bayolcell_cuentas_pago_v2»: las cuentas van en el TEXTO FIJO (una por
// bloque, banco en negrita, número solo en su renglón) porque Meta no deja saltos de línea dentro de una variable. Variables:
// 1 nombre (o «cliente»), 2 monto («RD$ 4,600.00» o «su compra»). Si cambia una cuenta, hay que someter otra versión.
const PLANTILLA_CUENTAS_V2 = {
  name: "bayolcell_cuentas_pago_v2",
  category: "UTILITY",
  language: "es",
  components: [
    { type: "body", text: "Hola {{1}}. Para su pago de {{2}} puede transferir a cualquiera de estas cuentas de *BAYOL CELL SRL* (RNC 132-09568-5):\n\n🏦 *Banreservas* · Cuenta corriente\n9605219868\n\n🏦 *Banco Popular* · Cuenta de ahorro\n831440755\n\n🏦 *BHD León* · Cuenta corriente\n29317310011\n\nCuando transfiera, envíenos el comprobante por este chat. Gracias por preferirnos.", example: { body_text: [["Juan Pérez", "RD$ 4,600.00"]] } },
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
  const plantilla = cual === "prefactura" ? PLANTILLA_PREFACTURA : cual === "cuentas" ? PLANTILLA_CUENTAS : cual === "cuentas_v2" ? PLANTILLA_CUENTAS_V2 : PLANTILLA;
  const KEY = (Deno.env.get("ZERNIO_API_KEY") || "").trim();
  const { data: lineas } = await db.from("whatsapp_lineas").select("nombre, whatsapp_numero, zernio_account_id").eq("activo", true);
  const cuentas = [...new Map((lineas || []).filter((l: any) => l.zernio_account_id).map((l: any) => [l.zernio_account_id, `${l.nombre} ${l.whatsapp_numero || ""}`.trim()])).entries()];
  const res: any[] = [];
  // 23-oct-2026 · { accion: 'estado', nombres: [...] }: solo consulta (GET /v1/whatsapp/templates?accountId&name) el estado
  // que Meta le dio a cada plantilla en cada línea. No crea nada.
  if (String(body?.accion ?? "") === "estado") {
    const nombres: string[] = Array.isArray(body?.nombres) && body.nombres.length ? body.nombres.map(String) : [PLANTILLA_PREFACTURA.name, PLANTILLA_CUENTAS.name, PLANTILLA_CUENTAS_V2.name, PLANTILLA.name];
    for (const [accountId, linea] of cuentas) {
      for (const name of nombres) {
        try {
          const r = await fetch(`https://zernio.com/api/v1/whatsapp/templates?accountId=${encodeURIComponent(accountId)}&name=${encodeURIComponent(name)}`, { headers: { Authorization: `Bearer ${KEY}` }, signal: AbortSignal.timeout(20000) });
          const d = await r.json().catch(() => null);
          const t = (d?.templates || []).map((x: any) => ({ idioma: x.language, estado: x.status, motivo: x.rejected_reason ?? null }));
          res.push({ linea, plantilla: name, status: r.status, variantes: t, error: d?.error ?? null });
        } catch (e) { res.push({ linea, plantilla: name, error: String((e as any)?.message || e).slice(0, 120) }); }
      }
    }
    return json({ ok: true, accion: "estado", resultados: res });
  }
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
