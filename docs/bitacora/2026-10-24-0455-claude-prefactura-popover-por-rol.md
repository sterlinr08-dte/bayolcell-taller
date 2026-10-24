# 2026-10-24 04:55 (RD) — Prefactura: ficha del artículo solo deja usar el precio del nivel elegido y editar la descripción al administrador (rama, SIN publicar)

## Pedido del dueño (3 fotos)
«Al hacer clic en un artículo se puede modificar la descripción, y a un cliente final se le puede poner precio al por mayor y
extremo.»

## Qué cambió (`taller-prefactura.js` i24→i25, `taller-prefactura.css` n11→n12, `abrirPop()`)
- **Empleados:** en la ficha del artículo solo el precio del nivel elegido arriba («Precio: Cliente final») tiene botón; los
  de Por mayor y Extremo se ven en gris, solo como referencia. La nota dice «Solo se puede usar el precio del nivel elegido
  arriba». El campo «Descripción» no aparece.
- **Administrador:** como antes (puede usar cualquier nivel y cambiar la descripción). El dueño es administrador, por eso en
  su pantalla seguirá viendo los tres botones.

## Pruebas (banco local, `pf-pc/popover.cjs`)
| Rol | Botones de precio | Referencia en gris | Edita descripción | Clic en «Extremo» |
|---|---|---|---|---|
| Empleado | solo 800 (nivel 1) | 300, 250 | no | el precio sigue en 800 |
| Admin | 800, 300, 250 | — | sí | el precio pasa a 250 |
0 errores JS.

## Pendiente / a decidir por el dueño
- La casilla «Precio» de cada línea sigue dejando escribir cualquier cifra a cualquier usuario (sirve para servicios con
  precio libre). Si quiere, se bloquea para empleados en artículos del catálogo.
