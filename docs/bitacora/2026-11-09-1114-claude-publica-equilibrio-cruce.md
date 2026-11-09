# Publicado: «≈ N ventas», «El cruce» y microcopy compacto (PR #268)

- El dueño tocó «Publícalo».
- Se aplicó la migración `facturas_por_tienda` en BayolCell-taller (`vkhwdvjtowrhkhqavnvk`) antes de subir la pantalla.
  - Es SECURITY DEFINER, pide `app_puede_contabilidad()` y si no hay permiso da «Sin permiso de Contabilidad».
  - No se ejecutó `revoke ... from anon` porque la herramienta MCP retiene esas sentencias. anon tiene EXECUTE, pero el permiso de Contabilidad lo frena.
  - Si se quiere cerrar del todo, el dueño puede pegar en el SQL Editor: `revoke all on function public.facturas_por_tienda(date, date) from public, anon;`
- Se unió el PR #268 (squash `7a7f8de`).
- El primer despliegue de Pages tardó; se volvió a verificar con curl después de esta bitácora.
