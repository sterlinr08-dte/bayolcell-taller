# Kárdex del artículo y venta deducida en el Historial del IMEI — 26-nov-2026

El dueño eligió «3 · Las dos» de la auditoría de la API (`*-claude-api-infoplus-kardex.md`).

## 1. Venta deducida (migración `20261126090000_historial_imei_venta.sql`)

- Nueva `imei_alm_codigo(text)`, que pasa el nombre del almacén a su código.
- `imei_historial` agrega lo siguiente:
  - **Último lugar conocido** del IMEI: el despacho (`despachos_almacen`, almacén destino y código del ítem), ajuste (`imei_movimientos`) o lote (Taller 6) más reciente.
  - Si lo último **no** es una salida por ajuste, busca en `infoplus_ventas` las facturas del mismo código en ese almacén desde esa fecha.
    - Si hay una sola: «Venta (deducida)».
    - Si hay varias: «Posible venta», con las 3 primeras y el total.
- La pantalla esconde estas filas si Info Plus dice que el IMEI sigue en un almacén.
- Comprobado solo leyendo con el IMEI 357676150562102: DA00003680 Taller → Oficina (22-oct) y luego **una sola** venta del 1133 en Oficina, CO00098453 (23-oct).
- De 114 IMEI despachados:

| Resultado | IMEI |
|---|---|
| Deducción clara | 21 |
| 2 o 3 candidatas | 20 |
| 4 o más | 7 |
| Sin venta todavía | 66 |

## 2. Kárdex del artículo

### Edge nueva `infoplus-kardex`
- Solo lectura: GET `/TransaccionInventario`.
- Acceso: admin o técnico activo.
- Filtra por código, hasta 365 días, en tramos de 31 días.
- Devuelve fecha, tipo, entrada o salida, almacén, documento y cantidad. Sin costos.

### Pantalla `abrirKardexArticulo(cod)`
- Elegir el artículo, el período (30, 90, 180 o 365 días) y el almacén.
- Arriba, un resumen de entradas y salidas por almacén.
- Debajo, la lista: «+1 Despacho · DA…», «−1 Venta · CO…», etc.
- Tiene ⓘ.

### Entradas
- Despacho: «Kárdex del artículo».
- Ficha del equipo: Más acciones.
- Botón «Kárdex» en el Historial del IMEI.

Versión `?v=20261126-kdx1`.

## Pruebas (Playwright, 1280 y 390 px)

- IMEI fuera de los almacenes: sale «Venta (deducida)».
- IMEI que sigue en Oficina: no sale.
- Kárdex:
  - resumen OFICINA +1 −1 y TALLER +1 −1;
  - lista Venta CO… / Despacho DA… / Compra C…;
  - el filtro «Taller» funciona.
- Ningún control mide menos de 44 px.
- Sin errores de consola.

## Estado
- Rama `claude/kardex-y-venta`, sin publicar.
- Al publicar:
  1. desplegar la Edge `infoplus-kardex`;
  2. aplicar la migración;
  3. fusionar.
