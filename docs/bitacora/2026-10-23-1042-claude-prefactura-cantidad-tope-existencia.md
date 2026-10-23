# Prefactura: la cantidad no pasa de la existencia del almacén

**Dueño (foto en PC):** 14 unidades de un celular con solo 2 en Moca, importe RD$ 54,600 → «No debería de sumar si lo hay dos».

## Diagnóstico
- `_rpCant()` (taller-app.js) solo exigía mínimo 1; dejaba subir con «+» o escribiendo cualquier número.
- El guardado sí se bloqueaba (`_rpProblemas` → «pides 14 y hay 2»), y la fila mostraba el aviso rojo, pero el total ya sumaba.
- Agregar un artículo con existencia 0 ya estaba bloqueado desde el 22-oct.

## Cambio (taller-app.js, p29)
- `_rpCant(i, v)`: si la existencia del almacén (`_rpStockItem`) es ≥ 1 y se pide más, la cantidad **se queda en la existencia**
  y sale el aviso «Solo hay 2 en Moca.». Si la existencia es 0 (artículo que entró antes de cambiar de almacén), se deja la
  cantidad y el aviso rojo de la fila sigue bloqueando el guardado.
- Texto del bloqueo: «pide … y hay …» (antes «pides»).

## Pruebas (banco local, existencia simulada = 2)
| Acción | Antes | Ahora |
|---|---|---|
| «+» de 2 a 3 | 3 | 2 + aviso «Solo hay 2 en …» |
| Escribir 14 | 14, importe RD$ 54,600 | 2, importe RD$ 7,800 |
| Existencia 0 y escribir 5 | 5 | 5 con aviso rojo (guardar bloqueado, como antes) |
Sin errores de JS.

## Publicación
`claude/prefactura-pc` → `main`.
