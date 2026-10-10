-- Buscador de cortos (10 oct 2026): líneas (redes) por componente marcado y registro de culpables.
-- APLICADA en producción el 10 oct 2026.
alter table public.placas_puntos add column if not exists redes text[] not null default '{}';
create index if not exists placas_puntos_mapa_idx on public.placas_puntos(mapa_id);
create index if not exists placas_puntos_redes_idx on public.placas_puntos using gin(redes);

create table if not exists public.placas_cortos(
  id uuid primary key default gen_random_uuid(),
  marca text not null default 'Apple',
  modelo text not null check (char_length(modelo) between 1 and 80),
  red text not null check (char_length(red) between 1 and 80),
  componente text not null check (char_length(componente) between 1 and 60),
  punto_id uuid references public.placas_puntos(id) on delete set null,
  notas text check (notas is null or char_length(notas) <= 500),
  creado_por text not null default (auth.uid())::text,
  creado_en timestamptz not null default now()
);
create index if not exists placas_cortos_modelo_red_idx on public.placas_cortos(modelo, red);
alter table public.placas_cortos enable row level security;
create policy placas_cortos_leer on public.placas_cortos for select to authenticated
  using (public.app_puede_diagnostico());
create policy placas_cortos_crear on public.placas_cortos for insert to authenticated
  with check (public.app_puede_diagnostico() and creado_por = (select auth.uid())::text);
create policy placas_cortos_borrar on public.placas_cortos for delete to authenticated
  using (public.app_puede_diagnostico() and (creado_por = (select auth.uid())::text or public.app_is_admin()));
revoke all on public.placas_cortos from anon;
grant select, insert, delete on public.placas_cortos to authenticated;
