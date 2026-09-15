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

## Principios visuales (Human Interface Guidelines, adaptado)
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
  acción principal), no decorativo.
- **Iconos, nunca emoji.** `<i class="ti ti-*">` (Tabler, ya cargado en el
  proyecto) en gris o en el acento — un ícono por elemento, sin duplicar con
  emoji al lado. Ver la convención ya aplicada en Financiamiento y en los
  rediseños de Recepción/buscador/ficha de equipo.
- **Movimiento discreto.** Transiciones 150–250ms, `ease`/`cubic-bezier`
  suave, en hover/focus/active — nunca animaciones que retrasen una acción
  que el usuario ya pidió (ver la reversión de la animación de "Imprimir",
  20 jul: Sterling la sintió más lenta y se quitó).
- **Contenido primero.** Cada tarjeta/fila debe poder leerse de un vistazo:
  dato principal grande, metadatos pequeños debajo, acciones al final o a la
  derecha. Si algo no ayuda a decidir o actuar, no va.

## Lo que este proyecto YA decidió — no reabrir
- **Sin tema oscuro.** Palabras textuales de Sterling: *"sus herramientas
  necesarias, el diseño lo modernizamos nosotros; del tema oscuro nada"*. No
  proponer dark mode ni "detectar preferencia del sistema" para colores
  oscuros en el panel del taller (la landing pública es aparte).
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
6. ¿Sintaxis verificada (JS/CSS) antes de commitear?
