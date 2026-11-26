# 2026-11-26 08:30 RD · Claude — Prueba de eSIM en el reacondicionado (sin publicar)

## Pedido del dueño
- Mandó el reel de GuiReparos (instagram.com/reel/Df2Rj5pBO9J): un taller de Palmas, Brasil, prueba el eSIM de los iPhone con un QR en su página.
- Eligió **A · Prueba de eSIM en el taller**, «pero averigua». Después: **«A1, hazlo smart»**.

## Lo que se averiguó (fuentes)
- guireparos.com/ferramentas/teste-esim:
  - botón `esimsetup.apple.com/esim_qrcode_provisioning?carddata=LPA:1$rsp.truphone.com$QRF-BETTERROAMING-…`;
  - funciona desde iOS 17.4 y pide el equipo liberado.
- El eSIM es de **BetterRoaming**, del grupo 1GLOBAL (antes Truphone).
  - Su página dice «install your free eSIM».
  - Solo se paga si se compra un plan de datos.
- Se leyó el QR **oficial** de betterroaming.com/esim-installation: `LPA:1$rsp.truphone.com$QRF-BETTERROAMING-PMRDGIR2EARDCMRCPU`. Es el que se usa aquí.
  - El de GuiReparos solo cambia en las últimas letras.
- **No verificado:**
  - que BetterRoaming permita expresamente este uso;
  - qué pasa en RD con la señal. La prueba es que instale, no que haya señal.
  - Requisitos: equipo liberado e iOS 17.4 o más nuevo para el botón directo. El QR sirve también en versiones anteriores, pero eso no se verificó.

## Qué hace
- **Ventana de Evaluación:** debajo de los datos del equipo sale la fila «eSIM».
  - Estados: «eSIM sin probar», «eSIM funciona», «eSIM no funciona», «Bloqueado de compañía» o «No lleva eSIM».
  - Botón «Probar eSIM» o «Repetir».
- **Ventana «Prueba de eSIM»:**
  - QR generado en pantalla (qrcodejs, ya cargado en taller.html) y 4 pasos cortos;
  - enlace «Instalar en este iPhone»;
  - SM-DP+ y código copiables;
  - ⓘ `AYUDAS.esim`.
  - Botones:
    - **«Funciona · ya lo borré»** (54 px), que recuerda borrar el eSIM de prueba;
    - **No funciona**, que antes pregunta «¿Está liberado?»;
    - **Bloqueado**.
- **Lo que hace sola:**
  - «No lleva eSIM» en iPhone X, 8 y anteriores, y SE 1. Reconoce los nombres reales del taller: «IPHONE 8G PLUS» son 61 equipos, «16e», «XS MAX».
  - Al **pasar a Listo para venta** un iPhone que sí lleva eSIM y no tiene la prueba, abre la ventana con el título «Antes de Listo: pruebe el eSIM». Vale para `aprobarTerminado`, `marcarEquipoListo` y `marcarListoVentaDirecto`.
    - «Funciona» o «Bloqueado» siguen a Listo.
    - «No funciona» no sigue.
    - «Seguir sin probar» sigue igual. Es un aviso, no un bloqueo.
  - En Samsung y otros la prueba es opcional, con los pasos de Android.
- **Se guarda** en `equipos_refurbish.esim_prueba` (`ok` | `falla` | `bloqueado`), `esim_prueba_en` y `esim_prueba_por`, más una fila en el historial del equipo («Prueba de eSIM: …»).

## Archivos
- `supabase/migrations/20261126150000_reacond_prueba_esim.sql`: 3 columnas y su check. **Sin aplicar.**
- `taller-esim.js`: nuevo, `?v=20261126-esim1`. Se apaga con `localStorage bc_esim_off=1`.
- `taller.html`: carga del script.

## Pruebas
Página de prueba con los estilos reales del taller. Playwright a 390 y 1280 px:
- sin errores ni scroll horizontal;
- todo lo tocable mide ≥ 44 px y «Funciona» mide 54 px;
- iPhone 12: fila «sin probar» → al aprobar calidad se abre la ventana → «Funciona» → 1 actualización (con doble clic), 1 fila de historial y después sigue a Listo;
- la segunda vez pasa directo;
- iPhone 8G Plus: «No lleva eSIM», sin botón;
- Samsung: pasa directo;
- XR con «No funciona»: pregunta si está liberado, guarda `falla`, no pasa a Listo y no deja la promesa colgada;
- el QR de la pantalla, leído con OpenCV, da exactamente el código oficial.
- **No probado:** instalar el eSIM en un iPhone real. Eso lo hace el técnico.

## Siguiente paso
El dueño lo ve y dice «Publícalo» o «Todavía no». Al publicar: aplicar la migración y unir el PR.
