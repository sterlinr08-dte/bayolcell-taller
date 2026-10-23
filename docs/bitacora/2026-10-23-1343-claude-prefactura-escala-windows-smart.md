# Prefactura en PC: compensación automática de la escala de Windows («se ve muy gigante en esta PC»)

**Dueño (captura 1920×1080):** «Vamos a compactar porque se ve muy gigante en esta PC» → «Ya lo puse en 100 [la escala]. ¿Hay forma
de que se mantenga o algo smart?»

## Diagnóstico
- La PC tiene la **escala de Windows al 125 %** (el documento de 1200 px CSS ocupaba 1500 px de pantalla). No es un problema del diseño.
- Intenté una capa «densa» (campos a 44 px, letra 15) pero la capa táctil (`taller-tactil.css`, regla del dueño del 18-oct) fija
  campos de 48 px y letra 16 con `!important`, y además ese camino rompería la regla. Se descartó.

## Solución «smart» (taller-prefactura.css n10)
En PC con ratón (`pointer: fine`, ≥1025 px) y escala del sistema **≥125 %**, el documento de la Prefactura, la barra fija, las
herramientas y el historial se dibujan con `zoom: .85`; con **≥150 %**, `zoom: .75`. Resultado: se ve como al 100 %. Con la escala
al 100 % no cambia nada. En celular nunca aplica. Los controles siguen midiendo ≥44 px **físicos** (51 px a 125 %, 54 a 150 %).

## Pruebas (Playwright, 1920×1080 físicos)
| Escala | Zoom aplicado | Documento (px CSS) | Campo Nombre (px físicos) | Barra fija |
|---|---|---|---|---|
| 100 % | 1 | 1200 × 827 | 48 | abajo, centrada |
| 125 % | 0.85 | 1020 × 702 | 51 | abajo, centrada |
| 150 % | 0.75 | 900 × 623 | 54 | abajo, centrada |
Sin errores de JS. Celular (390) sin cambios.

## Para el dueño
Puede volver a poner Windows al 125 % (más cómodo para lo demás): el sistema lo compensa solo. El zoom de Chrome (Ctrl + / Ctrl −)
también se recuerda por sitio sin hacer nada.

## Publicación
Directo a `main` (misma entrega de hoy).
