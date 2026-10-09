---
name: precios-competencia
description: Ver el perfil de Instagram (o TikTok) de otra tienda de celulares y sacar sus precios para compararlos con los de BAYOL CELL. Úsala cuando el dueño diga «mira el perfil de X», «qué precios tiene X», «compárame con X» o antes de definir una oferta o un video de precios.
---

# precios-competencia (BAYOL CELL)

## Reglas
- Solo **leer** datos públicos. Nunca comentar, seguir, dar «me gusta» ni escribirle a la competencia.
- No usar la clave ni las cookies del dueño. Instagram se lee **solo** por la vía oficial (Supermetrics).
- No copiar ni volver a publicar fotos o videos de otros.
- Siempre poner **la fecha de cada precio**: un precio de hace semanas puede haber cambiado.

## 1. Instagram (vía oficial, sin riesgo de baneo)
Supermetrics → `instagram_insights` con `ds_id: "IGPD2"`.
- **Conexión:** cuenta de Supermetrics `bayolcellsrl@gmail.com`, equipo «Team bayolcellsrl», login de Facebook «Bayol Cell RD». Conectada el 09-oct-2026; la prueba gratis vence cerca del 21-oct-2026.
- **Perfil:** `settings {"report_type":"BusinessDiscoveryAccount"}`, `ds_accounts: "<usuario>"`, `fields: username,name,biography,followers,total_post_count`.
- **Publicaciones:** `settings {"report_type":"BusinessDiscoveryMedia"}` con `date_range_type: last_30_days_inc`, `max_rows: 100` y `fields: post_timestamp,post_type,post_permalink,post_caption,post_likes,post_comments,post_views`.
  - La respuesta es grande: viene en un archivo. Se procesa con Python o jq; **no** se lee entera en el chat.
- Solo funciona con cuentas de **empresa o creador**. Si responde que la cuenta no es válida, pasar al punto 2.

## 2. Respaldo: TikTok y Facebook públicos
Casi todas las tiendas de RD suben lo mismo a TikTok.
- yt-dlp con `--impersonate chrome` (paquetes en el scratchpad: `ytdlp_pkg` + `cffi_pkg`), `--flat-playlist -J` del perfil y `--write-info-json` por video para el texto completo.
- Si el precio está **dentro** del video o la foto: sacar cuadros con ffmpeg y leerlos con Read.

## 3. Precios de BAYOL para comparar
- **Equipos:** Edge Function pública `catalogo-publico` (POST `{"categoria":"celular"}` con la anon key pública de `index.html`).
  - Usar el precio de contado.
  - Las opciones con nota «Con aviso» o «Precio financiado» se ponen aparte, no se mezclan con el contado.
- **Reparaciones:** flyers `assets/reparacion-{pantalla,bateria,cristal-frontal,cristal-trasero}.webp` (leer a tamaño completo).
- **Pantallas Android:** desde RD$1,000 (dato del dueño).

## 4. Entrega al dueño
Tabla «Modelo · Ellos (fecha) · BAYOL · Quién está más barato», en español simple, con estos avisos:
- **Calidad:** puede no ser la misma (original, genérica, usado, «Con aviso»).
- **Vigencia:** ofertas con fecha de vencimiento.
- **Contenido:** lo que más les funciona (top por vistas y comentarios) e ideas para BAYOL.

## Historial
- 09-oct-2026: primera prueba exitosa con @deorocell (745 mil seguidores, 100 publicaciones de los últimos 30 días leídas por la vía oficial).
