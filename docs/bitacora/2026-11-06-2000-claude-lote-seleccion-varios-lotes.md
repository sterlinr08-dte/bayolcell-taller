# 06-nov-2026 · Selección que se conserva entre lotes, para despachar equipos de lotes distintos (RAMA, sin publicar)

## Pedido
- Dueño, con captura de «Despachar teléfonos»: «qué diferencia hay entre Guardar e imprimir y Despachar» y «despacho de varios equipos de lotes diferentes, cómo resolvemos ese detalle». Pidió 2 agentes para el plan.
- El plan (2 agentes y un juez, solo lectura) dio 5 mejoras. El dueño eligió **«Haz la 5»**: no borrar lo marcado al cambiar de lote.

## Diagnóstico
- La ventana de despacho ya admite equipos de **todos** los lotes: `_despTelCandidatos` (`taller-app.js:16402`) y el documento de Info Plus va agrupado por modelo.
- El problema estaba en otro lado: `abrirLoteReacond` (`taller-app.js:12017`) vaciaba `_reacondSel` al abrir otro lote, así que desde la barra solo entraban los del lote abierto.

## Qué se hizo (solo en `bc-lote-arrastrar.js` / `.css`, sin tocar `taller-app.js` ni la base)
- Se envuelve `abrirLoteReacond`: lo marcado **se conserva** al abrir otro lote.
- La barra dice el total y, si hay de otros lotes, «3 de este lote · 2 de otros lotes».
- **Despachar** toma todos los marcados, de todos los lotes.
- **Asignar técnico** (`confirmarAsignarLote`), **Pasar a** (`_reacondPasarA`) y **Listo para venta** (`pasarSeleccionListoVenta`) siguen actuando **solo sobre los del lote abierto**, porque sus reglas y validaciones son por lote. Al terminar, los de otros lotes vuelven a quedar marcados. Si no hay ninguno de este lote, avisan y no hacen nada.
- Tras un despacho correcto (`_despTelConfirmar` devuelve `ok` e `ids`), los despachados dejan de estar marcados.
- **Quitar** limpia todo, también lo de otros lotes.
- `taller.html`: versión `?v=20261106-la2`.

## Pruebas
- `node scripts/pruebas/lote-arrastrar/qa.cjs`: **29/29**.
  - Pruebas de antes: arrastre en PC e iPhone, tamaños y botones.
  - Pruebas nuevas de varios lotes:
    - se conserva al abrir otro lote;
    - la barra muestra «5» y «3 de este lote · 2 de otros lotes»;
    - «Pasar a» solo toca los 3 de este lote y los otros 2 siguen marcados;
    - «Despachar» toma los de los dos lotes;
    - los despachados se desmarcan;
    - en un lote sin marcados propios, «Listo para venta» no hace nada;
    - «Quitar» limpia todo.
- La prueba usa una página que imita las tarjetas y las funciones; falta probar con datos reales.

## Riesgos
- Una persona puede olvidar que tiene marcados de otro lote. La barra lo dice, y «Quitar» lo limpia.
- Las otras 4 mejoras del plan (revisar IMEI en origen, fichas por lote, guardar el lote en el historial y «BORRADOR – NO ES CONDUCE») quedan pendientes.
- Apagar todo en un equipo: `localStorage.bc_lote_arrastrar_off='1'`.
