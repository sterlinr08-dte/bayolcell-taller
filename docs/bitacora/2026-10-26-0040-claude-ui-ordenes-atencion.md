# 26-oct-2026 00:40 (RD) — Órdenes de servicio y Atención: lista compacta, ficha con píldoras (agente 2 de 10)

## Pedido
Dueño: «lanza 10 agentes para mi sistema del taller para que me trabaje en parte gráfica interface y los procesos de los
reacondicionados». A este agente le tocó **Órdenes de reparación (`v-ordenes`) y Atención (`v-atencion`)**: filas compactas
pero de 44 px o más, estado en la misma píldora con punto de la Prefactura, acciones agrupadas sin duplicar, buscador con lupa
y móvil cómodo. Rama `claude/taller10-a2` (sale de `main` af7016f). **Sin publicar, sin push.**

## Qué encontré (código real)
- `v-ordenes`: tarjetas `.bcf-*` que arma `_ordCardHTML` (taller-app.js) con estilos de `taller-flota.js`. Cada tarjeta
  medía **479 px** de alto en el celular (491 en la PC) por la foto de 128 px. El buscador ya era lupa (`bc-busqueda`, 44 px).
- `v-atencion`: secciones de `renderAtencionCliente`; cada orden es la ficha de `construirCardOrden` (la misma que usa
  Mi trabajo). Problemas: 90 elementos en MAYÚSCULAS (botones «FINALIZAR», «EN ESPERA DE REPUESTO», chip «EN PROCESO /
  REPARANDO AHORA», «ESTADO DEL EQUIPO», insignias «URGENTE», «GARANTÍA», «PIEZAS ADICIONALES:»), estado con emoji y en
  mayúscula (`obtenerEtiquetaOrden`), acciones en una columna larga (una fila por botón), los filtros «Todas / Activas /
  Entregadas» y de fecha **no marcaban cuál estaba puesto**, y emojis en filtros y buscadores.

## Qué cambié
1. **Capa nueva `taller-ui-ordenes.css`** (en el `<head>`, clase `html.bc-uiord`) y **`taller-ui-ordenes.js`** (defer).
   Apagar en un equipo: `localStorage.bc_uiord_off='1'`; para todos: `BC_UIORD=false` en taller.html.
   - Lista de órdenes: la foto pasa a miniatura de 56 px a la izquierda del título → tarjeta de **339 px** (antes 479/491).
     Estado en píldora con punto igual a `.bcpf-est` (fondo claro, texto y punto del color del estado). Filtros, botón de
     clave, «Label diagnóstico» y paginación a 44 px en píldora.
   - Ficha de la orden (`.bco-ficha`): estado en píldora con punto; las acciones son píldoras de 44 px que se acomodan de
     dos en dos (antes una columna); «Más opciones» de 44 px con su contenido también de dos en dos; «Urgente / Marcar
     urgente» se ve de 26 px pero se toca en 44 px; caja de fallas y chip de estado más bajos; números con `tabular-nums`.
   - Atención: filtros en píldora de 44 px, el elegido en naranja Bayol (`aria-pressed`, lo pone el .js), títulos con el
     número en una burbuja, KPI y etiquetas sin mayúsculas.
2. **taller-app.js (solo textos y clases, sin lógica):**
   - `construirCardOrden`: clase `bco-ficha` + `data-tono` en la ficha; estado con `bco-est` y texto de `_BCF_ORD_TXT`
     («En proceso»); botones en minúscula y cortos: Autorizado, Finalizar, Repuesto llegó, Espera repuesto, Esperando
     cliente, No reparado, Volvió reparado, Continuar aquí, Derivar, Notas, Pedir pieza (garantía); «Estado» en vez de
     «ESTADO DEL EQUIPO»; Urgente, Garantía, Tienda, Piezas adicionales sin mayúsculas. Mismos `onclick` y permisos.
   - `construirEstadoVisual`: quitado el `toUpperCase()` del chip (se ve «En proceso / Reparando ahora» en todas partes).
   - `renderAtencionCliente`: KPI «Recibidos hoy · Diagnóstico · Reparación · Espera pieza · Por entregar»; títulos
     «Historial del cliente», «Por entregar», «Esperando cliente», «Órdenes», «Reparaciones terminadas»; filtros sin
     emojis con `bco-fil` y `data-af` / `data-afd`; buscadores sin 🔍 y con `aria-label`.
   - `bash scripts/minificar.sh` → `taller-app.min.js` regenerado; `node --check` OK.
3. **taller.html:** solo 3 líneas de la capa (interruptor + `<link>` junto a la Prefactura) y 1 `<script defer>` junto a
   `taller-info.js`.

## Archivos
`taller-ui-ordenes.css` (nuevo), `taller-ui-ordenes.js` (nuevo), `taller-app.js`, `taller-app.min.js`(+.map), `taller.html`,
esta bitácora.

## Pruebas (banco local, Supabase simulado, puerto 8802, 10 órdenes de prueba en 10 estados)
| Medida | 390 antes → después | 1280 antes → después |
|---|---|---|
| Alto de la vista Órdenes | 5297 → **3885 px** | 2358 → **1750 px** |
| Alto de una tarjeta de orden | 479 → **339 px** | 491 → **339 px** |
| Alto de la vista Atención | 9555 → 9539 px | 6091 → **5739 px** |
| Controles < 44 px (Órdenes / Atención) | 1 / 2 → 1* / **0** | 1 / 2 → 1* / **0** |
| Elementos en MAYÚSCULAS en Atención | 90 → **5** (solo encabezados de tabla, permitido) | 90 → **5** |
| Desplazamiento lateral | no | no |
| Errores de JavaScript | 0 | 0 |
\* el `<input>` plegado del buscador mide 8×48 porque está cerrado; lo que se toca es la lupa de 44×44.
- «Más opciones» abierto: 8 botones de 44 px en dos columnas (152 px c/u a 390, 176 a 1280). El chip de estado sigue abriendo la
  ventana «Cambiar estado» con 9 botones de 44 px.
- Filtros de Atención: al tocar «Entregadas» y «7 días» quedan con `aria-pressed=true` y los demás en `false`.
- Capa apagada (`bc_uiord_off='1'`): sin la clase, la píldora vuelve a la insignia anterior (13 px), sin errores.
- Regresión: `prefactura-confiable.cjs` 8/8 y `reacond-fase2.cjs` OK en 390/440/1280 (copias con el puerto 8802).
- Capturas antes/después fuera del repo (carpeta temporal del agente).

## Riesgos y pendientes
- El texto de la ficha cambia también en **Mi trabajo** (usa la misma ficha) y en la ventana «Cambiar estado»: es a propósito
  (misma ficha en todos lados), pero el técnico verá «Finalizar» en vez de «FINALIZAR».
- `taller-app.min.js?v=20261024-q4` en taller.html **no se cambió** para no chocar con las otras 9 ramas; al juntar, subir el `?v=`.
- En la PC la columna de acciones queda de 360 px como máximo; con muchas acciones la ficha sigue siendo alta (es contenido real).
- **Para el dueño (no hecho):** (1) en Atención, una orden «Por entregar» o «Esperando cliente» sale en su sección **y otra
  vez** en «Órdenes» (filtro Activas) → ¿quitarla de «Órdenes» o quitar las dos secciones? (2) El chip de estado abre la misma
  lista de acciones que ya está debajo (dos entradas para lo mismo, hecho a propósito en su día) → ¿dejar solo una?
- Sin SQL, sin cambios en la base ni en Info Plus.

## Siguiente paso
Que el dueño lo vea en la rama y decida los dos puntos de arriba; luego juntar con las otras ramas y publicar con su «publícalo».
