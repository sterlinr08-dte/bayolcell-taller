---
name: nexus-publicar
description: >-
  Puerta de calidad ANTES de publicar a main en cualquier proyecto NEXUS PRO
  (geriatría, amatista dental, deluxe, bayolcell). Úsala antes de cada commit/push
  a producción, o cuando Sterling diga "sube esto / publica / a main / ya está listo".
  Verifica build verde, móvil sin desbordes, sin emojis en UI, sin hex sueltos, sin
  secretos en el repo, y CLAUDE.md al día — y recién ahí commitea y hace push.
---

# Publicar NEXUS PRO (puerta de calidad)

Antes de subir a `main` (Cloudflare despliega solo), pasar esta lista. Si algo
falla, **no se publica**: se arregla primero. Reportar honestamente lo que pase.

## 1. Build verde (obligatorio)
```bash
npm run build      # debe terminar sin errores
```
Si falla, arreglar antes de seguir. `npm run lint` (tsc --noEmit) para tipos.

## 2. Móvil primero
- Revisar las vistas tocadas a **320–480px**: sin desbordes horizontales, sin texto
  cortado, áreas táctiles cómodas. Si hay tablas anchas, que tengan scroll propio.

## 3. Estética / marca
- **Sin emojis** en la interfaz (solo iconos lucide + texto).
- **Sin hex sueltos** nuevos: usar clases de marca (`brand-*` / acento del repo).
  Revisar el diff:
```bash
git diff --cached | grep -nE '#[0-9a-fA-F]{3,6}' || echo "sin hex nuevos"
```
  (Un hex en el diff no siempre es error —ej. paletas del config— pero hay que mirarlo.)

## 4. Sin secretos en el repo (crítico)
```bash
git diff --cached | grep -nEi 'sb_secret|service_role|eyJ[A-Za-z0-9_-]{20,}|fc-[0-9a-f]{20,}|api[_-]?key|password' \
  || echo "sin secretos aparentes"
```
Si aparece una clave, **quitarla del diff** y avisar para rotarla. Claves: por chat
o server-side, jamás en el repo.

## 5. CLAUDE.md al día
- Si el cambio fue importante, actualizar el `CLAUDE.md` del repo (estado/fase/decisión).

## 6. Commitear y publicar
Mensaje claro en español, sin el identificador del modelo. Push con upstream:
```bash
git add -A
git commit -m "<qué y por qué, breve>"
git push -u origin <rama>            # o main, según el flujo del repo
```
Reintentar solo ante fallos de red (backoff 2s/4s/8s/16s). **No** abrir Pull Request
salvo que el dueño lo pida.

## Salida esperada
Un resumen corto: build (verde/rojo), móvil OK, sin emojis/hex/secretos, CLAUDE.md,
y el commit/push hecho. Si algo quedó pendiente, decirlo sin adornos.
