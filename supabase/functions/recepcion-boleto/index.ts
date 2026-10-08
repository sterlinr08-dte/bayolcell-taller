// Recepción del taller -> genera un BOLETO de rifa para un cliente presencial.
// Solo staff logueado del taller (verify_jwt=true). Sin link, sin confirmación:
// recibe nombre + teléfono, asigna un número libre al azar y crea el boleto YA confirmado
// en la rifa activa de BayolCell (base NEXUS PRO). La clave-puente vive server-side.
//
// 8 oct 2026 (ajuste de permisos):
//  - La cuenta-puente se lee de los Secrets del proyecto (no vive en el código),
//    los mismos que ya usa consultar-boleto:
//      NEXUS_PRO_URL, NEXUS_PRO_ANON_KEY, NEXUS_PRO_BRIDGE_EMAIL, NEXUS_PRO_BRIDGE_PWD
//    Si falta alguno, la función no hace nada y responde 503.
//  - Solo la puede usar el administrador o quien tenga el permiso «recepcion_ver»
//    (el de la pantalla de Recepción donde está el botón «Generar boleto»),
//    verificado en el servidor con app_is_admin() / app_actor_tiene_permiso().
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const NEXUS_URL = (Deno.env.get("NEXUS_PRO_URL") || "").trim().replace(/\/+$/, "");
const NEXUS_ANON = (Deno.env.get("NEXUS_PRO_ANON_KEY") || "").trim();
const BRIDGE_EMAIL = (Deno.env.get("NEXUS_PRO_BRIDGE_EMAIL") || "").trim();
const BRIDGE_PWD = Deno.env.get("NEXUS_PRO_BRIDGE_PWD") || "";

const PERMISO = "recepcion_ver";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(o: unknown, status = 200) {
  return new Response(JSON.stringify(o), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

// Administrador o permiso del rol, resuelto en la base con la sesión de quien llama.
async function tienePermiso(req: Request, permiso: string): Promise<boolean> {
  const authorization = req.headers.get("Authorization") || "";
  if (!/^Bearer\s+\S+/i.test(authorization) || !SUPABASE_URL || !SUPABASE_ANON_KEY) return false;
  const caller = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data: esAdmin, error: adminError } = await caller.rpc("app_is_admin");
  if (!adminError && esAdmin === true) return true;
  const { data: conPermiso, error: permisoError } = await caller.rpc("app_actor_tiene_permiso", { p_permiso: permiso });
  return !permisoError && conPermiso === true;
}

async function getToken(): Promise<string | null> {
  const r = await fetch(`${NEXUS_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: NEXUS_ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email: BRIDGE_EMAIL, password: BRIDGE_PWD }),
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) return null;
  const d = await r.json().catch(() => null);
  return d?.access_token || null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "metodo", msg: "Método no permitido" }, 405);
  try {
    if (!(await tienePermiso(req, PERMISO))) {
      return json({ error: "sin_permiso", msg: "No tienes permiso para generar boletos." }, 403);
    }
    if (!NEXUS_URL || !NEXUS_ANON || !BRIDGE_EMAIL || !BRIDGE_PWD) {
      console.error("recepcion-boleto: faltan los Secrets de la cuenta-puente");
      return json({ error: "no_configurado", msg: "La rifa no está configurada en el servidor." }, 503);
    }

    const body = await req.json().catch(() => ({}));
    const nombre = String(body?.nombre || "").trim();
    const telefono = body?.telefono ? String(body.telefono).trim() : null;
    if (!nombre) return json({ error: "falta_nombre", msg: "Escribe el nombre del cliente" }, 400);

    const token = await getToken();
    if (!token) return json({ error: "auth", msg: "No se pudo conectar con la rifa" }, 502);
    const H = { apikey: NEXUS_ANON, Authorization: "Bearer " + token, "Content-Type": "application/json" };

    // Rifa activa de BayolCell (RLS la limita a su organización).
    const rifas = await fetch(`${NEXUS_URL}/rest/v1/rifas?order=created_at.desc&limit=10&select=id,nombre,cantidad_numeros,cantidad_digitos,estado`, { headers: H }).then((r) => r.json()).catch(() => []);
    const rifa = (Array.isArray(rifas) ? rifas : []).find((r: any) => r.estado !== "sorteada" && r.estado !== "cerrada") || (Array.isArray(rifas) ? rifas[0] : null);
    if (!rifa) return json({ error: "sin_rifa", msg: "No hay una rifa activa. El administrador debe crear la rifa primero." }, 404);

    const total = Number(rifa.cantidad_numeros || 0);
    const dig = Number(rifa.cantidad_digitos || 4);
    if (!total) return json({ error: "rifa_sin_numeros", msg: "La rifa no tiene números configurados" }, 400);

    // Números ya tomados.
    const taken = await fetch(`${NEXUS_URL}/rest/v1/rifa_boletos?rifa_id=eq.${rifa.id}&select=numero&limit=100000`, { headers: H }).then((r) => r.json()).catch(() => []);
    const takenSet = new Set((Array.isArray(taken) ? taken : []).map((b: any) => String(b.numero)));
    if (takenSet.size >= total) return json({ error: "sin_numeros", msg: "Ya no quedan números disponibles en la rifa" }, 409);

    function pick(): string | null {
      for (let i = 0; i < 80; i++) { const n = Math.floor(Math.random() * total); const s = String(n).padStart(dig, "0"); if (!takenSet.has(s)) return s; }
      for (let n = 0; n < total; n++) { const s = String(n).padStart(dig, "0"); if (!takenSet.has(s)) return s; }
      return null;
    }

    // Crear boleto confirmado; reintenta si el número se tomó en la carrera.
    for (let intento = 0; intento < 4; intento++) {
      const numero = pick();
      if (!numero) return json({ error: "sin_numeros", msg: "Ya no quedan números disponibles" }, 409);
      const ins = await fetch(`${NEXUS_URL}/rest/v1/rifa_boletos`, {
        method: "POST",
        headers: { ...H, Prefer: "return=representation" },
        body: JSON.stringify({ rifa_id: rifa.id, numero, comprador_nombre: nombre, comprador_telefono: telefono, estado: "confirmado", origen: "taller", precio: 0 }),
      });
      if (ins.ok) {
        const row = (await ins.json())[0];
        return json({ ok: true, numero, id: row?.id, rifa: rifa.nombre || "" });
      }
      if (ins.status === 409) { takenSet.add(numero); continue; } // choque, repetir
      const t = await ins.text();
      return json({ error: "no_creado", msg: "No se pudo crear el boleto", detail: t.slice(0, 200) }, 502);
    }
    return json({ error: "colision", msg: "Intenta de nuevo" }, 409);
  } catch (e) {
    console.error("recepcion-boleto error:", e instanceof Error ? e.message : String(e));
    return json({ error: "server", msg: "No se pudo generar el boleto." }, 500);
  }
});
