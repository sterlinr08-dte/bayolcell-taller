# 2026-10-31 09:50 — Claude — El nivel elegido en el detalle lleva su color

## Dueño
Captura del detalle del buscador: el recuadro «Cliente final» salía resaltado en azul. «Que el color de la selección del nivel
de precio sea igual al que le pertenece.»

## Cambio
- `taller-recepcion.js` **g16**: cada recuadro del detalle lleva la clase `pk-nv-1/2/3`.
- `taller-recepcion.css` **g11**: el recuadro elegido usa el color de su nivel, igual que el botón de la fila (31-oct):
  Cliente final naranja (`#fff7ed` / borde `#e4572e`), Por mayor azul, Extremo amarillo. Se reemplazó la regla única
  `.pk-nv.elegible.act` azul (línea 336) que ganaba la cascada.
- `taller.html`: versiones g16 / g11.

## Pruebas
- Captura a 390 y 1280 con los tres niveles: fondos `#fff7ed`, `#eff6ff`, `#fffbeb` según el nivel; el botón de la fila cambia al
  mismo color (`pk-n1/2/3`).
- Regresión: `prefactura-boton-precio`, `prefactura-stock-otras`, `buscador-motion`: todo bien.

## Estado
Rama `claude/nivel-color-detalle`, sin publicar. Falta el «Publícalo» del dueño.
