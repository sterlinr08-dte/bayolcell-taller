# Taller: tamaño táctil en todas las pantallas — Claude (19-oct-2026)

## Pedido
El dueño dijo «Continuamos con bayol» y eligió «Rediseñar pantallas». Se aplica la regla de NEXUS del 18-oct: «recuerda el tamaño de los botones».

## Diagnóstico
Se midieron las 31 vistas del taller a 390 y a 1280 px, en un banco local. El banco sirve el repo con Supabase simulado (todo vacío) y una sesión admin falsa; no toca la base real.
- Los botones `.btn` medían **40 px en el celular y 36 en la PC**. La causa es la regla `#app .view:not(#v-crmLinea) .btn{min-height:40px/36px !important}`.
- Los filtros de fechas (Hoy, 15 días, 1 mes…) medían **28 px**. Las «?» de ayuda medían **16 × 19**.
- Los íconos de la cabecera del CRM medían **29–32 px**.
- La mayoría de los campos tenían **letra de 12–13 px**, así que el iPhone hacía zoom al tocarlos. En la PC medían 28–40 px de alto.
- **Ya estaba antes:** en el celular, «Campañas» se encimaba con el primer ícono de la barra del CRM.

## Cambio (rama `claude/bayol-tactil`, sin publicar)
- **Archivo nuevo `taller-tactil.css`.** Va cargado al final del `<head>` con un interruptor que pone `html.bc-tactil`:
  - para apagarlo: `BC_TACTIL=false`, o `localStorage.bc_tactil_off='1'` en un equipo;
  - para ganarle a las reglas con `#app`, usa un `:is(.view, .modal-box, #bcT#bcT#bcT)`, que solo sube la especificidad.
- **Botones, filtros e íconos** de las pantallas y las ventanas: 44 × 44 como mínimo, con letra de 13 px o más.
- **Campos y listas:** 48 px con letra de 16. Las áreas de texto, letra de 16.
- **Casillas:** la etiqueta completa mide 44 px.
- **Barra del CRM:**
  - los íconos pasan a 44;
  - con esa medida, Leads/Campañas y los íconos se acomodan en dos filas y **ya no se enciman**;
  - las pestañas, de 11 a 13 px;
  - el chat (`#waWrap`) no se toca.
- **No se tocó la lógica** ni Supabase. No hay cambios en `taller-app.js`.
- **`CLAUDE.md`:** se agregó la sección «Regla del dueño: tamaño de los botones».

## Medido (Playwright, 31 vistas)
| | Antes, 390 px | Antes, 1280 px | Ahora |
|---|---|---|---|
| Controles de menos de 44 px | ~190 | ~230 | **0 en las 31 vistas** |
| Campos con alto < 48 o letra < 16 | ~150 | ~150 | **0** |

En configuración de etiquetas y de impresora quedan los deslizadores de tamaño (`type=range`), que no son campos de escribir.

## Pruebas
- Revisión de sintaxis de los bloques `<script>` de `taller.html`: 4 bloques, 0 errores.
- Se compararon capturas antes/después de Dashboard, Atención, Recepción (PC), Mi Trabajo, Financiamientos, Reacondicionados (PC) y CRM (celular y PC). No hay saltos, solapes ni cortes nuevos.
- **Sin probar con datos reales:** el banco no tiene datos, así que no se vieron tablas llenas ni el chat abierto. Hay que revisarlo en el teléfono antes de publicar.

## Siguiente
El dueño revisa las capturas y dice «publícalo». Push a `main` = producción (GitHub Pages).
