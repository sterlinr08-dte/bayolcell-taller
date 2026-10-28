# 2026-10-28 17:20 — Claude — Línea del asistente (829-589-3292) oculta en el CRM

## Pedido del dueño
«Agrégalo al CRM, pero no visible, porque es para enviar información desde el asistente». Sigue a `2026-10-28-1700-claude-pendiente-despacho-829.md`.

## Cambio
- **Base (ya aplicada en `vkhwdvjtowrhkhqavnvk`, migración `20261028170000_whatsapp_linea_oculta_crm.sql`):**
  - columna `whatsapp_lineas.oculta_crm boolean not null default false`. Es un cambio que solo suma: las 6 líneas actuales quedan en `false`;
  - `whatsapp_lineas_directorio()` ya no devuelve las líneas ocultas (se reemplazó la función, no se borró nada).
- **Pantalla** (`taller-app.js` → `?v=20261028-o1`): el selector de líneas del CRM no muestra las líneas con `oculta_crm = true`.

## Falta
1. El dueño conecta el 829-589-3292 en Zernio. Todavía no llegó ningún aviso de esa cuenta.
2. Al conectarse: insertar la fila en `whatsapp_lineas` con `oculta_crm = true`, el `zernio_account_id` y el `phone_number_id`.
3. Plantilla `despacho_equipos` y el botón «Enviar» del despacho por esa línea (siguiente PR).

Nota: la IA de WhatsApp no se tocó en este paso. Antes de que la línea reciba mensajes, hay que decidir si la IA la ignora.

## Pruebas
- Base: la columna existe y la función del directorio ya filtra `oculta_crm`. Las 6 líneas siguen igual (`false`).

## Rama / PR
`claude/linea-asistente-oculta`, PR sin publicar.
