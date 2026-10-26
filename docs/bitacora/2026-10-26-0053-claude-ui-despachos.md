# 26-oct-2026 · Despachos, Piezas solicitadas y Proveedores: capa visual `taller-ui-despachos` (agente 4 de 10)

## Pedido
El dueño pidió 10 agentes para la parte gráfica del taller y los procesos de reacondicionados. Al agente 4 le tocó
ordenar visualmente **Despacho de almacén (`v-despachos`)**, **Piezas solicitadas (`v-piezasSolicitadas`)** y
**Compras y proveedores (`v-proveedores`)**. Coordinación: el agente 7 trabaja **Reacondicionados**; esta capa NO toca la
pantalla de Reacondicionados ni su ventana «Despachar teléfonos» (`modalDespTel`), salvo darle `role="dialog"` y foco.

## Qué se encontró (medido en el banco local, 390 y 1280 px)
- Piezas: estados con contraste bajo (Solicitada 3.19:1, Aprobada 3.3:1, Entregada 3.68:1) y botones blancos sobre cian
  «Entregar» 3.68:1 y verde «Confirmar recibida» 3.3:1. Estados con emoji (en Windows sin emoji queda solo el color).
- Despacho: en el celular las tablas (carrito e historial) se apilaban **sin etiquetas** (no se sabía qué era cada número);
  el historial ocupaba ~350 px por fila. Etiquetas en MAYÚSCULAS forzadas («DESDE (ORIGEN)»). Nº de despacho cian 3.68:1.
- Proveedores: seis botones de colores (azul noche, morado, cian) compitiendo con «Nueva Compra»; «A Reacond» blanco sobre
  cian 2.4:1; nombre del proveedor y notas del lote con `text-transform:uppercase` en línea; insignias en MAYÚSCULAS;
  **confiabilidad «Buena» salía en ROJO** (`#b91c1c` sobre azul) — el rojo es solo para problemas.
- Ventanas: «Ajuste rápido» e «IMEI → Proveedor» se crean ya abiertas (`appendChild` con clase `active`), por eso
  `bc-dialogos.js` (que solo vigila cambios de clase) no les ponía `role="dialog"` ni foco: el foco quedaba en el BODY.
  Ninguna ventana tenía nombre accesible. Títulos en MAYÚSCULAS y barras de título con degradado.

## Qué se cambió
Capa nueva **`taller-ui-despachos.css` / `taller-ui-despachos.js`** (interruptor `html.bc-uid`; apagar con
`localStorage.bc_uid_off='1'` o `BC_UID=false`). Patrón igual a `taller-prefactura.*`, CSS en el `<head>`, JS con `defer`.
- **Estados en píldora** de 26 px con punto de color y una palabra (DESIGN §4): Solicitada/Pendiente/Parcial (ámbar),
  Extra pendiente (morado), Entregada (cian), Aprobada/Recibida/OK (verde), Devuelta (gris), Rechazada/Error (rojo).
  El emoji queda en un `<span class="bcud-emo">` que la capa esconde (con la capa apagada se ve como antes).
- **Botones de piezas** 44 px, píldora, 14 px: Entregar `#0e7490` (5.4:1), Confirmar recibida `#15803d` (5.0:1),
  Aprobar extra `#6d28d9`. Filtros con `aria-pressed` y activo en azul NEXUS.
- **Despacho:** etiquetas en minúscula normal 13 px; selects/campos 48 px con letra 16 px y foco azul; «Hacer despacho»
  54 px; en el celular Desde/Hacia uno debajo del otro; **carrito e historial como tarjetas «Etiqueta · dato»** (la capa
  JS pone `data-label` con el título de cada columna; el estilo de tarjeta ya existía en `taller-afinado.css`); botones
  Imprimir/WhatsApp/PDF y ✕ de 44 px con `aria-label`; cifras con `tabular-nums`.
- **Proveedores:** una sola acción principal («Nueva compra», naranja); las demás en claro. En el celular, rejilla de 2
  columnas con «Nueva compra» arriba a lo ancho. Etiquetas: «Nueva compra», «Importar manifiesto», «Liquidación de aduana»
  (el texto largo sigue en el `title`). Sin MAYÚSCULAS en nombre del proveedor, notas e insignias. «A Reacond» claro con
  texto cian oscuro. Código del lote naranja oscuro `#c2410c` (5.2:1, antes 3.4:1).
- **Ventanas** (Ajuste rápido, Reporte de despacho, Proveedor, Nueva compra, Importar compra, Manifiesto, IMEI → Proveedor,
  Registrar compra IP, Historial de liquidación): `role="dialog"`, `aria-modal`, `aria-labelledby` al título, foco al primer
  campo al abrir y regreso del foco al botón que la abrió al cerrar; barra de título clara (ícono azul NEXUS, título 17 px,
  ✕ redonda de 44 px), etiquetas §4b, campos 48/16, botón principal 54 px. `modalDespTel` y `modalDespachoRapido`: solo
  accesibilidad (su aspecto es del agente 7 / Reacondicionados).

### Cambios en `taller-app.js` (quirúrgicos, 6 líneas)
- `renderPiezasSolicitadas` → `etiqEstado`: clase `bcud-est bcud-est-<estado>` y emoji aparte; `botonAccion`: clase
  `bcud-acc` + `data-bcud`. (Hay otra `etiqEstado` igual en Reacondicionados ~línea 21671: NO se tocó, es del agente 7.)
- `_despachoCargarHistorial` → `badge` y `tipoTag`: clases `bcud-est-*` / `bcud-tipo-*` y emoji aparte.
- `renderProveedores`: confiabilidad «Buena» de rojo a azul `#1e40af`.
- `taller-app.min.js` regenerado con `scripts/minificar.sh`; `node --check` sin errores.

### `taller.html` (solo las líneas de la capa)
```
<script>var BC_UID=true;try{if(BC_UID&&localStorage.getItem('bc_uid_off')!=='1')document.documentElement.classList.add('bc-uid');}catch(e){if(BC_UID)document.documentElement.classList.add('bc-uid');}</script>
<link rel="stylesheet" href="taller-ui-despachos.css?v=20261026-a4">
<script defer src="taller-ui-despachos.js?v=20261026-a4"></script>
```
**Ojo al juntar ramas:** no se subió el `?v=` de `taller-app.min.js` (para no chocar con los otros agentes); al unir
hay que subirlo una vez para que los equipos bajen el nuevo.

## Archivos
`taller-ui-despachos.css` (nuevo), `taller-ui-despachos.js` (nuevo), `taller-app.js`, `taller-app.min.js` (+ `.map`),
`taller.html` (3 líneas), esta bitácora. Sin migraciones, sin RPC, sin Edge, sin escribir en Supabase ni Info Plus.

## Pruebas (banco local con Supabase simulado, puerto propio 8804; Playwright a 390 y 1280 px)
| Medida | Antes | Después |
|---|---|---|
| Piezas: textos con contraste < 4.5:1 | 4 | 0 |
| Despacho: textos con contraste < 4.5:1 (1280) | 8 | 0 |
| Despacho: MAYÚSCULAS forzadas | 3 | 0 |
| Compras: contraste bajo reales (A Reacond, botones de color, código de lote) | 6 | 0 |
| Compras + Proveedores: MAYÚSCULAS forzadas | 10 | 0 |
| Ventanas con `role="dialog"` (de 4 medidas) | 2 | 4 |
| Ventanas con nombre accesible | 0 | 4 |
| Ventana Ajuste rápido: foco al abrir | BODY | primer campo |
| Botones < 44 px / campos < 48 px o < 16 px | 0 / 0 | 0 / 0 |
| Desplazamiento horizontal | no | no |
| Errores de JavaScript | 0 | 0 |
Escape cierra las 4 ventanas (igual que antes). Con la capa apagada (`bc_uid_off='1'`) la pantalla vuelve a verse como
antes y sin errores. `reacond-fase2.cjs` (copiado al puerto 8804): OK a 390, 440 y 1280.
Las lupas de búsqueda (8×48) son el patrón `bc-busqueda` (círculo que abre el buscador), no cuentan.
Capturas antes/después: carpeta temporal del agente (no en el repo).

## Riesgos y pendientes
- Los nombres de 3 botones de Proveedores cambian en pantalla (mismas funciones). Si el dueño prefiere los nombres de
  antes, basta borrar el bloque `NUEVO` de `taller-ui-despachos.js`.
- Falta probar en iPhone real. La ✕ de las ventanas usa el ícono de la capa general (en el banco sin íconos se ve vacía).
- No publicado. Rama `claude/taller10-a4`.

## Siguiente paso
Revisión del dueño en la rama; al unir las 10 ramas, subir el `?v=` de `taller-app.min.js` y publicar solo con «publícalo».
