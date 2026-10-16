# Hoja de despacho con el color de cada teléfono — 16-oct-2026

**Pedido del dueño:** «Vamos a poner que en la hoja de despacho también salga el color».

## Cambios (`taller-app.js`)
- **Conduce del despacho** (`imprimirDespacho`, el que sale después de despachar o desde el historial): debajo de cada modelo aparece cada IMEI con su color en negrita (por ejemplo, «IMEI 3590… · **Morado**»).
- **PDF del despacho** (`descargarDespachoPDF`): la lista «Series / IMEI · color» ahora lleva el color junto a cada IMEI.
- **Historial de despachos de teléfonos** (`despachos_almacen.items`): cada modelo guarda también `imeis: [{imei, color}]`.
  - Solo cambia el historial; a Info Plus se manda lo mismo que antes, y `items` y `seriales` no cambiaron.
- **Despachos viejos sin color guardado:** `_despImeisItem` busca el color por IMEI en los reacondicionados.
- **Hoja «Imprimir» de antes de despachar:** ahora dice «IMEI … · Color: **…**» en negrita (o «sin color»).

## Versión y pruebas
- **Versión:** `taller-app.js?v=20261016-dc1`.
- **Prueba:** conduce de ejemplo en Chromium con 2 modelos. Uno tenía el color guardado y el otro era viejo, y su color salió buscándolo por IMEI. Sin errores.
- `node --check` sin errores.

## Pendientes
- **Rama:** `claude/despacho-color`. **No publicado.**
- **Pregunta abierta:** el conduce todavía muestra costo unitario y subtotal. La hoja de antes de despachar ya va sin precios por pedido del dueño. Falta confirmar si el conduce también debe ir sin precios.
