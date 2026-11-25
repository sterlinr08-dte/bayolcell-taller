# 25-Nov-2026 08:40 (RD) — Claude — Prueba de Muse: Info Plus devuelve 0 IMEI → protección y diagnóstico (sin publicar)

## Qué informó Muse (prueba de PR #334)
- Pasos 1, 2 y 4 bien: caja de IMEI, «No parece IMEI» y «no está en Oficina Santiago».
- Pasos 3, 5 y 6 no concluyentes:
  - «Traer del Taller» dice «Info Plus tiene 0 IMEI allí»;
  - los IMEI de lotes reales (358425450399800 y 353096101779909) no aparecen en ningún almacén;
  - el IMEI de la caja era el ejemplo en gris (351829689413208), no uno real.
- No se movió ni se registró nada. Muse lo verificó: el artículo 2639 sigue con existencia 1 en el Taller.

## Riesgo encontrado
- `_ipDondeEstanImei` no distinguía «el IMEI no está» de «Info Plus no devuelve ningún IMEI».
- Con 0 IMEI en todos los almacenes, la revisión de duplicados dejaba pasar cualquier entrada.
- En junio, `listaserie&codalmacen=6` devolvía 72 series del Taller; hoy la Edge entrega 0.
- No se sabe la causa: puede que Info Plus ya no mande series, que cambiaron los nombres de las localidades (el filtro las descarta), u otra.
  - Info Plus no deja registro de lo que devolvió, y la clave solo la tiene la Edge.

## Cambio
- **`taller-app.js` · `_ipDondeEstanImei`:** si se consultan todos los almacenes y Info Plus devuelve 0 IMEI en total, queda `ok=false` con `motivo` «Info Plus no está mostrando IMEI en ningún almacén…». Las tres pantallas muestran ese motivo y no mueven nada:
  - Ajuste rápido;
  - Registrar equipo existente;
  - Corregir IMEI o artículo.
- **Edge `infoplus-imei-almacen` · modo `almacen_todo`:**
  - la respuesta suma `series_crudas` (antes del filtro por localidad) y `localidades`;
  - si el almacén sale vacío, anota en `infoplus_diagnostico` (`ruta = 'listaserie_almacen'`) el status, el largo, las series crudas, las localidades y una muestra de la respuesta con la clave tapada; una vez cada 10 min por almacén;
  - sigue siendo solo lectura y pasa el chequeo de esbuild.
- Versión `taller-app.min.js?v=20261125-cimei2`.

## Pruebas (local, Info Plus simulado)
- V1: Info Plus vacío, entrada en Ajuste rápido → bloqueada con el motivo, 0 ajustes.
- V2: Info Plus vacío, Registrar equipo existente con la casilla → bloqueado («No se guardó nada»), 0 ajustes.
- V3: con datos, entrada de IMEI nuevo → se hace igual que antes.
- V4: con datos, duplicado → bloqueado igual que antes.
- Sin errores de consola.

## Siguiente paso
- Publicar.
- Que alguien toque «Traer del Taller» una vez y leer `infoplus_diagnostico` para ver qué devuelve Info Plus.
- Con eso: si es un tema de nombres, se arregla el filtro; si Info Plus ya no manda series, se le pregunta a Dagoberto.

## Estado
- Rama `claude/imei-vacio`. Espera el «Publícalo». Hay que redesplegar la Edge.
