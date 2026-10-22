-- 22-oct-2026 · Etiqueta «Transferido» también al pasar un chat a un EMPLEADO de otra sucursal
-- (es la vía para los chats sin número, que no se pueden pasar a otra línea). Ya aplicada en producción.
create or replace function public.whatsapp_transferencia_etiquetar()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_tag text; suc_emp uuid; suc_hilo uuid;
begin
  if new.a_tipo is distinct from 'tecnico' or new.a_id is null then return new; end if;
  select sucursal_id into suc_emp from tecnicos where id = new.a_id;
  select sucursal_id into suc_hilo from whatsapp_hilos where id = new.hilo_id;
  if suc_emp is null or suc_hilo is null or suc_emp = suc_hilo then return new; end if;
  select id::text into v_tag from whatsapp_etiquetas where nombre = 'Transferido' limit 1;
  if v_tag is null then return new; end if;
  update whatsapp_hilos set etiquetas = coalesce(etiquetas, '[]'::jsonb) || to_jsonb(v_tag)
   where id = new.hilo_id and not (coalesce(etiquetas, '[]'::jsonb) ? v_tag);
  return new;
end $$;
create trigger whatsapp_transferencias_etiquetar after insert on public.whatsapp_transferencias
  for each row execute function public.whatsapp_transferencia_etiquetar();
revoke execute on function public.whatsapp_transferencia_etiquetar() from public, anon, authenticated;
