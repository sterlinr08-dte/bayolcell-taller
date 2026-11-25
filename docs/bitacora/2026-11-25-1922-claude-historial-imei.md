# Historial del IMEI (línea de tiempo) — 25-nov-2026

## Pedido del dueño

> «Que en el historial de ese IMEI aparezcan todas las novedades, todo el histórico de todos los movimientos que ha tenido el equipo… verifica todo lo que puedas hacer para sacarle provecho.»

Eligió la **opción A**: la línea de tiempo con lo que guarda el taller y, desde hoy, la anotación de los ajustes con IMEI. Descartó:
- **B**: la foto diaria de Info Plus;
- **C**: el mensaje a Dagoberto.

## Verificación (base del taller)

| Fuente | Datos |
|---|---|
| `infoplus_seriales` | 2,246 IMEI de compras (ene-2025 → 23-nov-2026) |
| `equipos_refurbish` + `equipo_historial` | 367 equipos y 1,989 pasos |
| `equipos` + `ordenes_reparacion` + `orden_historial` | 256 equipos de clientes |
| `despachos_almacen` | 27 de 29 despachos con IMEI en `items` |
| `recepcion_prefacturas` | 9 de 83 con IMEI |
| Otras | `financiamientos`, `diagnosticos`, `bateria_registros`, `pantalla_registros`, `inv_fisico_lineas` |

Huecos encontrados:
- Los ajustes con IMEI (− / +, Corregir IMEI, entrada al registrar) no quedaban anotados con su IMEI en el taller.
- `infoplus_ventas`: 0 de 71,032 líneas traen IMEI, así que la venta no puede salir.
- Lo que se mueve directo en Info Plus no se ve.

## Cambio

### Migración `20261125200000_historial_imei.sql` (falta aplicarla al publicar)
- Tabla `imei_movimientos` (imei, tipo entrada/salida, artículo, almacén, documento, nota, usuario, fecha).
  - RLS igual que `despachos_almacen`: `app_is_admin()` o `app_actor_es_tecnico_activo()`.
- RPC `imei_historial(p_imei)`:
  - es `security definer` y exige admin o técnico activo;
  - junta todas las fuentes en `[{f, tipo, t, d, ref}]` ordenado por fecha;
  - **sin costos, claves ni cuentas del cliente**;
  - los almacenes salen con su nombre (`imei_alm_nombre`).
- Se probó solo leyendo con un IMEI real (357676150562102): compra → lote C00002041 → asignado a técnico → listo para venta → despacho DA00003680 Taller → Oficina.

### `taller-app.js` / `taller.html` (`?v=20261125-himei1`)
- `_infoplusAjustePieza`: si Info Plus acepta un ajuste con IMEI, se anota cada IMEI en `imei_movimientos` con `_imeiAnotar`, que nunca frena el ajuste. Cubre Ajuste de inventario, Corregir IMEI, la entrada al registrar y cualquier otro ajuste con IMEI.
- `abrirHistorialImei(imei)`:
  - campo IMEI de 48 px y botón «Buscar»;
  - arriba: «Ahora: <almacén>», en vivo desde Info Plus;
  - debajo, la línea de tiempo con ícono por tipo, del más nuevo al más viejo;
  - los estados salen con nombre normal («Listo revisión → Listo venta»);
  - ⓘ con lo que incluye y lo que no.
- Entradas:
  - Despacho: botón «Historial del IMEI»;
  - ficha del equipo: «Más acciones» → «Historial del IMEI»;
  - Ajuste de inventario: tocar un IMEI de la lista abre su historial.

## Pruebas (Playwright a 1280 y 390 px)

- Ajuste −1 +1: Info Plus recibe la salida y la entrada, y quedan anotadas 3 filas en `imei_movimientos` (imei, tipo, almacén, Nº AI…, nota).
- Historial: «Ahora: Oficina Santiago», 6 movimientos en orden.
- Ningún control mide menos de 44 px.
- Sin errores de consola.

## Estado

- Rama `claude/historial-imei`, sin publicar.
- Al publicar: aplicar la migración primero y después fusionar.
