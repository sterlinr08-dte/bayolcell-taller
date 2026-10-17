# Reportes del despacho por WhatsApp (equipo y administrativo) — 16-oct-2026

## Pedido del dueño
Usar el 829-589-3292 para mandar a los demás:
1. el reporte de los equipos que se están despachando, para conocimiento;
2. otro reporte administrativo con el costo y el lote al que pertenece cada equipo.

Respuestas del dueño:
- el número es de BAYOL CELL;
- los destinatarios del reporte del equipo se eligen en cada despacho;
- el reporte administrativo va solo al dueño.

## Hallazgos
- El 829-589-3292 no es ninguna de las 6 líneas del sistema (`whatsapp_lineas` en Zernio).
- Tampoco aparece en los negocios a los que llega el conector de WhatsApp Business (jose antonio peralta y Studiord).
- Por eso el sistema no puede mandar desde ese número por la API.
- Además, mandar por la API a personas que no han escrito en 24 horas exige plantillas aprobadas por Meta.

## Solución hecha (sin costo ni conexión nueva)
- **Click to chat (wa.me):** se abre WhatsApp con el mensaje ya escrito y la persona solo toca Enviar. Sale del WhatsApp que esté abierto en esa computadora; si en WhatsApp Web está el 829-589-3292, sale de ese número.
- **Ventana «Despacho #N · reportes»** (`_despReporteAbrir`). Aparece al terminar un despacho de teléfonos, en lugar de la pregunta de imprimir. Tiene:
  - el botón **Imprimir conduce**;
  - **Reporte para el equipo**, sin costos: modelo, IMEI, color y total. Muestra la lista de contactos con un botón **Enviar** para cada uno.
    - Los contactos son los empleados que tienen teléfono, más los que se agreguen ahí (nombre y número), guardados en esta computadora (`localStorage` `bayolDespContactos`). Se pueden quitar.
  - **Reporte administrativo**, solo visible para el admin: lo mismo, más el costo de cada equipo, el lote, el costo total y un resumen por lote.
    - Va al número del dueño, que se pide la primera vez y se guarda (`localStorage` `bayolDespAdminTel`). Se puede cambiar.
  - **Ver el mensaje** y **Copiar texto** en cada reporte.
- **Historial de despachos:** botón verde de WhatsApp para volver a abrir los reportes de un despacho ya hecho (`despReporteDesdeHistorial`). El costo y el lote se buscan por IMEI.

## Archivos y pruebas
- **Archivos:** `taller-app.js` y `taller.html` (`?v=20261016-dw1`).
- **Pruebas en Chromium:**
  - despacho de ejemplo con 3 teléfonos en 2 lotes;
  - agregar un contacto;
  - Enviar abrió `wa.me/1829…` con el texto correcto;
  - el texto administrativo trae costo por equipo, total y resumen por lote;
  - sin errores.

## Pendiente
- Si el dueño quiere que salga **automático** del 829-589-3292, sin tocar Enviar, hay que conectar ese número al sistema (Zernio, como las otras líneas) y aprobar 2 plantillas en Meta: reporte del equipo y reporte administrativo. Esto requiere su OK y su acción en Meta y Zernio.

**Rama:** `claude/despacho-color`, junto con el color, el conduce sin costos y «Guardar e imprimir». **No publicado.**
