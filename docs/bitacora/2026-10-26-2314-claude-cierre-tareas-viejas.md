# Conciliación: 209 tareas viejas cerradas

- **Dueño:** «Ok», a cerrar las tareas abiertas de equipos terminados y a descontar las 3 piezas «recibida».
- **Respaldo previo:** tabla `_respaldo_tareas_20261027` con las 209 filas tal como estaban (96 equipos), con RLS activada y sin políticas.
  - Para deshacer: `update tareas_trabajo t set estado = r.estado, fecha_completada = r.fecha_completada, notas = r.notas from _respaldo_tareas_20261027 r where r.id = t.id;`
- **Hecho:** `estado = 'hecha'`, `fecha_completada = now()`, con una nota «[Cerrada por conciliación 27-oct-2026 (OK del dueño)…]». Verificado: quedan 0 abiertas en equipos Listo o Despachados.
- **Piezas en Info Plus:** no se pueden descontar desde aquí, porque el descuento usa la sesión de un administrador dentro de la app. El dueño lo hace desde la ficha de cada equipo con «Confirmar y descontar todas».
  - Los equipos son iPhone 11 …404550, iPhone 11 …359458 e iPhone 8 Plus …192179; cada uno tiene una sola pieza pendiente, una batería.
