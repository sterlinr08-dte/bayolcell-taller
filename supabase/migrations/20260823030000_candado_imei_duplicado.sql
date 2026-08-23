-- La revision de IMEI duplicado antes de registrar un equipo reacondicionado
-- se hacia solo contra lo que el navegador tenia cargado en memoria (cache),
-- no contra la base de datos real -- por eso ya existen 2 IMEI duplicados
-- reales en el sistema (confirmado, ninguno vendido). Esto agrega el candado
-- real contra CUALQUIER IMEI nuevo, dejando aparte por ahora los 2 pares ya
-- duplicados (el dueno los va a revisar el mismo).
--
-- Cuando esos 2 casos ya esten resueltos (uno de cada par borrado o
-- corregido), reemplazar este indice parcial por uno sin el "where":
--   drop index if exists equipos_refurbish_imei_unico;
--   create unique index equipos_refurbish_imei_unico on public.equipos_refurbish(imei) where imei is not null and imei <> '';

create unique index if not exists equipos_refurbish_imei_unico
  on public.equipos_refurbish (imei)
  where imei is not null and imei <> ''
    and imei not in ('356295375890361','356485670514606');
