# Curvo publicado en producción

**Pedido del dueño:** «Publícalo» (capa Curvo completa, con la barra lateral curva y flotando). Sigue a `…-claude-curvo.md` y `…-claude-curvo-barra.md`.

- PR #321, unido a `main` (squash): commit `20528b8e89f97fc4e4acd4d37a0307f1ce25f711`.
- Verificado en vivo en bayolcell.com: `taller.html` carga `bc-curvo.js?v=20261112-cu2` y el archivo trae `bcCurvoBarra`.
- Prueba antes de publicar: `scripts/pruebas/curvo.cjs` Todo OK a 390 y 1280 px.
- Solo apariencia; no toca datos, permisos ni funciones.
- Apagar en un equipo: `localStorage.bc_curvo_off='1'`.

## Pendiente
- Que el dueño lo pruebe en su iPhone real.
- Sin respuesta todavía: si se aplica Curvo en NEXUS (con cuidado por el antecedente de FOUC).
- La rama `claude/reacond-columnas` sigue guardada, sin publicar.
