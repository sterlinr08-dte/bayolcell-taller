# 21-oct-2026 11:00 · Claude · Prefactura: la pantalla se limpia sola al guardar

## Pedido del dueño
Después de guardar la prefactura Nº 118816, la pantalla seguía igual y eso confunde. El dueño escogió la opción **«Limpiar sola»**.

## Qué hace ahora
- Al guardar con F9, «Guardar» o «Guardar e imprimir» una prefactura **solo de artículos**, cuando Info Plus responde bien:
  - la pantalla queda vacía: sin artículos, «Facturar a» en CONTADO: 1 y Nº «Nueva»;
  - **se conservan el almacén y el vendedor**;
  - sale el aviso «✅ Prefactura Nº X creada en Info Plus. Lista para la siguiente.» («actualizada» si se editó una prefactura desde la lupa).
- «Guardar e imprimir» espera 0.6 s antes de limpiar, para que salga la impresión. La impresión usa `_rpUltima`, que no se borra.
- **Con equipo** no cambia nada: `guardarRecepcion` ya limpia y lleva a Órdenes.
- **Si Info Plus da error**, no se limpia: el trabajo queda en pantalla.
- La guardada se vuelve a ver con la lupa (historial de prefacturas).

## Archivos
- `taller-prefactura.js`:
  - `limpiarTrasGuardar()` nueva;
  - envoltura de `_rpGuardar` dentro de `enganchar()`.
- `taller.html`: `taller-prefactura.js?v=20261021-p1`.

## Pruebas (banco local con Info Plus simulado)
- 12 PASS / 0 FAIL a 1280 y 390 px:
  - queda limpia;
  - el almacén se conserva;
  - sale el aviso;
  - sigue en Prefactura sin crear orden;
  - con equipo pasa a `guardarRecepcion`;
  - sin errores.
- No se tocó Info Plus real.

## Estado
- Rama `claude/prefactura-limpia`, **sin publicar**. Falta el «publícalo» del dueño.

## También en esta hora
Se le preparó al dueño el mensaje para Dagoberto, que él envía. Junta las dos preguntas pendientes:
- series (IMEI) por almacén (ver 2026-10-20-2040);
- campos de Comentarios, atención, cédula, teléfono y fecha de entrega en `PreFacturaModel` (ver 2026-10-19-2200).
