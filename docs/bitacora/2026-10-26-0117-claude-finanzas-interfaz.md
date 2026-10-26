# 2026-10-26 01:17 (RD) · Claude · Finanzas: interfaz de Contabilidad, Cuentas por pagar, Nómina, Liquidación, Incentivos y Financiamientos

Rama: `claude/taller10-a5` (sale de `main` af7016f). **Sin publicar, sin push, sin PR.** Agente 5 de 10.

## Pedido
El dueño pidió 10 agentes para la parte gráfica del taller. A este agente le tocó Finanzas: `v-contabilidad`,
`v-cuentasPorPagar`, `v-nomina`, `v-liquidacion`, `v-incentivos`, `v-misIncentivos`, `v-financiamientos`.
Montos en `RD$ 1,250.00` con cifras alineadas, totales destacados, tablas que en el celular se vuelven tarjetas,
formularios según `DESIGN.md §4b`. Solo interfaz: no cambiar cálculos de dinero.

## Qué encontré (medido en el banco local a 390 y 1280 px, con datos inventados)
- El formato del dinero ya era correcto: `money()` da `RD$ 1,250.00` y los 196 montos medidos en estas pantallas lo cumplen.
  No hizo falta tocar ningún formateador.
- La capa táctil ya daba 44 px a los botones y 48/16 a los campos: 0 fallos antes y después.
- **238 textos en MAYÚSCULAS forzadas** (KPI de Financiamientos y de Cuentas por pagar, etiquetas de Incentivos, encabezados de tabla,
  nombres de columna en las tarjetas del celular).
- **196 de 196 montos sin `tabular-nums`**: las cifras no quedaban alineadas en columna.
- En el celular, Cuentas por pagar y las tablas de Contabilidad ya se volvían tarjetas, **pero sin el nombre de cada dato**:
  salían tres montos seguidos («RD$ 125,000.00 / RD$ 25,000.00 / RD$ 100,000.00») sin decir cuál es Monto, Pagado o Saldo.
- Empleados, Acumulados e Incentivos eran tablas de 469–620 px dentro de una pantalla de 390: había que deslizar de lado.
- Las pestañas de Contabilidad (7) ocupaban 4 filas de botones en el celular, y las de RRHH (5) 3 filas.
- En la tabla de la quincena el encabezado azul noche tenía letra gris casi invisible.
- La ventana «Deuda manual» tenía etiquetas de 11 px en gris claro y el botón «Guardar deuda» de 44 px.
- **Error real encontrado:** si Chart.js no carga (sin Internet o CDN caído), abrir Financiamientos → Dashboard **congela la pestaña**:
  `_pintarDashboardFin` se volvía a llamar a sí misma sin fin esperando a `Chart`. Comprobado en el banco: la página dejó de responder.

## Qué cambié
Capa nueva y reversible (patrón de `taller-prefactura.*`), cargada desde el `<head>` (CSS) y con `defer` (JS). Interruptor:
`localStorage.bc_finanzas_off='1'` (no se pone la clase `html.bc-fin` y la capa no hace nada).

- `taller-ui-finanzas.css`
  - `font-variant-numeric: tabular-nums` en las 7 pantallas y sus ventanas (también dentro de los campos).
  - Sin mayúsculas forzadas: encabezados, etiquetas, KPI, nombres de columna y estilos en línea con `text-transform:uppercase`.
  - §4b: etiquetas 13 px `#475569` encima del campo; campos radio 12, letra 16, foco azul NEXUS (`rgba(59,130,246,.6)` + anillo
    `0 0 0 4px rgba(59,130,246,.16)`); casillas en fila con su texto; botón principal de las ventanas **54 px**.
  - Totales destacados: fila «Total…», «= Utilidad…» y pie de tabla en negrita 800, fondo suave y raya superior.
  - Celular (≤ 760 px): pestañas de Contabilidad y RRHH en **una sola fila deslizable**; tablas de solo lectura en tarjetas con
    el nombre del dato a la izquierda y la cifra a la derecha; la primera celda hace de título; los botones de acción al pie.
  - Encabezado de la tabla de la quincena con letra clara sobre el azul noche.
  - Nombres de los KPI de Financiamientos a 12 px.
- `taller-ui-finanzas.js`
  - Pone `data-label` (nombre de la columna) a cada celda de las tablas de estas pantallas y ventanas, cada vez que se repintan
    (MutationObserver por pantalla, agrupado por cuadro). No cambia textos ni datos.
  - Marca como tarjetas (`bcfin-cards`) solo las tablas **de solo lectura** con filas; las que tienen campos (quincena por
    generar, Liquidación de aduana `#aduanaTabla`) quedan con su desplazamiento horizontal.
  - Marca las filas de totales (`bcfin-total`).
- `taller.html`: solo 4 líneas (comentario + interruptor + `<link>` después de `taller-afinado.css`; `<script defer>` después de `taller-info.js`).
- `taller-app.js` (1 línea, quirúrgica): `_pintarDashboardFin` espera a Chart.js **una sola vez**; si no cargó, pinta el
  dashboard sin la dona (la función ya tenía la guarda `if(!window.Chart) return` en la dona). Con Chart.js cargado, igual que antes.
  Regenerado `taller-app.min.js` con `scripts/minificar.sh`; `node --check` OK en los dos.

No se tocó ningún cálculo de dinero, ni Supabase, ni Info Plus, ni migraciones.

## Pruebas (banco local, puerto 8805, Supabase simulado + datos inventados)
Barrido de 18 pantallas/pestañas × 2 anchos (390 y 1280):

| Medida | Antes | Después |
|---|---:|---:|
| Textos en MAYÚSCULAS forzadas | 238 | 0 |
| Montos sin `tabular-nums` | 196 / 196 | 0 / 196 |
| Montos con formato distinto de `RD$ 1,250.00` | 0 | 0 |
| Botones/selectores < 44 px | 0 | 0 |
| Campos < 48 px o letra < 16 | 0 | 0 |
| Desplazamiento horizontal de la página | 0 | 0 |
| Errores de JavaScript | 0 | 0 |
| Ancho de tabla a 390 px (Empleados / Acumulados / Incentivos) | 469 / 620 / 579 | 338 / 338 / 338 (tarjetas) |
| Pestañas de Contabilidad a 390 px | 4 filas | 1 fila (52 px) |

Pruebas puntuales (16/16 OK): etiquetas por columna en Cuentas por pagar (24 celdas: Fecha, Factura, Proveedor, Monto, Pagado,
Saldo, Vencimiento, Estado) y tarjetas solo a 390; ventana «Deuda manual» con etiquetas 13 px sin mayúsculas, campos 48/16 radio 12
y botón 54 px a 390 y 1280; «= Utilidad bruta», «Total gastos» y «= Utilidad neta» en negrita 800; pestañas en una fila; quincena
sigue como tabla deslizable con encabezado legible; **Financiamientos sin Chart.js responde** (antes se congelaba) y pinta 6 KPI;
con `bc_finanzas_off=1` la capa no actúa (sin clase y 0 etiquetas). Capturas antes/después en la carpeta temporal del agente (no en el repo).

## Riesgos y pendientes
- `taller-app.min.js` cambió (una línea): al juntar las ramas hay que regenerarlo una sola vez después de unir todos los cambios
  de `taller-app.js` y subir el `?v=` de `taller-app.min.js` en `taller.html` (no lo subí para no chocar con las otras ramas).
- La misma trampa de Chart.js existe en `renderReporteTecnico` (Reportes, fuera de mi encargo): no la toqué.
- Quedan textos explicativos largos en pantalla en Nómina («El SFS/ARS (3.04%) y la AFP…», «Días laborables del mes (para pago
  por día)») y en Acumulados («Qué muestra esta tabla…»). Van detrás de una ⓘ con reglas en `taller-info.js`; no las agregué para
  no chocar con otros agentes que editan ese archivo.
- Textos en MAYÚSCULAS escritos así en el código (por ejemplo «= UTILIDAD NETA» del Estado mensual) no son CSS: cambiarlos es
  cambiar el texto del informe; queda para decisión del dueño.
- Probado con datos inventados y sin iconos (CDN bloqueado en el banco). Falta mirarlo en un iPhone real.

## Siguiente paso
Que el dueño lo vea en el celular y en la PC; si le gusta, juntar con las otras 9 ramas, regenerar el minificado y publicar con su «publícalo».
