#!/usr/bin/env bash
# Genera taller-app.min.js (+ mapa de fuentes) a partir de taller-app.js. 23-oct-2026 (dueño: «y automático para que no se olvide»).
# Lo corre solo el robot de GitHub (.github/workflows/minificar.yml) al cambiar taller-app.js en main, y el candado local
# antes de cada `git push`. NO editar taller-app.min.js a mano: se pisa en la próxima generación.
set -euo pipefail
cd "$(dirname "$0")/.."
SHA=$(sha1sum taller-app.js | cut -c1-12)
BANNER="/* taller-app.min.js — generado por scripts/minificar.sh desde taller-app.js (sha1 $SHA). No editar a mano. */"
ESB=(npx --no-install esbuild); "${ESB[@]}" --version >/dev/null 2>&1 || ESB=(npx -y esbuild@0.28.2)
"${ESB[@]}" taller-app.js --minify --target=es2019 --charset=utf8 --sourcemap --sources-content=false \
  --banner:js="$BANNER" --outfile=taller-app.min.js --log-level=error
node -e "new Function(require('fs').readFileSync('taller-app.min.js','utf8'))"
echo "taller-app.min.js: $(du -k taller-app.min.js | cut -f1) KB (fuente sha1 $SHA)"
