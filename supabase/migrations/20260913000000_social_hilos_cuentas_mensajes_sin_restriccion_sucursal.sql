-- Mismo fix que Instagram (migracion 20260912202653/202708): social_cuentas
-- (Facebook/TikTok) tambien son cuentas UNICAS compartidas por todo el
-- negocio, no una por sucursal. Las politicas heredaban el mismo patron de
-- WhatsApp (sucursal_id = app_actor_sucursal_id()) que dejaba la bandeja
-- vacia para empleados de otra sucursal. Se reemplaza por
-- app_actor_es_tecnico_activo() (cualquier empleado activo, sin importar
-- sucursal), ya creada en la migracion de Instagram.

DROP POLICY IF EXISTS social_cuentas_select ON public.social_cuentas;
CREATE POLICY social_cuentas_select ON public.social_cuentas
  FOR SELECT TO authenticated
  USING (app_is_admin() OR app_actor_es_tecnico_activo());

DROP POLICY IF EXISTS social_hilos_scoped ON public.social_hilos;
CREATE POLICY social_hilos_scoped ON public.social_hilos
  FOR ALL TO authenticated
  USING (app_is_admin() OR app_actor_es_tecnico_activo())
  WITH CHECK (app_is_admin() OR app_actor_es_tecnico_activo());

DROP POLICY IF EXISTS social_mensajes_scoped ON public.social_mensajes;
CREATE POLICY social_mensajes_scoped ON public.social_mensajes
  FOR ALL TO authenticated
  USING (app_is_admin() OR app_actor_es_tecnico_activo())
  WITH CHECK (app_is_admin() OR app_actor_es_tecnico_activo());
