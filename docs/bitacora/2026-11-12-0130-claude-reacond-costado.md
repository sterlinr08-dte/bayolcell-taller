# Reacondicionados · ficha del equipo al costado («Costado»)

**Nota de hora:** el nombre lleva la hora del reloj del servidor (RD). Va después de `2026-11-12-2256-claude-reacond-limpio.md` aunque el nombre ordene antes.

## Pedido del dueño
Reel de Moxen `DfnsWJABIDo` («Costado»: abrir el detalle sin perder la lista). Dijo: «Haz 1 y 2 y para nexus también podemos sacarle provecho». La 2 (referencia en los 3 proyectos) ya quedó en PR #310. Esta es la 1.

## Qué se hizo
- Archivo nuevo `taller-reacond-costado.js` (`?v=20261112-c1`), cargado en `taller.html` después de `taller-reacond-pistola.js`. No toca `taller-app.js`.
- Tocar la fila de un teléfono en `#reacondEquiposLista` abre su ficha al costado en vez de la ventana:
  - PC (≥ 1100 px): panel fijo de 400 px a la derecha; la lista se encoge (1118 → 706 px a 1280) y sigue a la vista.
  - Celular: hoja desde abajo (máx. 86 % del alto) con fondo para cerrar.
  - ↓ / J siguiente · ↑ / K anterior · Esc cierra. Flechas ▲▼ y ✕ de 44 px.
- Muestra: modelo, IMEI, foto, estado, técnico, fallas pendientes, costo (solo si la fila lo trae: respeta el permiso de admin), capacidad, color, tiempo en el paso, avisos, nota, fallas (`equipo_fallas`), piezas, tareas y los 5 últimos movimientos (`equipo_historial`).
- Solo lee. «Abrir equipo» (54 px) hace exactamente lo que hacía tocar la fila. La casilla, el ojo, el lápiz y «Abrir» de la fila no cambian.
- Apagar: `localStorage.bc_reacond_costado_off='1'` o `window.BC_REACOND_COSTADO=false`.

## Qué hace solo
| Acción | Detalle |
|---|---|
| Marca la fila abierta | Borde azul en la lista |
| Se cierra solo | Si cambia el lote, la página o se sale del módulo |
| No estorba | Con una ventana abierta, las teclas no mueven el panel |
| Guarda 1 minuto | Fallas y movimientos ya consultados no se vuelven a pedir |

## Pruebas
- `scripts/pruebas/reacond-costado.cjs`: 24 comprobaciones OK a 390 y 1280 px, más la capa apagada.
- `reacond-limpio.cjs` y `reacond-pistola.cjs`: Todo OK.
- Sin probar en un iPhone real ni contra la base real (solo lectura de dos tablas).

## Estado
Rama `claude/reacond-costado`. **Sin publicar**: espera el «Publícalo» del dueño.

## Siguiente paso
Si gusta, llevar la misma idea a NEXUS (Clientes, Facturas, Cobros, Solicitudes).
