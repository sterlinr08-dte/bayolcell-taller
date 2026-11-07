# 07-nov-2026 · Auditoría de los módulos nuevos de Contabilidad (solo lectura, sin cambios)

Pedido del dueño: «Audita los nuevos módulos que hicimos en contabilidad». Se revisó lo del 6-nov:
- Punto de equilibrio: `conta-equilibrio.js` y la tabla `conta_equilibrio`.
- Limpieza de ventas anuladas: `infoplus-ventas-sync` v19, `infoplus_ventas_borradas` y job 13.
- RPC `estado_mensual_cat`.

## Hallazgos
1. **ALTO — Notas de crédito restadas dos veces.**
   - La migración `20261106201708_estado_mensual_cat_resta_notas_credito` ya hace que `estado_mensual_cat` reste las CN.
   - `conta-equilibrio.js`, en `cargar()`, además resta `2 × CN` a la venta y al costo.
   - Navarrete octubre: la venta sale **RD$102,000 más baja** y el costo **RD$94,546 más bajo**. Septiembre: −39,980 / −36,054. Santiago y Moca no tienen CN.
   - Arreglo: quitar la resta del JS y dejar solo el aviso informativo. **Pendiente del OK del dueño.**
2. **MEDIO — Migración fuera del repo.** `20261106201708_estado_mensual_cat_resta_notas_credito` está aplicada en la base pero no existe en `supabase/migrations/`.
3. **MEDIO — `infoplus_ventas` la lee cualquier empleado con sesión.** La política `infoplus_ventas_auth_read` es `using (true)`, así que cualquier técnico puede ver ventas y costos (los márgenes). Viene de antes; el Punto de equilibrio sí está protegido. Propuesta: limitarla a `app_puede_contabilidad()` después de revisar qué pantallas la usan.
4. **MEDIO — `infoplus-ventas-sync` responde a la clave pública (anon).**
   - Cualquiera con esa clave puede lanzarla con cualquier rango de fechas.
   - La respuesta trae el total vendido del rango.
   - Lo que borra está protegido: solo quita lo que Info Plus ya no devuelve, guarda respaldo y no borra si devuelve 0 líneas o si faltaría más del 10 %.
   - Propuesta: exigir un secreto del cron o el rol admin.
5. **BAJO — Permisos de sobra.** `anon` y `authenticated` tienen TRUNCATE, REFERENCES y TRIGGER sobre `infoplus_ventas`. No se usan por la API, pero conviene quitarlos.
6. **BAJO — Números con punto de miles.** `num()` lee «1.500» como 1.5. En RD se escribe 1,500, que sí funciona.
7. **A CONFIRMAR — `app_puede_contabilidad()` da acceso a todo actor tipo `usuario`.** Confirmar que solo los usuarios administrativos son de ese tipo.

## Lo que está bien
- Fórmulas:
  - margen bruto (MB);
  - margen de contribución (MC);
  - punto de equilibrio = gastos fijos / MC;
  - aporte de la tienda y resultado a la fecha.
- TSS patronal 16.29 % (SFS 7.09 + AFP 7.10 + SRL 1.10 + INFOTEP 1) y regalía 8.33 %: correctos.
- Las tablas nuevas tienen RLS correcto, sin anon y sin TRUNCATE.
- La limpieza funciona y deja respaldo: 43 líneas, RD$71,600, en `infoplus_ventas_borradas`.
- Las corridas de cada hora y la de 40 días salen bien (último log, 07-nov 12:07 UTC).

## Siguiente
El dueño decide si se corrigen 1 a 5. Los puntos 1 y 2 son los urgentes.
