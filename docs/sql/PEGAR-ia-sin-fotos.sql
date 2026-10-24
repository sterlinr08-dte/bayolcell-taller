-- PEGAR EN EL SQL EDITOR DE SUPABASE (proyecto Bayol Cell) · 24-oct-2026
-- La IA de WhatsApp deja de pedir foto de la cédula para someter el financiamiento:
-- el empleado manda el formulario, el banco evalúa primero y los documentos se piden después si aprueba.

update public.whatsapp_ia_conocimiento
   set politicas = E'Financiamiento: lo aprueba Banfondesa, no Bayol Cell. Para someterlo, un empleado le envía al cliente por WhatsApp el formulario de solicitud (cédula, nombre, celular, dirección, equipo y plazo); la IA no lo envía. El banco evalúa primero la solicitud y normalmente responde al día siguiente; los documentos (cédula, comprobante) se piden después, solo si el banco lo aprueba.\nNunca prometer aprobación, cuotas ni inicial: eso lo define el banco.\nSi el cliente desiste después de aprobado, solo tiene que avisar.\nNo dar números personales de los empleados.'
 where id = 1;

update public.whatsapp_ia_ejemplos
   set respuesta = 'Con gusto. El crédito lo trabajamos con Banfondesa. Un compañero le envía por aquí el formulario de solicitud para que lo llene; el banco lo evalúa y normalmente responde al día siguiente.'
 where id = 'b8cebfbf-6fd5-4ee5-9809-6e3395ddf080';

update public.whatsapp_ia_ejemplos
   set respuesta = 'Con gusto le ayudamos. Dígame qué equipo le interesa y un compañero le envía por aquí el formulario de solicitud; el banco lo evalúa y normalmente responde al día siguiente.'
 where id = '40404a00-1ad5-467e-b841-52128d1c5b18';

-- Comprobación: debe dar politica_ok = true y ejemplos_con_foto = 0
select (select politicas like '%evalúa primero%' from public.whatsapp_ia_conocimiento where id = 1) as politica_ok,
       (select count(*) from public.whatsapp_ia_ejemplos where respuesta ilike '%foto de su c_dula%') as ejemplos_con_foto;
