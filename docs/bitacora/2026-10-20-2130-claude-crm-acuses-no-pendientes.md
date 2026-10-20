# 2026-10-20 21:30 · Claude · CRM: un «Ok» del cliente después de la respuesta ya no deja el chat pendiente

## Pedido del dueño
Mandó una captura de la línea Navarrete/Principal con muchos chats en «Atender (1)» y pidió «corregir los mensajes que salen pendientes pero ya fueron contestados por el celular».

## Diagnóstico (datos reales)
- **Las respuestas del celular sí llegan.** En «Guzman Cruz», «Paz Y Amor» y «Pichardo» están los mensajes `out` y `ultima_respuesta_humana_at` se actualizó.
- **El origen del pendiente.** Después de la respuesta, el cliente manda «Ok», «Ok perfecto», «Okey 👍». Ese mensaje deja `ultimo_inbound_at` más nuevo que `ultima_respuesta_humana_at`, y eso marca «Atender» y suma 1 sin leer.
- **Lo que no se puede ver.** La lectura en el celular no le llega al sistema.
- **Tamaño.** En los últimos 3 días, unos 62 de 162 chats pendientes son de este tipo.

## Cambio (`taller-app.js`, versión 20261020-h3)
- **Nueva función `_crmEsAcuse(h)`.** Un chat cuenta como acuse si se cumple todo esto:
  - el último mensaje del chat es del cliente;
  - es corto, de hasta 5 palabras, y solo trae palabras de cierre: ok, okey, gracias, perfecto, está bien, ah bueno, dale, listo, Dios le bendiga…;
  - o es solo un emoji de cierre: 👍 👌 🙏 ❤️ ✅;
  - llegó hasta 12 h después de la última respuesta humana;
  - es el único sin leer.
- **`_crmEsPendiente`.** Si es acuse, el chat no se marca «Atender».
- **`_crmMarcarAcusesLeidos`.** Lo llama `_crmHilosFiltrados`, una vez por chat. Pone `no_leidos_count = 0`, lo mismo que hace abrir el chat.
- **Lo que no se toca.** Una pregunta o cualquier otro texto sigue pendiente como siempre. Tampoco se toca Zernio, el webhook ni la IA.

## Pruebas
- Clasificador:
  - pasan como acuse «Ok perfecto», «Okey 👍», «Ok», «gracias», «Ok está bien», «Ah bueno», «👍» y «Dios le bendiga»;
  - siguen pendientes «Ok, y cuánto cuesta la pantalla?», «Quiero saber que a pasado» y «SUCURSAL SANTIAGO»;
  - también siguen pendientes los chats con 2 sin leer y los acuses que llegan 13 h después.
- Nueva prueba `acuse` 4/4: «Ok perfecto» queda sin «Atender» y sin sin leer, y se marca leído en la base. La pregunta nueva sigue en «Atender».
- `etqcount` 14/14, `crmprecio` 21/21 y `pftest` 49/49.

## Estado
Rama `claude/prefactura-limpia`, **sin publicar**. Va junto con las etiquetas con cantidades.
