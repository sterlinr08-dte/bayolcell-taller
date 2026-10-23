# Prefactura: vendedor solo con el nombre y almacén en mayúsculas — publicado con la versión compacta

**Dueño:** «Aplicarlo; y empleado solo poner el nombre, y el almacén solo poner NAVARRETE.»

## Cambios
- `taller-app.js` (p31): las opciones de Vendedor ya no llevan «(yo)»; queda solo el nombre.
- `taller-prefactura.js` (i20): las opciones del almacén sin «Localidad / Oficina / Almacén» y en **MAYÚSCULAS** (NAVARRETE, MOCA,
  SANTIAGO, TALLER, 2DO NIVEL, GARANTÍA CHINA).

## Publicación
En `main` se publican **solo** los cambios de la Prefactura (compacta 12:35 + estos), copiando los archivos desde la rama. La impresión
directa por QZ Tray (bitácora 12:21) se queda en `claude/prefactura-pc` hasta el día de la PC.

## Incidente
El commit 9c0719c de la rama dejó un comentario de una línea que tragaba el cierre de la función `acortarAlm` (error de sintaxis en
`taller-prefactura.js`). Se corrigió en el commit siguiente antes de publicar; `main` nunca lo recibió. Lección: el comentario va
después de las llaves, nunca antes.
