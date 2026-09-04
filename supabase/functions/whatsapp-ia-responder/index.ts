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
//
// Fix 2026-09-04 (vision): muchos clientes no saben decir el modelo de su
// celular (no es raro en RD) y en vez de escribirlo mandan una FOTO del
// equipo. Antes, si el ultimo mensaje entrante no tenia texto (una imagen
// sola), la funcion no hacia nada. Ahora, si el ultimo mensaje del cliente
// es una imagen, se descarga desde Storage y se manda a Claude como parte
// del mensaje (Claude Haiku soporta vision) para que identifique marca/
// modelo y pregunte que problema tiene -- nunca da precio ni pieza
// especifica basandose solo en la foto, eso sigue exigiendo el texto del
// cliente confirmando que necesita (la guarda de precios de mas abajo
// aplica igual, viendo la respuesta redactada).

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
    .select("direccion, cuerpo, tipo_contenido, media_path, creado_en")
    .eq("hilo_id", hiloId)
    .order("creado_en", { ascending: false })
    .limit(10);
  const historial = (mensajesRaw || []).slice().reverse();

  const ultimo = historial.length ? historial[historial.length - 1] : null;
  const textoCliente = ultimo && ultimo.direccion === "in" ? (ultimo.cuerpo || "") : "";
  const esImagenCliente = !!(ultimo && ultimo.direccion === "in" && ultimo.tipo_contenido === "imagen" && ultimo.media_path);
  if (!textoCliente.trim() && !esImagenCliente) return json({ ok: true, omitido: "sin texto ni imagen de cliente para responder" });

  // Alcance reducido a proposito (2026-09-04, pedido del dueño): por ahora
  // el agente SOLO saluda y pregunta de que ciudad escribe el cliente en el
  // primer contacto -- nada mas se auto-envia todavia (ni horario, ni
  // direccion, ni disponibilidad general), aunque antes si se permitia.
  // "Primer contacto" = todavia no hay ningun mensaje saliente del negocio
  // en el historial reciente de este hilo.
  const esPrimerContacto = !historial.some((m: any) => m.direccion === "out");

  // Si el cliente mando una foto del celular en vez de escribir el modelo,
  // se descarga y se manda a Claude como imagen (limite de seguridad: si
  // falla la descarga o pesa demasiado, se sigue solo con texto en vez de
  // romper la respuesta completa). Anthropic exige que la imagen en base64
  // pese <=10MB -- base64 infla el tamano original ~33%, asi que el limite
  // sobre el archivo CRUDO (antes de codificar) tiene que ser mas chico,
  // no los mismos 10MB (un archivo de 15MB crudo generaria ~20MB en base64
  // y la API lo rechazaria).
  const LIMITE_IMAGEN_CRUDA = 7 * 1024 * 1024; // ~9.3MB en base64, con margen bajo el limite de 10MB de Anthropic
  let imagenBase64: string | null = null;
  let imagenMediaType = "image/jpeg";
  if (esImagenCliente) {
    try {
      const { data: archivo, error: errArchivo } = await db.storage.from("whatsapp-media").download(ultimo!.media_path as string);
      if (errArchivo || !archivo) {
        console.error("whatsapp-ia-responder: no se pudo descargar la imagen del cliente:", errArchivo?.message);
      } else if (archivo.size > LIMITE_IMAGEN_CRUDA) {
        console.error("whatsapp-ia-responder: imagen del cliente demasiado grande, se omite vision:", archivo.size);
      } else {
        const buf = await archivo.arrayBuffer();
        let binario = "";
        const bytes = new Uint8Array(buf);
        const CHUNK = 8192;
        for (let i = 0; i < bytes.length; i += CHUNK) {
          binario += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
        }
        imagenBase64 = btoa(binario);
        if (archivo.type) imagenMediaType = archivo.type;
      }
    } catch (e) {
      console.error("whatsapp-ia-responder: error procesando imagen del cliente:", e instanceof Error ? e.message : String(e));
    }
  }

  // Busqueda de precios siempre se intenta con el texto crudo del cliente
  // (si mando solo una foto, no hay texto que buscar, y el catalogo queda
  // vacio -- correcto, no se puede cotizar solo con una imagen); el modelo
  // decide si los resultados son relevantes, nunca los inventa.
  const { data: precios } = textoCliente.trim()
    ? await db.rpc("buscar_infoplus", { p_query: textoCliente, p_limite: 5 })
    : { data: null };
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

Datos reales de esta sucursal (referencia interna tuya -- NO los repitas todavia, ver regla 2):
- Horario: ${config.horario || "no especificado"}
- Direccion: ${config.direccion || "no especificada"}
- Notas adicionales: ${config.notas_adicionales || "(ninguna)"}

Precios encontrados en el catalogo para el mensaje mas reciente del cliente (el catalogo puede tener precios desactualizados -- nunca los mandes tu mismo, solo redactalos como sugerencia):
${contextoPrecios}

ALCANCE ACTUAL (reducido a proposito, temporal): por ahora el UNICO caso que se auto-envia (categoria "auto") es el saludo inicial. TODO lo demas es categoria "revisar", sin excepcion -- horario, direccion, disponibilidad, precios, identificacion de modelo por foto, cualquier cosa. Esto va a cambiar mas adelante, pero por ahora la unica accion automatica permitida es la de la regla 2.

Es primer contacto de este cliente (aun no hay ningun mensaje saliente del negocio en este hilo): ${esPrimerContacto ? "SI" : "NO"}

Reglas estrictas:
1. NUNCA inventes un precio ni una pieza que no este en la lista de arriba, ni un horario/direccion que no este arriba.
2. SOLO SI "Es primer contacto" es SI: responde con categoria "auto", un saludo corto y cordial dandole la bienvenida a BAYOL CELL, y pregunta de que ciudad escribe o cual sucursal le queda mas cerca (Santiago, Moca o Navarrete). NO menciones horario, direccion, ni precios en este mensaje -- solo el saludo y la pregunta de la ciudad.
3. Si "Es primer contacto" es NO (ya se le dio la bienvenida, esta es una respuesta de seguimiento): SIEMPRE categoria "revisar", sin importar que tan simple parezca la pregunta (aunque sea solo el horario o la direccion). Redacta la mejor respuesta posible para que un empleado la revise y decida si mandarla, pero nunca la clasifiques como "auto".
4. Si el cliente mando una FOTO de su celular (comun -- muchos clientes no saben donde ver el modelo del equipo): identifica marca y modelo lo mejor que puedas en la respuesta redactada, pero esto SIEMPRE es categoria "revisar" tambien (no menciones precio ni pieza especifica, y no la envies sola aunque sea el primer contacto).
5. Tono: dominicano, cordial, breve (whatsapp, no correos largos). Nunca prometas tiempos de entrega ni descuentos.
6. Responde EXCLUSIVAMENTE con un JSON valido, sin texto extra antes o despues, con esta forma exacta:
{"categoria": "auto" o "revisar", "razon": "string breve explicando por que", "respuesta": "el texto que se mandaria o sugeriria al cliente"}`;

  let categoria = "revisar";
  let razon = "no se pudo interpretar la respuesta del modelo";
  let respuesta = "";

  try {
    const textoUsuario = esImagenCliente
      ? `Historial reciente de la conversacion:\n${historialTexto}\n\nEl cliente acaba de mandar la foto de su celular que ves arriba (en vez de escribir el modelo)${textoCliente.trim() ? ` junto con este texto: "${textoCliente}"` : ""}. Responde con el JSON pedido.`
      : `Historial reciente de la conversacion:\n${historialTexto}\n\nResponde con el JSON pedido.`;
    // deno-lint-ignore no-explicit-any
    const contenidoUsuario: any = imagenBase64
      ? [
          { type: "image", source: { type: "base64", media_type: imagenMediaType, data: imagenBase64 } },
          { type: "text", text: textoUsuario },
        ]
      : textoUsuario;

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
        messages: [{ role: "user", content: contenidoUsuario }],
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

  // Guarda de codigo para el alcance reducido (2026-09-04): por ahora SOLO
  // el saludo de primer contacto se auto-envia -- cualquier otra cosa,
  // aunque el modelo la marque "auto", se fuerza a "revisar".
  if (categoria === "auto" && !esPrimerContacto) {
    categoria = "revisar";
    razon = "alcance reducido: solo el saludo de primer contacto se auto-envia por ahora";
  }

  // Guarda de codigo, no solo de instrucciones al modelo: el catalogo de
  // Infoplus puede tener precios desactualizados, y el modelo puede
  // clasificar mal. Si el catalogo devolvio alguna coincidencia para el
  // mensaje del cliente, o la respuesta redactada menciona un precio, NUNCA
  // se auto-envia -- siempre pasa por un tecnico, sin excepcion.
  const tieneCoincidenciasDePrecio = Array.isArray(precios) && precios.length > 0;
  const pareceMencionarPrecio = /RD\$|US\$|\$\s?\d|\bprecio\b|\bcuesta\b|\bvale\b/i.test(respuesta);
  if (categoria === "auto" && (tieneCoincidenciasDePrecio || pareceMencionarPrecio)) {
    categoria = "revisar";
    razon = "el mensaje o la respuesta involucra precios -- siempre requiere revision humana";
  }

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
