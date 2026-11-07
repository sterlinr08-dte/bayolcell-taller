# Cuadre de ventas con Info Plus por sucursal y reparación de la copia (07-nov-2026)

**Pedidos del dueño:**
- «Verifica por qué las ventas de Navarrete difieren con Info Plus y el reporte que hiciste.» Mandó el reporte de Info Plus «Ganancias del 2026-10-01 al 2026-10-31», con venta neta de 1,428,937.
- «¿Puedes verificar si hay más errores con las demás sucursales?»
- Eligió la opción **B**: reparar agosto y septiembre y agregar una revisión semanal.

## Navarrete, octubre
- La copia (`infoplus_ventas`) es igual a `/api/factura` de Info Plus, línea por línea: 330 facturas y RD$1,453,427.
- La diferencia sale de cómo se cuentan las 2 notas de crédito:
  - CN00000003 es un Samsung S25 Ultra de RD$50,000. Se vendió en Santiago el 08-sep (CO00096385) y se devolvió en Navarrete el 20-oct.
  - CN00000002 es una pantalla de RD$1,000.
- Info Plus pone esas líneas **dentro de «Total ventas»** y después resta «devoluciones 24,490». Ese monto no coincide con ninguna nota de crédito de la API.
- El reporte de Bayol resta las notas de crédito: 1,402,427 − 51,000 = **1,351,427**.
- **Pendiente del dueño:** confirmar si al cliente del S25 Ultra se le devolvió el dinero completo o si fue un cambio o una devolución parcial. Eso explicaría los 24,490.

## Las 3 sucursales, agosto a noviembre
Método: la función temporal `infoplus-factura-campos` comparó Info Plus con la copia, línea por línea (factura|producto). Solo leía y ya está apagada (versión 8, responde 410).

| Mes | Resultado |
|---|---|
| Octubre | 0 diferencias en las 3 tiendas. |
| Noviembre | Solo 4 líneas de las últimas horas. No es un error: entran en la pasada horaria. |
| Septiembre | 85 líneas distintas. Copia − Info Plus: Santiago +93,000; Moca +1,050; Navarrete +15,550. |
| Agosto | 57 líneas distintas. Santiago +14,300; Moca +1,800; Navarrete con el mismo total pero líneas cambiadas. |

**Causa:** en Info Plus se anularon facturas y se cambiaron artículos de ventas viejas (por ejemplo, 1251 → 1250 y 1843 → 2550). La limpieza de `infoplus-ventas-sync` (v19) solo mira 7 días cada hora y 40 días cada día, así que lo corregido antes de esa ventana quedó viejo en la copia.

## Reparación (con el OK del dueño, opción B)
1. `infoplus-ventas-sync` corrió del 2026-8-1 al 2026-9-30. Quitó **95 líneas (RD$223,350)**, que quedaron respaldadas en `infoplus_ventas_borradas`, y agregó las que faltaban.
   - **Comprobación:** septiembre quedó igual a Info Plus: Santiago 2,986,749; Moca 535,570; Navarrete 671,880.
   - Agosto quedó con 2,664 líneas, las mismas que Info Plus.
2. **Revisión semanal:** nueva tarea `infoplus-ventas-revision-semanal` (cron 14), los domingos a las 07:41 UTC. Revisa los últimos 120 días en dos tramos (de 120 a 61 días atrás, y de 60 días a hoy). Copia en el repo: `supabase/migrations/20261107193000_ventas_revision_semanal.sql`.
   - **Prueba manual:** los dos tramos salieron bien. El tramo del 10-jul al 7-sep quitó **15 líneas más (RD$105,800)**, de finales de julio y de agosto, respaldadas igual.
- Info Plus no se tocó.

## Pendiente
- Los meses anteriores a julio de 2026 (la copia empieza en enero de 2025) probablemente tienen el mismo problema. El dueño eligió no repararlos por ahora (opción B).
- La respuesta del dueño sobre el S25 Ultra y los 24,490.
