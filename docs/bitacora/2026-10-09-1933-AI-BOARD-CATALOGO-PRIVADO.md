# AI BOARD — catálogo privado de fotografías

Continuidad después de publicar PR 108, main 9498ef7deb74d344be4c27206d22ce218cc2cf1d. El propietario pidió continuar con los pendientes; la autorización de publicación permanece vigente.

## Implementado

Catálogo en BITMAP usando las tablas existentes placas_mapas y el bucket privado placas. Filtra Apple/modelo y pagina 20 fotos; no carga automáticamente archivos ni crea enlaces públicos. Descarga mediante Storage con la sesión autorizada y limpia el visor al cambiar modelo o identidad. Texto de títulos/procedencia mediante textContent. No consulta órdenes ni clientes, ni llama al proveedor IA.

Registro de fotografía propia PNG/JPEG/WebP hasta 35 MB y 80 MP, después de decodificar y obtener consentimiento. Exige título, revisión, cara y permiso/procedencia declarados; guarda el original sin recomprimir, SHA-256 y metadatos en notas bajo bayol-photo-catalog/1. Conserva los metadatos del original; el formulario advierte no incluir personas, claves ni datos de clientes. Upsert false y ruta aleatoria por usuario. La foto siempre figura sin validación eléctrica; no añade pines, redes ni mediciones.

Storage y la inserción de metadata no son una transacción conjunta. Si la inserción responde con error, consulta el UUID generado: si existe lo conserva; si confirma ausencia intenta retirar solo el objeto recién creado. Si no puede comprobar el registro, conserva el archivo y avisa que debe recargarse/revisarse antes de repetir. Un cierre/cambio de sesión durante la subida puede dejar un archivo sin registro; requiere revisión administrativa, no se borra con otra identidad ni se inventa éxito. Este límite está probado/documentado y no equivale a una carga atómica.

## Verificación

50 pruebas distintas locales aprobadas: 33 Node/PostgreSQL/ingestores, 15 Chromium y 2 Python. Casos nuevos: permiso denegado antes de acceder a tabla/Storage, filtro/modelo, títulos como texto, descarga tardía tras signout, consentimiento, procedencia/hash, fallo confirmado frente a incierto y limpieza limitada. El mock no constituye una subida real autenticada; aún no se han cargado fotografías reales.

Metadatos de producción verificados con consultas de solo lectura: bucket placas privado, límite 50 MB, política Diagnóstico, tablas existentes y cero mapas. Se detectaron grants ALL para anon/authenticated. catalog_access.sql retira grants a public/anon y TRUNCATE/REFERENCES/TRIGGER a authenticated; conserva SELECT/INSERT/UPDATE/DELETE bajo las políticas actuales y permisos servidor. Prueba con el SQL real upstream de placas, en PostgreSQL aislado: anon no accede ni trunca, authenticated no trunca, actor autorizado inserta y actor inactivo no lee/inserta. No se reescriben las políticas de compartición: fotografías visibles para usuarios autorizados de Diagnóstico, no conversaciones individuales.

Consultar el PR de esta fase para aplicación de permisos, resultados remotos Chromium/WebKit y publicación. SQL de sesiones/Biblioteca y endpoint IA no aplicados/desplegados; no existe staging. get_cost permanecía UNAVAILABLE; no se vuelve a insistir en la operación fallida ni se inventa precio/confirmation ID. Un intento de consulta a otro proyecto fue rechazado por revisión automática por estar fuera del alcance. No se reutiliza ese proyecto, que tiene funciones activas. No se cargaron datos ni se hicieron llamadas reales a Anthropic.

## Uso por el técnico

Entrar en Diagnóstico → BITMAP, seleccionar modelo y abrir Fotografías del taller. Cargar catálogo o Registrar fotografía de placa. Usar una foto propia/legítima de placa y su revisión real; nunca una imagen de publicidad ni una ilustración. Registrar fotos no valida referencias eléctricas. Hace falta revisión con documentación y hardware para declarar una placa verificada.

Referencias: [Supabase Storage upload](https://supabase.com/docs/reference/javascript/file-buckets-upload), [Storage access control](https://supabase.com/docs/guides/storage/security/access-control), [formato HD](../AI_BOARD_PHOTO_PYRAMID.md), [backend pendiente](../../supabase/ai-board/README.md).
