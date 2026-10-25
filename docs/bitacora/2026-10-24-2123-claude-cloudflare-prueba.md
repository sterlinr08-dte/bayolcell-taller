# 25-oct-2026 (RD) · Claude · Bayol en Cloudflare: configuración de prueba (bayolcell.com NO se toca)

## Pedido
- Dueño: «¿Me habías dicho que para que el sistema sea más rápido hay que ponerlo en Cloudflare?» → «Hazlo tú».
- Antecedente: bitácora 2026-10-23-0830 (meta 3 s: partir taller-app.js + mover de GitHub Pages a Cloudflare).

## Medido hoy (GitHub Pages)
- `cache-control: max-age=600` (10 min) en todo; compresión gzip (sin brotli); servidor en EE. UU. (iad).
- taller.html 97 KB, taller-app.min.js 469 KB.

## Hecho (rama `claude/cloudflare-prueba`)
- `wrangler.jsonc`: Worker «bayolcell-taller» de solo archivos (igual que NEXUS PRO y STUDIO RD), sin código.
- `.assetsignore`: nunca se publican .git, docs/, supabase/, scripts/, tests/, tools/, videos-remotion/, .claude/, *.md, *.sql, *.cjs.
- `_headers`: HTML sin caché (siempre ve lo nuevo); JS/CSS 1 año (todos se piden con ?v=…, verificado en todas las
  páginas públicas); imágenes 1 día; carpeta bde/ sin caché (carga archivos sin ?v=). GitHub Pages ignora este archivo.
- Ensayo `wrangler deploy --dry-run` OK.

## Límite
La herramienta de Cloudflare de esta sesión solo LEE la cuenta (ve nexus-pro, studio-rd, geriatria, avicola-app); no puede
crear proyectos. El dueño conecta el repositorio una vez desde el panel (pasos en el chat). Luego cada cambio se publica solo.

## Siguiente
1. Dueño conecta el repo (rama `claude/cloudflare-prueba`) → dirección de prueba *.workers.dev.
2. Claude compara velocidad (GitHub vs Cloudflare) y revisa que todo funcione.
3. Solo con aprobación del dueño: mover el dominio bayolcell.com.
