# 2026-10-26 01:46 (RD) — Interfaz global: menú, barra de arriba, Configuración, Reportes y Estadísticas (agente 6 de 10)

Rama: `claude/taller10-a6` (sale de `main` af7016f). **Sin publicar, sin push, sin PR.** Nada tocado en Supabase ni en Info Plus.

## Pedido
Dueño: «lanza 10 agentes para mi sistema del taller para que trabajen en la parte gráfica (interfaz)». A este agente le tocó:
navegación general y menú lateral, Configuración, Reportes y Estadísticas, más un barrido de consistencia en todas las
pantallas (mayúsculas forzadas, botones de menos de 44 px y textos explicativos). Criterio: DESIGN.md §4/§4b, skills
impeccable y apple-design.

## Qué encontré (medido con el banco local a 390 y 1280 px)
- **Barra de arriba:** los botones Campana / Llave / Salir medían **34×34 px** (celular y PC); el ☰ del celular, 40×40.
  `taller-tactil.css` solo cubre `.view` y `.modal-box`, no la barra. Además `taller-visual-polish.css` les fija
  `min-width:34px !important` con `#app`.
- **Título de la pantalla** en MAYÚSCULAS y con la píldora pegada: «CONFIGURACIÓN ADMIN», «ESTADÍSTICAS PRIVADO»
  (el título se copiaba del texto completo del botón del menú).
- **Mayúsculas forzadas en todo el taller:** la regla base `label { text-transform: uppercase }` ponía TODAS las etiquetas
  de formulario en mayúsculas (choca con §4b). También títulos de ventana (`.modal-header h3`), píldoras (`.badge`),
  `h3/h4` con el estilo escrito (Dashboard, Configurar impresora, Devoluciones…), rol «TÉCNICO». Conteo en mis 4 vistas:
  55 elementos a 1280 px y 50 a 390 px.
- **Menú lateral:** títulos de sección escritos en MAYÚSCULAS en el HTML («OPERACIÓN DEL TALLER»), de 10 px y gris
  `#475569` sobre azul noche (poco contraste). Botones ya de 44 px. No hay botones flotantes que tapen el contenido
  (medido: ningún elemento fijo pequeño visible en 390 ni en 1280).
- **Zonas seguras del iPhone:** nada para la parte de arriba (muesca) en la barra ni en el menú.
- **Reportes:** `.kpi-grid` **no tenía estilo**: los KPI salían uno debajo del otro, a lo ancho, también en la PC.
  Dinero como «RD$0» (sin espacio ni decimales). Nota explicativa «Trabajo = desde que…» a la vista.
- **Error grave (congela la página):** `renderReporteTecnico` (Reportes) y `_pintarDashboardFin` (Financiamientos)
  esperaban Chart.js así: `if (Chart no existe) __bayolLibs.then(volver a llamarse)`. Si Chart.js no carga (internet
  caído o el CDN bloqueado), la promesa ya está resuelta y la función se llama a sí misma sin fin: **la pestaña se
  congela**. Lo descubrí porque el banco local bloquea los CDN y la página dejaba de responder al abrir Reportes.
- **Estadísticas:** textos explicativos a la vista («Módulo interno. Solo usted lo ve…», «Las compras a proveedores se
  activarán…»). Rótulos de KPI en mayúscula (permitido por DESIGN.md).
- **Configuración:** cuadros de colores con explicaciones en Roles, Categorías y Marcas; párrafos explicativos en Datos del
  taller, Organizar menú y Fallas; etiquetas largas con paréntesis («Garantía de celulares (sale en la prefactura si…)»);
  botón Guardar de 44 px; pestañas que en el celular apretaban el texto.
- **Dashboard (celular):** rótulos de KPI a **8,5 px** (`taller-visual-polish.css`, `#app #v-dashboard .kpi-box small`).

## Qué cambié
Capa nueva **`taller-ui-global.css`** (en el `<head>`, después de las demás capas) + **`taller-ui-global.js`** (defer).
Interruptor: clase `html.bc-ui`; apagar en un equipo con `localStorage.bc_ui_off='1'`, para todos con `BC_UI=false`.
1. Barra de arriba: ☰, Campana, Llave y Salir a **44×44**; título en letra normal, recortado con «…» si no cabe; rol en letra normal.
2. Menú: títulos de sección en letra normal («Operación del taller») con CSS (`lowercase` + primera letra mayúscula, sin tocar
   el HTML), color más legible, 11 px en el celular; foco visible naranja; Escape cierra el menú del celular y el ☰ dice si
   está abierto (`aria-expanded`).
3. Zonas seguras: barra de arriba y menú con `env(safe-area-inset-*)` (si el teléfono no las da, valen 0 y no cambia nada).
4. Barrido global sin MAYÚSCULAS forzadas: etiquetas (`label`), títulos h1–h5/summary/leyendas, título de ventana, cabeceras de
   bloque, píldoras `.badge` y rótulos `span` con el estilo escrito. **Se dejan** los encabezados de tabla y los rótulos de KPI
   (DESIGN.md los permite) y las vistas previas de etiquetas impresas (llevan `text-stroke`, deben verse como el papel). El chat
   de WhatsApp (`#waWrap`) queda fuera.
5. Números con `tabular-nums` en todas las pantallas.
6. KPI en rejilla: 2 columnas en el celular, las que quepan en la PC (3 en Reportes a 1280). Gráfica de Reportes con alto fijo
   (260 px) para que no salte. Tablas de Reportes/Estadísticas se desplazan dentro de su tarjeta.
7. Configuración (§4b): pestañas como píldoras de 44 px que se desplazan de lado en el celular; etiquetas 13 px `#475569` encima del
   campo; campos 48 px / 16 px con foco azul NEXUS; botón Guardar **54 px**.
8. Dashboard en el celular: rótulos de KPI de 8,5 a 11 px.
9. Ayudas detrás de la ⓘ (misma ⓘ y burbuja de `taller-info.js`; si el título ya tiene la ⓘ de taller-info, se suman las notas
   a la suya): Roles, Categorías, Marcas, Datos del taller, Organizar menú, Fallas, tope de descuento, paréntesis largos de las
   etiquetas de Configuración, definición de tiempos en Reportes (si aún no hay trabajos, ese aviso sí se queda) y las dos notas
   de Estadísticas. Los avisos de error («No se pudieron cargar las ventas…») siguen a la vista.

Cambios mínimos en `taller-app.js` (luego `bash scripts/minificar.sh`, `node --check` de los dos archivos):
- `renderReporteTecnico` y `_pintarDashboardFin`: esperan a Chart.js **una sola vez**; si no cargó, salen sin gráfica y la página no se congela.
- `nav()` y las 2 restauraciones de vista al cargar: el título toma solo el nombre del menú (sin «ADMIN»/«PRIVADO»).
- `construirReporteCobros`: dinero como «RD$ 1,250.00».

`taller.html`: solo se agregaron 3 líneas (script del interruptor + `<link>` de la capa, después de `taller-afinado.css`) y 1 línea
`<script defer src="taller-ui-global.js">` después de `taller-info.js`.

## Archivos
- nuevos: `taller-ui-global.css`, `taller-ui-global.js`, `scripts/pruebas/ui-global.cjs`, esta bitácora
- modificados: `taller-app.js`, `taller-app.min.js`, `taller-app.min.js.map`, `taller.html` (4 líneas)

## Pruebas (banco local, puerto propio 8806, Supabase simulado)
- `scripts/pruebas/ui-global.cjs` (nueva): **29/29 OK** — a 390 y 1280: capa activa, botones de la barra ≥ 44 (44), ☰ solo en
  el celular, título «Configuración» sin mayúsculas ni «ADMIN», secciones del menú en letra normal, 0 etiquetas en mayúsculas,
  etiqueta corta «Garantía de celulares» + ⓘ, 11 campos de 48 px / 16 px, Guardar 54 px, 6 ⓘ que abren y cierran, KPI en 2
  columnas (390) y 3 (1280), «RD$ 0.00», sin desplazamiento horizontal, 0 errores de JavaScript; y **Reportes sin Chart.js: la
  página responde** (antes se congelaba).
- Medidas de las 4 vistas (Configuración, Reportes, Estadísticas, Dashboard), antes → después:
  - botones de la barra de arriba: 34×34 → 44×44 (390 y 1280);
  - elementos en mayúsculas forzadas: 50 → 42 (390) y 55 → 47 (1280); en Configuración 6 → 0. Lo que queda son rótulos
    de KPI y encabezados de tabla, permitidos por DESIGN.md;
  - controles de menos de 44 px dentro de las vistas: 0 antes y después (ya los cubría taller-tactil);
  - KPI de Reportes: 1 columna → 2 (390) / 3 (1280);
  - sin desplazamiento horizontal; 0 errores de JavaScript.
- Capturas antes/después: carpeta temporal del agente (`.../scratchpad/taller10/a6/antes` y `/despues`), no en el repo.

## Barrido de todas las vistas: lo que NO cambié (lista para decidir)
- **Campos que muestran en MAYÚSCULAS lo que se escribe** (`style="text-transform:uppercase"` en el campo): `eq_imei`,
  `eq_notas`, `mod_tec_nombre`, `lv_clase`, `gs_ncf`, `mod_falla_corto`, `mod_art_codigo`, `mod_art_descripcion`, `mod_art_marca`,
  `mod_art_categoria`, `mod_art_modelo`, `mod_art_capacidad`, `mod_art_referencia`, `mod_perfil_nombre`. Ojo: solo cambia cómo se
  ve; el valor se guarda como se escribió, salvo que el código lo pase a mayúsculas al guardar. Para códigos, NCF e IMEI tiene
  sentido; para nombres y notas no. **Decisión del dueño.**
- Rótulos de KPI en mayúscula (≈85 en `taller-app.js`, p. ej. «TOTAL ADEUDADO», «MONTO») y encabezados de tabla: permitidos por
  DESIGN.md; se dejaron.
- Textos escritos en MAYÚSCULAS dentro del HTML/JS (no es estilo): «SIN LOGIN», «ACTIVO», «PRIVADO», «V5 · TALLER RD», «ADMIN»
  en el menú. Cambiarlos es editar textos en `taller.html`/`taller-app.js` (fuera de lo permitido a este agente).
- La etiqueta `<meta name="viewport">` no tiene `viewport-fit=cover`; con eso el iPhone en modo app (pantalla de inicio) entrega
  las zonas seguras de arriba. La capa ya está lista para usarlas; agregarlo es 1 cambio en `taller.html` (decisión de quien junte las ramas).
- Login: «Usuario Operador» y «Contraseña Corporativa» como etiquetas; el login no está en `.view` y su etiqueta ya sale en letra normal con esta capa.
- Barrido de botones < 44 px en TODAS las vistas: no se pudo completar en este equipo (los navegadores de prueba se cerraban
  por la carga de los 10 agentes a la vez); en las 6 vistas medidas antes (Atención, Diagnóstico, Catálogo web, Cuentas por pagar,
  Rifa por factura, Contabilidad) dio 0 controles < 44 px dentro de la vista.

## Riesgos
- La regla de etiquetas sin mayúsculas es global: cambia el aspecto de muchas pantallas a la vez (para bien según §4b), pero
  conviene mirar Prefactura y CRM, que tienen capas propias de otros agentes.
- El `?v=` de `taller-app.min.js` en `taller.html` **no se subió** (para no chocar con las otras 9 ramas); quien junte las ramas
  debe subirlo una sola vez, o los navegadores seguirán con el JS viejo hasta que caduque la caché.
- Si otra rama también cambia `nav()` (título) o `renderReporteTecnico`, revisar el choque al juntar.

## Siguiente paso
Que el dueño lo vea en la rama (o en un entorno de prueba) a 390 y 1280; si le gusta, juntar con las demás ramas y publicar con su «publícalo».
