# 2026-11-26 00:50 RD · Claude — «Reponer y quieto» publicado

Sigue a `2026-11-25-2330-claude-reponer-quieto.md` y `2026-11-26-0030-claude-reponer-smart.md`. El dueño tocó **«Publícalo»**.

## Qué se publicó
1. **Migración** `inv_reponer_quieto`, aplicada en `vkhwdvjtowrhkhqavnvk`:
   - `inv_reponer`, `inv_reponer_resumen`, `push_destinatarios_admin` e `inv_reponer_aviso_semanal`;
   - cron `inv-reponer-lunes` (`47 11 * * 1`, activo).
   - Comprobado: las 4 funciones existen y el cron está activo.
2. **Edge `push-enviar` v2**, con verify_jwt igual que la v1. La rama de WhatsApp quedó igual y se agregó `aviso: 'reponer_semanal'`.
3. **PR #358 unido a `main`** (squash `8227b21`).
   - bayolcell.com/taller.html ya carga `taller-reponer.js?v=20261126-rep2`; el archivo responde 200.

## Quién recibe el aviso del lunes
- Hay 6 teléfonos con avisos activos; **2** son de administrador. Solo esos 2 reciben el resumen.
- El primero sale el lunes 30-nov-2026 a las 7:47 a. m. RD.

## No verificado todavía
- El aviso real, hasta el lunes.
- Un despacho real desde «Traer»: falta que el dueño o un administrador lo use.
- La ventana en vivo con sesión real: la verificación se hizo en la página de prueba, a 390 y 1280 px.
