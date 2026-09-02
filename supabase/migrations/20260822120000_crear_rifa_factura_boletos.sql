-- Rifa por Factura (InfoPlus): registro manual e INDEPENDIENTE de la Rifa
-- de Nexus Pro (rifas / recepcion-boleto / puente-rifa). No tiene relación
-- con esas tablas ni con esa integración externa.
--
-- Cada fila = un boleto físico impreso en 2 copias (cliente + tómbola),
-- a partir de los últimos 6 dígitos de una factura de Info Plus.
-- La unicidad de factura_digitos evita registrar la misma factura 2 veces.

create table if not exists public.rifa_factura_boletos (
  id               uuid primary key default gen_random_uuid(),
  nombre_cliente   text not null check (char_length(trim(nombre_cliente)) > 0),
  whatsapp         text not null check (char_length(trim(whatsapp)) > 0),
  factura_digitos  text not null check (factura_digitos ~ '^[0-9]{6}$'),
  creado_por       uuid,
  creado_en        timestamptz not null default now(),
  constraint rifa_factura_boletos_factura_digitos_key unique (factura_digitos)
);

create index if not exists idx_rifa_factura_boletos_creado_en
  on public.rifa_factura_boletos (creado_en desc);

alter table public.rifa_factura_boletos enable row level security;

drop policy if exists rifa_factura_boletos_auth_all on public.rifa_factura_boletos;
create policy rifa_factura_boletos_auth_all
  on public.rifa_factura_boletos
  for all
  to authenticated
  using (true)
  with check (true);
