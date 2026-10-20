# 2026-10-20 16:15 · Claude · Publicación en bayolcell.com

## Pedido del dueño
«Publícalo».

## Qué se publicó
Se adelantó `main` de `f600eaf` a `0904944`, sin mezcla, desde la rama `claude/prefactura-limpia`. Entraron 7 commits:
- almacén fijo para empleados con almacén asignado (solo el admin lo cambia);
- vendedor al pie, junto a «Pedir reseña»;
- la ⓘ en lugar del aviso amarillo de «usuario no enlazado»;
- botón «Precios» en el CRM: solo consulta, con precio de cliente final y dónde hay existencia;
- buscador de la Prefactura y consulta del CRM como ventanas emergentes;
- temática NEXUS en las dos ventanas.

## Verificación
`bayolcell.com/taller.html` ya sirve `crm-consulta-precio.js?v=20261020-d1` y `taller-prefactura.css?v=20261020-k1`.

Las pruebas del banco local ya habían pasado: crmprecio, pfvent, pftest, pfopc y almfijo.

## Pendiente
Con Dagoberto:
- crédito y mínimo por nivel;
- comentario;
- descuentos;
- el valor `tipo` de la lista de IMEI;
- la serie de prueba 355617283201152.
