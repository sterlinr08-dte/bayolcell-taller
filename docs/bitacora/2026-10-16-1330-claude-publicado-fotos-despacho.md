# Publicado: fotos por color, botón «Abrir» y despacho con buscador — 16-oct-2026

**Autorización del dueño:** «Publicalo».

**Qué se publicó:** el commit de la rama `claude/tarjeta-fotos-abrir`, con avance directo de `main`. El detalle está en `2026-10-16-1300b-claude-fotos-color-despacho-abrir.md`.

**Versiones:**
- `taller-app.js?v=20261016-fc1`
- `crm-marketing-consent.js?v=20261016-c2`, que carga `taller-flota.js?v=20261016c2`
- 93 fotos en `img/iphone-colores/`

**Verificación:** `node --check` de los dos archivos sin errores.

**Riesgo:**
- Fotos y botón: solo cambia cómo se ve la tarjeta.
- Despacho: lo que se manda a Info Plus no cambió; solo cambia cómo se eligen los teléfonos.

**Para deshacerlo:** revertir el commit.
