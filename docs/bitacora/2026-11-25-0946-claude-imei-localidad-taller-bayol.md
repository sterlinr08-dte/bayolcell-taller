# 25-Nov-2026 09:46 (RD) — Claude — Causa de «0 IMEI»: Info Plus llama al Taller «TALLER BAYOL» (sin publicar)

## Diagnóstico (`infoplus_diagnostico`, 25-nov 09:45, después de que el dueño tocó «Traer del Taller»)
- `listaserie&codalmacen=6`: status 200, **26 series crudas**, todas con `localidad: "TALLER BAYOL"`. Ejemplo: «CELULAR IPHONE 12 NORMAL», 352590370787065.
- La Edge exigía el nombre exacto: `ALMACENES['6'] = ['TALLER']` con `nombres.includes(norm(localidad))`. Por eso descartaba las 26 y entregaba 0.
- **Afectaba también la Prefactura:** la ventana de IMEI («lista prudente») usa el mismo filtro, así que no mostraba IMEI del Taller desde que cambió el nombre.
  - No se sabe desde cuándo; en junio llegaba «TALLER».

## Cambio (`supabase/functions/infoplus-imei-almacen/index.ts`)
- Nueva `enAlmacen(localidad, codalmacen)`: la localidad es del almacén si contiene, como palabras completas, alguno de sus nombres.
- Se usa en `almacen_todo`, en la ventana de la Prefactura y en el aviso de localidades desconocidas.
- Comprobado con node:
  - «TALLER BAYOL» → 6 sí;
  - «OFICINA SANTIAGO BAYOL» → 1 sí;
  - «MOCA BAYOL» → 4 sí;
  - «TALLER BAYOL» → 1 no;
  - «TALLERES X» → 6 no.
- Pasa el chequeo de esbuild.
- La página no cambia. Sigue la protección de PR #338: si Info Plus devuelve 0 en todos los almacenes, no se mueve nada.

## Estado
- Rama `claude/imei-localidad`. Al publicar: desplegar la Edge (v13), tocar otra vez «Traer del Taller» (deberían salir los IMEI) y repetir la prueba de Muse con un IMEI real de esa lista.
