# Publicado: Ficha del Equipo compacta + tarjeta en su color y con piezas — 16-oct-2026

**Autorización del dueño:** «PUBLICALO».

**Commits publicados en `main`** (avance directo desde `claude/ficha-equipo-mejoras`):
- `1638c1f`: Ficha del Equipo compacta (ver `2026-10-16-1200-claude-ficha-equipo-compacta.md`).
- `3e6f1b3`: tarjeta de Reacondicionados con el equipo en su color y el cuadro «Piezas puestas» (ver `2026-10-16-1220-claude-tarjeta-color-piezas.md`).

**Versiones:**
- `taller-app.js?v=20261016-fe1`
- `crm-marketing-consent.js?v=20261016-c1`, que carga `taller-flota.js?v=20261016c1`

**Verificación antes de publicar:** `node --check` de `taller-app.js` y `taller-flota.js` sin errores, y los bloques de `taller.html` sin errores.

**Deploy:** GitHub Pages (bayolcell.com).

**Riesgo:** solo visual. No se tocaron datos ni Supabase.

**Reversa:** revertir los dos commits.
