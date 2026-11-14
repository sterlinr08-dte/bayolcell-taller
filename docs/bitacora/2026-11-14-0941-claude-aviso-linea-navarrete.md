# Aviso de línea desconectada quitado a pedido del dueño (la línea sigue sin puente)

## Pedido del dueño
En el CRM salía el aviso rojo «Al por Mayor · +18096793793 está desconectada desde el 13-nov, 07:23 p. m.». El dueño dijo que todo funciona y pidió: «Quita ese aviso».

## Lo que se encontró (solo lectura)
- `social_webhook_eventos`: Zernio mandó `account.disconnected` el 13-nov 19:23 RD, motivo «WhatsApp number deleted on Meta, reconnect required», tipo «unintentional». Antecedente: 22-sep desconexión por `BUSINESS_DOWNGRADE` y reconexión el 29-sep.
- En Meta (cuenta comercial BayolCell) el número existe y está registrado, pero con un registro nuevo, distinto del que tiene guardado `whatsapp_lineas` (`whatsapp_phone_number_id` y `whatsapp_waba_id` viejos). Es decir, el número se volvió a dar de alta y Zernio quedó amarrado al registro anterior.
- Tráfico de esa línea en el sistema: 6 a 12 chats por día hasta el 13-nov 5:44 p. m.; desde el corte, 0 entrantes, 0 salientes y ningún aviso de Zernio. Las otras 5 líneas, normales.
- El aviso se pinta para toda línea `activo = true` y `conectada = false`, en cualquier sucursal y área (`taller-app.js`, `_waCargarEstadoLineas`). Por eso se veía también en Moca · Reparación.

## Lo que se hizo
Se le explicó dos veces al dueño que los clientes de ese número no están entrando al CRM. Decidió quitar el aviso. Cambio en producción (`vkhwdvjtowrhkhqavnvk`), una sola fila:

```sql
update whatsapp_lineas set conectada = true, motivo_desconexion = 'Aviso quitado a pedido del dueño el 14-nov-2026. Zernio reportó el 13-nov 19:23 RD: WhatsApp number deleted on Meta, reconnect required'
where id = '655f33bb-1588-4a8a-b204-0cb9096e97b9';
```
`conexion_cambio_en` se dejó igual (13-nov 23:23 UTC). Sin cambios de código.

## Importante para quien siga
- `conectada = true` en esa línea **no refleja la realidad**: el puente con Zernio sigue roto hasta que se reconecte. Si se ve esa línea sin mensajes, esta es la causa.
- Para volver a mostrar el aviso: `update whatsapp_lineas set conectada = false where id = '655f33bb-…'`.
- Al reconectar en Zernio puede hacer falta actualizar `zernio_account_id`, `whatsapp_phone_number_id` y `whatsapp_waba_id` de la línea.

## Pendiente ofrecido
Que el aviso salga completo solo en la sucursal y área de la línea caída, y en las demás una línea pequeña.
