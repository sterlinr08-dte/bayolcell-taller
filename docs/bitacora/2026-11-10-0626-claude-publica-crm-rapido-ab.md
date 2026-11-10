# Publicación · CRM de WhatsApp, paquetes A y B (errores y mejoras seguras)

- El dueño eligió los tres paquetes de la auditoría (A, B y C) y autorizó A + B con «Publícalo ahora».
- PR #281, unido a `main` como `c8632fd`.
- Verificado en vivo: `taller.html` carga `taller-app.min.js?v=20261110-ab1`, y `crm-whatsapp-pagination.js` ya trae el arreglo de la auto-carga (`isConnected`).
- Revisión propia antes de publicar: corrí `scripts/pruebas/crm-rapido.cjs` (139 aprobadas, 0 fallidas) y leí el código del tiempo límite y del reintento de envío.
- Detalle en `2026-11-10-0604-claude-crm-rapido-ab.md`; auditoría en la rama `claude/crm-auditoria`.
- Avisado al dueño:
  - en PC, al cambiar de chat los mensajes tardan algo más (1.9 → 2.4 s en el banco) por el pintado «Cargando…», hasta que llegue el paquete C;
  - si el servidor tarda más de 25 s y al final sí envía, un «Reintentar» en ese momento podría duplicar el mensaje (se comprueba antes, pero no es imposible).
- No probado: iPhone real, envío real por WhatsApp, adjuntos, notas de voz ni plantillas.
- Apagar: `localStorage.bc_crm_rapido_off='1'` y recargar.
- Pendiente: paquete C (recálculo de estilos), en la rama `claude/crm-rapido-c`.
