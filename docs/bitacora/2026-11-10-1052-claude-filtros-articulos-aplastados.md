# Claude · Ventana «Artículos Info Plus»: filtros aplastados (sin publicar)

## Pedido del dueño
Captura desde bayolcell.com (Reacondicionados → Ficha del equipo → Artículos Info Plus) con el mensaje «LOS ICONOS DE LOS FILTROS NO SE VISUALIZAN» (10-nov-2026, 10:47 a. m.). La fila «Todos · Celulares · Pantallas · Baterías…» se veía cortada, apenas una rayita.

## Diagnóstico
- La ventana (`.ab-modal`) es una columna flexible con alto máximo. La fila de filtros (`.ab-chips`) lleva `overflow-x:auto`, y eso permite que la columna la encoja cuando la lista de artículos es larga.
- Reproducido en el banco con 60 artículos: la fila medía 12–14 px de alto a 390, 1280 y 1920 px.
- Es un fallo viejo de esa ventana (`taller-app.js`, estilos `_abStyles`). No viene de lo publicado hoy (CRM, iconos, Punto de equilibrio).

## Qué se hizo
- `taller-app.js`: `.ab-chips{flex:none}` (no se encoge) y `.ab-results{min-height:0}` (la lista es la que cede y se desplaza).
- `taller-app.min.js` regenerado con `scripts/minificar.sh`; `taller.html` → `taller-app.min.js?v=20261110-ab2`.
- Prueba nueva: `scripts/pruebas/buscador-filtros.cjs`.

## Pruebas (banco local, datos inventados)
- Antes: 3 fallos (fila de 12–14 px). Ahora: **Todo bien** a 390×844, 1280×720 y 1920×950 (fila de 36 px, filtro de 26 px, la lista conserva su desplazamiento, la ventana cabe).
- Pendiente aparte: esos filtros miden 26 px de alto; la regla pide 44 px. No se cambió aquí para no mover el diseño de la ventana sin el OK del dueño.

## Estado
Rama `claude/filtros-articulos`, sin publicar. Falta el OK del dueño.

## Además (publicación anterior)
PR #285 «Punto de equilibrio y metas de vendedores: carga que no parpadea» quedó en `main` (commit `916739aeabd808f6d5b91f170d4a3950a1b412fe`), autorizado con «Publícalo». Verificado en vivo: `taller.html` trae `conta-equilibrio.js?v=20261110-pe29`.
