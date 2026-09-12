# CLAUDE — CRM REDES BAYOL CELL

Claude: antes de continuar cualquier trabajo relacionado con Instagram, Facebook, TikTok, Social Inbox, comentarios, DM, Messenger o futura unificación con WhatsApp, **lee completos estos dos documentos en este orden**:

1. [`CRM_SOCIAL_HUB_CHATGPT.md`](CRM_SOCIAL_HUB_CHATGPT.md) — arquitectura, backend, modelo de datos, seguridad, fases y estado actual.
2. [`CLAUDE_CRM_REDES_UI.md`](CLAUDE_CRM_REDES_UI.md) — especificación visual/UX aprobada más reciente y obligatoria.

## Prioridad entre documentos

- Para arquitectura, backend, Supabase, adapters, Edge Functions, Realtime y migración: manda `CRM_SOCIAL_HUB_CHATGPT.md`.
- Para diseño, layout, navegación, barras, comportamiento responsive y jerarquía de información: manda `CLAUDE_CRM_REDES_UI.md`.
- Si una descripción visual anterior contradice `CLAUDE_CRM_REDES_UI.md`, usa **la especificación UI más reciente**.

## Decisión visual aprobada más reciente

La pantalla `CRM > Redes` debe tener **solo DOS barras sociales principales**:

```text
BARRA 1
Instagram | Facebook | TikTok

BARRA 2
Todos | Mensajes | Comentarios | Menciones* | Filtros

CONTENIDO DINÁMICO
```

`*` Menciones solo donde la red/capability real lo permita.

**NO crear una tercera barra o fila de KPIs debajo**, porque repetiría la información de la segunda barra.

La información importante debe integrarse de forma inteligente en:

- badges de las dos barras;
- tarjetas/filas de interacción;
- estados;
- tiempo esperando respuesta;
- asignación;
- lead relacionado;
- publicación de origen;
- panel de detalle;
- alertas contextuales reales.

## Alcance funcional

La nueva interfaz social contempla:

- Instagram: DM, comentarios y menciones según capacidades reales.
- Facebook: Messenger, comentarios y Private Reply según capacidades reales.
- TikTok: solo funciones soportadas oficialmente y autorizadas para la integración.
- WhatsApp: **se mantiene separado por ahora** en Mensajes/Leads. No unificarlo sin autorización explícita.

## Principio arquitectónico

No construir tres mini-CRMs separados.

Usar:

**un núcleo Social Inbox común + adapters por canal**.

## Estado actual de desarrollo

- Rama: `chatgpt/crm-social-hub-20260912`
- PR: `#46`
- `main` = producción.
- No asumir que Facebook/TikTok tienen backend funcional; auditar antes.
- Instagram tiene infraestructura existente que debe integrarse/migrarse cuidadosamente.

## Regla crítica de producción

`main` es producción. **No hacer push o merge a `main` sin autorización explícita del usuario para ese despliegue.**

## Orden recomendado

```text
Auditoría actual
  ↓
Core social schema
  ↓
Adapters
  ↓
Shell visual de Redes
  ↓
Barra 1 por canal
  ↓
Barra 2 contextual
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
Realtime + métricas accionables
  ↓
Inbox unificado de Redes
  ↓
WhatsApp opcional, solo con aprobación
```

Antes de implementar UI, releer los criterios de aceptación de `CLAUDE_CRM_REDES_UI.md`.
