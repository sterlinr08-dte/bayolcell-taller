// Puente seguro Taller -> NEXUS PRO (Rifas).
// El staff del taller (logueado) pide un "pase": esta funcion valida contra la auth
// de NEXUS PRO con la cuenta-puente (clave NUNCA llega al navegador) y devuelve los
// tokens para entrar ya logueado a las Rifas.
// verify_jwt=true => solo usuarios autenticados del taller pueden invocarla.
//
// 8 oct 2026 (ajuste de permisos):
//  - La cuenta-puente se lee de los Secrets del proyecto (no vive en el código),
//    los mismos que ya usa consultar-boleto:
//      NEXUS_PRO_URL, NEXUS_PRO_ANON_KEY, NEXUS_PRO_BRIDGE_EMAIL, NEXUS_PRO_BRIDGE_PWD
//    Si falta alguno, la función no hace nada y responde 503.
//  - Solo la puede usar el administrador o quien tenga el permiso «rifas_ver»
//    (el mismo que muestra el botón «Rifa (admin)»), verificado en el servidor
//    con app_is_admin() / app_actor_tiene_permiso() usando la sesión de quien llama.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const NEXUS_URL = (Deno.env.get("NEXUS_PRO_URL") || "").trim().replace(/\/+$/, "");
const NEXUS_ANON = (Deno.env.get("NEXUS_PRO_ANON_KEY") || "").trim();
const BRIDGE_EMAIL = (Deno.env.get("NEXUS_PRO_BRIDGE_EMAIL") || "").trim();
const BRIDGE_PWD = Deno.env.get("NEXUS_PRO_BRIDGE_PWD") || "";

const PERMISO = "rifas_ver";

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);
  try {
    if (!(await tienePermiso(req, PERMISO))) {
      return json({ error: "No tienes permiso para abrir Rifas." }, 403);
    }
    if (!NEXUS_URL || !NEXUS_ANON || !BRIDGE_EMAIL || !BRIDGE_PWD) {
      console.error("puente-rifa: faltan los Secrets de la cuenta-puente");
      return json({ error: "El acceso a Rifas no está configurado." }, 503);
    }
    const r = await fetch(`${NEXUS_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { "apikey": NEXUS_ANON, "Content-Type": "application/json" },
      body: JSON.stringify({ email: BRIDGE_EMAIL, password: BRIDGE_PWD }),
      signal: AbortSignal.timeout(15000),
    });
    const d = await r.json().catch(() => null);
    if (!r.ok || !d?.access_token) {
      return json({ error: "no_auth" }, 502);
    }
    return json({
      access_token: d.access_token,
      refresh_token: d.refresh_token,
      expires_in: d.expires_in,
    });
  } catch (e) {
    console.error("puente-rifa error:", e instanceof Error ? e.message : String(e));
    return json({ error: "No se pudo abrir Rifas." }, 500);
  }
});
