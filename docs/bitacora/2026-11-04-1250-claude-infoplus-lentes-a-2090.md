# 4-nov-2026 — Info Plus: lentes de cámara de Navarrete reclasificados al 2090 (Claude)

## Solicitud del dueño
«Todos los lentes de cámara que están en el almacén de Navarrete dale salida y luego dale entrada al código 2090 almacén Navarrete.»
Confirmó la lista (9 códigos, 73 unidades) y eligió el **costo promedio** de lo que sale.

## Antes (existencia en vivo, almacén 7 = Navarrete)
| Código | Artículo | Cant. | Costo |
|---|---|---:|---:|
| 2364 | LENTE DE CAMARA IPHONE 12 PRO MAX | 12 | 11.5797 |
| 2388 | LENTE DE CAMARA IPHONE 12 / 12 MINI | 10 | 16.6744 |
| 2384 | LENTE DE CAMARA IPHONE 13PRO / 13 PRO MAX | 10 | 16.08 |
| 2387 | LENTE DE CAMARA IPHONE 14 / 14 PLUS | 10 | 31.1667 |
| 2386 | LENTE DE CAMARA IPHONE 14 PRO / 14 PRO MAX | 9 | 16.56 |
| 2357 | LENTE DE CAMARA IPHONE 11 | 7 | 6.03 |
| 2363 | LENTE DE CAMARA IPHONE 11PRO / 11 PRO MAX | 5 | 10.12 |
| 2983 | LENTE DE CAMARA IPHONE 15 / 15 PLUS | 5 | 12.62 |
| 2390 | LENTE DE CAMARA IPHONE XS MAX | 5 | 6.32 |
| **Total** | | **73** | valor 1,114.72 |
2090 «LENTES PROTECTORES DE CAMARAS IPHONE VARIADOS» en almacén 7: 0.

## Hecho (Info Plus, almacén 7)
- **AI00000894** — SALIDA (codminventario 2) de los 9 códigos, total 1,114.72.
- **AI00000895** — ENTRADA (codminventario 1) de **73 × 2090** a costo promedio **15.2701**, total 1,114.72 (el valor del inventario no cambia).
- Comentario en ambos: «Reclasificación: lentes de cámara iPhone → 2090 (dueño 4-nov-2026)».
- Después (en vivo): los 9 códigos en 0 en Navarrete; 2090 = 73. Los otros almacenes no se tocaron.

## Cómo se hizo
- Edge temporal `infoplus-reclasificar-lentes-una-vez` (token de un solo uso por SHA-256; revisaba la existencia en vivo y no
  movía nada si no cuadraba; modo revisar → ejecutar). **Ya apagada** (versión 2 responde 410). El dueño puede borrarla en el panel.

## Nota
- `infoplus-existencia-art` responde con la llave pública (solo lee existencias). Revisar si se quiere exigir sesión.
