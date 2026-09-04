import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.4";

const URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db = createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const out = (x: unknown, status = 200) => new Response(JSON.stringify(x), { status, headers: { ...cors, "Content-Type": "application/json" } });
const text = (v: unknown, n = 300) => String(v ?? "").trim().slice(0, n);
const phone = (v: unknown) => String(v ?? "").replace(/\D/g, "").slice(0, 15);

type Actor = {
  userId: string;
  actorType: string;
  actorRefId: string | null;
  esAdmin: boolean;
  sucursalId: string | null;
};

async function actor(req: Request): Promise<Actor | null> {
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await db.auth.getUser(token);
  if (error || !data?.user) return null;

  const { data: b, error: bErr } = await db
    .from("auth_actor_bindings")
    .select("actor_type,actor_ref_id,sucursal_id,es_admin,activo")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();
  if (bErr || !b?.activo) return null;

  let sucursalId: string | null = b.sucursal_id || null;
  if (!sucursalId && b.actor_type === "tecnico" && b.actor_ref_id) {
    const { data: t } = await db.from("tecnicos").select("sucursal_id").eq("id", b.actor_ref_id).maybeSingle();
    sucursalId = t?.sucursal_id || null;
  }
  if (!sucursalId && b.actor_type === "usuario" && b.actor_ref_id) {
    const { data: u } = await db.from("usuarios").select("sucursal_id").eq("id", b.actor_ref_id).maybeSingle();
    sucursalId = u?.sucursal_id || null;
  }

  return { userId: data.user.id, actorType: b.actor_type, actorRefId: b.actor_ref_id || null, esAdmin: !!b.es_admin, sucursalId };
}

function puedeSucursal(a: Actor, sucursalId: string) {
  return a.esAdmin || !a.sucursalId || a.sucursalId === sucursalId;
}

async function resolverSucursal(body: any, a: Actor): Promise<string> {
  const solicitada = text(body.sucursal_id, 80);
  if (solicitada) {
    const { data: suc } = await db.from("sucursales").select("id").eq("id", solicitada).eq("activo", true).maybeSingle();
    if (!suc) throw new Error("Sucursal no encontrada o inactiva");
    if (!puedeSucursal(a, solicitada)) throw new Error("No tienes permiso para registrar consentimiento en esa sucursal");
    return solicitada;
  }
  if (a.sucursalId) return a.sucursalId;
  throw new Error("Indica la sucursal para registrar el consentimiento");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return out({ ok: false, error: "metodo" }, 405);
  const a = await actor(req);
  if (!a) return out({ ok: false, error: "sin_permiso", mensaje: "Sesión no autorizada." }, 403);

  let body: any;
  try { body = await req.json(); } catch { return out({ ok: false, error: "body" }, 400); }
  const action = text(body.action, 40);

  try {
    if (action === "sucursales") {
      let q = db.from("sucursales").select("id,nombre,codigo").eq("activo", true).order("nombre");
      if (a.sucursalId && !a.esAdmin) q = q.eq("id", a.sucursalId);
      const { data, error } = await q;
      if (error) throw error;
      return out({ ok: true, sucursales: data || [], preferida: a.sucursalId });
    }

    if (action === "consultar_telefono") {
      const telefono = phone(body.telefono);
      if (telefono.length < 7) return out({ ok: true, valido: false, existe: false, opt_in: false });
      const sucursalId = await resolverSucursal(body, a);
      const { data: pref, error } = await db.from("whatsapp_marketing_preferencias")
        .select("opt_in,opt_in_at,opt_out_at,fuente,nota,actualizado_en")
        .eq("sucursal_id", sucursalId)
        .eq("telefono_e164", telefono)
        .maybeSingle();
      if (error) throw error;
      return out({ ok: true, valido: true, existe: !!pref, opt_in: !!pref?.opt_in && !pref?.opt_out_at, opt_in_at: pref?.opt_in_at || null, opt_out_at: pref?.opt_out_at || null, fuente: pref?.fuente || null, actualizado_en: pref?.actualizado_en || null });
    }

    if (action === "guardar_telefono") {
      const telefono = phone(body.telefono);
      if (telefono.length < 7) throw new Error("El WhatsApp no es válido");
      const sucursalId = await resolverSucursal(body, a);
      const optIn = body.opt_in === true;
      if (optIn && body.confirmo_consentimiento !== true) {
        return out({ ok: false, error: "confirmacion_requerida", mensaje: "Confirma que el cliente aceptó recibir ofertas y novedades de BAYOL CELL por WhatsApp." }, 409);
      }
      const now = new Date().toISOString();
      const row = {
        sucursal_id: sucursalId,
        telefono_e164: telefono,
        opt_in: optIn,
        opt_in_at: optIn ? now : null,
        opt_out_at: optIn ? null : now,
        fuente: text(body.fuente || (optIn ? "formulario" : "baja_manual"), 120),
        nota: text(body.nota || "", 500) || null,
        registrado_por: a.userId,
        actualizado_en: now,
      };
      const { error } = await db.from("whatsapp_marketing_preferencias").upsert(row, { onConflict: "sucursal_id,telefono_e164" });
      if (error) throw error;
      return out({ ok: true, telefono_e164: telefono, sucursal_id: sucursalId, opt_in: optIn, actualizado_en: now });
    }

    if (!a.esAdmin) return out({ ok: false, error: "sin_permiso", mensaje: "Solo administradores pueden gestionar la audiencia masiva." }, 403);

    if (action === "listar") {
      const lineaId = text(body.linea_id, 80);
      const qtext = text(body.buscar, 120).toLowerCase();
      if (!lineaId) throw new Error("Selecciona una linea");
      const { data: line } = await db.from("whatsapp_lineas").select("id,sucursal_id,nombre,whatsapp_numero").eq("id", lineaId).maybeSingle();
      if (!line) throw new Error("Linea no encontrada");
      const { data: hilos, error: hErr } = await db.from("whatsapp_hilos").select("id,nombre_perfil,telefono_e164,ultimo_mensaje_at,ultimo_mensaje_preview").eq("linea_id", lineaId).order("ultimo_mensaje_at", { ascending: false, nullsFirst: false }).limit(1500);
      if (hErr) throw hErr;
      const { data: prefs, error: pErr } = await db.from("whatsapp_marketing_preferencias").select("telefono_e164,opt_in,opt_in_at,opt_out_at,fuente").eq("sucursal_id", line.sucursal_id).limit(5000);
      if (pErr) throw pErr;
      const prefMap = new Map((prefs || []).map((p: any) => [p.telefono_e164, p]));
      let contacts = (hilos || []).filter((h: any) => /^[0-9]{7,15}$/.test(h.telefono_e164)).map((h: any) => {
        const p: any = prefMap.get(h.telefono_e164);
        return { id: h.id, nombre: h.nombre_perfil || "Sin nombre", telefono_e164: h.telefono_e164, ultimo_mensaje_at: h.ultimo_mensaje_at, ultimo_mensaje_preview: h.ultimo_mensaje_preview, opt_in: !!p?.opt_in && !p?.opt_out_at, opt_in_at: p?.opt_in_at || null, opt_out_at: p?.opt_out_at || null, fuente: p?.fuente || null };
      });
      if (qtext) contacts = contacts.filter((c: any) => c.nombre.toLowerCase().includes(qtext) || c.telefono_e164.includes(qtext));
      return out({ ok: true, linea: line, total: contacts.length, con_consentimiento: contacts.filter((c: any) => c.opt_in).length, sin_consentimiento: contacts.filter((c: any) => !c.opt_in).length, contactos: contacts.slice(0, 500) });
    }

    if (action === "consentimiento") {
      const ids = Array.isArray(body.hilo_ids) ? [...new Set(body.hilo_ids.map(String))].slice(0, 500) : [];
      const optIn = body.opt_in === true;
      if (!ids.length) throw new Error("Selecciona al menos un contacto");
      if (optIn && body.confirmo_consentimiento !== true) return out({ ok: false, error: "confirmacion_requerida", mensaje: "Debes confirmar que estos clientes aceptaron recibir mensajes de BAYOL CELL por WhatsApp." }, 409);
      const { data: hilos, error } = await db.from("whatsapp_hilos").select("id,sucursal_id,telefono_e164").in("id", ids);
      if (error) throw error;
      const now = new Date().toISOString();
      const rows = (hilos || []).filter((h: any) => /^[0-9]{7,15}$/.test(h.telefono_e164)).map((h: any) => ({ sucursal_id: h.sucursal_id, telefono_e164: h.telefono_e164, opt_in: optIn, opt_in_at: optIn ? now : null, opt_out_at: optIn ? null : now, fuente: text(body.fuente || (optIn ? "consentimiento_verificado" : "baja_manual"), 120), nota: text(body.nota || "", 500) || null, registrado_por: a.userId, actualizado_en: now }));
      if (!rows.length) throw new Error("No hay numeros validos en la seleccion");
      const { error: uErr } = await db.from("whatsapp_marketing_preferencias").upsert(rows, { onConflict: "sucursal_id,telefono_e164" });
      if (uErr) throw uErr;
      return out({ ok: true, actualizados: rows.length, opt_in: optIn });
    }

    return out({ ok: false, error: "accion" }, 400);
  } catch (e) {
    console.error("whatsapp-marketing-contactos", action, e instanceof Error ? e.message : String(e));
    return out({ ok: false, error: "operacion", mensaje: text(e instanceof Error ? e.message : String(e), 1000) }, 400);
  }
});
