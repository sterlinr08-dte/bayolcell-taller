# Prefactura: el artículo entra al instante; Info Plus confirma detrás (1-nov-2026)

**Pedido del dueño:** «Siento que al seleccionar un artículo para prefacturar dura mucho en cargar a la pantalla de prefactura». Eligió la opción A.

## Diagnóstico (fuente: `_rpAgregarArticulo` en `taller-app.js` + logs de Supabase)
Antes de pintar la línea se esperaban, **una detrás de otra**, dos Edge Functions que van a Info Plus:
1. `infoplus-imei-almacen` (`pregunta:'serial'`, ¿lleva IMEI?): p50 261 ms, p90 954 ms (solo la primera vez por código y sesión).
2. `infoplus-existencia-art` (existencia en vivo en 6 almacenes): p50 292 ms, p90 394 ms, máx 3,979 ms (siempre).
Más el viaje RD → Supabase (us-east-1) y el arranque en frío de la función. Total percibido: 1–5 s sin nada en pantalla. No es la PC.

## Cambio
- `taller-app.js` · `_rpAgregarArticulo`: la línea se agrega **al instante** con lo que el taller ya sabe (existencia sincronizada; si lleva IMEI según lo recordado o, si no, el nombre), marcada `comprobando`. Las dos preguntas corren **a la vez** por detrás; al volver: se actualiza la existencia viva, se corrige si lleva IMEI o no (si Info Plus dice que lleva, la línea pasa a IMEI y se abre su ventana; si dice que no y no hay IMEI escrito, vuelve a cantidad 1), y si no hay existencia sale el aviso «Sin stock». Si la quitaron mientras tanto, no revive.
- **Candado:** se movió de «antes de pintar» a «antes de guardar». `_rpGuardar` espera las comprobaciones pendientes (`_rpComprobando`) y `_rpProblemasFactura` ya bloquea por existencia o IMEI faltante. Ningún cambio en dinero, inventario ni en lo que se manda a Info Plus.
- `_rpSerialCache` se recuerda 7 días en `localStorage bc_rp_serial` (antes, solo por sesión).
- `taller-prefactura.js` · `pintarCarrito`: etiqueta gris «Comprobando…» bajo el código mientras dura; escucha `rp:serial` y abre la ventana del IMEI cuando Info Plus confirma detrás. `taller-prefactura.css`: estilo de la etiqueta (icono girando; quieto con «reducir movimiento»).
- `taller.html`: versiones `taller-app.min.js?v=20261101-o6`, `taller-prefactura.js?v=20261101-i34`, `taller-prefactura.css?v=20261101-n21`. `taller-app.min.js` regenerado con `scripts/minificar.sh`.

## Pruebas
- Nueva `scripts/pruebas/prefactura-instantanea.cjs` (Info Plus simulado con 2 s de demora), 1280 y 390 px, 18/18 OK: la línea entra en 5–7 ms; etiqueta sale y se quita; Guardar espera ~2 s y luego guarda; sin stock real: entra, se pone roja, avisa y bloquea; artículo que lleva IMEI sin decirlo en el nombre se convierte a línea con IMEI y se recuerda; línea quitada a tiempo no revive; sin errores JS.
- Regresión: `prefactura-delivery`, `prefactura-confiable`, `prefactura-boton-precio`, `prefactura-stock-otras`, `prefactura-linea-referencia`, `ui-global`, `sin-internet`: 0 fallos.

**Rama:** `claude/prefactura-instantanea`. **No publicado** (espera OK del dueño).

**Riesgo bajo:** si la caché sincronizada dice que hay existencia y en vivo no hay, la línea aparece y ~0.3–4 s después se pone roja; antes ni aparecía. Guardar nunca pasa sin la comprobación.
