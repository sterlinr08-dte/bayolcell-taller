# 2026-10-20 15:15 — Claude — CRM «Precios»: mismo panel que el buscador de la Prefactura (rama, sin publicar)

Sigue a `2026-10-20-1500-claude-crm-boton-precios.md`.

## Dueño
«Parecido al botón de consultar de prefactura.»

## Cambio (`crm-consulta-precio.js/.css` v 20261020-b1)
- La consulta ya no es una hoja lateral: es el mismo panel «Buscar artículo» de la Prefactura (`.bcrx-ppk`): «← Cerrar», campo
  naranja con ícono de escáner, columnas Código · Artículo · Existencia · Precio, fila resaltada al pasar, flechas/Enter.
- Tocar la fila abre el detalle: recuadro «Cliente final RD$ …» y fichas de los almacenes con existencia (sin cantidades).
- Existencia en la fila: «Disponible» / «Sin stock» / «Servicio». Celulares con la etiqueta «IMEI».
- Sin «+» de agregar: sigue siendo solo consulta (decisión del dueño). En celular ocupa la pantalla completa.

## Pruebas
`crmprecio.mjs` 20/0 con el chat real (390 y 1280).
