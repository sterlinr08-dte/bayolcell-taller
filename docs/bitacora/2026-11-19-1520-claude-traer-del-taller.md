# 19-Nov-2026 15:20 (RD) — Claude — «Traer del almacén Taller» en Reacondicionados

## Pedido
- El dueño preguntó: «Si en Infoplus se hace un despacho para taller, ¿por qué no veo ese equipo en Bayol Taller?».
- Luego: «Reacondicionado sí. Arma el botón».

## Diagnóstico (verificado en código y en `cron.job`)
- Los equipos de Reacondicionados (`equipos_refurbish`) solo entran de tres formas:
  - «Importar de Info Plus» (compras);
  - «Importar manifiesto»;
  - a mano.
- Ningún proceso lee los despachos de Info Plus.
- La existencia del almacén Taller se copia cada 30 min (`infoplus-sync-cada-min`, `*/30`).
- `infoplus_seriales` se llena solo con las compras de los últimos 10 días (6:20 UTC).
- La ventana IMEI de la Prefactura consulta en vivo.

## Cambios
- **Edge `infoplus-imei-almacen`**: nuevo modo `{ modo:'almacen_todo', codalmacen }` (`todoElAlmacen`).
  - Pide `listaserie&codalmacen` a Info Plus y deja solo las series cuya localidad es la del almacén.
  - Busca el artículo: primero por `infoplus_seriales` (código exacto); si no, por la descripción igual en `infoplus_articulos` (varios códigos = candidatos).
  - Solo lee: nunca escribe en Info Plus ni devuelve la clave. Exige sesión, como el resto de la función.
- **`taller-app.js`**: `traerDelTaller(loteId)` y `traerDelTallerAgregar(btn)`.
  - Solo administrador.
  - Carga el catálogo si hace falta.
  - Pregunta a Info Plus en vivo por el almacén 6 (Taller).
  - Quita los IMEI que ya están en cualquier lote: memoria y además confirmación en la base con `.in('imei', …)`, porque la memoria puede venir cortada.
  - Lista los demás con casilla. Los que no tienen artículo claro salen apagados, con aviso de agregarlos a mano.
  - «Agregar al lote» (candado contra el doble toque) inserta cada uno como «Recibido», igual que `agregarEquipoAlLote`:
    - modelo = marca + descripción;
    - costo = costo del artículo en Info Plus (el admin lo corrige luego);
    - nota «Traído del almacén Taller (Info Plus)».
  - Si falla la consulta: «No se pudo consultar Info Plus · Reintentar».
- **`taller.html`**:
  - botón `#btnTraerTaller` en el detalle del lote de Reacondicionados;
  - `taller-ui-reacond.js` lo pone primero en el menú «Info Plus ▾»;
  - solo visible para el administrador;
  - versiones: `taller-app.min.js?v=20261119-trt1`, `taller-ui-reacond.js?v=20261119-trt1`.

## Pruebas (taller servido en local; base e Info Plus simulados)
- Info Plus devuelve 3 IMEI en Taller: uno ya en un lote, uno con artículo y uno sin artículo.
- La ventana muestra 2:
  - el que tiene artículo, marcado, con código y costo;
  - el que no tiene artículo, apagado, con su aviso.
- Dos toques en «Agregar al lote» → **1** inserción:
  - IMEI `…002`, modelo «APPLE IPHONE 13 128GB», costo 18 000, estado «Recibido», en el lote abierto;
  - la ventana se cierra.
- 1280 y 390 px: botón de 44 px dentro de «Info Plus ▾». Sin errores de consola.
- **No verificado** contra Info Plus real ni la base real.
  - La función con el modo nuevo se despliega al publicar.
  - El `.min.js` lo regenera el robot `minificar.yml`.

## Estado
- Rama `claude/traer-del-taller`. Espera el «Publícalo».
