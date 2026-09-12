-- Fix 2026-09-12 (Sterling: "en todas las redes sociales"): la cuenta de
-- Instagram es UNA SOLA compartida por todo el negocio (no una por sucursal
-- como WhatsApp) -- las politicas RLS heredadas del molde de WhatsApp
-- restringian instagram_hilos/instagram_mensajes a sucursal_id = la del
-- actor, lo que dejaba la bandeja vacia para cualquier tecnico que no fuera
-- de la sucursal guardada en instagram_cuentas (Santiago). Se reemplaza por
-- una politica que solo exige ser un empleado activo (tecnico activo o
-- admin/usuario), sin mirar sucursal -- mismo criterio que ya se aplico en
-- la Edge Function instagram-enviar (tieneAccesoARedSocial).

CREATE OR REPLACE FUNCTION public.app_actor_es_tecnico_activo()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
declare t text; rid uuid; act boolean;
begin
  select actor_type, actor_ref_id into t, rid from public.app_actor_identity();
  if t = 'tecnico' and rid is not null then
    select coalesce(activo,true) into act from public.tecnicos where id = rid;
    return coalesce(act, false);
  end if;
  return false;
end $function$;

DROP POLICY IF EXISTS instagram_hilos_scoped ON public.instagram_hilos;
CREATE POLICY instagram_hilos_scoped ON public.instagram_hilos
  FOR ALL TO authenticated
  USING (app_is_admin() OR app_actor_es_tecnico_activo())
  WITH CHECK (app_is_admin() OR app_actor_es_tecnico_activo());

DROP POLICY IF EXISTS instagram_mensajes_scoped ON public.instagram_mensajes;
CREATE POLICY instagram_mensajes_scoped ON public.instagram_mensajes
  FOR ALL TO authenticated
  USING (app_is_admin() OR app_actor_es_tecnico_activo())
  WITH CHECK (app_is_admin() OR app_actor_es_tecnico_activo());
