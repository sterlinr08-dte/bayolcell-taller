# Claude · Label de diagnóstico: casillas grandes y sin raya de rayitas

## Pedido del dueño (11-nov-2026)
Foto de un label «DIAGNÓSTICO» (impreso el 3-nov) → eligió mejoras 1, 2 y 3; luego «la raya intermitente ocupa espacio, pon tipo Z». «PUBLÍCALO».

## Diagnóstico
- 1 (QR del IMEI) y 2 (falla cortada «CAMBIAR BATERI.») ya estaban resueltos desde el 3-nov (PR #224 y #220); el label de la foto es anterior. Si una PC sigue sin QR: `localStorage.bayol_dlbl_qr` = '0' en esa PC.
- 3: la casilla era la letra «☐», chiquita y que algunas fuentes no traen.

## Cambios (`taller-app.js`, `generarHtmlLabelDiag`)
- Casilla dibujada: cuadro de 1.15 em con borde de 1 px (a 203 dpi ≈2 puntos; con 2 px se veía relleno). Apagar: `bayol_dlbl_caja='0'`.
- Sin la raya de rayitas entre secciones (fallas y notas); ese alto pasa a la letra (6.5 → 7 px con 4 fallas). Fallas en orden Z. Volver a la raya: `bayol_dlbl_raya='1'`.
- `taller.html`: `taller-app.min.js?v=20261111-cj1`; minificado regenerado.

## Pruebas
`scripts/pruebas/label-qr-imei.cjs` (3 casos: cabe en 25 mm, nada cortado, QR leído a 203 dpi) y `label-diag-grande.cjs`: todo OK. Captura a 203 dpi revisada.

## Pendiente
- Mejora 4 (renglón para lo escrito a mano, «100» en la funda): falta que el dueño diga qué es.
