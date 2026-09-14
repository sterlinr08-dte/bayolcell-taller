-- Pedido 14 sept 2026: cuando un cliente pide la ubicacion, el agente debe
-- poder escribirla (ya usa "direccion") Y la app debe poder mandar un PIN
-- de GPS real (mensaje de ubicacion de WhatsApp, no solo texto). Hacen
-- falta las coordenadas exactas de cada sucursal -- nunca se inventan
-- (dato factual del negocio), las llena un admin desde el CRM.
alter table public.whatsapp_ia_config
  add column if not exists lat double precision,
  add column if not exists lng double precision;
