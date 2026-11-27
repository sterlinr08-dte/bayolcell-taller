# 2026-11-27 10:00 RD · Claude — Flow de financiamiento v2 PUBLICADO

Sigue a `2026-11-27-0945-claude-flow-v2-cedula-teclado.md`.
- **Dueño:** «1- si» (la cédula se queda con teclado de números, de 11 a 13 caracteres) y «2- si» (publicar).

## Qué se hizo
- `POST /whatsapp/flows/1860287288307442/publish` (cuenta Servicio al Cliente `6a988b2977555aae01c7947c`). Respondió `success: true`.
- Comprobado después:
  - **1860287288307442 «Solicitud de financiamiento - Bayol Cell v2»: PUBLISHED**, `validation_errors: []`;
  - el anterior 1193474773538114 **sigue PUBLISHED**. No se retiró, para no romper lo que lo envía hoy.
- En la cuenta también existe `2561201354399974 bayolcell_financiamiento` (PUBLISHED). Es el formulario de la función `whatsapp-flow-financiamiento` del taller y es otro distinto.
- Función temporal `flow-leer-20261127` retirada (v8, 410).

## Cambios del v2 frente al v1
1. SOLICITUD ya no es pantalla final.
2. Logo cuadrado completo (`aspect-ratio 1`, `contain`).
3. Cédula con teclado de números (`phone`), de 11 a 13 caracteres, sin `pattern`.

Lo demás queda igual: payload de 8 claves, textos y pregunta de entrega de iPhone.

## Pendiente
- **Cambiar 1193474773538114 por 1860287288307442 donde se envía el formulario**, desde Zernio. **No verificado** desde dónde se envía.
- Cuando el v2 esté en uso, se puede **deprecar** el v1. Eso tampoco tiene vuelta atrás, así que va con su OK.
- Falta probarlo en un teléfono real.
