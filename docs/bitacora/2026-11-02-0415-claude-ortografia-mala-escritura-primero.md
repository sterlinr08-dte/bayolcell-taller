# Corrección ortográfica — la prioridad es la mala escritura, no las tildes

> Sigue a `2026-11-02-0400-claude-ortografia-opcion-b-tildes.md`.
> Dueño: «Las tildes no es un problema sino la mala escritura».

## Cambios en `_shared/ortografia.ts`
1. **Tilde mal puesta por la IA:** antes se rechazaba todo el mensaje; ahora solo se le quita esa tilde (`quitarTildesMalPuestas`) y se conservan las demás correcciones.
2. **«oy → hoy»** permitido (`CORRECCIONES_SEGURAS`). «hoy» es palabra de plazo y antes se bloqueaba.
3. **Palabra repetida por error** («en en 8mil») se puede quitar. Quitar cualquier otra palabra sigue prohibido.
4. **«si» ↔ «sí» bloqueado:** cambia el sentido (condicional ↔ afirmación). Si la IA lo cambia, sale el original. Caso real: «si hay que cambiar la pantalla RD$ 2,000» quedaba «Sí, hay que cambiar…».
5. **Instrucciones de la IA:** primero las palabras mal escritas (resivir→recibir, aser→hacer, bienos→buenos, oy→hoy) y las repetidas; después tildes y signos. Si no sabe qué palabra quiso escribir el empleado, la deja igual.

## Banco con la IA real (mismas 69 frases; función temporal reactivada y luego desactivada otra vez)
| Medida | Antes | Ahora |
|---|---|---|
| Mensajes con letras mal escritas corregidos | 7 de 13 (54 %) | **11 de 13 (85 %)** |
| Alteraciones de precios, modelos, IMEI, teléfonos, enlaces, emojis | 0 | 0 |
| Salieron con el original por tiempo (>1.5 s) | 5 | 9 |
| Tiempo del corrector (mediana / p95) | 0.94 / 1.31 s | 1.03 / 1.43 s |

**Ahora sí corrige:**
- «haa»→«ah»
- «mucha solicitudes»→«muchas solicitudes»
- «oy»→«hoy» (con «porfavor»→«por favor»)
- «comprate»→«cómprate»

**Quedan sin corregir:**
- «normale» (por tiempo)
- «marerial» (la IA juntó líneas y se rechazó)

**Dudosos:**
- «me estib»→«me estoy»: adivinanza razonable.
- «llenarlo»→«llenarla»: concuerda con «plantilla».

Con la regla nueva de «si/sí», los 2 mensajes que cambiaban «si» por «sí» salen con el original.

## Pruebas
49/49 (`node --test scripts/pruebas/ortografia.test.mjs scripts/pruebas/ortografia-envio.test.mjs`).

## Estado
- **Producción todavía tiene la versión anterior** (opción B que rechaza el mensaje entero). Esta versión se sube junto con el paso 4, con autorización.
- Interruptor apagado. `ortografia-banco` desactivada (410).
- Pendiente: los tiempos vencidos (9 de 69). Se medirán en el piloto con la función ya caliente.
