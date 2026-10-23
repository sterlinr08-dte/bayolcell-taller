# Fichas de acceso rápido en celular: ya no se deforman

**Dueño:** «En la web móvil quita los filtros porque se distorsiona… ajústalo mejor.»

## Diagnóstico
En celular la fila era `nowrap` pero las fichas podían encogerse (`flex-shrink`), así que el texto se cortaba («Pantal», «Bate»).

## Cambio (taller-recepcion.css g6, solo ≤760 px)
- Fichas con `flex: 0 0 auto`: conservan su ancho completo y la fila se desliza de lado (sin barra visible), con tope suave
  (`scroll-snap`) y un margen al final.
- Padding 12 px en celular; alto 44 px igual.

## Medidas (banco local, iPhone simulado 390 y 430 px)
Las 6 fichas con el texto completo (89–115 px de ancho, 44 de alto); la fila mide 693 px y se desliza; la página no se ensancha
(`scrollWidth` = ancho de pantalla). Sin errores de JS.

## Publicación
`claude/prefactura-pc` → `main`.
