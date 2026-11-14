# Aviso de línea desconectada: corrección publicada y aviso reactivado

Sigue a `…-claude-aviso-linea-solo-suya.md` y `…-claude-aviso-linea-navarrete.md`.

## Autorización
A las dos preguntas (publicar la corrección; volver a activar el aviso de la línea de Navarrete) el dueño respondió «Si».

## Qué se hizo
1. **Publicado:** PR #324 unido a `main` (squash `87122f95b5dfb62872d8e5163fde2de8fcb5f293`). Verificado en vivo: `taller.html` carga `taller-app.min.js?v=20261114-av1` y el archivo trae el filtro por `_crmLineaActualId` (fuente sha1 `78ac3a549720`).
2. **Aviso reactivado** en producción, una fila, después de que la corrección estuvo en vivo:
```sql
update whatsapp_lineas set conectada = false, motivo_desconexion = 'WhatsApp number deleted on Meta, reconnect required'
where id = '655f33bb-1588-4a8a-b204-0cb9096e97b9';
```
Con esto `whatsapp_lineas` vuelve a decir la verdad sobre la línea +18096793793, y el aviso lo ve solo quien abre esa línea.

## Pruebas antes de publicar
`wa-aviso-linea.cjs` Todo OK · `wa-quien-envio.cjs` Todo OK · `crm-rapido.cjs` 139 aprobadas, 0 fallidas.

## Pendiente
- El dueño debe abrir WhatsApp Business en el teléfono de esa línea y reconectarla en Zernio (cuenta comercial BayolCell, número 809 679 3793). Al reconectar puede hacer falta actualizar `whatsapp_phone_number_id` y `whatsapp_waba_id` de la línea.
- Abrir WhatsApp Business en cada teléfono de línea al menos una vez por semana (regla de 14 días de Meta).
