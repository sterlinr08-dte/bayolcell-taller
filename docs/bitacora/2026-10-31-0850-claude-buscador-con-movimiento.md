# 2026-10-31 08:50 — Claude — Buscar artículo con movimiento (opción C) + nombre en dos líneas

## Dueño
«Vamos a poner el buscador con animaciones y efectos dinámicos.» Eligió **C** (las 7 animaciones + revisión + video) y **sí** al
nombre en dos líneas en el celular.

## Qué se hizo (capa nueva, aislada y reversible)
`bc-buscador-motion.css` + `bc-buscador-motion.js` (`?v=20261031-bmo1`), activa con `html.bc-bmo`.
Apagar: `BC_BMO=false` en `taller.html` o `localStorage.bc_bmo_off='1'`. **No toca `taller-recepcion.js`:** mira lo que ese archivo
pinta (MutationObserver) y pone clases. Reglas de `DESIGN.md §7`: curva `(.22,1,.36,1)`, 160–300 ms, solo `transform`/`opacity`,
nada al cargar, todo apagado con «reducir movimiento».

| # | Momento | Efecto |
|---|---|---|
| 1 | Escribir o tocar una ficha | Filas en cascada: 8 px hacia arriba, 18 ms entre filas, máx. 90 ms. Con flechas no se repite |
| 2 | Abrir el detalle de una fila | El panel se despliega (220 ms) y las filas de abajo se corren con FLIP (`element.animate`, solo transform) |
| 3 | Botón de precio | Se hunde al tocar (`scale .95`) y hace un pulso con anillo al agregar |
| 4 | Fichas de categoría | Píldora azul que se desliza hasta la ficha activa (FLIP con `transform`) |
| 5 | Campo de búsqueda | Al enfocar, el borde azul respira una vez (600 ms); «Entendido como…» entra deslizándose |
| 6 | Números | El total de la barra y los importes ruedan al cambiar (capa vieja sube, nueva entra; 260 ms) |
| 7 | Vacío y línea nueva | «Sin resultados» con fade; la línea recién agregada a la prefactura entra deslizándose |
| + | Celular ≤ 640 px | El nombre del artículo usa **dos líneas** (`-webkit-line-clamp: 2`) |

Nota: el buscador se cierra al agregar (así funciona `agregar()`), por eso el «después» de agregar se ve en la prefactura:
línea nueva + total que rueda. La existencia no cambia hasta guardar en Info Plus, así que no se anima ahí.

## Pruebas
- Nueva `scripts/pruebas/buscador-motion.cjs`: 30/30 a 390 y 1280, más un pase con «reducir movimiento» (ninguna clase de
  animación). Incluye grabación: `buscador-motion-390.mp4` (14 s) enviado al dueño por el chat.
- Regresión: `prefactura-stock-otras`, `prefactura-boton-precio`, `prefactura-delivery`, `prefactura-linea-referencia`: todo bien.
- Error corregido durante la prueba: la píldora volvía a poner su propia clase y disparaba el observador en bucle (la página se
  colgaba al tocar una ficha). Ahora solo toca la clase cuando cambia y el observador ignora los cambios de la propia capa.
- `review-animations` no se puede correr desde la IA (solo el dueño con `/review-animations`); se revisó a mano contra DESIGN.md §7.

## Qué hace solo
| Acción | Qué pasa |
|---|---|
| Escribir | Las filas entran en cascada; con flechas, no |
| Tocar una fila | El detalle se despliega y las de abajo se corren suaves |
| Agregar | Pulso en el botón, línea nueva entra, total rueda |
| «Reducir movimiento» en el teléfono | Todo instantáneo |

## Estado
Rama `claude/buscador-motion`, sin publicar. Falta el «Publícalo» del dueño.
