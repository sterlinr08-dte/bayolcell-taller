# 26-oct-2026 01:58 (RD) · Reacondicionados → Rentabilidad: costo final y margen por teléfono y por lote — Claude (agente 9 de 10)

## Pedido
El dueño pidió 10 agentes para el taller (parte gráfica y procesos de reacondicionados). Encargo de este agente:
PENDIENTES #7. En la pestaña **Rentabilidad**, mostrar por cada teléfono del lote el **costo final** (compra + flete + piezas)
frente al **precio de venta** y el **margen RD$ y %**, con totales por lote. El precio de venta casi nunca está
(Info Plus no trae el IMEI en la factura): no inventarlo; permitir anotarlo o marcar «Sin precio de venta».
Rótulos honestos (R15: Despachado no es Vendido). Regla única de costo (R10). Rama `claude/taller10-a9`, **sin publicar**.

## Qué encontré (fuente de verdad)
- `renderRentabilidadReacond()` (taller-app.js ~12332) pintaba KPI, capital congelado, margen por técnico y una barra por
  lote, pero **ninguna fila por teléfono**. Solo contaba precio si el equipo estaba `completado` **y** tenía
  `precio_venta_real`: un equipo Despachado (no completado) con precio quedaba fuera («0/3 con precio» aunque hubiera uno).
- Las piezas salían de `costo_repuestos` guardado. En la base hay filas viejas que sumaron piezas devueltas/rechazadas
  (auditoría R10: 3 devueltas y 2 rechazadas). `_recalcularCostoRepuestos` ya excluye esas dos.
- `cache.piezasReacond` ya trae todas las piezas (290 filas en la base, por debajo del tope de 1000), y `calcularFleteEquipo`
  reparte el flete del lote proporcional a la compra. No hace falta ninguna consulta nueva.
- Esquema leído con la herramienta de listado (solo lectura): `equipos_refurbish.precio_venta_real` existe;
  `refurb_ventas` existe pero tiene 0 filas. No se escribió nada en la base.
- Nadie escribe hoy `precio_venta_real` desde la pantalla.

## Qué cambié
Capa nueva y reversible `taller-reacond-rentabilidad.css` / `.js` (rr1). Sustituye solo la función que pinta la pestaña
(la original queda en `window._bcrrOriginal`). Apagar: `BC_RR=false` o `localStorage bc_rr_off='1'`.
- **Una sola regla de costo:** costo final = compra + flete + piezas; piezas = cantidad × costo de las filas que **no**
  estén devueltas ni rechazadas (igual que `_recalcularCostoRepuestos`). Si el equipo no tiene filas, usa el costo guardado.
  Si el cálculo no coincide con lo guardado, la cifra lleva un punto ámbar (título con el valor guardado).
- **KPI del período** (por fecha de despacho; «Todo» incluye los despachados sin fecha): Despachados (con / sin precio),
  Costo despachado, Venta anotada, Margen (solo con precio, % sobre la venta), En inventario.
- **Por lote** (desplegables, el más reciente abierto): cada teléfono con Equipo/IMEI, Estado (píldora «Despachado» o su
  estado de taller), Compra, Flete, Piezas, Costo final, Venta, Margen, %. Fila «Total del lote» con las mismas columnas y
  «N de M» con precio. En la PC una línea por teléfono; en el celular, tarjeta con costo final y venta arriba y el desglose
  abajo (sin filas de margen vacías). Buscador (lote, modelo o IMEI) y filtro «Sin precio».
- **Precio de venta:** un despachado sin precio dice «Sin precio de venta» + botón **Anotar**; con precio, la cifra se toca
  para cambiarla o quitarla. Ventana propia (`role="dialog"`): costo final, campo 48 px / 16 px, margen en vivo, «Guardar»
  54 px naranja Bayol, «Quitar precio» si ya había. Guarda `equipos_refurbish.precio_venta_real` (solo administrador; la
  pestaña ya es solo para administrador y la guardia del servidor no lo bloquea) y deja nota en `equipo_historial`
  («Precio de venta anotado: RD$ … (antes …)»). Nunca se calcula margen sin precio.
- Se conservan «Más tiempo en inventario» y «Margen por técnico». La palabra «vendido» no aparece.
- Ayudas detrás de una ⓘ (misma burbuja `#bcInfoTip`); sin cajas amarillas ni texto explicativo en pantalla.
- **No se tocó `taller-app.js`** (no hizo falta minificar). En `taller.html` solo 4 líneas: interruptor + `<link>` en el
  `<head>` (después de `taller-info.css`) y `<script defer>` después de `taller-info.js`.

¿Por qué no se pide el precio al despachar? Despachar es enviar al almacén; en ese momento el precio de venta todavía no se
conoce. Pedirlo ahí invitaría a inventarlo. Se anota cuando se sabe, desde Rentabilidad. Si el dueño lo quiere también en
el despacho, es una decisión suya (ver pendientes).

## Propuesta SQL (SIN APLICAR)
`supabase/migrations/20261026020000_PROPUESTA_reacond_precio_venta_traza.sql`: columnas `precio_venta_fuente`
('manual'|'infoplus'), `precio_venta_por`, `precio_venta_en` y un check `precio_venta_real > 0` (`not valid`). Sirve para
separar el precio manual del que llegue de Info Plus cuando haya IMEI en la factura. Necesita el OK del dueño.

## Pruebas (banco local, puerto 8809, Supabase simulado)
Datos inventados: 2 lotes, 5 teléfonos, flete RD$ 3,000 en un lote, una pieza devuelta y una rechazada.
- 390 y 1280 px: 0 errores de JavaScript; 15 elementos tocables, **0 por debajo de 44 px**; 0 textos en mayúscula forzada
  (antes: 10); 0 letras monoespaciadas; sin desplazamiento horizontal.
- Cifras comprobadas a mano: iPhone 11 64GB = 12,000 + 750 + 2,500 = **RD$ 15,250.00**, venta 19,500 → margen
  **RD$ 4,250.00 · 21.8 %**; S21 con pieza rechazada = **RD$ 10,200.00** (la rechazada no suma), margen −400 · −4.1 %;
  lote FAC-1021: piezas **RD$ 6,000.00** (la devuelta de 800 no suma; el guardado decía 4,300 y sale el punto ámbar);
  Costo despachado RD$ 40,325.00; En inventario RD$ 35,875.00.
- Anotar: Guardar vacío → «Escriba un precio mayor que cero.»; 18,500 → margen en vivo RD$ 3,625.00 · 19.6 %; guarda
  18500, toast «Precio guardado: RD$ 18,500.00», ventana cerrada, KPI pasa a 3 con precio y margen RD$ 7,475.00.
  Ventana: campo 48 px / 16 px, Guardar 54 px, ✕ 44 px.
- Filtro «Sin precio» y buscador («S21» → 2 filas, el foco se queda en el buscador). ⓘ abre la burbuja.
- Interruptor `bc_rr_off=1` → vuelve el «Centro de Rentabilidad» original. Técnico → «Solo para administradores.»
- Regresión: `reacond-fase2.cjs` (copiado al puerto 8809) OK a 390, 440 y 1280.
- Capturas antes/después en la carpeta temporal del agente (no en el repo).

## Archivos
`taller-reacond-rentabilidad.css`, `taller-reacond-rentabilidad.js`, `taller.html` (4 líneas),
`supabase/migrations/20261026020000_PROPUESTA_reacond_precio_venta_traza.sql`, esta bitácora.

## Riesgos y pendientes
- El precio anotado a mano es un dato del administrador, no de Info Plus. Cuando Dagoberto agregue el IMEI a `factura`, el
  cruce automático debe llenar `precio_venta_real` (con la propuesta SQL, marcado como `infoplus`).
- Si un día `equipo_piezas_pedidas` pasa de 1000 filas, la carga general (`select('*')` sin rango) se cortaría y el cálculo
  de piezas de algunos equipos volvería al costo guardado. Hoy hay 290.
- Diferencias entre piezas calculadas y `costo_repuestos` guardado solo se señalan; corregir los datos guardados es
  conciliación y necesita autorización específica.
- Decisión del dueño: ¿pedir también el precio al despachar? ¿usar `refurb_ventas` (comprador, garantía) en vez de solo el
  precio? No se hizo.
- `docs/MEMORIA.md` no se tocó para no chocar con las otras 9 ramas; agregar una línea al juntar.
- Sin publicar. Orden si se publica: no requiere base (la propuesta SQL es opcional).
