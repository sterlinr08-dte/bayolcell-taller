// Integración de la ortografía en whatsapp-enviar, instagram-enviar y social-enviar,
// ejecutando sus index.ts REALES con Supabase, Zernio y la IA simulados (nada sale a internet).
// Correr:  node --test scripts/pruebas/ortografia-envio.test.mjs
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
register("./_deno-shim-loader.mjs", import.meta.url);

const FN = "../../supabase/functions/";
const ENV = { SUPABASE_URL: "http://falso", SUPABASE_SERVICE_ROLE_KEY: "srv", ZERNIO_API_KEY: "zk", ANTHROPIC_API_KEY: "ak" };
const handlers = {};
globalThis.Deno = { env: { get: (k) => ENV[k] }, serve: (h) => { globalThis.__h = h; } };
globalThis.__crearDB = () => new Proxy({}, { get: (_t, p) => globalThis.__db[p] });
console.log = () => {};
console.error = () => {};

const CFG = { id: 1, activo: true, canales: ["whatsapp", "instagram", "facebook"], tope_diario: 300, techo_global: 600, timeout_ms: 1500, piloto_hilos: [], piloto_cuentas: [] };

function crearDB({ config = CFG, configFalla = false, cupo = true, insertError = {}, vinculo = true } = {}) {
  const ahora = new Date().toISOString();
  const tablas = {
    auth_actor_bindings: vinculo ? [{ auth_user_id: "u1", activo: true, actor_type: "usuario", actor_ref_id: "11111111-1111-1111-1111-111111111111" }] : [],
    whatsapp_hilos: [{ id: "h-wa", linea_id: "l1", telefono_e164: "+18095551234", ultimo_inbound_at: ahora, zernio_conversation_id: "c-wa", asignado_tipo: null, asignado_id: null }],
    whatsapp_lineas: [{ id: "l1", zernio_account_id: "acc-wa", sucursal_id: "s1" }],
    whatsapp_mensajes: [],
    instagram_hilos: [{ id: "h-ig", cuenta_id: "ci", zernio_conversation_id: "c-ig", ultimo_inbound_at: ahora }],
    instagram_cuentas: [{ id: "ci", zernio_account_id: "acc-ig" }],
    instagram_mensajes: [],
    social_hilos: [{ id: "h-fb", zernio_conversation_id: "c-fb", cuenta_id: "cf" }],
    social_cuentas: [{ id: "cf", zernio_account_id: "acc-fb", plataforma: "facebook" }],
    social_mensajes: [],
    crm_ortografia_config: config ? [config] : [],
  };
  const reg = { inserts: [], updates: [], rpc: [] };
  const from = (tabla) => {
    const filtros = [];
    let op = "select", payload = null, uno = false;
    const run = async () => {
      const filas = (tablas[tabla] ||= []);
      const coincide = (r) => filtros.every(([c, v]) => r[c] === v);
      if (op === "insert") {
        reg.inserts.push({ tabla, fila: payload });
        if (insertError[tabla]) return { data: null, error: insertError[tabla] };
        filas.push({ ...payload });
        return { data: null, error: null };
      }
      if (op === "update") {
        reg.updates.push({ tabla, cambios: payload, filtros: [...filtros] });
        filas.filter(coincide).forEach((r) => Object.assign(r, payload));
        return { data: null, error: null };
      }
      if (tabla === "crm_ortografia_config" && configFalla) return { data: null, error: { message: "relation does not exist" } };
      const res = filas.filter(coincide);
      return { data: uno ? res[0] ?? null : res, error: null };
    };
    const b = {
      select: () => b, eq: (c, v) => (filtros.push([c, v]), b), order: () => b, limit: () => b, abortSignal: () => b,
      insert: (f) => ((op = "insert"), (payload = f), b), update: (f) => ((op = "update"), (payload = f), b),
      maybeSingle: () => ((uno = true), run()), single: () => ((uno = true), run()),
      then: (ok, mal) => run().then(ok, mal),
    };
    return b;
  };
  const rpc = (nombre, args) => {
    reg.rpc.push({ nombre, args });
    const p = { abortSignal: () => p, then: (ok, mal) => Promise.resolve({ data: cupo, error: null }).then(ok, mal) };
    return p;
  };
  const auth = { getUser: async (t) => (t === "token-bueno" ? { data: { user: { id: "u1" } }, error: null } : { data: null, error: { message: "jwt" } }) };
  return { from, rpc, auth, tablas, reg };
}

// Red falsa: Zernio y Anthropic.
let red;
function crearRed({ corregir = (x) => x, iaDemoraMs = 0, partialFailure = null } = {}) {
  const r = { zernio: [], ia: 0 };
  globalThis.fetch = async (url, init) => {
    url = String(url);
    if (url.startsWith("https://api.anthropic.com/")) {
      r.ia++;
      const c = JSON.parse(init.body);
      const entrada = c.messages[0].content.replace(/^<mensaje>\n/, "").replace(/\n<\/mensaje>$/, "");
      if (iaDemoraMs) await new Promise((res, rej) => { const t = setTimeout(res, iaDemoraMs); init.signal.addEventListener("abort", () => { clearTimeout(t); rej(new DOMException("a", "AbortError")); }); });
      return { ok: true, status: 200, json: async () => ({ stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify({ texto: corregir(entrada) }) }] }) };
    }
    if (url.startsWith("https://zernio.com/")) {
      r.zernio.push({ url, body: JSON.parse(init.body) });
      const datos = { success: true, data: { messageId: "zm-" + r.zernio.length, ...(partialFailure ? { partialFailure } : {}) } };
      return { ok: true, status: 200, json: async () => datos };
    }
    throw new Error("red no permitida en la prueba: " + url);
  };
  return r;
}

async function cargar(nombre) {
  await import(FN + nombre + "/index.ts");
  handlers[nombre] = globalThis.__h;
  return await import(FN + nombre + "/_shared/ortografia.ts");
}
const mods = {};
for (const n of ["whatsapp-enviar", "instagram-enviar", "social-enviar"]) mods[n] = await cargar(n);

beforeEach(() => { for (const m of Object.values(mods)) m._reiniciarCacheOrtografia(); });

const CANALES = [
  { fn: "whatsapp-enviar", tabla: "whatsapp_mensajes", col: "meta", hilos: "whatsapp_hilos", body: (t) => ({ hilo_id: "h-wa", mensaje: t }), campoTexto: "message" },
  { fn: "instagram-enviar", tabla: "instagram_mensajes", col: "metadata", hilos: "instagram_hilos", body: (t) => ({ hilo_id: "h-ig", mensaje: t }), campoTexto: "message" },
  { fn: "social-enviar", tabla: "social_mensajes", col: "metadata", hilos: "social_hilos", body: (t) => ({ hiloId: "h-fb", text: t }), campoTexto: "text" },
];
const llamar = async (fn, body, token = "token-bueno") => {
  const resp = await handlers[fn](new Request("http://local/" + fn, { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify(body) }));
  return { status: resp.status, j: await resp.json() };
};
const CORRIGE = (x) => x.replace("resivimos", "recibimos").replace("aser", "hacer");

for (const c of CANALES) {
  test(`${c.fn}: sin permiso → 403, cero envío y cero IA`, async () => {
    globalThis.__db = crearDB({ vinculo: false });
    red = crearRed({ corregir: CORRIGE });
    const { status } = await llamar(c.fn, c.body("ya resivimos"));
    assert.equal(status, 403);
    assert.equal(red.zernio.length, 0); assert.equal(red.ia, 0); assert.equal(globalThis.__db.reg.rpc.length, 0);
    const r2 = await llamar(c.fn, c.body("ya resivimos"), "token-malo");
    assert.equal(r2.status, 403); assert.equal(red.zernio.length, 0); assert.equal(red.ia, 0);
  });

  test(`${c.fn}: sin configuración (tabla aún no creada) → sale el original, sin IA`, async () => {
    globalThis.__db = crearDB({ configFalla: true });
    red = crearRed({ corregir: CORRIGE });
    const { status, j } = await llamar(c.fn, c.body("ya resivimos"));
    assert.equal(status, 200); assert.equal(j.texto_enviado, "ya resivimos"); assert.equal(j.ortografia, undefined);
    assert.equal(red.zernio[0].body[c.campoTexto], "ya resivimos"); assert.equal(red.ia, 0);
  });

  test(`${c.fn}: interruptor apagado → original, sin IA ni cupo`, async () => {
    globalThis.__db = crearDB({ config: { ...CFG, activo: false } });
    red = crearRed({ corregir: CORRIGE });
    const { j } = await llamar(c.fn, c.body("ya resivimos"));
    assert.equal(j.texto_enviado, "ya resivimos"); assert.equal(red.ia, 0); assert.equal(globalThis.__db.reg.rpc.length, 0);
  });

  test(`${c.fn}: encendido → el MISMO texto corregido va a Zernio, al cuerpo, a la vista previa y a la respuesta`, async () => {
    const db = (globalThis.__db = crearDB());
    red = crearRed({ corregir: CORRIGE });
    const { j } = await llamar(c.fn, c.body("ya resivimos, hay que aser el pago de RD$ 4,500.00?"));
    const final = "ya recibimos, hay que hacer el pago de RD$ 4,500.00?";
    assert.equal(red.zernio.length, 1); assert.equal(red.ia, 1);
    assert.equal(red.zernio[0].body[c.campoTexto], final);
    const fila = db.tablas[c.tabla][0];
    assert.equal(fila.cuerpo, final);
    assert.equal(fila[c.col].ortografia.original, "ya resivimos, hay que aser el pago de RD$ 4,500.00?");
    const prev = db.reg.updates.find((u) => u.tabla === c.hilos);
    assert.equal(prev.cambios.ultimo_mensaje_preview, final);
    assert.equal(j.texto_enviado, final); assert.deepEqual(j.ortografia, { corregido: true, original: "ya resivimos, hay que aser el pago de RD$ 4,500.00?" });
    assert.equal(db.reg.rpc[0].args.p_servicio, "ortografia");
  });

  test(`${c.fn}: IA lenta → a los 1.5 s sale el original, un solo envío`, async () => {
    globalThis.__db = crearDB();
    red = crearRed({ corregir: CORRIGE, iaDemoraMs: 3000 });
    const t0 = Date.now();
    const { j } = await llamar(c.fn, c.body("ya resivimos"));
    assert.ok(Date.now() - t0 < 1700, "tardó " + (Date.now() - t0));
    assert.equal(j.texto_enviado, "ya resivimos"); assert.equal(red.zernio.length, 1);
    assert.equal(red.zernio[0].body[c.campoTexto], "ya resivimos");
  });

  test(`${c.fn}: webhook adelantado (fila ya existe) → se fusiona la marca, sin reenviar`, async () => {
    const db = (globalThis.__db = crearDB({ insertError: { [c.tabla]: { code: "23505", message: "duplicate" } } }));
    const idCol = c.tabla === "whatsapp_mensajes" ? "wa_message_id" : "zernio_message_id";
    db.tablas[c.tabla].push({ [idCol]: "zm-1", cuerpo: "ya recibimos", [c.col]: c.tabla === "social_mensajes" ? { event: "message.sent" } : null });
    red = crearRed({ corregir: CORRIGE });
    await llamar(c.fn, c.body("ya resivimos"));
    assert.equal(red.zernio.length, 1);
    const fila = db.tablas[c.tabla][0];
    assert.equal(fila[c.col].ortografia.original, "ya resivimos");
    if (c.tabla === "social_mensajes") assert.equal(fila[c.col].event, "message.sent");
  });
}

test("whatsapp-enviar: plantilla, ubicación y contacto no pasan por la IA", async () => {
  globalThis.__db = crearDB();
  red = crearRed({ corregir: CORRIGE });
  await llamar("whatsapp-enviar", { hilo_id: "h-wa", mensaje: "ya resivimos", plantilla: { nombre: "factura", idioma: "es" } });
  await llamar("whatsapp-enviar", { hilo_id: "h-wa", ubicacion: { lat: 19.4, lng: -70.6 } });
  await llamar("whatsapp-enviar", { hilo_id: "h-wa", contacto: { nombre: "Bayol", telefono: "8095551234" } });
  assert.equal(red.ia, 0);
});

test("whatsapp-enviar: foto con texto → se corrige el pie de foto", async () => {
  globalThis.__db = crearDB();
  red = crearRed({ corregir: CORRIGE });
  await llamar("whatsapp-enviar", { hilo_id: "h-wa", mensaje: "resivimos la pantalla", adjunto: { url: "https://x/y.jpg", path: "out/y.jpg", tipo: "imagen" } });
  assert.equal(red.zernio[0].body.message, "recibimos la pantalla");
});

test("whatsapp-enviar: enviado pero falla el guardado local → aviso honesto, sin reenvío", async () => {
  globalThis.__db = crearDB({ insertError: { whatsapp_mensajes: { code: "XX000", message: "fallo" } } });
  red = crearRed({ corregir: CORRIGE });
  const { j } = await llamar("whatsapp-enviar", { hilo_id: "h-wa", mensaje: "ya resivimos" });
  assert.equal(j.ok, true); assert.equal(j.guardado_local, false); assert.equal(red.zernio.length, 1);
});

test("instagram-enviar: falla parcial + corrección → se conservan los dos datos", async () => {
  const db = (globalThis.__db = crearDB());
  red = crearRed({ corregir: CORRIGE, partialFailure: { text: "rechazado" } });
  await llamar("instagram-enviar", { hilo_id: "h-ig", mensaje: "resivimos la foto", adjunto: { url: "https://x/y.jpg", tipo: "imagen" } });
  const m = db.tablas.instagram_mensajes[0].metadata;
  assert.deepEqual(m.partialFailure, { text: "rechazado" }); assert.equal(m.ortografia.original, "resivimos la foto");
});

test("social-enviar: se conserva la información de Zernio junto a la corrección", async () => {
  const db = (globalThis.__db = crearDB());
  red = crearRed({ corregir: CORRIGE });
  await llamar("social-enviar", { hiloId: "h-fb", text: "ya resivimos" });
  const m = db.tablas.social_mensajes[0].metadata;
  assert.equal(m.zernio.success, true); assert.equal(m.ortografia.original, "ya resivimos");
  assert.equal(db.tablas.social_mensajes[0].enviado_por_tipo, "usuario");
});

test("doble clic: dos envíos simultáneos salen cada uno una vez, corregidos", async () => {
  globalThis.__db = crearDB();
  red = crearRed({ corregir: CORRIGE, iaDemoraMs: 80 });
  const [a, b] = await Promise.all([llamar("whatsapp-enviar", { hilo_id: "h-wa", mensaje: "ya resivimos" }), llamar("whatsapp-enviar", { hilo_id: "h-wa", mensaje: "ya resivimos" })]);
  assert.equal(a.j.texto_enviado, "ya recibimos"); assert.equal(b.j.texto_enviado, "ya recibimos");
  assert.equal(red.zernio.length, 2); assert.equal(red.ia, 2);
});

test("las copias de _shared en cada función son idénticas al original", async () => {
  const { readFileSync } = await import("node:fs");
  const base = new URL(FN, import.meta.url);
  const leer = (p) => readFileSync(new URL(p, base), "utf8");
  for (const n of ["whatsapp-enviar", "instagram-enviar", "social-enviar"]) assert.equal(leer(n + "/_shared/ortografia.ts"), leer("_shared/ortografia.ts"), n);
  for (const n of ["instagram-enviar", "social-enviar"]) assert.equal(leer(n + "/_shared/inbox-common.ts"), leer("_shared/inbox-common.ts"), n);
});
