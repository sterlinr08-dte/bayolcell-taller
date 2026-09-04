import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// whatsapp-ia-responder — agente de IA (Claude Haiku 4.5) para WhatsApp.
//
// Invocada por whatsapp-webhook (fire-and-forget, envuelta en try/catch
// alla) justo despues de procesar un mensaje entrante real de un cliente —
// nunca bloquea ni puede romper el procesamiento del webhook si falla.
//
// Kill switch: whatsapp_ia_config.activo por sucursal (default false — el
// agente esta APAGADO hasta que un admin lo active desde el CRM).
//
// Fix 2026-09-04 (se retira la funcion de sugerencias): el dueño pidio
// eliminar por completo la redaccion de borradores para seguimientos
// (precios, fotos, notas de voz, disponibilidad, etc) -- estaban generando
// tarjetas "IA sugiere" duplicadas/confusas en la pantalla cuando el
// cliente mandaba varios mensajes seguidos. Ahora esta funcion SOLO hace
// una cosa: auto-enviar el saludo de bienvenida cuando arranca una
// conversacion nueva (primera vez que el cliente escribe, o retoma el chat
// despues de 24 horas o mas sin actividad, en cualquier direccion). Para
// cualquier otro mensaje (seguimientos, fotos, notas de voz, preguntas de
// precio) la funcion no hace nada -- no llama a Anthropic, no busca en el
// catalogo, no guarda ninguna sugerencia. El tecnico responde directo,
// sin ayuda de IA, para todo lo que no sea ese saludo inicial.

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

// Ventana de inactividad (en cualquier direccion) despues de la cual se
// considera que arranca una conversacion nueva y se vuelve a auto-enviar
// el saludo -- igual que un cliente que reabre el chat despues de varios
// dias.
const VENTANA_SALUDO_HORAS = 24;

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
  if (!hiloId) return json({ ok: false, error: "Falta hilo_id" }, 400);

  const { data: hilo } = await db
    .from("whatsapp_hilos")
    .select("id, sucursal_id, linea_id, telefono_e164")
    .eq("id", hiloId)
    .maybeSingle();
  if (!hilo) return json({ ok: false, error: "Hilo no encontrado" }, 404);

  const { data: config } = await db
    .from("whatsapp_ia_config")
    .select("activo")
    .eq("sucursal_id", hilo.sucursal_id)
    .maybeSingle();
  if (!config?.activo) return json({ ok: true, omitido: "agente inactivo para esta sucursal" });

  // Solo hacen falta los timestamps de los dos mensajes mas recientes del
  // hilo (el que disparo esta llamada, y el que vino justo antes) para
  // medir el hueco de inactividad -- ya no se usa el contenido del
  // historial para nada (no hay mas sugerencias que redactar con contexto).
  const { data: ultimosMensajes } = await db
    .from("whatsapp_mensajes")
    .select("creado_en")
    .eq("hilo_id", hiloId)
    .order("creado_en", { ascending: false })
    .limit(2);
  const [mensajeActual, mensajeAnterior] = ultimosMensajes || [];
  if (!mensajeActual) return json({ ok: true, omitido: "sin mensajes en el hilo" });

  const horasDesdeUltimoMensaje = mensajeAnterior
    ? (new Date(mensajeActual.creado_en).getTime() - new Date(mensajeAnterior.creado_en).getTime()) / (60 * 60 * 1000)
    : Infinity;
  const esInicioDeConversacion = horasDesdeUltimoMensaje >= VENTANA_SALUDO_HORAS;

  if (!esInicioDeConversacion) {
    return json({ ok: true, omitido: "fuera de alcance: solo se auto-envia el saludo de inicio de conversacion" });
  }

  const systemPrompt = `Eres el asistente de WhatsApp de BAYOL CELL (taller de reparacion de celulares y venta), para la sucursal de este chat.

Tu UNICA tarea es redactar el saludo de bienvenida para un cliente que arranca una conversacion nueva con esta sucursal (primera vez que escribe, o retoma el chat despues de 24 horas o mas sin actividad). No se te pide nada mas.

Reglas:
1. Saludo corto y cordial dandole la bienvenida a BAYOL CELL, y pregunta de que ciudad escribe o cual sucursal le queda mas cerca (Santiago, Moca o Navarrete). NO menciones horario, direccion, precios, ni nada que no sea el saludo y la pregunta de la ciudad.
2. Tono: escribe como una persona real de la sucursal texteando por WhatsApp, NO como una IA ni como un bot -- nada de sonar acartonado, corporativo ni de plantilla repetida. Dominicano, cordial, breve, natural, como lo escribiria rapido un empleado desde el celular. No uses el signo de apertura ¿ en las preguntas -- en WhatsApp real casi nadie lo usa, solo pon el signo de cierre al final (ejemplo correcto: "de que ciudad nos escribes?"; incorrecto: "¿De que ciudad nos escribes?").
3. Responde EXCLUSIVAMENTE con un JSON valido, sin texto extra antes o despues, con esta forma exacta:
{"respuesta": "el texto del saludo"}`;

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
        max_tokens: 200,
        system: systemPrompt,
        messages: [{ role: "user", content: "Redacta el saludo de bienvenida para este cliente que recien empieza (o retoma) la conversacion. Responde con el JSON pedido." }],
      }),
      signal: AbortSignal.timeout(25000),
    });
    const data = await resp.json();
    const textoRespuesta: string = data?.content?.[0]?.text || "";
    const match = textoRespuesta.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (parsed.respuesta) respuesta = String(parsed.respuesta).slice(0, 500);
    } else {
      console.error("whatsapp-ia-responder: respuesta de Anthropic sin JSON reconocible:", JSON.stringify(data).slice(0, 500));
    }
  } catch (e) {
    console.error("whatsapp-ia-responder: fallo llamando a Anthropic:", e instanceof Error ? e.message : String(e));
    return json({ ok: false, error: "fallo_ia" }, 502);
  }
  if (!respuesta.trim()) return json({ ok: true, omitido: "el modelo no genero un saludo util" });

  // Normalizacion de tono: que no se sienta que escribe una IA -- en el
  // texteo real de WhatsApp en RD casi nadie usa el signo de apertura ¿,
  // solo el de cierre. Se fuerza por codigo (no solo en el prompt) para
  // que nunca se cuele aunque el modelo lo use de todos modos.
  respuesta = respuesta.replace(/¿/g, "");

  // Guarda de codigo: el saludo nunca deberia mencionar un precio, pero si
  // por alguna razon el modelo se desvia, nunca se auto-envia -- se omite
  // sin mas (ya no hay bandeja de sugerencias donde caer).
  if (/RD\$|US\$|\$\s?\d|\bprecio\b|\bcuesta\b|\bvale\b/i.test(respuesta)) {
    console.error("whatsapp-ia-responder: saludo generado mencionaba un precio, se omite:", respuesta);
    return json({ ok: true, omitido: "el saludo generado mencionaba un precio, se descarta por seguridad" });
  }

  const { data: linea } = await db.from("whatsapp_lineas").select("zernio_account_id").eq("id", hilo.linea_id).maybeSingle();
  if (!linea?.zernio_account_id) {
    return json({ ok: true, omitido: "sin cuenta de Zernio configurada para enviar automaticamente" });
  }

  const conversationId = hilo.telefono_e164.startsWith("bsid:") ? hilo.telefono_e164.slice(5) : hilo.telefono_e164;
  const resultado = await mandarAZernio(conversationId, linea.zernio_account_id, respuesta);
  if (!resultado.ok) {
    console.error("whatsapp-ia-responder: Zernio rechazo el envio del saludo:", resultado.status);
    return json({ ok: true, enviado: false, omitido: "Zernio rechazo el envio" });
  }

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

  return json({ ok: true, enviado: true });
});
