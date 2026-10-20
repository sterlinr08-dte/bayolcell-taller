# 2026-10-20 22:05 · Claude · CRM «Consulta»: las existencias ya no salen dos veces

## Pedido del dueño
«¿Por qué salen en dos partes las existencias?»

## Cambio (`crm-consulta-precio.js`, versión 20261020-e3)
- Los almacenes con su cantidad quedan solo en la fila del artículo.
- Al tocar el artículo, el detalle muestra solo el precio de cliente final y «Total en almacenes N».
- Se quitó la etiqueta «Existencia» del detalle.

## Pruebas
`crmprecio` 21/21.

## Estado
Rama `claude/prefactura-limpia`, sin publicar.
