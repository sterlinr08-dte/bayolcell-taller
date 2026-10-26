# 26-oct-2026 01:38 (RD) · Reacondicionados: capa visual (agente 7 de 10) — Claude

## Pedido
El dueño pidió 10 agentes para la parte gráfica del taller y los procesos de reacondicionados. Encargo de este agente:
rediseño visual de Reacondicionados (`v-refurb`, `v-misReacond`) **sin cambiar la lógica**: tablero del lote claro (estado en
píldora con texto), tarjeta del teléfono con costo, fallas, piezas y tareas legibles, acciones agrupadas por paso (V05),
alerta grande que no empuje la lista, casillas de 48 px con su texto, pestañas ≥ 44 px y título con contraste ≥ 4.5:1.
Rama `claude/taller10-a7` (desde `main` af7016f). **Sin publicar, sin push.**

## Lo que se encontró (antes, banco local)
- Lote a 390 px: la lista de equipos empezaba a **1,346 px** del borde (1280 px: 765). 23 botones sueltos en la barra del lote.
- Tablero del lote: 6 cuadros de 92 px con rótulos en MAYÚSCULAS («RECIBIDOS», «CONTROL DE CALIDAD») cortados a 390 px.
  Además la capa `taller-flota.js` pinta una fila de filtros de color que hace lo mismo que el tablero (dos entradas para una función).
- Casilla de cada equipo: el cuadrito medía 32×44 px (una regla de campos le ponía relleno) y «MARCAR TODOS» 137×44 sin tarjeta.
- Ventanas «Asignar técnico», «Asignar equipos a un técnico» y «Reasignar»: blanco sobre `#f59e0b` = **2.15:1**.
  (El «Panel de reparación» ya estaba corregido en la fase 1: 5.02:1.) Sus subtítulos internos salían en MAYÚSCULAS.
- «Lo que está parado» (capa smart): 4 tarjetas una debajo de otra a 390 px, empujando la lista de lotes.
- Mis reacondicionados: solo nombre, estado con guiones bajos («tecnico recibio») y un conteo de fallas.

## Qué se hizo (capa nueva, reversible)
Archivos nuevos `taller-ui-reacond.css` y `taller-ui-reacond.js` (`html.bc-rcu`, se pone en el `<head>`; apagar con
`localStorage.bc_reacond_ui_off='1'` o `BC_RCU=false`). Solo mueve los mismos botones (mismos id y onclick) y pinta
encima de las funciones de siempre (`renderEquipoReacondCard`, `renderDetalleLoteReacond`, `renderLotesReacondTab`,
`renderMisReacond`, `abrirPanelProceso`). **No toca `taller-app.js`, la base ni Info Plus.**
- **Tablero del lote:** píldoras de 44 px con punto, texto en minúscula normal y número; dos columnas a 390 px; las etapas en 0
  quedan suaves. Es el **único** filtro por etapa (se esconde la fila repetida de `taller-flota.js`). Teclado: Enter/Espacio.
- **Acciones del lote por paso:** Selección (Marcar todos en tarjeta de 48 px, Asignar a técnico, Pasar a) · Salida (Poner
  colores, Despachar teléfonos) · Lote (menú Info Plus: registrar compra, registro manual, formato y Excel; menú Reportes:
  imprimir, PDF, Excel). Los menús se cierran al elegir, al tocar fuera o con Esc. Fechas junto a la búsqueda (campos 48/16).
- **Tarjeta del teléfono:** casilla de 22 px en zona de 48×48; resumen «Fallas: 1 de 2 pendiente» y «Costo» (solo
  administración, como el panel; mismo cálculo que Rentabilidad: compra + repuestos guardados + envío proporcional);
  botones ojo/imprimir 44 px, «Abrir» 44 px; «Piezas puestas» sin MAYÚSCULAS.
- **Lista de lotes:** etapas de cada lote en píldoras (punto + texto + número); «Lo que está parado» en 2×2 compacto a 390 px.
- **Pestañas del módulo:** una sola fila deslizable en el celular, 48 px de alto y letra 13 px (antes 10.5–11 px).
- **Mis reacondicionados:** tarjeta con estado en píldora, IMEI, lista de fallas (hechas tachadas), piezas con su estado
  («Pedida», «Por recibir», «Recibida»), costo solo para administración y «Trabajar» de 48 px.
- **Panel de reparación:** «Agregar pieza adicional», «Enviar a reparación externa», «Reasignar» y «Listo para venta» juntos
  en un bloque «Acciones»; títulos sin MAYÚSCULAS.
- **Contraste:** cabeceras naranjas de las 3 ventanas → `#b45309→#92400e` (5.02:1 y 7.09:1). Píldoras: 4.57–6.92:1.

## Medidas (antes → después, banco local con datos inventados)
| | 390 px | 1280 px |
|---|---|---|
| Lista de equipos empieza a | 1,346 → **1,029 px** | 765 → **672 px** |
| Botones visibles en la barra del lote | 23 → **16** | 23 → **16** |
| Zona de la casilla / cuadrito | 44×46, 32×44 → **48×48, 22×22** | 44×44, 34×26 → **48×48, 22×22** |
| «Marcar todos» | 137×44 → **146×48** | 139×44 → **146×48** |
| Tablero (alto por etapa) | 92 → **44 px** | 92 → **44 px** |
| Contraste cabeceras naranjas | 2.15 → **5.02:1** | igual |
| Textos en MAYÚSCULAS forzadas en las dos vistas | 2 → **0** | 2 → **0** |
| Desplazamiento horizontal | ninguno | ninguno |
| Errores de JavaScript | 0 | 0 |

## Pruebas
- `scripts/pruebas/reacond-ui.cjs` (nuevo; `PUERTO=…` para elegir el puerto del banco): a 390 y 1280 px — capa cargada,
  3 grupos, botones con su id y onclick dentro de los menús, una sola barra tras repintar, filtro por el tablero (2 equipos
  en Diagnóstico) y quitarlo (7), menú abre/cierra, botones del menú 44 px, «Marcar todos» marca 7, resumen con «1 de 2» y
  costo, mis reacondicionados 3 tarjetas sin costo para el técnico y botón 48 px, sin errores; **con el interruptor apagado
  la pantalla queda como antes** (sin clase, sin barra, sin API). Resultado: 4/4 OK.
- Regresión `scripts/pruebas/reacond-fase2.cjs` a 390, 440 y 1280: OK.
- `node --check taller-ui-reacond.js` OK. Capturas antes/después fuera del repo (carpeta temporal del agente).

## Archivos
`taller-ui-reacond.css`, `taller-ui-reacond.js`, `scripts/pruebas/reacond-ui.cjs`, `taller.html` (solo 3 líneas en el `<head>`
y 1 `<script defer>` junto a las otras capas).

## Riesgos y pendientes
- La fila de filtros de color de `taller-flota.js` queda escondida con la capa encendida (una sola entrada por función: el
  tablero). Si el dueño prefiere los filtros de abajo, se esconde el tablero en su lugar.
- «Costo» en la tarjeta usa `costo_repuestos` guardado (como Rentabilidad); el «Costo final» del panel suma las piezas de la
  ventana. Si una pieza se agregó y no se recalculó, pueden diferir unos pesos hasta el próximo recálculo.
- Íconos (Tabler) no cargan en el banco local: medir en el iPhone real.
- `docs/MEMORIA.md` no se tocó para no chocar con los otros 9 agentes; anotar al juntar las ramas.

## Siguiente paso
Que el dueño lo vea en la rama; si le gusta, «publícalo» para esta entrega.
