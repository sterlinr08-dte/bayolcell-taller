#!/usr/bin/env bash
# Candado de minificación (23-oct-2026). Antes de un `git push` lanzado por Claude: si taller-app.js cambió y
# taller-app.min.js no corresponde a esa fuente, lo regenera y bloquea el push para que se confirme junto.
# (El robot de GitHub lo haría igual al llegar a main; esto evita el minuto de desfase.) Apagar: MINIFICAR_OFF=1.
set -u
IN=$(cat 2>/dev/null || true)
CMD=$(printf '%s' "$IN" | python3 -I -c 'import sys,json
try: print(json.load(sys.stdin).get("tool_input",{}).get("command",""))
except Exception: print("")' 2>/dev/null || true)
case "$CMD" in *"git push"*) ;; *) exit 0 ;; esac
case "$CMD" in *MINIFICAR_OFF=1*) exit 0 ;; esac
cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || exit 0
[ -f taller-app.js ] && [ -f scripts/minificar.sh ] || exit 0
SHA=$(sha1sum taller-app.js | cut -c1-12)
head -c 300 taller-app.min.js 2>/dev/null | grep -q "sha1 $SHA" && exit 0
bash scripts/minificar.sh >/dev/null 2>&1 || { echo "MINIFICAR: no se pudo generar taller-app.min.js (¿sin esbuild?). El robot de GitHub lo hará al llegar a main." >&2; exit 0; }
if ! git diff --quiet -- taller-app.min.js taller-app.min.js.map || [ -n "$(git ls-files --others --exclude-standard taller-app.min.js)" ]; then
  echo "MINIFICAR: taller-app.js cambió y se regeneró taller-app.min.js. Confírmelo (git add taller-app.min.js taller-app.min.js.map && git commit --amend --no-edit, o un commit nuevo) y vuelva a hacer push." >&2
  exit 2
fi
exit 0
