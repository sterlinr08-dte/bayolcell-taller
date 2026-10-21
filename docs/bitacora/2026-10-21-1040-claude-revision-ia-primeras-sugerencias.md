# 21-oct-2026 10:40 · Claude · Revisión de las primeras sugerencias reales de la IA (v30/v31, Haiku 5.5)

Revisión programada (solo lectura) en Supabase `vkhwdvjtowrhkhqavnvk`, desde las 02:00 RD hasta las 10:40 RD.

## Números
- `whatsapp_ia_sugerencias`: 23. Por estado: 14 pendientes, 5 reemplazadas y 4 descartadas.
- Uso diario: 166 llamadas hoy, sin rechazos. Ayer fueron 400 llamadas y 638 rechazos, porque llegó al tope.
- Logs de `whatsapp-ia-responder`: 350 llamadas, todas HTTP 200, sin errores.
- `whatsapp_ia_ejemplos`: siguen los 42 de fuente `real`. Todavía no hay `correccion`, porque nadie ha usado «Editar» en una sugerencia (`texto_final` vacío).

## Tono
- Ninguna sugerencia usa «mi amor» ni cariño.
- Ninguna tutea.
- Los precios salen del módulo de precio exacto (iPhone 12 Pro Max RD$3,000; XS RD$1,200), no inventados.
- Las respuestas libres del modelo van en usted y son cortas. Ejemplos:
  - «Buenas, a la orden. Con gusto le ayudamos con el financiamiento, que lo trabajamos con el Banco Ademi. Qué artículo le interesa financiar y de qué parte nos escribe?»
  - «…Sobre los modelos disponibles para financiar, le confirmamos con un compañero y le escribimos. Qué artículo le interesa?»

## Problemas encontrados (no se cambió nada; se le pregunta al dueño)
1. El **saludo fijo** pregunta la sucursal aunque el cliente ya la dijo («SUCURSAL SANTIAGO», dos veces). También lo hace cuando el cliente pidió algo concreto («pantalla»). Además le faltan acentos: «De que», «cual», «mas».
2. El **formulario de financiamiento** salió a un simple «Buenos dias» (09:44, la empleada lo reemplazó). También salió cuando el cliente solo preguntaba cómo funciona.
3. «**Fuera de horario**» salió a las 8:26, 8:31, 8:38 y 8:47 RD de un miércoles, y Santiago abre a las 8:30. Hay que revisar qué hora de apertura usa.
4. El precio del iPhone 12 Pro Max se sugirió dos veces seguidas (10:29 y 10:30).

## Pendiente
- Que el dueño decida si se corrigen los puntos 1 a 4.
- Revisar de nuevo cuando haya correcciones con «Editar».
- El formulario de financiamiento ya está en usted (publicado el 21-oct, bitácora 0700).
