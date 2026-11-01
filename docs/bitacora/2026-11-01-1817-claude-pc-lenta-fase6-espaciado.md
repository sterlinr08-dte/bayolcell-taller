# PC de bajos recursos, fase 6: reglas pesadas del espaciado solo cuando hacen falta (1-nov-2026)

**Pedido del dueño:** «Haz la fase 6» (aligerar `bc-form-espaciado.css`).

## Diagnóstico (medido, no supuesto)
- Con CPU 6× lenta, en Recepción, sin el archivo cada tecla bajaba de ~100 a ~65 ms.
- Traza de Chrome: **un cambio de texto en Recepción restyleaba 434 elementos con el archivo y 136 sin él**.
- Culpables: las **41 reglas con `:has()` seguido de un descendiente o hermano** («X:has(y) Z»). Chrome junta lo que va después de esos `:has()` en un solo conjunto de invalidación (span, div, label, button…), y cualquier cambio dentro de un ancla de `:has()` (incluidas las de otros archivos, como `.content:has(#v-crmLinea.active)`) vuelve a revisar todo eso.
- Quitar una mitad o un grupo de esas reglas no basta (es la suma). Poner el filtro de pantalla antes del `:has()` tampoco (la invalidación es estática). Las 35 reglas con `:has()` como sujeto no causan el problema.

## Cambio
- `bc-form-espaciado.css`: quedan todas las reglas menos las 41 pesadas.
- `bc-form-espaciado-has.css` (nuevo): las 41 reglas, con sus `@media` y un encabezado que explica la regla para el futuro.
- `taller.html`: el archivo pesado carga con `media="not all"` y un vigilante pequeño (`MutationObserver` de clases y nodos) lo enciende solo si hay `.modal-backdrop.active`, `#modalGenerico`, o la pantalla activa es Etiquetas, Despachos, Liquidación, Rifa, Inventario físico, Configuración, Financiamientos o Incentivos. Siempre encendido: `localStorage bc_fesp_has_siempre=1`.
- Las otras 6 páginas (`index`, `tienda`, `catalogo`, `solicitud`, `autoeval`, `crm-campanas`) cargan los dos archivos siempre, en el mismo orden.
- Versión `?v=20261101-e3`. Apagar todo el espaciado sigue igual: `bc_fesp_off=1`.

## Pruebas
- **Igualdad visual:** 3.611 elementos × 34 propiedades de estilo en 13 pantallas, 36 ventanas y la ventana genérica «Nuevo cliente», a 1366 y 390 px, comparando el archivo viejo contra los dos nuevos: **0 diferencias**. Capturas antes y después iguales.
- El vigilante: apagado en Recepción, Inventario y Órdenes; encendido en las 9 pantallas y en todas las ventanas; se apaga al cerrar la ventana.
- **Velocidad (CPU 6×, Recepción):** tecla ~100 → ~68 ms; trabajo de estilo en 20 teclas ~1.300 → ~500 ms; cambio de pantallas ~440 → ~290 ms; elementos por cambio 437 → 145.
- Regresión: `sin-internet`, `prefactura-delivery`, `ui-global`, `prefactura-confiable`, `diagnosticos-lote`, `solicitudes-crm`, `app-movil`: OK (igual que en `main`).

**Rama:** `claude/pc-lenta-4`. **No publicado** (espera OK del dueño).

**Riesgo:** una ventana nueva que no use `.modal-backdrop` ni `#modalGenerico` no tendría las 41 reglas. Hoy todas las ventanas usan una de las dos.
