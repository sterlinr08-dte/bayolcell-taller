# 1-nov-2026 · Claude · Modo PC rápido (etapas 1 y 2 del lag en PC)

## Pedido del dueño
- «El sistema del taller usando en PC le siento como lag»; «Infoplus fluye muy bien»; eligió «empieza con la 1 y la 2».

## Diagnóstico (medido en el banco, PC 1366×768)
- **Datos:** la base del taller es pequeña. Las 17 tablas de `loadAll()` suman unas 2,300 filas y alrededor de 1.4 MB.
- **Tiempo real:** el canal global ya solo escucha `alarma_videos` y `orden_notas`. `alarma_videos` la filtra `taller-performance-phase1.js` y `orden_notas` no tuvo cambios esta semana. La recarga completa queda en el sondeo de respaldo de cada 5 min.
  → **La etapa 2 («un cambio de otra sucursal recarga todo») NO es la causa del lag; no se tocó.**
- **Causa principal: el desenfoque.** El menú lateral (250×768) y la barra de arriba (1290×60) tienen `backdrop-filter: blur(18px)`, aunque su fondo ya es un degradado opaco: es gasto sin efecto visual. Además:
  - los botones de la barra tienen `blur(12px)`;
  - los brillos de los botones (`.bcbp-brillo`) llevan `filter: blur(10px)`;
  - el velo de todas las ventanas (`.modal-backdrop`) lleva `blur(10px)`.
- **Hallazgo:** el «modo ligero» del 21-oct (`html.bc-ligero`, automático en PCs de ≤4 núcleos o ≤4 GB, o sin aceleración gráfica) **no funcionaba**: capas posteriores con `!important` y más especificidad dejaban el vidrio puesto.
- **Al escribir:** antes, unos 20–28 ms por tecla en el banco; en una PC de tienda (5–8 veces más lenta) eso se nota.
  - El estilo (`RecalcStyle`) pesa unos 170 ms por cada 18 teclas.
  - La capa `bc-form-espaciado.css` (91 `:has()`) aporta alrededor de un 12 % de ese costo. No se tocó.

## Qué se hizo (rama `claude/pc-rapido`, sin publicar)
- **`taller.html`** `<head>`: bloque nuevo `html.bc-pcr`, decidido antes de pintar.
  - Se activa en computadora (`pointer:fine` y ≥1025 px) o cuando `bc-ligero` está activo.
  - Quita **todo** `backdrop-filter` con especificidad de 3 ids (`:is(#bcPcr#bcPcr#bcPcr,*)`), así sí le gana a las capas viejas.
  - Quita el `filter: blur` de `.bcbp-brillo` y oculta las esferas de fondo.
  - El velo de las ventanas pasa a `rgba(241,245,249,.78)` sólido.
  - Apagar en un equipo: `localStorage.bc_pcr_off='1'`; para todos: `BC_PCR=false`.
- **`bc-impresion-facil.js`** (`?v=20261101-bif5`): la búsqueda de QZ en segundo plano (cada 15 s) solo corre con Recepción/Prefactura a la vista.

## Resultado
- Elementos visibles con desenfoque en PC: **5 → 0**.
- Escribir en un campo: **mediana de unos 24 ms → unos 15 ms por tecla** en el banco (2 corridas cada uno).
- En pantalla:
  - el tablero se ve igual (`img/2026-11-01-pc-rapido/ab-tablero.png`: arriba antes, abajo después);
  - las ventanas muestran un velo claro en lugar del fondo borroso (`ab-ventana.png`).
- El celular no cambia, salvo en equipos sin aceleración gráfica (el mismo criterio del modo ligero).

## Pruebas
- `sin-internet.cjs`: TODO OK.
- `impresion-facil.cjs`: Todo bien.
- `prefactura-delivery.cjs`: Todo bien.
- `buscador-motion.cjs`: falla **igual en `main`**. El menú lateral abierto (`bcm-abierta`) tapa una ficha en el banco; es un problema previo de la prueba, no de este cambio.

## Siguiente paso
- Que el dueño lo pruebe en la PC de la tienda. Si sigue lento, medir allí mismo y considerar aligerar `bc-form-espaciado` (`:has`) y dividir el taller.
