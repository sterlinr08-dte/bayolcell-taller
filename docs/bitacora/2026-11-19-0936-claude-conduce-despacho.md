# 19-Nov-2026 09:36 (RD) — Claude — «Imprimir conduce» decía «No se encontró el despacho»

## Pedido
- El dueño mandó una captura (19-nov, 9:32 a. m.):
  - ventana «Despacho #DA00003856 · reporte» (Taller → Oficina Santiago, 1 equipo, iPhone 15 Plus);
  - al tocar «Imprimir conduce», el aviso rojo «No se encontró el despacho para imprimir.».

## Causa
- `imprimirDespacho(id)` (`taller-app.js`) buscaba el despacho solo en `_despHistRows`.
- Esa lista se llena al abrir el historial de Despacho de Almacén.
- Un despacho recién hecho desde Reacondicionados (`_despGuardarHistorial`) sí se guardaba en `despachos_almacen`, pero no entraba en esa lista. Por eso no se encontraba.

## Cambios (`taller-app.js`)
- `_despGuardarHistorial`: el despacho recién guardado se agrega al principio de `_despHistRows`.
- `imprimirDespacho` ahora es `async`. Si el id no está en la lista:
  - abre la ventana de impresión al momento («Preparando el conduce…»), para que el navegador no la bloquee;
  - busca la fila por id en `despachos_almacen` y la imprime;
  - si de verdad no existe, cierra esa ventana y avisa como antes.
- `taller.html`: `taller-app.min.js?v=20261116-fd1` → `?v=20261119-dsp1`, para que los equipos bajen el archivo nuevo. El robot `minificar.yml` regenera el `.min.js` al publicar.
- Sin cambios en la base, en Info Plus ni en los despachos ya hechos.

## Pruebas
- Las dos funciones reales del archivo, en un navegador con la base simulada:
  - despacho que no estaba en la lista: 1 ventana, con el conduce DA00003856 e IMEI, se imprime y no queda «Preparando…»;
  - despacho inexistente: aviso «No se encontró…» y la ventana se cierra.
- Sin errores de consola.
- **No verificado** con la base real del taller (no se inició sesión en la cuenta del dueño).

## Estado
- Rama `claude/conduce-despacho`. Espera el «Publícalo».
