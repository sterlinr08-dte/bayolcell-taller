# 2-nov-2026 13:00 RD — Publicado: precio hasta el mínimo con comas y aviso real de la impresora (Claude)

## Solicitud del dueño
«Publícalo y donde va el precio poner las comas y los puntos» (captura: precio escrito como 10000000 sin separadores).

## Qué se publicó (bayolcell.com, GitHub Pages)
- **PR #204** (`baa746a`): precio de la prefactura — el empleado sube libre y baja hasta el mínimo del nivel
  (bit. 2026-11-02-1200) + **formato al escribir**: `10000000` → `10,000,000`, un solo punto y máximo 2 centavos
  (`window.bcFmtDinero` en `taller-prefactura.js`, `oninput`; el cursor no salta; `_rpPrecio` guarda el número sin comas).
  `taller-prefactura.js?v=20261102-pm2`, `taller-app.min.js?v=20261102-pm1`.
- **PR #202** (`0a69573`): `bc-impresora-estado.js?v=20261102-ie1` — aviso real de la impresora (bit. 2026-11-02-1030).

## Verificación en vivo
- `taller.html` sirve `pm2` e `ie1`; `taller-app.min.js` contiene `_rpPrecioMin`; `taller-prefactura.js` contiene `bcFmtDinero`;
  `bc-impresora-estado.js` responde 200.
- Pruebas antes de unir: `prefactura-precio-minimo.cjs` 18/18 (incluye comas y punto), `impresora-estado.cjs` 9/9; CI en verde.

## Pendiente
- Que el dueño edite una vez desde el sistema los precios de los artículos que quiere con mínimo (Info Plus no deja leerlo).
- Probar el aviso de impresora en la PC real.
