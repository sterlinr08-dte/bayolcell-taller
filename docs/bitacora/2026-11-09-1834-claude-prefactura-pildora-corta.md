# Prefactura compacta · píldora sin «Oficina» (c2)

- Al sacar el antes y después para el dueño, en la primera pintada la píldora decía «Cliente final · Oficina Santiago · Es…» y el vendedor quedaba cortado.
- Causa: la píldora leía el nombre del almacén antes de que `taller-prefactura.js` lo acortara (lo hace a los 1.5 s).
- Arreglo: `bc-prefactura-compacta.js` quita ella misma «Localidad / Oficina / Almacén» → «Cliente final · Santiago · Esterlin». Versión c2 en `taller.html`.
- Prueba: `prefactura-compacta.cjs` → Todo bien (390, 1280, 1440 y apagada).
- Rama `claude/prefactura-pildora-corta`. Sin publicar hasta el OK del dueño.
- Sigue de `2026-11-09-1810-claude-prefactura-compacta.md`.
