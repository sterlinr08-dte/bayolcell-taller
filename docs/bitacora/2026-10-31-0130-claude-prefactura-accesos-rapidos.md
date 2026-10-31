# Prefactura: accesos rápidos en fila (31-oct-2026, 01:30 RD) — rama, SIN publicar

**Dueño:** «de manera horizontal, lineal, encima de buscar artículo, varios íconos: delivery, servicio, activación de chip y recarga».

**Fuente de verdad (`infoplus_articulos`):** 1161 ENVIO - MENSAJERIA {1:100, 2:50, 3:200} · 1121 SERVICIO TÉCNICO · 1187 ACTIVACION SIM CAR - E-SIM {1:100, 2:100} · 1186 RECARGA {1:25, 2:25}. Ninguno lleva existencia.

**Qué hace (`taller-prefactura.js` i30 / `.css` n16):**
- Fila de 4 botones (ícono y nombre debajo) encima de «Buscar artículo»: **Delivery · Servicio · Activación · Recarga**. El botón Servicio de al lado del buscador queda escondido (la fila usa la misma función `_rpAgregarServicio`).
- Activación y Recarga funcionan como el Delivery: agregan su artículo con el precio del nivel del cliente, precio editable por cualquiera, sin control de existencia, sin duplicar («Ya tiene recarga»), línea limpia a Info Plus. En la Recarga el cursor va directo al monto.
- Se mantiene el botón «+ Delivery RD$ 50» para clientes por mayor.

**Pruebas:** `prefactura-delivery.cjs` ampliada (fila de 4, ≥44 px, encima del buscador, sin Servicio repetido, Activación RD$100, Recarga RD$25 con cursor en el monto) «Todo bien» a 390 y 1280; `prefactura-confiable.cjs` sin errores.
