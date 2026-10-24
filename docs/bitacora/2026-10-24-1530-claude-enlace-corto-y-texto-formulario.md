# 24-oct-2026 15:30 RD · Enlace corto y mensaje más claro para la solicitud de financiamiento

**Pedido del dueño** (captura del mensaje de prueba): «Vamos a corregir ese link para que se vea más bonito y claro y el texto».

## Qué cambia
- **Enlace corto:** `https://bayolcell.com/solicitud?t=Kx8Q2mA7Zp` en vez de `…/solicitud.html?t=<48 caracteres hex>`. GitHub
  Pages sirve `solicitud.html` sin la extensión (verificado 200). La llave pasa a 10 letras y números (alfabeto sin 0/O/1/l/I
  para no confundir), sigue siendo de un solo uso y vence a los 7 días. La función acepta las dos formas de llave.
- **Texto del mensaje** (voz del empleado, nombre del cliente en mayúscula inicial, no en MAYÚSCULAS):
  ```
  Hola Esterlin 👋
  Soy Loribel, de Bayol Cell Santiago.

  📱 iPhone 13 128GB
  💰 RD$ 38,500.00

  Aquí tiene su solicitud de financiamiento. Son 5 pasos cortos y me llega directo a mí:
  👉 https://bayolcell.com/solicitud?t=Kx8Q2mA7Zp

  Cualquier duda, me escribe por aquí.
  ```
- **Vista previa del enlace** en WhatsApp (Open Graph en `solicitud.html`): título «Solicitud de financiamiento · Bayol Cell»,
  descripción «Son 5 pasos cortos. Sus datos solo los ve Bayol Cell y el banco.», imagen `assets/og-bayolcell.jpg`.

## Archivos
`supabase/functions/whatsapp-flow-financiamiento/index.ts` (v6), `solicitud.html`. Rama `claude/solicitud-enlace-texto` desde `main`.

## Pruebas
`scripts/pruebas/solicitud-web.cjs` 390/1280 OK; esbuild OK; `og:title` presente. Envío de prueba real al dueño con el texto
nuevo tras desplegar v6 (ver actualización).
