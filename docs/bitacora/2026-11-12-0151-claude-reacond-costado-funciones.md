# Reacondicionados · «Costado» con nueve funciones

Sigue a `2026-11-12-0130-claude-reacond-costado.md` (el panel al costado). Misma rama, todavía sin publicar.

## Pedido del dueño
«Vamos agregar más funciones desde ahí mismo». Se le dio la lista de nueve y respondió: «Las nueve, o sea todas».

## Qué se hizo (`taller-reacond-costado.js`, `?v=20261112-c2`)
| # | Función | Cómo |
|---|---|---|
| 1 | Siguiente paso | Botón principal de 54 px abajo, según el estado: Empezar/Seguir diagnóstico, Asignar, Técnico recibió, Enviar a calidad, Aprobar calidad, Registrar salida |
| 2 | Marcar tareas | Un toque la marca hecha; otro la reabre. En Listo o Despachado ya no se tocan |
| 3 | Asignar técnico | El botón principal dice «Asignar a <sugerido>»; los demás técnicos salen debajo |
| 4 | Color | Abre `abrirColoresLote` |
| 5 | Copiar IMEI | Portapapeles + aviso «IMEI copiado» |
| 6 | Label | Solo en Listo o Despachado (`imprimirLabelEquipo`) |
| 7 | Historial | «Ver todo» junto a los movimientos (`verHistorialEquipoReacond`) |
| 8 | Editar evaluación | Solo en Diagnosticado (`continuarEvaluacion`) |
| 9 | Seguir de corrido | Casilla «Seguir» (encendida de fábrica; se guarda en `bc_reacond_costado_seguir`). Si el paso cambió el estado, pasa al siguiente teléfono |

## Fuente de verdad y candados
- Los pasos NO escriben por su cuenta: llaman a `cambiarEstadoProceso`, `aprobarTerminado`, `marcarDespachado` y `confirmarAsignarTecnico`. Conservan sus permisos, confirmaciones, chequeo de piezas y fallas pendientes, e historial.
- `cambiarEstadoProceso` reabre la ventana del proceso al terminar; durante la acción del panel se evita esa reapertura (se restaura al instante).
- Única escritura propia: `tareas_trabajo` (`estado` y `fecha_completada`), con los mismos datos que `completarTarea` / `reabrirTarea`. Verificado en la base (solo lectura): la tabla no tiene disparadores.
- Diferencia a propósito: marcar una tarea desde el panel no pide nota ni pregunta «¿finalizar?»; el botón «Enviar a calidad» queda a la vista y avisa «Falta N tarea(s)».
- El panel bajó a `z-index` 95 para que las ventanas y confirmaciones (100+) salgan encima.

## Pruebas
- `scripts/pruebas/reacond-costado-funciones.cjs` (nuevo): 38 comprobaciones OK a 390 y 1280 px.
- `reacond-costado.cjs`, `reacond-limpio.cjs`, `reacond-pistola.cjs`: Todo OK.
- Error encontrado y corregido en la prueba: el botón principal quedaba apagado después de la primera acción.
- Sin probar en iPhone real ni con usuarios que no son administradores.

## Estado
Rama `claude/reacond-costado`. **Sin publicar**: espera el «Publícalo» del dueño.
