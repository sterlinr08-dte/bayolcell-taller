# PC de bajos recursos — sin sombras en modo ligero (1-nov-2026, 17:32 RD)

**Pedido del dueño:** «la lentitud se nota en PC de bajos recursos» → «Continuamos».

**Diagnóstico:** con CPU 6× lenta (CDP), el pintado (RasterTask) de Recepción con prefactura abierta rondaba ~610 ms; las sombras (`box-shadow`, `text-shadow`) de tarjetas, botones y ventanas son una parte grande de ese costo.

**Cambio (`taller.html`, bloque del modo ligero):**
```css
html.bc-ligero body :is(#bcLig#bcLig#bcLig,*) (+ ::before/::after){box-shadow:none!important;text-shadow:none!important}
```
- Solo actúa con `html.bc-ligero` (auto en equipos ≤4 núcleos, ≤4 GB o GPU por software; forzar `?ligero=1`, quitar `?ligero=0`, volver a automático `?ligero=auto`).
- Las tarjetas conservan su borde, así que se siguen distinguiendo (captura comparada con, sin y con borde fino).
- Equipos normales: sin cambios.

**Medición:** RasterTask ~610 → 462–521 ms (≈ −20 %).

**Pruebas:** `sin-internet.cjs` 23 OK; `prefactura-delivery` 78 OK.

**Rama:** `claude/pc-lenta-3`. **No publicado** (espera OK del dueño).

**Siguiente:** que el dueño pruebe `bayolcell.com/taller.html?ligero=1` en la PC lenta; luego, si hace falta, aligerar `bc-form-espaciado` (91 `:has`).
