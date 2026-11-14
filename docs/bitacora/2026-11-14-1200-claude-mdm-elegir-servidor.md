# 14-nov-2026 · Claude · Financiamiento: elegir el MDM al asignar un equipo (rama, sin publicar)

## Pedido del dueño
Financiar con una financiera que tiene su propio MDM, usando el Apple Business Manager de Bayol Cell (opción: varios servidores MDM en el mismo ABM). «Sí, cambia el botón del taller a la financiera, pero ese botón es para elegir el MDM de la financiera?»

## Hecho (`taller-app.js`)
- En Nueva solicitud → «Verificar en Hexnode», cuando el equipo está en ABM pero no inscrito, el botón fijo «Asignar a Hexnode ahora» pasó a **«Asignar a un MDM…»** (`_abmElegirServidor`): pide a `abm-accion` la lista de servidores MDM del ABM y muestra un botón por servidor (oculta «Devices Added by Apple Configurator 2»). El último elegido sale primero y marcado (`localStorage bc_mdm_servidor`).
- `_abmAsignarDesdeSolicitud(btn, serial, servidor)`: pide confirmación y asigna al servidor elegido (antes siempre HEXNODE). Mensaje distinto si no es Hexnode (borrar y configurar con WiFi).
- Botones de 44 px. Sin cambios en la función del servidor (`abm-accion` ya aceptaba `servidor`).

## Prueba
Copia local con `functions.invoke` simulado: lista HEXNODE y «FINANCIERA X MDM» (sin el servidor provisional de Apple), asigna al elegido, guarda el último usado, 0 errores.

## Pendiente
- Que el dueño agregue el servidor MDM de la financiera en ABM (llave .pem de la financiera → token).
- Opcional: asignación predeterminada de Apple Configurator al servidor de la financiera.
