# 25-Nov-2026 07:44 (RD) — Claude — Publicado: ajuste con IMEI (A y B), PR #334

- El dueño respondió «Publícalo».
- PR #334 unido con squash a `main` (commit `d1f67da7`).
- El robot `minificar.yml` rehízo `taller-app.min.js`.
- Comprobado en vivo:
  - `bayolcell.com/taller.html` sirve `?v=20261125-imei1`;
  - el `.min.js` contiene `_ipDondeEstanImei` y pasa `node --check`.
- No se escribió nada en Info Plus.
- **Pendiente:** la primera entrada real con IMEI la hace el dueño (A o B). El sistema confirma en Info Plus si el IMEI quedó en el almacén.
