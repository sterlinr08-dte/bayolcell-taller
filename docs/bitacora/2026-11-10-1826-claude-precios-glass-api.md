# Claude · Precios del cambio de glass de iPhone cambiados en Info Plus (nivel 1, por la API)

## Pedido del dueño (10-nov-2026)
Mandó el volante «Cambia el cristal de la pantalla de tu iPhone» y sus precios nuevos. Se le preparó un botón «Precios en lote» (rama `claude/precios-lote`, **no publicada**); contestó: «No, crear no, es hacerlo por la API de infoplus».

## Cómo se hizo
- `infoplus-precio-actualizar` exige un administrador con sesión, y la IA no inicia sesión con cuentas del dueño. Con la orden expresa del dueño se desplegó una Edge Function de **un solo uso**, `infoplus-precios-glass-unavez`:
  - lista fija de 15 artículos y precios en el código (no aceptaba otros);
  - protegida por un token aleatorio (en el código solo su hash SHA-256; el token se borró después);
  - usó la clave de Info Plus del servidor (`INFOPLUS_CLAVE`), sin que pasara por el chat ni por el repo;
  - mandó a `POST /api/articulo` **solo nivel 1, contado y crédito**. Info Plus solo cambia lo que se envía: el mínimo y los niveles 2 y 3 quedan igual;
  - copió el nivel 1 a `infoplus_articulos` (`niveles["1"]` y `precio`).
- Primero se probó con un artículo (2785) y luego los 15. Llamada sin token: 403.
- **Desactivada** al terminar (v2: responde 410, `verify_jwt=true`; con el token viejo da 401).

## Resultado (todos 200 en Info Plus, copia local OK)
| Código | Artículo | Antes | Ahora |
|---|---|---:|---:|
| 2785 | 15 Pro Max | 9,000 | 8,990 |
| 2924 | 15 Pro | 6,500 | 7,990 |
| 2784 | 15 Plus | 5,000 | 5,990 |
| 2782 | 14 Pro Max | 8,000 | 6,990 |
| 2923 | 14 Pro | 4,500 | 5,490 |
| 2781 | 14 Plus | 4,500 | 5,990 |
| 2779 | 13 Pro Max | 6,000 | 5,990 |
| 2746 | 12 Pro Max | 3,000 | 4,990 |
| 2743 | 11 Pro Max | 2,500 | 2,490 |
| 2813 | XS Max | 2,000 | 1,490 |
| 2742 | X | 1,200 | 1,500 |
| 2786 | 16 | 20,000 | 10,000 |
| 2787 | 16 Plus | 25,000 | 11,000 |
| 2925 | 16 Pro | 30,000 | 11,000 |
| 2788 | 16 Pro Max | 30,000 | 12,000 |

## Sin cambiar (esperan decisión del dueño)
Artículos compartidos por dos modelos, con dos precios distintos en su lista: **2778** 13/13 Pro (4,490 o 3,490; hoy 3,700), **2776** 12/12 Pro (3,490 o 2,990; hoy 2,500), **2775** XR/11 (1,990 o 1,500; hoy 2,000). 14 normal, 15 normal y 8 Plus ya tenían el precio pedido.

## Para revisar (no se tocó)
- 2813 XS Max: nivel 1 = 1,490 y nivel 2 = 1,500 (el mayorista queda más caro que el cliente final).
- 2788 16 Pro Max: nivel 1 = nivel 2 = 12,000.
- 2786/2787/2925 serie 16: nivel 2 en 1,000–1,200 (parece error de antes).

## Para deshacer
Volver a poner en Info Plus los precios de la columna «Antes» (nivel 1, contado y crédito).
