# 3-nov-2026 14:00 RD — Pistola de códigos: leer solo IMEI para asignar a técnicos (Claude)

## Solicitud del dueño
Foto de la pistola sobre un iPhone 8 Plus en bolsa: «¿podemos hacer que la pistola lea solo los IMEI para asignarlo a los técnicos?»

## Cambio (rama `claude/pistola-imei`, sin publicar) — capa nueva `bc-pistola-imei.js?v=20261103-pi1`
- En «Asignar equipos a un técnico» (Reacondicionados → lote) aparece **«Escanear IMEI»** con el cursor puesto.
- Solo acepta un **IMEI**: un número de exactamente 15 cifras que pasa Luhn. Serie, UPC, modelo u otros → «No es un IMEI».
- IMEI del lote, evaluado y sin técnico → se **marca** (la misma casilla `_reacondSel`), la lista «Modelos a asignar» se
  actualiza sola. Escanearlo otra vez lo quita.
- Avisos cortos: «Ese IMEI es de otro lote.», «IMEI no está en el sistema.», «Ya lo tiene <técnico>.», «Aún no está evaluado.»
- Si el cursor está en otro campo de la ventana, detecta la escritura rápida de la pistola, marca el equipo y no ensucia el campo.
- Asignar sigue siendo el mismo botón y la misma lógica (no cambia datos ni RPC). Apagar: `localStorage.bc_pistola_off='1'`.

## Pruebas
- `scripts/pruebas/pistola-imei.cjs` 12/12 (marcar, texto alrededor, serie ignorada, Luhn malo, asignado, no evaluado,
  otro lote, quitar, cursor en otro campo, sin errores JS). `reacond-ui`, `reacond-proceso`: bien.
- Captura: `docs/bitacora/img/2026-11-03-pistola-imei.png`.

## Nota
- En la foto del dueño el label decía «CAMBIAR BATERI.»: impreso con la versión anterior a #220 (sin recargar). Con #220 la
  letra baja para que ninguna falla se corte.
