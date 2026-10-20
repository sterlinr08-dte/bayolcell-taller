# 2026-10-20 22:40 · Claude · Sincronización automática de los IMEI de las compras

## Pedido del dueño
«Pon en automático la sincronización de los IMEI. ¿Qué consume eso? ¿Pone la pantalla a parpadear?»

## Qué se hizo (pg_cron en Supabase)
- **`infoplus-seriales-diario`:** corre todos los días a las 6:20 UTC (2:20 a. m. RD).
  - Llama a la Edge `infoplus-seriales-sync` con los últimos 10 días de compras.
  - Guarda en `infoplus_seriales` cada IMEI con su producto, proveedor, factura, fecha y costo.
  - Usa el mismo comando y los mismos encabezados que `infoplus-precios-diario`, que ya existía. Solo se cambian la URL y el cuerpo, y no se leyó ni se copió ninguna clave.
- **`infoplus-seriales-ponerse-al-dia`:** puesta al día de una sola vez, del 1-jun-2026 a hoy. La tabla había quedado en el 23-jun. Corre una vez y se borra sola.

## Consumo
- No usa IA ni créditos.
- Es una llamada por día a Info Plus, más una de puesta al día.
- Corre dentro del plan de Supabase.

## Pantalla
Nada cambia en la pantalla. Corre en el servidor de madrugada, sin el navegador, y no hace parpadear nada.

## Nota
La lista de compras se usa para «IMEI → Proveedor». La ventana IMEI de la Prefactura NO usa esta tabla: usa los IMEI por almacén de Info Plus, que dependen de la respuesta de Dagoberto.
