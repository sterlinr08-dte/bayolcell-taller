# Contador de visitas: solo el admin/dueño (08-nov-2026, 16:20 RD)

## Pedido
«Cierra el contador de visitas para que solo yo lo vea.»

## Antes
- `web_visitas_resumen()` y `web_visitas_por_dia()` respondían a cualquiera, incluso sin sesión (`anon`).
- La tabla `web_visitas` se podía leer completa (navegador, identificador del visitante) desde **cualquier empleado con sesión** (política `web_visitas_select_auth` con `true`).

## Cambio (migración `web_visitas_solo_admin`, ya aplicada; copia en `supabase/migrations/20261108200000_web_visitas_solo_admin.sql`)
- La política de lectura de la tabla pasa a `app_is_admin()`.
- Las dos funciones responden «No autorizado» si quien pregunta no es admin. También se limita `p_dias` a 1–366.
- Las inserciones de la página pública no cambian: las visitas se siguen registrando.
- No hizo falta `revoke` (que el conector retiene); la protección va dentro de las funciones y en la política.

## Pruebas (simulando cada tipo de usuario en la base)
| Quién | Resultado |
|---|---|
| Sin sesión (`anon`) | `web_visitas_resumen()` → «No autorizado» |
| Dueño/admin (usuario «usuario») | Ve el resumen: hoy 1, 7 días 69, 30 días 293, y la gráfica de 14 días |
| Empleado técnico que no es admin | Ve 0 filas de la tabla |

## Estado
Aplicado en producción a pedido directo del dueño. El tablero del taller ya mostraba la tarjeta solo al admin (`isAdminUser()`), así que el frontend no cambia.
