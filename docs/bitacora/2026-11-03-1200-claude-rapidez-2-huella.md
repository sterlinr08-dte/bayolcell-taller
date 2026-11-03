# 3-nov-2026 12:00 RD — Rapidez 2: «huella por lista» en el respaldo automático (Claude)

## Solicitud del dueño
«Haz el número 2 de rapidez, ¿qué contra tiene?». Se le dieron 3 opciones con sus contras; eligió **«Huella por lista»**.

## Diagnóstico
- Solo 4 de las 17 tablas tienen `actualizado_en` y ninguna tiene disparador que la mantenga → «traer solo lo nuevo por
  fecha» exigía tocar 14 tablas y no veía los borrados. Se descartó.
- El respaldo de 5 min (y volver a la pestaña) bajaba las 17 listas completas (~460 KB) y redibujaba todo, aunque nada cambiara.

## Cambio
### Base (APLICADA 3-nov, solo lectura): `supabase/migrations/20261103150000_taller_huella.sql`
- RPC `taller_huella()` → jsonb `{tabla: "filas:md5"}` de las 17 listas con los mismos filtros/columnas de `loadAll()`.
- `security invoker` (respeta la RLS de quien llama), exige sesión, una lista que no se puede leer → `null`.
- Probada antes en transacción con un usuario real del taller (rol `authenticated`): **40 ms**; luego aplicada.
### Navegador (rama `claude/rapidez-huella`, sin publicar)
- `taller-app.js`: sin nada anotado o con la última completa > 5 min → pregunta la huella (~1 KB) y baja solo las listas
  que cambiaron. **Si nada cambió no baja nada ni redibuja.** Ve agregados, cambios y borrados de otros empleados.
- Carga completa como antes: al entrar, si hubo RPC/función que escribe, si la huella falla, y **cada 30 min** de seguridad.
- Guardar sigue igual que la Rapidez 1 (solo la lista guardada).
- Apagar en un equipo: `localStorage.bc_huella_off='1'`. `taller.html` `?v=20261103-hu1`.

## Pruebas
- `scripts/pruebas/huella-listas.cjs` 9/9 (primera completa, nada cambió = 0 descargas y 0 redibujos, agregado de otro,
  borrado de otro, huella falla → completa, 30 min, apagado, guardar sigue parcial).
- guardar-rapido, wa-quien-envio, imprimir-rapido, impresora-estado, prefactura-precio-minimo, crm-editar-mensaje,
  reacond-fase2, diagnosticos-lote: bien.

## Riesgos
- Si nada cambia en 30 min, la pantalla no se redibuja sola (contadores de «días demorado» se actualizan al cambiar algo,
  al navegar o en la completa de 30 min).
