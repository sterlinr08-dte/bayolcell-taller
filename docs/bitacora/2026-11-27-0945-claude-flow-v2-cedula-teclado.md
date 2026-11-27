# 2026-11-27 09:45 RD · Claude — Flow v2 (borrador): cédula con teclado numérico

Sigue a `2026-11-27-0920-claude-flow-financiamiento-v2-borrador.md`. El dueño pidió que la cédula abra el teclado numérico.

## Lo que se probó en el borrador 1860287288307442 (Meta valida al subir)
1. `input-type: phone` con la validación `pattern`: **rechazado**. Con `pattern`, Meta solo permite text, password, passcode o number.
2. `input-type: number` con `pattern`: **rechazado**. Meta dice que `${form.cedula}` pasa a ser **número** y no texto, así que el **0 del principio se perdería** (031… → 31…). Por eso no se usó.
3. **Quedó así:** `input-type: phone`, **sin `pattern`**, con `min-chars` 11 y `max-chars` 13, y la ayuda «11 números, sin guiones. Ej.: 03100000000». **Meta lo aceptó** (`validation_errors: []`).
   - Ventajas: teclado de números y la cédula se guarda como texto, sin perder el 0.
   - Lo que se pierde: la validación exacta de 11 dígitos y su mensaje («Escribe tu cédula completa: son 11 números.»). Ahora solo exige de 11 a 13 caracteres.

## Estado
- El borrador **no está publicado**. El formulario 1193474773538114 sigue igual.
- La función temporal quedó retirada (v6, 410).
- El dueño decide entre:
  - teclado numérico (11 a 13 caracteres);
  - validación exacta con el teclado normal.
