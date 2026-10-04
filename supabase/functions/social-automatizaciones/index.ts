import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// 4 oct 2026 — Motor de automatizaciones estilo ManyChat, Fase 1: «Comentario → privado» (Instagram/Facebook).
// Lo llama el cron cada 2 min (header x-auto-token, validado contra vault con social_auto_token_valido) o un
// administrador con «Revisar ahora» (su propio JWT, validado con app_is_admin()).
// Reglas de seguridad (decisión del dueño + regla del agente supervisado):
//  - Solo procesa automatizaciones con activo=true (nacen apagadas; las activa un administrador).
//  - Solo comentarios POSTERIORES a la activación (activado_en): nunca le escribe a gente de comentarios viejos.
//  - Una vez por persona y publicación (índice único), y nunca dos veces el mismo comentario.
//  - Si el chat de esa persona ya está tomado por un empleado (asignado_id), NO envía (estado omitido_tomado).
//  - Máximo MAX_POR_CORRIDA envíos por automatización en cada corrida.
// No usa IA: manda el texto fijo que escribió el administrador.
const SB_URL = Deno.env.get("SUPABASE_URL")!;
const db = createClient(SB_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const ZERNIO_KEY = (Deno.env.get("ZERNIO_API_KEY") ?? "").trim();
const BASE = "https://zernio.com/api/v1";
const MAX_POR_CORRIDA = 15;
const POSTS_RECIENTES = 10;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-auto-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const out = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });

async function zernio(path: string, init?: RequestInit) {
  const resp = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${ZERNIO_KEY}`, "Content-Type": "application/json", ...(init?.headers || {}) },
    signal: AbortSignal.timeout(15000),
  });
  const body = await resp.json().catch(() => ({}));
  return { ok: resp.ok && body?.success !== false, status: resp.status, body };
}

const cuentas: Record<string, string | null> = {};
async function cuentaDe(plataforma: string) {
  if (plataforma in cuentas) return cuentas[plataforma];
  const r = plataforma === "instagram"
    ? await db.from("instagram_cuentas").select("zernio_account_id").eq("activo", true)
        .order("creado_en", { ascending: false }).limit(1).maybeSingle()
    : await db.from("social_cuentas").select("zernio_account_id").eq("plataforma", plataforma).eq("activo", true)
        .order("actualizado_en", { ascending: false }).limit(1).maybeSingle();
  cuentas[plataforma] = r.data?.zernio_account_id || null;
  return cuentas[plataforma];
}

export function normalizar(s: string) {
  return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9ñ\s]/g, " ").replace(/\s+/g, " ").trim();
}
export function coincide(texto: string, palabras: string[], modo: string) {
  if (modo === "cualquiera") return true;
  const t = normalizar(texto);
  if (!t) return false;
  const ps = (palabras || []).map(normalizar).filter(Boolean);
  if (!ps.length) return false;
  if (modo === "exacta") return ps.some((p) => t === p);
  return ps.some((p) => (" " + t + " ").includes(" " + p + " "));
}

function aplanar(comentarios: any[]) {
  const todos: any[] = [];
  for (const c of comentarios || []) {
    todos.push(c);
    for (const r of c?.replies || []) todos.push(r);
  }
  return todos;
}

// ¿Ese contacto ya tiene un chat tomado por un empleado? (conservador: si coincide id o usuario, no se envía)
async function chatTomado(plataforma: string, from: any) {
  const id = from?.id ? String(from.id) : "";
  const user = String(from?.username || "").replace(/^@/, "");
  if (plataforma === "instagram") {
    const ors = [id && `participant_id.eq.${id}`, user && `participant_username.eq.${user}`].filter(Boolean).join(",");
    if (!ors) return false;
    const { data } = await db.from("instagram_hilos").select("id").or(ors).not("asignado_id", "is", null).limit(1);
    return !!data?.length;
  }
  const nombre = String(from?.name || "").trim();
  const ors = [id && `participant_id.eq.${id}`, nombre && `participant_name.eq."${nombre.replace(/"/g, "")}"`].filter(Boolean).join(",");
  if (!ors) return false;
  const { data } = await db.from("social_hilos").select("id").or(ors).not("asignado_id", "is", null).limit(1);
  return !!data?.length;
}

function personalizar(msg: string, from: any) {
  const nombre = String(from?.name || from?.username || "").trim().split(/\s+/)[0] || "";
  return String(msg || "").replace(/\{nombre\}/gi, nombre).replace(/\s+([,.!?])/g, "$1").trim();
}

async function procesar(a: any, resumen: any, simular = false) {
  const accountId = await cuentaDe(a.plataforma);
  if (!accountId) throw new Error("cuenta_no_configurada");
  // Simular (vista previa del administrador): mira los comentarios de los últimos 7 días sin enviar nada.
  const desde = simular ? Date.now() - 7 * 864e5 : (a.activado_en ? new Date(a.activado_en).getTime() : Date.now());
  let posts: string[] = [];
  if (a.post_id) posts = [a.post_id];
  else {
    const r = await zernio(`/inbox/comments?${new URLSearchParams({ accountId, limit: String(POSTS_RECIENTES) })}`);
    if (!r.ok) throw new Error("zernio_posts_" + r.status);
    posts = (r.body?.data || []).filter((p: any) => Number(p?.commentCount || 0) > 0).map((p: any) => String(p.id));
  }
  let enviados = 0;
  for (const postId of posts) {
    if (enviados >= MAX_POR_CORRIDA) break;
    const r = await zernio(`/inbox/comments/${encodeURIComponent(postId)}?${new URLSearchParams({ accountId, limit: "50" })}`);
    if (!r.ok) { resumen.errores.push(`${a.id}:${postId}:comments_${r.status}`); continue; }
    resumen.publicaciones++;
    const lista = aplanar(r.body?.comments || r.body?.data || []);
    if (simular && !resumen.campos && lista[0]) resumen.campos = Object.keys(lista[0]).concat(Object.keys(lista[0].from || {}).map((k) => "from." + k));
    for (const c of lista) {
      if (enviados >= MAX_POR_CORRIDA) break;
      resumen.comentarios++;
      if (c?.createdTime && (!resumen.ultimo || String(c.createdTime) > resumen.ultimo)) resumen.ultimo = String(c.createdTime);
      if (!c?.id || c?.from?.isOwner) continue;
      const t = c.createdTime ? new Date(c.createdTime).getTime() : 0;
      if (!t || t < desde) continue;
      if (!coincide(c.message || "", a.palabras, a.coincidencia)) continue;
      const autor = String(c.from?.id || c.from?.username || c.from?.name || "").trim();
      if (!autor) continue;
      if (simular) {
        if (resumen.simulados.length < 30) resumen.simulados.push({
          autor: c.from?.name || c.from?.username || "Contacto", texto: String(c.message || "").slice(0, 200),
          fecha: c.createdTime, con_id: !!c.from?.id, tomado: await chatTomado(a.plataforma, c.from),
        });
        continue;
      }
      // Reclamar el comentario ANTES de enviar: los índices únicos evitan duplicados aunque corran dos a la vez.
      const ins = await db.from("social_automatizacion_envios").insert({
        automatizacion_id: a.id, plataforma: a.plataforma, post_id: postId, comentario_id: String(c.id),
        autor_clave: autor, autor_nombre: c.from?.name || c.from?.username || null, texto: String(c.message || "").slice(0, 500),
      }).select("id").maybeSingle();
      if (ins.error || !ins.data) continue; // ya atendido (misma persona/publicación o mismo comentario)
      const envioId = ins.data.id;
      if (await chatTomado(a.plataforma, c.from)) {
        await db.from("social_automatizacion_envios").update({ estado: "omitido_tomado" }).eq("id", envioId);
        resumen.omitidos++;
        continue;
      }
      const priv = await zernio(`/inbox/comments/${encodeURIComponent(postId)}/${encodeURIComponent(String(c.id))}/private-reply`, {
        method: "POST", headers: { "Idempotency-Key": `auto-${envioId}` },
        body: JSON.stringify({ accountId, message: personalizar(a.mensaje_privado, c.from) }),
      });
      if (!priv.ok) {
        const det = JSON.stringify(priv.body?.error || priv.body?.message || priv.body || {}).slice(0, 300);
        await db.from("social_automatizacion_envios").update({ estado: "error", error: `${priv.status} ${det}` }).eq("id", envioId);
        resumen.errores.push(`${a.id}:${c.id}:private_${priv.status}`);
        continue;
      }
      let publicoOk: boolean | null = null;
      if (a.respuesta_publica && String(a.respuesta_publica).trim()) {
        const pub = await zernio(`/inbox/comments/${encodeURIComponent(postId)}`, {
          method: "POST", headers: { "Idempotency-Key": `autopub-${envioId}` },
          body: JSON.stringify({ accountId, message: personalizar(a.respuesta_publica, c.from), commentId: String(c.id) }),
        });
        publicoOk = pub.ok;
      }
      await db.from("social_automatizacion_envios").update({ estado: "ok", publico_ok: publicoOk }).eq("id", envioId);
      await db.rpc("social_automatizacion_sumar", { p_id: a.id });
      enviados++; resumen.enviados++;
    }
  }
}

// ---------- Fase 2/3: palabra clave en el chat → respuesta automática con botones, preguntas y etiquetas ----------
const TABLAS: Record<string, { msg: string; hilo: string }> = {
  whatsapp: { msg: "whatsapp_mensajes", hilo: "whatsapp_hilos" },
  instagram: { msg: "instagram_mensajes", hilo: "instagram_hilos" },
  facebook: { msg: "social_mensajes", hilo: "social_hilos" },
};
const PALABRAS_CANCELAR = ["cancelar", "salir", "parar", "detener", "stop"];
const FLUJO_VENCE_HORAS = 24;

async function cuentaDelHilo(canal: string, hilo: any) {
  if (canal === "whatsapp") {
    const { data } = await db.from("whatsapp_lineas").select("zernio_account_id").eq("id", hilo.linea_id).maybeSingle();
    return data?.zernio_account_id || null;
  }
  const { data } = await db.from(canal === "instagram" ? "instagram_cuentas" : "social_cuentas")
    .select("zernio_account_id").eq("id", hilo.cuenta_id).maybeSingle();
  return data?.zernio_account_id || null;
}

type Boton = { titulo: string; respuesta: string; etiqueta: string };
function botonesValidos(lista: any): Boton[] {
  return (Array.isArray(lista) ? lista : [])
    .map((b: any) => ({ titulo: String(b?.titulo || "").trim().slice(0, 20), respuesta: String(b?.respuesta || "").trim(), etiqueta: String(b?.etiqueta || "").trim() }))
    .filter((b) => b.titulo).slice(0, 3);
}
type Pregunta = { pregunta: string; campo: string };
function preguntasValidas(lista: any): Pregunta[] {
  return (Array.isArray(lista) ? lista : [])
    .map((p: any) => ({ pregunta: String(p?.pregunta || "").trim(), campo: String(p?.campo || "texto") }))
    .filter((p) => p.pregunta).slice(0, 10);
}

// Valida y limpia una respuesta según el tipo de dato. null = no es válida.
export function validarCampo(campo: string, valor: string): string | null {
  const v = String(valor || "").trim();
  if (!v) return null;
  const dig = v.replace(/\D/g, "");
  switch (campo) {
    case "cedula": return dig.length === 11 ? `${dig.slice(0, 3)}-${dig.slice(3, 10)}-${dig.slice(10)}` : null;
    case "telefono": return dig.length >= 10 && dig.length <= 13 ? dig : null;
    case "correo": return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? v.toLowerCase() : null;
    case "nombre": return /[a-záéíóúñ]{2,}/i.test(v) ? v.slice(0, 80) : null;
    default: return v.slice(0, 500);
  }
}
const AYUDA_CAMPO: Record<string, string> = {
  cedula: "la cédula debe tener 11 números",
  telefono: "el teléfono debe tener 10 números",
  correo: "escribe un correo válido (ejemplo: nombre@gmail.com)",
  nombre: "escribe tu nombre",
};
const ETIQUETA_CAMPO: Record<string, string> = { nombre: "Nombre", telefono: "Teléfono", cedula: "Cédula", correo: "Correo", equipo: "Equipo", texto: "Respuesta" };

async function yaRespondio(autoId: string, hiloId: string, horas: number) {
  const desde = new Date(Date.now() - Math.max(1, horas) * 3600e3).toISOString();
  const { data } = await db.from("social_auto_respuestas").select("id").eq("automatizacion_id", autoId)
    .eq("hilo_id", hiloId).eq("estado", "ok").is("boton", null).is("paso", null).gte("creado_en", desde).limit(1);
  return !!data?.length;
}

// Envía un texto (con botones opcionales) al chat y lo guarda como mensaje automático.
async function enviarAlChat(canal: string, hilo: any, texto: string, botones: Boton[], autoId: string, claveIdem: string) {
  const T = TABLAS[canal];
  const accountId = await cuentaDelHilo(canal, hilo);
  const conversationId = hilo.zernio_conversation_id ||
    (canal === "whatsapp" && hilo.telefono_e164 && !String(hilo.telefono_e164).startsWith("bsid:") ? hilo.telefono_e164 : null);
  if (!accountId || !conversationId) return "sin_cuenta_o_conversacion";
  const cuerpoEnvio: Record<string, unknown> = { accountId, message: texto };
  if (botones.length) {
    if (canal === "whatsapp") cuerpoEnvio.buttons = botones.map((b, i) => ({ type: "reply", title: b.titulo, payload: `bcau_${i}` }));
    else cuerpoEnvio.quickReplies = botones.map((b, i) => ({ title: b.titulo, payload: `bcau_${i}` }));
  }
  const r = await zernio(`/inbox/conversations/${encodeURIComponent(conversationId)}/messages`, {
    method: "POST", headers: { "Idempotency-Key": claveIdem }, body: JSON.stringify(cuerpoEnvio),
  });
  if (!r.ok) return `${r.status} ${JSON.stringify(r.body?.error || r.body?.message || r.body || {})}`;
  const mid = r.body?.data?.messageId ?? r.body?.messageId ?? null;
  const ahora = new Date().toISOString();
  const guardado = texto + (botones.length ? "\n\n" + botones.map((b) => "[" + b.titulo + "]").join(" ") : "");
  if (canal === "whatsapp") {
    await db.from("whatsapp_mensajes").insert({ hilo_id: hilo.id, direccion: "out", tipo_contenido: "text", cuerpo: guardado,
      wa_message_id: mid, estado: "enviado", es_automatico: true, enviado_por_tipo: "sistema" });
  } else if (canal === "instagram") {
    await db.from("instagram_mensajes").insert({ hilo_id: hilo.id, direccion: "out", tipo_contenido: "text", cuerpo: guardado,
      zernio_message_id: mid, estado: "enviado", es_automatico: true, enviado_por_tipo: "sistema", metadata: { automatizacion_id: autoId } });
  } else {
    await db.from("social_mensajes").insert({ hilo_id: hilo.id, direccion: "out", tipo_contenido: "text", cuerpo: guardado,
      zernio_message_id: mid, estado: "enviado", enviado_por_tipo: "sistema", metadata: { automatizacion_id: autoId, es_automatico: true } });
  }
  await db.from(T.hilo).update({ ultimo_mensaje_at: ahora, ultimo_mensaje_preview: texto.slice(0, 200), actualizado_en: ahora }).eq("id", hilo.id);
  return null;
}

// Etiquetas de WhatsApp (whatsapp_hilos.etiquetas = lista de ids). Solo agrega, nunca quita.
async function ponerEtiquetas(canal: string, hilo: any, ids: string[]) {
  const nuevas = (ids || []).map(String).filter(Boolean);
  if (canal !== "whatsapp" || !nuevas.length) return;
  const { data } = await db.from("whatsapp_hilos").select("etiquetas").eq("id", hilo.id).maybeSingle();
  const actuales: string[] = Array.isArray(data?.etiquetas) ? data!.etiquetas.map(String) : [];
  const union = Array.from(new Set([...actuales, ...nuevas]));
  if (union.length !== actuales.length) await db.from("whatsapp_hilos").update({ etiquetas: union }).eq("id", hilo.id);
}

// Anota lo respondido en el lead del chat (sin crear leads nuevos).
async function anotarEnLead(hilo: any, a: any, respuestas: any[]) {
  const { data: lead } = await db.from("leads").select("id, nombre, interes, notas").eq("hilo_id", hilo.id)
    .order("creado_en", { ascending: false }).limit(1).maybeSingle();
  if (!lead) return;
  const lineas = respuestas.map((r: any) => `${ETIQUETA_CAMPO[r.campo] || r.pregunta}: ${r.valor}`).join("; ");
  const nota = `[${new Date().toISOString().slice(0, 10)}] Formulario «${a.nombre}»: ${lineas}`;
  const patch: Record<string, unknown> = { notas: (lead.notas ? lead.notas + "\n" : "") + nota, actualizado_en: new Date().toISOString() };
  const nom = respuestas.find((r: any) => r.campo === "nombre")?.valor;
  if (nom && !lead.nombre) patch.nombre = nom;
  const eq = respuestas.find((r: any) => r.campo === "equipo")?.valor;
  if (eq && !lead.interes) patch.interes = eq;
  await db.from("leads").update(patch).eq("id", lead.id);
}

async function registrar(fila: Record<string, unknown>) {
  const ins = await db.from("social_auto_respuestas").insert(fila).select("id").maybeSingle();
  return ins.error || !ins.data ? null : ins.data.id as string;
}

async function procesarMensaje(canal: string, mensajeId: string, resumen: any) {
  const T = TABLAS[canal];
  if (!T || !mensajeId) return;
  const { data: msg } = await db.from(T.msg).select("id, hilo_id, direccion, cuerpo, creado_en").eq("id", mensajeId).maybeSingle();
  if (!msg || msg.direccion !== "in" || !msg.cuerpo) return;
  if (Date.now() - new Date(msg.creado_en).getTime() > 15 * 60e3) return; // solo mensajes recién llegados
  const { data: hilo } = await db.from(T.hilo).select("*").eq("id", msg.hilo_id).maybeSingle();
  if (!hilo) return;
  const { data: todas } = await db.from("social_automatizaciones").select("*").eq("activo", true).eq("tipo", "mensaje")
    .eq("plataforma", canal).order("creado_en", { ascending: true });
  const autos = (todas || []).filter((a: any) =>
    (!a.activado_en || new Date(a.activado_en).getTime() <= new Date(msg.creado_en).getTime()) &&
    (canal !== "whatsapp" || !a.linea_id || a.linea_id === hilo.linea_id));
  const texto = String(msg.cuerpo);
  const contacto = hilo.nombre_perfil || hilo.participant_name || hilo.participant_username || hilo.telefono_e164 || null;
  const nombreFrom = { name: hilo.nombre_perfil || hilo.participant_name || hilo.participant_username || "" };
  const tomado = !!hilo.asignado_id;

  // 0) ¿Hay preguntas en curso en este chat?
  const { data: flujo } = await db.from("social_auto_flujos").select("*").eq("canal", canal).eq("hilo_id", hilo.id)
    .eq("estado", "activo").maybeSingle();
  if (flujo) {
    const af = autos.find((x: any) => x.id === flujo.automatizacion_id);
    const vencido = Date.now() - new Date(flujo.actualizado_en).getTime() > FLUJO_VENCE_HORAS * 3600e3;
    if (!af || vencido || tomado) {
      // Automatización apagada, más de 24 h sin contestar, o un empleado tomó el chat: se cierra sin escribir.
      await db.from("social_auto_flujos").update({ estado: vencido ? "vencido" : "cancelado", actualizado_en: new Date().toISOString() }).eq("id", flujo.id);
      if (tomado || !af) return;
    } else {
      const preguntas = preguntasValidas(af.preguntas);
      const regId = await registrar({ automatizacion_id: af.id, canal, hilo_id: hilo.id, mensaje_id: msg.id, paso: flujo.paso + 1, contacto, texto: texto.slice(0, 500) });
      if (!regId) return;
      const ahora = new Date().toISOString();
      const fallo = async (e: string | null) => {
        await db.from("social_auto_respuestas").update(e ? { estado: "error", error: e.slice(0, 300) } : { estado: "ok" }).eq("id", regId);
        if (e) resumen.errores.push(`${af.id}:${e.slice(0, 80)}`); else resumen.enviados++;
      };
      if (PALABRAS_CANCELAR.includes(normalizar(texto))) {
        await db.from("social_auto_flujos").update({ estado: "cancelado", actualizado_en: ahora }).eq("id", flujo.id);
        return fallo(await enviarAlChat(canal, hilo, "Listo, lo dejamos aquí. En un momento te atiende una persona.", [], af.id, `autoflu-${regId}`));
      }
      const p = preguntas[flujo.paso];
      if (!p) { await db.from("social_auto_flujos").update({ estado: "completo", actualizado_en: ahora }).eq("id", flujo.id); return; }
      const valor = validarCampo(p.campo, texto);
      if (valor === null && flujo.intentos < 1) {
        await db.from("social_auto_flujos").update({ intentos: flujo.intentos + 1, actualizado_en: ahora }).eq("id", flujo.id);
        return fallo(await enviarAlChat(canal, hilo, `Disculpa, ${AYUDA_CAMPO[p.campo] || "no entendí tu respuesta"}. ${p.pregunta}`, [], af.id, `autoflu-${regId}`));
      }
      const respuestas = [...(Array.isArray(flujo.respuestas) ? flujo.respuestas : []),
        { pregunta: p.pregunta, campo: p.campo, valor: valor ?? texto.trim().slice(0, 500), valido: valor !== null }];
      const sig = flujo.paso + 1;
      if (sig < preguntas.length) {
        await db.from("social_auto_flujos").update({ paso: sig, intentos: 0, respuestas, actualizado_en: ahora }).eq("id", flujo.id);
        return fallo(await enviarAlChat(canal, hilo, preguntas[sig].pregunta, [], af.id, `autoflu-${regId}`));
      }
      await db.from("social_auto_flujos").update({ paso: sig, intentos: 0, respuestas, estado: "completo", actualizado_en: ahora }).eq("id", flujo.id);
      await ponerEtiquetas(canal, hilo, af.etiquetas_auto);
      await anotarEnLead(hilo, af, respuestas);
      const fin = String(af.mensaje_final || "").trim();
      return fallo(fin ? await enviarAlChat(canal, hilo, personalizar(fin, nombreFrom), [], af.id, `autoflu-${regId}`) : null);
    }
  }
  if (!autos.length) return;

  // 1) ¿tocó un botón (con respuesta o etiqueta) de una respuesta que este chat recibió en las últimas 24 h?
  let elegido: { a: any; texto: string; boton: string | null; botones: Boton[]; etiquetas: string[]; preguntas: Pregunta[] } | null = null;
  for (const a of autos) {
    const b = botonesValidos(a.botones).find((x) => (x.respuesta || x.etiqueta) && normalizar(x.titulo) === normalizar(texto));
    if (b && await yaRespondio(a.id, hilo.id, 24)) {
      elegido = { a, texto: b.respuesta, boton: b.titulo, botones: [], etiquetas: b.etiqueta ? [b.etiqueta] : [], preguntas: [] };
      break;
    }
  }
  // 2) palabra clave (una vez por chat cada enfriamiento_horas)
  if (!elegido) {
    for (const a of autos) {
      if (!coincide(texto, a.palabras, a.coincidencia)) continue;
      if (await yaRespondio(a.id, hilo.id, a.enfriamiento_horas || 24)) continue;
      const preguntas = preguntasValidas(a.preguntas);
      elegido = { a, texto: a.mensaje_privado, boton: null, botones: botonesValidos(a.botones),
        etiquetas: preguntas.length ? [] : (Array.isArray(a.etiquetas_auto) ? a.etiquetas_auto : []), preguntas };
      break;
    }
  }
  if (!elegido) return;
  const regId = await registrar({ automatizacion_id: elegido.a.id, canal, hilo_id: hilo.id, mensaje_id: msg.id, boton: elegido.boton, contacto, texto: texto.slice(0, 500) });
  if (!regId) return; // ese mensaje ya se atendió
  // Un chat tomado por un empleado prevalece sobre cualquier automatismo.
  if (tomado) {
    await db.from("social_auto_respuestas").update({ estado: "omitido_tomado" }).eq("id", regId);
    resumen.omitidos++;
    return;
  }
  let err: string | null = null;
  if (elegido.texto) err = await enviarAlChat(canal, hilo, personalizar(elegido.texto, nombreFrom), elegido.botones, elegido.a.id, `autores-${regId}`);
  if (!err && elegido.preguntas.length) {
    const ins = await db.from("social_auto_flujos").insert({ automatizacion_id: elegido.a.id, canal, hilo_id: hilo.id, contacto })
      .select("id").maybeSingle();
    if (ins.data) err = await enviarAlChat(canal, hilo, elegido.preguntas[0].pregunta, [], elegido.a.id, `autoflu0-${regId}`);
  }
  if (err) {
    await db.from("social_auto_respuestas").update({ estado: "error", error: err.slice(0, 300) }).eq("id", regId);
    resumen.errores.push(`${elegido.a.id}:${err.slice(0, 80)}`);
    return;
  }
  await ponerEtiquetas(canal, hilo, elegido.etiquetas);
  await db.from("social_auto_respuestas").update({ estado: "ok" }).eq("id", regId);
  if (!elegido.boton) await db.rpc("social_automatizacion_sumar", { p_id: elegido.a.id });
  resumen.enviados++;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return out({ ok: false, error: "method_not_allowed" }, 405);
  if (!ZERNIO_KEY) return out({ ok: false, error: "zernio_key_not_configured" }, 503);
  let body: any = {};
  try { body = await req.json(); } catch { body = {}; }

  // Autorización: token del cron o administrador.
  const token = req.headers.get("x-auto-token") || "";
  let autorizado = false;
  if (token) {
    const { data } = await db.rpc("social_auto_token_valido", { p_token: token });
    autorizado = data === true;
  } else {
    const auth = req.headers.get("Authorization") || "";
    if (auth.startsWith("Bearer ")) {
      const userDb = createClient(SB_URL, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
      const { data } = await userDb.rpc("app_is_admin");
      autorizado = data === true;
    }
  }
  if (!autorizado) return out({ ok: false, error: "sin_permiso" }, 403);

  if (body.accion === "mensaje") {
    if (!token) return out({ ok: false, error: "solo_motor" }, 403);
    const r = { ok: true, enviados: 0, omitidos: 0, errores: [] as string[] };
    try { await procesarMensaje(String(body.canal || ""), String(body.mensaje_id || ""), r); }
    catch (e) { r.errores.push(e instanceof Error ? e.message : String(e)); }
    return out(r);
  }

  const simular = body.accion === "simular";
  if (simular && !body.id) return out({ ok: false, error: "id_requerido" }, 400);
  let q = db.from("social_automatizaciones").select("*").eq("tipo", "comentario");
  if (!simular) q = q.eq("activo", true);
  if (body.id) q = q.eq("id", String(body.id));
  const { data: autos, error } = await q;
  if (error) return out({ ok: false, error: "db_error" }, 500);

  const resumen = { ok: true, revisadas: 0, enviados: 0, omitidos: 0, errores: [] as string[], simulados: [] as any[], publicaciones: 0, comentarios: 0, campos: null as any, ultimo: "" };
  for (const a of autos || []) {
    resumen.revisadas++;
    let err: string | null = null;
    try { await procesar(a, resumen, simular); } catch (e) { err = e instanceof Error ? e.message : String(e); resumen.errores.push(`${a.id}:${err}`); }
    if (!simular) await db.from("social_automatizaciones").update({ ultima_revision: new Date().toISOString(), ultimo_error: err }).eq("id", a.id);
  }
  return out(resumen);
});
