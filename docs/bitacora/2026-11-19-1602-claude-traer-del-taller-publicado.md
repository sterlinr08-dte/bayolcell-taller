# 19-Nov-2026 16:02 (RD) — Claude — Publicado «Traer del Taller» (PR #331)

- El dueño respondió «Publícalo».
- **Edge `infoplus-imei-almacen` v11:** desplegada con el MCP de Supabase en `vkhwdvjtowrhkhqavnvk`, con `verify_jwt` activo.
  - Antes de subirla se comparó con la v10 en vivo: solo se agrega el modo `almacen_todo` y la función `todoElAlmacen`.
  - Sin sesión responde 401 (probado con curl).
- **PR #331**, unido con squash a `main` (commit `a87eab4c`).
  - El robot `minificar.yml` rehízo `taller-app.min.js`.
  - `bayolcell.com/taller.html` ya sirve `?v=20261119-trt1` con `#btnTraerTaller`.
  - El `.min.js` publicado contiene `traerDelTallerCrearLote` y pasa `node --check`.
- **No verificado:** el uso real con la sesión del dueño (la lista real del almacén Taller y la creación del lote). Que lo pruebe una vez y avise si algún equipo sale apagado por no tener artículo.
