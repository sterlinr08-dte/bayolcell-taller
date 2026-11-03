# 3-nov-2026 01:00 RD — Auditoría de rapidez del sistema del taller (solo medir; nada cambiado) (Claude)

## Solicitud del dueño
Reel de @sebas.soto222 «5 maneras para mejorar la rapidez de tu App» (interfaz que espera al servidor, JSON sin comprimir,
HTML generado en cada visita, escrituras una por una, cuello de botella) → «Hazlo con el de Bayol».

## Medidas
### Página (bayolcell.com/taller.html)
- 35 scripts + 32 hojas de estilo; locales 2.7 MB sin comprimir. `taller-app.min.js` 1.84 MB → **472 KB comprimido** (gzip activo, caché 10 min).
- Banco local (sin red): primera carga ≈ 2.1 s hasta DOMContentLoaded; tareas largas al arrancar 684 + 491 + 441 + 282 ms (≈ 1.7 s de bloqueo); 4,553 nodos.

### Datos al entrar y cada 60 s (`_loadAllImpl`)
- Pide **17 tablas completas** (`select *`): tareas_trabajo 832 filas (137 KB), ordenes 336 (87 KB), refurbish 278 (76 KB),
  piezas pedidas 308 (44 KB), equipos 294, clientes 238… ≈ 460 KB por vez. infoplus_articulos 2,136 filas (412 KB) aparte.
- Se repite **cada 60 s** en cada pestaña abierta (`startAppRefurbPoller`, además del tiempo real) y **después de cada guardado**
  (`await loadAll()` en 85 lugares): cada acción espera a que se recarguen las 17 tablas antes de seguir.

### Base de datos (pg_stat_statements desde mayo-2026)
- El tiempo real (lectura del WAL) es lo que más trabaja: 14 millones de llamadas, ≈ 130,000 s. Tablas publicadas: 10 (chats, mensajes, leads, notas, alarma_videos…).
- `crm_no_leidos_count`: 81,755 llamadas, 8.7 ms (barata).
- Llamadas a funciones desde la base (`net.http_post`): ≈ 137,000.

### Funciones del servidor (últimas 24 h)
| Función | Llamadas | Promedio | p95 |
|---|---:|---:|---:|
| social-automatizaciones | 718 | 5.1 s | 10.4 s |
| infoplus-sync | 48 | 4.1 s | 6.0 s |
| whatsapp-enviar | 514 | 1.4 s | 3.4 s |
| whatsapp-webhook | 6,791 | 0.7 s | 3.0 s |
| whatsapp-ia-responder | 1,826 | 1.2 s | 3.1 s |
| push-enviar | 1,834 | 0.6 s | 0.9 s |

## Contra los 5 puntos del video
1. Interfaz que espera al servidor → **sí**: 85 guardados esperan `loadAll()` completo.
2. JSON sin comprimir → no: hay gzip. Pero se baja **todo** cada 60 s.
3. HTML generado en cada visita → no: GitHub Pages estático.
4. Escrituras una por una → a revisar caso por caso (no medido aún).
5. Cuello de botella → `loadAll()` (cada 60 s y tras cada guardado) y `social-automatizaciones` (5–10 s).

## Propuesta ordenada (para que el dueño elija; nada aplicado)
1. Tras guardar, actualizar solo lo que cambió (no las 17 tablas) → acciones al instante.
2. Recarga de 60 s solo de lo que cambió desde la última vez (`actualizado_en > última`) o solo si el tiempo real se cayó.
3. Partir `taller-app.min.js` por módulos (cargar CRM/Reacond/POS al entrar a cada uno) → arranque más rápido en celular.
4. Revisar `social-automatizaciones` (5–10 s cada ~2 min).
5. Tareas y órdenes cerradas viejas: no traerlas todas al entrar.
