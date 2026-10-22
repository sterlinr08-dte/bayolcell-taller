# 22-oct-2026 13:10 · Etiqueta automática «Transferido»

## Pedido del dueño
«Hacer una etiqueta automática de cuando se traspasa un cliente a otra sucursal para poder identificar». Eligió **A**: una sola etiqueta «Transferido».

## Cambio (ya aplicado en Supabase Bayol)
- Etiqueta nueva en `whatsapp_etiquetas`: «Transferido», color ámbar `#f59e0b`, orden 8.
- Disparador `whatsapp_referidos_etiquetar` (AFTER INSERT en `whatsapp_referidos`) con la función `whatsapp_referido_etiquetar()`:
  agrega la etiqueta al chat de destino (`hilo_destino`) si no la tiene.
- Archivo: `supabase/migrations/20261022130500_etiqueta_transferido.sql`.
- No cambia el CRM ni la RPC `whatsapp_referir_a_linea`. La etiqueta se puede quitar a mano como cualquier otra.

## Pruebas
- Prueba deshecha al final (excepción a propósito): dos referidos seguidos al mismo chat dejaron la etiqueta **una sola vez** (antes `[]`, después `["0d357300-…"]`).

## Pendiente
- El único referido viejo (ToNnY, Moca → Servicio al Cliente Santiago) **no** se etiquetó: falta que el dueño diga si lo quiere.
