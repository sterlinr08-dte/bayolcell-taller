# Claude · Agente de IA v33 publicado (foto de pieza → Info Plus)

Sigue a `…-claude-ia-vision-piezas-y-copiloto.md` (10-nov-2026), que decía «sin desplegar».

- **Autorización:** el dueño marcó «Foto de pieza (Bayol)» y «Referencia en los 3».
- **Despliegue:** Edge Function `whatsapp-ia-responder` **v33** (antes v32), ACTIVE, `verify_jwt=false` como antes. Archivos: `index.ts`, `_shared/precio-pantalla.ts`, `_shared/pieza-foto.ts`.
- La única diferencia con el repo es de escritura: el rango de acentos `̀-ͯ` quedó como caracteres en `palabrasDe()` y `normalizar()`. Lo mismo pasaba en v32; el comportamiento es idéntico.
- **Código:** PR #292 → `main` (`f1aca9df0e6cbd63b6468420fdd2c35aacf04e77`). Referencia: PR #459 (nexus-pro), #291 (bayolcell-taller), #29 (studio-rd).
- **Verificación:** las llamadas a la función después del despliegue respondieron 200 (registros del 10-nov, 17:01–17:04 UTC).
- **Pendiente:** ver la primera foto real de una pieza y revisar si la nota interna trae los códigos correctos.
- **Para deshacer:** volver a desplegar `whatsapp-ia-responder` desde el commit `5f21401` (v32).
