// ortografia-banco — DESACTIVADA (2-nov-2026). Fue una función temporal para el banco de pruebas
// de la corrección ortográfica (bitácora 2026-11-02). Ya no hace nada. Se puede borrar desde el panel.
Deno.serve(() => new Response(JSON.stringify({ ok: false, error: "desactivada" }), { status: 410, headers: { "Content-Type": "application/json" } }));
