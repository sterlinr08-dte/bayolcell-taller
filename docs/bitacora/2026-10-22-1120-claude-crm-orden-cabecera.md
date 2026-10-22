# 2026-10-22 11:20 · Claude · CRM: etiqueta y lupa después de «Consulta»

- **Dueño** (captura del chat de Brigida Mira, 11:10): «el botón de etiqueta del cliente y la lupa, moverlos después del botón de search» (el botón azul «🔍 Consulta»).
- **Antes:** Consulta · Asignarme · Reasignar · Transferir · 🏷 · 🔍 · ⋮ …
- **Ahora:** Consulta · 🏷 · 🔍 · Asignarme · Reasignar · Transferir · ⋮ …
- **Cambio:** `crm-wa-identico.js`, nueva `ordenCabecera()` llamada en `aplicar()`. Solo mueve los botones si están desordenados (sin bucles con el observador) y se usan los mismos botones, así que no cambian sus funciones.
- **Versiones:**
  - `crm-wa-identico.js?v=20261022-w16`, en `crm-marketing-consent.js`;
  - `crm-marketing-consent.js?v=20261022-u6`, en `taller.html`.
- **Prueba:** cabecera de prueba en Chromium, que parte del orden de hoy → `Nombre, Consulta, tag, lupa, Asig, ⋮, foco` ✅. Llamarla dos veces no cambia nada.
- En celular (<1025 px), Asignarme/Reasignar/Transferir siguen en su fila de abajo, como antes. Solo cambia el orden de la etiqueta y la lupa respecto a Consulta.
- Rama `claude/crm-orden-botones`. No está publicada.
