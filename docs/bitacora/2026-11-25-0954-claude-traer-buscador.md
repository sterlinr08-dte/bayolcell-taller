# Buscador en «Traer del almacén Taller» (25-nov-2026)

**Pedido del dueño:** «Listo ya trae pero ponle un buscador cuando ande buscando un equipo específico».

## Qué cambió (`taller-app.js`, `taller.html` → `?v=20261125-trtb1`)
- Ventana «Traer del almacén Taller»:
  - **buscador** (48 px de alto, letra 16 px). Busca por descripción, IMEI, código o marca. Con 4 dígitos o más, encuentra el IMEI aunque se escriba con espacios.
  - **«Marcar los que se ven»** y **«Desmarcar todos»**.
  - **Contador** «Marcados: N». Si hay marcados que la búsqueda esconde, lo dice: «(X no se ven por la búsqueda)».
  - El botón dice **«Crear lote (N)»**.
  - Aviso «Ningún equipo coincide con la búsqueda.»
- Funciones nuevas: `_trtFiltrar`, `_trtMarcar` y `_trtContar`.
- Las filas llevan `.trtFila` y `data-buscar`. Una regla `[hidden]{display:none!important}` evita que el `display:flex` de la fila las deje visibles; ese error salió en la primera prueba y quedó corregido.
- No toca Info Plus, la RPC `reacond_crear_lote` ni la Edge.

## Pruebas (Playwright, Info Plus simulado con 5 equipos, a 1280 y 390 px)
- Al abrir se ven 4 equipos, con 3 marcados.
- Buscar «8G plus» deja 1 a la vista.
- Buscar «3525 9037» deja 1 a la vista.
- Buscar «xiaomi» deja 0 y muestra el aviso.
- Buscar «787065», «Desmarcar todos» y «Marcar los que se ven» deja 1 marcado y el botón «Crear lote (1)».
- El lote se crea **solo con ese IMEI**: 1 llamada aunque se tocó el botón 2 veces.
- Sin errores de consola.

## Estado
- Rama `claude/traer-buscador`, sin publicar. Falta el «Publícalo» del dueño.
