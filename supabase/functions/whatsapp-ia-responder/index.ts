import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// whatsapp-ia-responder — agente de IA (Claude Haiku 4.5) que responde
// automaticamente preguntas simples de clientes por WhatsApp (horario,
// direccion, disponibilidad general) y redacta sugerencias para que un
// tecnico revise y mande cuando la pregunta involucra un precio/cotizacion
// o cualquier cosa que el modelo no tenga clara. NUNCA inventa un precio:
// solo cita lo que buscar_infoplus devuelve literalmente para el mensaje
// del cliente, y si no hay coincidencia clara, escala a un tecnico en vez
// de adivinar.
//
// Invocada por whatsapp-webhook (fire-and-forget, envuelta en try/catch
// alla) justo despues de procesar un mensaje entrante real de un cliente —
// nunca bloquea ni puede romper el procesamiento del webhook si falla.
//
// Kill switch: whatsapp_ia_config.activo por sucursal (default false — el
// agente esta APAGADO hasta que un admin lo active desde el CRM con un
// horario/direccion reales configurados).

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const ZERNIO_API_KEY = Deno.env.get("ZERNIO_API_KEY") ?? "";

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function json(o: unknown, status = 200) {
  return new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });
}

async function mandarAZernio(conversationId: string, accountId: string, mensaje: string) {
  const resp = await fetch(`https://zernio.com/api/v1/inbox/conversations/${encodeURIComponent(conversationId)}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${ZERNIO_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ accountId, message: mensaje }),
    signal: AbortSignal.timeout(20000),
  });
  const data = await resp.json().catch(() => null);
  return { ok: resp.ok && !!data?.success, data, status: resp.status };
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ ok: false, error: "Metodo no permitido" }, 405);
  // verify_jwt:false (funcion interna, disparada solo por whatsapp-webhook)
  // -- este chequeo evita que cualquiera en internet dispare llamadas a
  // Anthropic con solo adivinar un hilo_id.
  const authHeader = req.headers.get("Authorization") || "";
  if (authHeader !== `Bearer ${SERVICE_ROLE_KEY}`) {
    return json({ ok: false, error: "no autorizado" }, 401);
  }
  if (!ANTHROPIC_API_KEY) return json({ ok: false, error: "Falta ANTHROPIC_API_KEY" }, 500);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "Body invalido" }, 400);
  }
  const hiloId = body.hilo_id as string;
  const mensajeClienteId = (body.mensaje_cliente_id as string) || null;
  if (!hiloId) return json({ ok: false, error: "Falta hilo_id" }, 400);

  const { data: hilo } = await db
    .from("whatsapp_hilos")
    .select("id, sucursal_id, linea_id, telefono_e164")
    .eq("id", hiloId)
    .maybeSingle();
  if (!hilo) return json({ ok: false, error: "Hilo no encontrado" }, 404);

  const { data: config } = await db
    .from("whatsapp_ia_config")
    .select("horario, direccion, notas_adicionales, activo")
    .eq("sucursal_id", hilo.sucursal_id)
    .maybeSingle();
  if (!config?.activo) return json({ ok: true, omitido: "agente inactivo para esta sucursal" });

  const { data: mensajesRaw } = await db
    .from("whatsapp_mensajes")
    .select("direccion, cuerpo, tipo_contenido, creado_en")
    .eq("hilo_id", hiloId)
    .order("creado_en", { ascending: false })
    .limit(10);
  const historial = (mensajesRaw || []).slice().reverse();

  const ultimo = historial.length ? historial[historial.length - 1] : null;
  const textoCliente = ultimo && ultimo.direccion === "in" ? (ultimo.cuerpo || "") : "";
  if (!textoCliente.trim()) return json({ ok: true, omitido: "sin texto de cliente para responder" });

  // Busqueda de precios siempre se intenta con el texto crudo del cliente;
  // el modelo decide si los resultados son relevantes, nunca los inventa.
  const { data: precios } = await db.rpc("buscar_infoplus", { p_query: textoCliente, p_limite: 5 });
  const contextoPrecios =
    Array.isArray(precios) && precios.length
      ? precios
          .map((p: any) => `${p.codigo} | ${p.descripcion} | ${p.marca || ""} | precio: RD$${p.precio} | existencia taller: ${p.existencia}`)
          .join("\n")
      : "(sin coincidencias en el catalogo para este mensaje)";

  const historialTexto = historial
    .map((m: any) => `${m.direccion === "in" ? "Cliente" : "Negocio"}: ${m.cuerpo || `[${m.tipo_contenido}]`}`)
    .join("\n");

  const systemPrompt = `Eres el asistente de WhatsApp de BAYOL CELL (taller de reparacion de celulares y venta), para la sucursal de este chat.

Datos reales de esta sucursal (usa SOLO esto para horario/direccion, nunca inventes):
- Horario: ${config.horario || "no especificado -- si preguntan, di que un tecnico les confirma"}
- Direccion: ${config.direccion || "no especificada -- si preguntan, di que un tecnico les confirma"}
- Notas adicionales: ${config.notas_adicionales || "(ninguna)"}

Precios encontrados en el catalogo para el mensaje mas reciente del cliente (pueden no ser relevantes -- usalos SOLO si aplican exactamente a lo que preguntan):
${contextoPrecios}

Reglas estrictas:
1. NUNCA inventes un precio ni una pieza que no este en la lista de arriba. Si el cliente pregunta un precio y no hay una coincidencia clara y exacta, NO cotices -- marca la respuesta para revision humana.
2. Preguntas simples que SI puedes responder directo: horario, direccion, si hacen tal tipo de reparacion en general (sin precio), saludos, confirmaciones simples.
3. Cualquier cotizacion de precio, negociacion, queja, diagnostico tecnico especifico, o algo que no tengas claro: SIEMPRE marca para revision humana, incluso si crees saber la respuesta.
4. Tono: dominicano, cordial, breve (whatsapp, no correos largos). Nunca prometas tiempos de entrega ni descuentos.
5. Responde EXCLUSIVAMENTE con un JSON valido, sin texto extra antes o despues, con esta forma exacta:
{"categoria": "auto" o "revisar", "razon": "string breve explicando por que", "respuesta": "el texto que se mandaria o sugeriria al cliente"}`;

  let categoria = "revisar";
  let razon = "no se pudo interpretar la respuesta del modelo";
  let respuesta = "";

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: "user", content: `Historial reciente de la conversacion:\n${historialTexto}\n\nResponde con el JSON pedido.` }],
      }),
      signal: AbortSignal.timeout(25000),
    });
    const data = await resp.json();
    const textoRespuesta: string = data?.content?.[0]?.text || "";
    const match = textoRespuesta.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (parsed.respuesta) {
        categoria = parsed.categoria === "auto" ? "auto" : "revisar";
        razon = String(parsed.razon || "").slice(0, 300);
        respuesta = String(parsed.respuesta).slice(0, 1500);
      }
    } else {
      console.error("whatsapp-ia-responder: respuesta de Anthropic sin JSON reconocible:", JSON.stringify(data).slice(0, 500));
    }
  } catch (e) {
    console.error("whatsapp-ia-responder: fallo llamando a Anthropic:", e instanceof Error ? e.message : String(e));
    return json({ ok: false, error: "fallo_ia" }, 502);
  }

  if (!respuesta.trim()) return json({ ok: true, omitido: "el modelo no genero respuesta util" });

  if (categoria === "auto") {
    const { data: linea } = await db.from("whatsapp_lineas").select("zernio_account_id").eq("id", hilo.linea_id).maybeSingle();
    if (!linea?.zernio_account_id) {
      categoria = "revisar";
      razon = "sin cuenta de Zernio configurada para enviar automaticamente";
    } else {
      const conversationId = hilo.telefono_e164.startsWith("bsid:") ? hilo.telefono_e164.slice(5) : hilo.telefono_e164;
      const resultado = await mandarAZernio(conversationId, linea.zernio_account_id, respuesta);
      if (resultado.ok) {
        const ahora = new Date().toISOString();
        await db.from("whatsapp_mensajes").insert({
          hilo_id: hiloId,
          direccion: "out",
          tipo_contenido: "text",
          cuerpo: respuesta,
          wa_message_id: resultado.data?.data?.messageId ?? null,
          estado: "enviado",
          es_automatico: true,
          enviado_por_tipo: "sistema",
        });
        await db
          .from("whatsapp_hilos")
          .update({ ultimo_mensaje_at: ahora, ultimo_mensaje_preview: respuesta.slice(0, 200), actualizado_en: ahora })
          .eq("id", hiloId);
        return json({ ok: true, categoria: "auto", enviado: true });
      }
      console.error("whatsapp-ia-responder: Zernio rechazo el envio automatico, se degrada a sugerencia:", resultado.status);
      categoria = "revisar";
      razon = "Zernio rechazo el envio automatico -- revisar manualmente";
    }
  }

  const { error: sugError } = await db.from("whatsapp_ia_sugerencias").insert({
    hilo_id: hiloId,
    mensaje_cliente_id: mensajeClienteId,
    texto_sugerido: respuesta,
    razon,
  });
  if (sugError) console.error("whatsapp-ia-responder: error guardando sugerencia:", sugError.message);

  return json({ ok: true, categoria: "revisar", enviado: false });
});
