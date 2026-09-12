# CLAUDE — ESPECIFICACIÓN VISUAL EXACTA CRM REDES BAYOL CELL

**Fecha:** 2026-09-12  
**Rama actual:** `chatgpt/crm-social-hub-20260912`  
**PR:** #46  
**Producción:** `main`  

> Claude: este archivo es la **fuente de verdad visual y de interacción** para la nueva interfaz `CRM > Redes`. Debes leerlo junto con `CRM_SOCIAL_HUB_CHATGPT.md` antes de modificar código.
>
> `main` es producción. **NO hacer push/merge a `main` sin autorización explícita del usuario para ese despliegue.**

---

# 1. OBJETIVO VISUAL

La nueva pantalla de Redes debe sentirse similar en organización a una bandeja social moderna tipo Meta Business Suite, pero manteniendo la identidad visual de BAYOL CELL y las reglas de UI existentes del sistema.

Debe ser:

- moderna;
- clara;
- compacta;
- rápida;
- informativa;
- dinámica;
- mobile-first;
- sin funciones duplicadas;
- sin tarjetas gigantes;
- sin botones decorativos;
- sin información falsa;
- basada únicamente en datos reales disponibles.

La interfaz NO debe ser una copia literal de Meta Business Suite. Debe tomar el concepto de navegación por canal + tipo de interacción y adaptarlo al CRM BAYOL CELL.

---

# 2. REGLA VISUAL CRÍTICA: SOLO DOS BARRAS

El usuario aprobó explícitamente una estructura de **DOS barras principales**.

## NO crear una tercera barra debajo

La tercera línea/barra de KPIs fue rechazada porque repetía lo mismo que la segunda barra.

Por tanto, la estructura correcta es:

```text
Encabezado general / búsqueda

┌──────────────────────────────────────────────────────────┐
│ BARRA 1 — RED SOCIAL                                    │
│ Instagram        Facebook        TikTok                  │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ BARRA 2 — TIPO DE INTERACCIÓN                           │
│ Todos   Mensajes   Comentarios   Menciones   Filtros     │
└──────────────────────────────────────────────────────────┘

CONTENIDO DINÁMICO
Interacciones / inbox / comentarios / menciones / posts
```

**No insertar otra fila visual entre la Barra 2 y el contenido para repetir:**

- mensajes sin leer;
- comentarios nuevos;
- menciones nuevas;
- canales conectados.

Esa información debe integrarse inteligentemente dentro de las dos barras o dentro del contenido.

---

# 3. ENCABEZADO GENERAL

Sobre las dos barras puede existir el encabezado de Redes.

Contenido recomendado:

```text
Redes Sociales
Gestiona tus mensajes, comentarios y menciones desde un solo lugar
```

A la derecha:

- búsqueda global;
- notificaciones;
- usuario/equipo actual si ya existe en el layout general.

## Búsqueda

Placeholder recomendado:

`Buscar en todas las redes...`

La búsqueda debe poder encontrar, cuando los datos existan:

- nombre de contacto;
- username;
- texto de DM;
- texto de comentario;
- publicación;
- lead relacionado.

No crear un buscador duplicado dentro de cada bloque si el buscador global ya cubre esa función. Los filtros específicos sí pueden existir donde sean necesarios.

---

# 4. BARRA 1 — SELECTOR DE RED SOCIAL

Esta es la barra superior más importante.

Debe contener exactamente los canales sociales del proyecto:

```text
Instagram | Facebook | TikTok
```

WhatsApp NO se agrega todavía a esta barra. El CRM WhatsApp actual se conserva separado hasta que el usuario autorice su unificación.

## Apariencia

Cada red funciona como una gran opción/píldora dentro de una sola barra redondeada.

Cada opción debe mostrar:

1. icono oficial/reconocible del canal;
2. nombre del canal;
3. cuenta/página conectada debajo o en texto secundario;
4. contador pequeño de pendientes/no leídos cuando exista dato real;
5. estado de conexión si es importante.

Ejemplo conceptual:

```text
[ Instagram                 12 ]
  @bayolcell

[ Facebook                   8 ]
  BAYOL CELL

[ TikTok                     3 ]
  @bayolcellrd
```

Los números anteriores son solo ejemplo visual. **Nunca hardcodearlos.**

## Canal activo

El seleccionado debe distinguirse claramente con:

- borde más definido;
- fondo suave del color del canal;
- texto con mayor contraste;
- sombra/glow muy sutil;
- sin exagerar el tamaño.

Referencias de color:

- Instagram: acento rosa/magenta/rojo suave;
- Facebook: azul;
- TikTok: negro con pequeños acentos cyan/magenta si encaja con el sistema.

El resto permanece neutro y limpio.

## Contadores

El badge de cada canal debe representar una métrica accionable, preferiblemente:

`total de interacciones pendientes/no leídas de esa red`

No usar números decorativos.

Si una integración todavía no existe:

- mostrar `Pendiente de integración` o estado equivalente;
- NO mostrar contador inventado;
- NO permitir acciones que aparenten funcionar.

---

# 5. COMPORTAMIENTO DE LA BARRA 1

Al tocar una red:

1. cambia el canal activo;
2. cambia dinámicamente la Barra 2;
3. se actualizan los contadores;
4. se actualiza el contenido principal;
5. se mantiene la misma estructura visual;
6. no se recarga toda la página;
7. el cambio debe sentirse inmediato/fluido;
8. conservar filtros compatibles cuando tenga sentido;
9. limpiar filtros que no existan en el nuevo canal.

Ejemplo:

```text
Instagram seleccionado
      ↓
Barra 2 muestra:
Todos | Mensajes | Comentarios | Menciones | Filtros
```

```text
Facebook seleccionado
      ↓
Barra 2 muestra:
Todos | Mensajes | Comentarios | Filtros
```

```text
TikTok seleccionado
      ↓
Barra 2 solo muestra capacidades realmente soportadas
```

---

# 6. BARRA 2 — TIPO DE INTERACCIÓN

La segunda barra es contextual a la red seleccionada.

Cada elemento debe ser una píldora compacta pero informativa.

Puede contener:

- icono;
- nombre;
- contador real;
- texto secundario corto.

Ejemplo aprobado conceptualmente:

```text
[ Todos 12 ]
  Todas las interacciones

[ Mensajes 5 ]
  DM y respuestas

[ Comentarios 6 ]
  Publicaciones y Reels

[ Menciones 1 ]
  Historias y etiquetas

[ Filtros ]
```

Los valores son ejemplo, nunca hardcodeados.

## No repetir KPIs debajo

Si `Mensajes` ya muestra `5`, no crear después otra tarjeta que diga `5 mensajes sin leer`.

Si `Comentarios` ya muestra `6`, no crear una tercera fila que vuelva a decir `6 comentarios nuevos`.

Este punto es obligatorio.

---

# 7. OPCIONES DE BARRA 2 POR CANAL

## Instagram

Debe poder tener:

```text
Todos
Mensajes
Comentarios
Menciones
Filtros
```

Definiciones:

- `Todos`: mezcla priorizada de interacciones del canal sin duplicar registros.
- `Mensajes`: Instagram Direct/DM.
- `Comentarios`: comentarios en posts/Reels soportados por integración.
- `Menciones`: menciones/story replies/etiquetas únicamente donde la API/integración real lo soporte.
- `Filtros`: menú flotante compacto.

## Facebook

Debe tener:

```text
Todos
Mensajes
Comentarios
Filtros
```

`Mensajes` = Messenger.

`Comentarios` incluye comentarios públicos. Las capacidades de `Private Reply` deben aparecer como acción dentro del comentario si están disponibles, no como una pestaña principal adicional salvo que exista una necesidad operacional futura demostrada.

## TikTok

La Barra 2 debe construirse a partir de `capabilities` reales.

Ejemplo futuro si existe soporte:

```text
Todos
Mensajes
Comentarios
Filtros
```

Pero si solo existe comentarios:

```text
Todos
Comentarios
Filtros
```

No mostrar una opción habilitada para una API que no esté conectada/autorizada.

---

# 8. FILTROS INTELIGENTES

El botón `Filtros` abre una ventana flotante compacta, no una pantalla gigante.

Filtros útiles:

- Sin responder;
- No leídos;
- Pendientes;
- Asignados a mí;
- Sin asignar;
- Respondidos;
- Convertidos a lead;
- Resueltos/archivados;
- fecha;
- sucursal/cuenta cuando aplique;
- publicación específica para comentarios.

Debe existir una forma clara de:

`Limpiar filtros`

No duplicar los mismos filtros en varias zonas.

---

# 9. CONTENIDO CUANDO ESTÁ SELECCIONADO `TODOS`

Debe iniciar inmediatamente después de la Barra 2.

No colocar una tercera línea de resumen.

El bloque principal recomendado es:

## `Interacciones recientes`

Mostrar tarjetas/filas compactas con:

- avatar;
- username/nombre;
- red social;
- tipo de interacción;
- preview del contenido;
- tiempo transcurrido;
- badge de estado;
- indicador de no leído;
- asignación si existe;
- prioridad si existe.

Tipos visuales:

```text
DM
Comentario
Mención
Messenger
```

Cada tarjeta debe poder abrir el detalle correspondiente.

### Orden inteligente por defecto

Priorizar:

1. sin responder;
2. no leídos;
3. mayor tiempo esperando;
4. leads/oportunidades activas;
5. resto por fecha descendente.

No usar orden puramente decorativo.

---

# 10. INFORMACIÓN IMPORTANTE SIN CREAR UNA TERCERA BARRA

La pantalla debe ser más informativa e inteligente, pero sin volver a añadir la fila eliminada.

La información crítica puede mostrarse en:

- badges dentro de las dos barras;
- pequeñas etiquetas dentro de cada interacción;
- encabezados de sección;
- panel de detalle;
- alertas contextuales puntuales.

Información prioritaria:

- cantidad pendiente/no leída;
- tiempo esperando respuesta;
- estado actual;
- agente asignado;
- canal;
- cuenta social;
- publicación de origen;
- si ya existe conversación privada relacionada;
- si ya existe lead;
- sucursal cuando sea relevante;
- última sincronización/conexión solo si hay una anomalía o es útil operacionalmente.

No convertir todo en KPIs.

---

# 11. ESTADOS VISUALES

Estados mínimos normalizados:

```text
Nuevo
No leído
Pendiente
Asignado
Respondido
En DM
Lead
Resuelto
Archivado
```

Usar chips pequeños, consistentes y de fácil lectura.

No llenar la interfaz de colores distintos. El color debe comunicar estado, no decorar.

---

# 12. VISTA `MENSAJES`

En PC:

```text
┌───────────────────┬─────────────────────────────┬───────────────────┐
│ Conversaciones    │ Chat                        │ Información        │
│                   │                             │ contacto/lead      │
└───────────────────┴─────────────────────────────┴───────────────────┘
```

La tercera columna puede ocultarse/compactarse si el ancho no alcanza.

Lista de conversaciones:

- nombre/username;
- avatar;
- último mensaje;
- tiempo;
- unread badge;
- canal;
- estado/asignación cuando sea útil.

Chat:

- conversación completa;
- media;
- estado de envío/lectura si existe;
- composer fijo abajo;
- PC: Enter envía, Shift+Enter nueva línea;
- móvil: botón flecha envía;
- conservar cursor/foco después de enviar donde sea viable;
- mensajes nuevos deben aparecer en Realtime sin refrescar.

Panel derecho:

- contacto;
- identidad social;
- tags;
- notas;
- lead relacionado;
- asignación;
- acciones comerciales válidas.

No repetir controles ya existentes en el chat.

---

# 13. VISTA `COMENTARIOS`

Debe permitir trabajar comentarios como una cola de atención separada de DM.

Desktop recomendado:

```text
┌──────────────────────────────┬────────────────────────────────────────┐
│ Lista de comentarios         │ Comentario seleccionado                 │
│ + post de origen             │ + post/contexto                         │
│                              │ + acciones                              │
│                              │ + conversación privada relacionada      │
└──────────────────────────────┴────────────────────────────────────────┘
```

Cada comentario debe mostrar:

- thumbnail del post/Reel;
- publicación de origen;
- usuario;
- texto;
- tiempo;
- estado;
- si ya recibió respuesta;
- si generó DM;
- si generó lead.

Acciones cuando la API/capability lo permita:

- Responder público;
- Enviar/continuar en privado;
- Asignar;
- Convertir a lead;
- Marcar resuelto;
- Ocultar/moderar solo si existe soporte real y permisos.

Si un comentario termina en conversación privada, mostrar claramente:

`Conversación privada relacionada`

con acceso directo al hilo.

---

# 14. VISTA `MENCIONES`

Instagram solamente si la integración real lo permite.

Mostrar:

- usuario;
- tipo de mención;
- contenido/origen;
- fecha/hora;
- preview de story/post cuando esté disponible;
- estado;
- acción válida de respuesta;
- convertir a lead si tiene sentido comercial.

Si la API no entrega una función, no inventarla.

---

# 15. PUBLICACIONES RECIENTES

En `Todos` o `Comentarios` puede existir un bloque secundario de `Publicaciones recientes` cuando aporte contexto.

Mostrar de forma compacta:

- thumbnail;
- título/caption corta;
- antigüedad;
- cantidad de comentarios pendientes/relevantes;
- total de comentarios/engagement solo si el dato es real y útil;
- click abre comentarios de esa publicación.

Este bloque NO debe convertirse en otra barra de navegación.

Debe ser contenido, no un tercer nivel repetitivo.

---

# 16. INTELIGENCIA OPERATIVA

La interfaz debe ayudar al equipo a saber qué atender primero.

Implementar progresivamente:

## Prioridad de atención

Calcular/derivar visualmente:

```text
Necesita atención
Esperando cliente
Respondido
Resuelto
```

## Tiempo esperando

Mostrar valores como:

```text
Ahora
5 min
28 min
2 h
```

Para conversaciones/comentarios pendientes, el tiempo debe calcularse desde la última interacción entrante que requiera respuesta.

## Relación con lead

Si existe lead:

`Lead · Contactado`

Si no existe:

acción contextual `Crear lead`.

## Asignación

Mostrar de forma discreta:

- Sin asignar;
- Mío;
- nombre del agente.

La asignación debe influir en filtros y prioridad.

---

# 17. DATOS EN TIEMPO REAL

Todos los siguientes deben actualizarse sin recargar la página cuando el backend lo soporte:

- badges de Barra 1;
- badges de Barra 2;
- nuevas interacciones;
- estado leído/no leído;
- último mensaje;
- comentario nuevo;
- respuesta saliente;
- asignación;
- estado de atención.

No provocar saltos de scroll molestos.

Si el usuario está leyendo una conversación y llegan mensajes nuevos del mismo hilo, mantenerlo al final solo si ya estaba al final. Si subió manualmente, no forzar scroll hacia abajo.

---

# 18. CONTADORES: DEFINICIÓN

Los contadores deben ser consistentes y accionables.

## Barra 1

Badge por canal = total de interacciones que necesitan atención en esa red.

Ejemplo conceptual:

```text
Instagram 12
Facebook 8
TikTok 3
```

## Barra 2

Badge por categoría = cantidad que necesita atención dentro de esa categoría y canal seleccionado.

Ejemplo:

```text
Todos 12
Mensajes 5
Comentarios 6
Menciones 1
```

La suma debe ser coherente con la definición de `Todos` y evitar doble conteo del mismo objeto.

Si una interacción está representada como comentario y luego abrió un DM, son dos entidades relacionadas pero no debe contarse dos veces en `Todos` si la regla funcional decide que el caso ya se trasladó a DM. Definir este comportamiento explícitamente durante implementación y documentarlo.

---

# 19. ESTADO DE CONEXIÓN

No ocupar espacio permanente con una tercera fila de estado.

Mostrar conexión de manera discreta en la Barra 1:

- punto verde / `Conectado`;
- aviso naranja si hay problema;
- `Pendiente de integración` cuando todavía no existe backend.

Si el webhook/última sincronización se considera degradado, mostrar alerta contextual pequeña.

No mostrar `Conectado` si no existe evidencia real.

---

# 20. RESPONSIVE — MÓVIL

La interfaz debe diseñarse primero para móvil.

## Barra 1

- Instagram/Facebook/TikTok en una fila horizontal;
- permitir scroll horizontal si el ancho es insuficiente;
- NO apilar tarjetas gigantes;
- mantener icono + nombre + badge visibles;
- cuenta secundaria puede abreviarse u ocultarse en teléfonos pequeños.

## Barra 2

- scroll horizontal suave;
- cada píldora compacta;
- nombre e icono siempre visibles;
- subtítulo se puede ocultar en anchos pequeños;
- badge permanece visible;
- `Filtros` accesible sin romper la fila.

## Contenido

`Todos`:
- lista vertical compacta.

`Mensajes`:
- lista de chats → tocar → reemplaza vista por chat;
- botón volver estándar;
- composer encima del teclado;
- no dejar el chat detrás del teclado.

`Comentarios`:
- lista → tocar → detalle;
- botón volver;
- acciones principales pegadas al contexto, no flotantes innecesarios.

No usar paneles de tres columnas en móvil.

---

# 21. RESPONSIVE — PC/TABLET

En PC puede aprovecharse el ancho, pero sin crear espacios vacíos enormes.

- contenido máximo legible;
- paneles compactos;
- lista y detalle simultáneos;
- no hacer botones gigantes;
- mantener jerarquía visual clara;
- permitir que el chat sea el foco principal.

En tablet usar dos paneles cuando quepan; si no, comportamiento tipo móvil.

---

# 22. TRANSICIONES Y ANIMACIONES

La interfaz debe sentirse fluida, no recargada.

Permitido:

- transición corta al cambiar canal;
- pill activa con desplazamiento/sombra suave;
- fade/slide corto al cambiar categoría;
- entrada discreta de nueva interacción Realtime;
- skeleton/loading breve donde haga falta.

Evitar:

- animaciones largas;
- rebotes exagerados;
- elementos que cambien de tamaño bruscamente;
- efectos que retrasen la operación.

Objetivo: sensación de app nativa moderna.

---

# 23. REGLAS DE DISEÑO BAYOL CELL

Respetar las preferencias globales del proyecto:

1. botones de tamaño normal;
2. no crear botones gigantes;
3. búsqueda mediante interfaz compacta;
4. guardar/cancelar/editar/eliminar/X/volver con convenciones estándar;
5. ventanas compactas;
6. no duplicar funciones;
7. no duplicar información;
8. estética moderna;
9. mobile-first;
10. acciones reales, no decorativas;
11. jerarquía clara;
12. evitar scroll horizontal general de la página; solo barras/carouseles específicos pueden desplazarse horizontalmente.

---

# 24. NO HACER

Claude NO debe:

- volver a crear la tercera fila de KPIs;
- poner `Mensajes`, `Comentarios` y `Menciones` arriba y volver a repetirlos en tarjetas inmediatamente debajo;
- meter WhatsApp en esta nueva barra sin aprobación;
- simular Facebook/TikTok con números falsos;
- crear tres CRMs independientes;
- hardcodear cuentas, números, sucursales o métricas;
- modificar el CRM WhatsApp estable para hacer esta fase;
- hacer una interfaz estática que solo se parezca al mockup;
- llenar la pantalla de métricas que no ayudan a responder clientes;
- crear botones que no tengan backend real;
- hacer push a `main` sin autorización explícita del usuario para ese despliegue.

---

# 25. JERARQUÍA FINAL APROBADA

```text
CRM
├── Mensajes  → WhatsApp actual
├── Leads
└── Redes
     │
     ├── BARRA 1
     │     ├── Instagram
     │     ├── Facebook
     │     └── TikTok
     │
     ├── BARRA 2 (contextual)
     │     ├── Todos
     │     ├── Mensajes
     │     ├── Comentarios
     │     ├── Menciones* según canal/capability
     │     └── Filtros
     │
     └── CONTENIDO
           ├── Interacciones recientes
           ├── Inbox/chat
           ├── Comentarios + post origen
           ├── Menciones
           └── Publicaciones recientes cuando aporten contexto
```

No existe una Barra 3.

---

# 26. CRITERIOS DE ACEPTACIÓN VISUAL

La interfaz no se considera terminada hasta cumplir todos:

- [ ] Solo hay dos barras sociales principales.
- [ ] No existe una tercera fila que repita los contadores de la segunda.
- [ ] Barra 1 contiene Instagram, Facebook y TikTok.
- [ ] Cada canal muestra cuenta/estado y badge solo con datos reales.
- [ ] Barra 2 cambia según el canal y capabilities.
- [ ] `Todos` mezcla interacciones sin duplicación visual.
- [ ] Mensajes abre inbox/chat real.
- [ ] Comentarios conserva contexto de publicación.
- [ ] Menciones solo aparece donde exista soporte real.
- [ ] Contadores son coherentes y Realtime.
- [ ] Estados, tiempo pendiente, lead y asignación aparecen de forma discreta pero útil.
- [ ] No hay funciones falsas.
- [ ] Móvil mantiene las dos barras compactas y usables.
- [ ] PC aprovecha ancho sin tarjetas gigantes.
- [ ] Volver a Mensajes/Leads restaura WhatsApp sin alteraciones.
- [ ] No se rompe ningún ID/handler existente del CRM actual.

---

# 27. ORDEN DE IMPLEMENTACIÓN VISUAL RECOMENDADO

1. Construir shell visual de Redes.
2. Barra 1 dinámica por canal.
3. Barra 2 contextual.
4. Estado `Todos` con datos reales disponibles.
5. Instagram Mensajes usando backend actual.
6. Instagram Comentarios cuando backend exista.
7. Instagram Menciones cuando capability exista.
8. Facebook Messenger.
9. Facebook Comentarios/Private Reply.
10. TikTok según APIs autorizadas.
11. Realtime de contadores y listas.
12. Leads/asignaciones/notas/tags.
13. QA móvil.
14. QA PC/tablet.
15. Validación visual con usuario.
16. Solo después, solicitar autorización para `main`.

---

# 28. FUENTE DE VERDAD

Para arquitectura/backend leer:

`CRM_SOCIAL_HUB_CHATGPT.md`

Para diseño/UX leer:

`CLAUDE_CRM_REDES_UI.md` (este archivo)

En caso de contradicción visual, **este archivo tiene prioridad para la UI aprobada más reciente**.

La decisión más reciente del usuario es inequívoca:

> **Dos barras arriba. La tercera línea se elimina porque repite la información. La interfaz debe ser más dinámica, informativa e inteligente, integrando la información importante sin duplicarla.**
