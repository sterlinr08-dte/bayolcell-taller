# Registros DNS de bayolcell.com antes de pasar a Cloudflare (solo lectura)

**Pedido del dueño.** Preguntó otra vez por pasar bayolcell.com a Cloudflare. Antes de cambiar nada se anotaron los registros actuales, leídos con consultas DNS públicas. No se cambió nada.

**Dónde está hoy.** El dominio usa los servidores de nombres de Namecheap (`dns1.namecheaphosting.com` y `dns2.namecheaphosting.com`), el DNS del hosting cPanel. La página sale de GitHub Pages y el correo va por Zoho.

| Nombre | Tipo | Valor | En Cloudflare |
|---|---|---|---|
| bayolcell.com | A ×4 | 185.199.108.153, .109.153, .110.153, .111.153 (GitHub Pages) | Con proxy (nube naranja) |
| www | CNAME | sterlinr08-dte.github.io | Con proxy |
| bayolcell.com | MX | 10 mx.zoho.com · 20 mx2.zoho.com · 50 mx3.zoho.com | Solo DNS |
| bayolcell.com | TXT | `v=spf1 include:zoho.com ~all` | Solo DNS |
| bayolcell.com | TXT | `apple-domain-verification=…` | Solo DNS |
| _dmarc | TXT | `v=DMARC1; p=none;` | Solo DNS |
| default._domainkey | TXT | Clave DKIM de cPanel (copiarla completa desde Namecheap) | Solo DNS |
| mail, webmail, cpanel, ftp | A | 198.54.126.121 (hosting de Namecheap) | Solo DNS (nube gris) |

**Riesgos anotados.**
- El correo: si falta un registro MX o el SPF, deja de llegar o de salir correo de `@bayolcell.com`.
- Puede haber registros que no se ven desde afuera (por ejemplo, una clave DKIM de Zoho con otro nombre). Hay que comparar con la lista completa en Namecheap antes de cambiar los servidores de nombres.
- En Cloudflare, el modo SSL debe quedar en «Completo» (Full). Con «Flexible», GitHub Pages entra en un bucle de redirecciones.

**Estado.** Solo auditoría. El dueño todavía no ha autorizado el cambio.
