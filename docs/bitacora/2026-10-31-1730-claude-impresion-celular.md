# 2026-10-31 17:30 — Claude — Impresión en el celular (B) + la impresora de Navarrete (C)

Sigue a `2026-10-31-1700-claude-impresion-facil.md`. Dueño: «¿cómo desde el iPhone se puede? No entiendo.» Eligió **B y C**:
«la impresora de Navarrete imprime por wifi y Bluetooth».

## Aclaración
QZ Tray solo existe para computadoras. En iPhone/iPad la ventana de imprimir de Apple solo muestra impresoras **AirPrint**
(wifi); por **Bluetooth** el iPhone no imprime desde una página web (solo con la app de la marca). Además, la capa anterior
ofrecía en el celular el instalador de Windows, que ahí no sirve.

## Cambio (B) — `bc-impresion-facil.js/.css` **bif3**
- Detecta iPhone, iPad (también iPadOS que dice «Macintosh» con pantalla táctil) y Android.
- En el celular: sin pasos de QZ, sin instalador ni plegable del certificado, sin «Reconectar / Prueba de ticket» abajo. Muestra
  «En el celular se imprime por wifi» con 3 pasos (Guardar e imprimir → Impresora → Imprimir), aviso AirPrint/Bluetooth (en Android:
  complemento de la marca) y que el PDF llega por WhatsApp al guardar si hay número (comportamiento que ya existía).
- Botón **Probar impresora** (54 px): abre una página de prueba y la ventana de imprimir del teléfono.
- No intenta conectar QZ en el celular (`qzVerificarConexion` queda en silencio solo ahí); aviso «Celular»; título de la ventana (se repinta cuando aparece la ventana rápida)
  «Impresora» (no «de esta computadora»).

## C — Navarrete (pendiente del dueño)
Saber si su impresora de wifi aparece en el iPhone: tocar «Probar impresora» en el celular → «Impresora». Si aparece, ya funciona.
Si no aparece (térmica de wifi sin AirPrint), las salidas son: imprimir desde la PC de Navarrete con QZ (QZ también imprime a una
impresora de red por su IP) o una térmica con AirPrint.

## Pruebas
`scripts/pruebas/impresion-facil.cjs`: 28/28 — PC 390/1280 (como antes) + iPhone (modo celular, sin instalador, AirPrint/Bluetooth,
botón ≥ 44 px, sin pie de QZ, 0 intentos de conexión, «Probar impresora» abre la página de prueba). Captura revisada a ojo.

## Estado
Rama `claude/impresion-facil`, sin publicar.
