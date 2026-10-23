# 2026-10-23 07:40 (RD) — CRM: números con menú de acción, Facebook repetido e Instagram con contadores viejos (rama)

## Pedidos del dueño (3 capturas)
1. «Cuando envían números, que al darle click se abra el menú de acción para elegir si escribir al WhatsApp o llamar».
2. Facebook: «conversaciones repetidas» (Arianny Aquino, Gricelda Martinez… dos veces).
3. Instagram: «notificación de que chat no se respondió confunden a nuestros empleados» (542 en la pestaña).

## Diagnóstico (fuente de verdad: Supabase vkhwdvjtowrhkhqavnvk + funciones)
- **Facebook:** la llave única de `social_hilos` es (cuenta, `zernio_conversation_id`). Zernio ha mandado dos ids
  distintos para el mismo cliente: el PSID numérico (467 hilos, historial importado) y un id hexadecimal nuevo
  (44 hilos, webhook reciente). Resultado: 38 clientes con dos hilos (76 filas). Además, en los eventos salientes el
  webhook tomaba el nombre del `sender`, que es la propia página: por eso salen hilos llamados «BayolCell».
  Enviar funciona con los dos tipos de id (79 y 1,360 envíos correctos; 0 fallidos).
- **Instagram:** 478 chats abiertos, 197 con contador, 537 mensajes «sin leer». De esos chats, **165 ya fueron
  respondidos** por nosotros después del último mensaje del cliente (391 de los 537). El webhook solo sube el contador
  con mensajes entrantes y nunca lo baja con los nuestros, salvo al abrir el chat en el CRM.
- **Números en mensajes:** la tarjeta de contacto tenía un enlace `tel:` directo; los números escritos en el texto no
  eran tocables.

## Cambios en esta rama (`claude/crm-tres-arreglos`)
- `taller-app.js` (p22) + CSS en `taller.html`: números dominicanos (809/829/849, con o sin +1) e internacionales con +
  dentro del texto, y el número de la tarjeta de contacto, se vuelven enlaces `.wa-tel`. Al tocarlos sale el menú
  (mismo estilo que el menú del mensaje): **Escribir por WhatsApp** (wa.me), **Llamar** (tel:) y **Copiar número**.
  Botones de 44 px; se cierra al tocar fuera o con Esc. Pruebas: 8/8 casos de detección (no toma órdenes ni RD$),
  menú dentro de la pantalla a 390 px (`tel-390.png`).
- `supabase/functions/social-webhook/index.ts`: antes de crear un hilo busca uno existente del mismo participante en
  la cuenta y lo reutiliza; el nombre del cliente solo se toma de mensajes entrantes.
- `supabase/functions/social-importar-historial/index.ts`: misma regla al importar.
- `supabase/functions/instagram-webhook/index.ts`: un mensaje nuestro (CRM, app o automatización) pone el contador en 0.
- `docs/sql/2026-10-23-crm-facebook-duplicados-e-instagram-badges.sql`: reparación de datos (unir los 38 pares y bajar
  los 165 contadores). **No se ejecutó.**

## Qué falta y necesita el OK del dueño
1. «Publícalo» para el frontend (menú de números).
2. Desplegar las 3 Edge Functions (social-webhook, social-importar-historial, instagram-webhook).
3. Correr la reparación de datos del SQL (es tocar historial: une hilos y baja contadores).

## Riesgos
- Las Edge Functions no se pudieron compilar aquí (no hay Deno); se revisaron a mano y con balance de llaves. Tras el
  despliegue, vigilar los logs del primer mensaje de Facebook e Instagram.
