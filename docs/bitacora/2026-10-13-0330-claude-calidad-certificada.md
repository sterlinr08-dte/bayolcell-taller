# 2026-10-13 03:30 — Claude · Regla del dueño: «Calidad certificada» en vez de «Incell»

Sigue a `2026-10-13-0300-claude-cotizar-pantalla.md`.

## Pedido del dueño
> «No se puede poner calidad incell se le dice calidad certificada si el cliente quiere otra calidad se le ofrece oled es la calidad igual a la original»

## Qué se cambió (rama `claude/cotizar-pantalla`, sin publicar)
- **`crm-cotizar-pantalla.js`:**
  - el tipo Incell se muestra como **«Calidad certificada»** y el OLED como **«OLED · igual a la original»**, en el buscador, la tarjeta y el texto;
  - el buscador también encuentra por «certificada» u «oled»;
  - al cotizar la de calidad certificada, si existe la **OLED del mismo modelo**, se ofrece en la tarjeta («¿Prefieres OLED, igual a la original? RD$…») y en el texto («Si prefieres OLED, que es la calidad igual a la original, te sale en RD$…»);
  - si no hay OLED cargada, el texto dice «también tenemos OLED, que es igual a la original», sin precio.
- **`CLAUDE.md`:** sección «REGLA DEL DUEÑO (13 oct 2026)» para que ningún chat ni la IA de respuestas diga «Incell» al cliente.
- **Kit del catálogo** (`README.md` y `ejemplo-datos.json`): ya no dice «Incell» en lo que ve el cliente.

## Pruebas
`tests/cotizar-pantalla/cotizar.test.cjs` → **13 de 13 OK**. Ahora la prueba también comprueba:
- que **la palabra «Incell» no aparece** en la pantalla ni en el texto;
- que el texto ofrece la OLED con su precio (RD$4,000 en los datos simulados).

## Pendiente
- Aplicar la misma regla en el prompt de `whatsapp-ia-responder` cuando se haga la mejora de la IA. Hoy no menciona Incell, pero conviene decirlo explícitamente.
