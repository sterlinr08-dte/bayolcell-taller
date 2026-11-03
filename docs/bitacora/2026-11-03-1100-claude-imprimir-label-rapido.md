# 3-nov-2026 11:00 RD — Imprimir label más rápido (Claude)

## Solicitud del dueño
«¿Podemos mejorar la velocidad? Cuando le doy a imprimir el label se toma como 5 segundos.»
(Antes, captura 10:17: el aviso rojo viejo era la página sin recargar; la versión nueva ya estaba en vivo → Ctrl+Shift+R.)

## Dónde se iba el tiempo (medido)
| Paso | Antes | Ahora |
|---|---:|---:|
| html2canvas: copiaba TODO el documento (≈4,500 nodos en el banco; más en producción) para dibujar un label | 0.8–1.1 s (banco) | ≈0.2–0.4 s |
| Estado de la impresora (`bc-impresora-estado.js`): esperaba siempre 600 ms después de preguntar | 0.6–1.5 s | ≈0.1 s (cierra con el primer informe + 80 ms) |
| Medir la letra del label (de 18 px hacia abajo, hasta 25 medidas) | ≈150 ms | ≈35 ms (búsqueda por mitades) |
| Firma de QZ (`qz-firmar`, 2 por impresión, logs 3-nov) | ≈0.1 s c/u | igual |
El resto es la propia impresora/Windows (no se puede acelerar desde el sistema).

## Cambio (rama `claude/imprimir-rapido`, sin publicar)
- `qzImprimirHtmlComoImagen` (taller-app.js): el label se copia a un iframe vacío con las mismas hojas de estilo y la
  misma letra del cuerpo, y html2canvas dibuja solo eso. Espera las imágenes (código de barras) ≤ 1.5 s. Si falla o hay
  un `<canvas>` dentro, se dibuja como antes. Apagar: `localStorage.bc_label_iframe_off='1'`.
- `generarHtmlLabelDiag`: búsqueda por mitades (pasos de 0.5 px) en vez de probar uno por uno.
- `bc-impresora-estado.js`: `revisar()` termina 80 ms después del primer informe de la impresora (tope 1.5 s igual).
- `taller.html`: `taller-app.min.js?v=20261103-ir1`, `bc-impresora-estado.js?v=20261103-ie3`.

## Pruebas
- `scripts/pruebas/imprimir-rapido.cjs` (html2canvas real de cdnjs): vía rápida 385 ms vs vieja 879 ms; misma imagen
  (816×397, diferencia 0.08 % de los puntos negros); sin iframes sueltos; medir letra 31 ms.
- `impresora-estado`, `label-diag-grande`, `impresion-facil`, `label-sin-color`, `diagnosticos-lote`, `guardar-rapido`: bien.
