# Claude · Reacondicionados «limpio»: un solo color de acción y equipos en filas (sin publicar)

## Pedido del dueño (12-nov-2026)
«Dale una mejor apariencia a reacondicionado». Vio tres opciones (limpieza, limpieza + lista compacta, tablero por columnas), pidió muestras de la 2 y la 3 y eligió **la 2** («Sí»).

## Cambios (solo estilo)
- Capa nueva `bc-reacond-limpio.css` (rl1), colgada de `html.bc-rlim`, que se pone en el `<head>` antes del primer pintado (sin parpadeo). Apagar: `BC_RLIM=false` en `taller.html` o `localStorage.bc_reacond_limpio_off='1'`.
- Cabecera: «Registrar pieza usada» y «Registrar equipo existente» pasan a neutros; en celular van en una fila que se desliza. «Pasar con pistola» en naranja Bayol como única acción principal. Tablero «Lo que está parado»: el texto de acción ya no va en rojo.
- Lotes: píldoras de etapa neutras con punto de color.
- Dentro del lote: botones de la barra claros (antes azul noche) y **equipos en filas compactas** (foto de 46 px, modelo, IMEI, estado, técnico, costo, «Abrir»). Alto por equipo: de ~540 px a ~160 px en celular; 66 px en PC. En celular la fila no muestra el nombre del color (se ve en la foto; se cambia con «Poner colores»).
- No se tocó `taller-app.js`, ids, `onclick` ni datos.

## Pruebas (390 y 1280 px, datos inventados)
- `scripts/pruebas/reacond-limpio.cjs`: 16 comprobaciones OK (filas, datos a la vista, 44 px, se puede marcar, sin barra horizontal, apagado vuelve a las tarjetas).
- Siguen pasando `reacond-ui.cjs`, `reacond-proceso.cjs` y `reacond-pistola.cjs`. `reacond-fase2.cjs` y `reacond-flujo-completo.cjs` no se corrieron en esta entrega.

## No incluido
Tablero por columnas (opción 3): quedó solo como prototipo de captura, fuera del repo. Fila de fechas y chips de etapa del lote: sin cambios.
