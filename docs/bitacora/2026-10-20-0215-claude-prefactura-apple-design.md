# 2026-10-20 02:15 — Claude — Prefactura: pase de /apple-design

Sigue a `2026-10-20-0200-claude-prefactura-compacta.md`. Rama `claude/prefactura-limpia`, **sin publicar**. Solo CSS
(`taller-prefactura.css?v=20261020-e4`), sin cambios de lógica.

## Solicitud
El dueño invocó la skill `/apple-design` sobre el trabajo en curso (Prefactura).

## Ya cumplía
Barra fija translúcida (`backdrop-filter`), botones principales/píldoras/tarjeta con `scale(.97)` al presionar,
`prefers-reduced-motion`, aviso en línea de lo que falta (no solo al guardar), números en monoespaciada.

## Agregado
1. **Respuesta al presionar** (no al soltar) en: botones de cantidad, papelera, lupa, «Servicio», buscador y títulos de
   plegables (`scale(.94)` / `.99`, 100 ms, curva `cubic-bezier(.23,1,.32,1)`; solo `transform`, colores aparte).
2. **Plegables que se materializan** desde su título: «Más datos», comentario y reseña (opacidad + 4 px, 220 ms).
3. **Barra fija** entra/sale con la misma curva (280 ms).
4. **Cursor** (`caret-color`) y **selección** con el color de la marca.
5. **Hover solo con mouse** (`@media (hover: none)`): en el celular no se queda «pegado».
6. **Reducir movimiento:** sin escalas; plegables solo con fundido de 160 ms; barra solo con opacidad.

## Verificación
- Navegador: animación `bcpfAbrir` 0.22 s normal → `bcpfFundido` 0.16 s con «reducir movimiento»; caret rgb(228,87,46).
- `pfopc` 52/52, `pftest` 47/47; detector impeccable: 0 hallazgos.
