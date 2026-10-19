# Taller: ventanas y letra legible — Claude (19-oct-2026)

## Pedido
El dueño dijo «Publícalo y continúa».
- **Publicado:** la capa táctil se subió a `main` (commit `e7c61cf`). Se verificó que bayolcell.com sirve `taller-tactil.css?v=20261019-t1`.
- **Esta segunda tanda** sigue en la rama `claude/bayol-tactil`, **sin publicar**.

## Ventanas (36 `.modal-backdrop`)
Se midieron abriéndolas una por una, a 390 y a 1280 px, en el banco local.
- **Antes, sin la capa:**
  - 186 controles de menos de 44 px a 390 y 192 a 1280: la X de cerrar, «Volver», Cancelar y Guardar medían 34–40;
  - 109 campos chicos a 390 y 118 a 1280.
- **Con la capa ya publicada:** 0 controles y 0 campos chicos.
  - Queda solo el selector de color de Categoría, que no es un campo de escribir.
  - **Ojo al medir:** hay que esperar a que termine la animación de apertura. A medio abrir salen 43/47 px por la escala de entrada.

## Letra legible (agregado en `taller-tactil.css`, `?v=20261019-t2`)
Medido antes, con la capa apagada:
- **etiquetas de formulario:** todas de 10–13 px; 204 de 11 px y 46 de 10–10,5;
- **ayudas `<small>`:** 8,5–12 px;
- **títulos de tabla:** 10–11 px.

Cambio:
- las etiquetas pasan a **13 px**;
- las ayudas y los títulos de tabla, a **12 px**;
- se conservan las mayúsculas donde ya las había.

Se usan **tamaños fijos**:
- Un primer intento con `max(13px, 1em)` agrandaba de más las etiquetas, porque `em` toma la letra del contenedor (unos 22 px en el celular). Se descartó antes de guardar.
- La regla de botones (`max(13px, 1em)`) se dejó **sin `!important`**, igual que en `t1`, por el mismo motivo.

**Resultado:**
- los textos de menos de 12 px bajan de unos 280 a unos 35, en 18 vistas y 36 ventanas;
- los que quedan son notas con estilo propio en línea («reales», «Pendiente de crear», rutas de QZ Tray).

## Pruebas
- Barrido de las vistas tocadas: 0 controles de menos de 44 px.
- Ventanas, esperando 1,1 s a que abran: 0 controles chicos a 390 y 1280.
- Antes/después de Recepción (celular) y «Crear artículo» (celular): la letra crece sin romper la cuadrícula.

## Siguiente
El dueño mira las capturas y dice «publícalo».
