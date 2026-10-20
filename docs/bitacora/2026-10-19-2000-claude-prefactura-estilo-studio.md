# 19-oct-2026 — «Recepción» pasa a llamarse «Prefactura» y toma el diseño de la Prefactura de STUDIO

**Rama:** `claude/bayol-prefactura`. **Sin publicar.**

## Pedido del dueño
> «Vamos a cambiar donde dice recepción … vamos a ponerle prefactura. Y vamos a rediseñar esa parte para que se parezca a la de estudio … que se vea igual. Vamos a reestructurarla.»

## Referencia
La pantalla real de STUDIO se capturó con un banco local, con datos simulados y sin tocar el repo de STUDIO. Las capturas y la descripción quedaron en el scratchpad de la sesión (`studio-pref/`).

Estructura que se copió:
- un documento blanco;
- cabecera con nombre del negocio, «PREFACTURA», lupa, Nº y fecha;
- cajas cálidas (`#f3f0e8`) en 2 columnas;
- «Facturar a» como tarjeta con avatar y «Cambiar ›»;
- buscador «Buscar o escanear» con F2;
- artículos en 2 líneas: Nº, nombre con chips, importe y quitar arriba; precio y cantidad (− n +) abajo;
- contador «N artículos · M unidades»;
- pie con píldoras de acceso a la izquierda y totales a la derecha, con el total en letra monoespaciada grande;
- barra fija abajo: Total · Imprimir · «Guardar e imprimir» en negro · «Guardar» en el color de acento.

No se copiaron los 3 defectos que tiene STUDIO hoy:
- la tabla se sale 40 px a 390;
- el botón «Guardar» sale blanco;
- el total sale de 15 px.

## Lo que cambia en BAYOL
- **Nombre:** el menú y el título pasan de «Recepción de Equipos» a **«Prefactura»**.
  - Los botones «Recibir equipo» y «Nueva Recepción» pasan a «Nueva prefactura».
  - El permiso se llama «Ver módulo Prefactura».
  - La lista de abajo se llama «Prefacturas realizadas».
  - El id interno sigue siendo `recepcion`, igual que el permiso `recepcion_ver` y la tabla `recepcion_prefacturas`; no cambia ningún dato.
  - El ticket impreso «Ticket de recepción» del equipo no cambia.
- **Capa nueva `taller-prefactura.js` / `.css`** (`?v=20261019-p1`), activada con el interruptor `bc-pf` en el `<head>`.
  - Arma el documento **moviendo los campos que ya existen**, con los mismos id y los mismos `onchange`:
    - **Facturar a:** tarjeta del cliente de Info Plus, más Nombre visible, WhatsApp, autorización de promociones, Cédula/RNC y Tipo.
    - **Condiciones:** Precio, Almacén y Vendedor, con la nota de proforma.
    - **Equipo recibido:** marca, modelo, capacidad, IMEI, condición física y accesorios.
    - **Falla reportada:** falla y observaciones, más los desplegables «Fallas del equipo» y «Seguridad del dispositivo».
    - **Datos adicionales:** técnico, prioridad y entrega, plegados en el pie como la «nota» de STUDIO.
  - El carrito se vuelve a pintar en 2 líneas con las mismas funciones (`_rpCant`, `_rpPrecio`, `_rpQuitar`, `_rpDesc`, `_rpImeiKey`, `_rpQuitarImei`, `_rpStockItem`).
  - La cabecera, los totales y la barra se actualizan envolviendo `_rpRenderCart`, `_rpRenderResumen` y `_rpCliElegir`.
  - Guardar sigue siendo `_rpGuardar(false/true)`. **No cambian Info Plus, la base, los cálculos ni las validaciones.**
- **`taller-recepcion.js` (`p1`):** con `bc-pf` activo deja de reorganizar la pantalla. Solo presta su buscador (`window.bcRxBuscador`), y `almacenAdmin` no hace nada porque el almacén queda a la vista en «Condiciones».
- **`taller-info.js` (`p1`):** las ⓘ de «Nombre visible (…)» y «Observaciones (…)» ahora se buscan en cualquier etiqueta de la pantalla, porque esas etiquetas cambiaron de caja.
- **Color de acento:** el naranja-rojo de BAYOL (`#e4572e`) en lugar del dorado de STUDIO.
- **Medidas del dueño:**
  - todo lo que se toca mide 44 px o más;
  - los campos miden 48 px, con letra de 16;
  - «Guardar» mide 54 px.
- **Celular:** una sola columna.
  - Los totales van antes de los accesos, que se ven como cuadros con el icono encima.
  - La barra ocupa todo el ancho y se esconde mientras se escribe.
  - Imprimir y «Guardar e imprimir» quedan como iconos.
- **Cómo apagarla:** `BC_PF=false` para todos, o `localStorage.bc_pf_off='1'` en un equipo. Al apagarla vuelve la Recepción organizada anterior.

## Pruebas (banco local con Playwright, 390 y 1280 px)
| Prueba | Resultado |
|---|---|
| `pftest.mjs`: nombre en menú y título; documento; campos dentro; buscador; − y +; precio; IMEI; quitar; cliente de Info Plus; Guardar envía a Info Plus (cliente y líneas) y muestra el Nº y «Imprimir»; medidas ≥44, letra 16; nada se sale; Guardar de 54 px; con la capa apagada vuelve la anterior | **39 PASS** |
| `nav7` | 9 PASS |
| `vend` | 9 PASS |
| `admalm` | 16 PASS + 2 esperados (ver abajo) |
| `info2` | 80 PASS |
| `barrido` | sin errores de JS |
| `rxfun` / `rxppk` / `admalm` con la capa apagada (`PF_OFF=1`) | 12 / 23 / 18 PASS |

Los 2 resultados esperados de `admalm`: la prueba vieja verifica que el almacén del administrador esté «arriba de Artículos». Con el diseño nuevo, el almacén está en «Condiciones», a la vista de todos.

## Pendiente
- **Publicar** cuando el dueño lo diga.
- **Preguntas al dueño:**
  - si quiere el dorado de STUDIO en vez del naranja de BAYOL;
  - si los datos del cliente deben quedar plegados bajo la tarjeta, como en STUDIO, en vez de a la vista.
