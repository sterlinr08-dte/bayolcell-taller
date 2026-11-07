# Punto de equilibrio: selector de mes estilo iPhone (07-nov-2026)

**Pedido del dueño:** «El calendario se ve antiguo». Era el `<input type="month">` del navegador, que además salía en inglés («November 2026»).

## Cambio (`conta-equilibrio.js`, versión pe13, rama `claude/metas-periodo`)
- **Selector nuevo «‹ Noviembre 2026 ›»** (`#peMes`):
  - las flechas pasan al mes anterior o al siguiente;
  - el nombre del mes abre una tarjeta de vidrio (`#peMesPop`) con el año (‹ ›), los 12 meses en 3 columnas y el botón «Este mes»;
  - el mes escogido va en naranja y el mes actual lleva un contorno suave;
  - la tarjeta se cierra al tocar afuera o con Escape.
- Se conserva `#pe_mes` como campo oculto, así que `BayolEquilibrio.mes()` sigue igual, con la confirmación si hay cambios sin guardar.
- Animación: 180 ms con curva de salida, creciendo desde arriba. Con «reducir movimiento» solo se desvanece.
- **Medidas:** botones de 44 px, meses de 48 px y nombre del mes con letra de 16 px.

## Prueba (Playwright, 390 y 1280 px, con los estilos reales)
- La flecha anterior pasa a Octubre 2026.
- Al tocar «Sep» en la tarjeta, queda Septiembre 2026 (2026-09) y la tarjeta se cierra.
- No hay controles de menos de 44 px ni desplazamiento hacia los lados.
