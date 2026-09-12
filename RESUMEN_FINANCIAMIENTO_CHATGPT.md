# Contexto: Sistema de Financiamiento de Celulares — BAYOL CELL (Rep. Dominicana)

**Qué es el negocio:** Tienda/taller de reparación y venta de celulares (iPhone y Android) en Santiago y Moca, RD. Recientemente empezamos a financiar celulares a crédito (venta a cuotas) y necesitamos poder bloquear remotamente el equipo si el cliente no paga.

**Stack técnico:**
- Frontend: un solo archivo HTML gigante (`taller.html`, ~20,000 líneas) con JavaScript vanilla (sin framework, sin build). Es la app interna del taller (inventario, reparaciones, financiamiento, nómina, contabilidad, etc.)
- Backend: Supabase (Postgres + Edge Functions en Deno + Auth)
- Hosting: GitHub Pages sobre dominio propio
- MDM elegido: **Hexnode UEM** (plan PRO anual ya pagado)

**Lo que ya está construido y funcionando en el módulo de Financiamiento:**
1. **Integración con Hexnode** (Edge Function `mdm-accion`): bloquear equipo (Lost Mode con mensaje personalizado), desbloquear, ubicar, enviar mensaje, verificar enrolamiento, liberar (disenroll). Usa API key simple de Hexnode.
2. **Apple Business Manager (ABM) conectado a Hexnode** vía Automated Device Enrollment (ADE/DEP) — los iPhone financiados quedan supervisados automáticamente al encenderlos, sin tocar nada manual.
3. **Integración con la API oficial de Apple Business Manager** (Edge Function `abm-accion`): autenticación OAuth2 con JWT firmado ES256, permite listar dispositivos de la organización, buscar por serial, asignar equipos al servidor MDM Hexnode, y consultar auditoría de eventos.
4. **Verificación de IMEI antes de crear una solicitud de financiamiento:** botón que revisa si el equipo está enrolado en Hexnode y si ya está asignado a otro cliente (evita financiar el mismo teléfono dos veces).
5. **Alertas de seguridad/fraude:** cruza los eventos de auditoría de Apple Business Manager (equipo borrado, desasignado del MDM, sacado de la organización) contra los financiamientos activos, para detectar si un cliente intentó escapar del control remoto.
6. **Recordatorios automáticos de pago** por WhatsApp (cola diaria de cuotas por vencer/vencidas).
7. **Cola de "listos para bloquear"** — equipos atrasados que pasaron los días de gracia configurados, con bloqueo manual (no automático todavía) desde el panel.
8. **Bloqueo de Activación (Activation Lock) por dispositivo** configurado como "Device-based" en el perfil de Hexnode — para poder liberar el iPhone de un cliente que no pagó, sin necesitar la clave de iCloud de él.

**Decisión tomada:** evaluamos alternativas (ManageEngine Mobile Device Manager Plus, NuovoPay, Datacultr, Trustonic, Upya, PayJoy) y decidimos **quedarnos con Hexnode** porque ya está pagado, integrado, y funcionando — ninguna alternativa ofrecía ventajas suficientes para justificar migrar.

**Pendientes/dudas abiertas:**
- Confirmar si la pantalla de bloqueo del iPhone (antes de desbloquear) muestra algún aviso de supervisión de forma persistente cuando el cliente está al día (no debería, solo debería aparecer un mensaje personalizado cuando el equipo está en Modo Perdido por impago) — en revisión.
- La acción de "borrar/wipe" en la API de Hexnode quedó descontinuada por ellos (endpoint viejo dado de baja); pendiente encontrar el endpoint nuevo o usar la interfaz web mientras tanto.
- Bloqueo automático (sin intervención manual) vía cron está pensado pero no implementado (Fase 2).
- Se guardaron credenciales de ManageEngine como respaldo (API confirmada funcionando) por si algún día se necesita.

**Lo que busco:** ideas para mejorar la arquitectura, la sincronización en tiempo real entre Hexnode/Apple Business Manager y el sistema, y mantener todo bien organizado como lo haría un buen programador senior.
