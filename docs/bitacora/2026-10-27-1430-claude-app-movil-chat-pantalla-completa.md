# 2026-10-27 14:30 (RD) — App del celular: chat a pantalla completa, como WhatsApp

## Pedido
Dueño, con 6 capturas del iPhone (app instalada): sigue habiendo vacíos. Se ven: (1) con el teclado, una franja vacía
entre la caja de escribir y la barra ˄ ˅ ✓; (2) dentro del chat, la barra azul «CRM» arriba y el chat dentro de una tarjeta
con márgenes; (3) al bajar en el chat, la cabecera del contacto se sale por arriba.

## Cambio (solo `taller-app-movil.js/.css`, `?v=20261027-m3`)
- `html.bc-app` = app instalada o permiso «Solo Prefactura y CRM».
- Con `#v-crmLinea.chat-abierto` (≤1024 px): `.wa-shell` fijo a pantalla completa, alto = lo visible (`visualViewport`:
  `--bc-vv-h`, `--bc-vv-top`), sin bordes ni márgenes; la barra azul se oculta (vuelve al regresar a la lista); la página de
  atrás no se desplaza; la cabecera respeta la zona segura de arriba y la caja de escribir la de abajo (6 px con teclado).
- No toca el envío, Realtime, la lista ni el cálculo de alto del CRM (`_waActualizarAltoVisual` sigue igual; la regla fija
  manda solo con el chat abierto en la app).

## Pruebas (banco, iPhone 13)
Chat abierto: ocupa 0,0 → 390×664; arriba, al medio y abajo lo que se ve es el chat (no la barra). Con «teclado» simulado a
380 px el chat termina en 380. Al volver a la lista: tarjeta y barra azul como antes. `app-movil.cjs`, `solicitudes-crm.cjs`
y `prefactura-confiable.cjs` bien. Falta prueba en el iPhone real.

## Estado
Rama `claude/app-movil-chat-pantalla`, PR sin publicar.
