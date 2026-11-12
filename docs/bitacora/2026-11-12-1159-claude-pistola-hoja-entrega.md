# «Pasar con pistola»: hoja de entrega con las fallas del diagnóstico

## Pedido del dueño
Se le propusieron mejoras para «Pasar con pistola» (n.º 5: hoja de entrega para firmar). Dijo: «podemos poner en la hoja que se va a imprimir que salgan los diagnósticos que tiene cada equipo, así el técnico ve el listado con sus fallas».

## Qué se hizo (`taller-reacond-pistola.js`, `?v=20261112-k3`)
- Al «Aplicar», si hubo equipos «Entregar a técnico», aparece «Hoja de entrega» con «Imprimir hoja» / «Ahora no».
- Una hoja (tamaño carta) por técnico: tienda, fecha, técnico, quién entrega, cantidad de equipos y de fallas, resumen por modelo, tabla con cada equipo (modelo, capacidad, color, lote, IMEI), **sus fallas del diagnóstico con una casilla para marcar al repararla** (con su nota y «agregada» si se añadió después), la nota del diagnóstico, casilla «Recibido» y firmas.
- Fuente de las fallas: tabla `equipo_fallas` (la misma de los labels de diagnóstico). Solo lee.
- La ventana se abre en el mismo toque para que el navegador no la bloquee y se llena cuando llegan las fallas.
- No cambia el guardado ni los permisos.

## Pruebas
`scripts/pruebas/reacond-pistola-tecnico.cjs`: Todo OK a 390 y 1280 px (técnico del grupo + hoja: IMEI en el orden en que se pasaron, fallas, nota, «Sin fallas anotadas», firmas y orden de imprimir). `reacond-pistola.cjs`: Todo OK. Sin probar con la impresora real.

## Estado
Rama `claude/pistola-hoja-entrega`. **Sin publicar**.
