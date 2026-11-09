# 2026-11-09 18:10 · Claude · Prefactura compacta (sin publicar)

## Pedido del dueño
«¿Qué mejoras podemos hacer a la interfaz de prefactura?» Se revisó la pantalla a 390 y 1440 px y se le dieron 7 propuestas. Eligió todas: «1+2 · Arriba compacto», «3+4 · Artículos en 2 filas», «5+6 · Nombres y Nueva» y «7 · PC: cliente en el Resumen».

## Qué se hizo
Es una capa nueva, aparte y reversible: `bc-prefactura-compacta.js` y `bc-prefactura-compacta.css` (versión c1). Se carga después de `bc-prefactura-pro`. La capa **solo mueve y decora** lo que ya pinta `taller-prefactura.js`. No toca Info Plus, la base ni los cálculos. Precio, descuento, cantidad y Guardar siguen con `_rpPrecio`, `_rpDescPct`, `_rpCant` y `_rpGuardar`.

| # | Antes | Ahora |
|---|---|---|
| 1 | En el celular, Precio, Almacén y Vendedor ocupaban unos 300 px. | Una píldora «Cliente final · Santiago · Esterlin»; un toque la abre. Se abre sola si falta el almacén o el vendedor, y se cierra sola cuando ya están. |
| 2 | Nombre, Cédula y WhatsApp, en ese orden. | WhatsApp primero. Al llegar a 10 cifras llama a `chequearClienteExistente()` (la de siempre) y llena el nombre y la cédula sin pisar lo escrito. En el celular, la cédula queda detrás de «+ Cédula» y sale sola si ya tiene. |
| 3 | Cada artículo medía unos 260 px en el celular. | Unos 163 px. Nombre e importe arriba; precio, cantidad y «%» abajo. El descuento por línea sale al tocar «%» (o solo, si ya tiene). |
| 4 | Accesos rápidos encima de «Buscar artículo». | Buscador arriba y accesos debajo. |
| 5 | Nombres en MAYÚSCULAS de Info Plus. | «Bateria Samsung A12», «Protector Cristal iPhone 13 de 6.1». Las palabras con números o de 3 letras quedan igual (A12, 5G, USB, SIM, ZTE). Solo cambia en pantalla: `_rpState.items[].desc` y lo que va a Info Plus siguen con el nombre original. |
| 6 | «Nueva» al lado de «Enviar cuentas de pago» y «Pedir reseña». | «+ Nueva» arriba: en el celular junto a «BAYOL CELL», en PC después de la fecha. Usa el mismo botón y la misma confirmación «¿Empezar una prefactura nueva?». |
| 7 | En PC (≥ 1440 px), hueco bajo el Resumen. | WhatsApp, nombre y cédula pasan a la columna «Resumen», arriba del total. Por debajo de 1440 px vuelven a su lugar. |

Ojo: el nombre «Bateria» sale sin tilde porque Info Plus lo guarda así.

## Archivos
- Nuevos: `bc-prefactura-compacta.js`, `bc-prefactura-compacta.css`, `scripts/pruebas/prefactura-compacta.cjs`.
- `taller.html`: la marca `html.bc-pfc` en el `<head>` (antes del primer pintado), el CSS y el JS (`defer`).
- Pruebas ajustadas a la capa nueva:
  - `prefactura-delivery.cjs`: acepta los accesos debajo del buscador.
  - `prefactura-linea-referencia.cjs`: compara sin importar mayúsculas.
- Sin migraciones, RPC ni Edge Functions.

## Apagar
- Para todos: `var BC_PFC=false` en `taller.html`.
- En un equipo: `localStorage.bc_pfc_off='1'`.

## Pruebas (banco local, datos inventados)
- `prefactura-compacta.cjs` a 390, 1280 y 1440 px y con la capa apagada: **Todo bien**.
  - nombres;
  - nombre original para Info Plus;
  - buscador arriba;
  - WhatsApp primero y autollenado al llegar a 10 cifras;
  - píldora que pliega y abre;
  - cédula plegada que sale sola;
  - «%»;
  - artículo ≤ 170 px;
  - cliente en el Resumen a 1440;
  - botones ≥ 44 px;
  - sin desplazamiento horizontal ni errores de JavaScript.
- Pasan con la capa encendida: `prefactura-delivery`, `prefactura-instantanea`, `prefactura-linea-referencia`, `prefactura-precio-minimo`, `prefactura-confiable` (T1–T8) y `guardar-rapido`.
- `prefactura-boton-precio` y `prefactura-stock-otras` ya fallaban **con la capa apagada**, en el `main` actual: son pruebas viejas, no de este cambio.

## Estado
- Rama `claude/prefactura-compacta`, sin publicar. Falta el OK del dueño («Publícalo»).

## Siguiente paso
- Si el dueño lo aprueba: PR a `main`, verificar en vivo y escribir la bitácora de publicación.
- Pendiente aparte: actualizar las 2 pruebas viejas que ya fallaban.
