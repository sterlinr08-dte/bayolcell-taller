# 2026-10-26 00:42 (RD) — Claude · Inicio (tablero) y Mi trabajo: capa visual

## Pedido
El dueño pidió 10 agentes para la parte gráfica del sistema del taller y los procesos de reacondicionados. A este agente
(1 de 10) le tocó **Inicio / tablero (`v-dashboard`) y Mi trabajo (`v-miTrabajo`)**: jerarquía clara, KPI legibles,
números tabulares, estados vacíos dignos, carga sin saltos, contraste 4.5:1, 390 y 1280 px. Rama `claude/taller10-a1`
(sale de `main` af7016f). **Sin publicar, sin push, sin PR.**

## Qué encontré (medido con el banco local, Supabase simulado, antes del cambio)
- KPI con el rótulo en MAYÚSCULAS forzadas (13 en Inicio, 5 en Mi trabajo) y `letter-spacing`; «Reacondicionados» se cortaba
  (390 y 1280) y «Control calidad» partía en dos líneas, dejando tarjetas de 76 y 89 px en la misma fila.
- Números sin `tabular-nums`. Todos los KPI con el mismo borde naranja (`taller-visual-polish.css` pisa con `!important`
  los colores propios de cada tarjeta): no se distinguía pendiente, listo o problema.
- Reacondicionados (7 KPI) en una rejilla de 6: «Devoluciones» quedaba sola en otra fila a 1280.
- Órdenes recientes: encabezado de columnas (Orden · Cliente · Equipo · Falla · Estado) encima de tarjetas que ya traen sus
  rótulos; en el celular, tarjeta dentro de tarjeta (la fila de la tabla móvil también se pintaba como tarjeta).
  «Acciones del Sistema» se estiraba hasta el alto de la lista.
- Panel inteligente: verdes `#16a34a` sobre blanco (3.3:1) en «Sin alertas» y en la tendencia.
- Mi trabajo: el KPI «Registro de Ticket» no es una cifra y repite el botón «Ver Registro de Ticket (N)» (dos entradas para
  la misma función). Formulario con etiquetas de 10 px en MAYÚSCULAS («MONTO FACTURA *» partido en dos líneas), título
  «Registrar Ticket» repetido, nota explicativa larga en pantalla («Si el ticket tiene más de una reparación…»),
  «QUINCENA ACTUAL» en `#94a3b8` (2.4:1). Filtro de fechas del historial con los dos campos a todo el ancho en la PC.
- Estados vacíos como texto gris suelto; «No has solicitado piezas todavía» (tuteo).
- «Marcar urgente» (chip de la tarjeta de orden) con área de toque de 13 px de alto.

## Qué cambié
Capa nueva **`taller-ui-inicio.css` / `taller-ui-inicio.js`** (patrón de `taller-prefactura.*`), solo para esas dos pantallas.
Interruptor: clase `bc-ui-inicio` en `<html>` desde el `<head>`; apagar con `localStorage bc_ui_inicio_off='1'` o
`BC_UI_INICIO=false`. Probado: apagada vuelve todo como estaba (rótulo `uppercase`, sin la API `bcUiInicioAplicar`).
- **KPI:** rótulo en minúscula normal 13 px `#475569` (7.6:1), sin `letter-spacing`, puede ir en dos líneas pero nunca se
  corta; **punto de color en línea antes del rótulo** (ocupa su propio espacio, no se encima) con la paleta de `DESIGN.md`
  (azul entrada, ámbar pendiente, naranja en proceso, verde listo, teal despachado/reacond., violeta calidad, rojo solo
  devoluciones y fallas pendientes); ícono del mismo color abajo a la derecha en la fila del número; número 26 px (23 px en
  el celular) con `tabular-nums`; alto parejo (88 px PC / 80 px celular); tarjeta blanca de vidrio sin el borde naranja.
  Las KPI que abren otra pantalla se usan con el teclado (Tab + Enter/Espacio, `role=button`), con foco azul NEXUS.
- **Reacondicionados** en una sola fila de 7 en la PC (≥1100 px). Título de sección sin mayúsculas.
- **Órdenes recientes:** sin el encabezado de columnas; en el celular, una sola tarjeta por orden; rótulos «Orden, Cliente,
  Equipo, Falla» en minúscula normal 12 px; número de orden sin partirse. «Acciones del Sistema» ya no se estira; botones 48 px.
- **Panel inteligente / Demorados:** verdes a `#15803d` (≥4.5:1); «Sin alertas» y «No hay equipos demorados» como tarjeta
  verde con ícono.
- **Mi trabajo:** se oculta el KPI «Registro de Ticket» (queda el botón con el número, una sola entrada); formulario con
  etiquetas de 13 px sin mayúsculas, campos de una fila en la PC, botón «Guardar ticket» de 54 px, botón ＋ de 48 px;
  subtítulo «Servicios de este ticket» legible y su aclaración detrás de la ⓘ (regla nueva en `taller-info.js`, igual que en
  Mis incentivos); «Quincena actual» sin mayúsculas y con contraste; montos tabulares; filtro de fechas en una sola línea en
  la PC con botones de 44 px; estados vacíos como tarjeta con ícono («No hay órdenes disponibles ahora.»); alto reservado
  mientras cargan los datos (sin saltos).
- **«Marcar urgente»:** área de toque de 45 px (franja invisible), sin cambiar su aspecto, solo en estas dos pantallas.
- Texto: «No has solicitado piezas todavía.» → «No ha solicitado piezas todavía.» (usted).

## Archivos
- `taller-ui-inicio.css` (nuevo), `taller-ui-inicio.js` (nuevo).
- `taller.html`: solo 3 líneas antes de `</head>` (comentario, interruptor y `<link>`) y 1 `<script defer>` tras `taller-info.js`.
- `taller-info.js`: la regla de la ⓘ de «Servicios de este ticket» ahora también cubre `#v-miTrabajo #miTrabajoIncentivos`.
- `taller-app.js` (1 texto) + `taller-app.min.js(.map)` regenerados con `scripts/minificar.sh`.
- Sin base de datos, sin migraciones, sin Info Plus.

## Pruebas (banco local, puerto propio 8801, Playwright, 390 y 1280 px)
| Medida | Antes | Después |
|---|---|---|
| Rótulos KPI en MAYÚSCULAS (Inicio / Mi trabajo) | 13 / 5 | 0 / 0 |
| Rótulos KPI cortados | 1 (390) · 1 (1280) | 0 · 0 |
| Números KPI con `tabular-nums` | 0 de 18 | 17 de 17 |
| Altos de KPI en una misma pantalla | 76 y 80 (390) · 76 y 89 (1280) | 80 · 88 (parejos) |
| Ícono encima del rótulo o del número | — | 0 en las 4 combinaciones |
| Contraste mínimo del rótulo KPI | 6.99:1 | 7.58:1 |
| Área de toque «Marcar urgente» | 13 px | 45 px |
| Alto de Mi trabajo (390 / 1280) | 4937 / 3146 px | 4742 / 2972 px |
| Desplazamiento horizontal | 0 | 0 |
| Campos | 48 px / 16 px | 48 px / 16 px |
| Errores de JavaScript en la consola | 0 | 0 (con datos y con todo vacío) |
- Capa apagada con `bc_ui_inicio_off=1`: sin clase, sin cambios, sin errores.
- Regresión `prefactura-confiable.cjs` (copiada al puerto 8801): T1–T8 iguales que antes.
- `node --check` de `taller-app.js`, `taller-info.js`, `taller-ui-inicio.js`; `minificar.sh` sin errores.
- Capturas antes/después en la carpeta temporal del agente (no en el repo).

## Riesgos y pendientes
- `:has()` (colores por KPI, ocultar el título repetido) necesita Safari 15.4+ / Chrome 105+; en navegadores viejos solo se
  ve el punto gris, sin romper nada.
- Al juntar ramas: `taller-app.min.js` se debe **regenerar** con `scripts/minificar.sh` (no resolver a mano), y conviene
  subir el `?v=` de `taller-info.js` en `taller.html` para que la ⓘ nueva llegue sin caché vieja (no lo toqué para no
  chocar con otras ramas).
- Fuera de mi tema, visto al medir: en las tarjetas de orden (`taller-flota`/`construirCardOrden`) «Paso N de 4» y la etapa
  tienen contraste 2.9–4.1:1 y hay rótulos en MAYÚSCULAS; lo dejo para el agente de Órdenes.
- Ocultar el KPI «Registro de Ticket» de Mi trabajo aplica la regla «una sola entrada por función»; si el dueño prefiere el
  KPI arriba en vez del botón, es una línea de CSS.

## Siguiente paso
Que el dueño lo vea en la rama (Inicio con el usuario admin y Mi trabajo con un técnico, en el celular y en la PC) y, si le
gusta, juntarlo con las otras ramas y publicarlo solo con su «publícalo».
