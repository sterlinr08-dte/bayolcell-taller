# 2026-10-13 03:45 — Claude · Corrección: la OLED es «parecida a la original» y no se ofrece sola

Corrige `2026-10-13-0330-claude-calidad-certificada.md`. Esa entrada no se editó.

## Pedido del dueño
> «No si tengo oled calidad parecida a la original no tenía que ponerlo»

## Cambios (rama `claude/cotizar-pantalla`, sin publicar)
- **`crm-cotizar-pantalla.js`:**
  - la etiqueta de la OLED pasa de «OLED · igual a la original» a **«OLED · parecida a la original»**;
  - se **quitó la oferta automática** de la OLED en la tarjeta y en el texto de la de calidad certificada;
  - la OLED solo sale si el empleado la elige, cuando el cliente pide otra calidad. Texto: «…en OLED, calidad parecida a la original, te sale en RD$…».
- **`CLAUDE.md`:** la regla dice ahora «parecida», no «igual», y «solo si el cliente pide otra calidad».
- **Kit del catálogo:** ya no ofrece la OLED en la nota del grupo.

## Pruebas
`tests/cotizar-pantalla/cotizar.test.cjs` → 13 de 13 OK. Ahora comprueba además que el texto de la de calidad certificada **no menciona la OLED ni su precio**.
