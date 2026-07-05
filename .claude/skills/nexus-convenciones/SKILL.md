---
name: nexus-convenciones
description: >-
  Convenciones OBLIGATORIAS del ecosistema NEXUS PRO (apps clínicas y de negocio
  de Sterling: geriatría, amatista dental, deluxe, bayolcell — todas Vite+React+TS+
  Tailwind+Supabase sobre Cloudflare). Úsala al empezar CUALQUIER cambio de UI o
  código en estos repos, o cuando dudes del estándar de marca, móvil, RD o deploy.
  Cubre: móvil primero (320-480px), marca sin emojis, contexto RD (RD$/ITBIS/NCF/
  cédula/ARS/es-DO), Supabase con RLS, todo imprimible/PDF/WhatsApp, publicar a main.
---

# Convenciones NEXUS PRO

Reglas del dueño (Sterling, `sterlinr08@gmail.com`). **Se respetan SIEMPRE**, en
todos sus proyectos. Si un cambio las rompe, no se publica.

## 1. Móvil primero
- El usuario real trabaja desde iPhone. Probar y pensar el layout a **320–480px**.
- **Cero desbordes horizontales.** Tablas anchas → scroll interno propio, nunca la página.
- Áreas táctiles cómodas; nada que dependa de hover para funcionar.

## 2. Marca y estética (nivel plus)
- **SIN emojis en la interfaz.** El dueño los considera informales. Usar solo
  iconos (lucide-react) + texto.
- **Nada de hex sueltos.** Usar clases Tailwind de marca (`brand-*`, y el acento del
  proyecto). En estos repos las paletas heredadas del molde (`amber`/`gold`/`pink`/
  `fuchsia`) están **sobrescritas** en `tailwind.config.js` al color de marca — así
  que las clases viejas ya se recolorean solas. No reintroducir dorados/rosados.
- La estética es prioridad real, no un extra. Espaciado, jerarquía y limpieza cuentan.

## 3. Contexto República Dominicana (es-DO)
- Moneda **RD$**, impuesto **ITBIS**, comprobantes **NCF/DGII**, **cédula**, seguros **ARS**.
- Fechas y números en `es-DO`. Textos en español dominicano, claros y formales.
- **Todo tiene que ser imprimible / exportable a PDF / enviable por WhatsApp** cuando
  aplique (récipes, reportes, carnés, listas). Reutilizar los helpers de impresión
  del repo (ej. `lib/documentos.ts`, `lib/reportes.ts`), no inventar otro camino.

## 4. Datos, base y seguridad
- Backend **Supabase**; toda tabla nueva va **con RLS**. Modelo **base-por-cliente**:
  cada cliente tiene su propia base, nada se cruza entre proyectos.
- **Claves y secretos: por chat o server-side. JAMÁS en el repo** (ni en CLAUDE.md,
  ni en código, ni en commits). Si ves una key expuesta, avisar para rotarla.
- El identificador de modelo del asistente nunca va en commits, PRs ni código.

## 5. Arreglos de raíz, no parches
- Resolver la causa, no tapar el síntoma. Preferir refactors limpios a hacks locales.

## 6. Publicar
- **Deploy directo a `main`** (Cloudflare auto-despliega). Versiones **pequeñas y
  probadas**: `npm run build` tiene que quedar **VERDE** antes de subir.
- Avisar antes solo si el cambio es **grande o riesgoso**, y antes de cada fase.
- **Actualizar el `CLAUDE.md` del repo tras cada cambio importante** (el chat es
  desechable; el contexto vive en ese archivo).

## Antes de dar por hecho un cambio
1. Build verde. 2. Revisado a 320–480px sin desbordes. 3. Sin emojis ni hex sueltos.
4. Sin secretos en el diff. 5. `CLAUDE.md` actualizado si el cambio fue importante.
