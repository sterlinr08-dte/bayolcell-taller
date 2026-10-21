# 21-oct-2026 16:30 · Claude · Permisos en dos listas y permisos por empleado

## Pedido del dueño
- Mandó el reel «Traspaso» de Moxen (dos listas que se pasan elementos).
- Pidió poder tener dos empleados del mismo rol (Servicio) y darle a uno un acceso que el otro no tiene.
- Vio la muestra (https://claude.ai/artifact/JYGaa23v7Eyz1TubBjabVs) y dijo «Aplícalo».

## Cómo estaba (fuente de verdad)
- Los permisos son por rol: `roles_taller.permisos` (jsonb `{id: true}`) y `tecnicos.rol_id`.
- En el taller, `tienePermiso()` lee `sessionUser._permisos`, que se carga al iniciar sesión.
- En la base, `app_actor_tiene_permiso(p_permiso)` lee el rol.
- `tecnicos` solo lo escribe el admin (política `tecnicos_admin_update`).

## Cambios
1. **Base de datos** (`supabase/migrations/20261021150000_permisos_por_empleado.sql`, aplicada con execute_sql):
   - columna nueva `tecnicos.permisos_extra jsonb not null default '{}'`, con `{permiso: true}` para extra y `false` para quitado;
   - `app_actor_tiene_permiso` ahora usa `rol || permisos_extra`: lo de la persona pisa lo del rol;
   - el usuario admin sigue con todo;
   - un técnico sin rol y sin extras sigue sin nada;
   - comprobado: la columna existe, la función la usa y hoy **nadie tiene extras**, así que nada cambió para nadie.
2. **`taller-app.js`**: al iniciar sesión, `_permisos = permisos del rol + permisos_extra`. Rige desde el próximo inicio de sesión de cada empleado.
3. **`bc-permisos-listas.js`** (nuevo; `taller.html` `?v=20261021-pl1`; se apaga con `localStorage.bc_permlistas_off = '1'`):
   - **Ventana del rol**:
     - las casillas se ven como dos listas (Disponibles y Asignados) con buscador, contador, flecha naranja con globito, doble toque, arrastre y teclado;
     - las casillas originales siguen siendo la fuente, ocultas, así `guardarRol()` no cambió;
     - el rol del sistema queda solo para ver.
   - **Ventana del empleado**, nueva sección «Permisos de esta persona», debajo del rol:
     - etiquetas «Del rol», «Extra» y «Quitado»;
     - resumen en palabras («Ana tiene todo lo del rol Servicio al cliente, más: …»);
     - al guardar, primero se escribe `permisos_extra` y después sigue el `guardarTecnico()` de siempre;
     - empleado nuevo: hay que guardarlo primero;
     - administrador: tiene todo.
   - En un espacio angosto (ventana del empleado, celular) las listas van una debajo de la otra.

## Pruebas (banco local, 1280 y 390)
- 16 PASS / 0 FAIL:
  - rol: las dos listas reemplazan las casillas, y al pasar uno se marca la casilla;
  - Ana: «más» con 1 Extra y 1 Del rol; quitarle algo del rol queda «Quitado»; al guardar se manda `permisos_extra`;
  - Carla: sin nada extra;
  - todo lo tocable mide 44 px o más;
  - sin errores.
- Se corrigió que la lista del rol se creara dos veces.

## Estado
- Base aplicada (aditiva).
- Pantallas en la rama `claude/prefactura-limpia`, **sin publicar**.

## Ojo
- Los cambios de permisos de una persona rigen cuando ella vuelve a iniciar sesión (como ya pasaba con el rol).
