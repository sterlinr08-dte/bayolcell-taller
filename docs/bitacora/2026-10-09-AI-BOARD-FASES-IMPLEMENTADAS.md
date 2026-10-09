# BAYOL CELL AI BOARD — ejecución y límites de cierre

Fecha: 2026-10-09. Rama: `feature/ai-board-plan-iphone-x-plus`. PR #108 permanece en borrador. No se ha modificado main, desplegado código ni ejecutado DDL en producción.

La bitácora de traspaso sigue siendo el registro inicial; esta entrada actualiza la ejecución, no reemplaza las decisiones del propietario. Los commits remotos previos son `ac196ff10f6c9a48e64ad2ed9027f73d1ae086be` (endpoint/RLS) y `a3a57e1e9ddc64cf3fb5edbc06c3245be0cda738` (historial UI/visor vectorial).

| Fase | Código ejecutable en la rama | Evidencia y límite |
|---|---|---|
| Seguridad | Auth explícito, permiso, pertenencia/asignación vigente, RLS, cuotas, reserva idempotente, minimización y persistencia solo servidor | Pruebas PostgreSQL con roles anon/authenticated/service_role; no auditoría productiva completa |
| Chat e historial | Conversaciones por diagnóstico, seguimiento, paginación, eliminación, consentimiento y recuperación de errores | Endpoint real contra PostgreSQL local con proveedor simulado; faltan Auth/Edge/Anthropic reales en staging |
| BITMAP | Importador vectorial, caras, selección, búsqueda de redes aportadas, capas, consulta de componente con procedencia no verificada | Chromium y fixtures sintéticos; ninguna placa real/revisión certificada |
| Fotos HD | Generador lossless PNG, pirámide local, tiles visibles y caché limitada | Pruebas de píxeles y navegador; pendiente Safari/iPhone físico y originales legítimos |
| Biblioteca | Evidencia y fuente obligatorias, revisión independiente por administrador, sin autoaprobación, retirada y auditoría | SQL/RLS y UI probados; no se ha aprobado ninguna solución técnica real |
| Mantenimiento | Retención configurable 30–730 días, defecto 180 desde última actividad, purga servidor y cron opcional | PostgreSQL local; pg_cron no habilitado en la prueba, verificar scheduler de staging |
| Publicación | Scripts y documentación revisables, PR en borrador | No autorizada; requiere QA y aprobación del propietario |

## Resultado de pruebas

38 pruebas Node aprobadas: 14 endpoint, 11 PostgreSQL (incluye recorrido endpoint–SQL), 2 importador vectorial, 2 cálculo/validación de tiles y 9 Chromium con DOM real de Diagnóstico a 1200/390 px. Otras 2 pruebas Python aprobadas para pirámides de fotografía. Total: 40, sin fallos. Se revisó sintaxis y diff whitespace. El SDK/Auth y el proveedor son dobles en las pruebas de navegador; la prueba integrada del endpoint usa SQL/RLS reales sobre PGlite. No confundir con una sesión Supabase/Anthropic real.

## Pendientes que requieren evidencia externa

No existe una rama Supabase de pruebas en el proyecto conectado. No se creó una rama de pago ni se reutilizó producción. Hace falta un proyecto/branch independiente y configuración del proveedor para verificar el chat real sin alterar producción.

Las imágenes recibidas no son boardviews eléctricos. No se obtuvo un paquete legítimo que autorice redistribución de mapas iPhone X+. El formato de ingesta y visor están desarrollados; la cobertura eléctrica sigue vacía hasta recibir una placa real, revisión y permiso comprobables. No se incorporaron datos de descargas sin licencia.

Falta QA con técnicos en casos no enciende/no carga/sin imagen, iPhone/Safari físico y navegación completa del Taller (CRM/USB/panic). Las pruebas actuales montan el DOM de Diagnóstico y preservan controles legados; no prueban el hardware USB ni todo el CRM. Adjuntos foto/voz al chat no están habilitados: no hay storage privado revisado. Las fotos del visor permanecen locales.

No afirmar proyecto terminado ni autorizar uso eléctrico mientras falten estas evidencias. La definición de terminado de la bitácora incluye publicación/postdeploy; esas acciones siguen requiriendo autorización expresa.
