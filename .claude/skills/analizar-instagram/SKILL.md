---
name: analizar-instagram
description: Analizar el Instagram de BAYOL CELL (@bayolcell) y de la competencia para saber qué contenido funciona, sacar precios de los flyers y mantener la guía de marca. Úsala cuando el dueño pida «mira mi Instagram», «qué está funcionando», «qué debo mejorar», «qué hace la competencia», o antes de crear un reel/anuncio nuevo para BAYOL.
---

# analizar-instagram (BAYOL CELL)

Objetivo: que cada video o anuncio nuevo salga de **lo que ya funciona** en @bayolcell y en la competencia, no de suposiciones.

## Reglas
- Solo **leer y analizar**. Nunca publicar, comentar, dar «me gusta», seguir ni enviar mensajes sin orden y aprobación del dueño.
- No iniciar sesión con cuentas del dueño. Si una herramienta pide autorización, darle el paso al dueño para que la haga él.
- Solo información pública de otras empresas; nada de datos personales de clientes.
- Descargas en una carpeta nueva del scratchpad, nunca dentro del repo.

## Fuentes (de la más completa a la más simple)
1. **Supermetrics (MCP) — `instagram_insights`**
   - `ds_id: "IGI"`: cuenta propia con métricas (alcance, vistas, guardados, mejores Reels). Necesita que el dueño autorice su cuenta una vez.
   - `ds_id: "IGPD2"`: perfiles públicos (`BusinessDiscoveryMedia` con `ds_accounts: "bayolcell"` o el usuario de la competencia) y búsqueda por hashtag.
2. **Biblioteca de anuncios de Meta (MCP Meta Ads, `ads_library_search`)**: anuncios activos en RD («reparación de celulares», «cambio de pantalla», «iPhone Santiago»…). Un anuncio que lleva mucho tiempo activo suele ser rentable.
3. **Por enlace**: skill `ver-video-redes` (en nexus-pro). Usa yt-dlp para videos públicos, saca un mosaico de cuadros y el audio.
4. **Web**: Firecrawl (buscar cuentas y tendencias) y Buzzy `trending_search_videos`.
5. **Flyers de precios propios**: `assets/reparacion-*.webp` y la página `index.html`.

## Pasos
1. Traer las últimas 30–50 publicaciones (o todas las que se puedan) con fecha, tipo (Reel, foto, carrusel), texto y métricas.
2. Ordenar por desempeño (vistas, guardados, comentarios) y bajar los 5 mejores y los 5 peores.
3. De cada uno, anotar:
   - el gancho de los primeros 2 segundos;
   - duración y ritmo;
   - si aparecen personas reales;
   - música;
   - texto en pantalla;
   - llamado a la acción (WhatsApp, visita);
   - si dice el precio.
4. Comparar con 8–12 ejemplos de la competencia o de referencia.
5. Entregar al dueño, en español simple:
   - qué funciona;
   - qué mejorar;
   - 10 ideas listas para grabar;
   - un calendario.
6. Actualizar la **guía de marca** en `docs/marca/GUIA_CONTENIDO.md` y dejar entrada en la bitácora si hubo cambios.

## Datos fijos ya confirmados (08-oct-2026)
- **Estilo de los flyers:** rojo y negro, títulos en mayúscula gruesa e inclinada y sellos «EN 30 MINUTOS ¡CAMBIO RÁPIDO!».
- **Pantalla y batería:** 30 minutos. **Cristal frontal de iPhone:** 2 horas. **Cristal trasero:** 50 minutos (según flyers).
- **Precios de los flyers:**
  - pantallas de iPhone desde RD$1,000 (lista nueva del 09-oct-2026 en CLAUDE.md);
  - **pantallas Android desde RD$1,000**, según el dueño;
  - baterías desde RD$1,000;
  - cristal trasero desde RD$1,200;
  - cristal de pantalla desde RD$2,690.
- **Sucursales** (las 3 hacen todas las reparaciones):
  - Santiago 809-707-2493
  - Moca 829-670-9694
  - Navarrete 809-893-4412
  - WhatsApp general 849-564-4791
- **Rifa:** cada reparación da un boleto, que se consulta en bayolcell.com.
- **En los videos:** «Cotiza gratis» en lugar de precios, salvo en el video específico de pantallas Android.
