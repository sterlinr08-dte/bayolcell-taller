# Claude · CRM paquete C + iconos ordenados: publicado

## Autorización
El dueño tocó «Publícalo» después de ver el antes y después de los iconos (10-nov-2026).

## Qué se publicó
- PR #283 → `main`, commit `a7a5636c1ddf7670c5c2c0a403a55a4d33e966be` (squash de `claude/crm-rapido-c`).
- Paquete C: `crm-estilos.js` (c1) y las 14 reglas `:has()` del CRM pasadas a clases. Apagar: `BC_CRM_CLASES=false` o `localStorage.bc_crm_estilos_off='1'`.
- Iconos ordenados: `crm-iconos.css` (i1). Apagar: `BC_CRM_ICO=false` o `localStorage.bc_crm_ico_off='1'`.
- Detalle en `2026-11-10-0704-claude-crm-rapido-c-unido.md` y `2026-11-10-0812-claude-crm-iconos-ordenados.md`.

## Verificación en vivo (solo lectura de archivos, sin abrir sesión)
- `bayolcell.com/taller.html` trae `crm-iconos.css?v=20261110-i1` y las marcas `bc-crm-ico` y `bc-crm-clases`.
- `crm-iconos.css` y `crm-estilos.js` responden 200.

## Pruebas antes de publicar (banco local)
`crm-estilos.cjs` Todo bien; `crm-rapido.cjs` 139 aprobadas · 0 fallidas.

## Pendiente
- Que el dueño lo pruebe en su iPhone (Safari real no se probó).
- Anchos de PC entre 1025 y 1239 px: la línea de arriba quedó como estaba.
