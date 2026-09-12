# Auditoría completa del CRM — 12 septiembre 2026

## Dictamen
El CRM tiene una base funcional sólida para WhatsApp e Instagram Direct, pero no está correcto declarar que las cuatro redes tienen las mismas acciones todavía. Facebook y TikTok están en modo interfaz preparada; no tienen aún webhook, almacenamiento de conversaciones ni envío conectado. Instagram Direct permite texto, medios recibidos, asignación y lectura; sus acciones administrativas avanzadas todavía requieren implementación específica.

## Matriz actual de acciones

| Acción | WhatsApp | Instagram Direct | Facebook | TikTok |
|---|---:|---:|---:|---:|
| Recibir mensajes reales | Sí | Sí | No | No |
| Enviar texto | Sí | Sí | No | No |
| Imagen, audio, video y documento | Recibir/ver | Recibir/ver | No | No |
| Ubicación y contacto | Ver | Pendiente | No | No |
| Responder citando | Sí | Pendiente | No | No |
| Reenviar | Sí | Pendiente | No | No |
| Editar/eliminar mensaje | Pendiente | Pendiente | No | No |
| Reacciones/stickers | Parcial | Parcial | No | No |
| Asignar/reasignar conversación | Sí | Sí | Pendiente | Pendiente |
| Marcar leído/no leído | Sí | Sí | Pendiente | Pendiente |
| Buscar y filtrar | Sí | Sí | Vista preparada | Vista preparada |
| Plantillas fuera de ventana | Sí/parcial | Pendiente | Pendiente | Pendiente |
| Estado enviado/entregado/leído | Sí | Parcial | No | No |

## Hallazgos P0/P1 que deben cerrarse antes de llamarlo perfecto

1. Autorización de administrador basada en metadatos editables y políticas RLS demasiado amplias.
2. Edge Functions MDM/ABM e InfoPlus necesitan autorización de negocio en servidor.
3. Cobros, aprobación de financiamientos, reversos y asientos requieren operaciones transaccionales e idempotencia.
4. Estados MDM deben distinguir solicitado, enviado, confirmado y fallido.
5. Webhooks y envíos deben ser idempotentes, monotónicos y conciliables.
6. Las conversaciones deben aislarse por línea de WhatsApp y proveedor.
7. Archivos privados deben seguir el permiso de la conversación/contrato.
8. Calendario mensual, mora, tasa, redondeo y contrato firmado deben tener reglas de servidor.

## Hallazgos del chat corregidos en esta entrega

- WhatsApp e Instagram ya no esperan adjuntos ni sugerencias de IA para mostrar el texto.
- Una respuesta vieja no puede sobrescribir la conversación nueva seleccionada.
- Se añadió timeout y reintento para Instagram.
- WhatsApp, Instagram, Facebook y TikTok se muestran juntos.
- Facebook y TikTok usan ahora sus paneles visibles cuando se selecciona el canal.
- Se conservaron permisos, RLS, handlers existentes y datos reales.

## Plan de cierre recomendado

**Fase 1 — Chat:** acciones comunes, toolbar por mensaje, respuesta citada, reenviar, copiar, marcar, asignar, notas, estados y auditoría; después Facebook Messenger y TikTok según capacidades autorizadas.

**Fase 2 — Seguridad:** identidad administrada por servidor, políticas RLS por actor/sucursal/línea, pruebas negativas REST/RPC/Edge.

**Fase 3 — Dinero y equipos:** RPC transaccionales, idempotencia, reversos, calendario/mora, MDM confirmado y conciliación.

**Fase 4 — Operación:** alertas, restauración probada, dependencias fijadas, detección de funciones globales duplicadas y entorno de staging.

La auditoría técnica previa con 26 hallazgos continúa vigente en `AUDITORIA_SISTEMA_PARA_CLAUDE.md`; este documento se concentra en CRM, redes y acciones.
