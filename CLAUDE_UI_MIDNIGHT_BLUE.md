# BAYOL CELL — Línea gráfica Midnight Blue + Motion Tabs

## Estado
Aprobada por Sterling el 14-sep-2026 para el Taller BAYOL CELL.

## Paleta obligatoria
- Azul principal: `#0047AB`
- Azul profundo: `#1A1A2E`
- Naranja BAYOL: `#FF6B35`
- Naranja oscuro: `#D65225`
- Área de trabajo: clara. No convertir todo el sistema a dark mode.

## Reglas visuales
1. Sustituir el navy anterior en sidebar, topbar, headers oscuros, botones dark y loader por gradientes `#0047AB → #1A1A2E`.
2. El naranja BAYOL se mantiene como acento de acción/selección, no como fondo dominante.
3. No reintroducir líneas blancas/refractivos alrededor de tarjetas, botones, iconos, tablas, modales, inputs o shell.
4. El CRM conserva IDs, funciones, permisos y handlers. Los cambios son solo visuales.
5. Mantener contenido operativo claro y legible; usar profundidad por sombra suave, no por bordes blancos.

## Motion Tabs aprobado
Inspiración: navegación en cápsula deslizante del video compartido por Sterling.
- La selección activa se mueve con una cápsula entre tabs.
- Duración objetivo: ~320–340 ms.
- Curva: `cubic-bezier(.2,.82,.2,1)`.
- La cápsula no intercepta clics (`pointer-events:none`).
- Sidebar: cápsula móvil naranja BAYOL.
- Tabs horizontales: cápsula Midnight Blue.
- Redes: mantener iconos/marca, pero la cápsula de selección puede usar Midnight Blue.
- Respetar `prefers-reduced-motion`.

## Seguridad técnica
- No usar un MutationObserver global sobre `document`.
- Si se requiere observar estado activo, limitar el observer al contenedor de navegación/tab correspondiente.
- No tocar login, Supabase, backend, datos ni flujos para lograr efectos visuales.
- No animar `#app .content` completo.
- Todo efecto decorativo debe fallar de forma silenciosa y nunca impedir el arranque.

## Archivos de referencia
- `taller-midnight-motion.css`
- `taller-navigation-motion.js`
- `taller-surface-cleanup.css`
- `taller-ambient-orb-safe.js`

No reemplazar esta línea gráfica por otra sin autorización explícita de Sterling.
