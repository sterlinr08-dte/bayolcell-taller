# Ganancia por teléfono: precio sugerido de la venta deducida (y regla corregida) — 26-nov-2026

## Pedido
- El dueño preguntó «¿Ya podemos facturar?». Respuesta: no; la API no tiene una ruta para crear facturas, solo prefactura.
- De las ideas eligió **1 (ganancia por teléfono)** y **3 (movimientos de afuera)**.
- Para la 1 eligió **B: sugerir y él confirma**. La 3 sigue pendiente de su respuesta.

## Fase 0
- Rentabilidad (`taller-reacond-rentabilidad.js`, rr2) ya calcula el costo final (compra + flete + piezas) y el margen, pero solo con el precio anotado a mano.
- De 278 despachados con IMEI, ninguno tenía precio.
- Ya existían las columnas `precio_venta_fuente`, `precio_venta_por` y `precio_venta_en`.
- `infoplus_ventas.monto_venta` = PrecioVenta × cantidad, según `infoplus-ventas-sync`. El ITBIS va aparte (`MontoImpuestos`); que el precio no lo incluya está deducido del código, no comprobado en una factura.

## Error encontrado y corregido (afectaba la venta deducida publicada en PR #351)
- La factura CO00100054 vendió **1** unidad del 2199, pero la regla se la asignaba a **4** teléfonos. Los otros siguen en Oficina.
- En el Historial del IMEI la revisión en vivo («si sigue en un almacén, no sale») ya escondía esos casos, pero la regla sola era demasiado confiada.
- Regla nueva (migración `20261126110000_reacond_precio_sugerido.sql`):
  - `imei_ultimos_lugares()`: último lugar conocido de cada IMEI (despacho, ajuste del taller o lote). Solo admin o técnico.
  - `imei_venta_deducida(imei)`: es «clara» solo si hay **una** factura del código en ese almacén desde esa fecha **y** esa factura vendió al menos tantas unidades como teléfonos de ese código esperaban ahí antes de la venta. Si no, «Posible venta».
  - `imei_historial` usa esa función.
  - `reacond_precios_sugeridos()` (solo admin): despachados **sin** precio y con venta clara.
- Prueba en transacción con sesión de administrador (deshecha al final):
  - el iPhone 12 (…562102) sigue claro: CO00098453, RD$ 12,000;
  - los 8 IMEI del 2199 en Oficina ya no son claros;
  - salen 6 sugerencias;
  - CR00017540 aparece en 3 teléfonos y es correcto: vendió 3 unidades del 2060 a RD$ 21,000.

## Pantalla (`taller-reacond-rentabilidad.js/.css` → rr3)
- Al abrir Rentabilidad se cargan las sugerencias.
  - Antes de mostrarlas se revisa en vivo con `_ipDondeEstanImei` que cada IMEI ya **no** esté en ningún almacén.
  - Si esa revisión falla, no se sugiere nada.
- En lugar de «Sin precio de venta» aparece la píldora azul «Sugerido RD$ X», con ⓘ (factura, fecha y nota del ITBIS) y el botón **Usar**.
- «Usar» abre la ventana «Precio de venta» que ya existía, con el precio puesto, la línea «Info Plus · Factura CO…» y el margen.
- Solo se guarda al tocar **Guardar**:
  - con `precio_venta_fuente = 'infoplus'` si no cambió el precio, o `'manual'` si lo cambió;
  - con nota en `equipo_historial`: «Precio de venta anotado: RD$ … (Info Plus, factura …)».
- Lo anotado a mano nunca se toca.

## Pruebas (Playwright, 1280 y 390 px)
- Teléfono ya vendido:
  - sale «Sugerido RD$ 12,000.00» con el botón Usar;
  - la ventana trae 12000.00, la factura CO00098453 y el margen RD$ 5,500 · 45.8 %;
  - Guardar envía `precio_venta_real=12000` y `precio_venta_fuente='infoplus'`.
- Teléfono que sigue en Oficina: no hay sugerencia y queda «Sin precio de venta».
- Sin errores.

## Estado
- Rama `claude/precio-sugerido`, sin publicar.
- Al publicar: aplicar la migración y fusionar.
- Pendiente: la respuesta del dueño sobre la idea 3 (movimientos de afuera).
