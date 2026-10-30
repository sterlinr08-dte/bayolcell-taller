# 2026-10-30 11:45 (RD) — Claude — Reacondicionados: lista de lotes compacta (opción B)

## Solicitud del dueño
Captura de Reacondicionados (PC, pestaña «Listo para venta»): «Vamos a aplicarle mejoras a esa pantalla».
Se le dieron 3 opciones (A arreglar lo que se ve mal, B tarjetas compactas, C tabla en PC) y eligió **B**.

## Qué se hizo (rama `claude/reacond-lotes-compactos`, SIN publicar)
Capa nueva y aislada `bc-reacond-lotes.css` + `bc-reacond-lotes.js` (`?v=20261030-rlc1`), clase `html.bc-rlc`.
Apagar: `BC_RLC=false` en `taller.html` o `localStorage.bc_rlc_off='1'`. No toca `taller-app.js`, datos ni base.
- Cada lote en una fila: código **· proveedor** a la izquierda, fechas cortas (sin el año en curso).
- El número de la etapa elegida (01–06) va en grande a la derecha: «13 listos para venta · de 26» (en color de la etapa).
- Solo se ven las etapas con equipos; se esconden las de 0, la elegida (ya está en grande) y «Total» (va como «de N»).
- Barra de avance fina (4 px) con el % al lado; «completado» se quita.
- «Abrir Lote» naranja lleno → «Abrir ›» con borde azul (44 px). **Toda la tarjeta abre el lote** (también Enter/Espacio).
- Buscador de esta pantalla: se ocultan el aviso «Esc · Pulsa Esc para cerrar» (tapaba el título «Lo que está parado») y los
  puntitos naranjas que parecían manchas.

## Medidas (banco local, 4 lotes de prueba, pestaña Listo para venta)
| | Alto de cada lote | Lotes a la vista | Letra < 13 px |
|---|---:|---:|---:|
| Antes 1920/1280 | 179 px | 3 | 58 |
| Después 1920/1280 | 101 px | 4 (todos) | 31 |
| Antes 390 | 333 px | 1 | 64 |
| Después 390 | 108 px | 2 | 37 |
Botones ≥ 44 px en los 3 anchos; sin errores de JavaScript. (Las letras < 13 que quedan son de otras partes de la pantalla.)

## Pruebas
`reacond-ui`, `reacond-proceso`, `reacond-flujo-completo`, `reacond-fase2` y `ui-global` en verde.
Capturas: `docs/bitacora/img/2026-10-30-reacond-lotes/` (antes/después a 1920 y 390).

## Pendiente
- «Publícalo» del dueño.
- La cuadrícula del tablero «Lo que está parado» y las pestañas 01–06 no se tocaron en esta entrega.
