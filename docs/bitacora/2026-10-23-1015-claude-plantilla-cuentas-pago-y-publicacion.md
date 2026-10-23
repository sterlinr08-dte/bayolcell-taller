# Plantilla «bayolcell_cuentas_pago» sometida a Meta, estados verificados y publicación de la Prefactura nueva

**Dueño:** «Pídele a Meta y verifica si ya aprobaron la nueva y publica la nueva ventana.»

## 1) Estado de las plantillas (consultado a Zernio, `GET /v1/whatsapp/templates?accountId&name`, 23-oct 10:25 RD)
| Línea | `bayolcell_prefactura` | `bayolcell_seguimiento_consulta` |
|---|---|---|
| Principal +18098934412 | **APPROVED** | APPROVED |
| Reparación +18097072493 | **APPROVED** | APPROVED |
| Servicio al Cliente +18495644791 | **APPROVED** | APPROVED |
| Al por Mayor +18096793793 | **APPROVED** | APPROVED |
| Reparación +18296709694 (Moca) | **APPROVED** | APPROVED |
| Al por Mayor +18094899145 | PENDING | PENDING |

La prefactura por WhatsApp ya funciona con clientes que no han escrito en 5 de las 6 líneas; en Al por Mayor +18094899145 Meta todavía no responde.

## 2) Plantilla nueva sometida: `bayolcell_cuentas_pago` (UTILITY, es)
- Cuerpo: «Hola {{1}}. Estas son las cuentas de BAYOL CELL para su pago de {{2}}: {{3}}. Cuando transfiera, envíenos el comprobante por este mismo chat. Gracias por preferirnos.» Pie: «BAYOL CELL · Santiago, Moca y Navarrete».
- Variables: 1 nombre (o «cliente»), 2 monto («RD$ 4,600.00» o «su compra»), 3 las cuentas en **una sola línea** separadas por « | » (Meta no admite saltos de línea dentro de una variable).
- Resultado: **6/6 líneas = 200, PENDING**. Meta suele responder en minutos u horas (hasta 24 h).
- Vía: Edge `whatsapp-plantilla-crear` **v7** (código en el repo, ahora con `cual: 'cuentas'` y la acción `estado`), llave de un solo uso en `_plantilla_llaves` (vence 20 min). Después quedó otra vez el tapón 410 (**v8**).
- La llave local se borró. El `DELETE` de su hash en `_plantilla_llaves` se quedó esperando confirmación en el conector (lo retiene); da igual: la función está desactivada y la fila vence sola a las 10:31 RD.

## 3) Botón «Enviar cuentas de pago» (taller-app.js, p27)
- Chat abierto (<24 h): texto libre con las cuentas una debajo de otra.
- Chat cerrado: plantilla `bayolcell_cuentas_pago` con las 3 variables. Si Meta aún no la aprobó: «La plantilla de cuentas todavía no está aprobada por Meta. El cliente debe escribir primero, o espere la aprobación.»

## 4) Publicación
Rama `claude/prefactura-pc` → `main` (GitHub Pages), autorizado por el dueño («publica la nueva ventana»). Incluye: Prefactura PC Opción B (n7/i16), envío automático al guardar, botón de cuentas y campo «Cuentas para pagos» en Configuración.

## Pendiente
- Dueño: escribir las cuentas reales en Configuración → Datos del taller → «Cuentas para pagos».
- Volver a consultar el estado de `bayolcell_cuentas_pago` (y de Al por Mayor +18094899145) en unas horas: desplegar la v7, llave, `{accion:'estado'}`, tapón.
