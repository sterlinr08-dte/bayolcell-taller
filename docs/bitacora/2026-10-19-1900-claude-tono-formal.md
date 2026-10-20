# 19-oct-2026 — Comunicación formal en todo el taller (igual que NEXUS)

**Rama:** `claude/bayol-formal`. **Sin publicar.**

## Pedido del dueño
«Vamos a corregir igual que nexus la forma de comunicación más formal».

## Reglas aplicadas
Son las mismas de NEXUS 59.38 (`nexus-pro/docs/bitacora/2026-10-18-1340-claude-textos-cobro-profesionales.md`):
1. **Usted, no tú.**
   - Escribe → Escriba, Selecciona → Seleccione, Toca → Toque, Agrega → Agregue, Revisa → Revise.
   - tu/tus → su/sus; tienes/puedes → tiene/puede.
   - Cuando queda más limpio se usa forma impersonal: «Se guarda automáticamente».
2. **Rótulos con nombres, no preguntas.**
   - «¿Cuál almacén vas a contar?» → «Almacén a contar».
   - «¿A qué técnico se le asigna?» → «Técnico asignado:».
   - «¿Qué es esto?» → «Ayuda del módulo».
   - Las preguntas de **confirmación** («¿Eliminar…?») se quedan, en usted.
3. **Sin exclamaciones ni frases coloquiales.**
   - «¡Todo al día!» → «Todo al día.»
   - «No encontré…» → «No se encontraron…»
4. **Mensajes al cliente**, por WhatsApp de texto libre, recibos y catálogo: en usted, cordiales.
   - «Mira los precios…» → «Consulte los precios…»
   - «¡Gracias por su pago!» → «Gracias por su pago.»

## Lo que NO se tocó
- Plantillas de WhatsApp aprobadas por Meta.
- Textos que van a Info Plus o a la DGII.
- Las instrucciones que se envían a la IA.
- Los datos guardados (estados, categorías y valores de las listas).
- Los textos que el código compara o busca.
- Comentarios del código.
- Una cita literal del permiso de REFOX.
- Las preguntas rápidas del chat de Diagnóstico, que el técnico envía a la IA en primera persona.

## Cómo se hizo
- **Revisión por partes.** 7 asistentes revisaron cada uno una parte en paralelo:
  - `taller-app.js` en 5 tramos;
  - `taller.html` con las capas;
  - los archivos de Diagnóstico y Reacondicionados.
- **Propuestas verificadas.** Cada asistente devolvió los cambios exactos en JSON. Se comprobó que cada texto original aparecía una sola vez y que se conservaban los `${…}`.
- **Resultado:** **721 cambios** aplicados sin fallos, más **119 reemplazos globales** de líneas idénticas repetidas, como «No tienes permiso.» (28 veces) o «Permite las ventanas emergentes…» (22 veces).
- **Archivos tocados:**
  - `taller-app.js`, `taller.html`;
  - `taller-info.js`, `taller-recepcion.js`;
  - los 5 `diagnostico-ai-*.js`;
  - `taller-reacond-smart.js`, `crm-marketing-consent.js`.
- **Ⓘ:** las búsquedas de `taller-info.js` se actualizaron junto con su texto. Ejemplos: «Marque los problemas…», «Modifique los campos…», «Ajuste el tamaño y verifique», «Cuente la mercancía real», «Aquí se gestionan los técnicos», «Escriba la línea…».
- **Versiones** `?v=20261019-f1` en todos los scripts del taller; `taller-reacond-smart.js` pasa a `?v=20261019f1`.

## Medición
Textos visibles con «tú» (imperativos, tienes/puedes, tu/tus):

| Archivo | Antes | Ahora | Lo que queda |
|---|---:|---:|---|
| `taller.html` | 35 | 0 | — |
| `taller-app.js` | 279 | 0 | solo comentarios del código |

Exclamaciones «¡»: 13 → 0.

## Pruebas (banco local con Playwright)
| Prueba | Resultado |
|---|---|
| `info2.mjs`: las 26 notas detrás de la ⓘ, a 390 y 1280 px | 80 PASS |
| `rxfun` | 12 PASS |
| `rxppk` | 23 PASS |
| `nav7` | 9 PASS |
| `vend` | 9 PASS |
| `admalm` | 18 PASS |
| `inc` | OK |
| `barrido.mjs` (30 pantallas a 390 y 1280) y `modales.mjs` | sin errores de JavaScript |
| `node --check` de todos los .js y de los 6 bloques en línea de `taller.html` | limpio |

## Para revisar con el dueño
Elecciones de palabras que el dueño puede querer cambiar:
- «Aporte patronal (lo paga usted)».
- La pantalla de comparación de evaluaciones dice «Supervisor / Evaluación del supervisor».
- Mensaje de rifa al cliente: «Le deseamos mucha suerte».
