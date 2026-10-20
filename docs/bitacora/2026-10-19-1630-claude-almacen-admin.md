# 19-oct-2026 — El administrador elige el almacén y el sistema lo recuerda

**Rama:** `claude/bayol-navarrete`. Sin publicar.
**Sigue a:** `2026-10-19-1600-claude-navarrete-almacen-7.md`.

## Pedido del dueño
> «Yo como administrador tenga la opción de elegir el almacén, porque en ocasiones estoy en diferente sucursal trabajando.»

## Qué cambia
- **El almacén se ve sin abrir nada.**
  - Para el administrador, el campo «Almacén (Info Plus)» sale de «Datos adicionales», que está plegado, y queda arriba de «Artículos y servicios».
  - Ahí se ve sin abrir nada, y la existencia que muestra el buscador depende de ese almacén.
  - Lo hace la función `almacenAdmin()` en `taller-recepcion.js` (`r3`), que también se llama desde `_rpInit`.
- **El sistema recuerda el almacén por equipo.**
  - El último almacén que elige el administrador se guarda en ese equipo, en `localStorage.bc_alm_admin`.
  - La próxima vez la prefactura abre con ese almacén, en la Recepción y en la prefactura rápida.
  - Lo hacen `_almAdminGuardar` y `_miAlmacenInfoplus` en `taller-app.js` (`nv2`).
- **Las empleadas no cambian.**
  - Su almacén sigue siendo automático según su sucursal: Moca → 4, Navarrete → 7, Santiago → 1.
  - Si una empleada cambia el almacén a mano, vale solo para esa prefactura y no se guarda.
- **Mientras el almacén esté arriba**, el resumen de «Datos adicionales» ya no lo repite.

## Pruebas con Playwright, a 390 y a 1280 px
| Prueba | Resultado |
|---|---|
| `admalm.mjs`: el administrador ve y elige el almacén (48 px de alto) arriba de Artículos; al volver a abrir sigue el que eligió (Moca y luego Navarrete), y la prefactura rápida también lo usa. Yosmeiry sigue en Navarrete automático y su cambio a mano no se guarda | 18 PASS |
| `nav7.mjs` | 9 PASS |
| `vend.mjs` | 9 PASS |
| `rxfun.mjs` | 12 PASS |
| `rxppk.mjs` | 23 PASS |

## Riesgos
Ninguno de dinero ni de datos. Solo cambia qué almacén aparece elegido y dónde está el campo.
