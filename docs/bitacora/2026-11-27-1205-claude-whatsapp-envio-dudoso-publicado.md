# 2026-11-27 12:05 RD · Claude — WhatsApp «Sin confirmar» publicado

Esta entrada sigue a `2026-11-27-1030-claude-whatsapp-envio-dudoso.md`. El dueño tocó **«Publícalo»**.

## Qué se publicó
- Las 3 pruebas de GitHub del PR #368 pasaron antes de publicar: unit, chromium y webkit.
- Edge **`whatsapp-enviar` v27** desplegada en `vkhwdvjtowrhkhqavnvk` con `index.ts` y `_shared/ortografia.ts`, y verify_jwt en true.
  - Los registros muestran envíos reales con 200 después del despliegue (12:00 RD).
  - El corrector de ortografía siguió funcionando: dio «corregido», «sin_cambios» y «empleado_no_incluido».
- **PR #368 unido a `main`** (squash `8ce7c58`). El robot minificó en el commit `9b564e9`.
- bayolcell.com/taller.html ya carga `taller-app.min.js?v=20261127-dud1`, y el archivo trae `_waReenviarDudoso` (comprobado 12:10 RD).

## No verificado
- Un error real de Meta (5xx) con la burbuja «Sin confirmar» en pantalla. No se puede provocar.
- Si Zernio manda el reflejo del mensaje cuando Meta falla pero sí entrega, que es lo que activa el «✅ Confirmado».

## Para apagarlo
No tiene interruptor. Para volver atrás:
- desplegar de nuevo la v26, que es el código anterior a este PR;
- revertir el commit `8ce7c58`.
