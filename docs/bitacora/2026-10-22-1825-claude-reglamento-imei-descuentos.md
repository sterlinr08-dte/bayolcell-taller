# 22-oct-2026 18:25 · Claude · Prefactura: IMEI lo decide Info Plus, IMEI a mano comprobado, tope de descuento, descuento RD$, comentario

## Pedido del dueño (dictado; «email» = IMEI)
1. Que el sistema detecte solo qué equipos llevan IMEI: «cuando ve la palabra celular le asigna IMEI sin tener».
2. El IMEI escrito a mano tiene que existir en Info Plus para poder prefacturar.
3. Hacer un reglamento para que eso funcione bien.
4. Comentario: Dagoberto pidió verificar que esté puesto.
5. Descuento: por ciento con un límite, y además en dinero (en Info Plus sale en otro lugar).

## Cambios (rama `claude/imei-busca-articulo`, sin publicar; sigue a la bitácora 1830)
- **Edge `infoplus-imei-almacen` → v10** (desplegada): modo `{ pregunta: 'serial', codarticulo }` → `{ serial, fuente }`.
  `serial = true` si hay series del código en `infoplus_seriales` (compras) o en `listaserie&codarticulo` de algún
  almacén (si el filtro se ignorara, exige la misma descripción). Si Info Plus no responde → 502.
- **`taller-app.js` (p8):**
  - `_rpEsSerial(cod, desc)`: pregunta a la Edge y guarda la respuesta por sesión; sin respuesta, decide por el nombre
    (`_abCat === 'celular'`) como antes. `_rpAgregarArticulo` la usa.
  - `_rpAgregarImei(i, v, validado)` ahora es `async`. Si el IMEI no viene comprobado (`validado`), `_rpComprobarImei`
    exige 15–17 dígitos y pregunta a la Edge `{ imei, codalmacen }`: rechaza si no existe, si está en otro almacén o si es
    de otro artículo (dice cuál). Lista y buscador pasan `validado = true`.
  - Descuento: `_rpDescMaxPct()` lee `config_taller.prefactura_desc_max_pct` (10 si no está); `_rpDescPct` recorta y avisa.
    Nuevo `_rpDescMonto(v)` (RD$ sobre toda la prefactura) con tope líneas + pesos ≤ máximo % del subtotal.
    `_rpTotales(items, descMonto?)` devuelve además `descLineas` y `descMonto`. Modelo a Info Plus: `descuento` y
    `descuentototal` incluyen el dinero; `total` lo resta. Se guarda en `recepcion_prefacturas.descuento_monto` y se
    recarga al editar.
  - Comentario: el modelo manda `contrato` (como hasta hoy) **y** `comentario` con el mismo texto; falta que el dueño
    confirme en Info Plus cuál se ve.
  - Configuración → Datos del taller: campo «Descuento máximo en la prefactura (%)» (`cfgDescMaxPct`), se carga y guarda.
- **`taller-prefactura.js` (i2):** fila «Descuento RD$» en los totales (campo 48 px, letra 16 px, `taller-prefactura.css` n2);
  «Descuento por línea» aparte; lista de IMEI pasa `validado`; texto de la ventana IMEI y nota del comentario actualizados.
- **`taller-recepcion.js` (g3):** el IMEI encontrado por el buscador entra como `validado`.
- **SQL (aplicado en producción, `supabase/migrations/20261022190000_prefactura_descuento_tope.sql`):**
  `config_taller.prefactura_desc_max_pct numeric default 10`, `recepcion_prefacturas.descuento_monto numeric default 0`.
- **`REGLAMENTOS.md`** nuevo (prefactura e IMEI, descuentos, comentario); `CLAUDE.md` lo señala al inicio.

## Pruebas (banco local con la Edge simulada, Playwright)
- `prueba2`: **18/18** — iPad con series en Info Plus pide IMEI; «CELULAR …» sin series no lo pide; si Info Plus falla,
  por nombre; respuesta guardada por sesión; IMEI de 7 dígitos rechazado sin consultar; no existe / otro artículo /
  otro almacén → rechazados con su mensaje; correcto → agregado; candidatos que incluyen el artículo → agregado; tercer
  IMEI con existencia 2 → «Solo hay 2»; validado no consulta; 30 % → 15 % con aviso; RD$ 5,000 → 2,700 (15 % de 18,000);
  totales 18,000 − 2,700 = 15,300; 10 % línea + dinero → tope 900; sin configurar → 10 %; campo RD$ 48 px / 16 px.
- `prueba` (buscador por IMEI): sigue **34/34**.

## Riesgos / pendientes
- **Comentario:** confirmar con el dueño/Dagoberto si la cajera lo ve en `contrato` o en `comentario`; luego dejar uno.
- **Descuento en dinero:** la primera prefactura real con RD$ hay que revisarla en Info Plus (que el total y el
  descuento de cabecera cuadren y no se duplique con el % de línea).
- Un teléfono nuevo sin ninguna serie registrada en Info Plus no pedirá IMEI (regla 1 del reglamento). Si pasa,
  es señal de que la compra no entró con serie en Info Plus.
- Sin sesión aquí: la prueba de punta a punta con Info Plus real la hace el dueño tras publicar.

## Siguiente paso
Que el dueño lo vea y diga «publícalo».
