# 22-oct-2026 14:30 · Conversación anterior dentro del chat (corrige la bit. 1335)

## Pedido del dueño
«Sobre la conversación no era así, sino en la ventana normal para chat.» La hoja aparte publicada en la bit. 1405 no era lo que quería.

## Cambio (rama `claude/referido-en-chat`, sin publicar)
- `crm-wa-identico.js` w18:
  - Se quita la hoja «Conversación anterior».
  - Los mensajes de la otra sucursal se pintan dentro de `#waMessagesScroll`, arriba de los de esta línea:
    franja «Conversación en Moca · Reparación», separadores de día, burbujas de solo lectura (cliente a la izquierda, «BayolCell · línea» a la derecha) y franja final «Referido a esta línea por … · fecha» con la nota.
  - Se vuelve a poner cada vez que el CRM repinta el chat (el vigilante ignora `.bcwa-refprev`). No toca `_waMensajes`, el envío ni Realtime.
  - Si el chat estaba al fondo, sigue al fondo; el botón «Ver conversación anterior» del aviso sube hasta el inicio de esa parte.
- `crm-wa-identico.css`: estilos `.bcwa-refprev` / `.bcwa-rp-*`; se borran los de la hoja.
- `crm-marketing-consent.js` (w18) y `taller.html` (u8): versiones de caché.
- La RPC `whatsapp_referido_historial` no cambia.

## Pruebas (Playwright, datos de ejemplo, 390 y 1280 px)
- 8 mensajes anteriores dentro del chat, sin scroll lateral, sin errores.
- Tras repintar el chat como lo hace el CRM, el bloque vuelve a aparecer una sola vez.
- Se corrigió «Invalid Date» en la franja final cuando falta la fecha del traspaso.

## Pendiente
- Publicar cuando el dueño diga «publícalo».
