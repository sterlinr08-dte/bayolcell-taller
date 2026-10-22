# 22-oct-2026 · «Llamada entrante» en el chat: lo que se puede y lo que no (corrige la bit. 1600)

## Pedido del dueño
«Agrega lo de llamada entrante en el chat exactamente, y no vamos a tomar llamadas desde el CRM.»

## Corrección de la bit. 1600
- Se dijo que hoy «la llamada no llega a ningún lado». **Era incorrecto.** Las 6 líneas de Bayol están en **coexistencia**
  (app WhatsApp Business en el teléfono + API): los clientes sí llaman y **suena en la app del teléfono** de la sucursal.

## Hallazgo
- Zernio, tabla de coexistencia (docs.zernio.com/platforms/whatsapp/connect): «Voice and video calls — Not supported through the API».
  En coexistencia no llegan `call.received` / `call.ended`, y tampoco se puede activar WhatsApp Calling.
- Para tener los eventos de llamada habría que sacar la línea de coexistencia (se pierde la app en el teléfono para esa línea).
- En `whatsapp_mensajes` no hay rastro de llamadas. Hay 207 entrantes con `unsupported:131051 Message type unknown`
  (hoy se muestran como «contacto compartido»), pero no se guardaba el detalle para saber qué eran.

## Cambio (diagnóstico, sin efecto visible)
- `whatsapp-webhook` **v37** (desplegada): en mensajes sin soporte guarda `meta.sin_soporte` = código, título, tipo, detalle
  y los nombres de los campos que manda Meta. No guarda texto del cliente. No cambia lo que ve el empleado.
- Se verificó antes de desplegar que la v36 en vivo y el archivo del repo tenían la misma lógica (impresión TS sin comentarios: iguales),
  y que la v37 desplegada es el archivo del repo con este bloque.
- Rama `claude/llamadas-diagnostico`.

## Siguiente paso
- El dueño hace una llamada de WhatsApp de prueba a una línea. Si llega un 131051 con `sin_soporte.tipo` de llamada,
  se muestra «📞 Llamada entrante» en el chat. Si no llega nada, no hay forma de registrarla mientras la línea esté en coexistencia.
