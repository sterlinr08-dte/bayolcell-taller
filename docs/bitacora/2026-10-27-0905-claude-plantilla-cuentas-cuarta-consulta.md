# 2026-10-27 09:05 (RD) — Plantillas de cuentas de pago: consulta del lunes en Meta

## Pedido
Tarea programada del viernes («Espera hasta el lunes y vuelve a revisarla»): revisar `bayolcell_cuentas_pago` en Principal
+18098934412 (Navarrete) y en Al por Mayor +18094899145. Se revisó también la `_v2`.

## Procedimiento
Edge `whatsapp-plantilla-crear` desplegada como **v21 solo consulta** (únicamente `accion: 'estado'`; cualquier otra cosa
responde 410). Llave de un solo uso en `_plantilla_llaves` que vence en 10 min; la copia local se borró. Después se volvió a
poner el **tapón 410 (v22)** y se comprobó que responde 410.

## Estado en Meta (Zernio, 27-oct 09:04 RD)
| Línea | `bayolcell_cuentas_pago` (v1) | `bayolcell_cuentas_pago_v2` |
|---|---|---|
| Principal +18098934412 (Navarrete) | **APPROVED** (antes PENDING) | APPROVED |
| Reparación +18097072493 | APPROVED | APPROVED |
| Servicio al Cliente +18495644791 | APPROVED | APPROVED |
| Al por Mayor +18096793793 | APPROVED | APPROVED |
| Reparación +18296709694 (Moca) | APPROVED | APPROVED |
| Al por Mayor +18094899145 | **APPROVED** (antes PENDING) | **PENDING** |

Nota técnica: Zernio filtra `name` por coincidencia parcial; al pedir la v1 devuelve también la v2. En la línea 4899145 la
consulta de la v1 trae una APPROVED y una PENDING, y la de la v2 trae solo PENDING; por eso la v1 está aprobada.

## Qué significa
«Enviar cuentas de pago» ya funciona en las 6 líneas con el chat cerrado. En 4899145 sale con la v1 (cuentas en una línea)
hasta que Meta apruebe la v2; el taller ya cae solo a la v1 si la v2 falla.

## Siguiente paso
Nada urgente. Si la v2 sigue PENDING en 4899145 en unos días, se puede reenviar con otro nombre en esa línea o revisar
limitaciones en Meta Business Suite.
