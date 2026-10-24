-- Dueño (24-oct-2026): «No podemos pedir foto de cédula porque es una solicitud y el banco primero tiene que evaluar».
-- La IA deja de decir que se pide la foto de la cédula para someter el financiamiento. Ya aplicado con execute_sql.

update public.whatsapp_ia_conocimiento
   set politicas = E'Financiamiento: lo aprueba Banfondesa, no Bayol Cell. Para someterlo, un empleado le envía al cliente por WhatsApp el formulario de solicitud (cédula, nombre, celular, dirección, equipo y plazo); la IA no lo envía. El banco evalúa primero la solicitud y normalmente responde al día siguiente; los documentos (cédula, comprobante) se piden después, solo si el banco lo aprueba.\nNunca prometer aprobación, cuotas ni inicial: eso lo define el banco.\nSi el cliente desiste después de aprobado, solo tiene que avisar.\nNo dar números personales de los empleados.'
 where id = 1;

update public.whatsapp_ia_ejemplos
   set respuesta = 'Con gusto. El crédito lo trabajamos con Banfondesa. Un compañero le envía por aquí el formulario de solicitud para que lo llene; el banco lo evalúa y normalmente responde al día siguiente.'
 where respuesta like '%foto de su cédula%';
