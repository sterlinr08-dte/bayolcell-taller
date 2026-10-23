# 2026-10-23 07:31 (RD) — Buscador: en el detalle solo salen los almacenes con existencia (corrección)

## Pedido del dueño
Tras publicar el buscador smart: «Cuando nos referíamos a solo disponible, era que donde están los almacenes que dicen
cero, solamente se iban a visualizar los almacenes que tienen disponible. No hacer un filtro de solo disponible».

## Cambio (`taller-recepcion.js` g6, `taller-recepcion.css` g4, `taller.html`)
- Se quitó el botón «Solo disponibles» del campo (además pisaba el texto del campo en el celular) y su preferencia.
- En el detalle del artículo, las fichas de existencia muestran el almacén elegido siempre (en rojo si está en 0) y los
  demás solo si tienen existencia. Si ninguna otra tienda tiene, dice «Sin existencia en las demás tiendas».
- Se mantiene lo demás del buscador smart: sin existencia al final y en gris, búsqueda tolerante, atajos, aviso de precio.

## Pruebas
- Banco local, 390 y 1280 px: 38/38 (3 casos nuevos del detalle; el del botón ahora comprueba que no existe).
- Captura: `detalle-390.png` (BATERIA SAMSUNG A20…: Oficina Santiago 29 · Garantía China 1 · Moca 4; sin los tres en 0).

## Publicación
- Directo en `main` (corrección de lo publicado hoy con su OK). Bitácora anterior: 2026-10-23-0115.
