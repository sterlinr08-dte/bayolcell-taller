# 21-oct-2026 · CRM: lupa antes de Sucursal y Etiquetas donde estaba la lupa

## Pedido del dueño (captura del CRM en PC)
«El botón de buscador ponerlo antes de Sucursal, y donde está actualmente el botón de búsqueda poner las etiquetas.»

## Cambios (solo PC ≥1025 px; en celular todo queda igual)
- `crm-wa-identico.js` (`v=20261021-w15`):
  - `ordenBarra()`: la lupa la maneja `bc-busqueda.js` dentro de `.crm-busq-row`, así que no se mueve;
  - esa fila pasa a la primera celda, antes de Sucursal;
  - Etiquetas, Contactos y Filtros van a una fila nueva `#bcwaAccFila`, donde estaba la lupa;
  - el botón Etiquetas se busca donde esté; ya no se crea otro.
- `crm-wa-identico.css`:
  - cuadrícula de 5 columnas: lupa · Sucursal/Área · Etiquetas, Contactos y Filtros · Todos, No leídos y Pendientes · acciones;
  - con el buscador abierto (`.bcbp-marco.open`), Sucursal y Área se esconden mientras se busca, para que la píldora no quede encima;
  - en Instagram y Facebook, `#bcwaAccFila` no se muestra.
- Versiones: `crm-marketing-consent.js` carga `crm-wa-identico.js?v=20261021-w15`; `taller.html` → `crm-marketing-consent.js?v=20261021-u5`.

## Pruebas
Banco local con Playwright: 16 PASS · 0 FAIL.
- A 1920 y 1280 px:
  - lupa antes de Sucursal;
  - Etiquetas entre Área y Contactos;
  - todo en la misma línea;
  - la lupa abre el buscador (321 px, con foco) y se escribe;
  - Etiquetas abre su menú;
  - sin errores.
- A 390 px: la lupa sigue donde estaba, Etiquetas abre su menú, sin errores.

## Estado
Rama `claude/prefactura-limpia`, sin publicar.
