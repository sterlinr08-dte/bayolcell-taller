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

## Actualización 15:40 RD · la prueba No. 2 funcionó de punta a punta
El dueño llenó la solicitud de prueba No. 2 desde el enlace: entró como `respondido` (canal web), la tarjeta `flow_respuesta`
quedó en su chat (cédula de 11 dígitos, celular de 10, plazo 12 meses, dirección) y el mensaje de recibido con las fotos
salió un segundo después (`fotos_pedidas_en`). Dos detalles vistos en esa prueba y corregidos aquí:
- el nombre salía en MAYÚSCULAS como viene del perfil de WhatsApp («Listo, ESTERLIN») → ahora con mayúscula inicial en el
  saludo, en el recibido y en el campo del formulario;
- la provincia quedaba en la primera de la lista (Azua) → ahora se sugiere la de la sucursal (Santiago/Navarrete → Santiago,
  Moca → Espaillat) y el cliente puede cambiarla.

## Actualización 15:50 RD · sin pedir fotos: primero evalúa el banco
Dueño (captura del mensaje de recibido): «No podemos foto de cédula porque es una solicitud y el banco primero tiene que
evaluar». Se quita el pedido automático de cédula y comprobante en los tres caminos:
- Edge `whatsapp-flow-financiamiento` (v7): el recibido web dice «Listo, Esterlin, ya me llegó su solicitud del … (No. 2). ✅
  Se la paso al banco para que la evalúe. Normalmente responden al otro día; en cuanto me digan algo, le aviso por aquí.»
  El recibido del Flow de respaldo igual, sin fotos.
- Webhook `whatsapp-webhook` (v42): mismo texto para la respuesta del Flow.
- CRM capa **f6** (`taller.html` u19): la tarjeta ya no cuenta fotos; muestra «Pendiente de enviar al banco».
- `solicitud.html`: pantalla final «Se la pasamos al banco para que la evalúe. Si necesitan algún documento, se lo pedimos
  después por WhatsApp.»
- IA (`whatsapp_ia_conocimiento` políticas y 1 ejemplo): ya no dice que se pide foto de cédula para someter; explica que el
  empleado manda el formulario, el banco evalúa primero y los documentos van después si aprueba. Migración
  `20261024220000_fin_sin_fotos_primero_evalua_banco.sql` (aplicada).
La columna `fotos_pedidas_en` se conserva: ahora marca el envío único del mensaje de recibido.
Pruebas: `flow-financiamiento.cjs` (f6) y `solicitud-web.cjs` 390/1280 OK.
