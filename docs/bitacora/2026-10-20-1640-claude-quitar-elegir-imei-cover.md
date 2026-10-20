# 2026-10-20 16:40 · Claude · Quitar «Elegir» y no pedir IMEI en covers ni forros

## Pedido del dueño
El dueño mandó una captura del detalle de «COVER IPHONE XR TRANSPARENTE»:
- «Quitar la palabra elegir, no hace falta ese tipo de cosas».
- También pide corregir lo que esté mal. En la captura el cover salía con la etiqueta «IMEI», y eso está mal.

## Diagnóstico
- `_abCat` (`taller-app.js`) clasificaba como `celular` todo lo que dijera IPHONE, REDMI, SAMSUNG y similares, salvo una lista de exclusiones.
- Esa lista no tenía COVER, CASE, FORRO, ESTUCHE, CARCASA, CRISTAL, TEMPLADO, MICA, LENTE ni SOPORTE.
- Resultado: un cover salía con la etiqueta IMEI.
- Además la Prefactura le pedía serial/IMEI al agregarlo (`it.serial = true`, línea ~20281). Lo mismo pasaba en la consulta del CRM.

## Cambios
- `taller-recepcion.js`: el botón del detalle ahora muestra solo «⊕ RD$ …», sin la palabra «Elegir». Para lectores de pantalla queda `aria-label="Agregar"`.
- `taller-app.js` `_abCat`:
  - nuevas exclusiones para que no cuente como celular: COVER, CASE, FORRO, ESTUCHE, CARCASA, TAPA, MICA, CRISTAL, TEMPLADO, LENTE, SOPORTE, HOLDER, AUDÍFONO, AURICULAR, CORREA, MALLA, STYLUS, LÁPIZ;
  - COVER, CASE, FORRO, ESTUCHE y CARCASA se agregan a la lista de accesorios.
- `taller.html`: versiones `taller-app.js` 20261020-h2 y `taller-recepcion.js` 20261020-f2.

## Pruebas
- Clasificación revisada:
  - COVER IPHONE XR → accesorio;
  - CASE, FORRO y CRISTAL TEMPLADO → accesorio;
  - CELULAR IPHONE 13, OUKITEL C62 GT y REDMI NOTE 13 → celular;
  - PANTALLA → pantalla.
- `pfvent` 8/8, `pftest` 49/49, `crmprecio` 21/21.

## Estado
En la rama `claude/prefactura-limpia`. Pendiente del «publícalo» del dueño.
