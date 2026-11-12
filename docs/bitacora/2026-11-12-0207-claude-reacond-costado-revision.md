# Reacondicionados · «Costado»: revisión con las skills y correcciones

Sigue a `2026-11-12-*-claude-reacond-costado-funciones.md`. Misma rama, todavía sin publicar.

## Pedido del dueño
«Recuerda de aplicar las skills necesarias». Se pasó el trabajo por `gstack-review` (con una revisión independiente del código, solo lectura) y `web-design-guidelines`.

## Lo que encontró la revisión y cómo quedó (`taller-reacond-costado.js`, `?v=20261112-c3`)
| # | Gravedad | Hallazgo | Corrección |
|---|---|---|---|
| 1 | Alta | Cualquier usuario podía marcar o reabrir la tarea de otro técnico (la ventana del proceso solo deja a su técnico o al admin) | Mismo candado: solo sale el botón si es su tarea o es admin; se vuelve a comprobar al guardar |
| 2 | Alta | «Reasignado» tenía un «Técnico recibió» de un toque que saltaba `recibirEquipoReasignado` (solo el técnico nuevo, con decisión de piezas) | Reasignado ya no tiene atajo: se usa «Abrir equipo» |
| 3 | Media | Reparación externa iba directo a calidad | Ahora dice «Volvió de reparación externa» y pasa a Técnico recibió, igual que la ventana |
| 4 | Media | El botón podía decir un paso y ejecutar otro si el equipo cambiaba por fuera | Se compara lo que decía el botón con el estado real; si no coincide, repinta, avisa y no ejecuta. El panel también se repinta solo |
| 5 | Media | Tras «Seguir», un segundo toque rápido caía en el teléfono siguiente | El botón principal descansa 0.7 s al cambiar de teléfono y suelta el foco. Con «Seguir» apagado ya no salta |
| 6 | Media | Con una confirmación abierta, las flechas cambiaban de teléfono | Teclas, flechas y cerrar quedan quietos con una pregunta abierta o una acción en curso |
| 7 | Media | Se anulaba `abrirPanelProceso` para todo el sistema durante cualquier acción | Solo durante `cambiarEstadoProceso` y solo para ese equipo |
| 8 | Baja | Se cortaba el clic a otras capas (menú «Pasar a» no se cerraba) | Ya no se corta; solo se apaga el onclick de la fila para ese toque |
| 10 | Baja | Si la base no cambiaba ninguna fila, igual decía «Tarea hecha» | Pide las filas cambiadas y exige el estado esperado; si no cambió, avisa y actualiza |
| 11 | Baja | Salían «Aprobar calidad» y «Registrar salida» sin permiso | Solo con `piezas_aprobar_extra` / `estado_despachar` o admin |
| 14 | Baja | El aviso tapaba el botón principal | Se corre a la izquierda del panel (PC) o arriba (celular) |

Accesibilidad (guía web): anillo de foco visible, iconos ocultos al lector de pantalla, aviso «Falta N tarea(s)» anunciado, panel cerrado con `inert`, estado al pasar el ratón, `overscroll-behavior: contain`, `touch-action: manipulation`.

## Sin corregir (anotado)
- 9: arrastre que empieza en la casilla y termina en la misma fila puede abrir el panel.
- 12: el id del equipo se lee del `onclick` de la casilla; si otra capa cambia ese marcado, el panel deja de abrir (no rompe nada).
- 15: «Seguir» se detiene al final de la página de 10.
- No se revisó RLS de `tareas_trabajo` en la base; el candado de tareas es el mismo de la pantalla existente (del lado del navegador).

## Pruebas
- `reacond-costado-funciones.cjs`: 47 comprobaciones OK (390 y 1280 px), incluidas las de técnico sin permisos.
- `reacond-costado.cjs`, `reacond-limpio.cjs`, `reacond-pistola.cjs`: Todo OK.

## Estado
Rama `claude/reacond-costado`. **Sin publicar**.
