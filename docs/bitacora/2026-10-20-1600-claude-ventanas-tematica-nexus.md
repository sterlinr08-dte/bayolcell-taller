# 2026-10-20 16:00 · Claude · Ventanas de consulta con la temática de NEXUS

## Pedido del dueño
«Hazlo con la misma temática de NEXUS, con las animaciones, fluidez y rapidez». Aplica a las dos ventanas emergentes:
la consulta «Precios» del CRM y el buscador de artículos de la Prefactura.

## Qué se hizo (solo diseño; no cambia datos, Info Plus ni la base)
Valores copiados de NEXUS PRO (`parches-motion-fase2.css` e `index.html` de `nexus-pro`):
- fondo oscurecido con desenfoque: `rgba(15,23,42,.35)` + `blur(6px)`, aparece en 160 ms;
- ventana de vidrio claro (blanco .94 + `blur(24px)`), radio 20 y sombra suave por capas;
- entrada con resorte `nxPopIn` (.26 s, `cubic-bezier(.34,1.56,.64,1)`); en el celular sube desde abajo;
- barra de título clara: ícono azul, título de 17 px y ✕ redonda gris de 36 px que se encoge al presionarla;
- buscador con anillo azul al enfocarlo;
- filas que entran en cascada (8 px, 18 ms entre filas, máximo 90 ms) solo al escribir; con las flechas o al tocar una fila no se repite (clase `quieto`);
- detalle que baja suave en 200 ms; resaltado azul al pasar el ratón;
- CRM: la salida se anima en 140 ms;
- con «reducir movimiento» del sistema todo es instantáneo.

## Archivos
- `crm-consulta-precio.css` (bloque d) y `crm-consulta-precio.js` (`cerrar()` con salida y clase `quieto`): versión `20261020-d1`.
- `taller-prefactura.css` (bloque k) y `taller-prefactura.js` (clase `quieto` en el buscador): versión `20261020-k1`.
- `taller.html`: versiones subidas.

## Pruebas (banco local)
`crmprecio` 21/21 · `pfvent` 8/8 · `pftest` 49/49 · `pfopc` 52/52 · `almfijo` 24/24. Capturas a 1280 y 390 px revisadas.

## Estado
Rama `claude/prefactura-limpia`, **sin publicar**. En la misma rama, también pendientes de publicar:
- almacén fijo;
- vendedor al pie;
- la ⓘ en lugar del aviso;
- «Precios» en el CRM;
- buscador emergente.

Siguiente paso: que el dueño lo vea y diga «publícalo».
