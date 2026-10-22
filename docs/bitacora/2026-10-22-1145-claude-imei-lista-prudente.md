# 2026-10-22 11:45 · Claude · IMEI: «lista prudente» activada (opción B del dueño)

- **Dueño:** «B, actívala». Ver la investigación en `2026-10-22-1130-claude-infoplus-api-series-investigacion.md`.
- **Edge `infoplus-imei-almacen` v7** (`LISTA_ACTIVA = true`):
  - cuenta las series de `listaserie` del artículo por almacén (por nombre de localidad);
  - consulta en vivo la existencia de los 6 almacenes (`listaarticulos?codarticulo&codalmacen`);
  - muestra los IMEI del almacén pedido **solo si en todos los almacenes la cuenta = la existencia**;
  - si no cuadra, hay una localidad desconocida o falla una consulta, responde `imeis: []` con `prudente: 'no_cuadra'`, más las cuentas y existencias para revisar.
- **`taller-prefactura.js`** (`v=20261022-i1` en `taller.html`): con `no_cuadra`, la ventana dice «Este equipo se ha movido entre tiendas y Info Plus no confirma cuáles IMEI están aquí. Escanee o escriba el IMEI.»
- **Casos esperados:** 1169 y 1906 → no se listan. Un artículo sin transferencias → se lista.
- **Riesgo residual (aceptado por el dueño):** un intercambio cruzado entre tiendas del mismo modelo cuadra en números con un IMEI viejo.
- **Cuando Dagoberto agregue el filtro:** usar el filtro y dejar la comparación como respaldo.
