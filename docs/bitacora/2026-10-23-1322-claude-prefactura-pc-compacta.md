# Prefactura en PC: más compacta y con menos palabras — en rama, sin publicar

**Dueño (foto en PC):** «Vamos a poner más compacto y ahorra palabras.»

## Cambios (taller-prefactura.js i19, taller-prefactura.css n9; solo PC ≥761 px salvo los textos)
- Textos: «Nivel de precio» → **Precio**; «Nombre del cliente» → **Nombre**; «Cédula (opcional)» → **Cédula**; las opciones del
  almacén sin «Localidad / Oficina / Almacén» («Localidad Navarrete» → **Navarrete**). Se quita el subtítulo «Prefactura de Info Plus»
  (la pestaña ya dice Prefactura; el chip de estado «Crear / En Info Plus» se queda).
- Aire: documento 10/16 px; cabecera 8 px abajo; franja con 8–10 px; etiquetas a 2 px del campo; datos del cliente y buscador a 8–10 px;
  estado vacío 14 px; pie y tarjetas a 10–12 px. Campos siguen en 48 px y botones en 44.

## Medidas (banco local, 1280 px, 3 artículos)
| | Antes | Después |
|---|---|---|
| Alto del documento | 965 px | 900 px (−65 px, −7 %) |
| Campo Nombre | 48 px | 48 px |
Celular sin cambios (las reglas de aire son solo PC; los textos cortos aplican en los dos). Sin errores de JS.

## Nota
La rama trae también la impresión directa por QZ Tray (bitácora 12:21). Si se publica esto, sale junto; no cambia nada mientras
QZ Tray no esté instalado.
