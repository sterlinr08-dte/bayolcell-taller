# 2-nov-2026 13:45 RD — Chat de WhatsApp: cada mensaje enviado dice quién lo mandó (Claude)

## Solicitud del dueño
Captura de un chat de la línea Reparación (cliente …8314) con «2500» a la 1:28 p. m.: «¿Qué empleado respondió ese mensaje?»
y luego «¿Y puedes ponerle el nombre de usuario?».

## Diagnóstico
- El «2500» (13:28:25 RD) no tiene `enviado_por_id` y a esa hora no hubo llamada a `whatsapp-enviar`: se escribió en el
  **celular** de la línea Reparación (llega por el eco del webhook). Desde ahí no se puede saber quién lo escribió.
- Hoy (07:20–13:45 RD): 247 envíos por el CRM (log `evento: envio`) = 247 mensajes con `enviado_por_id`: todo lo enviado desde el
  CRM queda con empleado. Sin empleado y no automáticos hoy: ~1,070 (Al por Mayor 317+114 imágenes, Reparación 257, Principal 162,
  Servicio al Cliente 131…): son del celular. Ojo: la corrección ortográfica solo actúa en lo enviado desde el CRM.

## Cambio (rama `claude/chat-quien-envio`, sin publicar)
- `taller-app.js`: `_waQuienEnvio(m, optimista)`; la etiqueta de las burbujas enviadas de WhatsApp pasa de «Tú (BayolCell)» a:
  - «Nombre Apellido · BayolCell» si tiene `enviado_por_id` (técnico o usuario, con `nombreEmpleado`);
  - «📱 Desde el celular · BayolCell» si no tiene empleado, no es IA/automático ni plantilla y es del 9-oct-2026 en adelante;
  - «Tú (BayolCell)» para IA, plantillas y mensajes viejos (antes no siempre se guardaba quién enviaba).
  - Mientras se envía (mensaje optimista): el nombre de quien escribe.
- `taller-app.min.js` regenerado; `?v=20261102-qe1`. Instagram/Facebook no se tocaron.

## Pruebas
- Nueva `scripts/pruebas/wa-quien-envio.cjs`: 9/9 OK.

## Pendiente
- «Publícalo» del dueño.
