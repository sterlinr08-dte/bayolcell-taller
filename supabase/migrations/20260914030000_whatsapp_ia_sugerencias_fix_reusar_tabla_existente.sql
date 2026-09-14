-- Correccion: whatsapp_ia_sugerencias YA EXISTIA (20260904020000) con su
-- propio esquema (texto_sugerido/razon/mensaje_cliente_id) y una politica
-- de RLS por sucursal (whatsapp_ia_sugerencias_scoped). La migracion
-- anterior (whatsapp_ia_conocimiento_y_sugerencias) uso "create table if
-- not exists" -- no toco las columnas existentes -- pero SI agrego una
-- politica nueva mas permisiva (admin-o-tecnico-activo, sin importar
-- sucursal) que aflojaba el sucursal-scoping original. Se revierte esa
-- politica y se deja la tabla como estaba, solo sumando lo que hace falta.
drop policy if exists whatsapp_ia_sugerencias_acc on public.whatsapp_ia_sugerencias;

-- Nueva columna (aditiva, no rompe el codigo viejo que no la usa).
alter table public.whatsapp_ia_sugerencias add column if not exists modelo_detectado text;

-- El check original solo permitia pendiente/enviada/descartada. Se agrega
-- 'reemplazada' para poder marcar una sugerencia vieja como superada por
-- una nueva del mismo hilo (evita el bug de tarjetas duplicadas del
-- 2026-09-04) sin perder el registro para el analisis de "aprendizaje", y
-- 'editada' para cuando el empleado usa la sugerencia como borrador y la
-- modifica antes de enviarla.
alter table public.whatsapp_ia_sugerencias drop constraint if exists whatsapp_ia_sugerencias_estado_check;
alter table public.whatsapp_ia_sugerencias add constraint whatsapp_ia_sugerencias_estado_check
  check (estado in ('pendiente','enviada','editada','descartada','reemplazada'));
