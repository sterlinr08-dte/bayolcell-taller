# 2026-10-28 10:15 — Claude — Código de vendedor Info Plus: avisos al guardar el empleado

## Pedido del dueño
- Con una captura de «Nuevo Empleado» (OMIR, Servicio al Cliente, Moca) pidió: «que el código de empleado se pueda jalar desde Info Plus».
- Después preguntó: «¿Y si lo pongo manual?». Se le ofrecieron dos avisos y respondió: «Sí, agrégalo».

## Diagnóstico
- La API de Info Plus **no deja leer la lista de vendedores**: `vendedor` responde «Error en las credenciales» con nuestra clave (ya estaba anotado en MEMORIA-TECNICA). Por eso no se pueden traer nombres.
- Las ventas copiadas (`infoplus_ventas.codempleado`) sí traen el código. Hay 13 códigos distintos.
  - Asignados: 249, 748, 1020 y 1192.
  - Sin dueño: 697, 750, 6, 833, 983, 1134, 71 y 835. El 697 es el que más vende.

## Cambio (`taller-app.js` → `taller-app.min.js`, `?v=20261028-c1`)
- El código sigue siendo **manual**. Antes de guardar, `_tecAvisosCodInfoplus()` muestra dos avisos que no bloquean (la persona elige «Corregir» o «Guardar igual»):
  1. el código ya lo tiene otro empleado («sus prefacturas y ventas se mezclan»);
  2. Info Plus nunca ha usado ese código en una venta (busca en `infoplus_ventas`, que pueden leer los usuarios conectados); si la consulta falla, se guarda sin este aviso.
- `confirmar()`, la ventana de confirmar de todo el taller: sus botones pasan a `min-height:44px`. Medían 33 px en la PC y 40 px en el celular.

## Pruebas
- `scripts/pruebas/codigo-vendedor.cjs` (banco local, datos inventados) a 390 y 1280 px: 6 de 6 casos en cada ancho. Los casos son: código libre con ventas, repetido, el mismo empleado, nunca usado + Corregir, nunca usado + Guardar igual, y sin errores de JavaScript. Los botones del aviso miden 44 px.
- No se tocó la base de datos.

## Rama / PR
`claude/codigo-vendedor-avisos`, PR sin publicar.

## Pendiente
- Si Info Plus activa el permiso de «vendedor» en la clave de la API, se puede cambiar el campo por una lista con nombre y código.
