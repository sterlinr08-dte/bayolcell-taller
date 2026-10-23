-- 23-oct-2026: cuentas bancarias del negocio para enviarlas al cliente por WhatsApp desde la Prefactura.
alter table public.config_taller add column if not exists cuentas_pago text;
comment on column public.config_taller.cuentas_pago is 'Cuentas bancarias del negocio que se envían al cliente por WhatsApp desde la Prefactura (23-oct-2026).';
