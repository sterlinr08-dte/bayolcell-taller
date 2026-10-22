# 22-oct-2026 17:30 · Buscador de artículos (Info Plus): filas como renglones de factura

## Pedido del dueño
«Vamos a poner en el modelo de agregar los artículos que se vean como si fuera en factura, en la parte visual, lineal horizontal.»

## Cambio (rama `claude/articulos-factura`, sin publicar)
- `taller-app.js` (p7), buscador `abrirBuscadorArticulos` (lo usa «Agregar piezas (Info Plus)» en la Ficha del Equipo, la prefactura y la recepción):
  - cada artículo es una sola línea con columnas alineadas: **Cód. · Artículo · Existencia · Precio · botones**; cabecera fija arriba;
  - el nombre va en una línea (se corta con «…» y el nombre completo sale al pasar el mouse); marca, precio de lista y costo (solo admin) debajo, chico;
  - existencia por almacén en la misma fila; precio alineado a la derecha; botones + y editar de 44 px;
  - en celular: código y nombre en la primera línea, existencia en la segunda, precio y + a la derecha (no hay cabecera);
  - se conserva la clase `.ab-card`, así que ↑ ↓ y Enter siguen funcionando.
- `taller.html`: `taller-app.js?v=20261022-p7`.
- No cambia la lógica de agregar, descontar ni editar precios.

## Pruebas (Playwright, datos de ejemplo)
| | 390 px | 1280 px |
|---|---|---|
| Alto de fila | 69 px | 61 px |
| Botón + | 44×44 | 44×44 |
| Cabecera | oculta | visible |
| Scroll lateral | no | no |
| Teclado ↓ Enter elige | sí | sí |
