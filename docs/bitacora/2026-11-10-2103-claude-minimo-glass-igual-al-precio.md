# Claude · Glass de iPhone: mínimo de nivel 1 igual al precio

Sigue a `…-claude-precios-glass-api.md` y `…-claude-minimo-baterias-black-friday.md`.

- **Motivo:** el cambio de precios del glass (10-nov) mandó solo contado y crédito; el mínimo de esos 15 artículos pudo quedar en 0 en Info Plus (no se puede leer). Se le planteó al dueño y contestó: «Igual al precio» (11-nov-2026).
- **Hecho:** en los 15 artículos (2785, 2924, 2784, 2782, 2923, 2781, 2779, 2746, 2743, 2813, 2742, 2786, 2787, 2925, 2788) se mandó contado = crédito = mínimo = precio de nivel 1, por `POST /api/articulo`, con la función de un solo uso (v5), ya **desactivada** (v6: 410, `verify_jwt=true`).
- **Resultado:** Info Plus aceptó los 15; copia local `niveles_min["1"]` = `niveles["1"]` en 15 de 15.
- Niveles 2 y 3 sin tocar. Siguen pendientes los 3 artículos compartidos (2778, 2776, 2775).
- **Regla para el futuro:** al cambiar un precio por la API, mandar siempre contado, crédito y mínimo juntos.
