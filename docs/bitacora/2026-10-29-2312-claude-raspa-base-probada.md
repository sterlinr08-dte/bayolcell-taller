# Raspa y gana: base de datos probada (sin aplicar)

## Qué se probó
Se probó la migración `supabase/migrations/20261029200000_raspa_y_gana.sql`:
- dentro de una transacción en la base real;
- terminada con un error a propósito, así que **se deshizo todo** (rollback);
- **no se guardó nada** en la base.

Se usó la identidad de un usuario administrador real solo para leer permisos, sin su clave.

## Resultado

| Prueba | Resultado |
|---|---|
| Topes por artículo | Lámina 1662 → 10 · cargador VIDVIE 1539/1540 → 0 · VIDVIE V8 1541 → 10 · servicio 1121 → 10 · envío 1161 / recarga 1186 → 0 · pantalla 1085 → 5 · batería 1843 → 10 · celular 2637 → 0 · templado 1582 → 10 · flex 1795 → 5 |
| Emitir (prefactura 119274, RD$2,000) | Crea BC-J6U3 en estado pendiente. Si se emite de nuevo, devuelve el mismo código (un juego por compra). |
| Emitir una compra menor de RD$500 (119314) | Se rechaza: «menor_500». |
| Activación automática | Al abrir el QR, 119274 encontró su factura en las ventas de Info Plus y pasó a «activo». 118931 no tenía una factura única y siguió «pendiente». |
| Jugar con un teléfono malo | Se rechaza. |
| Jugar | Da un premio. Si se juega otra vez, devuelve el mismo premio. Si el juego está pendiente, lo rechaza. |
| Buscar desde la página pública (sin sesión) | Bloqueado: «No autorizado». |
| Buscar por teléfono y por la dirección del QR | Encuentra el premio. |
| Canjear en la misma compra que lo generó | Se rechaza: «misma_compra». |
| Canjear | Funciona. Si se repite en la misma prefactura no da error; en otra prefactura dice «usado» y en cuál se usó. |
| Activar a mano sin factura | Se rechaza. Con factura funciona. Si la factura ya se usó, se rechaza. |
| Reparto en 200 juegos | 166 de 5 % · 31 de 10 % · **3 regalos** (se respetó el tope de 3 por día). |

## Pendiente
- Pantallas: la página pública para raspar, el canje en la prefactura y el cupón en la hoja impresa.
- Aplicar la migración en la base solo cuando el dueño diga «publícalo».
