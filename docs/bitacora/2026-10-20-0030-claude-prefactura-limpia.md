# 2026-10-20 00:30 — Claude — Prefactura limpia como STUDIO; equipo y falla opcionales

## Solicitud del dueño
«Reorganizarla y ponerla como la tenemos en estudio. Y quitar todo lo otro … para irle agregando … ponerle el comentario …
Puede dejar el asunto de la reseña. Pero la falla … opcional, no obligatorio. Y el asunto de los equipos también.»
Respuestas del dueño (preguntas en el chat):
- Con equipo lleno → **crear también la orden** de reparación; sin equipo → solo la prefactura.
- Lo que sale de la pantalla → **guardarlo en un desplegable**, no borrarlo.

## Cambios (rama `claude/prefactura-limpia`, sin publicar)
- `taller-prefactura.js`:
  - Documento: cabecera → «Facturar a» (tarjeta del cliente + **Precio del cliente**) | «Condiciones» (almacén, vendedor) →
    buscador → artículos → pie (Buscar · Prefacturas · **Pedir reseña** + **Agregar comentario a la prefactura** | totales).
  - **«Equipo, falla y más datos (opcional)»** (plegado): Equipo recibido, Falla reportada (+ fallas del equipo y seguridad),
    Datos del cliente (nombre visible, WhatsApp, promociones, cédula, RNC), Orden de reparación (técnico, prioridad, entrega)
    y Otras herramientas (rifa). Se abre solo si ya trae equipo/falla (p. ej. al crear desde una orden) y resume el equipo.
  - Sin asteriscos en esos campos. «Herramientas rápidas» ya no ocupa la parte de arriba (reseña al pie, rifa en el plegable).
  - El comentario es el mismo `o_observaciones` (se guarda en `recepcion_prefacturas.observaciones` y va en `contrato`).
    Nota en pantalla: en Info Plus se verá cuando el proveedor habilite el campo (pendiente con Dagoberto).
- `taller-app.js`:
  - `_rpGuardar`: con `html.bc-pf`, si no hay marca/modelo/IMEI → solo prefactura (no llama a `guardarRecepcion`).
    Si hay equipo → pide nombre, WhatsApp y modelo antes de mandar nada (abre el plegable y dice qué falta).
    Sin artículos ni equipo → aviso. Si Info Plus da error y no hay equipo, no ofrece «registrar la recepción».
  - `guardarRecepcion`: con `html.bc-pf` ya no exige marca ni IMEI (sigue exigiendo nombre, WhatsApp y modelo).
    Con la capa apagada (`bc_pf_off`) todo sigue igual que antes.
  - `_rpCrearPrefactura`: si no hay nombre visible y el cliente es de Info Plus, usa su nombre (antes «CONTADO»).
- `taller-prefactura.css`: estilos del plegable, comentario y reseña; títulos de plegables con 5 id para ganar a `taller-tactil.css` (4 id).
- `taller.html`: versiones `taller-app.js?v=20261020-e1`, `taller-prefactura.js?v=20261020-e1`, `taller-prefactura.css?v=20261020-e1`.

## Pruebas (banco local, Supabase simulado)
- Nueva `pfopc.mjs`: **36/36** (390 y 1280): estructura, sin asteriscos, comentario al pie, reseña abre/cierra sin hueco,
  sin nada → aviso; artículo sin equipo → solo prefactura (comentario en `contrato`, Nº visible); equipo sin WhatsApp → aviso,
  nada enviado; equipo completo → prefactura + orden; solo equipo → solo orden; `guardarRecepcion` sin marca/IMEI; nombre de
  cliente Info Plus; plegable se abre solo con equipo.
- Medidas: píldoras ≥44 px (68 en celular), «Más datos» 54 px, comentario 48 px, letra del comentario 16 px, barra 54 px.
- Anteriores: `pftest` 47/47 (ajustada a «1 caja + Más datos»), `pfdesc` 14/14, `info2` 80/80; con la capa apagada
  `rxfun` 12/12, `rxppk` 23/23, `admalm` 18/18.

## Pendiente
- Que el dueño lo vea y diga «publícalo».
- Campo de comentarios y demás datos en la API de Info Plus (Dagoberto).
