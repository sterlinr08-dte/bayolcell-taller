# 22-oct-2026 17:50 · Ficha del Equipo: piezas del costo como renglones de factura

## Pedido del dueño
Mandó una foto del cuadro «Costo del equipo» (Piezas con costo y Piezas de Info Plus) y aclaró que el pedido anterior
(«lineal horizontal, como factura») era para ESA lista, no para el buscador. «No, eso no, me refiero a ponerlo más organizado.»
La rama `claude/articulos-factura` (buscador) queda sin publicar.

## Cambio (rama `claude/piezas-factura`, sin publicar)
- `taller-app.js` (p7):
  - nueva función `_piezasCostoHTML`: tabla «Pieza · Cant. · Costo · Total» con cabecera, una línea por pieza (nombre en una
    sola línea con «…»; etiqueta INFO PLUS / EXTERNA), fila final «Total piezas» y, para admin, lápiz y papelera de 44×44 px;
  - `_piezasDescuentoHTML` («Piezas de Info Plus»): mismas filas alineadas con cabecera «Pieza · Inventario»;
  - en celular se oculta la columna «Costo» (queda Cant. y Total) para que no se corte.
- `taller.html`: `taller-app.js?v=20261022-p7`.
- Sin cambios de lógica (mismos botones editar/quitar/descontar).

## Pruebas (Playwright, datos de ejemplo, 390 y 1280 px)
- Filas de 45 px; lápiz/papelera 44×44; sin scroll lateral; totales por fila y total general correctos; sin errores.
