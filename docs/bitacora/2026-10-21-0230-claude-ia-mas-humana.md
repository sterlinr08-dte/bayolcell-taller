# 21-oct-2026 · Agente de IA de WhatsApp: respuestas más humanas (ejemplos, correcciones, personalidad, modelo nuevo)

## Pedido del dueño
«Cómo se entrenan más los agentes para que respondan bien, más humano y un poco más informal».
Preferencias: **usted**; emojis **muy poco**; frases «estimado / estimada»; **no usar «mi amor»**; largo: **interpretar lo que el cliente escribe**.
Luego: «vamos a aplicar las 4 mejoras».

## Diagnóstico (solo lectura, Supabase `vkhwdvjtowrhkhqavnvk`)
- `whatsapp_ia_conocimiento`: **vacía** (servicios, políticas, preguntas frecuentes y personalidad en blanco).
- El prompt no tenía ejemplos, solo la regla «tono dominicano, breve».
- `whatsapp_ia_sugerencias`: 17 enviadas y 4 editadas de unas 1,140.
- Modelo `claude-haiku-4-5`.
- Respuestas reales de los empleados (unas 50 mil salientes): muchas con mayúsculas sostenidas, faltas y la dirección pegada fuera de contexto. **No se usaron crudas: se limpiaron.**

## Cambios
1. **Ejemplos** — tabla nueva `whatsapp_ia_ejemplos`:
   - campos: cliente, respuesta, tema, fuente real/correccion/manual, activo;
   - RLS: solo admin; anon sin acceso;
   - **42 ejemplos** sacados de chats reales y limpiados: usted, sin precios, sin promesas de disponibilidad;
   - temas: financiamiento Ademi, venta, reparación, seguimiento, ubicación y cierre.
2. **Aprender de las correcciones:**
   - columna nueva `whatsapp_ia_sugerencias.texto_final`;
   - trigger `trg_wa_ia_capturar_correccion` (AFTER INSERT en `whatsapp_mensajes`): si en los 30 minutos anteriores un empleado usó «Editar» en una sugerencia del mismo chat, guarda el texto que realmente mandó;
   - si el texto cambió, el par cliente → respuesta pasa a ejemplos (`fuente = 'correccion'`);
   - filtra palabras de cariño;
   - nunca bloquea un envío (`exception when others then return new`).
3. **Personalidad y datos del negocio** en `whatsapp_ia_conocimiento` (solo se llenaron porque estaban vacíos; el dueño los edita en CRM → Agente de IA):
   - personalidad: usted, «Buenas, a la orden», estimado/a solo si el nombre lo deja claro, emojis casi nunca, interpretar faltas, una pregunta a la vez;
   - servicios, políticas del financiamiento con el Banco Ademi y política de precios.
4. **`whatsapp-ia-responder` v30** (verify_jwt false, como antes):
   - modelo `claude-haiku-5-5` en borradores, clasificador y saludo;
   - el borrador recibe `<ejemplos>`: las 6 correcciones más recientes más los 10 ejemplos que más palabras comparten con el mensaje del cliente;
   - también recibe el nombre del contacto, ambos en el mensaje de usuario y no en el system;
   - reglas 1, 1b y 1c nuevas de tono y largo;
   - los saludos y los textos fijos pasan a usted («Le paso nuestras sucursales…», «le sale en», «En cuál sucursal le queda mejor»);
   - el saludo del precio automático pasa de «Hola! 👋» a «Buenas, a la orden».
   - La regex de acentos `[̀-ͯ]` pasa a escritura con escapes en `index.ts` y en las copias de `precio-pantalla.ts`. Funciona igual: `qa-precio-pantalla` da 49 PASS / 0 FAIL. `social-automatizaciones` no se redesplegó porque su copia desplegada hace exactamente lo mismo.

## Archivos
- `supabase/migrations/20261021020000_ia_ejemplos_y_correcciones.sql` (aplicada por partes con execute_sql; `apply_migration` y algunos textos largos se colgaban).
- `supabase/functions/whatsapp-ia-responder/index.ts`.
- `supabase/functions/{_shared,whatsapp-ia-responder/_shared,social-automatizaciones/_shared}/precio-pantalla.ts` (solo la escritura de la regex).

## Pruebas
- `esbuild` compila el `index.ts`.
- `elegirEjemplos` con datos de prueba: correcciones primero, luego los más parecidos.
- Trigger probado dentro de un bloque que se deshace al final:
  - `texto_final` quedó con el texto enviado y se creó 1 ejemplo de corrección;
  - después se comprobó que no quedó nada (0 mensajes de prueba y 42 ejemplos).
- Ninguna sugerencia real todavía: el despliegue fue de madrugada.

## Costo
- Los borradores de seguimiento siguen prendidos hasta el 24-oct, con tope de 400 al día, para aprovechar el crédito (ver 2026-10-19-2350).
- Desde el 25-oct se apagan solos y el tope vuelve a 150.
- Los ejemplos agregan unos 1,500 tokens de entrada por borrador.

## Pendientes
- Mañana: revisar las primeras sugerencias reales (tono y largo) y los logs de la función.
- El **formulario de financiamiento** (texto fijo aprobado, en el servidor y en `crm-financiamiento-quick-reply.js`) sigue tratando de **tú**. No se cambió sin el OK del dueño.
- `frasePrecio` («te sale en») se cambia a «le sale» solo dentro de WhatsApp. En `social-automatizaciones` (privado de IG/FB) sigue en «te».
- Opcional: una pantalla en el CRM para ver, activar y desactivar ejemplos. Hoy se hace por base de datos.
