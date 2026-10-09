# AI BOARD — continuidad y corrección de reintentos

El propietario autorizó publicar cuando sea necesario. La publicación permanece condicionada a validar la integración real y los mapas; esa autorización no convierte pruebas simuladas en pruebas de producción.

Se detectó que el cliente descartaba el UUID de una consulta ante cualquier error HTTP inferior a 500. Un 409 de una respuesta todavía pendiente podía cambiar el UUID en el siguiente envío y producir otra consulta una vez terminada la primera. El servidor ahora distingue TURN_PENDING de TURN_FAILED; el cliente conserva el UUID ante 409 pendiente o indeterminado, y permite un nuevo intento ante fallo confirmado. Los errores de red y 5xx mantienen el UUID. La prueba de navegador reproduce 502, dos 409 pendientes y un 409 fallido, comprobando los identificadores y la conservación del borrador.

La página antigua de mensajes ya no permite enviar una respuesta mezclada con turnos históricos. El usuario puede redactar allí, volver a mensajes recientes y enviar sin perder el borrador. Enter respeta la misma restricción que el botón. Se actualizó la versión del script del chat para invalidar la caché.

Comprobaciones locales: 41/41 Node (incluye 10 Chromium y PostgreSQL/RLS), 2/2 Python y diff sin errores: 43 pruebas distintas. Consultar GitHub Actions del nuevo commit para sus resultados remotos y WebKit. No declarar aprobada la nueva ejecución hasta comprobarla.

Supabase get_cost sigue respondiendo UNAVAILABLE / tool not returned by tools/list. list_branches devuelve cero ramas de desarrollo. No se ha obtenido precio ni confirmation ID, creado infraestructura de pago, aplicado SQL ni desplegado la función. El acceso navegador anterior fue interrumpido por el usuario y no se ha reintentado. La prueba real, los mapas legítimos y QA de iPhone físico siguen pendientes. No se escribió main ni se publicó producción.

Referencias: [PR 108](https://github.com/sterlinr08-dte/bayolcell-taller/pull/108), [bitácora CI](2026-10-09-AI-BOARD-CI.md), [setup y smoke de staging](../../supabase/ai-board/README.md).
