# Auditoría técnica para Claude — BAYOL CELL Taller

Fecha: 2026-09-12. Estado: auditado; correcciones NO implementadas.

## Cómo retomar este trabajo

- Leer este documento completo y CLAUDE.md antes de corregir.
- Contiene 26 hallazgos: 4 P0, 15 P1 y 7 P2, con evidencia, corrección y criterio de cierre.
- Verificar el estado actual de Git y Supabase: el código puede haber cambiado desde la auditoría.
- Priorizar F01–F04, luego transacciones de pagos, reversos, calendario, mora y confirmación de MDM.
- No activar bloqueos automáticos hasta superar las pruebas correspondientes. No probar borrado sobre equipos de clientes.
- La solicitud de dejar este documento no autoriza implementar ni desplegar las correcciones descritas. Respetar las autorizaciones del usuario y el flujo del proyecto.
- No marcar un hallazgo resuelto sin evidencia de prueba y referencia de commit/migración o función desplegada.
- Las líneas corresponden a la instantánea auditada; localizar también por nombre de función.

---

REVISIÓN TÉCNICA · 12 SEPTIEMBRE 2026 · CONFIDENCIAL

# Auditoría de BAYOL CELL Taller

Seguridad, financiamiento, control de equipos, operaciones e integridad de datos.

**Dictamen: necesita correcciones críticas antes de operar con confianza y ampliar automatizaciones.**

La aplicación tiene una base funcional, pero varios controles dependen del navegador o de una identidad que el usuario puede influir. Se identificaron 26 hallazgos: 4 P0, 15 P1 y 7 P2. No recomiendo activar bloqueos automáticos hasta cerrar los P0 y validar cobros, estados de deuda y confirmación de comandos.

## 1. Alcance y límites de la evidencia

Se leyeron CLAUDE.md y RESUMEN_FINANCIAMIENTO_CHATGPT.md, el árbol del repositorio, la aplicación principal y las 54 Edge Functions desplegadas. Se consultaron esquema, restricciones, funciones SQL relevantes, RLS, permisos, buckets, cron, migraciones y métricas agregadas en Supabase. Se ejecutaron pruebas locales aisladas sobre funciones extraídas del código, sin operar dispositivos ni cuentas de clientes.

Repositorio: [sterlinr08-dte/bayolcell-taller · árbol auditado a240344](https://github.com/sterlinr08-dte/bayolcell-taller/tree/main). Archivo principal: taller.html, blob b6571fd63d2a16bda2088fddf7870e9f5a78b7fa. Las funciones desplegadas se inspeccionaron separadamente: no se presume que coincidan con lo versionado.

**Límites:** no se hizo una prueba de penetración activa, pruebas con sesiones reales de todos los roles, carga concurrente contra producción, restauración, visita al taller ni bloqueo/borrado de un dispositivo físico. No se certificó cumplimiento jurídico, términos comerciales de financiación ni salud de certificados Apple. Las pruebas locales demuestran los casos descritos; no sustituyen una aceptación integral en staging. No se alteró código remoto, base de datos ni configuración de producción.

- Área — Resultado de la revisión
- Identidad, RLS y permisos — Defectos críticos confirmados en definiciones SQL y código de funciones.
- Financiamiento, caja y contratos — Revisión detallada de cálculos, cobros, aprobación, anulaciones, firmas y recordatorios.
- Hexnode y Apple Business Manager — Revisión de comandos, autorización y lógica de confirmación; sin prueba de equipo físico.
- WhatsApp y CRM — Revisión de aislamiento de líneas, autenticación, webhooks y consistencia de envíos.
- Contabilidad, incentivos e InfoPlus — Revisión de publicación de asientos, duplicidad candidata, integración y sincronizaciones.
- Recepción, diagnóstico, refurb, inventario y demás módulos — Revisión estructural de código, acceso y persistencia; no aceptación funcional pantalla por pantalla.
- Entrega y operación — Revisión del árbol Git, migraciones, funciones desplegadas, advisors y señales de salud.

## 2. Qué está bien y qué muestran los datos actuales

RLS está habilitado en las 111 tablas inventariadas. Existe una tabla de identidad administrada por el servidor que puede aprovecharse para corregir la autorización. El webhook de WhatsApp verifica HMAC. Los buckets de documentos y evidencias de financiación son privados y tienen restricciones de tamaño/tipo. Los dos bloques JavaScript pasan la comprobación de sintaxis.

- Comprobación — Resultado y lectura correcta
- Financiamiento — 1 contrato y 5 pagos. Sin pagos negativos ni grupos duplicados por solicitud/IMEI en los datos examinados; esto no garantiza concurrencia segura.
- Contraseñas antiguas — usuarios.clave y tecnicos.clave no contienen valores no vacíos. No se afirma exposición actual de contraseñas en esos campos.
- Contabilidad — 0 asientos desbalanceados y 0 sin líneas en la consulta; el código sigue necesitando garantías transaccionales.
- Bloqueo automático — Desactivado; gracia configurada de 3 días. No se recomienda activarlo todavía.
- Auditoría general — auditoria y logs_seguridad: 0 filas. Es una ausencia de evidencia, no prueba de ausencia de incidentes.
- Sincronización — Inventario: 338 registros / 3 fallos; ventas: 168 / 0 fallos en 7 días. Últimos éxitos observados el 12/09/2026 a las 01:30 y 01:07 UTC, respectivamente.
- Cron — Tres trabajos de InfoPlus activos. No se identificó un trabajo de cobro/recordatorios financieros.

## 3. Hallazgos y criterios de cierre

**P0:** corregir primero por acceso indebido o acciones de alto impacto. **P1:** resolver para asegurar dinero, documentos y operaciones críticas. **P2:** robustez, mantenibilidad y recuperación. La prioridad expresa riesgo técnico, no una afirmación de que ya ocurrió un fraude o incidente.

- ID — Prioridad — Hallazgo
- 01 — P0 — La autorización de administrador depende de datos editables por el usuario
- 02 — P0 — RLS activado, pero con acceso general a datos sensibles
- 03 — P0 — Comandos de equipos sin autorización de negocio en el servidor
- 04 — P0 — Operaciones de InfoPlus sin comprobación del permiso del empleado
- 05 — P1 — Cobros no atómicos y sin idempotencia
- 06 — P1 — Aprobación de solicitudes susceptible a duplicados y referencias inválidas
- 07 — P1 — Anular elimina información financiera
- 08 — P1 — El sistema declara aplicado un bloqueo sin confirmación del equipo
- 09 — P1 — Borrado remoto prueba múltiples endpoints y enrolamiento se valida de forma insuficiente
- 10 — P1 — Los vencimientos mensuales se desplazan al mes siguiente
- 11 — P1 — Puede marcarse saldado con mora pendiente
- 12 — P1 — La tasa y el redondeo necesitan reglas contractuales inequívocas
- 13 — P1 — Recordatorio registrado como enviado al abrir WhatsApp
- 14 — P1 — El contrato firmado no queda congelado
- 15 — P1 — Las conversaciones de distintas líneas pueden mezclarse
- 16 — P1 — El webhook de WhatsApp pierde fiabilidad ante repeticiones y fallos
- 17 — P1 — Envío remoto y registro local pueden divergir
- 18 — P1 — La contabilidad permite registros parciales y presenta un total engañoso
- 19 — P1 — Archivos privados accesibles a un conjunto demasiado amplio
- 20 — P2 — Los saldos dependen de cargar tablas completas en el navegador
- 21 — P2 — Colisiones de funciones globales y estructura difícil de mantener
- 22 — P2 — El despliegue no es completamente reproducible con lo versionado
- 23 — P2 — Dependencias del navegador sin versión exacta
- 24 — P2 — Observabilidad y recuperación necesitan evidencia operativa
- 25 — P2 — Un grupo de incentivos requiere conciliación
- 26 — P2 — Avisos de Supabase necesitan tratamiento selectivo

### P0 · F01 La autorización de administrador depende de datos editables por el usuario

**Evidencia.** La función SQL app_is_admin() confía en auth.jwt()->user_metadata: tipo=usuario devuelve verdadero. También utiliza ref_id para consultar técnicos. app_actor_sucursal_id, app_puede_contabilidad y app_puede_diagnostico dependen de metadatos similares. whatsapp-enviar v15 decodifica esos campos para decidir acceso a líneas.

**Impacto.** Un usuario autenticado puede influir en la identidad o privilegios que el servidor le atribuye. Las políticas y funciones que llaman a estos auxiliares heredan el problema. Es un defecto confirmado en código; no se intentó explotarlo en producción.

**Corrección propuesta.** Resolver identidad por auth.uid()/auth.getUser y una vinculación administrada exclusivamente por el servidor. Ya existe auth_actor_bindings con 8 vinculaciones activas y 3 administradores; partes de marketing utilizan esta vía. Centralizar permisos, sucursal y estado activo. Revisar todas las dependencias de los auxiliares antes del despliegue.

**Criterio de cierre.** En pruebas, cambiar user_metadata no altera rol, sucursal ni permisos. Un usuario desactivado y un técnico sin permiso reciben rechazo tanto por API como por SQL/RPC.

### P0 · F02 RLS activado, pero con acceso general a datos sensibles

**Evidencia.** Las 111 tablas inventariadas tienen RLS. Sin embargo, aparecen 71 políticas públicas ALL para authenticated con USING true y WITH CHECK true. Las nueve tablas del módulo financiero están incluidas. También hay políticas amplias sobre clientes, órdenes, usuarios, roles y conversaciones. Se verificaron privilegios de lectura y escritura del rol authenticated.

**Impacto.** Tener sesión puede bastar para leer, insertar, modificar o borrar registros ajenos, aunque el menú oculte acciones. Incluye documentación de clientes, información financiera y campos de desbloqueo de equipos en órdenes.

**Corrección propuesta.** Definir políticas por operación, actor, sucursal y asignación. Reservar las mutaciones financieras a RPC autorizadas y retirar las escrituras directas correspondientes. Revisar usuarios y roles primero para impedir rutas alternativas de escalamiento.

**Criterio de cierre.** Matriz automatizada con dos sucursales y distintos roles: consultas y mutaciones cruzadas deben rechazarse. Probar REST y RPC directamente, no solamente botones.

### P0 · F03 Comandos de equipos sin autorización de negocio en el servidor

**Evidencia.** mdm-accion v37 y abm-accion v14 tienen verify_jwt=true, pero no validan dentro de la función el usuario activo, rol o permiso específico. MDM acepta device_id/serial en modo directo; permite borrar, liberar, bloquear y ubicar. Puede aceptar una sustitución de device_id y persistirla. Existe una búsqueda aproximada por nombre/serial.

**Impacto.** La validación de un JWT no equivale a autorización para administrar dispositivos. Una cuenta sin responsabilidad sobre el financiamiento podría solicitar acciones de alto impacto o dirigirlas al equipo equivocado.

**Corrección propuesta.** Exigir identidad verificada, permiso específico y relación inequívoca contrato-dispositivo. Validar deuda y estado en servidor para los comandos asociados al cobro. Retirar coincidencias aproximadas de rutas que ejecutan acciones. Exigir doble aprobación y motivo para borrado y liberación definitiva.

**Criterio de cierre.** Usuario de otra sucursal rechazado; device_id ajeno rechazado; equipo pagado no recibe un nuevo bloqueo por una lectura antigua. Usar un dispositivo de laboratorio para la prueba integral.

### P0 · F04 Operaciones de InfoPlus sin comprobación del permiso del empleado

**Evidencia.** infoplus-compra-crear v12, infoplus-despacho-crear v20 y rutas revisadas de ajustes/precios transmiten operaciones con credenciales del servidor sin una comprobación equivalente de rol y alcance del solicitante.

**Impacto.** Una credencial de integración con amplios permisos puede ejecutar una petición que el empleado no está autorizado a ordenar.

**Corrección propuesta.** Agregar autorización antes de construir o enviar cada operación; validar modelo, almacén y sucursal en servidor. Separar permisos de compra, despacho, ajuste y precios. Usar claves de idempotencia y bitácora de la operación remota.

**Criterio de cierre.** Solicitudes sin permiso no generan ninguna llamada al proveedor. Repetir una solicitud válida no duplica compra, despacho ni ajuste.

### P1 · F05 Cobros no atómicos y sin idempotencia

**Evidencia.** taller.html, registrarAbonoFin (línea 29924): valida un saldo del navegador, inserta el pago, recarga y actualiza estado en pasos separados. El recibo se obtiene del último elemento recargado. No se encontraron garantías financieras equivalentes mediante triggers ni una clave única de solicitud.

**Impacto.** Dos cajeros pueden pasar la misma validación; un reintento puede duplicar un cobro. Un recibo podría tomar el pago de otro cajero. La mora recibida no queda limitada al saldo de mora pendiente.

**Corrección propuesta.** Una RPC transaccional debe bloquear el contrato, recalcular saldos, validar importes, registrar pago y actualizar estado. Persistir request_key único, actor y caja. Devolver el ID exacto del pago y generar su recibo desde ese ID.

**Criterio de cierre.** Dos cobros simultáneos contra el último saldo no producen sobrepago inadvertido. Repetir request_key devuelve el mismo resultado. Un fallo intermedio no deja medio proceso registrado.

### P1 · F06 Aprobación de solicitudes susceptible a duplicados y referencias inválidas

**Evidencia.** aprobarSolicitud (línea 29709) comprueba el estado local, inserta financiamiento y actualiza la solicitud por separado; no controla adecuadamente el resultado final. Faltan unicidad de solicitud_id y relaciones de fin_cliente_id, plan_id y solicitud_id. El FK cliente_id existente apunta a la tabla clientes, que no sustituye fin_clientes.

**Impacto.** Una doble aprobación o fallo parcial puede crear contratos repetidos o dejar una solicitud pendiente después de crear el contrato. La ausencia de integridad permite referencias sin respaldo.

**Corrección propuesta.** Aprobación transaccional con bloqueo de solicitud, validación del cliente/plan y unicidad. Agregar FKs y reglas de dispositivo activo después de conciliar los datos existentes.

**Criterio de cierre.** Dos aprobaciones concurrentes crean exactamente un financiamiento. Cliente o plan inexistente se rechaza. No hay contrato creado sin la transición correspondiente de solicitud.

### P1 · F07 Anular elimina información financiera

**Evidencia.** anularAbono (línea 31534) elimina el pago. La eliminación del financiamiento, cerca de la línea 31523, puede cascadar a pagos, documentos y recordatorios. auditoria y logs_seguridad tienen 0 filas; no se encontraron triggers de auditoría del financiamiento.

**Impacto.** Se pierde la reconstrucción del historial y la explicación de cambios en caja, deuda o documentos. Una bitácora vacía no demuestra que nunca hayan ocurrido cambios.

**Corrección propuesta.** Usar reversos inmutables vinculados al movimiento original, con motivo, actor, fecha y aprobación. Archivar contratos en vez de borrarlos. Auditar también cambios de condiciones y comandos MDM.

**Criterio de cierre.** El reverso conserva el pago original, deja saldo correcto y permite conciliar caja. Ningún perfil operativo puede borrar el historial financiero.

### P1 · F08 El sistema declara aplicado un bloqueo sin confirmación del equipo

**Evidencia.** mdm-accion actualiza mdm_estado tras una respuesta HTTP exitosa. mdmConfirmarAplicado (línea 32105) interpreta una conexión reciente como confirmación. Prueba local: el dispositivo informa bloqueado=false, pero la interfaz muestra «Bloqueo — APLICADO en el equipo».

**Impacto.** El personal puede creer que un teléfono está bloqueado, liberado o borrado cuando el comando está pendiente o falló. Estar en línea no acredita la ejecución de una orden.

**Corrección propuesta.** Separar estado deseado, envío al proveedor y estado confirmado. Guardar ID de comando y estados solicitado/enviado/pendiente/confirmado/fallido/expirado. Conciliar con el estado o historial oficial del proveedor y evitar órdenes simultáneas incompatibles.

**Criterio de cierre.** Equipo conectado pero sin confirmación permanece pendiente. Un fallo no cambia el estado efectivo. Se identifica y resuelve una orden de bloqueo pendiente cuando el cliente paga.

### P1 · F09 Borrado remoto prueba múltiples endpoints y enrolamiento se valida de forma insuficiente

**Evidencia.** mdm-accion intenta hasta ocho nombres de endpoint de borrado sucesivamente. mdmVerificarEnrolado (línea 32160) puede declarar LISTO para entregar al encontrar el dispositivo, sin comprobar supervisión, política efectiva, salud de APNs/ADE ni condiciones de incorporación.

**Impacto.** La ejecución de borrado no debe servir para descubrir la API. La existencia de un equipo en el inventario tampoco garantiza el control necesario para entregarlo financiado.

**Corrección propuesta.** Usar únicamente el endpoint documentado para el plan y plataforma, probado en laboratorio. Crear una lista de entrega verificable: serial exacto, supervisión, política aplicada, conectividad, certificados y prueba de bloqueo/liberación. Registrar método y fecha de incorporación.

**Criterio de cierre.** Un equipo sin política confirmada no aparece listo. Documentar una prueba de extremo a extremo por plataforma. Para equipos Apple incorporados manualmente, considerar el período provisional de 30 días; no se verificó si aplica a los equipos actuales.

### P1 · F10 Los vencimientos mensuales se desplazan al mes siguiente

**Evidencia.** _finAddPeriodo (línea 28750) usa Date.setMonth sin ajuste de fin de mes. Pruebas: 31/01/2026 + un mes → 03/03/2026; 31/08/2026 → 01/10/2026; 31/01/2028 → 02/03/2028.

**Impacto.** Un cliente puede recibir vencimientos y mora incorrectos, o no tener una cuota en el mes esperado.

**Corrección propuesta.** Definir la convención contractual de fin de mes y generar el calendario en servidor. Adoptar una zona horaria de negocio consistente; evitar mezclar días locales con toISOString UTC. Confirmar si quincenal significa cada 15 días o fechas fijas.

**Criterio de cierre.** Cubrir días 28–31, febrero bisiesto, cambio de año y horario local próximo a medianoche. Las fechas impresas y las usadas para mora coinciden.

### P1 · F11 Puede marcarse saldado con mora pendiente

**Evidencia.** finEstado devuelve saldado cuando finSaldo es cero. Prueba local: saldo ordinario 0, mora pendiente 100, estado saldado. finRecordatoriosHoy omite los contratos saldados.

**Impacto.** El estado de cierre y los recordatorios pueden dejar fuera una obligación pendiente. No se constató esta pérdida en los datos actuales.

**Corrección propuesta.** Definir el cierre sobre todos los conceptos exigibles, incluyendo mora condonada o pagada. Autorizar condonaciones expresamente. Usar la misma liquidación final para carta de saldo, cierre y liberación del equipo.

**Criterio de cierre.** Un contrato con mora pendiente no se cierra salvo condonación registrada. Liquidación, recibo y carta de saldo muestran los mismos conceptos.

### P1 · F12 La tasa y el redondeo necesitan reglas contractuales inequívocas

**Evidencia.** El método plano aplica la tasa por cuota. En el contrato observado: precio 20,000, inicial 6,000, principal 14,000, tasa 10, frecuencia quincenal y 10 cuotas; el cálculo produce 28,000 en cuotas. Esto no equivale a una tasa mensual del 10%. Prueba separada: 1,000/3 genera 333.33 × 3 = 999.99.

**Impacto.** Una etiqueta de tasa ambigua puede producir un cobro distinto del acordado. El redondeo puede declarar saldo cero sin distribuir el total exacto.

**Corrección propuesta.** Documentar período de tasa, método, monto financiado, costo total y regla de mora antes de cambiar fórmulas. Utilizar decimal exacto o centavos y asignar el residuo a la última cuota. No recalcular contratos firmados silenciosamente.

**Criterio de cierre.** La suma de capital e intereses del calendario coincide exactamente con el contrato. Casos aprobados por el negocio cubren cada frecuencia y método. La validación jurídica de condiciones queda fuera de este informe técnico.

### P1 · F13 Recordatorio registrado como enviado al abrir WhatsApp

**Evidencia.** _finEnviarRecordatorio (línea 31662) abre wa.me y registra el recordatorio inmediatamente. No recibe comprobación de envío. No hay cron de financiamiento: los tres trabajos activos son de InfoPlus. fin_recordatorios no tiene registros; bloqueo_auto está desactivado y la gracia configurada es 3 días.

**Impacto.** Se puede registrar una gestión que no se realizó. El módulo financiero no dispone de la automatización que requeriría una cobranza desatendida.

**Corrección propuesta.** Distinguir preparado, abierto, enviado y confirmado. Integrar una cola de notificaciones con el proveedor y registrar resultados. Agregar el programador solamente después de corregir cálculo, permisos e idempotencia. No reutilizar el concepto de envío de campañas como evidencia del flujo financiero.

**Criterio de cierre.** Cerrar WhatsApp sin enviar no marca envío confirmado. Un fallo deja un trabajo reintentable; repetirlo no duplica mensajes. La zona horaria y el consentimiento operativo se aplican de forma consistente.

### P1 · F14 El contrato firmado no queda congelado

**Evidencia.** guardarContratoFin (línea 30958) admite al menos una firma y no comprueba correctamente el resultado de la actualización antes del éxito. _finContratoParrafos (línea 31154) lee el texto vigente de configuración; _finRellenarPlantilla puede usar fecha_hoy al volver a imprimir.

**Impacto.** Una reimpresión puede mostrar condiciones o fecha diferentes de las aceptadas, y la interfaz puede confirmar un guardado fallido.

**Corrección propuesta.** Persistir una instantánea inmutable de texto, términos económicos, calendario, firmantes y fecha del servidor. Guardar versión/hash y el documento final; definir las firmas requeridas y manejar explícitamente cualquier error.

**Criterio de cierre.** Cambiar la configuración no altera contratos anteriores. Un fallo de guardado no muestra éxito. El documento recuperado coincide con la versión firmada.

### P1 · F15 Las conversaciones de distintas líneas pueden mezclarse

**Evidencia.** whatsapp_hilos usa UNIQUE(sucursal_id, telefono_e164). Santiago y Navarrete tienen dos líneas cada una. El webhook v29 busca por sucursal/teléfono y puede actualizar zernio_conversation_id mientras conserva la linea_id original.

**Impacto.** Si el mismo cliente escribe a ambas líneas de una sucursal, el modelo permite mezclar historiales y combinar la línea de envío con una conversación de otra línea. No se ejecutó una prueba enviando mensajes reales.

**Corrección propuesta.** Definir identidad de conversación por línea y proveedor; migrar con conciliación de IDs y mensajes, conservando trazabilidad. No separar historiales automáticamente sin revisar los datos que ya pudieron mezclarse.

**Criterio de cierre.** Un mismo teléfono en dos líneas mantiene conversaciones e IDs de proveedor independientes. Las respuestas salen por la línea correspondiente.

### P1 · F16 El webhook de WhatsApp pierde fiabilidad ante repeticiones y fallos

**Evidencia.** whatsapp-webhook v29 valida HMAC, lo cual es correcto. Sin embargo, incrementa no_leidos_count antes de deduplicar la inserción y usa la hora actual para actividad entrante. El manejador puede responder 200 después de un error de procesamiento. Los estados de mensaje se actualizan sin asegurar progresión; un evento anterior a la inserción no se conserva para aplicar después.

**Impacto.** Eventos repetidos pueden inflar pendientes o renovar actividad; estados fuera de orden pueden retroceder. Un error aceptado como 200 puede no recibir reintento. Esto también afecta cualquier decisión basada en la ventana de conversación.

**Corrección propuesta.** Persistir primero un inbox de eventos con ID único y marca temporal del proveedor validada. Procesar con transacción, reintentos y estados monotónicos. Confirmar recepción después de persistir de forma durable, aunque el procesamiento sea asíncrono.

**Criterio de cierre.** Repetir el mismo evento no cambia contadores; read seguido de delivered no retrocede; un evento previo al mensaje se aplica posteriormente; un fallo temporal se recupera sin pérdida.

### P1 · F17 Envío remoto y registro local pueden divergir

**Evidencia.** whatsapp-enviar puede registrar un error al insertar el mensaje local y aun devolver ok=true después del envío al proveedor.

**Impacto.** El cliente puede recibir el mensaje sin que el equipo tenga historial confiable del envío. Reintentar a ciegas puede duplicarlo.

**Corrección propuesta.** Registrar una intención de envío durable con clave única antes de llamar al proveedor; guardar identificador remoto y conciliar resultados inciertos. Mostrar enviado pendiente de registro cuando corresponda, con recuperación automática.

**Criterio de cierre.** Simular caída de la base después del éxito remoto: el mensaje se concilia y no se vuelve a enviar por error.

### P1 · F18 La contabilidad permite registros parciales y presenta un total engañoso

**Evidencia.** guardarAsiento (línea 9054) obtiene max(numero)+1 en cliente e inserta cabecera y líneas por separado. No se identificó una garantía equivalente de asiento balanceado. renderLibroDiario suma el debe y presenta ese mismo total también en haber.

**Impacto.** La concurrencia puede colisionar numeración; un fallo puede dejar registros incompletos. La presentación puede ocultar un descuadre.

**Corrección propuesta.** Numeración del servidor y publicación transaccional de asientos; validar suma de debe y haber por separado y exigir igualdad. Distinguir borrador/publicado y utilizar reversos después de publicar.

**Criterio de cierre.** Dos publicaciones simultáneas reciben números distintos. Fallo de una línea revierte la publicación. Un asiento desbalanceado no se publica y la interfaz no iguala artificialmente los totales.

### P1 · F19 Archivos privados accesibles a un conjunto demasiado amplio

**Evidencia.** fin-documentos y fin-evidencias son privados, pero las políticas autenticadas por bucket no delimitan contrato o sucursal. whatsapp-media permite lectura amplia a usuarios autenticados y contiene 2,086 objetos. diagnostico-img es público y estaba vacío.

**Impacto.** Privado impide acceso público directo, pero no garantiza confidencialidad entre empleados. Documentos y medios requieren el mismo control que sus registros.

**Corrección propuesta.** Vincular objetos con entidades y permisos reales, restringir lectura/escritura y utilizar URLs firmadas de duración limitada cuando corresponda. Establecer retención, tipos MIME y tamaños según el uso; revisar la necesidad de imágenes de diagnóstico públicas.

**Criterio de cierre.** Un usuario sin acceso al contrato o conversación no puede obtener su archivo ni reemplazarlo. Catálogo público sigue funcionando sin ampliar acceso a documentos.

### P2 · F20 Los saldos dependen de cargar tablas completas en el navegador

**Evidencia.** cargarFinanciamientos (línea 28836) realiza select(*) sin paginación para contratos y pagos. Los pagos se ordenan ascendentemente y se agregan en cliente. La publicación Realtime observada incluye orden_notas, whatsapp_hilos, whatsapp_mensajes y leads, no financiamiento.

**Impacto.** Si la API limita el resultado, el saldo calculado puede omitir pagos recientes. No se verificó el límite configurado del proyecto. Los cambios de otro cajero tampoco están garantizados por la carga local.

**Corrección propuesta.** Obtener saldos y estados autoritativos del servidor; paginar historiales y detectar errores de carga. Después de una mutación, utilizar su resultado confirmado. Realtime es opcional para refresco, nunca sustituto de la transacción.

**Criterio de cierre.** Con un historial que exceda el límite configurado de la API, saldo y estado siguen siendo exactos. Dos sesiones ven el resultado confirmado de un cobro.

### P2 · F21 Colisiones de funciones globales y estructura difícil de mantener

**Evidencia.** taller.html tiene 34,760 líneas y 2,504,894 bytes. verHistorialEquipo se define cerca de 18734 para refurb y nuevamente en 27267 para recepción, reemplazando la función anterior. _despachoCargarHistorial también tiene dos definiciones (20148 y 20193). Los dos bloques JavaScript pasan el análisis de sintaxis.

**Impacto.** Una pantalla puede ejecutar la función de otro módulo. La sintaxis válida no detecta este comportamiento. El tamaño y el espacio global compartido elevan el costo de cada cambio.

**Corrección propuesta.** Corregir primero los nombres y referencias afectadas. Separar gradualmente módulos de dominio con imports y contratos explícitos; evitar una reescritura completa antes de corregir riesgos. Agregar detección de globals duplicados.

**Criterio de cierre.** Historial de refurb y de recepción abren sus datos correctos. El análisis estático rechaza redefiniciones no intencionales.

### P2 · F22 El despliegue no es completamente reproducible con lo versionado

**Evidencia.** Se observaron 137 registros de migración aplicados y 17 archivos SQL de migración en el repositorio, sin un baseline completo equivalente. Faltan en el árbol versiones desplegadas de funciones como MDM/ABM. Los workflows encontrados se orientan a BDE/Instagram, sin una batería general de regresión. La API de rulesets devolvió []; no se verificó la protección clásica de ramas.

**Impacto.** Restaurar o promover cambios puede depender de conocimiento manual y dejar entornos diferentes. La diferencia de conteos no demuestra que existan migraciones pendientes.

**Corrección propuesta.** Versionar el estado efectivo de funciones, esquema, permisos, extensiones y cron; construir un baseline revisado. Establecer staging, revisión de cambios y una CI focalizada en permisos, dinero e integraciones. Verificar aparte la protección de ramas.

**Criterio de cierre.** Crear un entorno de prueba desde el repositorio y migraciones produce el esquema y funciones esperados. Se ejecutan regresiones antes de promover a producción.

### P2 · F23 Dependencias del navegador sin versión exacta

**Evidencia.** La aplicación carga @supabase/supabase-js@2 desde CDN, cerca de la línea 1510, sin fijar una versión exacta; los scripts revisados no incorporan SRI.

**Impacto.** Una actualización externa dentro de la versión mayor puede cambiar el comportamiento sin un cambio revisado del repositorio.

**Corrección propuesta.** Gestionar dependencias con versiones exactas y lockfile, construir un artefacto verificable y definir una política de actualización. Si se mantiene CDN, fijar versiones e integridad cuando sea compatible.

**Criterio de cierre.** El mismo commit construye con las mismas dependencias. Una actualización pasa las regresiones de sesión y operaciones críticas.

### P2 · F24 Observabilidad y recuperación necesitan evidencia operativa

**Evidencia.** En la ventana revisada de 7 días hubo 3 fallos entre 338 sincronizaciones de inventario y 0 entre 168 de ventas. Cron registra éxitos, pero eso no acredita por sí solo el resultado HTTP remoto. Las tablas generales de auditoría están vacías. No se verificó una restauración ni la vigencia de certificados MDM.

**Impacto.** Un trabajo puede parecer sano mientras el proveedor falla; sin alertas ni una restauración ensayada es difícil conocer el tiempo real de recuperación.

**Corrección propuesta.** Alertas por fallo y por ausencia de ejecuciones, correlación de IDs, métricas de cola y conciliación. Definir RPO/RTO con el negocio, comprobar la política de copias y ensayar una restauración aislada. Inventariar vencimientos APNs/ADE y responsables.

**Criterio de cierre.** Un fallo simulado genera alerta accionable. Una restauración ensayada recupera contratos, pagos, archivos y configuración dentro de objetivos documentados.

### P2 · F25 Un grupo de incentivos requiere conciliación

**Evidencia.** La consulta encontró un grupo candidato a duplicado por técnico, ticket y tipo, excluyendo manuales. No hay unicidad compuesta equivalente; el resultado no demuestra por sí solo un pago indebido.

**Impacto.** Puede tratarse de duplicación o de varios servicios legítimos. El modelo necesita una identidad económica que distinga ambos casos.

**Corrección propuesta.** Revisar el origen del grupo con el encargado, sin borrar registros. Definir la clave por servicio/evento que origina el incentivo y protegerla con unicidad/idempotencia.

**Criterio de cierre.** Reprocesar el mismo servicio no genera otro incentivo; servicios distintos del mismo ticket se conservan correctamente.

### P2 · F26 Avisos de Supabase necesitan tratamiento selectivo

**Evidencia.** Advisors: 24 avisos de funciones SECURITY DEFINER ejecutables por authenticated y 3 por anon; tres tablas sin políticas, pg_trgm en public, 56 avisos de FK sin índice, 43 de índices sin uso y 2 de políticas permisivas múltiples.

**Impacto.** Las funciones privilegiadas requieren revisión de permisos y search_path. Los avisos de rendimiento no justifican cambios masivos: muchas tablas son pequeñas y algunas sin políticas son deliberadamente de servicio.

**Corrección propuesta.** Priorizar las funciones vulnerables de F01 y app_sync_acceso, que modifica auth.users/auth.identities directamente. Migrar gestión de cuentas a la API administrativa con autorización confiable. Evaluar índices con consultas y carga reales. Mantener cerrado lo que deba ser service-only.

**Criterio de cierre.** Cada función privilegiada tiene autorización comprobada y permisos mínimos. Los índices se justifican por planes de consulta. No se abre acceso general para silenciar avisos.

## 4. Pruebas realizadas y pendientes

- Prueba local ejecutada — Resultado
- Sintaxis de los dos bloques JavaScript — Sin errores de análisis sintáctico.
- Detección de declaraciones globales duplicadas — verHistorialEquipo y _despachoCargarHistorial repetidas.
- Mensual: 31/01/2026 + 1 período — 03/03/2026: fallo de calendario.
- Mensual: 31/08/2026 + 1 período — 01/10/2026: fallo de calendario.
- Mensual bisiesto: 31/01/2028 + 1 período — 02/03/2028: fallo de calendario.
- Capital 1,000 en tres cuotas sin interés — Total 999.99, aunque el calendario termina en saldo 0.
- Saldo ordinario 0 y mora pendiente 100 — Estado saldado: clasificación incompleta.
- Equipo conectado con bloqueado=false — Interfaz muestra bloqueo APLICADO: falso positivo reproducido.

Las consultas de integridad fueron de solo lectura. Las pruebas de fechas, redondeo, mora y MDM usaron datos sintéticos y dependencias simuladas. No se reprodujeron en vivo escalamiento de privilegios, cobros simultáneos, envíos duplicados, borrado ni pérdida de datos.

La aceptación pendiente debe incluir: recorrido completo recepción → diagnóstico → reparación → entrega; compra → inventario → despacho; solicitud → aprobación → firma → entrega → cuotas → mora → reverso → liquidación → liberación; apertura/cierre de caja y conciliación; y conversación entrante → asignación → respuesta → entrega/lectura. En cada recorrido deben probarse permiso denegado, corte de red, reintento, doble clic y dos operadores simultáneos.

## 5. Plan de corrección por puertas de aprobación

El objetivo es reparar controles y conservar el funcionamiento útil. No hace falta iniciar con una reescritura completa. Las fases siguientes son una propuesta; no se ejecutaron cambios en esta auditoría.

- Fase — Trabajo concreto — Condición para avanzar
- A · Contención y autorización — Cerrar F01–F04. Inventariar las rutas dependientes de app_is_admin; permisos por actor/sucursal; bloquear acceso operativo a borrado/liberación sin aprobación; preparar staging y respaldo verificable. — Pruebas negativas con usuarios de distintos roles y sucursales pasan en SQL, REST y Edge Functions. Acciones prohibidas no alcanzan al proveedor.
- B · Dinero y contratos — RPC transaccionales de cobro/aprobación/asientos; idempotencia; reversos; FKs/unicidad; calendario, redondeo, mora y contrato congelado. — Los casos financieros concilian exactamente; concurrencia y fallos parciales no duplican ni pierden movimientos. Contratos existentes conservan sus condiciones.
- C · Integraciones y equipos — Estados confirmados de MDM; identidad exacta del equipo; inbox/outbox; aislamiento de líneas; alertas y recordatorios verificables. — Laboratorio confirma bloqueo y liberación real, equipo desconectado y pago con comando pendiente. Webhooks repetidos y fuera de orden son seguros.
- D · Entrega sostenible — Baseline y funciones versionadas; CI; corrección de globals; módulos graduales; dependencias fijas; restauración y manuales por rol. — Un entorno se reconstruye desde Git; restauración y recorridos completos pasan. Responsables conocen incidentes, conciliación y reversos.

## 6. Matriz mínima de responsabilidad propuesta

Debe validarse con los puestos reales del taller antes de implementarla. Todos los permisos se aplican en servidor, con sucursal y alcance explícitos.

- Perfil — Permisos propuestos — Control adicional
- Recepción — Registrar cliente y orden; consultar trabajos autorizados. — Sin modificación de permisos ni acceso global a finanzas.
- Técnico — Diagnóstico y reparación de órdenes asignadas. — Sin cobros, anulaciones, borrado de equipos ni gestión de cuentas.
- Caja — Cobros y recibos de su caja/sucursal. — Sin eliminación de pagos; reversos según aprobación y motivo.
- Financiamiento — Solicitudes, contratos y seguimiento de cartera autorizada. — Condonación, cierre y acciones de equipo con permisos separados.
- Supervisor — Aprobar excepciones y reversos dentro de su alcance. — Motivo obligatorio; segregación para acciones irreversibles.
- Administrador — Gestión de accesos y configuración autorizada. — MFA, auditoría y mínima exposición de privilegios de infraestructura.
- Servicio automatizado — Solo tareas específicas de sincronización y notificación. — Credenciales de servidor; idempotencia; trazabilidad y alertas.

## 7. Definición de operación profesional para este sistema

- Cada operación identifica al actor real y rechaza acciones fuera de su permiso, incluso por API.
- Dinero, contratos y equipos tienen una fuente de verdad en el servidor; los reintentos son seguros.
- Un cobro, anulación o cambio contractual puede reconstruirse sin depender de la memoria del empleado.
- La interfaz distingue pedido, enviado y confirmado; nunca presenta una suposición como ejecución efectiva.
- La caja, cartera, inventario y contabilidad se concilian con excepciones visibles y responsables definidos.
- Los fallos generan alertas útiles; una copia de seguridad ha sido restaurada de prueba.
- Los cambios se revisan y prueban en un entorno aislado antes de producción.

## 8. Evidencia y referencias

Las observaciones del sistema proceden del repositorio y las consultas autenticadas de solo lectura. No se publican credenciales, identificadores de clientes ni contenido de conversaciones.

- [Código de taller.html en GitHub (rama main)](https://github.com/sterlinr08-dte/bayolcell-taller/blob/main/taller.html). El enlace apunta a main y puede cambiar. Las referencias a funciones y líneas corresponden a la instantánea identificada por el árbol y blob indicados en el alcance.

- Supabase: definiciones efectivas de políticas, grants, auxiliares de autorización, restricciones, cron y 54 funciones Edge. Versiones clave: mdm-accion 37, abm-accion 14, whatsapp-webhook 29, whatsapp-enviar 15, infoplus-compra-crear 12 e infoplus-despacho-crear 20.

- [Supabase · Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security): los metadatos que el usuario puede actualizar no deben respaldar autorización.

- [Supabase · Autenticación de Edge Functions](https://supabase.com/docs/guides/functions/auth): distinguir verificación del token y autorización de la operación.

- [Apple · Incorporación manual de dispositivos](https://support.apple.com/en-sa/guide/business/axm200a54d59/web): período provisional de 30 días para dispositivos agregados manualmente; verificar aplicabilidad por equipo.

- [Hexnode · Detalles del dispositivo](https://www.hexnode.com/mobile-device-management/developers/devices/retrieve-device-details/) y [soporte oficial sobre confirmación de Lost Mode](https://www.hexnode.com/forums/topic/lost-mode-disable-command-not-responding-though-ios-device-is-online/): actividad reciente y ejecución de un comando requieren comprobaciones distintas.

- [Supabase · SECURITY DEFINER ejecutable](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable) y [FK sin índices](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys): evaluar cada aviso según exposición y carga real.

Informe técnico de revisión · 12/09/2026 · Estado observado durante la auditoría. Los hallazgos confirmados en código se distinguen de escenarios pendientes de validación. Entregable de auditoría; no constituye certificación de seguridad ni evidencia de correcciones desplegadas.
