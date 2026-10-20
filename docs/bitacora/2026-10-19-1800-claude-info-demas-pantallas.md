# 19-oct-2026 — La ⓘ de información en las demás pantallas del taller

- **Rama:** `claude/bayol-info2`, sin publicar.
- **Viene de:** `2026-10-19-1400-claude-info-y-buscador.md` (allí se hizo la Recepción).

## Pedido
El dueño dijo: «Sigue con la ⓘ en las demás pantallas».

## Cómo se buscó
Se recorrieron las 30 pantallas del taller en el banco local (`notas.mjs`), buscando textos grises o de 13 px o menos y de más de 28 letras. Solo se pasaron a la ⓘ las notas que **explican**.

Se quedan a la vista:
- los avisos: «Ilustración con IA · no es la placa real», el del zoom y el de Java de QZ Tray;
- los pasos para instalar el certificado de QZ Tray;
- los estados vacíos;
- las cifras y los totales;
- «Pellizca para acercar», que acompaña al botón de abrir la foto;
- «Reparaciones terminadas en el período», que es el rótulo de una cifra.

## `taller-info.js` y `taller-info.css` (`i2`)
- **Funciones nuevas:**
  - `cercano(n)` busca el título más cercano antes de la nota (h1–h4 o `.card-title`), subiendo hasta la pantalla.
  - `nota(vista, selector, comienzo, título?)` arma cada regla y se queda con la nota más interna si hay varias coincidencias.
- **Notas que pasaron a una ⓘ (25 reglas):**
  - **Inicio:** «Visitas de la página web».
  - **Contabilidad:** «Estado de resultados mensual».
  - **Diagnóstico:** el subtítulo, «Diagnóstico conectado», «Buscador de cortos» y «Fotografías del taller».
  - **Artículos:** «Sincronizar Taller».
  - **Etiquetas:** el generador.
  - **Configuración de impresora:**
    - el perfil;
    - la densidad: la ⓘ va en su etiqueta;
    - «Vista previa en tamaño real»;
    - el label de orden;
    - «Los cambios se guardan automáticamente».
  - **Reportes:** «Rendimiento» y «Cobros».
  - **Configuración:** técnicos.
  - **Catálogo web:** «Catálogo de pantallas».
  - **Inventario físico:** «Iniciar un conteo nuevo».
  - **Liquidación de aduana:** las dos notas.
  - **Rifa por factura.**
  - **Mis incentivos e Incentivos:** «Servicios de este ticket (usa el ＋…)». La aclaración y «Si el ticket tiene más de una reparación…» van a la misma ⓘ.
- **Donde el título ya tenía su botón de ayuda del módulo** (`ayudaModulo`): Despachos, Inventario físico y Catálogo web.
  - Ese botón abre una explicación completa que ya cubre la nota, así que no se pone una segunda ⓘ.
  - La nota se esconde y el botón viejo toma el mismo color naranja y el área de toque de 44 px (clase `bcInfoAyuda`).
  - Motivo: en la primera prueba se vieron dos íconos de información juntos.
- **Se apaga** igual que antes: `BC_INFO=false`, o `localStorage.bc_info_off='1'` en un equipo.

## Pruebas (Playwright, 390 y 1280 px)
| Prueba | Resultado |
|---|---|
| `info2.mjs` (26 notas en cada ancho): se ve la nota escondida; su ⓘ (o el botón de ayuda) mide 44 × 44 y abre la burbuja (o la ayuda) con ese texto; no hay ⓘ repetidas después de volver a pintar la pantalla | 80 PASS |
| `inc.mjs` (Incentivos): «Servicios de este ticket» con su ⓘ de 44 px | OK |
| `rxfun` / `rxppk` / `nav7` / `vend` / `admalm` | 12 / 23 / 9 / 9 / 18 PASS |

Sin errores de JavaScript en ninguna pantalla.

## Pendiente
Publicar cuando el dueño diga «publícalo».
