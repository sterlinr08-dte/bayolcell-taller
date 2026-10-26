# Inventario, Artículos, Etiquetas e Inventario físico: tablas legibles en el celular — Claude (26-oct-2026)

## Pedido
El dueño pidió 10 agentes para la parte gráfica del taller. Este es el agente 3. Le tocaron Inventario, Artículos, Etiquetas
e Inventario físico (`v-inventario`, `v-articulos`, `v-etiquetas`, `v-invfisico`). Lo pedido:
- tablas legibles a 390 px (cada fila como tarjeta);
- encabezados sin mayúsculas forzadas y números con `tabular-nums`;
- existencia por almacén clara y botones de 44 px o más;
- sin cambiar cómo se leen los datos de Info Plus.

## Qué se encontró (banco local, Supabase simulado, 5 artículos de prueba)
- **Artículos (Info Plus), 390 px:** la tabla `#infoplusTable` no tenía rótulos (`data-label`). En el celular cada artículo
  salía como 8 renglones sueltos, sin decir cuál era el costo, el precio o la existencia del Taller. Medía unos 346 px por
  artículo. Los almacenes salían en MAYÚSCULAS (`.badge`), igual que el botón «Cargar existencia Taller».
- **Inventario físico (conteo), 390 px:** la tabla tampoco tenía rótulos. «Sistema 4 / Conté / Diferencia» salían como
  números sueltos y los cuadros de resumen («CONTADOS», «FALTANTE»…) estaban en MAYÚSCULAS.
- **Inventario:** sí tenía rótulos, pero en MAYÚSCULAS de 10,5 px. «Referencia» vacía ocupaba un renglón.
- **Etiquetas:** 13 rótulos de campo y subtítulos en MAYÚSCULAS (regla general `label{text-transform:uppercase}` y estilos
  puestos a mano).
- **Cifras:** 0 de 43 celdas con números usaban `tabular-nums`. No había letra monoespaciada.
- **Tamaño táctil:** ya estaba bien gracias a `taller-tactil.css`. El único «chico» que marca la medida (8 × 48) es el
  campo escondido dentro de la lupa de búsqueda (`bc-busqueda`); la lupa mide 44.

## Qué se cambió (rama `claude/taller10-a3`, SIN publicar)
Capa nueva y reversible, siguiendo el patrón de `taller-prefactura.*`:
- **`taller-ui-inventario.css`.** Va en el `<head>`, junto a las otras capas. Solo actúa con `html.bc-inv`.
- **`taller-ui-inventario.js`.** Va con `defer`. Después de que la app pinta `#infoplusTable` o la tabla del conteo, le pone a
  cada celda el rótulo de su columna. Los rótulos se toman del encabezado de la tabla. También marca las píldoras de almacén.
  - No lee ni escribe datos.
  - No toca `#partsTable` ni `#assetsTable`, que ya traen rótulos y se repintan con `_pintarSiCambio`. Así no se provocan
    repintados.
- **Apagar:** `BC_INV=false`, o `localStorage.bc_inv_off='1'` en un equipo. Comprobado: apagada, la pantalla vuelve a ser
  igual que antes.
- **`taller.html`:** solo 4 líneas: comentario, interruptor, `<link>` y `<script defer>`.
- **`taller-app.js`:** sin cambios (no hizo falta minificar).

Cómo se ve ahora:
- **Celular y tableta (≤1024 px):**
  - cada artículo es una tarjeta con el nombre como título (16 px) y el código debajo, en gris;
  - debajo van filas «rótulo — dato» (Marca, Referencia, Costo, Precio, Taller, Otros almacenes);
  - los datos vacíos no se pintan.
- **Inventario físico:**
  - el artículo es el título y debajo van Sistema, Conté (campo de 110 px y 48 de alto) y Diferencia;
  - la tabla ya no queda encerrada en 60 % de la pantalla en el celular.
- **Existencia por almacén:**
  - el Taller va en una píldora verde (hay existencia) o roja (0);
  - los otros almacenes van en píldoras azul verdoso (`#0e7490` sobre `#ecfeff`, como dice `DESIGN.md`), sin mayúsculas.
- **Texto:**
  - encabezados de tabla en 12,5 px, normales, gris `#64748b`;
  - rótulos de formulario en 13 px `#475569`;
  - subtítulos de Etiquetas y cuadros del conteo en minúscula normal.
  - **La vista previa de la etiqueta impresa no se toca:** sigue en mayúscula, porque así se imprime.
- **Cifras:** `tabular-nums` en celdas, códigos y campos numéricos. El código ya no usa el estilo de `<code>`.
  En la PC, el dinero no se parte en dos líneas.
- **PC:** las columnas de números van a la derecha y la existencia del Taller va centrada. Al pasar el ratón, la fila se
  pinta de azul suave.

## Pruebas (Playwright, banco local en el puerto 8803, 390 y 1280 px)
| Medida | Antes 390 | Después 390 | Antes 1280 | Después 1280 |
|---|---|---|---|---|
| Textos en MAYÚSCULAS forzadas (4 vistas + conteo) | 33 + 96 rótulos de tarjeta | **0** | 56 | **0** |
| Celdas con rótulo (Artículos / conteo) | 0 / 0 | **38 / 16** | 0 / 0 | 40 / 16 |
| Celdas con número sin `tabular-nums` | 43 | **0** | 43 | **0** |
| Alto medio por artículo en Artículos | 346 px | 322 px (con rótulos) | 58 | 61 |
| Controles menores de 44 px | 0* | 0* | 0* | 0* |
| Campos con alto < 48 o letra < 16 | 0 | 0 | 0 | 0 |
| Desplazamiento horizontal | 0 | 0 | 0 | 0 |
| Errores de JavaScript en la consola | 0 | 0 | 0 | 0 |

\* Sin contar el campo escondido dentro de la lupa de búsqueda. La lupa mide 44.

- `node --check taller-ui-inventario.js`: correcto.
- Las capturas de antes y después quedaron fuera del repo, en la carpeta temporal del agente.

## Riesgos y pendientes
- El banco no tiene iconos (la red está cerrada) ni datos reales. **Falta verlo en un iPhone real** con el catálogo completo.
  Con miles de artículos, la tarjeta es más alta que la fila de la tabla. Por eso Artículos ya mostraba solo 100 resultados.
- `DESIGN.md §3` permite encabezados de tabla en mayúscula. El encargo pedía «sin mayúsculas forzadas», así que en estas
  4 vistas van en minúscula normal. Si el dueño quiere la regla igual en todo el sistema, hay que anotarlo en `DESIGN.md`.
- Las notas explicativas que siguen en pantalla (por ejemplo, «Escriba lo que cuente…» o «Al cuadrar, se mandan…») no
  están en `taller-info.js`. Pasarlas a la ⓘ es otro cambio, que va en `taller-info.js`.
- Si otra rama también toca las líneas de capas de `taller.html`, el choque al juntar se resuelve conservando ambas.

## Siguiente paso
El dueño revisa las capturas. Para publicar hace falta su «publícalo».
