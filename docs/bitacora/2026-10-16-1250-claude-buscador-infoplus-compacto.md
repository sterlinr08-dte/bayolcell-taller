# Buscador de artículos Info Plus compacto — 16-oct-2026

**Pedido del dueño** (captura del buscador al agregar piezas a un iPhone 14): «Vamos a ajustar que se vea más pro, no muy grande».

**Problemas vistos:**
- Cada fila ocupaba unos 92 px: código, nombre, precio y costo, y existencias en 4 líneas. El precio salía repetido a la izquierda y a la derecha.
- La capa «buscador premium» (`bc-busqueda.js`) se montaba en este campo: halo grande y aviso «Esc» encima de las categorías, que quedaban cortadas.

**Cambios** (`taller-app.js`, `_abCard` y `_abStyles`, más una capa «Compacto» al final de los estilos):
- **Filas de 2 líneas, unos 49 px:**
  - línea 1: código + nombre;
  - línea 2: marca · «Lista» (solo si es distinta del precio de venta) · costo (solo el admin) · existencias por almacén.
- Precio de venta a la derecha; botones de editar y de agregar más pequeños.
- El campo de búsqueda lleva `data-bcbp-no`: vuelve al buscador propio del modal (gris, con «Ctrl K»), sin halo ni aviso encima. Las categorías se ven completas.
- Las fallas del equipo van en una sola franja.
- El modal pasa a 860 px de ancho, con menos relleno en cabecera, chips y pie.
- **Celular:** el nombre puede usar 2 líneas, sin icono, y el botón + va debajo del precio. El botón de editar precios no sale en el celular.
- Versión: `taller-app.js?v=20261016-ab1`.

**No se tocó:** la lógica de búsqueda, sincronización, elección ni edición de precios.

**Pruebas:** Chromium con 8 artículos de ejemplo, en 1920 px y en 390 px, sin errores. `node --check` sin errores.

**Rama:** `claude/buscador-ip-compacto`. **No publicado.**
