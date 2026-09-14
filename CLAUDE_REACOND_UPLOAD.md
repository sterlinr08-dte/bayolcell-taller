# Entrega Reacondicionado — publicar cambios completos

## Objetivo

Publicar juntos los dos bloques de mejora del módulo **Reacondicionado** de BAYOL CELL:

1. Simplificación visual del flujo a seis etapas.
2. Separación de solicitudes operativas de técnicos y costos contables de Info Plus.
3. Pulido visual de Reacondicionado inspirado en la referencia aprobada: fondo azul claro y aireado, superficies blancas flotantes, navegación en cápsulas y controles numerados.

El cambio completo está en `taller.html` y `taller-visual-polish.css`. Subir ambos archivos en el mismo commit; el HTML ya apunta a la versión visual `20260914-visual19`. No reemplazar el sistema actual ni sobrescribir trabajo ajeno.

## Alcance exacto

### 1. Seis etapas visibles

Usar estas etiquetas en la interfaz, manteniendo los estados reales existentes y sus IDs:

| Etapa visible | Estados internos compatibles |
|---|---|
| Recibidos | `pendiente` |
| Diagnóstico | `en_evaluacion`, `evaluado` |
| En reparación | `en_proceso`, `tecnico_recibio`, `espera_pieza`, `reasignado`, `reparacion_externa` |
| Control de calidad | `listo_revision` |
| Listo para venta | `listo_venta` |
| Despachados | `vendido` — con `completado` como cierre administrativo |

Las incidencias deben continuar visibles como indicadores secundarios: técnico recibió, bloqueado por pieza, reasignado, reparación externa, salida por cerrar y registro cerrado.

### 2. Flujo protegido

- No permitir saltos masivos arbitrarios entre etapas.
- `evaluado` solo puede pasar desde diagnóstico (`en_evaluacion`).
- `en_proceso` requiere técnico asignado.
- `listo_venta` debe salir desde control de calidad o diagnóstico sin técnico.
- `vendido` solo desde `listo_venta`.
- El cierre administrativo (`completado`) solo después de `vendido`.
- No permitir pasar a control de calidad si existen piezas operativas pendientes.
- Una evaluación no puede cerrarse sin una falla seleccionada o una nota diagnóstica.

### 3. Pedidos de piezas

En la pestaña **Pedidos de Piezas**, mostrar dos vistas compactas:

- **Solicitudes técnicas**: piezas operativas solicitadas por técnicos o vinculadas a inventario (`agregada_por_tecnico` o `pieza_id`). Aquí se muestran estados de gestión, stock y alertas.
- **Costos Info Plus**: registros contables identificados por `pieza_codigo`, sin `agregada_por_tecnico` y sin `pieza_id`. Son solo consulta; no deben contarse como pedidos pendientes ni exigir entrega/recepción.

La base actual se verificó con lectura de Supabase: 225 registros, 59 solicitudes operativas y 166 costos Info Plus. Hay 9 registros sin `equipo_id`; la vista operativa los marca para revisión.

### 4. Vista visual aprobada

Aplicar el estilo únicamente al módulo `#v-refurb`:

- Fondo claro con atmósfera azul muy sutil, sin panel negro.
- Navegación superior en tarjetas/cápsulas con icono circular y etiqueta legible.
- Etapas con número circular (`01` a `06`) y etiqueta alargada, siguiendo la referencia `02 / FreshMart`.
- Tarjetas de lotes, KPIs y equipos blancas, redondeadas, con sombras suaves y lectura rápida.
- Azul como acento principal, manteniendo los indicadores de estado y las acciones existentes.
- Diseño responsive para móvil y escritorio; no añadir librerías, fuentes ni dependencias nuevas.

## Archivos y límites

- Archivos modificados: `taller.html` y `taller-visual-polish.css`.
- Archivo documental: `CLAUDE_REACOND_UPLOAD.md`.
- `CLAUDE.md` solo debe enlazar esta guía y conservar su contenido existente.
- No tocar el módulo CRM, `index.html`, permisos, credenciales, Edge Functions ni tablas/migraciones de Supabase.
- No eliminar `taller-visual-polish.css`: contiene la capa visual aprobada de Reacondicionado.
- No convertir, borrar ni renombrar estados o registros existentes.
- Conservar IDs, handlers, permisos y compatibilidad con el flujo actual.

## Validación obligatoria antes de publicar

Ejecutar desde la raíz del repositorio:

```bash
git diff --check
node - <<'NODE'
const fs = require('fs');
const html = fs.readFileSync('taller.html', 'utf8');
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map(m => m[1]).filter(Boolean);
for (const code of scripts) new Function(code);
console.log(`Sintaxis JavaScript válida: ${scripts.length} scripts`);
NODE
```

Confirmar además que `git status` no incluya archivos no relacionados. No aplicar migraciones de Supabase para esta entrega.

## Publicación solicitada

Publicar el conjunto completo a `main` para que GitHub Pages actualice `bayolcell.com`, siguiendo el flujo autorizado del repositorio. Si se trabaja mediante rama/PR, incluir ambos bloques en el mismo PR y no publicar solo uno.

Mensaje sugerido:

```text
Simplifica flujo y piezas de reacondicionado
```

Después de publicar, confirmar el SHA y la URL del commit/PR. Indicar que los cambios son únicamente de interfaz y reglas de flujo en `taller.html`; no hubo cambios de base de datos ni CRM.
