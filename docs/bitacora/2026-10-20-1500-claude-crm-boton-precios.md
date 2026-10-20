# 2026-10-20 15:00 — Claude — CRM: botón «Precios» para consultar artículos (rama, sin publicar)

## Dueño
«Un botón en el CRM de consultar los artículos para los clientes que pregunten por el precio de algo, darle la info al instante.»
Decisiones (AskUserQuestion): **solo consulta del empleado** (no escribe ni envía nada al cliente); precio **cliente final
(nivel 1)**; mostrar **dónde hay existencia**.

## Cambio (archivos nuevos, capa aislada)
- `crm-consulta-precio.js` / `.css` (v 20261020-a1/a2), cargados en `taller.html`.
- Botón «Precios» (ícono etiqueta; en celular solo el ícono) en la cabecera de cada chat (`.wa-chat-head`: WhatsApp e Instagram).
- Abre una hoja lateral (en celular a pantalla completa) con buscador: nombre del artículo, código, **precio nivel 1** y fichas de
  los almacenes con existencia (Santiago, Moca, Navarrete, Taller, Garantía China, 2do Nivel) **sin cantidades**; sin existencia →
  «Sin existencia» (va al final). Servicio → «Servicio».
- Datos: el mismo catálogo de Info Plus de la Prefactura (`cache.infoplusArticulos` / `_ensureInfoplusArticulos`).
- No toca Zernio, mensajes, IA ni la base. Apagar en un equipo: `localStorage.bc_crmprecio_off='1'`.

## Pruebas
`crmprecio.mjs` 16/0 con el chat real abierto (390 y 1280): botón en la cabecera, cursor en el buscador, precio nivel 1 y
almacenes sin cantidades, sin existencia al final, no escribe en la respuesta, Escape cierra, sin desbordes ni errores.
