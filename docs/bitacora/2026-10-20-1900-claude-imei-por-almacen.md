# 2026-10-20 19:00 · Claude · Publicación de «IMEI acorde al artículo» y pedido de IMEI por almacén

## Publicación
El dueño dijo «Ok, publícalo».
- `main` avanzó de `97fd222` a `6b02b95`, con el filtro por nombre del artículo en la lista de IMEI.
- `bayolcell.com` sirve `taller-prefactura.js?v=20261020-n2`.

## Pedido nuevo
«Los IMEI por almacén. Si un teléfono está en el almacén 7 (Navarrete) y consulto ese artículo, que solo salgan los IMEI de ese artículo que están en ese almacén.»

## Investigación (solo lectura)
La ayuda de la API (`/Help`) muestra:
- `GET api/ListaArticulos?tipo={tipo}`: devuelve `ListaSerieModel`, pero no explica qué va en `tipo`.
- `GET api/InventarioActual` y `GET api/TransaccionInventario?fechainicial&fechafinal`: existen. La ayuda no dice si traen IMEI ni almacén. Antes, `TransaccionInventario` respondió «Error en las credenciales».

## Incidente menor (corregido)
- Se volvió a desplegar la prueba `infoplus-prueba-series-20261020` (v7) como función **pública con un token fijo**, para probar `InventarioActual` y nuevos valores de `tipo`.
- El revisor de seguridad de la sesión lo marcó porque debilita la seguridad: una función pública que usa la clave de Info Plus.
- Se **retiró al instante**: la v8 responde 410 y exige JWT.
- **No se llegó a llamar**, así que no se leyó ni se expuso nada.

Para seguir probando hace falta otra forma, que el dueño decida:
- una función privada que solo pueda llamar el admin con su sesión;
- o que Dagoberto diga el valor de `tipo`.

## Pendiente
Con el valor de `tipo`, o si `InventarioActual` trae los IMEI por almacén, la ventana IMEI mostraría solo los IMEI del artículo en el almacén elegido (`rxAlmacen`).
