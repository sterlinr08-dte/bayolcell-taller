# 22-oct-2026 18:30 · Claude · Prefactura: con el IMEI completo se encuentra el artículo

## Pedido del dueño
«Poner la opción que si pongo el IMEI completo también funcione el artículo.» Hasta ahora era al revés: primero el
artículo y luego el IMEI. Ahora, en la pestaña **«Buscar o escanear»** de Recepción/Prefactura, al escribir o
escanear un IMEI completo sale el artículo y, al agregarlo, el IMEI queda puesto en su línea.

## Cómo funciona (rama `claude/imei-busca-articulo`, sin publicar)
1. **Pantalla** (`taller-recepcion.js` g2): si lo escrito son 15–17 dígitos seguidos (espacios o guiones aparte), se
   espera 200 ms y se pregunta a la Edge `infoplus-imei-almacen` con `{ imei, codalmacen }` (almacén de la prefactura).
   - Encontrado → aviso verde «IMEI … → artículo» y una sola fila lista para agregar. **Enter** o «+» agrega el artículo
     y le pone ese IMEI (la cantidad sale sola). Si el escáner manda Enter antes de la respuesta, se agrega solo al llegar.
   - Varios códigos con el mismo nombre → aviso y las filas de cada código para elegir.
   - No está → aviso ámbar «Info Plus no tiene ese IMEI…». Si está en otro almacén, lo dice («lo tiene en MOCA, no en
     Oficina Santiago»).
   - Artículo que no lleva IMEI (iPad, accesorio) → se agrega sin IMEI y avisa.
   - La regla de existencia de siempre se mantiene (`_rpAgregarArticulo`): sin stock en el almacén, no se agrega.
   - Si se cambia el almacén con el IMEI escrito, vuelve a buscar. Las búsquedas por nombre o código no cambian.
2. **Edge `infoplus-imei-almacen` → v9** (desplegada; el modo nuevo solo actúa cuando viene `imei`):
   1) `infoplus_seriales` (compras sincronizadas a diario): IMEI → `codproducto` exacto;
   2) si no está ahí, `listaserie&codalmacen=<almacén>`: la serie da la descripción → códigos de `infoplus_articulos`
      con esa descripción; con varios, prueba `listaserie&codarticulo` por cada uno y gana el que trae la serie;
   3) si no está en ese almacén, mira los demás y devuelve `en_otro_almacen`.
   Respuesta: `{ ok, imei, codigo?, descripcion, fuente: 'compras'|'listaserie', candidatos?, en_otro_almacen? }`.
3. `taller-recepcion.css` g2: aviso `.bcrx-ppk-imei` (verde/ámbar, 13.5 px). `taller.html`: versiones g2.

## Pruebas (banco local con la Edge simulada, Playwright 390 y 1280 px) — **34/34**
Encontrado por compras, Enter, escáner con Enter adelantado, 2 candidatos, no está, otro almacén, iPad sin IMEI,
texto normal y código corto sin consultar la Edge, sin existencia no agrega. Fila 54 px y «+» ≥44 px.
La prueba destapó un fallo: con 14 dígitos ya consultaba (un IMEI tiene 15); se corrigió con 15 mínimo y 200 ms de espera.
Capturas: scratchpad `imeibus/cap-*.png`.

## Datos reales comprobados
- `infoplus_seriales`: 2,050 IMEI, última sincronización 22-oct 06:20 UTC. El IMEI 357504274495225 → código **2815**
  (no 1125 ni 1143: el mismo nombre tiene varios códigos). 358259427945431 no está en las compras → entra por listaserie.

## Riesgos / pendientes
- No se probó de punta a punta con Info Plus real (no hay sesión de usuario aquí): probar en vivo tras publicar.
- Si `codarticulo` no filtra en `listaserie`, un IMEI que no esté en las compras y cuyo nombre tenga varios códigos
  saldrá como «elija el correcto».

## Siguiente paso
Que el dueño lo vea; con «publícalo» pasa a `main` (frontend). La Edge v9 ya está en producción y no cambia nada
para las llamadas de siempre.
