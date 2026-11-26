# 2026-11-25 21:00 RD · Claude — Info Plus: la API de la app móvil sí factura (falta usuario)

Sigue a `2026-11-25-2052-claude-infoplus-puertas-escritura.md`. El dueño pidió «Sigues intentando».

## Qué se hizo
- **Se apagó la función temporal** `infoplus-explorar-20261126`. Ahora está en la versión 5 y responde 410 «retirada».
- **GET /Prefactura** (apicliente) falla en todas las fechas y formatos probados. Responde 200 con «Input string was not in a correct format» y 0 registros, desde 2025-06 hasta hoy, con `entregada` en true o false. Ya fallaba el 19-oct (`infoplus-prefactura-ver` está apagada por eso). Es un error de Info Plus.
- **Ayuda revisada**:
  - `DespachoModel` trae `codfactura` y `tipodespacho`. Podría servir para «despachar una factura» con sus `seriales`, pero no se probó.
  - `PreFacturaModel` trae `codprefactura` y `credito`.

## Hallazgo: segunda dirección `api.infoplusplatinum.com` («ApiMobileInfoplus»)
- Tiene 109 rutas; `apicliente` tiene 52. Es la API de la app móvil de Info Plus.
- Para escribir trae: **POST Factura**, **Factura_offline**, **FacturaPuntodeVenta**, Devolucion, Conduce, Cotizacion, OrdenServicio, Cliente, ComprobanteCaja, Ingresos y Arqueo. También PUT FacturaFiscal y DsvFiscal.
- `FacturaModel` trae:
  - **`seriales`**: el IMEI va en la factura misma;
  - `codprefactura`: facturar una prefactura;
  - `ncf`, `rnc`, `formasPago`, `notasaplicadas`, `credito`, `abono`, `descuento`, `codtaller`, `urlecf` y `codigoseguridad`: e-CF.
- `DevolucionModel` trae `codfactura`, `ncfafectado` y `seriales`.
- **Cómo entra:**
  - `POST api/Login` recibe Username, Password, Domain…
  - sin sesión, las rutas responden 401 «Authorization has been denied».
  - `GET api/Version` responde 200 «Ok» sin clave.
  - La clave de la API que dio Dagoberto (`basedatos` + `clave`) es otra y no sirve aquí.
- Sondeos hechos:
  - solo GET de `Version`, `Localidad`, `TasaCambio` y `Categoria`, sin credenciales;
  - **no se envió nada a POST** (sin clave podría no haber control y crear algo vacío).

## Qué falta (lo decide el dueño con Dagoberto)
1. Un **usuario de Info Plus solo para el sistema**, con permisos limitados a facturar en el almacén del taller, y el `Domain` que va en el Login. El dueño lo escribe él mismo como secreto de Supabase. Nunca va en el chat ni en el repo.
2. Que Dagoberto confirme:
   - que se puede usar esta API desde un servidor;
   - si la factura con `seriales` descuenta el IMEI;
   - cómo se pide el NCF/e-CF;
   - si existe un ambiente de prueba.
3. **Escribir en Info Plus requiere la autorización expresa del dueño.** Primero se hace una prueba en el ambiente de prueba o con una factura de RD$ 0 que él apruebe.

## Archivos
- Solo esta bitácora. No se tocó código ni la base de datos.
- Edge `infoplus-explorar-20261126`: v5 (410).

## Siguiente paso recomendado
Mandarle a Dagoberto el mensaje con los puntos 1 y 2. Con el usuario puesto, se arma la **«Facturar desde el taller»**:
- prefactura → factura con IMEI;
- devolución con IMEI;
- todo con el candado de doble toque y la confirmación del dueño.
