# 2026-10-31 04:15 — Claude — ¿Se puede facturar por la API de Info Plus?

## Dueño
«Confirma si con la API podemos también facturar.»

## Fuente revisada
Página pública de ayuda `https://apicliente.infoplusplatinum.com/Help` (sin clave), leída en vivo hoy.

## Resultado
- Rutas que **escriben** (POST): solo `Ajuste`, `Articulo`, `Despacho`, `Prefactura` y `Compra`.
- `api/Factura` existe **solo como GET** (reporte de ventas por fecha o rango, con `presupuesto` opcional).
- **No hay POST de factura:** la API no puede crear facturas ni cobrar. El taller llega hasta la prefactura; la factura con NCF la sigue haciendo la caja en InfoplusWEB.
- No se escribió nada en Info Plus.

## Siguiente paso
Si el dueño quiere facturar desde el taller, hay que pedirle a Dagoberto un `POST api/Factura` (o «convertir prefactura en factura») con NCF y forma de pago. Mientras, se puede leer `GET api/Factura` para marcar la prefactura como «Facturada».
