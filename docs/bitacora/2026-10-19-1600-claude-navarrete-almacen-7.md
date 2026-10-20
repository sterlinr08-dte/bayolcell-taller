# 19-oct-2026 — Yosmeiry (1192), localidad Navarrete (7) y almacén automático por sucursal

Rama: `claude/bayol-navarrete` · **sin publicar** (falta el «publícalo» del dueño). Sigue a `2026-10-19-1530-claude-codigos-y-localidad-7.md`.

## Pedido del dueño
Respuestas a las preguntas:
- «Sí: 7 = Navarrete, 1192 = Yosmeiry».
- «Sí, automático (Recomendado)»: el almacén de la prefactura sigue la sucursal de la empleada.

## Lo que se hizo
### Datos (autorizado por el dueño)
- `tecnicos.infoplus_codempleado = '1192'` para Yosmeiry (Navarrete).
- Michelle (748) y Kenifer (1020) ya estaban guardadas.

### `taller-app.js` (`?v=20261019-nv1`)
- **Navarrete en las listas:** `INFOPLUS_ALMACENES` agrega `'7': 'Navarrete'` y `PREF_ALMACENES` agrega «Localidad Navarrete».
- **Funciones nuevas:**
  - `_almacenDeSucursal(nombre)` traduce la sucursal al almacén: Navarrete → 7, Moca → 4, Santiago → 1.
  - `_miAlmacenInfoplus()` toma la sucursal de la persona que entró: busca su `sucursal_id` en `cache.tecnicos` y el nombre en `cache.sucursalesEmp`.
  - `_cargarSucursalesEmp()` llena `cache.sucursalesEmp`.
- **Recepción (`_rpInit`):** el almacén se pone solo, según la sucursal de la empleada.
  - No cambia si ella ya lo cambió a mano, ni si la prefactura ya existe.
  - El administrador puede cambiarlo igual que antes.
- **Prefactura rápida (`_pref`):** la localidad por defecto es `_miAlmacenInfoplus() || '1'`.

### Edge Functions (Supabase `vkhwdvjtowrhkhqavnvk`)
- `infoplus-existencia-art` v15: consulta existencia también en el almacén 7.
- `infoplus-sync` v26: siempre incluye el almacén 7, aunque el secreto `INFOPLUS_ALMACENES` no lo tenga.
- El código fuente de las dos ahora queda en el repo, en `supabase/functions/…`. No contiene claves: usan los secretos de siempre.

## Pruebas (banco local con Playwright)
| Prueba | Resultado |
|---|---|
| `nav7.mjs`: Michelle → almacén 1 y empleado 748; Kenifer → 4 y 1020; Yosmeiry → 7 y 1192; la lista trae Navarrete | 9 PASS |
| `vend.mjs` (vendedor y empleado) | 9 PASS |
| `rxfun.mjs` (recepción) | 12 PASS |
| `rxppk.mjs` (buscador de artículos, ≥ 44 px a 390 y 1280) | 23 PASS |

## Pendientes
- **Sincronización:** la última corrida antes del despliegue (12:30 UTC) todavía no traía el «7». La de las 13:00 UTC debería mostrar `por_almacen."7"` con unidades; eso confirma que el almacén 7 existe en Info Plus.
- **Preguntas al dueño:**
  - quiénes son los códigos 249 y 750;
  - si Loribel e Yves van a prefacturar.
- **Prueba real:** que una empleada haga una prefactura y se revise en Info Plus que salga con su código.
