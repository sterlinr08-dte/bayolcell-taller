# 25-oct-2026 (RD) · Claude · Correcciones de la auditoría del módulo Solicitudes — rama sin publicar

## Origen
El dueño pegó la «Auditoría del módulo Solicitudes — CRM Bayol Cell» (revisión 52e8835, hecha antes de #120 y #121).
Se verificó cada hallazgo contra `main` actual y la base real antes de tocar nada.

## Verificado en la base real
- S01 y S02 son ciertos: leer y editar solo exigen `app_is_admin() OR app_actor_es_tecnico_activo()`; `authenticated`
  tiene INSERT/UPDATE/DELETE sobre la tabla. Ninguna pantalla escribe la tabla directo (solo lee y llama a la RPC).
- Ya existen `app_actor_tiene_permiso(text)` y `app_actor_sucursal_id()`.
- Empleados activos: Loribel Ventura e Yves Bayol NO tienen sucursal ni permiso de financiamiento (Loribel envió la No. 3).

## Corregido en esta rama (sin publicar)
| Hallazgo | Arreglo |
|---|---|
| S04 | `solicitud.html`: sin red o sin respuesta en 20 s avisa, deja reintentar y conserva lo escrito; el botón nunca se queda en «Enviando…». |
| S05 | Edge `whatsapp-flow-financiamiento`: distingue error de guardado de «ya enviada»; el enlace se conserva y un reintento recibe «ya llegó» con su número; si falla la tarjeta del chat o el aviso después de guardar, el cliente igual recibe confirmación y queda en el log. |
| S07 | Cédula de un solo dígito repetido (000…, 111…) rechazada en la página y en el servidor. |
| S09 | El número rojo y «en proceso» incluyen las aprobadas por entregar; el resumen respeta la sucursal elegida. |
| S10 | Vista previa del chat: «✅ Se le confirmó al cliente que llegó su solicitud» (función y webhook). |
| S11 | La ficha abierta se actualiza al recargar y avisa si otro compañero la cambió; ya no se inventa un guardado si el servidor no confirma. |
| S12 (parcial) | Historial completo de cambios en la ficha (paso, antes, fecha, quién, nota). Falta responsable y próxima gestión. |
| S06 (parcial) | Se traen todas las abiertas sin tope + las 300 más recientes; «Ver seguimiento» busca por id aunque no esté en la lista. |
| S03 (pantalla) | Pasos en orden directo (con confirmación en Aprobada/Rechazada/Entregada/Cancelada); otro cambio = corrección con motivo. |
| S14 (parcial) | Pasos ocultos del formulario quedan `inert`. |
| S15 | «Cambiar» en el resumen vuelve directo con «Guardar y volver al resumen»; botones Cambiar de 44 px. |
| S16 | Las pruebas fallan con errores de página; nuevos casos: caída de red, cédula de ceros, cambiar y volver, cambio de chat (R01). |
| R01 | El aviso solo se escribe si el chat abierto sigue siendo el de la solicitud y pregunta antes de reemplazar un borrador. |
| R02 | Respuesta del formulario de WhatsApp: token de otra línea no se acepta; equipo, precio y referencia salen de la solicitud original. |

## Pendiente de decisión del dueño (borrador NO aplicado: `docs/sql/BORRADOR-solicitudes-permisos.sql`)
- S01: ¿cada empleado ve solo su sucursal (y lo que él envió) o todas? Loribel e Yves necesitan sucursal y permiso.
- S02: quitar a la pantalla el permiso de escribir la tabla (solo la función del servidor).
- S03 en el servidor: pasos en orden y corrección solo con motivo y permiso de aprobar.

## No hecho todavía
S08 (evidencia del permiso del cliente), S12 responsable/próxima gestión, S13 (clave para no duplicar enlaces), S14 foco
de la ficha, paginación real en servidor. Necesitan diseño aparte.

## Pruebas
`solicitud-web.cjs` 390 OK / 1280 OK (2 corridas), `solicitudes-crm.cjs` 390 OK / 1280 OK, `flow-financiamiento.cjs` 390 OK / 1280 OK.
Las funciones del servidor se revisaron con el compilador de TypeScript (sintaxis OK); se despliegan solo con «publícalo».
