# 22-oct-2026 16:00 · Consulta: ¿se pueden tomar llamadas de WhatsApp? (solo investigación, sin cambios)

## Pregunta del dueño
«Sobre la llamada de WhatsApp: cuando un cliente llama, ¿se pueden tomar llamadas?»

## Hallazgos
- Hoy el CRM no recibe llamadas: el webhook no maneja eventos de llamada y no hay ninguna llamada registrada en `whatsapp_mensajes`.
- Zernio ofrece WhatsApp Business Calling (docs.zernio.com/platforms/whatsapp/calling):
  - la llamada se desvía a un teléfono normal (`tel:`), a un SIP o a un servidor propio (`wss:`);
  - la llamada entrante no tiene costo de Meta; Zernio cobra el minuto de conexión (ejemplo de su doc: 4.2 min ≈ US$0.067), más US$0.004/min si se graba;
  - requisitos: facturación por uso activa en Zernio y que la línea tenga el límite de Meta de ~2,000 destinatarios/día (una línea nueva empieza en 250);
  - hay webhooks de llamada (sonando, contestada, terminada) e historial con duración.
- Contestar dentro del navegador del CRM requeriría un servidor de audio propio (`wss:`): proyecto grande, no recomendado ahora.

## Propuesta al dueño (pendiente de su decisión)
- Activar llamadas por línea, desviadas al celular o fijo de cada sucursal.
- Mostrar en el chat del CRM «Llamada entrante · duración» con los webhooks.
- No se activó nada ni se gastó.
