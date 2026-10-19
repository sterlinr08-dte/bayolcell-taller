# Recepción organizada y prefactura siempre a la vista — Claude (19-oct-2026)

## Pedido del dueño
«Publícalo y vamos a organizar la ventana de recepción y prefactura.»
- **Publicado antes:** la letra legible (`taller-tactil.css?v=20261019-t2`, commit `d80ad26`). Se verificó que bayolcell.com la sirve.
- **Decisiones del dueño** (preguntadas antes de tocar nada):
  - orden **según el trabajo**;
  - prefactura **siempre a la vista**;
  - «Herramientas rápidas» **se quedan arriba**.

## Diagnóstico (banco local, 390 y 1280 px)
- **Celular:** el formulario medía unos 6 600 px de alto. El total y «Guardar» quedaban al final.
- **Orden de los pasos:** «Datos adicionales» (técnico, prioridad, almacén, vendedor) iba antes que la falla, aunque casi siempre se deja como viene.
- **Fuera de los pasos:** «Fallas del equipo» y «Seguridad del dispositivo» estaban sueltas, debajo de todo el formulario.
- **Buscar cliente** tenía dos controles: la lupa del buscador global, que se monta sola, y el botón «Buscar».
- **PC:** quedaban huecos por las alturas distintas de las columnas.

## Cambio (rama `claude/bayol-recepcion`, sin publicar)
- **Archivos nuevos:** `taller-recepcion.js` y `taller-recepcion.css`.
  - Interruptor `html.bc-rx` en el `<head>`.
  - Para apagarlo: `BC_RX=false`, o `localStorage.bc_rx_off='1'` en un equipo.
- **Nuevo orden:**
  1. Cliente
  2. Equipo
  3. **Falla y diagnóstico**, que ahora incluye «Fallas del equipo» y «Seguridad del dispositivo», plegables
  4. Artículos y servicios
  5. **Datos adicionales**: plegado, con un resumen en la cabecera («Sin técnico · Normal · almacén · vendedor») y se abre al tocarlo
- **PC:**
  - Cliente a la izquierda; Equipo y Falla apilados a la derecha, con alturas parecidas y sin huecos.
  - La prefactura se queda pegada a la derecha al bajar.
- **Celular y tablet (≤1080 px):**
  - **Barra fija abajo**: total, «Guardar» e «Imprimir».
  - Los botones tocan los mismos botones de la prefactura, así que llaman a `_rpGuardar(false)` y `_rpGuardar(true)` como siempre.
  - «Ver detalle» baja a la prefactura.
  - La barra se esconde mientras se escribe, para no tapar el campo con el teclado.
  - Si la prefactura ya está facturada, muestra «Ya facturada» en vez de los botones.
- **Buscar cliente:** `data-bcbp-no` en `#rxClienteBuscar`. Queda un solo campo con su botón «Buscar».
- **Lo que no cambia:** solo se mueven elementos que ya existen, con los mismos `id` y `onclick`. No se tocó `taller-app.js`, ni `_rpGuardar`, ni Info Plus.

## Pruebas (Playwright, banco local)
`rxfun.mjs`: **12 PASS · 0 FAIL**.
- El Guardar e Imprimir de la barra llaman a `_rpGuardar(false/true)`.
- Datos adicionales abre y cierra, con `aria-expanded`.
- Seguridad del dispositivo abre dentro de Falla.
- La barra se oculta al escribir y vuelve al salir del campo.
- El total de la barra sigue a la prefactura (RD$ 2,500).
- Los botones de la barra miden 44 px o más.
- Hay un solo campo para buscar al cliente.
- PC: la prefactura sigue a la vista al bajar y no aparece la barra.

Además:
- Barrido táctil de Recepción: 0 controles de menos de 44 px a 390 y a 1280 px.
- Con `bc_rx_off=1`: el orden original y sin barra.

**Errores encontrados y corregidos durante la prueba:**
- la fila «Total» no se encontraba con `/^Total\b/`, porque el número viene pegado («TotalRD$…»);
- `b:last-child` tomaba la palabra «Total» en vez del monto.

**Sin probar:** datos reales ni un iPhone físico (teclado y zona segura). Revisar en el teléfono antes de publicar.

## Siguiente
El dueño revisa las capturas y dice «publícalo».
