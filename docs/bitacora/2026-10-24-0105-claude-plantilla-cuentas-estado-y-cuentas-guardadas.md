# 2026-10-24 01:05 (RD) — Plantilla «bayolcell_cuentas_pago»: estado en Meta; cuentas de pago guardadas; comentario confirmado

## Pedido del dueño
«El comentario en Info Plus ya sí está saliendo. Revisa la plantilla, si Meta ya la aprobó. La cuenta de los pagos, yo te la
envié, tú la puedes incluir automáticamente.»

## 1) Comentario en Info Plus — confirmado
Con `contrato` y `comentario` llenos (p33, 23-oct) el comentario vuelve a salir en la Factura. `REGLAMENTOS.md` §3 corregido:
antes decía que `contrato` iba vacío.

## 2) Cuentas para pagos — guardadas en `config_taller.cuentas_pago`
Las tres cuentas que el dueño mandó el 23-oct (ya estaban en la respuesta rápida `cuentas` del WhatsApp), una por línea:
Banreservas corriente, Banco Popular ahorro y BHD León corriente, cada una con titular y RNC. Se ven y editan en
Configuración → Datos del taller → «Cuentas para pagos». El botón «Enviar cuentas de pago» de la Prefactura ya las usa.
(Solo se escribió porque el campo estaba vacío: `where coalesce(cuentas_pago,'')=''`.)

## 3) Estado de las plantillas en Meta (consultado a Zernio, 24-oct 01:00 RD)
Procedimiento: Edge `whatsapp-plantilla-crear` desplegada con el código del repo (v9), llave de un solo uso en
`_plantilla_llaves` (vence a los 20 min; la copia local se borró), `{accion:'estado'}`, y de nuevo el tapón 410 (**v10**).

| Línea | `bayolcell_cuentas_pago` | `bayolcell_prefactura` |
|---|---|---|
| Principal +18098934412 | **PENDING** | APPROVED |
| Reparación +18097072493 | APPROVED | APPROVED |
| Servicio al Cliente +18495644791 | APPROVED | APPROVED |
| Al por Mayor +18096793793 | APPROVED | APPROVED |
| Reparación +18296709694 (Moca) | APPROVED | APPROVED |
| Al por Mayor +18094899145 | PENDING | PENDING |

Efecto: en 4 de las 6 líneas, «Enviar cuentas de pago» ya manda la plantilla aunque el chat esté cerrado. En la línea
Principal (Navarrete) todavía sale el aviso «Pídale al cliente que nos escriba» cuando el chat lleva más de 24 h cerrado.
La línea 4899145 sigue sin que Meta responda a ninguna plantilla (igual que el 23-oct).

## Pendiente
Volver a consultar en uno o dos días el estado en Principal y en Al por Mayor 4899145 (mismo procedimiento).
