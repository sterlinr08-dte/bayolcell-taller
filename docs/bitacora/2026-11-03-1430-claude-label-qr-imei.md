# 3-nov-2026 14:30 RD — QR chico con el IMEI en el label de diagnóstico (Claude)

## Solicitud del dueño
«Ponerle un código que la pistola pueda leer, QR pequeño; vamos a probar que quepa bien; utiliza agentes que ayuden.»

## Investigación (agente de apoyo, con fuentes)
- DENSO Wave (creador del QR): a 200 dpi térmica, ≥4 puntos por módulo = 0.5 mm → versión 1 (21×21) = 10.5 mm. OK.
  https://www.qrcode.com/en/howto/cell.html
- 15 dígitos caben en versión 1 con corrección **Q** (mismo tamaño, más tolerancia que M) → se usa Q.
- Una pistola de **línea roja** (1D láser/CCD) NO lee QR; una de recuadro iluminado (2D) sí. Plan B si es 1D: Code 128 de
  los 15 dígitos a 2 puntos por barra ≈ 38.5 mm (cabe en 44 mm). https://www.barcodefaq.com/1d/code-128/

## Cambio (rama `claude/label-qr-imei`, sin publicar)
- `taller-app.js` (`taller-app.min.js?v=20261103-qr1`): `_bcQrImei()` arma el QR con qrcodejs (ya cargado) a 168 px
  (8 px/módulo), corrección Q, con caché. En `generarHtmlLabelDiag` el QR va a la **derecha** de modelo/IMEI/fecha
  (10.5 mm para label de 25 mm; entre 9 y 12 mm según el alto), nítido (`image-rendering:pixelated`). Fallas y notas siguen a lo ancho.
- La letra se sigue midiendo para que todo quepa (ahora ~6–6.5 px por el espacio del QR).
- Sin IMEI de 15 cifras → sin QR. Apagar en un equipo: `localStorage.bayol_dlbl_qr='0'`.
- La pistola (bc-pistola-imei, PR #222) ya entiende lo que lee del QR (15 cifras con Luhn).

## Pruebas
- `scripts/pruebas/label-qr-imei.cjs` 15/15 (3 casos: QR 10.5 mm, todo cabe en 25 mm sin cortes, imprime, y el QR
  **bajado a 203 dpi en blanco y negro se lee con jsQR = el IMEI**; apagado; sin IMEI).
- label-diag-grande, label-modal-pro, imprimir-rapido, pistola-imei, diagnosticos-lote: bien.
- Imagen simulada a 203 dpi: `docs/bitacora/img/2026-11-03-label-qr-203dpi.png`.

## Pendiente
- Prueba real: imprimir y pasar la pistola. Si la pistola es 1D (línea roja), agregar Code 128.
