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

## Publicado 24-oct 00:50 (RD) — dueño: «Publícalo y bloquea el precio libre para empleados solamente en servicio»
- PR #113 (CI en verde) pasado a `main`.
- Añadido en la misma entrega: la casilla «Precio» de cada línea queda de **solo lectura para empleados en artículos del
  catálogo**; en líneas de **Servicio** sí pueden escribir el precio. El administrador, libre. Doble candado: en la casilla
  (`precioLibre()` en `taller-prefactura.js` i26, estilo en css n13) y en `_rpPrecio()` (`taller-app.js` q2), que avisa
  «El precio del catálogo no se cambia. Pida al administrador.»
- Prueba (banco local, `pf-pc/precio-libre.cjs`): empleado → catálogo solo lectura y el precio no cambia (800), servicio
  editable (999); admin → ambos editables. 0 errores JS.
