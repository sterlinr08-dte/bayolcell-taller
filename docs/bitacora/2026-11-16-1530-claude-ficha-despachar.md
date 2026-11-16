# 16-nov-2026 15:30 — Botón «Despachar a almacén» en la Ficha del Equipo

Pedido del dueño (con captura de la ficha de un iPhone XS Max listo para venta): un botón para despachar a otro almacén desde la ficha.

- `verFichaDespacho`: botón «Despachar a almacén» en la barra de arriba, solo admin, solo si el equipo está «Listo para venta» y sin registro cerrado.
- `despacharEquipoDesdeFicha(id)`: abre la misma ventana de «Despachar teléfonos» (despacho real de Info Plus con IMEI y costo) con ese teléfono ya marcado, sin cargar borradores, Taller (6) → Santiago (1) por defecto y el foco en «Hacia».
- Al terminar el despacho, si la ficha sigue abierta se vuelve a pintar con el estado nuevo (`_despDesdeFicha`).
- `taller.html` → `taller-app.min.js?v=20261116-fd1`.
- Sin publicar: espera «publícalo».
