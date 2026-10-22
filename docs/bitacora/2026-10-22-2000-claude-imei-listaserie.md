# 2026-10-22 20:00 · Claude · IMEI por almacén: `tipo=listaserie` (respuesta de Dagoberto)

**Respuesta de Dagoberto** (vía el dueño): «Buen día. Ponle tipo=listaserie». Contesta la pregunta de la bitácora 2026-10-20-2040.

## Cambio
- `supabase/functions/infoplus-imei-almacen/index.ts`: se agregan primero estas candidatas:
  - `ListaArticulos?tipo=listaserie&CodArticulo&Codalmacen`;
  - la misma en minúsculas;
  - `tipo=listaserie` sin filtros.
  Las rutas viejas quedan de respaldo.
- La regla de seguridad no cambia. Un IMEI se muestra solo si el registro dice **explícitamente** el artículo y el almacén. Si no los dice, la lista sale vacía y la respuesta queda en `infoplus_diagnostico` (con la clave tapada) para ajustar.
- **Edge desplegada v2** (`verify_jwt` activo), proyecto `vkhwdvjtowrhkhqavnvk`. Solo hace GET a Info Plus.
- Claude **no** la llamó por su cuenta: ver MEMORIA §7. La prueba se hace desde la pantalla real.

## Prueba pendiente (dueño o empleada)
- Prefacturar en el almacén 1 un artículo con IMEI (por ejemplo 2517) y abrir la ventana IMEI.
- Después Claude lee `infoplus_diagnostico`:
  - si aparece `FUENTE_OK`, la lista ya se llena sola;
  - si no, se ve en `muestra` cómo responde `listaserie` y se ajustan los nombres de los campos.
- Rama `claude/imei-listaserie`; no está en `main`.
