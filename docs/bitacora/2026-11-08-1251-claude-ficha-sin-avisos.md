# Ficha del artículo: sin «Últimas», «aquí» ni «Agotado» (g20–g22)

- **Pedido del dueño:** después de ver la ficha como la ve un empleado: «Quitar últimas aquí», «Quitar aquí» y «Quitar agotado por si marca 0 es lo mismo que agotado».
- **Cambio** (`taller-recepcion.js`, `buscadorArticulos` → `detalleHTML`): la fila de la tienda actual muestra solo el nombre y la cantidad. Se ven en rojo cuando hay 0.
  - Se quitaron la etiqueta «Últimas» (≤3), la palabra «aquí» y la etiqueta «Agotado».
  - Las clases `.pk-aq-t` y `.pk-aq-av` quedan sin uso en el CSS. No hacen daño.
- **Versión:** `taller.html` carga `taller-recepcion.js?v=20261108-g22`.
- **Rama:** `claude/ficha-microcopy`. Sigue la entrada `2026-11-08-1755-claude-ficha-microcopy.md`.
- **Estado:** sin publicar; el dueño respondió «Todavía no».
- **Pruebas:** arnés `ficha2.html` a 390 px, como empleado y como admin.
  - Ningún botón mide menos de 44 px.
  - El detalle mide 156 px (ZTE) y 277 px (S8).

## Adición (g23)
- Pedido: «Quitarlo» (el «−150» debajo de Por mayor y Extremo). Ya no se muestra la diferencia con el precio del cliente final; el admin sigue viendo su ganancia «+X · Y%».
- `taller.html` carga `taller-recepcion.js?v=20261108-g23`. Arnés a 390 px: ningún botón <44 px.
- **g24** — Pedido: «Mostrar el mínimo». Debajo de cada precio ahora sale «Mín N», que es el mínimo del nivel (`a.niveles_min`, el que se guarda con «Editar precios»; es el mismo tope de `_rpPrecioMin`). Solo aparece si hay un mínimo menor que el precio. Lo ven el admin y el empleado.
