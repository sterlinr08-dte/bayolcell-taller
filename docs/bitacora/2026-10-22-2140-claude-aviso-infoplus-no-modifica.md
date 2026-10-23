# 22-oct-2026 21:40 · Claude · Aviso permanente: Info Plus no cambia descuento ni comentario de una prefactura ya enviada

**Dueño:** «Vamos con la prefactura: poner un aviso de que no se modifica en Info Plus.»

## Cambio (`main`)
- `taller-prefactura.js` (i5) + `taller-prefactura.css` (n3): en la tarjeta de totales, debajo de «Prefactura Nº X en Info
  Plus», un aviso ámbar: «Info Plus no cambia el descuento ni el comentario de una prefactura ya enviada. Para cambiarlos,
  anule la Nº X en Info Plus y cree una nueva.» Solo sale cuando la prefactura ya tiene número y no está facturada.
- `taller-app.js` (p14): el mismo aviso en el resumen clásico.
- Sigue el bloqueo del 21:25: si cambia el descuento, no se reenvía.
