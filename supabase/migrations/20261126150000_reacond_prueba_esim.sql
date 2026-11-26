-- 26-nov-2026 · Dueño: «A1, hazlo smart» (reel de GuiReparos). Prueba de eSIM en la revisión del reacondicionado.
-- Se instala el eSIM gratis de BetterRoaming (1GLOBAL/Truphone); si el iPhone llega a la pantalla de activar el plan,
-- el eSIM funciona. Aquí solo se guarda el resultado; el historial del equipo lo escribe la pantalla (equipo_historial).
alter table public.equipos_refurbish
  add column if not exists esim_prueba text,
  add column if not exists esim_prueba_en timestamptz,
  add column if not exists esim_prueba_por text;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'equipos_refurbish_esim_prueba_chk') then
    alter table public.equipos_refurbish add constraint equipos_refurbish_esim_prueba_chk
      check (esim_prueba is null or esim_prueba in ('ok', 'falla', 'bloqueado'));
  end if;
end $$;

comment on column public.equipos_refurbish.esim_prueba is 'Prueba de eSIM: ok (funciona), falla (no funciona) o bloqueado (de compañía). Null = sin probar.';
