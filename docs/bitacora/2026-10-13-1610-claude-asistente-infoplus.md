# 2026-10-13 16:10 — Claude: puente de SOLO LECTURA de Info Plus para el asistente de WhatsApp (OpenClaw)

## Contexto y pedido del dueño
- El dueño instaló OpenClaw en una PC Windows 11 de la tienda. Es un asistente de WhatsApp conectado como dispositivo vinculado a un número viejo de Bayol, y solo obedece el número personal del dueño.
- Pidió que el asistente consulte Info Plus. Respuesta: **«solo lectura»**.
- Los números de teléfono **no se escriben aquí** porque este repo es público. Están en la configuración local de la PC (`~/.openclaw/openclaw.json`).

## Qué se hizo
- **Nueva Edge Function `asistente-infoplus`** (proyecto `vkhwdvjtowrhkhqavnvk`, v1, `verify_jwt:false`, desplegada). Fuente: `supabase/functions/asistente-infoplus/index.ts`.
  - Acceso: cabecera `x-asistente-token`. En el código solo está el **SHA-256** del token. El token lo tiene únicamente el asistente en la PC; para revocarlo se cambia el hash y se despliega de nuevo.
  - **Sin escritura.** Solo hace `SELECT` a `infoplus_articulos` e `infoplus_ventas`, y `GET listaarticulos` para la existencia en vivo. La clave de Info Plus se queda en los secrets del servidor.
  - Acciones:
    - `buscar {q}`: hasta 15 artículos por palabras o código, con existencia por almacén, precios nivel 1/2/3 y costo.
    - `existencia_vivo {codigo}`: existencia en vivo en los almacenes 1, 3, 4, 5 y 6.
    - `ventas {desde, hasta, sucursal?}`: por sucursal (facturas, venta, costo, ganancia bruta) más los 10 más vendidos. Máximo 62 días.
  - Los costos y los niveles 2/3 se devuelven porque el dueño los consulta en su chat privado. El asistente tiene como regla no mandarlos nunca a un grupo.

## Pruebas (13-oct, en vivo)
- Sin token → `401 no autorizado`.
- `buscar «bateria iphone 11»` → 8 resultados, con existencia por almacén y precios.
- `existencia_vivo 2550` → Santiago 66, Moca 6.
- `ventas` de hoy: Santiago 22 facturas, Moca 1, «Localidad 7» 2.
- Acción inexistente (`cambiar_precio`) → 400 «Solo lectura».

## Pendiente
- Confirmar con el dueño qué sucursal es `codlocalidad` 7 en las ventas (¿Navarrete?) y nombrarla en `LOCALIDADES`.
