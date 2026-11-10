# CRM rápido (parte C): las reglas `:has()` del CRM pasan a clases de estado · sin publicar

## Pedido
Del dueño: «que el CRM sea más rápido e instantáneo, sin bug». La auditoría `2026-11-10-0142-claude-auditoria-crm-velocidad.md` (rama `claude/crm-auditoria`) midió que entre el 60 y el 85 % del tiempo de cada acción del CRM era recalcular estilos, por las reglas CSS con `:has()`. Esta parte (C) ataca solo eso. El envío, la recepción, el tiempo real y las consultas van en otra rama (`claude/crm-rapido-ab`).

## Diagnóstico (medido en el banco, no supuesto)
- Con una regla del tipo «el `<body>` que tiene dentro un chat abierto» (`body:has(#v-crmLinea.chat-abierto)`), Chrome marca al `<body>`, a `.content` y a `#v-crmLinea` como «dependen de lo que tienen dentro». Por lo medido, esa marca no se quita aunque la regla se borre después. Desde ahí, cada cambio pequeño dentro de ellos (una burbuja nueva, una tecla en Recepción) vuelve a revisar todo lo que cualquier regla `:has()` del taller pueda tocar.
- Por eso la auditoría veía que «quitando un grupo de reglas no baja; solo la suma»: lo que cuesta no es cada regla, sino que el contenedor quede marcado.
- Repuestas una por una (script `uno-a-uno.cjs`), las que bastan solas para el recálculo grande son las que terminan en un selector ancho: `.wa-chat-col:not(:has(#waDetalle)) *` (CRM), `#v-reportes .card:has(> div > #rep_tecnico) > div` (Reportes) y `.bcpf-items:not(:has(…)) … span:nth-child(3)` (Prefactura). Las dos últimas no alcanzan al CRM si ningún contenedor del CRM queda marcado.
- Conclusión: quitando las 14 reglas `:has()` del CRM, ningún contenedor del chat queda marcado y las otras 73 reglas `:has()` activas del taller dejan de costar en el CRM sin tocarlas.

## Qué se hizo
### Paso 1 · Las 14 reglas del CRM
Cada regla se cambió por una clase normal que pone la capa nueva `crm-estilos.js`. La regla nueva queda en el mismo sitio del archivo, con las mismas propiedades y **la misma fuerza** (especificidad) que la original, para que gane y pierda contra las mismas reglas de antes. Para igualar la fuerza se usa `:is(*, #bcCrmE)` o `:is(#bcCrmE, .clase)`: no cambia a quién aplica, solo cuenta como el id que aportaba el `:has()`.

| Regla original (archivo) | Clase que la reemplaza |
|---|---|
| `.content:has(#v-crmLinea.active)` (`taller.html`, estilo en línea) y `body .content:has(> #v-crmLinea.active)` (`crm-wa-compacto.css`) | `.content.bc-crm-activo` |
| `body:has(#v-crmLinea.chat-abierto)` × 3 (`taller-app-movil.css`) | `body.bc-crm-chat-abierto` |
| `body:has(#v-crmLinea.bc-ig-chat-open) #bcAmbientOrbSafe` (`taller-ambient-orb-safe.js`) | `body.bc-crm-ig-abierto` |
| `#v-crmLinea[…facebook]:has(#bcSocialFacebookPanel.bc-fb-open)` (`crm-facebook-chat.css` y × 2 en `crm-canales-iguales.css`) | `#v-crmLinea.bc-crm-fb-abierto` |
| `#v-crmLinea…:has(.crm-busq-row .bcbp-marco.open) #crmSelectorWrap` (`crm-wa-identico.css`) | `#v-crmLinea.bc-crm-busq-abierta` |
| `.crm-busq-row:has(.bcbp-marco.open)` (`crm-wa-compacto.css`) | `.crm-busq-row.bc-crm-busq-abierta` |
| `.wa-chat-col:not(:has(#waDetalle))` × 2 (`crm-wa-identico.css`) | `.wa-chat-col.bc-crm-sin-detalle` |
| `:is(.bc-ig-chat,.bc-social-generic-chat):not(:has(:is(#bcIgMessages,#bcFbMessages)))` (`crm-canales-iguales.css`) | `.bc-crm-sin-mensajes` |

Cómo se ponen y se quitan las clases (`crm-estilos.js`):
- Un vigilante (`MutationObserver`) sobre `#v-crmLinea` copia el estado real a la clase espejo antes de que la pantalla se pinte. Cubre todos los caminos que cambian esos estados (hay más de 10 sitios en 5 archivos), así que no hay que tocar cada uno.
- En tres sitios el código cambia el estado y **mide la pantalla en ese mismo instante**. Ahí la clase se pone al momento:
  - `_crmActualizarClaseChatAbierto` (se envuelve desde la capa, igual que hacen las demás capas; `taller-app.js` no se tocó);
  - `resize()` del chat de Facebook (`crm-facebook-chat.js`, 1 línea);
  - abrir y cerrar el buscador (`bc-busqueda.js`, 2 líneas). Sin esto el buscador se añadía una clase de más (`bcbp-cont-rel`) que antes no se ponía; se vio en la comparación de estilos y quedó corregido.
- Las clases son un espejo exacto: se quitan cuando el estado termina (salir del CRM, cerrar el chat, cerrar el buscador, cambiar de canal).

### Paso 2 · Las otras 73 reglas `:has()` activas
No se tocaron ni se apagó ninguna hoja. Medido después del paso 1, también tras recorrer 8 pantallas y marcar y desmarcar una ventana como abierta antes de entrar al CRM: una burbuja nueva recalcula 6 elementos en el celular y 14 en PC. No queda nada que apagar, y no tocarlas es lo menos arriesgado para las demás pantallas.
De paso mejora todo el taller: una tecla en Recepción recalculaba 193 elementos (celular) y 146 (PC); ahora 13 y 16.

### Paso 3 · Lecturas de tamaño — no se hizo
- `_waEsMovil()` con `matchMedia`: probado en el banco (misma página, función cambiada). No hay ganancia medible: el número de recálculos por acción queda igual (PC: 33 → 33 al entrar; celular: 37 → 37 al abrir un chat) y los tiempos quedan dentro del ruido (unas acciones mejor, otras peor). Además cambiaría el comportamiento con el zoom de dedos en tableta. No se cambió.
- `alFinal()` / `aplicar()` de `crm-wa-identico.js` en un solo cuadro: no se hizo. Esa función también decora la cabecera y la lista; retrasarla un cuadro puede dejar un cuadro sin decorar (parpadeo) y mover el momento en que se decide si el chat está al fondo, justo lo que se pidió no arriesgar (scroll al fondo y teclado del iPhone). Con el paso 1, la lectura de `scrollHeight` ya cuesta poco porque quedan pocos elementos por recalcular.

## Cómo apagar
- En un equipo: `localStorage.bc_crm_estilos_off='1'` y recargar. Para todos: `var BC_CRM_CLASES=false` en `taller.html`.
- Apagado: no se pone `html.bc-crm-clases`, la capa no pone ninguna clase y vuelve a encender las reglas `:has()` originales. Esas reglas siguen escritas en cada archivo, al lado de la nueva, dentro de `@media not all and (min-width:1px)` (un bloque que nunca aplica); la capa les cambia la condición a `all`. Es el mismo principio de la Fase 6 (`bc-form-espaciado-has.css` con `media="not all"`), pero dentro del mismo archivo para no cambiar el orden de las reglas.
- Por qué no `html:not(.bc-crm-clases) body:has(…)`: Chrome empareja de derecha a izquierda, así que evalúa el `:has()` del `<body>` antes de mirar el `<html>` y el contenedor quedaría marcado igual. Esto no lo volví a medir: me apoyo en la Fase 6, que probó poner el filtro delante del `:has()` y no ganó nada.
- Pestañas que queden abiertas desde antes de publicar (`taller.html` viejo en memoria) y entren al CRM después: `crm-wa-identico.js` carga `crm-estilos.js` y, como falta la marca, queda en modo apagado, igual que antes. Probado.

## Archivos
- Nuevos: `crm-estilos.js`, `scripts/pruebas/crm-estilos.cjs`.
- CSS: `crm-wa-identico.css`, `crm-canales-iguales.css`, `crm-wa-compacto.css`, `crm-facebook-chat.css`, `taller-app-movil.css`.
- JS: `taller-ambient-orb-safe.js` (elige la regla según la marca), `crm-facebook-chat.js` (1 línea), `bc-busqueda.js` (2 líneas), `crm-wa-identico.js` (versión y carga de respaldo de la capa), `crm-marketing-consent.js` (versiones).
- `taller.html`: regla en línea, marca `html.bc-crm-clases` en el `<head>` (antes del primer pintado), `<script defer src="crm-estilos.js">` después de `taller-app.min.js`, y versiones.
- `scripts/pruebas/README.md`: la prueba nueva.
- **No se tocaron** `taller-app.js`, `taller-app.min.js`, `crm-whatsapp-pagination.js`, `crm-message-loading.js` ni `crm-social-hub.js` (los de la otra rama). El robot `minificar.yml` no tiene nada que regenerar.
- Sin migraciones, RPC, triggers ni Edge Functions. No se tocó la base ni la web en vivo.

Versiones: `taller-app-movil.css` `20261110-m4`; `crm-estilos.js` `20261110-c1`; cargador `crm-marketing-consent.js` `20261110-c1`; `crm-facebook-chat.css/.js` `20261110-c1` (variable nueva `CRM_C` en el cargador, para no mover la `V` compartida); `crm-wa-identico.js` y sus tres hojas `20261110-w22`; `bc-busqueda.js` `20261110b4`; `taller-ambient-orb-safe.js` `20261110-c1`.

## Pruebas (banco local, datos inventados, Chromium; main en `a29f231` servido aparte para comparar)
### Rendimiento
Añadir una burbuja (300 conversaciones, chat de 500 mensajes; mediana de 15):

| | Celular 390 antes | 390 ahora | PC 1280 antes | 1280 ahora |
|---|---:|---:|---:|---:|
| Elementos recalculados | 1,215 a 5,926 | 6 | 2,359 | 14 |
| ms por recálculo | 31 a 154 | 0.9 | 59 a 63 | 1.1 a 2.2 |
| ms con CPU ×4 | 146 a 839 | 3.9 a 4.1 | 315 a 373 | 6 a 10 |
| Cambio en una fila de la lista: elementos | — | — | 2,355 | 12 |

(El «antes» del celular varía según se haya pasado o no por otras pantallas; el «ahora» no.) Con la bandera de apagado vuelve a 1,216–5,927 y 2,360–7,071 elementos: la bandera devuelve lo anterior también en el costo.

Acciones completas con CPU ×4 (una corrida de cada una; el ruido entre corridas iguales fue de hasta ±15 %):

| Acción | 390 antes | 390 ahora | 1280 antes | 1280 ahora |
|---|---:|---:|---:|---:|
| Ver la bandeja | 1,255 ms | 774 ms | 732 ms | 718 ms |
| Abrir un chat | 1,536 ms | 736 ms | 2,432 ms | 1,005 ms |
| Pintar un mensaje entrante | 511 ms | 173 ms | 1,097 ms | 376 ms |
| Enviar: aparece la burbuja | 1 ms | 2 ms | 1 ms | 1 ms |
| Enviar: pantalla ocupada después | 2.4 s | 1.3 s | 3.9 s | 1.8 s |
| Buscar (6 teclas): bloqueo | 2.9 s | 2.0 s | 4.6 s | 2.5 s |
| Tiempo en estilos al abrir un chat | 1,802 ms | 668 ms | 3,203 ms | 789 ms |

Lo que queda de tiempo en estilos es dar estilo a los elementos nuevos cuando la lista o el hilo se reconstruyen enteros. Eso es de la otra rama.

### Igualdad visual
1. **Estilos calculados**, todos los elementos × todas las propiedades, main frente a la rama, en 15 pantallas (Prefactura y Órdenes antes de entrar al CRM; bandeja de WhatsApp; chat con imagen, audio, mensaje eliminado, respuestas citadas y separador de fecha; panel de información; menú del chat; buscador con texto; bandeja y chat de Instagram; bandeja y chat de Facebook; Solicitudes; otro chat; Prefactura y Órdenes después de salir del CRM): **0 diferencias** a 390 px (4,486 a 5,854 elementos por pantalla) y **0** a 1280 px (4,486 a 6,904).
   - Una corrida anterior a 1280 con las dos páginas a la vez dio distinto número de elementos en 8 pantallas; no se repitió y no se encontró la causa. Con las dos páginas a la vez, la que queda detrás no anima ni mide igual (el control main contra main da esas mismas diferencias), por eso la corrida buena del celular se hizo una página a la vez.
2. **Píxel a píxel** (capturas en `crm-c/capturas` del área de trabajo de la sesión), contra las capturas de main:

| Comparación | Pantallas | Píxeles distintos (máximo por pantalla) |
|---|---:|---|
| main contra main (ruido) | 30 | 0 en 27; 22 en 3 |
| main contra la rama (corrida 1) | 30 | 0 en 23; 4 a 34 en 7 |
| main contra la rama (corrida 2) | 30 | 0 en 25; 22 en 5 |
| main contra la rama apagada | 30 | 0 en 26; 2 a 22 en 4 |
| main contra «`taller.html` viejo + archivos nuevos» | 30 | 0 en 21; 22 a 34 en 9 |
| Modo app del celular (chat a pantalla completa), main contra la rama | 8 | 0 en 6; 3 en 2 |
| Modo app, main contra la rama apagada | 8 | 0 en 6; 3 en 2 |
| Modo app, main contra main (ruido) | 8 | 0 en 7; 2 en 1 |

   Cada captura a 1280 tiene 1,152,000 píxeles y a 390, 329,160. Se ampliaron tres para mirarlas: la esquina de la tarjeta del CRM en (88,68)–(105,85), el borde de un contador y el de un avatar. Las tres son el suavizado de un borde redondo, con un tono de diferencia. Las demás tienen el mismo tamaño (2 a 34 píxeles) y no se miraron una por una. La esquina es la misma que sale al comparar main contra sí mismo.

### Prueba nueva: `scripts/pruebas/crm-estilos.cjs`
A 390 y 1280 px, encendido, apagado y con el `taller.html` anterior: **Todo bien**.

### Pruebas existentes (antes = main; después = la rama)
| Prueba | Antes | Después |
|---|---|---|
| `crm-editar-mensaje`, `crm-ortografia`, `wa-quien-envio`, `solicitudes-crm`, `flow-financiamiento`, `app-movil`, `ui-global`, `prefactura-compacta`, `sin-internet`, `prefactura-confiable`, `guardar-rapido` | pasan (11) | pasan (11) |
| `buscador-motion` | ya fallaba (`TimeoutError`: el menú lateral tapa el clic) | falla igual, por lo mismo |

- `crm-editar-mensaje.cjs` comprobaba la versión exacta `w21` de `crm-wa-identico.js`; se actualizó a `w22` (única línea cambiada en una prueba existente). Sin ese cambio fallaba solo por el número de versión.
- `buscador-motion` es la prueba del buscador y no sirve hoy (ya fallaba en main). El cambio de `bc-busqueda.js` quedó cubierto por las capturas «buscador con texto» y por `crm-estilos.cjs`, no por esa prueba.

## Lo que no se pudo probar
- Safari ni un iPhone real (ni el teclado real del iPhone). Todo es Chromium. En Safari el `:has()` se resuelve de otra forma: la igualdad visual debe mantenerse (son clases normales), pero la ganancia de velocidad no está medida ahí.
- Firefox.
- El modo apagado solo se comparó en las mismas pantallas; al encender las reglas originales puede pasar un cuadro entre que la hoja carga y se encienden.
- Notas de voz, plantillas, Leads, Campañas y Automatizaciones por dentro.
- Un empleado no administrador (salvo el modo app con `bc-solo-movil`).

## Riesgos
- Quien escriba una regla nueva con `:has()` sobre `body`, `.content`, `#v-crmLinea` o la columna del chat vuelve a traer la lentitud. La prueba nueva lo detecta (cuenta los elementos recalculados por burbuja y las reglas `:has()` activas del CRM).
- Si alguien cambia una regla nueva, debe cambiar también su copia apagada de al lado.
- `body.bc-crm-chat-abierto` copia a `#v-crmLinea.chat-abierto` tal cual. Esa clase ya se quedaba puesta al salir del CRM con un chat abierto en el celular (en main también); no se cambió para no alterar nada.
- Al unir con `claude/crm-rapido-ab`: choque probable solo en la línea de `crm-marketing-consent.js?v=` de `taller.html` (y en la `V` del cargador si esa rama la sube). Se resuelve dejando la versión más nueva.

## Estado
Rama `claude/crm-rapido-c`, **sin publicar** y sin PR. Falta el OK del dueño.

## Siguiente paso
Unir con la parte A/B, volver a correr `crm-estilos.cjs` y la comparación de capturas, y que el dueño lo pruebe en un iPhone real antes de publicar.
