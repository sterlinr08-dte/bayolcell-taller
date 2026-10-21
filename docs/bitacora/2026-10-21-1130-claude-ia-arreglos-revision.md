# 21-oct-2026 11:30 · Claude · IA de WhatsApp: arreglos de la revisión (whatsapp-ia-responder v32)

Lo autorizó el dueño («si») después de la revisión de la bitácora 2026-10-21-1040.

## Cambios
1. **Saludo**:
   - el modelo ahora recibe lo que escribió el cliente, dentro de `<mensaje_cliente>`, marcado como contenido y no como instrucciones;
   - si el cliente ya dijo la sucursal o la ciudad, no se la vuelve a preguntar;
   - si ya dijo lo que busca («pantalla»), pregunta el dato que falta (el modelo del equipo);
   - escribe con acentos;
   - se agregó `cuerpo` a la consulta de los dos últimos mensajes.
2. **Formulario de financiamiento**: además de la pista en los últimos 3 mensajes, el **último** mensaje del cliente tiene que hablar de financiamiento. Así no sale ante un «Buenos días».
3. **Fuera de horario**: no era un error. Todos esos mensajes eran de **Navarrete**, que abre a las 9:00. No se cambió.
4. **Precio de pantalla**:
   - si ya hay una sugerencia pendiente con el mismo texto, no se crea otra;
   - si el cliente nombró Santiago, Moca o Navarrete, el cierre dice «Le esperamos en la sucursal de X» en vez de preguntar la sucursal.

## Archivos y despliegue
- `supabase/functions/whatsapp-ia-responder/index.ts`.
- Desplegada como **v32** (`verify_jwt` false, igual que antes) con `_shared/precio-pantalla.ts` sin cambios.
- esbuild compila sin errores.

## Pendiente
- Revisar mañana las sugerencias nuevas: saludos que ya traen la sucursal, y que no salga el formulario por un saludo.
