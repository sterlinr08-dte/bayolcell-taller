# WhatsApp fase 1 publicada — Claude

Continúa `*-claude-whatsapp-fase1.md`.

- **Autorización:** el dueño dijo «Publícalo y continúa con la siguiente fase e instala las recomendaciones».
- **Base de datos:** se aplicó por la API la migración `wa_estados_pendientes_y_meta` (igual al archivo `20261018150000_…`, sin la reversa comentada).
- **Edge Function `whatsapp-webhook` v35:**
  - antes se comprobó que la v34 desplegada era igual al repo sin comentarios;
  - se desplegó la versión del repo sin comentarios (TypeScript printer, mismo código), con `verify_jwt=false` como antes y el mismo `deno.json`.
- **Pantalla:** rama `claude/wa-fase1` llevada a `main` por avance rápido (`taller-app.js?v=20261018-wa1`).
- **No se tocó** el historial: los 4,417 mensajes viejos en «enviado» que se podrían reparar esperan un OK aparte del dueño.
- **Verificación:** ver la entrada siguiente o el resumen al dueño (logs del webhook y sha de producción).
