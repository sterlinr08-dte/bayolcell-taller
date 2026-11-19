# 19-Nov-2026 15:32 (RD) — Claude — «Traer del Taller» crea un lote nuevo con comentario

Corrige la entrada anterior `*-claude-traer-del-taller.md` (misma rama, sin publicar).

## Pedido
- Al ver la propuesta, el dueño dijo: «Al lote no, sino crear un lote y poner comentario».

## Cambios
- El botón pasa del menú «Info Plus ▾» del detalle del lote a la **cabecera de la lista de Reacondicionados**.
  - Se llama «Traer del Taller» y mide 44 px.
  - Se ve y se oculta igual que «Registrar equipo existente»: el admin lo ve y los demás no. La acción también exige admin.
- La ventana trae:
  - la misma lista de IMEI del almacén 6 que no están en ningún lote;
  - el campo «Comentario del lote», de 48 px y letra de 16 px, ya lleno con «Traído del almacén Taller (Info Plus) · dd/mm/aaaa»; es obligatorio.
- «Crear lote» usa el RPC existente `reacond_crear_lote`, el mismo de «Importar compra» y «Manifiesto».
  - Lote y equipos se crean en una sola transacción.
  - Si un IMEI ya existe, no se crea nada.
  - Código: `calcularSiguienteCodigoLote()` (AAAAMM-0001).
  - Comentario: va en `notas` del lote.
  - Costo de cada equipo: el del artículo en Info Plus. Origen: `infoplus_taller`.
  - Al terminar abre el lote nuevo.
  - Candado contra el doble toque.
- Se quitaron `traerDelTallerAgregar` y `_traerTallerLote`.
- La Edge `infoplus-imei-almacen` (modo `almacen_todo`) no cambia.

## Pruebas (local; base e Info Plus simulados)
- 1280 y 390 px:
  - el botón se ve en la cabecera y mide 44 px;
  - de 3 IMEI: 1 ya estaba en un lote, 1 se puede marcar y 1 sale apagado por no tener artículo;
  - dos toques en «Crear lote» → **1** llamada al RPC, con el lote `202611-0001`, el comentario escrito, 1 equipo y costo 18 000;
  - la ventana se cierra y no hay errores de consola.
- **No verificado** contra Info Plus real ni la base real.

## Estado
- Rama `claude/traer-del-taller`. Espera el «Publícalo».
