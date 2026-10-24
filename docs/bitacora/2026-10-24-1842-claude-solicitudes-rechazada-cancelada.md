# 24-oct-2026 (RD) · Claude · Solicitudes: estados «Rechazada» y «Cancelada» siempre visibles — rama sin publicar

## Pedido del dueño
- Probó la pestaña publicada (PR #119) en su iPhone: «Faltan más seguimiento no rechazada o cancelado, no es ahí que se cambia el estado del cliente?».
- Antes «No aprobada» solo salía después de «Enviada al banco» y no existía «Cancelada».

## Cambios
- Base (ya aplicada, sin tocar datos): el control de `seguimiento` acepta `cancelada`; la RPC `fin_solicitud_seguimiento`
  también. Migración `20261024230000_fin_solicitudes_cancelada.sql`.
- `crm-solicitudes.js` s2: «No aprobada» se llama **Rechazada** (se guarda igual, `no_aprobada`); nuevo **Cancelada**
  («El cliente desistió o se anuló»). Los dos se ven siempre debajo de «Si no sigue adelante», en cualquier paso.
  Se puede tocar cualquier paso para corregir (se quitó el botón «Corregir»). Cancelada cuenta como cerrada y no suma al número rojo.
- Cargador `crm-marketing-consent.js?v=20261024-u24` (carga s2).

## Pruebas
- `scripts/pruebas/solicitudes-crm.cjs` (ampliada: 6 pasos visibles desde Recibida y cancelar la No. 5 directo): 390 OK, 1280 OK.
- Toque real con el dedo simulado (iPhone 390) sobre «Enviada al banco»: llama a la RPC (la de producción no había recibido ningún toque del dueño).

## Estado
- Rama `claude/solicitudes-estados`, sin publicar. Falta «publícalo».
