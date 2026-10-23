# Prefactura sin ventana emergente (QZ Tray) y pantalla de impresora al día — preparado, SIN publicar

**Dueño:** «¿Para configurar la impresora hay otro más fácil sin complicaciones?» → «Investiga más a fondo» → «Cuando esté en la PC
lo vamos a hacer y quiero que no salga la pantalla emergente.»

## Investigación (fuentes: código del sistema, qz.io/download, qz.io/docs/provisioning, docs de Chrome kiosk-printing, WebUSB)
- La prefactura **no usaba QZ Tray**: `bc-prefactura-imprimir.js` (21-oct) abre una ventana con el ticket de 80 mm o la hoja carta
  (papel elegido por PC en «Config. Impresora») y llama a la impresión del navegador. QZ solo imprimía etiquetas 58 mm y tickets de rifa.
- QZ Tray va por la **2.3.0** y el instalador **trae Java incluido** (OpenJDK dentro); el aviso «puede pedir Java» de la pantalla estaba viejo.
  El aviso «¿Permitir?» tiene la casilla **«Recordar esta decisión»**: con marcarla no vuelve a preguntar (se guarda en `allowed.dat`).
  Importar el certificado solo hace falta si eso no bastara.
- Alternativas descartadas: WebUSB (hay que cambiar el controlador de la impresora con Zadig y deja de servir para otros programas),
  PrintNode (pago mensual). Chrome con `--kiosk-printing` imprime sin ventana a la impresora predeterminada, pero una sola por PC.

## Cambios en la rama `claude/prefactura-pc` (no publicados; se publican el día que el dueño esté en la PC)
1. `bc-prefactura-imprimir.js` (i4): si el papel es **ticket** y QZ Tray está conectado con una **impresora de tickets** elegida,
   el ticket sale **directo por QZ** (76 mm útiles, sin el `window.print` del HTML) y se marca como impreso (la siguiente dice COPIA).
   Si QZ no está, falla o el papel es carta, sigue la ventana de siempre. Texto de la tarjeta «Papel de la prefactura» lo explica.
2. `taller.html`: pantalla «Configuración de Impresora»: sin el aviso de Java; primer paso «marque Recordar esta decisión y Permitir»;
   el certificado queda como «si aun así sigue preguntando».
3. Se descartó un segundo formato de ticket que se había empezado en `taller-app.js` (la capa ya tenía uno); `taller-app.min.js` sin cambios.

## Pruebas (banco local, funciones de QZ simuladas)
| Caso | Resultado |
|---|---|
| Sin QZ | 1 ventana (como hoy) |
| QZ conectado + impresora de tickets | 0 ventanas; va a QZ con ancho 76, tipo `tickets`, sin `window.print`, total correcto, Nº marcado como impreso |
| QZ falla | 1 ventana (respaldo) |
| Papel carta con QZ | 1 ventana (la carta no va por QZ) |
Sin errores de JS. Captura del ticket: `pf-pc/ticket-80mm.png` (scratchpad).

## Pasos para el día en la PC (con el dueño)
1. Descargar e instalar QZ Tray (botón en Configuración → Impresora). No pide nada más.
2. «Ya lo instalé, reconectar» → elegir **Impresora para TICKETS** (la térmica de 80 mm) y, si hay, la de **LABELS**.
3. «Papel de la prefactura»: **Ticket 80 mm**.
4. Imprimir una prefactura: en el aviso de QZ marcar **Recordar esta decisión** → Permitir. A partir de ahí, sin ventana.
5. Repetir en cada computadora que imprima.
