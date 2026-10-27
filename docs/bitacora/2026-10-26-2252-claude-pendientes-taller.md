# Pendientes del taller: decisiones del dueño del 27-oct

**Dueño:** «1- si, 2- si, 3- ok, 4- si, 5- si, 6- si, 7- si». Para el 7 aclaró después: «No pedír».

| # | Decisión | Qué se hizo |
|---|---|---|
| 1 | Candados de Reacondicionados en el servidor | Se armó `20261027000000_reacond_candados_servidor.sql`, que junta 20261026014900 y 20261026151000 en una sola transacción. Se validó en un Postgres local: 2 disparadores y la evaluación OK. **No se aplicó por el conector:** retuvo la sentencia, sin respuesta, y no quedó nada a medias (md5 sin cambios). El dueño la pega en el SQL Editor. |
| 2 | Traza del precio de venta | **Aplicada en la base**: columnas `precio_venta_fuente`, `_por` y `_en`, y 2 checks (uno `not valid`). Se renombró a `20261026020000_reacond_precio_venta_traza.sql`. `taller-reacond-rentabilidad.js` (`?v=20261027-rr2`) ahora las envía al anotar o quitar un precio. |
| 3 | Datos viejos (solo diagnóstico) | D1 = 32 despachados sin fecha (todos recuperables); D2 = **209 tareas en 96 equipos** (la auditoría decía 60 en 36); D3 = 19 piezas; D4 = 9; D5 = 4. No se cambió nada. |
| 4 | Piezas sin descontar | 19, pero solo 3 están «recibida» (2 baterías de iPhone 11 y 1 de iPhone 8 Plus); 16 están «aprobada» o «pendiente». Se recomienda descontar solo las 3 recibidas. **No se escribió en Info Plus.** |
| 5 | Orden repetida en Atención | En «Órdenes · Activas» ya no salen las que tienen sección arriba (Por entregar, Esperando cliente, Reparación externa, Sin reparación). Al buscar, se ven todas. `taller-app.min.js?v=20261027-p1`. |
| 6 | Botones de Proveedores | Ya estaban en vivo desde la publicación de los 10 agentes (`taller-ui-despachos.js`): «Nueva compra», «Importar manifiesto», «Liquidación de aduana». |
| 7 | Precio al despachar | No se pide (aclaración del dueño). Se anota después con «Anotar». |

**Pruebas:** ui-global, prefactura-confiable y reacond-flujo-completo OK, sin errores de JavaScript.

**Rama:** `claude/taller-pendientes`. Falta el «publícalo» para la pantalla y que el dueño pegue el SQL de los candados.
