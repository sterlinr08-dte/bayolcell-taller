-- PROPUESTA, SIN APLICAR (26-oct-2026, rama claude/taller10-a9). Requiere OK del dueño antes de correrla.
-- Reacondicionados → Rentabilidad: traza del precio de venta anotado a mano.
-- Hoy la pantalla guarda solo equipos_refurbish.precio_venta_real y deja una nota en equipo_historial.
-- Esta propuesta agrega de dónde salió el precio, quién lo anotó y cuándo, para distinguir el dato manual del que
-- llegue de Info Plus cuando Dagoberto agregue el IMEI a cada línea de factura. Idempotente. No toca datos existentes.

alter table public.equipos_refurbish
  add column if not exists precio_venta_fuente text,          -- 'manual' | 'infoplus'
  add column if not exists precio_venta_por text,             -- nombre o correo de quien lo anotó
  add column if not exists precio_venta_en timestamptz;       -- cuándo se anotó

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'equipos_refurbish_precio_venta_fuente_chk') then
    alter table public.equipos_refurbish
      add constraint equipos_refurbish_precio_venta_fuente_chk
      check (precio_venta_fuente is null or precio_venta_fuente in ('manual', 'infoplus'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'equipos_refurbish_precio_venta_pos_chk') then
    alter table public.equipos_refurbish
      add constraint equipos_refurbish_precio_venta_pos_chk
      check (precio_venta_real is null or precio_venta_real > 0) not valid;  -- not valid: no revisa filas viejas
  end if;
end $$;

-- Después de aplicarla, la capa taller-reacond-rentabilidad.js enviaría también
-- { precio_venta_fuente: 'manual', precio_venta_por: <usuario>, precio_venta_en: now() } al guardar.
