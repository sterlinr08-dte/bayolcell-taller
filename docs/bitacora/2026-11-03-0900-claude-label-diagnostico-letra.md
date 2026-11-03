# 3-nov-2026 09:00 RD — Label de diagnóstico con letra más grande (Claude)

## Solicitud del dueño
Foto del label DIAGNÓSTICO (Samsung S22 Ultra, lote C00002071) con ~40 % vacío abajo: «Vamos a ajustar las letras para que sean más grandes».

## Diagnóstico
`generarHtmlLabelDiag` (taller-app.js) calculaba la letra con una cuenta muy prudente: suponía FECHA+LOTE en 2 líneas,
26 letras por línea en las notas y 1.28 de alto por línea. Con el caso de la foto daba 6 px y sobraba casi medio label.

## Cambio (rama `claude/label-diag-grande`, sin publicar)
- La letra se **mide**: se arma el label fuera de pantalla y se elige la más grande (de 0.5 en 0.5 px, hasta la elegida en
  el control de letra, 18 por defecto) que quepa a lo ancho y a lo alto, dejando ~2 mm abajo para el corte de la térmica.
  Si no se puede medir, queda la cuenta vieja.
- Notas y lista REVISAR del mismo tamaño que el resto (antes 1 px menos). Interlineado 1.15 → 1.06.
- Se mide en la misma PC que imprime, con sus letras reales: en Windows puede quedar aún más grande que en la prueba.
- `taller-app.min.js` regenerado; `taller.html` `?v=20261103-ld1`.
- Imagen antes/ahora: `docs/bitacora/img/2026-11-03-label-diag-antes-ahora.png`.

## Pruebas
- `scripts/pruebas/label-diag-grande.cjs` 13/13 (foto, muchas fallas, sin notas: igual o más grande, ≥ 85 % del alto, cabe, nada se sale).
- `label-sin-color`, `impresion-facil`, `diagnosticos-lote`: bien.

## Pendiente
- Prueba real en la térmica del taller tras publicar (que no corte abajo).
