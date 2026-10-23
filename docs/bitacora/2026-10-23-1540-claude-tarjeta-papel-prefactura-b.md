# 2026-10-23 15:40 (RD) — Configuración → Impresora: tarjeta «Prefactura» rediseñada (opción B)

## Pedido del dueño
Foto de la tarjeta «Papel de la prefactura» (botones Ticket 80 mm / Hoja carta y Copias 1·2·3): «Así no, hazlo más profesional».
Siguiendo la regla de puntos de control, se le mandaron dos maquetas (A: filas tipo ajustes de iPhone; B: fichas con el dibujo
del papel). Eligió **B**. La duda «las copias se repiten» era solo porque la imagen traía las dos maquetas.

## Qué cambió
- `bc-prefactura-imprimir.js` (`i6 → i7`), función `pintarConfig()` y su CSS:
  - cabecera con icono en caja naranja, título «Prefactura» y píldora «Esta computadora» (se oculta en celular);
  - dos fichas con dibujo del papel (ticket con borde dentado abajo, hoja carta), nombre, dato corto («80 mm · directo»,
    «Impresora normal») y marca ✓ naranja en la elegida;
  - copias del ticket con contador **− n +** (48 × 48 px cada botón, tope 1–3, el − y el + se apagan en los extremos);
  - con «Hoja carta» la fila de copias se atenúa (no aplica);
  - el texto largo ya no se ve: queda detrás de la ⓘ del título.
- `taller-info.js` (`v2 → v3`): regla nueva que manda la explicación de la tarjeta a la ⓘ junto a «Prefactura».
- `taller.html`: versiones de los dos archivos.
- Se guardan los mismos valores de antes (`bc_pref_formato`, `bc_pref_copias` por computadora); la impresión no cambia.

## Pruebas (banco local, Playwright)
| Ancho | Fichas | Botones − / + | ⓘ | Secuencia + + + − | Carta atenúa copias | Errores JS |
|---|---|---|---|---|---|---|
| 390 px | 163 × 148 | 48 × 48 | sí | 1→2→3→3 (+ apagado)→2 | sí | 0 |
| 1280 px | 254 × 148 | 48 × 48 | sí | igual | sí | 0 |
Letra mínima de los controles: 13 px. Capturas en el scratchpad de la sesión (`pf-pc/papelB-*.png`).

## Publicación
Commit en `main` (GitHub Pages). Autorización: el dueño pidió el cambio sobre lo recién publicado y eligió la opción.

## Pendientes
- El dueño confirma en su PC que la ficha y el contador se ven bien con los iconos reales (el banco local no carga el CDN de iconos).
- Sigue pendiente confirmar el comentario en la Factura de Info Plus (p33) y la aprobación de `bayolcell_cuentas_pago`.
