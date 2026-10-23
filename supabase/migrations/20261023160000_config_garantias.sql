-- 23-oct-2026 (dueño): textos de garantía que salen al pie de la prefactura según lo que lleve
-- (celular por IMEI o nombre; pieza o reparación por nombre). Editables en Configuración → Datos del taller.
alter table public.config_taller add column if not exists garantia_celular text;
alter table public.config_taller add column if not exists garantia_pieza text;
comment on column public.config_taller.garantia_celular is 'Texto de garantía impreso en la prefactura cuando lleva un celular (23-oct-2026).';
comment on column public.config_taller.garantia_pieza is 'Texto de garantía impreso en la prefactura cuando lleva piezas o reparaciones (23-oct-2026).';

-- 23-oct-2026 (dueño): más tipos de garantía y WhatsApp por sucursal para el encabezado de la prefactura.
alter table public.config_taller add column if not exists garantia_moto text;
alter table public.config_taller add column if not exists garantia_aire text;
alter table public.config_taller add column if not exists garantia_tv text;
alter table public.sucursales add column if not exists whatsapp text;
comment on column public.sucursales.whatsapp is 'WhatsApp de la sucursal; sale en el encabezado de la prefactura (23-oct-2026).';
