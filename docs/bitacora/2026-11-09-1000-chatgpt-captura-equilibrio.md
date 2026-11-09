# Captura guiada de gastos para noviembre — 09-nov-2026, 10:00 RD

## Pedido y decisión
El dueño quiere que su asistente, que no es contadora, mantenga los gastos de noviembre al día. Eligió B de las tres opciones: captura guiada dentro del módulo existente. Publicación no autorizada en este pedido.

## Fuente de verdad y alcance
`conta_equilibrio.gastos` conserva los importes; cada objeto puede incluir `captura` con estado, nota, comprobantes y autor/fecha. Las ventas/costos continúan saliendo de Info Plus. No hay otro libro de gastos ni cambios de fórmula. Se conserva el permiso de Contabilidad, sin otorgar acceso a nuevos empleados.

## Cambios
- Nuevos `conta-captura.js` y `.css`, cargados antes de Equilibrio, con versión en `taller.html`.
- Cada gasto admite Confirmado / Estimado / Por revisar, nota y hasta tres fotos/PDF de 8 MB. Un monto vacío está pendiente; un cero escrito puede confirmarse. Ayudas específicas para nómina, comisiones, préstamos, impuestos y repuestos.
- Avance global de las tres tiendas y comunes: confirmados, estimados, por revisar, sin monto y sin soporte. Un gasto positivo necesita comprobante o nota para contar la captura como lista.
- Cambiar concepto/monto invalida la confirmación; también al recalcular TSS, regalía o intereses. Copiar octubre convierte solo las filas copiadas en estimadas y quita sus soportes y notas, preservando la versión del mes destino.
- Los resultados incompletos dicen Provisional en pantalla y resumen exportado; Excel suma hoja Captura con estados, soportes y autor. Los vacíos no se exportan como cero. Un mes pasado no se etiqueta como cerrado automáticamente.
- Guardado atómico por mes con versiones esperadas, bloqueo de filas y rechazo del guardado desactualizado. Un doble toque no duplica guardados. Se bloquea cambiar de mes mientras sube un archivo.
- RPC `conta_equilibrio_guardar_captura`: SECURITY INVOKER, conserva RLS, valida meses/tiendas/estados/montos y existencia de los soportes; registra auth.uid real al cambiar un gasto. Sin privilegios para anon.
- Bucket `conta-comprobantes` privado con políticas limitadas al permiso de Contabilidad. Enlaces de lectura firmados por 60 s; no se guardan enlaces públicos. No se borran comprobantes automáticamente.
- Reversión con `localStorage.bc_captura_off='1'`.

## Qué hace solo
| Acción | Resultado |
|---|---|
| Cambia un monto | Pasa a Por revisar |
| Copia el mes anterior | Estimados, sin reciclar comprobantes |
| Confirma un cero | Lo distingue de un campo vacío |
| Falta un gasto/soporte | Mantiene el resultado como provisional |
| Otra persona guardó primero | Rechaza el guardado para no pisarlo |

## Textos nuevos
| Antes | Después |
|---|---|
| Solo monto | Estado, comprobante y nota opcional |
| Resultado a la fecha con gastos faltantes | Resultado provisional |
| Mes cerrado por ser pasado | Mes completo |
| Sin avance de captura | Confirmados / total y pendientes |

## Pruebas
- 11 pruebas de PostgreSQL efímero con PGlite 0.3.14: persistencia, cero explícito, permisos/RLS, identidad real, conflicto de versiones, atomicidad, documentos privados, ruta/mes y tiendas válidas.
- Nueve escenarios financieros comparados contra main base `99c053c`: resultados idénticos; casos adicionales de estados, cero y copia sin soportes viejos.
- Playwright Chromium a 390×844 y 1280×844, con archivos reales del módulo y estilos de taller.html: llenar, cambiar estado, nota, archivo inválido/válido, guardar, recargar, conflicto entre dos sesiones, copia, XSS escapado, sin permiso y reversión. Sin errores de JS ni desbordes horizontales. Controles nuevos ≥44 px; selectores y notas ≥48 px con letra de 16 px. Se inspeccionaron capturas.
- Pruebas de base y navegador usan datos ficticios. Autenticación, ventas y subida HTTP de Storage simuladas en el arnés; guardado usa la RPC SQL real en base efímera.
- SQL en producción solo de lectura para revisar políticas de Storage: no hay políticas globales que abran el nuevo bucket.

## Estado y limitaciones
- Migración `20261109133442_equilibrio_captura_guiada.sql` generada con Supabase CLI 2.81.3, preparada y NO aplicada. Sin cambios de datos/producto en producción.
- Requiere aplicar migración antes del frontend, con autorización de publicación. Instrucciones en `tests/conta-captura/README.md`.
- «Listo para revisión contable» no es certificación ni cierre bloqueado. La contadora sigue conciliando impuestos, cuota de préstamos y costos antes del resultado definitivo.
- No probado en Safari/iPhone físico ni contra Storage/Auth reales: se verificará después de publicar con autorización y soporte ficticio.
- Los archivos subidos sin guardar o cuyos conceptos se quitan pueden quedar sin referencia dentro del bucket privado; se conservan para no borrar evidencia. Límite de tamaño/cantidad en pantalla.
- No se ingresaron ni copiaron gastos reales de noviembre. No se enviaron mensajes ni se escribió en Info Plus.
