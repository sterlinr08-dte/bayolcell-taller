# Publicado: prefactura sin ventana por QZ Tray + Configuración de Impresora abierta a los empleados

**Dueño:** «Vamos a configurar la impresora, ya estoy aquí; y habilitar la opción para que los empleados puedan hacerlo en caso
de que se desconfigure.»

## Publicado en `main`
1. `bc-prefactura-imprimir.js` (i4): con papel **Ticket 80 mm**, QZ Tray conectado e impresora de tickets elegida, la prefactura
   sale directo (76 mm útiles, sin ventana). Si QZ no está o falla, sigue la ventana. (Preparado y probado en la bitácora 12:21.)
2. `taller.html`: pantalla «Configuración de Impresora» sin el aviso de Java; primer paso «Recordar esta decisión → Permitir».
3. `taller-app.js` (p32): `tienePermiso('config_impresora')` devuelve **true para cualquier usuario con sesión**. Es configuración
   de cada computadora (QZ Tray, impresoras, papel); no toca datos ni dinero. La casilla «Configurar impresoras» de Roles queda
   sin efecto para ese permiso (siempre permitido).

## Pasos en la PC (con el dueño)
1. Configuración → Impresora → Descargar QZ Tray e instalar.
2. «Ya lo instalé, reconectar» → Impresora para TICKETS (la térmica) → Papel: Ticket 80 mm.
3. Imprimir una prefactura → en el aviso de QZ: Recordar esta decisión → Permitir.
