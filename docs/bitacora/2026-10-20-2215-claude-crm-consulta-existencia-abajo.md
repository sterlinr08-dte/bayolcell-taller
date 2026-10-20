# 2026-10-20 22:15 · Claude · CRM «Consulta»: almacenes y cantidades en la línea «Existencia»

## Pedido del dueño
«Ponlo mejor en la parte inferior, en la línea donde dice Existencia.»

## Cambio (`crm-consulta-precio.js` f1 y `.css` f2)
- **En la fila:** vuelve la columna «Existencia» con «Disponible» o «Sin stock».
- **Al tocar el artículo:** debajo del precio de cliente final queda una sola línea:
  - «EXISTENCIA», luego cada almacén con su cantidad, por ejemplo «Santiago 160», «Moca 32»;
  - al final, «Total 216».
- **Arreglo en el celular:** la regla de columnas de la PC también se aplicaba en el celular y partía el nombre del artículo. Ahora el celular usa dos columnas: el nombre a la izquierda y el precio a la derecha.

## Pruebas
`crmprecio` 21/21. Se revisaron las capturas a 1280 y 390 px.

## Estado
Rama `claude/prefactura-limpia`, sin publicar.
