---
name: apple-design
description: >-
  Guía de diseño visual estilo Apple (Human Interface Guidelines) para
  modernizar pantallas de taller.html / index.html en BAYOL CELL. Úsala cuando
  Sterling pida un rediseño "premium", "moderno", "más limpio", "estilo
  Apple/iOS", o mande un mockup para que una pantalla se vea mejor — cubre
  tipografía, espaciado, sombras, color, iconos y el patrón de implementación
  (capa de estilo "scoped" que no toca IDs, onclick ni lógica).
---

# Diseño estilo Apple para BAYOL CELL

Referencia de estética cuando Sterling pide modernizar una vista de
`taller.html` (o `index.html`). **No es una skill de arquitectura ni de
Supabase** — es solo la capa visual. Para todo lo demás (RLS, permisos, flujo
de datos, convención de módulos) seguir lo que ya dice `CLAUDE.md`.

## Cuándo se usa
- "Rediseña X", "hazlo más premium/moderno", "que se vea como [mockup]",
  "mejora la apariencia de...", o cualquier pedido de estética sin tocar
  funcionalidad — el mismo tipo de pedido detrás de los rediseños ya hechos
  esta temporada: buscador de Info Plus (tarjetas), Ficha del Equipo, Agregar
  equipo al lote, Recepción, Incentivos, Comparación Info Plus, CRM WhatsApp.
- **No** aplica si el pedido es una función nueva o un cambio de lógica —
  en ese caso la estética es secundaria a que el dato/flujo esté correcto.

## Principios visuales (Human Interface Guidelines, adaptado a web/móvil)
- **Tipografía como jerarquía principal.** El tamaño y el peso (700–850 para
  títulos, 400–600 para cuerpo) comunican importancia — no el color. Números
  grandes y en negrita para KPIs; texto secundario en gris (`#64748b`/
  `#475569`, nunca más claro — ver la regla de contraste de `CLAUDE.md`).
- **Espaciado generoso y consistente.** Pensar en múltiplos de 4px (4/8/12/16/
  20/24). Preferir más aire entre bloques a comprimir todo — la densidad se
  gana con jerarquía clara, no con márgenes de 2px.
- **Esquinas redondeadas de verdad.** Tarjetas 14–20px, botones/chips/inputs
  8–14px, avatares y badges circulares (999px). Nada de esquinas a 2–4px que
  se sienten "de formulario viejo".
- **Profundidad con sombra suave, no con bordes duros.** Sombras difusas y
  tenues (`box-shadow:0 Npx Mpx -Kpx rgba(15,23,42,.2-.45)`), bordes casi
  invisibles (`rgba(...,.08-.14)`) o ninguno. Evitar bordes sólidos de 1-2px
  en gris oscuro — eso es estética "tabla de Excel", no premium.
- **Un solo acento de color por pantalla.** El rojo de marca (`#e31e24`) es el
  acento de BAYOL CELL; si el módulo ya estableció otro acento (azul en CRM/
  WhatsApp, siguiendo `--crm-azul:#2563eb`), respetar ESE, no mezclar. El
  resto de la paleta es grises neutros + blanco. Color con propósito (estado,
  acción principal), no decorativo — "un color = una cosa".
- **Iconos, nunca emoji.** `<i class="ti ti-*">` (Tabler, ya cargado en el
  proyecto) en gris o en el acento — un ícono por elemento, sin duplicar con
  emoji al lado, del mismo peso/tamaño que el texto que acompañan. Ver la
  convención ya aplicada en Financiamiento y en los rediseños de Recepción/
  buscador/ficha de equipo.
- **Movimiento discreto.** Transiciones 150–250ms, `ease`/`cubic-bezier`
  suave, cancelable, en hover/focus/active — nunca animaciones que retrasen
  una acción que el usuario ya pidió (ver la reversión de la animación de
  "Imprimir", 20 jul: Sterling la sintió más lenta y se quitó). Respetar
  `prefers-reduced-motion`.
- **Contenido primero, progressive disclosure.** Cada tarjeta/fila debe
  poder leerse de un vistazo: dato principal grande, metadatos pequeños
  debajo, acciones al final o a la derecha. Preferir menús "Más opciones"
  para lo ocasional en vez de amontonar todos los botones. Si algo no ayuda
  a decidir o actuar, no va.

## Números concretos, no adjetivos
Al revisar o proponer un cambio, dar cifras — "12px gris #64748b sobre
blanco, contraste 4.7:1" en vez de "se ve pequeño". Referencias mínimas
(adaptadas de Apple HIG a un panel web usado desde el celular):
- **Contraste de texto:** ≥4.5:1 para texto ≤17px; ≥3:1 para texto ≥18px o
  negrita. Nunca informar contraste solo "a ojo".
- **Tamaño de texto:** cuerpo 13–15px como piso en el panel del taller (no
  bajar de ahí "para que quepa más" — se gana espacio con jerarquía, no con
  letra diminuta).
- **Áreas táctiles:** mínimo 40×40px (ideal 44×44px) para cualquier botón/
  ícono tocable — Sterling usa el sistema desde el celular todo el día.
- **Un color = una cosa.** Si el rojo de marca ya significa "acción
  principal", no reusarlo también para "error" en la misma pantalla.

## Botones (auditado contra el HIG real de Apple, filtrado a lo que aplica en web)
Verificado contra la página "Buttons" del HIG (se descartó todo lo específico
de apps nativas de macOS/iPadOS que no aplica a un panel web: push/square/
help buttons, spring loading, SF Symbols, elipsis de ventana, visionOS).
Lo que SÍ aplica y conviene seguir en `taller.html`:
- **1–2 botones prominentes por pantalla/tarjeta, máximo.** El resto va como
  botón secundario (`.btn-light`) o dentro de "Más opciones" — ya es el
  patrón usado en Reacond ("Pasar a ▾") y Órdenes ("Más opciones"). Un
  tercer botón "destacado" compitiendo por atención confunde cuál es la
  acción esperada.
- **Estilo, no tamaño, para marcar la opción preferida.** El botón principal
  usa el acento (relleno, color de marca); los demás quedan neutros
  (`.btn-light`, borde/gris) — no agrandar un botón para que "se note más".
- **Nunca el rojo/estilo "principal" en un botón destructivo**, aunque sea
  la acción más probable en esa pantalla. Borrar/Eliminar/Anular llevan su
  propio color de peligro (rojo también sirve, pero DISTINTO tratamiento
  visual del botón "primario" de esa vista — ej. outline en vez de relleno,
  o agrupado aparte) para que no se confunda con "seguir/guardar". Un botón
  "Cancelar" nunca debe verse como el botón por defecto.
- **Etiquetas: verbo + acción concreta, sin relleno.** "Guardar cambios",
  no "Enviar"; "Registrar compra en Info Plus", no "Aceptar". El texto del
  botón debe decir exactamente qué va a pasar. Ya es la convención de este
  repo (ver los nombres de botón en Reacond/Financiamiento/Recepción) —
  mantenerla al agregar botones nuevos.
- **Estado de presión visible** en cualquier botón (`:active` con
  `transform:scale(.96-.98)` o cambio de fondo) — refuerza que el toque
  registró, sobre todo en celular donde no hay hover.
- **No poner botones "ocasionales" (help, ajustes finos, acciones raras) al
  mismo nivel visual que la acción principal de la vista.**

## Vidrio (Liquid Glass) — auditado, cuándo sí y cuándo no
Verificado contra la guía "Liquid Glass" del HIG. Este proyecto **ya usa**
vidrio/blur en varios lados (sidebar y top-bar "vidrio oscuro", tarjetas
`.card` con `backdrop-filter`, el buscador de artículos) — esto NO pide
quitarlo ni rehacerlo todo; es la referencia para lo NUEVO y para decidir
si vale la pena tocar algo existente.
- **Regla de las dos capas.** El vidrio va en la capa "flotante" (barra
  superior, modales, popovers, la barra de escribir que queda fija abajo en
  WhatsApp/Facebook, menús desplegables) — **no** en la capa de contenido
  (tarjetas de datos, filas de lista, fondos de vista). Poner blur en cada
  tarjeta de una lista larga es justo el error que señala el HIG ("vidrio en
  contenido = defecto") y además es caro en rendimiento con muchas tarjetas
  en un celular. Si una pantalla nueva necesita "sensación premium", el
  vidrio va en su barra fija o su modal, y las tarjetas de datos usan sombra
  suave (ver arriba), no blur.
- **Con moderación.** Unos pocos elementos flotantes con vidrio por pantalla,
  no todos. Vidrio encima de vidrio (un modal con blur sobre una barra con
  blur) es confuso — máximo una capa de vidrio a la vez en el mismo punto de
  la pantalla.
- **Valores de referencia** (ya en el rango de lo que usa el repo — sidebar/
  top-bar están en `blur(12-18px) saturate(140-150%)`, tarjetas en
  `blur(20px) saturate(170%)`): blur 20-40px y relleno 60-80% de opacidad
  para la variante normal (con texto); blur 8-16px y relleno 20-40% solo si
  va encima de una foto/video real (fotos de equipo, catálogo) — nunca sobre
  fondo plano.
- **Sin color propio.** El vidrio toma el color de lo que tiene detrás; los
  íconos/texto encima van neutros (gris oscuro/blanco), y el color de marca
  se reserva para 1-2 acciones primarias como máximo — mismo límite que la
  sección de Botones.
- **Accesibilidad real, no cosmética:** respetar
  `prefers-reduced-transparency` (fondo sólido en vez de blur),
  `prefers-contrast` (borde/relleno más fuerte) y `prefers-reduced-motion`
  (sin animación) cuando se agregue vidrio nuevo — Safari en iPhone sí
  reporta estas preferencias.

## Evitar el look genérico de plantilla de IA
Antes de dar un rediseño por terminado, preguntarse: *¿este mismo diseño le
serviría a cualquier otro negocio, o tiene algo que lo hace de BAYOL CELL?*
Señales de que quedó "genérico" (evitarlas o justificarlas):
- Combos gastados: crema cálido + serif + terracota; casi-negro + acento
  ácido; solo líneas finas sin radio de esquina; número grande + etiqueta
  chica + degradado, sin nada más.
- El rojo de marca (o el acento del módulo) apareciendo repetido como
  decoración en vez de reservarse para lo importante.
- Nada que se sienta hecho a medida del taller (RD$, es-DO, el flujo real
  de reacondicionados/CRM/financiamiento) — si el texto/ejemplo de mentira
  serviría para cualquier app de inventario, falta contexto real.
Antes de cerrar: ¿qué es lo único que esta pantalla va a hacer recordar? Y
¿se puede quitar un accesorio más sin perder nada?

## Lo que este proyecto YA decidió — no reabrir
- **Sin tema oscuro**, aunque el HIG de Apple en general pida soportar claro
  y oscuro. Palabras textuales de Sterling: *"sus herramientas necesarias, el
  diseño lo modernizamos nosotros; del tema oscuro nada"*. No proponer dark
  mode ni "detectar preferencia del sistema" para colores oscuros en el panel
  del taller (la landing pública es aparte). Es una decisión de producto ya
  tomada, no un vacío por llenar.
- **Sin emojis en la interfaz** (ya es regla general del proyecto, no solo de
  Financiamiento).
- **Español, RD$, es-DO, imprimible/PDF/WhatsApp** cuando aplique — ver
  `CLAUDE.md`.
- **Fuente:** el proyecto ya usa **Plus Jakarta Sans** por CDN en las
  pantallas rediseñadas (buscador de artículos, loader). Si la vista no la
  tiene cargada y el rediseño lo amerita, seguir ese mismo patrón en vez de
  inventar otra tipografía; si no, el stack de sistema (`-apple-system,
  BlinkMacSystemFont, "Segoe UI", sans-serif`) ya da la sensación "Apple" sin
  cargar nada nuevo.

## Cómo implementarlo (patrón ya probado en este repo)
1. **Capa de estilo "scoped", nunca tocar lógica.** Igual que en Recepción
   (`#v-recepcion`), Ficha del Equipo (`.fe-*`), o el buscador de artículos
   (`.ab-*`): un bloque `<style>` con selectores acotados al contenedor de esa
   vista/modal, o clases nuevas con prefijo propio. **No cambiar ningún
   `id`, `onclick`, nombre de función ni estructura de datos** — el mismo
   HTML/JS sigue funcionando, solo cambia cómo se ve.
2. **Reutilizar el patrón de modal existente** (`.modal-backdrop` >
   `.modal-box` > `.modal-header`/`.modal-body`/`.modal-footer`,
   `classList.add('active')`) si es una ventana — no inventar otro sistema de
   modales.
3. **Mobile-first de verdad.** Sterling usa el sistema principalmente desde
   el celular — probar/pensar el layout a ancho angosto (~375–420px) antes
   que el de escritorio. Reciclar `_abPageNums`, `_eqCardRow`, `_rpInit` como
   referencia de qué "se ve bien" en este proyecto.
4. **Verificar sintaxis antes de commitear** — el checklist de JS/CSS de
   `CLAUDE.md` (el one-liner de `node -e` sobre los `<script>` de
   `taller.html`, y balance de llaves si se toca un `.css` aparte).
5. **Antes de subir a `main`**: pedir confirmación como siempre, y seguir el
   flujo de "Para probarlo" con pasos concretos + recordar `Ctrl+Shift+R`
   (desktop) o limpiar caché de Safari (iOS: Ajustes → Safari → Avanzado →
   Datos de sitios web → borrar "bayolcell").

## Checklist rápido antes de dar por terminado un rediseño
1. ¿Se ve bien a ancho de celular (375px), sin desbordes horizontales?
2. ¿Cero emojis, cero tema oscuro?
3. ¿Los `id`/`onclick`/funciones siguen intactos (mismo comportamiento)?
4. ¿Un solo acento de color, consistente con el módulo?
5. ¿Sombras suaves en vez de bordes duros; esquinas redondeadas reales?
6. ¿Contraste de texto y tamaño de áreas táctiles dentro de los mínimos de
   arriba (no solo "a ojo")?
7. ¿No quedó genérico — tiene algo que lo hace de BAYOL CELL y no de
   cualquier otro negocio?
8. ¿Como máximo 1–2 botones prominentes, ningún destructivo con estilo de
   botón principal?
9. Si hay vidrio/blur nuevo: ¿está en la capa flotante (barra/modal), no en
   tarjetas de contenido, y con `prefers-reduced-transparency`/`-contrast`/
   `-reduced-motion` cubiertos?
10. ¿Sintaxis verificada (JS/CSS) antes de commitear?

## Fuente
Principios adaptados de las Apple Human Interface Guidelines (accesibilidad,
tipografía, color, contenido, botones, Liquid Glass — estas dos últimas
páginas se leyeron completas y se filtró explícitamente lo que no aplica a
un panel web) más una capa de criterio de estudio para evitar el look
genérico de plantilla, con las convenciones propias de BAYOL CELL siempre
por encima cuando hay conflicto (ver arriba). No se instaló ningún paquete
de terceros para esta skill — es contenido propio del repo, sin
dependencias externas ni código ejecutado fuera de este archivo.
