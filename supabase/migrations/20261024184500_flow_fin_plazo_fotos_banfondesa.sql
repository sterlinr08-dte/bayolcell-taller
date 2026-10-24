-- Formulario de financiamiento por WhatsApp — decisiones del dueño (24-oct-2026):
-- 1) marca de cuándo se pidieron por el chat la cédula y el comprobante de domicilio (idempotencia);
-- 2) la IA deja de decir «Banco Ademi» y pasa a «Banfondesa» (la información sirve para ambos bancos).
-- Ya aplicado en producción con execute_sql el 24-oct-2026; este archivo deja el historial.

alter table public.fin_solicitudes_whatsapp
  add column if not exists fotos_pedidas_en timestamptz;

comment on column public.fin_solicitudes_whatsapp.fotos_pedidas_en is
  'Cuándo se le pidió al cliente, por el chat, la foto de la cédula y el comprobante de domicilio (null = aún no).';

update public.whatsapp_ia_conocimiento
   set servicios = replace(coalesce(servicios, ''), 'Banco Ademi', 'Banfondesa'),
       politicas = replace(coalesce(politicas, ''), 'Banco Ademi', 'Banfondesa')
 where id = 1
   and (coalesce(servicios, '') like '%Banco Ademi%' or coalesce(politicas, '') like '%Banco Ademi%');

update public.whatsapp_ia_ejemplos
   set respuesta = replace(respuesta, 'Banco Ademi', 'Banfondesa')
 where respuesta like '%Banco Ademi%';
