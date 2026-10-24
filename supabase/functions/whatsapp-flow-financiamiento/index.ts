import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
// 24-oct-2026 · Formulario nativo de WhatsApp (Meta Flows vía Zernio) para la SOLICITUD DE FINANCIAMIENTO.
// Dueño: «primero el formulario… el cliente lo llene cuando el empleado se lo envíe ya con las informaciones».
// El empleado fija el equipo y el precio; el cliente llena cédula, nombre, teléfono y dirección dentro de WhatsApp.
// Regla de la IA (base de conocimiento): lo aprueba el Banco Ademi; NUNCA prometer aprobación, inicial ni cuotas.
// Por eso el formulario muestra solo equipo y precio.
//
// Acciones (POST, JSON):
//  { accion:'publicar', linea_id?, publicar?:boolean }  → admin. Crea el flow en cada línea (o en una), sube el JSON y,
//                                                          si publicar=true, lo publica (irreversible). Guarda en whatsapp_flows.
//  { accion:'enviar', hilo_id, equipo, precio, prueba? } → manda el formulario al cliente del hilo (ventana de 24 h).
//  { accion:'sincronizar', linea_id? }                   → lee en Zernio las respuestas de los flows y registra las que falten
//                                                          (red de seguridad por si el webhook no reconoció la respuesta).
//  { accion:'estado' }                                   → lista los flows guardados por línea.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ZERNIO_API_KEY = (Deno.env.get("ZERNIO_API_KEY") ?? "").trim();
const ZERNIO = "https://zernio.com/api/v1";
const TIMEOUT = 20000;
const NOMBRE_FLOW = "bayolcell_financiamiento";
// Página web del formulario (GitHub Pages de bayolcell.com). El enlace lleva una llave de un solo uso.
const WEB_URL = Deno.env.get("FIN_WEB_URL") || "https://bayolcell.com/solicitud"; // GitHub Pages sirve solicitud.html sin la extensión
// Llave corta (10 letras y números) para que el enlace se vea limpio; sigue siendo de un solo uso y vence a los 7 días.
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
const llaveCorta = (n = 10) => [...crypto.getRandomValues(new Uint8Array(n))].map((x) => ALFABETO[x % ALFABETO.length]).join("");
const nombrePropio = (s: string) => String(s || "").trim().toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (m) => m.toUpperCase());
const WEB_VIGENCIA_MS = 7 * 24 * 60 * 60 * 1000;
const PLAZOS_OK = ["6", "12", "18", "24"];
const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...cors, "Content-Type": "application/json" } });

// ---------- Provincias (id sin espacios para el Dropdown; nombre para mostrar) ----------
export const PROVINCIAS: [string, string][] = [
  ["Azua", "Azua"], ["Bahoruco", "Bahoruco"], ["Barahona", "Barahona"], ["Dajabon", "Dajabón"], ["Distrito_Nacional", "Distrito Nacional"],
  ["Duarte", "Duarte"], ["El_Seibo", "El Seibo"], ["Elias_Pina", "Elías Piña"], ["Espaillat", "Espaillat"], ["Hato_Mayor", "Hato Mayor"],
  ["Hermanas_Mirabal", "Hermanas Mirabal"], ["Independencia", "Independencia"], ["La_Altagracia", "La Altagracia"], ["La_Romana", "La Romana"],
  ["La_Vega", "La Vega"], ["Maria_Trinidad_Sanchez", "María Trinidad Sánchez"], ["Monsenor_Nouel", "Monseñor Nouel"], ["Monte_Cristi", "Monte Cristi"],
  ["Monte_Plata", "Monte Plata"], ["Pedernales", "Pedernales"], ["Peravia", "Peravia"], ["Puerto_Plata", "Puerto Plata"], ["Samana", "Samaná"],
  ["San_Cristobal", "San Cristóbal"], ["San_Jose_de_Ocoa", "San José de Ocoa"], ["San_Juan", "San Juan"], ["San_Pedro_de_Macoris", "San Pedro de Macorís"],
  ["Sanchez_Ramirez", "Sánchez Ramírez"], ["Santiago", "Santiago"], ["Santiago_Rodriguez", "Santiago Rodríguez"], ["Santo_Domingo", "Santo Domingo"], ["Valverde", "Valverde"],
];
const provinciaNombre = (id: string) => (PROVINCIAS.find((p) => p[0] === id) || [id, id])[1];

// ---------- Flow JSON (Meta, versión 6.0) ----------
// Nota (validación de Meta, 24-oct): un TextInput "number" viaja como número y choca con el esquema string de la siguiente
// pantalla; la cédula va como texto de 11 caracteres y el servidor le quita todo lo que no sea dígito.
const CAMPOS = ["equipo", "precio", "referencia", "cedula", "nombres", "telefono", "plazo", "provincia", "municipio", "sector", "calle", "casa"];
// 24-oct-2026 (dueño: «sí a las tres»): el cliente elige el plazo que le gustaría; el banco define el final.
const PLAZOS = [["6", "6 meses"], ["12", "12 meses"], ["18", "18 meses"], ["24", "24 meses"]];
const dataSchema = (claves: string[]) => Object.fromEntries(claves.map((k) => [k, { type: "string", "__example__": k === "precio" ? "RD$ 38,500.00" : "Ejemplo" }]));
const payloadDe = (deData: string[], deForm: string[]) => ({
  ...Object.fromEntries(deData.map((k) => [k, "${data." + k + "}"])),
  ...Object.fromEntries(deForm.map((k) => [k, "${form." + k + "}"])),
});
export const FLOW_JSON = {
  version: "6.0",
  screens: [
    {
      id: "DATOS",
      title: "Solicitud de financiamiento",
      data: dataSchema(["equipo", "precio", "referencia"]),
      layout: {
        type: "SingleColumnLayout",
        children: [
          { type: "TextHeading", text: "Lo que desea financiar" },
          { type: "TextBody", text: "${data.equipo}" },
          { type: "TextBody", text: "Precio: ${data.precio}" },
          { type: "TextCaption", text: "La aprobación, la inicial y las cuotas las define el banco." },
          { type: "TextSubheading", text: "Sus datos" },
          { type: "TextInput", name: "cedula", label: "Cédula", "input-type": "text", required: true, "min-chars": 11, "max-chars": 11, "helper-text": "11 dígitos, sin guiones" },
          { type: "TextInput", name: "nombres", label: "Nombres y apellidos", "input-type": "text", required: true, "max-chars": 80 },
          { type: "TextInput", name: "telefono", label: "Teléfono o celular", "input-type": "phone", required: true, "max-chars": 20 },
          { type: "Dropdown", name: "plazo", label: "Plazo que le gustaría", required: true, "data-source": PLAZOS.map(([id, title]) => ({ id, title })) },
          { type: "TextCaption", text: "El plazo final lo define el banco." },
          { type: "Footer", label: "Siguiente", "on-click-action": { name: "navigate", next: { type: "screen", name: "DIRECCION" }, payload: payloadDe(["equipo", "precio", "referencia"], ["cedula", "nombres", "telefono", "plazo"]) } },
        ],
      },
    },
    {
      id: "DIRECCION",
      title: "Dirección actual",
      data: dataSchema(["equipo", "precio", "referencia", "cedula", "nombres", "telefono", "plazo"]),
      layout: {
        type: "SingleColumnLayout",
        children: [
          { type: "TextHeading", text: "¿Dónde vive actualmente?" },
          { type: "Dropdown", name: "provincia", label: "Provincia", required: true, "data-source": PROVINCIAS.map(([id, title]) => ({ id, title })) },
          { type: "TextInput", name: "municipio", label: "Ciudad o municipio", "input-type": "text", required: true, "max-chars": 60 },
          { type: "TextInput", name: "sector", label: "Sector", "input-type": "text", required: true, "max-chars": 60 },
          { type: "TextInput", name: "calle", label: "Calle", "input-type": "text", required: true, "max-chars": 80 },
          { type: "TextInput", name: "casa", label: "Número de casa", "input-type": "text", required: true, "max-chars": 20 },
          { type: "Footer", label: "Siguiente", "on-click-action": { name: "navigate", next: { type: "screen", name: "CONFIRMAR" }, payload: payloadDe(["equipo", "precio", "referencia", "cedula", "nombres", "telefono", "plazo"], ["provincia", "municipio", "sector", "calle", "casa"]) } },
        ],
      },
    },
    {
      id: "CONFIRMAR",
      title: "Confirmar solicitud",
      terminal: true,
      success: true,
      data: dataSchema(CAMPOS),
      layout: {
        type: "SingleColumnLayout",
        children: [
          { type: "TextHeading", text: "Revise antes de enviar" },
          { type: "TextBody", text: "Equipo: ${data.equipo}" },
          { type: "TextBody", text: "Precio: ${data.precio}" },
          { type: "TextBody", text: "Cédula: ${data.cedula}" },
          { type: "TextBody", text: "Nombre: ${data.nombres}" },
          { type: "TextBody", text: "Teléfono: ${data.telefono}" },
          { type: "TextBody", text: "Plazo deseado: ${data.plazo} meses" },
          { type: "TextBody", text: "Dirección: ${data.calle} No. ${data.casa}, ${data.sector}, ${data.municipio}" },
          { type: "TextCaption", text: "Al enviar, BAYOL CELL usará estos datos solo para su solicitud de financiamiento." },
          { type: "Footer", label: "Enviar solicitud", "on-click-action": { name: "complete", payload: payloadDe(CAMPOS, []) } },
        ],
      },
    },
  ],
};

// ---------- Identidad y permisos (igual que whatsapp-enviar) ----------
async function identidadVerificada(req: Request): Promise<{ tipo: string | null; refId: string | null }> {
  const nada = { tipo: null, refId: null };
  try {
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
    if (!token) return nada;
    const { data: sesion, error } = await db.auth.getUser(token);
    if (error || !sesion?.user?.id) return nada;
    const { data: v } = await db.from("auth_actor_bindings").select("actor_type, actor_ref_id").eq("auth_user_id", sesion.user.id).eq("activo", true).maybeSingle();
    if (!v?.actor_type || !v?.actor_ref_id) return nada;
    return { tipo: v.actor_type, refId: v.actor_ref_id };
  } catch { return nada; }
}
async function datosTecnico(tipo: string | null, refId: string | null) {
  if (tipo !== "tecnico" || !refId) return null;
  const { data } = await db.from("tecnicos").select("nombre, sucursal_id, tipo_empleado, rol, activo").eq("id", refId).maybeSingle();
  return data || null;
}
async function esAdmin(tipo: string | null, refId: string | null) {
  if (tipo === "usuario") return true;
  const t = await datosTecnico(tipo, refId);
  return !!t && t.activo !== false && (t.tipo_empleado === "admin" || t.rol === "admin");
}
async function tieneAccesoALinea(tipo: string | null, refId: string | null, sucursalIdLinea: string) {
  if (tipo === "usuario") return true;
  const t = await datosTecnico(tipo, refId);
  if (!t || t.activo === false) return false;
  if (t.tipo_empleado === "admin" || t.rol === "admin") return true;
  return t.sucursal_id === sucursalIdLinea;
}
async function tienePermiso(req: Request, permiso: string): Promise<boolean> {
  // app_actor_tiene_permiso con el JWT del que llama (misma fuente que la pantalla)
  try {
    const auth = req.headers.get("Authorization") || "";
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/app_actor_tiene_permiso`, {
      method: "POST", headers: { "Content-Type": "application/json", apikey: Deno.env.get("SUPABASE_ANON_KEY") || "", Authorization: auth },
      body: JSON.stringify({ p_permiso: permiso }), signal: AbortSignal.timeout(8000),
    });
    return r.ok && (await r.json()) === true;
  } catch { return false; }
}

// ---------- Zernio ----------
async function zernio(metodo: string, ruta: string, body?: unknown) {
  const r = await fetch(`${ZERNIO}${ruta}`, {
    method: metodo,
    headers: { Authorization: `Bearer ${ZERNIO_API_KEY}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT),
  });
  const data = await r.json().catch(() => null);
  return { ok: r.ok, status: r.status, data };
}
const plata = (n: number) => "RD$ " + Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Texto de recibido cuando la solicitud llega por la página web: suena al empleado, con número de solicitud y las fotos que faltan.
export function textoRecibidoWeb(nombre: string, numero: number | null, equipo: string, empleado: string, sucursal: string) {
  const n = String(nombre || "").trim(); const quien = n && !/^[+\d\s()-]+$/.test(n) ? `, ${nombrePropio(n.split(/\s+/)[0])}` : "";
  const num = numero ? ` (No. ${numero})` : "";
  // Dueño (24-oct): sin pedir fotos; primero evalúa el banco.
  // Texto del dueño (24-oct).
  return `Listo${quien}, ya me llegó su solicitud del ${equipo}${num}. ✅\n\nSe la paso al banco para que la evalúe. Esté siempre pendiente por si lo llaman del banco, por si necesitan alguna información adicional; en cuanto me digan algo, le aviso por aquí.\n\n${empleado} · Bayol Cell ${sucursal}`.trim();
}

// ---------- Normalizar la respuesta del cliente ----------
export function normalizarDatos(raw: any) {
  const d = raw && typeof raw === "object" ? raw : {};
  const s = (k: string) => String(d[k] ?? "").trim();
  return {
    equipo: s("equipo"), precio: s("precio"), referencia: s("referencia"),
    cedula: s("cedula").replace(/\D/g, ""), nombres: s("nombres"), telefono: s("telefono"), plazo: s("plazo").replace(/\D/g, ""),
    provincia: provinciaNombre(s("provincia")), municipio: s("municipio"), sector: s("sector"), calle: s("calle"), casa: s("casa"),
  };
}
export function textoRespuesta(d: ReturnType<typeof normalizarDatos>) {
  return [
    "📋 SOLICITUD DE FINANCIAMIENTO (formulario)",
    `Equipo: ${d.equipo}`, `Precio: ${d.precio}`,
    `Cédula: ${d.cedula}`, `Nombre: ${d.nombres}`, `Teléfono: ${d.telefono}`, d.plazo ? `Plazo deseado: ${d.plazo} meses` : "",
    `Dirección: ${d.calle} No. ${d.casa}, ${d.sector}, ${d.municipio}, ${d.provincia}`,
  ].filter(Boolean).join("\n");
}
// 24-oct-2026 (dueño: «sí» a pedir las fotos): texto que se manda solo, una vez, cuando llega la respuesta del formulario.
export function textoPedirFotos(nombre: string) {
  const n = String(nombre || "").trim(); const saludo = n && !/^[+\d\s()-]+$/.test(n) ? `Gracias, ${n.split(/\s+/)[0]}.` : "Gracias.";
  // Dueño (24-oct): NO pedir cédula ni documentos aquí; el banco evalúa primero la solicitud y los documentos se piden después.
  return `${saludo} Ya recibimos su solicitud de financiamiento y la pasamos al banco para que la evalúe. Esté siempre pendiente por si lo llaman del banco, por si necesitan alguna información adicional; en cuanto nos digan algo, le avisamos por aquí.\n\nBAYOL CELL`;
}
async function pedirFotos(accountId: string, conversationId: string | null, hiloId: string | null, solicitudId: string | null, nombre: string, textoPropio?: string) {
  if (!conversationId || !hiloId || !solicitudId) return false;
  const { data: ya } = await db.from("fin_solicitudes_whatsapp").select("fotos_pedidas_en").eq("id", solicitudId).maybeSingle();
  if (ya?.fotos_pedidas_en) return false;
  const texto = textoPropio || textoPedirFotos(nombre);
  const r = await zernio("POST", `/inbox/conversations/${encodeURIComponent(conversationId)}/messages`, { accountId, message: texto });
  if (!r.ok || !r.data?.success) { console.error("pedir fotos: Zernio no envió", r.status, r.data?.error || r.data?.message); return false; }
  const ahora = new Date().toISOString();
  await db.from("whatsapp_mensajes").insert({ hilo_id: hiloId, direccion: "out", tipo_contenido: "text", cuerpo: texto, wa_message_id: r.data?.data?.messageId || r.data?.messageId || null, estado: "enviado", es_automatico: true, creado_en: ahora, meta: { flow: { auto: "pedir_fotos" } } });
  await db.from("whatsapp_hilos").update({ ultimo_mensaje_at: ahora, ultimo_mensaje_preview: "📎 Se pidieron la cédula y el comprobante" }).eq("id", hiloId);
  await db.from("fin_solicitudes_whatsapp").update({ fotos_pedidas_en: ahora }).eq("id", solicitudId);
  return true;
}

// Registra una respuesta (desde el webhook o desde la sincronización). Idempotente por flow_token / wa_message_id.
async function registrarRespuesta(p: { linea_id: string; telefono: string; wa_message_id: string | null; flow_token: string | null; raw: any; recibido_en: string; hilo_id?: string | null; mensaje_in_id?: string | null }) {
  const datos = normalizarDatos(p.raw);
  let fila: any = null;
  if (p.flow_token) { const { data } = await db.from("fin_solicitudes_whatsapp").select("id, estado, hilo_id, referencia").eq("flow_token", p.flow_token).maybeSingle(); fila = data; }
  let hiloId = p.hilo_id || fila?.hilo_id || null;
  if (!hiloId) {
    const { data: h } = await db.from("whatsapp_hilos").select("id").eq("linea_id", p.linea_id).eq("telefono_e164", p.telefono).maybeSingle();
    hiloId = h?.id || null;
  }
  // Mensaje entrante (si el webhook no lo guardó)
  let mensajeInId = p.mensaje_in_id || null;
  if (!mensajeInId && hiloId && p.wa_message_id) {
    const { data: ex } = await db.from("whatsapp_mensajes").select("id").eq("wa_message_id", p.wa_message_id).maybeSingle();
    if (ex?.id) mensajeInId = ex.id;
    else {
      const { data: nuevo } = await db.from("whatsapp_mensajes").insert({
        hilo_id: hiloId, direccion: "in", tipo_contenido: "flow_respuesta", cuerpo: textoRespuesta(datos), wa_message_id: p.wa_message_id,
        meta: { flow: { nombre: NOMBRE_FLOW, flow_token: p.flow_token, datos } }, estado: "recibido", es_automatico: false, creado_en: p.recibido_en,
      }).select("id").maybeSingle();
      mensajeInId = nuevo?.id || null;
      await db.from("whatsapp_hilos").update({ ultimo_mensaje_at: p.recibido_en, ultimo_inbound_at: p.recibido_en, ultimo_mensaje_preview: "📋 Solicitud de financiamiento recibida" }).eq("id", hiloId);
    }
  }
  const { data: hiloDatos } = hiloId ? await db.from("whatsapp_hilos").select("zernio_conversation_id, nombre_perfil").eq("id", hiloId).maybeSingle() : { data: null as any };
  const { data: lineaDatos } = await db.from("whatsapp_lineas").select("zernio_account_id").eq("id", p.linea_id).maybeSingle();
  if (fila) {
    if (fila.estado === "enviado") {
      await db.from("fin_solicitudes_whatsapp").update({ estado: "respondido", datos, respuesta_wa_message_id: p.wa_message_id, mensaje_in_id: mensajeInId, respondido_en: p.recibido_en }).eq("id", fila.id);
    }
    if (lineaDatos?.zernio_account_id) await pedirFotos(lineaDatos.zernio_account_id, hiloDatos?.zernio_conversation_id || null, hiloId, fila.id, hiloDatos?.nombre_perfil || "");
    return { id: fila.id, nueva: false };
  }
  // Sin fila previa (token desconocido): se crea una para no perder la respuesta.
  const { data: creada } = await db.from("fin_solicitudes_whatsapp").insert({
    hilo_id: hiloId, linea_id: p.linea_id, telefono: p.telefono, flow_token: p.flow_token, estado: "respondido", datos,
    equipo: datos.equipo || null, referencia: datos.referencia || null, respuesta_wa_message_id: p.wa_message_id, mensaje_in_id: mensajeInId, respondido_en: p.recibido_en,
  }).select("id").maybeSingle();
  if (creada?.id && lineaDatos?.zernio_account_id) await pedirFotos(lineaDatos.zernio_account_id, hiloDatos?.zernio_conversation_id || null, hiloId, creada.id, hiloDatos?.nombre_perfil || "");
  return { id: creada?.id || null, nueva: true };
}

// ---------- Acciones ----------
async function accionPublicar(body: any, req: Request, quien: { tipo: string | null; refId: string | null }) {
  if (!(await esAdmin(quien.tipo, quien.refId))) return json({ ok: false, error: "Solo el administrador puede crear o publicar el formulario." }, 403);
  let q = db.from("whatsapp_lineas").select("id, nombre, whatsapp_numero, zernio_account_id, sucursal_id").eq("activo", true);
  if (body.linea_id) q = q.eq("id", body.linea_id);
  const { data: lineas } = await q;
  const res: any[] = [];
  for (const l of lineas || []) {
    if (!l.zernio_account_id) { res.push({ linea: l.nombre, error: "sin cuenta de Zernio" }); continue; }
    try {
      // ¿Ya hay uno publicado en esta línea? No se duplica; con body.nueva_version=true se clona como versión nueva.
      const { data: existente } = await db.from("whatsapp_flows").select("id, flow_id, estado, version").eq("linea_id", l.id).eq("nombre", NOMBRE_FLOW).order("version", { ascending: false }).limit(1).maybeSingle();
      let flowId: string; let version = 1;
      if (existente && existente.estado === "DRAFT" && !body.nueva_version) {
        flowId = existente.flow_id; version = existente.version;
      } else if (existente && existente.estado === "PUBLISHED" && !body.nueva_version) {
        res.push({ linea: l.nombre, flow_id: existente.flow_id, estado: "PUBLISHED", nota: "ya publicado; use nueva_version:true para una versión nueva" });
        continue;
      } else {
        const crear = await zernio("POST", "/whatsapp/flows", { accountId: l.zernio_account_id, name: NOMBRE_FLOW, categories: ["LEAD_GENERATION"], ...(existente ? { cloneFlowId: existente.flow_id, asVersion: true } : {}) });
        if (!crear.ok || !crear.data?.flow?.id) { res.push({ linea: l.nombre, paso: "crear", status: crear.status, error: crear.data?.error || crear.data?.message || crear.data }); continue; }
        flowId = crear.data.flow.id; version = Number(crear.data.flow.version) || (existente ? existente.version + 1 : 1);
        await db.from("whatsapp_flows").insert({ linea_id: l.id, nombre: NOMBRE_FLOW, flow_id: flowId, version, estado: "DRAFT", flow_json: FLOW_JSON });
      }
      const subir = await zernio("PUT", `/whatsapp/flows/${encodeURIComponent(flowId)}/json`, { accountId: l.zernio_account_id, flow_json: FLOW_JSON });
      const errores = subir.data?.validation_errors || [];
      await db.from("whatsapp_flows").update({ flow_json: FLOW_JSON, validation_errors: errores.length ? errores : null }).eq("linea_id", l.id).eq("flow_id", flowId);
      if (!subir.ok || errores.length) { res.push({ linea: l.nombre, flow_id: flowId, paso: "json", status: subir.status, errores, error: subir.data?.error || null }); continue; }
      let estado = "DRAFT";
      if (body.publicar === true) {
        const pub = await zernio("POST", `/whatsapp/flows/${encodeURIComponent(flowId)}/publish`, { accountId: l.zernio_account_id });
        if (pub.ok && pub.data?.success) { estado = "PUBLISHED"; await db.from("whatsapp_flows").update({ estado, publicado_en: new Date().toISOString() }).eq("linea_id", l.id).eq("flow_id", flowId); }
        else { res.push({ linea: l.nombre, flow_id: flowId, paso: "publicar", status: pub.status, error: pub.data?.error || pub.data?.message || pub.data }); continue; }
      }
      let preview: string | null = null;
      try { const pv = await zernio("GET", `/whatsapp/flows/${encodeURIComponent(flowId)}/preview?accountId=${encodeURIComponent(l.zernio_account_id)}`); preview = pv.data?.preview_url || null; } catch { /* opcional */ }
      res.push({ linea: l.nombre, numero: l.whatsapp_numero, flow_id: flowId, version, estado, preview });
    } catch (e) { res.push({ linea: l.nombre, error: String((e as any)?.message || e).slice(0, 200) }); }
  }
  return json({ ok: true, accion: "publicar", resultados: res });
}

async function accionEnviar(body: any, req: Request, quien: { tipo: string | null; refId: string | null }) {
  const hiloId = String(body.hilo_id || "");
  const equipo = String(body.equipo || "").trim();
  const precioNum = Number(body.precio);
  if (!hiloId) return json({ ok: false, error: "Falta el chat (hilo_id)." }, 400);
  if (!equipo) return json({ ok: false, error: "Escriba el equipo o artículo que el cliente quiere financiar." }, 400);
  if (!(precioNum > 0)) return json({ ok: false, error: "El precio debe ser mayor que cero." }, 400);
  if (!quien.tipo) return json({ ok: false, error: "Sesión no válida." }, 401);
  const admin = await esAdmin(quien.tipo, quien.refId);
  if (!admin && !(await tienePermiso(req, "financiamientos_crear"))) return json({ ok: false, error: "No tiene permiso para enviar solicitudes de financiamiento (permiso «Crear financiamientos»)." }, 403);

  const modo = body.modo === "flow" ? "flow" : "web"; // dueño (24-oct): la página web es el camino principal; el Flow nativo queda de respaldo
  const { data: hilo } = await db.from("whatsapp_hilos").select("id, linea_id, sucursal_id, telefono_e164, ultimo_inbound_at, asignado_tipo, asignado_id, nombre_perfil, zernio_conversation_id").eq("id", hiloId).maybeSingle();
  if (!hilo) return json({ ok: false, error: "Chat no encontrado." }, 404);
  const { data: linea } = await db.from("whatsapp_lineas").select("id, nombre, zernio_account_id, sucursal_id").eq("id", hilo.linea_id).maybeSingle();
  if (!linea?.zernio_account_id) return json({ ok: false, error: "La línea de este chat no está conectada a Zernio." }, 400);
  const esSuAsignado = hilo.asignado_tipo === quien.tipo && hilo.asignado_id === quien.refId;
  if (!esSuAsignado && !(await tieneAccesoALinea(quien.tipo, quien.refId, linea.sucursal_id))) return json({ ok: false, error: "No tiene acceso a esta línea." }, 403);
  if (!/^\+?\d{8,15}$/.test(String(hilo.telefono_e164 || ""))) return json({ ok: false, error: "Este chat no tiene un número de teléfono válido (puede venir de un anuncio)." }, 400);

  // Ventana de 24 h: el formulario va como mensaje interactivo; fuera de la ventana haría falta una plantilla con botón (fase 2).
  const ultimoIn = hilo.ultimo_inbound_at ? new Date(hilo.ultimo_inbound_at).getTime() : 0;
  if (!ultimoIn || Date.now() - ultimoIn > 24 * 60 * 60 * 1000) {
    return json({ ok: false, error: "ventana_cerrada", mensaje: "WhatsApp solo deja mandar el formulario si el cliente escribió en las últimas 24 horas. Pídale que escriba y vuelva a intentarlo." }, 409);
  }

  const prueba = body.prueba === true;
  if (modo === "web") return await enviarWeb({ body, quien, hilo, linea, equipo, precioNum, prueba });
  const { data: flows } = await db.from("whatsapp_flows").select("flow_id, estado, version").eq("linea_id", linea.id).eq("nombre", NOMBRE_FLOW).order("version", { ascending: false });
  const flow = (flows || []).find((f: any) => f.estado === "PUBLISHED") || (prueba ? (flows || []).find((f: any) => f.estado === "DRAFT") : null);
  if (!flow) return json({ ok: false, error: prueba ? "Esta línea no tiene el formulario creado todavía." : "El formulario de esta línea aún no está publicado. Pida al administrador publicarlo (o use el modo de prueba)." }, 400);

  const tec = await datosTecnico(quien.tipo, quien.refId);
  const empleado = String(tec?.nombre || body.empleado_nombre || (quien.tipo === "usuario" ? "Administración" : "Empleado")).trim();
  const { data: suc } = await db.from("sucursales").select("nombre").eq("id", linea.sucursal_id).maybeSingle();
  const sucursal = String(suc?.nombre || linea.nombre || "").trim();
  const precioTxt = plata(precioNum);
  const referencia = `${sucursal} · ${empleado} · ${equipo} ${precioTxt}`;
  const flowToken = `${flow.flow_id}:${crypto.randomUUID()}`;
  const nombreCliente = String(hilo.nombre_perfil || "").trim();
  const saludo = nombreCliente && !/^[+\d\s()-]+$/.test(nombreCliente) ? `Hola ${nombreCliente.split(/\s+/)[0]}. ` : "Hola. ";
  const texto = `${saludo}Para iniciar su solicitud de financiamiento de ${equipo} (${precioTxt}), toque el botón y complete sus datos. Le toma menos de dos minutos.`;

  const envio = await zernio("POST", "/whatsapp/flows/send", {
    accountId: linea.zernio_account_id,
    to: hilo.telefono_e164,
    flow_id: flow.flow_id,
    flow_cta: "Completar solicitud",
    flow_action: "navigate",
    flow_action_payload: { screen: "DATOS", data: { equipo, precio: precioTxt, referencia } },
    flow_token: flowToken,
    body: texto,
    footer: "BAYOL CELL",
    ...(flow.estado !== "PUBLISHED" ? { draft: true } : {}),
  });
  if (!envio.ok || !envio.data?.success) {
    return json({ ok: false, error: "Zernio no pudo enviar el formulario: " + String(envio.data?.error || envio.data?.message || envio.status), detalle: envio.data }, 502);
  }
  const ahora = new Date().toISOString();
  const cuerpo = `📋 Formulario de solicitud de financiamiento enviado\nEquipo: ${equipo}\nPrecio: ${precioTxt}`;
  const { data: msg } = await db.from("whatsapp_mensajes").insert({
    hilo_id: hilo.id, direccion: "out", tipo_contenido: "flow", cuerpo, wa_message_id: envio.data.messageId || null, estado: "enviado", es_automatico: false,
    enviado_por_tipo: quien.tipo, enviado_por_id: quien.refId, creado_en: ahora,
    meta: { flow: { nombre: NOMBRE_FLOW, flow_id: flow.flow_id, flow_token: flowToken, equipo, precio: precioNum, referencia, borrador: flow.estado !== "PUBLISHED" } },
  }).select("id").maybeSingle();
  await db.from("whatsapp_hilos").update({ ultimo_mensaje_at: ahora, ultima_respuesta_humana_at: ahora, ultimo_mensaje_preview: "📋 Formulario de financiamiento enviado" }).eq("id", hilo.id);
  const { data: sol } = await db.from("fin_solicitudes_whatsapp").insert({
    hilo_id: hilo.id, linea_id: linea.id, sucursal_id: linea.sucursal_id, sucursal_nombre: sucursal, telefono: hilo.telefono_e164, mensaje_out_id: msg?.id || null,
    flow_id: flow.flow_id, flow_token: flowToken, enviado_por_tipo: quien.tipo, enviado_por_id: quien.refId, enviado_por_nombre: empleado,
    equipo, precio: precioNum, referencia, estado: "enviado",
  }).select("id").maybeSingle();
  return json({ ok: true, solicitud_id: sol?.id || null, mensaje_id: msg?.id || null, referencia, borrador: flow.estado !== "PUBLISHED" });
}

async function enviarWeb(p: { body: any; quien: { tipo: string | null; refId: string | null }; hilo: any; linea: any; equipo: string; precioNum: number; prueba: boolean }) {
  const { body, quien, hilo, linea, equipo, precioNum, prueba } = p;
  if (!hilo.zernio_conversation_id) return json({ ok: false, error: "Este chat todavía no tiene conversación en Zernio; espere a que el cliente escriba y vuelva a intentarlo." }, 400);
  const tec = await datosTecnico(quien.tipo, quien.refId);
  const empleado = String(tec?.nombre || body.empleado_nombre || (quien.tipo === "usuario" ? "Administración" : "Empleado")).trim();
  const { data: suc } = await db.from("sucursales").select("nombre").eq("id", linea.sucursal_id).maybeSingle();
  const sucursal = String(suc?.nombre || linea.nombre || "").trim();
  const precioTxt = plata(precioNum);
  const referencia = `${sucursal} · ${empleado} · ${equipo} ${precioTxt}`;
  const token = llaveCorta(10);
  const ahora = new Date().toISOString();
  const { data: sol, error: eSol } = await db.from("fin_solicitudes_whatsapp").insert({
    hilo_id: hilo.id, linea_id: linea.id, sucursal_id: linea.sucursal_id, sucursal_nombre: sucursal, telefono: hilo.telefono_e164,
    enviado_por_tipo: quien.tipo, enviado_por_id: quien.refId, enviado_por_nombre: empleado,
    equipo, precio: precioNum, referencia, estado: "enviado", canal: "web", token, vence_en: new Date(Date.now() + WEB_VIGENCIA_MS).toISOString(),
  }).select("id, numero").maybeSingle();
  if (eSol || !sol) return json({ ok: false, error: "No se pudo crear la solicitud: " + String(eSol?.message || "") }, 500);
  const enlace = `${WEB_URL}?t=${token}`;
  const nombreCliente = String(hilo.nombre_perfil || "").trim();
  const saludo = nombreCliente && !/^[+\d\s()-]+$/.test(nombreCliente) ? `Hola ${nombrePropio(nombreCliente.split(/\s+/)[0])} 👋` : "Hola 👋";
  const primerNombre = nombrePropio(empleado.split(/\s+/)[0]);
  const texto = [
    saludo,
    `Soy ${primerNombre}, de Bayol Cell ${sucursal}.`,
    "",
    `📱 ${equipo}`,
    `💰 ${precioTxt}`,
    "",
    "Aquí tiene su solicitud de financiamiento. Son 5 pasos cortos y me llega directo a mí:",
    `👉 ${enlace}`,
    "",
    "Cualquier duda, me escribe por aquí.",
    ...(prueba ? ["", "(prueba)"] : []),
  ].join("\n");
  const r = await zernio("POST", `/inbox/conversations/${encodeURIComponent(hilo.zernio_conversation_id)}/messages`, { accountId: linea.zernio_account_id, message: texto });
  if (!r.ok || !r.data?.success) {
    await db.from("fin_solicitudes_whatsapp").update({ estado: "descartado", token: null }).eq("id", sol.id);
    return json({ ok: false, error: "Zernio no pudo enviar el enlace: " + String(r.data?.error || r.data?.message || r.status) }, 502);
  }
  const { data: msg } = await db.from("whatsapp_mensajes").insert({
    hilo_id: hilo.id, direccion: "out", tipo_contenido: "text", cuerpo: texto, wa_message_id: r.data?.data?.messageId || r.data?.messageId || null, estado: "enviado", es_automatico: false,
    enviado_por_tipo: quien.tipo, enviado_por_id: quien.refId, creado_en: ahora,
    meta: { flow: { nombre: NOMBRE_FLOW, canal: "web", solicitud_id: sol.id, equipo, precio: precioNum, referencia, prueba } },
  }).select("id").maybeSingle();
  await db.from("fin_solicitudes_whatsapp").update({ mensaje_out_id: msg?.id || null }).eq("id", sol.id);
  await db.from("whatsapp_hilos").update({ ultimo_mensaje_at: ahora, ultima_respuesta_humana_at: ahora, ultimo_mensaje_preview: "📋 Enlace del formulario de financiamiento enviado" }).eq("id", hilo.id);
  return json({ ok: true, solicitud_id: sol.id, numero: sol.numero, mensaje_id: msg?.id || null, referencia, canal: "web", borrador: prueba });
}

// ---------- Página web pública (sin sesión; manda la llave del enlace) ----------
async function filaPorToken(t: string) {
  if (!/^([0-9a-f]{48}|[A-Za-z0-9]{10,12})$/.test(t)) return { fila: null, error: "Enlace no válido." };
  const { data: fila } = await db.from("fin_solicitudes_whatsapp").select("id, numero, hilo_id, linea_id, sucursal_nombre, telefono, enviado_por_nombre, equipo, precio, referencia, estado, vence_en").eq("token", t).eq("canal", "web").maybeSingle();
  if (!fila) return { fila: null, error: "Este enlace ya no sirve. Pídale uno nuevo a la persona que lo atiende." };
  if (fila.estado !== "enviado") return { fila: null, error: "Esta solicitud ya fue enviada. Gracias." };
  if (fila.vence_en && new Date(fila.vence_en).getTime() < Date.now()) return { fila: null, error: "Este enlace venció. Pídale uno nuevo a la persona que lo atiende." };
  return { fila, error: null };
}
async function accionWebLeer(body: any) {
  const { fila, error } = await filaPorToken(String(body?.t || ""));
  if (!fila) return json({ ok: false, error }, 404);
  const { data: hilo } = await db.from("whatsapp_hilos").select("nombre_perfil").eq("id", fila.hilo_id).maybeSingle();
  const nombre = String(hilo?.nombre_perfil || "").trim();
  const tel = String(fila.telefono || "").replace(/\D/g, "").replace(/^1(\d{10})$/, "$1");
  const suc = String(fila.sucursal_nombre || "").toLowerCase();
  const provinciaSugerida = /moca/.test(suc) ? "Espaillat" : /santiago|navarrete|licey|tamboril|villa gonz/.test(suc) ? "Santiago" : "";
  return json({ ok: true, numero: fila.numero, equipo: fila.equipo, precio: plata(Number(fila.precio)), empleado: fila.enviado_por_nombre, sucursal: fila.sucursal_nombre,
    nombre: /^[+\d\s()-]+$/.test(nombre) ? "" : nombrePropio(nombre), telefono: tel.length === 10 ? tel : "", provincias: PROVINCIAS.map(([, n]) => n), provincia_sugerida: provinciaSugerida });
}
async function accionWebEnviar(body: any) {
  const { fila, error } = await filaPorToken(String(body?.t || ""));
  if (!fila) return json({ ok: false, error }, 404);
  const d = body?.datos && typeof body.datos === "object" ? body.datos : {};
  const s = (k: string) => String(d[k] ?? "").trim().slice(0, 120);
  const cedula = s("cedula").replace(/\D/g, ""), nombres = s("nombres").replace(/\s+/g, " "), telefono = s("telefono").replace(/\D/g, "").replace(/^1(\d{10})$/, "$1");
  const plazo = s("plazo").replace(/\D/g, ""), provincia = s("provincia"), municipio = s("municipio"), sector = s("sector"), calle = s("calle"), casa = s("casa");
  const faltas: string[] = [];
  if (cedula.length !== 11) faltas.push("cédula (11 números)");
  if (nombres.split(" ").filter(Boolean).length < 2) faltas.push("nombre completo");
  if (telefono.length !== 10) faltas.push("celular (10 números)");
  if (!PLAZOS_OK.includes(plazo)) faltas.push("plazo");
  if (!PROVINCIAS.some(([, n]) => n === provincia)) faltas.push("provincia");
  if (municipio.length < 2) faltas.push("ciudad o municipio");
  if (sector.length < 2) faltas.push("sector");
  if (calle.length < 2) faltas.push("calle");
  if (!casa) faltas.push("número de casa");
  if (body?.permiso !== true) faltas.push("permiso para enviar los datos al banco");
  if (faltas.length) return json({ ok: false, error: "Revise: " + faltas.join(", ") + "." }, 400);
  const datos = { equipo: String(fila.equipo || ""), precio: plata(Number(fila.precio)), referencia: String(fila.referencia || ""), cedula, nombres, telefono, plazo, provincia, municipio, sector, calle, casa };
  const ahora = new Date().toISOString();
  // Consumir la llave de forma atómica: solo una respuesta por enlace.
  const { data: tomada } = await db.from("fin_solicitudes_whatsapp").update({ estado: "respondido", datos, respondido_en: ahora, token: null }).eq("id", fila.id).eq("estado", "enviado").select("id").maybeSingle();
  if (!tomada) return json({ ok: false, error: "Esta solicitud ya fue enviada. Gracias." }, 409);
  const { data: nuevo } = await db.from("whatsapp_mensajes").insert({
    hilo_id: fila.hilo_id, direccion: "in", tipo_contenido: "flow_respuesta", cuerpo: textoRespuesta(datos as any), wa_message_id: null,
    meta: { flow: { nombre: NOMBRE_FLOW, canal: "web", solicitud_id: fila.id, numero: fila.numero, datos } }, estado: "recibido", es_automatico: false, creado_en: ahora,
  }).select("id").maybeSingle();
  await db.from("fin_solicitudes_whatsapp").update({ mensaje_in_id: nuevo?.id || null }).eq("id", fila.id);
  await db.from("whatsapp_hilos").update({ ultimo_mensaje_at: ahora, ultimo_mensaje_preview: "📋 Solicitud de financiamiento recibida (web)" }).eq("id", fila.hilo_id);
  const { data: hilo } = await db.from("whatsapp_hilos").select("zernio_conversation_id, nombre_perfil").eq("id", fila.hilo_id).maybeSingle();
  const { data: linea } = await db.from("whatsapp_lineas").select("zernio_account_id").eq("id", fila.linea_id).maybeSingle();
  let aviso = false;
  if (linea?.zernio_account_id) aviso = await pedirFotos(linea.zernio_account_id, hilo?.zernio_conversation_id || null, fila.hilo_id, fila.id, nombres, textoRecibidoWeb(nombres, fila.numero, String(fila.equipo || ""), String(fila.enviado_por_nombre || "Bayol Cell").split(/\s+/)[0], String(fila.sucursal_nombre || "")));
  return json({ ok: true, numero: fila.numero, aviso });
}

async function accionSincronizar(body: any, quien: { tipo: string | null; refId: string | null }) {
  if (!quien.tipo) return json({ ok: false, error: "Sesión no válida." }, 401);
  let q = db.from("whatsapp_flows").select("linea_id, flow_id, estado, whatsapp_lineas:linea_id (zernio_account_id, nombre)").eq("nombre", NOMBRE_FLOW);
  if (body.linea_id) q = q.eq("linea_id", body.linea_id);
  const { data: flows } = await q;
  let nuevas = 0, vistas = 0; const errores: any[] = [];
  for (const f of flows || []) {
    const cuenta = (f as any).whatsapp_lineas?.zernio_account_id;
    if (!cuenta) continue;
    const r = await zernio("GET", `/whatsapp/flow-responses?accountId=${encodeURIComponent(cuenta)}&flowId=${encodeURIComponent(f.flow_id)}`);
    if (!r.ok) { errores.push({ linea: (f as any).whatsapp_lineas?.nombre, status: r.status, error: r.data?.error || null }); continue; }
    for (const resp of r.data?.responses || []) {
      vistas++;
      const tel = "+" + String(resp.from || "").replace(/\D/g, "");
      const out = await registrarRespuesta({ linea_id: f.linea_id, telefono: tel, wa_message_id: resp.id || null, flow_token: resp.flowToken || null, raw: resp.data, recibido_en: resp.receivedAt || new Date().toISOString() });
      if (out.nueva) nuevas++;
    }
  }
  return json({ ok: true, accion: "sincronizar", vistas, nuevas, errores });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: false, error: "Método no permitido" }, 405);
  if (!ZERNIO_API_KEY) return json({ ok: false, error: "Falta ZERNIO_API_KEY en el servidor." }, 500);
  const body = await req.json().catch(() => ({}));
  const accion = String(body?.accion || "");
  // Página web pública: la autoridad es la llave del enlace, no una sesión.
  if (accion === "web_leer") return await accionWebLeer(body);
  if (accion === "web_enviar") return await accionWebEnviar(body);
  let quien = await identidadVerificada(req);
  // Llave de un solo uso (misma tabla _plantilla_llaves que usa whatsapp-plantilla-crear): permite crear/publicar el
  // formulario desde la administración de la base sin una sesión de usuario. Solo para 'publicar', 'sincronizar', 'estado' y
  // 'enviar' en modo de prueba.
  // Para 'enviar' la llave solo vale en modo de prueba (prueba:true → borrador), nunca para un envío real a clientes.
  if (!quien.tipo && (["publicar", "sincronizar", "estado"].includes(accion) || (accion === "enviar" && body?.prueba === true))) {
    const llave = (req.headers.get("x-llave") || "").trim();
    if (llave.length >= 32) {
      const h = [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(llave)))].map((x) => x.toString(16).padStart(2, "0")).join("");
      const { data: ok } = await db.from("_plantilla_llaves").select("hash").eq("hash", h).gt("vence", new Date().toISOString()).maybeSingle();
      if (ok) quien = { tipo: "usuario", refId: null };
    }
  }
  try {
    if (accion === "publicar") return await accionPublicar(body, req, quien);
    if (accion === "enviar") return await accionEnviar(body, req, quien);
    if (accion === "sincronizar") return await accionSincronizar(body, quien);
    if (accion === "estado") {
      if (!quien.tipo) return json({ ok: false, error: "Sesión no válida." }, 401);
      const { data } = await db.from("whatsapp_flows").select("linea_id, nombre, flow_id, version, estado, validation_errors, creado_en, publicado_en, whatsapp_lineas:linea_id (nombre, whatsapp_numero)").eq("nombre", NOMBRE_FLOW).order("creado_en", { ascending: false });
      return json({ ok: true, flows: data || [] });
    }
    return json({ ok: false, error: "Acción desconocida." }, 400);
  } catch (e) {
    console.error("whatsapp-flow-financiamiento:", e);
    return json({ ok: false, error: String((e as any)?.message || e).slice(0, 300) }, 500);
  }
});
