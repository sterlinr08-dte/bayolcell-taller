# 2026-10-20 21:45 · Claude · CRM: «Precios» pasa a «Consulta» y cada artículo muestra sus almacenes

## Pedido del dueño
Mandó una captura del botón «Precios» del chat y escribió: «cambiar el nombre Precios y poner Consulta; y en la consulta ver en qué almacén están los artículos».

## Cambios (`crm-consulta-precio.js` y `.css`, versión 20261020-e1)
- **El botón** de la cabecera del chat ahora dice «Consulta», con ícono de lupa. La ventana también usa la lupa.
- **Cada fila** muestra a la vista los almacenes donde hay existencia, como píldoras: Santiago, Moca, Navarrete, Taller, Garantía China, 2do Nivel. Antes decía solo «Disponible».
  - Si no hay existencia en ningún almacén, dice «Sin stock».
  - Siguen sin cantidades, como decidió el dueño.
  - La columna se llama «Almacén».
  - En el celular, los almacenes van en una línea debajo del nombre.
- **Al tocar** un artículo sigue saliendo el detalle: precio de cliente final y existencia.

## Pruebas
`crmprecio` 21/21 a 1280 y 390 px. Se actualizó la prueba de la fila: ahora espera Santiago y Navarrete en lugar de «Disponible».

## Estado
Rama `claude/prefactura-limpia`, **sin publicar**. Va junto con las etiquetas con cantidades y los acuses («Ok») que ya no dejan el chat pendiente.
