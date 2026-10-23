# Prefactura: textos cortos (regla del dueño: nada explicativo; si hace falta, la ⓘ)

**Dueño (foto de la pantalla en PC):** «Quitar ese texto de “Agregar comentario a la prefactura”, mejor pon “Comentario”.
Vengo dictándote que no pongas texto tan explicativo y, si es necesario, poner la ⓘ de información.»

## Cambios
- `taller-prefactura.js` (i17): el desplegable dice **«Comentario»**; el estado vacío dice **«Sin artículos»** (antes
  «Sin artículos. Use el buscador o escanee un código para agregarlos.»).
- `taller-info.js` (v2): la nota de los totales «No cobra ni descuenta inventario: se factura en Info Plus» pasa detrás de
  una **ⓘ junto a «Total»**. Los avisos (prefactura ya facturada, cambios que Info Plus no toma) siguen a la vista.
- `taller.html`: en Configuración → «Cuentas para pagos» se quitó el párrafo explicativo; queda un placeholder corto
  («Una cuenta por línea. Ej.: …»).

## Pruebas (banco local, 1280 px)
«Comentario», «Sin artículos», nota de totales oculta y ⓘ presente junto a «Total»; sin errores de JS.

## Publicación
`claude/prefactura-pc` → `main` (misma entrega autorizada hoy).
