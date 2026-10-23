# 22-oct-2026 20:25 · Claude · Arreglo: la barra de Guardar desaparecía al poner descuento

**Dueño:** «Hay un bug: cuando pongo descuento el botón de cobrar e imprimir desaparece.»

## Causa
En celular (≤760 px) la barra de Guardar / Guardar e imprimir se esconde mientras un campo tiene el foco y vuelve al
salir. Los campos Precio, Cant. y Desc. % se redibujan al cambiar y pierden el foco solos; el nuevo campo
«Descuento RD$» (hoy 18:35) no se redibuja, así que se quedaba con el foco y la barra seguía escondida.

## Arreglo (`main`, hotfix)
- `taller-prefactura.js` (i3): el campo RD$ suelta el foco al confirmar (`onchange` → `blur()`, Enter → `blur()`,
  `enterkeyhint="done"`). Además, después de cada pintado, si la barra está escondida y nadie tiene el foco, se destapa.
- `taller-recepcion.js` (g4): misma revisión en la barra de la capa clásica.
- `taller-app.js` (p9): el campo RD$ del resumen clásico también suelta el foco.

## Pruebas
- Arnés Playwright (390 px) con el marcado real del campo: escondida al enfocar → tras escribir 200 y Enter la barra vuelve,
  el valor llega a `_rpDescMonto` y el foco queda en el body.
