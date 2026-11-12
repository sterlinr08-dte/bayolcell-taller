# Curvo: barra lateral curva y flotando (sin publicar)

**Pedido del dueño:** «LA BARRA LATERAL PONLA CURVA COMO EN EL VIDEO» (reel Glassy Dashboard `Dfpso-izxkY`). Sigue a la entrada `…-claude-curvo.md`.

## Qué cambia
- `bc-curvo.js` (versión `20261112b`): nueva función `barra()` que agrega `style#bcCurvoBarra`.
  - La barra lateral (`aside.sidebar`) queda con las 4 esquinas curvas (28 px), borde fino y sombra.
  - En PC flota a 12 px de arriba, abajo e izquierda; el contenido empieza en 100 px.
  - En celular, el menú abierto flota a 10 px de los bordes.
- `taller.html`: `bc-curvo.js?v=20261112-cu2`.
- Solo apariencia. No toca datos, permisos ni funciones.

## Error corregido en el camino
Con `top+bottom` y `height:auto` la barra medía 1365 px en una pantalla de 900 (se mide contra `#app`). Se fijó el alto con `calc(100vh - 24px)`.

## Pruebas
- `scripts/pruebas/curvo.cjs`: Todo OK (nueva comprobación «barra lateral curva y flotando» a 390 y 1280 px).
- Medido: compacta `[12,12,76,876]`, abierta `[12,12,250,876]`, celular `[10,10,300,824]`, sin barra de desplazamiento lateral, sin errores.

## Apagar
`localStorage.bc_curvo_off='1'` apaga toda la capa Curvo, barra incluida.

## Estado
Rama `claude/curvo`, sin publicar. Falta el OK del dueño y probar en iPhone real.
