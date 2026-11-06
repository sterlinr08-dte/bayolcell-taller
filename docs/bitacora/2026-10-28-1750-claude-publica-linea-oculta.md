# 2026-10-28 17:50 — Claude — Publicación: línea del asistente oculta en el CRM

- Dueño: «Publícalo» (para esta entrega).
- PR #142 unido a `main` (squash `d15daa0`), con unit, chromium y webkit en verde.
- Verificado en vivo: `bayolcell.com/taller.html` carga `taller-app.min.js?v=20261028-o1`, y ese archivo filtra `oculta_crm`.
- La base ya tenía la columna desde antes (migración `20261028170000`).
- Sigue pendiente:
  - conectar el 829-589-3292 en Zernio (dueño);
  - insertar la línea con `oculta_crm = true`;
  - crear la plantilla `despacho_equipos`;
  - que «Enviar» del despacho mande por esa línea;
  - decidir si la IA ignora esa línea (recomendado: sí).
