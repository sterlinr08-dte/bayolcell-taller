# Claude · «Imprimir label»: accesos rápidos compartidos entre computadoras (sin publicar, base sin aplicar)

## Autorización y publicación anterior
- El dueño eligió «Publícalo y compártela» (10-nov-2026). Se publicó primero la ventana: PR #288 → `main`, commit `4864091f5f08d9354ec298cd46cf83cb70bbe963`. Verificado en vivo: `taller-app.min.js?v=20261110-ab4`.
- Esta entrada es la segunda parte («compártela»). Se le dijo que se le enseñaría antes de aplicarla.

## Diagnóstico (fuente de verdad)
- `config_taller` (una fila, `id = 1`) ya es la configuración común del taller; el sistema la carga en `cache.configTaller`.
- Su política `app_authenticated_all` deja leer y cambiar a administradores y a técnicos activos. No se toca.

## Qué se preparó
- **Base (sin aplicar):** `supabase/migrations/20261110160000_config_label_estados.sql` agrega la columna `config_taller.label_estados jsonb` (vacía = CLASE A · B · C) con un candado: solo listas de hasta 10.
- **Sistema (`taller-app.js`):**
  - la lista sale de `config_taller.label_estados`; si no hay, de la del equipo; si no hay, CLASE A · B · C;
  - agregar, quitar o imprimir un texto nuevo la guarda en la base y en el equipo;
  - si la base falla: aviso «Guardado solo en este equipo.» y lo compartido no cambia;
  - las otras computadoras la ven al recargar sus datos (al entrar o actualizar).
- La memoria «por equipo» (qué texto se le imprimió a cada celular) sigue en cada navegador.
- `taller.html` → `taller-app.min.js?v=20261110-ab5`. Prueba nueva: `scripts/pruebas/label-accesos-compartidos.cjs`.

## Pruebas
- Banco local: `label-accesos-compartidos.cjs` y `label-rapido-smart.cjs`: **Todo bien**.
- Base real, ensayo deshecho (un solo bloque `DO` que termina en error a propósito): la columna guarda `["CLASE A","SIN FACE ID"]`, rechaza un texto suelto y rechaza una lista de 11. No quedó nada aplicado.

## Riesgos
- Bajo: solo se agrega una columna vacía. Para deshacer: `alter table public.config_taller drop column label_estados;` (el sistema vuelve solo a la lista de cada equipo).
- Si se publica el sistema antes de aplicar la base, el guardado falla con el aviso y queda local; por eso el orden es base primero.

## Estado
Rama `claude/label-accesos-compartidos`, sin publicar. Falta el OK del dueño para aplicar la base y publicar.
