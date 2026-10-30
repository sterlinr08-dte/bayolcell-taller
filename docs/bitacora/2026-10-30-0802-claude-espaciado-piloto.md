# Piloto de la regla «Espaciado de formularios» en 5 formularios (30-oct-2026, 08:02 RD)

**Rama:** `claude/espaciado-piloto` (desde `origin/main` `9b695d5`). **Sin publicar, sin PR.** No se tocó la base ni Info Plus.

## Pedido del dueño
«Sí, empieza con los 5»: aplicar la regla de DESIGN.md «Espaciado de formularios (29-oct-2026)» + §4b + §5 a cinco
formularios de Bayol Cell, medir antes y después, y dejarlo listo para verlo antes de decidir.

## Qué formularios (y cómo se eligieron)
1. **Prefactura** (vista `recepcion`, capa `taller-prefactura`): el documento completo y su ventana **Buscar cliente** (`#modalRpCli`).
   El buscador de artículos es una lista emergente sin campos propios, así que no se midió como formulario.
2. **Nuevo empleado** (`taller.html #modalTecnico`).
3. **Login del taller** (`#login .login-card`, mismo `taller.html`).
4. **Nueva orden / recepción de equipo**: hoy la orden se crea desde el plegable **«Equipo, falla y más datos»** de la Prefactura
   (tarjetas Equipo recibido · Falla reportada · Orden de reparación · Otras herramientas). La auditoría no tenía una fila con ese
   nombre; es el formulario de orden que usa el taller. Se midieron las 4 tarjetas.
5. **Cliente**: la única ventana de nuevo/editar cliente del taller es la de **Financiamientos** («Nuevo cliente» / «Editar cliente»,
   `nuevoClienteFin()` → `#modalGenerico`). Los clientes de la Prefactura vienen de Info Plus y solo se buscan. Tampoco estaba en la auditoría.

## Qué se hizo
- **Capa nueva y aislada `bc-form-espaciado.css`** (solo actúa con `html.bc-fesp`), cargada **al final** del `<head>` de `taller.html`
  para ganar la cascada. Interruptor igual que las otras capas: `BC_FESP=false` para todos, `localStorage.bc_fesp_off='1'` en un equipo.
- Reglas acotadas por id/clase a los 5 formularios. Solo espacios, altos y letras: no cambia JS, ni colores de marca.
  Media query: 24/16 px hasta 760 px; 48/40 px desde 761 px.
- `taller-app.js` **no se tocó**. En `taller.html` solo se agregaron el `<script>` del interruptor y el `<link>` (`?v=20261030-e1`).

### Decisiones de interpretación (para que el dueño las confirme)
- **Barra de título de color** (`.modal-header`, y el `summary` del plegable): se toma como barra, no como contenido. El relleno
  24/48 se mide debajo de ella. El pie de la ventana Nuevo empleado deja de ser una franja gris aparte: queda transparente, a 24 px
  del último campo y con el borde interior abajo (es el único cambio que no es puro espacio; se revierte quitando 2 propiedades).
- **Franja de atajos F2/F9** de la Prefactura (PC) se toma como barra inferior, no como contenido.
- **Interruptor «Promos»** (switch de promociones por WhatsApp) no es una casilla §4b: no se convirtió en casilla; solo se le dio
  zona de toque de 44 × 44 en el celular (antes 38 × 44).
- **Plegable «Equipo, falla y más datos»**: el cajón guarda 4 tarjetas; cada tarjeta lleva el borde interior de la regla y entre
  tarjetas van 24 px (antes las tarjetas se estiraban a la misma altura; ahora cada una con su alto).
- **Nuevo cliente**: la ✕ la pone la capa `taller-nav-apple.js` (36 px en PC con zona ampliada invisible). Se le fijó `--bcn-s: 44px`
  solo en esta ventana para que mida 44 reales y no se salga de su columna.
- La **Prefactura en PC crece 64 px de alto** por el relleno 48/40 (riesgo abajo).

## Medidas (Playwright, Supabase simulado, 390 y 1280 px; tolerancia ±2)
Programas: `/tmp/claude-0/-home-user-nexus-pro/93030ade-f60e-5c69-95e5-b8cd3ec95121/scratchpad/espaciado-bayol/medir-5.cjs`
(reúsa `medir.js` y `evaluar.cjs` de la auditoría del 29-oct). «Borde» = arriba/abajo · izq/der. «desl.» = la ventana se desplaza
por dentro y no se mide abajo. En la Prefactura el botón principal está en la barra fija (54 px), por eso no hay «grupo → botón».

| Formulario | Estado | Medida | 390 antes → después | 1280 antes → después |
|---|---|---|---|---|
| Prefactura (documento) | no cumple (9) → **cumple** | etiqueta → cajita | 4 → **8** | 2 → **8** |
| | | campo → campo (mediana) | 14 → **20** | 21 → 21 |
| | | borde interior | 15/16 · 13/13 → **25/26 · 17/17** | 11/15 · 17/17 → **49/49 · 41/41** |
| | | etiquetas / tocable chico | #5b5951, switch 38 px → **#475569, 44 px** | #5b5951 → **#475569** |
| Prefactura · Buscar cliente | no cumple (4) → **cumple** | borde interior | 16/21 · 16/16 → **23/24 · 16/16** | 18/25 · 20/20 → **46/48 · 40/40** |
| | | fila «CLIENTE DE CONTADO» | 38 px → **44 px** (filas a 8 px) | 38 → **44** |
| Equipo, falla y orden (4 tarjetas) | no cumple (10) → **cumple** | etiqueta → cajita | 4 → **8** | 2 → **8** |
| | | campo → campo | 10 → **20** | 10 → **20** |
| | | borde interior (tarjeta Equipo) | 13/13 · 15/15 → **25/25 · 17/17** | 13/13 · 15/15 → **49/49 · 41/41** |
| | | «Generar boleto» | 48 → **54** | 48 → **54** |
| Nuevo empleado | no cumple (10) → **cumple** | etiqueta → cajita / campo → campo | 5 / 17 → **8 / 20** | 5 / 17 → **8 / 20** |
| | | borde interior | 16/desl. · 16/16 → **24/desl. · 16/16** | 20/desl. · 20/20 → **48/desl. · 40/40** |
| | | Guardar / letra mínima | 44 / 11 → **54 / 13** | 44 / 11 → **54 / 13** |
| Nuevo cliente (Financiamientos) | no cumple (17) → **cumple** | campos alto/letra | 44/16 → **48/16** | 39/13 → **48/16** |
| | | etiqueta → cajita / campo → campo | 5 / 16 → **8 / 20** | 5 / 16 → **8 / 20** |
| | | borde interior | 36/desl. · 20/20 → **24/desl. · 16/16** | 20/20 · 20/20 → **48/desl. · 40/40** |
| | | Registrar cliente / tocables chicos | 40 / 0 → **54 / 0** | 33 / 16 → **54 / 0** |
| Login del taller | no cumple (23) → **cumple** | título → ayuda / etiqueta → cajita | 0 / 5 → **8 / 8** | 0 / 5 → **8 / 8** |
| | | campo → campo / campos → botón | 16 / 16 → **20 / 24** | 16 / 16 → **20 / 24** |
| | | borde interior | 29/29 · 21/21 → **25/25 · 17/17** | 41/41 · 41/41 → **49/49 · 41/41** |
| | | campos / botón / «Volver» | 44/16 · 42 · 39 → **48/16 · 54 · 44** | 44/13 · 42 · 39 → **48/16 · 54 · 44** |

Resultado: **los 6 medidos (5 formularios + Buscar cliente) en «cumple»** a 390 y 1280.

## Comprobaciones
- Sin desplazamiento horizontal en ninguno (390 y 1280).
- Las ventanas se desplazan por dentro y el botón principal queda visible al llegar abajo (Nuevo empleado 54 px, Nuevo cliente 54 px);
  la barra fija «Guardar» de la Prefactura sigue visible con el plegable abierto.
- **Capa apagada (`bc_fesp_off=1`) = main:** las medidas son idénticas a las de `origin/main` limpio en los 6 formularios; las capturas
  solo difieren en el anillo de foco del primer campo y en el adorno animado del buscador (0–2,7 % de píxeles), no en la disposición.
- Banco de pruebas: `scripts/pruebas/prefactura-confiable.cjs` 8/8 sin errores; `scripts/pruebas/ui-global.cjs` «Todo bien»;
  `tests/ai-board` unit: 5/6 (falla `placas-permisos` por falta del paquete `@electric-sql/pglite` en este equipo, igual que antes).
- Capturas antes/después y comparativas lado a lado:
  `/tmp/claude-0/-home-user-nexus-pro/93030ade-f60e-5c69-95e5-b8cd3ec95121/scratchpad/espaciado-bayol/` (`antes-*.png`, `despues-*.png`,
  `comparativa-<formulario>-<ancho>.png`, `apagado-*.png`, `diff-*.png`, `antes.json`, `despues.json`, `apagado.json`).

## Cómo apagarlo
- Un equipo: en la consola `localStorage.bc_fesp_off='1'` y recargar. Todos: `BC_FESP=false` en `taller.html` (o quitar el `<link>`).

## Riesgos / pendientes
- Las ventanas **crecen**: Nuevo empleado y Nuevo cliente necesitan más desplazamiento en el celular; la Prefactura mide 64 px más en PC
  y la franja F2/F9 queda bajo la barra fija hasta desplazar. La ventana de Buscar cliente es más alta en PC (relleno 48/40).
- Las interpretaciones de arriba (barra de título, pie transparente, switch, tarjetas del plegable) son propuestas; el dueño decide.
- No probado en iPhone real ni con íconos (la fuente Tabler no carga en el banco).
- Los otros 68 formularios de la auditoría siguen igual; si el piloto gusta, el mismo patrón sirve para `.modal-box` en general.

## Siguiente paso
Que el dueño vea la rama (o las comparativas) y diga si sigue con el resto de ventanas, con qué interpretación de la barra de título
y del pie, y si el crecimiento de la Prefactura en PC le parece bien.
