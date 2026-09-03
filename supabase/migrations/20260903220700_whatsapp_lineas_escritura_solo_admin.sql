-- Auditoria 2026-09-04: whatsapp_lineas tenia una unica policy RLS
-- (ALL/authenticated/qual true) que permitia a CUALQUIER cuenta logueada
-- (incluido un tecnico de una sola sucursal) modificar zernio_account_id de
-- cualquier linea de WhatsApp del negocio -- el vector de mayor impacto de
-- ese hallazgo (podria desviar/romper el envio de mensajes de otra
-- sucursal). Esta es la mitigacion minima e inmediata que recomienda la
-- propia auditoria: separar lectura (sin cambios) de escritura
-- (INSERT/UPDATE/DELETE ahora exige app_is_admin()). La restriccion mas
-- amplia por sucursal para whatsapp_hilos/whatsapp_mensajes/leads queda
-- pendiente de diseno y pruebas -- no se toca aqui para no romper el CRM
-- en produccion sin QA.

drop policy if exists "whatsapp_lineas_auth_all" on public.whatsapp_lineas;

create policy "whatsapp_lineas_select_authenticated"
  on public.whatsapp_lineas
  for select
  to authenticated
  using (true);

create policy "whatsapp_lineas_write_admin"
  on public.whatsapp_lineas
  for insert
  to authenticated
  with check (public.app_is_admin());

create policy "whatsapp_lineas_update_admin"
  on public.whatsapp_lineas
  for update
  to authenticated
  using (public.app_is_admin())
  with check (public.app_is_admin());

create policy "whatsapp_lineas_delete_admin"
  on public.whatsapp_lineas
  for delete
  to authenticated
  using (public.app_is_admin());
