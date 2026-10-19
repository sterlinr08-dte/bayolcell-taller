# 19-oct-2026 — Qué campos de la prefactura de Info Plus se pueden llenar desde el taller (investigación)

## Pedido del dueño
Mostró la pantalla Prefactura de InfoplusWEB (Nº 118709) y preguntó qué se puede llenar desde la prefactura del taller. Autorizó indagar: «sí, indaga bien».

## Lo que ya se manda (`PreFacturaModel`, ver CLAUDE.md, 20-jul-2026)
- **Cabecera:**
  - número, fecha y hora;
  - cliente (código y nombre);
  - empleado (`codempleado`);
  - localidad (`codlocalidad`);
  - nivel (`codnivelprecio`);
  - total, crédito, impuesto y descuento;
  - `contrato` (aquí van la falla y las observaciones), `ordencompra`, `centro`.
- **Líneas:** artículo, descripción, precio y cantidad.
- **Seriales:** IMEI.

## Campos de esa pantalla que el taller tiene pero no llegan
| Campo en Info Plus | Dato del taller |
|---|---|
| **Comentarios** (sale vacío, aunque el taller manda la falla en `contrato`) | falla, observaciones, equipo e IMEI |
| **Cédula** | cédula o RNC |
| **Teléfono** | WhatsApp |
| **Atención** | nombre visible |
| **Fecha Entrega** | entrega estimada |
| **Pedido** o **Localizador** | número de orden del taller |

No aplican: Fax, Dirección, Cotización, Factura, Despacho, Moneda y Crédito.

## Sondeo de solo lectura (función temporal `infoplus-prefactura-ver`, ya desactivada en v3, devuelve 403)
- **`GET /api/prefactura` con número** (`codprefactura`, ruta `/118709`, `id`, `numero`): **405**, el método no existe.
- **`GET /api/prefactura` con fechas** (`fechainicial` / `fechafinal`): en todos los formatos responde **400 «Input string was not in a correct format»**.
  - Formatos probados: `2026-10-19`, `2026-10-1`, `10/19/2026`.
  - También con `codprefactura` y `codlocalidad`.
  - Es el mismo fallo de julio (`infoplus-prefactura-read`).
  - `19/10/2026` da «request is invalid».
- **`GET /api/factura`:** es un reporte de ventas (`FacturaID`, `ProductoID`, `CuentaDeFactura`…), con un modelo distinto. No sirve para conocer los campos de la prefactura.
- **Resultado:** por la API **no se puede leer** una prefactura. Los nombres de los campos extra de `PreFacturaModel` (comentario, cédula, teléfono, atención, fecha de entrega) siguen sin conocerse.

## Siguiente paso (decide el dueño)
1. **Preguntarle a Dagoberto** los nombres de esos campos en `PreFacturaModel` y en qué campo de la pantalla cae `contrato`.
2. **O crear una prefactura de prueba**, con autorización del dueño:
   - cliente contado y una línea de RD$1;
   - campos candidatos con nombres probables;
   - el dueño revisa en InfoplusWEB cuáles se llenaron y luego la anula.

No se envió nada a Info Plus y no se cambió ningún dato.
