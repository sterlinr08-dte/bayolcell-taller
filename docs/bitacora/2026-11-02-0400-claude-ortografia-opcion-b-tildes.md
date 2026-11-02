# Corrección ortográfica — opción B: tildes contra las reglas → original

> Sigue a `2026-11-02-0345-claude-ortografia-banco-ia-real.md`. Dueño: «B».

## Qué cambia
- Nueva comprobación `tildeMalPuesta` en `_shared/ortografia.ts`. Si la IA deja una palabra con una tilde que las reglas del español no permiten, se rechaza la corrección y **sale el texto original**:
  - tilde en la penúltima sílaba de una palabra que termina en vocal, n o s (llana: «compráte», «exámen»);
  - tilde en la última sílaba de una palabra que no termina en vocal, n o s (aguda: «hacér», «relój»).
- Excepciones: hiato con í/ú («día», «país», «baúl»), monosílabos («sí», «más», «qué») y las palabras de pregunta («cuánto», «dónde», «cómo», «quién», «cuál»…).
- Si el empleado ya había escrito esa tilde mal, no se cuenta como cambio de la IA.
- Motivo en el registro: `rechazo_tilde`.

## Pruebas
- 47/47 (`node --test scripts/pruebas/ortografia.test.mjs scripts/pruebas/ortografia-envio.test.mjs`), con un caso nuevo de 26 palabras.
- Con las 42 correcciones reales del banco: la regla nueva rechaza **solo** «compráte»; las otras 41 siguen pasando.

## Despliegue
- `social-enviar` v6, `instagram-enviar` v11, `whatsapp-enviar` v24. Los `index.ts` no cambiaron; solo `_shared/ortografia.ts`.
- Prueba de humo: las 3 arrancan (403 / 404 / 404 con la llave anónima y un hilo inexistente).
- Interruptor: sigue **apagado**.

## Siguiente paso (con autorización)
Paso 4: piloto en un chat del dueño (`piloto_hilos` + `activo = true`).
