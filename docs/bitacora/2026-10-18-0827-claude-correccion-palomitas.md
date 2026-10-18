# Corrección de palomitas históricas de WhatsApp (4,416 mensajes) — Claude

Continúa `*-claude-whatsapp-fase1.md` y `*-claude-whatsapp-fase3-publicada.md`.

- **Autorización:** el dueño dijo «Corrígela» después de que se le explicara qué eran las «4,417 palomitas».
- **Fuente de verdad:** los avisos reales `message.delivered` / `message.read` de Zernio, guardados crudos en `social_webhook_eventos` desde el 13-sep-2026.
  - Por mensaje (`platformMessageId`) se tomó el mejor estado: leído gana sobre entregado.
- **Alcance:**
  - solo mensajes salientes (`direccion='out'`) que seguían en `estado='enviado'` y tienen un aviso real;
  - solo sube la palomita, nunca la baja;
  - no se tocan textos, archivos ni clientes, y no se envía nada a nadie.
- **Resultado:** 4,416 corregidos (uno ya se había corregido solo con la fase 1): **1,476 → leído** y **2,940 → entregado**.
- **Campañas:** se comprobó antes que ninguno es de campaña (0 en `whatsapp_envio_destinatarios`). El trigger `trg_wa_mensaje_sync_estado_campana` no cambió ningún reporte.
- **Respaldo:** la tabla `public.respaldo_wa_palomitas_20261018` (id, estado_antes, estado_nuevo, respaldado_en) tiene RLS activo y está cerrada para `anon` y `authenticated`.
  - **Para revertir:** `update whatsapp_mensajes m set estado = r.estado_antes from respaldo_wa_palomitas_20261018 r where m.id = r.id;`
- **Verificado:** 4,416 respaldados = 4,416 con su estado nuevo.
