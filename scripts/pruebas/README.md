# Pruebas automáticas del taller (banco local)

Sin Internet ni Supabase real: `supabase-stub.js` simula la base y `servidor.cjs` sirve el repo en `http://127.0.0.1:8788`.

```bash
node scripts/pruebas/servidor.cjs &            # servidor estático (gzip) del repo
node scripts/pruebas/prefactura-confiable.cjs  # 8 escenarios de la Prefactura (24-oct-2026)
```
Necesita Playwright y Chromium (en el equipo de pruebas está en `/opt/node22/lib/node_modules/playwright`; ajuste la ruta del `require` si hace falta).

## prefactura-confiable.cjs — qué comprueba
| Prueba | Escenario | Resultado esperado |
|---|---|---|
| T1 | Doble clic en Guardar | 1 sola llamada a Info Plus, 1 fila, aviso «Ya se está guardando» |
| T2a | Info Plus crea, el historial falla | sin «✅ creada», estado `error_historial`, Nº recordado en `bc_pf_pendientes`, botones activos |
| T2b | Reintento | misma Nº (actualiza, no crea), historial guardado, pendiente borrado |
| T3 | Cambiar teléfono y agregar artículo mientras Info Plus responde | el historial guarda la foto original; el WhatsApp sale al número original |
| T4 | `imprimirPrefactura('blob')` | no imprime ni abre ventana; `_rpPdfBlob` devuelve un Blob que empieza por `%PDF-` |
| T5 | Cargar otra prefactura sin teléfono | el teléfono y la cédula del cliente anterior se vacían |
| T6 | Reimprimir con otra prefactura cargada | imprime la cargada, no la última creada |
| T7 | Quitar un artículo después del descuento en pesos | aparece «El descuento total … supera el tope» |
| T8 | Guardar recepción con técnico | la orden lleva `tecnico_asignado_id` y la función devuelve la orden |

## flow-financiamiento.cjs (24-oct-2026)
Formulario nativo de WhatsApp para la solicitud de financiamiento (`crm-flow-financiamiento.js`): la capa carga, envuelve el
render de burbujas, la tarjeta de respuesta trae 10 datos con «Copiar» (44 px) y la «Referencia para el banco», el botón
junto a la caja mide 44 px, la ventana de envío tiene campos de 48 px / 16 px y botón de 54 px, y la llamada al servidor va
con equipo, precio, hilo y modo de prueba. Correr con `node scripts/pruebas/servidor.cjs &` y `node scripts/pruebas/flow-financiamiento.cjs`.
