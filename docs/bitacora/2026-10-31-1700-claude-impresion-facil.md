# 2026-10-31 17:00 — Claude — Impresión fácil: instalador de un clic, conexión sola y alternativa sin QZ (opción A)

## Dueño
Captura de la ventana «Impresora de esta computadora»: «Vamos a mejorar ese proceso… ayúdame a automatizarlo, hay empleados que
no saben mucho; en caso de que no esté, encuentra alternativa.» Eligió **A** (las 3 piezas).

## Fuente
Documentación oficial de QZ (qz.io/wiki/deployment): instalador de Windows con `/S` (sin preguntas), arranque con
`...\CurrentVersion\Run`, y `override.crt` en `C:\Program Files\QZ Tray\` para que confíe en nuestro certificado (sin «¿Permitir?»).
Última versión estable: **2.3.0** (11-sep-2026). La firma de impresión ya existía (`QZ_CERTIFICADO` + firma en Edge).

## Piezas
1. **Instalador** `instalar/bayol-impresion.bat` (+ `bayol-impresion.ps1`, `bayol-cell.crt`), servido desde bayolcell.com:
   - pide permiso de administrador solo una vez (el «Sí» de Windows; no se puede saltar);
   - baja la última versión de QZ Tray desde GitHub de QZ e instala con `/S` (si falla, abre qz.io/download);
   - copia nuestro certificado como `override.crt`;
   - deja QZ Tray abriendo con Windows (HKLM Run) y lo reinicia sin permisos de admin;
   - pone como predeterminada la impresora de tickets si encuentra **una sola** (mismo criterio que la web: pos/80mm/ticket…, sin
     etiquetas ni PDF); si no, lista las que hay y avisa;
   - crea en el escritorio común **«Bayol Cell Caja»**: Chrome con `--kiosk-printing` y perfil aparte `C:\BayolCaja\chrome`
     (para que funcione aunque Chrome normal esté abierto). Con él, si QZ no está, la impresión del navegador sale directo a la
     impresora predeterminada, sin ventana. Primera vez: iniciar sesión en ese perfil.
   - Todo el texto del .ps1 es ASCII (se descarga como texto; los acentos se verían mal en la consola).
2. **Ventana que se arregla sola** `bc-impresion-facil.js/.css` (`?v=20261031-bif2`, `html.bc-bif`, apagar `bc_bif_off='1'`):
   pasos ① Instalar · ② Conectar · ③ Impresora con estado; prueba QZ cada 3 s mientras se ve la tarjeta y al volver a la pestaña
   (sin el botón «Ya lo instalé, reconectar»); un solo botón grande **Instalar impresión** (54 px); certificado plegado en
   «¿Sigue pidiendo permiso?»; «Listo. Tickets: …» al conectar; textos cortos (Etiquetas, Tickets, Probar etiqueta; sin MAYÚSCULAS);
   aviso «Sin conectar» en vez de «No instalado» (puede estar instalado pero cerrado). No toca la firma ni taller-app.js.
3. **Alternativa sin QZ:** el sistema ya imprimía con el navegador cuando QZ no está; el acceso «Bayol Cell Caja» hace que esa
   impresión salga sola.

## Pruebas
- `scripts/pruebas/impresion-facil.cjs` (QZ simulado, apagado → encendido): 20/20 a 390 y 1280 — paso 1 actual y «Buscando…»
  con QZ apagado; al «abrir» QZ se conecta solo en ≤ 4 s, elige POS-80C para tickets y 4BARCODE para etiquetas, 3 pasos hechos;
  certificado plegado; instalador y certificado servidos; sin desborde ni errores.
- Capturas revisadas a ojo (con la fuente Tabler real) a 390 y 1280, apagado y conectado.
- Regresión: `prefactura-confiable`, `prefactura-delivery`: bien.
- **No probado todavía en Windows real**: en esta sesión no hay Windows ni PowerShell (se negó bajar PowerShell para revisar la
  sintaxis). Antes de dárselo a empleados, correrlo una vez en una computadora del taller y anotar el resultado.

## Riesgos / avisos
- Chrome marca los `.bat` descargados como «puede ser peligroso»: hay que tocar **Conservar**. Lo dice la ayuda «¿Cómo se instala?».
- `--kiosk-printing` imprime en la impresora **predeterminada** de Windows; si hay dos de tickets, hay que elegirla a mano una vez.
- El acceso «Bayol Cell Caja» usa un perfil de Chrome aparte: la primera vez hay que iniciar sesión en el sistema.

## Estado
Rama `claude/impresion-facil`, sin publicar. Siguiente paso: probar el instalador en una PC del taller y, con «Publícalo», mezclar.
