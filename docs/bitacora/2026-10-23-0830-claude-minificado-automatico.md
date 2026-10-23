# 2026-10-23 08:30 (RD) — Archivo principal minificado, con robot para que no se olvide (rama `claude/carga-rapida`)

## Pedido del dueño
«¿Hay forma de que la carga completa sea 3.0?» → se explicaron las 3 palancas → «Y automático para que no se olvide».

## Qué se hizo
- `scripts/minificar.sh`: genera `taller-app.min.js` + `.map` con esbuild 0.28 (sin `keep-names`: no agrega globales;
  comprobado que ninguna función del sistema usa `.name`). El archivo lleva en la primera línea el sha1 de la fuente.
- `taller.html` carga `taller-app.min.js?v=20261023-p23`. El código fuente sigue en `taller-app.js`.
- **Automático, dos capas:**
  1. Robot `.github/workflows/minificar.yml`: al cambiar `taller-app.js` en `main` regenera y confirma el minificado
     («Minificar taller-app.js (automático)»). Cubre a cualquier IA o persona que publique.
  2. Candado `.claude/hooks/minificar.sh` (PreToolUse · Bash): antes de cada `git push` de Claude, si la fuente cambió,
     regenera el minificado y bloquea el push hasta confirmarlo junto. Así no hay desfase ni de un minuto.
- `.gitattributes`: el minificado y el mapa se marcan como generados (no ensucian los diffs).
- `CLAUDE.md` (Bayol): regla «se edita `taller-app.js`; el `.min.js` no se toca a mano».

## Medición (mismo banco, red 4G floja simulada)
| | Hoy en producción | Rama (capas + Diagnóstico bajo demanda) | Rama + minificado |
|---|---:|---:|---:|
| KB descargados | 826 | 781 | 663 |
| Archivo principal (gzip) | 557 KB | 557 KB | 441 KB |
| load (celular / PC) | 5.4 s / 5.3 s | 5.0 s / 5.1 s | 4.8 s / 4.5 s |
| Última hoja de estilo | 7.4 s | 0.86 s | 0.88 s |

- Pantallas comparadas píxel a píxel (Dashboard, Prefactura, CRM a 390 y 1280) con el minificado: 0 % de diferencia.
- Las funciones siguen globales (`nav`, `renderAll`, `_pintarWhatsapp`, …); el CRM y Diagnóstico IA pasan sus bancos.

## Para llegar a 3.0 s (explicado al dueño)
Falta partir `taller-app.js` por pantallas (CRM/WhatsApp, Mi trabajo/reacondicionados, Contabilidad/reportes,
Financiamiento) y, como decisión aparte, mover el hospedaje de GitHub Pages a Cloudflare Pages (caché larga y brotli).
Los 5 s son con red lenta simulada; en el Wi-Fi de la tienda es menos.

## Publicación
- No publicado: espera el «publícalo». Al publicar, el robot de GitHub se activa solo en el próximo cambio de la fuente.
