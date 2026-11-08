# Prefactura: logos de marca en «Buscar artículo» (08-nov-2026, 16:45 RD)

## Pedido
El dueño mandó capturas de «Buscar artículo» (prefactura) y del catálogo «Artículos Info Plus», donde ya salen los logos (Samsung, Apple…): «Vamos a poner igual, al consultar un artículo, que salgan los logos de las marcas».

## Cambio
- `taller-recepcion.js` (g17): cada fila del buscador lleva el logo de su marca antes del nombre.
  - Usa los mismos logos y la misma detección que el catálogo (`window.BayolMejorasRef`, de `taller-mejoras-ref.js`, Simple Icons CC0): Apple, Samsung, Xiaomi/Redmi, Motorola, Huawei, Honor, Google, OnePlus, OPPO, vivo, Nokia, LG, Sony y Lenovo.
  - Si la descripción dice **réplica, copia, genérico, compatible o «tipo»**, no se pone logo, para no confundir al cliente.
  - Si la marca escrita debajo es la misma que dice el logo (por ejemplo «SAMSUNG» o «IPHONE»), se quita el texto repetido.
- `taller-recepcion.css` (g12): estilo `.pk-logo`.
- No cambia precios, existencia, el botón de agregar ni la búsqueda.

## Pruebas
Maqueta a 390 px con el CSS real y artículos de la captura:
- Apple en «AIRPODS S20» y en las baterías de iPhone.
- Samsung en «CABLE 7G 8G FOXCOON», que en Info Plus tiene la marca SAMSUNG; en el catálogo pasa lo mismo.
- Ningún logo en «AIRPOD … RÉPLICA EXACTA» ni en «AIR MAX APPLE RÉPLICA».
- ZTE no tiene logo en la colección.

## Estado
- Rama `claude/buscar-logos-marca`. No publicado: espera el botón «Publícalo».
