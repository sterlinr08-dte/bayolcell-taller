# 2026-10-30 10:05 (RD) — Claude — Publicado: la regla de espaciado en todos los formularios

## Solicitud del dueño
Tras ver 4 comparativas antes/después (Crear artículo y Deuda manual a 390; Crear artículo y Nuevo despacho a 1280), el dueño dijo «Publícalo».

## Qué se publicó
- Rama `claude/espaciado-todos` (commit `7dfd1ad`), PR **#148**, squash en `main` = `18356fe`.
- Detalle del cambio y los 19 formularios que no cumplen (con motivo) en la bitácora `2026-10-30-0946-claude-espaciado-todos.md`.

## Pruebas antes de fusionar
- CI del PR: unit, browser (chromium) y browser (webkit) en verde.
- Banco local 13/13 (hecho por el agente antes de subir).

## Deploy
- GitHub Pages. Verificado con `curl`: `taller.html` sirve `bc-form-espaciado.css?v=20261030-e2` a las 10:04 RD; `catalogo.html` carga la hoja.

## Cómo apagar si algo se ve mal
- En un equipo: `localStorage.bc_fesp_off='1'` (apaga también el piloto).
- Para todos: `BC_FESP=false` en `taller.html` (y en las páginas públicas).

## Pendiente
- Que el dueño lo vea en su iPhone real (los íconos Tabler no cargan en el banco de pruebas).
- Los 19 que no cumplen necesitan decisión del dueño o cambio de HTML/JS, no de CSS.
