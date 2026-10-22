# 2026-10-22 12:15 · Claude · Plantillas de WhatsApp: envío arreglado y plantilla formal sometida

## 1) «No se pudo enviar la plantilla» (dueño, captura 11:57)
- **Log:** `Zernio rechazo el envio: 400 {"error":"Invalid template shape","param":"template"}`.
- **Causa:** Zernio cambió el contrato de envío de plantillas en la conversación.
  - La forma vieja era `template:{ name, language, variableMapping:{ body_text } }`.
  - La forma actual (docs.zernio.com/messages/send-inbox-message) es `template:{ elements:[{ name, language, components:[{type:"body", parameters:[{type:"text", text}]}] }] }`.
- **Arreglo:** `whatsapp-enviar` **v21** desplegada. Solo cambia el bloque de plantilla: variables → `body.parameters`, variables con nombre → `parameter_name`, imagen de cabecera → `header.parameters[image.link]`. Lo demás es igual a la v20.
- NEXUS no se toca: `whatsapp-notificar` usa otro contrato (`templateName`/`templateParams`).
- **Prueba:** pendiente de un envío real desde el CRM («Enviar plantilla»).

## 2) Plantilla A sometida («SOMETE LA PROPUESTA A»)
| Campo | Valor |
|---|---|
| Nombre | `bayolcell_seguimiento_consulta` |
| Categoría | UTILITY |
| Idioma | `es` |
| Cuerpo | «Buenas, {{1}}. Le saluda BAYOL CELL, sucursal {{2}}. Recibimos su consulta y le daremos seguimiento por este medio. ¿En qué le podemos servir?» (ejemplo: Juan Pérez / Santiago) |
| Pie | «BAYOL CELL · Santiago, Moca y Navarrete» |

- **Vía:** `POST https://zernio.com/api/v1/whatsapp/templates` desde la Edge `whatsapp-plantilla-crear` (uso único, llave de un solo uso en `_plantilla_llaves`, contenido fijo en el código).
- El primer intento dio 400 (`type` en mayúsculas); no se creó nada. Con `body`/`footer` en minúsculas, **6/6 líneas = 200, estado PENDING**: Principal Navarrete, Reparación Santiago, Servicio al Cliente Santiago, Al por Mayor Navarrete, Reparación Moca y Al por Mayor Santiago.
- **Nota:** la función `whatsapp-plantilla-crear` ya existía como v1 desplegada (sin código en el repo ni referencias en el sistema) y se reemplazó. Hoy está en la **v4, desactivada (410)**.
- **Tabla nueva** `_plantilla_llaves`: RLS sin políticas y sin permisos para anon/authenticated. Las llaves vencen a los 15–20 min; la copia local se borró.

## Siguiente
- Cuando Meta la apruebe (`APPROVED`), aparece sola en «Enviar plantilla» del CRM.
- Propuesto al dueño: que el CRM llene solo {{1}} con el nombre del cliente y {{2}} con la sucursal de la línea.
