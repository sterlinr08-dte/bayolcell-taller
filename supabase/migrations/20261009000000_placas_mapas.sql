-- Bitmap de Bayol Cell — Fase 1 (9 oct 2026): mapas de placas propios.
-- Fotos de placas reales (original sin comprimir + vista previa liviana), con puntos marcados encima
-- (pieza, línea o punto de prueba) y sus medidas de referencia en una placa SANA.
-- Acceso: igual que Diagnóstico IA (app_puede_diagnostico(): admin o rol con diagnostico_ver).

create table if not exists public.placas_mapas (
  id uuid primary key default gen_random_uuid(),
  marca text not null default 'Apple',
  modelo text not null,
  cara text not null default 'A' check (cara in ('A','B','completa')),
  titulo text,
  foto_path text,            -- original, tal cual la tomó la cámara (sin recomprimir)
  preview_path text,         -- versión liviana (≈2400 px) para que cargue rápido
  ancho int,                 -- píxeles reales de la original
  alto int,
  peso_bytes bigint,
  notas text,
  creado_por text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index if not exists placas_mapas_modelo_idx on public.placas_mapas (lower(marca), lower(modelo));

create table if not exists public.placas_puntos (
  id uuid primary key default gen_random_uuid(),
  mapa_id uuid not null references public.placas_mapas(id) on delete cascade,
  x double precision not null check (x >= 0 and x <= 1),   -- posición relativa a la foto (0..1)
  y double precision not null check (y >= 0 and y <= 1),
  nombre text not null,                                     -- ej. U2, J4500, PP_VDD_MAIN
  tipo text not null default 'pieza' check (tipo in ('pieza','linea','conector','prueba')),
  funcion text,                                             -- ej. «IC de carga (Tristar)»
  ref_diodo text,                                           -- lectura en modo diodo de una placa sana
  ref_voltaje text,
  ref_resistencia text,
  notas text,
  creado_por text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index if not exists placas_puntos_mapa_idx on public.placas_puntos (mapa_id);

alter table public.placas_mapas enable row level security;
alter table public.placas_puntos enable row level security;

drop policy if exists placas_mapas_acc on public.placas_mapas;
create policy placas_mapas_acc on public.placas_mapas for all to authenticated
  using (public.app_puede_diagnostico()) with check (public.app_puede_diagnostico());
drop policy if exists placas_puntos_acc on public.placas_puntos;
create policy placas_puntos_acc on public.placas_puntos for all to authenticated
  using (public.app_puede_diagnostico()) with check (public.app_puede_diagnostico());

-- Fotos: bucket PRIVADO (enlaces firmados). 50 MB por archivo para no perder la original.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('placas', 'placas', false, 52428800, array['image/jpeg','image/png','image/webp','image/heic','image/heif'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists placas_obj_select on storage.objects;
create policy placas_obj_select on storage.objects for select to authenticated
  using (bucket_id = 'placas' and public.app_puede_diagnostico());
drop policy if exists placas_obj_insert on storage.objects;
create policy placas_obj_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'placas' and public.app_puede_diagnostico());
drop policy if exists placas_obj_update on storage.objects;
create policy placas_obj_update on storage.objects for update to authenticated
  using (bucket_id = 'placas' and public.app_puede_diagnostico());
drop policy if exists placas_obj_delete on storage.objects;
create policy placas_obj_delete on storage.objects for delete to authenticated
  using (bucket_id = 'placas' and public.app_puede_diagnostico());
