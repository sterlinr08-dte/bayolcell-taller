# 24-oct-2026 17:26 (RD) · Claude · Pestaña «Solicitudes» en el CRM (seguimiento del banco) — rama sin publicar

## Pedido del dueño
- «Ese financiamiento va aparte del módulo de financiamiento porque es un financiamiento externo».
- «No, vamos a ponerlo en el CRM para que los empleados le den seguimiento constante».
- Maqueta aprobada: https://claude.ai/artifact/JWAzpFFxeHavkfSkjMb823 (opción B: lista + seguimiento).
- «Banco no, pon Solicitudes y ponle el logo del banco» → luego «Pon solamente Solicitudes, no ponga logo» → «Aplícalo».

## Fuente de verdad
- `fin_solicitudes_whatsapp` (la llena `whatsapp-flow-financiamiento` v8): `estado` = `enviado` (formulario mandado) o
  `respondido` (el cliente lo llenó); `datos` jsonb con cédula, nombre, teléfono, dirección, equipo, precio, plazo y referencia.
- RLS existente: leer/editar solo `app_is_admin()` o técnico activo. No había ningún campo de seguimiento con el banco.

## Base de datos (ya aplicada en vkhwdvjtowrhkhqavnvk, solo agrega)
Migración `supabase/migrations/20261024213000_fin_solicitudes_seguimiento.sql`:
- columnas `seguimiento` (recibida | banco | aprobada | no_aprobada | entregada, por defecto recibida), `seguimiento_en`,
  `seguimiento_historial` jsonb (paso, de, en, por, nota) + índice;
- RPC `fin_solicitud_seguimiento(p_id, p_seguimiento, p_nota)` SECURITY DEFINER: exige admin o técnico activo, solo
  solicitudes `respondido`, guarda quién (nombre del técnico o «Administración») y cuándo. `anon` sin permiso.
- Verificado: las 3 filas existentes quedaron en «recibida» con historial vacío; llamar la RPC sin sesión de empleado
  devuelve «No tiene permiso…» (no cambió nada).

## Pantalla (capa aislada `crm-solicitudes.js`, apagar con `localStorage.bc_solicitudes_off='1'`)
- `taller.html`: botón «Solicitudes» en la fila de pestañas del CRM (después de Redes) con contador rojo de «en proceso»
  (recibida + enviada al banco) y panel `#crmLinea-solicitudes`. Cargador `crm-marketing-consent.js?v=20261024-u23`.
- La capa envuelve `crmLineaTab`: «solicitudes» esconde los otros paneles y pinta la lista; las demás pestañas siguen igual.
- Lista: chips de sucursal (empleado: su sucursal; admin: Todas), chips de estado (+ «Sin llenar» si hay formularios sin
  responder y sin vencer), buscador (nombre, cédula, teléfono, No.), tarjetas con nombre, equipo, monto, plazo, No., fecha,
  sucursal y empleado.
- Ficha (hoja abajo en celular, ventana centrada en PC): datos del cliente y de lo que financia, «Abrir chat»,
  «Copiar referencia», «Copiar solicitud completa», pasos tocables con fecha y quién, «No aprobada» cuando está en el
  banco y «Corregir» para volver.
- «Avisar al cliente» (Aprobada / No aprobada): abre el chat y **deja el texto escrito en la caja**; el empleado lo revisa
  y lo envía él (nada sale solo). Texto de no aprobada tomado del ejemplo que ya usa la IA.
- `crm-flow-financiamiento.js` f10: la tarjeta del chat cambia «Pendiente de enviar al banco» por «Siga el estado en la
  pestaña Solicitudes» y trae el botón «Ver seguimiento», que abre la misma ficha.
- Sin logo del banco (dueño).

## Pruebas
- `scripts/pruebas/solicitudes-crm.cjs`: 390 OK y 1280 OK (pestaña 44 px sin recortar las otras, contador 2→1, 5 filas,
  filtros, búsqueda por cédula, botones ≥44, buscador 48/16, sin MAYÚSCULAS, ficha sin filas recortadas, RPC llamada 2
  veces con historial, aviso escrito en el chat h3 sin enviar, «Ver seguimiento» abre la ficha). Sin errores de página.
- `scripts/pruebas/flow-financiamiento.cjs` (ajustado al texto nuevo): 390 OK y 1280 OK.
- Corregido en el camino: las cajas de la ficha se encogían dentro de la hoja (flex) y escondían Celular/Dirección →
  `flex-shrink:0`; otra capa borra el texto «✕» de los botones → la ✕ es un dibujo SVG.
- El buscador se convierte en la lupa naranja del sistema (`bc-busqueda.js`), igual que en el resto del taller.

## Rama / estado
- Rama `claude/solicitudes-crm` (desde `main` ad8b16f). **No publicado**: falta el «publícalo» del dueño.
- La base ya tiene las columnas y la RPC (no afectan nada mientras la pantalla no se publique).

## Pendiente / siguiente paso
- El dueño revisa capturas y dice «publícalo».
- Después de publicar: probar con un empleado real (técnico) que cambia los pasos de la solicitud No. 3.
- Opcional: aviso automático por plantilla de WhatsApp al aprobar (hoy queda escrito en el chat para que el empleado lo mande).
