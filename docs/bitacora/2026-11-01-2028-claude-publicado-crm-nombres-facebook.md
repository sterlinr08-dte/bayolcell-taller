# Publicado — CRM Facebook: nombres huecos como «Cliente de Facebook · …1234» (2-nov-2026)

- El dueño autorizó con «Publícalo».
- PR #191 con squash; commit `ac233ba` en `main`.
- Verificado en vivo: `crm-marketing-consent.js` ya carga con `V='20261102-u3'`, y `crm-social-scope-fix.js` y `crm-facebook-chat.js` servidos con esa versión contienen `bcFbNombreHilo`.
- Detalle en `…-claude-crm-facebook-nombres-huecos.md`.
- Pendiente del dueño: decir si corro una vez `social-importar-historial` para Facebook (llena los 11 hilos sin nombre si Zernio lo tiene; no duplica) y si quiere la opción A (resincronización automática + botón Importar).
