# 2026-10-30 15:20 (RD) — Claude — Etiquetas: «estudio de etiqueta» (opción B)

## Solicitud del dueño
Capturas de «Impresión de Labels» (PC): «Vamos a mejorar esa ventana». Opciones A (pulir), B (estudio de etiqueta), C (B + llenar
por IMEI). Eligió **B**.

## Cambio (rama `claude/etiquetas-estudio`, SIN publicar)
Capa nueva `bc-etiquetas-pro.css` + `bc-etiquetas-pro.js` (`?v=20261030-e1`), clase `html.bc-etq`.
Apagar: `BC_ETQ=false` en `taller.html` o `localStorage.bc_etq_off='1'`. No toca `taller-app.js` ni la impresión
(`actualizarLabelLive`, `imprimirLabelAdhesivo`, `cambiarDimensionesManual` y los mismos `id`).
- Formulario «Datos del equipo» en 2 columnas: Modelo y color; Marca (**se pone sola** según el modelo — iPhone→Apple,
  Galaxy/A54→Samsung, Redmi→Xiaomi, Moto→Motorola… — hasta que la persona la cambie a mano); IMEI o serie con aviso
  (✓ 15 dígitos / «el último dígito no cuadra» / «tiene N dígitos; si es serie está bien», nunca bloquea);
  Capacidad con botones 64/128/256/512 GB y 1 TB; Estado con botones CLASE A, CLASE B, NUEVO, AVISO BAT, AVISO PANT.
- Papel (58×28 / 28×58) igual; «Ajuste fino» (ancho, alto, letra, código de barras, giro) plegado.
- Derecha: la etiqueta en grande (zoom 1.6 en PC, 1.15 en celular) sobre fondo de cuadros, fija al bajar, con el tamaño del
  papel, **Copias − n +** y **Imprimir etiqueta** (54 px) debajo. En celular la vista previa va arriba.
- El engranaje abre la ventana «Impresora de esta computadora» (la de la Prefactura, PR #152).
- Espaciado: campo → campo 20 px (medido), todo lo que se toca ≥ 44 px, campos 48 px / 16 px.

## Pruebas (banco local, 1920 y 390)
Marca sola Samsung/Apple ✓, chips de capacidad y estado ✓, aviso de IMEI ✓, copias 1→3 ✓, «Imprimir etiqueta» llama a
`imprimirLabelAdhesivo` ✓, nada < 44 px, sin desplazamiento horizontal, sin errores. `label-sin-color`, `ui-global`,
`prefactura-confiable` en verde. Capturas: `docs/bitacora/img/2026-10-30-etiquetas/`.
No probado con la impresora de etiquetas real.

## Pendiente
- «Publícalo» del dueño.
