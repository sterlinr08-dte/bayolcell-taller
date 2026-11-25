# 25-Nov-2026 08:43 (RD) — Claude — Publicada la protección «Info Plus sin IMEI» y el diagnóstico (PR #338)

- El dueño respondió «Publícalo».
- Edge `infoplus-imei-almacen` v12 desplegada con el MCP de Supabase, con `verify_jwt` activo. El cambio es el mismo de la rama.
- PR #338 unido con squash a `main` (commit `731f6ef1`). El robot `minificar.yml` rehízo el `.min.js`.
- Comprobado en vivo:
  - `taller.html` sirve `?v=20261125-cimei2`;
  - el `.min.js` trae el motivo «no está mostrando IMEI» y pasa `node --check`.
- **Pendiente:** que alguien toque «Traer del Taller» una vez. Después se lee `infoplus_diagnostico` (`ruta = 'listaserie_almacen'`) para ver si Info Plus manda series con otro nombre de localidad o ya no manda series.
