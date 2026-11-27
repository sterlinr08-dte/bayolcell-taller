# 2026-11-27 10:30 RD · Claude — WhatsApp: «Sin confirmar» y llave de envío (sin publicar)

## Qué pasó (27-nov, 9:37 RD)
- El dueño mandó una foto del CRM con errores 502 en la consola.
- En los registros (`whatsapp-enviar`) hubo **3 envíos con 502 y el 4.º salió bien** para Rafely («como en 8500»).
- Zernio dijo que **Meta respondió «Something went wrong» (131000) y no dijo si entregó**: «it may have reached the recipient».
- El cliente pudo recibirlo hasta 4 veces. Eso no se puede ver desde el sistema.
- Fue un caso **aislado**: en las 24 h anteriores, 55 envíos salieron bien y no hubo otros 502.

## Decisión del dueño
- Eligió **B («hazlo smart»)**.
- Antes de programar se verificó en docs.zernio.com (Send message / Idempotency) que, cuando el envío falla (no 2xx), **Zernio suelta la llave**: reintentar con la misma llave **sí puede duplicar**. Por eso un reintento automático no es seguro.
- El dueño aprobó («Si») el plan sin reintento automático.

## Cambios
**`supabase/functions/whatsapp-enviar/index.ts`** (desplegado hoy: v26, idéntico al repo antes del cambio):
- Recibe `envio_id` (uuid) y lo manda como **`Idempotency-Key`** a Zernio en texto, adjuntos y nota de voz.
  - Va como parámetro de cada envío, no global, para que dos envíos simultáneos no se crucen.
  - Las plantillas siguen como antes.
- El reenvío sin cita tras un 4xx va **sin llave**: el cuerpo cambia y nada había salido.
- Cuando Zernio responde con un **5xx** (Meta falló), devuelve `error: "envio_dudoso"` con el mensaje «WhatsApp dio un error y puede que el mensaje sí haya llegado. Revise el chat antes de reenviar.».
- Un **409** que menciona la llave (todavía en proceso) también va como `envio_dudoso`.
  - Un 409 por «otra app controla el chat» sigue como error normal.
- **Nunca reintenta solo.**

**`taller-app.js`** (`enviarMensajeWhatsapp`), versión `taller-app.min.js?v=20261127-dud1` (el robot minifica al unir):
- Cada burbuja nueva lleva su `envio_id`. «Reintentar» la **misma** burbuja reusa la llave: si el primero sí salió (corte de internet, doble toque), Zernio no lo duplica.
- `envio_dudoso`, `zernio_timeout` y la espera vencida marcan la burbuja como **«⚠️ Sin confirmar · puede que sí haya llegado · Reenviar»**, en ámbar, con un aviso oscuro en vez del rojo.
  - El texto **no vuelve a la caja de escribir**, para que nadie lo reenvíe sin querer.
- **Reenviar** (`_waReenviarDudoso`):
  - en los primeros 10 s dice «Espere X s y revise el chat del cliente»;
  - después pregunta «¿Reenviar? … el cliente lo recibirá doble».
- **Confirmación automática** (`_waVigilarDudoso`): a los 8, 20 y 45 s busca si el mensaje apareció en `whatsapp_mensajes`. Usa la misma regla que `alVencer` y `_waEsFilaDeMiEnvio`.
  - Si apareció, quita el aviso y muestra «✅ Confirmado: el mensaje sí llegó».
  - **No verificado:** si Zernio manda el reflejo del mensaje (`message.sent`) cuando Meta dio ese error. Si no lo manda, el aviso se queda y el empleado decide.

## Pruebas
- Sintaxis: `node --check taller-app.js` sin errores; la función, transpilada con esbuild, sin errores.
- Prueba de unidad de las funciones nuevas con datos simulados:
  - burbuja con «Sin confirmar» y botón de 44 px;
  - antes de 10 s no reenvía;
  - si se responde «no», no reenvía; con «sí», reenvía una vez;
  - las revisiones a 8, 20 y 45 s se programan;
  - sin fila sigue sin confirmar; cuando la fila aparece, se confirma.
- **No probado:** un error real de Meta. No se puede provocar.

## Para publicar
- Desplegar `whatsapp-enviar` v27 (con `_shared/ortografia.ts` igual) y unir el PR.
- El robot genera `taller-app.min.js`.
