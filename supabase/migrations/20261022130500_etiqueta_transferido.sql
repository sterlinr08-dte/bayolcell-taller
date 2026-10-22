-- 22-oct-2026 · Etiqueta automática «Transferido» (dueño, opción A).
-- Al referir un cliente a otra línea (RPC whatsapp_referir_a_linea → insert en whatsapp_referidos),
-- el chat de destino recibe la etiqueta «Transferido». Sin duplicados. Ya aplicada en producción.
insert into public.whatsapp_etiquetas (nombre, color, orden)
select 'Transferido', '#f59e0b', 8
where not exists (select 1 from public.whatsapp_etiquetas where nombre = 'Transferido');

create or replace function public.whatsapp_referido_etiquetar()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_tag text;
begin
  select id::text into v_tag from whatsapp_etiquetas where nombre = 'Transferido' limit 1;
  if v_tag is null or new.hilo_destino is null then return new; end if;
  update whatsapp_hilos
     set etiquetas = coalesce(etiquetas, '[]'::jsonb) || to_jsonb(v_tag)
   where id = new.hilo_destino
     and not (coalesce(etiquetas, '[]'::jsonb) ? v_tag);
  return new;
end $$;

create trigger whatsapp_referidos_etiquetar after insert on public.whatsapp_referidos
  for each row execute function public.whatsapp_referido_etiquetar();
revoke execute on function public.whatsapp_referido_etiquetar() from public, anon, authenticated;
