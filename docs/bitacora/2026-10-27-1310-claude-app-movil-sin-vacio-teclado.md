# 2026-10-27 13:10 (RD) — App del celular: sin franja vacía sobre el teclado

## Pedido
Dueño (video del iPhone): «Ese vacío se puede poner que sea lo más parecido a la app original».

## Diagnóstico
Con el teclado abierto se veía una franja vacía entre la caja de escribir y el teclado. Debajo del chat la página tiene
relleno: `.content` `padding-bottom: max(20px, env(safe-area-inset-bottom))` (34 px en iPhone) + 8 px de `#v-crmLinea` +
bordes. Al enfocar la caja, iOS desplaza la página hasta el final y ese relleno queda a la vista. En el banco: 33 px de página
debajo del chat (sin zona segura); en el iPhone, unos 45.

La otra barra (flechas ˄ ˅ y ✓) es la barra de formularios de iOS: la pone Safari en las páginas web y apps instaladas; una
página no la puede quitar.

## Cambio
`taller-app-movil.js`: marca `html.bc-teclado` mientras el teclado está abierto (misma regla que `_waActualizarAltoVisual`:
alto − visualViewport > 160). `taller-app-movil.css`: con esa marca, `.content` y `#v-crmLinea` sin relleno abajo y la
caja de escribir con 6 px. Al cerrar el teclado todo vuelve como estaba. `?v=20261027-m2`.

## Pruebas
Banco a tamaño iPhone 13 con un chat abierto: espacio debajo del chat 33 px → **4 px** con teclado, 33 px al cerrarlo.
`app-movil.cjs` sigue en TODO BIEN.

## Estado
Rama `claude/app-movil-teclado`, PR sin publicar (espera «publícalo»).
