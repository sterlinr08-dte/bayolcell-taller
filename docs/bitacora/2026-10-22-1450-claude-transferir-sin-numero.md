# 22-oct-2026 14:50 · Transferir chats sin número (solo nombre de usuario)

## Pedido del dueño
«Hay casos que el chat no tiene número, solo nombre de usuario, y el CRM no permite transferir por tal razón.»

## Diagnóstico
- 2,363 de 11,721 chats no tienen teléfono (`bsid:` o menos de 10 dígitos).
- «A otra sucursal» (`whatsapp_referir_a_linea`) exige teléfono (`sin_telefono`): otra línea no tiene cómo escribirle a quien no tiene número.
- Ya existe «A un empleado» (`whatsapp_transferir_hilo`): el chat se queda en el mismo número y el empleado de otra sucursal lo contesta desde ahí, viendo toda la conversación. Sirve para estos chats.

## Cambio (rama `claude/referido-en-chat`, sin publicar)
- `taller-app.js` (p4): si el chat no tiene número, «Transferir» abre en «A un empleado». La pestaña «A otra sucursal» explica por qué y trae el botón «Elegir un empleado de la otra sucursal» (48 px). Los chats con número siguen igual.
- Base (ya aplicado): disparador `whatsapp_transferencias_etiquetar` → etiqueta «Transferido» cuando el empleado que recibe es de otra sucursal. Archivo `supabase/migrations/20261022144500_transferencia_etiquetar.sql`.
- `taller.html`: `taller-app.js?v=20261022-p4`.

## Pruebas
- Disparador (prueba deshecha): misma sucursal no etiqueta; otra sucursal dos veces → una sola etiqueta.
- Playwright 390 px con la ventana real: sin número abre en «A un empleado»; el botón lleva a esa pestaña; con número abre en «A otra sucursal»; sin errores.
