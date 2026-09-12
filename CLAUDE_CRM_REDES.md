# CLAUDE — CRM REDES BAYOL CELL

Claude: antes de continuar cualquier trabajo relacionado con Instagram, Facebook, TikTok, Social Inbox, comentarios, DM, Messenger o futura unificación con WhatsApp, **lee completo**:

[`CRM_SOCIAL_HUB_CHATGPT.md`](CRM_SOCIAL_HUB_CHATGPT.md)

Ese archivo es el **documento maestro vigente** del proyecto CRM de Redes y contiene:

- arquitectura aprobada;
- estado actual del repo y PR #46;
- separación actual de WhatsApp;
- modelo de datos objetivo;
- adapters por canal;
- Edge Functions propuestas;
- flujos de Instagram DM/comentarios/menciones;
- Facebook Messenger/comentarios/private reply;
- estrategia TikTok basada solo en capacidades oficiales reales;
- Realtime;
- RLS y seguridad;
- multisucursal;
- integración con Leads;
- frontend modular;
- migración desde las tablas actuales de Instagram;
- criterios de aceptación;
- fases de implementación;
- reglas de UI;
- QA;
- restricciones de Git/producción.

## Regla crítica

`main` es producción. **No hacer push o merge a `main` sin autorización explícita del usuario para ese despliegue.**

## Orden recomendado

```text
Auditoría actual
  ↓
Core social schema
  ↓
Adapters
  ↓
Instagram DM
  ↓
Instagram Comments
  ↓
Instagram Mentions
  ↓
Facebook Messenger
  ↓
Facebook Comments / Private Reply
  ↓
TikTok según APIs/permisos reales
  ↓
Leads + contacto unificado
  ↓
Inbox unificado de Redes
  ↓
WhatsApp opcional
```

No construir tres mini-CRMs separados. El principio rector es **un núcleo Social Inbox común + adapters por canal**.
