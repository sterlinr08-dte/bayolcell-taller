-- Base de conocimiento del negocio para el agente de IA de WhatsApp (GLOBAL,
-- no por sucursal -- horario/direccion ya viven en whatsapp_ia_config por
-- sucursal). Fila unica (id=1), editable por un admin desde el CRM.
create table if not exists public.whatsapp_ia_conocimiento (
  id int primary key default 1,
  servicios text,
  precios_politica text,
  politicas text,
  faqs text,
  personalidad text,
  actualizado_en timestamptz default now(),
  actualizado_por text,
  constraint whatsapp_ia_conocimiento_singleton check (id = 1)
);
insert into public.whatsapp_ia_conocimiento (id) values (1) on conflict (id) do nothing;
alter table public.whatsapp_ia_conocimiento enable row level security;
-- Mismo patron que whatsapp_ia_config: lectura abierta a autenticados
-- (el frontend necesita mostrarla), escritura solo-admin (moldea lo que la
-- IA le dice a clientes reales).
create policy whatsapp_ia_conocimiento_select on public.whatsapp_ia_conocimiento for select to authenticated using (true);
create policy whatsapp_ia_conocimiento_write_admin on public.whatsapp_ia_conocimiento for all to authenticated
  using (app_is_admin()) with check (app_is_admin());

-- NOTA: whatsapp_ia_sugerencias YA EXISTIA desde 20260904020000_whatsapp_ia_agente_schema.sql
-- (con su propio esquema texto_sugerido/razon/mensaje_cliente_id y RLS por
-- sucursal). Se reutiliza esa tabla -- ver el fix en
-- 20260914030000_whatsapp_ia_sugerencias_fix_reusar_tabla_existente.sql,
-- que agrega solo lo que faltaba (columna modelo_detectado y el estado
-- 'reemplazada') sin tocar el esquema ni el RLS original.
