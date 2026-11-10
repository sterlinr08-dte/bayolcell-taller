# Claude · Arreglo: «Meta por vendedor» no salía (consulta de venta por día rota desde el 07-nov)

## Pedido del dueño
Preguntó dónde se fijan las metas de los empleados. Se le indicó Contabilidad → Punto de equilibrio → pestaña de la tienda → «Meta por vendedor» → «Editar metas». Mandó capturas de Santiago (10-nov, 1:31 p. m.): «NO LO VEO». En la pantalla salía «Faltan datos: No se pudo leer la venta por día».

## Diagnóstico (fuente de verdad)
- `conta-equilibrio.js` arma «Meta por vendedor» con la venta por día y vendedor (`ventas_diarias_vendedor`). Si esa lectura falla, no hay lista de vendedores y la sección no se pinta (`htmlVendedores` devuelve vacío).
- Registros del 10-nov: todas las llamadas a `rpc/ventas_diarias_vendedor` respondían **400**.
- La función creada el 07-nov (migración `20261107200000`, PR #245) fallaba siempre:
  1. **42803**: agrupaba por `coalesce(codempleado,'?')` y la subconsulta del nombre usaba `codempleado` sin agrupar.
  2. **42804**: `tecnicos.nombre` es `varchar(120)` y la función declara `text`.
- Nunca se vio porque las pruebas de esa entrega usaban datos inventados (sin base real).

## Qué se hizo (con el OK del dueño: «Aplícalo»)
- Migraciones aplicadas en producción: `ventas_diarias_vendedor_arreglo_agrupado` y `ventas_diarias_vendedor_arreglo_tipos`. En el repo, una sola: `supabase/migrations/20261110180000_ventas_diarias_vendedor_arreglo.sql` (versión final).
- Misma firma, mismo permiso (`app_puede_contabilidad`), mismos `grant`. No toca datos, ventas, metas ni gastos guardados.

## Verificación
- Como usuario administrador (sesión simulada en una transacción): noviembre devuelve 47 filas y **RD$ 1,161,648.00**, igual a la suma directa de `infoplus_ventas` (con las CN restando). Octubre + noviembre: 183 filas.
- Ninguna otra consulta de Punto de equilibrio dio error el 10-nov (registros de la API).
- Falta: que el dueño recargue y vea «Meta por vendedor».

## Para deshacer
Volver a crear la función con el texto de `20261107200000_ventas_diarias_vendedor.sql` (la rota) no tiene sentido; si hiciera falta, quitar la sección es tan simple como no tener metas de tienda.

## Aprendizaje
Toda función nueva de la base se prueba al menos una vez contra la base real (en una transacción que se deshace), no solo con datos inventados en el navegador.
