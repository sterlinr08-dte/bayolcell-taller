# Punto de equilibrio: periodos de meta como datos (C6 de untangle) y error del día 16 (08-nov-2026, 12:00 RD)

## Cambio (`conta-equilibrio.js` pe23)
- `periodosMeta` arma cada periodo como dato: `clave` (`hoy`, `semana`, `dia`, `q1`, `q2`, `mes`), `etiqueta` y `detalle`. `nombre` se sigue armando igual («2ª quincena (16 al 30)») para el reporte y el Excel.
- `periodoDe(lista, clave)` reemplaza las 3 búsquedas por días (`d1 === 1 && d2 === 15`, `d1 === 16`) y la lectura de la etiqueta con expresiones sobre el texto.
- «Un día hábil» se crea con su meta, en vez de crearse y luego sobrescribirse.

## Error real que apareció en la comparación (y que esto corrige)
- **Antes, cada día 16 del mes,** la búsqueda `d1 === 16` encontraba primero la tarjeta «Hoy» (16 al 16) en lugar de la 2ª quincena (16 al 30).
- Efecto en pantalla el 16:
  - la tarjeta de quincena repetía «Hoy» con la meta de un solo día (por ejemplo RD$ 63 mil en vez de RD$ 848 mil en la General);
  - las metas de los vendedores de la 2ª quincena salían como «16 al 16 · quedan 1 día» (RD$ 36 mil en vez de RD$ 468 mil en Santiago, con los datos de prueba).
- Ahora el día 16 muestra «2ª quincena · 16 al 30 · quedan 13 días».

## Pruebas
- Comparación completa pe22 → pe23 (7 fechas × 3 meses × 6 pestañas + `calcular()`): 273 comparaciones. **Solo cambia el 16 de noviembre**, en las tarjetas de quincena y en vendedores (11 casos, todos el error de arriba). El resto es idéntico. Sin errores de JavaScript.

## Estado
- Rama `claude/equilibrio-periodos`. No publicado: espera el botón «Publícalo». Conviene publicarlo antes del 16-nov.
