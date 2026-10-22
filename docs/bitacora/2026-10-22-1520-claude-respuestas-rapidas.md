# 22-oct-2026 15:20 · Respuestas rápidas en el CRM de WhatsApp

## Pedido del dueño
«Publícalo, agrega la opción de poder agregar respuestas rápidas.»
- Publicado en `main` (1cdf755): conversación anterior dentro del chat (bit. 1430) y transferir chats sin número (bit. 1450). Verificado en vivo: `taller.html` carga u8 y p4.

## Diagnóstico
- El menú «/» (`crm-financiamiento-quick-reply.js`) ya se llamaba «Respuestas rápidas y ubicaciones», pero solo traía /financiamiento (fijo en el código) y las ubicaciones de las sucursales. No había forma de guardar respuestas propias.

## Cambio (rama `claude/respuestas-rapidas`, sin publicar)
- Base (ya aplicado): tabla `whatsapp_respuestas_rapidas` con RLS, autor por disparador, atajo único sin «/» ni espacios. Migración `20261022151500_respuestas_rapidas.sql`.
  - Ven y crean: administradores y empleados activos. Editan o borran: quien la creó o un administrador.
- `crm-financiamiento-quick-reply.js` (r1):
  - Las respuestas guardadas salen primero en el menú «/», con búsqueda por atajo o texto.
  - Al elegir una, el texto va a la caja de escribir (no se envía solo) y `{nombre}` se cambia por el primer nombre del cliente.
  - Al final del menú: «Nueva respuesta rápida» y «Administrar respuestas rápidas» (ventana con Atajo, Texto, lista, editar y borrar).
- `taller-app.js` (p5): botón ⚡ en la barra de escribir; abre el mismo menú. Si ya hay texto escrito, abre la ventana para guardarlo como respuesta.
- `crm-marketing-consent.js` (u9) y `taller.html`: versiones de caché.

## Pruebas
- Base (como empleadas reales, deshecho): Michelle crea `/garantiapantalla`; la de Navarrete la ve; atajo repetido bloqueado; anónimo sin acceso.
  - La prueba con UPDATE/DELETE colgó el conector MCP (falla conocida); se verificó que no quedó nada (0 filas, 0 sesiones). Editar/borrar se revisó en las políticas.
- Playwright 390 y 1280 px con datos de ejemplo: menú con respuestas, financiamiento, sucursales, nueva y administrar; filas ≥44 px; /gar + Enter pone «Hola ToNnY, …»; crear guarda y lista; solo las propias tienen lápiz y papelera (44×44); campos 48 px y 16 px; Guardar 54 px; atajo repetido avisa; sin scroll lateral ni errores.
