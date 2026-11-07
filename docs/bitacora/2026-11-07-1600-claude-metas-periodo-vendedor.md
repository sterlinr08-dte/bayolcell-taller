# Punto de equilibrio: meta diaria, semanal y quincenal por sucursal, y meta quincenal por vendedor (07-nov-2026)

**Pedido del dueño:** «Poner cuánto es la venta diaria por sucursal… diaria, semanal, quincenal; la mensual está hecha. Y así fijarle una meta de venta… así puedo determinar la meta quincenal por vendedores.» También dijo: «Yo pongo la meta según el punto de equilibrio por cada sucursal».

## Qué se hizo (rama `claude/metas-periodo`, sin publicar)
- **RPC nueva `ventas_diarias_vendedor(p_ini, p_fin)`**, ya aplicada en producción.
  - Devuelve la venta neta por día, tienda y código de vendedor de Info Plus. Las notas de crédito (CN) restan.
  - Toma el nombre del vendedor de `tecnicos.infoplus_codempleado`.
  - Exige `app_puede_contabilidad`. No tiene acceso para anon.
  - Copia en el repo: `supabase/migrations/20261107200000_ventas_diarias_vendedor.sql`.
- **`conta-equilibrio.js`, versión pe9.**
  - **Meta por periodo**, en cada tienda y en General. La meta del mes que fija el dueño se reparte según los días hábiles del calendario: Navarrete cuenta los domingos y las otras tiendas abren de lunes a sábado.
  - Periodos: Hoy, Esta semana (de lunes a domingo, dentro del mes), 1ª quincena (1–15), 2ª quincena (16–fin) y Mes. Cada uno muestra la meta, lo vendido, el % logrado y lo que falta.
  - En un mes pasado o futuro se muestra «Un día hábil» como referencia.
  - **Meta quincenal por vendedor**, en la pestaña de cada tienda:
    - el % de cada vendedor sale de lo que vendió el mes anterior en esa tienda;
    - el dueño lo puede cambiar; se guarda en `variables.vend_pct` con «Guardar gastos del mes»;
    - el botón «Repartir según el mes anterior» vuelve al cálculo automático;
    - si los porcentajes no suman 100 %, sale un aviso;
    - cada vendedor muestra su meta de cada quincena, lo que lleva y su %.
  - El **reporte del mes** y el **Excel** incluyen las metas por periodo y por vendedor (en el Excel, la hoja «Metas»).
- `taller.html`: `conta-equilibrio.js?v=20261107-pe9`.

## Vendedores encontrados (octubre)
- **Santiago:** 697, sin nombre en el sistema (65 %), y Michelle (35 %).
- **Moca:** Kenifer.
- **Navarrete:** Yosmeiry (75 %) y el 6, sin nombre (24 %).
- Ventas pequeñas: Loribel (249), Alejandro (833) y el 750.
- **Pendiente:** el dueño debe decir quiénes son el 697, el 6 y el 750, o anotarlo en la ficha del empleado (campo de código de Info Plus).

## Pruebas (simulador con Playwright y datos de ejemplo)
- Los periodos suman bien: 1ª quincena + 2ª quincena = mes.
- La semana va del 2 al 8 de noviembre.
- Al cambiar un % aparece el aviso «suman 105.5 %».
- A 390 y a 1280 px no hay controles de menos de 44 px. Los campos del % miden 48 px con letra de 16 px. No hay desplazamiento hacia los lados.
