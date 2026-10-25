# 25-oct-2026 (RD) · Claude · Solicitudes: responsable y próxima gestión — rama sin publicar

## Pedido del dueño
- «Hazlo, maqueta del responsable y próxima gestión» → maqueta https://claude.ai/artifact/JWAzpFFxeHavkfSkjMb823 (v6).
- Respuesta: «2- sí» → el responsable de una solicitud nueva es quien envió el formulario. Horas propuestas
  (Hoy en la tarde 4:00 p. m., Mañana 10:00 a. m.) se dejan así; se cambian fácil.

## Base (ya aplicada; solo agrega) — migración `20261025140000_fin_solicitudes_gestion.sql`
- Columnas `responsable_tipo/id/nombre`, `proxima_gestion_en`, `proxima_accion` + índice.
- Disparador `fin_solicitud_defaults_trg`: al crear, responsable = quien la envió; cuando el cliente la llena,
  próxima gestión = ahora, «Pasar la solicitud al banco».
- `fin_solicitud_responsables(sucursal)`: empleados activos con permiso de financiamiento de esa sucursal + cuentas usuario.
- `fin_solicitud_gestion(...)`: guarda responsable, cuándo, qué hacer y nota; queda en el historial («gestion»).
- `fin_solicitud_seguimiento` propone la próxima gestión: Enviada al banco → «Preguntar al banco» mañana 10:00;
  Aprobada → «Avisar al cliente y citarlo para retirar» hoy; Rechazada/Entregada/Cancelada → sin pendiente.
- Datos existentes: la No. 4 quedó con responsable (Administrador); las No. 2 y 3 (pruebas) no guardaron quién las envió →
  saldrán «Sin responsable» para asignarlas. Las abiertas quedaron para atender hoy.

## Pantalla (`crm-solicitudes.js` s4, cargador u26) — sin publicar
- Bandejas: Atender hoy (por defecto) · Atrasadas · Sin responsable · Todas abiertas · Cerradas · Sin llenar.
- Tarjeta: iniciales y nombre del responsable, qué toca y cuándo (Atrasada en rojo, Hoy en ámbar). Orden por fecha.
- Número rojo de la pestaña = por atender hoy + atrasadas.
- Ficha: «Quién la lleva y qué toca» (responsable, próxima gestión con 4 botones, qué hacer, nota, Guardar gestión).
- Historial muestra cada gestión con nota.
- Etiquetas sin MAYÚSCULAS (había un estilo general que las forzaba).

## Pruebas
`solicitudes-crm.cjs` (nuevos casos: bandejas, tarjeta con responsable, guardar gestión para mañana 10:00 con nota,
el número baja de 2 a 1), `solicitud-web.cjs` y `flow-financiamiento.cjs`: 390 OK / 1280 OK.

## Estado
Rama `claude/solicitudes-gestion`, sin publicar hasta «publícalo».
