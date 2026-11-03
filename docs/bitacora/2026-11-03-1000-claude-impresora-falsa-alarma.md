# 3-nov-2026 10:00 RD — Publicado el label grande + falsa alarma «No salió el papel» (Claude)

## 1. Label de diagnóstico publicado
- Dueño: «PUBLICAR». PR #210 unido a `main` (`7b06831`); CI verde. En vivo: `taller-app.min.js?v=20261103-ld1` con la letra medida.
- Dueño (foto 9:48): el label salió bien («todo está bien»).

## 2. Falsa alarma (rama `claude/impresora-falsa-alarma`, sin publicar)
- Foto del dueño: aviso rojo «No salió el papel: el trabajo se borró de la cola…» con el label ya impreso.
- Causa: `bc-impresora-estado.js` (bit. 2026-11-02-1030) tomaba el estado de trabajo `DELETED` como error. Windows borra el
  trabajo de la cola **cuando termina de imprimir**: es lo normal. Igual `RESTART`.
- Arreglo: fuera `DELETED` y `RESTART`; la regla de «severidad ERROR» ya no cuenta estados normales; un solo vigilante por
  impresora (dos impresiones seguidas daban dos avisos).
- Microcopy (reglamento 30-oct): «No imprimió: POS-80C sin conexión. Revise la impresora y su cola.» y
  «No salió el papel: sin papel. Revise la impresora y su cola.» (antes ~40 palabras con la ruta de Windows).
- `taller.html`: `bc-impresora-estado.js?v=20261103-ie2`.

## Pruebas
- `impresora-estado.cjs` 10/10 (nuevo: trabajo terminado `DELETED` → sin aviso; error de trabajo → un solo aviso).
- `impresion-facil.cjs` bien.
