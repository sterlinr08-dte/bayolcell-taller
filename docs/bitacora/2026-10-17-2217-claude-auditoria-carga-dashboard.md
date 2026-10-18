# Auditoría (solo lectura): qué baja el Dashboard de Bayol Cell al abrir — idea «una consulta por pantalla»

## Pedido del dueño
- Después de publicar en STUDIO el Tablero de una sola consulta (59.96), dijo «Continuamos»: medir el Inicio de Bayol con la misma idea.

## Hallazgos (código + tamaños medidos en `vkhwdvjtowrhkhqavnvk`, solo lectura)

**`loadAll` baja 17 tablas completas**
- `_loadAllImpl` (taller-app.js:2545-2606) hace 17 consultas `select=*` en paralelo, sin límite. Son unos **1.4 MB** en cada carga:

  | Tabla | Filas | Peso |
  |---|---:|---:|
  | `ordenes_reparacion` | 336 | 480 KB |
  | `tareas_trabajo` | 784 | 312 KB |
  | `equipos_refurbish` | 250 | 309 KB |
  | `equipo_piezas_pedidas` | 286 | 152 KB |
  | `equipos` | 294 | 73 KB |
  | `clientes` | 231 | 60 KB |

- `loadAll` vuelve a correr completo en estos casos:
  - cada 5 min (taller-performance-phase1.js:100);
  - con cada cambio en `orden_notas` por Realtime;
  - al volver a la pestaña después de 60 s.

**El aviso de mensajes sin leer**
- Está en taller-pestana-avisos.js:113.
- Baja hasta 2000 filas de `whatsapp_hilos`, `instagram_hilos` y `social_hilos`, **cada 20 s**, solo para mostrar un número. Hoy son 828 hilos de WhatsApp sin leer.
- Corre también en `focus` y en `visibilitychange`, o sea dos veces seguidas.

**Lo que muestra el Dashboard**
- Son conteos y agregados (KPIs, demoras, carga por técnico, productividad) más 5 órdenes recientes.
- 9 de las 17 tablas no se usan en el Dashboard: se bajan porque `cache` alimenta toda la app.

## Propuesta (no implementada)
1. **Rápida y de bajo riesgo:** RPC `crm_no_leidos_count()` que devuelva solo el número, en vez de bajar miles de filas cada 20 s.
2. RPC `dashboard_resumen()` con los KPIs, demoras, carga por técnico, productividad y recientes. Quitar `loadAll` del arranque exige que cada vista cargue lo suyo; eso es más grande y va por partes.

## Riesgo por revisar
- Ninguna de las 17 consultas pagina. Si el tope `max_rows` de PostgREST es 1000, las tablas se recortarán en silencio al crecer: `tareas_trabajo` ya va por 784.

## Estado
- Solo lectura. Nada cambiado.
