# Reacondicionados · «Pasar con pistola»: primero el técnico del grupo

## Pedido del dueño
Captura de la ventana «Pasar con pistola» con 3 iPhone para «Entregar a técnico», cada uno con su propio selector. Dijo: «vamos a poner que primero elijo el técnico que le voy a asignar el grupo de celulares».

## Qué se hizo (`taller-reacond-pistola.js`, `?v=20261112-k2`)
- Arriba del campo, una fila «Técnico del grupo» con un botón por técnico activo (nombre y cuántos tiene en reparación), de 44 px.
- Un toque elige el técnico: todos los «Entregar a técnico» ya escaneados pasan a él y los que se escaneen después también. El cursor vuelve al campo para seguir pasando.
- Otro toque en el mismo técnico lo quita y vuelve a la sugerencia de antes (el de menos carga).
- Cada fila conserva su selector por si un equipo va a otro técnico.
- El guardado no cambió: mismo `aplicar()` (equipos_refurbish + equipo_historial + asignarFallasSinDueno), mismos permisos.

## Pruebas
- `scripts/pruebas/reacond-pistola-tecnico.cjs` (nueva): 9 comprobaciones OK a 390 y 1280 px (incluye «Aplicar»: los 4 quedan en reparación con el técnico elegido y con historial).
- `reacond-pistola.cjs` y `reacond-costado-funciones.cjs`: Todo OK.
- Sin probar con la pistola real.

## Estado
Rama `claude/pistola-tecnico-primero`. **Sin publicar**.
