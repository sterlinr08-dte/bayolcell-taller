-- 23-oct-2026 · Reparación de datos del CRM (correr SOLO con el OK del dueño, en el SQL Editor, dentro de una transacción).
-- 1) Facebook: 38 clientes tienen dos hilos (Zernio mandó dos ids de conversación distintos). Se conserva el hilo más
--    antiguo de cada participante, se le pasan los mensajes del repetido y se borra el repetido.
begin;
with pares as (
  select cuenta_id, participant_id, (array_agg(id order by creado_en))[1] principal, (array_agg(id order by creado_en))[2:] repetidos
  from social_hilos where participant_id is not null group by cuenta_id, participant_id having count(*) > 1
), mov as (
  update social_mensajes m set hilo_id = p.principal from pares p where m.hilo_id = any(p.repetidos) returning m.id
), nom as (
  -- nombre: el que no sea el de la página ni «Facebook User»
  update social_hilos h set participant_name = x.nombre from (
    select p.principal, (array_agg(s.participant_name order by s.ultimo_mensaje_at desc nulls last))[1] nombre
    from pares p join social_hilos s on s.cuenta_id = p.cuenta_id and s.participant_id = p.participant_id
    where s.participant_name is not null and s.participant_name not in ('BayolCell','Facebook User') group by p.principal
  ) x where h.id = x.principal returning h.id
), act as (
  update social_hilos h set
    ultimo_mensaje_at = greatest(h.ultimo_mensaje_at, x.ult), ultimo_inbound_at = greatest(h.ultimo_inbound_at, x.inb),
    no_leidos_count = greatest(h.no_leidos_count, x.nl), estado = case when 'abierto' = any(x.estados) then 'abierto' else h.estado end
  from (select p.principal, max(s.ultimo_mensaje_at) ult, max(s.ultimo_inbound_at) inb, max(s.no_leidos_count) nl, array_agg(s.estado) estados
        from pares p join social_hilos s on s.id = any(p.repetidos) group by p.principal) x
  where h.id = x.principal returning h.id
)
delete from social_hilos where id in (select unnest(repetidos) from pares);
-- comprobar: debe dar 0
select count(*) as pares_restantes from (select cuenta_id, participant_id from social_hilos where participant_id is not null group by 1,2 having count(*) > 1) d;
commit;

-- 2) Instagram: 165 chats ya respondidos siguen con contador. Se pone en 0 donde nuestro último mensaje es posterior
--    al último del cliente.
begin;
update instagram_hilos h set no_leidos_count = 0
where estado = 'abierto' and no_leidos_count > 0
  and exists (select 1 from instagram_mensajes m where m.hilo_id = h.id and m.direccion = 'out' and m.creado_en > coalesce(h.ultimo_inbound_at, 'epoch'));
select count(*) filter (where no_leidos_count > 0) chats_con_badge, sum(no_leidos_count) total from instagram_hilos where estado = 'abierto';
commit;
