# Auditoría: sucursal asignada por empleado (almacén fijo en la Prefactura) — solo lectura

**Dueño:** «¿Qué pasa si un empleado de Navarrete prefactura un artículo que solo hay en Santiago? Reglamento: el almacén del
empleado no puede cambiar del asignado» → «Revisa que todos tengan su sucursal» → «Déjalos libres» (los administradores).

## Cómo reacciona el sistema hoy (código revisado)
- `_rpInit()` (taller-app.js): si el empleado tiene `sucursal_id`, el almacén se fija por su sucursal (Santiago 1, Moca 4,
  Navarrete 7) y la casilla queda **deshabilitada**; solo `isAdminUser()` puede cambiarlo. Sin sucursal, la casilla queda libre.
- Artículo sin existencia en el almacén fijo: en el buscador sale al final, en gris, «Sin stock»; en el detalle «NAVARRETE: 0» en
  rojo y las tiendas que sí tienen. Al agregar, `_rpAgregarArticulo` consulta la existencia en vivo y **bloquea**: «no tiene
  existencia en Navarrete. No se puede facturar.» Si ya estaba en la prefactura, `_rpCant` no deja subir y `_rpProblemas` bloquea Guardar.

## Base (consulta de solo lectura a `tecnicos` + `usuarios` + `sucursales`)
| Empleado | Sucursal | Cod. vendedor Info Plus |
|---|---|---|
| alejandro espaillat, YOSMEIRY | Navarrete | 833, 1192 |
| kenifer perez | Moca | 1020 |
| MICHELLE FELIPE BAEZ | Santiago | 748 |
| FRANCIS PLACENCIO, JOSIEL LAHOZ, LUIS MIGUEL BRETON | Santiago | **sin código** |
| LORIBEL VENTURA (admin) | vacía | 249 |
| YVES BAYOL (admin) | vacía | sin código |
| Administrador BAYOL CELL (usuarios) | vacía | — |

## Decisión del dueño
Los administradores (Loribel, Yves, admin) **quedan libres** de sucursal: pueden escoger cualquier almacén. No se cambió ningún dato.

## Pendiente opcional
Códigos de vendedor de Info Plus para Francis, Josiel y Luis Miguel (si deben prefacturar a su nombre). Se registran en
Configuración → Técnicos.

## Propuesta no ejecutada
Aviso más claro al agregar sin existencia («No hay en Navarrete. Hay 3 en Santiago») con botón «Pedir traslado» por WhatsApp.
