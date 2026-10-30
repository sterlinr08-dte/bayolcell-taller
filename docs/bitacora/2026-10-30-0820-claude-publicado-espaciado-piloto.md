# Publicado: espaciado de formularios, piloto de 5 (Bayol Cell)

## Pedido del dueño
- «Sí, empieza con los 5» y luego **«Publícalo»**.

## Publicación
- PR **#145** (rama `claude/espaciado-piloto`), unido a `main` por squash: `d2a8120`.
- CI: unit, browser (chromium) y browser (webkit) en verde.
- En vivo: bayolcell.com/taller.html carga `bc-form-espaciado.css?v=20261030-e1` (200).

## Qué entró
- Regla de espaciado en Prefactura (documento, Buscar cliente y el plegable Equipo/falla/orden), Nuevo empleado, Nuevo cliente (Financiamientos) y Login.
- Apagar: `localStorage.bc_fesp_off='1'` o `BC_FESP=false`.

## Pendiente
- Los otros 69 formularios de la auditoría; el dueño decide cuándo.
- Confirmar en el iPhone real (íconos Tabler y teclado).
