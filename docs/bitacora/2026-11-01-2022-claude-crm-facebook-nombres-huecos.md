# CRM Facebook: nombres «huecos» se muestran como «Cliente de Facebook · …1234» (2-nov-2026)

**Pedido del dueño:** opción B de la auditoría `…-claude-crm-auditoria-facebook-duplicados.md`.

## Problema
42 hilos de Facebook se llaman igual, «Usuario de Facebook» (Facebook oculta el nombre), y otros pueden traer el nombre de la página («BayolCell»). En la lista parecen el mismo chat repetido y no se sabe cuál es cuál.

## Cambio (solo pantalla; sin tocar datos ni Edge Functions)
- `crm-social-scope-fix.js`: función `fbNombreHilo(t)` (expuesta como `window.bcFbNombreHilo`). Si el nombre está vacío o es «Usuario de Facebook», «Facebook User», «BayolCell», «Cliente/Contacto de Facebook», usa el `participant_username`; si tampoco hay, «Cliente de Facebook · …» + últimos 4 del id de Facebook. Se usa en la lista, en el refresco incremental (ahora también actualiza nombre e iniciales si Zernio manda el nombre después) y en el encabezado de respaldo del chat.
- `crm-facebook-chat.js`: encabezado del chat y lista de «Reenviar» usan la misma función (la consulta de reenviar ahora pide `participant_id`).
- `crm-marketing-consent.js`: versión de carga `V='20261102-u3'` (antes `20261023-u2`) para que el navegador baje los archivos nuevos.

## Pruebas
- Sintaxis de los 3 archivos OK.
- Prueba unitaria de `fbNombreHilo` con 7 casos (oculto, Facebook User, BayolCell, vacío con id, nombre real, solo username, sin participant_id): 7/7 OK.
- No se pudo capturar la pantalla del Centro de Canales en el banco local (necesita datos sociales reales); el cambio es una función de texto y tres reemplazos puntuales.

## Pendiente (no incluido en B)
- Los 11 hilos sin nombre se llenan solo si se importa el historial de Facebook desde Zernio (función `social-importar-historial`, idempotente). Hace falta el OK del dueño para correrla.

**Rama:** `claude/crm-nombres-facebook`. **No publicado.**
