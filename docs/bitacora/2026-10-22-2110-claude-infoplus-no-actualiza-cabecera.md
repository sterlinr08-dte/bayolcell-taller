# 22-oct-2026 21:10 · Claude · Info Plus no actualiza la cabecera de una prefactura existente (comentario ni descuento)

**Prueba del dueño (118932):** cambió el comentario a «prueba 3» y el % de la línea a 5. En Info Plus siguió
«Prueba 2», 10.0000 % y total 11,691. Confirmado: con `codprefactura` existente, el `POST /api/prefactura` acepta la
llamada (200, «Se ha creado correctamente») pero **no cambia la cabecera** (`comentario`, `descuento`, `descuentototal`).
Falta comprobar si al menos cambia las líneas (artículos, cantidades, precios).

## Pendiente
- Pedir a Dagoberto que la actualización tome la cabecera.
- Propuesto al dueño: aviso en el taller al modificar comentario/descuento de una prefactura ya enviada → anular y crear nueva.
- Borrar en Info Plus la 118932.
