# 2026-10-20 18:00 · Claude · Publicación: correcciones de la Prefactura

## Pedido del dueño
«Publícalo».

## Qué se publicó
`main` avanzó de `664036f` a `e5f8391` sin mezcla, desde la rama `claude/prefactura-limpia`. Incluye:
- **Buscador:** el botón del detalle ya no dice «Elegir».
- **Accesorios sin IMEI:** covers, forros, cases, cristales y otros accesorios ya no cuentan como celular, así que no piden IMEI (`_abCat`).
- **Lupa:** una sola lupa arriba, al lado izquierdo, para buscar prefacturas. Se quitaron los botones repetidos.
- **Etiqueta de estado:** dice «Crear», en versión corta con punto de color.
- **Cliente de contado:** dice «CONTADO: 1».
- **Precio del cliente:** «CLIENTE FINAL», «POR MAYOR» y «EXTREMO».
- **Nº y fecha:** «Nº Nueva · fecha» como texto simple.
- **Números:** con la letra del sistema.
- **Celular:** los botones dicen «Buscar artículo» y «Servicio».

## Verificación
`bayolcell.com/taller.html` ya sirve:
- `taller-prefactura` css/js m2;
- `taller-app.js` h2;
- `taller-recepcion.js` f2;
- «CLIENTE FINAL».
