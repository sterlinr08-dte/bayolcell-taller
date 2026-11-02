# Corrección ortográfica — solo Alejandro y Omil, solo mala escritura

> Sigue a `2026-11-02-0415-claude-ortografia-mala-escritura-primero.md`.
> Dueño: «Tengo dos empleados que son Alejandro y Omil que no saben escribir bien … las tildes no me interesan ni los signos, lo más importante es que está bien escrito».

## Cambios
1. **Lista de empleados** en `crm_ortografia_config.empleados` (migración `20261102130000_crm_ortografia_empleados.sql`, **sin aplicar**).
   - Vacía = todos.
   - Con datos = solo esos empleados (`actor_ref_id` de `auth_actor_bindings`).
   - Las 3 funciones pasan `empleadoId: refId`. El motivo para los demás es `empleado_no_incluido`, sin gastar cupo ni IA.
2. **Solo mala escritura:**
   - La IA ya no debe tocar tildes, signos ni mayúsculas.
   - Si lo único que cambiaría es eso, sale el original sin marca (`solo_tildes_o_signos`).
   - Cuentan como mala escritura las letras cambiadas, faltantes o sobrantes, las palabras pegadas o separadas y las repetidas.
3. **Orden de despliegue:** si se suben las funciones antes de aplicar la columna, la lectura de configuración falla y sale el original (seguro).

## Pruebas
50/50 (`node --test scripts/pruebas/ortografia.test.mjs scripts/pruebas/ortografia-envio.test.mjs`). Las pruebas que usaban «esta→está» se cambiaron por faltas reales («resivimos→recibimos»). Hay una prueba nueva de la lista de empleados y de «solo tildes».

## Bloqueo
El conector de Supabase se desconectó en esta sesión. Al volver hay que:
1. Aplicar la migración.
2. Buscar los ids de Alejandro y Omil.
3. Subir las 3 funciones.
4. Con el OK del dueño: `empleados = {alejandro, omil}` y `activo = true`.
