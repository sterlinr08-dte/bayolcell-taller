# Microcopy de Reacondicionados (31-oct-2026, 02:30 RD) — PUBLICADO

**Dueño:** aprobó la tabla de 22 cambios y dijo «Publícalo». Reglamento en `DESIGN.md` «Reglamento de microcopy».

**Aplicado:** permisos → «Solo administrador» / «Lo aprueba el administrador» / «Sin permiso»; faltantes → «Marque los equipos», «Marque las salidas», «Falta el técnico», «Falta el IMEI», «¿A dónde se envió?», «¿Qué le falta?», «Falta la tasa del dólar», «Sin equipos con ese filtro», «Nada listo para despachar», «Nada en control», «Todos tienen técnico»; estados → «Primero registre la salida», «Solo equipos en Listo», «Ya tiene salida», «Salida ya cerrada», «Listo para venta»; éxito → «Registrado · asignado», «Pieza solicitada», «Pieza descontada», «Pieza extra · espera aprobación», «Falla adicional agregada», «Cuadra con Info Plus».
**Sin tocar:** avisos de inventario/dinero («No se movió nada en Info Plus», «Quedó solo como costo…», IMEI ya registrado / garantía, piezas tomadas por otra sesión).

**Archivos:** `taller-app.js` (+ min, `?v=20261031-o4`), `taller-reacond-proceso.js` p2, `taller-reacond-smart.js` r2 (vía `crm-marketing-consent.js` u29).
**Pruebas:** reacond-ui, reacond-proceso, reacond-fase2 (390/440/1280) y reacond-flujo-completo OK; ui-global «Todo bien»; prefactura-confiable sin errores.
