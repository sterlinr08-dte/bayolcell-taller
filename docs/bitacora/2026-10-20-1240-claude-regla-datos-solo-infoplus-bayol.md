# 2026-10-20 12:40 — Claude — Regla del dueño: los datos de Bayol salen solo de su Info Plus

## Dueño
«No consultes en STUDIO porque este no tiene la API de Info Plus de Bayol Cell taller.»

## Regla
- STUDIO (`studio-rd`) sirve **solo como modelo de diseño y de cómo se usa la pantalla** (código de la interfaz).
- Precios, niveles, existencias, clientes y prefacturas de Bayol salen **únicamente** del Info Plus de Bayol
  (copia `infoplus_articulos` en Supabase `vkhwdvjtowrhkhqavnvk` y funciones `infoplus-*`). Nunca de datos de STUDIO.
- Hasta hoy así fue: de STUDIO solo se copió la forma del buscador y del detalle (`parches-pos.js`); los datos de la
  prefactura y de la muestra vinieron de Bayol.
