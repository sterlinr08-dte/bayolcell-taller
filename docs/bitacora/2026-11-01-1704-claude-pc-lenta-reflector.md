# 1-nov-2026 · Claude · PC de bajos recursos: sin reflector en modo ligero

## Pedido del dueño
- «Continuamos», después de «la lentitud se nota en PC de bajos recursos».
- Se iba a dividir el taller. Antes se midió, y salió otra causa más fuerte.

## Medición (banco 1366×768, CPU 6 veces más lenta)
- **Dividir el taller:** casi todo el peso está en `taller-app.js` (2.5 MB fuente, 1.88 MB minificado, 187 secciones). El CRM es solo un 12 % (líneas 30000–34809, unos 280 KB).
  - Al abrir, `taller-app.min.js` se ejecuta en unos 50–230 ms en la PC lenta.
  - Dividirlo ahorraría poco al abrir y nada al trabajar, con mucho riesgo. **Se pospone.**
- **El reflector (`bc-reflector.js`)** fue lo más fuerte encontrado:
  - Hace 3 efectos que siguen al ratón: la luz de la barra, el brillo fijo y la luz de vidrio sobre cada botón.
  - En cada movimiento del ratón mide elementos (`getBoundingClientRect`, `getComputedStyle`, `clip-path`). Además tiene un `MutationObserver` sobre todo el `body` que vigila atributos `class`.
  - Paseando el ratón por el menú, la barra y los botones: **unos 10.2 s de trabajo con reflector frente a unos 4.8 s sin él**. El script pasa de unos 3.0 s a 0.04 s y el estilo de unos 2.1 s a 1.0 s.

## Cambio (rama `claude/pc-lenta-2`, sin publicar)
- `crm-marketing-consent.js` (`?v=20261101-u30`), que es quien carga `bc-reflector.js`: **en modo ligero (`html.bc-ligero`) no lo carga**.
  - En PCs normales todo sigue igual.
- **El modo ligero:**
  - es automático en PCs de ≤4 núcleos o ≤4 GB, o sin aceleración gráfica;
  - se fuerza en un equipo abriendo `taller.html?ligero=1` (se recuerda);
  - se quita con `?ligero=0`, y `?ligero=auto` vuelve al automático.

## Resultado
- Con `ligero=1`: el reflector no carga; trabajo de la PC al mover el ratón **4,707 ms**.
- Con `ligero=0`: el reflector carga; **11,223 ms**.

## Pruebas
- `sin-internet`, `impresion-facil` y `prefactura-delivery`: OK.
