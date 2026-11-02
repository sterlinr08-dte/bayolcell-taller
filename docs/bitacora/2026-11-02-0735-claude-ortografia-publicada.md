# 2-nov-2026 07:35 RD — Corrección ortográfica: frontend PUBLICADO (Claude)

Sigue a: 2026-11-02-0725-claude-ortografia-encendida-todos.md

## Solicitud del dueño
«Publícalo» (para el PR #199).

## Qué se publicó
- PR #199 unido a `main` (squash, commit `ace020b`). GitHub Pages → bayolcell.com.
- Marca «✓ corregido» en los chats de WhatsApp, Instagram y Facebook (`crm-ortografia.js`, `?v=20261102-or1`). Al tocarla se ve lo que escribió el empleado.
- Código de las Edge y migraciones quedan en `main` igual a lo desplegado (social v7, instagram v12, whatsapp v25; migraciones 20261102120000 y 20261102130000 aplicadas).

## Verificación en vivo
- `taller.html` ya incluye `crm-ortografia.js` y el archivo responde 200 (3.er intento, ~30 s después de unir).
- CI del PR (unit, chromium, webkit) en verde antes de unir.

## Estado
- Interruptor `crm_ortografia_config.activo = true` para todos (desde 07:20 RD).
- Apagar la marca en un equipo: `localStorage.bc_orto_marca_off = '1'`.

## Pendiente
- Revisión programada ~10:20 RD de los primeros mensajes reales (motivos, tiempos, ejemplos de Alejandro y Omir).
- Opcional del dueño: borrar la función `ortografia-banco` (410) en el panel.
