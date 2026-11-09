# Captura guiada — autorización y publicación

El dueño pidió «Enséñame», vio las capturas de celular y PC, y respondió «Hazlo». Se toma como autorización para poner en marcha esta entrega concreta (PR #263), ya preparada y probada. No se publica la auditoría separada de PR #262.

Migración `20261109133442_equilibrio_captura_guiada.sql` aplicada a BayolCell-taller (`vkhwdvjtowrhkhqavnvk`) antes de publicar el frontend. Verificados bucket privado, límite de 8 MB, tipos permitidos, políticas SELECT/INSERT con permiso de Contabilidad y RPC SECURITY INVOKER con search_path vacío, acceso authenticated y sin acceso anon. La huella de los cuatro registros de conta_equilibrio coincide antes/después: no se cargaron gastos de noviembre ni se modificaron históricos.

Advisors de seguridad ejecutados: sin hallazgos sobre la nueva RPC o el bucket; los avisos de otros objetos quedan fuera de esta entrega. Pruebas previas: 11 de base, 9 escenarios de cálculo y navegador a 390/1280; el código funcional revisado sigue en de15df6, sin cambios posteriores.

Publicación por GitHub Pages mediante PR #263. Pendiente verificar la entrega de los archivos al finalizar el despliegue. Prueba completa con sesión real del empleado y Storage, y Safari/iPhone físico, pendientes; no se crean sesiones ni se usan gastos reales para pruebas. Reversión visual: `localStorage.bc_captura_off='1'` y recargar. Procedimiento en tests/conta-captura/README.md.
