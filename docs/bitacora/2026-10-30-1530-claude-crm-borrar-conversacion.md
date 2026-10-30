# 2026-10-30 15:30 (RD) — Claude — CRM: vaciar o eliminar conversaciones, solo el administrador

## Solicitud del dueño
«Habilita la opción de eliminar o vaciar las conversaciones del CRM, solo el administrador.»

## Diagnóstico
- Chats en `whatsapp_hilos` (13 367) y mensajes en `whatsapp_mensajes` (155 557). Los mensajes, sugerencias/episodios de IA,
  transferencias y referidos se borran en cascada con el chat; `leads.hilo_id` (9 595) y `whatsapp_envio_destinatarios.hilo_id`
  NO tienen cascada (hay que soltarlos antes de borrar).
- Ya existe `public.app_is_admin()` (usuario tradicional o técnico con rol admin) y la tabla `public.auditoria`.
- Observación de seguridad (no cambiada aquí): las políticas de `whatsapp_hilos` y `whatsapp_mensajes` son `app_authenticated_all`
  (cualquier sesión puede escribir/borrar por la API). Conviene cerrarlo aparte.

## Cambio (rama `claude/crm-borrar-conversacion`, SIN publicar)
- Migración `supabase/migrations/20261030190000_crm_borrar_conversacion.sql`:
  - `crm_vaciar_hilo(uuid)`: solo administrador; borra los mensajes del chat (suelta antes las referencias que no son en cascada),
    deja el chat vacío (contacto, línea, cliente y etiquetas siguen), anota en `auditoria` (CRM_VACIAR_CONVERSACION).
  - `crm_eliminar_hilo(uuid)`: solo administrador; suelta leads y envíos (`hilo_id = null`, se conservan), borra el chat y sus
    mensajes, anota en `auditoria` (CRM_ELIMINAR_CONVERSACION).
  - `execute` solo para `authenticated`; nada para `anon`.
- `crm-wa-identico.js` (`?v=20261030-w19`, cargado desde `crm-marketing-consent.js`): en el menú del chat (⋮ de la cabecera,
  flecha de la fila y hoja del celular) aparecen **Vaciar chat** y **Eliminar chat**, en rojo, **solo si `isAdminUser()`**.
  Piden confirmar con el nombre del contacto y explican que el WhatsApp del cliente no cambia. Si falta la migración, avisan.
- `crm-wa-identico.css`: estilo rojo de esas dos opciones.

## Pruebas
- `node --check` del JS: correcto.
- La prueba con ROLLBACK en la base pidió aprobación en la app de Claude y venció sin respuesta: **no se aplicó ni se probó en la base**.

## Pendiente
- Aplicar la migración (aprobando el aviso o pegándola en el SQL Editor), probarla con ROLLBACK, publicar el frontend.
