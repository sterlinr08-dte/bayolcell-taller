# 2026-10-20 18:20 · Claude · Ventana IMEI: elegir los IMEI de una lista

## Pedido del dueño
«En los artículos con IMEI, en la ventana, habilitar la opción de elegir los IMEI manual.»

## Qué se hizo
- La ventana IMEI de la Prefactura (`#bcpfImv`) ahora tiene la sección **«Elegir de la lista»**.
  - Muestra los IMEI de ese artículo como botones de 44 px. Al tocar uno se agrega con `_rpAgregarImei`, que es la misma función de siempre, y la cantidad se ajusta sola.
  - Lo que se escribe en el campo de arriba filtra la lista.
  - Los IMEI que ya están en la prefactura no aparecen.
  - Se muestran hasta 60; si hay más, se pide escribir los últimos números para afinar.
- **Fuente de la lista:** `infoplus_seriales`, filtrada por `codproducto`, de la más nueva a la más vieja, hasta 300. Es solo lectura.
- Escanear o escribir el IMEI sigue igual.

## Límites (dichos al dueño)
- `infoplus_seriales` guarda los IMEI de las **compras** de Info Plus. Sin la consulta por almacén, que depende del `tipo` que debe dar Dagoberto, la lista **puede incluir equipos ya vendidos**.
- **La lista está atrasada:** la última sincronización trae compras hasta el 23-jun-2026. Para ponerla al día, el admin entra a Compras → «IMEI → Proveedor» → «Sincronizar».
- **Quién la ve:** por la RLS de la tabla, solo el admin y los técnicos activos ven la lista. Los demás ven «No tiene acceso a la lista de IMEI. Escriba o escanee el IMEI». No se cambió la base.

## Archivos
- `taller-prefactura.js`: `cargarElegibles` y `pintarElegibles`. Versión n1.
- `taller-prefactura.css`: bloque n. Versión n1.
- `taller.html`: versiones subidas.

## Pruebas
- Nueva prueba `imeieleg`: 12/12.
- `pftest` 49/49 y `pfopc` 52/52.

## Estado
Rama `claude/prefactura-limpia`, **sin publicar**.
