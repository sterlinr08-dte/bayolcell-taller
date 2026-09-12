-- Mismo fix que instagram_hilos/instagram_mensajes: la cuenta de Instagram es
-- compartida por todo el negocio, cualquier empleado activo debe poder leer
-- su fila (necesario para que el CRM resuelva _igCuentaId). La escritura
-- sigue solo-admin (instagram_cuentas_write_admin, sin cambios).
DROP POLICY IF EXISTS instagram_cuentas_select ON public.instagram_cuentas;
CREATE POLICY instagram_cuentas_select ON public.instagram_cuentas
  FOR SELECT TO authenticated
  USING (app_is_admin() OR app_actor_es_tecnico_activo());
