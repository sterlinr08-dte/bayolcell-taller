# CRM REDES BAYOL CELL — DOCUMENTO MAESTRO PARA CLAUDE

**Fecha:** 2026-09-12  
**Rama de trabajo actual:** `chatgpt/crm-social-hub-20260912`  
**PR actual:** `#46` — CRM Redes: Instagram + Facebook + TikTok  
**Producción:** `main`  
**IMPORTANTE:** `main` publica en vivo. **NO hacer push/merge a `main` sin autorización explícita del usuario para ese despliegue.**

---

# 1. OBJETIVO DEL PROYECTO

Construir dentro del sistema de BAYOL CELL un CRM profesional para atención de redes sociales que permita administrar, de forma clara y centralizada:

- Instagram Direct (DM)
- Comentarios de Instagram
- Menciones / respuestas relacionadas con Instagram, cuando la integración lo permita
- Facebook Messenger
- Comentarios de Facebook
- Private Reply desde comentarios de Facebook cuando la API/permisos lo permitan
- TikTok comentarios
- TikTok Inbox/DM únicamente cuando exista una integración oficial/autorizada que lo soporte
- Conversión de interacciones sociales a Leads
- Asignación a agentes
- Notas internas
- Etiquetas
- Estados de atención
- Métricas
- Realtime

La arquitectura debe quedar preparada para que, en una fase posterior, **WhatsApp pueda entrar en un inbox unificado**, pero sin romper ni reemplazar el CRM WhatsApp actual hasta que el usuario lo apruebe.

---

# 2. DECISIÓN DE PRODUCTO APROBADA

La navegación actual del CRM se conserva así:

```text
CRM
├── Mensajes      → WhatsApp actual
├── Leads         → Leads actuales
└── Redes         → nueva interfaz social
    ├── Instagram
    ├── Facebook
    └── TikTok
```

WhatsApp permanece separado por ahora.

La nueva pestaña `Redes` debe manejar únicamente redes sociales.

La meta futura puede ser:

```text
Inbox
├── Todos
├── WhatsApp
├── Instagram
├── Facebook
└── TikTok
```

Pero **esa unificación no debe hacerse todavía**.

---

# 3. PRINCIPIO ARQUITECTÓNICO CENTRAL

NO construir tres mini-CRMs independientes.

NO crear lógica duplicada por todos lados con bloques tipo:

```js
if (instagram) ...
if (facebook) ...
if (tiktok) ...
```

La arquitectura correcta es:

```text
Canales externos
      ↓
Adapters por canal
      ↓
Capa normalizadora común
      ↓
Modelo social común en Supabase
      ↓
Realtime
      ↓
Frontend CRM común
```

Cada red debe ser un adaptador del mismo núcleo.

---

# 4. ARQUITECTURA DE ALTO NIVEL

```text
┌──────────────────────────────────────────────────────────────┐
│                         CANALES                              │
│                                                              │
│ Instagram       Facebook        TikTok        WhatsApp*      │
│ DM              Messenger       Comments      Mensajes       │
│ Comments        Comments        Inbox*                         │
│ Mentions        Private Reply                                  │
└─────────┬──────────────┬──────────────┬──────────────┬────────┘
          │              │              │              │
          ▼              ▼              ▼              ▼
┌──────────────────────────────────────────────────────────────┐
│                    ADAPTERS / PROVIDERS                      │
│                                                              │
│ InstagramAdapter   FacebookAdapter   TikTokAdapter           │
│ WhatsAppAdapter*                                             │
│                                                              │
│ Meta APIs / Zernio / TikTok APIs / Webhooks                 │
└─────────────────────────────┬────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                  SUPABASE EDGE FUNCTIONS                     │
│                                                              │
│ social-webhook                                               │
│ social-send                                                  │
│ social-comment-reply                                        │
│ social-private-reply                                        │
│ social-account-connect                                      │
│ social-event-reprocess                                      │
└─────────────────────────────┬────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                       POSTGRES                               │
│                                                              │
│ social_accounts                                             │
│ social_contacts                                             │
│ social_contact_identities                                   │
│ social_posts                                                │
│ social_conversations                                        │
│ social_messages                                             │
│ social_comments                                             │
│ social_comment_replies                                      │
│ social_events                                               │
│ social_assignments                                          │
│ social_tags                                                 │
│ leads                                                       │
└─────────────────────────────┬────────────────────────────────┘
                              │
                         Realtime
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                     FRONTEND CRM                             │
│                                                              │
│ Mensajes │ Leads │ Redes                                    │
│                  ├ Instagram                                │
│                  ├ Facebook                                 │
│                  └ TikTok                                   │
└──────────────────────────────────────────────────────────────┘
```

`*` = fase posterior/opcional.

---

# 5. ESTADO ACTUAL DEL REPOSITORIO

## 5.1 Rama de desarrollo

La implementación visual inicial vive en:

`chatgpt/crm-social-hub-20260912`

No está publicada en producción.

PR:

`#46 — CRM Redes: Instagram + Facebook + TikTok`

## 5.2 Archivos agregados/modificados en esta fase

### `crm-social-hub.js`
Capa inicial del Social Hub.

Actualmente:
- monta una interfaz social encima de la vista CRM existente;
- Instagram ya tiene bandeja funcional básica;
- usa las tablas actuales de Instagram;
- permite búsqueda de conversaciones;
- abre chat;
- carga mensajes;
- envía mensajes con `instagram-enviar`;
- escucha Realtime para Instagram;
- Facebook aparece como pendiente;
- la primera versión incluía WhatsApp visualmente, pero eso fue corregido en la capa de alcance.

### `crm-social-hub.css`
Estilos visuales del Social Hub.

### `crm-social-scope-fix.js`
Capa correctiva de alcance.

Su objetivo es:
- mantener WhatsApp fuera de la nueva interfaz social;
- agregar la pestaña `Redes`;
- mostrar Instagram, Facebook y TikTok;
- restaurar la vista normal de WhatsApp al volver a `Mensajes` o `Leads`;
- mostrar KPIs propios de Redes;
- no simular funciones backend inexistentes.

### `crm-social-scope-fix.css`
Ajustes visuales específicos para el modo Redes.

### `crm-marketing-consent-legacy.js`
Copia exacta del módulo anterior de consentimiento de marketing.

### `crm-marketing-consent.js`
Ahora funciona como loader para cargar:
- módulo legacy;
- CSS social;
- hub social;
- scope fix.

### `CRM_SOCIAL_HUB_CHATGPT.md`
Este documento maestro.

## 5.3 `taller.html`

En esta fase NO se modificó.

La decisión fue aditiva para reducir riesgo porque `taller.html` es muy grande y contiene gran parte del sistema.

---

# 6. ESTADO ACTUAL DEL BACKEND SOCIAL

Supabase project ref conocido:

`vkhwdvjtowrhkhqavnvk`

## Instagram ya existente

Tablas existentes:

- `instagram_cuentas`
- `instagram_hilos`
- `instagram_mensajes`

Edge Functions existentes:

- `instagram-webhook`
- `instagram-enviar`

Storage:

- bucket privado `instagram-media`

Estado observado durante la auditoría inicial:

- existe al menos 1 cuenta Instagram configurada;
- en la auditoría inicial había 0 hilos y 0 mensajes en Instagram;
- el primer DM real debe usarse como prueba end-to-end;
- `instagram-enviar` ya valida JWT y acceso;
- utiliza infraestructura Zernio existente;
- maneja ventana de mensajería según lógica ya implementada.

## Facebook

Actualmente NO existe un backend completo dedicado a Facebook en el repositorio.

No asumir que existe:

- `facebook_cuentas`
- `facebook_hilos`
- `facebook_mensajes`
- `facebook-webhook`
- `facebook-enviar`

Antes de implementar, auditar nuevamente el estado real del proyecto.

## TikTok

Actualmente NO existe una integración TikTok funcional en el repositorio.

No mostrar funciones falsas.

Antes de implementar TikTok:
- confirmar qué APIs oficiales están disponibles para la cuenta/app;
- confirmar permisos aprobados;
- confirmar si comentarios, inbox y respuestas privadas son realmente accesibles;
- diseñar el adapter únicamente alrededor de capacidades reales.

---

# 7. MODELO DE DATOS OBJETIVO

Este es el diseño recomendado a largo plazo.

IMPORTANTE:
- es arquitectura objetivo;
- NO ejecutar migraciones automáticamente;
- primero auditar tablas y constraints actuales;
- después diseñar una migración segura que conviva con las tablas Instagram actuales;
- mantener compatibilidad durante transición.

---

# 8. `social_accounts`

Una fila por cuenta social conectada.

Campos recomendados:

```text
id uuid pk
channel text
sucursal_id uuid
provider text
external_account_id text
username text
display_name text
avatar_url text
status text
capabilities jsonb
provider_account_id text
provider_profile_id text
metadata jsonb
created_at timestamptz
updated_at timestamptz
```

Ejemplos de `channel`:

```text
instagram
facebook
tiktok
whatsapp
```

Ejemplo `capabilities`:

```json
{
  "dm": true,
  "comments": true,
  "mentions": true,
  "private_reply": false
}
```

Este campo permite que la UI decida qué mostrar sin inventar funciones.

---

# 9. `social_contacts`

Representa a una persona dentro del CRM social.

Campos sugeridos:

```text
id uuid pk
cliente_id uuid nullable
nombre text
telefono text nullable
email text nullable
created_at timestamptz
updated_at timestamptz
```

Objetivo:

Una misma persona puede contactar por varias redes, pero debe poder terminar representada por un solo contacto comercial.

---

# 10. `social_contact_identities`

Une un contacto interno con su identidad en cada canal.

Campos:

```text
id uuid pk
contact_id uuid fk social_contacts
account_id uuid fk social_accounts
channel text
external_user_id text
username text
display_name text
avatar_url text
metadata jsonb
created_at timestamptz
```

Restricción recomendada:

```text
UNIQUE(account_id, external_user_id)
```

Ejemplo conceptual:

```text
Valentina Rojas
├── Instagram → @valentina_rojas / IGSID...
├── Facebook  → PSID...
├── TikTok    → open_id...
└── WhatsApp  → 1809...
```

---

# 11. `social_posts`

Guarda publicaciones que generan interacción.

Campos sugeridos:

```text
id uuid pk
account_id uuid
channel text
external_post_id text
post_type text
caption text
thumbnail_url text
permalink text
published_at timestamptz
metadata jsonb
created_at timestamptz
updated_at timestamptz
```

Sirve para que un comentario mantenga contexto sin consultar la API cada vez.

Ejemplo:

```text
Post: iPhone 16 Pro Max
Usuario: @maria
Comentario: "¿Qué precio tiene?"
```

---

# 12. `social_conversations`

Una conversación privada.

Campos sugeridos:

```text
id uuid pk
account_id uuid
contact_id uuid
identity_id uuid
channel text
external_thread_id text
status text
assigned_type text
assigned_id uuid
unread_count integer
last_message_preview text
last_message_at timestamptz
last_inbound_at timestamptz
last_outbound_at timestamptz
lead_id uuid nullable
metadata jsonb
created_at timestamptz
updated_at timestamptz
```

Estados base:

```text
open
pending
assigned
resolved
archived
```

Evitar meter en esta tabla comentarios públicos.

---

# 13. `social_messages`

Mensajes privados de una conversación.

Campos sugeridos:

```text
id uuid pk
conversation_id uuid
account_id uuid
channel text
external_message_id text
direction text
message_type text
text text
media_path text
media_type text
reply_to_message_id uuid nullable
status text
sent_at timestamptz
read_at timestamptz
raw_payload jsonb
created_at timestamptz
```

`direction`:

```text
inbound
outbound
```

`message_type` puede incluir:

```text
text
image
video
audio
document
sticker
share
unknown
```

Restricción importante:

```text
UNIQUE(channel, external_message_id)
```

siempre que el proveedor garantice un identificador estable.

---

# 14. `social_comments`

Los comentarios públicos deben ir separados de los DM.

Campos sugeridos:

```text
id uuid pk
account_id uuid
post_id uuid
contact_id uuid nullable
identity_id uuid nullable
channel text
external_comment_id text
external_parent_comment_id text nullable
text text
status text
conversation_id uuid nullable
lead_id uuid nullable
commented_at timestamptz
raw_payload jsonb
created_at timestamptz
updated_at timestamptz
```

Estados sugeridos:

```text
new
responded
private_reply_sent
converted_to_dm
converted_to_lead
hidden
archived
```

Relación importante:

```text
social_comments.conversation_id
             ↓
social_conversations.id
```

Esto permite que el CRM muestre:

```text
Comentario original
       ↓
Conversación privada relacionada
```

---

# 15. `social_comment_replies`

Respuestas públicas realizadas desde el CRM.

Campos sugeridos:

```text
id uuid pk
comment_id uuid
external_reply_id text
text text
author_user_id uuid
direction text
status text
created_at timestamptz
raw_payload jsonb
```

Esto permite auditoría de quién respondió y qué publicó.

---

# 16. `social_events`

Tabla crítica para robustez.

Debe guardar eventos recibidos antes de procesarlos.

Campos sugeridos:

```text
id uuid pk
channel text
account_id uuid nullable
event_type text
external_event_id text
payload jsonb
received_at timestamptz
processed_at timestamptz nullable
processing_status text
error_message text nullable
retry_count integer default 0
created_at timestamptz
```

Estados:

```text
received
processing
processed
failed
ignored
```

Restricción recomendada:

```text
UNIQUE(channel, external_event_id)
```

Objetivo:
- idempotencia;
- evitar duplicados;
- reintentos;
- diagnóstico;
- poder investigar "el comentario llegó pero no apareció".

---

# 17. ASIGNACIÓN, ETIQUETAS Y NOTAS

Puede hacerse de dos formas:

## Opción A — columnas directas

Más simple para MVP.

`social_conversations`:

```text
assigned_type
assigned_id
```

## Opción B — tablas separadas

Mejor para historial y equipos grandes.

### `social_assignments`

```text
id
resource_type
resource_id
assigned_type
assigned_id
assigned_by
assigned_at
ended_at
```

### `social_tags`

Catálogo de etiquetas.

### `social_resource_tags`

Relación N:M entre conversaciones/comentarios/contactos y tags.

### `social_notes`

Notas internas:

```text
id
resource_type
resource_id
author_id
note
created_at
```

Para el MVP se puede reutilizar infraestructura existente si ya existe algo equivalente.

---

# 18. RELACIÓN CON `leads`

El CRM social debe ser comercial, no solo un inbox.

Cada conversación o comentario debe poder convertirse en Lead.

Flujo objetivo:

```text
Comentario Instagram
        ↓
Respuesta / DM
        ↓
Crear Lead
        ↓
Asignar vendedor
        ↓
Etiqueta producto
        ↓
Seguimiento
        ↓
Venta
```

Idealmente `leads` debe poder guardar:

```text
canal
contact_id
conversation_id
source_type
source_id
source_post_id
```

Antes de cambiar `leads`, revisar constraints actuales.

Actualmente el campo `canal` ya fue observado con soporte para:

```text
whatsapp
instagram
facebook
```

TikTok debe agregarse solo cuando se implemente realmente el flujo de leads TikTok.

IMPORTANTE: durante la auditoría anterior `leads.hilo_id` estaba ligado por FK a `whatsapp_hilos`. Eso no es ideal para el modelo multicanal. Revisar cuidadosamente antes de cualquier migración.

---

# 19. ADAPTERS

Crear un contrato común.

Conceptualmente:

```text
SocialAdapter
├── connectAccount()
├── receiveEvent()
├── normalizeEvent()
├── sendMessage()
├── replyComment()
├── privateReply()
├── getConversation()
├── getProfile()
├── getPost()
└── getCapabilities()
```

Implementaciones:

```text
InstagramAdapter
FacebookAdapter
TikTokAdapter
WhatsAppAdapter   ← futuro
```

El frontend nunca debe hablar directamente con un adapter de proveedor.

La UI consume funciones internas estables.

---

# 20. EDGE FUNCTIONS OBJETIVO

NO hacer una función enorme para todo.

## `social-webhook`

Responsabilidades:
- recibir webhook;
- validar firma/origen;
- identificar canal/cuenta;
- generar `external_event_id`;
- insertar `social_events`;
- disparar procesamiento.

## `social-event-processor`

Responsabilidades:
- leer evento;
- llamar adapter correcto;
- normalizar payload;
- upsert contacto/identidad;
- upsert conversación/post/comentario;
- insertar mensaje;
- marcar evento procesado;
- emitir Realtime.

## `social-send`

Responsabilidades:
- validar JWT;
- validar usuario y permisos;
- validar sucursal/cuenta;
- consultar capabilities;
- enviar mediante adapter;
- persistir salida;
- devolver estado real.

## `social-comment-reply`

Responsabilidades:
- responder comentario público;
- validar capability;
- persistir respuesta;
- actualizar estado del comentario.

## `social-private-reply`

Responsabilidades:
- convertir interacción pública a privado cuando el canal lo permita;
- persistir relación comentario → conversación.

## `social-account-connect`

OAuth/conexión de cuentas.

## `social-event-reprocess`

Reprocesamiento manual controlado de eventos fallidos.

---

# 21. FLUJO — INSTAGRAM DM

```text
Cliente envía DM
      ↓
Instagram / proveedor
      ↓
Webhook
      ↓
social-webhook
      ↓
social_events
      ↓
InstagramAdapter.normalizeEvent()
      ↓
social_contacts / identities
      ↓
social_conversations
      ↓
social_messages
      ↓
Realtime
      ↓
CRM Redes → Instagram → Direct
```

Respuesta:

```text
Agente escribe
      ↓
social-send
      ↓
validación JWT + permisos
      ↓
InstagramAdapter.sendMessage()
      ↓
Meta/Zernio
      ↓
respuesta proveedor
      ↓
social_messages outbound
      ↓
CRM
```

---

# 22. FLUJO — INSTAGRAM COMENTARIOS

```text
Cliente comenta publicación/reel
        ↓
Webhook
        ↓
social_events
        ↓
InstagramAdapter
        ↓
social_posts
social_comments
        ↓
Realtime
        ↓
CRM Redes → Instagram → Comentarios
```

UI:

```text
Post / Reel
Usuario
Comentario
Hora
Estado
```

Acciones posibles si capability/API lo permite:

- Responder público
- Enviar a privado
- Convertir a lead
- Asignar
- Etiquetar
- Archivar

Si se genera conversación privada:

```text
social_comments.conversation_id = social_conversations.id
```

---

# 23. FLUJO — INSTAGRAM MENCIONES

Vista separada de Direct y Comentarios.

Posibles fuentes:
- mención en story;
- respuesta a story;
- mención en publicación/reel;
- otros eventos soportados por la integración.

NO mezclar automáticamente con comentarios sin conservar `event_type` y contexto.

Subpestañas recomendadas:

```text
Instagram
├── Direct
├── Comentarios
└── Menciones
```

---

# 24. FLUJO — FACEBOOK MESSENGER

```text
Cliente escribe por Messenger
        ↓
Webhook Meta/proveedor
        ↓
social_events
        ↓
FacebookAdapter
        ↓
social_conversations
social_messages
        ↓
Realtime
        ↓
CRM Redes → Facebook → Messenger
```

UI debe usar el mismo componente base de chat que Instagram, pero con identidad visual de Facebook.

---

# 25. FLUJO — FACEBOOK COMENTARIOS

```text
Comentario en Page/Post
       ↓
Webhook
       ↓
social_events
       ↓
social_posts
social_comments
       ↓
CRM Facebook → Comentarios
```

Acciones según permisos/capabilities:

- responder público;
- private reply;
- abrir/relacionar Messenger;
- convertir a lead;
- ocultar si la API y rol lo permiten;
- archivar internamente.

NO asumir que un comentario ya es automáticamente un hilo completo de Messenger.

Comentario público y conversación privada deben permanecer entidades separadas, relacionadas cuando corresponda.

---

# 26. FLUJO — TIKTOK

TikTok debe entrar mediante adapter y capabilities.

NO construir un inbox falso.

Diseño:

```text
TikTokAdapter
       ↓
capabilities
       ↓
comments = true/false
inbox = true/false
reply_comment = true/false
send_message = true/false
```

La UI solamente muestra acciones activas.

Hasta que haya backend real:

```text
TikTok
├── Comentarios — pendiente/integración según API aprobada
└── Inbox       — pendiente
```

Antes de implementar:
- revisar documentación oficial vigente;
- revisar App Review/permisos;
- confirmar límites y modelo de identidad;
- confirmar webhook/eventos disponibles.

---

# 27. REALTIME

La arquitectura objetivo debe usar Realtime de forma escalable.

Preferencia de diseño:

- Supabase Broadcast para el núcleo nuevo;
- Postgres Changes puede mantenerse temporalmente en componentes existentes mientras se migra.

Canales sugeridos:

```text
social:account:{account_id}
social:conversation:{conversation_id}
social:comments:{account_id}
social:agent:{user_id}
```

Eventos internos sugeridos:

```text
conversation.created
conversation.updated
message.created
message.updated
comment.created
comment.updated
assignment.changed
lead.created
```

No recargar 500 mensajes completos por cada evento si no es necesario.

Actualizar incrementalmente.

---

# 28. SEGURIDAD

## Nunca en frontend

NO exponer:

- service role / secret key de Supabase;
- Meta app secret;
- TikTok secret;
- Zernio secret;
- tokens permanentes de proveedor;
- secretos OAuth.

Frontend solo usa:

- clave pública/publishable de Supabase;
- JWT/session del usuario.

## RLS

Todas las tablas nuevas en schema expuesto deben tener RLS.

Autorización debe considerar:

```text
usuario
  ↓
rol
  ↓
sucursal(es) permitidas
  ↓
cuentas sociales permitidas
```

Evitar políticas basadas solamente en `TO authenticated` sin condición de autorización.

No usar `user_metadata` editable para autorizar.

Si se usa `app_metadata`, recordar que JWT puede requerir refresh para reflejar cambios.

## Edge Functions

Las acciones sensibles deben validar:

1. JWT válido;
2. usuario interno;
3. permiso/rol;
4. sucursal;
5. acceso a `social_account`;
6. capability del canal;
7. estado de la conversación/interacción.

---

# 29. MULTISUCURSAL

BAYOL CELL opera con varias sucursales.

La arquitectura debe permitir que una cuenta social pueda pertenecer a:

- una sucursal específica;
- una operación central;
- eventualmente varias sucursales mediante una tabla de acceso.

No asumir siempre 1 cuenta = 1 sucursal.

Si se necesita flexibilidad:

```text
social_account_access
├── account_id
├── sucursal_id
└── role/access level
```

Para MVP se puede mantener `sucursal_id` directo si el negocio lo permite.

---

# 30. FRONTEND OBJETIVO

NO seguir inflando `taller.html` con todo el nuevo CRM social.

Separar módulos externos.

Propuesta:

```text
crm-social/
├── social-shell.js
├── social-router.js
├── social-state.js
├── social-api.js
├── social-realtime.js
├── social-inbox.js
├── social-comments.js
├── social-mentions.js
├── social-contact-panel.js
├── social-composer.js
├── social-filters.js
├── social-leads.js
├── social.css
└── channels/
    ├── instagram-ui.js
    ├── facebook-ui.js
    ├── tiktok-ui.js
    └── whatsapp-ui.js     # futuro
```

Dado que el proyecto actual es vanilla HTML/JS y no tiene bundler, estos archivos deben poder cargarse con `<script src>` / `<link>` de forma controlada.

No introducir framework nuevo sin una decisión explícita.

---

# 31. ARQUITECTURA VISUAL APROBADA

## Nivel 1 — módulo CRM

```text
Mensajes | Leads | Redes
```

## Nivel 2 — dentro de Redes

```text
Instagram | Facebook | TikTok
```

## Nivel 3 — por canal

Instagram:

```text
Direct | Comentarios | Menciones
```

Facebook:

```text
Messenger | Comentarios
```

TikTok:

```text
Comentarios | Inbox
```

Los tabs deben ser compactos y móviles.

---

# 32. LAYOUT DE DM / MESSENGER

Desktop:

```text
┌────────────────┬─────────────────────────┬──────────────────┐
│ Conversaciones │ Chat                    │ Cliente          │
│                │                         │                  │
│ búsqueda       │ header                  │ nombre           │
│ filtros        │ mensajes                │ usuario          │
│ lista          │                         │ etiquetas        │
│ unread         │ composer                │ notas            │
│                │                         │ lead             │
└────────────────┴─────────────────────────┴──────────────────┘
```

Mobile:

- lista primero;
- tocar conversación abre chat;
- botón volver retorna a lista;
- composer fijo encima del teclado;
- no duplicar botones;
- flecha enviar en móvil;
- Enter en PC;
- mantener cursor después de enviar;
- no saltar automáticamente al inicio del historial.

Estas reglas son coherentes con el CRM WhatsApp existente.

---

# 33. LAYOUT DE COMENTARIOS

Desktop:

```text
┌────────────────────────────┬──────────────────────────────┐
│ Lista de comentarios       │ Comentario seleccionado      │
│                            │                              │
│ filtros publicación        │ post/reel origen             │
│ filtros estado             │ usuario                      │
│ comentario                 │ texto                        │
│ estado                     │ acciones                     │
│ hora                       │ conversación relacionada     │
└────────────────────────────┴──────────────────────────────┘
```

Acciones:

```text
Responder público
Enviar a DM / Private Reply
Convertir en lead
Asignar
Etiquetar
Archivar
```

Solo mostrar acciones realmente soportadas.

---

# 34. PANEL DERECHO DE CLIENTE

Para conversaciones privadas:

- nombre;
- username;
- canal;
- avatar;
- teléfono/email si se conoce;
- etiquetas;
- notas;
- lead asociado;
- agente asignado;
- historial de interacciones sociales.

Para comentarios:

- post origen;
- permalink;
- comentario;
- respuestas;
- conversación privada relacionada;
- lead;
- estado;
- asignación.

---

# 35. CONTACTO UNIFICADO

Objetivo futuro:

Una persona puede tener varias identidades.

```text
Contacto BAYOL CELL
├── Instagram identity
├── Facebook identity
├── TikTok identity
└── WhatsApp identity
```

NO fusionar identidades automáticamente solo por nombre parecido.

Métodos seguros para vincular:

- teléfono confirmado;
- email confirmado;
- acción manual del agente;
- identificador proveniente de una integración confiable.

Registrar auditoría de merge/unmerge si se implementa.

---

# 36. MÉTRICAS

KPIs de Redes sugeridos:

- sin leer Instagram;
- sin leer Facebook;
- sin leer TikTok;
- comentarios sin responder;
- leads abiertos de redes;
- tiempo medio de primera respuesta;
- conversaciones por agente;
- conversaciones resueltas;
- conversiones a lead;
- conversiones a venta si existe trazabilidad.

No mostrar números inventados.

Si un canal no está conectado:

```text
—
Pendiente
Sin integración
```

---

# 37. ESTADOS DE ATENCIÓN

Conversaciones:

```text
open
pending
assigned
resolved
archived
```

Comentarios:

```text
new
responded
private_reply_sent
converted_to_dm
converted_to_lead
hidden
archived
```

Leads mantienen sus etapas comerciales existentes.

No mezclar "leído" con "resuelto".

Un mensaje puede estar leído y todavía pendiente de atención.

---

# 38. DEDUPLICACIÓN E IDEMPOTENCIA

Todos los webhooks deben tolerar reentrega.

Reglas:

- guardar ID externo;
- UNIQUE por canal + external ID;
- procesar transaccionalmente cuando sea posible;
- si evento ya fue procesado, responder OK sin duplicar;
- registrar error/reintento;
- nunca insertar dos mensajes por el mismo evento.

---

# 39. MANEJO DE MEDIA

No depender de URLs temporales del proveedor como fuente permanente.

Estrategia:

1. recibir metadata;
2. si aplica y permisos lo permiten, descargar/replicar a Storage;
3. guardar `media_path` interno;
4. bucket privado;
5. generar signed URL para UI;
6. aplicar expiración.

Separar media por canal/cuenta/conversación.

Ejemplo:

```text
social-media/{channel}/{account_id}/{conversation_id}/{message_id}/...
```

---

# 40. LOGS Y OBSERVABILIDAD

Guardar información suficiente para responder:

- qué webhook llegó;
- cuándo llegó;
- qué cuenta;
- qué canal;
- qué tipo de evento;
- si se procesó;
- error;
- reintentos;
- mensaje generado;
- acción de agente.

Nunca guardar secretos completos en logs.

---

# 41. MIGRACIÓN DESDE INSTAGRAM ACTUAL

NO eliminar inmediatamente:

- `instagram_cuentas`
- `instagram_hilos`
- `instagram_mensajes`

Plan recomendado:

### Etapa A
Mantener tablas actuales y construir núcleo común en paralelo.

### Etapa B
Crear mapper/sync desde Instagram actual → modelo social común.

### Etapa C
Cambiar frontend a leer del modelo común.

### Etapa D
Cuando esté validado, decidir si las tablas antiguas quedan como compatibilidad o se deprecian.

Evitar big-bang migration.

---

# 42. FASES DE IMPLEMENTACIÓN

## Fase 0 — Auditoría técnica

Antes de schema:
- revisar estado actual de Supabase;
- revisar RLS;
- revisar constraints;
- revisar Edge Functions;
- revisar Zernio;
- revisar scopes/permisos Meta;
- revisar PR #46 y main actual;
- confirmar que nadie cambió archivos involucrados.

## Fase 1 — Núcleo social común

Construir:

```text
social_accounts
social_contacts
social_contact_identities
social_posts
social_conversations
social_messages
social_comments
social_events
```

Más RLS y Realtime.

## Fase 2 — Instagram Direct

Migrar/adaptar el Instagram existente al núcleo común.

Criterio:
- DM entra;
- aparece en CRM sin refresh;
- respuesta sale;
- se confirma en canal;
- estado/unread consistente;
- media funciona.

## Fase 3 — Instagram Comentarios

Agregar:
- post;
- comentarios;
- estados;
- respuesta pública;
- comentario → DM si API lo permite;
- lead.

## Fase 4 — Instagram Menciones

Solo eventos soportados por integración real.

## Fase 5 — Facebook Messenger

Crear adapter y flujo Messenger.

## Fase 6 — Facebook Comentarios

Agregar comments/private reply según permisos reales.

## Fase 7 — TikTok

Solo después de confirmar APIs y permisos reales.

## Fase 8 — Leads sociales

Contacto unificado, notas, tags, asignación, source attribution.

## Fase 9 — Inbox unificado de Redes

Vista opcional `Todos` para Instagram/Facebook/TikTok.

## Fase 10 — WhatsApp opcional

Solo si el usuario aprueba integrar WhatsApp al inbox global.

La integración debe reutilizar adapters y modelo común, pero preservar estabilidad de WhatsApp.

---

# 43. CRITERIOS DE ACEPTACIÓN — INSTAGRAM DIRECT

- [ ] Cuenta Instagram visible solo a usuarios autorizados.
- [ ] Conversaciones ordenadas por actividad.
- [ ] No leídos correctos.
- [ ] Abrir conversación no rompe scroll.
- [ ] En móvil abre al último mensaje.
- [ ] Nuevos inbound aparecen sin refrescar.
- [ ] PC envía con Enter.
- [ ] Shift+Enter crea salto.
- [ ] Móvil envía con flecha.
- [ ] Cursor permanece activo.
- [ ] Media visible mediante signed URL.
- [ ] Edge Function valida JWT/permisos.
- [ ] Mensaje enviado se confirma realmente.
- [ ] Errores del proveedor se muestran al agente.

---

# 44. CRITERIOS DE ACEPTACIÓN — COMENTARIOS

- [ ] Aparece publicación origen.
- [ ] Aparece usuario.
- [ ] Aparece comentario completo.
- [ ] Se identifica canal.
- [ ] Estado visible.
- [ ] Filtro por sin responder/respondido.
- [ ] Responder público funciona realmente.
- [ ] No duplica comentario por webhook repetido.
- [ ] Si se abre privado, se relaciona conversación.
- [ ] Convertir a Lead conserva source.
- [ ] Agente queda auditado.

---

# 45. CRITERIOS DE ACEPTACIÓN — FACEBOOK

- [ ] Cuenta/Page conectada y autorizada.
- [ ] Messenger inbound/outbound real.
- [ ] Comentarios reales.
- [ ] Public reply real.
- [ ] Private Reply solo si capability/permisos lo permiten.
- [ ] No confundir comentario con Messenger.
- [ ] Realtime.
- [ ] RLS.
- [ ] Lead source Facebook.

---

# 46. CRITERIOS DE ACEPTACIÓN — TIKTOK

Antes de marcar TikTok como funcional:

- [ ] API oficial confirmada para caso de uso.
- [ ] Cuenta/app aprobada.
- [ ] permisos reales documentados.
- [ ] eventos webhook reales.
- [ ] IDs externos estables.
- [ ] comentarios reales si están permitidos.
- [ ] Inbox real solo si existe soporte autorizado.
- [ ] no usar scraping ni API privada.
- [ ] errores/límites controlados.
- [ ] RLS y auditoría.

---

# 47. QA MULTICANAL

Probar mínimo:

## PC
- Instagram Direct
- Instagram comentarios
- Facebook Messenger
- Facebook comentarios
- TikTok estado pendiente/real según fase
- navegación entre tabs
- cambio de agente
- leads

## iPhone
- viewport;
- teclado;
- composer;
- scroll;
- cambio lista/chat;
- botones compactos;
- tres canales en una sola fila o scroll horizontal controlado;
- ningún overlay detrás de navbar;
- ningún botón gigante.

## Android
Mismas pruebas de viewport y teclado.

---

# 48. REGLAS DE UI DEL USUARIO

Aplicar a todo este proyecto:

1. Botones tamaño normal; evitar botones gigantes.
2. No duplicar funciones.
3. Ventanas compactas.
4. Diseño moderno.
5. Búsqueda mediante icono/lupa y experiencia compacta cuando aplique.
6. Botones estándar para cerrar/volver/guardar/etc.
7. Mobile first.
8. No usar controles decorativos sin acción real.
9. Chat debe aprovechar al máximo el alto disponible.
10. En móvil, el teclado no debe ocultar el composer.
11. PC: Enter envía; Shift+Enter salto de línea.
12. Móvil: botón/flecha de enviar.
13. Nuevos mensajes deben entrar en vivo.
14. Mantener cursor en input cuando corresponde.
15. Evitar funciones repetidas en header/footer.

---

# 49. REGLAS DE GIT Y PRODUCCIÓN

- `main` = producción.
- No publicar cambios de esta arquitectura sin autorización explícita del usuario.
- Antes de mergear PR #46, volver a consultar `main`; Claude u otro agente puede haber avanzado.
- No sobrescribir cambios recientes de `main` con commits basados en una versión vieja.
- Validar JS antes de cualquier deploy.
- Revisar cache busting de scripts externos.
- Después de deploy, confirmar que los archivos cargados en producción corresponden al commit esperado.

---

# 50. PR #46 — ESTADO CONCEPTUAL

El PR #46 es una **capa visual/prototipo funcional parcial**, no el backend definitivo descrito en este documento.

Actualmente:

### Instagram
- base de inbox existente;
- lectura de cuenta/hilos/mensajes actuales;
- envío por `instagram-enviar`;
- Realtime actual;
- comentarios/menciones todavía no implementados.

### Facebook
- placeholder visual;
- backend pendiente.

### TikTok
- placeholder visual;
- backend pendiente.

No confundir la maqueta/PR actual con la arquitectura final.

---

# 51. DECISIÓN SOBRE WHATSAPP

El usuario preguntó si podemos incluir WhatsApp.

Respuesta arquitectónica: **sí**.

Pero recomendación actual:

### Ahora

```text
Mensajes = WhatsApp
Redes = Instagram/Facebook/TikTok
```

### Después

Construir adaptador WhatsApp y ofrecer:

```text
Todos
WhatsApp
Instagram
Facebook
TikTok
```

Solo cuando el núcleo social esté estable.

No migrar WhatsApp de golpe porque actualmente es un canal operativo crítico y ya tiene lógica consolidada de:

- líneas;
- sucursales;
- ventanas de 24h;
- unread;
- mensajes entrantes/salientes;
- Zernio;
- media;
- leads;
- asignación.

---

# 52. NO HACER

- NO crear botones Facebook/TikTok que parezcan funcionales si no tienen backend.
- NO mezclar comentarios públicos con mensajes privados en una sola tabla.
- NO tratar un comentario como si ya fuera DM.
- NO exponer secrets al navegador.
- NO hacer una Edge Function monolítica.
- NO meter todo el nuevo código dentro de `taller.html`.
- NO romper IDs/handlers existentes de WhatsApp.
- NO usar scraping para TikTok.
- NO hacer merge automático de identidades por nombre.
- NO push a `main` sin autorización explícita.

---

# 53. SIGUIENTE PASO RECOMENDADO PARA CLAUDE

Antes de programar más UI, ejecutar esta secuencia:

## Paso 1
Auditar nuevamente Supabase y el repo actual.

Confirmar:
- tablas Instagram;
- constraints;
- RLS;
- policies;
- funciones Instagram;
- Zernio;
- estado de `leads`;
- estado de `main`;
- estado de PR #46.

## Paso 2
Diseñar el SQL exacto del núcleo social, SIN ejecutarlo todavía.

Entregar:
- tablas;
- indexes;
- FKs;
- checks;
- uniqueness;
- RLS;
- triggers;
- Broadcast.

## Paso 3
Comparar ese schema con las tablas Instagram existentes.

Definir estrategia de transición.

## Paso 4
Implementar primero Instagram DM sobre el núcleo común.

## Paso 5
Una vez probado, construir Instagram comentarios.

## Paso 6
Después Facebook.

## Paso 7
TikTok al final, basado en capacidades oficiales reales.

---

# 54. DEFINICIÓN DE ÉXITO

El proyecto está bien construido cuando:

- una interacción entra por cualquier canal soportado;
- queda registrada una sola vez;
- aparece en vivo en el CRM;
- conserva contexto de publicación/conversación;
- puede asignarse;
- puede etiquetarse;
- puede convertirse a lead;
- puede responderse desde el CRM cuando la API lo permite;
- el agente puede ver toda la trazabilidad;
- los permisos por usuario/sucursal se respetan;
- los errores son auditables;
- no se exponen secretos;
- añadir un canal nuevo requiere un adapter, no reescribir el CRM.

---

# 55. RESUMEN PARA CLAUDE

**Construir un núcleo Social Inbox común.**

No construir Instagram/Facebook/TikTok como sistemas separados.

Orden recomendado:

```text
Auditoría
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
TikTok según capacidades reales
  ↓
Leads + Contacto unificado
  ↓
Inbox de Redes
  ↓
WhatsApp opcional
```

La UI objetivo es la maqueta discutida con el usuario: navegación compacta, moderna, mobile-first, con separación clara entre chats privados, comentarios y menciones.

**Este documento es la referencia principal para continuar el desarrollo del CRM de Redes.**

**No desplegar a `main` sin autorización explícita del usuario.**
