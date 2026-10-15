# 2026-10-15 — Claude — REA: cómo sacarle provecho en Bayol Cell

El dueño pidió investigar REA (github.com/morluto/rea, licencia MIT, v6.5.0) para sacarle provecho.

## Qué es (comprobado)
- Programa gratis que se conecta a Claude (MCP) y mira por dentro, sin el código fuente: páginas web, grabaciones del tráfico de una página (HAR), apps JavaScript/Electron, .NET, APK de Android, teléfonos Android por cable (adb), bases SQLite y programas de computadora (estos últimos con Ghidra/Hopper/IDA).
- Funciona en esta nube con Node 22. Probado `inspect-web-network-capture` con un HAR de prueba: lo lee y cuenta/oculta los datos sensibles.
- Su aviso legal: solo para software propio o con permiso; no sirve para saltarse licencias, protecciones ni contraseñas, ni para copiar código ajeno.

## Usos para Bayol (de más a menos provecho)
1. **Info Plus — lo que la API no da.**
   - El dueño, con su propia sesión en la web de Info Plus, graba un HAR **saneado** (Chrome: F12 → Red → Exportar HAR, sin cookies) mientras hace:
     - ver el precio Crédito/Mínimo de un artículo;
     - ver la existencia en Navarrete (almacén 7) y los artículos sin precio nivel 1;
     - convertir una prefactura en factura;
     - ver la lista de vendedores.
   - REA saca qué consulta usa cada pantalla.
   - Con eso se le pide a Dagoberto que lo habilite en la API oficial. No se usan consultas internas sin su OK.
2. **Diagnóstico de Android por cable** (como el BDE para iPhone): modelo, versión, parche de seguridad, apps y registros de fallas con adb. Prototipo con REA y después va al BDE.
3. **Revisar nuestras propias apps** (el .exe del BDE): confirmar que no lleve claves ni secretos dentro.
4. Solo con permiso escrito del dueño de cada programa: REFOX BITMAP (formato de sus placas) y apps de la competencia (cómo bloquean equipos financiados). Solo para entender, sin copiar.

## Lo que NO se hace
- Funciones ocultas de WhatsApp/Instagram/Zernio (va contra sus reglas).
- Saltarse licencias o candados.
