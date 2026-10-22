# 22-oct-2026 13:35 · Cliente referido: ver la conversación anterior

## Pedido del dueño
«Se puede transferir con todo y chat para que el empleado sepa el contexto y no empezar desde nuevo.»
También respondió «A» a etiquetar a ToNnY: se le puso «Transferido».

## Diagnóstico
- Al referir, el chat de destino solo mostraba un aviso (quién lo pasó y la nota).
- Los empleados con «solo su sucursal» no pueden leer los mensajes de la otra línea por la RLS de `whatsapp_mensajes`.
- WhatsApp no deja copiar mensajes viejos a otro número: el contexto se muestra dentro del CRM, no se reenvía al cliente.

## Cambio
- Base de datos (ya aplicado): RPC `whatsapp_referido_historial(p_hilo)` → `supabase/migrations/20261022133000_referido_historial.sql`.
  - Solo quien puede ver el chat de destino. Devuelve los últimos 200 mensajes del chat de origen, la línea, quién lo pasó y la nota.
  - La primera versión dejaba pasar a una empleada de Navarrete por una comparación con NULL. Se corrigió con `coalesce(..., false)`.
- Pantalla (rama `claude/referido-historial`, **sin publicar**):
  - `crm-wa-identico.js` (w17): botón «Ver conversación anterior» en el aviso del chat referido; abre una hoja de solo lectura con burbujas, fechas, la nota del referido al final y «Solo lectura».
  - Fotos, audios y documentos salen como «📷 Foto», «🎤 Nota de voz», etc. (sin abrir el archivo).
  - `crm-wa-identico.css`: estilos; el botón «Escribirle desde mi WhatsApp» sube de 36 a 44 px.
  - `crm-marketing-consent.js` (w17) y `taller.html` (u7): versiones de caché.

## Pruebas
- Permisos (simulando la sesión, sin cambiar datos):
  - Michelle y Josiel (Santiago, destino): ven 12 mensajes.
  - Yosmeiry y Alejandro (Navarrete) y Kenifer (Moca): `sin_permiso`.
  - Sin sesión válida: `sin_sesion`.
- Playwright con datos de prueba, 390 y 1280 px: botones 44 px de alto, X de cerrar 44×44, sin scroll lateral, se cierra con Esc, sin errores.

## Pendiente
- Publicar la pantalla cuando el dueño diga «publícalo».
