# Conduce sin costos y elegir el color en Despachar teléfonos — 16-oct-2026

**Pedido del dueño:** «A la hoja de impresión no salir el costo ni precio, y en la ventana de selección para el despacho poder elegir el color».

## Cambios (`taller-app.js`)

### 1. Conduce de despacho sin costos
- Aplica al conduce impreso (`imprimirDespacho`) y al PDF (`descargarDespachoPDF`), en todos los despachos, no solo los de teléfonos.
- Se quitaron las columnas «Costo u.» y «Subtotal/Monto» y el total en RD$.
- Queda: #, código, descripción (con IMEI y color), cantidad y «Total de unidades».
- La hoja previa de «Guardar e imprimir» ya iba sin precios.

### 2. Elegir el color en la ventana Despachar teléfonos
- Cada fila tiene un selector con los colores oficiales de ese modelo (`_bcColoresModelo`). Los que no tienen color dicen «Elegir color…» en ámbar.
- **Guardado:** el color elegido se guarda al instante en el equipo (`_bcGuardarColorEquipo`, la misma función de «Poner colores»), y se ve también en la tarjeta.
- **Resumen:** «Documento a despachar» muestra cada IMEI con su color, o «sin color» en ámbar.
- **En el celular:** se ocultan el lote y el código para que quepa el selector.

**No cambió:** lo que se manda a Info Plus.

## Versión y pruebas
- **Versión:** `taller-app.js?v=20261016-dc3`.
- **Pruebas en Chromium:**
  - se eligió color a 2 teléfonos (uno sin código IP) y se guardó;
  - tocar la fila sigue marcando el teléfono;
  - el conduce sale sin costos;
  - sin errores.
- `node --check` sin errores.

**Rama:** `claude/despacho-color`. **No publicado.**
