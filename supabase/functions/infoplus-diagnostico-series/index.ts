// Retirada (20-oct-2026): la reemplaza infoplus-imei-almacen, que se usa al prefacturar.
Deno.serve(() => new Response('retirada', { status: 410 }));
