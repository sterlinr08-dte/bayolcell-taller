-- 3 oct 2026 — Sincronizar nombres de contactos con los CLIENTES DEL TALLER.
-- Pedido del dueño: "sincronizar los nombres de los contactos" (decidido: solo clientes del taller).
-- Liga cada chat de WhatsApp SIN cliente con el cliente del taller que tenga el mismo número
-- (se comparan los últimos 10 dígitos). Nunca pisa un chat que ya está ligado.
-- El CRM muestra el nombre del cliente ligado en vez del nombre de WhatsApp (crm-wa-identico.js).

create or replace function public.whatsapp_ligar_cliente_por_telefono(p_cliente uuid default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare n integer;
begin
  with c as (
    select distinct on (t10) id, t10 from (
      select id, right(regexp_replace(coalesce(whatsapp_e164, whatsapp, ''), '\D', '', 'g'), 10) t10, creado_en
      from clientes
      where (p_cliente is null or id = p_cliente)
    ) x
    where length(t10) = 10
    order by t10, creado_en desc nulls last
  )
  update whatsapp_hilos h set cliente_id = c.id
  from c
  where h.cliente_id is null
    and h.telefono_e164 !~ '^(bsid|duplicado)'
    and right(regexp_replace(h.telefono_e164, '\D', '', 'g'), 10) = c.t10;
  get diagnostics n = row_count;
  return n;
end $$;

revoke all on function public.whatsapp_ligar_cliente_por_telefono(uuid) from public, anon;
grant execute on function public.whatsapp_ligar_cliente_por_telefono(uuid) to authenticated;

create or replace function public.trg_clientes_ligar_whatsapp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.whatsapp_ligar_cliente_por_telefono(new.id);
  return new;
end $$;

create or replace trigger clientes_ligar_whatsapp
after insert or update of whatsapp, whatsapp_e164 on public.clientes
for each row execute function public.trg_clientes_ligar_whatsapp();
