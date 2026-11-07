# Reportes de ventas, metas por tienda y permisos de Contabilidad (07-nov-2026)

**Pedidos del dueño:**
- «Vamos a poner 5 agentes para preparar los reportes»: cuántos celulares se vendieron, ventas al por mayor y al detalle, y cuántas ventas fueron por reparación.
- «Establecer las metas de ventas por sucursal para cubrir».
- Regla del dueño: **el nivel de precio 1 es cliente final (detalle); los niveles 2 y 3 son por mayor.**
- «Ok» a las recomendaciones: pestaña nueva en Contabilidad y meta que el sistema sugiere y el dueño fija. Después dijo «Sigue», que autorizó aplicar los permisos.

## Auditoría (5 agentes, solo lectura)
- **Celulares:** la categoría MOBILES incluye motos, tablets, televisores, relojes y cargadores. Para contar celulares se usa MOBILES más una descripción que empiece con «CELULAR». Las devoluciones (`CN…`) se restan.
- **Reparación:** se cuenta la factura (no CN) que incluye el artículo 1121 «SERVICIO TECNICO». La categoría TALLER entera no sirve: mezcla envíos (1161), recargas y SIM. `ordenes_reparacion` no tiene precio y casi no se usa desde septiembre.
- **Nivel de precio:** Info Plus no lo manda en `/api/factura`. Se probó con una función temporal, `infoplus-factura-campos`, que solo listaba los nombres de los campos. Ya está apagada (responde 410).
  - Los campos que trae: CategoriaVenta y TipoEntrega vienen vacíos. En `/api/cliente` tampoco hay nivel.
  - **Método:** el precio cobrado se compara con los niveles 1, 2 y 3 del artículo (±0.5 %). Coincide exacto en el 73 % de las líneas desde octubre.
  - En esas líneas, el nivel 1 cae en la cuenta 1 («CONTADO») el 99 % de las veces, y los niveles 2 y 3 caen en clientes con ficha el 99.6 %.
  - Si el precio fue negociado y no coincide: la cuenta 1 cuenta como detalle y cualquier otra como por mayor.
- **Seguridad:** `estado_mensual_cat`, `infoplus_resumen_ventas_mensual` y `stats_rentabilidad` eran SECURITY DEFINER sin revisar permiso.

## Base de datos (proyecto vkhwdvjtowrhkhqavnvk), aplicado hoy
1. `20261107100000_contabilidad_permisos.sql`, preparada en la entrada `2026-11-07-1030`:
   - `infoplus_ventas` solo se puede leer con Contabilidad;
   - las 3 funciones anteriores quedan envueltas y exigen el permiso;
   - token en Vault `ventas_sync_token`;
   - las tareas 2 y 13 mandan `x-sync-token`.
2. **Edge Function `infoplus-ventas-sync` v20:** exige el token y limita el rango a 62 días.
   - Prueba: la tarea manual devolvió `ok:true` (394 facturas y 744 líneas).
   - Sin el token responde 401. `estado_mensual_cat` con la clave pública da «permission denied».
3. `20261107120000_reporte_ventas_detalle.sql`: nueva RPC `reporte_ventas_detalle(p_ini, p_fin)`, protegida con `app_puede_contabilidad`.
   - Probada dentro de un bloque que se deshace (`app_puede_contabilidad` quedó intacta).
   - Noviembre (1–7): detalle 251,350 + por mayor 394,430 + taller 23,010 = 668,790 en Santiago. Cuadra.
   - Octubre: celulares 54, 14 y 70; reparaciones 102, 5 y 19; venta total de Navarrete 1,351,427. Coincide con los agentes y con el Punto de equilibrio.

**Pantallas que leen estos datos:** «Celulares por modelo», Estado mensual, Estadísticas y el aviso de código Info Plus del técnico. Solo las abren el dueño, los administradores o quien tiene Contabilidad, así que ningún usuario actual pierde nada.

## Frontend (rama `claude/reportes-ventas`, sin publicar)
- **`conta-ventas.js` (nuevo):** pestaña «Reportes de ventas» en Contabilidad.
  - Pestañas: Todas, Santiago, Moca y Navarrete.
  - Tarjetas: venta contra la meta (con barra), celulares (detalle y por mayor), detalle contra por mayor (con barra) y reparaciones (mano de obra y piezas).
  - Tabla por tienda; en el celular se muestra como tarjetas.
  - Se apaga con `localStorage.bc_rv_off='1'`.
- **`conta-equilibrio.js`:** «Meta de venta del mes» en cada tienda.
  - La sugerida es lo que cubre los gastos más su parte de la cuota del préstamo, redondeado a mil hacia arriba.
  - El botón «Usar sugerida» la llena. El dueño la puede cambiar.
  - Se guarda en `variables.meta` con «Guardar gastos del mes».
  - En General se ve la suma de las metas y cuántas tiendas no tienen meta.
- `taller.html`: `conta-equilibrio.js?v=20261107-pe7` y `conta-ventas.js?v=20261107-rv1`.

## Pruebas (Playwright, 390 y 1280 px)
- No hay controles de menos de 44 px. El campo de la meta mide 48 px de alto con letra de 16 px. No hay desplazamiento hacia los lados.
- Cambiar entre Estado mensual, Punto de equilibrio y Reportes de ventas muestra y oculta bien cada panel.
- Prueba de la meta en Santiago: sugerida 822,000. Lleva 81.4 %, le faltan 153,210, que son 7,660.50 por día.

## Pendiente
- Publicar con el «publícalo» del dueño.
- Pedir a las tiendas que siempre facturen «Servicio técnico» en las reparaciones, sobre todo Moca, que casi no lo usa.
- `infoplus_resumen_ventas_mensual` no resta las notas de crédito (hallazgo de los agentes). Hay que corregirlo aparte.
