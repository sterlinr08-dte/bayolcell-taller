# Candados de Reacondicionados aplicados

- **Dueño:** «Listo». Pegó `20261027000000_reacond_candados_servidor.sql` en el SQL Editor de Supabase.
- **Verificación (solo lectura):**
  - 2 disparadores: `trg_refurb_fecha_despacho_fija` y `trg_refurb_guardia_fase3`.
  - `reacond_guardar_evaluacion` con el candado de «ya salió de diagnóstico».
  - `reacond_registrar_devolucion` crea la tarea del ciclo nuevo.
- **Prueba dentro de una transacción revertida:** se intentó cerrar la salida de un equipo «Listo para venta» sin usuario. Lo frenó la guardia de permisos que ya existía. No cambió ningún dato.
- Las propuestas `20261026014900` y `20261026151000` quedan como antecedente; lo aplicado es el archivo 20261027000000.
