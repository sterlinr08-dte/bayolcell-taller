-- Vaciar/eliminar chats grandes daba "statement timeout" (chat de 4 192 mensajes, 30-oct-2026):
-- al borrar cada mensaje, Postgres revisaba responde_a_id recorriendo toda la tabla (sin índice).
-- Aplicada en vkhwdvjtowrhkhqavnvk el 30-oct-2026. Con los índices, ese chat se vacía en ~1,7 s.
create index if not exists whatsapp_mensajes_responde_a_id_idx on public.whatsapp_mensajes (responde_a_id) where responde_a_id is not null;
create index if not exists whatsapp_ia_episodios_mensaje_cliente_id_idx on public.whatsapp_ia_episodios (mensaje_cliente_id) where mensaje_cliente_id is not null;
create index if not exists whatsapp_ia_episodios_respuesta_humana_idx on public.whatsapp_ia_episodios (respuesta_humana_mensaje_id) where respuesta_humana_mensaje_id is not null;
create index if not exists leads_hilo_id_idx on public.leads (hilo_id) where hilo_id is not null;
create index if not exists whatsapp_referidos_hilo_origen_idx on public.whatsapp_referidos (hilo_origen) where hilo_origen is not null;
