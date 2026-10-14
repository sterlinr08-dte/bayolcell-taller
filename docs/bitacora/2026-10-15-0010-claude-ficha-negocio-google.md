# 2026-10-15 00:10 — Claude — Ficha de negocio para Google (datos estructurados) en bayolcell.com

## Solicitud del dueño
«Haz también la ficha de negocio para Google» (opción 4 de la propuesta de vista previa, bitácoras 2026-10-14-2350 y -2400).

## Diagnóstico
`index.html` ya tenía JSON-LD con 3 `MobilePhoneStore` (Santiago, Moca, Navarrete) con dirección, teléfono, horario e Instagram. Los horarios coinciden con los que se ven en la página. Faltaba: la empresa como un todo, el sitio web, el enlace al mapa, imagen grande, servicios y la provincia de Santiago.

## Cambios (solo `index.html`, bloque `<script type="application/ld+json">`; nada visible)
- Nuevo nodo `Organization` `#org` (Bayol Cell, nombres alternos, logo 700×700, imagen de portada, descripción, Instagram) con las 3 sucursales como `subOrganization`.
- Nuevo nodo `WebSite` `#web` (es-DO).
- Cada sucursal: `parentOrganization`, `image` [portada 1200×630 + logo], `logo`, `hasMap` (los mismos enlaces de Google Maps de la página), `currenciesAccepted: DOP`, `areaServed` República Dominicana y `hasOfferCatalog` con 7 servicios (venta, financiamiento, reparación con garantía, cambio de pantalla, plan canje, importación de piezas, al por mayor). Sin precios.
- Santiago: `addressRegion: Santiago`.
- No se agregaron coordenadas GPS, Facebook ni teléfonos nuevos (no hay dato confirmado).
- JSON validado (se parsea bien).

## Rama / estado
Rama `claude/ficha-google`. **No publicado**: espera «publícalo».

## Importante (fuera del código)
Esto ayuda a Google a entender la web, pero la ficha que sale en Google Maps es el **Perfil de Empresa de Google** (business.google.com), que el dueño reclama y verifica por sucursal. Pendiente confirmar si las 3 sucursales ya están verificadas; si lo están, conviene poner `bayolcell.com` como sitio web en cada una y agregar aquí sus enlaces de Maps exactos y coordenadas.
