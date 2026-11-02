# Corrección ortográfica — banco con la IA real (paso 3)

> Sigue a `2026-11-02-0330-claude-ortografia-base-y-funciones.md`. Dueño: «Si» al paso 3.
> No se envió nada a clientes. La configuración real siguió **apagada** todo el tiempo.

## Cómo se hizo
- Función temporal `ortografia-banco`: el mismo `ortografia.ts` de producción, con la configuración «encendida» solo en memoria y el **cupo real** (`ia_reservar_cupo`: 69 llamadas reservadas hoy, 0 rechazadas).
- 69 frases: 49 mensajes reales de empleados (últimos 10 días, WhatsApp, sin nombres ni teléfonos) y 20 trampas.
- Después se reemplazó por un stub que responde 410 «desactivada» (verificado). Se puede borrar desde el panel de Supabase.

## Resultado
| Medida | Valor |
|---|---|
| Corregidas y aceptadas | 42 de 69 |
| Sin cambios (ya estaban bien o la IA no cambió nada) | 20 |
| Salieron con el original por tiempo (>1.5 s) | 5 (7 %) |
| Rechazadas por los candados | 2 (todo en MAYÚSCULAS; «oy→hoy», palabra de plazo corta) |
| Tiempo del corrector con IA | mediana 0.94 s, p95 1.31 s (64 llamadas) |
| Tokens | 39,144 de entrada y 1,960 de salida en 64 llamadas (~612 y ~31 por mensaje) |
| Costo medido | ≈ US$0.005 por las 64 → **≈ US$0.25 al mes** con 3,000 mensajes (tarifa Haiku 5.5 de US$0.10 y US$0.50 por millón) |

**Trampas:**
- Precios, modelos (Pro, Pro Max, Watch Ultra 2), IMEI, correo, web, teléfono, %, rangos, emojis compuestos y formato `*negrita*` + salto de línea quedaron **idénticos**.
- La instrucción maliciosa no cambió nada.
- Las frases con «no», «nunca» y «garantía» se mantuvieron.
- La frase en inglés quedó igual y «Yeison» se conservó.

**Ejemplos buenos:**
- «las solicitudes las aremos … esta caido» → «Las solicitudes las haremos … está caído.»
- «tu tienes algun prestamo activo» → «¿Tú tienes algún préstamo activo?»
- «llamenos al 809-555-1234 xfa» → «llámenos al 809-555-1234 por favor»
- «el tuyo no te puedo desir esactamente … resivir» → «decir exactamente … recibir»

## Problemas encontrados (revisión a mano)
1. **Una tilde mal puesta:** «comprate» → «compráte» (lo correcto es «cómprate»). Los candados aceptan los cambios de tilde, así que pasó. Es 1 de 42.
2. **«si» → «Sí»** en «si esta en santiago» → «Sí, está en Santiago». Como respuesta suelta es correcto, pero si era «si está en Santiago…» (condicional) el sentido cambia. Caso ambiguo.
3. Correcciones incompletas sin daño: «en cuanto» (debía ser «en cuánto»); «De donde eres» (sin ¿ ni tilde).
4. 5 tiempos vencidos: salió el original (es lo esperado, pero baja el % de corrección).

## Contra la meta de ChatGPT
- **Cero alteraciones protegidas:** cumplido (0).
- **Cero cambios de sentido:** casi; hay 1 caso dudoso (si/sí).
- **≥ 90 % de faltas corregidas** (contando el original como no corregido): **≈ 80 %** estimado (≈ 42 de ≈ 53 frases con faltas). No se cumple, sobre todo por los 5 tiempos vencidos y 2 rechazos prudentes.

## Opciones para mejorar (decide el dueño)
- A. Tratar «si ↔ sí» como cambio crítico: si la IA lo cambia, se envía el original (más seguro, corrige menos).
- B. Rechazar tildes nuevas en verbos con pronombre pegado (cómprate, dígame…) cuando la IA las ponga en una sílaba distinta. Si no, aceptar el riesgo de 1 en 40.
- C. Ver en el piloto si el tiempo baja con la función ya «caliente» (aquí se midió con arranque en frío). Subir el límite de 1.5 s va contra el plan; no se propone.
