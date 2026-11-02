# PLAN v2 — Corrección ortográfica automática en el CRM (incorpora la revisión de ChatGPT)

> Reemplaza al plan v1: `2026-11-01-2134-claude-plan-correccion-ortografica.md` (no se edita).
> Repo `sterlinr08-dte/bayolcell-taller`, rama `claude/ortografia`. Supabase `vkhwdvjtowrhkhqavnvk`.
> Estado: **en desarrollo, interruptor apagado, nada desplegado ni aplicado.** Publicar, desplegar o encender requiere autorización expresa del dueño.

## 1. Lo que no cambia (decisión del dueño, 2-nov-2026)
- Corrección automática de lo que escribe una persona en WhatsApp, Instagram y Facebook.
- Sin ventanas ni confirmaciones antes de enviar. Sin informes por empleado.
- El cliente recibe el texto corregido; el empleado ve el original con una marca discreta «✓ corregido».

## 2. Verificación repo ↔ producción (2-nov-2026)
| Función | Producción | Repo |
|---|---|---|
| `social-enviar` | v4 | idéntica |
| `instagram-enviar` | v9 (+ `_shared/inbox-common.ts`) | idéntica |
| `whatsapp-enviar` | v22 | misma estructura (490 líneas, `guardado_local`, plantillas 22-oct) |

Columnas de metadatos confirmadas en la base (todas `jsonb`): `whatsapp_mensajes.meta`, `instagram_mensajes.metadata`, `social_mensajes.metadata`.

## 3. Hallazgos nuevos
1. **`social-enviar` solo revisa que exista `Bearer …`**; no llama a `identidadVerificada` ni a `tieneAccesoARedSocial`. Se corrige **antes** de añadir consumo de IA (fase 3).
2. **`social-webhook` y `social-importar-historial` sobrescriben `social_mensajes.metadata`** con el cuerpo de Zernio en cada evento (`delivered`, `read`…). Borrarían `ortografia` y también `zernio`. Solución: trigger `BEFORE UPDATE` en las 3 tablas que conserva la clave `ortografia` si el nuevo valor no la trae (fase 2). Cubre cualquier escritor futuro sin tocar los webhooks.
3. `instagram-webhook` hace `upsert … ignoreDuplicates` (no borra). `whatsapp-webhook` fusiona `meta` (no borra).
4. Webhook adelantado: si el eco llega antes del `insert` de la función de envío, el `insert` choca con el único de `zernio_message_id`. La función hará `update` fusionando `ortografia` en la fila existente; nunca reenvía.

## 4. Arquitectura
- Módulo `supabase/functions/_shared/ortografia.ts`, copiado dentro de cada bundle como `inbox-common.ts`.
- Lo llaman `whatsapp-enviar`, `instagram-enviar` y `social-enviar`:
  - **después** de validar identidad, permisos, contenido y condiciones de envío (ventana de 24 h, línea, hilo);
  - **antes** de armar los `campos` para Zernio.
- El mismo texto final va al envío, a `cuerpo`, a `ultimo_mensaje_preview` y a la respuesta al frontend (`texto_enviado`, `ortografia`).
- La burbuja optimista del frontend se reemplaza por `texto_enviado` al recibir la respuesta.
- Llamada a la IA por `fetch` como el resto del proyecto (`whatsapp-ia-responder`): modelo Haiku vigente del proyecto, sin pensamiento, esfuerzo bajo, **salida estructurada** (`output_config.format` con JSON Schema `{texto: string}`, sin propiedades extra).

## 5. Candados
### 5.1 Protección antes de la IA
Se reemplazan por marcadores `⟦n⟧` y nunca llegan a la IA:
- enlaces, correos, teléfonos;
- precios con moneda (`RD$`, `US$`, `$`, `pesos`), decimales, rangos y porcentajes;
- modelos completos (`iPhone 15 Pro Max`, `Galaxy S24 Ultra`, `Watch Ultra 2`, `Redmi Note 13 Pro+`…), IMEI y códigos alfanuméricos (`A54`, `SM-A546`, `128GB`, `5G`);
- cualquier número;
- emojis (incluye compuestos con ZWJ y tonos de piel);
- nombres conocidos y expresiones permitidas (Bayol, BayolCell, pana, vaina, chulo, «le asiste», sucursales, marcas).

Después: los marcadores deben volver **todos, una sola vez y en el mismo orden** (así se conserva la pareja modelo–precio). Si no → original.
No se promete proteger nombres desconocidos; para eso está la validación 5.2.

### 5.2 Validación de cada cambio (en código)
Alineación palabra por palabra (monótona; un cambio de orden se ve como quitar + añadir → rechazo). Se acepta solo:
- tildes y mayúsculas (`si`→`Sí`, `esta`→`está`);
- falta corta de ortografía (distancia ≤ 1 en palabras de ≤ 4 letras, ≤ 2 en las más largas; misma letra inicial salvo `h`);
- separar o unir palabras (`porfavor`→`por favor`, `aveces`→`a veces`);
- abreviaturas de una lista cerrada (`q`→`que`, `xq`/`pq`→`porque`, `tmb`/`tb`→`también`, `xfa`→`por favor`);
- signos `¿ ? ¡ ! , . ; :` y espacios.

Se rechaza (→ original): sinónimos, palabras añadidas o quitadas, cambios de orden, otros símbolos, distinto número de saltos de línea o de marcas de formato de WhatsApp (`* _ ~ \``), y **cualquier cambio** (salvo tildes/mayúsculas) en palabras de negación, garantía, disponibilidad, plazo o compromiso (`no, nunca, ni, sin, nada, garantía, disponible, hay, tenemos, quedan, hoy, mañana, días, horas, semana, gratis, incluye, devolución…`). Ante la duda → original.

### 5.3 La IA
- El texto va entre etiquetas como **contenido**; el sistema dice que nunca son instrucciones.
- JSON completo validado contra el esquema; `stop_reason` debe ser `end_turn`. Vacío, truncado, demasiado largo (> 1.5 × original + 20) o con otro formato → original. Sin regex para «rescatar» JSON.
- Entrada máxima 1,000 caracteres (si es más largo, se envía el original, sin truncar). Salida limitada por `max_tokens`.
- **Una sola llamada, sin reintentos.**
- Ante cualquier falla → original. Nunca se salta un rechazo de permisos ni las reglas normales del envío.

## 6. Qué mensajes pasan
- **Sí pasan los cortos** («Esta listo», «Cuanto cuesta», «Si tenemos»).
- No pasan: plantillas de Meta, ubicación, contacto, adjuntos sin texto, mensajes automáticos y casos inequívocos (solo emojis/números/signos, o una palabra corta ya correcta como «ok», «dale», «gracias»).
- La procedencia se decide en el servidor: solo pasan envíos con identidad de persona verificada (`identidadVerificada`), por las 3 funciones de envío. Las automatizaciones (`whatsapp-ia-responder`, `social-automatizaciones`, webhooks) escriben a Zernio por su cuenta y no pasan por aquí.

## 7. Tiempo
- Máximo **1.5 s adicionales en total** (configuración + cupo + IA + lectura + validación), con reloj único y `AbortController`.
- Al vencer: se usa el original y se cancela lo pendiente. La respuesta tardía no puede cambiar el mensaje ni provocar otro envío (el resultado se fija una sola vez).
- Se registra por separado: `ms_corrector`, `ms_envio_total` y si terminó antes del límite. **Los logs no llevan el texto**, solo largos, motivo y tiempos.

## 8. Cupos
- Tabla nueva `ia_uso_diario_servicio (dia, servicio, llamadas, rechazadas)` y RPC `ia_reservar_cupo(p_servicio, p_tope, p_techo_global)`: reserva **atómica antes** de llamar a la IA; si falla → original.
- Ortografía tiene su tope propio. El techo global cuenta ortografía + asistente (`whatsapp_ia_uso_diario`).
- El asistente sigue con su `ia_consumir_cupo` y su tope: ortografía no puede gastarle el cupo. Para que el asistente tampoco deje sin cupo a ortografía, el techo global debe ser ≥ tope del asistente + tope de ortografía (comprobado en la migración con un `check`; valores iniciales: ortografía 300/día, techo 600).

## 9. Interruptor
- Tabla propia `crm_ortografia_config` (una fila), separada de `whatsapp_ia_config`: `activo`, `canales`, `tope_diario`, `techo_global`, `timeout_ms` (300–1,500), `piloto_hilos`, `piloto_cuentas`.
- Solo el administrador (`es_admin()`) la modifica; las Edge Functions la leen con la clave de servicio.
- **Empieza apagada.** Ausente, ilegible o lenta → original.
- Caché de 30 s por instancia: **apagarla tarda como máximo 30 s** en hacer efecto.

## 10. Metadatos y pantalla
- Se fusiona `{ ortografia: { original, en, ms } }` con lo existente: se conserva `partialFailure` (Instagram) y `zernio` (Facebook).
- Solo se guarda cuando hubo un cambio aceptado.
- «✓ corregido» aparece solo si hay cambio aceptado y el mensaje no está fallido. Al tocarlo se ven original y corregido como **texto seguro** (`textContent`, nunca `innerHTML`).

## 11. Pruebas (además del plan v1)
1–2 palabras · negaciones, garantías, disponibilidad y plazos · Pro vs Pro Max, Ultra vs Ultra 2 · precios con decimales, monedas, rangos y % · nombres ambiguos, jerga, abreviaturas e inglés · emojis compuestos, saltos de línea y formato de WhatsApp · instrucciones maliciosas en el texto · adjunto con texto y falla parcial de Instagram · doble clic, reintentos, concurrencia y webhook adelantado · IA con timeout, 429, JSON inválido o truncado, cupo agotado y configuración caída · usuario sin permisos: cero envío y cero consumo · envío exitoso con falla al guardar: sin reenvío · capturas 390 y 1280 px · piloto con el dueño y cuentas/hilos de prueba autorizados.

Aceptación:
- **cero** alteraciones de fragmentos protegidos o de significado;
- ≥ 90 % de faltas reales corregidas, **contando como no corregidas** las que salieron por el original.

## 12. Costo y privacidad (corrige el plan v1)
- US$1–3 al mes es **una estimación**; se valida con los tokens reales del piloto.
- Corrección: el v1 decía «no se guarda nada fuera de Supabase». Lo correcto: **Anthropic procesa el texto** del mensaje; su retención depende del acuerdo vigente con Anthropic (ver https://platform.claude.com/docs/en/manage-claude/api-and-data-retention). En Supabase se guarda el original solo cuando hubo corrección.
- Autorización de funciones: https://supabase.com/docs/guides/functions/auth

## 13. Fases (un commit verificable por fase)
| Fase | Qué | Evidencia |
|---|---|---|
| 1 | `_shared/ortografia.ts` + pruebas con IA simulada | salida de las pruebas |
| 2 | Migración (configuración apagada, cupos, trigger de metadatos) — **solo archivo** | revisión del SQL |
| 3 | Integración en las 3 funciones + autorización de `social-enviar` — **sin desplegar** | pruebas de integración simuladas |
| 4 | Marca «✓ corregido» en las 3 pantallas + burbuja reconciliada | capturas 390/1280 |
| 5 | (con permiso) aplicar migración, desplegar, banco con IA real y piloto con el dueño | bitácora |
