# PLAN (sin desarrollar) — Corrección ortográfica automática en el CRM (2-nov-2026)

> Para revisión de ChatGPT antes de programar. Repo: `sterlinr08-dte/bayolcell-taller`. Producción: bayolcell.com (GitHub Pages) + Supabase `vkhwdvjtowrhkhqavnvk`.

## 1. Pedido del dueño
«Tengo empleados que tienen faltas ortográficas y es de mal gusto que un cliente reciba mensajes con faltas.»
Decisiones del dueño (2-nov-2026):
- **Corrección automática y «smart»**: el mensaje sale corregido sin ventana ni pregunta.
- Canales: **WhatsApp, Instagram y Facebook** (CRM del taller).
- **Sin informe** por empleado.

## 2. Datos actuales
- Mensajes de texto escritos a mano por empleados (WhatsApp, últimos 7 días): **336**, 5 empleados, ~61 caracteres de promedio. Es un mínimo: no todos los envíos guardan `enviado_por_id`. Instagram y Facebook se suman aparte (bajo volumen).
- Envío actual: frontend → Edge Functions `whatsapp-enviar`, `instagram-enviar`, `social-enviar` → Zernio → Meta.
- Ya existe IA en el proyecto: `whatsapp-ia-responder` usa `claude-haiku-5-5` con tope diario (RPC `ia_consumir_cupo`, tabla `whatsapp_ia_uso_diario`, `TOPE_DIARIO_IA`). La clave de Anthropic vive solo en los secretos de Supabase.

## 3. Cómo funciona para el empleado
1. Escribe y toca «Enviar» (o Enter).
2. En ≤1.5 s el texto se revisa y sale **ya corregido**.
3. En su pantalla, la burbuja enviada lleva una marca pequeña «✓ corregido». Al tocarla ve el original y el corregido (aprende sin regaños). El cliente solo recibe el corregido.

## 4. Arquitectura propuesta
**Opción elegida: corrección dentro del servidor, en el camino de envío** (no en el navegador), para que no se pueda saltar y para que la clave nunca toque el frontend.

- Nuevo módulo compartido `supabase/functions/_shared/ortografia.ts` con `corregirTexto(texto, ctx) → { texto, corregido: bool, original, motivo }`.
- Lo llaman las 3 Edge Functions de envío **antes** de mandar a Zernio, solo para mensajes de texto escritos por una persona.
- Se guarda el original en el metadato del mensaje (`whatsapp_mensajes.meta`, `instagram_mensajes.metadata`, `social_mensajes.metadata`) como `{ ortografia: { original, corregido_en } }`. **Sin columnas nuevas.**
- Frontend: solo pinta la marca «✓ corregido» cuando el mensaje tiene ese metadato (WhatsApp `taller-app.js`, Instagram `crm-social-hub.js`, Facebook `crm-facebook-chat.js`).
- Interruptor para apagarlo sin desplegar: una fila de configuración (p. ej. `whatsapp_ia_config` o `config_taller`, `ortografia_auto = true/false`).

Alternativa descartada: corregir en el navegador antes de enviar. Es más simple, pero se puede saltar, depende de cada pantalla (3 compositores distintos) y exigiría otra Edge Function solo para eso.

## 5. Candados («smart»)
| # | Regla | Motivo |
|---|---|---|
| 1 | Solo ortografía, tildes, mayúsculas iniciales y signos ¿? ¡!. No cambia palabras por sinónimos, no reescribe, no cambia el tono ni el usted/tú | Respetar al empleado |
| 2 | **Nunca** toca números, precios, «RD$», «$», porcentajes, modelos (iPhone 13 Pro, A54, Redmi Note 13…), IMEI, códigos, enlaces, correos, teléfonos, emojis ni nombres propios | Que nunca salga un precio o modelo cambiado |
| 3 | **Verificación en código, después de la IA**: la lista de números y la de enlaces/correos deben ser idénticas antes y después; la distancia de edición ≤ 30 % del largo; mismo número de líneas. Si algo falla → se envía el **original** | Doble seguridad contra un error de la IA |
| 4 | Tiempo máximo 1.5 s (AbortController). Si la IA falla o tarda → original | El cliente nunca espera |
| 5 | No pasan: textos de ≤ 2 palabras («Ok», «Dale», «👍»), solo emojis/números, plantillas de Meta, mensajes automáticos, sugerencias de la IA ya enviadas tal cual, adjuntos sin texto | Rapidez y costo |
| 6 | Lista de palabras permitidas (no se «corrigen»): pana, vaina, chulo, Bayol, BayolCell, «le asiste», nombres de sucursales y marcas | Español dominicano y de la tienda |
| 7 | Usa el mismo tope diario de IA que el asistente (o uno propio pequeño). Sin cupo → original | Gasto controlado |
| 8 | Respuesta de la IA en JSON estricto `{ "texto": "..." }`; si no se puede leer → original | Robustez |

Prompt (resumen): «Corrige SOLO ortografía, tildes, mayúsculas y signos de puntuación del español de República Dominicana. No cambies palabras, orden, tono, números, precios, modelos, enlaces ni nombres. Si no hay errores, devuelve el texto idéntico. Responde solo JSON.»

## 6. Costo estimado
Haiku: ~150 tokens de entrada (prompt + texto) y ~40 de salida por mensaje. Con unos 1,500–3,000 mensajes al mes → **US$1–3 al mes**. Se mide en la prueba antes de publicar.

## 7. Pruebas antes de publicar
1. **Banco de 50 frases reales** de empleados, sacadas de la base sin nombre ni teléfono del cliente, más 20 trampa: precios («RD$ 4,500»), modelos («A54 5G»), IMEI, enlaces, «le asiste», emojis, notas de voz transcritas.
   Criterios: 0 cambios en números/modelos/enlaces; ≥ 90 % de faltas reales corregidas; 0 frases con sentido cambiado (revisión a mano).
2. Tiempo: p95 ≤ 1.5 s medido en la Edge Function.
3. Falla simulada de la IA (timeout, JSON roto, sin cupo) → sale el original y el envío no falla.
4. Las 3 pantallas muestran «✓ corregido» y el original al tocarlo (capturas a 390 y 1280 px).
5. Regresión: pruebas del banco `scripts/pruebas/*` de CRM.
6. Prueba real solo con el número del dueño antes de activarlo para todos.

## 8. Riesgos y cómo se cubren
| Riesgo | Cobertura |
|---|---|
| La IA cambia un precio o modelo | Candados 2 y 3 (comparación en código; ante la duda, original) |
| Más lento al enviar | Tope 1.5 s; mensajes cortos no pasan |
| La IA «corrige» jerga válida | Lista de permitidas + regla de no cambiar palabras |
| Se cae la IA o se acaba el cupo | Se envía el original; el envío nunca falla por esto |
| Privacidad | El texto ya pasa por Anthropic con el asistente de WhatsApp; no se guarda nada fuera de Supabase |

## 9. Preguntas para ChatGPT (revisión)
1. ¿Corrección en las 3 Edge Functions de envío (propuesto) o una Edge aparte llamada desde el frontend?
2. ¿Los candados del punto 5 bastan, o agregarías alguno?
3. ¿Usar el tope diario del asistente o uno separado para ortografía?
4. ¿Dónde guardar el interruptor `ortografia_auto`?
5. ¿Algún caso de prueba que falte en el punto 7?

## 10. Orden de trabajo (cuando el dueño apruebe)
1. `_shared/ortografia.ts` + pruebas locales con las 70 frases.
2. Integrarlo en `whatsapp-enviar`, `instagram-enviar` y `social-enviar` (con interruptor apagado).
3. Marca «✓ corregido» en las 3 pantallas.
4. Prueba con el número del dueño → encender para todos.
5. Bitácora de cada paso; publicar solo con «publícalo».
