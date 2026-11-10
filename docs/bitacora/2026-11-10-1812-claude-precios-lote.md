# Claude · «Precios en lote» (nivel 1) para el cambio de glass de iPhone (sin publicar)

## Pedido del dueño
Mandó el volante «Cambia el cristal de la pantalla de tu iPhone» y luego sus precios nuevos de nivel 1 (10-nov-2026): «Haz los cambios de precios en nivel 1 en Infoplus».

## Por qué no se cambiaron directo
`infoplus-precio-actualizar` (la única puerta para escribir precios en Info Plus) exige un **administrador con sesión** (`app_is_admin`). La IA no inicia sesión con cuentas del dueño y no se saltó ese candado.

## Qué se hizo
- `precios-lote.js` (nuevo, l1): ventana «Precios en lote · nivel 1», solo admin, abierta con el botón 🔢 del buscador «Artículos Info Plus» (`taller-app.js`, junto a Sincronizar).
- «Cargar glass iPhone» trae la lista del dueño (18 artículos «MICA CRISTAL DE PANTALLA IPHONE … + OCA»). También acepta pegar líneas «código precio».
- Muestra precio de hoy, nuevo y cambio; se puede editar cada precio antes de guardar. Marca «No está en el catálogo» e «Igual» y esos no se mandan.
- Guarda uno por uno con `infoplus-precio-actualizar`, mandando **solo nivel 1, contado y crédito**. Info Plus solo cambia lo que se manda: el mínimo y los niveles 2 y 3 quedan igual. Marca ✓ o el error por artículo.
- `taller.html`: carga `precios-lote.js?v=20261110-l1` y `taller-app.min.js?v=20261110-ab6`.
- Apagar: `localStorage.bc_precios_lote_off='1'`.

## Precios (nivel 1)
| Código | Artículo | Hoy | Nuevo |
|---|---|---:|---:|
| 2785 | 15 Pro Max | 9,000 | 8,990 |
| 2924 | 15 Pro | 6,500 | 7,990 |
| 2784 | 15 Plus | 5,000 | 5,990 |
| 2782 | 14 Pro Max | 8,000 | 6,990 |
| 2923 | 14 Pro | 4,500 | 5,490 |
| 2781 | 14 Plus | 4,500 | 5,990 |
| 2779 | 13 Pro Max | 6,000 | 5,990 |
| 2778 | 13 / 13 Pro ⚠️ | 3,700 | 4,490 |
| 2746 | 12 Pro Max | 3,000 | 4,990 |
| 2776 | 12 / 12 Pro ⚠️ | 2,500 | 3,490 |
| 2743 | 11 Pro Max | 2,500 | 2,490 |
| 2775 | XR / 11 ⚠️ | 2,000 | 1,990 |
| 2813 | XS Max | 2,000 | 1,490 |
| 2742 | X | 1,200 | 1,500 |
| 2786 | 16 | 20,000 | 10,000 |
| 2787 | 16 Plus | 25,000 | 11,000 |
| 2925 | 16 Pro | 30,000 | 11,000 |
| 2788 | 16 Pro Max | 30,000 | 12,000 |

⚠️ Artículo compartido por dos modelos: el dueño dio dos precios (13: 4,490/3,490 · 12: 3,490/2,990 · XR/11: 1,990/1,500). Se cargó el más alto; la ventana lo avisa y se puede cambiar antes de guardar. 14 normal (4,500), 15 normal (5,000) y 8 Plus (1,000) ya estaban con su precio.

## Pruebas (banco local, Info Plus simulado)
`scripts/pruebas/precios-lote.cjs` a 390 y 1280 px y sin admin: **Todo bien** (solo nivel 1 contado/crédito, no manda los «Igual» ni los que no existen, marca el que falla, aviso «2 de 3», sin admin no hay botón, ≥ 44 px).
No probado: guardar de verdad en Info Plus (lo hará el dueño con su sesión).

## Estado
Rama `claude/precios-lote`, sin publicar.
