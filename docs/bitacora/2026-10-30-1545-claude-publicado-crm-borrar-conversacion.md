# 2026-10-30 15:45 (RD) — Claude — Publicado: vaciar o eliminar chats del CRM (solo administrador)

Continúa `2026-10-30-1530-claude-crm-borrar-conversacion.md`. El dueño dijo «Publícalo».

## Base (vkhwdvjtowrhkhqavnvk)
- Aplicadas `crm_borrar_conversacion` (20261030190000) y la corrección `crm_borrar_conversacion_auditoria` (20261030191000).
- La primera prueba con ROLLBACK falló a propósito en la auditoría: `auditoria.usuario_id` apunta a `public.usuarios`, no a
  `auth.uid()`. Corrección: `_crm_actor_audit()` da el id de `usuarios` (o null si es técnico admin) y el nombre va en el detalle.
- Prueba con ROLLBACK (chats reales, todo deshecho): no administrador → «Solo el administrador puede vaciar conversaciones»;
  vaciar → 6 mensajes borrados, chat sigue; eliminar → chat borrado, lead conservado (hilo_id = null); 2 filas en auditoría
  («admin vació 6 mensaje(s)…», «admin eliminó el chat de … con 2 mensaje(s)»).

## Frontend
PR #154 (rama `claude/crm-borrar-conversacion`): menú del chat con «Vaciar chat» y «Eliminar chat» solo para administradores.

## Pendiente
- Seguridad aparte: las políticas `app_authenticated_all` de `whatsapp_hilos`/`whatsapp_mensajes` permiten borrar por la API a
  cualquier sesión (venía de antes). Cerrar con el OK del dueño.
