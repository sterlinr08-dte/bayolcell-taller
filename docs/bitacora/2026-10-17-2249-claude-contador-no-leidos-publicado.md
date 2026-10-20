# Contador de no leídos publicado — Claude

- **Pedido del dueño:** «Publícalo» (contador de no leídos de la pestaña, entrada `2026-10-17-2235-claude-contador-no-leidos.md`).
- **Base de datos:** se aplicó por la API la migración `crm_no_leidos_count` (= `supabase/migrations/20261018120000_crm_no_leidos_count.sql`). Solo crea la función; no borra ni cambia datos.
- **Verificado en producción:** `crm_no_leidos_count(true, …)` = 1,007 (antes 1,004; entraron mensajes nuevos). anon sin permiso de ejecución, authenticated con permiso, SECURITY INVOKER (RLS se aplica igual).
- **App:** rama `claude/no-leidos-rpc` llevada a `main` por avance rápido. Versiones `?v=20261018-nl1` en `crm-marketing-consent.js` y `taller.html`.
- **Riesgo:** ninguno conocido; si la función faltara, la app vuelve sola al conteo anterior.
- **Siguiente paso:** el dueño revisa que el número del aviso de la pestaña coincide con lo que ve en el CRM.
