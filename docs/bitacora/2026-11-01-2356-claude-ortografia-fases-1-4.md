# Corrección ortográfica — fases 1 a 4 programadas (sin desplegar, interruptor apagado)

> Sigue al plan v2: `2026-11-01-2345-claude-plan-correccion-ortografica-v2.md`.
> Rama `claude/ortografia` (repo `bayolcell-taller`). **Nada publicado, desplegado ni aplicado.**

## Pedido
Revisión de ChatGPT al plan: «Actualiza primero esta bitácora, luego implementa por fases con commits verificables y evidencia de pruebas. Mantén el interruptor apagado durante el desarrollo. Publicación y activación general requieren autorización expresa.»

## Commits
| Fase | Commit | Qué |
|---|---|---|
| Plan v2 | `cc42623` | bitácora del plan con los 9 puntos de ChatGPT |
| 1 | `cec48e2` | `supabase/functions/_shared/ortografia.ts` + 21 pruebas (`scripts/pruebas/ortografia.test.mjs`) |
| 2 | `e8117ad` | migración `supabase/migrations/20261102120000_crm_ortografia.sql` (**sin aplicar**) |
| 3 | `b141a45` | integración en `whatsapp-enviar`, `instagram-enviar`, `social-enviar` + 25 pruebas (`scripts/pruebas/ortografia-envio.test.mjs`) |
| 4 | `854ce7b` | marca «✓ corregido»: `crm-ortografia.js` + WhatsApp/Instagram/Facebook + banco `scripts/pruebas/crm-ortografia.cjs` |

## Fase 1 — módulo
- Protección con `⟦n⟧` antes de la IA: correos, enlaces y dominios, teléfonos, precios con moneda y rangos, %, modelos completos (marca + piezas: Pro, Max, Ultra 2…), emojis compuestos, códigos/IMEI/cualquier número, nombres y expresiones permitidas. Restauración exacta: todos, una vez, en orden.
- Validación palabra por palabra (alineación en orden, sin palabras nuevas ni quitadas): solo tildes, mayúsculas, faltas cortas, separar/unir y abreviaturas de lista cerrada. Rechaza cambios en negaciones y en palabras de garantía, disponibilidad y plazo; símbolos, saltos de línea y formato de WhatsApp deben quedar iguales.
- IA: una sola llamada, sin pensamiento, esfuerzo bajo, salida con JSON Schema estricto; `stop_reason` debe ser `end_turn`; vacío, largo, truncado o con otra forma → original.
- Plazo total 1.5 s (configuración + cupo + IA + validación); al vencer se cancela y sale el original. Caché de configuración 30 s.
- Los logs solo llevan canal, motivo, tiempos y largo; nunca el texto.

## Fase 2 — migración (probada con rollback, no aplicada)
- `crm_ortografia_config` (una fila, **activo = false**), solo admin (`app_is_admin()`) la lee y cambia; `check` techo global ≥ tope + 150 (tope del asistente).
- `ia_uso_diario_servicio` + `ia_reservar_cupo(servicio, tope, techo)`: reserva atómica; el techo cuenta también el asistente.
- Triggers `*_conservar_ortografia` en las 3 tablas de mensajes: si un webhook o importación reescribe el metadato sin `ortografia`, se conserva.
- Corrección al plan v2: la función de administrador real es `app_is_admin()` (no `es_admin()`).
- Prueba en la base: todo dentro de `begin … rollback` (cupo 2 de 2 y el tercero negado, techo global, apagado por defecto, `check` del techo, triggers de Facebook y WhatsApp). Después se verificó que no quedó ningún objeto ni fila marcada; control negativo confirmó que un fallo sí se habría visto.

## Fase 3 — funciones de envío (sin desplegar)
- El corrector corre después de identidad, permisos, ventana y línea; antes de armar los campos para Zernio. WhatsApp: no aplica a plantillas, ubicación, contacto ni notas de voz; sí al pie de foto.
- El mismo texto final va a Zernio, `cuerpo`, `ultimo_mensaje_preview` y la respuesta (`texto_enviado`, `ortografia`).
- Metadato fusionado: conserva `partialFailure` (Instagram) y `zernio` (Facebook). Webhook adelantado (`23505`): se fusiona la marca en la fila existente; nunca se reenvía.
- **`social-enviar` ahora exige identidad (`identidadVerificada`) y acceso a redes (`tieneAccesoARedSocial`) antes de todo**; guarda `enviado_por_*`. El frontend ya llama con la sesión del empleado (`functions.invoke`), así que no cambia nada para quien tiene permiso.
- Secreto usado: `ANTHROPIC_API_KEY` (ya existe en Supabase). Nada nuevo en el repo.
- Cada función lleva su copia de `_shared/ortografia.ts` (y `social-enviar` la de `inbox-common.ts`); una prueba verifica que las copias sean idénticas.

## Fase 4 — pantalla
- `crm-ortografia.js` (cargada antes de `taller-app.min.js`): marca verde pequeña «✓ corregido», área de toque 44 px; al tocar: «Usted escribió» + original con `textContent`.
- Sin marca: mensajes fallidos, sin corrección, del cliente, o con falla parcial en Instagram.
- WhatsApp: la burbuja provisional toma `texto_enviado` y la marca al confirmarse. Instagram y Facebook recargan el chat desde la base tras enviar.
- Apagar la marca en un equipo: `localStorage.bc_orto_marca_off = '1'`.
- Versiones: `crm-ortografia.js` y `taller-app.min.js` `?v=20261102-or1`; `crm-marketing-consent.js` `?v=20261102-or1` con `V` y `SOCIAL_HUB` = `20261102-or1`.

## Pruebas (evidencia)
- `node --test scripts/pruebas/ortografia.test.mjs scripts/pruebas/ortografia-envio.test.mjs` → **46 de 46**.
- `node scripts/pruebas/crm-ortografia.cjs` → **13 comprobaciones × 390 y 1280 px, todo OK** (capturas `img/2026-11-02-ortografia-wa-390.png` y `-1280.png`).
- Deno no está instalado aquí: las funciones se ejecutaron en Node con un cargador que simula `jsr:`/`npm:`. Antes de desplegar conviene `deno check` (lo hace el despliegue de Supabase).

## Riesgos y pendientes
- Instagram y Facebook: la marca está en el código pero no hay banco para esas pantallas; se mira en el piloto.
- La lectura del contador del asistente en `ia_reservar_cupo` puede quedar corta por unas pocas llamadas simultáneas (documentado).
- Falta medir con la IA real: % corregido, tiempo p95, tokens y costo (los US$1–3 al mes siguen siendo estimación).
- Privacidad: Anthropic procesa el texto; la retención depende del acuerdo con Anthropic.

## Siguiente paso (cada uno con autorización expresa del dueño)
1. Aplicar la migración (queda apagada).
2. Desplegar las 3 funciones (sin efecto visible mientras esté apagada; `social-enviar` sí estrena la verificación de permisos).
3. Banco de 50 frases reales + 20 trampa con la IA real.
4. Piloto: `piloto_hilos` = un hilo del dueño, `activo = true`.
5. Publicar el frontend y, si el piloto sale bien, encender para todos.
