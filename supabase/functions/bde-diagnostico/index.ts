import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// v23 (10 oct 2026): basada en la v22 desplegada. Cambios: exige permiso de Diagnóstico
// (antes cualquier sesión podía gastar crédito de la IA), modelo actual y más espacio de respuesta.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const json = (obj: unknown, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });
  try {
    // Permiso real en el servidor: misma regla que el resto del módulo Diagnóstico.
    const sbUrl = Deno.env.get("SUPABASE_URL") || "";
    const anon = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const auth = req.headers.get("authorization") || "";
    if (!/^Bearer \S+$/i.test(auth)) return json({ ok: false, error: "Inicia sesión." });
    const perm = await fetch(`${sbUrl}/rest/v1/rpc/app_puede_diagnostico`, {
      method: "POST", headers: { apikey: anon, Authorization: auth, "Content-Type": "application/json" }, body: "{}",
    });
    if (!perm.ok || (await perm.json().catch(() => null)) !== true) {
      return json({ ok: false, error: "Tu usuario no tiene permiso de Diagnóstico. Pídeselo al administrador." });
    }

    const body = await req.json().catch(() => ({}));
    const modelo = (body.modelo || "").toString().slice(0, 80);
    const ios_version = (body.ios_version || "").toString().slice(0, 40);
    const bateria = (body.bateria || "").toString().slice(0, 200);
    const consumo = (body.consumo || "").toString().slice(0, 200);
    const panic_log = (body.panic_log || "").toString();
    const historial = (body.historial || "").toString().slice(0, 4000);
    const sintomas = (Array.isArray(body.sintomas) ? body.sintomas.join(", ") : (body.sintomas || "").toString()).slice(0, 1000);

    const apiKey = (Deno.env.get("ANTHROPIC_API_KEY") || "").trim();
    if (!apiKey) return json({ ok: false, error: "Falta configurar la API key de Claude (ANTHROPIC_API_KEY) en Supabase." });

    // Base de conocimiento: casos similares del mismo modelo, priorizando los mas confirmados y exitosos
    let casos = "";
    try {
      const svc = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (sbUrl && svc && modelo) {
        const r = await fetch(`${sbUrl}/rest/v1/conocimiento_casos?select=modelo,panic_code,sintomas,solucion,exitoso,veces_confirmado,tiempo_minutos,piezas_usadas&modelo=eq.${encodeURIComponent(modelo)}&order=veces_confirmado.desc,exitoso.desc&limit=8`, { headers: { apikey: svc, Authorization: `Bearer ${svc}` } });
        if (r.ok) { const d = await r.json(); if (Array.isArray(d) && d.length) casos = JSON.stringify(d); }
      }
    } catch (_) { /* ignore */ }

    const system = `Eres BAYOL DIAGNOSTIC ENGINE, un ingeniero experto en reparacion de placa (microsoldadura) de iPhone, para el taller BAYOL CELL en Republica Dominicana. Razonas sobre electronica, esquematicos y buses (I2C, PMIC, raile de voltaje) de iPhone 6 a iPhone 16. Respondes en espanol dominicano, tecnico pero claro, dirigido al tecnico.\nSi te paso casos resueltos antes en BAYOL CELL, dales MUCHO peso (son la experiencia real del taller): los que tienen mas 'veces_confirmado' y exitoso=true son los mas confiables.\nInterpretacion del CONSUMO de corriente con fuente DC (huella de la falla, sobre todo si el equipo esta muerto y sin panic log):\n- 0.00 A (no jala nada): fusible abierto / PMIC sin voltaje de entrada / linea principal abierta.\n- 0.01-0.08 A (consumo bajo y estable): posible corto suave en un rail de bajo voltaje, o equipo en espera sin bootear.\n- sube y se queda en ~0.1-0.4 A sin pasar de ahi: se traba en un punto del boot (revisar rail/IC de esa etapa).\n- 0.5 A o mas de golpe al aplicar voltaje (sin pantalla): corto fuerte -> revision termica urgente para hallar el componente caliente.\nUsa el consumo junto con los sintomas y el panic para razonar.\nDevuelve SIEMPRE este formato:\nDIAGNOSTICO PRINCIPAL (con % de probabilidad)\nEXPLICACION (por que, que componentes/buses involucra)\nSECUENCIA DE REPARACION (pasos numerados, de lo mas simple/seguro a lo mas complejo)\nPIEZAS PROBABLES (con nivel de probabilidad)\nSi la informacion es insuficiente, indica que medir o verificar. No inventes datos del dispositivo.`;

    const userMsg = `Diagnostica este caso:\n- Modelo: ${modelo || "(no indicado)"}  | iOS: ${ios_version || "(no indicado)"}\n- Bateria: ${bateria || "(no indicada)"}\n- Consumo en fuente DC: ${consumo || "(no medido)"}\n- Sintomas reportados: ${sintomas || "(ninguno)"}\n- Historial: ${historial || "(sin historial)"}\n- Panic log:\n${panic_log ? panic_log.slice(0, 12000) : "(no hay panic log - usa razonamiento por sintomas y consumo)"}\n${casos ? "\nCasos similares resueltos antes en BAYOL CELL (base de conocimiento, ordenados por mas confirmados): " + casos : ""}`;

    const llamar = (extra: Record<string, unknown>, beta: boolean) => fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", ...(beta ? { "anthropic-beta": "server-side-fallback-2026-07-01" } : {}), "content-type": "application/json" },
      body: JSON.stringify({ ...extra, system, messages: [{ role: "user", content: userMsg }] }),
    });
    let resp = await llamar({ model: "claude-opus-5-5", max_tokens: 8000, output_config: { effort: "medium" }, fallbacks: "default" }, true);
    // Red de seguridad: si la cuenta no acepta el modelo o los parámetros nuevos, se usa la configuración de la v22.
    if (resp.status === 400 || resp.status === 404) {
      console.log("BDE-MODELO-NUEVO-RECHAZADO", resp.status, (await resp.text().catch(() => "")).slice(0, 300));
      resp = await llamar({ model: "claude-sonnet-4-6", max_tokens: 1800 }, false);
    }
    const data = await resp.json();
    if (!resp.ok) {
      console.log("BDE-ANTHROPIC-ERROR", resp.status, JSON.stringify(data).slice(0, 500));
      return json({ ok: false, error: (data && data.error && data.error.message) || "Error al consultar la IA." });
    }
    if (data && data.stop_reason === "refusal") return json({ ok: false, error: "La IA no pudo responder esa consulta. Reformúlala con datos técnicos." });
    const texto = ((data && data.content) || []).filter((b: any) => b.type === "text").map((b: any) => b.text || "").join("\n").trim();
    return json({ ok: true, diagnostico: texto });
  } catch (e) {
    console.log("BDE-EXCEPTION", String(e));
    return json({ ok: false, error: "No se completó el diagnóstico. Intenta de nuevo." });
  }
});
