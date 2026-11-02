# 2-nov-2026 10:30 RD — Impresión: avisar el estado real de la impresora (Claude)

## Solicitud del dueño
«Revisa, no quiere imprimir desde la PC, solo simula que imprime». Luego «Sí» a que el sistema avise cuando la impresora no puede.

## Diagnóstico
- `qz-firmar` firmó más de 10 impresiones entre 09:50 y 10:00 RD: QZ Tray estaba conectado y mandaba el trabajo.
- El dueño confirma que el aviso verde decía «impresa en <la de tickets>»: la impresora elegida era la correcta.
- El sistema solo sabía que Windows **aceptó** el trabajo, no si salió el papel. Con la impresora sin conexión, en pausa o sin papel,
  Windows lo deja en la cola y el aviso decía «impresa».
- Pasos dados al dueño para destrabar la cola: encendida/papel/cable; Impresoras y escáneres → Abrir cola → cancelar todo;
  quitar «Pausar la impresión» y «Usar impresora sin conexión»; apagar y encender; reiniciar la PC si sigue.

## Cambio (rama `claude/imprimir-pc`, sin publicar)
- Nuevo `bc-impresora-estado.js` (cargado en `taller.html` con `?v=20261102-ie1`). Envuelve `qzImprimirHtml`,
  `qzImprimirHtmlComoImagen` y `qzImprimirRaw` sin tocar `taller-app.js`:
  - **Antes de imprimir** pregunta el estado a QZ (`printers.startListening` + `getStatus`, ≤ 1.5 s). Si está sin conexión, en pausa,
    sin papel, atascada, con la tapa abierta o con error → no manda, aviso rojo «No se imprimió: la impresora X … » con qué hacer,
    y devuelve false (la prefactura sigue su camino de siempre: abre la ventana para elegir otra impresora).
  - **Después** vigila el trabajo 20 s; si Windows lo marca con error, sin papel, bloqueado o sin conexión → aviso rojo «No salió el papel».
  - Si QZ no informa estado, imprime como antes.
  - Apagar: `localStorage.bc_impest_off = '1'` o `window.BC_IMPEST = false`.
- Prueba nueva `scripts/pruebas/impresora-estado.cjs` (QZ simulado): 9/9 OK. `impresion-facil.cjs` y `prefactura-confiable.cjs` sin errores.

## Límites
- Algunas térmicas USB con driver genérico dicen «OK» aunque estén desenchufadas: ahí Windows no sabe, y el sistema tampoco.
- Cada revisión pide 2 firmas más a `qz-firmar` (≈ 0.3–0.5 s más por impresión).

## Pendiente
- «Publícalo» del dueño. Después, probar en la PC real con la impresora apagada.
