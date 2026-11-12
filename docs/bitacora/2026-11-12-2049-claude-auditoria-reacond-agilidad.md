# Claude · Auditoría de agilidad de Reacondicionados (solo lectura)

## Pedido del dueño (12-nov-2026)
«Audita los procesos completos de los reacondicionados para hacerle mejoras y agilizar los procesos». No se cambió nada: solo consultas de lectura a la base (`equipos_refurbish`, `refurb_transiciones`, `equipo_historial`, `equipo_piezas_pedidas`, `equipo_tareas`, `equipo_fallas`) y lectura de `docs/REACONDICIONADOS-PROCESO.md`. La auditoría de errores (R01–R15) ya existe; esta mira tiempos y pasos.

## Datos (367 equipos; el estado real es `estado_evaluacion`; `estado` dice «Recibido» en todos)
- Tiempos (equipos creados desde el 15-ago): compra→asignado mediana 0.7 días (p90 14.6); asignado→terminado 5.9 (p90 17.8); terminado→despacho 0 (p90 50.9); compra→despacho 7.8 (p90 59.9).
- `refurb_transiciones` (desde el 24-oct, 495 filas): **todas con `admin@bayolcell.app`**. Historial de 60 días: Administrador 574, «Usuario» 68, Loribel 63, un técnico 1.
- Pasos que se pasan seguidos: `tecnico_recibio → listo_revision` en menos de 10 s en 66 de 68; `listo_revision → listo_venta` en menos de 10 s en 59 de 68 y **68 de 68 por la misma cuenta que lo envió** (calidad no la hace otra persona); `en_evaluacion` dura 0.
- Esperas reales: `evaluado` (sin técnico) mediana 3 h, p90 7 días; `en_proceso` (asignado, sin recibir) p90 8 días.
- Parados hoy: 62 en Listo para venta (73 días sin moverse de promedio), 33 Evaluados sin repartir (19 días), 10 En reparación (68 días), 8 en calidad (64 días), 4 sueltos con más de 80 días; 55 equipos en taller sin técnico. 131 Despachados sin «Cerrar salida».
- Sin uso: `equipo_tareas` 0 filas; `refurb_fotos` 0; `precio_venta_estimado` 0 en 60 días; piezas: 306 de 367 se quedan en «aprobada» (solo 43 «recibida», 4 «entregada»).
- Piezas en equipos Despachados sin descuento de Info Plus registrado: 57 (falta ver cuántas son de Info Plus y cuántas del inventario del taller).
- Fallas (60 días): cambiar batería 72, pulir pantalla 41, subir batería 31, housing 30, glass 15, marco 13.
- Despachos por tandas: 28 (8-nov), 18, 16, 16.

## Propuestas presentadas al dueño (ninguna aplicada)
1. Limpieza de parados (lista para decidir). 2. Flujo corto de 4 pasos con el QR del label. 3. Calidad real (otra cuenta) o quitarla. 4. Piezas en un paso. 5. Tablero «qué está parado». 6. Cierre automático de salida. 7. Cuenta propia por técnico.
