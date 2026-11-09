# Captura guiada de equilibrio

Pruebas locales con datos ficticios. No se usan claves ni se abren URLs de producción.

Dependencias: Node, Python Playwright con Chromium y `@electric-sql/pglite@0.3.14` en una carpeta temporal. `PGLITE_MODULE` apunta al `dist/index.js` del paquete.

```sh
node tests/conta-captura/calculo.mjs
PGLITE_MODULE=/ruta/pglite/dist/index.js node tests/conta-captura/database.mjs
PE_QA_PORT=8960 PGLITE_MODULE=/ruta/pglite/dist/index.js node tests/conta-captura/server.mjs
# En otra terminal:
QA_BASE=http://127.0.0.1:8960 QA_OUT=/tmp/captura python tests/conta-captura/browser.py
```

`calculo.mjs` compara la función financiera contra la versión previa (`99c053ced137a3b80d0704de385a9e050334c86e`, base de esta entrega). `database.mjs` aplica las dos migraciones de equilibrio en PostgreSQL efímero con roles y políticas. `server.mjs` ofrece un arnés que carga los archivos reales del módulo, los estilos en línea y hojas locales de taller.html; simula autenticación/ventas y usa la RPC SQL real para guardar. La subida HTTP real de Supabase y Safari de iPhone requieren verificación posterior en staging/producción autorizada.

## Publicación

1. Aplicar `20261109133442_equilibrio_captura_guiada.sql` al proyecto BayolCell-taller antes de publicar la interfaz. No crea ni copia gastos de ningún mes.
2. Verificar que `conta-comprobantes` sea privado y que solo personal con permiso de Contabilidad pueda leer/subir.
3. Publicar la rama solo con autorización del dueño; el despliegue sigue siendo GitHub Pages.
4. Prueba autorizada con una cuenta de personal que ya tenga permiso de Contabilidad: guardar un monto de prueba en un periodo de prueba, adjuntar soporte ficticio, recargar, abrir el soporte y probar dos sesiones. No usar gastos reales como datos de prueba.

Reversión visual: `localStorage.bc_captura_off='1'` y recargar. La interfaz anterior conserva las propiedades de captura en JSON, aunque sus cambios de monto no invalidan estados (no usar ambas interfaces simultáneamente para revisión). La migración no elimina datos ni documentos; no hace falta deshacerla para apagar la captura.

## Límites

- No concede acceso nuevo a empleados: se conserva el permiso de Contabilidad existente.
- «Confirmado» es la declaración de quien registra el gasto, no una aprobación de la contadora.
- «Listo para revisión contable» no cierra ni bloquea el mes. El resultado sigue siendo una estimación con Info Plus hasta conciliar impuestos, préstamos y costos.
- Hasta tres fotos/PDF de 8 MB por concepto. Los archivos cargados se conservan en el bucket privado; si se abandona la página antes de guardar o se elimina el concepto, pueden quedar archivos sin referencia. No se borran automáticamente soportes financieros.
- Se conserva la fuente de verdad `conta_equilibrio.gastos`, sin copiar gastos a otra contabilidad.
