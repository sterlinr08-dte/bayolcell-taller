# Reportes en Excel de verdad (.xlsx): sin la carpeta «_archivos»

## Pedido del dueño (05-nov-2026)
Mandó una captura de su carpeta Descargas y preguntó: «¿por qué el archivo Excel, cuando descargo el reporte, se descarga con esa carpeta y no puedo enviarlo por correo?». En la carpeta se ven `Diagnosticos_C00002071_2026-11-03_archivos` y `Costos_…_archivos`.

## Diagnóstico
- Los reportes del taller (`exportarDiagnosticosLoteExcel`, `_reporteCostosExcelDL` y otros 9 en `taller-app.js`) arman **una tabla HTML** y la bajan con extensión `.xls` (`application/vnd.ms-excel`).
- Excel la abre, pero al **guardarla** la guarda como «página web» y crea la carpeta `…_archivos` al lado. Por eso no se puede mandar como un solo archivo.

## Qué se hizo
- Capa nueva `bc-excel-real.js`, cargada al final de `taller.html`:
  - intercepta los clics en enlaces con `download="….xls"` y `href` de tipo `blob:`;
  - lee el archivo enseguida (quien lo armó libera el enlace a los 100 ms);
  - lo convierte con SheetJS 0.18.5 (cdnjs, el mismo que ya usa el taller) y baja un **`.xlsx` real**.
- Al convertir:
  - los números de 12 cifras o más (IMEI, cédula, referencias) quedan **como texto**, para que Excel no los muestre como 3,5E+14;
  - los costos siguen siendo números;
  - los títulos de varias columnas se mantienen unidos;
  - el ancho de cada columna se ajusta al contenido;
  - los saltos de línea dentro de una celda se convierten en « · ».
- **Respaldo:** si la librería no carga o algo falla, se baja el `.xls` de antes, como siempre.
- Se pierden los colores de la tabla (la versión gratis de SheetJS no los escribe). Los datos quedan completos.
- No cambia ningún reporte ni sus datos. Se apaga en un equipo con `localStorage.bc_excel_real_off='1'`.

## Pruebas (Playwright, página de prueba con la misma tabla que Diagnósticos)
- Baja `Diagnosticos_C00002071_2026-11-05.xlsx`: un ZIP real con `xl/worksheets/sheet1.xml`, el título unido (`A1:E1`) y anchos de columna.
- El IMEI `352951035843398` queda como texto; el costo `1500.5` como número; «Pantalla rota · Batería 78%» se lee completo.
- Con cdnjs bloqueado, baja el `.xls` original. Sin errores.

## Estado
Rama `claude/excel-real`. **Sin publicar** (en Bayol, publicar es subir a `main`).
