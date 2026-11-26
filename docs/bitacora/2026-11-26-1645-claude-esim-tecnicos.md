# 2026-11-26 16:45 RD · Claude — Prueba de eSIM donde trabajan los técnicos (sin publicar)

Sigue a `2026-11-26-1000-claude-prueba-esim-publicada.md`. El dueño pidió «poner la eSIM de prueba en una parte que los técnicos la usen» y eligió la **opción C**: el panel, un botón libre y el resultado en la orden del cliente.

## Qué se agregó (`taller-esim.js` → `?v=20261126-esim2`; sin migración)
1. **Panel de Reparación** del reacondicionado (`abrirPanelProceso`):
   - aparece la fila «eSIM» con su estado y el botón «Probar eSIM» o «Repetir»;
   - guarda igual que en Evaluación: `equipos_refurbish.esim_*` más el historial.
2. **Órdenes de Servicio:** botón **«Probar eSIM»** al lado de «Pedir pieza».
   - Lo ve el técnico que tiene la orden y el administrador.
   - Abre la ventana con el número de orden, el modelo y el IMEI del equipo del cliente.
   - El resultado queda como **nota en la orden** (`orden_notas`), por ejemplo «📶 Prueba de eSIM: funciona (eSIM de prueba borrado)». Así lo ve servicio al cliente, como una nota del técnico sin leer.
   - El botón pasa a «eSIM ✓», «eSIM ✗» o «eSIM bloq.», leído de las notas.
   - No sale en modelos sin eSIM (por ejemplo, iPhone 8 Plus).
   - Las tarjetas se redibujan a menudo, así que el botón se vuelve a poner solo (MutationObserver con espera de 150 ms; no entra en bucle).
3. **Botón libre «eSIM»** arriba de **Órdenes de Servicio** y de **Diagnóstico**:
   - muestra el QR y los pasos para cualquier teléfono;
   - no guarda nada y lo dice en la ventana.
4. **Ícono:** se usa `ti-device-sim`. `ti-sim` no existe en Tabler 2.47, por eso antes no salía el ícono.

## Pruebas
Playwright a 390 y 1280 px, página de prueba con los estilos reales del taller:
- sin errores ni scroll horizontal;
- todo lo tocable mide ≥ 44 px. Al principio el botón de la orden medía 36–40 px por el estilo `.btn`; se corrigió.
- Orden del iPhone 13 Pro:
  - «Probar eSIM» → «Funciona» → 1 nota con `autor_rol` técnico y `leida_servicio` false;
  - tras redibujar, el botón dice «eSIM ✓»;
  - la orden del iPhone 8 Plus no tiene botón.
- El botón libre muestra solo «Cerrar», sin botones de resultado.
- Panel de reparación: «sin probar» → «Funciona» → «eSIM funciona · fecha · técnico».
- **No probado:** las pantallas reales con sesión y el iPhone real.

## Siguiente paso
Esperar a que pasen las pruebas de GitHub y preguntar «Publícalo» / «Todavía no». No hay migración.
