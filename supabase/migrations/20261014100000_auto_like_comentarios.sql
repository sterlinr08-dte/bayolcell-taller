-- 14-oct-2026 — Automatizaciones de comentarios: «me gusta» real de la cuenta del negocio al comentario.
-- Pedido del dueño («por lo menos like»). Es la cuenta de Bayol dándole like al comentario de una persona real;
-- nunca cuentas falsas. Nace apagado en las reglas existentes.
alter table public.social_automatizaciones add column if not exists dar_like boolean not null default false;
alter table public.social_automatizacion_envios add column if not exists like_ok boolean;
comment on column public.social_automatizaciones.dar_like is 'Si es true, el motor le da «me gusta» (cuenta del negocio) al comentario que activó la regla.';
comment on column public.social_automatizacion_envios.like_ok is 'Resultado del «me gusta» al comentario: true/false; null si la regla no lo pide.';
