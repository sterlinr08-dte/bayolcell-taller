# 2026-11-27 09:20 RD · Claude — Flow de financiamiento v2 en BORRADOR (correcciones 1 y 2)

Sigue a `2026-11-27-0900-claude-auditoria-flow-financiamiento.md`. El dueño pidió **«1 y 2»**.

## Correcciones (sobre el JSON publicado de 1193474773538114)
1. **SOLICITUD** ya no tiene `terminal` ni `success`. Solo RESUMEN es pantalla final.
2. **Logo:** `aspect-ratio` pasa de 2.797 a **1** (cuadrado) y `scale-type` de `cover` a **`contain`**. Ahora se ve el lienzo cuadrado negro de 1200×1200 completo, sin recortar.
- Lo demás queda **igual**: textos, campos, validación de cédula, payload de 8 claves y versión 7.2.

## Qué se hizo en Zernio / Meta
- Se creó el **borrador `1860287288307442`** «Solicitud de financiamiento - Bayol Cell v2». Es la versión 2 del mismo linaje (`lineageId` 1193474773538114) en la cuenta Servicio al Cliente `6a988b2977555aae01c7947c`.
  - El primer intento con el mismo nombre lo rechazó Meta: «El nombre del Flow debe ser único». No se creó nada en ese intento.
- Se subió el JSON corregido: `validation_errors: []`.
- **No se publicó.** El formulario 1193474773538114 sigue igual y publicado.
- La función temporal `flow-leer-20261127` quedó retirada (v4, 410).

## Pendiente
- El dueño ve la vista previa de Meta y dice «Publícalo» / «Todavía no».
- **Al publicar cambia el número de formulario** (de 1193474773538114 a 1860287288307442). Hay que cambiarlo donde se envía el formulario: el Flow no está en `whatsapp_flows` del taller, así que se manda desde Zernio. **No verificado** desde dónde exactamente.
- Publicar en Meta no tiene vuelta atrás.
