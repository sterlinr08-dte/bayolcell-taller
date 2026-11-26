# Kárdex y venta deducida publicados (26-nov-2026)

- El dueño dijo «Publícalo».
- Edge `infoplus-kardex` v1 desplegada (solo lectura).
- Migración `20261126090000_historial_imei_venta` aplicada.
  - Probada en vivo con una sesión de administrador: el IMEI 357676150562102 termina en «Venta (deducida) · Factura CO00098453 · Oficina Santiago».
- PR #351 fusionado (`24a9d8b`).
  - En vivo: `?v=20261126-kdx1`, y el `.min.js` contiene `infoplus-kardex`.
- MEMORIA actualizada.
- Pendiente: que el dueño abra el kárdex en vivo. Todavía no se llamó a la Edge con una sesión real; solo se probó con datos simulados y con la consulta directa.
