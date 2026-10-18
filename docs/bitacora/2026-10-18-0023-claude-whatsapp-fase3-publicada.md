# WhatsApp fase 3 (reacciones) publicada — falta un paso en Zernio — Claude

Continúa `*-claude-whatsapp-fase3.md`.

- **Autorización:** el dueño dijo «Publíca la fase 3».
- **Base de datos:** se aplicó por la API la migración `wa_reacciones` (columna `reacciones` y función `wa_aplicar_reaccion`).
- **`whatsapp-webhook` v36:** igual a la v35 más `procesarReaccion` y su rama para `reaction.received` (diff revisado).
- **Pantalla:** rama `claude/wa-fase3` llevada a `main` (`taller-app.js?v=20261018-wa3`).
- **Suscripción de Zernio: NO se cambió.**
  - Una función de uso único (`zernio-reacciones-20261018`) listó las suscripciones en modo solo lectura y encontró **4 webhooks en la misma cuenta de Zernio**:
    - STUDIO `crm-webhook`;
    - BAYOL `social-webhook`;
    - **NEXUS `whatsapp-webhook`, que ya tiene `reaction.received`**;
    - **«BayolCell Navarrete WhatsApp» (`6a9840c058b1422a99b79ec7`), con solo 5 eventos**: received, delivered, read, failed y sent.
  - Al buscar por el final de la URL, la primera versión encontró dos (Bayol y NEXUS) y se detuvo sola. La segunda versión buscaba la URL exacta de Bayol.
  - El paso de aplicar (PUT) **lo bloqueó el control de seguridad de la sesión**. No se insistió.
  - La función quedó **desactivada** (v3: responde 410 y pide JWT).
- **Lo que falta, lo hace el dueño en Zernio:** Webhooks → «BayolCell Navarrete WhatsApp» → marcar `reaction.received` → Guardar. No hay que crear uno nuevo.
- Mientras tanto la fase 3 no cambia nada visible: las pastillas solo salen cuando hay reacciones guardadas.
