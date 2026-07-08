# Ajuste solicitado: logo negro en etiqueta de IMEI

## Solicitud
Ajustar la vista previa e impresión de la etiqueta para que el logo superior se vea completamente negro, como en la referencia enviada por Esterlin.

## Archivo localizado
El módulo de etiquetas está en `taller.html`. En commits anteriores se identifica la zona de impresión/vista previa con:

- `actualizarLabelLive()`
- `labelCard`
- `lblLiveBarcode`
- `generarBarcodeImg(...)`
- lógica de impresión que clona `#labelCard`

## Resultado visual esperado
La etiqueta debe verse así:

- Fondo blanco.
- Logo superior negro sólido, centrado.
- Línea horizontal negra debajo del logo.
- Texto fuerte en negro:
  - `EQUIPO: iP14 PLUS 512gb`
  - `IMEI: 356485670514606`
- Código de barras negro.
- `CLASE A` centrado en negro.

## Criterio técnico
No usar logo claro, gris o transparente. El logo debe forzarse a negro puro `#000` tanto en la vista previa como en la impresión.

Si el logo se genera con SVG o icono, aplicar `fill="#000"`, `color:#000`, `filter:none` y evitar opacidad.

Si el logo se muestra como imagen, usar una variante negra o reemplazarlo por un SVG/icono negro en la etiqueta.

## Importante
La impresión actualmente clona la vista previa (`#labelCard`), por lo que basta con garantizar que la vista previa tenga el logo negro para que también imprima igual.