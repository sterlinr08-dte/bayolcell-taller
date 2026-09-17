# Auditoría de rendimiento — BAYOL CELL Taller

Fecha: 16 de septiembre de 2026
Estado: Fase 1 implementada en rama `chatgpt/perf-phase1-20260916`; NO publicada en `main` al crear este documento.

## Objetivo

Reducir tiempo de arranque, trabajo de CPU/DOM y consultas innecesarias sin cambiar lógica de negocio, Caja, Financiamiento, MDM ni integridad de datos.

## Evidencia principal

- `taller.html` ronda 2.63 MB sin comprimir y concentra la mayor parte de la app.
- `_loadAllImpl()` ejecuta 17 consultas en paralelo, varias con `select('*')`.
- El poller de respaldo ejecutaba `loadAll()` cada 60 segundos mientras la pestaña estaba activa y sin modal.
- El canal Realtime global escucha eventos de `public`; antes de esta fase, eventos ajenos a las 17 tablas de `loadAll()` podían terminar provocando una recarga completa.
- `crm-marketing-consent.js` cargaba automáticamente las capas de Facebook/Instagram/TikTok aunque el usuario no entrara al CRM.
- El botón Actualizar del CRM estaba interceptado por una capa externa que ejecutaba `window.location.reload()`, aun cuando `renderCrmLinea()` nativo ya captura/restaura posición y puede refrescar únicamente el módulo.
- `crm-marketing-consent-legacy.js` hacía `document.querySelectorAll()` sobre todo el documento ante cada mutación del DOM.
- `crm-social-polish-v2.js` reaccionaba a cualquier mutación del subtree del CRM durante 120 segundos.

### Volumen observado en Supabase

Consulta de solo lectura realizada durante la auditoría:

- `ordenes_reparacion`: ~301 filas.
- `tareas_trabajo`: ~724 filas.
- `equipos_refurbish`: ~222 filas.
- `whatsapp_mensajes`: ~26,815 filas.
- `whatsapp_hilos`: ~3,358 filas.
- Línea WhatsApp "Reparación": ~2,034 hilos.
- Máximo observado de mensajes en un hilo: 1,174.
- Promedio: 8.9 mensajes por hilo; p95: 26.

Las estadísticas acumuladas de PostgreSQL desde el 7 de mayo de 2026 muestran cientos de miles de ejecuciones de lecturas repetidas de tablas del Taller, lo que confirma que el problema prioritario no es el tamaño actual de esas tablas sino la frecuencia de recarga.

## Fase 1 implementada

### 1. Poller de respaldo

Nuevo runtime: `taller-performance-phase1.js`.

- Intervalo: 60 s → 5 min.
- Realtime continúa siendo la vía principal.
- Si la pestaña vuelve a primer plano después de más de 5 min, se hace una actualización de seguridad.
- No actualiza mientras hay un modal abierto ni mientras `loadAll()` ya está en curso.

Impacto teórico del poller: 80% menos recargas completas periódicas.

### 2. Filtro del Realtime global

Solo se permite que el handler general de `loadAll()` procese cambios de las 17 tablas que realmente forman parte del cache general:

`ordenes_reparacion`, `clientes`, `equipos`, `piezas_inventario`, `activos_taller`, `equipos_refurbish`, `proveedores`, `refurb_lotes`, `articulos`, `tecnicos`, `usuarios`, `orden_piezas`, `tareas_trabajo`, `equipo_piezas_pedidas`, `fallas_comunes`, `config_taller`, `orden_notas`.

Los módulos CRM mantienen sus canales específicos.

### 3. Instrumentación local

`window.BayolPerformance.getSnapshot()` devuelve métricas locales de:

- cantidad de `loadAll()`;
- duración de la última carga;
- duración máxima;
- eventos Realtime aceptados/ignorados por tabla;
- estado del poller.

No se envía telemetría a servicios externos.

### 4. Actualización del CRM sin recargar toda la app

Se eliminó la intercepción que hacía `window.location.reload()` al pulsar Actualizar. La app vuelve a usar `renderCrmLinea()` nativo.

### 5. Carga diferida de extensiones CRM

Se mantiene inmediato el consentimiento de marketing porque se usa en Recepción. Las capas sociales de Facebook/Instagram/TikTok, sus efectos y message-loading se solicitan cuando `#v-crmLinea` se activa.

### 6. MutationObservers

- Consentimiento: inspecciona solo nodos agregados; ya no reescanea todo el documento por cada mutación.
- Polish social: solo reacciona a estructura social relevante y se desconecta a los 15 s; además usa reintentos finitos de arranque.

## Siguiente fase recomendada

1. Paginar `whatsapp_hilos`: primera página 50–60 conversaciones y carga incremental al bajar.
2. Paginar `whatsapp_mensajes`: últimos 50–80 mensajes y carga histórica al subir.
3. Sustituir `loadAll()` por refrescos parciales por tabla/módulo para eventos Realtime.
4. Cargar QZ Tray, html2canvas, JsBarcode, Chart.js y QRCode bajo demanda; hoy están en el camino inicial.
5. Dejar de renderizar todas las vistas en la primera ejecución de `renderAll()`; pintar solo la vista activa.
6. Medir consultas restantes y agregar únicamente índices respaldados por planes/uso real.

## Criterios de aceptación de Fase 1

- Abrir Dashboard, Reacondicionados, Órdenes, Recepción y CRM sin errores de consola.
- Confirmar que un cambio de una tabla del Taller sigue apareciendo por Realtime.
- Confirmar que mensajes nuevos de WhatsApp siguen llegando por el canal específico del CRM.
- Pulsar Actualizar dentro del CRM y confirmar que no ocurre navegación/reload de página.
- Dejar abierta una pantalla >60 s y verificar que no se ejecuta `loadAll()` cada minuto.
- Consultar `BayolPerformance.getSnapshot()` y verificar `backupPollMs = 300000`.
- Confirmar que el consentimiento de promociones continúa apareciendo en Recepción.
- Entrar al CRM y confirmar que Redes/Facebook/Instagram cargan normalmente bajo demanda.
