# 2026-10-23 08:35 (RD) — Publicada la carga rápida; Facebook: sin parpadeo y sin «BayolCell» repetido

## Autorización
«Publícalo, todavía en el CRM Facebook se repiten y parpadea. Sale el nombre de bayol cell repetido».

## 1. Publicado
- `main` d1293b9: merge de `claude/carga-rapida` (capas CSS tempranas, Diagnóstico bajo demanda, defer, preconnect,
  `taller-app.min.js` automático). Verificado en vivo: `taller.html` carga `taller-app.min.js?v=20261023-p23`
  (460 KB comprimidos, sha1 5fc21da3d5ea, parsea). El robot `minificar.yml` queda activo para el próximo cambio.

## 2. Facebook parpadea — causa y arreglo
- `crm-social-scope-fix.js` → `loadFacebookThreads()` ponía «Comprobando Facebook…» (borrando la lista) en **cada**
  refresco, incluidos los de tiempo real (cualquier cambio en `social_hilos`/`social_mensajes`). La lista desaparecía
  y volvía: ese es el parpadeo. Y como la lista quedaba vacía, el actualizador incremental no podía aplicarse.
- Arreglo: el aviso solo sale si todavía no hay filas; en los refrescos la lista se queda y se actualiza en su sitio.
- Carga vía `crm-marketing-consent.js` (V u2, html u11).

## 3. «BayolCell» repetido
- Quedaban 11 hilos de clientes a los que solo les escribimos nosotros: Zernio no mandó su nombre y el webhook viejo
  puso el de la página («BayolCell») como nombre y usuario. Se dejaron en blanco (sin tocar mensajes) y la lista los
  muestra como «Cliente de Facebook ·1234» (últimos 4 dígitos de su id) para distinguirlos. Cuando escriban, el webhook
  nuevo pone su nombre real.

## Pendiente
- Confirmar con el dueño que el parpadeo de Facebook desapareció tras recargar.
