# Ticket de la prefactura por QZ Tray: primera impresión real y ajustes

**Dueño:** instaló QZ Tray en la PC y la prefactura Nº 118975 salió directo, sin ventana (foto). Tres detalles a pulir.

## Ajustes (bc-prefactura-imprimir.js i5)
1. La franja «PREFACTURA» era blanco sobre negro y la térmica la imprimía manchada → ahora texto negro grueso entre dos rayas.
2. Las filas Fecha / Cliente / Le atendió / Almacén se dibujaban con `flex` y el motor de QZ (Java) las desalineó (etiquetas en una
   columna y valores en otra, corridos) → ahora son tabla: etiqueta y valor en la misma fila.
3. «Sucursal Santiago» con almacén NAVARRETE: `codlocalidad` 7 no estaba mapeado → ahora 4 = Moca, 7 = Navarrete, resto Santiago.

## Estado
QZ Tray instalado y conectado en la PC del dueño; impresora de tickets elegida; papel «Ticket 80 mm». Publicado en `main`.
