// Cargador para correr las Edge Functions (Deno) en Node durante las pruebas:
// cambia los imports jsr:/npm: de Supabase por un cliente falso que da la prueba.
export async function resolve(spec, ctx, next) {
  if (spec === "jsr:@supabase/functions-js/edge-runtime.d.ts") return { url: "data:text/javascript,", shortCircuit: true };
  if (spec === "jsr:@supabase/supabase-js@2" || spec === "npm:@supabase/supabase-js@2") {
    return { url: "data:text/javascript,export const createClient=(...a)=>globalThis.__crearDB(...a);", shortCircuit: true };
  }
  return next(spec, ctx);
}
