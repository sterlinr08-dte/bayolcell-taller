# 21-oct-2026 13:00 · Claude · Prefactura impresa: rediseño (ticket 80 mm y hoja carta)

## Pedido del dueño
«Vamos a diseñar bien la prefactura».

Se siguió `DESIGN.md`: tinta `#0f172a`, acento naranja Bayol `#e4572e`, letra del sistema, cifras alineadas y `RD$ 1,250.00`.

## Cambios (`bc-prefactura-imprimir.js`, `?v=20261021-i3`)
- **Código de barras** CODE128 con el Nº de la prefactura (JsBarcode, que ya carga el taller). La cajera lo escanea en Info Plus en vez de escribirlo. Si la librería no carga, la prefactura sale sin barras.
- **Hoja carta**:
  - franja naranja arriba;
  - logo, nombre y sucursal;
  - a la derecha, la píldora «PREFACTURA», el Nº grande y las barras;
  - fila de datos con Cliente (cédula y teléfono si los hay), Fecha («21 oct 2026, 3:42 p. m.»), «Le atendió» y Almacén;
  - cuadro de Equipo y Falla;
  - tabla con #, descripción, código e IMEI debajo, cantidad, precio, descuento e importe;
  - abajo, «¿Cómo pagar?» con la nota del cliente, y los totales con el **Total en bloque oscuro**;
  - pie con el agradecimiento y el Nº;
  - la «COPIA» va como marca de agua y como sello.
- **Ticket 80 mm** (negro solo, para la térmica):
  - banda negra «PREFACTURA», Nº de 22 px y barras;
  - datos en dos columnas;
  - equipo y falla en bloque aparte;
  - artículos, conteo, subtotal y descuento, y TOTAL grande;
  - nota y pie.
- Texto del pie: «Este documento no es una factura fiscal. Preséntelo en caja para pagar y recibir su factura con comprobante».

## Pruebas
- Vistas previas de ticket, carta, carta COPIA y PDF carta, guardadas en el scratchpad (`pfd-*`).
- `pfimp2.mjs`: 8 PASS / 0 FAIL.

## Estado
Rama `claude/prefactura-limpia`, sin publicar.
