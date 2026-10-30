# CRM: «Editar» un mensaje enviado (30-oct-2026, 17:45 RD) — rama, SIN publicar

**Dueño:** probó «Eliminar para todos» → «WhatsApp no permitió…». Preguntó por editar y eligió «Editar el texto».

**Fuente de verdad:** docs de Zernio — borrar: «Facebook, Instagram, WhatsApp: Not supported (returns 400)»; editar: solo Telegram. Es límite de la conexión oficial de WhatsApp; desde un sistema no se puede borrar ni editar para el cliente.

**Qué hace (capa `crm-wa-identico.js` w20, sin tocar base ni Edge):**
- En el menú del mensaje, «Corregir» pasa a **«Editar»** (solo mensajes de texto nuestros).
- Abre la caja con **el texto original** y la barra «✏️ Editando su mensaje» (cita el original).
- Al enviar sale `✏️ *Editado:* <texto nuevo>` citando el mensaje viejo. Si no se cambió nada, no envía («No cambió nada del mensaje»).
- En el CRM el mensaje viejo queda atenuado con «Editado» junto a la hora (también los «*Corrección:*» viejos).
- `crm-marketing-consent.js` carga w20; `taller.html` sube a `crm-marketing-consent.js?v=20261030-u27` para que los navegadores lo bajen.

**Pruebas:** `scripts/pruebas/crm-editar-mensaje.cjs` 13/13 a 390 y 1280 (botón 44 px, oculto en mensajes del cliente, texto original en la caja, prefijo y cita correctos, un solo envío, marca en el viejo, sin errores).

**No cambia:** «Eliminar para todos» sigue igual (dará el aviso de WhatsApp). Pendiente que el dueño decida A/B/C sobre ese botón.
