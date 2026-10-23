# 22-oct-2026 21:25 · Claude · Aviso: no se reenvía una prefactura si cambió el descuento

**Dueño:** «No, solo el descuento» (el aviso es solo para el descuento; el comentario se puede cambiar sin aviso).

## Cambio (`main`, `taller-app.js` p13)
- `_rpDescPctCabecera()`: el % de cabecera que se manda a Info Plus.
- `_rpState.descEnviado`: % enviado en la última creación/actualización; al cargar una guardada se calcula de lo guardado.
- `_rpDescCambioBloqueado()`: si la prefactura ya existe y el % cambió, `_rpCrearPrefactura` NO manda nada y avisa:
  «Info Plus no cambia el descuento de una prefactura ya enviada (la Nº X se quedaría con Y %). Anule la Nº X en Info
  Plus y cree una nueva con el botón Nueva». El estado queda en «cambios».
- Si el descuento no cambió (solo comentario, artículos, cantidades…), se reenvía como siempre.

## Pruebas
Unitarias con las funciones reales: igual → sin aviso; 10 % → 5 % → aviso; +RD$ 500 → aviso; prefactura nueva → sin aviso.
