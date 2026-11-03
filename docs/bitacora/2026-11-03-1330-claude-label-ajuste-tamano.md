# 3-nov-2026 13:30 RD — «Quedó muy grande»: vista previa más chica y fallas sin cortar (Claude)

## Solicitud del dueño
Captura 11:16 de la ventana nueva (PR #218): «Quedó muy grande». En la misma captura una falla salía «CAMBIAR BATE…».

## Cambio (rama `claude/label-ajuste-tamano`, sin publicar)
- `bc-label-modal-pro.js` (`?v=20261103-lp2`): zoom de la vista previa con tope **1.7** (antes 2.6): en PC la etiqueta pasa
  de ~486 px a ~330 px de ancho. Lo impreso no cambia.
- `taller-app.js` (`taller-app.min.js?v=20261103-lp2`): la medida de la letra del label ahora también revisa cada falla
  (`.diag-falla`): si alguna quedaría cortada con «…», baja la letra hasta que quepa. Esto sí cambia lo impreso
  (antes salía cortada también en el papel).

## Pruebas
- `label-diag-grande.cjs` con caso nuevo «4 fallas largas» (CAMBIAR BATERIA, FLEX DE CARGA, HOUSING, PULIR PANTALLA):
  ninguna cortada, cabe en 25 mm.
- `label-modal-pro.cjs` 13/13 (etiqueta 300–340 px en PC).
