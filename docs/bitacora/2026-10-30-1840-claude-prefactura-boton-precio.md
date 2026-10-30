# Prefactura · Buscar artículo: precio y agregar en un solo botón (30-oct-2026, 18:40 RD) — rama, SIN publicar

**Dueño (captura):** «el botón naranja lo vamos a poner donde está el precio arriba para que no sea redundante. Hazlo smart ese botón.»

**Antes:** cada fila tenía el precio en azul + un «+» naranja, y al abrir la fila salía otro botón naranja grande con el mismo precio (tres cosas para lo mismo).

**Ahora (`taller-recepcion.js` g11 / `.css` g8):**
- La fila tiene **un solo botón naranja con el precio y «+»**; tocarlo agrega el artículo. El detalle ya no trae botón abajo.
- **Smart:** dice «×N» si el artículo ya está en la prefactura; si no hay existencia se apaga y dice «Sin stock»; sin precio dice «Agregar».
- **Administrador:** en el detalle toca «Cliente final / Por mayor / Extremo» y el botón cambia a ese precio (azul, con el nombre del nivel); la línea nueva se agrega con ese precio (usa `_rpPrecio`, mismo permiso de siempre). Los empleados ven los niveles solo como información.
- Encabezado «Precio · agregar»; en el celular el botón queda a la derecha del nombre.

**Pruebas:** `scripts/pruebas/prefactura-boton-precio.cjs` 29/29 (390 admin, 1280 admin, 1280 empleado): botón 44 px, sin precio repetido, sin stock apagado, sin botón abajo, nivel Por mayor → agrega a RD$600, empleado agrega a RD$1,500, sin desbordes ni errores. `prefactura-confiable.cjs` sin errores.
