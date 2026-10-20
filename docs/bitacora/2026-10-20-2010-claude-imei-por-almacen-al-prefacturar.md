# 2026-10-20 20:10 · Claude · IMEI por almacén al prefacturar (sin botón)

## Pedido del dueño
«No es un botón. Es que cuando se vaya a prefacturar salgan los IMEI de ese artículo en su almacén.»

Regla: 7 almacenes y 7 iPhone, uno en cada uno. La empleada del almacén 1 solo ve el IMEI del iPhone del almacén 1.

## Qué se hizo
- **Nueva Edge `infoplus-imei-almacen`** (v1, `verify_jwt`):
  - Entrada: `{codarticulo, codalmacen}`. Solo atiende a usuarios con sesión.
  - Solo hace GET a Info Plus. Nunca escribe allá y nunca devuelve la clave.
  - Info Plus no documenta qué ruta da las series por almacén. Por eso prueba 8 candidatas: variantes de `ListaArticulos?tipo` con artículo y almacén, y `InventarioActual`.
  - Solo acepta IMEI de registros que digan **explícitamente** el artículo Y el almacén pedido. Si ninguna ruta lo dice, devuelve una lista vacía. Así nunca sale un IMEI de otro almacén.
  - La primera ruta que funcione queda guardada como `FUENTE_OK` en `infoplus_diagnostico` y desde ahí se usa directo.
  - Mientras no aparezca esa ruta, hace como máximo una ronda de prueba cada 10 minutos.
  - Cada intento queda anotado en `infoplus_diagnostico`, que solo ve el admin.
- **`taller-prefactura.js` (o1):**
  - la ventana IMEI vuelve a tener la lista, ahora titulada «IMEI en <almacén>»;
  - pide la función con el almacén de la prefactura (`rxAlmacen`), que para las empleadas es el fijo de su sucursal;
  - ya no usa `infoplus_seriales`, que eran las compras de todos los almacenes;
  - si no hay IMEI confirmados, dice «Info Plus no dio IMEI de este artículo en <almacén>. Escanee o escriba el IMEI».
- **Función retirada:** `infoplus-diagnostico-series` (v4 → 410). La reemplaza la nueva.

## Pruebas
- Nueva prueba `imeialm` 10/10. Con Info Plus simulado (almacén 1 con 3 IMEI y almacén 7 con 1), en Navarrete se pide el almacén 7 y solo sale su IMEI.
- `pftest` 49/49, `pfopc` 52/52 y `almfijo` 24/24.

## Riesgo / pendiente
Falta saber si alguna de las rutas candidatas de Info Plus devuelve de verdad los IMEI con su almacén. Se sabrá con el primer uso real:
- **Si ninguna lo hace:** la lista sale vacía, que es lo seguro. Se revisa `infoplus_diagnostico` para ver qué respondió cada ruta y, si hace falta, se pide el dato a Dagoberto.

## Estado
Rama `claude/prefactura-limpia`, **sin publicar**.
