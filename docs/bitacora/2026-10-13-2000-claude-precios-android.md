# 13/14-oct-2026 — Precios nivel 1 de pantallas Android en Info Plus (Claude)

**Pedido del dueño:** mandó el Excel «Pantallas Android» con los precios nuevos («YA TERMINE DE ACTUALIZAR LOS PRECIOS») y autorizó: «Aplica solo el nivel 1».

## Qué se hizo
- Se comparó el Excel (280 cambios) con Info Plus: 117 ya los había cambiado el dueño en Info Plus; faltaban 162 y 1 sin precio (HTC 526).
- Errores de escritura confirmados por el dueño, **sin cambio**: 2601 Redmi Note 12 4G (3,500), 2448 Redmi Note 12 Pro 4G (2,800), 2758 ZTE Blade A55 (2,000).
- S25 Ultra (1354) confirmado por el dueño en 25,000; S24 Ultra 20,000 y S23 Ultra 19,000.
- Función de un solo uso `infoplus-precios-ajuste-20261013b` (Supabase taller `vkhwdvjtowrhkhqavnvk`): lista fija de 160, token guardado solo como hash, clave de Info Plus redactada. Lee en vivo y omite cualquier línea cuyo precio de hoy o descripción no coincidan. Solo nivel 1 (contado = crédito = mínimo).
- **Incidente:** de 22:30 a ~00:00 UTC Info Plus respondió «Error en las credenciales» a todas las sincronizaciones; no se tocó nada. Volvió solo.
- **Aplicado 14-oct 00:02 UTC:** 159 enviados, todos HTTP 200; **158 verificados en vivo** con el precio nuevo.

## Pendientes
- **1190 Moto G15:** omitido. Hoy está en 2,000 (alguien lo cambió) y el Excel dice 1,800. Preguntar al dueño.
- **1818 HTC 526:** Info Plus respondió OK pero no muestra precio nivel 1. Revisar en Info Plus (el artículo puede no tener niveles de precio creados).

## Cierre
- Función retirada (stub 410, verify_jwt true) y token borrado.
- Copia `infoplus_articulos` refrescada con el cron `infoplus-precios-diario`.
- No se tocaron niveles 2/3 ni costos. Ningún costo ni el Excel se suben al repo.
