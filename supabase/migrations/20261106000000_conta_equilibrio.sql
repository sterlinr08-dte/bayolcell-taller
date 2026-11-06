-- Punto de equilibrio por tienda (Contabilidad). Una fila por mes y tienda.
-- codlocalidad: 1 Santiago · 4 Moca · 7 Navarrete · 0 = gastos comunes de la empresa.
create table if not exists public.conta_equilibrio (
  id uuid primary key default gen_random_uuid(),
  mes date not null check (mes = date_trunc('month', mes)::date),
  codlocalidad int not null default 0,
  gastos jsonb not null default '[]'::jsonb check (jsonb_typeof(gastos) = 'array'),
  variables jsonb not null default '{}'::jsonb check (jsonb_typeof(variables) = 'object'),
  dias_habiles int check (dias_habiles between 0 and 31),
  incluye_itbis boolean not null default false,
  reparto text not null default 'venta' check (reparto in ('venta','iguales','manual')),
  reparto_pct jsonb not null default '{}'::jsonb,
  notas text,
  actualizado_por text,
  actualizado_en timestamptz not null default now(),
  unique (mes, codlocalidad)
);
alter table public.conta_equilibrio enable row level security;
drop policy if exists conta_equilibrio_acc on public.conta_equilibrio;
create policy conta_equilibrio_acc on public.conta_equilibrio
  for all to authenticated
  using ((select app_puede_contabilidad()))
  with check ((select app_puede_contabilidad()));
revoke all on public.conta_equilibrio from anon, public;
grant select, insert, update, delete on public.conta_equilibrio to authenticated;
grant all on public.conta_equilibrio to service_role;
create or replace function public.conta_equilibrio_touch() returns trigger
language plpgsql set search_path = public as $$
begin new.actualizado_en := now(); return new; end $$;
drop trigger if exists conta_equilibrio_touch on public.conta_equilibrio;
create trigger conta_equilibrio_touch before update on public.conta_equilibrio
  for each row execute function public.conta_equilibrio_touch();

-- Sin TRUNCATE/REFERENCES/TRIGGER para authenticated (vienen por defecto en Supabase).
revoke truncate, references, trigger on public.conta_equilibrio from authenticated;
-- Límites (revisión del 6-nov): tienda válida y tamaño razonable.
alter table public.conta_equilibrio add constraint conta_equilibrio_codlocalidad_chk check (codlocalidad >= 0 and codlocalidad <= 99);
alter table public.conta_equilibrio add constraint conta_equilibrio_tam_chk check (pg_column_size(gastos) < 20000 and coalesce(length(notas),0) < 2000);
