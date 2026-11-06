# 06-nov-2026 · Selección en lote arrastrando — Reacondicionados › Equipos del Lote (RAMA DE PRUEBA, sin publicar)

## Pedido del dueño
- Maqueta «Selección en lote» (referencia Moxen, ver `2026-11-05-2235-claude-ref-moxen-lote.md`) → «en el taller primero; despliega un grupo de agentes para que determinen dónde tienen que ir».
- 6 agentes (5 por área + 1 juez, solo lectura) recomendaron empezar por **Reacondicionados › lote abierto › Equipos del Lote**. Le seguirían «Despachar teléfonos» y «Registro manual en Info Plus».
- Dueño: «Ok es la rama de prueba» → opción A (solo Equipos del Lote) en rama, sin publicar.

## Qué se hizo
- `bc-lote-arrastrar.js` + `bc-lote-arrastrar.css` (capa nueva, cargada en `taller.html`, `?v=20261106-la1`).
- Se pone el dedo o el mouse en la casilla de un equipo y se arrastra:
  - si la primera casilla estaba vacía, marca;
  - si estaba marcada, desmarca;
  - si el dedo salta tarjetas, rellena las del medio;
  - cerca del borde de la pantalla, la página se desplaza sola.
- Solo empieza sobre la casilla. Tocar el resto de la tarjeta sigue abriendo el equipo. El clic normal en la casilla sigue igual.
- La selección se guarda en el mismo `_reacondSel` de `taller-app.js`. El contador de arriba sigue funcionando.
- Barra abajo (sticky dentro del lote, solo con algo marcado): «N seleccionados · Quitar · Asignar técnico · Pasar a ▾ · Listo para venta · Despachar (solo admin)».
  - Cada botón llama a la función que **ya existía**: `abrirModalAsignarLote`, `_reacondPasarA`, `pasarSeleccionListoVenta`, `despacharTelefonosSeleccionados`.
  - Mismas validaciones por etapa, bloqueos de `taller-reacond-proceso.js` y confirmaciones.
- No se tocó `taller-app.js` ni la base de datos. La capa se engancha envolviendo `_reacondActualizarSelUI` y `renderDetalleLoteReacond`.
- Apagar en un equipo: `localStorage.bc_lote_arrastrar_off = '1'`.

## Pruebas
- `scripts/pruebas/lote-arrastrar/qa.cjs` (Playwright con página de prueba que imita las tarjetas reales): **20/20**.
  - arrastre PC y dedo en iPhone (eventos táctiles reales);
  - relleno al saltar, desmarcar arrastrando, clic simple;
  - tocar la tarjeta abre el equipo; la página no se mueve;
  - los botones llaman a las funciones existentes; Quitar vacía y oculta.
- Tamaños: todos los botones de la barra miden 44 px de alto o más (PC 1280 y iPhone 390); sin scroll de lado a 390 px.

## Pendiente / riesgos
- Probar con datos reales en el taller (la prueba usa una página que imita las tarjetas).
- La lista pagina de 10 en 10: el arrastre alcanza la página visible; la selección se conserva al cambiar de página.
- No incluido: imprimir etiquetas de los seleccionados (hoy es una por una), «Despachar teléfonos» y «Registro manual en Info Plus» (siguientes candidatos).
- Visto de paso por los agentes: «Validar todo» de incentivos (`taller-app.js:1722`) no guarda quién aprobó ni cuándo → corregir aparte.

## Rama
`claude/lote-arrastrar` (no publicada).
