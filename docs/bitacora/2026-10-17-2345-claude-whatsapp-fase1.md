# WhatsApp del CRM igual que el original — fase 1 (rama `claude/wa-fase1`, sin publicar) — Claude

## Pedido del dueño
- Mandó una captura de un chat del CRM y pidió «Vamos a arreglar el WhatsApp del CRM para que funcione al 100 % como el original».
- En la captura se ven tres fallas:
  - una burbuja «[reaction]»;
  - el contacto «👤 Michel Reparación» sin número;
  - todo con una sola palomita.

## Diagnóstico (fuente de verdad: `whatsapp_mensajes`, `social_webhook_eventos` con el payload crudo de Zernio, logs de `whatsapp-webhook`)
1. **Palomitas.**
   - **Causa:** cuando se escribe desde el CELULAR, Zernio manda el `message.delivered`/`read` antes del espejo `message.sent`. El webhook no encontraba el mensaje y botaba el estado: **235 «no se encontro mensaje» en 24 h**.
   - **Efecto:** de los salientes del último mes, 11,113 se quedaron en «enviado». Los que salen del CRM casi no tienen el problema.
   - Además, un «entregado» tardío podía pisar un «leído».
2. **Contacto compartido.** Zernio sí manda `metadata.contacts` (nombre, teléfono, wa_id y vCard), pero el webhook guardaba solo el texto «👤 Nombre».
3. **Ubicación.** Zernio sí manda `metadata.location` (latitud y longitud), pero se guardaba «📍 Location».
4. **Reacción.**
   - Zernio manda solo el texto `[reaction]`, sin el emoji ni el mensaje al que reacciona (revisado en el payload crudo). No se puede reproducir como en WhatsApp.
   - Hay 185 en el último mes, todas salientes desde el celular.
5. **No se usaban:**
   - `metadata.forwarded`: 116 en 3 días;
   - `metadata.referral` (el anuncio del que vino el cliente): 423 en 3 días.
6. **Hallazgo extra:** la ubicación y el contacto enviados DESDE el CRM mostraban también el JSON crudo debajo de la tarjeta.

## Cambios
- **Migración** `supabase/migrations/20261018150000_wa_estados_pendientes_y_meta.sql` (**sin aplicar**; no tiene drop ni delete fuera de la reversa comentada):
  - columna `whatsapp_mensajes.meta jsonb`;
  - tabla `whatsapp_estados_pendientes`, con RLS y sin políticas;
  - `wa_rango_estado()`;
  - `wa_aplicar_estado(wamid, estado, error)`: nunca baja la palomita y, si el mensaje no existe, deja el estado pendiente. Solo la puede ejecutar `service_role`;
  - trigger BEFORE INSERT `trg_wa_aplicar_estado_pendiente`, que aplica el pendiente al entrar el mensaje. Usa un candado `pg_advisory_xact_lock` por wamid para que el estado y el mensaje no se crucen.
- **`whatsapp-webhook`** (**sin desplegar**):
  - los estados usan `wa_aplicar_estado`;
  - el contacto se guarda como `tipo_contenido='contacto'`, con cuerpo JSON `{nombre, telefono, wa_id, mas}`;
  - la ubicación se guarda como `'ubicacion'`, con `{lat, lng, nombre, direccion}`. Es el mismo formato que ya usa `whatsapp-enviar`;
  - la vista previa del hilo y el lead usan «👤 Nombre» o «📍 Ubicación»;
  - `meta` guarda `{reenviado, anuncio:{titulo, texto, imagen, url, tipo}}`;
  - las reacciones `[reaction]` no se guardan.
- **`taller-app.js`**:
  - tarjeta de ubicación con nombre, dirección y mapa;
  - tarjeta de contacto con el número para tocar y llamar (`tel:`) y «y N contactos más»;
  - «↪ Reenviado» y la tarjeta «📣 Vino de un anuncio»;
  - las burbujas viejas «[reaction]» no se dibujan;
  - la ubicación y el contacto ya no muestran el JSON crudo.
  - Cache-bust: `taller-app.js?v=20261018-wa1`.

## Pruebas
- **Migración en producción dentro de un DO que termina en RAISE**, así que todo se deshizo; se verificó después que no quedó la tabla, la columna, las funciones ni las filas de prueba. Resultados:
  - estado antes del mensaje: entregado → leído → entregado quedan pendientes, y al insertar el mensaje queda **leído**, con el pendiente marcado como aplicado;
  - nunca retrocede: leído y después entregado dan `sin_cambio` y queda leído;
  - fallido y después entregado: queda entregado;
  - en un entrante el estado no cambia;
  - `meta` se guarda bien.
- **Pantalla (Node, funciones reales con stubs):** la reacción se oculta; el contacto sale con `tel:+18097072493` y sin JSON; la ubicación sale con nombre y enlace de mapa; aparecen «Reenviado» y el anuncio; un nombre con `<img onerror>` o `<script>` queda escapado.
- TypeScript del webhook: transpila sin errores. `node --check taller-app.js`: OK.

## Para publicar (con el «publícalo» del dueño)
1. Aplicar la migración por la API.
2. Desplegar `whatsapp-webhook`.
3. Llevar la rama a `main`.
4. Verificar en los logs que bajan los «no se encontro mensaje».

## Pendiente con autorización aparte
- **4,417 mensajes viejos** que quedaron en «enviado» tienen su «entregado» o «leído» real guardado en `social_webhook_eventos` (desde el 13-sep): 1,476 pasarían a leído. Es una reparación de datos históricos, así que necesita OK del dueño.

## Fases siguientes (propuesta)
- Mostrar la reacción con su emoji cuando la manda el cliente, si Zernio llega a mandarla.
- Foto de perfil, «escribiendo…», borrar o editar mensajes.
- Revisar si el mismo evento llega dos veces (`whatsapp-webhook` y `social-webhook` reciben la misma cantidad).
