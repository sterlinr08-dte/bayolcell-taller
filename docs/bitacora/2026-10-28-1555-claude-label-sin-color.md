# 2026-10-28 15:55 — Claude — Label del equipo reacondicionado sin el color

## Pedido del dueño
Mandó una captura de «Imprimir label», donde el modelo salía como «iP 13 PRO MAX Verde alpino». Pidió: «Vamos a quitar lo del color cuando se vaya a imprimir el label».

## Causa
`imprimirLabelEquipo()` armaba el modelo con `modelo + color`. Lo hacía porque antes la capacidad (GB) a veces se guardaba en «color». Desde que existe «Poner colores», ahí va el color de verdad (Verde alpino, Plata…), y se colaba en el modelo del label.

## Cambio (`taller-app.js` → `taller-app.min.js?v=20261028-l1`)
- El modelo del label sale solo de `modelo`.
- Del campo «color» solo se toma la capacidad, y solo si el equipo no la tiene en otro lado (datos viejos con «256GB» en color).

## Pruebas
`scripts/pruebas/label-sin-color.cjs`, 3 de 3:
- iPhone con color real → «iP 13 PRO MAX» y «128GB»;
- dato viejo con GB en color → «iP 12 PRO MAX» y «256GB»;
- Samsung con color → «S23 ULTRA» y «256GB».

## Rama / PR
`claude/label-sin-color`, PR sin publicar.
