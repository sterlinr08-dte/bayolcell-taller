# 24-Oct-2026 17:48 (RD) · Claude · Publicada la pestaña «Solicitudes» del CRM

- Dueño: «Publícalo».
- PR #119 unido a `main` (squash `7dd3e65`). CI verde antes de unir (chromium, webkit, unit).
- Verificado en bayolcell.com: `crm-solicitudes.js` (s1) idéntico al repo, `taller.html` con el botón `crmLineaTabSolicitudes`
  y el cargador `crm-marketing-consent.js?v=20261024-u23` que carga la capa.
- Base: columnas `seguimiento*` y RPC `fin_solicitud_seguimiento` ya estaban aplicadas (bit. 2026-10-24-1726).
- Detalle de lo que hace: `docs/bitacora/2026-10-24-1726-claude-solicitudes-crm.md`.
- Apagar si hiciera falta: `localStorage.bc_solicitudes_off='1'` en el equipo.

## Pendiente
- Prueba real: un empleado abre CRM › Solicitudes, marca la No. 3 como «Enviada al banco» y revisa que quede su nombre.
