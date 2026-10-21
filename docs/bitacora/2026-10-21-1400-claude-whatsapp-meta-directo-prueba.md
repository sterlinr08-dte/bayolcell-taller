# 21-oct-2026 14:00 · Claude · WhatsApp en el CRM sin Zernio: piezas para la prueba con el número gratis de Meta

## Pedido del dueño
«Vamos con lo del WhatsApp para ver si funciona en el CRM sin Zernio».

Plan acordado antes (MEMORIA):
- probar la Cloud API directa con el **número de prueba gratis** de una app de desarrollador en el portafolio Studiord;
- no mover números reales;
- Zernio se queda hasta que todo esté probado.

## Lo preparado (rama `claude/prefactura-limpia`, nada desplegado ni publicado)
1. **`supabase/functions/whatsapp-meta-webhook`** (`verify_jwt` false):
   - GET: verificación de Meta con `WA_VERIFY_TOKEN`;
   - POST: valida la firma `X-Hub-Signature-256` con `WA_APP_SECRET` y guarda los mensajes entrantes en `whatsapp_hilos` y `whatsapp_mensajes`, igual que el webhook de Zernio;
   - los estados (entregado, leído, fallido) se aplican con `wa_aplicar_estado`;
   - solo atiende líneas con `whatsapp_phone_number_id` y **sin** `zernio_account_id`;
   - no dispara la IA.
2. **`supabase/functions/whatsapp-meta-enviar`** (`verify_jwt` true):
   - mismo contrato y mismos permisos que `whatsapp-enviar`: sesión, `auth_actor_bindings` y sucursal de la línea;
   - envía texto dentro de las 24 h, o una plantilla, por `graph.facebook.com/v23.0/{phone_number_id}/messages` con `WA_CLOUD_TOKEN`;
   - fotos, audio, ubicación y contacto todavía no.
3. **`bc-wa-meta.js`** (`taller.html`, `?v=20261021-m1`):
   - si el chat es de una línea de Meta, la llamada a `whatsapp-enviar` va a `whatsapp-meta-enviar`;
   - sin líneas de Meta no hace nada;
   - se apaga con `localStorage.bc_wa_meta_off = '1'`.
   - Prueba en el banco: 6 PASS (con línea de Meta, sin líneas de Meta y chat de otra línea).

## Falta, del lado del dueño
1. Crear la app de desarrollador (tipo Empresa, portafolio Studiord), agregar el producto WhatsApp y verificar su número personal como destinatario de prueba.
2. Pasar el **Phone number ID** y el **WABA ID**. No son secretos.
3. Poner los secretos en Supabase → Edge Functions → Secrets: `WA_CLOUD_TOKEN`, `WA_APP_SECRET` y `WA_VERIFY_TOKEN`.

## Después (Claude)
- Desplegar las 2 funciones.
- Crear la línea «Prueba Meta» en `whatsapp_lineas`, con el phone_number_id y sin Zernio.
- Dar la URL del webhook para pegarla en Meta y suscribir `messages`.
- Probar: el dueño escribe al número de prueba → aparece en el CRM → se responde desde el CRM.
