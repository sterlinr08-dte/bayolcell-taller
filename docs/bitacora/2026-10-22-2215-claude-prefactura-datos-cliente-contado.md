# 22-oct-2026 22:15 · Claude · Prefactura: datos del cliente de contado hacia Info Plus (prueba)

**Dueño:** en Info Plus, con el cliente código 1 (CONTADO) se pueden escribir nombre, cédula, teléfono, fax, atención y
dirección en la misma prefactura. Quiere que el taller los mande y, si la API los acepta, que se vean allá.

## Estado
- `nombre` ya viajaba (campo «Cliente» del taller; si queda vacío va «CONTADO»).
- Prueba (`taller-app.js` p17, `main`): se mandan además `cedula` (c_cedula o c_rnc) y `telefono` (c_whatsapp). Son
  nombres de campo supuestos; si el `PreFacturaModel` no los tiene, Info Plus los ignora sin error.
- El taller no tiene campos de fax, atención ni dirección del cliente en Recepción; se agregan solo si la API los acepta.

## Prueba del dueño
Prefactura nueva con cliente de contado: escribir nombre, cédula y WhatsApp en el taller → ver en Info Plus si salen.
Si no salen, pedir a Dagoberto los nombres de los campos del modelo (nombre sí; cédula, teléfono, fax, atención, dirección).
