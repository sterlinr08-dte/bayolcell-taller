# 2026-11-25 21:20 RD · Claude — Formas de pago de la factura en Info Plus (visto por Muse)

- **Fuente:** el dueño pasó lo que Muse revisó en Info Plus (pantalla Factura → pestaña «Forma de Pago») de la factura CO00100055, Oficina Santiago:
  - Efectivo RD$ 12,050.00;
  - «Contado» marcado.
- **Formas de pago que muestra Info Plus:** Efectivo, Cheque, Tarjeta Crédito, Nota Crédito, Transferencia e **INTERCAMBIO DE EQUIPO**.
- **Campos de cada forma:**
  - Cheque: cuenta, número y banco;
  - Tarjeta: autorización, número y banco;
  - Transferencia: «Depositar en Cuenta Banco».
- **La factura de contado sale en Caja:** Reportes → Caja → Arqueo del día, lista «Factura Contado».
- **Para «Facturar desde el taller»** (API móvil, `FacturaModel`):
  - `credito=false` es contado;
  - `formasPago` debe cuadrar con esa lista;
  - los campos `efectivo`, `banco`, `cheque`, `tarjeta`, `autorizacion`, `cuenta` y `monto2`/`banco2` corresponden a esas secciones;
  - falta confirmar con Dagoberto el código de «Intercambio de equipo».
- Solo se miró. No se escribió nada en Info Plus.
