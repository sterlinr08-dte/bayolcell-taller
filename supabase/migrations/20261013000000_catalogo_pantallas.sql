-- Catálogo público de PANTALLAS (13 oct 2026).
-- Interruptor propio para publicarlo/ocultarlo en la web (nace oculto).
-- Las pantallas salen solas de infoplus_articulos (descripcion 'PANTALLA%' con precio nivel 1);
-- para esconder una en particular se usa catalogo_items con categoria='pantalla' y visible=false.
alter table public.config_taller
  add column if not exists catalogo_pantallas_publicado boolean not null default false;
