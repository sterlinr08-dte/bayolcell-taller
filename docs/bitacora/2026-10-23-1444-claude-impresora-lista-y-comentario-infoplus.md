# Impresora lista en la PC del dueño · el comentario y el ticket de Info Plus

**Dueño:** segunda prueba (Nº 118977) correcta: franja legible, filas alineadas, «Sucursal Navarrete», cliente «CONTADO ALEJANDRO
NAVARRETE» (lo deja así) y la nota «PRUEBA NAVARRETE». «Publícalo» → ya estaba todo en `main`. «El comentario no está saliendo».

## Hallazgo sobre el comentario
- El sistema **sí** manda el comentario a Info Plus en el campo `comentario` como «bayolcell.com: <texto>» (`_rpArmarModelo`), y el
  dueño lo comprobó en pantalla el 22-oct (prefactura 118932). En la base: 118975 → «PRUEBA 3», 118977 → «PRUEBA NAVARRETE».
- Lo que **no lo imprime** es el **formato de ticket propio de Info Plus** (el de letra de máquina, con «Autorizado por / Realizado
  por»): ese formato lo controla Info Plus, no nuestro sistema. Nuestro ticket por QZ Tray sí lo imprime («Nota: …»).
- Para que salga también en el ticket de Info Plus hay que pedirle a Info Plus (Dagoberto) que agregue el campo Comentario a su
  formato de prefactura. No hay cambio posible desde aquí.

## Estado final de la impresora
QZ Tray 2.3 instalado, conectado, impresora de tickets elegida, papel «Ticket 80 mm», permiso «Recordar esta decisión» dado.
La prefactura sale directo al rollo sin ventana. Configuración → Impresora abierta a los empleados por si se desconfigura.
